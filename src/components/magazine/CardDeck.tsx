"use client";

import { Children, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { NEWS_SECTION_INFO, type NewsSection } from "@/lib/news-meta";
import { cn } from "../ui";

/* 끝 장까지 넘겨 본 기사 — 시간표에 체크 표시 (이 화면을 보는 동안만 기억) */
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
 * 카드는 카드뉴스처럼 4:5 — 한 묶음 안에서 가장 긴 장에 맞춰 높이가 같아요 (글이 길면 그만큼 늘어나요). 넓은 화면은 여러 장이 나란히 보여요.
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
      {head}

      {/* 몇 번째 장인지 — 누르면 그 장으로 */}
      <div className="mt-3 flex items-center gap-2">
        <div className="flex flex-1 gap-1">
          {slides.map((_, i) => (
            <button key={i} type="button" onClick={() => go(i)} aria-label={`${i + 1}번째 카드`} aria-current={i === index ? "true" : undefined} className="flex-1 py-1.5">
              <span className={cn("block h-1 rounded-full transition-colors", i <= index ? "bg-brand-dark" : "bg-brand-dark/15")} />
            </button>
          ))}
        </div>
        <span className="shrink-0 tabular type-caption font-semibold text-ink-mute">
          <span className="text-ink">{index + 1}</span> / {total}
        </span>
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
          <div key={i} role="group" aria-roledescription="slide" aria-label={`${i + 1} / ${total}`} className="flex aspect-[4/5] w-[84%] shrink-0 snap-start flex-col *:flex-1 sm:w-[330px] md:w-[350px]">
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
  /** 한 줄 제목 (예: 경상흑자, 독·일 합계 첫 추월) */
  label: string;
  section: NewsSection;
  headline: boolean;
}

/**
 * 오늘의 시간표 — 처음에는 기사 목록(번호·분야·한 줄 제목)으로 보여 주고, 목록이 화면 위로 지나가면
 * 머리줄 아래에 붙는 한 줄 칩으로 접혀요. 칩은 지금 읽는 기사(진하게)·끝까지 넘겨 본 기사(체크)를 보여 주고, 누르면 그 기사로 가요.
 */
