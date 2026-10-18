"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../ui";

/** 자동으로 넘어가는 간격 */
const INTERVAL = 7000;

/**
 * 홈: 금콩 브리핑(아침판) ↔ 금콩 스터디(점심판) 번갈아 보기
 * 저절로 넘어가고(마우스를 올리거나 포커스가 있으면 멈춤, 움직임 줄이기 설정이면 안 넘어감), ‹ › 와 점으로 직접 넘길 수 있어요.
 * 두 장 모두 HTML 에 있고 같은 자리에 겹쳐 두어 높이가 흔들리지 않아요.
 */
export function BriefingCarousel({ slides }: { slides: { key: string; label: string; content: ReactNode }[] }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const n = slides.length;

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
      className="relative flex h-full flex-col rounded-xl bg-canvas-cream p-6"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
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

      {n > 1 && (
        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="flex gap-1.5">
            {slides.map((s, k) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setI(k)}
                aria-label={`${s.label} 보기`}
                aria-current={k === i}
                className={cn("rounded-full px-2.5 py-1 type-micro font-semibold transition-colors", k === i ? "bg-brand-dark text-on-primary" : "bg-canvas text-ink-secondary hover:text-ink")}
              >
                {s.label}
              </button>
            ))}
          </div>
          <div className="flex gap-1.5">
            <button type="button" onClick={() => go(-1)} aria-label="이전 브리핑" className="btn btn-icon btn-toggle !h-8 !w-8 bg-canvas">
              <ChevronLeft className="h-4 w-4" strokeWidth={2} />
            </button>
            <button type="button" onClick={() => go(1)} aria-label="다음 브리핑" className="btn btn-icon btn-toggle !h-8 !w-8 bg-canvas">
              <ChevronRight className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
