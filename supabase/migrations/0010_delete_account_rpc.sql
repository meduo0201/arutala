-- Migration 0010: delete_account RPC (Phase 4 Track A4)
-- =============================================================================
-- Per UU PDP Pasal 8 (right to erasure) + Pasal 41 + privacy-notice.md retensi:
-- soft delete 30 hari → hard delete (manual cron / scheduled job).
--
-- Strategy:
--   1. Soft mark profile.deleted_at = now()
--   2. Cascade flag couples (status='unlinked'), cycles + daily_logs (deleted_at).
--   3. Cancel pending invitations.
--   4. Sign out global di app side (caller).
--   5. Hard delete = manual SQL job after 30 days (atau pg_cron Phase 4 polish).
--
-- Note: tidak DELETE auth.users sini — supabase.auth.admin.deleteUser() butuh
-- service_role key yang gak boleh di client. Auth deletion = follow-up manual
-- via dashboard atau Edge Function dengan service key.
-- =============================================================================

-- Add deleted_at to profiles (idempotent)
alter table public.profiles
  add column if not exists deleted_at timestamptz;

create or replace function public.delete_account()
returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_couple_id uuid;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  -- Mark profile soft-deleted
  update public.profiles
  set deleted_at = now(),
      updated_at = now()
  where id = v_user_id;

  -- Find couple, mark unlinked (partner won't see anymore via RLS)
  select id into v_couple_id
  from public.couples
  where (user_a_id = v_user_id or user_b_id = v_user_id)
    and status = 'active';

  if v_couple_id is not null then
    update public.couples
    set status = 'unlinked'
    where id = v_couple_id;
  end if;

  -- Soft-delete cycles + daily_logs di couple ini (kalau partner ada, partner
  -- tetap kehilangan akses karena couples.status='unlinked' filter di RLS).
  if v_couple_id is not null then
    update public.cycles
    set deleted_at = now()
    where couple_id = v_couple_id and deleted_at is null;

    update public.daily_logs
    set deleted_at = now()
    where couple_id = v_couple_id and deleted_at is null;
  end if;

  -- Cancel pending invitations dari user ini
  delete from public.couples
  where user_a_id = v_user_id and status = 'pending';

  -- Note: auth.users record + actual data hard-delete = manual followup
  -- (pg_cron Phase 4 atau admin script).
end;
$function$;

revoke execute on function public.delete_account() from public, anon;
grant execute on function public.delete_account() to authenticated;
