import { QueryClient } from '@tanstack/react-query';

// Default config dipake untuk semua TanStack Query hooks.
// Override per-query via `useQuery({ ..., staleTime: ... })` kalau perlu.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 30 detik—balance antara fresh data vs avoid spam refetch.
      // Cycle/log data jarang berubah dari user lain dalam window kecil ini.
      staleTime: 30 * 1000,
      // 5 menit—berapa lama unmounted query data tetep di cache.
      gcTime: 5 * 60 * 1000,
      // Retry sekali aja kalau gagal (mis. flaky network). Lebih banyak = annoying user.
      retry: 1,
      // 2-user app: gak perlu agresif refetch tiap window focus.
      refetchOnWindowFocus: false,
    },
    mutations: {
      // Jangan retry mutation otomatis—write ops idempotent risk + user expectation
      // duplicate kalau retry diam-diam.
      retry: 0,
    },
  },
});
