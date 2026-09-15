import { describe, expect, it, vi } from 'vitest';
import { waitForServiceWorkerReady } from '@/features/push/sw-ready';

describe('waitForServiceWorkerReady', () => {
  it('resolves when ready settles in time', async () => {
    const registration = { scope: '/' } as ServiceWorkerRegistration;
    const ready = Promise.resolve(registration);
    await expect(
      waitForServiceWorkerReady({ ready }, 50),
    ).resolves.toBe(registration);
  });

  it('rejects instead of hanging when ready never settles', async () => {
    vi.useFakeTimers();
    const ready = new Promise<ServiceWorkerRegistration>(() => undefined);
    const pending = waitForServiceWorkerReady({ ready }, 25);
    const assertion = expect(pending).rejects.toThrow(/超时/);
    await vi.advanceTimersByTimeAsync(30);
    await assertion;
    vi.useRealTimers();
  });
});
