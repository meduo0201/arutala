import { useState } from 'react';
import { Lock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useE2eeStore } from '@/features/e2ee/store';
import {
  buildVerifierSentinel,
  decrypt,
  deriveKey,
  saltFromBase64,
} from '@/lib/crypto';
import { useAuthStore } from '@/features/auth/store';
import { useTranslation } from '@/lib/i18n';

interface PassphraseUnlockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const PassphraseUnlockDialog = ({
  open,
  onOpenChange,
  onSuccess,
}: PassphraseUnlockDialogProps) => {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const saltBase64 = useE2eeStore((s) => s.saltBase64);
  const encryptedVerifier = useE2eeStore((s) => s.encryptedVerifier);
  const setUnlocked = useE2eeStore((s) => s.setUnlocked);

  const [passphrase, setPassphrase] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setPassphrase('');
    setError(null);
  };

  const handleSubmit = async () => {
    if (!user?.id || !saltBase64 || !encryptedVerifier) return;
    setError(null);
    setBusy(true);
    try {
      const salt = saltFromBase64(saltBase64);
      const key = await deriveKey(passphrase, salt);

      // Verify by decrypting sentinel — kalau wrong passphrase, GCM auth tag
      // fails dan throws. Plus check sentinel content matches expected user_id.
      const decrypted = await decrypt(encryptedVerifier, key);
      const expected = buildVerifierSentinel(user.id);
      if (decrypted !== expected) {
        // Should not happen if encrypted verifier ditulis benar — defensive check.
        throw new Error('Verifier mismatch');
      }

      setUnlocked(key);
      reset();
      onOpenChange(false);
      onSuccess?.();
    } catch {
      setError(t('e2ee.unlock.error'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) reset();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="inline-flex items-center gap-2">
            <Lock className="size-5 text-primary" />
            {t('e2ee.unlock.title')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 pt-2">
          <label
            htmlFor="e2ee-unlock-passphrase"
            className="text-sm font-medium"
          >
            {t('e2ee.unlock.passphrase-label')}
          </label>
          <Input
            id="e2ee-unlock-passphrase"
            type="password"
            autoComplete="current-password"
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter' && passphrase.length >= 12 && !busy) {
                e.preventDefault();
                void handleSubmit();
              }
            }}
          />

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={busy}
          >
            {t('couple.unlink.cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={passphrase.length < 12 || busy}
          >
            {busy ? t('e2ee.unlock.processing') : t('e2ee.unlock.submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
