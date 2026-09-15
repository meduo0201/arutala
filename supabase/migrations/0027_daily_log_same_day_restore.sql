-- Migration 0027: F10 — same-day re-log after soft-delete
-- =============================================================================
-- daily_logs had UNIQUE(couple_id, log_date) covering ALL rows, including
-- soft-deleted ones. After soft_delete_daily_log(), inserting the same date
-- again failed with unique_violation. Client upsert (onConflict couple_id,
-- log_date) also could not "see" the deleted row (SELECT RLS filters
-- deleted_at IS NULL), so the UI could not recover the day.
--
-- Approach:
--   1. Replace the full unique constraint with a PARTIAL unique index on
--      (couple_id, log_date) WHERE deleted_at IS NULL — at most one live log
--      per day; historical soft-deletes do not block a new/restored row.
--   2. SECURITY DEFINER upsert_daily_log() restores a same-day soft-deleted
--      row (clears deleted_at + updates fields) or inserts if none exists.
--      Client cannot SELECT deleted rows, so restore must happen server-side.
--
-- Apply AFTER 0005 (soft_delete_daily_log). Client switches to this RPC.
-- =============================================================================

alter table public.daily_logs
  drop constraint if exists daily_logs_couple_id_log_date_key;

create unique index if not exists daily_logs_couple_date_active_uidx
  on public.daily_logs (couple_id, log_date)
  where deleted_at is null;

create or replace function public.upsert_daily_log(
  p_couple_id uuid,
  p_log_date date,
  p_logged_by uuid,
  p_cycle_id uuid default null,
  p_flow_intensity smallint default null,
  p_symptoms text[] default '{}',
  p_moods text[] default '{}',
  p_notes text default null,
  p_sexual_activity_encrypted text default null,
  p_update_sexual_activity boolean default false
)
returns public.daily_logs
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_couple_id uuid;
  v_row public.daily_logs;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if v_user_id <> p_logged_by then
    raise exception 'logged_by must be current user';
  end if;

  v_couple_id := public.current_couple_id();
  if v_couple_id is null or v_couple_id <> p_couple_id then
    raise exception 'Log bukan punya couple kamu.';
  end if;

  -- Restore-or-update the same calendar day, including a soft-deleted row.
  update public.daily_logs
    set
      deleted_at = null,
      cycle_id = p_cycle_id,
      flow_intensity = p_flow_intensity,
      symptoms = coalesce(p_symptoms, '{}'),
      moods = coalesce(p_moods, '{}'),
      notes = p_notes,
      logged_by = p_logged_by,
      sexual_activity_encrypted = case
        when p_update_sexual_activity then p_sexual_activity_encrypted
        else sexual_activity_encrypted
      end,
      updated_at = now()
    where couple_id = p_couple_id
      and log_date = p_log_date
  returning * into v_row;

  if found then
    return v_row;
  end if;

  insert into public.daily_logs (
    couple_id,
    log_date,
    logged_by,
    cycle_id,
    flow_intensity,
    symptoms,
    moods,
    notes,
    sexual_activity_encrypted
  ) values (
    p_couple_id,
    p_log_date,
    p_logged_by,
    p_cycle_id,
    p_flow_intensity,
    coalesce(p_symptoms, '{}'),
    coalesce(p_moods, '{}'),
    p_notes,
    case
      when p_update_sexual_activity then p_sexual_activity_encrypted
      else null
    end
  )
  returning * into v_row;

  return v_row;
end;
$function$;

revoke all on function public.upsert_daily_log(
  uuid, date, uuid, uuid, smallint, text[], text[], text, text, boolean
) from public;
revoke all on function public.upsert_daily_log(
  uuid, date, uuid, uuid, smallint, text[], text[], text, text, boolean
) from anon;
grant execute on function public.upsert_daily_log(
  uuid, date, uuid, uuid, smallint, text[], text[], text, text, boolean
) to authenticated;
