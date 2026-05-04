import { supabase } from '@/lib/supabase';
import type { DailyLogRow, FlowIntensity } from '@/features/daily-logs/types';

// API wrappers untuk daily_logs.
// UNIQUE(couple_id, log_date) di SCHEMA—satu hari satu log per couple.
// Pakai upsert dengan onConflict supaya same-day re-edit gak error.
//
// Soft delete via SECURITY DEFINER RPC (migration 0005) untuk hindari
// PostgREST representation-read RLS issue (deleted_at IS NULL filter).

interface UpsertParams {
  couple_id: string;
  cycle_id?: string | null | undefined;
  log_date: string;
  flow_intensity?: FlowIntensity | null | undefined;
  symptoms?: string[] | undefined;
  moods?: string[] | undefined;
  notes?: string | null | undefined;
  logged_by: string;
  /**
   * Phase 4 Track B: pre-encrypted ciphertext untuk sexual_activity.
   * Caller responsible encrypt sebelum panggil upsert (gunakan E2EE store key).
   * NULL = no change (tetap sama sebelumnya); empty string = clear.
   */
  sexual_activity_encrypted?: string | null | undefined;
}

/** Upsert (insert or update) daily log untuk specific date. */
export const upsertDailyLog = async (params: UpsertParams): Promise<DailyLogRow> => {
  // Build payload — only include sexual_activity_encrypted kalau caller secara
  // eksplisit pass-in (undefined = leave existing). Empty string '' / null
  // = clear field.
  const payload: Record<string, unknown> = {
    couple_id: params.couple_id,
    cycle_id: params.cycle_id ?? null,
    log_date: params.log_date,
    flow_intensity: params.flow_intensity ?? null,
    symptoms: params.symptoms ?? [],
    moods: params.moods ?? [],
    notes: params.notes ?? null,
    logged_by: params.logged_by,
  };
  if (params.sexual_activity_encrypted !== undefined) {
    payload['sexual_activity_encrypted'] = params.sexual_activity_encrypted;
  }

  const { data, error } = await supabase
    .from('daily_logs')
    .upsert(payload, { onConflict: 'couple_id,log_date' })
    .select()
    .single();

  if (error) {
    console.error('[daily-logs] upsertDailyLog error:', error);
    throw error;
  }
  return data as DailyLogRow;
};

/** Get log untuk single date. Returns null kalau belum ada. */
export const getDailyLog = async (
  coupleId: string,
  logDate: string,
): Promise<DailyLogRow | null> => {
  const { data, error } = await supabase
    .from('daily_logs')
    .select('*')
    .eq('couple_id', coupleId)
    .eq('log_date', logDate)
    .is('deleted_at', null)
    .maybeSingle();

  if (error) {
    console.error('[daily-logs] getDailyLog error:', error);
    throw error;
  }
  return data as DailyLogRow | null;
};

/** List logs (newest first). Optional date range filter + limit (default 60). */
export const listDailyLogs = async (
  coupleId: string,
  options?: { from_date?: string; to_date?: string; limit?: number },
): Promise<DailyLogRow[]> => {
  let q = supabase
    .from('daily_logs')
    .select('*')
    .eq('couple_id', coupleId)
    .is('deleted_at', null)
    .order('log_date', { ascending: false })
    .limit(options?.limit ?? 60);

  if (options?.from_date) q = q.gte('log_date', options.from_date);
  if (options?.to_date) q = q.lte('log_date', options.to_date);

  const { data, error } = await q;
  if (error) {
    console.error('[daily-logs] listDailyLogs error:', error);
    throw error;
  }
  return (data as DailyLogRow[] | null) ?? [];
};

/** Soft delete daily log via SECURITY DEFINER RPC. */
export const deleteDailyLog = async (logId: string): Promise<void> => {
  const { error } = await supabase.rpc('soft_delete_daily_log', {
    p_log_id: logId,
  });
  if (error) {
    console.error('[daily-logs] deleteDailyLog error:', error);
    throw error;
  }
};
