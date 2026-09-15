import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { useAccessGuards } from '@/features/auth/hooks/use-access-guards';
import { useE2eeBootstrap } from '@/features/e2ee/hooks/use-e2ee';
import { MfaChallengeGate } from '@/features/mfa/components/mfa-challenge-gate';
import { useTranslation } from '@/lib/i18n';
import { isSupabaseConfigured } from '@/lib/supabase';

/**
 * Wrap routes yang perlu authenticated session.
 * F04: if the user enrolled MFA, require AAL2 before the app shell.
 * Users without MFA are not blocked. Soft-deleted accounts are signed out.
 */
export const ProtectedRoute = () => {
  const { t } = useTranslation();
  const { user, initialized } = useAuth();
  const { state, deletedMessage, markAal2Satisfied } = useAccessGuards();
  useE2eeBootstrap();

  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-dvh flex items-center justify-center px-6 text-center">
        <p className="text-sm text-muted-foreground">{t('error.config')}</p>
      </div>
    );
  }

  if (!initialized || (user && state === 'loading')) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
      </div>
    );
  }

  if (!user || state === 'deleted') {
    if (state === 'deleted') {
      return (
        <div className="min-h-dvh flex items-center justify-center px-6 text-center">
          <p className="text-sm text-muted-foreground">{deletedMessage}</p>
        </div>
      );
    }
    return <Navigate to="/login" replace />;
  }

  if (state === 'aal2') {
    return <MfaChallengeGate onVerified={markAal2Satisfied} />;
  }

  return <Outlet />;
};
