"use client";

import { useMemo, useRef } from "react";
import { AlarmClock, ChevronLeft, ChevronRight } from "lucide-react";
import { addDays, diffDays, formatRange } from "@/lib/date";
import { EVENT_META } from "@/lib/meta";
import type { CalendarEvent } from "@/lib/types";
import { DDayBadge } from "../client-ui";
import { CompanyAvatar, EventTag, cn } from "../ui";

const WINDOW_DAYS = 14;
const MAX_CARDS = 16;

/** 접수 시작은 '마감'이 아니므로 임박 목록에서 제외 */
const URGENT_TYPES = new Set(["doc", "written", "interview1", "interview2", "final"]);

export function UrgentStrip({
  today,
  events,
  onOpen,
}: {
  today: string | null;
  events: CalendarEvent[];
  onOpen: (companyId: string) => void;
}) {
  const scroller = useRef<HTMLDivElement>(null);

  const { urgent, counts } = useMemo(() => {
    if (!today) return { urgent: [], counts: null };
    const until = addDays(today, WINDOW_DAYS);
    const list = events.filter(
      (e) => URGENT_TYPES.has(e.type) && (e.endDate ?? e.date) >= today && e.date <= until,
    );
    const week = addDays(today, 7);
    return {
      urgent: list.slice(0, MAX_CARDS),
      counts: {
        today: list.filter((e) => e.date === today || (e.endDate && e.date <= today && today <= e.endDate)).length,
        doc: list.filter((e) => e.type === "doc" && e.date <= week).length,
        written: list.filter((e) => e.type === "written" && e.date <= week).length,
        total: list.length,
      },
    };
  }, [today, events]);

  const scrollBy = (dir: 1 | -1) =>
    scroller.current?.scrollBy({ left: dir * 560, behavior: "smooth" });

  return (
    <section aria-labelledby="urgent-title" className="card shadow-level-2 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ev-doc-soft text-ruby">
            <AlarmClock className="h-5 w-5" strokeWidth={1.75} />
          </span>
          <div>
            <h2 id="urgent-title" className="type-heading-lg text-ink">
              임박한 일정
            </h2>
            <p className="mt-1 type-caption text-ink-mute">앞으로 {WINDOW_DAYS}일 · 마감·시험·면접 순</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {counts ? (
            <>
              <SummaryPill label="오늘" value={counts.today} strong />
              <SummaryPill label="7일 내 서류마감" value={counts.doc} />
              <SummaryPill label="7일 내 필기" value={counts.written} />
            </>
          ) : (
            <span className="h-7 w-56 rounded-full bg-canvas-soft" />
          )}
          <div className="ml-2 hidden gap-2 md:flex">
            <button
              type="button"
              onClick={() => scrollBy(-1)}
              className="btn btn-icon btn-toggle"
              aria-label="이전 일정"
            >
              <ChevronLeft className="h-4 w-4" strokeWidth={1.75} />
            </button>
            <button
              type="button"
              onClick={() => scrollBy(1)}
              className="btn btn-icon btn-toggle"
              aria-label="다음 일정"
            >
              <ChevronRight className="h-4 w-4" strokeWidth={1.75} />
            </button>
          </div>
        </div>
      </div>

      <div
        ref={scroller}
        className="no-scrollbar fade-x -mx-4 mt-6 flex snap-x scroll-px-4 gap-3 overflow-x-auto px-4 pb-1 md:-mx-6 md:scroll-px-6 md:px-6"
      >
        {!today &&
          Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="h-[140px] w-[248px] shrink-0 rounded-md bg-canvas-soft" />
          ))}

        {today && urgent.length === 0 && (
          <p className="w-full rounded-md bg-canvas-soft px-4 py-8 text-center text-ink-mute">
            {WINDOW_DAYS}일 안에 예정된 일정이 없어요. 아래 달력에서 다음 달 일정을 확인해 보세요.
          </p>
        )}

        {today &&
          urgent.map((ev) => {
            const diff = diffDays(today, ev.date);
            const hot = diff <= 1;
            const m = EVENT_META[ev.type];
            return (
              <button
                key={ev.id}
                type="button"
                onClick={() => onOpen(ev.company.id)}
                className={cn(
                  "group flex w-[248px] shrink-0 snap-start flex-col rounded-md border p-4 text-left transition-shadow hover:shadow-level-2",
                  hot ? "border-ruby/40 bg-ev-doc-soft" : "border-hairline bg-canvas",
                  ev.recruitment.status === "expected" && "border-dashed",
                )}
              >
                <div className="flex items-center justify-between">
                  <EventTag type={ev.type} label={ev.label} size="sm" />
                  <DDayBadge date={ev.date} endDate={ev.endDate} size="md" />
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <CompanyAvatar company={ev.company} size="sm" />
                  <p className="truncate type-heading-sm text-ink">{ev.company.name}</p>
                </div>
                <p className="mt-2 type-body-tabular text-ink-secondary">
                  {formatRange(ev.date, ev.endDate)}
                  {ev.time && <span className={cn("ml-1", m.text)}>{ev.time}</span>}
                  {ev.type === "doc" && <span className="ml-1 text-ink-mute">마감</span>}
                </p>
                <p className="mt-1 truncate type-micro text-ink-mute">
                  {ev.recruitment.status === "expected" ? "예상 · " : ""}
                  {ev.recruitment.title}
                </p>
              </button>
            );
          })}
      </div>
    </section>
  );
}

function SummaryPill({ label, value, strong }: { label: string; value: number; strong?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-3 py-1 type-caption",
        strong && value > 0 ? "bg-ruby text-on-primary" : "bg-canvas-soft text-ink-secondary",
      )}
    >
      {label}
      <span>{value}</span>
    </span>
  );
}
