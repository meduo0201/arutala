export const PWA_SERVICE_WORKER_URL = '/sw.js';

/**
 * vite-plugin-pwa is configured with injectRegister:false. Call this once
 * from main.tsx so the injectManifest worker actually installs (F11).
 * Uses the browser register API instead of virtual:pwa-register so the
 * client bundle does not depend on workbox-window.
 */
export const registerPwaServiceWorker = async (
  serviceWorker:
    | Pick<ServiceWorkerContainer, 'register'>
    | undefined = typeof navigator !== 'undefined'
    ? navigator.serviceWorker
    : undefined,
): Promise<void> => {
  if (!serviceWorker) return;
  try {
    await serviceWorker.register(PWA_SERVICE_WORKER_URL, { scope: '/' });
  } catch {
    // /sw.js is generated on production build. Local `pnpm dev` keeps
    // VitePWA devOptions.enabled=false, so registration may 404 — ignore.
  }
};
