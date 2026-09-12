import { describe, expect, it } from 'vitest';
import { loginSchema, signupSchema } from './schemas';

describe('loginSchema', () => {
  it('accepts a username and password', () => {
    const parsed = loginSchema.parse({ username: 'alice', password: 'secret' });
    expect(parsed.username).toBe('alice');
  });

  it('rejects an email-shaped value', () => {
    const result = loginSchema.safeParse({
      username: 'alice@gmail.com',
      password: 'secret',
    });
    expect(result.success).toBe(false);
  });
});

describe('signupSchema', () => {
  const base = {
    username: 'alice',
    password: 'secret1',
    confirmPassword: 'secret1',
  };

  it('accepts username + short password without complexity rules', () => {
    expect(signupSchema.parse(base).username).toBe('alice');
  });

  it('accepts a lowercase password with no symbols', () => {
    const parsed = signupSchema.parse({
      ...base,
      password: 'aaaaaa',
      confirmPassword: 'aaaaaa',
    });
    expect(parsed.password).toBe('aaaaaa');
  });

  it('does not require birth date or consent fields', () => {
    const result = signupSchema.safeParse(base);
    expect(result.success).toBe(true);
  });

  it('rejects a password shorter than 6 characters', () => {
    const result = signupSchema.safeParse({
      ...base,
      password: '12345',
      confirmPassword: '12345',
    });
    expect(result.success).toBe(false);
  });

  it('rejects mismatched confirmation', () => {
    const result = signupSchema.safeParse({
      ...base,
      confirmPassword: 'other1',
    });
    expect(result.success).toBe(false);
  });

  it('rejects email as username', () => {
    const result = signupSchema.safeParse({ ...base, username: 'a@b.com' });
    expect(result.success).toBe(false);
  });
});
