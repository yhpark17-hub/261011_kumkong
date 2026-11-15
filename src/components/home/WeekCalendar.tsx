"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { WEEKDAYS, dayOfWeek, ddayLabel, diffDays, formatShort, parseKey } from "@/lib/date";
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
  intern?: boolean;
  /** 일정 시작·끝 (며칠에 걸친 면접 기간 등) */
  start: string;
  end: string;
  /** 서류 마감만 — 공고명·마감 시각 ('다가오는 서류 마감' 줄) */
  title?: string;
  time?: string;
}

export interface WeekDay {
  date: string;
  items: WeekItem[];
}

/** 고른 날 아래에 바로 보여 줄 일정 수 (나머지는 '더 보기' 창) */
const DAY_MAX = 5;
/** '다가오는 서류 마감' 줄 수 */
const DOC_MAX = 3;

/** 위쪽 전형 버튼 — 누르면 그 전형만 (색 안내도 겸해요) */
const GROUPS = [
  { key: "doc", label: "서류 마감", types: ["doc"], dot: "bg-ev-doc" },
  { key: "written", label: "필기", types: ["written"], dot: "bg-ev-written" },
  { key: "interview", label: "면접", types: ["interview1", "interview2"], dot: "bg-ev-interview1" },
] as const satisfies readonly { key: string; label: string; types: readonly EventType[]; dot: string }[];
type GroupKey = (typeof GROUPS)[number]["key"];

const dowTone = (dow: number) => (dow === 0 ? "text-ruby" : dow === 6 ? "text-primary-text" : "text-ink-mute");
const shortDate = (key: string) => `${parseKey(key).m}.${parseKey(key).d}`;

/** 일정 한 줄 — 로고 · 기관 이름(· 회차) · 전형 꼬리표 */
function Row({ it }: { it: WeekItem }) {
  return (
    <Link href={`/companies/${it.companyId}`} className="group flex items-center gap-3 py-3">
      <CompanyAvatar company={{ id: it.companyId, shortName: it.short, avatar: it.avatar, logo: it.logo }} size="md" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] leading-5 font-bold text-ink group-hover:underline">{it.name}</span>
        <span className="mt-0.5 block truncate type-caption text-ink-mute">
          {it.start !== it.end ? `${shortDate(it.start)} – ${shortDate(it.end)} 기간 중 진행` : (it.label ?? EVENT_META[it.type].label)}
          {it.expected && " · 예상 일정"}
        </span>
      </span>
      <EventTag type={it.type} label={it.label ?? EVENT_META[it.type].label} size="sm" className="max-w-[40%] shrink-0 truncate" />
    </Link>
  );
}

/**
 * 홈: 이번 주(일~토, 달력에서 월요일 시작을 고르면 월~일) 채용 일정
 * - 위: 전형 버튼(서류 마감·필기·면접 곳 수) — 누르면 그 전형만
 * - 날짜 띠(전형 색 점) + 고른 날 일정 몇 줄, 많으면 '더 보기' 창
 * - 아래: 다가오는 서류 마감 (오늘부터, 이번 주·다음 주 안)
 */
