import { logConsentBatch } from '@/features/consent/api';
import {
  CURRENT_PRIVACY_NOTICE_VERSION,
  REQUIRED_CONSENT_PURPOSES,
  type ConsentPurpose,
} from '@/features/consent/types';

// Pending consent flow: saat signup user submit consent SEBELUM email confirm.
// Supabase signUp() with email confirmation returns user but no active session,
// jadi RPC log_consent() langsung gagal (auth.uid() null). Workaround:
//   1. Saat signup form submit → simpan pending state di localStorage.
//   2. Saat user first authenticated session (post email verify + login) →
//      auth listener cek localStorage, replay logConsentBatch, clear.
//
// Per UU PDP Pasal 24: bukti consent harus dilog. Log time = saat signup
// (di-stored di localStorage timestamp), bukan saat replay. Untuk audit trail
// yang akurat, RPC menerima granted_at sebagai default now() — tapi kita bisa
// reconstruct via consent_log.granted_at >= profile.created_at offset minimal.

const STORAGE_KEY = 'arutala-pending-consent';

interface PendingConsent {
  decisions: Array<{ purpose: ConsentPurpose; granted: boolean }>;
  version: string;
  createdAt: string; // ISO timestamp dari signup form submit
}

export const savePendingConsent = (
  decisions: Array<{ purpose: ConsentPurpose; granted: boolean }>,
): void => {
  const payload: PendingConsent = {
    decisions,
    version: CURRENT_PRIVACY_NOTICE_VERSION,
    createdAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // localStorage full / blocked — best effort, gak block signup flow.
  }
};

const readPendingConsent = (): PendingConsent | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingConsent;
    if (!Array.isArray(parsed.decisions)) return null;
    return parsed;
  } catch {
    return null;
  }
};

const clearPendingConsent = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // best-effort
  }
};

// Replay pending consent SEKALI saat user first authenticated post-signup.
// Idempotent-ish: kalau replay gagal di tengah, sisa consent tidak hilang
// (localStorage tetap until full success). Caller responsible for not calling
// jika user already has consent rows (via current_consent_state check).
export const replayPendingConsentIfAny = async (): Promise<void> => {
  const pending = readPendingConsent();
  if (!pending) return;

  // Sanity check: REQUIRED purposes must all be granted in pending — kalau
  // user pernah submit signup tanpa consent (impossible via UI), reject replay.
  const grantedRequired = REQUIRED_CONSENT_PURPOSES.every((p) =>
    pending.decisions.find((d) => d.purpose === p && d.granted),
  );
  if (!grantedRequired) {
    clearPendingConsent();
    return;
  }

  try {
    await logConsentBatch(pending.decisions, pending.version);
    clearPendingConsent();
  } catch {
    // Network / transient error — biarkan localStorage, retry next session.
    // Eventually pending akan replay sukses atau user re-consent via Settings.
  }
};
