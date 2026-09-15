import { describe, expect, it } from 'vitest';
import { needsAal2Challenge } from '@/features/mfa/lib/aal';

describe('needsAal2Challenge (F04)', () => {
  it('does not block users without MFA', () => {
    expect(needsAal2Challenge({ currentLevel: 'aal1', nextLevel: 'aal1' })).toBe(
      false,
    );
    expect(needsAal2Challenge(null)).toBe(false);
    expect(needsAal2Challenge({ currentLevel: null, nextLevel: null })).toBe(
      false,
    );
  });

  it('requires a second factor only when enrolled and session is aal1', () => {
    expect(needsAal2Challenge({ currentLevel: 'aal1', nextLevel: 'aal2' })).toBe(
      true,
    );
    expect(needsAal2Challenge({ currentLevel: 'aal2', nextLevel: 'aal2' })).toBe(
      false,
    );
  });
});
