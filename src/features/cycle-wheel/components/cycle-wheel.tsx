import { differenceInDays, parseISO } from 'date-fns';
import { motion, useReducedMotion } from 'motion/react';
import { Card, CardContent } from '@/components/ui/card';
import { useCycles } from '@/features/cycles/hooks/use-cycles';
import { usePrediction } from '@/features/prediction/hooks/use-prediction';
import {
  computePhase,
  dayToAngle,
  describeArc,
  polarToCartesian,
  type CyclePhase,
} from '@/features/cycle-wheel/lib/wheel-math';
import { QueryError } from '@/components/query-error';
import { todayIso } from '@/lib/format-date';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';

// Visual hook centerpiece (research bilang most impactful UI element).
// SVG circular wheel showing 5 phases as colored arcs + indicator dot at current day + center text dengan day count + phase name.
//
// Math:
// - cycle_length: dari prediction.avg_cycle_days (rounded), default 28 kalau insufficient data
// - period_length: end_date - start_date (last completed cycle), default 5
// - ovulation_day: cycle_length - 14 (luteal phase ~14 days, biologically constant)
// - current_day: (today - last_period_start) modulo cycle_length, 1-based
//
// All dimensions di viewBox 280x280—scale via CSS.

const SIZE = 280;
const CENTER = 140;
const RADIUS = 110;
const STROKE = 22;

const PHASE_KEYS: Record<CyclePhase, `wheel.phase.${CyclePhase}`> = {
  period: 'wheel.phase.period',
  follicular: 'wheel.phase.follicular',
  fertile: 'wheel.phase.fertile',
  ovulation: 'wheel.phase.ovulation',
  luteal: 'wheel.phase.luteal',
};

// Animation timing — Material 3 emphasized easing untuk hero reveal.
const ARC_DRAW_DURATION = 0.8;
const TEXT_DELAY = 0.5;
const INDICATOR_DELAY = 0.7;

