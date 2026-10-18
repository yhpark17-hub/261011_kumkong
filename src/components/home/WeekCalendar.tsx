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
  /** 일정 시작·끝 (며칠에 걸친 면접 기간 등) */
  start: string;
  end: string;
}

export interface WeekDay {
  date: string;
  items: WeekItem[];
}

/** 넓은 화면 칸에 보여 줄 하루 일정 수 (나머지는 '더 보기' 창) */
const DESKTOP_MAX = 4;
/** 넓은 화면: 며칠 이어지는 일정 막대 줄 수 (넘치면 날짜 칸으로) */
const SPAN_LANES = 4;
/** 휴대폰에서 고른 날 아래에 바로 보여 줄 수 (나머지는 '더 보기' 창) */
const MOBILE_MAX = 4;

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
    <Link href={`/companies/${it.companyId}`} className="flex items-center gap-3 py-2.5">
      <CompanyAvatar company={{ id: it.companyId, shortName: it.short, avatar: it.avatar, logo: it.logo }} size="sm" />
      <span className="min-w-0 flex-1">
        <span className="block truncate type-body-md font-semibold text-ink">{it.name}</span>
        {(it.label || it.expected || it.start !== it.end) && (
          <span className="block truncate type-caption text-ink-mute">
            {it.label ?? EVENT_META[it.type].label}
            {it.start !== it.end && ` · ${shortDate(it.start)}–${shortDate(it.end)}`}
            {it.expected && " · 예상 일정"}
          </span>
        )}
      </span>
      <EventTag type={it.type} size="sm" className="shrink-0" />
    </Link>
  );
}

/** 넓은 화면 날짜 칸의 일정 — 작은 로고 + 기관 이름, 아래 줄에 전형(색) */
function Cell({ it }: { it: WeekItem }) {
  const m = EVENT_META[it.type];
  return (
    <Link
      href={`/companies/${it.companyId}`}
      title={`${it.name} · ${it.label ?? m.label}${it.expected ? " (예상)" : ""}`}
      className={cn(
        "group flex items-center gap-2 rounded-lg px-1.5 py-1.5 transition-colors hover:bg-canvas",
        it.expected && "outline outline-1 -outline-offset-1 outline-dashed outline-hairline-input",
      )}
    >
      <CompanyAvatar company={{ id: it.companyId, shortName: it.short, avatar: it.avatar, logo: it.logo }} size="xs" />
      <span className="min-w-0 flex-1 leading-tight">
        <span className="block truncate type-caption font-semibold text-ink group-hover:underline">{it.name}</span>
        <span className={cn("block truncate type-micro font-semibold", m.text)}>{it.label ?? m.label}</span>
      </span>
    </Link>
  );
}

interface Span {
  it: WeekItem;
  /** 이번 주 안 시작·끝 칸 (0~6) */
  s: number;
  e: number;
  lane: number;
}

/** 이번 주 안에서 이틀 넘게 이어지는 일정을 막대 줄에 나눠 담기 (먼저 시작·긴 것부터) */
function layoutSpans(days: WeekDay[]): Span[] {
  const seen = new Map<string, { it: WeekItem; s: number; e: number }>();
  days.forEach((d, i) =>
    d.items.forEach((it) => {
      const x = seen.get(it.id);
      if (x) x.e = i;
      else seen.set(it.id, { it, s: i, e: i });
    }),
  );
  const multi = [...seen.values()].filter((x) => x.e > x.s).sort((a, b) => a.s - b.s || b.e - b.s - (a.e - a.s));
  const laneEnds: number[] = [];
  const out: Span[] = [];
  for (const x of multi) {
    let lane = laneEnds.findIndex((end) => end < x.s);
    if (lane < 0) {
      if (laneEnds.length >= SPAN_LANES) continue;
      lane = laneEnds.length;
      laneEnds.push(x.e);
    } else laneEnds[lane] = x.e;
    out.push({ ...x, lane });
  }
  return out;
}

