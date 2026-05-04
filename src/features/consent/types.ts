// Consent log types — mirror migration 0008 schema.

export type ConsentPurpose =
  | 'core_processing'
  | 'cross_border_transfer'
  | 'partner_sharing'
  | 'sensitive_data_e2ee';

export const CONSENT_PURPOSES: readonly ConsentPurpose[] = [
  'core_processing',
  'cross_border_transfer',
  'partner_sharing',
  'sensitive_data_e2ee',
] as const;

export const REQUIRED_CONSENT_PURPOSES: readonly ConsentPurpose[] = [
  'core_processing',
  'cross_border_transfer',
] as const;

export interface ConsentState {
  purpose: ConsentPurpose;
  granted: boolean;
  version: string;
  last_event_at: string;
}

// Privacy notice version. Bump saat ada perubahan material di
// audit/compliance/privacy-notice.md. Stored di consent_log.version.
// Pasal 24 — bukti consent versioning.
export const CURRENT_PRIVACY_NOTICE_VERSION = 'v1.0' as const;
