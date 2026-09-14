import { createClient } from '@supabase/supabase-js';
import {
  resolveSupabaseUrl,
  SUPABASE_UPSTREAM_ORIGIN,
} from '@/lib/supabase-proxy';

// Accept both legacy JWT anon keys and the newer `sb_publishable_...` keys.
// supabase-js 2.49+ sends the key as `apikey` without requiring JWT shape.
//
// Production (Cloudflare Pages) should set
//   VITE_SUPABASE_URL=https://20270227.xyz/supabase
// (or `/supabase`) so the browser stays on this domain. The Pages Function
// at /supabase/* reverse-proxies to the real *.supabase.co project.
const supabaseUrl = resolveSupabaseUrl(
  import.meta.env.VITE_SUPABASE_URL ?? '',
  typeof window !== 'undefined' ? window.location.origin : '',
);
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').trim();

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

const FALLBACK_URL = 'https://unavailable.invalid';
const FALLBACK_KEY = 'sb_publishable_unavailable';

export const supabase = createClient(
  supabaseUrl || FALLBACK_URL,
  supabaseAnonKey || FALLBACK_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      // Keep the existing localStorage key so switching VITE_SUPABASE_URL
      // from *.supabase.co to the same-origin proxy does not sign users out.
      storageKey: `sb-${new URL(SUPABASE_UPSTREAM_ORIGIN).hostname.split('.')[0]}-auth-token`,
    },
    global: {
      headers: {
        apikey: supabaseAnonKey || FALLBACK_KEY,
      },
    },
  },
);
