import { addDays, differenceInDays, parseISO } from 'date-fns';
import type { CycleRow } from '@/features/cycles/types';

// =============================================================================
// Cycle prediction — ACOG-aligned scientific method
// =============================================================================
// References:
//   - ACOG (American College of Obstetricians and Gynecologists) Committee
//     Opinion 651 (2015): Menstruation in girls and adolescents.
//     https://www.acog.org/clinical/clinical-guidance/committee-opinion/articles/2015/12
//   - Bull et al. (2019), npj Digital Medicine: "Real-world menstrual cycle
//     characteristics of more than 600,000 menstrual cycles" — population avg
//     29.3 days, not the textbook 28.
//   - Knaus-Ogino calendar method (1924 / 1932) — luteal phase ~14 days
//     biologically constant; ovulation = cycle_length - 14.
//   - Wilcox et al. (1995) NEJM: "Timing of sexual intercourse in relation
//     to ovulation" — fertile window = ovulation -5 to +1 day (sperm survive
//     5d, egg viable 24h).
//
// Cycle classification (ACOG 651):
//   - Normal adult: 21-35 days
//   - Normal teen (≤19yo): 21-45 days (variability higher in early years)
//   - Polymenorrhea: <21 days (frequent)
//   - Oligomenorrhea: >35 days (infrequent)
//   - Irregular: std_dev > 7 days across cycles
//
// Confidence interval:
//   - High confidence: cycle_count ≥ 6 AND std_dev ≤ 4 days
//   - Medium: cycle_count ≥ 3 AND std_dev ≤ 7 days
//   - Low: irregular (std_dev > 7) atau cycles < 3
//
// Adaptive: avg dihitung dari last 6 cycles. Kalau user tracking lebih lama
// (>6 cycles), lebih akurat. Kalau baru, fallback ke population mean 29 days
// dengan large confidence band.
// =============================================================================

const LUTEAL_PHASE_DAYS = 14;
const FERTILE_WINDOW_BEFORE = 5;
const FERTILE_WINDOW_AFTER = 1;
const MAX_CYCLES_FOR_AVG = 6;

// ACOG 651 normal range
const ACOG_ADULT_MIN = 21;
const ACOG_ADULT_MAX = 35;
const ACOG_TEEN_MAX = 45;

// Sanity filter (extreme outliers — likely data entry error)
const SANITY_MIN = 14;
const SANITY_MAX = 90;

// Population mean (Bull 2019) — fallback bila user data insufficient
const POPULATION_MEAN_CYCLE = 29.3;

export type CycleClassification =
  | 'normal'
  | 'short' // polymenorrhea < 21
  | 'long' // oligomenorrhea > 35 (or 45 untuk teen)
  | 'irregular' // std > 7 days
  | 'insufficient_data';

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface Prediction {
  next_start: Date;
  ovulation: Date;
  fertile_start: Date;
  fertile_end: Date;
  avg_cycle_days: number;
  std_dev_days: number;
  cycle_count: number;
  classification: CycleClassification;
  confidence: ConfidenceLevel;
  /** Method used: 'user_data' atau 'population_fallback'. */
  method: 'user_data' | 'population_fallback';
}

interface PredictParams {
  cycles: CycleRow[];
  /** Optional age — affects normal range (teen vs adult). Default treat as adult. */
  ageYears?: number;
}

const classifyCycle = (
  avg: number,
  stddev: number,
  isAdult: boolean,
  cycleCount: number,
): CycleClassification => {
  if (cycleCount < 2) return 'insufficient_data';
  if (stddev > 7) return 'irregular';
  if (avg < ACOG_ADULT_MIN) return 'short';
  const upper = isAdult ? ACOG_ADULT_MAX : ACOG_TEEN_MAX;
  if (avg > upper) return 'long';
  return 'normal';
};

const computeConfidence = (cycleCount: number, stddev: number): ConfidenceLevel => {
  if (cycleCount >= 6 && stddev <= 4) return 'high';
  if (cycleCount >= 3 && stddev <= 7) return 'medium';
  return 'low';
};

/**
 * Compute prediction from sorted cycles list. Returns null kalau benar-benar
 * tidak ada cycle data (lebih conservative dari sebelumnya — return prediction
 * bahkan dengan 1 cycle pakai population mean fallback).
 */
export const predictNextCycle = (
  cycles: CycleRow[],
  options?: { ageYears?: number },
): Prediction | null => {
  return predictNextCycleParams({ cycles, ...(options ?? {}) });
};

export const predictNextCycleParams = (params: PredictParams): Prediction | null => {
  const { cycles, ageYears } = params;
  const isAdult = (ageYears ?? 25) >= 20; // ACOG cutoff ~19 years

  const sorted = cycles
    .filter((c) => !c.deleted_at)
    .sort((a, b) => b.start_date.localeCompare(a.start_date));

  if (sorted.length === 0) return null;

  // Compute cycle lengths dari consecutive starts
  const lengths: number[] = [];
  for (let i = 0; i < Math.min(sorted.length - 1, MAX_CYCLES_FOR_AVG); i++) {
    const current = parseISO(sorted[i]!.start_date);
    const prev = parseISO(sorted[i + 1]!.start_date);
    const days = differenceInDays(current, prev);
    if (days >= SANITY_MIN && days <= SANITY_MAX) {
      lengths.push(days);
    }
  }

  let avg: number;
  let stddev: number;
  let method: 'user_data' | 'population_fallback';
  let cycleCount: number;

  if (lengths.length === 0) {
    // Insufficient pairs — fallback ke population mean (Bull 2019)
    avg = POPULATION_MEAN_CYCLE;
    stddev = 5; // typical population std
    method = 'population_fallback';
    cycleCount = 0;
  } else {
    avg = lengths.reduce((sum, l) => sum + l, 0) / lengths.length;
    const variance =
      lengths.reduce((sum, l) => sum + (l - avg) ** 2, 0) / lengths.length;
    stddev = Math.sqrt(variance);
    method = 'user_data';
    cycleCount = lengths.length;
  }

  const lastStart = parseISO(sorted[0]!.start_date);
  const nextStart = addDays(lastStart, Math.round(avg));
  const ovulation = addDays(nextStart, -LUTEAL_PHASE_DAYS);
  const fertileStart = addDays(ovulation, -FERTILE_WINDOW_BEFORE);
  const fertileEnd = addDays(ovulation, FERTILE_WINDOW_AFTER);

  return {
    next_start: nextStart,
    ovulation,
    fertile_start: fertileStart,
    fertile_end: fertileEnd,
    avg_cycle_days: avg,
    std_dev_days: stddev,
    cycle_count: cycleCount,
    classification: classifyCycle(avg, stddev, isAdult, cycleCount + 1),
    confidence: computeConfidence(cycleCount, stddev),
    method,
  };
};

/** Returns Date[] of fertile window days untuk calendar modifier. */
export const getFertileDays = (prediction: Prediction): Date[] => {
  const days: Date[] = [];
  let d = prediction.fertile_start;
  while (d <= prediction.fertile_end) {
    days.push(d);
    d = addDays(d, 1);
  }
  return days;
};
