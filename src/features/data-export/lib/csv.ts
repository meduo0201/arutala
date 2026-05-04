import type { CycleRow } from '@/features/cycles/types';
import type { DailyLogRow } from '@/features/daily-logs/types';

// CSV escape: kalau cell punya comma/quote/newline, wrap dengan double-quotes
// + escape internal quotes by doubling.
const csvCell = (v: string | number | null | undefined): string => {
  if (v === null || v === undefined) return '';
  const s = String(v);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
};

const csvRow = (cells: (string | number | null | undefined)[]): string =>
  cells.map(csvCell).join(',');

/**
 * Map our flow_intensity (0-4) ke drip period_intensity (0-3, where 0=spotting,
 * 1=light, 2=medium, 3=heavy). 0 (none) → empty string (drip ngerti = no period).
 */
const mapFlowToDrip = (flow: number | null): string => {
  if (flow === null || flow === 0) return '';
  if (flow === 1) return '0'; // spotting
  if (flow === 2) return '1'; // light
  if (flow === 3) return '2'; // medium
  return '3'; // heavy (4)
};

/**
 * Build CSV from cycles + daily_logs. Schema mirrors drip-compatible columns
 * (date, period_intensity, symptoms, moods, notes) buat ease migration.
 *
 * Sort ascending by date (drip convention).
 */
export const buildExportCsv = (
  cycles: CycleRow[],
  logs: DailyLogRow[],
): string => {
  // Build map of date → cycle status (period day or not)
  const periodDays = new Set<string>();
  for (const c of cycles) {
    if (c.deleted_at) continue;
    if (!c.end_date) {
      periodDays.add(c.start_date);
      continue;
    }
    const start = new Date(c.start_date);
    const end = new Date(c.end_date);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const iso = d.toISOString().slice(0, 10);
      periodDays.add(iso);
    }
  }

  // Combine: every date that has a log OR is a period day
  const dates = new Set<string>();
  for (const l of logs) {
    if (l.deleted_at) continue;
    dates.add(l.log_date);
  }
  for (const d of periodDays) dates.add(d);

  const sortedDates = Array.from(dates).sort();

  const header = csvRow([
    'date',
    'period_intensity',
    'symptoms',
    'moods',
    'notes',
    'is_period_day',
  ]);

  const rows = sortedDates.map((date) => {
    const log = logs.find((l) => l.log_date === date && !l.deleted_at);
    return csvRow([
      date,
      mapFlowToDrip(log?.flow_intensity ?? null),
      log?.symptoms?.join(';') ?? '',
      log?.moods?.join(';') ?? '',
      log?.notes ?? '',
      periodDays.has(date) ? '1' : '0',
    ]);
  });

  return [header, ...rows].join('\n');
};

/** Trigger browser download via Blob + anchor click. */
export const downloadCsv = (csv: string, filename: string): void => {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
