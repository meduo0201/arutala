-- Migration 0029: F09 / D5 — soft-disable + 30-day purge
-- =============================================================================
-- D5:
--   - Soft-disable first (profiles.deleted_at).
--   - Permanent delete after 30 days (no self-serve restore).
--   - Soft-deleted users cannot use business RPCs or recreate a household.
--   - Partner keeps their own history (do NOT cascade-delete partner rows).
--   - No admin / service_role keys in the client (VITE_*).
--
-- Hard delete of auth.users is done by Edge Function
-- `purge-deleted-accounts` using SUPABASE_SERVICE_ROLE_KEY from function
-- secrets. Cron calls that function; see comments at the bottom.
-- =============================================================================

create or replace function public.prevent_profile_undelete()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if old.deleted_at is not null and new.deleted_at is null then
    if auth.uid() is not null then
      raise exception '账号已注销，无法自助恢复。';
    end if;
  end if;
  return new;
end;
$function$;

drop trigger if exists trg_profiles_no_undelete on public.profiles;
create trigger trg_profiles_no_undelete
  before update on public.profiles
  for each row
  execute function public.prevent_profile_undelete();

create or replace function public.delete_account()
returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_couple_id uuid;
  v_partner_id uuid;
  v_partner_solo uuid;
  v_already timestamptz;
begin
  if v_user_id is null then
    raise exception '请先登录。';
  end if;

  select deleted_at into v_already
  from public.profiles
  where id = v_user_id;

  if v_already is not null then
    raise exception '账号已注销，无法自助恢复。';
  end if;

  select id,
         case when user_a_id = v_user_id then user_b_id else user_a_id end
    into v_couple_id, v_partner_id
  from public.couples
  where (user_a_id = v_user_id or user_b_id = v_user_id)
    and status = 'active'
  limit 1;

  if v_couple_id is not null then
    update public.couples
    set status = 'unlinked'
    where id = v_couple_id;
  end if;

  -- Partner keeps their own history on a fresh solo household (D3 + D5).
  if v_partner_id is not null then
    insert into public.couples (user_a_id, status, activated_at)
    values (v_partner_id, 'active', now())
    returning id into v_partner_solo;
    perform public.rehome_owned_rows(v_partner_id, v_partner_solo);

    update public.profiles
    set is_solo = true
    where id = v_partner_id;
  end if;

  update public.cycles
  set deleted_at = now()
  where created_by = v_user_id
    and deleted_at is null;

  update public.daily_logs
  set deleted_at = now()
  where logged_by = v_user_id
    and deleted_at is null;

  delete from public.invitations
  where inviter_id = v_user_id
     or accepted_by = v_user_id;

  update public.push_subscriptions
  set deleted_at = now()
  where user_id = v_user_id
    and deleted_at is null;

  update public.profiles
  set deleted_at = now(),
      encryption_salt = null,
      encryption_verifier = null,
      is_solo = true,
      updated_at = now()
  where id = v_user_id;
end;
$function$;

revoke all on function public.delete_account() from public, anon;
grant execute on function public.delete_account() to authenticated;

create or replace function public.cancel_invitation()
returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid;
begin
  v_user_id := public.assert_account_active();

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

-- Service-role only: return users ready for hard delete + wipe app rows.
create or replace function public.purge_deleted_accounts(p_older_than interval default interval '30 days')
returns table (user_id uuid)
language plpgsql
security definer
set search_path = ''
as $function$
begin
  return query
  with doomed as (
    select p.id
    from public.profiles p
    where p.deleted_at is not null
      and p.deleted_at < now() - p_older_than
  ),
  wiped as (
    delete from public.daily_logs d
    using doomed
    where d.logged_by = doomed.id
    returning doomed.id
  ),
  wiped_cycles as (
    delete from public.cycles c
    using doomed
    where c.created_by = doomed.id
    returning doomed.id
  ),
  wiped_invites as (
    delete from public.invitations i
    using doomed
    where i.inviter_id = doomed.id or i.accepted_by = doomed.id
    returning doomed.id
  ),
  wiped_push as (
    delete from public.push_subscriptions s
    using doomed
    where s.user_id = doomed.id
    returning doomed.id
  ),
  wiped_couples as (
    delete from public.couples c
    using doomed
    where c.user_a_id = doomed.id and c.user_b_id is null
    returning doomed.id
  ),
  wiped_profiles as (
    delete from public.profiles p
    using doomed
    where p.id = doomed.id
    returning p.id
  )
  select distinct wiped_profiles.id from wiped_profiles;
end;
$function$;

revoke all on function public.purge_deleted_accounts(interval) from public, anon, authenticated;
grant execute on function public.purge_deleted_accounts(interval) to service_role;

-- =============================================================================
-- Deploy notes (do NOT put service_role in VITE_*):
--
-- 1. supabase functions deploy purge-deleted-accounts
-- 2. supabase secrets set SUPABASE_SERVICE_ROLE_KEY=...   (function env only)
--    optional: PURGE_CRON_SECRET=...
-- 3. pg_cron (SQL editor, once):
--
--   select cron.schedule(
--     'arutala-purge-deleted-accounts',
--     '15 2 * * *',
--     $$
--     select net.http_post(
--       url := 'https://<PROJECT_REF>.supabase.co/functions/v1/purge-deleted-accounts',
--       headers := jsonb_build_object(
--         'Content-Type', 'application/json',
--         'Authorization', 'Bearer ' || (
--           select decrypted_secret from vault.decrypted_secrets
--           where name = 'service_role_key' limit 1
--         )
--       ),
--       body := '{}'::jsonb
--     );
--     $$
--   );
--
-- Verify:
--   select has_function_privilege('authenticated', 'public.purge_deleted_accounts(interval)', 'execute');
--   -- false
--   select has_function_privilege('service_role', 'public.purge_deleted_accounts(interval)', 'execute');
--   -- true
-- =============================================================================
