"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, ChevronDown, ChevronRight, Flame, Lock, X } from "lucide-react";
import { AD_SLOTS } from "@/lib/site";
import { WEEKDAYS, dayOfWeek, ddayLabel, diffDays, formatShort, parseKey } from "@/lib/date";
import { PRIORITY_DAYS, difficultyWord, resultsPublicFrom, type ExamSummary } from "@/lib/review-meta";
import type { Category } from "@/lib/types";
import { AdSlot } from "../ads/AdSlot";
import { CompanyAvatar, cn } from "../ui";
import { DifficultyMeter } from "./DifficultyMeter";
import { useReviewsQuery } from "./ReviewsSearch";

/** 목록에 필요한 만큼만 담은 시험 정보 */
export interface ExamCardData {
  id: string;
  companyId: string;
  companyName: string;
  shortName: string;
  avatar?: string;
  logo?: string;
  date: string;
  label: string;
  category: Category;
  expected: boolean;
}

type Summaries = Record<string, ExamSummary>;
type Activity = Record<string, { today: number; lastHour: number; lastMinutesAgo: number | null }>;

/** 시험 후 이 날수까지는 '지금 후기 받는 중' — 후기가 가장 많이 들어오는 때 */
const RECENT_DAYS = 7;
/** '지금 후기 받는 중'에 처음 보여 줄 줄 수 */
const NOW_MAX = 8;
/** '후기가 많이 모인 시험' 카드 수 */
const TOP_MAX = 6;
/** '다가오는 필기' 줄 수 */
const UPCOMING_MAX = 4;

function normalize(s: string) {
  return s.replace(/\s+/g, "").toLowerCase();
}

/** "10/20" — 요약(전체 체감 난이도)이 누구에게나 열리는 날 */
function publicDay(date: string): string {
  const { m, d } = parseKey(resultsPublicFrom(date));
  return `${m}/${d}`;
}

/** 내가 후기를 남긴 시험 표시 */
function MineTag({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex shrink-0 items-center gap-0.5 rounded-full bg-brand-dark px-2 py-0.5 type-micro font-semibold text-on-primary", className)}>
      <Check className="h-3 w-3" strokeWidth={2.5} />내 후기
    </span>
  );
}

const avatarOf = (e: ExamCardData) => ({ id: e.companyId, shortName: e.shortName, avatar: e.avatar, logo: e.logo });

/** 상태 한 마디 — 줄 오른쪽 (버튼 없이 글자만) */
function Status({ e, sum, activity, today }: { e: ExamCardData; sum?: ExamSummary; activity?: Activity[string]; today: string }) {
  const n = sum?.n ?? 0;
  if (sum?.mine) return <MineTag />;
  if (e.date === today)
    return (
      <span className="shrink-0 text-right text-[13px] leading-4 font-bold text-lemon">
        {n ? (
          <>
            <span className="tabular">{n}명</span> 참여 중
          </>
        ) : (
          "첫 후기를 남겨 주세요"
        )}
      </span>
    );
  if (sum?.locked)
    return (
      <span className="inline-flex shrink-0 items-center gap-1 text-[13px] text-ink-mute">
        <Lock className="h-3.5 w-3.5" strokeWidth={2} />
        {n ? <span className="tabular font-bold text-ink">{n}명</span> : null}
        {n ? " · " : ""}난이도 {publicDay(e.date)} 공개
      </span>
    );
  if (n)
    return (
      <span className="shrink-0 text-[13px] text-ink-secondary">
        <b className="tabular font-extrabold text-ink">{n}명</b> · {difficultyWord(sum?.avg ?? null)}
        {(activity?.today ?? 0) > 0 && (
          <span className="ml-1.5 inline-flex items-center gap-0.5 font-bold text-ruby">
            <Flame className="h-3 w-3" strokeWidth={2.2} />
            오늘 {activity!.today}
          </span>
        )}
      </span>
    );
  return <span className="shrink-0 text-[13px] text-ink-mute">첫 후기를 기다려요</span>;
}

