import { ChevronLeft, ChevronRight, LogOut, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
// (signed-in user info already in Account card; no extra imports needed)
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { LocaleSwitcher } from '@/components/locale-switcher';
import { ThemeToggle } from '@/components/theme-toggle';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { useSignOut } from '@/features/auth/hooks/use-auth-mutations';
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

// Settings hub. Auth-only (gak butuh couple)—jadi pasca-unlink user tetap bisa
// akses sini buat ganti theme/locale/sign out tanpa stuck di /couple-setup.
const SettingsPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: couple } = useCouple();

  const partner = couple?.partner;

  return (
    <main className="min-h-dvh bg-background text-foreground">
      <div className="max-w-md mx-auto px-4 py-6 pb-24 space-y-6">
        <header className="flex items-center gap-2">
          <Link
            to="/"
            aria-label={t('settings.back')}
            className="inline-flex size-9 items-center justify-center rounded-md text-foreground hover:bg-muted -ml-2"
          >
            <ChevronLeft className="size-5" />
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t('settings.title')}
          </h1>
        </header>

        {/* Account info (read-only) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t('settings.account.title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 text-sm">
              <p className="text-muted-foreground">
                {t('settings.account.email')}
              </p>
              <p className="font-medium break-all">{user?.email}</p>
            </div>
          </CardContent>
        </Card>

        {/* Profile editing (display_name, avatar emoji) */}
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

        {/* Couple section: partner display + unlink */}
        {partner && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {t('settings.couple.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm">
                {t('couple.partner-prefix')}{' '}
                <span className="font-medium">
                  {partner.avatar_emoji ?? '👤'} {partner.display_name}
                </span>
              </p>
              <UnlinkCoupleDialog />
            </CardContent>
          </Card>
        )}

        {/* Preferences: theme + language */}
        <Card>
          <CardContent className="space-y-4 py-5">
            <ThemeToggle />
            <Separator />
            <LocaleSwitcher />
          </CardContent>
        </Card>

        {/* MFA / 2FA enrollment */}
        <MfaCard />

        {/* E2EE for sexual_activity tracking */}
        <E2eeCard />

        {/* Push notifications */}
        <PushNotifCard />

        {/* Privacy & data — link ke /privacy page */}
        <Link
          to="/privacy"
          className="flex items-center justify-between rounded-md border border-border px-4 py-3 text-sm hover:bg-muted/50 transition-colors"
        >
          <span className="inline-flex items-center gap-2 font-medium">
            <ShieldCheck className="size-4 text-primary" />
            {t('privacy.title')}
          </span>
          <ChevronRight className="size-4 text-muted-foreground" />
        </Link>

        {/* PWA install prompt (auto-hides if already installed or unsupported) */}
        <InstallCard />

        {/* Data export */}
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

        {/* Delete account — destructive, last buat avoid mis-tap */}
        <DeleteAccountCard />

        <SignOutButton />
      </div>
    </main>
  );
};

const SignOutButton = () => {
  const { t } = useTranslation();
  const signOut = useSignOut();
  return (
    <Button
      type="button"
      variant="outline"
      className="w-full text-destructive hover:text-destructive"
      onClick={() => signOut.mutate()}
      disabled={signOut.isPending}
    >
      <LogOut className="size-4 mr-2" />
      {signOut.isPending ? t('home.signing-out') : t('home.sign-out')}
    </Button>
  );
};

export default SettingsPage;
