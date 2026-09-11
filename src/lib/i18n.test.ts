import { describe, it, expect } from 'vitest';
import { defaultLocale, supportedLocales, useLocaleStore } from '@/lib/i18n';

describe('i18n module', () => {
  it('default locale is zh-CN', () => {
    expect(defaultLocale).toBe('zh-CN');
  });

  it('only supports Simplified Chinese', () => {
    expect(supportedLocales).toEqual(['zh-CN']);
  });

  it('store starts at the default locale', () => {
    expect(useLocaleStore.getState().locale).toBe(defaultLocale);
  });
});
