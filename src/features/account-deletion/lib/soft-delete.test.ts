import { describe, expect, it } from 'vitest';
import {
  ACCOUNT_SOFT_DELETED_MESSAGE,
  isProfileSoftDeleted,
} from '@/features/account-deletion/lib/soft-delete';

describe('soft-deleted account (F09 / D5)', () => {
  it('treats deleted_at as blocked, not as a live account', () => {
    expect(isProfileSoftDeleted({ deleted_at: '2026-05-01T00:00:00Z' })).toBe(
      true,
    );
    expect(isProfileSoftDeleted({ deleted_at: null })).toBe(false);
    expect(ACCOUNT_SOFT_DELETED_MESSAGE).toContain('无法自助恢复');
  });
});
