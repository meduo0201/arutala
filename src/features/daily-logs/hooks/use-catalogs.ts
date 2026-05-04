import { useQuery } from '@tanstack/react-query';
import { listMoods, listSymptoms } from '@/features/daily-logs/api/catalogs';

// Catalogs jarang berubah—staleTime: Infinity supaya gak refetch sepanjang
// session. Updated kalau admin add new entry via DB (then user reload).

export const useSymptomCatalog = () => {
  return useQuery({
    queryKey: ['catalog', 'symptoms'] as const,
    queryFn: listSymptoms,
    staleTime: Infinity,
  });
};

export const useMoodCatalog = () => {
  return useQuery({
    queryKey: ['catalog', 'moods'] as const,
    queryFn: listMoods,
    staleTime: Infinity,
  });
};
