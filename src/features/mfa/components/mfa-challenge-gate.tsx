import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { challengeAndVerifyMfa, listMfaFactors } from '@/features/mfa/api';
import { signOut as signOutApi } from '@/features/auth/api/mutations';
import { useTranslation } from '@/lib/i18n';
import { formatUserError } from '@/lib/user-error';

interface MfaChallengeGateProps {
  onVerified: () => void;
}

export const MfaChallengeGate = ({ onVerified }: MfaChallengeGateProps) => {
  const { t } = useTranslation();
  const [code, setCode] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async () => {
    setPending(true);
    setError(null);
    try {
      const factors = await listMfaFactors();
      const totp = factors.totp.find((f) => f.status === 'verified');
      if (!totp) {
        onVerified();
        return;
      }
      await challengeAndVerifyMfa(totp.id, code.trim());
      onVerified();
    } catch (e) {
      setError(formatUserError(e, t('mfa.error.invalid-code')));
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="min-h-dvh flex items-center justify-center px-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-base">{t('mfa.challenge.title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {t('mfa.challenge.body')}
          </p>
          <Input
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
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          <Button
            type="button"
            className="w-full"
            disabled={code.length !== 6 || pending}
            onClick={() => void handleVerify()}
          >
            {pending ? t('mfa.enroll.verifying') : t('mfa.challenge.submit')}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={() => {
              void signOutApi().finally(() => {
                window.location.replace('/login');
              });
            }}
          >
            {t('mfa.challenge.sign-out')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
