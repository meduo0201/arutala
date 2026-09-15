-- Migration 0026: F03 — revoke authenticated direct UPDATE on couples
-- =============================================================================
-- SCHEMA.sql / 0002 granted UPDATE on public.couples to authenticated and
-- created RLS policy "Members update own couple". A signed-in member could
-- therefore PATCH relationship fields (user_a_id, user_b_id, status, …)
-- without going through the SECURITY DEFINER RPCs that enforce invitation /
-- unlink invariants.
--
-- Relationship mutations must stay on the existing RPCs:
--   create_invitation()
--   accept_invitation(text)
--   cancel_invitation()
--   unlink_couple()
--   ensure_solo_household()
--   delete_account()  (0010)
--
-- Those functions are SECURITY DEFINER (owner), so they keep writing even
-- after this revoke. Authenticated clients retain SELECT (invitation UI,
-- partner card, realtime).
--
-- Compatibility / deploy order:
--   1. Confirm 0001, 0004, 0010, 0024 are already applied (RPCs exist).
--   2. Apply THIS migration.
--   3. Do not apply this before the RPCs — otherwise invite/cancel/unlink
--      would have no remaining write path for authenticated users.
--   4. Client already uses RPCs only (no .from('couples').update()).
--
-- service_role UPDATE grant from 0015 is unchanged (Edge Function / admin).
-- =============================================================================

drop policy if exists "Members update own couple" on public.couples;

revoke update on table public.couples from authenticated;

-- Re-affirm read path (idempotent).
grant select on table public.couples to authenticated;

-- =============================================================================
-- Verify (SQL editor):
--
--   select has_table_privilege('authenticated', 'public.couples', 'update');
--   -- false
--   select has_table_privilege('authenticated', 'public.couples', 'select');
--   -- true
--
--   select polname, polcmd from pg_policy
--   where polrelid = 'public.couples'::regclass;
--   -- no UPDATE policy for authenticated
--
-- Smoke: as a normal user JWT, invite → accept → cancel / unlink still work
-- via RPCs. Direct:
--   PATCH /rest/v1/couples?id=eq.<id>  { "status": "unlinked" }
-- must return 401/403 / permission denied.
-- =============================================================================
