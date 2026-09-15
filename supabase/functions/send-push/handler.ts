import {
  AuthzError,
  isVerifiedServiceCredential,
  resolveTargetUserIds,
  type CoupleMembers,
  type ServiceSecrets,
} from './authz.ts';
import { PayloadError, normalizePushBody } from './payload.ts';
import { createRateLimiter } from './rate-limit.ts';
import { fetchWithTimeout, withTimeout } from './timing.ts';

export interface SubscriptionRow {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

export interface SendNotificationInput {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export interface SendPushDeps {
  secrets: ServiceSecrets;
  supabaseUrl: string;
  restFetch?: (path: string, init?: RequestInit) => Promise<Response>;
  getUserFromJwt: (token: string) => Promise<{ id: string } | null>;
  sendNotification: (
    sub: SendNotificationInput,
    payload: string,
  ) => Promise<void>;
  fetchImpl?: typeof fetch;
  restTimeoutMs?: number;
  sendTimeoutMs?: number;
  userRate?: { windowMs: number; max: number };
  serviceRate?: { windowMs: number; max: number };
  now?: () => number;
}

const json = (status: number, payload: unknown): Response =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const defaultUserRate = { windowMs: 60_000, max: 10 };
const defaultServiceRate = { windowMs: 60_000, max: 120 };

export const createSendPushHandler = (deps: SendPushDeps) => {
  const restTimeoutMs = deps.restTimeoutMs ?? 5_000;
  const sendTimeoutMs = deps.sendTimeoutMs ?? 10_000;
  const fetchImpl = deps.fetchImpl ?? fetch;
  const now = deps.now ?? Date.now;
  const userLimiter = createRateLimiter(deps.userRate ?? defaultUserRate);
  const serviceLimiter = createRateLimiter(
    deps.serviceRate ?? defaultServiceRate,
  );

  const restFetch =
    deps.restFetch ??
    ((path: string, init?: RequestInit) =>
      fetchWithTimeout(
        `${deps.supabaseUrl}/rest/v1/${path}`,
        {
          ...init,
          headers: {
            apikey: deps.secrets.serviceRoleKey,
            Authorization: `Bearer ${deps.secrets.serviceRoleKey}`,
            'Content-Type': 'application/json',
            ...(init?.headers ?? {}),
          },
        },
        restTimeoutMs,
        fetchImpl,
      ));

  const fetchCouple = async (
    coupleId: string,
  ): Promise<CoupleMembers | null> => {
    const r = await restFetch(
      `couples?id=eq.${coupleId}&status=eq.active&select=user_a_id,user_b_id`,
    );
    if (!r.ok) return null;
    const rows = (await r.json()) as CoupleMembers[];
    return rows[0] ?? null;
  };

  const fetchSubscriptions = async (
    userIds: string[],
  ): Promise<SubscriptionRow[]> => {
    if (userIds.length === 0) return [];
    const inList = userIds.join(',');
    const r = await restFetch(
      `push_subscriptions?user_id=in.(${inList})&deleted_at=is.null&select=id,endpoint,p256dh,auth`,
    );
    if (!r.ok) return [];
    return (await r.json()) as SubscriptionRow[];
  };

  const softDeleteSubscription = async (id: string): Promise<void> => {
    await restFetch(`push_subscriptions?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ deleted_at: new Date(now()).toISOString() }),
    });
  };

  return async (req: Request): Promise<Response> => {
    if (req.method === 'GET') {
      return json(200, { ok: true, service: 'send-push' });
    }
    if (req.method !== 'POST') {
      return json(405, { error: 'Method not allowed' });
    }

    const auth = req.headers.get('Authorization') ?? '';
    const token = auth.replace(/^Bearer\s+/i, '');
    if (!token) return json(401, { error: 'Missing Authorization' });

    let serviceMode = false;
    try {
      serviceMode = await isVerifiedServiceCredential(
        token,
        deps.secrets,
        now(),
      );
    } catch {
      return json(401, { error: 'Invalid token' });
    }

    let callerUserId: string | null = null;
    if (!serviceMode) {
      const user = await deps.getUserFromJwt(token);
      if (!user) return json(401, { error: 'Invalid token' });
      callerUserId = user.id;
    }

    const rateKey = serviceMode ? 'service' : `user:${callerUserId}`;
    const limiter = serviceMode ? serviceLimiter : userLimiter;
    if (!limiter.take(rateKey, now())) {
      return json(429, { error: 'Rate limit exceeded' });
    }

    let raw: unknown;
    try {
      raw = await req.json();
    } catch {
      return json(400, { error: 'Invalid JSON body' });
    }

    let body;
    try {
      body = normalizePushBody(raw);
    } catch (e) {
      if (e instanceof PayloadError) return json(e.status, { error: e.message });
      return json(400, { error: 'Invalid JSON body' });
    }

    let couple: CoupleMembers | null = null;
    if (body.couple_id) {
      try {
        couple = await fetchCouple(body.couple_id);
      } catch {
        return json(504, { error: 'Upstream timeout' });
      }
    }

    let targetUserIds: string[];
    try {
      targetUserIds = resolveTargetUserIds(
        { user_id: body.user_id, couple_id: body.couple_id, couple },
        callerUserId,
        serviceMode,
      );
    } catch (e) {
      if (e instanceof AuthzError) return json(e.status, { error: e.message });
      return json(500, { error: 'Failed to resolve targets' });
    }

    let subscriptions: SubscriptionRow[];
    try {
      subscriptions = await fetchSubscriptions(targetUserIds);
    } catch {
      return json(504, { error: 'Upstream timeout' });
    }

    if (subscriptions.length === 0) {
      return json(200, { sent: 0, results: [], note: 'No active subscriptions' });
    }

    const payload = {
      title: body.title,
      body: body.body,
      url: body.url,
      tag: body.tag,
    };

    const results = await Promise.all(
      subscriptions.map(async (sub) => {
        try {
          await withTimeout(
            deps.sendNotification(
              {
                endpoint: sub.endpoint,
                keys: { p256dh: sub.p256dh, auth: sub.auth },
              },
              JSON.stringify(payload),
            ),
            sendTimeoutMs,
            'Push send timed out',
          );
          return { id: sub.id, ok: true as const };
        } catch (e) {
          const status = (e as { statusCode?: number }).statusCode;
          if (status === 404 || status === 410) {
            await softDeleteSubscription(sub.id);
          }
          return { id: sub.id, ok: false as const, status };
        }
      }),
    );

    const sent = results.filter((r) => r.ok).length;
    return json(200, { sent, results });
  };
};
