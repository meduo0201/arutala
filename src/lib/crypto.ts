// =============================================================================
// E2EE primitives — Web Crypto API native, zero dependencies.
//
// Spec (per audit doc + OWASP):
//   - Key derivation: PBKDF2-SHA256, 600,000 iterations (OWASP 2023 minimum)
//   - Cipher: AES-GCM-256
//   - IV: 96-bit (12 bytes), random per encryption (CSPRNG via getRandomValues)
//   - Salt: 128-bit (16 bytes), per user, stored server-side
//   - Format: versioned 'v1:base64(iv):base64(ciphertext)'
//
// Threat model:
//   - Server (Supabase) NEVER sees plaintext or derived key.
//   - Salt + encrypted verifier + ciphertext disimpan di server (RLS-protected).
//   - Derived key cached client-side memory only (Zustand non-persisted).
//   - Passphrase NEVER stored anywhere — user must remember.
//   - Forgot passphrase = data unrecoverable (no backdoor, audit threat 6 mitigation).
//
// Stardust cautionary precedent: do NOT send passphrase / key to server "for
// recovery" — that defeats E2EE entirely.
// =============================================================================

const PBKDF2_ITERATIONS = 600_000 as const;
const AES_KEY_LENGTH = 256 as const;
const SALT_BYTES = 16 as const;  // 128-bit
const IV_BYTES = 12 as const;    // 96-bit (recommended for GCM)
const ENCRYPTION_VERSION = 'v1' as const;

// ---------- Encoding helpers ----------

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

const bytesToBase64 = (bytes: Uint8Array): string => {
  // chunked conversion buat avoid stack overflow di big arrays (gak relevan di
  // sini karena ciphertext kecil, tapi safe pattern).
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
};

const base64ToBytes = (b64: string): Uint8Array => {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

// ---------- Random generators (CSPRNG) ----------

/** Generate 128-bit (16 bytes) salt. Stored server-side per user profile. */
export const generateSalt = (): Uint8Array => {
  const salt = new Uint8Array(SALT_BYTES);
  crypto.getRandomValues(salt);
  return salt;
};

const generateIV = (): Uint8Array => {
  const iv = new Uint8Array(IV_BYTES);
  crypto.getRandomValues(iv);
  return iv;
};

// ---------- Key derivation ----------

/**
 * PBKDF2 → AES-GCM key. Caller cache result in memory (NEVER localStorage).
 * Per audit doc C-05: 600k iterations OWASP 2023.
 */
export const deriveKey = async (
  passphrase: string,
  salt: Uint8Array,
): Promise<CryptoKey> => {
  if (!passphrase) throw new Error('Passphrase empty');
  if (salt.length !== SALT_BYTES) {
    throw new Error(`Salt must be ${SALT_BYTES} bytes, got ${salt.length}`);
  }

  const baseKey = await crypto.subtle.importKey(
    'raw',
    textEncoder.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey'],
  );

  const aesKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: AES_KEY_LENGTH },
    false, // NOT extractable — prevent accidental key leak via export
    ['encrypt', 'decrypt'],
  );

  return aesKey;
};

// ---------- Encrypt / Decrypt ----------

/**
 * Encrypt plaintext string → versioned format 'v1:base64(iv):base64(ciphertext)'.
 * IV unique per call (random 96-bit). Caller responsible for handling key lifecycle.
 */
export const encrypt = async (
  plaintext: string,
  key: CryptoKey,
): Promise<string> => {
  const iv = generateIV();
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    key,
    textEncoder.encode(plaintext),
  );

  return [
    ENCRYPTION_VERSION,
    bytesToBase64(iv),
    bytesToBase64(new Uint8Array(ciphertext)),
  ].join(':');
};

/**
 * Decrypt versioned ciphertext. Throws kalau version mismatch / corruption /
 * wrong key (auth tag mismatch). Caller should catch + display "wrong passphrase".
 */
export const decrypt = async (
  ciphertext: string,
  key: CryptoKey,
): Promise<string> => {
  const parts = ciphertext.split(':');
  if (parts.length !== 3) {
    throw new Error('Malformed ciphertext (expected v:iv:ct)');
  }
  const [version, ivB64, ctB64] = parts;
  if (version !== ENCRYPTION_VERSION) {
    throw new Error(`Unsupported encryption version: ${version}`);
  }
  if (!ivB64 || !ctB64) {
    throw new Error('Missing iv or ciphertext component');
  }

  const iv = base64ToBytes(ivB64);
  const ct = base64ToBytes(ctB64);

  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    key,
    ct as BufferSource,
  );

  return textDecoder.decode(plaintext);
};

// ---------- Helpers untuk verifier sentinel ----------

/**
 * Sentinel string yang di-encrypt saat passphrase setup. Saat unlock,
 * decrypt + match exact = passphrase benar. Mismatch = wrong passphrase
 * (decrypt error karena GCM auth tag fails sebelum sampai sini).
 *
 * Pattern: `arutala-verify:{user_id}` — unique per user, predictable for
 * verification but not secret.
 */
export const buildVerifierSentinel = (userId: string): string =>
  `arutala-verify:${userId}`;

// ---------- Format helpers (server boundary) ----------

/** Encode salt for storage (server stores text, base64). */
export const saltToBase64 = (salt: Uint8Array): string => bytesToBase64(salt);
export const saltFromBase64 = (b64: string): Uint8Array => base64ToBytes(b64);
