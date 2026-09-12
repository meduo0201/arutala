import { ChevronLeft, ChevronRight, LogOut, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PageShell } from '@/components/layout/page-shell';
import { ThemeToggle } from '@/components/theme-toggle';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { useSignOut } from '@/features/auth/hooks/use-auth-mutations';
import { usernameFromAuthEmail } from '@/features/auth/lib/username';
import { useCouple } from '@/features/couples/hooks/use-couple';
import { UnlinkCoupleDialog } from '@/features/couples/components/unlink-couple-dialog';
import { DeleteAccountCard } from '@/features/account-deletion/components/delete-account-card';
import { ExportButton } from '@/features/data-export/components/export-button';
import { E2eeCard } from '@/features/e2ee/components/e2ee-card';
import { MfaCard } from '@/features/mfa/components/mfa-card';
import { ProfileForm } from '@/features/profile/components/profile-form';
import { PushNotifCard } from '@/features/push/components/push-notif-card';
import { InstallCard } from '@/features/pwa-install/components/install-card';
import { useTranslation } from '@/lib/i18n';

const SettingsPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: couple } = useCouple();

  const partner = couple?.partner;

  return (
    <PageShell>
      <header className="flex items-center gap-2">
        <Link
          to="/"
          aria-label={t('settings.back')}
          className="inline-flex size-11 items-center justify-center rounded-md text-foreground hover:bg-muted -ml-2"
        >
          <ChevronLeft className="size-5" />
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">
          {t('settings.title')}
        </h1>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {t('settings.account.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1 text-sm">
            <p className="text-muted-foreground">
              {t('settings.account.username')}
            </p>
            <p className="font-medium break-all">
              {usernameFromAuthEmail(user?.email)}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {t('settings.profile.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {t('settings.couple.title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {partner ? (
            <>
              <p className="text-sm">
                {t('couple.partner-prefix')}{' '}
                <span className="font-medium">
                  {partner.avatar_emoji ?? '👤'} {partner.display_name}
                </span>
              </p>
              <UnlinkCoupleDialog />
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                {t('settings.couple.setup-body')}
              </p>
              <Link
                to="/couple-setup"
                className="inline-flex min-h-11 items-center text-sm font-medium text-primary underline underline-offset-4"
              >
                {t('settings.couple.setup')}
              </Link>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="py-5">
          <ThemeToggle />
        </CardContent>
      </Card>

      <MfaCard />
      <E2eeCard />
      <PushNotifCard />

      <Link
        to="/privacy"
        className="flex min-h-12 items-center justify-between rounded-md border border-border px-4 py-3 text-sm hover:bg-muted/50 transition-colors"
      >
        <span className="inline-flex items-center gap-2 font-medium">
          <ShieldCheck className="size-4 text-primary" />
          {t('privacy.title')}
        </span>
        <ChevronRight className="size-4 text-muted-foreground" />
      </Link>

      <InstallCard />

      {couple && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('export.title')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {t('export.description')}
            </p>
            <ExportButton />
          </CardContent>
        </Card>
      )}

      <DeleteAccountCard />

      <SignOutButton />
    </PageShell>
  );
};

const SignOutButton = () => {
  const { t } = useTranslation();
  const signOut = useSignOut();
  return (
    <Button
      type="button"
      variant="outline"
      className="w-full min-h-12 text-destructive hover:text-destructive"
      onClick={() => signOut.mutate()}
      disabled={signOut.isPending}
    >
      <LogOut className="size-4 mr-2" />
      {signOut.isPending ? t('home.signing-out') : t('home.sign-out')}
    </Button>
  );
};

export default SettingsPage;
