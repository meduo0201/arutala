import { useState } from 'react';
import { zhCN } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { DayDetailSheet } from '@/features/calendar/components/day-detail-sheet';
import { computePeriodDays } from '@/features/calendar/lib/cycle-modifiers';
import { useCycles } from '@/features/cycles/hooks/use-cycles';
import { usePrediction } from '@/features/prediction/hooks/use-prediction';
import { getFertileDays } from '@/features/prediction/lib/predict';
import { useTranslation } from '@/lib/i18n';

// Month grid calendar dengan modifiers:
// - period (actual): bg-period rose
// - fertile (predicted): bg-fertile mint, soft
// - ovulation (predicted): bg-ovulation, single day
// - next-period (predicted): border ring (predicted next start)
//
// Tap date → DayDetailSheet bottom sheet.
export const CycleCalendar = () => {
  const { t } = useTranslation();
  const cycles = useCycles();
  const { prediction } = usePrediction();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [sheetOpen, setSheetOpen] = useState(false);

  const periodDays = cycles.data ? computePeriodDays(cycles.data) : [];
  const fertileDays = prediction ? getFertileDays(prediction) : [];
  const ovulationDays = prediction ? [prediction.ovulation] : [];
  const nextPeriodDays = prediction ? [prediction.next_start] : [];

  const handleSelect = (date: Date | undefined) => {
    if (!date) return;
    setSelectedDate(date);
    setSheetOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('calendar.title')}</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center pb-3">
          <Calendar
            mode="single"
            locale={zhCN}
            selected={selectedDate}
            onSelect={handleSelect}
            modifiers={{
              period: periodDays,
              fertilePred: fertileDays,
              ovulationPred: ovulationDays,
              nextPeriodPred: nextPeriodDays,
            }}
            modifiersClassNames={{
              period:
                'bg-period text-white hover:bg-period/90 hover:text-white aria-selected:bg-period aria-selected:text-white rounded-full',
              fertilePred:
                'bg-fertile/30 text-foreground hover:bg-fertile/40 rounded-full',
              ovulationPred:
                'bg-ovulation text-white hover:bg-ovulation/90 hover:text-white rounded-full',
              nextPeriodPred:
                'border-2 border-period text-period hover:bg-period/10 rounded-full',
            }}
            className="rounded-md"
          />
        </CardContent>
      </Card>

      <DayDetailSheet
        date={selectedDate}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        cycles={cycles.data ?? []}
      />
    </>
  );
};
