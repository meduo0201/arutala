import { useAuthStore } from '@/features/auth/store';

/**
 * Convenience hook untuk read session state di component.
 * Pattern: subscribe ke Zustand store via selector—re-render kalau bagian yang
 * di-select berubah. Lebih hemat dari select whole state.
 *
 * Usage:
 *   const { user, session, initialized } = useAuth();
 *   if (!initialized) return <LoadingSkeleton />;
 *   if (!user) return <Navigate to="/login" />;
 */
export const useAuth = () => {
  const user = useAuthStore((s) => s.user);
  const session = useAuthStore((s) => s.session);
  const initialized = useAuthStore((s) => s.initialized);

  return { user, session, initialized };
};
