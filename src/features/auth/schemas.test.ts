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

describe('login and signup share username rules', () => {
  const invalid = ['1alice', '_alice', 'ab', 'alice@x'];
  const valid = ['alice', 'Alice_01', 'bob2'];

  it.each(valid)('accepts %s on both forms', (username) => {
    expect(loginSchema.safeParse({ username, password: 'secret' }).success).toBe(
      true,
    );
    expect(
      signupSchema.safeParse({
        username,
        password: 'secret1',
        confirmPassword: 'secret1',
      }).success,
    ).toBe(true);
  });

  it.each(invalid)('rejects %s on both forms', (username) => {
    const login = loginSchema.safeParse({ username, password: 'secret' });
    const signup = signupSchema.safeParse({
      username,
      password: 'secret1',
      confirmPassword: 'secret1',
    });
    expect(login.success).toBe(false);
    expect(signup.success).toBe(false);
    if (!login.success && !signup.success) {
      expect(login.error.issues[0]?.message).toBe(
        signup.error.issues[0]?.message,
      );
    }
  });
});
