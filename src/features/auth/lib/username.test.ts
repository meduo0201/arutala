import { describe, expect, it } from 'vitest';
import {
  isValidUsername,
  normalizeUsername,
  toSyntheticEmail,
  USERNAME_INVALID_MESSAGE,
  USERNAME_RULE_HINT,
  usernameFromAuthEmail,
} from './username';

describe('username mapping', () => {
  it('maps a username to a stable synthetic email', () => {
    expect(toSyntheticEmail('Alice')).toBe('alice@users.local');
    expect(toSyntheticEmail(' bob_1 ')).toBe('bob_1@users.local');
  });

  it('never returns the synthetic domain for display', () => {
    expect(usernameFromAuthEmail('alice@users.local')).toBe('alice');
    expect(usernameFromAuthEmail(undefined)).toBe('');
  });

  it('accepts English letters with optional digits/underscore', () => {
    expect(isValidUsername('alice')).toBe(true);
    expect(isValidUsername('Alice_01')).toBe(true);
    expect(isValidUsername('ab')).toBe(false);
    expect(isValidUsername('alice@gmail.com')).toBe(false);
    expect(isValidUsername('1alice')).toBe(false);
  });

  it('normalizes case for login/signup consistency', () => {
    expect(normalizeUsername('Alice_01')).toBe('alice_01');
  });

  it('exposes the shared username rule copy', () => {
    expect(USERNAME_RULE_HINT).toBe('英文字母开头，可含数字或下划线');
    expect(USERNAME_INVALID_MESSAGE).toBe('英文字母开头，可含数字或下划线。');
  });
});
