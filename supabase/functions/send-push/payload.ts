export const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const TITLE_MAX = 80;
export const BODY_MAX = 200;
export const TAG_MAX = 64;

export class PayloadError extends Error {
  readonly status = 400;
  constructor(message: string) {
    super(message);
    this.name = 'PayloadError';
  }
}

export const isUuid = (value: unknown): value is string =>
  typeof value === 'string' && UUID_RE.test(value);

export const requireUuid = (value: unknown, field: string): string => {
  if (!isUuid(value)) {
    throw new PayloadError(`Invalid ${field}`);
  }
  return value;
};

const asNonEmptyString = (value: unknown, field: string, max: number): string => {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new PayloadError(`Missing ${field}`);
  }
  if (value.length > max) {
    throw new PayloadError(`${field} too long`);
  }
  return value;
};

/**
 * Notification click URL must be a same-origin path.
 * Rejects schemes, protocol-relative URLs, backslashes, and control chars.
 */
export const sanitizeNotificationUrl = (url: unknown): string => {
  if (url == null || url === '') return '/';
  if (typeof url !== 'string') {
    throw new PayloadError('Invalid url');
  }
  const trimmed = url.trim();
  if (
    !trimmed.startsWith('/') ||
    trimmed.startsWith('//') ||
    trimmed.includes('\\') ||
    trimmed.includes('\0') ||
    /[\r\n]/.test(trimmed) ||
    /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)
  ) {
    throw new PayloadError('url must be a same-origin path');
  }
  return trimmed;
};

export interface NormalizedPushBody {
  user_id?: string;
  couple_id?: string;
  title: string;
  body: string;
  url: string;
  tag?: string;
}

export const normalizePushBody = (raw: unknown): NormalizedPushBody => {
  if (!raw || typeof raw !== 'object') {
    throw new PayloadError('Invalid JSON body');
  }
  const body = raw as Record<string, unknown>;
  const title = asNonEmptyString(body['title'], 'title', TITLE_MAX);
  const text = asNonEmptyString(body['body'], 'body', BODY_MAX);
  const url = sanitizeNotificationUrl(body['url']);

  let tag: string | undefined;
  if (body['tag'] != null && body['tag'] !== '') {
    tag = asNonEmptyString(body['tag'], 'tag', TAG_MAX);
  }

  const out: NormalizedPushBody = { title, body: text, url };
  if (body['user_id'] != null && body['user_id'] !== '') {
    out.user_id = requireUuid(body['user_id'], 'user_id');
  }
  if (body['couple_id'] != null && body['couple_id'] !== '') {
    out.couple_id = requireUuid(body['couple_id'], 'couple_id');
  }
  if (tag) out.tag = tag;
  return out;
};
