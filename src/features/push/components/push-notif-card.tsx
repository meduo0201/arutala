import { Bell, BellOff, BellRing } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  usePushSubscribe,
  usePushSubscriptionState,
  usePushUnsubscribe,
  type PushSubscriptionState,
} from '@/features/push/hooks/use-push';
import { useTranslation, type MessageKey } from '@/lib/i18n';
import { formatUserError } from '@/lib/user-error';

const STATUS_LABEL: Record<Exclude<PushSubscriptionState, 'unknown'>, MessageKey> = {
  subscribed: 'push.status.subscribed',
  'not-subscribed': 'push.status.not-subscribed',
  'permission-denied': 'push.status.permission-denied',
  unsupported: 'push.status.unsupported',
  'no-key': 'push.status.no-key',
};

export const PushNotifCard = () => {
  const { t } = useTranslation();
  const { state, vapidPublicKey, setState } = usePushSubscriptionState();
  const subscribe = usePushSubscribe(vapidPublicKey);
  const unsubscribe = usePushUnsubscribe();

  if (state === 'unknown') {
    // First render — hide briefly while detecting (avoid flicker)
    return null;
  }

  const handleEnable = () => {
    subscribe.mutate(undefined, {
      onSuccess: () => setState('subscribed'),
      onError: () => {
        // Permission denied → reflect status
        if ('Notification' in window && Notification.permission === 'denied') {
          setState('permission-denied');
        }
      },
    });
  };

  const handleDisable = () => {
    unsubscribe.mutate(undefined, {
      onSuccess: () => setState('not-subscribed'),
    });
  };

  const Icon =
    state === 'subscribed' ? BellRing :
    state === 'permission-denied' ? BellOff :
    Bell;
  const iconColor =
    state === 'subscribed' ? 'text-emerald-600 dark:text-emerald-400' :
    state === 'permission-denied' ? 'text-destructive' :
    'text-muted-foreground';

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base inline-flex items-center gap-2">
          <Icon className={`size-4 ${iconColor}`} />
          {t('push.title')}
        </CardTitle>
        <span className={`text-xs font-medium ${iconColor}`}>
          {t(STATUS_LABEL[state])}
        </span>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{t('push.description')}</p>

        {state === 'subscribed' && (
          <Button
            type="button"
            variant="outline"
            onClick={handleDisable}
            disabled={unsubscribe.isPending}
            className="w-full"
          >
            {t('push.button.disable')}
          </Button>
        )}

        {state === 'not-subscribed' && (
          <Button
            type="button"
            onClick={handleEnable}
            disabled={subscribe.isPending}
            className="w-full"
          >
            {subscribe.isPending
              ? t('push.button.enabling')
              : t('push.button.enable')}
          </Button>
        )}

        {(subscribe.error || unsubscribe.error) && (
          <p className="text-sm text-destructive" role="alert">
            {formatUserError(
              subscribe.error || unsubscribe.error,
              t('toast.error.generic'),
            )}
          </p>
        )}

        {state === 'permission-denied' && (
          <p className="text-xs text-muted-foreground">
            {t('push.permission-denied.help')}
          </p>
        )}

        {state === 'no-key' && (
          <p className="text-xs text-muted-foreground italic">
            {t('push.no-key.help')}
          </p>
        )}

        <p className="text-xs text-muted-foreground italic pt-2 border-t border-border">
          {t('push.privacy-note')}
        </p>
      </CardContent>
    </Card>
  );
};
