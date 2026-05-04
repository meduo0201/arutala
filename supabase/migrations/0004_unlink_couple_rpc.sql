-- Migration 0004: unlink_couple RPC
-- =============================================================================
-- User-initiated unlink: set couple.status = 'unlinked'. Both members lose access
-- to past data via RLS (current_couple_id() returns null). Data preserved in DB
-- for audit, but invisible to clients. Either user can re-link by creating
-- new invitation (creates new couple row).
--
-- SECURITY DEFINER—bypass RLS for the status flip. Authorization done in fn:
-- only current member of active couple can unlink.
-- =============================================================================

create or replace function public.unlink_couple()
returns void language plpgsql security definer as $$
declare
  v_user_id uuid := auth.uid();
  v_couple_id uuid;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select id into v_couple_id
  from public.couples
  where (user_a_id = v_user_id or user_b_id = v_user_id)
    and status = 'active';

  if v_couple_id is null then
    raise exception 'Gak ada pasangan aktif buat dilepas.';
  end if;

  update public.couples
  set status = 'unlinked'
  where id = v_couple_id;
end;
$$;

grant execute on function public.unlink_couple() to authenticated;