/** '지금 후기 받는 중' 한 줄 — 오늘 시험은 버터색 줄 */
function NowRow({ e, sum, activity, today }: { e: ExamCardData; sum?: ExamSummary; activity?: Activity[string]; today: string }) {
  const isToday = e.date === today;
  return (
    <Link
      href={`/reviews/${e.id}`}
      className={cn(
        "group flex items-center gap-3 md:gap-3.5",
        isToday ? "-mx-2 rounded-lg bg-accent-soft/50 px-3 py-3 md:-mx-3 md:px-4" : "px-1 py-3",
      )}
    >
      <CompanyAvatar company={avatarOf(e)} />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="truncate text-[15px] leading-5 font-bold text-ink group-hover:underline md:text-[16px]">{e.companyName}</span>
          {isToday && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-canvas px-2 py-0.5 text-[11px] leading-4 font-extrabold text-ruby">
              <span className="h-1.5 w-1.5 rounded-full bg-ruby motion-safe:animate-pulse" aria-hidden />
              오늘 시험
            </span>
          )}
        </span>
        <span className="mt-0.5 block truncate type-caption text-ink-mute">
          {e.label} · {formatShort(e.date)}
        </span>
      </span>
      <span className="max-sm:hidden">
        <Status e={e} sum={sum} activity={activity} today={today} />
      </span>
      {/* 휴대폰: 참여 수만 짧게 (없으면 비워 둬요) */}
      <span className="shrink-0 sm:hidden">
        {sum?.mine ? (
          <MineTag />
        ) : (sum?.n ?? 0) > 0 ? (
          <span className="tabular text-[13px] font-extrabold text-ink">
            {sum!.n}
            <span className="ml-0.5 font-medium text-ink-mute">명</span>
          </span>
        ) : null}
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-ink-mute/70 group-hover:text-ink" strokeWidth={2.2} />
    </Link>
  );
}

/** 후기가 많이 모인 시험 카드 — 체감 한 단어(크게) · 막대 · 참여 수 */
function TopCard({ e, sum }: { e: ExamCardData; sum: ExamSummary }) {
  return (
    <Link href={`/reviews/${e.id}`} className="group card flex flex-col gap-4 p-5 shadow-level-1 transition-shadow hover:shadow-level-2">
      <span className="flex items-center gap-3">
        <CompanyAvatar company={avatarOf(e)} />
        <span className="min-w-0">
          <span className="block truncate text-[16px] leading-5 font-extrabold text-ink group-hover:underline">{e.companyName}</span>
          <span className="mt-0.5 block truncate type-caption text-ink-mute">
            {e.label} · {formatShort(e.date)}
          </span>
        </span>
        {sum.mine && <MineTag className="ml-auto" />}
      </span>
      <span className="flex items-end justify-between gap-3">
        <span>
          <span className="block text-[12px] font-bold text-ink-mute">체감</span>
          <span className="flex items-center gap-2.5">
            <span className="font-display font-extrabold tracking-[-0.03em] text-[24px] leading-tight text-ink">{difficultyWord(sum.avg)}</span>
            <DifficultyMeter avg={sum.avg} className="w-[78px]" />
          </span>
        </span>
        <span className="tabular text-[20px] leading-tight font-extrabold text-ink">
          {sum.n}
          <span className="ml-0.5 text-[13px] font-semibold text-ink-mute">명</span>
        </span>
      </span>
    </Link>
  );
}

