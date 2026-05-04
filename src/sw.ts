/// <reference lib="webworker" />
//
// Arutala custom Service Worker (Phase 4 Track C2).
//
// Responsibilities:
//   1. Precache static assets via Workbox (vite-plugin-pwa injectManifest).
//   2. Auto-skip-waiting + claim clients on update (autoUpdate).
//   3. Push notification handler — display via showNotification.
//   4. NotificationClick handler — open app at given URL.
//
// SECURITY:
//   - NO runtime cache untuk /rest/v1/* (audit F-021 fix). Workbox precache
//     hanya static assets dari __WB_MANIFEST.
//   - Push payload TIDAK boleh berisi data sensitif kesehatan (audit I-04 —
//     payload visible di lock screen). Server (Edge Function) bertanggung
//     jawab compose generic title/body without sensitive content.

import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{ url: string; revision: string | null }>;
};

// ----- Workbox precache (static assets) -----
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// ----- Activation / control flow -----
self.addEventListener('install', () => {
  void self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// ----- Push notification handler -----
//
// Expected payload (sent by Edge Function send-push):
// {
//   title: string,
//   body: string,
//   url?: string,         // optional path to open on click, default '/'
//   tag?: string          // optional tag for collapsing similar notifs
// }
//
// Generic title/body — no sensitive data per audit I-04.

self.addEventListener('push', (event) => {
  let data: { title: string; body: string; url?: string; tag?: string } = {
    title: 'Arutala',
    body: 'Ada notifikasi baru',
  };

  try {
    if (event.data) {
      data = { ...data, ...(event.data.json() as typeof data) };
    }
  } catch {
    // Malformed payload — fall back to default.
  }

  const options: NotificationOptions = {
    body: data.body,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: data.tag ?? 'arutala-default',
    data: { url: data.url ?? '/' },
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data?.url as string | undefined) ?? '/';

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });
      // Reuse existing tab kalau ada
      for (const client of allClients) {
        if ('focus' in client) {
          await (client as WindowClient).focus();
          if ('navigate' in client && client.url !== targetUrl) {
            try {
              await (client as WindowClient).navigate(targetUrl);
            } catch {
              // navigate gagal kalau cross-origin or restricted; ignore
            }
          }
          return;
        }
      }
      // Buka tab baru kalau gak ada
      await self.clients.openWindow(targetUrl);
    })(),
  );
});

// ----- pushsubscriptionchange (auto-resubscribe saat browser rotate keys) -----
//
// Browser sometimes regenerates subscription endpoints (key rotation, lost sub).
// Best practice: re-subscribe + send new endpoint to server. Here we just log;
// proper handling via app-level retry pattern.

self.addEventListener('pushsubscriptionchange', () => {
  // Future: silent re-subscribe via PushManager + RPC update.
  // For now, app-level useSubscriptionState polls + re-registers on next
  // app open if needed.
});
