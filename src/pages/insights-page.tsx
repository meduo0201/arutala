import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageShell } from '@/components/layout/page-shell';
import { SymptomFrequencyChart } from '@/features/daily-logs/components/symptom-frequency-chart';
import { CycleTrendChart } from '@/features/prediction/components/cycle-trend-chart';
import { InsightsCard } from '@/features/prediction/components/insights-card';
import { PredictionCard } from '@/features/prediction/components/prediction-card';
import { useTranslation } from '@/lib/i18n';

const InsightsPage = () => {
  const { t } = useTranslation();

  return (
    <PageShell>
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          {t('page.insights.title')}
        </h1>
      </header>

      <PredictionCard />
      <InsightsCard />
      <CycleTrendChart />
      <SymptomFrequencyChart />

      <Link
        to="/logs"
        className="flex min-h-12 items-center justify-between rounded-md border border-border px-4 py-3 text-sm hover:bg-muted/50 transition-colors"
      >
        <span className="font-medium">{t('logs.view-all')}</span>
        <ChevronRight className="size-4 text-muted-foreground" />
      </Link>
    </PageShell>
  );
};

export default InsightsPage;
