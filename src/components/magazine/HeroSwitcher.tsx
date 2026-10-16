"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Soup, Sunrise } from "lucide-react";
import type { IssueEdition } from "@/lib/news-meta";
import { cn } from "../ui";

export interface HeroSlide {
  edition: IssueEdition;
  /** 이 판의 대표 카드 (없으면 아직 안 올라온 판) */
  card: ReactNode | null;
  /** 아직 없을 때 탭에 보일 말 (예: 12:30 공개) */
  hint?: string;
}

const INTERVAL = 7000;
const TAB = {
  morning: { label: "아침판", sub: "기사 브리핑", Icon: Sunrise, on: "bg-[#ffb36b] text-brand-dark", bar: "bg-[#ff9a4d]" },
  noon: { label: "점심판", sub: "10분 공부", Icon: Soup, on: "bg-[#8fd6a8] text-brand-dark", bar: "bg-[#3fa36b]" },
} as const;

/** 첫 화면 대표 브리핑 — 아침판·점심판 카드를 번갈아 보여 주고, 탭·화살표로 직접 넘겨 볼 수 있어요 */
export function HeroSwitcher({ slides }: { slides: HeroSlide[] }) {
  const ready = slides.map((s, i) => (s.card ? i : -1)).filter((i) => i >= 0);
  const [index, setIndex] = useState(ready[0] ?? 0);
  const [hover, setHover] = useState(false);
  const [reduce, setReduce] = useState(false);
  const many = ready.length > 1;
  const running = many && !hover && !reduce;

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduce(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!running) return;
    const t = window.setTimeout(() => setIndex((i) => ready[(ready.indexOf(i) + 1) % ready.length]), INTERVAL);
    return () => window.clearTimeout(t);
  }, [running, index, ready]);

  const go = (d: number) => setIndex((i) => ready[(ready.indexOf(i) + d + ready.length) % ready.length]);
  const arrow = "inline-flex h-9 w-9 items-center justify-center rounded-full border border-hairline bg-canvas text-ink-secondary transition-colors hover:border-hairline-input disabled:opacity-30";

  return (
    <div
      className="flex h-full flex-col gap-3"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setHover(false);
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <div role="tablist" aria-label="아침판·점심판" className="inline-flex rounded-full border border-hairline bg-canvas-soft p-1">
          {slides.map((s, i) => {
            const t = TAB[s.edition];
            const on = i === index;
            return (
              <button
                key={s.edition}
                type="button"
                role="tab"
                aria-selected={on}
                disabled={!s.card}
                onClick={() => setIndex(i)}
                className={cn(
                  "relative inline-flex items-center gap-1.5 overflow-hidden rounded-full px-3.5 py-1.5 type-caption font-semibold transition-colors",
                  on ? t.on : "text-ink-secondary hover:text-ink",
                  !s.card && "cursor-default text-ink-mute hover:text-ink-mute",
                )}
              >
                <t.Icon className="h-4 w-4" strokeWidth={2} />
                {t.label}
                <span className={cn("hidden font-normal sm:inline", on ? "text-brand-dark/70" : "text-ink-mute")}>· {s.card ? t.sub : (s.hint ?? "준비 중")}</span>
                {/* 자동 넘김 진행 막대 */}
                {on && running && (
                  <span aria-hidden className="absolute inset-x-3 bottom-0.5 h-[2px] overflow-hidden rounded-full bg-brand-dark/15">
                    <span key={index} className={cn("block h-full w-full origin-left", t.bar)} style={{ animation: `kk-fill ${INTERVAL}ms linear forwards` }} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
        {many && (
          <div className="flex items-center gap-1.5">
            <button type="button" onClick={() => go(-1)} className={arrow} aria-label="이전 판">
              <ChevronLeft className="h-4 w-4" strokeWidth={2} />
            </button>
            <button type="button" onClick={() => go(1)} className={arrow} aria-label="다음 판">
              <ChevronRight className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>
        )}
      </div>

      {/* 카드는 겹쳐 두고 지금 판만 보이게 (높이는 큰 쪽에 맞춤) */}
      <div className="grid flex-1">
        {slides.map((s, i) =>
          s.card ? (
            <div
              key={s.edition}
              role="tabpanel"
              aria-hidden={i !== index}
              inert={i !== index}
              className={cn("col-start-1 row-start-1 transition-opacity duration-500", i === index ? "opacity-100" : "pointer-events-none opacity-0")}
            >
              {s.card}
            </div>
          ) : null,
        )}
      </div>
    </div>
  );
}
