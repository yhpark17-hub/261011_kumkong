"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore, useTransition } from "react";
import { Bookmark, BookmarkCheck, Check, Heart, Link2, Share2 } from "lucide-react";
import { likeArticle, recordArticleView, recordIssueView, recordNewsView } from "@/app/magazine/actions";
import {
  getRead,
  getSaved,
  markRead,
  serverRead,
  serverSaved,
  subscribe,
  toggleSaved,
} from "@/lib/magazine-local";
import { CATEGORY_INFO, articleHref, isMagazineCategory } from "@/lib/magazine-meta";
import type { Heading } from "./Markdown";
import { cn } from "../ui";

const useRead = () => useSyncExternalStore(subscribe, getRead, serverRead);
const useSaved = () => useSyncExternalStore(subscribe, getSaved, serverSaved);

/** 목록 카드의 '읽음' 표시 */
export function ReadBadge({ id, className }: { id: number; className?: string }) {
  const read = useRead();
  if (!read[id]) return null;
  return (
    <span className={cn("tag bg-canvas/90 text-ink-mute ring-1 ring-hairline", className)}>
      <Check className="h-3 w-3" strokeWidth={2} />
      읽음
    </span>
  );
}

/** 글을 열면: 조회수 1회 + 이 브라우저에 '읽음' 기록 */
export function ViewRecorder({ id }: { id: number }) {
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    recordArticleView(id).catch(() => {});
    markRead(id);
  }, [id]);
  return null;
}

/** 상단 읽기 진행 막대 */
export function ReadingProgress({ targetId }: { targetId: string }) {
  const bar = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = document.getElementById(targetId);
    if (!el) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight * 0.6;
      const p = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 1;
      if (bar.current) bar.current.style.transform = `scaleX(${p})`;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [targetId]);
  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-50 h-[3px]">
      <div ref={bar} className="h-full origin-left bg-primary transition-transform duration-75" style={{ transform: "scaleX(0)" }} />
    </div>
  );
}

/** 도움돼요 · 저장 · 공유 */
export function ArticleActions({
  id,
  title,
  category,
  initialLikes,
  preview = false,
}: {
  id: number;
  title: string;
  category: string;
  initialLikes: number;
  preview?: boolean;
}) {
  const [likes, setLikes] = useState(initialLikes);
  const [liked, setLiked] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pending, start] = useTransition();
  const saved = useSaved().some((s) => s.id === id);

  function like() {
    if (liked || preview) return;
    start(async () => {
      const res = await likeArticle(id);
      setLikes(res.likes || likes);
      setLiked(true);
    });
  }

  async function share() {
    const url = `${location.origin}${articleHref(id)}`;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        /* 사용자가 닫음 → 복사로 */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* 무시 */
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <button
        type="button"
        onClick={like}
        disabled={pending || preview}
        aria-pressed={liked}
        className={cn(
          "inline-flex h-11 items-center gap-2 rounded-full border px-5 type-button-md transition-colors",
          liked ? "border-ruby/40 bg-ruby/10 text-ruby" : "border-hairline-input text-ink hover:border-ruby/40 hover:text-ruby",
        )}
      >
        <Heart className={cn("h-4 w-4", liked && "fill-current")} strokeWidth={1.75} />
        도움돼요 <span className="tabular">{likes}</span>
      </button>
      <button
        type="button"
        onClick={() => toggleSaved({ id, title, category })}
        aria-pressed={saved}
        className={cn(
          "inline-flex h-11 items-center gap-2 rounded-full border px-5 type-button-md transition-colors",
          saved ? "border-primary/40 bg-ev-written-soft text-primary-text" : "border-hairline-input text-ink hover:border-primary/40",
        )}
      >
        {saved ? <BookmarkCheck className="h-4 w-4" strokeWidth={1.75} /> : <Bookmark className="h-4 w-4" strokeWidth={1.75} />}
        {saved ? "저장됨" : "저장"}
      </button>
      <button
        type="button"
        onClick={share}
        className="inline-flex h-11 items-center gap-2 rounded-full border border-hairline-input px-5 type-button-md text-ink hover:border-primary/40"
      >
        {copied ? <Link2 className="h-4 w-4" strokeWidth={1.75} /> : <Share2 className="h-4 w-4" strokeWidth={1.75} />}
        {copied ? "링크 복사됨" : "공유"}
      </button>
    </div>
  );
}

