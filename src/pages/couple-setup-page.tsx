import { Navigate } from 'react-router-dom';
import { PageShell } from '@/components/layout/page-shell';
import { AcceptInvitationForm } from '@/features/couples/components/accept-invitation-form';
import { InvitationCard } from '@/features/couples/components/invitation-card';
import { useCouple } from '@/features/couples/hooks/use-couple';
import { useTranslation } from '@/lib/i18n';

// Couple linking landing page. User landing di sini setelah login kalau belum
// punya active couple (auto-redirect dari CoupleRequiredRoute).
//
// Dua flow paralel: bikin invitation (jadi inviter) ATAU accept code (jadi joinee).
// Setelah salah satu sukses + couple status=active, redirect ke home via:
//   - Inviter: pasangan accept code → couple query auto-invalidate (di mutation hook)
//   - Joinee: accept mutation invalidate query → couple.data hadir → CoupleRequired render Outlet
const CoupleSetupPage = () => {
  const { t } = useTranslation();
  const couple = useCouple();

  // Already linked → redirect home (no point showing setup).
  if (couple.data) {
    return <Navigate to="/" replace />;
  }

  return (
    <PageShell>
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t('couple.setup.title')}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t('couple.setup.description')}
        </p>
      </div>

      <InvitationCard />
      <AcceptInvitationForm />
    </PageShell>
  );
};

export default CoupleSetupPage;
