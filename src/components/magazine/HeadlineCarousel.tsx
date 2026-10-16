"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { NEWS_SECTION_INFO, type NewsSection } from "@/lib/news-meta";
import { cn } from "../ui";
import { NEWS_ICON } from "./news-icons";

export interface HeadlineSlide {
  id: number;
  href: string;
  title: string;
  section: NewsSection;
  headline: boolean;
  imageUrl: string | null;
  imageCredit: string;
}

const INTERVAL = 6000;

/** 움직임 줄이기 설정이면 자동 넘김을 끕니다 */
function useReducedMotion(): boolean {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduce(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return reduce;
}

/** 사진이 없으면 카테고리 색으로 그린 표지 */
function SlideArt({ section }: { section: NewsSection }) {
  const Icon = NEWS_ICON[section];
  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden bg-brand-dark">
      <span className={cn("absolute -top-28 -right-20 h-96 w-96 rounded-full opacity-60 blur-3xl", NEWS_SECTION_INFO[section].dot)} />
      <span className="absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-primary/40 blur-3xl" />
      <span className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.09)_1px,transparent_1px)] bg-[length:18px_18px]" />
      <Icon className="absolute top-1/2 right-6 h-48 w-48 -translate-y-1/2 text-on-primary/10 md:right-12 md:h-64 md:w-64" strokeWidth={1} />
    </div>
  );
}

/** 오늘의 헤드라인 — 사진(또는 표지)과 제목만 크게, 그날 뉴스를 차례로 넘겨 보여 줌 */
export function HeadlineCarousel({ slides }: { slides: HeadlineSlide[] }) {
  const [index, setIndex] = useState(0);
  const [hover, setHover] = useState(false);
  const [stopped, setStopped] = useState(false);
  const reduce = useReducedMotion();
  const many = slides.length > 1;
  const running = many && !hover && !stopped && !reduce;

  useEffect(() => {
    if (!running) return;
    const t = window.setTimeout(() => setIndex((i) => (i + 1) % slides.length), INTERVAL);
    return () => window.clearTimeout(t);
  }, [running, index, slides.length]);

  const go = (d: number) => setIndex((i) => (i + d + slides.length) % slides.length);
  // 휴대폰: 옆으로 밀어서 넘기기
  const touchX = useRef<number | null>(null);
  const swipedAt = useRef(0);
  const btn = "inline-flex h-9 w-9 items-center justify-center rounded-full bg-on-primary/15 text-on-primary backdrop-blur-sm transition-colors hover:bg-on-primary/25";

  return (
    <section
      aria-roledescription="carousel"
      aria-label="오늘의 헤드라인"
      className="relative isolate h-full min-h-[300px] overflow-hidden rounded-2xl bg-brand-dark sm:min-h-[380px] lg:min-h-[440px]"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setHover(false);
      }}
      onTouchStart={(e) => {
        touchX.current = e.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(e) => {
        const start = touchX.current;
        const end = e.changedTouches[0]?.clientX;
        touchX.current = null;
        if (!many || start == null || end == null || Math.abs(end - start) < 40) return;
        swipedAt.current = Date.now();
        go(end < start ? 1 : -1);
      }}
      onClickCapture={(e) => {
        // 밀어서 넘긴 직후의 클릭은 기사 열기로 치지 않음
        if (Date.now() - swipedAt.current < 400) e.preventDefault();
      }}
    >
      {slides.map((s, i) => {
        const on = i === index;
        const info = NEWS_SECTION_INFO[s.section];
        return (
          <Link
            key={s.id}
            href={s.href}
            aria-hidden={!on}
            tabIndex={on ? 0 : -1}
            aria-roledescription="slide"
            aria-label={`${i + 1} / ${slides.length}: ${s.title}`}
            className={cn("group absolute inset-0 transition-opacity duration-700 ease-out", on ? "z-10 opacity-100" : "pointer-events-none z-0 opacity-0")}
          >
            {s.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- 운영자가 올린 사진 (Blob 주소)
              <img
                src={s.imageUrl}
                alt=""
                loading={i === 0 ? "eager" : "lazy"}
                decoding="async"
                className={cn("absolute inset-0 h-full w-full object-cover transition-transform duration-[7000ms] ease-out", on && !reduce && "scale-105")}
              />
            ) : (
              <SlideArt section={s.section} />
            )}
            <span aria-hidden className="absolute inset-0 bg-linear-to-t from-black/85 via-black/30 to-black/15" />

            <span className="absolute inset-x-0 bottom-0 flex flex-col gap-3 p-6 pb-16 md:p-10 md:pb-20">
              <span className="flex flex-wrap items-center gap-2">
                {s.headline && <span className="tag bg-on-primary text-brand-dark">헤드라인</span>}
                <span className="tag bg-on-primary/15 text-on-primary backdrop-blur-sm">{info.label}</span>
              </span>
              <span className="line-clamp-3 max-w-3xl type-heading-lg text-on-primary [word-break:keep-all] [text-shadow:0_1px_12px_rgba(0,0,0,0.35)] group-hover:underline sm:type-display-md lg:type-display-lg">
                {s.title}
              </span>
            </span>
            {s.imageUrl && s.imageCredit && <span className="absolute top-10 right-6 type-micro text-on-primary/75 md:right-10">사진 · {s.imageCredit}</span>}
          </Link>
        );
      })}

      {many && (
        <>
          {/* 진행 막대 — 지금 기사가 다 차면 다음 기사로 */}
          <div className="absolute inset-x-6 top-5 z-20 flex gap-1.5 md:inset-x-10" aria-hidden>
            {slides.map((s, i) => (
              <span key={s.id} className="h-[3px] flex-1 overflow-hidden rounded-full bg-on-primary/25">
                {i < index && <span className="block h-full w-full bg-on-primary" />}
                {i === index && (
                  <span
                    key={`${index}-${running}`}
                    className="block h-full w-full origin-left bg-on-primary"
                    style={running ? { animation: `kk-fill ${INTERVAL}ms linear forwards` } : { transform: "scaleX(1)" }}
                  />
                )}
              </span>
            ))}
          </div>

          <div className="absolute right-6 bottom-5 z-20 flex items-center gap-2 md:right-10 md:bottom-7">
            <span className="mr-1 tabular type-caption text-on-primary/80" aria-live="polite">
              {index + 1} / {slides.length}
            </span>
            <button type="button" onClick={() => setStopped((v) => !v)} className={btn} aria-label={stopped ? "자동 넘김 켜기" : "자동 넘김 멈추기"}>
              {stopped ? <Play className="h-4 w-4" strokeWidth={2} /> : <Pause className="h-4 w-4" strokeWidth={2} />}
            </button>
            <button type="button" onClick={() => go(-1)} className={btn} aria-label="이전 기사">
              <ChevronLeft className="h-4 w-4" strokeWidth={2} />
            </button>
            <button type="button" onClick={() => go(1)} className={btn} aria-label="다음 기사">
              <ChevronRight className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>
        </>
      )}
    </section>
  );
}
