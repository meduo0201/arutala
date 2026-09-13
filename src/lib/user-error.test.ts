import { describe, expect, it } from 'vitest';
import { extractErrorMessage, formatUserError } from './user-error';

describe('formatUserError', () => {
  it('maps invalid login credentials', () => {
    expect(formatUserError(new Error('Invalid login credentials'))).toBe(
      '账号或密码不正确。',
    );
  });

  it('maps already registered', () => {
    expect(formatUserError({ message: 'User already registered' })).toBe(
      '该账号已被注册。',
    );
  });

  it('keeps Simplified Chinese messages', () => {
    expect(formatUserError(new Error('邀请码不存在，请检查后重试。'))).toBe(
      '邀请码不存在，请检查后重试。',
    );
  });

  it('maps leftover Indonesian RPC copy', () => {
    expect(
      formatUserError(new Error('Code tidak ditemukan. Cek lagi penulisannya.')),
    ).toBe('邀请码不存在，请检查后重试。');
  });

  it('falls back when the message is unknown English', () => {
    expect(formatUserError(new Error('weird upstream boom'))).toBe(
      '出错了，请再试一次。',
    );
  });

  it('uses a custom fallback', () => {
    expect(formatUserError(null, '保存失败，请重试。')).toBe('保存失败，请重试。');
  });
});

describe('extractErrorMessage', () => {
  it('reads Error and { message }', () => {
    expect(extractErrorMessage(new Error('x'))).toBe('x');
    expect(extractErrorMessage({ message: 'y' })).toBe('y');
    expect(extractErrorMessage(undefined)).toBe('');
  });
});
