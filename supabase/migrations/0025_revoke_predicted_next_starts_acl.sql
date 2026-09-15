-- Migration 0025: F01 — predicted_next_starts ACL
-- =============================================================================
-- public.predicted_next_starts() is SECURITY DEFINER and scans every couple's
-- cycle history. PostgreSQL grants EXECUTE to PUBLIC by default, so anon /
-- authenticated clients could call it via PostgREST and read predicted period
-- dates for the whole project.
--
-- The only legitimate caller is the pg_cron job
-- public.schedule_period_reminders() (which is already revoked from
-- public/anon/authenticated in 0013/0014). That job runs as the database
-- owner / cron role and does not need authenticated EXECUTE.
--
-- Grant EXECUTE only to service_role (and the owner/postgres, implicit).
-- Same pattern applied to schedule_period_reminders() for consistency.
--
-- Apply AFTER 0013 + 0014. Do not rewrite those migrations.
-- =============================================================================

revoke all on function public.predicted_next_starts() from public;
revoke all on function public.predicted_next_starts() from anon;
revoke all on function public.predicted_next_starts() from authenticated;

revoke all on function public.schedule_period_reminders() from public;
revoke all on function public.schedule_period_reminders() from anon;
revoke all on function public.schedule_period_reminders() from authenticated;

grant execute on function public.predicted_next_starts() to service_role;
grant execute on function public.schedule_period_reminders() to service_role;

-- =============================================================================
-- Verify (run in SQL editor as postgres / dashboard):
--
--   select
--     p.proname,
--     r.rolname as grantee,
--     has_function_privilege(r.rolname, p.oid, 'execute') as can_execute
--   from pg_proc p
--   join pg_namespace n on n.oid = p.pronamespace
--   cross join (values
--     ('anon'),
--     ('authenticated'),
--     ('public'),
--     ('service_role')
--   ) as r(rolname)
--   where n.nspname = 'public'
--     and p.proname in ('predicted_next_starts', 'schedule_period_reminders');
--
-- Expected:
--   anon / authenticated / public → can_execute = false
--   service_role                   → can_execute = true
--
--   select has_function_privilege('anon', 'public.predicted_next_starts()', 'execute');
--   -- false
--   select has_function_privilege('authenticated', 'public.predicted_next_starts()', 'execute');
--   -- false
--   select has_function_privilege('service_role', 'public.predicted_next_starts()', 'execute');
--   -- true
-- =============================================================================
