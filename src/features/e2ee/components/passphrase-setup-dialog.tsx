import { useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { saveEncryptionMeta } from '@/features/e2ee/api';
import { useE2eeStore } from '@/features/e2ee/store';
import { useAuthStore } from '@/features/auth/store';
import {
  buildVerifierSentinel,
  deriveKey,
  encrypt,
  generateSalt,
  saltToBase64,
} from '@/lib/crypto';
import { useTranslation } from '@/lib/i18n';

interface PassphraseSetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

// Minimum passphrase strength check (mirror auth.password regex but simpler).
const isStrongEnough = (pw: string): boolean => pw.length >= 12;

export const PassphraseSetupDialog = ({
  open,
  onOpenChange,
  onSuccess,
}: PassphraseSetupDialogProps) => {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const setSetupComplete = useE2eeStore((s) => s.setSetupComplete);

  const [passphrase, setPassphrase] = useState('');
  const [confirm, setConfirm] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setPassphrase('');
    setConfirm('');
    setAcknowledged(false);
    setError(null);
  };

  const canSubmit =
    isStrongEnough(passphrase) &&
    passphrase === confirm &&
    acknowledged &&
    !!user?.id &&
    !busy;

  const handleSubmit = async () => {
    if (!user?.id) return;
    setError(null);
    setBusy(true);
    try {
      // 1. Generate fresh salt
      const salt = generateSalt();

      // 2. Derive key (slow — PBKDF2 600k)
      const key = await deriveKey(passphrase, salt);

      // 3. Encrypt verifier sentinel
      const sentinel = buildVerifierSentinel(user.id);
      const encryptedVerifier = await encrypt(sentinel, key);

      // 4. Save salt + verifier ke profile (server)
      const saltB64 = saltToBase64(salt);
      await saveEncryptionMeta(saltB64, encryptedVerifier);

      // 5. Store key di memory (Zustand)
      setSetupComplete(saltB64, encryptedVerifier, key);

      reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
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
            <ShieldAlert className="size-5 text-amber-600" />
            {t('e2ee.setup.title')}
          </DialogTitle>
          <DialogDescription className="text-sm pt-2">
            {t('e2ee.setup.warning')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <label
              htmlFor="e2ee-passphrase"
              className="text-sm font-medium"
            >
              {t('e2ee.setup.passphrase-label')}
            </label>
            <Input
              id="e2ee-passphrase"
              type="password"
              autoComplete="new-password"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              minLength={12}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="e2ee-passphrase-confirm"
              className="text-sm font-medium"
            >
              {t('e2ee.setup.confirm-label')}
            </label>
            <Input
              id="e2ee-passphrase-confirm"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
            {confirm && confirm !== passphrase && (
              <p className="text-xs text-destructive">
                {t('e2ee.setup.mismatch')}
              </p>
            )}
          </div>

          <div className="flex gap-2 items-start">
            <Checkbox
              id="e2ee-acknowledge"
              checked={acknowledged}
              onCheckedChange={(v) => setAcknowledged(v === true)}
              className="mt-0.5"
            />
            <label
              htmlFor="e2ee-acknowledge"
              className="text-xs text-muted-foreground leading-snug cursor-pointer"
            >
              {t('e2ee.setup.acknowledge')}
            </label>
          </div>

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
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {busy ? t('e2ee.setup.processing') : t('e2ee.setup.submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
