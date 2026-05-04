// Sanity test untuk i18n module + verify vitest setup actually works.
// Bukan exhaustive—real coverage akan tumbuh per feature di milestone berikutnya.
import { describe, it, expect } from 'vitest';
import { defaultLocale, supportedLocales, useLocaleStore } from '@/lib/i18n';

describe('i18n module', () => {
  it('default locale adalah "id"', () => {
    expect(defaultLocale).toBe('id');
  });

  it('support id dan en', () => {
    expect(supportedLocales).toEqual(['id', 'en']);
  });

  it('store start dari default locale', () => {
    expect(useLocaleStore.getState().locale).toBe(defaultLocale);
  });
});
