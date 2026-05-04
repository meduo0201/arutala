import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getCurrentConsentState,
  logConsent,
  logConsentBatch,
} from '@/features/consent/api';
import type { ConsentPurpose, ConsentState } from '@/features/consent/types';

const CONSENT_QUERY_KEY = ['consent', 'state'] as const;

// TanStack Query for consent state. staleTime 1 menit—consent rarely changes
// dalam single session, no need re-fetch on every render.
export const useConsentState = () => {
  return useQuery({
    queryKey: CONSENT_QUERY_KEY,
    queryFn: getCurrentConsentState,
    staleTime: 60_000,
  });
};

// Single consent mutation (used by Settings privacy panel toggle).
export const useLogConsent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { purpose: ConsentPurpose; granted: boolean }) =>
      logConsent(input.purpose, input.granted),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: CONSENT_QUERY_KEY });
    },
  });
};

// Batch consent (used by signup form submission).
export const useLogConsentBatch = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (entries: Array<{ purpose: ConsentPurpose; granted: boolean }>) =>
      logConsentBatch(entries),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: CONSENT_QUERY_KEY });
    },
  });
};

// Helper: convert ConsentState[] → Record<ConsentPurpose, ConsentState | undefined>
export const consentMapByPurpose = (
  states: ConsentState[],
): Partial<Record<ConsentPurpose, ConsentState>> => {
  const map: Partial<Record<ConsentPurpose, ConsentState>> = {};
  for (const s of states) {
    map[s.purpose] = s;
  }
  return map;
};
