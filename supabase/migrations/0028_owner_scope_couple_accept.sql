-- Migration 0028: D1 / D2 / D3 / D4 / F06 / F07 / F08 / F14
-- =============================================================================
-- D1  One account = one person's cycles (owner = created_by / logged_by).
-- D2  Couple accept: same-day log conflicts REJECT with Chinese error.
--     Never silent-drop or overwrite.
-- D3  After unlink, each person only sees their own history.
-- D4  Intimate ciphertext is owner-only; disable_e2ee() clears only the
--     current user's ciphertext + encryption meta in one transaction.
-- F08 Owner-level partial unique (logged_by, log_date) WHERE deleted_at IS NULL.
-- F14 Partner may read shared household rows while coupled, but cannot mutate
--     another person's cycles / logs / ciphertext.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Active-account guard (also used by F09 / 0029)
-- -----------------------------------------------------------------------------
create or replace function public.assert_account_active()
returns uuid
language plpgsql
stable
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_deleted timestamptz;
begin
  if v_user_id is null then
    raise exception '请先登录。';
  end if;

  select deleted_at into v_deleted
  from public.profiles
  where id = v_user_id;

  if v_deleted is not null then
    raise exception '账号已注销，无法继续使用。';
  end if;

  return v_user_id;
end;
$function$;

revoke all on function public.assert_account_active() from public, anon;
grant execute on function public.assert_account_active() to authenticated;

-- -----------------------------------------------------------------------------
-- F08: owner uniqueness (D1). Couple-day unique from 0027 stays so a linked
-- household still has at most one live log per calendar day.
-- -----------------------------------------------------------------------------
create unique index if not exists daily_logs_owner_date_active_uidx
  on public.daily_logs (logged_by, log_date)
  where deleted_at is null;

