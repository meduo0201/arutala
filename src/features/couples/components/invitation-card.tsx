import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  useCancelInvitation,
  useCreateInvitation,
} from '@/features/couples/hooks/use-couple-mutations';
import { useMyInvitation } from '@/features/couples/hooks/use-couple';
import { useTranslation } from '@/lib/i18n';
import { formatUserError } from '@/lib/user-error';

// Card UI untuk generate invitation code. Source of truth = DB query
// (`useMyInvitation`)—reload halaman tetep nge-show code yang udah di-generate.
//
// Three states:
// 1. Loading: skeleton (initial fetch)
// 2. Has invitation (pending): display code + Copy + Cancel buttons
// 3. No invitation: "Bikin code baru" button
//
// User flow: bikin code → share via WhatsApp/SMS ke pasangan → pasangan
// paste di accept form → couple status jadi 'active'. Cancel = abandon flow,
// bisa generate ulang.
export const InvitationCard = () => {
  const { t } = useTranslation();
  const myInvitation = useMyInvitation();
  const create = useCreateInvitation();
  const cancel = useCancelInvitation();
  const [copied, setCopied] = useState(false);

  const code = myInvitation.data?.code;
  const error = create.error || cancel.error;

  const handleCopy = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API gagal (insecure context atau user reject permission).
      // Silent fail OK—code masih visible buat user copy manual.
    }
  };

  const handleCancel = () => {
    if (!window.confirm(t('couple.invite.cancel-confirm'))) return;
    cancel.mutate();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('couple.invite.title')}</CardTitle>
        <CardDescription>{t('couple.invite.description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {myInvitation.isLoading ? (
          <p className="text-sm text-muted-foreground text-center py-2">
            {t('common.loading')}
          </p>
        ) : code ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {t('couple.invite.your-code')}
            </p>
            <div className="flex items-center gap-3">
              <code
                className="flex-1 rounded-2xl bg-muted py-3 text-center font-mono text-2xl font-semibold tracking-[0.3em]"
                aria-label={t('couple.invite.code-a11y')}
              >
                {code}
              </code>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleCopy}
                aria-label={copied ? t('couple.invite.copied') : t('couple.invite.copy')}
              >
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">{t('couple.invite.expires')}</p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              disabled={cancel.isPending}
              className="w-full text-destructive hover:text-destructive"
            >
              {cancel.isPending ? t('couple.invite.cancelling') : t('couple.invite.cancel')}
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            onClick={() => create.mutate()}
            disabled={create.isPending}
            className="w-full"
          >
            {create.isPending
              ? t('couple.invite.creating')
              : t('couple.invite.create-button')}
          </Button>
        )}

        {error && (
          <p className="text-sm text-destructive" role="alert">
            {formatUserError(error, t('toast.error.generic'))}
          </p>
        )}
      </CardContent>
    </Card>
  );
};
