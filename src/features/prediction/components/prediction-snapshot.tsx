import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { usePrediction } from '@/features/prediction/hooks/use-prediction';
import { formatDate } from '@/lib/format-date';
import { useTranslation } from '@/lib/i18n';

// Convert Date → YYYY-MM-DD (local TZ).
const toIso = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
};

// Days from today (midnight local) to a future Date. Negative if past.
const daysUntil = (target: Date): number => {
  const now = new Date();
  const t0 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const t1 = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  return Math.round((t1.getTime() - t0.getTime()) / 86_400_000);
};

// Slim 1-line prediction summary buat home (Hari Ini tab). Detail full di /insights.
// Hidden ke empty state kalau prediction null (cycles < 2).
export const PredictionSnapshot = () => {
  const { t, locale } = useTranslation();
  const { prediction, isLoading } = usePrediction();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-4">
          <Skeleton className="h-5 w-3/4" />
        </CardContent>
      </Card>
    );
  }

  if (!prediction) {
    return (
      <Card>
        <CardContent className="py-4 flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {t('home.snapshot.no-data')}
          </p>
          <Link
            to="/insights"
            className="inline-flex items-center text-xs text-primary shrink-0"
            aria-label={t('home.snapshot.see-insights')}
          >
            <ChevronRight className="size-4" />
          </Link>
        </CardContent>
      </Card>
    );
  }

  const days = daysUntil(prediction.next_start);
  const dateStr = formatDate(toIso(prediction.next_start), locale);

  return (
    <Link to="/insights" className="block">
      <Card className="hover:bg-muted/30 transition-colors">
        <CardContent className="py-4 flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <p className="text-xs text-muted-foreground">
              {t('home.snapshot.next-period-in')}
            </p>
            <p className="text-base">
              <span className="text-2xl font-semibold tabular-nums text-period">
                {Math.max(days, 0)}
              </span>{' '}
              <span className="text-muted-foreground">
                {t('home.snapshot.days-suffix')}
              </span>{' '}
              <span className="text-xs text-muted-foreground">
                · {t('home.snapshot.starts-on')} {dateStr}
              </span>
            </p>
          </div>
          <ChevronRight className="size-4 text-muted-foreground shrink-0" />
        </CardContent>
      </Card>
    </Link>
  );
};
