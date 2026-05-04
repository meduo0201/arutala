import { supabase } from '@/lib/supabase';
import type { CycleRow } from '@/features/cycles/types';

// API wrappers untuk cycles. Semua queries scoped ke couple_id (RLS enforce).
// Type assertions di sini—client supabase di-config tanpa <Database> generic.

/** List recent cycles for couple, newest first, limit 30 (Phase 1). */
export const listCycles = async (coupleId: string): Promise<CycleRow[]> => {
  const { data, error } = await supabase
    .from('cycles')
    .select('*')
    .eq('couple_id', coupleId)
    .is('deleted_at', null)
    .order('start_date', { ascending: false })
    .limit(30);

  if (error) {
    console.error('[cycles] listCycles error:', error);
    throw error;
  }
  return (data as CycleRow[] | null) ?? [];
};

/** Cycle aktif = period belum selesai (end_date null), exclude deleted. */
export const getActiveCycle = async (coupleId: string): Promise<CycleRow | null> => {
  const { data, error } = await supabase
    .from('cycles')
    .select('*')
    .eq('couple_id', coupleId)
    .is('end_date', null)
    .is('deleted_at', null)
    .order('start_date', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('[cycles] getActiveCycle error:', error);
    throw error;
  }
  return data as CycleRow | null;
};

/** Insert new cycle (period mulai). RLS enforce couple_id ownership + created_by check. */
export const startCycle = async (params: {
  couple_id: string;
  user_id: string;
  start_date: string;
  notes?: string | undefined;
}): Promise<CycleRow> => {
  const { data, error } = await supabase
    .from('cycles')
    .insert({
      couple_id: params.couple_id,
      start_date: params.start_date,
      notes: params.notes ?? null,
      created_by: params.user_id,
    })
    .select()
    .single();

  if (error) {
    console.error('[cycles] startCycle error:', error);
    throw error;
  }
  return data as CycleRow;
};

/** Set end_date pada cycle aktif (period selesai). cycle_length tetep null
 *  sampai cycle berikutnya dimulai (Phase F prediction compute itu). */
export const endCycle = async (cycleId: string, endDate: string): Promise<CycleRow> => {
  const { data, error } = await supabase
    .from('cycles')
    .update({ end_date: endDate })
    .eq('id', cycleId)
    .select()
    .single();

  if (error) {
    console.error('[cycles] endCycle error:', error);
    throw error;
  }
  return data as CycleRow;
};

/** Update cycle (edit start_date, end_date, notes). */
export const updateCycle = async (params: {
  cycle_id: string;
  start_date: string;
  end_date: string | null;
  notes?: string | undefined;
}): Promise<CycleRow> => {
  const { data, error } = await supabase
    .from('cycles')
    .update({
      start_date: params.start_date,
      end_date: params.end_date,
      notes: params.notes ?? null,
    })
    .eq('id', params.cycle_id)
    .select()
    .single();

  if (error) {
    console.error('[cycles] updateCycle error:', error);
    throw error;
  }
  return data as CycleRow;
};

/** Soft delete cycle via SECURITY DEFINER RPC.
 *  Direct `.update({ deleted_at })` gagal karena PostgREST representation read
 *  hits SELECT policy `deleted_at IS NULL` → "new row violates RLS" error.
 *  RPC bypass RLS + central auth (verifies user is member of cycle's couple). */
export const deleteCycle = async (cycleId: string): Promise<void> => {
  const { error } = await supabase.rpc('soft_delete_cycle', {
    p_cycle_id: cycleId,
  });

  if (error) {
    console.error('[cycles] deleteCycle error:', error);
    throw error;
  }
};
