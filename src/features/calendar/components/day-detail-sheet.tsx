import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { EditCycleDialog } from '@/features/cycles/components/edit-cycle-dialog';
import type { CycleRow } from '@/features/cycles/types';
import {
  findCycleForDate,
  isoDate,
} from '@/features/calendar/lib/cycle-modifiers';
import { DailyLogForm } from '@/features/daily-logs/components/daily-log-form';
import { formatDate, todayIso } from '@/lib/format-date';
import { useTranslation } from '@/lib/i18n';

interface DayDetailSheetProps {
  date: Date | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cycles: CycleRow[];
}

// Bottom sheet pas user tap tanggal di calendar grid.
// Phase 2: 2 sections — Cycle (status + edit/start-here action) + Daily Log
// (full form: flow, symptoms, moods, notes).
//
// Sheet scrollable (overflow-y-auto) supaya muat semua section di mobile.
export const DayDetailSheet = ({
  date,
  open,
  onOpenChange,
  cycles,
}: DayDetailSheetProps) => {
  const { t, locale } = useTranslation();
  const [editCycleOpen, setEditCycleOpen] = useState(false);

  if (!date) return null;

  const dateStr = isoDate(date);
  const cycle = findCycleForDate(cycles, date);
  const isPeriodDay = !!cycle;
  const isToday = dateStr === todayIso();

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className="rounded-t-xl max-h-[92dvh] overflow-y-auto px-0"
        >
          <SheetHeader className="text-left pb-2">
            <SheetTitle>
              {formatDate(dateStr, locale, t('calendar.day.full-format'))}
            </SheetTitle>
            <SheetDescription>
              {isPeriodDay
                ? t('calendar.day.period')
                : t('calendar.day.no-period')}
              {isToday && ` · ${t('calendar.day.today-suffix')}`}
            </SheetDescription>
          </SheetHeader>

          <div className="px-4 space-y-4">
            {/* Cycle status section */}
            <section className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">
                {t('daily-log.section.cycle')}
              </h3>
              {isPeriodDay ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditCycleOpen(true)}
                  className="w-full"
                >
                  {t('calendar.day.edit-cycle')}
                </Button>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setEditCycleOpen(true)}
                  className="w-full bg-period hover:bg-period/90 text-white"
                >
                  {t('calendar.day.start-here')}
                </Button>
              )}
            </section>

            <Separator />

            {/* Daily log form */}
            <section className="pb-6">
              <DailyLogForm
                logDate={dateStr}
                cycleId={cycle?.id ?? null}
                onSaved={() => onOpenChange(false)}
              />
            </section>
          </div>
        </SheetContent>
      </Sheet>

      <EditCycleDialog
        open={editCycleOpen}
        onOpenChange={(o) => {
          setEditCycleOpen(o);
          if (!o) onOpenChange(false);
        }}
        cycle={cycle ?? undefined}
        defaultStartDate={isPeriodDay ? undefined : dateStr}
      />
    </>
  );
};
