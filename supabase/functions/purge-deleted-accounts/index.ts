    // Supabase Edge Function: purge-deleted-accounts
// Soft-deleted profiles older than 30 days: wipe app rows via RPC, then
// delete auth.users. Auth uses the function env service role — never VITE_*.
//
// NOTE: 4-space indent on line 1 for the Mgmt API body-deploy quirk.

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const CRON_SECRET = Deno.env.get('PURGE_CRON_SECRET') ?? '';

const json = (status: number, payload: unknown) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const isService = (token: string): boolean => {
  if (!token || !SERVICE_ROLE_KEY) return false;
  if (token === SERVICE_ROLE_KEY) return true;
  return Boolean(CRON_SECRET) && token === CRON_SECRET;
};

Deno.serve(async (req) => {
  if (req.method === 'GET') {
    return json(200, { ok: true, service: 'purge-deleted-accounts' });
  }
  if (req.method !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }

  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!isService(token)) {
    return json(401, { error: 'Unauthorized' });
  }

  const rpc = await fetch(`${SUPABASE_URL}/rest/v1/rpc/purge_deleted_accounts`, {
    method: 'POST',
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify({ p_older_than: '30 days' }),
  });

  if (!rpc.ok) {
    return json(502, { error: 'purge_deleted_accounts failed', detail: await rpc.text() });
  }

  const rows = (await rpc.json()) as Array<{ user_id?: string } | string>;
  const ids = rows
    .map((r) => (typeof r === 'string' ? r : r.user_id))
    .filter((id): id is string => Boolean(id));

  const deleted: string[] = [];
  for (const id of ids) {
    const del = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${id}`, {
      method: 'DELETE',
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      },
    });
    if (del.ok || del.status === 404) deleted.push(id);
  }

  return json(200, { purged: deleted.length, user_ids: deleted });
});
