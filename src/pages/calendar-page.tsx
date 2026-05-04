import { CycleCalendar } from '@/features/calendar/components/cycle-calendar';
import { CycleList } from '@/features/cycles/components/cycle-list';
import { useTranslation } from '@/lib/i18n';

// Kalender tab. Browse mode: month grid + tap-day-to-edit (DayDetailSheet
// dirender oleh CycleCalendar internal) + history list (CycleList).
const CalendarPage = () => {
  const { t } = useTranslation();

  return (
    <main className="min-h-dvh bg-background text-foreground">
      <div className="max-w-md mx-auto px-4 py-6 pb-24 space-y-6">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t('page.calendar.title')}
          </h1>
        </header>

        <CycleCalendar />
        <CycleList />
      </div>
    </main>
  );
};

export default CalendarPage;
