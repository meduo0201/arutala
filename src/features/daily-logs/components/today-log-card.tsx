import { useMemo, useState } from 'react';
import { Droplet, NotebookPen, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DayDetailSheet } from '@/features/calendar/components/day-detail-sheet';
import { useCycles } from '@/features/cycles/hooks/use-cycles';
import { useDailyLogByDate } from '@/features/daily-logs/hooks/use-daily-logs';
import { QueryError } from '@/components/query-error';
import { todayIso } from '@/lib/format-date';
import { useTranslation } from '@/lib/i18n';

// Quick-log card di Home (Hari Ini tab). Tap → opens DayDetailSheet
// pre-loaded dengan tanggal hari ini (reuses calendar's sheet, no duplicate).
//
// Status visualization:
//   - Belum ada log → empty state + "Catat sekarang" button
//   - Ada log → ringkas (flow + #symptoms + #moods + has notes) + "Edit" button
//
// User feedback (2026-05-04): logging via Calendar tab terlalu banyak
// klik untuk daily action. Card ini bring action ke tab utama.
export const TodayLogCard = () => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const today = todayIso();
  const log = useDailyLogByDate(today);
  const cycles = useCycles();
  // Memoize the Date object so DayDetailSheet's internal useEffect (which keys
  // off `date`) doesn't fire on every render. Recompute hanya saat tanggal
  // ISO berubah (lewat tengah malam saat tab tetap terbuka — ke-handle by
  // re-render via React Query refetch atau manual reload).
  const todayDate = useMemo(() => new Date(today + 'T00:00:00'), [today]);

  if (log.isError) {
    return <QueryError error={log.error} onRetry={() => void log.refetch()} />;
  }

  if (log.isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('home.today-log.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  const hasLog = !!log.data;
  const symptomsCount = log.data?.symptoms?.length ?? 0;
  const moodsCount = log.data?.moods?.length ?? 0;
  const hasNotes = !!log.data?.notes?.trim();
  const flowIntensity = log.data?.flow_intensity ?? null;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('home.today-log.title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {hasLog ? (
            <div className="flex flex-wrap gap-2 text-xs">
              {flowIntensity !== null && flowIntensity > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-period/10 px-2 py-1 text-period">
                  <Droplet className="size-3 fill-period" />
                  {t('home.today-log.has-flow')}
                </span>
              )}
              {symptomsCount > 0 && (
                <span className="inline-flex items-center rounded-full bg-muted px-2 py-1">
                  {symptomsCount} {t('home.today-log.symptoms-count')}
                </span>
              )}
              {moodsCount > 0 && (
                <span className="inline-flex items-center rounded-full bg-muted px-2 py-1">
                  {moodsCount} {t('home.today-log.moods-count')}
                </span>
              )}
              {hasNotes && (
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1">
                  <NotebookPen className="size-3" />
                  {t('home.today-log.has-notes')}
                </span>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {t('home.today-log.empty')}
            </p>
          )}

          <Button
            type="button"
            variant={hasLog ? 'outline' : 'default'}
            onClick={() => setOpen(true)}
            className="w-full"
          >
            {!hasLog && <PlusCircle className="size-4 mr-2" />}
            {hasLog
              ? t('home.today-log.button.edit')
              : t('home.today-log.button.add')}
          </Button>
        </CardContent>
      </Card>

      <DayDetailSheet
        date={open ? todayDate : undefined}
        open={open}
        onOpenChange={setOpen}
        cycles={cycles.data ?? []}
      />
    </>
  );
};
