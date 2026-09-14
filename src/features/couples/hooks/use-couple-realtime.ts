import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { coupleQueryKey } from '@/features/couples/hooks/use-couple';
import {
  activeCycleQueryKey,
  cyclesQueryKey,
} from '@/features/cycles/hooks/use-cycles';
import {
  dailyLogsListKey,
} from '@/features/daily-logs/hooks/use-daily-logs';

/**
 * Subscribe to Supabase Realtime untuk current couple. Ada 3 channel:
 * - cycles (INSERT/UPDATE/DELETE) → invalidate cycle queries
 * - daily_logs (INSERT/UPDATE/DELETE) → invalidate daily-logs queries
 * - couples row (UPDATE only) → invalidate couple query (mostly for unlink propagation)
 *
 * Filter by `couple_id=eq.${coupleId}` supaya cuma event yang relevan masuk.
 *
 * Schema (SCHEMA.sql) udah include:
 *   alter publication supabase_realtime add table public.cycles;
 *   alter publication supabase_realtime add table public.daily_logs;
 * Couples table belum—kita add di P2-6 migration.
 */
export const useCoupleRealtime = (coupleId: string | undefined) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  useEffect(() => {
    if (!coupleId || !user) return undefined;

    const channel = supabase
      .channel(`couple-${coupleId}`)
      .on(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- supabase Realtime type union too narrow
        'postgres_changes' as any,
        {
          event: '*',
          schema: 'public',
          table: 'cycles',
          filter: `couple_id=eq.${coupleId}`,
        },
        () => {
          void queryClient.invalidateQueries({ queryKey: cyclesQueryKey(coupleId) });
          void queryClient.invalidateQueries({
            queryKey: activeCycleQueryKey(coupleId),
          });
        },
      )
      .on(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        'postgres_changes' as any,
        {
          event: '*',
          schema: 'public',
          table: 'daily_logs',
          filter: `couple_id=eq.${coupleId}`,
        },
        () => {
          void queryClient.invalidateQueries({ queryKey: dailyLogsListKey(coupleId) });
          // by-date queries auto-refetch via list invalidation OR pas user navigate
        },
      )
      .on(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        'postgres_changes' as any,
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'couples',
          filter: `id=eq.${coupleId}`,
        },
        () => {
          // Unlink propagation: kalo partner unlink, status berubah → query refetch.
          void queryClient.invalidateQueries({ queryKey: coupleQueryKey(user.id) });
        },
      )
      .subscribe((status) => {
        // Realtime is best-effort. If the proxied WebSocket is blocked or
        // drops, HTTP queries still work — tear the channel down so supabase-js
        // does not retry forever in the background.
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          void supabase.removeChannel(channel);
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [coupleId, user, queryClient]);
};
