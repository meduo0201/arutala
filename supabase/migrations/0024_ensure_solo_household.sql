-- Migration 0024: solo household + Chinese RPC errors
-- =============================================================================
-- Cycle / daily-log rows are scoped by couple_id + current_couple_id().
-- Solo users (is_solo=true, no partner) previously had no active couple, so
-- "start period" and daily logging threw client errors.
--
-- ensure_solo_household() creates or returns an active household (couple with
-- user_b_id null). Invitation / accept / cancel / unlink are updated so a
-- solo household can later gain a partner without losing tracking data.
-- All user-facing RAISE messages are Simplified Chinese.
-- =============================================================================

create or replace function public.ensure_solo_household()
returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_couple_id uuid;
begin
  if v_user_id is null then
    raise exception '请先登录。';
  end if;

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

  -- Invitation-in-progress: activate so tracking works while waiting.
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

revoke execute on function public.ensure_solo_household() from public, anon;
grant execute on function public.ensure_solo_household() to authenticated;

-- Signup also provisions a household so the first home load is a read.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  insert into public.profiles (id, display_name, role, is_solo)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'display_name',
      new.raw_user_meta_data->>'username',
      split_part(new.email, '@', 1),
      '用户'
    ),
    'tracker',
    true
  )
  on conflict (id) do nothing;

  insert into public.couples (user_a_id, status, activated_at)
  values (new.id, 'active', now());

  return new;
end;
$function$;

create or replace function public.create_invitation()
returns text
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_couple_id uuid;
  v_code text;
begin
  if v_user_id is null then
    raise exception '请先登录。';
  end if;

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

create or replace function public.cancel_invitation()
returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception '请先登录。';
  end if;

  -- Keep the solo household; only drop unused invitation codes.
  delete from public.invitations
  where inviter_id = v_user_id
    and accepted_at is null;

  delete from public.couples c
  where c.user_a_id = v_user_id
    and c.status = 'pending'
    and c.user_b_id is null
    and not exists (
      select 1 from public.invitations i where i.couple_id = c.id
    )
    and not exists (
      select 1 from public.cycles cy where cy.couple_id = c.id
    );
end;
$function$;

create or replace function public.accept_invitation(p_code text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_invitation public.invitations%rowtype;
  v_user_id uuid := auth.uid();
  v_solo_id uuid;
begin
  if v_user_id is null then
    raise exception '请先登录。';
  end if;

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
    update public.cycles
    set couple_id = v_invitation.couple_id
    where couple_id = v_solo_id;

    update public.daily_logs d
    set couple_id = v_invitation.couple_id
    where d.couple_id = v_solo_id
      and not exists (
        select 1
        from public.daily_logs x
        where x.couple_id = v_invitation.couple_id
          and x.log_date = d.log_date
          and x.deleted_at is null
      );

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

create or replace function public.unlink_couple()
returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_couple_id uuid;
  v_partner_id uuid;
begin
  if v_user_id is null then
    raise exception '请先登录。';
  end if;

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

  update public.profiles
  set is_solo = true
  where id in (v_user_id, v_partner_id);

  insert into public.couples (user_a_id, status, activated_at)
  values (v_user_id, 'active', now());
end;
$function$;
