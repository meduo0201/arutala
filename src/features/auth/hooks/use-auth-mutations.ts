import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  signInWithUsername,
  signOut,
  signUpWithUsername,
} from '@/features/auth/api/mutations';

// TanStack Query mutation wrappers. Component pakai ini, BUKAN raw API.
// Benefit: built-in pending/error state, query invalidation, devtools visibility.

export const useSignIn = () => {
  return useMutation({
    mutationFn: signInWithUsername,
    // Auth state listener di store.ts otomatis update session—gak perlu manual
    // setSession di sini. onAuthStateChange firing dari supabase-js handles it.
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
