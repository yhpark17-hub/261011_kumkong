"use client";

import { useState } from "react";
import { CalendarDays, CalendarRange, ChevronLeft, ChevronRight, List, Plus, RotateCcw, Search, Star } from "lucide-react";
import { formatDayHeading, type YearMonth } from "@/lib/date";
import { CATEGORY_META, CATEGORY_ORDER, EVENT_FILTER_ORDER, EVENT_META, MAJOR_META } from "@/lib/meta";
import type { Category, EventType, MajorType } from "@/lib/types";
import { PRIMARY_CATEGORIES } from "../CategoryChips";
import { cn } from "../ui";
import { ALL_TYPES, DEFAULT_FILTERS, isDefaultFilters, type Filters } from "./filters";

/** 달력(월간) · 일간(날짜 띠 + 그날 목록) · 목록 */
export type View = "month" | "day" | "list";

export function CalendarHeader({
  ym,
  view,
  onViewChange,
  onShift,
  onToday,
  listCount,
  day,
  onShiftDay,
}: {
  ym: YearMonth | null;
  view: View;
  onViewChange: (v: View) => void;
  onShift: (delta: number) => void;
  onToday: () => void;
  listCount: number | null;
  /** 일간 보기에서 고른 날 */
  day?: string | null;
  onShiftDay?: (delta: number) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        {view === "month" ? (
          <>
            <h2 className="tabular min-w-[140px] type-display-md text-ink">
              {ym ? `${ym.y}년 ${ym.m}월` : <span className="inline-block h-7 w-32 rounded-md bg-canvas-soft" />}
            </h2>
            <div className="flex items-center gap-2">
              <button type="button" className="btn btn-icon btn-toggle" aria-label="이전 달" onClick={() => onShift(-1)}>
                <ChevronLeft className="h-4 w-4" strokeWidth={1.75} />
              </button>
              <button type="button" className="btn btn-icon btn-toggle" aria-label="다음 달" onClick={() => onShift(1)}>
                <ChevronRight className="h-4 w-4" strokeWidth={1.75} />
              </button>
              <button type="button" onClick={onToday} className="btn btn-sm btn-secondary">
                오늘
              </button>
            </div>
          </>
        ) : view === "day" ? (
          <>
            <h2 className="tabular type-heading-lg text-ink md:type-display-md">{day ? formatDayHeading(day) : <span className="inline-block h-7 w-32 rounded-md bg-canvas-soft" />}</h2>
            <div className="flex items-center gap-2">
              <button type="button" className="btn btn-icon btn-toggle" aria-label="전날" onClick={() => onShiftDay?.(-1)}>
                <ChevronLeft className="h-4 w-4" strokeWidth={1.75} />
              </button>
              <button type="button" className="btn btn-icon btn-toggle" aria-label="다음 날" onClick={() => onShiftDay?.(1)}>
                <ChevronRight className="h-4 w-4" strokeWidth={1.75} />
              </button>
              <button type="button" onClick={onToday} className="btn btn-sm btn-secondary">
                오늘
              </button>
            </div>
          </>
        ) : (
          <h2 className="type-display-md text-ink">
            다가오는 일정
            {listCount != null && <span className="tabular ml-2 type-heading-sm text-ink-mute">{listCount}건</span>}
          </h2>
        )}
      </div>

      {/* 보기 전환 — pill 세그먼트 */}
      <div className="inline-flex rounded-full border border-hairline bg-canvas-soft p-1" role="tablist">
        {(
          [
            ["month", "달력", CalendarDays],
            ["day", "일간", CalendarRange],
            ["list", "목록", List],
          ] as const
        ).map(([v, label, Icon]) => (
          <button
            key={v}
            type="button"
            role="tab"
            aria-selected={view === v}
            onClick={() => onViewChange(v)}
            className={cn(
              "inline-flex min-h-8 items-center gap-1.5 rounded-full px-3 py-2 type-button-sm transition-colors md:gap-2 md:px-4",
              view === v ? "bg-canvas text-ink shadow-level-1" : "text-ink-mute hover:text-ink",
            )}
          >
            <Icon className="h-4 w-4" strokeWidth={1.75} />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function FilterBar({
  filters,
  onChange,
  favoriteCount,
}: {
  filters: Filters;
  onChange: (f: Filters) => void;
  favoriteCount: number;
}) {
  const set = (patch: Partial<Filters>) => onChange({ ...filters, ...patch });
  const [showAllCategories, setShowAllCategories] = useState(false);
  const visibleCategories = CATEGORY_ORDER.filter(
    (c) => showAllCategories || PRIMARY_CATEGORIES.includes(c) || filters.categories.includes(c),
  );
  const hiddenCategories = CATEGORY_ORDER.length - visibleCategories.length;

  const toggleCategory = (c: Category) =>
    set({
      categories: filters.categories.includes(c)
        ? filters.categories.filter((x) => x !== c)
        : [...filters.categories, c],
    });

  const toggleType = (t: EventType) => {
    const has = filters.types.includes(t);
    // 모두 켜진 상태에서 하나를 누르면 그 유형만 보기 (빠른 필터)
    if (filters.types.length === ALL_TYPES.length) return set({ types: [t] });
    const next = has ? filters.types.filter((x) => x !== t) : [...filters.types, t];
    set({ types: next.length ? next : ALL_TYPES });
  };

  return (
    <div className="space-y-3">
      {/* 검색 + 조건 */}
      <div className="flex flex-col gap-2 md:flex-row md:flex-wrap md:items-center">
        <label className="relative min-w-[200px] flex-1 md:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-ink-mute" strokeWidth={1.75} />
          <span className="sr-only">기관명 검색</span>
          <input
            type="search"
            value={filters.query}
            onChange={(e) => set({ query: e.target.value })}
            placeholder="기관명 검색 (예: 신보, 캠코)"
            className="input w-full !pl-9"
          />
        </label>
        <div className="no-scrollbar fade-x -mx-4 flex items-center gap-2 overflow-x-auto px-4 md:mx-0 md:overflow-visible md:px-0 md:fade-x-none">
        <button
          type="button"
          onClick={() => set({ favoritesOnly: !filters.favoritesOnly })}
          aria-pressed={filters.favoritesOnly}
          className={cn("btn btn-sm shrink-0", filters.favoritesOnly ? "btn-on-dark" : "btn-toggle")}
        >
          <Star className={cn("h-4 w-4", filters.favoritesOnly && "fill-lemon text-lemon")} strokeWidth={1.75} />
          관심기관만
          <span className="tabular opacity-70">{favoriteCount}</span>
        </button>
        <select
          value={filters.major}
          onChange={(e) => set({ major: e.target.value as MajorType | "all" })}
          className="input shrink-0"
          aria-label="전공 시험 유형"
        >
          <option value="all">전공 전체</option>
          {(["none", "integrated", "single"] as const).map((m) => (
            <option key={m} value={m}>
              {MAJOR_META[m].label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => set({ blindOnly: !filters.blindOnly })}
          aria-pressed={filters.blindOnly}
          className={cn("btn btn-sm shrink-0", filters.blindOnly ? "btn-on-dark" : "btn-toggle")}
        >
          블라인드만
        </button>
        {!isDefaultFilters(filters) && (
          <button
            type="button"
            onClick={() => onChange(DEFAULT_FILTERS)}
            className="btn btn-sm shrink-0 text-primary-text hover:bg-canvas-soft"
          >
            <RotateCcw className="h-4 w-4" strokeWidth={1.75} />
            초기화
          </button>
        )}
        </div>
      </div>

      {/* 기관 분류 — 대표 4개 + 더보기 */}
      <div className="no-scrollbar fade-x -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:overflow-visible md:px-0 md:fade-x-none">
        <button
          type="button"
          onClick={() => set({ categories: [] })}
          aria-pressed={filters.categories.length === 0}
          className={cn("btn btn-sm shrink-0", filters.categories.length === 0 ? "btn-on-dark" : "btn-toggle")}
        >
          전체
        </button>
        {visibleCategories.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => toggleCategory(c)}
            aria-pressed={filters.categories.includes(c)}
            className={cn("btn btn-sm shrink-0", filters.categories.includes(c) ? "btn-on-dark" : "btn-toggle")}
          >
            {CATEGORY_META[c].label}
          </button>
        ))}
        {hiddenCategories > 0 && (
          <button
            type="button"
            onClick={() => setShowAllCategories(true)}
            className="btn btn-sm btn-toggle shrink-0 !border-dashed text-primary-text"
          >
            <Plus className="h-4 w-4" strokeWidth={1.75} />
            더보기 <span className="tabular opacity-60">{hiddenCategories}</span>
          </button>
        )}
        {showAllCategories && (
          <button
            type="button"
            onClick={() => setShowAllCategories(false)}
            className="btn btn-sm btn-toggle shrink-0 text-ink-mute"
          >
            접기
          </button>
        )}
      </div>

      {/* 일정 유형 (범례 겸 필터) — pill tag */}
      <div className="no-scrollbar fade-x -mx-4 flex items-center gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:overflow-visible md:px-0 md:fade-x-none">
        {EVENT_FILTER_ORDER.map((t) => {
          const m = EVENT_META[t];
          const on = filters.types.includes(t);
          return (
            <button
              key={t}
              type="button"
              onClick={() => toggleType(t)}
              aria-pressed={on}
              className={cn(
                "inline-flex min-h-8 shrink-0 items-center gap-2 rounded-full px-3 py-1 type-caption transition-opacity",
                on ? cn(m.soft, m.text) : "bg-transparent text-ink-mute line-through opacity-60",
              )}
            >
              <span className={cn("h-2 w-2 rounded-full", on ? m.dot : "bg-ink-mute")} />
              {m.label}
            </button>
          );
        })}
        <span className="ml-2 inline-flex shrink-0 items-center gap-2 type-micro text-ink-mute">
          <span className="h-3 w-6 rounded-xs border border-dashed border-ink-mute" />
          점선 = 예상 일정
        </span>
      </div>
    </div>
  );
}
