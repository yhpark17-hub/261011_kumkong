"use client";

import { useRouter } from "next/navigation";
import { useId, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { CATEGORY_META } from "@/lib/meta";
import type { CatalogCompany } from "@/lib/types";
import { CompanyAvatar, cn } from "../ui";

export type SearchCompany = Pick<CatalogCompany, "id" | "name" | "shortName" | "logo" | "avatar" | "category">;

const norm = (s: string) => s.replace(/\s+/g, "").toLowerCase();

/**
 * 홈 남색 첫 칸의 기관 검색 — 치는 대로 기관이 아래에 뜨고, 누르면 그 기관 정보로.
 * Enter 는 고른 기관(없으면 첫 기관)으로, 맞는 기관이 없으면 기관 정보 표에서 같은 검색어로 찾아요.
 */
export function HomeSearch({ companies }: { companies: SearchCompany[] }) {
  const router = useRouter();
  const listId = useId();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const matches = useMemo(() => {
    const q = norm(query);
    if (!q) return [];
    return companies
      .filter((c) => norm(`${c.name}${c.shortName}`).includes(q))
      .sort((a, b) => Number(!norm(a.name).startsWith(q)) - Number(!norm(b.name).startsWith(q)))
      .slice(0, 6);
  }, [companies, query]);
  const show = open && query.trim() !== "";

  function go(c: SearchCompany | undefined) {
    const q = query.trim();
    if (c) router.push(`/companies/${c.id}`);
    else if (q) router.push(`/companies?q=${encodeURIComponent(q)}`);
    else router.push("/companies");
  }

  return (
    <form
      action="/companies"
      role="search"
      className="relative mt-4 w-full max-w-[540px] md:mt-7"
      onSubmit={(e) => {
        e.preventDefault();
        go(matches[active] ?? matches[0]);
      }}
    >
      <div className="flex h-12 overflow-hidden rounded-xl bg-canvas md:h-14">
        <input
          name="q"
          type="search"
          value={query}
          maxLength={40}
          autoComplete="off"
          role="combobox"
          aria-label="기관 이름으로 찾기"
          aria-expanded={show}
          aria-controls={listId}
          aria-activedescendant={show && matches[active] ? `${listId}-${active}` : undefined}
          placeholder="기관 이름으로 찾기 — 예: 산업은행, 수협"
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown" && matches.length) {
              e.preventDefault();
              setActive((i) => (i + 1) % matches.length);
            } else if (e.key === "ArrowUp" && matches.length) {
              e.preventDefault();
              setActive((i) => (i - 1 + matches.length) % matches.length);
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
          className="h-full min-w-0 flex-1 bg-transparent px-4 text-[15px] text-ink outline-none placeholder:text-ink-mute md:px-5 md:text-[16px] [&::-webkit-search-cancel-button]:hidden"
        />
        <button type="submit" aria-label="찾기" className="flex w-[54px] shrink-0 items-center justify-center bg-accent text-[#1f2a5c] md:w-[62px]">
          <Search className="h-5 w-5" strokeWidth={2.6} />
        </button>
      </div>

      {show && (
        <ul id={listId} role="listbox" aria-label="찾은 기관" className="absolute inset-x-0 top-full z-20 mt-2 overflow-hidden rounded-xl border border-hairline bg-canvas py-1.5 shadow-level-2">
          {matches.length ? (
            matches.map((c, i) => (
              <li
                key={c.id}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === active}
                // 입력칸의 blur 보다 먼저 — 누른 기관으로 바로 가요
                onMouseDown={(e) => {
                  e.preventDefault();
                  go(c);
                }}
                onMouseEnter={() => setActive(i)}
                className={cn("flex cursor-pointer items-center gap-3 px-4 py-2.5", i === active && "bg-canvas-soft")}
              >
                <CompanyAvatar company={c} size="sm" />
                <span className="min-w-0 flex-1 truncate text-[15px] font-semibold text-ink">{c.name}</span>
                <span className="shrink-0 type-caption text-ink-mute">{CATEGORY_META[c.category].label}</span>
              </li>
            ))
          ) : (
            <li className="px-4 py-3 type-body-md text-ink-mute">
              &lsquo;{query.trim()}&rsquo;에 맞는 기관이 없어요. Enter 를 누르면 기관 정보 표에서 찾아요.
            </li>
          )}
        </ul>
      )}
    </form>
  );
}
