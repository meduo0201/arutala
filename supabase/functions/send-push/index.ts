    // Supabase Edge Function: send-push
// =============================================================================
// Receives request, resolve push_subscriptions via PostgREST, send Web Push via
// web-push lib.
//
// Auth modes:
//   1. Service-role (for pg_cron / scheduled jobs):
//      Authorization: Bearer <SERVICE_ROLE_KEY>
//      → Trusted, can target any user_id.
//   2. User JWT (for self-test trigger from app):
//      Authorization: Bearer <user_access_token>
//      → Targets only auth.uid() — kalau body kasih user_id lain, di-override.
//
// Body shape:
//   {
//     user_id?: string,    // service-role only; ignored kalau user-mode
//     couple_id?: string,  // optional, fan out ke 2 user di couple
//     title: string,
//     body: string,        // Generic content per audit I-04 (no sensitive data)
//     url?: string,        // path to open on click, default '/'
//     tag?: string         // optional tag for collapsing
//   }
//
// Stale subscription handling:
//   - HTTP 410 / 404 dari push service → soft-delete row di push_subscriptions
//   - Other errors → log, continue dengan recipient lain.
//
// NOTE: 4-space indent di line 1 supaya survives Mgmt API body deploy quirk
// (pertama 4 chars di-strip).
// =============================================================================

import webpush from 'npm:web-push@3.6.7';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const VAPID_PUBLIC = Deno.env.get('PUSH_VAPID_PUBLIC_KEY')!;
const VAPID_PRIVATE = Deno.env.get('PUSH_VAPID_PRIVATE_KEY')!;
const VAPID_SUBJECT = Deno.env.get('PUSH_VAPID_SUBJECT') ?? 'mailto:you@example.com';

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);

interface SendPushBody {
  user_id?: string;
  couple_id?: string;
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

interface SubscriptionRow {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

const json = (status: number, payload: unknown) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

// PostgREST helper — uses service-role key directly for full DB access.
const restFetch = async (path: string, init?: RequestInit): Promise<Response> => {
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
};

const isServiceRole = (token: string): boolean => {
  // Match auto-injected sb_secret_* (new format) OR legacy JWT with
  // role=service_role claim. Edge Function env has sb_secret_*, but
  // pg_cron/vault stores legacy JWT — accept either.
  if (token === SERVICE_ROLE_KEY) return true;
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  try {
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload?.role === 'service_role';
  } catch {
    return false;
  }
};

// Verify user JWT via Supabase Auth GoTrue endpoint
const getUserFromJWT = async (token: string): Promise<{ id: string } | null> => {
  const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${token}`,
    },
  });
  if (!r.ok) return null;
  const data = await r.json();
  return data?.id ? { id: data.id as string } : null;
};

const resolveTargetUserIds = async (
  body: SendPushBody,
  callerUserId: string | null,
  serviceMode: boolean,
): Promise<string[]> => {
  if (body.couple_id) {
    const r = await restFetch(
      `couples?id=eq.${body.couple_id}&status=eq.active&select=user_a_id,user_b_id`,
    );
    if (!r.ok) return [];
    const rows = (await r.json()) as Array<{ user_a_id: string; user_b_id: string }>;
    if (rows.length === 0) return [];
    const row = rows[0];
    const ids: string[] = [];
    if (row.user_a_id) ids.push(row.user_a_id);
    if (row.user_b_id) ids.push(row.user_b_id);
    return ids;
  }

  if (serviceMode && body.user_id) return [body.user_id];
  if (callerUserId) return [callerUserId];
  return [];
};

const fetchSubscriptions = async (userIds: string[]): Promise<SubscriptionRow[]> => {
  if (userIds.length === 0) return [];
  // PostgREST in.(...) wants raw UUIDs, NO quotes (quotes only buat string
  // dengan special chars). Wrong: in.("abc","def") — interpreted as quoted
  // strings + UUID column comparison fails. Right: in.(abc,def).
  const inList = userIds.join(',');
  const r = await restFetch(
    `push_subscriptions?user_id=in.(${inList})&deleted_at=is.null&select=id,endpoint,p256dh,auth`,
  );
  if (!r.ok) {
    console.error('fetchSubscriptions error:', r.status, await r.text());
    return [];
  }
  return (await r.json()) as SubscriptionRow[];
};

const softDeleteSubscription = async (id: string): Promise<void> => {
  await restFetch(`push_subscriptions?id=eq.${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ deleted_at: new Date().toISOString() }),
  });
};

const sendOne = async (
  sub: SubscriptionRow,
  payload: { title: string; body: string; url?: string; tag?: string },
): Promise<{ id: string; ok: boolean; status?: number }> => {
  try {
    await webpush.sendNotification(
      {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      },
      JSON.stringify(payload),
      { TTL: 60 * 60 * 24 },
    );
    return { id: sub.id, ok: true };
  } catch (e) {
    const status = (e as { statusCode?: number }).statusCode;
    if (status === 404 || status === 410) {
      await softDeleteSubscription(sub.id);
    } else {
      console.error(`Push fail [${sub.id}]:`, e);
    }
    return { id: sub.id, ok: false, status };
  }
};

Deno.serve(async (req) => {
  // Health check — GET returns ok (no body required, no auth check)
  if (req.method === 'GET') {
    return json(200, { ok: true, service: 'send-push' });
  }

  if (req.method !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }

  const auth = req.headers.get('Authorization') ?? '';
  const token = auth.replace(/^Bearer\s+/i, '');
  if (!token) return json(401, { error: 'Missing Authorization' });

  const serviceMode = isServiceRole(token);

  let callerUserId: string | null = null;
  if (!serviceMode) {
    const user = await getUserFromJWT(token);
    if (!user) return json(401, { error: 'Invalid token' });
    callerUserId = user.id;
  }

  let body: SendPushBody;
  try {
    body = (await req.json()) as SendPushBody;
  } catch {
    return json(400, { error: 'Invalid JSON body' });
  }
  if (!body.title || !body.body) {
    return json(400, { error: 'Missing title or body' });
  }

  const targetUserIds = await resolveTargetUserIds(body, callerUserId, serviceMode);
  if (targetUserIds.length === 0) {
    return json(404, { error: 'No target users resolved' });
  }

  const subscriptions = await fetchSubscriptions(targetUserIds);
  if (subscriptions.length === 0) {
    return json(200, { sent: 0, results: [], note: 'No active subscriptions' });
  }

  const payload = {
    title: body.title,
    body: body.body,
    url: body.url ?? '/',
    tag: body.tag,
  };

  const results = await Promise.all(subscriptions.map((s) => sendOne(s, payload)));
  const sent = results.filter((r) => r.ok).length;

  return json(200, { sent, results });
});
