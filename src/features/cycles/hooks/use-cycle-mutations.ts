import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  deleteCycle,
  endCycle,
  startCycle,
  updateCycle,
} from '@/features/cycles/api/cycles';
import {
  activeCycleQueryKey,
  cyclesQueryKey,
} from '@/features/cycles/hooks/use-cycles';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { useCouple } from '@/features/couples/hooks/use-couple';
import { useTranslation } from '@/lib/i18n';

// Helper: invalidate semua cycle queries setelah mutation.
const useInvalidateCycles = () => {
  const queryClient = useQueryClient();
  const { data: couple } = useCouple();
  const coupleId = couple?.id;

  return () => {
    if (!coupleId) return;
    void queryClient.invalidateQueries({ queryKey: cyclesQueryKey(coupleId) });
    void queryClient.invalidateQueries({ queryKey: activeCycleQueryKey(coupleId) });
  };
};

/**
 * Period mulai. Component: tombol "Period Mulai Hari Ini" (one-tap, default
 * start_date = today). Backdate flow pakai mutation ini juga dengan custom date.
 */
export const useStartPeriod = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: couple } = useCouple();
  const invalidate = useInvalidateCycles();

  return useMutation({
    mutationFn: (params: { start_date: string; notes?: string | undefined }) => {
      if (!user || !couple) {
        throw new Error('还不能记录，请刷新页面后再试。');
      }
      return startCycle({
        couple_id: couple.id,
        user_id: user.id,
        start_date: params.start_date,
        notes: params.notes,
      });
    },
    onSuccess: () => {
      invalidate();
      toast.success(t('toast.period.started'));
    },
    onError: () => {
      toast.error(t('toast.error.generic'));
    },
  });
};

/**
 * Period selesai. Component: tombol "Period Selesai" (visible kalau active cycle ada).
 * Set end_date = today (or backdate via params).
 */
export const useEndPeriod = () => {
  const { t } = useTranslation();
  const invalidate = useInvalidateCycles();

  return useMutation({
    mutationFn: (params: { cycle_id: string; end_date: string }) =>
      endCycle(params.cycle_id, params.end_date),
    onSuccess: () => {
      invalidate();
      toast.success(t('toast.period.ended'));
    },
    onError: () => {
      toast.error(t('toast.error.generic'));
    },
  });
};

/**
 * Edit cycle (start/end/notes). Component: edit dialog dari cycle list item.
 */
export const useUpdateCycle = () => {
  const { t } = useTranslation();
  const invalidate = useInvalidateCycles();

  return useMutation({
    mutationFn: updateCycle,
    onSuccess: () => {
      invalidate();
      toast.success(t('toast.cycle.saved'));
    },
    onError: () => {
      toast.error(t('toast.error.generic'));
    },
  });
};

/**
 * Soft delete cycle. Component: delete confirm dialog dari cycle list item.
 */
export const useDeleteCycle = () => {
  const { t } = useTranslation();
  const invalidate = useInvalidateCycles();

  return useMutation({
    mutationFn: deleteCycle,
    onSuccess: () => {
      invalidate();
      toast.success(t('toast.cycle.deleted'));
    },
    onError: () => {
      toast.error(t('toast.error.generic'));
    },
  });
};
