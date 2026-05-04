import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SymptomFrequencyChart } from '@/features/daily-logs/components/symptom-frequency-chart';
import { CycleTrendChart } from '@/features/prediction/components/cycle-trend-chart';
import { InsightsCard } from '@/features/prediction/components/insights-card';
import { PredictionCard } from '@/features/prediction/components/prediction-card';
import { useTranslation } from '@/lib/i18n';

// Insights tab. Retrospective + analytical view: prediction full, stats card,
// trend chart, symptom freq chart. Link out ke /logs (search/filter daily logs).
const InsightsPage = () => {
  const { t } = useTranslation();

  return (
    <main className="min-h-dvh bg-background text-foreground">
      <div className="max-w-md mx-auto px-4 py-6 pb-24 space-y-6">
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
          className="flex items-center justify-between rounded-md border border-border px-4 py-3 text-sm hover:bg-muted/50 transition-colors"
        >
          <span className="font-medium">{t('logs.view-all')}</span>
          <ChevronRight className="size-4 text-muted-foreground" />
        </Link>
      </div>
    </main>
  );
};

export default InsightsPage;
