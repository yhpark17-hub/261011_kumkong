"use client";

import { HOLIDAYS, WEEKDAYS, dayOfWeek, monthWeeks, parseKey, type YearMonth } from "@/lib/date";
import { EVENT_META } from "@/lib/meta";
import type { CalendarEvent } from "@/lib/types";
import { cn } from "../ui";

const MAX_CHIPS = 3;
/** 휴대폰 칸에 이름을 보여 줄 일정 수 (나머지는 +N) */
const MOBILE_MAX = 3;

const isDesktop = () => window.matchMedia("(min-width: 768px)").matches;

/** 월간 달력 — card-dashboard-mockup (canvas · rounded lg · Level 2 · tabular) */
export function MonthGrid({
  ym,
  today,
  byDay,
  selectedDay,
  onSelectDay,
  onOpenDay,
  onOpenCompany,
}: {
  ym: YearMonth | null;
  today: string | null;
  byDay: Map<string, CalendarEvent[]>;
  selectedDay: string | null;
  onSelectDay: (day: string) => void;
  onOpenDay: (day: string) => void;
  onOpenCompany: (companyId: string) => void;
}) {
  return (
    // 휴대폰에서는 화면 끝까지 넓혀 칸마다 기관 이름이 들어갈 자리를 확보
    <div className="card overflow-hidden shadow-level-2 max-md:-mx-4 max-md:rounded-none max-md:border-x-0">
      <div className="grid grid-cols-7 border-b border-hairline bg-canvas-soft">
        {WEEKDAYS.map((w, i) => (
          <div
            key={w}
            className={cn(
              "py-2 text-center type-caption",
              i === 0 ? "text-ruby" : i === 6 ? "text-primary-text" : "text-ink-mute",
            )}
          >
            {w}
          </div>
        ))}
      </div>

      {!ym ? (
        <div className="grid grid-cols-7">
          {Array.from({ length: 35 }, (_, i) => (
            <div key={i} className="h-16 border-r border-b border-hairline md:h-32 [&:nth-child(7n)]:border-r-0" />
          ))}
        </div>
      ) : (
        monthWeeks(ym).map((week) => (
          <div key={week[0]} className="grid grid-cols-7 border-b border-hairline last:border-b-0">
            {week.map((day) => (
              <DayCell
                key={day}
                day={day}
                inMonth={parseKey(day).m === ym.m}
                isToday={day === today}
                isPast={today != null && day < today}
                selected={day === selectedDay}
                events={byDay.get(day) ?? []}
                onSelect={() => onSelectDay(day)}
                onOpenDay={() => onOpenDay(day)}
                onOpenCompany={onOpenCompany}
              />
            ))}
          </div>
        ))
      )}
    </div>
  );
}

function DayCell({
  day,
  inMonth,
  isToday,
  isPast,
  selected,
  events,
  onSelect,
  onOpenDay,
  onOpenCompany,
}: {
  day: string;
  inMonth: boolean;
  isToday: boolean;
  isPast: boolean;
  selected: boolean;
  events: CalendarEvent[];
  onSelect: () => void;
  onOpenDay: () => void;
  onOpenCompany: (id: string) => void;
}) {
  const dow = dayOfWeek(day);
  const holiday = HOLIDAYS[day];
  const red = dow === 0 || holiday;
  const hidden = events.length - MAX_CHIPS;

  return (
    <div
      onClick={() => {
        onSelect();
        // 휴대폰: 일정 있는 날을 누르면 그날 일정을 바로 띄워요 (아래로 내려가 찾지 않게)
        if (events.length && !isDesktop()) onOpenDay();
      }}
      className={cn(
        "relative min-h-[76px] min-w-0 cursor-pointer border-r border-hairline p-0.5 last:border-r-0 md:min-h-32 md:cursor-default md:p-2",
        !inMonth && "bg-canvas-soft",
        selected && "max-md:bg-ev-written-soft",
      )}
    >
      <div className="flex items-center justify-between gap-1">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
            if (events.length) onOpenDay();
          }}
          className={cn(
            "flex h-6 min-w-6 items-center justify-center rounded-full px-1 type-caption",
            isToday ? "bg-primary text-on-primary" : red ? "text-ruby" : dow === 6 ? "text-primary-text" : "text-ink",
            !inMonth && !isToday && "opacity-40",
            events.length > 0 && !isToday && "md:hover:bg-canvas-soft",
          )}
          aria-label={`${day}${holiday ? ` ${holiday}` : ""}, 일정 ${events.length}건`}
        >
          {parseKey(day).d}
        </button>
        {holiday && (
          <span className={cn("hidden truncate type-micro text-ruby md:block", !inMonth && "opacity-40")}>
            {holiday}
          </span>
        )}
      </div>

      {/* 데스크톱: 일정 칩 (hairline tag · rounded xs) */}
      <div className={cn("mt-1 hidden flex-col gap-1 md:flex", isPast && "opacity-55")}>
        {events.slice(0, MAX_CHIPS).map((ev) => (
          <EventChip key={ev.id} ev={ev} onClick={() => onOpenCompany(ev.company.id)} />
        ))}
        {hidden > 0 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenDay();
            }}
            className="rounded-xs px-1 py-0.5 text-left type-micro text-primary-text hover:bg-canvas-soft"
          >
            +{hidden}개 더보기
          </button>
        )}
      </div>

      {/* 휴대폰: 기관 약칭을 전형 색으로 — 그날 어디가 무슨 일정인지 바로 */}
      {events.length > 0 && (
        <div className={cn("mt-0.5 flex flex-col gap-px md:hidden", isPast && "opacity-55")}>
          {events.slice(0, MOBILE_MAX).map((ev) => {
            const m = EVENT_META[ev.type];
            const expected = ev.recruitment.status === "expected";
            return (
              <span
                key={ev.id}
                className={cn(
                  "block truncate rounded-[3px] border-l-2 pr-0.5 pl-[3px] text-[10px] leading-[15px] tracking-[-0.02em] text-ink",
                  m.border,
                  expected ? "bg-canvas outline outline-1 -outline-offset-1 outline-dashed outline-hairline-input" : m.soft,
                )}
              >
                {ev.company.shortName}
              </span>
            );
          })}
          {events.length > MOBILE_MAX && (
            <span className="text-center tabular text-[10px] leading-3 font-semibold text-primary-text">+{events.length - MOBILE_MAX}</span>
          )}
        </div>
      )}
    </div>
  );
}

function EventChip({ ev, onClick }: { ev: CalendarEvent; onClick: () => void }) {
  const m = EVENT_META[ev.type];
  const expected = ev.recruitment.status === "expected";
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      title={`${ev.company.name} · ${ev.label ?? m.label}${ev.time ? ` ${ev.time}` : ""}${expected ? " (예상)" : ""}`}
      className={cn(
        "flex w-full items-center gap-1 rounded-xs border px-1 py-0.5 text-left transition-[filter] hover:brightness-95",
        expected ? cn("border-dashed bg-canvas", m.border) : cn("border-transparent", m.soft),
      )}
    >
      <span className={cn("shrink-0 type-micro-cap", m.text)}>{m.short}</span>
      <span className="truncate type-micro text-ink">{ev.company.shortName}</span>
    </button>
  );
}
