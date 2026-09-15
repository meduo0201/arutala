import { useEffect } from 'react';
import { getEncryptionMeta, hasEncryptionMeta } from '@/features/e2ee/api';
import { useE2eeStore } from '@/features/e2ee/store';
import { useAuthStore } from '@/features/auth/store';

// Bootstrap E2EE state saat user authenticated. Reads profile.encryption_salt
// + encryption_verifier dan set status awal:
//   - Tidak ada salt   → 'not_setup'
//   - Salt ada, no key → 'locked' (user harus unlock manual)
//
// Jangan auto-derive key di sini — user must explicitly unlock per session.
//
// Call ini ONCE di app entry (main.tsx atau RootRoute) setelah auth ready.
export const useE2eeBootstrap = () => {
  const userId = useAuthStore((s) => s.user?.id);
  const initialized = useAuthStore((s) => s.initialized);
  const status = useE2eeStore((s) => s.status);
  const setLocked = useE2eeStore((s) => s.setLocked);
  const setNotSetup = useE2eeStore((s) => s.setNotSetup);
  const setLoadError = useE2eeStore((s) => s.setLoadError);
  const reset = useE2eeStore((s) => s.reset);

  useEffect(() => {
    if (!initialized) return;
    if (!userId) {
      reset();
      return;
    }
    if (status !== 'unknown') return; // already bootstrapped

    void getEncryptionMeta().then((meta) => {
      if (!meta.ok) {
        setLoadError();
        return;
      }
      if (!hasEncryptionMeta(meta)) {
        setNotSetup();
        return;
      }
      setLocked(meta.encryption_salt, meta.encryption_verifier);
    });
  }, [initialized, userId, status, reset, setLocked, setNotSetup, setLoadError]);
};
