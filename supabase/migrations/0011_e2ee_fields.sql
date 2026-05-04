-- Migration 0011: E2EE fields (Phase 4 Track B2)
-- =============================================================================
-- Add encryption infrastructure ke profiles + daily_logs:
--
-- profiles.encryption_salt:
--   128-bit (16 byte) random salt per user, generated client-side saat
--   passphrase setup. Stored as base64 text (PostgreSQL text > bytea here
--   karena Supabase JS lebih ergonomis dengan string columns).
--   NULL = E2EE belum di-setup untuk user ini.
--
-- profiles.encryption_verifier:
--   Encrypted sentinel string `arutala-verify:{user_id}`. Saat unlock,
--   client decrypt verifier — kalau success (auth tag valid + plaintext
--   match) berarti passphrase benar. NULL = setup belum.
--
-- daily_logs.sexual_activity_encrypted:
--   Versioned ciphertext 'v1:base64(iv):base64(ct)' per crypto.ts format.
--   Plaintext payload structure (after decrypt):
--     { active: boolean, type: 'protected' | 'unprotected' | null,
--       intensity: 1-3 | null, notes?: string }
--   NULL atau empty string = no entry untuk hari itu.
--
-- Server NEVER sees plaintext, nor passphrase, nor derived key. Server cuma
-- store ciphertext + salt (per Stardust anti-pattern: salt OK store, key NOT).
-- =============================================================================

alter table public.profiles
  add column if not exists encryption_salt text,         -- base64 of 16 bytes
  add column if not exists encryption_verifier text;     -- v1:base64(iv):base64(ct)

alter table public.daily_logs
  add column if not exists sexual_activity_encrypted text;  -- v1:base64(iv):base64(ct)

-- No new RLS policy needed:
--   - profiles RLS sudah scope row by id = auth.uid() (via "Users update own profile")
--   - daily_logs RLS sudah scope by couple_id (existing policies)
-- Both new fields inherit existing protections.

-- Note: kalau Phase 5 mau tambah audit log saat passphrase change, log via
-- consent_log dengan purpose='sensitive_data_e2ee' (already in schema).
