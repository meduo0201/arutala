import { supabase } from '@/lib/supabase';
import type { LoginInput, SignupInput } from '@/features/auth/schemas';
import {
  normalizeUsername,
  toSyntheticEmail,
} from '@/features/auth/lib/username';
import {
  ACCOUNT_SOFT_DELETED_MESSAGE,
  isProfileSoftDeleted,
} from '@/features/account-deletion/lib/soft-delete';

// Thin wrappers atas Supabase Auth client. Tujuan: type-safe input + central
// place untuk error handling pattern + future logging/instrumentation hooks.
//
// UI collects username only. Supabase email provider still needs an address,
// so we map `alice` → `alice@users.local` and never render that mailbox.

export const signInWithUsername = async (input: LoginInput) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: toSyntheticEmail(input.username),
    password: input.password,
  });
  if (error) throw error;

  const userId = data.user?.id;
  if (userId) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('deleted_at')
      .eq('id', userId)
      .maybeSingle();
    if (isProfileSoftDeleted(profile)) {
      await supabase.auth.signOut({ scope: 'global' });
      throw new Error(ACCOUNT_SOFT_DELETED_MESSAGE);
    }
  }

  return data;
};

export const signUpWithUsername = async (
  input: SignupInput,
  captchaToken?: string,
) => {
  const username = normalizeUsername(input.username);
  const { data, error } = await supabase.auth.signUp({
    email: toSyntheticEmail(username),
    password: input.password,
    options: {
      // raw_user_meta_data → handle_new_user trigger creates public.profiles.
      // No personal fields (birth date / age) — display_name defaults to username.
      data: {
        display_name: username,
        username,
      },
      // Turnstile/hCaptcha token kalau captcha enabled di Supabase Auth.
      // Kalau VITE_TURNSTILE_SITE_KEY tidak di-set, captchaToken=undefined
      // dan Supabase skip verification (asalkan project belum set captcha_secret).
      ...(captchaToken ? { captchaToken } : {}),
    },
  });
  if (error) throw error;
  return data;
};

// Hardened sign-out (audit F-022):
// 1. scope:'global' invalidates refresh token di SEMUA device user (bukan cuma device current).
// 2. Clear semua Cache Storage entries (workbox supabase-rest cache yang menyimpan data sensitif).
// 3. Unregister service worker biar fresh state on next visit.
// 4. Clear non-auth Zustand persistence (theme/locale tetap, biar UX preference user terjaga).
//
// Catatan: error tetap di-throw kalau scope:global gagal — tapi local-side cleanup
// dijalankan dulu agar device current bersih meski server tidak konfirmasi.
export const signOut = async () => {
  // Local-side cleanup first (idempotent, gak butuh network)
  if (typeof window !== 'undefined') {
    try {
      if ('caches' in window) {
        const names = await caches.keys();
        await Promise.all(names.map((n) => caches.delete(n)));
      }
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
      }
    } catch {
      // Best-effort; cleanup failure tidak block signOut.
    }
  }

  const { error } = await supabase.auth.signOut({ scope: 'global' });
  if (error) throw error;
};
