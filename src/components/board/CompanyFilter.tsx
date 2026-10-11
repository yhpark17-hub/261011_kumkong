"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Building2, Check, ChevronDown, Search } from "lucide-react";
import { boardHref, type BoardCategory } from "@/lib/board-meta";
import { cn } from "../ui";

export interface CompanyFilterOption {
  id: string;
  name: string;
  shortName: string;
  group: string;
  /** 이 기관으로 분류된 글 수 */
  count: number;
}

function normalize(s: string) {
  return s.replace(/\s+/g, "").toLowerCase();
}

/** 콩밭 '기관별 보기' — 기관을 검색해 고르면 그 기관 글만 보여 줍니다 */
export function CompanyFilter({
  options,
  selectedId,
  base,
}: {
  options: CompanyFilterOption[];
  selectedId: string | null;
  /** 기관을 바꿀 때 유지할 조건 */
  base: { cat: BoardCategory | null; best: boolean; q: string | null };
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.id === selectedId) ?? null;

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const q = normalize(query);
  const matched = useMemo(
    () => (q ? options.filter((o) => normalize(`${o.name}${o.shortName}`).includes(q)) : options),
    [options, q],
  );
  const withPosts = useMemo(
    () => options.filter((o) => o.count > 0).sort((a, b) => b.count - a.count).slice(0, 8),
    [options],
  );
  const groups = [...new Set(matched.map((o) => o.group))];
  const href = (company: string | null) => boardHref({ ...base, company });

  const item = (o: CompanyFilterOption) => (
    <li key={o.id}>
      <Link
        href={href(o.id)}
        prefetch={false}
        onClick={() => setOpen(false)}
        className={cn(
          "flex items-center gap-2 rounded-md px-3 py-2 type-body-md hover:bg-canvas-soft",
          o.id === selectedId ? "text-primary-text" : "text-ink",
        )}
      >
        <span className="min-w-0 flex-1 truncate">{o.name}</span>
        {o.count > 0 && <span className="tabular type-caption text-ink-mute">{o.count}</span>}
        {o.id === selectedId && <Check className="h-4 w-4" strokeWidth={2} />}
      </Link>
    </li>
  );

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={cn("btn btn-sm max-w-full", selected ? "btn-on-dark" : "btn-toggle")}
      >
        <Building2 className="h-4 w-4 shrink-0" strokeWidth={1.75} />
        <span className="truncate">{selected ? selected.name : "기관별 보기"}</span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform", open && "rotate-180")} strokeWidth={1.75} />
      </button>

      {open && (
        <div className="card absolute top-full left-0 z-30 mt-2 w-[min(22rem,calc(100vw-2rem))] p-2 shadow-level-2">
          <label className="relative block">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-ink-mute"
              strokeWidth={1.75}
            />
            <span className="sr-only">기관명 검색</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="기관명 검색 (예: 신보)"
              className="input w-full !pl-9"
              autoFocus
            />
          </label>
          <div className="mt-2 max-h-80 overflow-y-auto overscroll-contain">
            {!q && (
              <ul>
                <li>
                  <Link
                    href={href(null)}
                    prefetch={false}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-3 py-2 type-body-md hover:bg-canvas-soft",
                      !selectedId ? "text-primary-text" : "text-ink",
                    )}
                  >
                    <span className="flex-1">전체 기관</span>
                    {!selectedId && <Check className="h-4 w-4" strokeWidth={2} />}
                  </Link>
                </li>
              </ul>
            )}
            {!q && withPosts.length > 0 && (
              <>
                <p className="px-3 pt-3 pb-1 type-micro-cap text-ink-mute">글이 많은 기관</p>
                <ul>{withPosts.map(item)}</ul>
              </>
            )}
            {groups.map((g) => (
              <div key={g}>
                <p className="px-3 pt-3 pb-1 type-micro-cap text-ink-mute">{g}</p>
                <ul>{matched.filter((o) => o.group === g).map(item)}</ul>
              </div>
            ))}
            {q && matched.length === 0 && (
              <p className="px-3 py-6 text-center type-body-md text-ink-mute">찾는 기관이 없어요.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
