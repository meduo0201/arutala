import { Link, Navigate } from 'react-router-dom';
import { PageShell } from '@/components/layout/page-shell';
import { AcceptInvitationForm } from '@/features/couples/components/accept-invitation-form';
import { InvitationCard } from '@/features/couples/components/invitation-card';
import { useCouple } from '@/features/couples/hooks/use-couple';
import { useTranslation } from '@/lib/i18n';

// Optional couple linking. Reachable from Settings — not a required gate.
//
// Dua flow paralel: bikin invitation (jadi inviter) ATAU accept code (jadi joinee).
// Setelah salah satu sukses + couple status=active, redirect ke home via:
//   - Inviter: pasangan accept code → couple query auto-invalidate (di mutation hook)
//   - Joinee: accept mutation invalidate query → couple.data hadir → CoupleRequired render Outlet
const CoupleSetupPage = () => {
  const { t } = useTranslation();
  const couple = useCouple();

  // Already linked with a partner → redirect home.
  // Solo household (no partner) can still generate / accept an invite.
  if (couple.data?.partner) {
    return <Navigate to="/" replace />;
  }

  return (
    <PageShell>
      <div className="text-center space-y-2">
        <h1 className="page-heading text-[1.7rem]">
          {t('couple.setup.title')}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t('couple.setup.description')}
        </p>
      </div>

      <InvitationCard />
      <AcceptInvitationForm />

      <p className="text-center">
        <Link
          to="/"
          className="text-sm text-primary underline underline-offset-4"
        >
          {t('couple.setup.skip')}
        </Link>
      </p>
    </PageShell>
  );
};

export default CoupleSetupPage;
