import { format, parseISO } from 'date-fns';
import { enUS, id as idLocale } from 'date-fns/locale';
import type { Locale } from '@/lib/i18n';

const dateLocales: Record<Locale, typeof enUS> = {
  id: idLocale,
  en: enUS,
};

/**
 * Format ISO date string (YYYY-MM-DD) ke locale-aware human-readable.
 * Default pattern "d MMM yyyy" (e.g. "4 Mei 2026" / "May 4, 2026").
 */
export const formatDate = (
  isoDate: string,
  locale: Locale,
  pattern = 'd MMM yyyy',
): string => {
  return format(parseISO(isoDate), pattern, { locale: dateLocales[locale] });
};

/** Today as YYYY-MM-DD (local timezone). Buat default `start_date`/`end_date`. */
export const todayIso = (): string => {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

/** Days between two ISO dates (inclusive). e.g. same date = 1, next day = 2. */
export const daysBetween = (startIso: string, endIso: string): number => {
  const start = parseISO(startIso);
  const end = parseISO(endIso);
  return Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
};
