import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  acceptInvitation,
  cancelInvitation,
  createInvitation,
  unlinkCouple,
} from '@/features/couples/api/couples';
import {
  coupleQueryKey,
  myInvitationQueryKey,
} from '@/features/couples/hooks/use-couple';
import { useAuth } from '@/features/auth/hooks/use-auth';

/**
 * Generate new invitation. Invalidate `useMyInvitation` query supaya UI
 * auto-render code yang baru ke-generate (single source of truth dari DB).
 */
export const useCreateInvitation = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: createInvitation,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: myInvitationQueryKey(user?.id),
      });
    },
  });
};

/**
 * Cancel pending invitation. Invalidate `useMyInvitation`—UI revert ke
 * "Bikin code baru" button setelah cancel sukses.
 */
export const useCancelInvitation = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: cancelInvitation,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: myInvitationQueryKey(user?.id),
      });
    },
  });
};

/**
 * Unlink active couple. On success, invalidate couple query—partner display
 * disappears. Couple linking remains optional from Settings.
 *
 * Cycles + daily_logs di DB preserved tapi gak readable (RLS gates by active
 * couple). User bisa link lagi dengan code baru kalau mau—itu bikin couple row
 * baru, history lama tetap stranded.
 */
export const useUnlinkCouple = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: unlinkCouple,
    onSuccess: () => {
      // Clear ALL queries—couple, cycles, daily_logs all gated by couple_id.
      // After unlink, the user effectively has fresh state.
      queryClient.clear();
      void queryClient.invalidateQueries({
        queryKey: coupleQueryKey(user?.id),
      });
    },
  });
};

/**
 * Accept invitation. On success, invalidate couple query supaya UI auto-refresh
 * dengan couple data baru (user sekarang punya active couple).
 */
export const useAcceptInvitation = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (code: string) => acceptInvitation(code),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: coupleQueryKey(user?.id),
      });
    },
  });
};
