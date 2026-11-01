"use client";

import Script from "next/script";
import { useSyncExternalStore } from "react";
import { isAppView } from "@/lib/app-view";

const noSubscribe = () => () => {};

/** 금콩 앱 웹뷰 안이면 true (서버·첫 그림에서는 false) */
export function useAppView(): boolean {
  return useSyncExternalStore(noSubscribe, isAppView, () => false);
}

/**
 * AdSense 스크립트 — 앱 웹뷰에서는 불러오지 않아요 (앱 안 웹뷰 광고는 AdSense 정책 위반이 될 수 있어서).
 * 서버에서는 그리지 않고, 브라우저에서 앱이 아닐 때만 붙여요 (afterInteractive라 불러오는 시점은 예전과 같아요).
 */
export function AdsenseScript({ client }: { client: string }) {
  const browser = useSyncExternalStore(noSubscribe, () => !isAppView(), () => false);
  if (!browser) return null;
  return (
    <Script
      id="adsbygoogle-init"
      async
      strategy="afterInteractive"
      crossOrigin="anonymous"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`}
    />
  );
}
