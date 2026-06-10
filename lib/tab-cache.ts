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

// ── Cross-tab change notification ────────────────────────────────────────────
// When one tab mutates data (e.g. food logged), other always-mounted tabs
// (dashboard, analytics) listen for this event and refetch.

const DATA_CHANGED_EVENT = "ft:data-changed";

export function notifyDataChanged(): void {
  window.dispatchEvent(new Event(DATA_CHANGED_EVENT));
}

export function onDataChanged(callback: () => void): () => void {
  window.addEventListener(DATA_CHANGED_EVENT, callback);
  return () => window.removeEventListener(DATA_CHANGED_EVENT, callback);
}
