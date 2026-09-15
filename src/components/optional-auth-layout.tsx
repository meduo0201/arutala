import { Outlet } from 'react-router-dom';
import { AppLayout } from '@/components/layout/app-layout';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { useTranslation } from '@/lib/i18n';

/** Public pages that keep the tab bar when the user is already signed in. */
export const OptionalAuthLayout = () => {
  const { t } = useTranslation();
  const { user, initialized } = useAuth();

  if (!initialized) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
      </div>
    );
  }

  if (user) return <AppLayout />;
  return <Outlet />;
};
