import { describe, expect, it } from 'vitest';
import {
  formatAcceptConflictMessage,
  overlappingLogDates,
} from '@/features/couples/lib/accept-conflicts';

describe('couple accept conflicts (F07 / D2)', () => {
  it('rejects overlapping days and never silently drops', () => {
    expect(overlappingLogDates(['2026-05-01', '2026-05-03'], ['2026-05-03'])).toEqual(
      ['2026-05-03'],
    );
    expect(overlappingLogDates(['2026-05-01'], ['2026-05-02'])).toEqual([]);
  });

  it('builds a Chinese reject message that forbids overwrite', () => {
    const msg = formatAcceptConflictMessage(['2026-05-01', '2026-05-02']);
    expect(msg).toContain('无法关联');
    expect(msg).toContain('2026-05-01');
    expect(msg).toContain('不会覆盖');
  });
});
