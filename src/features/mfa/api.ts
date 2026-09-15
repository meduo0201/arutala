import { supabase } from '@/lib/supabase';
import { needsAal2Challenge, type AalSnapshot } from '@/features/mfa/lib/aal';

// Thin wrappers atas supabase.auth.mfa.* untuk TOTP enrollment flow.
// Spec ref: https://supabase.com/docs/guides/auth/auth-mfa/totp

export const listMfaFactors = async () => {
  const { data, error } = await supabase.auth.mfa.listFactors();
  if (error) throw error;
  return data;
};

export const enrollMfa = async () => {
  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: 'totp',
  });
  if (error) throw error;
  return data;
};

export const challengeAndVerifyMfa = async (factorId: string, code: string) => {
  const { data, error } = await supabase.auth.mfa.challengeAndVerify({
    factorId,
    code,
  });
  if (error) throw error;
  return data;
};

export const unenrollMfa = async (factorId: string) => {
  const { data, error } = await supabase.auth.mfa.unenroll({ factorId });
  if (error) throw error;
  return data;
};

export const getAuthenticatorAssurance = async (): Promise<AalSnapshot | null> => {
  try {
    const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (error || !data) return null;
    return {
      currentLevel: data.currentLevel,
      nextLevel: data.nextLevel,
    };
  } catch {
    // MFA not enabled on the project — treat as no second factor.
    return null;
  }
};

export const sessionNeedsAal2 = async (): Promise<boolean> => {
  const aal = await getAuthenticatorAssurance();
  return needsAal2Challenge(aal);
};
