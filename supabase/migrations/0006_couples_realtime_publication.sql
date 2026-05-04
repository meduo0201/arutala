-- Migration 0006: Add couples table to realtime publication
-- =============================================================================
-- SCHEMA.sql awalnya cuma include cycles + daily_logs di supabase_realtime.
-- Couples juga perlu di-publish supaya unlink event bisa propagate ke partner
-- secara realtime (otherwise mereka harus reload manually).
-- =============================================================================

alter publication supabase_realtime add table public.couples;
