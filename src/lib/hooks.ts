"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { todayKST } from "./date";

/* ------------------------------------------------------------------ */
/* 오늘 날짜 (KST)                                                     */
/* 서버 프리렌더 시에는 null → 클라이언트에서 실제 날짜로 렌더링합니다.   */
/* ------------------------------------------------------------------ */

function subscribeClock(cb: () => void) {
  const id = window.setInterval(cb, 60_000);
  const onVisible = () => document.visibilityState === "visible" && cb();
  document.addEventListener("visibilitychange", onVisible);
  return () => {
    window.clearInterval(id);
    document.removeEventListener("visibilitychange", onVisible);
  };
}

export function useTodayKey(): string | null {
  return useSyncExternalStore(subscribeClock, todayKST, () => null);
}

/* ------------------------------------------------------------------ */
/* 관심 기관 (localStorage)                                             */
/* ------------------------------------------------------------------ */

const FAV_KEY = "kumkong:favorites";
const favListeners = new Set<() => void>();
/** localStorage를 쓸 수 없는 환경(시크릿 모드 등)용 메모리 사본 */
let favMemory = "[]";

function readFavRaw(): string {
  try {
    return window.localStorage.getItem(FAV_KEY) ?? favMemory;
  } catch {
    return favMemory;
  }
}

function subscribeFav(cb: () => void) {
  favListeners.add(cb);
  const onStorage = (e: StorageEvent) => e.key === FAV_KEY && cb();
  window.addEventListener("storage", onStorage);
  return () => {
    favListeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

export function useFavorites() {
  const raw = useSyncExternalStore(subscribeFav, readFavRaw, () => "[]");
  const favorites = useMemo(() => {
    try {
      const parsed: unknown = JSON.parse(raw);
      return new Set(Array.isArray(parsed) ? parsed.map(String) : []);
    } catch {
      return new Set<string>();
    }
  }, [raw]);

  const toggle = useCallback(
    (id: string) => {
      const next = new Set(favorites);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      favMemory = JSON.stringify([...next]);
      try {
        window.localStorage.setItem(FAV_KEY, favMemory);
      } catch {
        /* 저장소 사용 불가 — 메모리 사본으로만 유지 */
      }
      favListeners.forEach((l) => l());
    },
    [favorites],
  );

  return { favorites, toggle };
}
