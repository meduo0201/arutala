import { supabase } from '@/lib/supabase';
import type { ProfileRow } from '@/features/couples/types';

/** Get profile for given user. RLS allows reading own + active partner profile. */
export const getProfile = async (userId: string): Promise<ProfileRow | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('[profile] getProfile error:', error);
    throw error;
  }
  return data as ProfileRow | null;
};

/** Update own profile. RLS policy "Users update own profile" gates this. */
export const updateProfile = async (
  userId: string,
  updates: {
    display_name?: string | undefined;
    avatar_emoji?: string | null | undefined;
  },
): Promise<ProfileRow> => {
  // Strip undefined keys + convert empty avatar_emoji ke null (DB column nullable).
  const payload: Record<string, string | null> = {};
  if (updates.display_name !== undefined) {
    payload.display_name = updates.display_name;
  }
  if (updates.avatar_emoji !== undefined) {
    payload.avatar_emoji = updates.avatar_emoji || null;
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(payload)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('[profile] updateProfile error:', error);
    throw error;
  }
  return data as ProfileRow;
};
