-- Migration 0017: daily_insights schema + RPC (Phase 5 J6)
-- =============================================================================
-- Catalog of 365+ daily content entries shown di Home tab. Deterministic per
-- (user_id, log_date, phase) — same user same day same phase = same insight.
-- Different days → different insight. Provides "fresh content tiap hari" UX.
--
-- Schema:
--   id           uuid PK
--   phase        period | follicular | fertile | ovulation | luteal | any
--                'any' = applicable kapan aja, fallback pool
--   category     fact | tip | support | couple | trivia | lifestyle
--   title_id     short headline (Bahasa Indonesia)
--   body_id      paragraph body (Bahasa Indonesia)
--   emoji        decorative
--   display_order  numeric (lower first when tied — gentle ordering hint)
--
-- RLS: read-only authenticated. No mutations from app.
-- =============================================================================

create table public.daily_insights (
  id uuid primary key default gen_random_uuid(),
  phase text not null check (phase in (
    'any', 'period', 'follicular', 'fertile', 'ovulation', 'luteal'
  )),
  category text not null check (category in (
    'fact', 'tip', 'support', 'couple', 'trivia', 'lifestyle'
  )),
  title_id text not null,
  body_id text not null,
  emoji text,
  display_order int not null default 0,
  created_at timestamptz not null default now()
);

create index idx_daily_insights_phase on public.daily_insights (phase);

alter table public.daily_insights enable row level security;

create policy "Authenticated read insights"
  on public.daily_insights for select
  to authenticated
  using (true);

grant select on public.daily_insights to authenticated, service_role;

-- =============================================================================
-- RPC: get_daily_insight(p_phase, p_log_date)
-- Deterministic pick: hash(user_id + log_date + phase) % count(matching).
-- Falls back ke 'any' phase pool kalau phase-specific kosong.
-- =============================================================================

create or replace function public.get_daily_insight(
  p_phase text,
  p_log_date date default current_date
) returns table (
  id uuid,
  phase text,
  category text,
  title_id text,
  body_id text,
  emoji text
)
language plpgsql
stable
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_seed bigint;
  v_count int;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  -- Hash user + date + phase ke int (deterministic)
  v_seed := abs(hashtextextended(v_user_id::text || p_log_date::text || p_phase, 0));

  -- Try phase-specific pool first
  select count(*) into v_count
  from public.daily_insights di
  where di.phase = p_phase;

  if v_count > 0 then
    return query
    select di.id, di.phase, di.category, di.title_id, di.body_id, di.emoji
    from public.daily_insights di
    where di.phase = p_phase
    order by di.display_order, di.id
    offset (v_seed % v_count)
    limit 1;
    return;
  end if;

  -- Fallback ke 'any' pool
  select count(*) into v_count
  from public.daily_insights di
  where di.phase = 'any';

  if v_count > 0 then
    return query
    select di.id, di.phase, di.category, di.title_id, di.body_id, di.emoji
    from public.daily_insights di
    where di.phase = 'any'
    order by di.display_order, di.id
    offset (v_seed % v_count)
    limit 1;
    return;
  end if;

  -- No data
  return;
end;
$function$;

revoke execute on function public.get_daily_insight(text, date) from public, anon;
grant execute on function public.get_daily_insight(text, date) to authenticated;
