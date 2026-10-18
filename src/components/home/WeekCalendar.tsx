"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { WEEKDAYS, dayOfWeek, formatShort, parseKey } from "@/lib/date";
import { EVENT_FILTER_ORDER, EVENT_META } from "@/lib/meta";
import type { EventType } from "@/lib/types";
import { EventTag, cn } from "../ui";

export interface WeekItem {
  id: string;
  companyId: string;
  name: string;
  short: string;
  type: EventType;
  label?: string;
  expected: boolean;
}

export interface WeekDay {
  date: string;
  items: WeekItem[];
}

/** 넓은 화면 칸에 이름까지 보여 줄 일정 수 / 휴대폰 칸에 약칭으로 보여 줄 수 */
const DESKTOP_MAX = 5;
const MOBILE_MAX = 4;
/** 휴대폰에서 고른 날 아래 목록에 보여 줄 수 (나머지는 캘린더에서) */
const LIST_MAX = 6;

/**
 * 홈: 이번 주(일~토) 채용 일정 — 날짜 칸마다 기관 이름을 전형 색으로, 화살표로 다음 주
 * 휴대폰에서는 칸에 약칭만 넣고, 날짜를 누르면 아래에 그날 일정 전체가 나와요.
 */
export function WeekCalendar({ weeks, today }: { weeks: WeekDay[][]; today: string }) {
  const [w, setW] = useState(0);
  const days = weeks[w];
  const inWeek = days.some((d) => d.date === today);
  const [picked, setPicked] = useState<string | null>(null);
  const active = picked && days.some((d) => d.date === picked) ? picked : inWeek ? today : (days.find((d) => d.items.length)?.date ?? days[0].date);
  const activeDay = days.find((d) => d.date === active)!;
  const all = days.flatMap((d) => d.items);
  const count = (t: EventType | EventType[]) => new Set(all.filter((it) => [t].flat().includes(it.type)).map((it) => it.id)).size;

  return (
    <section aria-labelledby="week-title" className="card p-4 shadow-level-1 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-primary" strokeWidth={1.75} />
          <h2 id="week-title" className="type-heading-md text-ink">
            {w === 0 ? "이번 주" : "다음 주"} 채용 일정
          </h2>
          <span className="tabular type-caption text-ink-mute">
            {formatShort(days[0].date)} – {formatShort(days[6].date)}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setW(0)}
            disabled={w === 0}
            aria-label="이번 주 보기"
            className="btn btn-icon btn-toggle !h-8 !w-8 disabled:opacity-35"
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={2} />
          </button>
          <button
            type="button"
            onClick={() => setW(1)}
            disabled={w === weeks.length - 1}
            aria-label="다음 주 보기"
            className="btn btn-icon btn-toggle !h-8 !w-8 disabled:opacity-35"
          >
            <ChevronRight className="h-4 w-4" strokeWidth={2} />
          </button>
          <Link href="/calendar" className="link ml-1 inline-flex items-center gap-1 type-caption">
            캘린더 전체
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} />
          </Link>
        </div>
      </div>

      <p className="mt-1 type-caption text-ink-mute">
        서류 마감 <b className="tabular text-ink">{count("doc")}</b> · 필기 <b className="tabular text-ink">{count("written")}</b> · 면접{" "}
        <b className="tabular text-ink">{count(["interview1", "interview2"])}</b> · 최종 발표 <b className="tabular text-ink">{count("final")}</b>
      </p>

      {/* 7일 칸 — 휴대폰은 화면 끝까지 넓혀 약칭이 들어갈 자리 확보 */}
      <div className="mt-4 grid grid-cols-7 overflow-hidden rounded-lg border border-hairline max-md:-mx-4 max-md:rounded-none max-md:border-x-0">
        {days.map((d) => {
          const dow = dayOfWeek(d.date);
          const isToday = d.date === today;
          const isPast = d.date < today;
          const on = d.date === active;
          return (
            // 휴대폰: 칸 아무 데나 눌러 그날 고르기 (키보드는 날짜 버튼으로)
            <div
              key={d.date}
              onClick={() => setPicked(d.date)}
              className={cn(
                "flex min-h-[104px] min-w-0 cursor-pointer flex-col border-r border-hairline p-0.5 last:border-r-0 md:min-h-[176px] md:cursor-default md:p-2",
                on && "max-md:bg-ev-written-soft",
                isToday && "md:bg-ev-written-soft/60",
              )}
            >
              <button
                type="button"
                onClick={() => setPicked(d.date)}
                aria-pressed={on}
                aria-label={`${formatShort(d.date)} 일정 ${d.items.length}건`}
                className="flex items-center justify-center gap-1 py-1 md:pointer-events-none md:justify-start"
              >
                <span className={cn("type-micro md:type-caption", dow === 0 ? "text-ruby" : dow === 6 ? "text-primary-text" : "text-ink-mute")}>{WEEKDAYS[dow]}</span>
                <span
                  className={cn(
                    "inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1 tabular type-caption font-semibold",
                    isToday ? "bg-primary text-on-primary" : dow === 0 ? "text-ruby" : "text-ink",
                  )}
                >
                  {parseKey(d.date).d}
                </span>
              </button>

              {/* 넓은 화면: 전형 + 기관 이름 */}
              <span className={cn("mt-1 hidden flex-col gap-1 md:flex", isPast && "opacity-55")}>
                {d.items.slice(0, DESKTOP_MAX).map((it) => {
                  const m = EVENT_META[it.type];
                  return (
                    <Link
                      key={it.id}
                      href={`/companies/${it.companyId}`}
                      title={`${it.name} · ${it.label ?? m.label}${it.expected ? " (예상)" : ""}`}
                      className={cn(
                        "flex items-center gap-1 rounded-xs border-l-2 px-1.5 py-0.5 hover:brightness-95",
                        m.border,
                        it.expected ? "bg-canvas outline outline-1 -outline-offset-1 outline-dashed outline-hairline-input" : m.soft,
                      )}
                    >
                      <span className={cn("shrink-0 type-micro-cap", m.text)}>{m.short}</span>
                      <span className="truncate type-micro text-ink">{it.name}</span>
                    </Link>
                  );
                })}
                {d.items.length > DESKTOP_MAX && (
                  <Link href="/calendar" className="px-1 type-micro font-semibold text-primary-text hover:underline">
                    +{d.items.length - DESKTOP_MAX}개 더 보기
                  </Link>
                )}
                {d.items.length === 0 && <span className="px-1 type-micro text-ink-mute-2">일정 없음</span>}
              </span>

              {/* 휴대폰: 약칭만 */}
              <span className={cn("mt-0.5 flex flex-col gap-px md:hidden", isPast && "opacity-55")}>
                {d.items.slice(0, MOBILE_MAX).map((it) => {
                  const m = EVENT_META[it.type];
                  return (
                    <span
                      key={it.id}
                      className={cn(
                        "block truncate rounded-[3px] border-l-2 pr-0.5 pl-[3px] text-[10px] leading-[15px] tracking-[-0.02em] text-ink",
                        m.border,
                        it.expected ? "bg-canvas outline outline-1 -outline-offset-1 outline-dashed outline-hairline-input" : m.soft,
                      )}
                    >
                      {it.short}
                    </span>
                  );
                })}
                {d.items.length > MOBILE_MAX && <span className="text-center tabular text-[10px] leading-3 font-semibold text-primary-text">+{d.items.length - MOBILE_MAX}</span>}
              </span>
            </div>
          );
        })}
      </div>

      {/* 휴대폰: 고른 날 일정 전체 */}
      <div className="mt-3 md:hidden">
        <p className="type-caption font-semibold text-ink-secondary">
          {formatShort(activeDay.date)} 일정 {activeDay.items.length}건
        </p>
        {activeDay.items.length === 0 ? (
          <p className="mt-1 type-caption text-ink-mute">이 날은 일정이 없어요.</p>
        ) : (
          <ul className="mt-1 divide-y divide-hairline">
            {activeDay.items.slice(0, LIST_MAX).map((it) => (
              <li key={it.id}>
                <Link href={`/companies/${it.companyId}`} className="flex items-center gap-2 py-2">
                  <span className="min-w-0 flex-1 truncate type-body-md text-ink">
                    {it.name}
                    {it.expected && <span className="ml-1 type-caption text-ink-mute">(예상)</span>}
                  </span>
                  <EventTag type={it.type} label={it.label} size="sm" className="shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
        )}
        {activeDay.items.length > LIST_MAX && (
          <Link href="/calendar" className="btn btn-sm btn-toggle mt-2 w-full">
            {activeDay.items.length - LIST_MAX}건 더 — 캘린더에서 보기
          </Link>
        )}
      </div>

      {/* 색 안내 */}
      <p className="mt-3 flex flex-wrap gap-x-3 gap-y-1 type-micro text-ink-mute">
        {EVENT_FILTER_ORDER.map((t) => (
          <span key={t} className="inline-flex items-center gap-1">
            <span className={cn("h-2 w-2 rounded-full", EVENT_META[t].dot)} />
            {EVENT_META[t].label}
          </span>
        ))}
      </p>
    </section>
  );
}
