// Manual types for couples + profiles tables. Sync dengan SCHEMA.sql.
// TODO: regenerate via `pnpm db:types` setelah Supabase CLI auth flow setup
// (akan replace ini di src/lib/database-types.ts).

export type CoupleStatus = 'pending' | 'active' | 'unlinked';

export interface CoupleRow {
  id: string;
  user_a_id: string;
  user_b_id: string | null;
  status: CoupleStatus;
  created_at: string;
  activated_at: string | null;
}

export interface ProfileRow {
  id: string;
  display_name: string;
  role_label: 'tracker' | 'partner' | null; // legacy field, prefer `role` below
  avatar_emoji: string | null;
  timezone: string | null;
  /** Phase 5 J1: 'tracker' (yang ngalami haid) atau 'supporter' (pasangan). Default 'tracker'. */
  role: 'tracker' | 'supporter';
  /** Phase 5 J1: solo mode toggle — true berarti skip couple-setup gate. */
  is_solo: boolean;
  date_of_birth: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

// Couple dengan partner profile joined—dipake di home page untuk display info pasangan.
export interface CoupleWithPartner extends CoupleRow {
  partner: ProfileRow | null;
}
