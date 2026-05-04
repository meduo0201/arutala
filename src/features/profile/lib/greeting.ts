import type { MessageKey } from '@/lib/i18n';

/**
 * Time-aware greeting key. Based on local hour (Asia/Jakarta dominant for our
 * users tapi gak hardcode — pakai client local).
 *   05-10  → pagi
 *   10-15  → siang
 *   15-18  → sore
 *   18-05  → malam
 */
export const greetingKeyForHour = (hour: number): MessageKey => {
  if (hour >= 5 && hour < 10) return 'home.greeting.morning';
  if (hour >= 10 && hour < 15) return 'home.greeting.afternoon';
  if (hour >= 15 && hour < 18) return 'home.greeting.evening';
  return 'home.greeting.night';
};

export const currentGreetingKey = (now: Date = new Date()): MessageKey => {
  return greetingKeyForHour(now.getHours());
};
