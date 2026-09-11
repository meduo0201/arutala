import { format, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import type { Locale } from '@/lib/i18n';

const dateLocales: Record<Locale, typeof zhCN> = {
  'zh-CN': zhCN,
};

/**
 * Format ISO date string (YYYY-MM-DD) for zh-CN.
 * Default pattern e.g. "2026年5月4日".
 */
export const formatDate = (
  isoDate: string,
  locale: Locale = 'zh-CN',
  pattern = 'yyyy年M月d日',
): string => {
  return format(parseISO(isoDate), pattern, { locale: dateLocales[locale] ?? zhCN });
};

/** Today as YYYY-MM-DD (local timezone). */
export const todayIso = (): string => {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

/** Days between two ISO dates (inclusive). Same date = 1, next day = 2. */
export const daysBetween = (startIso: string, endIso: string): number => {
  const start = parseISO(startIso);
  const end = parseISO(endIso);
  return Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
};
