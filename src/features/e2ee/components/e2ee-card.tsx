import { useState } from 'react';
import { Lock, ShieldCheck, ShieldAlert, ShieldOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PassphraseSetupDialog } from '@/features/e2ee/components/passphrase-setup-dialog';
import { PassphraseUnlockDialog } from '@/features/e2ee/components/passphrase-unlock-dialog';
import { disableE2ee } from '@/features/e2ee/api';
import { useE2eeStore } from '@/features/e2ee/store';
import { useTranslation, type MessageKey } from '@/lib/i18n';

const STATUS_LABEL: Record<'not_setup' | 'locked' | 'unlocked', MessageKey> = {
  not_setup: 'e2ee.status.not-setup',
  locked: 'e2ee.status.locked',
  unlocked: 'e2ee.status.unlocked',
};

// E2EE Settings panel. Shows status badge + action buttons based on state.
// Setup, unlock, lock, disable.
export const E2eeCard = () => {
  const { t } = useTranslation();
  const status = useE2eeStore((s) => s.status);
  const lock = useE2eeStore((s) => s.lock);
  const setNotSetup = useE2eeStore((s) => s.setNotSetup);
  const reset = useE2eeStore((s) => s.reset);

  const [setupOpen, setSetupOpen] = useState(false);
  const [unlockOpen, setUnlockOpen] = useState(false);
  const [disabling, setDisabling] = useState(false);

  if (status === 'unknown') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('e2ee.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (status === 'error') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('e2ee.title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">{t('e2ee.status.error')}</p>
          <Button type="button" variant="outline" onClick={() => reset()} className="w-full">
            {t('e2ee.button.retry')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const StatusIcon =
    status === 'unlocked' ? ShieldCheck :
    status === 'locked' ? Lock :
    ShieldAlert;
  const statusColor =
    status === 'unlocked' ? 'text-emerald-600 dark:text-emerald-400' :
    status === 'locked' ? 'text-primary' :
    'text-amber-600 dark:text-amber-400';

  const handleDisable = async () => {
    if (!window.confirm(t('e2ee.disable.confirm'))) return;
    setDisabling(true);
    try {
      await disableE2ee();
      setNotSetup();
    } finally {
      setDisabling(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base inline-flex items-center gap-2">
            <StatusIcon className={`size-4 ${statusColor}`} />
            {t('e2ee.title')}
          </CardTitle>
          <span className={`text-xs font-medium ${statusColor}`}>
            {t(STATUS_LABEL[status])}
          </span>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">{t('e2ee.description')}</p>

          {status === 'not_setup' && (
            <Button
              type="button"
              onClick={() => setSetupOpen(true)}
              className="w-full"
            >
              {t('e2ee.button.setup')}
            </Button>
          )}

          {status === 'locked' && (
            <div className="flex flex-col gap-2">
              <Button
                type="button"
                onClick={() => setUnlockOpen(true)}
                className="w-full"
              >
                {t('e2ee.button.unlock')}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleDisable}
                disabled={disabling}
                className="w-full text-destructive hover:bg-destructive hover:text-destructive-foreground inline-flex items-center gap-2"
              >
                <ShieldOff className="size-4" />
                {t('e2ee.button.disable')}
              </Button>
            </div>
          )}

          {status === 'unlocked' && (
            <div className="flex flex-col gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={lock}
                className="w-full"
              >
                {t('e2ee.button.lock')}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleDisable}
                disabled={disabling}
                className="w-full text-destructive hover:bg-destructive hover:text-destructive-foreground inline-flex items-center gap-2"
              >
                <ShieldOff className="size-4" />
                {t('e2ee.button.disable')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <PassphraseSetupDialog open={setupOpen} onOpenChange={setSetupOpen} />
      <PassphraseUnlockDialog open={unlockOpen} onOpenChange={setUnlockOpen} />
    </>
  );
};
