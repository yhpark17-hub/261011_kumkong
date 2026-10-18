"use client";

import { useEffect, useState, type ReactNode } from "react";
import { BookOpenCheck, ChevronLeft, ChevronRight, Sunrise } from "lucide-react";
import { cn } from "../ui";

/** 자동으로 넘어가는 간격 */
const INTERVAL = 7000;

/** 판마다 색·아이콘 — 아침판(브리핑)은 따뜻한 크림, 점심판(스터디)은 보라 */
const EDITION_TONE = {
  morning: { Icon: Sunrise, card: "bg-canvas-cream", tab: "text-lemon", bar: "bg-lemon" },
  noon: { Icon: BookOpenCheck, card: "bg-ev-written-soft", tab: "text-primary-text", bar: "bg-primary" },
} as const;

export interface BriefingSlide {
  key: keyof typeof EDITION_TONE;
  /** 탭 이름 (예: 금콩 브리핑) */
  label: string;
  /** 탭 아래 작은 설명 (예: 아침 기사) */
  sub: string;
  content: ReactNode;
}

/**
 * 홈: 금콩 브리핑(아침판) ↔ 금콩 스터디(점심판) 번갈아 보기
 * 위 탭(아이콘·색)과 카드 바탕색이 판마다 달라 지금 무엇을 보는지 바로 알 수 있어요.
 * 저절로 넘어가고(마우스를 올리거나 포커스가 있으면 멈춤, 움직임 줄이기 설정이면 안 넘어감), 탭과 ‹ › 로 직접 넘길 수 있어요.
 * 두 장 모두 HTML 에 있고 같은 자리에 겹쳐 두어 높이가 흔들리지 않아요.
 */
export function BriefingCarousel({ slides }: { slides: BriefingSlide[] }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const n = slides.length;
  const tone = EDITION_TONE[slides[i].key];

  useEffect(() => {
    if (n < 2 || paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = window.setTimeout(() => setI((x) => (x + 1) % n), INTERVAL);
    return () => window.clearTimeout(t);
  }, [i, n, paused]);

  const go = (d: number) => setI((x) => (x + d + n) % n);

  return (
    <section
      aria-roledescription="carousel"
      aria-label="오늘의 브리핑"
      className={cn("relative flex h-full flex-col rounded-xl p-5 transition-colors duration-300 md:p-6", tone.card)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {n > 1 && (
        <div className="mb-4 flex items-center gap-2">
          <div className="grid flex-1 grid-cols-2 gap-1 rounded-xl bg-canvas/60 p-1" role="tablist" aria-label="브리핑 고르기">
            {slides.map((s, k) => {
              const t = EDITION_TONE[s.key];
              const on = k === i;
              return (
                <button
                  key={s.key}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  onClick={() => setI(k)}
                  className={cn(
                    "relative flex min-w-0 items-center justify-center gap-1.5 overflow-hidden rounded-lg px-2 py-1.5 transition-colors",
                    on ? "bg-canvas shadow-level-1" : "text-ink-mute hover:text-ink",
                  )}
                >
                  <t.Icon className={cn("h-4 w-4 shrink-0", on && t.tab)} strokeWidth={2} />
                  <span className={cn("truncate type-caption font-bold", on ? "text-ink" : "")}>{s.label}</span>
                  <span className="hidden truncate type-micro text-ink-mute sm:inline">{s.sub}</span>
                  {/* 자동 넘김 진행 막대 */}
                  {on && !paused && (
                    <span
                      key={i}
                      aria-hidden
                      className={cn("absolute bottom-0 left-0 h-0.5 origin-left motion-safe:animate-[kk-progress_7s_linear] motion-reduce:hidden", t.bar)}
                      style={{ width: "100%" }}
                    />
                  )}
                </button>
              );
            })}
          </div>
          <button type="button" onClick={() => go(-1)} aria-label="이전 브리핑" className="btn btn-icon btn-toggle !h-8 !w-8 shrink-0 bg-canvas">
            <ChevronLeft className="h-4 w-4" strokeWidth={2} />
          </button>
          <button type="button" onClick={() => go(1)} aria-label="다음 브리핑" className="btn btn-icon btn-toggle !h-8 !w-8 shrink-0 bg-canvas">
            <ChevronRight className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
      )}

      <div className="grid flex-1">
        {slides.map((s, k) => (
          <div
            key={s.key}
            role="group"
            aria-roledescription="slide"
            aria-label={`${k + 1} / ${n} · ${s.label}`}
            aria-hidden={k !== i}
            inert={k !== i}
            className={cn("col-start-1 row-start-1 min-w-0 transition-opacity duration-300 motion-reduce:transition-none", k === i ? "opacity-100" : "invisible opacity-0")}
          >
            {s.content}
          </div>
        ))}
      </div>
    </section>
  );
}
