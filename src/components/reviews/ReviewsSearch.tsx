"use client";

import { createContext, useContext, useState } from "react";
import { Search, X } from "lucide-react";

/** 필기 후기 첫 화면 — 배너의 큰 검색창과 아래 목록(ExamBrowser)이 같은 검색어를 나눠 써요 */
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
    <label className="relative mt-5 flex h-14 max-w-[560px] items-center gap-3 rounded-full bg-canvas pr-2 pl-5 shadow-level-2 md:mt-6 md:h-[58px]">
      <Search className="h-5 w-5 shrink-0 text-ink-mute" strokeWidth={2} />
      <span className="sr-only">기관 이름으로 시험 찾기</span>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="어느 시험을 보셨나요?"
        className="h-full min-w-0 flex-1 bg-transparent text-[16px] text-ink outline-none placeholder:text-ink-mute [&::-webkit-search-cancel-button]:hidden"
      />
      {query && (
        <button type="button" onClick={() => setQuery("")} aria-label="검색어 지우기" className="btn btn-icon btn-toggle shrink-0">
          <X className="h-4 w-4" strokeWidth={2.2} />
        </button>
      )}
    </label>
  );
}
