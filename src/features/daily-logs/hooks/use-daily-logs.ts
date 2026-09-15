import { useQuery } from '@tanstack/react-query';
import { useCouple } from '@/features/couples/hooks/use-couple';
import { getDailyLog, listDailyLogs } from '@/features/daily-logs/api/daily-logs';

// Query keys—reuse di mutations untuk invalidation.
export const dailyLogsListKey = (coupleId: string | undefined) =>
  ['daily-logs', 'list', coupleId] as const;

export const dailyLogByDateKey = (coupleId: string | undefined, date: string) =>
  ['daily-logs', 'by-date', coupleId, date] as const;

/** Prefix that matches every by-date query for a couple (F13). */
export const dailyLogsByDatePrefix = (coupleId: string | undefined) =>
  ['daily-logs', 'by-date', coupleId] as const;

export const dailyLogInvalidationTargets = (
  coupleId: string,
  logDate?: string,
) => ({
  list: dailyLogsListKey(coupleId),
  byDate: logDate
    ? dailyLogByDateKey(coupleId, logDate)
    : dailyLogsByDatePrefix(coupleId),
});

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
      if (!coupleId) throw new Error('还不能记录，请刷新页面后再试。');
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
      if (!coupleId) throw new Error('还不能记录，请刷新页面后再试。');
      if (!logDate) throw new Error('还不能记录，请刷新页面后再试。');
      return getDailyLog(coupleId, logDate);
    },
    enabled: !!coupleId && !!logDate,
  });
};
