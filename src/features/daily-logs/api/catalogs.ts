import { supabase } from '@/lib/supabase';
import type {
  MoodCatalogRow,
  SymptomCatalogRow,
} from '@/features/daily-logs/types';

// Catalogs di-seed via SCHEMA.sql—15 symptoms + 10 moods. Read-only untuk
// authenticated user (RLS policy: `for select using true` to authenticated).
// Stale data risk minimal (catalog jarang berubah)—aggressive cache di hook.

export const listSymptoms = async (): Promise<SymptomCatalogRow[]> => {
  const { data, error } = await supabase
    .from('symptom_catalog')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) {
    console.error('[catalogs] listSymptoms error:', error);
    throw error;
  }
  return (data as SymptomCatalogRow[] | null) ?? [];
};

export const listMoods = async (): Promise<MoodCatalogRow[]> => {
  const { data, error } = await supabase
    .from('mood_catalog')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) {
    console.error('[catalogs] listMoods error:', error);
    throw error;
  }
  return (data as MoodCatalogRow[] | null) ?? [];
};
