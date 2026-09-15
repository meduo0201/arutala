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

/** D4 / F06: one authorized RPC — only this user's meta + ciphertext. */
export const disableE2ee = async (): Promise<void> => {
  const { error } = await supabase.rpc('disable_e2ee');
  if (error) throw error;
};
