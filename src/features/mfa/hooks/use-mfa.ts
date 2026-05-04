import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  challengeAndVerifyMfa,
  enrollMfa,
  listMfaFactors,
  unenrollMfa,
} from '@/features/mfa/api';

const MFA_QUERY_KEY = ['mfa', 'factors'] as const;

export const useMfaFactors = () => {
  return useQuery({
    queryKey: MFA_QUERY_KEY,
    queryFn: listMfaFactors,
    staleTime: 30_000,
  });
};

export const useMfaEnroll = () => {
  return useMutation({
    mutationFn: enrollMfa,
  });
};

export const useMfaVerify = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { factorId: string; code: string }) =>
      challengeAndVerifyMfa(input.factorId, input.code),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: MFA_QUERY_KEY });
    },
  });
};

export const useMfaUnenroll = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (factorId: string) => unenrollMfa(factorId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: MFA_QUERY_KEY });
    },
  });
};
