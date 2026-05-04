import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { coupleQueryKey } from '@/features/couples/hooks/use-couple';
import { getProfile, updateProfile } from '@/features/profile/api/profile';
import type { UpdateProfileInput } from '@/features/profile/schemas';

export const profileQueryKey = (userId: string | undefined) =>
  ['profile', userId] as const;

/** Fetch own profile (display_name, avatar_emoji, role_label, timezone). */
export const useProfile = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: profileQueryKey(user?.id),
    queryFn: () => {
      if (!user) throw new Error('useProfile called without auth');
      return getProfile(user.id);
    },
    enabled: !!user,
  });
};

/** Update own profile. Invalidate profile + couple queries (partner display
 *  in home/settings sources from couple.partner.* — needs re-fetch). */
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (input: UpdateProfileInput) => {
      if (!user) throw new Error('useUpdateProfile called without auth');
      return updateProfile(user.id, input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: profileQueryKey(user?.id),
      });
      void queryClient.invalidateQueries({
        queryKey: coupleQueryKey(user?.id),
      });
    },
  });
};