/** 내가 저장한 글 */
export function SavedArticles({ limit = 5 }: { limit?: number }) {
  const saved = useSaved();
  if (!saved.length) {
    return <p className="type-caption text-ink-mute">글 아래의 &lsquo;저장&rsquo;을 누르면 여기에 모아 둘 수 있어요. (이 브라우저에만 저장)</p>;
  }
  return (
    <ul className="divide-y divide-hairline">
      {saved.slice(0, limit).map((s) => (
        <li key={s.id}>
          <Link href={articleHref(s.id)} className="group flex items-start gap-2 py-2.5">
            <BookmarkCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" strokeWidth={1.75} />
            <span className="min-w-0">
              <span className="line-clamp-2 type-body-md text-ink group-hover:underline">{s.title}</span>
              {isMagazineCategory(s.category) && <span className="type-micro text-ink-mute">{CATEGORY_INFO[s.category].label}</span>}
            </span>
          </Link>
        </li>
      ))}
      {saved.length > limit && (
        <li className="pt-2.5 type-caption text-ink-mute">외 {saved.length - limit}개</li>
      )}
    </ul>
  );
}

/** 목차 — 지금 읽는 소제목 강조 */
export function TableOfContents({ headings }: { headings: Heading[] }) {
  const [active, setActive] = useState<string | null>(null);
  useEffect(() => {
    // 화면 위쪽(머리글 아래)을 지난 마지막 소제목 = 지금 읽는 곳
    let frame = 0;
    const update = () => {
      frame = 0;
      let current: string | null = null;
      for (const h of headings) {
        const el = document.getElementById(h.id);
        if (el && el.getBoundingClientRect().top <= 140) current = h.id;
      }
      setActive(current);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [headings]);

  return (
    <nav aria-label="목차">
      <p className="type-micro-cap text-ink-mute">목차</p>
      <ol className="mt-3 space-y-1 border-l border-hairline">
        {headings.map((h) => (
          <li key={h.id}>
            <a
              href={`#${h.id}`}
              className={cn(
                "-ml-px block border-l-2 py-1 type-caption transition-colors",
                h.level === 3 ? "pl-6" : "pl-3",
                active === h.id ? "border-primary text-primary-text" : "border-transparent text-ink-mute hover:text-ink",
              )}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** 오늘 브리핑을 아직 안 읽었으면 살짝 알려 주는 점 */
export function UnreadDot({ id }: { id: number }) {
  const read = useRead();
  const hydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  if (!hydrated || read[id]) return null;
  return <span aria-label="안 읽음" className="inline-block h-2 w-2 rounded-full bg-ruby" />;
}


/** 뉴스를 열면 조회수 1회 (많이 본 뉴스 순위) */
export function IssueViewRecorder({ id }: { id: number }) {
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    recordIssueView(id).catch(() => {});
  }, [id]);
  return null;
}

export function NewsViewRecorder({ id }: { id: number }) {
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    recordNewsView(id).catch(() => {});
  }, [id]);
  return null;
}

/** 공유 (모바일은 공유 시트, PC 는 링크 복사) */
export function ShareButton({ title, path, className }: { title: string; path: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  async function share() {
    const url = `${location.origin}${path}`;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        /* 닫음 → 복사로 */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* 무시 */
    }
  }
  return (
    <button type="button" onClick={share} className={cn("btn btn-toggle btn-sm", className)}>
      {copied ? <Link2 className="h-4 w-4" strokeWidth={1.75} /> : <Share2 className="h-4 w-4" strokeWidth={1.75} />}
      {copied ? "링크 복사됨" : "공유"}
    </button>
  );
}
