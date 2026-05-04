import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { ShieldCheck, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useMfaEnroll,
  useMfaFactors,
  useMfaUnenroll,
  useMfaVerify,
} from '@/features/mfa/hooks/use-mfa';
import { useTranslation } from '@/lib/i18n';

// MFA TOTP enrollment + manage card. Shown di Settings page.
//
// Flow:
//   1. Initial: list factors. If verified factor exists → show enrolled state.
//   2. Enroll click → call enrollMfa(), get secret + uri. Render QR.
//   3. User scan + masukin 6-digit code → verify. Success → invalidate factors query.
//   4. Unenroll click → confirm via window.confirm() → unenroll, refresh.
//
// Note: Supabase aalLevel default 'aal1' setelah login email-password. Setelah enroll
// + verify, supabase.auth.mfa.getAuthenticatorAssuranceLevel() returns aal2 — kita
// gak enforce aal2 untuk RLS saat ini (defer to Phase 4 polish kalau dibutuhkan).
export const MfaCard = () => {
  const { t } = useTranslation();
  const factorsQuery = useMfaFactors();
  const enroll = useMfaEnroll();
  const verify = useMfaVerify();
  const unenroll = useMfaUnenroll();

  const [pendingEnroll, setPendingEnroll] = useState<{
    factorId: string;
    secret: string;
    uri: string;
  } | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [code, setCode] = useState('');

  // Generate QR data URL whenever pendingEnroll URI changes.
  useEffect(() => {
    if (!pendingEnroll?.uri) {
      setQrDataUrl(null);
      return;
    }
    void QRCode.toDataURL(pendingEnroll.uri, { width: 220, margin: 1 }).then(
      (url) => setQrDataUrl(url),
    );
  }, [pendingEnroll?.uri]);

  if (factorsQuery.isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('mfa.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Find verified TOTP factor (enrolled state)
  const totpFactor = factorsQuery.data?.totp?.find(
    (f) => f.status === 'verified',
  );

  // Pending enrollment view
  if (pendingEnroll) {
    const handleVerify = () => {
      verify.mutate(
        { factorId: pendingEnroll.factorId, code: code.trim() },
        {
          onSuccess: () => {
            setPendingEnroll(null);
            setCode('');
          },
        },
      );
    };

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('mfa.title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {t('mfa.enroll.scan-instruction')}
          </p>
          {qrDataUrl ? (
            <div className="flex justify-center">
              <img
                src={qrDataUrl}
                alt="TOTP QR Code"
                width={220}
                height={220}
                className="rounded-md bg-white p-2"
              />
            </div>
          ) : (
            <Skeleton className="h-[220px] w-[220px] mx-auto" />
          )}
          <details className="text-xs text-muted-foreground">
            <summary className="cursor-pointer">
              {t('mfa.enroll.secret-fallback')}
            </summary>
            <code className="mt-1 block break-all rounded bg-muted px-2 py-1 font-mono text-xs">
              {pendingEnroll.secret}
            </code>
          </details>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="mfa-code">
              {t('mfa.enroll.code-label')}
            </label>
            <Input
              id="mfa-code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              autoComplete="one-time-code"
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="123456"
              className="font-mono text-center text-lg tracking-widest"
            />
          </div>
          {verify.error && (
            <p className="text-sm text-destructive" role="alert">
              {t('mfa.error.invalid-code')}
            </p>
          )}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setPendingEnroll(null);
                setCode('');
              }}
              disabled={verify.isPending}
              className="flex-1"
            >
              {t('mfa.enroll.cancel')}
            </Button>
            <Button
              type="button"
              onClick={handleVerify}
              disabled={code.length !== 6 || verify.isPending}
              className="flex-1"
            >
              {verify.isPending
                ? t('mfa.enroll.verifying')
                : t('mfa.enroll.verify')}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Enrolled state: show status + unenroll button
  if (totpFactor) {
    const handleUnenroll = () => {
      if (!window.confirm(t('mfa.unenroll.confirm'))) return;
      unenroll.mutate(totpFactor.id);
    };
    return (
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base inline-flex items-center gap-2">
            <ShieldCheck className="size-4 text-emerald-600" />
            {t('mfa.title')}
          </CardTitle>
          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
            {t('mfa.status.enrolled')}
          </span>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">{t('mfa.description')}</p>
          <Button
            type="button"
            variant="outline"
            className="w-full text-destructive hover:text-destructive"
            onClick={handleUnenroll}
            disabled={unenroll.isPending}
          >
            {t('mfa.button.unenroll')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Not enrolled: show enroll button
  const handleEnrollClick = () => {
    enroll.mutate(undefined, {
      onSuccess: (data) => {
        setPendingEnroll({
          factorId: data.id,
          secret: data.totp.secret,
          uri: data.totp.uri,
        });
      },
    });
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base inline-flex items-center gap-2">
          <ShieldAlert className="size-4 text-amber-600" />
          {t('mfa.title')}
        </CardTitle>
        <span className="text-xs font-medium text-muted-foreground">
          {t('mfa.status.not-enrolled')}
        </span>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{t('mfa.description')}</p>
        <Button
          type="button"
          onClick={handleEnrollClick}
          disabled={enroll.isPending}
          className="w-full"
        >
          {t('mfa.button.enroll')}
        </Button>
      </CardContent>
    </Card>
  );
};
