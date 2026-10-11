"use client";

import { Star } from "lucide-react";
import { ddayLabel, diffDays } from "@/lib/date";
import { useFavorites, useTodayKey } from "@/lib/hooks";
import { cn } from "./ui";

/** D-day 뱃지 (pill · tnum). 오늘 날짜는 브라우저에서 계산합니다. */
export function DDayBadge({
  date,
  endDate,
  className,
  size = "md",
}: {
  date: string;
  endDate?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const today = useTodayKey();
  const sizing =
    size === "lg"
      ? "rounded-full px-3 py-1 type-body-lg !font-normal tabular"
      : size === "sm"
        ? "tag tabular"
        : "rounded-full px-2 py-1 type-caption";

  if (!today) {
    return (
      <span className={cn("inline-block bg-canvas-soft text-transparent", sizing, className)}>D-00</span>
    );
  }

  // 기간 일정이 진행 중이면 "진행중"
  const inRange = endDate && date <= today && today <= endDate;
  const diff = diffDays(today, date);
  const label = inRange ? "진행중" : ddayLabel(diff);
  const tone = inRange
    ? "bg-ev-written text-on-primary"
    : diff < 0
      ? "bg-canvas-soft text-ink-mute"
      : diff === 0
        ? "bg-ruby text-on-primary animate-pulse-ring"
        : diff <= 3
          ? "bg-ruby text-on-primary"
          : diff <= 7
            ? "bg-ev-doc-soft text-ev-doc"
            : "bg-canvas-soft text-ink-secondary";

  return <span className={cn("inline-block whitespace-nowrap", sizing, tone, className)}>{label}</span>;
}

export function FavoriteButton({
  companyId,
  companyName,
  className,
  withLabel = false,
}: {
  companyId: string;
  companyName: string;
  className?: string;
  withLabel?: boolean;
}) {
  const { favorites, toggle } = useFavorites();
  const on = favorites.has(companyId);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        toggle(companyId);
      }}
      aria-pressed={on}
      aria-label={on ? `${companyName} 관심기관 해제` : `${companyName} 관심기관 추가`}
      className={cn(
        "btn",
        withLabel ? cn("btn-sm", on ? "btn-on-dark" : "btn-secondary") : "btn-icon hover:bg-canvas-soft",
        className,
      )}
    >
      <Star
        className={cn("h-4 w-4", on ? "fill-lemon text-lemon" : withLabel ? "" : "text-ink-mute")}
        strokeWidth={1.75}
      />
      {withLabel && (on ? "관심기관" : "관심기관 추가")}
    </button>
  );
}
