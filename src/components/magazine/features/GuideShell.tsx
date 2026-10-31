"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowRight, Check, ChevronLeft, ChevronRight, MousePointerClick, RotateCcw } from "lucide-react";
import { cn } from "../../ui";
import { KongMascot } from "../KongMascot";

/**
 * 장 단위 인터랙티브 가이드의 틀 — 표지 · 장 목차 탭 · 진행 막대 · 좌우 화살표 · 장 끝 '다음 장' 버튼
 * (금공 필기 입문 · 산은 필기 가이드가 같이 써요)
 */

export const anim = "transition-all duration-300 ease-out motion-reduce:transition-none";

/** 다른 장으로 가기 — 표지·본문 속 '몇 장 보기' 버튼이 써요 (가이드 밖에선 아무 일도 안 해요) */
const GoContext = createContext<(i: number) => void>(() => {});
export const useGuideGo = () => useContext(GoContext);

/** 눌러 보라는 작은 안내 */
export function TryHint({ children }: { children: ReactNode }) {
  return (
    <p className="inline-flex items-center gap-1.5 rounded-full bg-canvas px-3 py-1 type-caption font-semibold text-primary-text shadow-level-1">
      <MousePointerClick className="h-3.5 w-3.5" strokeWidth={2} />
      {children}
    </p>
  );
}

export type Look = "pencil" | "book" | "suit" | "sweat";

const LOOKS: Record<Look, Parameters<typeof KongMascot>[0]> = {
  pencil: { hold: "pencil", glasses: true },
  book: { hold: "book", glasses: true },
  suit: { suit: true, wave: true },
  sweat: { hold: "pencil", sweat: true },
};

/** 콩이 한마디 */
export function KongSays({ children, look = "pencil" }: { children: ReactNode; look?: Look }) {
  return (
    <div className="flex items-end gap-2">
      <KongMascot className="h-12 w-12 shrink-0" {...LOOKS[look]} />
      <p className="relative rounded-2xl rounded-bl-sm border-2 border-brand-dark bg-canvas px-3.5 py-2 type-body-md font-semibold text-ink [word-break:keep-all]">{children}</p>
    </div>
  );
}

/** 설명 칸 (선택한 것) */
export function Explain({ eyebrow, title, children }: { eyebrow?: ReactNode; title: ReactNode; children: ReactNode }) {
  return (
    <div className="rounded-2xl bg-canvas px-5 py-5 shadow-level-1" aria-live="polite">
      {eyebrow && <p className="type-micro-cap text-primary-text">{eyebrow}</p>}
      <p className={cn("type-heading-md text-ink [word-break:keep-all]", eyebrow ? "mt-1" : null)}>{title}</p>
      <div className="mt-2 type-body-lg leading-relaxed text-ink-secondary ko-justify">{children}</div>
    </div>
  );
}

export interface GuideChapter {
  short: string;
  title: string;
  lead?: string;
  /** 장 머리(서브헤드 아래) 콩이 한마디 — 없으면 안 보임 */
  kong?: string;
  look?: Look;
  bg: string;
  body: ReactNode;
}

/** 넓은 화면: 본문 양옆 여백의 큰 동그란 화살표 (다음 = 진한 색, 이전 = 흰색) */
function SideArrow({ dir, disabled, onClick, label, nudge }: { dir: "prev" | "next"; disabled: boolean; onClick: () => void; label: string; nudge?: boolean }) {
  const Icon = dir === "prev" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="group pointer-events-auto flex flex-col items-center gap-1.5 disabled:invisible"
    >
      <span
        className={cn(
          "inline-flex h-16 w-16 items-center justify-center rounded-full shadow-level-3 transition-all group-hover:scale-105 group-active:scale-95",
          dir === "next" ? "bg-brand-dark text-on-primary" : "border-2 border-brand-dark/25 bg-canvas text-brand-dark group-hover:border-brand-dark",
        )}
      >
        <Icon className={cn("h-8 w-8", nudge && "motion-safe:animate-[kk-nudge-x_1.4s_ease-in-out_infinite]")} strokeWidth={2.4} />
      </span>
      <span className="rounded-full bg-canvas/90 px-2 py-0.5 type-caption font-semibold text-brand-dark shadow-level-1">{dir === "prev" ? "이전 장" : "다음 장"}</span>
    </button>
  );
}

/**
 * 장 끝 넘기기 — 휴대폰에선 화면 아래(탭 바 위)에 붙어 따라오고, 넓은 화면에선 장 끝에 큰 버튼으로.
 * 다음 장 이름까지 보여 줘서 '넘길 수 있다'는 걸 바로 알게 해요.
 */
