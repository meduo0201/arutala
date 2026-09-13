import { createClient } from '@supabase/supabase-js';

// Accept both legacy JWT anon keys and the newer `sb_publishable_...` keys.
// supabase-js 2.49+ sends the key as `apikey` without requiring JWT shape.
const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL ?? '').trim();
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
    },
    global: {
      headers: {
        apikey: supabaseAnonKey || FALLBACK_KEY,
      },
    },
  },
);
