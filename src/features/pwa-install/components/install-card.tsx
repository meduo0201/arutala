import { useState } from 'react';
import { Download, Share } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useInstallPrompt } from '@/features/pwa-install/hooks/use-install-prompt';
import { useTranslation } from '@/lib/i18n';

// Render rules:
// - Sudah standalone → null (gak perlu CTA).
// - canInstall (Chrome/Edge/Android) → CTA button → trigger native prompt.
// - iOS Safari (no canInstall, isIOS) → render manual instructions card.
// - Other browser unsupported → null (silent, biar settings gak rame).
export const InstallCard = () => {
  const { t } = useTranslation();
  const { canInstall, installed, isIOS, promptInstall } = useInstallPrompt();
  const [busy, setBusy] = useState(false);

  if (installed) return null;

  const handleClick = async () => {
    setBusy(true);
    try {
      await promptInstall();
    } finally {
      setBusy(false);
    }
  };

  if (canInstall) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('install.title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {t('install.description')}
          </p>
          <Button
            type="button"
            onClick={handleClick}
            disabled={busy}
            className="w-full"
          >
            <Download className="size-4 mr-2" />
            {t('install.button')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isIOS) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('install.ios.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground inline-flex items-start gap-2">
            <Share className="size-4 mt-0.5 shrink-0" aria-hidden="true" />
            <span>{t('install.ios.body')}</span>
          </p>
        </CardContent>
      </Card>
    );
  }

  return null;
};
