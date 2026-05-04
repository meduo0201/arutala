import { create } from 'zustand';

// E2EE state — derived key + status. CRITICAL: NO persistence (NO localStorage,
// NO sessionStorage, NO IndexedDB). Key cuma di-cache di JavaScript memory
// selama app open. App close / hard reload → user must re-unlock.
//
// Trade-off: friction tinggi (re-unlock per session) tapi defense vs:
//   - Akses fisik device (DevTools → Application → no key found)
//   - XSS reading localStorage
//   - Browser cache scraping
//
// status:
//   - 'unknown': belum query profile.encryption_salt — show loading
//   - 'not_setup': profile.encryption_salt = null — user belum setup E2EE
//   - 'locked':   profile.encryption_salt set tapi key belum di-derive (post-reload)
//   - 'unlocked': key derived & cached di memory, ready encrypt/decrypt

export type E2eeStatus = 'unknown' | 'not_setup' | 'locked' | 'unlocked';

interface E2eeState {
  status: E2eeStatus;
  /** Derived AES-GCM key. Memory only. */
  key: CryptoKey | null;
  /** Salt (base64) untuk derive ulang saat unlock. Dari profile.encryption_salt. */
  saltBase64: string | null;
  /** Encrypted verifier sentinel. Dari profile.encryption_verifier. */
  encryptedVerifier: string | null;
}

interface E2eeActions {
  setSetupComplete: (saltBase64: string, encryptedVerifier: string, key: CryptoKey) => void;
  setLocked: (saltBase64: string, encryptedVerifier: string) => void;
  setUnlocked: (key: CryptoKey) => void;
  setNotSetup: () => void;
  /** Lock — clear key dari memory. Salt + verifier kept (so we can re-unlock). */
  lock: () => void;
  /** Reset to unknown — saat user logout / akun ganti. */
  reset: () => void;
}

export const useE2eeStore = create<E2eeState & E2eeActions>((set) => ({
  status: 'unknown',
  key: null,
  saltBase64: null,
  encryptedVerifier: null,

  setSetupComplete: (saltBase64, encryptedVerifier, key) =>
    set({ status: 'unlocked', saltBase64, encryptedVerifier, key }),

  setLocked: (saltBase64, encryptedVerifier) =>
    set({ status: 'locked', saltBase64, encryptedVerifier, key: null }),

  setUnlocked: (key) =>
    set((s) => ({ ...s, status: 'unlocked', key })),

  setNotSetup: () =>
    set({ status: 'not_setup', saltBase64: null, encryptedVerifier: null, key: null }),

  lock: () => set((s) => ({ ...s, status: 'locked', key: null })),

  reset: () =>
    set({ status: 'unknown', key: null, saltBase64: null, encryptedVerifier: null }),
}));
