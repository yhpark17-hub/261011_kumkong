"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, CalendarClock, Check, Flame, Lock, PenLine, Search, X } from "lucide-react";
import { AD_SLOTS } from "@/lib/site";
import { WEEKDAYS, dayOfWeek, ddayLabel, diffDays, formatShort, parseKey } from "@/lib/date";
import { difficultyWord, resultsPublicFrom, type ExamSummary } from "@/lib/review-meta";
import type { Category } from "@/lib/types";
import { AdSlot } from "../ads/AdSlot";
import { CategoryChips, type CategoryFilter } from "../CategoryChips";
import { Card, CompanyAvatar, cn } from "../ui";
import { DifficultyMeter } from "./DifficultyMeter";

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

const UPCOMING_LIMIT = 12;
/** 시험 후 이 날수까지는 큰 카드로 — 후기가 가장 많이 들어오는 때 */
const RECENT_DAYS = 7;

function normalize(s: string) {
  return s.replace(/\s+/g, "").toLowerCase();
}

function agoLabel(min: number | null): string | null {
  if (min == null) return null;
  if (min < 1) return "방금 전";
  if (min < 60) return `${min}분 전`;
  if (min < 60 * 24) return `${Math.floor(min / 60)}시간 전`;
  return null;
}

/** "10/20" — 응시자 우선 공개가 끝나는 날 */
function publicDay(date: string): string {
  const { m, d } = parseKey(resultsPublicFrom(date));
  return `${m}/${d}`;
}

/** 빨간 점이 숨 쉬듯 깜빡이는 LIVE 표시 */
function LiveDot({ className }: { className?: string }) {
  return (
    <span className={cn("relative inline-flex h-2.5 w-2.5", className)} aria-hidden>
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ruby opacity-60 motion-reduce:animate-none" />
      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-ruby" />
    </span>
  );
}

/** 내가 후기를 남긴 시험 표시 */
function MineTag({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex shrink-0 items-center gap-0.5 rounded-full bg-primary px-2 py-0.5 type-micro font-semibold text-on-primary", className)}>
      <Check className="h-3 w-3" strokeWidth={2.5} />내 후기
    </span>
  );
}

