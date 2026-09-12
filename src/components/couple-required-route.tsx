import { Outlet } from 'react-router-dom';
import { useCouple } from '@/features/couples/hooks/use-couple';
import { useCoupleRealtime } from '@/features/couples/hooks/use-couple-realtime';
import { useProfile } from '@/features/profile/hooks/use-profile';
import { useTranslation } from '@/lib/i18n';

/**
 * Authenticated app tabs. Couple linking and role onboarding are optional —
 * username + password is enough to use period tracking.
 *
 * Realtime sub aktif kalau ada active couple — solo trackers gak butuh.
 */
export const CoupleRequiredRoute = () => {
  const { t } = useTranslation();
  const couple = useCouple();
  const profile = useProfile();
  useCoupleRealtime(couple.data?.id);

  if (couple.isLoading || profile.isLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
      </div>
    );
  }

  return <Outlet />;
};
