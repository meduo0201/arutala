import { timingSafeEqualString } from './timing.ts';

export interface ServiceSecrets {
  serviceRoleKey: string;
  cronSecret?: string;
  jwtSecret?: string;
}

const base64UrlToBytes = (value: string): Uint8Array => {
  const pad = '='.repeat((4 - (value.length % 4)) % 4);
  const b64 = (value + pad).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
};

/**
 * Verify an HS256 JWT with a configured secret. Decode-only is never trusted.
 */
export const verifyHs256Jwt = async (
  token: string,
  secret: string,
  nowMs = Date.now(),
): Promise<Record<string, unknown> | null> => {
  const parts = token.split('.');
  if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) return null;
  try {
    const header = JSON.parse(
      new TextDecoder().decode(base64UrlToBytes(parts[0])),
    ) as { alg?: string };
    if (header.alg !== 'HS256') return null;

    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify'],
    );
    const ok = await crypto.subtle.verify(
      'HMAC',
      key,
      base64UrlToBytes(parts[2]),
      new TextEncoder().encode(`${parts[0]}.${parts[1]}`),
    );
    if (!ok) return null;

    const payload = JSON.parse(
      new TextDecoder().decode(base64UrlToBytes(parts[1])),
    ) as Record<string, unknown>;
    if (typeof payload.exp === 'number' && payload.exp * 1000 <= nowMs) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
};

/**
 * Service callers must present a configured secret (exact match) or a JWT
 * whose signature is verified with SUPABASE_JWT_SECRET and role=service_role.
 * A forged token that only *claims* role=service_role is rejected.
 */
export const isVerifiedServiceCredential = async (
  token: string,
  secrets: ServiceSecrets,
  nowMs = Date.now(),
): Promise<boolean> => {
  if (!token) return false;
  if (
    secrets.serviceRoleKey &&
    timingSafeEqualString(token, secrets.serviceRoleKey)
  ) {
    return true;
  }
  if (secrets.cronSecret && timingSafeEqualString(token, secrets.cronSecret)) {
    return true;
  }
  if (secrets.jwtSecret) {
    const payload = await verifyHs256Jwt(token, secrets.jwtSecret, nowMs);
    return payload?.['role'] === 'service_role';
  }
  return false;
};

export interface CoupleMembers {
  user_a_id: string | null;
  user_b_id: string | null;
}

export const coupleMemberIds = (members: CoupleMembers): string[] => {
  const ids: string[] = [];
  if (members.user_a_id) ids.push(members.user_a_id);
  if (members.user_b_id) ids.push(members.user_b_id);
  return ids;
};

export const callerIsCoupleMember = (
  members: CoupleMembers,
  callerUserId: string | null,
): boolean => {
  if (!callerUserId) return false;
  return (
    members.user_a_id === callerUserId || members.user_b_id === callerUserId
  );
};

export class AuthzError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'AuthzError';
    this.status = status;
  }
}

/**
 * Resolve who may receive the push.
 * - Service credential: any user_id / couple_id.
 * - User JWT: self only, unless couple membership is verified.
 */
export const resolveTargetUserIds = (
  input: {
    user_id?: string | undefined;
    couple_id?: string | undefined;
    couple?: CoupleMembers | null | undefined;
  },
  callerUserId: string | null,
  serviceMode: boolean,
): string[] => {
  if (input.couple_id) {
    if (!input.couple) {
      throw new AuthzError(404, 'Couple not found');
    }
    if (!serviceMode && !callerIsCoupleMember(input.couple, callerUserId)) {
      throw new AuthzError(403, 'Not a member of target couple');
    }
    const ids = coupleMemberIds(input.couple);
    if (ids.length === 0) {
      throw new AuthzError(404, 'No target users resolved');
    }
    return ids;
  }

  if (input.user_id) {
    if (serviceMode) return [input.user_id];
    if (!callerUserId || callerUserId !== input.user_id) {
      throw new AuthzError(403, 'Cannot target another user');
    }
    return [callerUserId];
  }

  if (callerUserId) return [callerUserId];
  if (serviceMode) {
    throw new AuthzError(400, 'Missing user_id or couple_id');
  }
  throw new AuthzError(404, 'No target users resolved');
};
