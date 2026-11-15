"use client";

import { createContext, useContext, useState } from "react";
import { Search, X } from "lucide-react";

/** 필기 후기 첫 화면 — 머리의 검색창과 아래 목록(ExamBrowser)이 같은 검색어를 나눠 써요 */
const Ctx = createContext<{ query: string; setQuery: (q: string) => void } | null>(null);

export function ReviewsSearchProvider({ children }: { children: React.ReactNode }) {
  const [query, setQuery] = useState("");
  return <Ctx.Provider value={{ query, setQuery }}>{children}</Ctx.Provider>;
}

export function useReviewsQuery() {
  const c = useContext(Ctx);
  const [local, setLocal] = useState("");
  return c ?? { query: local, setQuery: setLocal };
}

export function ReviewsSearchInput() {
  const { query, setQuery } = useReviewsQuery();
  return (
    <label className="relative flex h-12 w-full items-center gap-2.5 rounded-[10px] border-2 border-primary bg-canvas pr-1.5 pl-4 md:w-[340px]">
      <Search className="h-5 w-5 shrink-0 text-navy-text" strokeWidth={2.2} />
      <span className="sr-only">기관 이름으로 시험 찾기</span>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="어느 시험을 보셨나요?"
        className="h-full min-w-0 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-ink-mute [&::-webkit-search-cancel-button]:hidden"
      />
      {query && (
        <button type="button" onClick={() => setQuery("")} aria-label="검색어 지우기" className="btn btn-icon btn-toggle !h-9 !min-h-0 !w-9 shrink-0">
          <X className="h-4 w-4" strokeWidth={2.2} />
        </button>
      )}
    </label>
  );
}
