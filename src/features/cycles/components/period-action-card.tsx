import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EditCycleDialog } from '@/features/cycles/components/edit-cycle-dialog';
import { useActiveCycle } from '@/features/cycles/hooks/use-cycles';
import {
  useEndPeriod,
  useStartPeriod,
} from '@/features/cycles/hooks/use-cycle-mutations';
import { daysBetween, formatDate, todayIso } from '@/lib/format-date';
import { useTranslation } from '@/lib/i18n';

// Big one-tap card—primary interaction Phase 1.
// - Idle (no active cycle): "Period Mulai Hari Ini" + small "atau backdate" link
// - Active: show day count + "Period Selesai"
//
// Backdate link → EditCycleDialog mode "add" (custom dates, optional notes).
export const PeriodActionCard = () => {
  const { t, locale } = useTranslation();
  const activeCycle = useActiveCycle();
  const startPeriod = useStartPeriod();
  const endPeriod = useEndPeriod();
  const [backdateOpen, setBackdateOpen] = useState(false);

  if (activeCycle.isLoading) {
    return (
      <Card>
        <CardHeader className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-56" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-14 w-full rounded-md" />
        </CardContent>
      </Card>
    );
  }

  const today = todayIso();

  // Active period state
  if (activeCycle.data) {
    const cycle = activeCycle.data;
    const dayN = daysBetween(cycle.start_date, today);

    return (
      <Card className="border-period/40 bg-period/5">
        <CardHeader>
          <CardTitle className="text-period">{t('cycles.active.title')}</CardTitle>
          <CardDescription>
            {t('cycles.active.since')} {formatDate(cycle.start_date, locale)}
            {' · '}
            <span className="font-medium text-foreground">
              {t('cycles.active.day-prefix')}
              {dayN}
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full h-12 border-period text-period hover:bg-period/10 hover:text-period transition-transform active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100"
            disabled={endPeriod.isPending}
            onClick={() =>
              endPeriod.mutate({ cycle_id: cycle.id, end_date: today })
            }
          >
            {endPeriod.isPending
              ? t('cycles.action.ending')
              : t('cycles.action.end-today')}
          </Button>
          {endPeriod.error && (
            <p className="text-sm text-destructive" role="alert">
              {endPeriod.error.message}
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  // Idle state
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t('cycles.idle.title')}</CardTitle>
          <CardDescription>{t('cycles.idle.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            type="button"
            size="lg"
            className="w-full h-14 text-base bg-period hover:bg-period/90 text-white transition-transform active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100"
            disabled={startPeriod.isPending}
            onClick={() => startPeriod.mutate({ start_date: today })}
          >
            {startPeriod.isPending
              ? t('cycles.action.starting')
              : t('cycles.action.start-today')}
          </Button>
          {startPeriod.error && (
            <p className="text-sm text-destructive" role="alert">
              {startPeriod.error.message}
            </p>
          )}
          <button
            type="button"
            onClick={() => setBackdateOpen(true)}
            className="w-full text-sm text-muted-foreground hover:text-foreground underline underline-offset-4"
          >
            {t('cycles.action.backdate')}
          </button>
        </CardContent>
      </Card>

      <EditCycleDialog open={backdateOpen} onOpenChange={setBackdateOpen} />
    </>
  );
};
