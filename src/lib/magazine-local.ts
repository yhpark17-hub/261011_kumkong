/**
 * 매거진 개인 기록 (이 브라우저에만 저장 — 서버로 보내지 않음)
 * - 읽은 글, 저장한 글, 브리핑을 읽은 날짜(연속 읽기)
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
  briefDays: "kumkong:mag:brief-days",
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
const EMPTY_DAYS: string[] = [];

export const getRead = () => parse<Record<string, number>>("read", EMPTY_READ);
export const getSaved = () => parse<SavedArticle[]>("saved", EMPTY_SAVED);
export const getBriefDays = () => parse<string[]>("briefDays", EMPTY_DAYS);

export const serverRead = () => EMPTY_READ;
export const serverSaved = () => EMPTY_SAVED;
export const serverBriefDays = () => EMPTY_DAYS;

export function markRead(id: number) {
  const read: Record<string, number> = { ...getRead(), [id]: Date.now() };
  // 오래된 기록은 정리 (최근 300개)
  const entries = Object.entries(read)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 300);
  write("read", Object.fromEntries(entries));
}

export function markBriefingDay(dayKey: string) {
  const days = getBriefDays();
  if (days.includes(dayKey)) return;
  write("briefDays", [dayKey, ...days].sort().reverse().slice(0, 400));
}

export function toggleSaved(item: Omit<SavedArticle, "savedAt">): boolean {
  const saved = getSaved();
  const exists = saved.some((s) => s.id === item.id);
  write("saved", exists ? saved.filter((s) => s.id !== item.id) : [{ ...item, savedAt: Date.now() }, ...saved].slice(0, 200));
  return !exists;
}

const DAY_MS = 86_400_000;
const keyOf = (ms: number) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).format(ms);

/** 오늘(또는 어제)까지 이어진 브리핑 연속 읽기 일수 */
export function briefingStreak(days: string[], now = Date.now()): { streak: number; readToday: boolean } {
  const set = new Set(days);
  const today = keyOf(now);
  const readToday = set.has(today);
  let cursor = readToday ? now : now - DAY_MS;
  let streak = 0;
  while (set.has(keyOf(cursor))) {
    streak++;
    cursor -= DAY_MS;
  }
  return { streak, readToday };
}

/** 최근 7일 (오래된 날 → 오늘) 읽음 여부 */
export function lastWeek(days: string[], now = Date.now()): { key: string; read: boolean }[] {
  const set = new Set(days);
  return Array.from({ length: 7 }, (_, i) => {
    const key = keyOf(now - (6 - i) * DAY_MS);
    return { key, read: set.has(key) };
  });
}