function ChapterNav({ chapters, ch, go, nudge }: { chapters: GuideChapter[]; ch: number; go: (i: number) => void; nudge: boolean }) {
  const next = chapters[ch + 1];
  return (
    <nav aria-label="장 넘기기" className="z-20 max-md:sticky max-md:bottom-[calc(3.5rem+env(safe-area-inset-bottom))]">
      <div className="max-md:border-t max-md:border-brand-dark/10 max-md:bg-canvas/92 max-md:backdrop-blur">
        <div className="mx-auto flex max-w-[1040px] items-stretch gap-2 px-4 py-2.5 sm:px-6 md:px-20 md:pt-2 md:pb-12">
          <button
            type="button"
            onClick={() => go(ch - 1)}
            disabled={ch === 0}
            aria-label={ch > 0 ? `이전 장 · ${chapters[ch - 1].short}` : "이전 장 없음"}
            className="inline-flex h-13 w-13 shrink-0 items-center justify-center gap-1 rounded-xl border-2 border-brand-dark/20 bg-canvas text-brand-dark transition-colors hover:border-brand-dark disabled:opacity-35 md:h-16 md:w-auto md:px-5"
          >
            <ChevronLeft className="h-6 w-6" strokeWidth={2.4} />
            <span className="hidden type-body-md font-semibold md:inline">이전 장</span>
          </button>
          {next ? (
            <button
              type="button"
              onClick={() => go(ch + 1)}
              className="group flex h-13 min-w-0 flex-1 items-center justify-between gap-3 rounded-xl bg-brand-dark pr-1.5 pl-4 text-left text-on-primary shadow-level-2 transition-transform active:scale-[0.99] md:h-16 md:pr-2 md:pl-6"
            >
              <span className="min-w-0">
                <span className="block type-caption leading-4 text-on-primary/70 tabular">
                  다음 장 · {ch + 2}/{chapters.length}
                </span>
                <span className="block truncate type-body-md font-bold md:type-heading-sm">{next.short}</span>
              </span>
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-on-primary text-brand-dark md:h-12 md:w-12">
                <ArrowRight className={cn("h-5 w-5 md:h-6 md:w-6", nudge && "motion-safe:animate-[kk-nudge-x_1.4s_ease-in-out_infinite]")} strokeWidth={2.4} />
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => go(0)}
              className="flex h-13 min-w-0 flex-1 items-center justify-center gap-2 rounded-xl border-2 border-brand-dark/20 bg-canvas type-body-md font-semibold text-brand-dark transition-colors hover:border-brand-dark md:h-16"
            >
              <RotateCcw className="h-4 w-4" strokeWidth={2.2} />
              처음부터 다시 보기
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}

export function GuideShell({
  chapters,
  eyebrow,
  heading,
  sub,
  mascot,
  srTitle,
  tabsLabel,
  cover,
  coverClass = "from-[#ece9ff]",
}: {
  chapters: GuideChapter[];
  eyebrow: string;
  heading: string;
  sub: string;
  /** 표지 콩이 */
  mascot: ReactNode;
  /** 표지 제목과 글 제목이 다를 때 화면 밖 제목으로 */
  srTitle?: string;
  tabsLabel: string;
  /** 표지 아래쪽에 덧붙일 것 */
  cover?: ReactNode;
  /** 표지 위쪽 바탕색 (그라데이션 시작) */
  coverClass?: string;
}) {
  const [ch, setCh] = useState(0);
  // 한 번이라도 넘겨 봤으면 '넘겨 보세요' 흔들림을 멈춰요
  const [moved, setMoved] = useState(false);
  const top = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLElement>(null);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  // 휴대폰에서 지금 장 탭이 목차 줄 밖에 있으면 보이게 옆으로 밀기
  useEffect(() => {
    const t = tabs.current[ch];
    const bar = t?.parentElement;
    if (!t || !bar) return;
    bar.scrollTo({ left: t.offsetLeft - bar.clientWidth / 2 + t.clientWidth / 2, behavior: "smooth" });
  }, [ch]);
  const go = useCallback(
    (i: number) => {
      if (i < 0 || i >= chapters.length) return;
      setCh(i);
      setMoved(true);
      // 장을 바꾸면 새 장 머리가 목차 줄 바로 아래에 오게
      const bar = top.current?.getBoundingClientRect().bottom ?? 0;
      const p = panel.current?.getBoundingClientRect().top ?? 0;
      if (p < bar) window.scrollTo({ top: window.scrollY + p - bar, behavior: "smooth" });
    },
    [chapters.length],
  );
  // 키보드 ← → 로도 넘기기 (입력 칸·슬라이더에 있을 땐 제외)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      const el = e.target as HTMLElement | null;
      if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))) return;
      go(ch + (e.key === "ArrowRight" ? 1 : -1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ch, go]);
  const c = chapters[ch];
  const prevLabel = ch > 0 ? `이전 장 · ${chapters[ch - 1].short}` : "이전 장 없음";
  const nextLabel = ch < chapters.length - 1 ? `다음 장 · ${chapters[ch + 1].short}` : "마지막 장";

  return (
    <GoContext.Provider value={go}>
      <div id="article-body" className="theme-light bg-canvas text-ink">
        {/* 표지 */}
        <section className={cn("relative overflow-hidden bg-linear-to-b to-canvas", coverClass)}>
          <span aria-hidden className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[#ffd9ae]/60 blur-3xl" />
          <span aria-hidden className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-[#bfe9cf]/60 blur-3xl" />
          <div className="relative mx-auto flex max-w-[960px] flex-col items-center gap-6 px-5 pt-10 pb-8 text-center md:flex-row md:gap-10 md:px-8 md:pt-14 md:text-left">
            {mascot}
            <div>
              <p className="type-micro-cap text-primary-text">{eyebrow}</p>
              <h1 className="mt-2 type-heading-lg font-bold text-ink [word-break:keep-all] md:type-display-md">{heading}</h1>
              <p className="mt-2 type-body-lg text-ink-secondary [word-break:keep-all]">{sub}</p>
            </div>
          </div>
          {cover && <div className="relative mx-auto max-w-[960px] px-5 pb-8 md:px-8">{cover}</div>}
          {srTitle && <h2 className="sr-only">{srTitle}</h2>}
        </section>

        {/* 장 고르기 */}
        <div ref={top} className="sticky top-[61px] z-20 border-y border-hairline bg-canvas/95 backdrop-blur md:top-[65px]">
          <div className="mx-auto max-w-[960px] px-3 md:px-8">
            <div role="tablist" aria-label={tabsLabel} className="no-scrollbar flex gap-1.5 overflow-x-auto py-2.5">
              {chapters.map((x, i) => (
                <button
                  key={x.short}
                  ref={(el) => {
                    tabs.current[i] = el;
                  }}
                  type="button"
                  role="tab"
                  aria-selected={ch === i}
                  onClick={() => go(i)}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 type-caption font-semibold whitespace-nowrap",
                    anim,
                    ch === i ? "bg-brand-dark text-on-primary" : i < ch ? "bg-ev-written-soft text-primary-text" : "text-ink-secondary hover:bg-canvas-soft",
                  )}
                >
                  <span className={cn("inline-flex h-5 w-5 items-center justify-center rounded-full tabular text-[11px]", ch === i ? "bg-on-primary text-brand-dark" : i < ch ? "bg-primary text-on-primary" : "bg-canvas-soft")}>
                    {i < ch ? <Check className="h-3 w-3" strokeWidth={3} /> : i + 1}
                  </span>
                  {x.short}
                </button>
              ))}
            </div>
            <div aria-hidden className="h-1 overflow-hidden rounded-full bg-canvas-soft">
              <div className={cn("h-full rounded-full bg-primary", anim)} style={{ width: `${((ch + 1) / chapters.length) * 100}%` }} />
            </div>
          </div>
        </div>

        {/* 지금 장 */}
        <section ref={panel} role="tabpanel" aria-label={c.title} className={cn("relative min-h-[70svh]", c.bg)}>
          <div className="relative">
            {/* 넓은 화면: 본문 양옆 큰 화살표 — 화면 세로 가운데에 붙어 따라오다 장 끝 버튼 위에서 멈춰요 */}
            <div className="pointer-events-none absolute inset-0 z-10 hidden md:block">
              <div className="sticky top-[calc(50svh-2.5rem)] mx-auto flex max-w-[1040px] justify-between px-2">
                <SideArrow dir="prev" disabled={ch === 0} onClick={() => go(ch - 1)} label={prevLabel} />
                <SideArrow dir="next" disabled={ch === chapters.length - 1} onClick={() => go(ch + 1)} label={nextLabel} nudge={!moved} />
              </div>
            </div>

            <div key={ch} className="mx-auto max-w-[1040px] px-5 pt-8 pb-6 motion-safe:animate-[kk-fade-in_.35s_ease-out] sm:px-6 md:px-24 md:pt-12">
              <ChapterContent chapters={chapters} i={ch} />
            </div>
          </div>

          <ChapterNav chapters={chapters} ch={ch} go={go} nudge={!moved} />
        </section>

        {/* 검색엔진용 — 지금 장이 아닌 장의 글도 HTML 에 (화면에는 안 보이고, 장을 고르면 위에서 새로 열려요) */}
        {chapters.map((x, i) =>
          i === ch ? null : (
            <section key={x.short} hidden>
              <ChapterContent chapters={chapters} i={i} />
            </section>
          ),
        )}
      </div>
    </GoContext.Provider>
  );
}

/** 한 장의 머리(번호·제목·서브헤드·콩이)와 본문 */
function ChapterContent({ chapters, i }: { chapters: GuideChapter[]; i: number }) {
  const c = chapters[i];
  return (
    <>
      <p className="type-micro-cap text-primary-text">
        {String(i + 1).padStart(2, "0")} · {c.short}
        <span className="ml-2 tabular text-ink-mute">
          {i + 1}/{chapters.length}
        </span>
      </p>
      <h2 className="mt-1 type-heading-lg font-bold text-ink [word-break:keep-all] md:type-display-md">{c.title}</h2>
      {c.lead && <p className="mt-2 type-body-lg text-ink-secondary [word-break:keep-all]">{c.lead}</p>}
      {c.kong && (
        <div className="mt-5">
          <KongSays look={c.look}>{c.kong}</KongSays>
        </div>
      )}
      <div className="mt-7">{c.body}</div>
    </>
  );
}
