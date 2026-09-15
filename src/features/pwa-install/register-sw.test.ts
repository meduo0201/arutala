import { describe, expect, it, vi } from 'vitest';
import {
  PWA_SERVICE_WORKER_URL,
  registerPwaServiceWorker,
} from '@/features/pwa-install/register-sw';

describe('registerPwaServiceWorker', () => {
  it('registers the injectManifest worker when SW is available', async () => {
    const register = vi.fn().mockResolvedValue({});
    await registerPwaServiceWorker({ register });
    expect(register).toHaveBeenCalledWith(PWA_SERVICE_WORKER_URL, {
      scope: '/',
    });
  });

  it('does not throw when registration fails', async () => {
    const register = vi.fn().mockRejectedValue(new Error('missing'));
    await expect(registerPwaServiceWorker({ register })).resolves.toBeUndefined();
  });
});
