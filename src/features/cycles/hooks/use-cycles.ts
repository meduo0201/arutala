import { useQuery } from '@tanstack/react-query';
import { useCouple } from '@/features/couples/hooks/use-couple';
import { getActiveCycle, listCycles } from '@/features/cycles/api/cycles';

// Query keys—reuse di mutation hooks untuk invalidation.
export const cyclesQueryKey = (coupleId: string | undefined) =>
  ['cycles', 'list', coupleId] as const;

export const activeCycleQueryKey = (coupleId: string | undefined) =>
  ['cycles', 'active', coupleId] as const;

/**
 * List recent cycles for current couple (newest first, limit 30).
 * Auto-disabled kalau belum ada couple aktif.
 */
export const useCycles = () => {
  const { data: couple } = useCouple();
  const coupleId = couple?.id;

  return useQuery({
    queryKey: cyclesQueryKey(coupleId),
    queryFn: () => {
      if (!coupleId) throw new Error('还不能记录，请刷新页面后再试。');
      return listCycles(coupleId);
    },
    enabled: !!coupleId,
  });
};

/**
 * Cycle aktif = period belum selesai. Returns null kalau gak ada.
 * Component pake ini untuk decide tombol "Period Mulai" vs "Period Selesai".
 */
export const useActiveCycle = () => {
  const { data: couple } = useCouple();
  const coupleId = couple?.id;

  return useQuery({
    queryKey: activeCycleQueryKey(coupleId),
    queryFn: () => {
      if (!coupleId) throw new Error('还不能记录，请刷新页面后再试。');
      return getActiveCycle(coupleId);
    },
    enabled: !!coupleId,
  });
};
