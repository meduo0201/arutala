export const SERVICE_WORKER_READY_TIMEOUT_MS = 8_000;

/**
 * navigator.serviceWorker.ready never resolves if no SW is registered
 * (vite-plugin-pwa injectRegister:false without a manual register).
 * Race it so push subscribe cannot hang forever (F11).
 */
export const waitForServiceWorkerReady = (
  serviceWorker: Pick<ServiceWorkerContainer, 'ready'>,
  timeoutMs = SERVICE_WORKER_READY_TIMEOUT_MS,
): Promise<ServiceWorkerRegistration> => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error('推送服务启动超时，请刷新后重试。'));
    }, timeoutMs);
  });

  return Promise.race([serviceWorker.ready, timeout]).finally(() => {
    if (timer) clearTimeout(timer);
  });
};
