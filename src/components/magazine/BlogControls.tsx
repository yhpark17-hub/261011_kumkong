"use client";

import { useRouter } from "next/navigation";
import { LayoutGrid, List } from "lucide-react";
import { cn } from "../ui";

export type BlogView = "card" | "list";
export const BLOG_VIEW_COOKIE = "kk_blog_view";

/** 카드(사진과 크게) / 목록(글만) 보기 — 고른 방식은 이 브라우저에 기억 */
export function ViewToggle({ view, hrefs }: { view: BlogView; hrefs: Record<BlogView, string> }) {
  const router = useRouter();
  const choose = (v: BlogView) => {
    document.cookie = `${BLOG_VIEW_COOKIE}=${v}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    router.push(hrefs[v], { scroll: false });
  };
  const item = "inline-flex h-8 items-center gap-1.5 rounded-md px-3 type-caption transition-colors";
  return (
    <div role="group" aria-label="보기 방식" className="inline-flex rounded-lg bg-canvas-soft p-1">
      <button type="button" aria-pressed={view === "card"} onClick={() => choose("card")} className={cn(item, view === "card" ? "bg-canvas text-ink shadow-level-1" : "text-ink-mute hover:text-ink")}>
        <LayoutGrid className="h-3.5 w-3.5" strokeWidth={2} />
        카드
      </button>
      <button type="button" aria-pressed={view === "list"} onClick={() => choose("list")} className={cn(item, view === "list" ? "bg-canvas text-ink shadow-level-1" : "text-ink-mute hover:text-ink")}>
        <List className="h-3.5 w-3.5" strokeWidth={2} />
        목록
      </button>
    </div>
  );
}
