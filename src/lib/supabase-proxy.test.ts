import { describe, expect, it } from 'vitest';
import {
  resolveSupabaseUrl,
  rewriteSupabaseProxyUrl,
  SUPABASE_UPSTREAM_ORIGIN,
} from './supabase-proxy';

describe('resolveSupabaseUrl', () => {
  it('keeps a bare Supabase origin without a trailing slash', () => {
    expect(resolveSupabaseUrl('https://iodarvjowrubfatokpxt.supabase.co')).toBe(
      'https://iodarvjowrubfatokpxt.supabase.co',
    );
    expect(resolveSupabaseUrl('https://iodarvjowrubfatokpxt.supabase.co/')).toBe(
      'https://iodarvjowrubfatokpxt.supabase.co',
    );
  });

  it('adds a trailing slash so a path prefix is preserved', () => {
    expect(resolveSupabaseUrl('https://20270227.xyz/supabase')).toBe(
      'https://20270227.xyz/supabase/',
    );
    expect(resolveSupabaseUrl('https://20270227.xyz/supabase/')).toBe(
      'https://20270227.xyz/supabase/',
    );
  });

  it('resolves a relative /supabase against the current origin', () => {
    expect(resolveSupabaseUrl('/supabase', 'https://20270227.xyz')).toBe(
      'https://20270227.xyz/supabase/',
    );
    expect(resolveSupabaseUrl('/supabase/', 'http://localhost:5173')).toBe(
      'http://localhost:5173/supabase/',
    );
  });

  it('returns empty for blank input', () => {
    expect(resolveSupabaseUrl('   ')).toBe('');
  });
});

describe('rewriteSupabaseProxyUrl', () => {
  it('strips the /supabase prefix and keeps query + realtime path', () => {
    expect(
      rewriteSupabaseProxyUrl(
        'https://20270227.xyz/supabase/rest/v1/cycles?select=*',
      ),
    ).toBe(`${SUPABASE_UPSTREAM_ORIGIN}/rest/v1/cycles?select=*`);

    expect(
      rewriteSupabaseProxyUrl(
        'https://20270227.xyz/supabase/realtime/v1/websocket?apikey=sb_publishable_x&vsn=1.0.0',
      ),
    ).toBe(
      `${SUPABASE_UPSTREAM_ORIGIN}/realtime/v1/websocket?apikey=sb_publishable_x&vsn=1.0.0`,
    );
  });

  it('maps the prefix itself to the upstream root', () => {
    expect(rewriteSupabaseProxyUrl('https://20270227.xyz/supabase')).toBe(
      `${SUPABASE_UPSTREAM_ORIGIN}/`,
    );
    expect(rewriteSupabaseProxyUrl('https://20270227.xyz/supabase/')).toBe(
      `${SUPABASE_UPSTREAM_ORIGIN}/`,
    );
  });
});