export function WeekCalendar({ weeks, today }: { weeks: WeekDay[][]; today: string }) {
  const [w, setW] = useState(0);
  const [only, setOnly] = useState<GroupKey | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [sheetDay, setSheetDay] = useState<string | null>(null);
  const closeSheet = useCallback(() => setSheetDay(null), []);

  const types: readonly EventType[] | null = only ? GROUPS.find((g) => g.key === only)!.types : null;
  const filter = (d: WeekDay): WeekDay => (types ? { ...d, items: d.items.filter((it) => types.includes(it.type)) } : d);
  const days = weeks[w].map(filter);
  const allDays = weeks.flat().map(filter);
  const inWeek = days.some((d) => d.date === today);
  const active = picked && days.some((d) => d.date === picked) ? picked : inWeek ? today : (days.find((d) => d.items.length)?.date ?? days[0].date);
  const activeDay = days.find((d) => d.date === active)!;
  const sheetIdx = sheetDay ? allDays.findIndex((d) => d.date === sheetDay) : -1;
  const sheet = sheetIdx >= 0 ? allDays[sheetIdx] : null;

  // 곳 수는 전형 버튼을 눌러도 이 주 전체 기준
  const all = weeks[w].flatMap((d) => d.items);
  const count = (t: readonly EventType[]) => new Set(all.filter((it) => t.includes(it.type)).map((it) => it.companyId)).size;
  const typesOf = (d: WeekDay) => EVENT_FILTER_ORDER.filter((t) => d.items.some((it) => it.type === t)).slice(0, 3);

  // 다가오는 서류 마감 — 오늘(이후) 마감, 가까운 순 (같은 공고가 여러 날 칸에 들어가 있지 않게 id 로 한 번만)
  const docs = [...new Map(weeks.flat().flatMap((d) => d.items).filter((it) => it.type === "doc" && it.start >= today).map((it) => [it.id, it])).values()]
    .sort((a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : (a.time ?? "") < (b.time ?? "") ? -1 : 1))
    .slice(0, DOC_MAX);

  return (
    <section aria-labelledby="week-title" className="card flex flex-col p-5 shadow-level-1 md:p-7">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id="week-title" className="type-heading-lg text-ink">
            {w === 0 ? "이번 주" : "다음 주"} 채용 일정
          </h2>
          <p className="mt-0.5 tabular type-caption text-ink-mute">
            {formatShort(days[0].date)} – {formatShort(days[6].date)}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <button type="button" onClick={() => setW(0)} disabled={w === 0} aria-label="이번 주 보기" className="btn btn-icon btn-toggle disabled:opacity-35">
            <ChevronLeft className="h-4 w-4" strokeWidth={2.2} />
          </button>
          <button type="button" onClick={() => setW(1)} disabled={w === weeks.length - 1} aria-label="다음 주 보기" className="btn btn-icon btn-toggle disabled:opacity-35">
            <ChevronRight className="h-4 w-4" strokeWidth={2.2} />
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label="전형별로 보기">
        {GROUPS.map((g) => {
          const on = only === g.key;
          return (
            <button
              key={g.key}
              type="button"
              aria-pressed={on}
              onClick={() => setOnly(on ? null : g.key)}
              className={cn(
                "inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold transition-colors",
                on ? "bg-brand-dark text-on-primary" : "bg-canvas-soft text-ink-secondary hover:text-ink",
              )}
            >
              <span className={cn("h-2 w-2 rounded-full", g.dot, on && "ring-2 ring-on-primary/60")} />
              {g.label}
              <span className={cn("tabular font-bold", on ? "text-on-primary" : "text-ink")}>{count(g.types)}</span>
            </button>
          );
        })}
      </div>

      {/* 날짜 띠 */}
      <div className="mt-4 grid grid-cols-7 gap-1 md:gap-1.5" role="tablist" aria-label="날짜 고르기">
        {days.map((d) => {
          const dow = dayOfWeek(d.date);
          const on = d.date === active;
          const isToday = d.date === today;
          return (
            <button
              key={d.date}
              type="button"
              role="tab"
              aria-selected={on}
              aria-label={`${formatShort(d.date)} 일정 ${d.items.length}건`}
              onClick={() => setPicked(d.date)}
              className={cn(
                "flex flex-col items-center gap-1 rounded-2xl py-2 transition-colors md:py-2.5",
                on ? "bg-brand-dark text-on-primary" : isToday ? "bg-butter text-ink" : "bg-canvas-soft text-ink hover:bg-canvas-soft/60",
                d.date < today && !on && "opacity-55",
              )}
            >
              <span className={cn("type-micro font-semibold", !on && dowTone(dow))}>
                {WEEKDAYS[dow]}
                {isToday && <span className="max-md:hidden"> · 오늘</span>}
              </span>
              <span className="tabular text-[18px] leading-none font-extrabold">{parseKey(d.date).d}</span>
              <span className="flex h-1.5 gap-0.5">
                {typesOf(d).map((t) => (
                  <span key={t} className={cn("h-1.5 w-1.5 rounded-full", EVENT_META[t].dot, on && "ring-1 ring-on-primary/70")} />
                ))}
              </span>
            </button>
          );
        })}
      </div>

      {/* 고른 날 목록 */}
      <div className="mt-4">
        <p className="type-caption font-bold text-ink-secondary">
          {formatShort(activeDay.date)}
          {activeDay.date === today && " 오늘"} · 일정 {activeDay.items.length}건
        </p>
        {activeDay.items.length === 0 ? (
          <p className="py-5 type-body-md text-ink-mute">이 날은 일정이 없어요.</p>
        ) : (
          <ul className="divide-y divide-hairline">
            {activeDay.items.slice(0, DAY_MAX).map((it) => (
              <li key={it.id}>
                <Row it={it} />
              </li>
            ))}
          </ul>
        )}
        {activeDay.items.length > DAY_MAX && (
          <button type="button" onClick={() => setSheetDay(activeDay.date)} className="btn btn-sm btn-toggle mt-1 w-full">
            더 보기 · {activeDay.items.length - DAY_MAX}건 더
          </button>
        )}
      </div>

      {/* 다가오는 서류 마감 */}
      {docs.length > 0 && (
        <div className="mt-5 rounded-2xl bg-canvas-soft/70 px-4 pt-3 pb-1">
          <p className="type-caption font-bold text-ink-secondary">다가오는 서류 마감</p>
          <ul className="divide-y divide-hairline">
            {docs.map((it) => {
              const left = diffDays(today, it.start);
              return (
                <li key={it.id}>
                  <Link href={`/companies/${it.companyId}`} className="group flex items-center gap-3 py-2.5">
                    <CompanyAvatar company={{ id: it.companyId, shortName: it.short, avatar: it.avatar, logo: it.logo }} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span className="truncate text-[14px] leading-5 font-bold text-ink group-hover:underline">{it.name}</span>
                        {it.intern && <span className="tag shrink-0 bg-brand-dark text-on-primary">인턴</span>}
                      </span>
                      <span className="block truncate type-caption text-ink-mute">
                        {it.title ? `${it.title} · ` : ""}
                        {formatShort(it.start)}
                        {it.time ? ` ${it.time}` : ""}
                      </span>
                    </span>
                    <span className={cn("shrink-0 tabular text-[14px] font-extrabold", left <= 3 ? "text-ev-doc" : "text-ink")}>{ddayLabel(left)}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <Link href="/calendar" className="btn btn-sm btn-secondary mt-4 w-full">
        채용 캘린더에서 전체 보기
        <ArrowRight className="h-4 w-4" strokeWidth={2} />
      </Link>

      {/* 그날 일정 전체 — 아래에서 올라오는 창, 안에서 앞뒤 날로 넘기기 */}
      <Sheet
        open={!!sheet}
        onClose={closeSheet}
        title={sheet ? `${formatShort(sheet.date)} 일정 ${sheet.items.length}건` : ""}
        aside={
          sheet && (
            <span className="flex gap-1">
              <button type="button" onClick={() => setSheetDay(allDays[sheetIdx - 1]?.date ?? sheetDay)} disabled={sheetIdx <= 0} aria-label="전날" className="btn btn-icon btn-toggle disabled:opacity-35">
                <ChevronLeft className="h-4 w-4" strokeWidth={2} />
              </button>
              <button
                type="button"
                onClick={() => setSheetDay(allDays[sheetIdx + 1]?.date ?? sheetDay)}
                disabled={sheetIdx >= allDays.length - 1}
                aria-label="다음 날"
                className="btn btn-icon btn-toggle disabled:opacity-35"
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
