import { Navigate, Outlet } from 'react-router-dom';
import { useCouple } from '@/features/couples/hooks/use-couple';
import { useCoupleRealtime } from '@/features/couples/hooks/use-couple-realtime';
import { useProfile } from '@/features/profile/hooks/use-profile';
import { useTranslation } from '@/lib/i18n';

/**
 * Wrap routes yang butuh either: active couple OR solo tracker mode.
 *
 * Loading: show skeleton.
 * Phase 5 routing logic:
 *   - profile.role = 'supporter' → couple wajib aktif → redirect /couple-setup
 *     kalau gak ada
 *   - profile.role = 'tracker' AND profile.is_solo = true → bisa skip couple,
 *     langsung render Outlet (solo mode access)
 *   - profile.role = 'tracker' AND profile.is_solo = false → couple wajib
 *     (current legacy behavior)
 *
 * Profile belum ada (race) → redirect /onboarding/role buat pilih dulu.
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

  // Profile belum ada (kemungkinan trigger handle_new_user belum jalan, atau
  // race condition pas baru signup). Onboarding fallback.
  if (!profile.data) {
    return <Navigate to="/onboarding/role" replace />;
  }

  // Solo tracker — bypass couple requirement
  if (profile.data.role === 'tracker' && profile.data.is_solo) {
    return <Outlet />;
  }

  // Couple required (supporter or non-solo tracker)
  if (!couple.data) {
    return <Navigate to="/couple-setup" replace />;
  }

  return <Outlet />;
};
