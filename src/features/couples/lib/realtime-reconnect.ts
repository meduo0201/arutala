export const REALTIME_RECONNECT_BASE_MS = 1_000;
export const REALTIME_RECONNECT_MAX_MS = 15_000;
export const REALTIME_RECONNECT_MAX_ATTEMPTS = 5;

export const shouldReconnectRealtime = (status: string): boolean =>
  status === 'CHANNEL_ERROR' || status === 'TIMED_OUT';

export const nextRealtimeReconnectDelay = (attempt: number): number => {
  const exp = REALTIME_RECONNECT_BASE_MS * 2 ** Math.max(0, attempt);
  return Math.min(REALTIME_RECONNECT_MAX_MS, exp);
};
