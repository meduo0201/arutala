import { useQuery } from '@tanstack/react-query';
import { useCouple } from '@/features/couples/hooks/use-couple';
import { getDailyLog, listDailyLogs } from '@/features/daily-logs/api/daily-logs';

// Query keys—reuse di mutations untuk invalidation.
export const dailyLogsListKey = (coupleId: string | undefined) =>
  ['daily-logs', 'list', coupleId] as const;

export const dailyLogByDateKey = (coupleId: string | undefined, date: string) =>
  ['daily-logs', 'by-date', coupleId, date] as const;

/**
 * List recent daily logs for couple. Default limit 60 (~2 cycles worth).
 * Untuk older history pakai pagination atau date filter (Phase 3 charts).
 */
export const useDailyLogs = () => {
  const { data: couple } = useCouple();
  const coupleId = couple?.id;

  return useQuery({
    queryKey: dailyLogsListKey(coupleId),
    queryFn: () => {
      if (!coupleId) throw new Error('useDailyLogs called without active couple');
      return listDailyLogs(coupleId);
    },
    enabled: !!coupleId,
  });
};

/**
 * Fetch single log for specific date. Returns null kalau belum ada.
 * Pakai di day-detail-sheet supaya pas user tap tanggal di kalender, langsung
 * load entry kalau ada (atau kosong form kalau belum ada).
 */
export const useDailyLogByDate = (logDate: string | undefined) => {
  const { data: couple } = useCouple();
  const coupleId = couple?.id;

  return useQuery({
    queryKey: dailyLogByDateKey(coupleId, logDate ?? ''),
    queryFn: () => {
      if (!coupleId) throw new Error('useDailyLogByDate called without active couple');
      if (!logDate) throw new Error('useDailyLogByDate called without logDate');
      return getDailyLog(coupleId, logDate);
    },
    enabled: !!coupleId && !!logDate,
  });
};
