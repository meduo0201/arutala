import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getCurrentBrowserSubscription,
  subscribePush,
  unsubscribePush,
} from '@/features/push/api';

export type PushPermissionState = 'unsupported' | NotificationPermission;
export type PushSubscriptionState =
  | 'unknown'
  | 'unsupported'      // browser tidak punya PushManager / SW
  | 'no-key'           // VITE_PUSH_VAPID_PUBLIC_KEY belum di-set
  | 'permission-denied'
  | 'not-subscribed'
  | 'subscribed';

const detectPermissionState = (): PushPermissionState => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
};

// Hook untuk Settings UI: tampil status + provide subscribe/unsubscribe actions.
export const usePushSubscriptionState = () => {
  const [state, setState] = useState<PushSubscriptionState>('unknown');
  const [permission, setPermission] = useState<PushPermissionState>(
    detectPermissionState(),
  );
  const vapidPublicKey = import.meta.env['VITE_PUSH_VAPID_PUBLIC_KEY'] as
    | string
    | undefined;

  useEffect(() => {
    let cancelled = false;

    const detect = async () => {
      if (typeof window === 'undefined') return;
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        if (!cancelled) setState('unsupported');
        return;
      }
      if (!vapidPublicKey) {
        if (!cancelled) setState('no-key');
        return;
      }

      const perm = detectPermissionState();
      if (!cancelled) setPermission(perm);
      if (perm === 'denied') {
        if (!cancelled) setState('permission-denied');
        return;
      }

      try {
        const sub = await getCurrentBrowserSubscription();
        if (cancelled) return;
        setState(sub ? 'subscribed' : 'not-subscribed');
      } catch {
        if (!cancelled) setState('not-subscribed');
      }
    };

    void detect();
    return () => {
      cancelled = true;
    };
  }, [vapidPublicKey]);

  return { state, permission, vapidPublicKey, setState };
};

// Mutations untuk subscribe / unsubscribe — wrap into TanStack Query untuk
// pending state + onSuccess invalidation.
export const usePushSubscribe = (vapidPublicKey: string | undefined) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (label?: string) => {
      if (!vapidPublicKey) throw new Error('VAPID key not configured');
      // Browser permission prompt
      if ('Notification' in window) {
        const result = await Notification.requestPermission();
        if (result !== 'granted') {
          throw new Error('Notification permission denied');
        }
      }
      return subscribePush(vapidPublicKey, label);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['push'] });
    },
  });
};

export const usePushUnsubscribe = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: unsubscribePush,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['push'] });
    },
  });
};
