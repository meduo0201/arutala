import { differenceInDays, parseISO } from 'date-fns';
import { motion, useReducedMotion } from 'motion/react';
import { Sparkles } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useCycles } from '@/features/cycles/hooks/use-cycles';
import { computePhase, type CyclePhase as WheelPhase } from '@/features/cycle-wheel/lib/wheel-math';
import { useDailyInsight } from '@/features/insights/hooks/use-daily-insight';
import { type CyclePhase } from '@/features/insights/api';
import { usePrediction } from '@/features/prediction/hooks/use-prediction';
import { todayIso } from '@/lib/format-date';
import { useTranslation } from '@/lib/i18n';

const CATEGORY_LABEL: Record<string, string> = {
  fact: 'Fakta',
  tip: 'Tips',
  support: 'Support',
  couple: 'Pasangan',
  trivia: 'Trivia',
  lifestyle: 'Lifestyle',
};

const PHASE_TO_INSIGHT: Record<WheelPhase, CyclePhase> = {
  period: 'period',
  follicular: 'follicular',
  fertile: 'fertile',
  ovulation: 'ovulation',
  luteal: 'luteal',
};

// Daily insight card — show 1 entry from catalog 383+ kategorial per phase.
// Deterministic per (user, date, phase) → fresh content tiap hari, konsisten
// kalau user open multiple times same day.
//
// Positioned di Home antara TodayLogCard dan PredictionSnapshot.
export const DailyInsightCard = () => {
  const { t: _t } = useTranslation();
  const reduced = useReducedMotion();
  const cycles = useCycles();
  const { prediction } = usePrediction();

  // Compute current phase. Same logic as CycleWheel.
  let phase: CyclePhase = 'any';
  const lastCycle = cycles.data?.[0];
  if (lastCycle) {
    const cycleLength = prediction?.avg_cycle_days
      ? Math.round(prediction.avg_cycle_days)
      : 28;
    const periodLength = lastCycle.end_date
      ? differenceInDays(parseISO(lastCycle.end_date), parseISO(lastCycle.start_date)) + 1
      : 5;
    const ovulationDay = cycleLength - 14;
    const today = todayIso();
    const daysSinceStart = differenceInDays(parseISO(today), parseISO(lastCycle.start_date));
    const currentDay = ((daysSinceStart % cycleLength) + cycleLength) % cycleLength + 1;
    phase = PHASE_TO_INSIGHT[computePhase(currentDay, periodLength, ovulationDay)];
  }

  const insight = useDailyInsight(phase);

  if (insight.isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>
    );
  }

  if (!insight.data) return null;

  return (
    <Card className="bg-gradient-to-br from-primary/5 via-background to-period/5 border-primary/20">
      <CardHeader className="flex-row items-start justify-between space-y-0 pb-2">
        <CardTitle className="text-base inline-flex items-center gap-2">
          <Sparkles className="size-4 text-primary" aria-hidden="true" />
          <motion.span
            key={insight.data.id}
            initial={reduced ? false : { opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            {insight.data.title_id}
          </motion.span>
        </CardTitle>
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium shrink-0">
          {CATEGORY_LABEL[insight.data.category] ?? insight.data.category}
        </span>
      </CardHeader>
      <CardContent className="pb-5">
        <motion.div
          key={`${insight.data.id}-body`}
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex items-start gap-3"
        >
          {insight.data.emoji && (
            <span className="text-2xl leading-none shrink-0" aria-hidden="true">
              {insight.data.emoji}
            </span>
          )}
          <p className="text-sm text-foreground/90 leading-relaxed">
            {insight.data.body_id}
          </p>
        </motion.div>
      </CardContent>
    </Card>
  );
};
