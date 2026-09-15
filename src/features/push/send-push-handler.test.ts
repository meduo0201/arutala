import { describe, expect, it, vi } from 'vitest';
import { createSendPushHandler } from '../../../supabase/functions/send-push/handler.ts';
import {
  isVerifiedServiceCredential,
  resolveTargetUserIds,
} from '../../../supabase/functions/send-push/authz.ts';
import {
  sanitizeNotificationUrl,
  normalizePushBody,
} from '../../../supabase/functions/send-push/payload.ts';

const USER_A = '11111111-1111-4111-8111-111111111111';
const USER_B = '22222222-2222-4222-8222-222222222222';
const USER_C = '33333333-3333-4333-8333-333333333333';
const COUPLE_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const SERVICE_KEY = 'sb_secret_test_service_role_key';
const JWT_SECRET = 'test-jwt-secret-value';

const b64url = (bytes: Uint8Array): string => {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const encodeJson = (value: unknown): string =>
  b64url(new TextEncoder().encode(JSON.stringify(value)));

const signHs256 = async (
  payload: Record<string, unknown>,
  secret: string,
): Promise<string> => {
  const header = encodeJson({ alg: 'HS256', typ: 'JWT' });
  const body = encodeJson(payload);
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(`${header}.${body}`),
  );
  return `${header}.${body}.${b64url(new Uint8Array(sig))}`;
};

const forgedServiceJwt = () => {
  const header = encodeJson({ alg: 'HS256', typ: 'JWT' });
  const body = encodeJson({ role: 'service_role', sub: 'attacker' });
  return `${header}.${body}.not-a-real-signature`;
};

const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const post = (handler: (req: Request) => Promise<Response>, init: {
  token: string;
  body: unknown;
}) =>
  handler(
    new Request('https://example.test/send-push', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${init.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(init.body),
    }),
  );

const makeHandler = (overrides?: {
  getUserFromJwt?: (token: string) => Promise<{ id: string } | null>;
  restFetch?: (path: string, init?: RequestInit) => Promise<Response>;
  sendNotification?: ReturnType<typeof vi.fn>;
  jwtSecret?: string;
  cronSecret?: string;
}) => {
  const sendNotification = overrides?.sendNotification ?? vi.fn().mockResolvedValue(undefined);
  const getUserFromJwt =
    overrides?.getUserFromJwt ??
    (async () => null);
  const restFetch =
    overrides?.restFetch ??
    (async (path: string) => {
      if (path.startsWith('couples')) {
        return jsonResponse(200, [
          { user_a_id: USER_A, user_b_id: USER_B },
        ]);
      }
      if (path.startsWith('push_subscriptions')) {
        return jsonResponse(200, [
          {
            id: 'sub-1',
            endpoint: 'https://push.example/sub',
            p256dh: 'p',
            auth: 'a',
          },
        ]);
      }
      return jsonResponse(200, []);
    });

  return {
    sendNotification,
    handler: createSendPushHandler({
      secrets: {
        serviceRoleKey: SERVICE_KEY,
        ...(overrides?.cronSecret ? { cronSecret: overrides.cronSecret } : {}),
        ...(overrides?.jwtSecret ? { jwtSecret: overrides.jwtSecret } : {}),
      },
      supabaseUrl: 'https://example.supabase.co',
      getUserFromJwt,
      sendNotification,
      restFetch,
    }),
  };
};

describe('isVerifiedServiceCredential', () => {
  it('accepts the configured service role key', async () => {
    await expect(
      isVerifiedServiceCredential(SERVICE_KEY, { serviceRoleKey: SERVICE_KEY }),
    ).resolves.toBe(true);
  });

  it('rejects a forged JWT that only claims role=service_role', async () => {
    await expect(
      isVerifiedServiceCredential(forgedServiceJwt(), {
        serviceRoleKey: SERVICE_KEY,
        jwtSecret: JWT_SECRET,
      }),
    ).resolves.toBe(false);
  });

  it('accepts a JWT only after HS256 verification', async () => {
    const token = await signHs256({ role: 'service_role' }, JWT_SECRET);
    await expect(
      isVerifiedServiceCredential(token, {
        serviceRoleKey: SERVICE_KEY,
        jwtSecret: JWT_SECRET,
      }),
    ).resolves.toBe(true);
  });
});

