"use client";

import { useEffect, useId, useRef, useState } from "react";
import { List, Play, X } from "lucide-react";
import { mmss, type WeeklyTocGroup } from "@/lib/weekly";
import { cn } from "../ui";

/**
 * 주간 정리의 움직이는 부분 — 영상 칸, '이 장면부터' 단추, 떠 있는 목차.
 * 시각 단추를 누르면 위 영상이 그 장면부터 재생돼요 (유튜브로 나가지 않고 이 쪽 안에서).
 */

const SEEK = "kumkong:weekly-seek";
const smooth = () => (window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth");

/** 영상 칸 — 영상이 아직 없으면 썸네일 + '곧 공개' */
export function WeeklyPlayer({ video, poster, title }: { video: string | null; poster: string; title: string }) {
  const [seek, setSeek] = useState<{ t: number; n: number } | null>(null);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!video) return;
    const on = (e: Event) => {
      const t = Math.max(0, Math.floor((e as CustomEvent<number>).detail || 0));
      setSeek((p) => ({ t, n: (p?.n ?? 0) + 1 }));
      box.current?.scrollIntoView({ behavior: smooth(), block: "center" });
    };
    window.addEventListener(SEEK, on);
    return () => window.removeEventListener(SEEK, on);
  }, [video]);

  return (
    <div ref={box} className="relative aspect-video scroll-mt-24 overflow-hidden rounded-2xl bg-[#11183a]">
      {video ? (
        <iframe
          // 시각을 고를 때마다 새로 열어 그 장면부터 재생 (같은 시각을 다시 눌러도)
          key={seek?.n ?? 0}
          src={`https://www.youtube-nocookie.com/embed/${video}?rel=0&playsinline=1${seek ? `&start=${seek.t}&autoplay=1` : ""}`}
          title={title}
          loading={seek ? "eager" : "lazy"}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      ) : (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element -- 영상 썸네일 */}
          <img src={poster} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <span className="absolute right-3 bottom-3 inline-flex items-center gap-1.5 rounded-full bg-[#11183a]/85 px-3 py-1.5 type-caption font-bold text-[#ffffff]">
            <Play className="h-3.5 w-3.5 fill-current" strokeWidth={0} />
            영상 곧 공개
          </span>
        </>
      )}
    </div>
  );
}

/** '이 장면부터' — 영상이 있으면 누를 수 있는 빨간 시각, 없으면 흐린 시각 */
export function SeekButton({ at, video, look = "time" }: { at: number; video: string | null; look?: "time" | "pill" }) {
  const label = look === "pill" ? `영상 ${mmss(at)}` : mmss(at);
  if (!video) {
    return (
      <span className={cn("inline-flex items-center gap-1 tabular type-caption font-bold text-ink-mute-2", look === "pill" && "rounded-full bg-canvas-soft px-2.5 py-1")}>
        {look === "pill" && <Play className="h-3 w-3 fill-current" strokeWidth={0} />}
        {label}
      </span>
    );
  }
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new CustomEvent(SEEK, { detail: at }))}
      aria-label={`영상 ${mmss(at)} 장면부터 보기`}
      className={cn(
        "inline-flex items-center gap-1 tabular type-caption font-bold text-[#b3261e] transition-colors",
        look === "pill" ? "rounded-full bg-[#ffe4e4] px-2.5 py-1 hover:bg-[#ffd3d3]" : "rounded-md px-1 py-0.5 hover:bg-[#ffe4e4]",
      )}
    >
      <Play className="h-3 w-3 fill-current" strokeWidth={0} />
      {label}
    </button>
  );
}

/**
 * 떠 있는 목차 — 위 목차 상자를 지나 내려가면 아래에 '목차 · 지금 읽는 곳' 단추가 떠요.
 * 누르면 질문 목록이 열리고, 고르면 그 장으로 가요. 글 끝에 닿으면 사라져요.
 */
export function WeeklyTocFloat({ groups, anchorId, endId }: { groups: WeeklyTocGroup[]; anchorId: string; endId: string }) {
  const [show, setShow] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const panelId = useId();
  const items = groups.flatMap((g) => g.items);

  useEffect(() => {
    const ids = groups.flatMap((g) => g.items.map((it) => it.id));
    let frame = 0;
    const update = () => {
      frame = 0;
      const anchor = document.getElementById(anchorId)?.getBoundingClientRect();
      const end = document.getElementById(endId)?.getBoundingClientRect();
      setShow(!!anchor && anchor.bottom < 0 && (!end || end.top > window.innerHeight * 0.5));
      // 화면 위쪽(머리글 아래)을 지난 마지막 장 = 지금 읽는 곳
      let current: string | null = null;
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= 160) current = id;
      }
      setActive(current);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [groups, anchorId, endId]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!show && !open) return null;
  const now = items.find((it) => it.id === active);

  return (
    <>
      {open && <button type="button" aria-label="목차 닫기" onClick={() => setOpen(false)} className="fixed inset-0 z-40 bg-[#11183a]/30" />}
      {open && (
        <div
          id={panelId}
          role="dialog"
          aria-label="목차"
          className="fixed inset-x-3 bottom-[calc(7.5rem+env(safe-area-inset-bottom))] z-50 max-h-[65vh] overflow-y-auto rounded-3xl bg-canvas p-4 shadow-level-2 md:inset-x-auto md:bottom-20 md:left-1/2 md:w-[440px] md:-translate-x-1/2"
        >
          <div className="flex items-center justify-between">
            <p className="type-heading-sm text-ink">어디로 갈까요?</p>
            <button type="button" onClick={() => setOpen(false)} className="btn btn-icon btn-toggle" aria-label="목차 닫기">
              <X className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>
          {groups.map((g) => (
            <div key={g.key} className="mt-3">
              <p className="type-micro-cap text-ink-mute">{g.title}</p>
              <ul className="mt-1">
                {g.items.map((it) => (
                  <li key={it.id}>
                    <a
                      href={`#${it.id}`}
                      onClick={() => setOpen(false)}
                      aria-current={it.id === active ? "location" : undefined}
                      className={cn(
                        "flex items-baseline gap-2 rounded-xl px-2.5 py-2 type-body-md [word-break:keep-all]",
                        it.id === active ? "bg-[#eef1fd] font-semibold text-[#1f2a5c]" : "text-ink hover:bg-canvas-soft",
                      )}
                    >
                      <span className="w-10 shrink-0 tabular type-caption text-ink-mute">{it.onlyText ? "글" : it.at != null ? mmss(it.at) : ""}</span>
                      <span className="min-w-0">{it.ask}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-[calc(4.25rem+env(safe-area-inset-bottom))] left-1/2 z-50 flex max-w-[calc(100vw-24px)] -translate-x-1/2 items-center gap-2 rounded-full bg-[#1f2a5c] py-2.5 pr-4 pl-3.5 text-left text-[#ffffff] shadow-level-2 md:bottom-6 md:max-w-[440px]"
      >
        <List className="h-4 w-4 shrink-0" strokeWidth={2} />
        <span className="shrink-0 type-button-sm">목차</span>
        {now && (
          <>
            <span aria-hidden className="h-3.5 w-px shrink-0 bg-[#ffffff]/30" />
            <span className="min-w-0 truncate type-caption text-[#dfe4f7]">
              <span className="font-bold text-[#f7a14a]">{now.label}</span> {now.ask}
            </span>
          </>
        )}
      </button>
    </>
  );
}
