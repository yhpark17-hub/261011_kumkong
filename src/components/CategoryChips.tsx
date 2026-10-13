"use client";

import { useState } from "react";
import { ChevronUp, Plus } from "lucide-react";
import { CATEGORY_META, CATEGORY_ORDER } from "@/lib/meta";
import type { Category } from "@/lib/types";
import { cn } from "./ui";

/** 처음부터 보여 주는 대표 구분 — 나머지는 '더보기'로 펼칩니다 */
export const PRIMARY_CATEGORIES: Category[] = ["finance", "fininfra", "public", "mutual"];

export type CategoryFilter = Category | "all";

export function FilterChip({
  active,
  onClick,
  children,
  className,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn("btn btn-sm shrink-0", active ? "btn-on-dark" : "btn-toggle", className)}
    >
      {children}
    </button>
  );
}

/**
 * 기관 구분 칩: 전체 + 대표 4개 + [+ 더보기].
 * 숨겨진 구분을 고른 상태면 접혀 있어도 그 칩은 보이게 둡니다.
 */
export function CategoryChips({
  value,
  onChange,
  counts,
  total,
  trailing,
}: {
  value: CategoryFilter | string;
  onChange: (v: CategoryFilter) => void;
  counts: Partial<Record<Category, number>>;
  total: number;
  /** 칩 줄 끝에 붙일 추가 칩 (예: ★ 관심기관) */
  trailing?: React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);
  const available = CATEGORY_ORDER.filter((c) => (counts[c] ?? 0) > 0);
  const primary = available.filter((c) => PRIMARY_CATEGORIES.includes(c));
  const rest = available.filter((c) => !PRIMARY_CATEGORIES.includes(c));
  const shownRest = expanded ? rest : rest.filter((c) => c === value);
  const hiddenCount = rest.length - shownRest.length;

  return (
    // 휴대폰: 한 줄로 밀어서 보기 / 넓은 화면: 줄바꿈
    <div className="no-scrollbar fade-x -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:overflow-visible md:px-0 md:fade-x-none">
      <FilterChip active={value === "all"} onClick={() => onChange("all")}>
        전체 <span className="tabular opacity-60">{total}</span>
      </FilterChip>
      {[...primary, ...shownRest].map((c) => (
        <FilterChip key={c} active={value === c} onClick={() => onChange(c)}>
          {CATEGORY_META[c].label} <span className="tabular opacity-60">{counts[c]}</span>
        </FilterChip>
      ))}
      {rest.length > 0 &&
        (expanded ? (
          <button type="button" onClick={() => setExpanded(false)} className="btn btn-sm btn-toggle shrink-0 text-ink-mute">
            <ChevronUp className="h-4 w-4" strokeWidth={1.75} />
            접기
          </button>
        ) : (
          hiddenCount > 0 && (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              aria-expanded={false}
              className="btn btn-sm btn-toggle shrink-0 !border-dashed text-primary-text"
            >
              <Plus className="h-4 w-4" strokeWidth={1.75} />
              더보기 <span className="tabular opacity-60">{hiddenCount}</span>
            </button>
          )
        ))}
      {trailing}
    </div>
  );
}
