import { beforeEach, describe, expect, it, vi } from 'vitest';
import { disableE2ee, getEncryptionMeta, hasEncryptionMeta } from '@/features/e2ee/api';

const getUser = vi.fn();
const maybeSingle = vi.fn();
const eq = vi.fn();
const select = vi.fn();
const from = vi.fn();
const rpc = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { getUser: (...args: unknown[]) => getUser(...args) },
    from: (...args: unknown[]) => from(...args),
    rpc: (...args: unknown[]) => rpc(...args),
  },
}));

describe('getEncryptionMeta', () => {
  beforeEach(() => {
    getUser.mockReset();
    maybeSingle.mockReset();
    eq.mockReset();
    select.mockReset();
    from.mockReset();

    maybeSingle.mockResolvedValue({
      data: { encryption_salt: null, encryption_verifier: null },
      error: null,
    });
    eq.mockReturnValue({ maybeSingle });
    select.mockReturnValue({ eq });
    from.mockReturnValue({ select });
  });

  it('filters profiles by the current user id', async () => {
    getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });

    const result = await getEncryptionMeta();
    expect(result.ok).toBe(true);
    expect(from).toHaveBeenCalledWith('profiles');
    expect(eq).toHaveBeenCalledWith('id', 'user-1');
  });

  it('does not treat a query error as unset', async () => {
    getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });
    maybeSingle.mockResolvedValue({
      data: null,
      error: { message: 'boom' },
    });

    const result = await getEncryptionMeta();
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('expected error');
    expect(hasEncryptionMeta).toBeTypeOf('function');
  });

  it('returns unset when salt/verifier are missing without error', async () => {
    getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });

    const result = await getEncryptionMeta();
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('expected ok');
    expect(hasEncryptionMeta(result)).toBe(false);
  });
});

describe('disableE2ee (F06 / D4)', () => {
  it('uses the owner-only RPC instead of a couple-wide table update', async () => {
    from.mockClear();
    rpc.mockResolvedValue({ data: null, error: null });
    await disableE2ee();
    expect(rpc).toHaveBeenCalledWith('disable_e2ee');
    expect(from).not.toHaveBeenCalled();
  });
});
