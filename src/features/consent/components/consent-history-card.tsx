import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  consentMapByPurpose,
  useConsentState,
} from '@/features/consent/hooks/use-consent';
import { CONSENT_PURPOSES, type ConsentPurpose } from '@/features/consent/types';
import { formatDate } from '@/lib/format-date';
import { useTranslation, type MessageKey } from '@/lib/i18n';

const PURPOSE_LABEL_KEY: Record<ConsentPurpose, MessageKey> = {
  core_processing: 'privacy.consent-purpose.core_processing',
  cross_border_transfer: 'privacy.consent-purpose.cross_border_transfer',
  partner_sharing: 'privacy.consent-purpose.partner_sharing',
  sensitive_data_e2ee: 'privacy.consent-purpose.sensitive_data_e2ee',
};

// Read-only: show user's consent state per purpose. Used in PrivacyPage and
// (future) Settings privacy panel. Toggling consent done elsewhere — ini
// tampil status saja.
export const ConsentHistoryCard = () => {
  const { t, locale } = useTranslation();
  const consentQuery = useConsentState();

  if (consentQuery.isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {t('privacy.consent-history')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const map = consentMapByPurpose(consentQuery.data ?? []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {t('privacy.consent-history')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {CONSENT_PURPOSES.map((purpose) => {
          const state = map[purpose];
          const label = t(PURPOSE_LABEL_KEY[purpose]);
          if (!state) {
            return (
              <div
                key={purpose}
                className="flex items-center justify-between text-sm"
              >
                <span>{label}</span>
                <span className="text-xs text-muted-foreground italic">
                  {t('privacy.consent.never-set')}
                </span>
              </div>
            );
          }
          return (
            <div
              key={purpose}
              className="flex items-center justify-between text-sm gap-3"
            >
              <span className="flex-1">{label}</span>
              <span className="text-right shrink-0">
                <span
                  className={
                    state.granted
                      ? 'text-emerald-600 dark:text-emerald-400 font-medium'
                      : 'text-muted-foreground line-through'
                  }
                >
                  {state.granted
                    ? t('privacy.consent.granted')
                    : t('privacy.consent.withdrawn')}
                </span>
                <span className="block text-[10px] text-muted-foreground">
                  {t('privacy.consent.last-event')}{' '}
                  {formatDate(state.last_event_at.slice(0, 10), locale)}
                </span>
              </span>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
