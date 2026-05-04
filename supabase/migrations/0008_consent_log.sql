-- Migration 0008: consent_log table + log_consent RPC (Phase 4 Track A1)
-- =============================================================================
-- Per UU PDP Pasal 24: bukti consent wajib disimpan oleh pengendali. Pasal 22
-- requires explicit per-purpose consent untuk data spesifik. Pasal 23 makes
-- bundled consent batal demi hukum.
--
-- Schema: 1 row per (user, purpose, grant/withdraw event). Latest row per
-- (user_id, purpose) menentukan current consent state.
--
-- Purposes enum (matches consent-wording.md):
--   - 'core_processing'         WAJIB — fungsi inti tracking siklus (Pasal 4-2-a)
--   - 'cross_border_transfer'   WAJIB — server di luar Indonesia (Pasal 56-4)
--   - 'partner_sharing'         OPSIONAL — couple mode shared visibility
--   - 'sensitive_data_e2ee'     OPSIONAL Phase 4 — sexual activity / pregnancy
--                                (gated by E2EE implementation per BLUEPRINT)
--
-- IP hashing (Pasal 16 integritas + privacy by design):
--   ip_hash = SHA-256(client_ip + per-app salt) untuk audit trail tanpa store
--   plaintext IP. Salt di-rotate jika IP linkability concern.
-- =============================================================================

create table public.consent_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  purpose text not null check (purpose in (
    'core_processing',
    'cross_border_transfer',
    'partner_sharing',
    'sensitive_data_e2ee'
  )),
  granted boolean not null,
  version text not null,                -- e.g. 'v1.0' or git commit hash dari privacy-notice.md
  ip_hash text,                         -- SHA-256 dari IP, optional (browser request)
  user_agent_summary text,              -- short summary, e.g. 'Chrome 120 / macOS'
  granted_at timestamptz not null default now(),
  withdrawn_at timestamptz              -- set saat user toggle off, otherwise null
);

create index idx_consent_log_user on public.consent_log (user_id, purpose, granted_at desc);

alter table public.consent_log enable row level security;

create policy "Users see own consent log"
  on public.consent_log for select
  to authenticated
  using (user_id = (select auth.uid()));

-- No INSERT/UPDATE/DELETE policy — mutations only via RPC log_consent.

grant select on public.consent_log to authenticated;

-- =============================================================================
-- RPC: log_consent
-- Insert consent grant atau withdrawal event untuk current authenticated user.
-- Idempotent semantik: setiap call insert row baru — caller responsible for
-- not spamming. UI should compare new state vs latest state before calling.
-- =============================================================================

create or replace function public.log_consent(
  p_purpose text,
  p_granted boolean,
  p_version text default 'v1.0',
  p_user_agent_summary text default null,
  p_ip_hash text default null
) returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_id uuid;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if p_purpose not in ('core_processing', 'cross_border_transfer', 'partner_sharing', 'sensitive_data_e2ee') then
    raise exception 'Invalid purpose: %', p_purpose;
  end if;

  insert into public.consent_log (
    user_id, purpose, granted, version, ip_hash, user_agent_summary,
    -- if granted=false, this is a withdrawal — set withdrawn_at = granted_at
    withdrawn_at
  )
  values (
    v_user_id, p_purpose, p_granted, p_version, p_ip_hash, p_user_agent_summary,
    case when p_granted then null else now() end
  )
  returning id into v_id;

  return v_id;
end;
$function$;

revoke execute on function public.log_consent(text, boolean, text, text, text) from public, anon;
grant execute on function public.log_consent(text, boolean, text, text, text) to authenticated;

-- =============================================================================
-- RPC: current_consent_state
-- Returns map of purpose -> bool indicating latest consent state per user.
-- Used by Settings privacy panel + signup gate to detect missing consents.
-- =============================================================================

create or replace function public.current_consent_state()
returns table (purpose text, granted boolean, version text, last_event_at timestamptz)
language sql
security definer
stable
set search_path = ''
as $function$
  with latest as (
    select distinct on (user_id, purpose)
      user_id, purpose, granted, version, granted_at
    from public.consent_log
    where user_id = (select auth.uid())
    order by user_id, purpose, granted_at desc
  )
  select purpose, granted, version, granted_at as last_event_at
  from latest;
$function$;

revoke execute on function public.current_consent_state() from public, anon;
grant execute on function public.current_consent_state() to authenticated;
