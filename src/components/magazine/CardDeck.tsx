"use client";

import { Children, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { NEWS_SECTION_INFO, type NewsSection } from "@/lib/news-meta";
import { cn } from "../ui";
import { NEWS_ICON } from "./news-icons";

/* 끝 장까지 넘겨 본 기사 — 시간표에 '다 봤어요' 표시 (이 화면을 보는 동안만 기억) */
const EMPTY: ReadonlySet<number> = new Set();
let seen: ReadonlySet<number> = EMPTY;
const listeners = new Set<() => void>();
function markSeen(id: number) {
  if (seen.has(id)) return;
  seen = new Set([...seen, id]);
  listeners.forEach((l) => l());
}
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};
const useSeen = () =>
  useSyncExternalStore(
    subscribe,
    () => seen,
    () => EMPTY,
  );

/**
 * 카드뉴스 한 묶음 — 옆으로 밀거나 화살표·막대를 눌러 한 장씩 넘겨요.
 * 카드는 서버에서 그린 것을 children 으로 받고, 여기서는 넘기기·몇 번째 장인지만 다뤄요.
 * 카드 높이는 한 묶음 안에서 가장 긴 장에 맞춰 같아요 (휴대폰은 정사각형, 넓은 화면은 4:3 이 최소 — 글이 길면 그만큼 늘어나요).
 */