-- -----------------------------------------------------------------------------
-- Rehome owned rows onto a household (unlink / accept).
-- -----------------------------------------------------------------------------
create or replace function public.rehome_owned_rows(p_user_id uuid, p_couple_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
begin
  update public.cycles
  set couple_id = p_couple_id
  where created_by = p_user_id
    and deleted_at is null
    and couple_id is distinct from p_couple_id;

  update public.daily_logs
  set couple_id = p_couple_id
  where logged_by = p_user_id
    and deleted_at is null
    and couple_id is distinct from p_couple_id;
end;
$function$;

revoke all on function public.rehome_owned_rows(uuid, uuid) from public, anon, authenticated;
grant execute on function public.rehome_owned_rows(uuid, uuid) to service_role;

-- -----------------------------------------------------------------------------
-- ensure_solo_household: refuse soft-deleted accounts (D5 / F15)
-- -----------------------------------------------------------------------------
create or replace function public.ensure_solo_household()
returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid;
  v_couple_id uuid;
begin
  v_user_id := public.assert_account_active();

  insert into public.profiles (id, display_name, role, is_solo)
  select
    u.id,
    coalesce(
      u.raw_user_meta_data->>'display_name',
      u.raw_user_meta_data->>'username',
      split_part(u.email, '@', 1),
      '用户'
    ),
    'tracker',
    true
  from auth.users u
  where u.id = v_user_id
  on conflict (id) do nothing;

  select id into v_couple_id
  from public.couples
  where (user_a_id = v_user_id or user_b_id = v_user_id)
    and status = 'active'
  order by activated_at desc nulls last, created_at desc
  limit 1;

  if v_couple_id is not null then
    return v_couple_id;
  end if;

  select id into v_couple_id
  from public.couples
  where user_a_id = v_user_id
    and user_b_id is null
    and status = 'pending'
  order by created_at desc
  limit 1;

  if v_couple_id is not null then
    update public.couples
    set status = 'active',
        activated_at = coalesce(activated_at, now())
    where id = v_couple_id;
    return v_couple_id;
  end if;

  insert into public.couples (user_a_id, status, activated_at)
  values (v_user_id, 'active', now())
  returning id into v_couple_id;

  return v_couple_id;
end;
$function$;

-- -----------------------------------------------------------------------------
-- accept_invitation: D2 reject same-day conflicts; never drop rows
-- -----------------------------------------------------------------------------
create or replace function public.accept_invitation(p_code text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_invitation public.invitations%rowtype;
  v_user_id uuid;
  v_solo_id uuid;
  v_conflicts text;
begin
  v_user_id := public.assert_account_active();

  select * into v_invitation
  from public.invitations
  where code = p_code;

  if not found then
    raise exception '邀请码不存在，请检查后重试。';
  end if;

  if v_invitation.accepted_at is not null then
    raise exception '这个邀请码已经用过了。';
  end if;

  if v_invitation.expires_at <= now() then
    raise exception '邀请码已过期，请让对方重新生成。';
  end if;

  if v_invitation.inviter_id = v_user_id then
    raise exception '不能使用自己的邀请码。';
  end if;

  if exists (
    select 1 from public.profiles
    where id = v_invitation.inviter_id and deleted_at is not null
  ) then
    raise exception '对方账号不可用，无法关联。';
  end if;

  if exists (
    select 1 from public.couples
    where (user_a_id = v_user_id or user_b_id = v_user_id)
      and status = 'active'
      and user_b_id is not null
  ) then
    raise exception '你已经关联了伴侣。';
  end if;

  select id into v_solo_id
  from public.couples
  where (user_a_id = v_user_id or user_b_id = v_user_id)
    and status = 'active'
    and user_b_id is null
    and id <> v_invitation.couple_id
  limit 1;

  if v_solo_id is not null then
    select string_agg(d.log_date::text, '、' order by d.log_date)
    into v_conflicts
    from public.daily_logs d
    where d.couple_id = v_solo_id
      and d.deleted_at is null
      and exists (
        select 1
        from public.daily_logs x
        where x.couple_id = v_invitation.couple_id
          and x.log_date = d.log_date
          and x.deleted_at is null
      );

    if v_conflicts is not null then
      raise exception
        '无法关联：双方在同一天都有记录（%）。请先删除冲突日期后再试，系统不会覆盖或丢弃任何记录。',
        v_conflicts;
    end if;

    if exists (
      select 1
      from public.cycles a
      join public.cycles b
        on a.deleted_at is null
       and b.deleted_at is null
       and a.end_date is null
       and b.end_date is null
      where a.couple_id = v_solo_id
        and b.couple_id = v_invitation.couple_id
    ) then
      raise exception '无法关联：双方都有未结束的经期。请先结束或删除后再试，系统不会覆盖任何记录。';
    end if;
  end if;

  update public.couples
  set user_b_id = v_user_id,
      status = 'active',
      activated_at = coalesce(activated_at, now())
  where id = v_invitation.couple_id;

  update public.invitations
  set accepted_at = now(),
      accepted_by = v_user_id
  where code = p_code;

  if v_solo_id is not null then
    -- Move every owned row. The conflict check above guarantees this cannot
    -- unique-violate or silently drop.
    perform public.rehome_owned_rows(v_user_id, v_invitation.couple_id);

    update public.couples
    set status = 'unlinked'
    where id = v_solo_id;
  end if;

  update public.profiles
  set is_solo = false
  where id in (
    select user_a_id from public.couples where id = v_invitation.couple_id
    union
    select user_b_id from public.couples where id = v_invitation.couple_id and user_b_id is not null
  );

  return v_invitation.couple_id;
end;
$function$;

-- -----------------------------------------------------------------------------
-- unlink: D3 split history to each owner's new solo household
-- -----------------------------------------------------------------------------
create or replace function public.unlink_couple()
returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid;
  v_couple_id uuid;
  v_partner_id uuid;
  v_my_solo uuid;
  v_partner_solo uuid;
begin
  v_user_id := public.assert_account_active();

  select id,
         case when user_a_id = v_user_id then user_b_id else user_a_id end
    into v_couple_id, v_partner_id
  from public.couples
  where (user_a_id = v_user_id or user_b_id = v_user_id)
    and status = 'active'
  limit 1;

  if v_couple_id is null or v_partner_id is null then
    raise exception '当前没有可解除的伴侣关联。';
  end if;

  update public.couples
  set status = 'unlinked'
  where id = v_couple_id;

  insert into public.couples (user_a_id, status, activated_at)
  values (v_user_id, 'active', now())
  returning id into v_my_solo;
  perform public.rehome_owned_rows(v_user_id, v_my_solo);

  insert into public.couples (user_a_id, status, activated_at)
  values (v_partner_id, 'active', now())
  returning id into v_partner_solo;
  perform public.rehome_owned_rows(v_partner_id, v_partner_solo);

  update public.profiles
  set is_solo = true
  where id in (v_user_id, v_partner_id);
end;
$function$;

create or replace function public.create_invitation()
returns text
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid;
  v_couple_id uuid;
  v_code text;
begin
  v_user_id := public.assert_account_active();

  if exists (
    select 1 from public.couples
    where (user_a_id = v_user_id or user_b_id = v_user_id)
      and status = 'active'
      and user_b_id is not null
  ) then
    raise exception '已经关联了伴侣，请先解除关联。';
  end if;

  select id into v_couple_id
  from public.couples
  where user_a_id = v_user_id
    and user_b_id is null
    and status in ('pending', 'active')
  order by created_at desc
  limit 1;

  if v_couple_id is null then
    insert into public.couples (user_a_id, status, activated_at)
    values (v_user_id, 'active', now())
    returning id into v_couple_id;
  end if;

  select code into v_code
  from public.invitations
  where couple_id = v_couple_id
    and accepted_at is null
    and expires_at > now()
  limit 1;

  if v_code is not null then
    return v_code;
  end if;

  loop
    v_code := public.generate_invitation_code();
    begin
      insert into public.invitations (code, inviter_id, couple_id)
      values (v_code, v_user_id, v_couple_id);
      exit;
    exception when unique_violation then
      null;
    end;
  end loop;

  return v_code;
end;
$function$;

-- -----------------------------------------------------------------------------
-- upsert_daily_log: owner-only restore/update; ciphertext never written for others
-- -----------------------------------------------------------------------------
create or replace function public.upsert_daily_log(
  p_couple_id uuid,
  p_log_date date,
  p_logged_by uuid,
  p_cycle_id uuid default null,
  p_flow_intensity smallint default null,
  p_symptoms text[] default '{}',
  p_moods text[] default '{}',
  p_notes text default null,
  p_sexual_activity_encrypted text default null,
  p_update_sexual_activity boolean default false
)
returns public.daily_logs
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid;
  v_couple_id uuid;
  v_row public.daily_logs;
  v_existing public.daily_logs;
begin
  v_user_id := public.assert_account_active();

  if v_user_id <> p_logged_by then
    raise exception '只能为自己记录。';
  end if;

  v_couple_id := public.current_couple_id();
  if v_couple_id is null or v_couple_id <> p_couple_id then
    raise exception '还不能记录，请刷新页面后再试。';
  end if;

  select * into v_existing
  from public.daily_logs
  where couple_id = p_couple_id
    and log_date = p_log_date
  order by deleted_at nulls first
  limit 1;

  if found and v_existing.logged_by is distinct from v_user_id then
    raise exception '这一天已有记录，且只能由记录者修改。';
  end if;

  update public.daily_logs
    set
      deleted_at = null,
      cycle_id = p_cycle_id,
      flow_intensity = p_flow_intensity,
      symptoms = coalesce(p_symptoms, '{}'),
      moods = coalesce(p_moods, '{}'),
      notes = p_notes,
      sexual_activity_encrypted = case
        when p_update_sexual_activity
          and logged_by = v_user_id
        then p_sexual_activity_encrypted
        else sexual_activity_encrypted
      end,
      updated_at = now()
    where couple_id = p_couple_id
      and log_date = p_log_date
      and logged_by = v_user_id
  returning * into v_row;

  if found then
    return v_row;
  end if;

  insert into public.daily_logs (
    couple_id,
    log_date,
    logged_by,
    cycle_id,
    flow_intensity,
    symptoms,
    moods,
    notes,
    sexual_activity_encrypted
  ) values (
    p_couple_id,
    p_log_date,
    p_logged_by,
    p_cycle_id,
    p_flow_intensity,
    coalesce(p_symptoms, '{}'),
    coalesce(p_moods, '{}'),
    p_notes,
    case
      when p_update_sexual_activity then p_sexual_activity_encrypted
      else null
    end
  )
  returning * into v_row;

  return v_row;
end;
$function$;

-- -----------------------------------------------------------------------------
-- D4 / F06: disable encryption for the current user only, one transaction
-- -----------------------------------------------------------------------------
create or replace function public.disable_e2ee()
returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid;
begin
  v_user_id := public.assert_account_active();

  update public.profiles
  set encryption_salt = null,
      encryption_verifier = null,
      updated_at = now()
  where id = v_user_id;

  update public.daily_logs
  set sexual_activity_encrypted = null,
      updated_at = now()
  where logged_by = v_user_id
    and sexual_activity_encrypted is not null;
end;
$function$;

revoke all on function public.disable_e2ee() from public, anon;
grant execute on function public.disable_e2ee() to authenticated;

-- -----------------------------------------------------------------------------
-- Soft-delete RPCs: owner only
-- -----------------------------------------------------------------------------
create or replace function public.soft_delete_daily_log(p_log_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid;
  v_owner uuid;
begin
  v_user_id := public.assert_account_active();

  select logged_by into v_owner
  from public.daily_logs
  where id = p_log_id;

  if v_owner is null then
    raise exception '找不到这条记录。';
  end if;

  if v_owner <> v_user_id then
    raise exception '只能删除自己的记录。';
  end if;

  update public.daily_logs set deleted_at = now() where id = p_log_id;
end;
$function$;

create or replace function public.soft_delete_cycle(p_cycle_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid;
  v_owner uuid;
begin
  v_user_id := public.assert_account_active();

  select created_by into v_owner
  from public.cycles
  where id = p_cycle_id;

  if v_owner is null then
    raise exception '找不到这条周期。';
  end if;

  if v_owner <> v_user_id then
    raise exception '只能删除自己的周期。';
  end if;

  update public.cycles set deleted_at = now() where id = p_cycle_id;
end;
$function$;

-- -----------------------------------------------------------------------------
-- RLS: own rows always readable; partner read while coupled; owner-only writes
-- -----------------------------------------------------------------------------
drop policy if exists "Couple members read cycles" on public.cycles;
drop policy if exists "Couple members insert cycles" on public.cycles;
drop policy if exists "Couple members update cycles" on public.cycles;
drop policy if exists "Couple members delete cycles" on public.cycles;

create policy "Owner or active household read cycles" on public.cycles
  for select to authenticated
  using (
    deleted_at is null
    and (
      created_by = (select auth.uid())
      or couple_id = public.current_couple_id()
    )
  );

create policy "Owner insert cycles" on public.cycles
  for insert to authenticated
  with check (
    couple_id = public.current_couple_id()
    and created_by = (select auth.uid())
  );

create policy "Owner update cycles" on public.cycles
  for update to authenticated
  using (created_by = (select auth.uid()) and deleted_at is null)
  with check (created_by = (select auth.uid()));

drop policy if exists "Couple members read logs" on public.daily_logs;
drop policy if exists "Couple members insert logs" on public.daily_logs;
drop policy if exists "Couple members update logs" on public.daily_logs;
drop policy if exists "Couple members delete logs" on public.daily_logs;

create policy "Owner or active household read logs" on public.daily_logs
  for select to authenticated
  using (
    deleted_at is null
    and (
      logged_by = (select auth.uid())
      or couple_id = public.current_couple_id()
    )
  );

create policy "Owner insert logs" on public.daily_logs
  for insert to authenticated
  with check (
    couple_id = public.current_couple_id()
    and logged_by = (select auth.uid())
  );

create policy "Owner update logs" on public.daily_logs
  for update to authenticated
  using (logged_by = (select auth.uid()) and deleted_at is null)
  with check (logged_by = (select auth.uid()));
