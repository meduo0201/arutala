import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('F14 security headers', () => {
  const headers = readFileSync(resolve(process.cwd(), 'public/_headers'), 'utf8');

  it('keeps CSP and framing protections on the China-proxied origin', () => {
    expect(headers).toMatch(/Content-Security-Policy:/);
    expect(headers).toMatch(/connect-src 'self'/);
    expect(headers).toMatch(/font-src 'self' data: https:\/\/fonts\.gstatic\.com/);
    expect(headers).toMatch(/style-src 'self' 'unsafe-inline' https:\/\/fonts\.googleapis\.com/);
    expect(headers).toMatch(/X-Frame-Options: DENY/);
    expect(headers).toMatch(/X-Content-Type-Options: nosniff/);
  });
});
