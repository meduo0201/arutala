/** Origin of the hosted Supabase project. Browsers in mainland China should
 *  not call this host directly — go through `/supabase` on the app domain. */
export const SUPABASE_UPSTREAM_ORIGIN =
  'https://iodarvjowrubfatokpxt.supabase.co';

export const SUPABASE_PROXY_PATH = '/supabase';

/**
 * Normalize the client `VITE_SUPABASE_URL`.
 *
 * - Absolute URLs are kept (production: `https://20270227.xyz/supabase`).
 * - Path-only values like `/supabase` resolve against `origin` so local Vite
 *   and Pages preview hosts share the same env.
 * - A path prefix always ends with `/` so supabase-js `new URL('rest/v1', base)`
 *   keeps `/supabase` instead of replacing that segment.
 * - A bare origin (`https://xxx.supabase.co`) stays without a trailing slash.
 */
export const resolveSupabaseUrl = (raw: string, origin = ''): string => {
  const trimmed = raw.trim();
  if (!trimmed) return '';

  const candidate = trimmed.startsWith('/')
    ? `${origin.replace(/\/+$/, '')}${trimmed}`
    : trimmed;

  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    return trimmed;
  }

  const prefix = url.pathname.replace(/\/+$/, '');
  if (!prefix || prefix === '/') {
    return url.origin;
  }
  return `${url.origin}${prefix}/`;
};

/** Map an incoming browser request under `/supabase` to the upstream origin. */
export const rewriteSupabaseProxyUrl = (
  requestUrl: string,
  upstream = SUPABASE_UPSTREAM_ORIGIN,
): string => {
  const incoming = new URL(requestUrl);
  const base = upstream.replace(/\/+$/, '');
  let path = incoming.pathname;
  if (path === SUPABASE_PROXY_PATH || path === `${SUPABASE_PROXY_PATH}/`) {
    path = '/';
  } else if (path.startsWith(`${SUPABASE_PROXY_PATH}/`)) {
    path = path.slice(SUPABASE_PROXY_PATH.length);
  }
  return `${base}${path}${incoming.search}`;
};
