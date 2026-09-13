import { supabase } from '@/lib/supabase';
import type {
  CoupleRow,
  CoupleWithPartner,
  ProfileRow,
} from '@/features/couples/types';

// API wrappers untuk couples + invitations. Pakai SECURITY DEFINER RPCs
// (`create_invitation`, `accept_invitation`) untuk atomic ops bypass RLS.
// Read query (get current couple) pakai RLS-protected select.
//
// Type assertions di sini disengaja: client supabase di-config tanpa
// `<Database>` generic (lihat src/lib/supabase.ts). API layer ini jadi
// type boundary—consumer dapat narrow types tanpa exposure ke Supabase internals.

/**
 * Fetch current user's active (pending, not expired) invitation kalau ada.
 * Returns null kalau user belum punya pending invitation.
 *
 * Used untuk hydrate InvitationCard saat mount—user yang udah generate code
 * sebelumnya akan lihat code-nya tetep meskipun reload halaman.
 */
export const getMyInvitation = async (
  userId: string,
): Promise<{ code: string; expires_at: string; created_at: string } | null> => {
  const { data, error } = await supabase
    .from('invitations')
    .select('code, expires_at, created_at')
    .eq('inviter_id', userId)
    .is('accepted_at', null)
    .gt('expires_at', new Date().toISOString())
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('[couples] getMyInvitation error:', error);
    throw error;
  }
  return data as { code: string; expires_at: string; created_at: string } | null;
};

/**
 * Cancel pending invitation owned by current user. RPC delete pending couple
 * (cascade-delete invitation row). User bisa generate code baru setelah ini.
 */
export const cancelInvitation = async (): Promise<void> => {
  const { error } = await supabase.rpc('cancel_invitation');
  if (error) throw error;
};

/**
 * Unlink active couple. RPC sets couple.status = 'unlinked' — both users lose
 * access to past data via RLS (current_couple_id() returns null), but rows
 * preserved in DB. User can create fresh invitation after.
 */
export const unlinkCouple = async (): Promise<void> => {
  const { error } = await supabase.rpc('unlink_couple');
  if (error) {
    console.error('[couples] unlinkCouple error:', error);
    throw error;
  }
};

/**
 * Generate invitation code untuk current user. RPC handle:
 * - Auth check (raise kalau gak login)
 * - Cegah duplicate pending couple
 * - Atomic create couple (status='pending') + invitation row
 * - Retry generate code on collision
 *
 * Returns 6-char code (e.g. "X3K9PM").
 */
export const createInvitation = async (): Promise<string> => {
  const { data, error } = await supabase.rpc('create_invitation');
  if (error) throw error;
  return data as string;
};

/**
 * Accept invitation code. RPC handle:
 * - Auth check
 * - Validate code (exists, not expired, not yet accepted)
 * - Cegah accept invitation sendiri
 * - Atomic update couple (set user_b_id, status='active') + invitation (accepted_at)
 *
 * Returns couple_id (uuid).
 */
export const acceptInvitation = async (code: string): Promise<string> => {
  const { data, error } = await supabase.rpc('accept_invitation', {
    p_code: code,
  });
  if (error) throw error;
  return data as string;
};

/**
 * Fetch current user's active couple + partner profile.
 * Pakai `current_couple_id()` RPC (SECURITY DEFINER) untuk resolve couple id—
 * single source of truth (same fn dipake di RLS policies). Lebih reliable dari
 * client-side `.or(...)` filter yang sempat return null walau data exists.
 *
 * Returns null kalau user belum ada couple aktif.
 */
export const getCurrentCouple = async (
  userId: string,
): Promise<CoupleWithPartner | null> => {
  // Prefer ensure_solo_household so solo users can log cycles immediately.
  // Fall back to current_couple_id if migration 0024 is not applied yet.
  let coupleId: string | null = null;
  const ensured = await supabase.rpc('ensure_solo_household');
  if (ensured.error) {
    console.warn('[couples] ensure_solo_household unavailable, falling back:', ensured.error.message);
    const fallback = await supabase.rpc('current_couple_id');
    if (fallback.error) {
      console.error('[couples] current_couple_id RPC error:', fallback.error);
      throw ensured.error;
    }
    coupleId = (fallback.data as string | null) ?? null;
  } else {
    coupleId = (ensured.data as string | null) ?? null;
  }
  if (!coupleId) return null;

  const { data, error } = await supabase
    .from('couples')
    .select('*')
    .eq('id', coupleId as string)
    .maybeSingle();

  if (error) {
    console.error('[couples] fetch couple by id error:', error);
    throw error;
  }
  if (!data) return null;

  const couple = data as CoupleRow;

  // Determine partner ID (couple punya user_a + user_b, partner = yang BUKAN current user).
  const partnerId =
    couple.user_a_id === userId ? couple.user_b_id : couple.user_a_id;

  if (!partnerId) {
    return { ...couple, partner: null };
  }

  // Fetch partner profile. RLS policy "Users see partner profile" allows ini
  // (selama active couple member).
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', partnerId)
    .maybeSingle();

  if (profileError) throw profileError;

  return {
    ...couple,
    partner: (profileData as ProfileRow | null) ?? null,
  };
};
