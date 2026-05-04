import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { usePrediction } from '@/features/prediction/hooks/use-prediction';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';

// Insights = aggregate stats dari prediction. Hidden kalau insufficient data
// (≥2 cycles needed). Regular/irregular threshold per medical convention:
// std_dev <= 7 hari = teratur. Bukan medical advice—just informational.
const REGULAR_THRESHOLD_DAYS = 7;

export const InsightsCard = () => {
  const { t } = useTranslation();
  const { prediction } = usePrediction();

  if (!prediction) return null;

  const avg = Math.round(prediction.avg_cycle_days);
  const std = Math.round(prediction.std_dev_days);
  const isRegular = prediction.std_dev_days <= REGULAR_THRESHOLD_DAYS;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('insights.title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-0.5">
            <p className="text-xs text-muted-foreground">{t('insights.avg-cycle')}</p>
            <p className="text-2xl font-semibold tabular-nums">
              {avg}
              <span className="text-sm text-muted-foreground ml-1 font-normal">
                {t('insights.days-suffix')}
              </span>
            </p>
          </div>
          <div className="space-y-0.5">
            <p className="text-xs text-muted-foreground">
              {t('insights.variability')}
            </p>
            <p className="text-2xl font-semibold tabular-nums">
              ±{std}
              <span className="text-sm text-muted-foreground ml-1 font-normal">
                {t('insights.days-suffix')}
              </span>
            </p>
          </div>
        </div>

        <div className="pt-3 border-t border-border space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {t('insights.regularity')}
            </span>
            <span
              className={cn(
                'text-sm font-medium',
                isRegular ? 'text-fertile' : 'text-accent',
              )}
            >
              {isRegular ? t('insights.regular') : t('insights.irregular')}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {isRegular ? t('insights.regular-hint') : t('insights.irregular-hint')}
          </p>
        </div>

        <p className="text-xs text-muted-foreground pt-1">
          {t('prediction.based-on')} {prediction.cycle_count}{' '}
          {t('prediction.cycles-suffix')}
        </p>
      </CardContent>
    </Card>
  );
};
