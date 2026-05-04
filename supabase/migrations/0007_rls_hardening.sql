-- Migration 0007: RLS hardening (audit findings F-001, F-002, F-003)
-- =============================================================================
-- Audit Day 1 (2026-05-04) flagged 3 best-practice gaps di SECURITY DEFINER
-- functions:
--
-- 1. F-002: Functions tidak punya `set search_path = ''` → theoretical
--    search_path injection (mitigated di managed Supabase tapi violates spec).
--
-- 2. F-003: EXECUTE granted to PUBLIC (which includes `anon` role). Per
--    least-privilege, hanya `authenticated` yang butuh access. Anon role
--    can probe RPC existence dan trigger no-op SECURITY DEFINER calls
--    (auth.uid() returns null inside, so no data risk, tapi cleaner gating).
--
-- 3. F-001 (deferred this migration): Move `current_couple_id()` ke schema
--    `private` requires rewrite of all RLS policies referencing it. Skipped
--    here untuk avoid policy churn — REVOKE PUBLIC achieves same risk
--    reduction. Re-evaluate kalau ada Phase 4 schema redesign.
--
-- Function inventory (7 SECURITY DEFINER functions):
--   - current_couple_id()
--   - create_invitation()
--   - accept_invitation(text)
--   - cancel_invitation()
--   - soft_delete_cycle(uuid)
--   - soft_delete_daily_log(uuid)
--   - unlink_couple()
--
-- Pre-flight check yang sudah dilakukan:
--   - Function bodies use schema-qualified references (public.couples,
--     auth.uid(), public.current_couple_id) → search_path='' aman.
--   - `now()`, `gen_random_uuid()` are in pg_catalog → always resolvable.
--
-- Idempotent: ALTER + REVOKE no-op kalau state sudah benar.
-- =============================================================================

-- 1. SET search_path = '' on SECURITY DEFINER functions
alter function public.current_couple_id() set search_path = '';
alter function public.create_invitation() set search_path = '';
alter function public.accept_invitation(text) set search_path = '';
alter function public.cancel_invitation() set search_path = '';
alter function public.soft_delete_cycle(uuid) set search_path = '';
alter function public.soft_delete_daily_log(uuid) set search_path = '';
alter function public.unlink_couple() set search_path = '';

-- 2. REVOKE EXECUTE from PUBLIC (includes anon)
revoke execute on function public.current_couple_id() from public;
revoke execute on function public.create_invitation() from public;
revoke execute on function public.accept_invitation(text) from public;
revoke execute on function public.cancel_invitation() from public;
revoke execute on function public.soft_delete_cycle(uuid) from public;
revoke execute on function public.soft_delete_daily_log(uuid) from public;
revoke execute on function public.unlink_couple() from public;

-- 3. Confirm authenticated still has EXECUTE (no-op kalau Migration 0002
--    sudah grant; idempotent re-grant aman).
grant execute on function public.current_couple_id() to authenticated;
grant execute on function public.create_invitation() to authenticated;
grant execute on function public.accept_invitation(text) to authenticated;
grant execute on function public.cancel_invitation() to authenticated;
grant execute on function public.soft_delete_cycle(uuid) to authenticated;
grant execute on function public.soft_delete_daily_log(uuid) to authenticated;
grant execute on function public.unlink_couple() to authenticated;

-- Also revoke from anon explicitly (defensive — REVOKE FROM PUBLIC already
-- removes anon since anon inherits from PUBLIC, but being explicit avoids
-- ambiguity in future role configuration).
revoke execute on function public.current_couple_id() from anon;
revoke execute on function public.create_invitation() from anon;
revoke execute on function public.accept_invitation(text) from anon;
revoke execute on function public.cancel_invitation() from anon;
revoke execute on function public.soft_delete_cycle(uuid) from anon;
revoke execute on function public.soft_delete_daily_log(uuid) from anon;
revoke execute on function public.unlink_couple() from anon;
