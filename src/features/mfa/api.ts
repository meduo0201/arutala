import { supabase } from '@/lib/supabase';

// Thin wrappers atas supabase.auth.mfa.* untuk TOTP enrollment flow.
// Spec ref: https://supabase.com/docs/guides/auth/auth-mfa/totp

// List active MFA factors untuk current user — dipakai untuk decide enrolled state.
export const listMfaFactors = async () => {
  const { data, error } = await supabase.auth.mfa.listFactors();
  if (error) throw error;
  return data; // { all: [], totp: [] }
};

// Begin TOTP enrollment. Returns secret + QR (otpauth URI / svg).
// Factor stays in 'unverified' state sampai challengeAndVerify success.
export const enrollMfa = async () => {
  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: 'totp',
  });
  if (error) throw error;
  return data; // { id, type, totp: { qr_code, secret, uri } }
};

// Verify code untuk move factor → 'verified' state.
// supabase.auth.mfa.challengeAndVerify combines challenge + verify in one call.
export const challengeAndVerifyMfa = async (factorId: string, code: string) => {
  const { data, error } = await supabase.auth.mfa.challengeAndVerify({
    factorId,
    code,
  });
  if (error) throw error;
  return data;
};

// Remove existing factor.
export const unenrollMfa = async (factorId: string) => {
  const { data, error } = await supabase.auth.mfa.unenroll({ factorId });
  if (error) throw error;
  return data;
};
