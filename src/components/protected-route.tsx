import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { useE2eeBootstrap } from '@/features/e2ee/hooks/use-e2ee';
import { useTranslation } from '@/lib/i18n';

/**
 * Wrap routes yang perlu authenticated session.
 * - Sebelum initial getSession() resolved → loading state (cegah flash redirect).
 * - Tanpa user → redirect ke /login.
 * - Dengan user → render children via <Outlet />.
 *
 * Pakai sebagai layout route di router.tsx:
 *   { element: <ProtectedRoute />, children: [...protected paths] }
 */
export const ProtectedRoute = () => {
  const { t } = useTranslation();
  const { user, initialized } = useAuth();
  // Bootstrap E2EE state once auth resolved (read profile.encryption_salt + verifier
  // → set 'not_setup' / 'locked' / leave 'unknown' until user authenticated).
  useE2eeBootstrap();

  if (!initialized) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};
