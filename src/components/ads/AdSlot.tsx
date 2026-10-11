"use client";

import { useEffect, useRef } from "react";
import { ADSENSE_CLIENT } from "@/lib/site";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

type Variant = "leaderboard" | "rectangle" | "skyscraper" | "infeed" | "inarticle";

/** 레이아웃 이동(CLS)을 막기 위해 광고 높이를 미리 확보합니다. */
const VARIANT: Record<Variant, { minH: string; format: string; label: string }> = {
  leaderboard: { minH: "min-h-[100px] md:min-h-[90px]", format: "horizontal", label: "728×90 · 반응형" },
  rectangle: { minH: "min-h-[250px]", format: "rectangle", label: "300×250" },
  skyscraper: { minH: "min-h-[600px]", format: "vertical", label: "300×600" },
  infeed: { minH: "min-h-[120px]", format: "auto", label: "인피드 · 반응형" },
  inarticle: { minH: "min-h-[200px]", format: "fluid", label: "본문 내 광고" },
};

interface Props {
  slot: string;
  variant: Variant;
  className?: string;
}

export function AdSlot({ slot, variant, className = "" }: Props) {
  const ref = useRef<HTMLModElement>(null);
  const v = VARIANT[variant];
  const enabled = Boolean(ADSENSE_CLIENT && slot);

  useEffect(() => {
    const el = ref.current;
    // 같은 <ins>에 두 번 push하면 AdSense가 오류를 냅니다 (페이지 복귀 시 effect 재실행 대비).
    if (!enabled || !el || el.dataset.adsbygoogleStatus) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      /* 광고 차단기 등 — 무시 */
    }
  }, [enabled]);

  if (!enabled) {
    if (process.env.NODE_ENV === "production") return null;
    return (
      <div
        className={`flex flex-col items-center justify-center rounded-md border border-dashed border-hairline-input bg-canvas-soft text-center text-ink-mute ${v.minH} ${className}`}
        aria-hidden
      >
        <span className="type-micro-cap">AD</span>
        <span className="mt-1 type-micro">광고 영역 · {v.label}</span>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="mb-1 text-right type-micro-cap text-ink-mute">광고</div>
      <ins
        ref={ref}
        className={`adsbygoogle block ${v.minH}`}
        style={{ display: "block" }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slot}
        data-ad-format={v.format}
        data-ad-layout={variant === "inarticle" ? "in-article" : undefined}
        data-full-width-responsive="true"
      />
    </div>
  );
}