export function CardDeck({ id, label, head, foot, children }: { id: number; label: string; head: ReactNode; foot?: ReactNode; children: ReactNode }) {
  const slides = Children.toArray(children);
  const total = slides.length;
  const ref = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const items = el.children;
      if (items.length < 2) return;
      const first = (items[0] as HTMLElement).offsetLeft;
      const step = (items[1] as HTMLElement).offsetLeft - first || el.clientWidth;
      // 마지막 장은 폭이 좁아 왼쪽 끝까지 못 오니, 끝까지 밀었으면 마지막 장
      const end = el.scrollLeft >= el.scrollWidth - el.clientWidth - 4;
      const i = end ? items.length - 1 : Math.min(items.length - 1, Math.max(0, Math.round(el.scrollLeft / step)));
      setIndex(i);
      if (i === items.length - 1) markSeen(id);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [id]);

  const go = (i: number) => {
    const el = ref.current;
    if (!el) return;
    const items = el.children;
    const target = items[Math.max(0, Math.min(items.length - 1, i))] as HTMLElement | undefined;
    if (!target) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({ left: target.offsetLeft - (items[0] as HTMLElement).offsetLeft, behavior: reduce ? "auto" : "smooth" });
  };

  const arrow =
    "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-brand-dark bg-canvas text-brand-dark transition-colors hover:bg-brand-dark hover:text-on-primary disabled:pointer-events-none disabled:border-brand-dark/15 disabled:text-brand-dark/25";

  return (
    <section aria-roledescription="carousel" aria-label={label}>
      <div className="flex items-center gap-2">
        {head}
        <span className="ml-auto shrink-0 tabular type-caption font-semibold text-ink-mute">
          <span className="text-ink">{index + 1}</span> / {total}
        </span>
      </div>

      {/* 몇 번째 장인지 — 누르면 그 장으로 */}
      <div className="mt-2 flex gap-1">
        {slides.map((_, i) => (
          <button key={i} type="button" onClick={() => go(i)} aria-label={`${i + 1}번째 카드`} aria-current={i === index ? "true" : undefined} className="flex-1 py-1.5">
            <span className={cn("block h-1 rounded-full transition-colors", i <= index ? "bg-brand-dark" : "bg-brand-dark/15")} />
          </button>
        ))}
      </div>

      <div
        ref={ref}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
            e.preventDefault();
            go(index + (e.key === "ArrowRight" ? 1 : -1));
          }
        }}
        className="relative -mx-3 mt-1 flex snap-x snap-mandatory scroll-px-3 gap-3 overflow-x-auto px-3 pb-1 no-scrollbar focus-visible:outline-offset-0 sm:mx-0 sm:scroll-px-0 sm:px-0"
      >
        {slides.map((s, i) => (
          <div key={i} role="group" aria-roledescription="slide" aria-label={`${i + 1} / ${total}`} className="flex aspect-square w-[86%] shrink-0 snap-start flex-col *:flex-1 sm:w-[78%] md:aspect-[4/3] md:w-[74%]">
            {s}
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <div className="min-w-0 flex-1">{foot}</div>
        <button type="button" onClick={() => go(index - 1)} disabled={index === 0} aria-label="이전 카드" className={arrow}>
          <ChevronLeft className="h-5 w-5" strokeWidth={2.2} />
        </button>
        <button type="button" onClick={() => go(index + 1)} disabled={index === total - 1} aria-label="다음 카드" className={arrow}>
          <ChevronRight className="h-5 w-5" strokeWidth={2.2} />
        </button>
      </div>
    </section>
  );
}

export interface TimetableItem {
  id: number;
  section: NewsSection;
  title: string;
  headline: boolean;
  /** 카드 장 수 */
  slides: number;
}

/**
 * 오늘의 시간표 — 기사마다 작은 표지 카드를 옆으로 늘어놓아요. 누르면 그 기사 카드뉴스로,
 * 끝 장까지 넘겨 본 기사는 '다 봤어요'로 바뀌어요 (읽은 정도 표시를 겸해요).
 */
export function Timetable({ items, meta }: { items: TimetableItem[]; meta: string }) {
  const done = useSeen();
  const count = items.filter((it) => done.has(it.id)).length;
  return (
    <section aria-labelledby="timetable-title">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
        <h3 id="timetable-title" className="type-heading-sm text-ink">
          오늘의 시간표
        </h3>
        <p className="tabular type-caption text-ink-mute" aria-live="polite">
          {count > 0 ? `다 본 기사 ${count} / ${items.length}` : meta}
        </p>
      </div>
      <ol className="-mx-3 mt-3 flex snap-x scroll-px-3 gap-2.5 overflow-x-auto px-3 pb-1 no-scrollbar sm:mx-0 sm:grid sm:grid-cols-[repeat(auto-fit,minmax(128px,1fr))] sm:overflow-visible sm:px-0">
        {items.map((it, i) => {
          const Icon = NEWS_ICON[it.section];
          const info = NEWS_SECTION_INFO[it.section];
          const read = done.has(it.id);
          return (
            <li key={it.id} className="w-[136px] shrink-0 snap-start sm:w-auto">
              <a
                href={`#item-${it.id}`}
                className="group relative flex h-full min-h-[156px] flex-col overflow-hidden rounded-2xl bg-brand-dark p-3 text-on-primary transition-transform hover:-translate-y-0.5"
              >
                <span aria-hidden className={cn("absolute -top-10 -right-10 h-28 w-28 rounded-full opacity-70 blur-2xl", info.dot)} />
                <Icon aria-hidden className="absolute right-2 bottom-2 h-11 w-11 text-on-primary/15" strokeWidth={1.5} />
                <span className="relative flex items-center justify-between">
                  <span className="tabular text-[22px] leading-none font-bold">{String(i + 1).padStart(2, "0")}</span>
                  {read && (
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#8fd6a8] text-brand-dark">
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                  )}
                </span>
                <span className="relative mt-2 type-micro font-semibold text-on-primary/70">
                  {info.label}
                  {it.headline && " · 헤드라인"}
                </span>
                <span className="relative mt-1 line-clamp-3 type-caption leading-snug font-semibold [word-break:keep-all] group-hover:underline">{it.title}</span>
                <span className="relative mt-auto pt-2 type-micro text-on-primary/65">{read ? "다 봤어요" : `카드 ${it.slides}장`}</span>
              </a>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
