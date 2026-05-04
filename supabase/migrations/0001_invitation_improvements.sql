-- Migration 0001: Invitation flow improvements
-- =============================================================================
-- 1. Add `cancel_invitation()` RPC: lets user discard their pending couple+invitation
-- 2. Replace `accept_invitation()` with split error messages:
--    - "Code tidak ditemukan. Cek lagi penulisannya." (no row)
--    - "Code sudah pernah dipakai." (accepted_at not null)
--    - "Code sudah expired (>7 hari). Minta pasangan bikin code baru." (expires_at <= now())
--
-- Apply: paste in Supabase Dashboard → SQL Editor → Run.
-- =============================================================================

-- New RPC: cancel pending couple owned by current user (cascade-deletes invitation).
create or replace function public.cancel_invitation()
returns void language plpgsql security definer as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  -- Pending couples are owned solely by user_a_id (inviter), so this is safe.
  -- ON DELETE CASCADE pada invitations.couple_id auto-cleanup invitation row.
  delete from public.couples
  where user_a_id = v_user_id
    and status = 'pending';
end;
$$;

-- Replace accept_invitation: lebih granular error supaya user tau kenapa fail.
create or replace function public.accept_invitation(p_code text)
returns uuid language plpgsql security definer as $$
declare
  v_invitation public.invitations%rowtype;
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_invitation
  from public.invitations
  where code = p_code;

  if not found then
    raise exception 'Code tidak ditemukan. Cek lagi penulisannya.';
  end if;

  if v_invitation.accepted_at is not null then
    raise exception 'Code sudah pernah dipakai.';
  end if;

  if v_invitation.expires_at <= now() then
    raise exception 'Code sudah expired (>7 hari). Minta pasangan bikin code baru.';
  end if;

  if v_invitation.inviter_id = v_user_id then
    raise exception 'Tidak bisa accept invitation sendiri.';
  end if;

  update public.couples
    set user_b_id = v_user_id,
        status = 'active',
        activated_at = now()
    where id = v_invitation.couple_id;

  update public.invitations
    set accepted_at = now(),
        accepted_by = v_user_id
    where code = p_code;

  return v_invitation.couple_id;
end;
$$;