describe('resolveTargetUserIds', () => {
  it('lets a user target only themselves', () => {
    expect(
      resolveTargetUserIds({ user_id: USER_A }, USER_A, false),
    ).toEqual([USER_A]);
    expect(() =>
      resolveTargetUserIds({ user_id: USER_B }, USER_A, false),
    ).toThrowError(/another user/);
  });

  it('requires verified couple membership for user callers', () => {
    expect(() =>
      resolveTargetUserIds(
        {
          couple_id: COUPLE_ID,
          couple: { user_a_id: USER_A, user_b_id: USER_B },
        },
        USER_C,
        false,
      ),
    ).toThrowError(/Not a member/);
    expect(
      resolveTargetUserIds(
        {
          couple_id: COUPLE_ID,
          couple: { user_a_id: USER_A, user_b_id: USER_B },
        },
        USER_A,
        false,
      ),
    ).toEqual([USER_A, USER_B]);
  });
});

describe('notification payload guards', () => {
  it('rejects non same-origin URLs', () => {
    expect(() => sanitizeNotificationUrl('https://evil.example/x')).toThrow();
    expect(() => sanitizeNotificationUrl('//evil.example')).toThrow();
    expect(() => sanitizeNotificationUrl('javascript:alert(1)')).toThrow();
    expect(sanitizeNotificationUrl('/calendar')).toBe('/calendar');
  });

  it('bounds title/body and validates UUIDs', () => {
    expect(() =>
      normalizePushBody({ title: 'x'.repeat(81), body: 'ok' }),
    ).toThrowError(/title too long/);
    expect(() =>
      normalizePushBody({
        title: 'ok',
        body: 'ok',
        user_id: 'not-a-uuid',
      }),
    ).toThrowError(/user_id/);
  });
});

describe('send-push handler (mocked send boundary)', () => {
  it('does not trust a decode-only service_role JWT', async () => {
    const { handler, sendNotification } = makeHandler({
      jwtSecret: JWT_SECRET,
    });
    const res = await post(handler, {
      token: forgedServiceJwt(),
      body: { title: 't', body: 'b', user_id: USER_B },
    });
    expect(res.status).toBe(401);
    expect(sendNotification).not.toHaveBeenCalled();
  });

  it('lets a verified service credential target another user', async () => {
    const { handler, sendNotification } = makeHandler();
    const res = await post(handler, {
      token: SERVICE_KEY,
      body: { title: '提醒', body: '明天', user_id: USER_B, url: '/home' },
    });
    expect(res.status).toBe(200);
    expect(sendNotification).toHaveBeenCalledTimes(1);
    const payload = JSON.parse(
      sendNotification.mock.calls[0]?.[1] as string,
    ) as { url: string };
    expect(payload.url).toBe('/home');
  });

  it('blocks a user from targeting another user_id', async () => {
    const { handler, sendNotification } = makeHandler({
      getUserFromJwt: async () => ({ id: USER_A }),
    });
    const res = await post(handler, {
      token: 'user-jwt',
      body: { title: 't', body: 'b', user_id: USER_B },
    });
    expect(res.status).toBe(403);
    expect(sendNotification).not.toHaveBeenCalled();
  });

  it('blocks a user from targeting a couple they are not in', async () => {
    const { handler, sendNotification } = makeHandler({
      getUserFromJwt: async () => ({ id: USER_C }),
    });
    const res = await post(handler, {
      token: 'user-jwt',
      body: { title: 't', body: 'b', couple_id: COUPLE_ID },
    });
    expect(res.status).toBe(403);
    expect(sendNotification).not.toHaveBeenCalled();
  });

  it('allows a couple member to fan-out after membership check', async () => {
    const { handler, sendNotification } = makeHandler({
      getUserFromJwt: async () => ({ id: USER_B }),
    });
    const res = await post(handler, {
      token: 'user-jwt',
      body: { title: 't', body: 'b', couple_id: COUPLE_ID },
    });
    expect(res.status).toBe(200);
    expect(sendNotification).toHaveBeenCalled();
  });

  it('rejects an absolute notification URL', async () => {
    const { handler } = makeHandler({
      getUserFromJwt: async () => ({ id: USER_A }),
    });
    const res = await post(handler, {
      token: 'user-jwt',
      body: { title: 't', body: 'b', url: 'https://evil.example' },
    });
    expect(res.status).toBe(400);
  });

  it('rate-limits repeated user calls', async () => {
    const { handler } = makeHandler({
      getUserFromJwt: async () => ({ id: USER_A }),
    });
    let last = 200;
    for (let i = 0; i < 12; i++) {
      const res = await post(handler, {
        token: 'user-jwt',
        body: { title: 't', body: 'b' },
      });
      last = res.status;
    }
    expect(last).toBe(429);
  });
});
