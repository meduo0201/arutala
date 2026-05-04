import { useQuery } from '@tanstack/react-query';
import { getDailyInsight, type CyclePhase } from '@/features/insights/api';
import { todayIso } from '@/lib/format-date';

export const dailyInsightKey = (phase: CyclePhase, logDate: string) =>
  ['daily-insight', phase, logDate] as const;

export const useDailyInsight = (phase: CyclePhase) => {
  const today = todayIso();
  return useQuery({
    queryKey: dailyInsightKey(phase, today),
    queryFn: () => getDailyInsight(phase, today),
    // Stale: ~1 hari (until midnight). Conservatively 1 jam supaya re-fetch
    // saat user keep app open through midnight.
    staleTime: 60 * 60 * 1000,
  });
};
