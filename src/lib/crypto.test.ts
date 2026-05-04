import { describe, expect, it } from 'vitest';
import {
  buildVerifierSentinel,
  decrypt,
  deriveKey,
  encrypt,
  generateSalt,
  saltFromBase64,
  saltToBase64,
} from '@/lib/crypto';

describe('crypto: salt', () => {
  it('generates 128-bit (16 byte) salt', () => {
    const s = generateSalt();
    expect(s.length).toBe(16);
  });

  it('round-trips via base64', () => {
    const s = generateSalt();
    const b64 = saltToBase64(s);
    const back = saltFromBase64(b64);
    expect(back).toEqual(s);
  });

  it('produces unique salts (high entropy)', () => {
    const a = saltToBase64(generateSalt());
    const b = saltToBase64(generateSalt());
    expect(a).not.toBe(b);
  });
});

describe('crypto: deriveKey + encrypt/decrypt round-trip', () => {
  it('round-trips plaintext with same passphrase + salt', async () => {
    const salt = generateSalt();
    const key = await deriveKey('correct horse battery staple', salt);

    const plain = 'rahasia: aktivitas intim 2026-05-04';
    const ct = await encrypt(plain, key);
    const back = await decrypt(ct, key);

    expect(back).toBe(plain);
  });

  it('produces different ciphertext on each encrypt (IV uniqueness)', async () => {
    const salt = generateSalt();
    const key = await deriveKey('passw0rd-12char-symbol!', salt);

    const ct1 = await encrypt('same plaintext', key);
    const ct2 = await encrypt('same plaintext', key);

    expect(ct1).not.toBe(ct2);
    // But both decrypt to identical plaintext
    expect(await decrypt(ct1, key)).toBe('same plaintext');
    expect(await decrypt(ct2, key)).toBe('same plaintext');
  });

  it('decrypt fails with wrong passphrase (auth tag mismatch)', async () => {
    const salt = generateSalt();
    const correctKey = await deriveKey('the-correct-passphrase-12!', salt);
    const wrongKey = await deriveKey('the-wrong-passphrase-1234!', salt);

    const ct = await encrypt('secret data', correctKey);
    await expect(decrypt(ct, wrongKey)).rejects.toThrow();
  });

  it('decrypt fails with wrong salt (different derived key)', async () => {
    const salt1 = generateSalt();
    const salt2 = generateSalt();
    const passphrase = 'same-passphrase-12char!';

    const key1 = await deriveKey(passphrase, salt1);
    const key2 = await deriveKey(passphrase, salt2);

    const ct = await encrypt('data', key1);
    await expect(decrypt(ct, key2)).rejects.toThrow();
  });

  it('rejects malformed ciphertext format', async () => {
    const salt = generateSalt();
    const key = await deriveKey('any-12-char-pwd!@', salt);

    await expect(decrypt('not-a-valid-format', key)).rejects.toThrow(/Malformed/);
    await expect(decrypt('v2:iv:ct', key)).rejects.toThrow(/Unsupported/);
  });

  it('output format is v1:base64:base64', async () => {
    const salt = generateSalt();
    const key = await deriveKey('test-passphrase-12!', salt);

    const ct = await encrypt('hello', key);
    const parts = ct.split(':');
    expect(parts).toHaveLength(3);
    expect(parts[0]).toBe('v1');
    // base64 alphabet check (rough)
    expect(parts[1]).toMatch(/^[A-Za-z0-9+/=]+$/);
    expect(parts[2]).toMatch(/^[A-Za-z0-9+/=]+$/);
  });
});

describe('crypto: verifier sentinel', () => {
  it('builds unique sentinel per user_id', () => {
    const a = buildVerifierSentinel('user-aaa');
    const b = buildVerifierSentinel('user-bbb');
    expect(a).not.toBe(b);
    expect(a).toContain('user-aaa');
    expect(b).toContain('user-bbb');
  });

  it('verifier sentinel round-trip proves passphrase correct', async () => {
    const userId = 'test-user-uuid-1234';
    const salt = generateSalt();
    const key = await deriveKey('right-passphrase-12!', salt);

    const sentinel = buildVerifierSentinel(userId);
    const encryptedVerifier = await encrypt(sentinel, key);

    // "Login" attempt with same passphrase + same salt → should match
    const reKey = await deriveKey('right-passphrase-12!', salt);
    const decrypted = await decrypt(encryptedVerifier, reKey);
    expect(decrypted).toBe(sentinel);
  });
});
