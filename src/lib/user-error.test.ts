import { describe, expect, it } from 'vitest';
import {
  extractErrorMessage,
  formatUserError,
  NETWORK_FAILURE_MESSAGE,
} from './user-error';

describe('formatUserError', () => {
  it('maps invalid login credentials', () => {
    expect(formatUserError(new Error('Invalid login credentials'))).toBe(
      '账号或密码错误',
    );
  });

  it('maps already registered', () => {
    expect(formatUserError({ message: 'User already registered' })).toBe(
      '该账号已注册',
    );
  });

  it('maps Supabase auth error codes', () => {
    expect(formatUserError({ code: 'invalid_credentials', message: 'x' })).toBe(
      '账号或密码错误',
    );
    expect(formatUserError({ code: 'user_already_exists', message: 'x' })).toBe(
      '该账号已注册',
    );
  });

  it('keeps Simplified Chinese messages', () => {
    expect(formatUserError(new Error('邀请码不存在，请检查后重试。'))).toBe(
      '邀请码不存在，请检查后重试。',
    );
    expect(
      formatUserError(
        new Error('无法关联：双方在同一天都有记录（2026-05-01）。请先删除冲突日期后再试，系统不会覆盖或丢弃任何记录。'),
      ),
    ).toContain('无法关联');
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

  it('maps browser / auth network failures to a clear Chinese retry message', () => {
    expect(formatUserError(new TypeError('Failed to fetch'))).toBe(
      NETWORK_FAILURE_MESSAGE,
    );
    expect(formatUserError(new Error('请求失败'))).toBe(NETWORK_FAILURE_MESSAGE);
    expect(
      formatUserError({
        name: 'AuthRetryableFetchError',
        message: 'Failed to fetch',
        status: 0,
      }),
    ).toBe(NETWORK_FAILURE_MESSAGE);
    expect(formatUserError({ status: 0, message: '' })).toBe(
      NETWORK_FAILURE_MESSAGE,
    );
    expect(formatUserError(new TypeError('Cannot read properties of null'))).toBe(
      '出错了，请再试一次。',
    );
  });
});

describe('extractErrorMessage', () => {
  it('reads Error and { message }', () => {
    expect(extractErrorMessage(new Error('x'))).toBe('x');
    expect(extractErrorMessage({ message: 'y' })).toBe('y');
    expect(extractErrorMessage(undefined)).toBe('');
  });
});
