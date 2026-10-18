"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { ArrowRight, CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { WEEKDAYS, dayOfWeek, formatShort, parseKey } from "@/lib/date";
import { EVENT_FILTER_ORDER, EVENT_META } from "@/lib/meta";
import type { EventType } from "@/lib/types";
import { Sheet } from "../Sheet";
import { CompanyAvatar, EventTag, cn } from "../ui";

export interface WeekItem {
  id: string;
  companyId: string;
  name: string;
  short: string;
  logo?: string;
  avatar?: string;
  type: EventType;
  label?: string;
  expected: boolean;
}

export interface WeekDay {
  date: string;
  items: WeekItem[];
}

/** 넓은 화면 칸에 이름까지 보여 줄 일정 수 */
const DESKTOP_MAX = 5;
/** 휴대폰에서 고른 날 아래에 바로 보여 줄 수 (나머지는 '더 보기' 창) */
const MOBILE_MAX = 4;

/** 일정 한 줄 — 로고 · 기관 이름(· 회차) · 전형 꼬리표 */
function Row({ it }: { it: WeekItem }) {
  return (
    <Link href={`/companies/${it.companyId}`} className="flex items-center gap-3 py-2.5">
      <CompanyAvatar company={{ id: it.companyId, shortName: it.short, avatar: it.avatar, logo: it.logo }} size="sm" />
      <span className="min-w-0 flex-1">
        <span className="block truncate type-body-md font-semibold text-ink">{it.name}</span>
        {(it.label || it.expected) && (
          <span className="block truncate type-caption text-ink-mute">
            {it.label ?? EVENT_META[it.type].label}
            {it.expected && " · 예상 일정"}
          </span>
        )}
      </span>
      <EventTag type={it.type} size="sm" className="shrink-0" />
    </Link>
  );
}

/**
 * 홈: 이번 주(일~토) 채용 일정
 * - 휴대폰: 날짜 띠(전형 색 점) + 고른 날 일정 몇 줄, '더 보기'는 아래에서 올라오는 창
 * - 넓은 화면: 7칸 달력에 기관 이름, '+N개 더 보기'도 같은 창으로 (캘린더 페이지로 넘어가지 않게)
 */
