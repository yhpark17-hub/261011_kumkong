"use client";

import { Fragment, useEffect, useMemo } from "react";
import { X } from "lucide-react";
import { AdSlot } from "../ads/AdSlot";
import { AD_SLOTS } from "@/lib/site";
import { formatDayHeading, HOLIDAYS } from "@/lib/date";
import type { CalendarEvent } from "@/lib/types";
import { DDayBadge } from "../client-ui";
import { EventRow } from "./EventRow";
import { groupByDay } from "./filters";

/** 오늘 이후 일정을 날짜별로 묶어 보여주는 목록 보기 */
export function AgendaList({
  today,
  events,
  onOpen,
}: {
  today: string | null;
  events: CalendarEvent[];
  onOpen: (id: string) => void;
}) {
  const groups = useMemo(() => {
    if (!today) return [];
    const upcoming = events.filter((e) => (e.endDate ?? e.date) >= today);
    return [...groupByDay(upcoming).entries()];
  }, [today, events]);

  if (!today) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-28 rounded-lg bg-canvas-soft" />
        ))}
      </div>
    );
  }

  if (!groups.length) {
    return (
      <p className="card px-4 py-16 text-center text-ink-mute">조건에 맞는 다가오는 일정이 없어요. 필터를 바꿔 보세요.</p>
    );
  }

  return (
    <div className="space-y-3">
      {groups.map(([day, list], i) => (
        <Fragment key={day}>
          <section className="card p-2 shadow-level-1">
            <header className="flex items-center gap-2 px-3 pt-2 pb-1">
              <h3 className="type-heading-sm text-ink">{formatDayHeading(day)}</h3>
              {HOLIDAYS[day] && <span className="type-caption text-ruby">{HOLIDAYS[day]}</span>}
              <DDayBadge date={day} size="sm" className="ml-auto" />
            </header>
            <div>
              {list.map((ev) => (
                <EventRow key={ev.id} ev={ev} onOpen={onOpen} />
              ))}
            </div>
          </section>
          {i === 2 && <AdSlot slot={AD_SLOTS.inFeed} variant="infeed" />}
        </Fragment>
      ))}
    </div>
  );
}

/** 특정 날짜의 전체 일정 (데스크톱 모달 · Level 2 floating panel) */
export function DayModal({
  day,
  events,
  onClose,
  onOpen,
}: {
  day: string;
  events: CalendarEvent[];
  onClose: () => void;
  onOpen: (id: string) => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="day-modal-title"
    >
      <button type="button" aria-label="닫기" onClick={onClose} className="animate-fade-in absolute inset-0 bg-brand-dark/40" />
      <div className="animate-fade-in card relative w-full max-w-md p-2 shadow-level-2">
        <header className="flex items-center gap-2 px-3 pt-2 pb-1">
          <h3 id="day-modal-title" className="type-heading-md text-ink">
            {formatDayHeading(day)}
          </h3>
          <DDayBadge date={day} size="sm" />
          <button
            type="button"
            onClick={onClose}
            className="btn btn-icon ml-auto text-ink-mute hover:bg-canvas-soft hover:text-ink"
            aria-label="닫기"
          >
            <X className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </header>
        <div className="max-h-[60vh] overflow-y-auto">
          {events.map((ev) => (
            <EventRow
              key={ev.id}
              ev={ev}
              onOpen={(id) => {
                onClose();
                onOpen(id);
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
