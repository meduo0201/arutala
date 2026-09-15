/**
 * F10: after a soft-delete, the same calendar day must be writable again.
 * The client cannot SELECT deleted rows (RLS), so restore happens in
 * upsert_daily_log. This helper documents the intended server plan so a
 * regression test can catch "unique on all rows, no restore path".
 */
export type ExistingDailyLog = { id: string; deleted_at: string | null } | null;

export type DailyLogWritePlan = 'insert' | 'update' | 'restore';

export const planDailyLogWrite = (
  existing: ExistingDailyLog,
): DailyLogWritePlan => {
  if (!existing) return 'insert';
  if (existing.deleted_at) return 'restore';
  return 'update';
};
