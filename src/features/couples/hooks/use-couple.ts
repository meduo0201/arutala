import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { getCurrentCouple, getMyInvitation } from '@/features/couples/api/couples';

// Centralized query keys—reuse di mutations untuk invalidation.
export const coupleQueryKey = (userId: string | undefined) =>
  ['couple', 'current', userId] as const;

export const myInvitationQueryKey = (userId: string | undefined) =>
  ['invitation', 'mine', userId] as const;

/**
 * Fetch current user's active couple. Returns:
 * - `data === undefined` saat loading
 * - `data === null` kalau user belum ada couple
 * - `data` dengan partner profile kalau ada
 *
 * Query disabled kalau gak ada user—prevent unnecessary fetch.
 */
export const useCouple = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: coupleQueryKey(user?.id),
    queryFn: () => {
      if (!user) throw new Error('useCouple called without auth');
      return getCurrentCouple(user.id);
    },
    enabled: !!user,
  });
};

/**
 * Fetch current user's pending invitation (not yet accepted, not expired).
 * Used in InvitationCard untuk auto-show existing code on mount—jadi user
 * yang reload halaman tetep lihat code yang udah di-generate sebelumnya.
 */
export const useMyInvitation = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: myInvitationQueryKey(user?.id),
    queryFn: () => {
      if (!user) throw new Error('useMyInvitation called without auth');
      return getMyInvitation(user.id);
    },
    enabled: !!user,
  });
};
