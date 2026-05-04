-- Migration 0005: soft_delete_daily_log RPC
-- =============================================================================
-- Same pattern as cycles (migration 0003): direct .update({deleted_at}) fails
-- because SELECT policy filters `deleted_at IS NULL`—PostgREST representation
-- read denies. SECURITY DEFINER RPC bypasses + verifies couple membership.
-- =============================================================================

create or replace function public.soft_delete_daily_log(p_log_id uuid)
returns void language plpgsql security definer as $$
declare
  v_user_id uuid := auth.uid();
  v_log_couple_id uuid;
  v_user_couple_id uuid;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select couple_id into v_log_couple_id from public.daily_logs where id = p_log_id;
  if v_log_couple_id is null then
    raise exception 'Log gak ketemu.';
  end if;

  v_user_couple_id := public.current_couple_id();
  if v_user_couple_id is null or v_log_couple_id <> v_user_couple_id then
    raise exception 'Log bukan punya couple kamu.';
  end if;

  update public.daily_logs set deleted_at = now() where id = p_log_id;
end;
$$;

grant execute on function public.soft_delete_daily_log(uuid) to authenticated;
