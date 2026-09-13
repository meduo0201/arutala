import { supabase } from '@/lib/supabase';

// Convert ArrayBuffer → URL-safe base64 (web-push format).
const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

// Convert URL-safe base64 → Uint8Array (for VAPID applicationServerKey).
const base64UrlToUint8Array = (base64: string): Uint8Array => {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
};

export interface BrowserSubscription {
  endpoint: string;
  p256dh: string;
  auth: string;
}

const subscriptionToServerShape = (
  sub: PushSubscription,
): BrowserSubscription => {
  const p256dhKey = sub.getKey('p256dh');
  const authKey = sub.getKey('auth');
  if (!p256dhKey || !authKey) {
    throw new Error('推送订阅不完整，请重试。');
  }
  return {
    endpoint: sub.endpoint,
    p256dh: arrayBufferToBase64(p256dhKey),
    auth: arrayBufferToBase64(authKey),
  };
};

// Subscribe via PushManager + register di server via RPC.
// Pre-conditions:
//   - VITE_PUSH_VAPID_PUBLIC_KEY set
//   - Service worker registered + active (vite-plugin-pwa autoUpdate handles)
//   - User granted Notification permission
export const subscribePush = async (
  vapidPublicKey: string,
  label?: string,
): Promise<{ id: string; endpoint: string }> => {
  if (!('serviceWorker' in navigator)) {
    throw new Error('当前浏览器不支持此功能。');
  }
  if (!('PushManager' in window)) {
    throw new Error('当前浏览器不支持此功能。');
  }

  const registration = await navigator.serviceWorker.ready;
  const existing = await registration.pushManager.getSubscription();
  let subscription = existing;
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: base64UrlToUint8Array(vapidPublicKey),
    });
  }

  const shape = subscriptionToServerShape(subscription);

  const { data, error } = await supabase.rpc('register_push_subscription', {
    p_endpoint: shape.endpoint,
    p_p256dh: shape.p256dh,
    p_auth: shape.auth,
    p_label: label ?? null,
  } as never);

  if (error) throw error;
  return { id: data as unknown as string, endpoint: shape.endpoint };
};

// Unsubscribe locally + soft-delete server-side.
export const unsubscribePush = async (): Promise<void> => {
  if (!('serviceWorker' in navigator)) return;
  const registration = await navigator.serviceWorker.ready;
  const sub = await registration.pushManager.getSubscription();
  if (!sub) return;

  const endpoint = sub.endpoint;
  await sub.unsubscribe();

  const { error } = await supabase.rpc('unregister_push_subscription', {
    p_endpoint: endpoint,
  } as never);
  if (error) throw error;
};

// Read current browser subscription (kalau ada) — without server roundtrip.
// Used untuk detect status: subscribed/not.
export const getCurrentBrowserSubscription = async (): Promise<PushSubscription | null> => {
  if (!('serviceWorker' in navigator)) return null;
  if (!('PushManager' in window)) return null;
  try {
    const registration = await navigator.serviceWorker.ready;
    return await registration.pushManager.getSubscription();
  } catch {
    return null;
  }
};
