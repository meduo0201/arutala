import { eachDayOfInterval, parseISO } from 'date-fns';
import type { CycleRow } from '@/features/cycles/types';

/**
 * Compute Date[] of all period days from cycles list.
 * Untuk active cycle (no end_date), include days dari start_date sampai today.
 * react-day-picker `modifiers={{ period: <Date[]> }}` pake ini buat highlight.
 */
export const computePeriodDays = (cycles: CycleRow[]): Date[] => {
  const days: Date[] = [];
  const today = new Date();
  for (const cycle of cycles) {
    if (cycle.deleted_at) continue;
    const start = parseISO(cycle.start_date);
    const end = cycle.end_date ? parseISO(cycle.end_date) : today;
    if (end < start) continue;
    days.push(...eachDayOfInterval({ start, end }));
  }
  return days;
};

/** Cek apakah `date` jatuh di dalam range salah satu cycle (period day). */
export const findCycleForDate = (
  cycles: CycleRow[],
  date: Date,
): CycleRow | null => {
  const dateStr = isoDate(date);
  for (const cycle of cycles) {
    if (cycle.deleted_at) continue;
    if (cycle.start_date > dateStr) continue;
    const endOk = !cycle.end_date || cycle.end_date >= dateStr;
    if (endOk) return cycle;
  }
  return null;
};

/** Convert Date → YYYY-MM-DD string (local TZ). */
export const isoDate = (d: Date): string => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};
