-- Migration 0003: Soft delete cycle via SECURITY DEFINER RPC
-- =============================================================================
-- Issue: client `.update({ deleted_at: now() })` failed with "new row violates RLS"
-- because PostgREST does SELECT-after-UPDATE (representation return), and the
-- SELECT policy on cycles filters `deleted_at IS NULL`. After update, the row
-- has `deleted_at NOT NULL`, so SELECT fails → PostgREST raises RLS error.
--
-- Solution: encapsulate soft delete in SECURITY DEFINER RPC. Returns void, so
-- PostgREST doesn't try to SELECT the row back. Authorization done in function:
-- check user is member of cycle's couple before updating.
-- =============================================================================

create or replace function public.soft_delete_cycle(p_cycle_id uuid)
returns void language plpgsql security definer as $$
declare
  v_user_id uuid := auth.uid();
  v_cycle_couple_id uuid;
  v_user_couple_id uuid;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select couple_id into v_cycle_couple_id
  from public.cycles
  where id = p_cycle_id;

  if not found or v_cycle_couple_id is null then
    raise exception 'Cycle gak ketemu.';
  end if;

  v_user_couple_id := public.current_couple_id();

  if v_user_couple_id is null or v_cycle_couple_id <> v_user_couple_id then
    raise exception 'Cycle bukan punya couple kamu.';
  end if;

  update public.cycles
  set deleted_at = now()
  where id = p_cycle_id;
end;
$$;

grant execute on function public.soft_delete_cycle(uuid) to authenticated;
