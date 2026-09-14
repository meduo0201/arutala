// Cloudflare Pages Function: same-origin reverse proxy for Supabase.
//
//   https://20270227.xyz/supabase/*  →  https://<project>.supabase.co/*
//
// Browsers in mainland China often cannot reach *.supabase.co. The SPA talks
// only to this domain; the Worker (PoP outside the GFW) fetches upstream.
//
// WebSocket upgrades (Realtime) are forwarded by passing the original Request
// to fetch() — the Workers runtime proxies the socket.

const DEFAULT_UPSTREAM = 'https://iodarvjowrubfatokpxt.supabase.co';
const PROXY_PREFIX = '/supabase';

const HOP_BY_HOP = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailers',
  'transfer-encoding',
  'upgrade',
  'host',
  'cf-connecting-ip',
  'cf-ipcountry',
  'cf-ray',
  'cf-visitor',
  'cf-ew-via',
  'cdn-loop',
]);

type PagesContext = {
  request: Request;
  env: Record<string, string | undefined>;
};

const rewriteUpstreamUrl = (requestUrl: string, upstream: string): string => {
  const incoming = new URL(requestUrl);
  const base = upstream.replace(/\/+$/, '');
  let path = incoming.pathname;
  if (path === PROXY_PREFIX || path === `${PROXY_PREFIX}/`) {
    path = '/';
  } else if (path.startsWith(`${PROXY_PREFIX}/`)) {
    path = path.slice(PROXY_PREFIX.length);
  }
  return `${base}${path}${incoming.search}`;
};

const copyHeaders = (source: Headers): Headers => {
  const headers = new Headers();
  source.forEach((value, key) => {
    if (HOP_BY_HOP.has(key.toLowerCase())) return;
    headers.set(key, value);
  });
  return headers;
};

const gatewayError = (): Response =>
  new Response(
    JSON.stringify({
      error: 'network_error',
      message: '网络连接失败，请稍后重试',
    }),
    {
      status: 502,
      headers: { 'content-type': 'application/json; charset=utf-8' },
    },
  );

export const onRequest = async (context: PagesContext): Promise<Response> => {
  const { request, env } = context;
  const upstream = (env.SUPABASE_UPSTREAM_URL ?? DEFAULT_UPSTREAM).trim();
  const targetUrl = rewriteUpstreamUrl(request.url, upstream);
  const isWebSocket =
    request.headers.get('Upgrade')?.toLowerCase() === 'websocket';

  try {
    if (isWebSocket) {
      // Pass the original request so Upgrade / Sec-WebSocket-* stay intact.
      return await fetch(targetUrl, request);
    }

    const headers = copyHeaders(request.headers);
    const init: RequestInit = {
      method: request.method,
      headers,
      redirect: 'follow',
    };

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      init.body = request.body;
      // Required when streaming a request body in the Fetch spec.
      (init as RequestInit & { duplex?: 'half' }).duplex = 'half';
    }

    const upstreamResponse = await fetch(targetUrl, init);
    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: copyHeaders(upstreamResponse.headers),
    });
  } catch {
    return gatewayError();
  }
};
