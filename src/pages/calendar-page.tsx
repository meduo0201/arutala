import { PageShell } from '@/components/layout/page-shell';
import { CycleCalendar } from '@/features/calendar/components/cycle-calendar';
import { CycleList } from '@/features/cycles/components/cycle-list';
import { useTranslation } from '@/lib/i18n';

const CalendarPage = () => {
  const { t } = useTranslation();

  return (
    <PageShell>
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          {t('page.calendar.title')}
        </h1>
      </header>

      <CycleCalendar />
      <CycleList />
    </PageShell>
  );
};

export default CalendarPage;
