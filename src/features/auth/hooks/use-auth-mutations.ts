import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  signInWithUsername,
  signOut,
  signUpWithUsername,
} from '@/features/auth/api/mutations';
import { formatUserError } from '@/lib/user-error';

// TanStack Query mutation wrappers. Component pakai ini, BUKAN raw API.
// Benefit: built-in pending/error state, query invalidation, devtools visibility.

export const useSignIn = () => {
  return useMutation({
    mutationFn: signInWithUsername,
    onError: (error) => {
      toast.error(formatUserError(error, '账号或密码错误'));
    },
  });
};

export const useSignUp = () => {
  return useMutation({
    mutationFn: (
      input: Parameters<typeof signUpWithUsername>[0] & { captchaToken?: string },
    ) => {
      const { captchaToken, ...rest } = input;
      return signUpWithUsername(rest, captchaToken);
    },
    onError: (error) => {
      toast.error(formatUserError(error, '出错了，请再试一次。'));
    },
  });
};

export const useSignOut = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: signOut,
    onSuccess: () => {
      // Clear all cached queries on logout—data dari user lain leak risk.
      queryClient.clear();
    },
  });
};
