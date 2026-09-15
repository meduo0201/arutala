import { supabase } from '@/lib/supabase';

export type EncryptionMetaReady = {
  ok: true;
  encryption_salt: string | null;
  encryption_verifier: string | null;
};

export type EncryptionMetaError = {
  ok: false;
  error: Error;
};

export type EncryptionMetaResult = EncryptionMetaReady | EncryptionMetaError;

export const hasEncryptionMeta = (
  meta: EncryptionMetaReady,
): meta is EncryptionMetaReady & {
  encryption_salt: string;
  encryption_verifier: string;
} => Boolean(meta.encryption_salt && meta.encryption_verifier);

// Read encryption fields for the CURRENT user only. Used saat init untuk
// detect E2EE status (not_setup / locked / unlocked-after-derive).
// Errors are not treated as "unset" — callers must branch on `ok`.
export const getEncryptionMeta = async (): Promise<EncryptionMetaResult> => {
  const { data: userResult, error: userError } = await supabase.auth.getUser();
  const userId = userResult.user?.id;
  if (userError || !userId) {
    return { ok: false, error: new Error('请先登录。') };
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('encryption_salt, encryption_verifier')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    return { ok: false, error: error };
  }

  return {
    ok: true,
    encryption_salt: data?.encryption_salt ?? null,
    encryption_verifier: data?.encryption_verifier ?? null,
  };
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
  // Note: RLS gate by couple_id, not user_id, jadi extended couple scope.
  // F06 (disable-encryption scope) is deferred — keep current behavior.
  const { error: logsErr } = await supabase
    .from('daily_logs')
    .update({ sexual_activity_encrypted: null })
    .not('sexual_activity_encrypted', 'is', null);
  if (logsErr) throw logsErr;
};
