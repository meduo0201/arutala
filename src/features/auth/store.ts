import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';
import { replayPendingConsentIfAny } from '@/features/consent/pending';
import { supabase } from '@/lib/supabase';

// Session source-of-truth pakai Zustand vanilla store. Kenapa Zustand bukan
// React Context: gak perlu wrap component tree, bisa di-access dari non-component
// (mis. router loader, vanilla code). Subscribe untuk update auto-trigger render.

interface AuthState {
  user: User | null;
  session: Session | null;
  /** True setelah initial getSession() resolved—UI bisa hide loading skeleton. */
  initialized: boolean;
}

interface AuthActions {
  setSession: (session: Session | null) => void;
}

export const useAuthStore = create<AuthState & AuthActions>((set) => ({
  user: null,
  session: null,
  initialized: false,
  setSession: (session) =>
    set({
      user: session?.user ?? null,
      session,
      initialized: true,
    }),
}));

/**
 * Kick off initial session fetch + auth state listener. Call ONCE di app entry
 * (main.tsx) setelah React root mount. Returns cleanup—simpan kalau perlu unmount
 * (jarang, biasanya selamanya app lifetime).
 */
export const initializeAuth = () => {
  void supabase.auth.getSession().then(({ data }) => {
    useAuthStore.getState().setSession(data.session);
  });

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    useAuthStore.getState().setSession(session);
    // Replay pending consent (saved during signup) once user is authenticated.
    // Idempotent-ish: pending cleared after success; failed replay retries next event.
    if (session?.user) {
      void replayPendingConsentIfAny();
    }
  });

  return () => subscription.unsubscribe();
};
