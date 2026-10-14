/**
 * 매거진 개인 기록 (이 브라우저에만 저장 — 서버로 보내지 않음)
 * - 읽은 글, 저장한 글
 * useSyncExternalStore 로 읽어서 서버 렌더링과 어긋나지 않게 합니다.
 */

export interface SavedArticle {
  id: number;
  title: string;
  category: string;
  savedAt: number;
}

const KEYS = {
  read: "kumkong:mag:read",
  saved: "kumkong:mag:saved",
} as const;

type Key = keyof typeof KEYS;

const listeners = new Set<() => void>();
const cache = new Map<string, { raw: string | null; value: unknown }>();

function readRaw(key: Key): string | null {
  try {
    return localStorage.getItem(KEYS[key]);
  } catch {
    return null;
  }
}

function parse<T>(key: Key, fallback: T): T {
  const raw = readRaw(key);
  const hit = cache.get(key);
  if (hit && hit.raw === raw) return hit.value as T;
  let value: T = fallback;
  try {
    if (raw) value = JSON.parse(raw) as T;
  } catch {
    value = fallback;
  }
  cache.set(key, { raw, value });
  return value;
}

function write(key: Key, value: unknown) {
  try {
    localStorage.setItem(KEYS[key], JSON.stringify(value));
  } catch {
    /* 사생활 보호 모드 등 — 기록 없이 진행 */
  }
  listeners.forEach((l) => l());
}

export function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key && Object.values(KEYS).includes(e.key as (typeof KEYS)[Key])) cb();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

const EMPTY_READ: Record<string, number> = {};
const EMPTY_SAVED: SavedArticle[] = [];

export const getRead = () => parse<Record<string, number>>("read", EMPTY_READ);
export const getSaved = () => parse<SavedArticle[]>("saved", EMPTY_SAVED);

export const serverRead = () => EMPTY_READ;
export const serverSaved = () => EMPTY_SAVED;

export function markRead(id: number) {
  const read: Record<string, number> = { ...getRead(), [id]: Date.now() };
  // 오래된 기록은 정리 (최근 300개)
  const entries = Object.entries(read)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 300);
  write("read", Object.fromEntries(entries));
}

export function toggleSaved(item: Omit<SavedArticle, "savedAt">): boolean {
  const saved = getSaved();
  const exists = saved.some((s) => s.id === item.id);
  write("saved", exists ? saved.filter((s) => s.id !== item.id) : [{ ...item, savedAt: Date.now() }, ...saved].slice(0, 200));
  return !exists;
}
