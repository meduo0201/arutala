-- Migration 0012: push_subscriptions table + RPCs (Phase 4 Track C1)
-- =============================================================================
-- Tabel menyimpan Web Push subscriptions per device. User punya banyak device
-- (HP, laptop) — setiap PushManager.subscribe() generate unique endpoint per
-- device + browser instance.
--
-- Schema:
--   user_id      uuid    pemilik subscription (auth.uid())
--   endpoint     text    URL push service (FCM, Apple, dll). UNIQUE per row.
--   p256dh       text    public key untuk content encryption (web-push spec)
--   auth         text    auth secret (web-push spec)
--   label        text    nullable, user-friendly device label
--   created_at   timestamptz default now()
--   deleted_at   timestamptz nullable, set saat unsubscribe atau 410 stale
--
-- RLS: user see own subscriptions only. Service role (Edge Function) bypass
--      via SECURITY DEFINER function (called server-side).
-- =============================================================================

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  label text,
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint push_subscriptions_endpoint_unique unique (endpoint)
);

create index idx_push_subscriptions_user
  on public.push_subscriptions (user_id)
  where deleted_at is null;

alter table public.push_subscriptions enable row level security;

create policy "Users see own push subscriptions"
  on public.push_subscriptions for select
  to authenticated
  using (user_id = (select auth.uid()) and deleted_at is null);

create policy "Users delete own push subscriptions"
  on public.push_subscriptions for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

grant select, update on public.push_subscriptions to authenticated;

-- =============================================================================
-- RPC: register_push_subscription
-- Idempotent upsert by endpoint. Restore deleted_at=null kalau previously
-- soft-deleted (re-subscribe).
-- =============================================================================

create or replace function public.register_push_subscription(
  p_endpoint text,
  p_p256dh text,
  p_auth text,
  p_label text default null
) returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_id uuid;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;
  if p_endpoint is null or p_p256dh is null or p_auth is null then
    raise exception 'Missing required subscription fields';
  end if;

  insert into public.push_subscriptions (user_id, endpoint, p256dh, auth, label)
  values (v_user_id, p_endpoint, p_p256dh, p_auth, p_label)
  on conflict (endpoint) do update
    set user_id = excluded.user_id,
        p256dh = excluded.p256dh,
        auth = excluded.auth,
        label = coalesce(excluded.label, public.push_subscriptions.label),
        deleted_at = null
  returning id into v_id;

  return v_id;
end;
$function$;

revoke execute on function public.register_push_subscription(text, text, text, text) from public, anon;
grant execute on function public.register_push_subscription(text, text, text, text) to authenticated;

-- =============================================================================
-- RPC: unregister_push_subscription
-- Soft-delete by endpoint, scoped ke current user.
-- =============================================================================

create or replace function public.unregister_push_subscription(p_endpoint text)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  update public.push_subscriptions
  set deleted_at = now()
  where endpoint = p_endpoint
    and user_id = v_user_id
    and deleted_at is null;
end;
$function$;

revoke execute on function public.unregister_push_subscription(text) from public, anon;
grant execute on function public.unregister_push_subscription(text) to authenticated;
