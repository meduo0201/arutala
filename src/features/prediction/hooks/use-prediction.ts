import { useMemo } from 'react';
import { useCycles } from '@/features/cycles/hooks/use-cycles';
import { predictNextCycle, type Prediction } from '@/features/prediction/lib/predict';

interface UsePredictionResult {
  prediction: Prediction | null;
  isLoading: boolean;
  hasData: boolean; // false kalau loading atau gak ada cukup cycle data
}

/**
 * Computes prediction from cycle history. Returns null prediction kalau:
 * - Loading (still fetching)
 * - <2 cycles (insufficient data)
 * - Cycles ada tapi gak ada pair valid (sanity-filtered out)
 *
 * Memoized—prediction recompute hanya pas cycles list reference berubah.
 */
export const usePrediction = (): UsePredictionResult => {
  const cycles = useCycles();

  const prediction = useMemo(() => {
    if (!cycles.data) return null;
    return predictNextCycle(cycles.data);
  }, [cycles.data]);

  return {
    prediction,
    isLoading: cycles.isLoading,
    hasData: !cycles.isLoading && prediction !== null,
  };
};
