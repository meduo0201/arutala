import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { checkPasswordPwned } from '@/lib/hibp';

describe('hibp: SHA-1 prefix request', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('queries with first 5 chars of SHA-1(password)', async () => {
    // SHA-1('password') = 5BAA61E4C9B93F3F0682250B6CF8331B7EE68FD8
    // Prefix: 5BAA6, suffix: 1E4C9B93F3F0682250B6CF8331B7EE68FD8
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () =>
        '1E4C9B93F3F0682250B6CF8331B7EE68FD8:9999999\r\nFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF:1',
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await checkPasswordPwned('password');

    expect(fetchMock).toHaveBeenCalledOnce();
    const url = fetchMock.mock.calls[0]?.[0] as string;
    expect(url).toContain('/range/5BAA6');
    expect(result.pwned).toBe(true);
    expect(result.count).toBe(9999999);
  });

  it('returns not pwned for unique passphrase not in response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        text: async () =>
          'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA:1\r\nBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB:5',
      }),
    );
    const result = await checkPasswordPwned('arutala-unique-passphrase-xyz!');
    expect(result.pwned).toBe(false);
    expect(result.count).toBe(0);
  });

  it('handles network failure with fail-open (pwned=false)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    const result = await checkPasswordPwned('any');
    expect(result.pwned).toBe(false);
    expect(result.count).toBe(0);
  });

  it('handles HTTP error with fail-open', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, text: async () => '' }),
    );
    const result = await checkPasswordPwned('any');
    expect(result.pwned).toBe(false);
  });

  it('returns pwned=false for empty input (no API call)', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const result = await checkPasswordPwned('');
    expect(result.pwned).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('sends Add-Padding header (anti traffic-analysis)', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => '',
    });
    vi.stubGlobal('fetch', fetchMock);
    await checkPasswordPwned('test');
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(init?.headers).toMatchObject({ 'Add-Padding': 'true' });
  });
});
