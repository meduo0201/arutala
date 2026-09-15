import { describe, expect, it } from 'vitest';
import { buildExportCsv, csvCell } from '@/features/data-export/lib/csv';
import type { CycleRow } from '@/features/cycles/types';
import type { DailyLogRow } from '@/features/daily-logs/types';

const log = (overrides: Partial<DailyLogRow>): DailyLogRow => ({
  id: 'log-1',
  couple_id: 'c1',
  cycle_id: null,
  log_date: '2026-05-01',
  flow_intensity: null,
  symptoms: [],
  moods: [],
  notes: null,
  encrypted_payload: null,
  sexual_activity_encrypted: null,
  bbt: null,
  weight: null,
  sleep_hours: null,
  water_intake_ml: null,
  logged_by: 'u1',
  created_at: '2026-05-01T00:00:00Z',
  updated_at: '2026-05-01T00:00:00Z',
  deleted_at: null,
  ...overrides,
});

describe('csvCell formula injection (F12)', () => {
  it.each(['=1+1', '+cmd', '-2+3', '@SUM(A1)', '\t=HYPERLINK'])(
    'neutralizes %s',
    (value) => {
      const cell = csvCell(value);
      expect(cell.startsWith("'") || cell.startsWith('"' + "'")).toBe(true);
      expect(cell.startsWith(value)).toBe(false);
    },
  );

  it('leaves ordinary notes unchanged', () => {
    expect(csvCell('轻微痛经')).toBe('轻微痛经');
  });
});

describe('buildExportCsv', () => {
  it('defends formula-like notes in the exported file', () => {
    const cycles: CycleRow[] = [];
    const csv = buildExportCsv(cycles, [
      log({ notes: '=cmd|"/c calc"!A1' }),
    ]);
    expect(csv).toContain("'=cmd|");
    expect(csv.split('\n')[1]).not.toMatch(/^.*,=cmd/);
  });
});