/** 한 줄 — 날짜 · 로고 · 기관 · 참여 수 (검색 결과, 지난 필기 전체) */
function ExamRow({ exam: e, sum, today }: { exam: ExamCardData; sum?: ExamSummary; today: string }) {
  const { m, d } = parseKey(e.date);
  const dow = dayOfWeek(e.date);
  const n = sum?.n ?? 0;
  const upcoming = e.date > today;
  return (
    <Link href={`/reviews/${e.id}`} className="group flex items-center gap-3 px-1 py-3">
      <span className="w-11 shrink-0 text-center leading-tight whitespace-nowrap">
        <span className="block tabular text-[15px] font-extrabold text-ink">
          {m}.{d}
        </span>
        <span className={cn("block type-micro font-semibold", dow === 0 ? "text-ruby" : dow === 6 ? "text-primary-text" : "text-ink-mute")}>{WEEKDAYS[dow]}</span>
      </span>
      <CompanyAvatar company={avatarOf(e)} size="sm" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] leading-5 font-bold text-ink group-hover:underline">{e.companyName}</span>
        <span className="block truncate type-caption text-ink-mute">
          {e.label}
          {n > 0 && sum?.avg != null && !sum.locked && ` · 체감 ${difficultyWord(sum.avg)}`}
          {e.expected && " · 예상"}
        </span>
      </span>
      {sum?.mine ? (
        <MineTag />
      ) : upcoming ? (
        <span className="shrink-0 rounded-full bg-ev-written-soft px-2.5 py-1 tabular text-[12px] font-bold text-ev-written">{ddayLabel(diffDays(today, e.date))}</span>
      ) : n > 0 ? (
        <span className="shrink-0 tabular text-[13px] font-extrabold text-ink">
          {n}
          <span className="ml-0.5 font-medium text-ink-mute">명</span>
        </span>
      ) : null}
    </Link>
  );
}

/**
 * 필기 후기 목록 (2026-11-15 '덜 피곤하게')
 * - 위 배너의 큰 검색창 하나로 찾기 (분류 칩·달 칩 없음)
 * - 지금 후기 받는 중: 오늘 + 최근 일주일을 한 목록으로, 줄마다 버튼 없이 줄 전체를 눌러요
 * - 후기가 많이 모인 시험: 읽을거리가 있는 시험만 카드 6개
 * - 지난 필기 전체는 '모두 보기'를 눌렀을 때만 달별로 펼쳐요
 */
