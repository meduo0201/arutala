    // Supabase Edge Function: send-push
// =============================================================================
// Auth:
//   1. Service credential (pg_cron / scheduled jobs):
//      Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>
//      or Bearer <SEND_PUSH_CRON_SECRET>
//      or a JWT signed with SUPABASE_JWT_SECRET whose role is service_role.
//      Decode-only "role":"service_role" is rejected.
//   2. User JWT (self-test from the app): verified via Auth /user.
//      May only target self, or a couple the caller belongs to.
//
// NOTE: 4-space indent on line 1 so this survives the Mgmt API body-deploy
// quirk (first 4 chars stripped).
// =============================================================================

import webpush from 'npm:web-push@3.6.7';
import { createSendPushHandler } from './handler.ts';
import { fetchWithTimeout } from './timing.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const CRON_SECRET = Deno.env.get('SEND_PUSH_CRON_SECRET') ?? '';
const JWT_SECRET = Deno.env.get('SUPABASE_JWT_SECRET') ?? '';
const VAPID_PUBLIC = Deno.env.get('PUSH_VAPID_PUBLIC_KEY') ?? '';
const VAPID_PRIVATE = Deno.env.get('PUSH_VAPID_PRIVATE_KEY') ?? '';
const VAPID_SUBJECT =
  Deno.env.get('PUSH_VAPID_SUBJECT') ?? 'mailto:you@example.com';

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
}

const getUserFromJwt = async (token: string): Promise<{ id: string } | null> => {
  const r = await fetchWithTimeout(
    `${SUPABASE_URL}/auth/v1/user`,
    {
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${token}`,
      },
    },
    5_000,
  );
  if (!r.ok) return null;
  const data = (await r.json()) as { id?: string };
  return data?.id ? { id: data.id } : null;
};

const handler = createSendPushHandler({
  secrets: {
    serviceRoleKey: SERVICE_ROLE_KEY,
    ...(CRON_SECRET ? { cronSecret: CRON_SECRET } : {}),
    ...(JWT_SECRET ? { jwtSecret: JWT_SECRET } : {}),
  },
  supabaseUrl: SUPABASE_URL,
  getUserFromJwt,
  sendNotification: async (sub, payload) => {
    await webpush.sendNotification(
      {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth },
      },
      payload,
      { TTL: 60 * 60 * 24 },
    );
  },
});

Deno.serve(handler);
