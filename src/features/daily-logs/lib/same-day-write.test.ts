import { describe, expect, it } from 'vitest';
import { planDailyLogWrite } from '@/features/daily-logs/lib/same-day-write';
import { dailyLogInvalidationTargets } from '@/features/daily-logs/hooks/use-daily-logs';

describe('planDailyLogWrite (F10)', () => {
  it('restores a soft-deleted same-day row instead of unique-failing', () => {
    expect(
      planDailyLogWrite({ id: 'log-1', deleted_at: '2026-05-01T10:00:00Z' }),
    ).toBe('restore');
  });

  it('updates an active row and inserts when none exists', () => {
    expect(planDailyLogWrite({ id: 'log-1', deleted_at: null })).toBe('update');
    expect(planDailyLogWrite(null)).toBe('insert');
  });
});

describe('dailyLogInvalidationTargets (F13)', () => {
  it('invalidates every by-date query when the list changes without a date', () => {
    const keys = dailyLogInvalidationTargets('couple-1');
    expect(keys.list).toEqual(['daily-logs', 'list', 'couple-1']);
    expect(keys.byDate).toEqual(['daily-logs', 'by-date', 'couple-1']);
  });
});
