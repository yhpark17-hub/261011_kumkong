"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Clock3 } from "lucide-react";
import { EDITION_LABEL, type IssueEdition } from "@/lib/news-meta";
import { cn } from "../ui";

export interface HeroSlide {
  edition: IssueEdition;
  /** 이 판의 대표 카드 (없으면 아직 안 올라온 판) */
  card: ReactNode | null;
  /** 아직 없을 때 썸네일 구석에 보일 말 (예: 낮 12시 30분 공개 — 넓은 화면에선 앞에 판 이름이 붙어요) */
  hint?: string;
}

const INTERVAL = 7000;
const BAR = { morning: "bg-[#ff9a4d]", noon: "bg-[#3fa36b]" } as const;

/**
 * 첫 화면 대표 브리핑 — 아침판·금콩 스터디 카드를 번갈아 보여 줘요.
 * 넘기는 화살표와 판 표시 점은 썸네일 오른쪽 위 구석에 작게 모아 둬요 (휴대폰은 옆으로 밀어서도 넘겨요).
 */
export function HeroSwitcher({ slides }: { slides: HeroSlide[] }) {
  const ready = slides.map((s, i) => (s.card ? i : -1)).filter((i) => i >= 0);
  const [index, setIndex] = useState(ready[0] ?? 0);
  const [hover, setHover] = useState(false);
  const [reduce, setReduce] = useState(false);
  const touch = useRef<number | null>(null);
  const many = ready.length > 1;
  const running = many && !hover && !reduce;
  const waiting = slides.find((s) => !s.card && s.hint);

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
  const arrow = "inline-flex h-7 w-7 items-center justify-center rounded-full text-[#fffaf0] transition-colors hover:bg-[#fffaf0]/20";

  return (
    <div
      className="relative grid h-full"
      aria-roledescription="carousel"
      aria-label="오늘의 브리핑"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setHover(false);
      }}
      onTouchStart={(e) => {
        touch.current = e.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(e) => {
        const start = touch.current;
        touch.current = null;
        const end = e.changedTouches[0]?.clientX;
        if (!many || start == null || end == null || Math.abs(end - start) < 48) return;
        go(end < start ? 1 : -1);
      }}
    >
      {/* 카드는 겹쳐 두고 지금 판만 보이게 (높이는 큰 쪽에 맞춤) */}
      {slides.map((s, i) =>
        s.card ? (
          <div
            key={s.edition}
            role="group"
            aria-roledescription="slide"
            aria-label={EDITION_LABEL[s.edition]}
            aria-hidden={i !== index}
            inert={i !== index}
            className={cn("col-start-1 row-start-1 transition-opacity duration-500", i === index ? "opacity-100" : "pointer-events-none opacity-0")}
          >
            {s.card}
          </div>
        ) : null,
      )}

      {/* 썸네일(카드 위쪽 16:9) 오른쪽 위 구석에 작게 — 썸네일 왼쪽 위 이름표와 겹치지 않게 */}
      <div className="pointer-events-none absolute inset-x-0 top-0 aspect-[16/9]">
        <div className="absolute top-2.5 right-2.5 flex items-center md:top-3.5 md:right-3.5">
          {many ? (
            <div className="pointer-events-auto flex items-center gap-0.5 rounded-full bg-brand-dark/60 p-1 shadow-level-1 backdrop-blur-sm">
              <button type="button" onClick={() => go(-1)} className={arrow} aria-label="이전 판 보기">
                <ChevronLeft className="h-4 w-4" strokeWidth={2.4} />
              </button>
              <div className="flex items-center gap-1 px-1">
                {slides.map((s, i) =>
                  s.card ? (
                    <button
                      key={s.edition}
                      type="button"
                      onClick={() => setIndex(i)}
                      aria-label={`${EDITION_LABEL[s.edition]} 보기`}
                      aria-current={i === index}
                      className={cn("relative h-2 overflow-hidden rounded-full transition-all", i === index ? "w-6 bg-[#fffaf0]/45" : "w-2 bg-[#fffaf0]/75 hover:bg-[#fffaf0]")}
                    >
                      {i === index && (
                        <span
                          key={`${index}-${running}`}
                          aria-hidden
                          className={cn("absolute inset-0 origin-left rounded-full", BAR[s.edition])}
                          style={running ? { animation: `kk-fill ${INTERVAL}ms linear forwards` } : undefined}
                        />
                      )}
                    </button>
                  ) : null,
                )}
              </div>
              <button type="button" onClick={() => go(1)} className={arrow} aria-label="다음 판 보기">
                <ChevronRight className="h-4 w-4" strokeWidth={2.4} />
              </button>
            </div>
          ) : (
            waiting && (
              <span
                className="inline-flex items-center gap-1 rounded-full bg-[#fffaf0]/92 px-2 py-0.5 text-[11px] leading-4 font-semibold whitespace-nowrap text-brand-dark shadow-level-1 backdrop-blur-sm sm:px-2.5 sm:py-1 sm:type-caption"
                title={`${EDITION_LABEL[waiting.edition]} · ${waiting.hint}`}
              >
                <Clock3 className="h-3 w-3 sm:h-3.5 sm:w-3.5" strokeWidth={2.2} />
                <span className="max-sm:hidden">{EDITION_LABEL[waiting.edition]} · </span>
                {waiting.hint}
              </span>
            )
          )}
        </div>
      </div>
    </div>
  );
}
