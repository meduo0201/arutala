-- Migration 0013: pg_cron + period reminder via Edge Function (Phase 4 Track C5)
-- =============================================================================
-- Schedule: daily 01:00 UTC = 08:00 WIB. Find users where predicted next
-- period_start equals tomorrow → call Edge Function send-push.
--
-- Privacy (audit I-04): payload generic — "Haid berikutnya besok ya~ 💚".
-- Tidak include nama / data spesifik di body.
--
-- Dependencies:
--   - extension `pg_cron` (Supabase: enable di dashboard Database → Extensions)
--   - extension `pg_net` (Supabase: enable). Used untuk async HTTP from cron.
--   - Edge Function `send-push` deployed (manual: `supabase functions deploy`)
--   - Secrets set: PUSH_VAPID_PRIVATE_KEY, etc.
--
-- Per BLUEPRINT prediction formula: rolling avg 6 cycle. Find user pairs
-- where last cycle.start_date + round(avg) = tomorrow.
-- =============================================================================

-- Enable extensions kalau belum (idempotent — Supabase normally enabled)
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- =============================================================================
-- Helper: compute predicted next start untuk all couples
-- =============================================================================

create or replace function public.predicted_next_starts()
returns table (couple_id uuid, predicted_start date)
language sql
stable
security definer
set search_path = ''
as $function$
  with cycle_lengths as (
    select c.couple_id,
           c.start_date,
           lag(c.start_date) over (partition by c.couple_id order by c.start_date) as prev_start
    from public.cycles c
    where c.deleted_at is null
  ),
  averaged as (
    select couple_id,
           round(avg((start_date - prev_start)))::int as avg_len,
           max(start_date) as last_start
    from cycle_lengths
    where prev_start is not null
      and (start_date - prev_start) between 14 and 90
    group by couple_id
    having count(*) >= 2 -- minimum 2 cycle pairs untuk average reliable
  )
  select couple_id, (last_start + avg_len)::date as predicted_start
  from averaged;
$function$;

-- =============================================================================
-- Trigger function: schedule_period_reminders
-- Find couples where predicted_start = tomorrow + send push to both partners.
-- Called via pg_cron daily.
-- =============================================================================

create or replace function public.schedule_period_reminders()
returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_couple record;
  v_func_url text;
  v_service_key text;
  v_payload jsonb;
begin
  -- Edge Function URL — assumes Supabase project default URL pattern.
  -- For production with custom domain, override via DB settings.
  v_func_url := current_setting('app.send_push_url', true);
  v_service_key := current_setting('app.service_role_key', true);

  if v_func_url is null or v_service_key is null then
    raise notice 'app.send_push_url or app.service_role_key not set — set via:';
    raise notice '  alter database postgres set app.send_push_url = ''https://<ref>.supabase.co/functions/v1/send-push'';';
    raise notice '  alter database postgres set app.service_role_key = ''<service_role_jwt>'';';
    return;
  end if;

  for v_couple in
    select couple_id from public.predicted_next_starts()
    where predicted_start = current_date + interval '1 day'
  loop
    v_payload := jsonb_build_object(
      'couple_id', v_couple.couple_id,
      'title', 'Arutala 💚',
      'body', 'Haid berikutnya besok ya~ Siapin pads/cup-mu',
      'url', '/',
      'tag', 'period-reminder'
    );

    -- Async HTTP POST via pg_net
    perform net.http_post(
      url := v_func_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || v_service_key
      ),
      body := v_payload
    );
  end loop;
end;
$function$;

revoke execute on function public.schedule_period_reminders() from public, anon, authenticated;
-- service_role + postgres only

-- =============================================================================
-- pg_cron schedule: daily 01:00 UTC (08:00 WIB)
-- =============================================================================

-- Remove previous schedule kalau ada (idempotent)
do $$
begin
  if exists (select 1 from cron.job where jobname = 'arutala-period-reminders') then
    perform cron.unschedule('arutala-period-reminders');
  end if;
end $$;

-- Schedule: every day at 01:00 UTC (08:00 WIB)
select cron.schedule(
  'arutala-period-reminders',
  '0 1 * * *',
  $$select public.schedule_period_reminders();$$
);
