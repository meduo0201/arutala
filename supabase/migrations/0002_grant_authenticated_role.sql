-- Migration 0002: GRANT table + function privileges to `authenticated` role
-- =============================================================================
-- Project di-create dengan "Automatically expose new tables and functions" OFF
-- (security best practice: control exposure manually). Konsekuensinya: tables
-- gak auto-GRANT ke `authenticated` role, jadi PostgREST 403 sebelum RLS sempet
-- jalan (error code 42501: "permission denied for table").
--
-- Migration ini eksplisit GRANT SELECT/INSERT/UPDATE/DELETE per design intent—
-- RLS policies tetep gate per-row, GRANT cuma membuka role-level access.
--
-- Apply via Supabase Management API. Idempotent (GRANT no-op kalau udah ada).
-- =============================================================================

-- Schema usage
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Profiles: read own + partner (RLS), update own (RLS)
GRANT SELECT, UPDATE ON public.profiles TO authenticated;

-- Couples: read members, update active couple (RLS).
-- INSERT/DELETE only via SECURITY DEFINER RPCs (`create_invitation`, `cancel_invitation`).
GRANT SELECT, UPDATE ON public.couples TO authenticated;

-- Invitations: read own only (RLS).
-- Mutations only via SECURITY DEFINER RPCs.
GRANT SELECT ON public.invitations TO authenticated;

-- Cycles: full CRUD per couple (RLS gate)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cycles TO authenticated;

-- Daily logs: full CRUD per couple (RLS gate)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_logs TO authenticated;

-- Catalogs: read-only untuk semua authenticated user
GRANT SELECT ON public.symptom_catalog TO authenticated;
GRANT SELECT ON public.mood_catalog TO authenticated;

-- Functions: EXECUTE permission untuk RPC calls dari client
GRANT EXECUTE ON FUNCTION public.create_invitation() TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_invitation(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_invitation() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_couple_id() TO authenticated;
