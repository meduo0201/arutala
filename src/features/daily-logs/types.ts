// Manual types — sync dengan SCHEMA.sql daily_logs table.
// Skip Phase 4 fields (encrypted_payload) di MVP—tambah pas E2EE landing.

/**
 * Flow intensity 0-4:
 * 0 = none (no flow recorded for this day, but day still has mood/symptom log)
 * 1 = spotting
 * 2 = light
 * 3 = medium
 * 4 = heavy
 */
export type FlowIntensity = 0 | 1 | 2 | 3 | 4;

export interface DailyLogRow {
  id: string;
  couple_id: string;
  cycle_id: string | null;
  log_date: string; // YYYY-MM-DD
  flow_intensity: FlowIntensity | null;
  symptoms: string[]; // catalog keys
  moods: string[]; // catalog keys
  notes: string | null;
  encrypted_payload: string | null; // legacy slot, unused
  /**
   * Phase 4 Track B: encrypted JSON payload for sexual_activity tracking.
   * Format: 'v1:base64(iv):base64(ciphertext)' per src/lib/crypto.ts.
   * Plaintext shape (after decrypt): SexualActivityPayload (see schema below).
   * NULL/empty = no entry untuk hari itu.
   */
  sexual_activity_encrypted: string | null;
  bbt: number | null;
  weight: number | null;
  sleep_hours: number | null;
  water_intake_ml: number | null;
  logged_by: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

/**
 * Plaintext payload structure for sexual_activity_encrypted.
 * Encrypted client-side via E2EE key before save.
 */
export interface SexualActivityPayload {
  active: boolean;
  /** 'protected' = pakai kontrasepsi, 'unprotected' = tidak. */
  type: 'protected' | 'unprotected' | null;
  /** 1-3 subjective scale. */
  intensity: 1 | 2 | 3 | null;
  notes?: string;
}

export const EMPTY_SEXUAL_ACTIVITY: SexualActivityPayload = {
  active: false,
  type: null,
  intensity: null,
};

export const FLOW_INTENSITY_VALUES: readonly FlowIntensity[] = [0, 1, 2, 3, 4] as const;

// Catalog rows (read-only reference data, seeded di SCHEMA.sql)
export type SymptomCategory = 'physical' | 'digestive' | 'skin' | 'energy' | 'other';

export interface SymptomCatalogRow {
  key: string;
  label_id: string;
  label_en: string;
  emoji: string | null;
  category: SymptomCategory;
  display_order: number;
}

export interface MoodCatalogRow {
  key: string;
  label_id: string;
  label_en: string;
  emoji: string;
  valence: number; // -2..2
  display_order: number;
}

import type { Locale } from '@/lib/i18n';

/** Locale-aware label getter—centralized supaya gak duplicate logic di UI. */
export const getCatalogLabel = (
  row: { label_id: string; label_en: string },
  locale: Locale,
): string => (locale === 'id' ? row.label_id : row.label_en);