export function Timetable({ items }: { items: TimetableItem[] }) {
  const done = useSeen();
  const [active, setActive] = useState<number | null>(null);
  const [folded, setFolded] = useState(false);
  const listRef = useRef<HTMLElement>(null);
  const chips = useRef<HTMLOListElement>(null);
  const ids = items.map((it) => it.id).join(",");

  // 화면 가운데쯤을 지나는 기사 = 지금 읽는 기사 (기사 밖이면 없음)
  useEffect(() => {
    const order = ids.split(",").map(Number);
    const crossing = new Set<number>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const id = Number(e.target.id.slice(5));
          if (e.isIntersecting) crossing.add(id);
          else crossing.delete(id);
        }
        setActive(order.find((id) => crossing.has(id)) ?? null);
      },
      { rootMargin: "-35% 0px -60% 0px" },
    );
    order.forEach((id) => {
      const el = document.getElementById(`item-${id}`);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, [ids]);

  // 목록이 머리줄 위로 지나가면 한 줄 칩으로 접기
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setFolded(!e.isIntersecting && e.boundingClientRect.top < 80), { rootMargin: "-66px 0px 0px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // 지금 칩이 줄 밖이면 옆으로 밀어 보여 주기
  useEffect(() => {
    const ol = chips.current;
    const chip = ol?.querySelector<HTMLElement>('[aria-current="true"]');
    if (!ol || !chip) return;
    if (chip.offsetLeft < ol.scrollLeft || chip.offsetLeft + chip.offsetWidth > ol.scrollLeft + ol.clientWidth) ol.scrollTo({ left: chip.offsetLeft - 8, behavior: "smooth" });
  }, [active]);

  const count = items.filter((it) => done.has(it.id)).length;
  const no = (i: number) => String(i + 1).padStart(2, "0");
  return (
    <>
      {/* 접힌 한 줄 — 높이 0 칸에 붙여 두고, 목록이 지나간 뒤에만 보여요 */}
      <div className="sticky top-[61px] z-20 h-0 md:top-[65px]">
        <nav
          aria-label="오늘의 시간표 (한 줄)"
          inert={!folded}
          className={cn(
            "-mx-3 border-b border-brand-dark/10 bg-canvas-cream/95 px-3 py-2 backdrop-blur transition-opacity duration-200 sm:-mx-4 sm:px-4 md:-mx-7 md:px-7",
            folded ? "opacity-100" : "pointer-events-none opacity-0",
          )}
        >
          <div className="flex items-center gap-2.5">
            <p className="shrink-0 text-[12px] leading-tight font-bold text-ink">
              오늘의
              <br />
              시간표
            </p>
            <ol ref={chips} className="relative flex min-w-0 flex-1 gap-1.5 overflow-x-auto py-0.5 no-scrollbar">
              {items.map((it, i) => {
                const now = active === it.id;
                const read = done.has(it.id);
                return (
                  <li key={it.id} className="shrink-0">
                    <a
                      href={`#item-${it.id}`}
                      aria-current={now ? "true" : undefined}
                      className={cn(
                        "inline-flex h-8 max-w-[13em] items-center gap-1.5 rounded-full pr-3 pl-1 text-[13px] font-semibold whitespace-nowrap transition-colors",
                        now ? "bg-brand-dark text-on-primary" : read ? "bg-[#d9f2e2] text-[#24683f]" : "bg-canvas text-ink ring-1 ring-hairline hover:ring-hairline-input",
                      )}
                    >
                      <span
                        className={cn(
                          "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full tabular text-[11px] font-bold",
                          now ? "bg-on-primary/20" : read ? "bg-[#8fd6a8] text-brand-dark" : "bg-canvas-soft text-ink-secondary",
                        )}
                      >
                        {read && !now ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : no(i)}
                      </span>
                      <span className="truncate">{it.label}</span>
                    </a>
                  </li>
                );
              })}
            </ol>
            <span className="shrink-0 tabular text-[12px] font-semibold text-ink-mute" title="끝까지 넘겨 본 기사">
              {count}/{items.length}
            </span>
          </div>
        </nav>
      </div>

      {/* 펼친 목록 — 오늘 무슨 기사가 있는지 한눈에 */}
      <section ref={listRef} aria-labelledby="timetable-title" className="rounded-2xl bg-canvas px-4 pt-3.5 pb-1.5 shadow-[0_1px_0_0_var(--color-hairline)] ring-1 ring-brand-dark/5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
          <h3 id="timetable-title" className="type-heading-sm text-ink">
            오늘의 시간표
          </h3>
          <p className="tabular type-caption text-ink-mute" aria-live="polite">
            {count > 0 ? `다 본 기사 ${count} / ${items.length}` : `기사 ${items.length}건 · 누르면 그 기사로 가요`}
          </p>
        </div>
        <ol className="mt-1.5 divide-y divide-hairline">
          {items.map((it, i) => {
            const info = NEWS_SECTION_INFO[it.section];
            const read = done.has(it.id);
            return (
              <li key={it.id}>
                <a href={`#item-${it.id}`} className="group flex items-center gap-2.5 py-2.5">
                  <span
                    className={cn(
                      "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full tabular text-[12px] font-bold",
                      it.headline ? "bg-brand-dark text-on-primary" : "border-2 border-brand-dark text-brand-dark",
                    )}
                  >
                    {no(i)}
                  </span>
                  <span className={cn("tag shrink-0", info.tone)}>{info.label}</span>
                  <span className="min-w-0 flex-1 text-[15px] leading-snug font-semibold text-ink [word-break:keep-all] group-hover:underline">{it.label}</span>
                  {read ? (
                    <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#8fd6a8] text-brand-dark" title="다 봤어요">
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                  ) : (
                    <ChevronRight className="h-4 w-4 shrink-0 text-ink-mute" strokeWidth={2.2} />
                  )}
                </a>
              </li>
            );
          })}
        </ol>
      </section>
    </>
  );
}
