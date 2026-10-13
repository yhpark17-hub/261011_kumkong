"use client";

import { usePathname } from "next/navigation";
import { Suspense, useEffect } from "react";

/**
 * 방문 통계 — 페이지 열람과 '실제로 화면에 보인 시간'을 /api/collect 로 보냅니다.
 * 개인을 알아볼 수 있는 정보는 보내지 않고, 브라우저에 저장한 무작위 ID 로만 방문자를 구분합니다.
 */

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 14)}`;

function storedId(getStorage: () => Storage, key: string): string {
  try {
    const storage = getStorage();
    let value = storage.getItem(key);
    if (!value) {
      value = uid();
      storage.setItem(key, value);
    }
    return value;
  } catch {
    return uid();
  }
}

function send(payload: Record<string, unknown>) {
  const body = JSON.stringify(payload);
  try {
    if (navigator.sendBeacon?.("/api/collect", new Blob([body], { type: "text/plain" }))) return;
  } catch {
    /* sendBeacon 미지원 — fetch 로 대체 */
  }
  fetch("/api/collect", { method: "POST", body, keepalive: true, headers: { "content-type": "text/plain" } }).catch(() => {});
}

/** 처음 들어온 페이지에서만 외부 유입 경로(referrer)를 보냄 */
let firstView = true;

function PageTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;
    const id = uid();
    send({
      t: "view",
      id,
      p: pathname,
      v: storedId(() => localStorage, "kumkong:vid"),
      s: storedId(() => sessionStorage, "kumkong:sid"),
      w: window.innerWidth,
      r: firstView ? document.referrer : "",
    });
    firstView = false;

    // 탭이 보이는 동안만 머문 시간으로 셈
    let visibleMs = 0;
    let since: number | null = document.visibilityState === "visible" ? performance.now() : null;
    const total = () => visibleMs + (since != null ? performance.now() - since : 0);
    const flush = () => {
      const d = Math.round(total());
      if (d > 500) send({ t: "leave", id, d });
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        if (since != null) {
          visibleMs += performance.now() - since;
          since = null;
        }
        flush();
      } else {
        since = performance.now();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", flush);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, [pathname]);

  return null;
}

/** 루트 레이아웃에 한 번 둡니다 (경로를 읽으므로 Suspense 안에서) */
export function Tracker() {
  return (
    <Suspense fallback={null}>
      <PageTracker />
    </Suspense>
  );
}
