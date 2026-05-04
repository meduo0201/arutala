import { createClient } from '@supabase/supabase-js';

// Eager env validation. Throws di module load kalau .env.local belum ke-set.
// Behavior intended: dev/build fail-fast dengan error message jelas, BUKAN
// silent connection ke URL undefined.
//
// Catatan typing: gak pakai `<Database>` generic karena manual database-types.ts
// belum 100% align dengan supabase-js v2.105 internal type machinery (RPC Args
// union resolves ke `undefined` di beberapa case). Sebagai gantinya, type-assert
// hasil di API layer (`src/features/*/api/*.ts`) — abstraction boundary yang lebih
// jelas. Phase 2+ regenerate via `pnpm db:types` lalu re-enable generic.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error(
    '[supabase] Missing VITE_SUPABASE_URL. Bikin Supabase project di supabase.com → copy "Project URL" ke .env.local.',
  );
}
if (!supabaseAnonKey) {
  throw new Error(
    '[supabase] Missing VITE_SUPABASE_ANON_KEY. Settings → API → copy "anon public" key ke .env.local.',
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
