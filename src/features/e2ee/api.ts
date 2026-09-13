import { supabase } from '@/lib/supabase';

// Read encryption fields dari profile current user. Used saat init untuk
// detect E2EE status (not_setup / locked / unlocked-after-derive).
export const getEncryptionMeta = async (): Promise<{
  encryption_salt: string | null;
  encryption_verifier: string | null;
} | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('encryption_salt, encryption_verifier')
    .single();

  if (error) {
    // Profile mungkin belum exist (race) — return null biar caller handle
    return null;
  }
  return data;
};

// Save salt + encrypted verifier saat user pertama kali setup passphrase.
// Direct UPDATE via existing RLS policy "Users update own profile".
export const saveEncryptionMeta = async (
  saltBase64: string,
  encryptedVerifier: string,
): Promise<void> => {
  const { data: userResult } = await supabase.auth.getUser();
  const userId = userResult.user?.id;
  if (!userId) throw new Error('请先登录。');

  const { error } = await supabase
    .from('profiles')
    .update({
      encryption_salt: saltBase64,
      encryption_verifier: encryptedVerifier,
    })
    .eq('id', userId);

  if (error) throw error;
};

// Update verifier saat passphrase change (re-encrypt sentinel dengan key baru).
// Called dari change-passphrase flow setelah re-derive key + re-encrypt all
// existing sexual_activity rows.
export const updateEncryptionVerifier = async (
  encryptedVerifier: string,
): Promise<void> => {
  const { data: userResult } = await supabase.auth.getUser();
  const userId = userResult.user?.id;
  if (!userId) throw new Error('请先登录。');

  const { error } = await supabase
    .from('profiles')
    .update({ encryption_verifier: encryptedVerifier })
    .eq('id', userId);

  if (error) throw error;
};

// Disable E2EE — clear salt + verifier + all encrypted payloads di daily_logs.
// IRREVERSIBLE for sexual_activity_encrypted history. Defensive: caller harus
// confirm with user dulu.
export const disableE2ee = async (): Promise<void> => {
  const { data: userResult } = await supabase.auth.getUser();
  const userId = userResult.user?.id;
  if (!userId) throw new Error('请先登录。');

  // Clear profile encryption fields
  const { error: profileErr } = await supabase
    .from('profiles')
    .update({ encryption_salt: null, encryption_verifier: null })
    .eq('id', userId);
  if (profileErr) throw profileErr;

  // Clear all sexual_activity_encrypted owned by user via RLS scope.
  // Note: RLS gate by couple_id, not user_id, jadi clearing semua di couple.
  // OK karena disable E2EE = user explicitly nuking all encrypted data.
  const { error: logsErr } = await supabase
    .from('daily_logs')
    .update({ sexual_activity_encrypted: null })
    .not('sexual_activity_encrypted', 'is', null);
  if (logsErr) throw logsErr;
};