/**
 * 홈: 이번 주(일~토) 채용 일정
 * - 위: 전형 버튼(서류 마감·필기·면접 건수) — 누르면 그 전형만
 * - 휴대폰: 날짜 띠(전형 색 점) + 고른 날 일정 몇 줄, '더 보기'는 아래에서 올라오는 창
 * - 넓은 화면: 며칠 이어지는 면접 기간은 막대 한 줄로, 하루 일정은 로고와 함께 날짜 칸에
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

  // 건수는 전형 버튼을 눌러도 이 주 전체 기준
  const all = weeks[w].flatMap((d) => d.items);
  const count = (t: readonly EventType[]) => new Set(all.filter((it) => t.includes(it.type)).map((it) => it.id)).size;
  const typesOf = (d: WeekDay) => EVENT_FILTER_ORDER.filter((t) => d.items.some((it) => it.type === t)).slice(0, 3);

  const spans = layoutSpans(days);
  const lanes = spans.reduce((n, x) => Math.max(n, x.lane + 1), 0);
  const inSpan = new Set(spans.map((x) => x.it.id));

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

      <div className="mt-1 flex flex-col gap-2.5 md:mt-2 md:flex-row md:items-center md:justify-between">
        <p className="tabular type-caption text-ink-mute">
          {formatShort(days[0].date)} – {formatShort(days[6].date)}
        </p>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="전형별로 보기">
          {GROUPS.map((g) => {
            const on = only === g.key;
            return (
              <button
                key={g.key}
                type="button"
                aria-pressed={on}
                onClick={() => setOnly(on ? null : g.key)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 type-caption font-semibold transition-colors",
                  on ? "border-transparent bg-brand-dark text-on-primary" : "border-hairline bg-canvas text-ink-secondary hover:border-hairline-input hover:text-ink",
                )}
              >
                <span className={cn("h-2 w-2 rounded-full", g.dot, on && "ring-2 ring-on-primary/60")} />
                {g.label}
                <span className={cn("tabular", on ? "text-on-primary" : "text-ink")}>{count(g.types)}</span>
              </button>
            );
          })}
        </div>
      </div>

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
              <span className={cn("type-micro", !on && dowTone(dow))}>{WEEKDAYS[dow]}</span>
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

      {/* ---------------- 넓은 화면: 7칸 (머리 · 이어지는 일정 막대 · 하루 일정) ---------------- */}
      <div
        className="mt-4 hidden grid-cols-7 overflow-hidden rounded-xl border border-hairline md:grid"
        style={{ gridTemplateRows: `auto repeat(${lanes}, auto) 1fr` }}
      >
        {/* 칸 바탕: 세로 줄 · 오늘 · 주말 */}
        {days.map((d, i) => {
          const dow = dayOfWeek(d.date);
          return (
            <div
              key={`bg-${d.date}`}
              aria-hidden
              style={{ gridColumn: i + 1, gridRow: "1 / -1" }}
              className={cn(
                i < 6 && "border-r border-hairline",
                d.date === today ? "bg-ev-written-soft/70" : dow === 0 || dow === 6 ? "bg-canvas-soft/70" : "bg-canvas",
              )}
            />
          );
        })}

        {/* 날짜 머리 */}
        {days.map((d, i) => {
          const dow = dayOfWeek(d.date);
          const isToday = d.date === today;
          return (
            <div
              key={`head-${d.date}`}
              style={{ gridColumn: i + 1, gridRow: 1 }}
              className={cn("relative flex items-center gap-1.5 border-b border-hairline px-2.5 py-2", d.date < today && "opacity-55")}
            >
              <span className={cn("type-caption font-semibold", dowTone(dow))}>{WEEKDAYS[dow]}</span>
              <span
                className={cn(
                  "inline-flex h-7 min-w-7 items-center justify-center rounded-full px-1 tabular type-body-md font-bold",
                  isToday ? "bg-primary text-on-primary" : dow === 0 ? "text-ruby" : "text-ink",
                )}
              >
                {parseKey(d.date).d}
              </span>
              {isToday && <span className="type-micro font-semibold text-primary-text">오늘</span>}
              {d.items.length > 0 && <span className="ml-auto tabular type-micro text-ink-mute">{d.items.length}건</span>}
            </div>
          );
        })}

        {/* 며칠 이어지는 일정 — 막대 한 줄 */}
        {spans.map(({ it, s, e, lane }) => {
          const m = EVENT_META[it.type];
          const fromBefore = it.start < days[0].date;
          const toAfter = it.end > days[6].date;
          return (
            <Link
              key={`span-${it.id}`}
              href={`/companies/${it.companyId}`}
              title={`${it.name} · ${it.label ?? m.label} · ${shortDate(it.start)}–${shortDate(it.end)}${it.expected ? " (예상)" : ""}`}
              style={{ gridColumn: `${s + 1} / ${e + 2}`, gridRow: lane + 2 }}
              className={cn(
                "relative mt-1.5 flex min-w-0 items-center gap-1.5 py-1 pr-2 pl-1.5 hover:brightness-95",
                m.soft,
                // 지난주부터 이어지면 왼쪽, 다음 주로 이어지면 오른쪽 끝을 칸 끝까지 (둥글리지 않음)
                fromBefore ? "ml-0" : cn("ml-1.5 rounded-l-md border-l-[3px]", m.border),
                toAfter ? "mr-0" : "mr-1.5 rounded-r-md",
                it.expected && "outline outline-1 -outline-offset-1 outline-dashed outline-hairline-input",
              )}
            >
              <CompanyAvatar company={{ id: it.companyId, shortName: it.short, avatar: it.avatar, logo: it.logo }} size="xs" />
              <span className="truncate type-caption font-semibold text-ink">{it.name}</span>
              <span className={cn("shrink-0 type-micro font-semibold", m.text)}>{it.label ?? m.label}</span>
              <span className="ml-auto shrink-0 pl-2 tabular type-micro text-ink-mute">
                {fromBefore && "← "}
                {shortDate(it.start)}–{shortDate(it.end)}
                {toAfter && " →"}
              </span>
            </Link>
          );
        })}

        {/* 하루 일정 */}
        {days.map((d, i) => {
          const list = d.items.filter((it) => !inSpan.has(it.id));
          return (
            <div
              key={`day-${d.date}`}
              style={{ gridColumn: i + 1, gridRow: lanes + 2 }}
              className={cn("relative flex min-h-[148px] min-w-0 flex-col gap-0.5 p-1.5", lanes > 0 && "pt-2", d.date < today && "opacity-55")}
            >
              {list.slice(0, DESKTOP_MAX).map((it) => (
                <Cell key={it.id} it={it} />
              ))}
              {list.length > DESKTOP_MAX && (
                <button
                  type="button"
                  onClick={() => setSheetDay(d.date)}
                  className="mx-1.5 mt-0.5 rounded-md py-1 text-left type-micro font-semibold text-primary-text hover:bg-canvas hover:underline"
                >
                  +{list.length - DESKTOP_MAX}개 더 보기
                </button>
              )}
              {d.items.length === 0 && <span className="m-auto type-micro text-ink-mute-2">일정 없음</span>}
            </div>
          );
        })}
      </div>

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
