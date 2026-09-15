import { describe, expect, it } from 'vitest';
import {
  nextRealtimeReconnectDelay,
  REALTIME_RECONNECT_MAX_ATTEMPTS,
  shouldReconnectRealtime,
} from '@/features/couples/lib/realtime-reconnect';

describe('realtime reconnect (F13)', () => {
  it('reconnects on channel error / timeout only', () => {
    expect(shouldReconnectRealtime('CHANNEL_ERROR')).toBe(true);
    expect(shouldReconnectRealtime('TIMED_OUT')).toBe(true);
    expect(shouldReconnectRealtime('CLOSED')).toBe(false);
    expect(shouldReconnectRealtime('SUBSCRIBED')).toBe(false);
  });

  it('uses bounded exponential backoff', () => {
    expect(nextRealtimeReconnectDelay(0)).toBe(1_000);
    expect(nextRealtimeReconnectDelay(1)).toBe(2_000);
    expect(nextRealtimeReconnectDelay(10)).toBe(15_000);
    expect(REALTIME_RECONNECT_MAX_ATTEMPTS).toBeGreaterThan(0);
  });
});
