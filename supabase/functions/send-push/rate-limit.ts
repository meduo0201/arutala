export interface RateLimiter {
  take: (key: string, now?: number) => boolean;
}

export const createRateLimiter = (opts: {
  windowMs: number;
  max: number;
}): RateLimiter => {
  const hits = new Map<string, number[]>();

  return {
    take(key: string, now = Date.now()): boolean {
      const kept = (hits.get(key) ?? []).filter((t) => now - t < opts.windowMs);
      if (kept.length >= opts.max) {
        hits.set(key, kept);
        return false;
      }
      kept.push(now);
      hits.set(key, kept);
      return true;
    },
  };
};
