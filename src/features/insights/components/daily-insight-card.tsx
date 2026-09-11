import { differenceInDays, parseISO } from 'date-fns';
import { motion, useReducedMotion } from 'motion/react';
import { Sparkles } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useCycles } from '@/features/cycles/hooks/use-cycles';
import { computePhase, type CyclePhase as WheelPhase } from '@/features/cycle-wheel/lib/wheel-math';
import { type CyclePhase } from '@/features/insights/api';
import { pickZhInsight } from '@/features/insights/zh-insights';
import { usePrediction } from '@/features/prediction/hooks/use-prediction';
import { todayIso } from '@/lib/format-date';
import { useTranslation } from '@/lib/i18n';

const PHASE_TO_INSIGHT: Record<WheelPhase, CyclePhase> = {
  period: 'period',
  follicular: 'follicular',
  fertile: 'fertile',
  ovulation: 'ovulation',
  luteal: 'luteal',
};

export const DailyInsightCard = () => {
  const { t } = useTranslation();
  const reduced = useReducedMotion();
  const cycles = useCycles();
  const { prediction } = usePrediction();

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

  const insight = pickZhInsight(phase, todayIso());

  return (
    <Card className="bg-gradient-to-br from-primary/5 via-background to-period/5 border-primary/20">
      <CardHeader className="flex-row items-start justify-between space-y-0 pb-2">
        <CardTitle className="text-base inline-flex items-center gap-2">
          <Sparkles className="size-4 text-primary" aria-hidden="true" />
          <motion.span
            key={insight.title}
            initial={reduced ? false : { opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            {insight.title}
          </motion.span>
        </CardTitle>
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium shrink-0">
          {insight.category}
        </span>
      </CardHeader>
      <CardContent className="pb-5">
        <motion.div
          key={`${insight.title}-body`}
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex items-start gap-3"
        >
          <span className="text-2xl leading-none shrink-0" aria-hidden="true">
            {insight.emoji}
          </span>
          <p className="text-sm text-foreground/90 leading-relaxed">
            {insight.body}
          </p>
        </motion.div>
        <p className="sr-only">{t('insights.daily.title')}</p>
      </CardContent>
    </Card>
  );
};
