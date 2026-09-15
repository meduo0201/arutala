import { PageShell } from '@/components/layout/page-shell';
import { CycleCalendar } from '@/features/calendar/components/cycle-calendar';
import { CycleList } from '@/features/cycles/components/cycle-list';
import { useTranslation } from '@/lib/i18n';

const CalendarPage = () => {
  const { t } = useTranslation();

  return (
    <PageShell>
      <header>
        <h1 className="page-heading text-[1.7rem]">
          {t('page.calendar.title')}
        </h1>
      </header>

      <CycleCalendar />
      <CycleList />
    </PageShell>
  );
};

export default CalendarPage;
