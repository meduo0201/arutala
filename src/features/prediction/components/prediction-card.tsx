import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { usePrediction } from '@/features/prediction/hooks/use-prediction';
import { formatDate } from '@/lib/format-date';
import { useTranslation } from '@/lib/i18n';

// Convert Date → YYYY-MM-DD (local TZ) untuk pass ke formatDate.
const toIso = (d: Date): string => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

// Card display prediksi: next period start, ovulation, fertile window.
// Hidden kalau cycle history < 2 (insufficient data) — show empty state.
export const PredictionCard = () => {
  const { t, locale } = useTranslation();
  const { prediction, isLoading } = usePrediction();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-24" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-28" />
            </div>
          ))}
          <Skeleton className="h-3 w-full mt-3" />
        </CardContent>
      </Card>
    );
  }

  if (!prediction) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('prediction.title')}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {t('prediction.insufficient-data')}
        </CardContent>
      </Card>
    );
  }

  const avgRounded = Math.round(prediction.avg_cycle_days);
  const stdRounded = Math.round(prediction.std_dev_days);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('prediction.title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-muted-foreground flex items-center gap-2">
            <span className="size-2 rounded-full bg-period inline-block" />
            {t('prediction.next-start')}
          </span>
          <span className="font-medium">
            {formatDate(toIso(prediction.next_start), locale)}
          </span>
        </div>
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-muted-foreground flex items-center gap-2">
            <span className="size-2 rounded-full bg-ovulation inline-block" />
            {t('prediction.ovulation')}
          </span>
          <span className="font-medium">
            {formatDate(toIso(prediction.ovulation), locale)}
          </span>
        </div>
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-muted-foreground flex items-center gap-2">
            <span className="size-2 rounded-full bg-fertile inline-block" />
            {t('prediction.fertile')}
          </span>
          <span className="font-medium text-right">
            {formatDate(toIso(prediction.fertile_start), locale)}
            {' – '}
            {formatDate(toIso(prediction.fertile_end), locale)}
          </span>
        </div>

        <p className="text-xs text-muted-foreground pt-3 border-t">
          {t('prediction.avg-cycle')}: {avgRounded} {t('prediction.days-suffix')}
          {stdRounded > 0 && ` ${t('prediction.confidence-prefix')}${stdRounded}`}
          {' · '}
          {t('prediction.based-on')} {prediction.cycle_count}{' '}
          {t('prediction.cycles-suffix')}
        </p>
      </CardContent>
    </Card>
  );
};
