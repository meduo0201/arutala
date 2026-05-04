-- Migration 0015: GRANT service_role table access (Phase 4 Track C5 fix)
-- =============================================================================
-- Edge Function `send-push` calls PostgREST as service_role JWT (legacy or
-- sb_secret_*). service_role TIDAK bypass GRANT — masih butuh table-level
-- privileges meski bypass RLS policies.
--
-- Migration 0002 hanya grant ke `authenticated`. Tambah service_role grants
-- supaya Edge Function bisa SELECT/UPDATE push_subscriptions + read couples
-- + read profiles.
--
-- Idempotent (GRANT no-op kalau sudah ada).
-- =============================================================================

-- Push subscriptions: full CRUD untuk Edge Function
grant select, insert, update, delete on public.push_subscriptions to service_role;

-- Couples: read untuk resolve user_a_id + user_b_id dari couple_id payload
grant select, update on public.couples to service_role;

-- Profiles: read (future use, mis. partner display_name di notification body)
grant select on public.profiles to service_role;
