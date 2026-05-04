// =============================================================================
// HIBP (Have I Been Pwned) client-side k-anonymity check.
// Free alternative to Supabase Pro HIBP integration (audit F-009).
//
// Protocol: https://haveibeenpwned.com/API/v3#PwnedPasswords
// 1. Compute SHA-1(password) hex (uppercase, 40 chars).
// 2. Send only FIRST 5 chars (prefix) ke api.pwnedpasswords.com/range/{prefix}.
// 3. Server returns ~500-1000 lines: "{remaining 35 hex}:{count}".
// 4. Client checks if password's remaining 35 hex appears in response.
//
// Privacy property: HIBP server hanya tau prefix, gak tau full hash maupun
// password. Client matches lokal.
//
// Trade-off: SHA-1 untuk hash adalah CHOICE HIBP (kalau bocor pun, attacker
// dapat hash dari password yang udah ke-leak — gak tambah info). Kita pakai
// SHA-1 ONLY untuk lookup, BUKAN untuk storage (Supabase store hash via
// bcrypt internal).
// =============================================================================

const HIBP_API = 'https://api.pwnedpasswords.com/range';

const sha1Hex = async (input: string): Promise<string> => {
  const buffer = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-1', buffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
};

export interface HibpResult {
  /** True kalau password muncul di breach DB. */
  pwned: boolean;
  /** Berapa kali password ke-record di breach (0 kalau pwned=false). */
  count: number;
}

/**
 * Check password via HIBP k-anonymity API. Returns pwned=false kalau aman,
 * pwned=true + count kalau muncul di breach.
 *
 * Network failure → returns pwned=false (fail-open). Caller should treat
 * sebagai best-effort: kalau breach check gagal, signup tetap lanjut tapi
 * minimal lock di password length+charset rules.
 */
export const checkPasswordPwned = async (
  password: string,
): Promise<HibpResult> => {
  if (!password) return { pwned: false, count: 0 };

  const hash = await sha1Hex(password);
  const prefix = hash.slice(0, 5);
  const suffix = hash.slice(5);

  try {
    const response = await fetch(`${HIBP_API}/${prefix}`, {
      method: 'GET',
      headers: {
        'Add-Padding': 'true', // anti traffic-analysis (HIBP feature)
      },
    });
    if (!response.ok) return { pwned: false, count: 0 };

    const body = await response.text();
    // Body lines: "{35-char-suffix}:{count}\r\n"
    for (const line of body.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const [respSuffix, countStr] = trimmed.split(':');
      if (respSuffix === suffix) {
        const count = parseInt(countStr ?? '0', 10);
        return { pwned: count > 0, count };
      }
    }
    return { pwned: false, count: 0 };
  } catch {
    // Network error / CORS / offline — fail-open agar gak block signup.
    return { pwned: false, count: 0 };
  }
};