export function WeekCalendar({ weeks, today }: { weeks: WeekDay[][]; today: string }) {
  const [w, setW] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [sheetDay, setSheetDay] = useState<string | null>(null);
  const closeSheet = useCallback(() => setSheetDay(null), []);

  const days = weeks[w];
  const allDays = weeks.flat();
  const inWeek = days.some((d) => d.date === today);
  const active = picked && days.some((d) => d.date === picked) ? picked : inWeek ? today : (days.find((d) => d.items.length)?.date ?? days[0].date);
  const activeDay = days.find((d) => d.date === active)!;
  const sheetIdx = sheetDay ? allDays.findIndex((d) => d.date === sheetDay) : -1;
  const sheet = sheetIdx >= 0 ? allDays[sheetIdx] : null;

  const all = days.flatMap((d) => d.items);
  const count = (t: EventType[]) => new Set(all.filter((it) => t.includes(it.type)).map((it) => it.id)).size;
  const typesOf = (d: WeekDay) => EVENT_FILTER_ORDER.filter((t) => d.items.some((it) => it.type === t)).slice(0, 3);

  return (
    <section aria-labelledby="week-title" className="card p-4 shadow-level-1 md:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 id="week-title" className="flex items-center gap-2 type-heading-md text-ink">
          <CalendarDays className="h-5 w-5 text-primary" strokeWidth={1.75} />
          {w === 0 ? "이번 주" : "다음 주"} 채용 일정
        </h2>
        <div className="flex items-center gap-1.5">
          <button type="button" onClick={() => setW(0)} disabled={w === 0} aria-label="이번 주 보기" className="btn btn-icon btn-toggle !h-8 !w-8 disabled:opacity-35">
            <ChevronLeft className="h-4 w-4" strokeWidth={2} />
          </button>
          <button type="button" onClick={() => setW(1)} disabled={w === weeks.length - 1} aria-label="다음 주 보기" className="btn btn-icon btn-toggle !h-8 !w-8 disabled:opacity-35">
            <ChevronRight className="h-4 w-4" strokeWidth={2} />
          </button>
          <Link href="/calendar" className="link ml-1 hidden items-center gap-1 type-caption md:inline-flex">
            캘린더 전체
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} />
          </Link>
        </div>
      </div>
      <p className="mt-1 type-caption text-ink-mute">
        <span className="tabular">
          {formatShort(days[0].date)} – {formatShort(days[6].date)}
        </span>{" "}
        · 서류 마감 <b className="tabular text-ink">{count(["doc"])}</b> · 필기 <b className="tabular text-ink">{count(["written"])}</b> · 면접{" "}
        <b className="tabular text-ink">{count(["interview1", "interview2"])}</b>
      </p>

      {/* ---------------- 휴대폰: 날짜 띠 + 고른 날 목록 ---------------- */}
      <div className="mt-3 grid grid-cols-7 gap-1 md:hidden" role="tablist" aria-label="날짜 고르기">
        {days.map((d) => {
          const dow = dayOfWeek(d.date);
          const on = d.date === active;
          return (
            <button
              key={d.date}
              type="button"
              role="tab"
              aria-selected={on}
              aria-label={`${formatShort(d.date)} 일정 ${d.items.length}건`}
              onClick={() => setPicked(d.date)}
              className={cn(
                "flex flex-col items-center gap-1 rounded-xl py-2 transition-colors",
                on ? "bg-brand-dark text-on-primary" : d.date === today ? "bg-ev-written-soft text-ink" : "bg-canvas-soft text-ink",
                d.date < today && !on && "opacity-55",
              )}
            >
              <span className={cn("type-micro", !on && (dow === 0 ? "text-ruby" : dow === 6 ? "text-primary-text" : "text-ink-mute"))}>{WEEKDAYS[dow]}</span>
              <span className="tabular text-[17px] leading-none font-bold">{parseKey(d.date).d}</span>
              <span className="flex h-1.5 gap-0.5">
                {typesOf(d).map((t) => (
                  <span key={t} className={cn("h-1.5 w-1.5 rounded-full", EVENT_META[t].dot, on && "ring-1 ring-on-primary/70")} />
                ))}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-3 md:hidden">
        <p className="type-caption font-semibold text-ink-secondary">
          {formatShort(activeDay.date)}
          {activeDay.date === today && " · 오늘"} · 일정 {activeDay.items.length}건
        </p>
        {activeDay.items.length === 0 ? (
          <p className="py-4 type-body-md text-ink-mute">이 날은 일정이 없어요.</p>
        ) : (
          <ul className="divide-y divide-hairline">
            {activeDay.items.slice(0, MOBILE_MAX).map((it) => (
              <li key={it.id}>
                <Row it={it} />
              </li>
            ))}
          </ul>
        )}
        {activeDay.items.length > MOBILE_MAX && (
          <button type="button" onClick={() => setSheetDay(activeDay.date)} className="btn btn-toggle mt-1 w-full">
            더 보기 · {activeDay.items.length - MOBILE_MAX}건 더
          </button>
        )}
      </div>

      {/* ---------------- 넓은 화면: 7칸 ---------------- */}
      <div className="mt-4 hidden grid-cols-7 overflow-hidden rounded-lg border border-hairline md:grid">
        {days.map((d) => {
          const dow = dayOfWeek(d.date);
          const isToday = d.date === today;
          return (
            <div key={d.date} className={cn("flex min-h-[176px] min-w-0 flex-col border-r border-hairline p-2 last:border-r-0", isToday && "bg-ev-written-soft/60")}>
              <span className="flex items-center gap-1 py-1">
                <span className={cn("type-caption", dow === 0 ? "text-ruby" : dow === 6 ? "text-primary-text" : "text-ink-mute")}>{WEEKDAYS[dow]}</span>
                <span
                  className={cn(
                    "inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1 tabular type-caption font-semibold",
                    isToday ? "bg-primary text-on-primary" : dow === 0 ? "text-ruby" : "text-ink",
                  )}
                >
                  {parseKey(d.date).d}
                </span>
              </span>
              <span className={cn("mt-1 flex flex-col gap-1", d.date < today && "opacity-55")}>
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
                  <button type="button" onClick={() => setSheetDay(d.date)} className="px-1 text-left type-micro font-semibold text-primary-text hover:underline">
                    +{d.items.length - DESKTOP_MAX}개 더 보기
                  </button>
                )}
                {d.items.length === 0 && <span className="px-1 type-micro text-ink-mute-2">일정 없음</span>}
              </span>
            </div>
          );
        })}
      </div>

      {/* 색 안내 (넓은 화면) */}
      <p className="mt-3 hidden flex-wrap gap-x-3 gap-y-1 type-micro text-ink-mute md:flex">
        {EVENT_FILTER_ORDER.map((t) => (
          <span key={t} className="inline-flex items-center gap-1">
            <span className={cn("h-2 w-2 rounded-full", EVENT_META[t].dot)} />
            {EVENT_META[t].label}
          </span>
        ))}
      </p>

      <Link href="/calendar" className="btn btn-sm btn-toggle mt-3 w-full md:hidden">
        채용 캘린더 전체 보기
      </Link>

      {/* 그날 일정 전체 — 아래에서 올라오는 창, 안에서 앞뒤 날로 넘기기 */}
      <Sheet
        open={!!sheet}
        onClose={closeSheet}
        title={sheet ? `${formatShort(sheet.date)} 일정 ${sheet.items.length}건` : ""}
        aside={
          sheet && (
            <span className="flex gap-1">
              <button type="button" onClick={() => setSheetDay(allDays[sheetIdx - 1]?.date ?? sheetDay)} disabled={sheetIdx <= 0} aria-label="전날" className="btn btn-icon btn-toggle !h-8 !w-8 disabled:opacity-35">
                <ChevronLeft className="h-4 w-4" strokeWidth={2} />
              </button>
              <button
                type="button"
                onClick={() => setSheetDay(allDays[sheetIdx + 1]?.date ?? sheetDay)}
                disabled={sheetIdx >= allDays.length - 1}
                aria-label="다음 날"
                className="btn btn-icon btn-toggle !h-8 !w-8 disabled:opacity-35"
              >
                <ChevronRight className="h-4 w-4" strokeWidth={2} />
              </button>
            </span>
          )
        }
      >
        {sheet && sheet.items.length === 0 ? (
          <p className="py-6 text-center type-body-md text-ink-mute">이 날은 일정이 없어요.</p>
        ) : (
          <ul className="divide-y divide-hairline">
            {sheet?.items.map((it) => (
              <li key={it.id}>
                <Row it={it} />
              </li>
            ))}
          </ul>
        )}
      </Sheet>
    </section>
  );
}
