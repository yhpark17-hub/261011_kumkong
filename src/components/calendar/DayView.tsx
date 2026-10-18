"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { WEEKDAYS, addDays, dayOfWeek, formatDayHeading, parseKey } from "@/lib/date";
import { EVENT_FILTER_ORDER, EVENT_META } from "@/lib/meta";
import type { CalendarEvent } from "@/lib/types";
import { cn } from "../ui";
import { EventRow } from "./EventRow";

/**
 * 일간 보기 — 위 주간 날짜 띠(‹ › 로 한 주씩)에서 날을 고르면 그날 일정이 아래에 (캐치 일간 보기 참고, DESIGN-MOBILE.md)
 */
export function DayView({
  day,
  today,
  byDay,
  onSelect,
  onOpenCompany,
}: {
  day: string;
  today: string | null;
  byDay: Map<string, CalendarEvent[]>;
  onSelect: (day: string) => void;
  onOpenCompany: (companyId: string) => void;
}) {
  const start = addDays(day, -dayOfWeek(day));
  const week = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const events = byDay.get(day) ?? [];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1">
        <button type="button" onClick={() => onSelect(addDays(day, -7))} aria-label="지난주" className="btn btn-icon btn-toggle !h-9 !w-8 shrink-0">
          <ChevronLeft className="h-4 w-4" strokeWidth={2} />
        </button>
        <div className="grid flex-1 grid-cols-7 gap-1" role="tablist" aria-label="날짜 고르기">
          {week.map((d) => {
            const dow = dayOfWeek(d);
            const on = d === day;
            const list = byDay.get(d) ?? [];
            const types = EVENT_FILTER_ORDER.filter((t) => list.some((e) => e.type === t)).slice(0, 3);
            return (
              <button
                key={d}
                type="button"
                role="tab"
                aria-selected={on}
                aria-label={`${formatDayHeading(d)} 일정 ${list.length}건`}
                onClick={() => onSelect(d)}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl py-2 transition-colors",
                  on ? "bg-brand-dark text-on-primary" : d === today ? "bg-ev-written-soft text-ink" : "bg-canvas-soft text-ink hover:bg-hairline/60",
                  today && d < today && !on && "opacity-55",
                )}
              >
                <span className={cn("type-micro", !on && (dow === 0 ? "text-ruby" : dow === 6 ? "text-primary-text" : "text-ink-mute"))}>{WEEKDAYS[dow]}</span>
                <span className="tabular text-[17px] leading-none font-bold">{parseKey(d).d}</span>
                <span className="flex h-1.5 gap-0.5">
                  {types.map((t) => (
                    <span key={t} className={cn("h-1.5 w-1.5 rounded-full", EVENT_META[t].dot, on && "ring-1 ring-on-primary/70")} />
                  ))}
                </span>
              </button>
            );
          })}
        </div>
        <button type="button" onClick={() => onSelect(addDays(day, 7))} aria-label="다음 주" className="btn btn-icon btn-toggle !h-9 !w-8 shrink-0">
          <ChevronRight className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>

      <div className="card p-2 shadow-level-1">
        <h3 className="px-3 pt-2 pb-1 type-heading-sm text-ink">
          {formatDayHeading(day)}
          {day === today && <span className="ml-1.5 tag bg-primary text-on-primary">오늘</span>}
          <span className="ml-2 tabular type-caption text-ink-mute">{events.length}건</span>
        </h3>
        {events.length ? (
          events.map((ev) => <EventRow key={ev.id} ev={ev} onOpen={onOpenCompany} />)
        ) : (
          <p className="px-3 pt-1 pb-4 type-body-md text-ink-mute">이 날은 일정이 없어요. 위 날짜 띠에서 점이 있는 날을 골라 보세요.</p>
        )}
      </div>
    </div>
  );
}