/**
 * 필기 후기 목록 — 오늘 시험(LIVE) → 최근 일주일(큰 카드) → 지난 필기(달별 한 줄 목록) → 다가오는 시험
 * 지난 시험은 지우지 않고 한 줄씩 촘촘하게: 내려 보다가 '나 이거 봤는데' 하고 바로 누를 수 있게.
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
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [query, setQuery] = useState("");
  const q = normalize(query);
  const filtering = category !== "all" || q !== "";

  const match = (e: ExamCardData) =>
    (category === "all" || e.category === category) &&
    (!q || normalize(`${e.companyName}${e.shortName}`).includes(q));

  // 칩 숫자는 기관 수가 아니라 (지난 + 다가오는) 시험 수
  const categoryCounts = useMemo(() => {
    const out: Partial<Record<Category, number>> = {};
    for (const e of [...past, ...upcoming]) out[e.category] = (out[e.category] ?? 0) + 1;
    return out;
  }, [past, upcoming]);

  // 오늘 시험: 후기가 많이 모인 곳부터
  const live = past.filter((e) => e.date === today && match(e)).sort((a, b) => (summaries[b.id]?.n ?? 0) - (summaries[a.id]?.n ?? 0));
  // 최근 일주일: 날짜 최근 순, 같은 날이면 후기가 많은 시험부터
  const recent = past
    .filter((e) => e.date < today && diffDays(e.date, today) <= RECENT_DAYS && match(e))
    .sort((a, b) => (a.date !== b.date ? (a.date < b.date ? 1 : -1) : (summaries[b.id]?.n ?? 0) - (summaries[a.id]?.n ?? 0)));
  const older = past.filter((e) => diffDays(e.date, today) > RECENT_DAYS && match(e));
  const upcomingShown = upcoming.filter(match).slice(0, filtering ? undefined : UPCOMING_LIMIT);
  const liveToday = live.reduce((sum, e) => sum + (activity[e.id]?.today ?? 0), 0);
  const next = upcoming.find((e) => !e.expected) ?? upcoming[0];

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
    g.reviews += summaries[e.id]?.n ?? 0;
  }

  return (
    <>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <CategoryChips value={category} onChange={setCategory} counts={categoryCounts} total={past.length + upcoming.length} />
        <label className="relative shrink-0 md:w-64">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-ink-mute"
            strokeWidth={1.75}
          />
          <span className="sr-only">기관명 검색</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="기관명 검색 (예: 금감원)"
            className="input w-full !pl-9"
          />
        </label>
      </div>

      {filtering && (
        <p className="mt-4 flex flex-wrap items-center gap-2 type-body-md text-ink-secondary">
          시험 <span className="tabular text-ink">{live.length + recent.length + older.length + upcomingShown.length}</span>개를 찾았어요
          <button
            type="button"
            onClick={() => {
              setCategory("all");
              setQuery("");
            }}
            className="link inline-flex items-center gap-0.5 type-caption"
          >
            <X className="h-3.5 w-3.5" strokeWidth={1.75} />
            조건 지우기
          </button>
        </p>
      )}

      {/* 오늘 치른 시험 — 가장 눈에 띄게 */}
      {live.length > 0 ? (
        <section aria-labelledby="live-title" className="mt-10 rounded-2xl border-2 border-ruby/50 bg-linear-to-b from-ev-doc-soft to-canvas p-4 md:p-6">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="inline-flex items-center gap-2 rounded-full bg-ruby px-3 py-1 type-caption font-semibold text-on-primary">
              <span className="relative inline-flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-on-primary opacity-70 motion-reduce:animate-none" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-on-primary" />
              </span>
              LIVE
            </span>
            <h2 id="live-title" className="type-heading-lg text-ink">
              오늘 치른 필기
            </h2>
          </div>
          <p className="mt-2 type-body-md text-ink-secondary">
            {liveToday > 0 ? (
              <>
                오늘 벌써 <span className="tabular font-semibold text-ruby">{liveToday}명</span>이 후기를 남겼어요. 시험 끝났다면 30초만 보태 주세요!
              </>
            ) : (
              "시험 끝났다면 첫 후기를 남겨 주세요. 먼저 남길수록 다른 응시자들의 결과를 가장 빨리 볼 수 있어요."
            )}
          </p>
          <div className={cn("mt-5 grid gap-4", live.length > 1 && "md:grid-cols-2", live.length > 2 && "lg:grid-cols-3")}>
            {live.map((e) => (
              <LiveCard key={e.id} exam={e} sum={summaries[e.id]} activity={activity[e.id]} />
            ))}
          </div>
        </section>
      ) : (
        !filtering &&
        next && (
          <Link
            href={`/reviews/${next.id}`}
            className="mt-10 flex items-center gap-3 rounded-xl border border-dashed border-hairline-input px-4 py-3 hover:bg-canvas-soft md:px-5"
          >
            <CalendarClock className="h-5 w-5 shrink-0 text-ink-mute" strokeWidth={1.75} />
            <span className="min-w-0 flex-1 type-body-md text-ink-secondary">
              오늘은 필기가 없어요. 다음 시험은{" "}
              <span className="font-semibold text-ink">{next.companyName}</span> {formatShort(next.date)}
              {next.expected && " (예상)"}
            </span>
            <span className="tag shrink-0 bg-ev-written-soft tabular text-ev-written">{ddayLabel(diffDays(today, next.date))}</span>
          </Link>
        )
      )}

      {/* 최근 일주일 — 후기가 몰리는 때라 큰 카드 */}
      {recent.length > 0 && (
        <section aria-labelledby="recent-title" className="mt-12">
          <h2 id="recent-title" className="type-heading-lg text-ink">
            최근 일주일 필기
          </h2>
          <p className="mt-1 type-caption text-ink-mute">시험 본 곳이 있다면 30초 후기를 남겨 주세요. 시험 후 3일간은 남긴 사람에게 결과가 먼저 열려요.</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {recent.map((e) => (
              <ExamCard key={e.id} exam={e} sum={summaries[e.id]} activity={activity[e.id]} today={today} />
            ))}
          </div>
        </section>
      )}

      {/* 지난 필기 — 달별 한 줄 목록 */}
      <section aria-labelledby="past-title" className="mt-12">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 id="past-title" className="type-heading-lg text-ink">
              지난 필기
            </h2>
            <p className="mt-1 type-caption text-ink-mute">
              <span className="tabular">{older.length}</span>개 시험 · 내가 본 시험이 보이면 눌러서 후기를 보태 주세요
            </p>
          </div>
          {months.length > 1 && (
            <nav aria-label="달로 이동" className="no-scrollbar fade-x -mx-4 flex gap-1.5 overflow-x-auto px-4 md:mx-0 md:px-0 md:fade-x-none">
              {months.map((g) => (
                <a
                  key={g.key}
                  href={`#exams-${g.key}`}
                  className="shrink-0 rounded-full border border-hairline bg-canvas px-3 py-1.5 type-caption font-semibold text-ink-secondary hover:border-hairline-input hover:text-ink"
                >
                  {g.label} <span className="tabular font-normal text-ink-mute">{g.items.length}</span>
                </a>
              ))}
            </nav>
          )}
        </div>

        {older.length === 0 ? (
          <p className="mt-4 rounded-lg bg-canvas-soft px-6 py-10 text-center type-body-md text-ink-mute">
            {filtering ? "조건에 맞는 지난 시험이 없어요." : "아직 치러진 필기가 없어요."}
          </p>
        ) : (
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
                {/* 칸 사이 1px 선: 바탕(hairline) 위에 흰 칸을 1px 띄워 깔아요 */}
                <ul className="mt-2 grid gap-px overflow-hidden rounded-xl border border-hairline bg-hairline lg:grid-cols-2">
                  {g.items.map((e) => (
                    <li key={e.id} className="bg-canvas">
                      <ExamRow exam={e} sum={summaries[e.id]} />
                    </li>
                  ))}
                  {g.items.length % 2 === 1 && <li aria-hidden className="hidden bg-canvas lg:block" />}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>

      <AdSlot slot={AD_SLOTS.inArticle} variant="inarticle" className="mt-12" />

      {upcomingShown.length > 0 && (
        <section className="mt-12">
          <h2 className="type-heading-lg text-ink">다가오는 필기</h2>
          <p className="mt-1 type-caption text-ink-mute">시험 당일부터 후기 투표가 열려요.</p>
          <Card className="mt-4 divide-y divide-hairline">
            {upcomingShown.map((e) => (
              <Link
                key={e.id}
                href={`/reviews/${e.id}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-canvas-soft md:px-6"
              >
                <CompanyAvatar company={e} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate type-body-md text-ink">{e.companyName}</span>
                  <span className="block truncate type-caption text-ink-mute">
                    {e.label} · {formatShort(e.date)}
                    {e.expected && " · 예상"}
                  </span>
                </span>
                <span className="tag bg-ev-written-soft tabular text-ev-written">{ddayLabel(diffDays(today, e.date))}</span>
              </Link>
            ))}
          </Card>
        </section>
      )}
    </>
  );
}

/** 오늘 시험 카드 — 실제 참여 수치로 '지금 쓰는 중' 느낌 */
function LiveCard({
  exam: e,
  sum,
  activity,
}: {
  exam: ExamCardData;
  sum?: ExamSummary;
  activity?: { today: number; lastHour: number; lastMinutesAgo: number | null };
}) {
  const last = agoLabel(activity?.lastMinutesAgo ?? null);
  const n = sum?.n ?? 0;
  return (
    <Link
      href={`/reviews/${e.id}`}
      className="group flex flex-col rounded-xl border border-ruby/30 bg-canvas p-4 shadow-level-1 transition-shadow hover:shadow-level-2 md:p-5"
    >
      <span className="flex items-center gap-3">
        <CompanyAvatar company={e} />
        <span className="min-w-0 flex-1">
          <span className="block truncate type-body-lg font-semibold text-ink">{e.companyName}</span>
          <span className="block truncate type-caption text-ink-mute">{e.label}</span>
        </span>
        {sum?.mine ? (
          <MineTag />
        ) : (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-ev-doc-soft px-2 py-1 type-micro font-semibold text-ruby">
            <LiveDot className="!h-2 !w-2" />
            진행 중
          </span>
        )}
      </span>

      <span className="mt-4 flex items-end justify-between gap-3">
        <span>
          {/* 아직 후기가 없으면 '0명' 대신 '후기 받는 중' (없는 숫자는 만들지 않음) */}
          {n ? (
            <span className="block tabular type-heading-lg text-ink md:type-display-md">
              {n}
              <span className="ml-1 type-body-md text-ink-mute">명 참여</span>
            </span>
          ) : (
            <span className="block type-heading-sm text-ink">후기 받는 중</span>
          )}
          <span className="mt-1 block type-caption text-ink-secondary">
            {activity && activity.lastHour > 0 ? (
              <span className="font-semibold text-ruby">최근 1시간 {activity.lastHour}명</span>
            ) : sum?.locked ? (
              "후기를 남기면 결과가 바로 열려요"
            ) : n ? (
              difficultyWord(sum?.avg ?? null)
            ) : (
              "시험 봤다면 30초면 남길 수 있어요"
            )}
            {last && <span className="text-ink-mute"> · 마지막 후기 {last}</span>}
          </span>
        </span>
        {sum?.avg != null && <DifficultyMeter avg={sum.avg} className="w-20" />}
      </span>

      <span className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-full bg-ruby px-4 py-2 type-button-md text-on-primary transition-transform group-hover:scale-[1.01] md:py-2.5">
        <PenLine className="h-4 w-4" strokeWidth={2} />
        {sum?.mine ? "내 후기 · 결과 보기" : n ? "30초 후기 남기고 결과 보기" : "첫 후기 남기기"}
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
      </span>
    </Link>
  );
}

/** 최근 일주일 시험 카드 — 위: 기관, 아래 한 줄: 난이도(잠금 기간이면 공개일)·참여 수 + 바로가기 */
function ExamCard({
  exam: e,
  sum,
  activity,
  today,
}: {
  exam: ExamCardData;
  sum?: ExamSummary;
  activity?: { today: number; lastHour: number; lastMinutesAgo: number | null };
  today: string;
}) {
  const ago = diffDays(e.date, today);
  const hot = (activity?.today ?? 0) > 0;
  const n = sum?.n ?? 0;
  return (
    <Link
      href={`/reviews/${e.id}`}
      className={cn(
        "group card flex flex-col p-4 transition-shadow hover:shadow-level-2",
        // 후기가 모인 시험은 살짝 띄워서 먼저 눈에 들어오게
        n ? "shadow-level-1" : "shadow-none",
        hot && "!border-ruby/40",
      )}
    >
      <span className="flex items-center gap-3">
        <CompanyAvatar company={e} />
        <span className="min-w-0 flex-1">
          <span className="block truncate type-body-md font-semibold text-ink">{e.companyName}</span>
          <span className="block truncate type-caption text-ink-mute">
            {e.label} · {formatShort(e.date)}
          </span>
        </span>
        {sum?.mine ? (
          <MineTag />
        ) : hot ? (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-ev-doc-soft px-2 py-1 type-micro font-semibold text-ruby">
            <Flame className="h-3 w-3" strokeWidth={2} />
            오늘 {activity!.today}명
          </span>
        ) : (
          <span className="tag shrink-0 bg-canvas-soft text-ink-secondary">{ago}일 전</span>
        )}
      </span>
      <span className="mt-3 flex items-center justify-between gap-3 border-t border-hairline pt-3">
        <span className="flex min-w-0 items-center gap-1.5 truncate type-caption text-ink-secondary">
          {sum?.locked ? (
            <>
              <Lock className="h-3.5 w-3.5 shrink-0 text-ink-mute" strokeWidth={2} />
              난이도 <span className="font-semibold text-ink">{publicDay(e.date)} 공개</span>
            </>
          ) : n ? (
            <>
              체감 <span className="font-semibold text-ink">{difficultyWord(sum?.avg ?? null)}</span>
              <DifficultyMeter avg={sum?.avg ?? null} className="w-10 shrink-0" />
            </>
          ) : (
            "후기 받는 중"
          )}
          {n > 0 && (
            <span className="text-ink-mute">
              · <span className="tabular font-semibold text-ink">{n}명</span> 참여
            </span>
          )}
        </span>
        <span className="inline-flex shrink-0 items-center gap-0.5 type-caption font-semibold text-primary-text">
          {sum?.mine || (n > 0 && !sum?.locked) ? "결과 보기" : "후기 남기기"}
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" strokeWidth={1.75} />
        </span>
      </span>
    </Link>
  );
}

/** 지난 필기 한 줄 — 날짜 · 로고 · 기관 · 참여 수 (훑어보다 '나 이거 봤는데' 하고 누르기 좋게) */
function ExamRow({ exam: e, sum }: { exam: ExamCardData; sum?: ExamSummary }) {
  const { m, d } = parseKey(e.date);
  const dow = dayOfWeek(e.date);
  const n = sum?.n ?? 0;
  return (
    <Link href={`/reviews/${e.id}`} className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-canvas-soft">
      <span className="w-12 shrink-0 text-center leading-tight whitespace-nowrap">
        <span className="block tabular type-body-md font-bold text-ink">
          {m}.{d}
        </span>
        <span className={cn("block type-micro", dow === 0 ? "text-ruby" : dow === 6 ? "text-primary-text" : "text-ink-mute")}>{WEEKDAYS[dow]}</span>
      </span>
      <CompanyAvatar company={e} size="sm" />
      <span className="min-w-0 flex-1">
        <span className="block truncate type-body-md font-semibold text-ink group-hover:underline">{e.companyName}</span>
        <span className="block truncate type-caption text-ink-mute">
          {e.label}
          {n > 0 && sum?.avg != null && ` · 체감 ${difficultyWord(sum.avg)}`}
        </span>
      </span>
      {sum?.mine ? (
        <MineTag />
      ) : n > 0 ? (
        <span className="shrink-0 rounded-full bg-ev-written-soft px-2.5 py-1 tabular type-caption font-semibold text-ev-written">{n}명</span>
      ) : (
        <span className="inline-flex shrink-0 items-center gap-1 type-caption text-ink-mute group-hover:text-primary-text">
          <PenLine className="h-3.5 w-3.5" strokeWidth={1.75} />
          후기 남기기
        </span>
      )}
    </Link>
  );
}
