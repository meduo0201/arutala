import { supabase } from '@/lib/supabase';
import { todayIso } from '@/lib/format-date';

export type CyclePhase = 'period' | 'follicular' | 'fertile' | 'ovulation' | 'luteal' | 'any';

export interface DailyInsight {
  id: string;
  phase: string;
  category: string;
  title_id: string;
  body_id: string;
  emoji: string | null;
}

/**
 * Fetch today's deterministic insight untuk current user + phase.
 * Server function hash(user_id + date + phase) % count → consistent per
 * (user, day, phase) tuple. Berbeda hari → konten beda.
 */
export const getDailyInsight = async (
  phase: CyclePhase,
  logDate: string = todayIso(),
): Promise<DailyInsight | null> => {
  const { data, error } = await supabase.rpc('get_daily_insight', {
    p_phase: phase,
    p_log_date: logDate,
  } as never);
  if (error) {
    console.error('[insights] getDailyInsight error:', error);
    return null;
  }
  // RPC returns table — Supabase returns array
  const rows = (data ?? []) as DailyInsight[];
  return rows[0] ?? null;
};
