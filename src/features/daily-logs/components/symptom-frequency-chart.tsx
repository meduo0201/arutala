import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useDailyLogs } from '@/features/daily-logs/hooks/use-daily-logs';
import { useSymptomCatalog } from '@/features/daily-logs/hooks/use-catalogs';
import { getCatalogLabel } from '@/features/daily-logs/types';
import { useTranslation } from '@/lib/i18n';

const TOP_N = 8;

interface SymptomFreqDatum {
  key: string;
  label: string;
  count: number;
}

// Aggregate symptoms[] dari daily_logs (last 60 entries default), count
// occurrences. Top N most frequent shown as horizontal bar chart. Locale-aware
// labels with emoji prefix.
export const SymptomFrequencyChart = () => {
  const { t, locale } = useTranslation();
  const logs = useDailyLogs();
  const catalog = useSymptomCatalog();

  const data = useMemo<SymptomFreqDatum[]>(() => {
    if (!logs.data || !catalog.data) return [];
    const counts = new Map<string, number>();
    for (const log of logs.data) {
      for (const key of log.symptoms ?? []) {
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
    }

    const result: SymptomFreqDatum[] = [];
    for (const [key, count] of counts.entries()) {
      const symptom = catalog.data.find((s) => s.key === key);
      if (!symptom) continue;
      const label = `${symptom.emoji ?? ''} ${getCatalogLabel(symptom, locale)}`.trim();
      result.push({ key, label, count });
    }

    return result.sort((a, b) => b.count - a.count).slice(0, TOP_N);
  }, [logs.data, catalog.data, locale]);

  if (data.length === 0) return null;

  // Horizontal bar: each row = one symptom. Height scales with N.
  const chartHeight = data.length * 32 + 24;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('chart.symptom-freq.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 4, right: 24, left: 8, bottom: 0 }}
          >
            <XAxis
              type="number"
              hide
              domain={[0, 'dataMax']}
            />
            <YAxis
              type="category"
              dataKey="label"
              width={130}
              fontSize={12}
              stroke="var(--foreground)"
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--popover)',
                border: '1px solid var(--border)',
                borderRadius: '0.5rem',
                color: 'var(--popover-foreground)',
                fontSize: '0.75rem',
              }}
              cursor={{ fill: 'var(--muted)', opacity: 0.4 }}
              formatter={(value) => [
                `${String(value)}${t('chart.symptom-freq.count-suffix')}`,
                '',
              ]}
            />
            <Bar
              dataKey="count"
              fill="var(--period)"
              radius={[0, 4, 4, 0]}
              barSize={18}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