export const CycleWheel = () => {
  const { t } = useTranslation();
  const cycles = useCycles();
  const { prediction } = usePrediction();
  const reduced = useReducedMotion();

  if (cycles.isError) {
    return <QueryError error={cycles.error} onRetry={() => void cycles.refetch()} />;
  }

  if (cycles.isLoading) {
    return (
      <Card>
        <CardContent className="py-8 flex justify-center">
          <div className="size-[260px] rounded-full bg-muted animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  const lastCycle = cycles.data?.[0];

  if (!lastCycle) {
    return (
      <Card>
        <CardContent className="py-10 text-center space-y-3">
          <motion.div
            className="text-5xl"
            initial={reduced ? false : { scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              type: 'spring',
              stiffness: 260,
              damping: 18,
              delay: reduced ? 0 : 0.1,
            }}
            aria-hidden="true"
          >
            🌸
          </motion.div>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            {t('wheel.empty')}
          </p>
        </CardContent>
      </Card>
    );
  }

  // Compute key cycle params
  const today = todayIso();
  const cycleLength = prediction?.avg_cycle_days
    ? Math.round(prediction.avg_cycle_days)
    : 28;
  const periodLength = lastCycle.end_date
    ? differenceInDays(parseISO(lastCycle.end_date), parseISO(lastCycle.start_date)) + 1
    : 5;
  const ovulationDay = cycleLength - 14;
  const fertileStart = Math.max(1, ovulationDay - 5);
  const fertileEnd = ovulationDay + 1;

  const daysSinceStart = differenceInDays(parseISO(today), parseISO(lastCycle.start_date));
  // 1-based day in cycle, modulo handle past predicted next start (overflow into "next cycle" estimate)
  const currentDay = ((daysSinceStart % cycleLength) + cycleLength) % cycleLength + 1;

  const phase = computePhase(currentDay, periodLength, ovulationDay);

  // Compute arcs (small offset 0.5 for visual continuity at boundaries)
  const periodEnd = dayToAngle(periodLength + 1, cycleLength);
  const fertileStartAngle = dayToAngle(fertileStart, cycleLength);
  const fertileEndAngle = dayToAngle(fertileEnd + 1, cycleLength);
  const ovulationStartAngle = dayToAngle(ovulationDay, cycleLength);
  const ovulationEndAngle = dayToAngle(ovulationDay + 1, cycleLength);
  const lutealStartAngle = dayToAngle(fertileEnd + 1, cycleLength);

  const periodArc = describeArc(CENTER, CENTER, RADIUS, 0, periodEnd);
  const follicularArc = describeArc(
    CENTER,
    CENTER,
    RADIUS,
    periodEnd,
    fertileStartAngle,
  );
  const fertileArc = describeArc(
    CENTER,
    CENTER,
    RADIUS,
    fertileStartAngle,
    fertileEndAngle,
  );
  const ovulationArc = describeArc(
    CENTER,
    CENTER,
    RADIUS,
    ovulationStartAngle,
    ovulationEndAngle,
  );
  const lutealArc = describeArc(CENTER, CENTER, RADIUS, lutealStartAngle, 360);

  // Indicator dot at current day position
  const indicatorAngle = dayToAngle(currentDay, cycleLength);
  const indicator = polarToCartesian(CENTER, CENTER, RADIUS, indicatorAngle);

  return (
    <Card>
      <CardContent className="py-6">
        <div className="flex justify-center">
          <svg
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            className="w-full max-w-[280px] aspect-square"
            role="img"
            aria-label={t('calendar.a11y.day')
              .replace('{day}', String(currentDay))
              .replace('{total}', String(cycleLength))
              .replace('{phase}', t(PHASE_KEYS[phase]))}
          >
            {/* Phase arcs — stroke-dasharray reveal animation. Each arc draws
                from start to end via animating pathLength from 0 to 1. */}
            <motion.path
              d={lutealArc}
              fill="none"
              stroke="var(--luteal)"
              strokeWidth={STROKE}
              initial={{ pathLength: reduced ? 1 : 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: reduced ? 0 : ARC_DRAW_DURATION, ease: [0.2, 0, 0, 1] }}
            />
            <motion.path
              d={follicularArc}
              fill="none"
              stroke="var(--follicular)"
              strokeWidth={STROKE}
              initial={{ pathLength: reduced ? 1 : 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: reduced ? 0 : ARC_DRAW_DURATION, ease: [0.2, 0, 0, 1] }}
            />
            <motion.path
              d={fertileArc}
              fill="none"
              stroke="var(--fertile)"
              strokeWidth={STROKE}
              initial={{ pathLength: reduced ? 1 : 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: reduced ? 0 : ARC_DRAW_DURATION, ease: [0.2, 0, 0, 1] }}
            />
            <motion.path
              d={ovulationArc}
              fill="none"
              stroke="var(--ovulation)"
              strokeWidth={STROKE}
              initial={{ pathLength: reduced ? 1 : 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: reduced ? 0 : ARC_DRAW_DURATION, ease: [0.2, 0, 0, 1] }}
            />
            <motion.path
              d={periodArc}
              fill="none"
              stroke="var(--period)"
              strokeWidth={STROKE}
              initial={{ pathLength: reduced ? 1 : 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: reduced ? 0 : ARC_DRAW_DURATION, ease: [0.2, 0, 0, 1] }}
            />

            {/* Indicator dot — subtle pulse saat user di fertile/ovulation phase.
                Pulse via scale + opacity, periodic loop. Reduced-motion: static. */}
            <motion.circle
              cx={indicator.x}
              cy={indicator.y}
              r="9"
              fill="var(--primary)"
              stroke="var(--background)"
              strokeWidth="3"
              className="drop-shadow-md"
              initial={{ scale: reduced ? 1 : 0, opacity: reduced ? 1 : 0 }}
              animate={
                reduced
                  ? { scale: 1, opacity: 1 }
                  : phase === 'fertile' || phase === 'ovulation'
                  ? {
                      scale: [1, 1.15, 1],
                      opacity: 1,
                    }
                  : { scale: 1, opacity: 1 }
              }
              transition={{
                delay: reduced ? 0 : INDICATOR_DELAY,
                duration: reduced ? 0 : phase === 'fertile' || phase === 'ovulation' ? 1.6 : 0.4,
                repeat: phase === 'fertile' || phase === 'ovulation' ? Infinity : 0,
                ease: 'easeInOut',
              }}
              style={{ transformOrigin: `${indicator.x}px ${indicator.y}px` }}
            />

            {/* Center text — fade in setelah arcs draw */}
            <motion.text
              x={CENTER}
              y={CENTER - 18}
              textAnchor="middle"
              fontSize="12"
              fill="currentColor"
              className="fill-muted-foreground"
              initial={{ opacity: reduced ? 1 : 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: reduced ? 0 : TEXT_DELAY, duration: 0.4 }}
            >
              {t('wheel.day-prefix')}
            </motion.text>
            <motion.text
              x={CENTER}
              y={CENTER + 12}
              textAnchor="middle"
              fontSize="40"
              fontWeight="600"
              fill="currentColor"
              className="fill-foreground"
              initial={{ opacity: reduced ? 1 : 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: reduced ? 0 : TEXT_DELAY, duration: 0.4 }}
            >
              {currentDay}
            </motion.text>
            <motion.text
              x={CENTER}
              y={CENTER + 32}
              textAnchor="middle"
              fontSize="11"
              fill="currentColor"
              className="fill-muted-foreground"
              initial={{ opacity: reduced ? 1 : 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: reduced ? 0 : TEXT_DELAY, duration: 0.4 }}
            >
              {t('wheel.of')} {cycleLength}
            </motion.text>
          </svg>
        </div>

        {/* Phase label below */}
        <p
          className={cn(
            'text-center text-sm font-medium mt-3',
            phase === 'period' && 'text-period',
            phase === 'fertile' && 'text-fertile',
            phase === 'ovulation' && 'text-ovulation',
            phase === 'luteal' && 'text-luteal',
            phase === 'follicular' && 'text-follicular',
          )}
        >
          {t(PHASE_KEYS[phase])}
        </p>
      </CardContent>
    </Card>
  );
};
