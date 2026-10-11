"use client";

import { ChevronRight } from "lucide-react";
import { formatRange } from "@/lib/date";
import type { CalendarEvent } from "@/lib/types";
import { CompanyAvatar, EventTag } from "../ui";

/** 목록형 일정 한 줄 (목록 보기, 날짜별 일정, 모바일 선택일) */
export function EventRow({
  ev,
  onOpen,
  showDate = false,
}: {
  ev: CalendarEvent;
  onOpen: (companyId: string) => void;
  showDate?: boolean;
}) {
  const expected = ev.recruitment.status === "expected";
  return (
    <button
      type="button"
      onClick={() => onOpen(ev.company.id)}
      className="group flex w-full items-center gap-3 rounded-md px-3 py-3 text-left transition-colors hover:bg-canvas-soft"
    >
      <CompanyAvatar company={ev.company} size="md" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <EventTag type={ev.type} label={ev.label} size="sm" />
          {expected && <span className="tag border border-dashed border-ink-mute text-ink-mute">예상</span>}
        </div>
        <p className="mt-1 truncate type-body-lg text-ink">{ev.company.name}</p>
        <p className="truncate type-caption text-ink-mute">
          {showDate && <span className="mr-1">{formatRange(ev.date, ev.endDate)}</span>}
          {ev.time && <span className="mr-1 text-ink-secondary">{ev.time}</span>}
          {ev.recruitment.title}
        </p>
      </div>
      <ChevronRight
        className="h-4 w-4 shrink-0 text-ink-mute transition-transform group-hover:translate-x-0.5"
        strokeWidth={1.75}
      />
    </button>
  );
}
