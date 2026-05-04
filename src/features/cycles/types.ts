// Manual types — sync dengan SCHEMA.sql cycles table.
// TODO Phase 2+: replace dengan auto-generated via `pnpm db:types`.

export interface CycleRow {
  id: string;
  couple_id: string;
  start_date: string;          // ISO date YYYY-MM-DD
  end_date: string | null;
  cycle_length: number | null; // days from this start → next cycle start (Phase 1: null until predicted)
  predicted_next_start: string | null;
  predicted_ovulation: string | null;
  predicted_fertile_start: string | null;
  predicted_fertile_end: string | null;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

/** Active cycle = period yang udah mulai tapi belum selesai (end_date null). */
export type ActiveCycle = CycleRow & { end_date: null };

/** Returns "PERIOD" length (bleeding days) — bukan cycle length. */
export const periodDays = (cycle: CycleRow): number | null => {
  if (!cycle.end_date) return null;
  const start = new Date(cycle.start_date);
  const end = new Date(cycle.end_date);
  return Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
};
