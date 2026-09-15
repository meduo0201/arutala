import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { coupleQueryKey } from '@/features/couples/hooks/use-couple';
import {
  nextRealtimeReconnectDelay,
  REALTIME_RECONNECT_MAX_ATTEMPTS,
  shouldReconnectRealtime,
} from '@/features/couples/lib/realtime-reconnect';
import {
  activeCycleQueryKey,
  cyclesQueryKey,
} from '@/features/cycles/hooks/use-cycles';
import {
  dailyLogsByDatePrefix,
  dailyLogsListKey,
} from '@/features/daily-logs/hooks/use-daily-logs';

/**
 * Subscribe to Supabase Realtime untuk current couple. Ada 3 channel:
 * - cycles (INSERT/UPDATE/DELETE) → invalidate cycle queries
 * - daily_logs (INSERT/UPDATE/DELETE) → invalidate list + by-date (F13)
 * - couples row (UPDATE only) → invalidate couple query (mostly for unlink)
 *
 * CHANNEL_ERROR / TIMED_OUT trigger a bounded reconnect instead of hanging
 * or giving up forever.
 */
export const useCoupleRealtime = (coupleId: string | undefined) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  useEffect(() => {
    if (!coupleId || !user) return undefined;

    let cancelled = false;
    let attempt = 0;
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const invalidateDailyLogs = () => {
      void queryClient.invalidateQueries({ queryKey: dailyLogsListKey(coupleId) });
      void queryClient.invalidateQueries({
        queryKey: dailyLogsByDatePrefix(coupleId),
      });
    };

    const subscribe = () => {
      if (cancelled) return;

      channel = supabase
        .channel(`couple-${coupleId}-${attempt}`)
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
          invalidateDailyLogs,
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
            void queryClient.invalidateQueries({ queryKey: coupleQueryKey(user.id) });
          },
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            attempt = 0;
            return;
          }
          if (!shouldReconnectRealtime(status)) return;
          if (channel) void supabase.removeChannel(channel);
          if (cancelled || attempt >= REALTIME_RECONNECT_MAX_ATTEMPTS) return;
          const delay = nextRealtimeReconnectDelay(attempt);
          attempt += 1;
          reconnectTimer = setTimeout(subscribe, delay);
        });
    };

    subscribe();

    return () => {
      cancelled = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (channel) void supabase.removeChannel(channel);
    };
  }, [coupleId, user, queryClient]);
};
