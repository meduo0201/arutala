import type { Session, User } from '@supabase/supabase-js';

// Re-export biar consumer gak perlu import langsung dari @supabase/supabase-js.
// Memudahkan refactor kalau nanti pindah auth provider (unlikely tapi defensive).
export type AuthUser = User;
export type AuthSession = Session;

export interface AuthState {
  user: AuthUser | null;
  session: AuthSession | null;
  loading: boolean;
}
