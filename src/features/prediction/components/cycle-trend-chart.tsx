import { useMemo } from 'react';
import { differenceInDays, format, parseISO } from 'date-fns';
import { enUS, id as idLocale } from 'date-fns/locale';
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
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
import { useCycles } from '@/features/cycles/hooks/use-cycles';
import { usePrediction } from '@/features/prediction/hooks/use-prediction';
import { useTranslation, type Locale } from '@/lib/i18n';

const dateLocales: Record<Locale, typeof enUS> = {
  id: idLocale,
  en: enUS,
};

interface ChartDatum {
  cycle: number;
  length: number;
  label: string;
}

// Cycle length time series. Reads cycles, sorts ascending, computes length
// between consecutive starts. Reference line at avg (per prediction). Hidden
// kalau <2 cycles.
export const CycleTrendChart = () => {
  const { t, locale } = useTranslation();
  const cycles = useCycles();
  const { prediction } = usePrediction();

  const data = useMemo<ChartDatum[]>(() => {
    if (!cycles.data) return [];
    const sorted = cycles.data
      .filter((c) => !c.deleted_at)
      .sort((a, b) => a.start_date.localeCompare(b.start_date));
    if (sorted.length < 2) return [];

    const result: ChartDatum[] = [];
    for (let i = 1; i < sorted.length; i++) {
      const length = differenceInDays(
        parseISO(sorted[i]!.start_date),
        parseISO(sorted[i - 1]!.start_date),
      );
      if (length < 14 || length > 90) continue; // sanity
      result.push({
        cycle: i,
        length,
        label: format(parseISO(sorted[i - 1]!.start_date), 'MMM yy', {
          locale: dateLocales[locale],
        }),
      });
    }
    // Last 6 max untuk chart readability
    return result.slice(-6);
  }, [cycles.data, locale]);

  if (data.length === 0) return null;

  const avgLength = prediction ? Math.round(prediction.avg_cycle_days) : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('chart.cycle-trend.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart
            data={data}
            margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              dataKey="label"
              fontSize={11}
              stroke="var(--muted-foreground)"
              tickLine={false}
            />
            <YAxis
              domain={['dataMin - 2', 'dataMax + 2']}
              fontSize={11}
              stroke="var(--muted-foreground)"
              tickLine={false}
              width={28}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--popover)',
                border: '1px solid var(--border)',
                borderRadius: '0.5rem',
                color: 'var(--popover-foreground)',
                fontSize: '0.75rem',
              }}
              labelStyle={{ color: 'var(--muted-foreground)' }}
              formatter={(value) => [
                `${String(value)} ${t('insights.days-suffix')}`,
                t('chart.cycle-trend.tooltip-length'),
              ]}
            />
            {avgLength !== null && (
              <ReferenceLine
                y={avgLength}
                stroke="var(--muted-foreground)"
                strokeDasharray="4 4"
                strokeOpacity={0.6}
                label={{
                  value: t('chart.cycle-trend.avg-line'),
                  fontSize: 10,
                  fill: 'var(--muted-foreground)',
                  position: 'right',
                }}
              />
            )}
            <Line
              type="monotone"
              dataKey="length"
              stroke="var(--period)"
              strokeWidth={2}
              dot={{ fill: 'var(--period)', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
