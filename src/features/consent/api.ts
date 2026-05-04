import { supabase } from '@/lib/supabase';
import {
  CURRENT_PRIVACY_NOTICE_VERSION,
  type ConsentPurpose,
  type ConsentState,
} from '@/features/consent/types';

// Best-effort user-agent summary buat audit trail (Pasal 24).
// Tidak invasive — cuma extract major browser + OS hint.
const userAgentSummary = (): string => {
  if (typeof navigator === 'undefined') return 'unknown';
  const ua = navigator.userAgent;
  const browser =
    /Chrome\/(\d+)/.exec(ua)?.[0] ??
    /Firefox\/(\d+)/.exec(ua)?.[0] ??
    /Safari\/(\d+)/.exec(ua)?.[0] ??
    'Browser';
  const os =
    /Windows NT/.test(ua) ? 'Windows' :
    /Mac OS X/.test(ua) ? 'macOS' :
    /Android/.test(ua) ? 'Android' :
    /iPhone|iPad/.test(ua) ? 'iOS' :
    /Linux/.test(ua) ? 'Linux' :
    'Unknown';
  return `${browser} / ${os}`.slice(0, 80);
};

export const logConsent = async (
  purpose: ConsentPurpose,
  granted: boolean,
  version: string = CURRENT_PRIVACY_NOTICE_VERSION,
): Promise<string> => {
  const { data, error } = await supabase.rpc('log_consent', {
    p_purpose: purpose,
    p_granted: granted,
    p_version: version,
    p_user_agent_summary: userAgentSummary(),
    p_ip_hash: null, // server-side IP hashing TBD; keep null for now
  } as never);
  if (error) throw error;
  return data as unknown as string;
};

// Bulk log: dipakai saat signup mensubmit 3 consent sekaligus.
// Sequential calls (not Promise.all) agar audit trail timestamp ordering jelas
// + jika 1 fail, sisanya tidak ke-log (atomic-ish).
export const logConsentBatch = async (
  entries: Array<{ purpose: ConsentPurpose; granted: boolean }>,
  version: string = CURRENT_PRIVACY_NOTICE_VERSION,
): Promise<void> => {
  for (const entry of entries) {
    await logConsent(entry.purpose, entry.granted, version);
  }
};

export const getCurrentConsentState = async (): Promise<ConsentState[]> => {
  const { data, error } = await supabase.rpc('current_consent_state' as never);
  if (error) throw error;
  return (data ?? []) as ConsentState[];
};
