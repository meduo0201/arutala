import { beforeEach, describe, expect, it, vi } from 'vitest';
import { upsertDailyLog } from '@/features/daily-logs/api/daily-logs';

const rpc = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: (...args: unknown[]) => rpc(...args),
  },
}));

describe('upsertDailyLog', () => {
  beforeEach(() => {
    rpc.mockReset();
    rpc.mockResolvedValue({
      data: { id: 'log-1', log_date: '2026-05-01' },
      error: null,
    });
  });

  it('uses upsert_daily_log so a soft-deleted same day can be restored', async () => {
    await upsertDailyLog({
      couple_id: 'couple-1',
      log_date: '2026-05-01',
      logged_by: 'user-1',
      notes: 'again',
    });

    expect(rpc).toHaveBeenCalledWith(
      'upsert_daily_log',
      expect.objectContaining({
        p_couple_id: 'couple-1',
        p_log_date: '2026-05-01',
        p_logged_by: 'user-1',
        p_update_sexual_activity: false,
      }),
    );
    expect(rpc).not.toHaveBeenCalledWith(
      'upsert_daily_log',
      expect.objectContaining({ onConflict: 'couple_id,log_date' }),
    );
  });
});
