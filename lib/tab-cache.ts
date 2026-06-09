// Module-level Map — persists for the entire browser session (survives React
// unmount/remount caused by client-side navigation between tab routes).
const store = new Map<string, { data: unknown; ts: number }>();

const TTL = 30_000; // 30 s, matches staleTimes.dynamic

export function cacheGet<T>(key: string): T | undefined {
  const e = store.get(key);
  if (!e || Date.now() - e.ts > TTL) return undefined;
  return e.data as T;
}

export function cacheSet(key: string, data: unknown): void {
  store.set(key, { data, ts: Date.now() });
}
