import { supabase } from '@/lib/supabase';
import type { CycleRow } from '@/features/cycles/types';
import type { DailyLogRow } from '@/features/daily-logs/types';

export const EXPORT_PAGE_SIZE = 200;

export const INTIMATE_EXPORT_KEYS = [
  'sexual_activity_encrypted',
  'sexual_activity',
  'encrypted_payload',
] as const;

export const exportCsvOmitsIntimate = (csv: string): boolean =>
  !INTIMATE_EXPORT_KEYS.some((key) => csv.includes(key));

const pageAll = async <T>(
  fetchPage: (from: number, to: number) => Promise<T[]>,
): Promise<T[]> => {
  const all: T[] = [];
  let from = 0;
  for (;;) {
    const to = from + EXPORT_PAGE_SIZE - 1;
    const chunk = await fetchPage(from, to);
    all.push(...chunk);
    if (chunk.length < EXPORT_PAGE_SIZE) break;
    from += EXPORT_PAGE_SIZE;
  }
  return all;
};

/** Personal backup: every cycle owned by the current user (not the last 30). */
export const listAllMyCycles = async (userId: string): Promise<CycleRow[]> =>
  pageAll(async (from, to) => {
    const { data, error } = await supabase
      .from('cycles')
      .select('*')
      .eq('created_by', userId)
      .is('deleted_at', null)
      .order('start_date', { ascending: true })
      .range(from, to);
    if (error) throw error;
    return (data as CycleRow[] | null) ?? [];
  });

/** Personal backup: every daily log owned by the current user (not last 60). */
export const listAllMyDailyLogs = async (userId: string): Promise<DailyLogRow[]> =>
  pageAll(async (from, to) => {
    const { data, error } = await supabase
      .from('daily_logs')
      .select(
        'id,couple_id,cycle_id,log_date,flow_intensity,symptoms,moods,notes,bbt,weight,sleep_hours,water_intake_ml,logged_by,created_at,updated_at,deleted_at',
      )
      .eq('logged_by', userId)
      .is('deleted_at', null)
      .order('log_date', { ascending: true })
      .range(from, to);
    if (error) throw error;
    return ((data as DailyLogRow[] | null) ?? []).map((row) => ({
      ...row,
      sexual_activity_encrypted: null,
      encrypted_payload: null,
    }));
  });
