import { describe, expect, it } from 'vitest';
import { buildExportCsv } from '@/features/data-export/lib/csv';
import {
  EXPORT_PAGE_SIZE,
  exportCsvOmitsIntimate,
} from '@/features/data-export/lib/personal-export';
import type { CycleRow } from '@/features/cycles/types';
import type { DailyLogRow } from '@/features/daily-logs/types';

const log = (overrides: Partial<DailyLogRow>): DailyLogRow => ({
  id: 'log-1',
  couple_id: 'c1',
  cycle_id: null,
  log_date: '2026-05-01',
  flow_intensity: 2,
  symptoms: ['cramps'],
  moods: ['calm'],
  notes: '普通笔记',
  encrypted_payload: 'SHOULD-NOT-EXPORT',
  sexual_activity_encrypted: 'v1:secret',
  bbt: null,
  weight: null,
  sleep_hours: null,
  water_intake_ml: null,
  logged_by: 'me',
  created_at: '2026-05-01T00:00:00Z',
  updated_at: '2026-05-01T00:00:00Z',
  deleted_at: null,
  ...overrides,
});

describe('personal CSV export (F12 / D6)', () => {
  it('does not emit intimate plaintext or ciphertext column names', () => {
    const cycles: CycleRow[] = [];
    const csv = buildExportCsv(cycles, [log({})]);
    expect(exportCsvOmitsIntimate(csv)).toBe(true);
    expect(csv).not.toContain('v1:secret');
    expect(csv).not.toContain('SHOULD-NOT-EXPORT');
    expect(csv).toContain('普通笔记');
  });

  it('pages in chunks larger than the old 60-row list cap', () => {
    expect(EXPORT_PAGE_SIZE).toBeGreaterThan(60);
  });
});
