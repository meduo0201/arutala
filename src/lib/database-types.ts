// Manual types berdasarkan SCHEMA.sql. Sync manually saat schema berubah.
// TODO Phase 2+: replace dengan auto-generated via `pnpm db:types` setelah
// Supabase CLI auth flow setup (`supabase login` + `supabase link`).
//
// Struktur match @supabase/supabase-js Database generic—`createClient<Database>`
// di src/lib/supabase.ts dan tabel/RPC otomatis typed di consumer code.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string;
          role_label: 'tracker' | 'partner' | null;
          avatar_emoji: string | null;
          timezone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name: string;
          role_label?: 'tracker' | 'partner' | null;
          avatar_emoji?: string | null;
          timezone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string;
          role_label?: 'tracker' | 'partner' | null;
          avatar_emoji?: string | null;
          timezone?: string | null;
          updated_at?: string;
        };
      };
      couples: {
        Row: {
          id: string;
          user_a_id: string;
          user_b_id: string | null;
          status: 'pending' | 'active' | 'unlinked';
          created_at: string;
          activated_at: string | null;
        };
        Insert: {
          id?: string;
          user_a_id: string;
          user_b_id?: string | null;
          status?: 'pending' | 'active' | 'unlinked';
          created_at?: string;
          activated_at?: string | null;
        };
        Update: {
          status?: 'pending' | 'active' | 'unlinked';
          user_b_id?: string | null;
          activated_at?: string | null;
        };
      };
      invitations: {
        Row: {
          code: string;
          inviter_id: string;
          couple_id: string;
          expires_at: string;
          accepted_at: string | null;
          accepted_by: string | null;
          created_at: string;
        };
        Insert: {
          code: string;
          inviter_id: string;
          couple_id: string;
          expires_at?: string;
          accepted_at?: string | null;
          accepted_by?: string | null;
          created_at?: string;
        };
        Update: {
          accepted_at?: string | null;
          accepted_by?: string | null;
        };
      };
      cycles: {
        Row: {
          id: string;
          couple_id: string;
          start_date: string;
          end_date: string | null;
          cycle_length: number | null;
          predicted_next_start: string | null;
          predicted_ovulation: string | null;
          predicted_fertile_start: string | null;
          predicted_fertile_end: string | null;
          notes: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          couple_id: string;
          start_date: string;
          end_date?: string | null;
          cycle_length?: number | null;
          predicted_next_start?: string | null;
          predicted_ovulation?: string | null;
          predicted_fertile_start?: string | null;
          predicted_fertile_end?: string | null;
          notes?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          start_date?: string;
          end_date?: string | null;
          cycle_length?: number | null;
          predicted_next_start?: string | null;
          predicted_ovulation?: string | null;
          predicted_fertile_start?: string | null;
          predicted_fertile_end?: string | null;
          notes?: string | null;
          updated_at?: string;
          deleted_at?: string | null;
        };
      };
      daily_logs: {
        Row: {
          id: string;
          couple_id: string;
          cycle_id: string | null;
          log_date: string;
          flow_intensity: number | null;
          symptoms: string[];
          moods: string[];
          notes: string | null;
          encrypted_payload: string | null;
          bbt: number | null;
          weight: number | null;
          sleep_hours: number | null;
          water_intake_ml: number | null;
          logged_by: string;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          couple_id: string;
          cycle_id?: string | null;
          log_date: string;
          flow_intensity?: number | null;
          symptoms?: string[];
          moods?: string[];
          notes?: string | null;
          encrypted_payload?: string | null;
          bbt?: number | null;
          weight?: number | null;
          sleep_hours?: number | null;
          water_intake_ml?: number | null;
          logged_by: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          cycle_id?: string | null;
          flow_intensity?: number | null;
          symptoms?: string[];
          moods?: string[];
          notes?: string | null;
          encrypted_payload?: string | null;
          bbt?: number | null;
          weight?: number | null;
          sleep_hours?: number | null;
          water_intake_ml?: number | null;
          updated_at?: string;
          deleted_at?: string | null;
        };
      };
      symptom_catalog: {
        Row: {
          key: string;
          label_id: string;
          label_en: string;
          emoji: string | null;
          category: 'physical' | 'digestive' | 'skin' | 'energy' | 'other';
          display_order: number;
        };
        Insert: {
          key: string;
          label_id: string;
          label_en: string;
          emoji?: string | null;
          category?: 'physical' | 'digestive' | 'skin' | 'energy' | 'other';
          display_order?: number;
        };
        Update: {
          label_id?: string;
          label_en?: string;
          emoji?: string | null;
          category?: 'physical' | 'digestive' | 'skin' | 'energy' | 'other';
          display_order?: number;
        };
      };
      mood_catalog: {
        Row: {
          key: string;
          label_id: string;
          label_en: string;
          emoji: string;
          valence: number;
          display_order: number;
        };
        Insert: {
          key: string;
          label_id: string;
          label_en: string;
          emoji: string;
          valence?: number;
          display_order?: number;
        };
        Update: {
          label_id?: string;
          label_en?: string;
          emoji?: string;
          valence?: number;
          display_order?: number;
        };
      };
    };
    Views: Record<string, never>;
    Functions: {
      create_invitation: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      accept_invitation: {
        Args: { p_code: string };
        Returns: string;
      };
      current_couple_id: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      ensure_solo_household: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      generate_invitation_code: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      unlink_couple: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      cancel_invitation: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      soft_delete_daily_log: {
        Args: { p_log_id: string };
        Returns: undefined;
      };
      upsert_daily_log: {
        Args: {
          p_couple_id: string;
          p_log_date: string;
          p_logged_by: string;
          p_cycle_id?: string | null;
          p_flow_intensity?: number | null;
          p_symptoms?: string[];
          p_moods?: string[];
          p_notes?: string | null;
          p_sexual_activity_encrypted?: string | null;
          p_update_sexual_activity?: boolean;
        };
        Returns: Record<string, unknown>;
      };
      disable_e2ee: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      delete_account: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      assert_account_active: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      purge_deleted_accounts: {
        Args: { p_older_than?: string };
        Returns: { user_id: string }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