export function ExamBrowser({
  past,
  upcoming,
  summaries,
  activity,
  today,
}: {
  past: ExamCardData[];
  upcoming: ExamCardData[];
  summaries: Summaries;
  activity: Activity;
  today: string;
}) {
  const { query, setQuery } = useReviewsQuery();
  const [showAllNow, setShowAllNow] = useState(false);
  const [showPast, setShowPast] = useState(false);
  const q = normalize(query);
  const n = (e: ExamCardData) => summaries[e.id]?.n ?? 0;

  // 지금 후기 받는 중: 오늘(후기 많은 곳부터) → 최근 일주일(최근 날짜, 같은 날이면 후기 많은 곳부터)
  const live = past.filter((e) => e.date === today).sort((a, b) => n(b) - n(a));
  const recent = past
    .filter((e) => e.date < today && diffDays(e.date, today) <= RECENT_DAYS)
    .sort((a, b) => (a.date !== b.date ? (a.date < b.date ? 1 : -1) : n(b) - n(a)));
  const now = [...live, ...recent];
  const older = past.filter((e) => diffDays(e.date, today) > RECENT_DAYS);
  // 후기가 많이 모인 시험 (요약이 열린 시험만)
  const top = older.filter((e) => n(e) > 0 && !summaries[e.id]?.locked).sort((a, b) => n(b) - n(a)).slice(0, TOP_MAX);
  const next = upcoming.slice(0, UPCOMING_MAX);

  // 지난 필기: 달별로 묶기 (이미 최근 순)
  const months: { key: string; label: string; items: ExamCardData[]; reviews: number }[] = [];
  for (const e of older) {
    const key = e.date.slice(0, 7);
    let g = months.at(-1);
    if (g?.key !== key) {
      const { y, m } = parseKey(e.date);
      g = { key, label: y === parseKey(today).y ? `${m}월` : `${y}년 ${m}월`, items: [], reviews: 0 };
      months.push(g);
    }
    g.items.push(e);
    g.reviews += n(e);
  }

  // ── 검색 중: 결과 목록만
  if (q) {
    const hits = [...upcoming, ...past.slice().sort((a, b) => (a.date < b.date ? 1 : -1))].filter((e) => normalize(`${e.companyName}${e.shortName}`).includes(q));
    return (
      <section aria-labelledby="search-title" className="mt-6 md:mt-8">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h2 id="search-title" className="type-heading-md text-ink">
            ‘{query.trim()}’ 시험 <span className="tabular text-primary-text">{hits.length}</span>개
          </h2>
          <button type="button" onClick={() => setQuery("")} className="link inline-flex items-center gap-0.5 type-caption">
            <X className="h-3.5 w-3.5" strokeWidth={2} />
            검색 지우기
          </button>
        </div>
        {hits.length === 0 ? (
          <p className="mt-4 rounded-xl bg-canvas-soft px-6 py-10 text-center type-body-md text-ink-mute">
            찾는 기관이 없어요. 기관 이름을 줄여서(예: 수은, 기보) 찾아보세요.
          </p>
        ) : (
          <ul className="card mt-4 divide-y divide-hairline px-4 shadow-level-1 md:px-6">
            {hits.map((e) => (
              <li key={e.id}>
                <ExamRow exam={e} sum={summaries[e.id]} today={today} />
              </li>
            ))}
          </ul>
        )}
      </section>
    );
  }

  return (
    <>
      <div className="mt-6 grid items-start gap-5 md:mt-8 md:gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
        {/* 지금 후기 받는 중 */}
        <section aria-labelledby="now-title" className="card px-5 pt-5 pb-2 shadow-level-1 md:px-7 md:pt-6">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
            <h2 id="now-title" className="type-heading-md text-ink">
              지금 후기 받는 중
            </h2>
            <span className="type-caption text-ink-mute">
              최근 일주일{now.length > 0 && ` · 시험 ${now.length}개`}
            </span>
          </div>
          {now.length === 0 ? (
            <p className="py-6 type-body-md text-ink-mute">
              최근 일주일 동안 치러진 필기가 없어요.
              {next[0] && (
                <>
                  {" "}
                  다음 시험은 <b className="text-ink">{next[0].companyName}</b> {formatShort(next[0].date)}
                  {next[0].expected && " (예상)"}이에요.
                </>
              )}
            </p>
          ) : (
            <ul className="mt-2 divide-y divide-hairline">
              {(showAllNow ? now : now.slice(0, NOW_MAX)).map((e) => (
                <li key={e.id} className={cn(e.date === today && "border-none")}>
                  <NowRow e={e} sum={summaries[e.id]} activity={activity[e.id]} today={today} />
                </li>
              ))}
            </ul>
          )}
          {now.length > NOW_MAX && (
            <button type="button" onClick={() => setShowAllNow(!showAllNow)} className="btn btn-sm btn-toggle mb-3 w-full">
              {showAllNow ? "접기" : `${now.length - NOW_MAX}개 더 보기`}
            </button>
          )}
        </section>

        {/* 오른쪽: 다가오는 필기 + 쓰는 법 두 줄 */}
        <div className="space-y-4">
          {next.length > 0 && (
            <section aria-labelledby="next-title" className="card px-5 pt-5 pb-2 shadow-level-1 md:px-6">
              <h2 id="next-title" className="type-heading-sm text-ink">
                다가오는 필기
              </h2>
              <p className="mt-0.5 type-caption text-ink-mute">시험 당일부터 후기를 남길 수 있어요.</p>
              <ul className="mt-1 divide-y divide-hairline">
                {next.map((e) => (
                  <li key={e.id}>
                    <Link href={`/reviews/${e.id}`} className="group flex items-center gap-3 py-3">
                      <span className="w-12 shrink-0 rounded-full bg-ev-written-soft py-1 text-center tabular text-[12px] font-extrabold text-ev-written">
                        {ddayLabel(diffDays(today, e.date))}
                      </span>
                      <CompanyAvatar company={avatarOf(e)} size="sm" />
                      <span className="min-w-0">
                        <span className="block truncate text-[15px] leading-5 font-bold text-ink group-hover:underline">{e.companyName}</span>
                        <span className="block truncate type-caption text-ink-mute">
                          {e.label} · {formatShort(e.date)}
                          {e.expected && " · 예상"}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
          <div className="px-2">
            <p className="text-[14px] font-extrabold text-ink">후기는 이렇게 쓰여요</p>
            <p className="mt-1.5 type-caption leading-relaxed text-ink-secondary">
              전체 난이도·시간 여유·못 푼 문항 수를 고르면 끝이에요. 남기면 다른 응시자의 결과가 바로 열리고, 전체 난이도는 시험 {PRIORITY_DAYS}일 뒤
              누구에게나 공개돼요.
            </p>
          </div>
        </div>
      </div>

      {/* 후기가 많이 모인 시험 */}
      {top.length > 0 && (
        <section aria-labelledby="top-title" className="mt-10 md:mt-12">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
            <h2 id="top-title" className="type-heading-lg text-ink">
              후기가 많이 모인 시험
            </h2>
            <span className="type-caption text-ink-mute">체감 난이도는 응시자 투표를 모은 값이에요</span>
          </div>
          <div className="mt-4 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            {top.map((e) => (
              <TopCard key={e.id} e={e} sum={summaries[e.id]} />
            ))}
          </div>
        </section>
      )}

      {/* 지난 필기 전체 — 누를 때만 펼쳐요 */}
      {older.length > 0 && (
        <div className="mt-8 flex flex-col items-center gap-1.5">
          <button type="button" aria-expanded={showPast} onClick={() => setShowPast(!showPast)} className="btn btn-secondary">
            {showPast ? "지난 필기 접기" : `지난 필기 ${older.length}개 모두 보기`}
            <ChevronDown className={cn("h-4 w-4 transition-transform", showPast && "rotate-180")} strokeWidth={2.2} />
          </button>
          {!showPast && <span className="type-caption text-ink-mute">달별로 나눠서 찾아볼 수 있어요</span>}
        </div>
      )}
      {showPast && (
        <section aria-label="지난 필기" className="mt-6">
          {months.length > 1 && (
            <nav aria-label="달로 이동" className="no-scrollbar fade-x -mx-4 flex gap-1.5 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0 md:fade-x-none">
              {months.map((g) => (
                <a key={g.key} href={`#exams-${g.key}`} className="btn btn-sm btn-toggle shrink-0">
                  {g.label} <span className="tabular font-medium text-ink-mute">{g.items.length}</span>
                </a>
              ))}
            </nav>
          )}
          <div className="mt-5 space-y-6">
            {months.map((g) => (
              <div key={g.key} id={`exams-${g.key}`} className="scroll-mt-24">
                <h3 className="flex items-baseline gap-2 px-1">
                  <span className="type-heading-sm text-ink">{g.label}</span>
                  <span className="type-caption text-ink-mute">
                    시험 <span className="tabular">{g.items.length}</span>개
                    {g.reviews > 0 && (
                      <>
                        {" "}
                        · 후기 <span className="tabular">{g.reviews}</span>명
                      </>
                    )}
                  </span>
                </h3>
                <ul className="card mt-2 grid divide-y divide-hairline px-4 shadow-level-1 md:px-6 lg:grid-cols-2 lg:gap-x-8 lg:divide-y-0">
                  {g.items.map((e) => (
                    <li key={e.id} className="lg:border-b lg:border-hairline">
                      <ExamRow exam={e} sum={summaries[e.id]} today={today} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      <AdSlot slot={AD_SLOTS.inArticle} variant="inarticle" className="mt-12" />
    </>
  );
}
