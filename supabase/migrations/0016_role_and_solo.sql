-- Migration 0016: profile.role + solo mode (Phase 5 J1)
-- =============================================================================
-- User feedback (2026-05-04): app saat ini paksa user ke couple flow. Padahal:
--   - Bisa cewe (yang ngalami haid) — primary tracker
--   - Bisa cowo / partner — supporter role
--   - Bisa solo (tanpa pasangan)
--
-- Schema:
--   profiles.role:
--     'tracker'   — orang yang ngalami haid, log siklus, lihat prediction
--     'supporter' — pasangan yang bantuin track (read-mostly, mood check-in)
--   profiles.is_solo:
--     true  — tracker tanpa pasangan, skip couple-setup gate
--     false — punya/akan punya pasangan
--
-- Default 'tracker' + is_solo=true (most permissive, doesn't block existing
-- users). Existing rows keep functioning normally; couples that already exist
-- are treated as is_solo=false implicitly via couple existence.
-- =============================================================================

alter table public.profiles
  add column if not exists role text not null default 'tracker'
    check (role in ('tracker', 'supporter')),
  add column if not exists is_solo boolean not null default false;

-- Existing user yang belum pernah link couple = anggap is_solo=true biar
-- gak block onboarding flow (bisa skip /couple-setup).
update public.profiles p
set is_solo = true
where not exists (
  select 1 from public.couples c
  where (c.user_a_id = p.id or c.user_b_id = p.id) and c.status in ('pending', 'active')
);

-- Helper: is_couple_required(user_id) — used by app routing logic.
-- Returns true kalau user role=supporter ATAU role=tracker dengan is_solo=false.
create or replace function public.profile_couple_required()
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select case
    when p.role = 'supporter' then true
    when p.role = 'tracker' and p.is_solo = false then true
    else false
  end
  from public.profiles p
  where p.id = (select auth.uid())
  limit 1;
$function$;

revoke execute on function public.profile_couple_required() from public, anon;
grant execute on function public.profile_couple_required() to authenticated;
