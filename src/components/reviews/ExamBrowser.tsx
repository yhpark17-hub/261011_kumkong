"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, CalendarClock, Flame, PenLine, Search, X } from "lucide-react";
import { AD_SLOTS } from "@/lib/site";
import { ddayLabel, diffDays, formatShort } from "@/lib/date";
import { difficultyWord } from "@/lib/review-meta";
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

type Counts = Record<string, { n: number; avg: number }>;
type Activity = Record<string, { today: number; lastHour: number; lastMinutesAgo: number | null }>;

const UPCOMING_LIMIT = 12;

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

/** 빨간 점이 숨 쉬듯 깜빡이는 LIVE 표시 */
function LiveDot({ className }: { className?: string }) {
  return (
    <span className={cn("relative inline-flex h-2.5 w-2.5", className)} aria-hidden>
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ruby opacity-60 motion-reduce:animate-none" />
      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-ruby" />
    </span>
  );
}

/** 필기 후기 목록 — 오늘 시험(LIVE) → 지난 시험 → 다가오는 시험 */
export function ExamBrowser({
  past,
  upcoming,
  counts,
  activity,
  today,
}: {
  past: ExamCardData[];
  upcoming: ExamCardData[];
  counts: Counts;
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

  const live = past.filter((e) => e.date === today && match(e));
  const earlier = past.filter((e) => e.date < today && match(e));
  const upcomingShown = upcoming.filter(match).slice(0, filtering ? undefined : UPCOMING_LIMIT);
  const liveToday = live.reduce((sum, e) => sum + (activity[e.id]?.today ?? 0), 0);
  const next = upcoming.find((e) => !e.expected) ?? upcoming[0];

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
          시험 <span className="tabular text-ink">{live.length + earlier.length + upcomingShown.length}</span>개를 찾았어요
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
              <LiveCard key={e.id} exam={e} count={counts[e.id]} activity={activity[e.id]} />
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

      <section className="mt-12">
        <div className="flex items-end justify-between gap-4">
          <h2 className="type-heading-lg text-ink">지난 필기</h2>
          <span className="type-caption text-ink-mute">{earlier.length}개 시험</span>
        </div>
        {earlier.length === 0 ? (
          <p className="mt-4 rounded-lg bg-canvas-soft px-6 py-10 text-center type-body-md text-ink-mute">
            {filtering ? "조건에 맞는 지난 시험이 없어요." : "아직 치러진 필기가 없어요."}
          </p>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {earlier.map((e, i) => (
              <ExamSlot key={e.id} index={i}>
                <ExamCard exam={e} count={counts[e.id]} activity={activity[e.id]} today={today} />
              </ExamSlot>
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

/** 카드 9개마다 광고를 끼우기 위한 래퍼 */
function ExamSlot({ index, children }: { index: number; children: React.ReactNode }) {
  return (
    <>
      {children}
      {index === 8 && (
        <div className="md:col-span-2 lg:col-span-3">
          <AdSlot slot={AD_SLOTS.inFeed} variant="infeed" />
        </div>
      )}
    </>
  );
}

/** 오늘 시험 카드 — 실제 참여 수치로 '지금 쓰는 중' 느낌 */
function LiveCard({
  exam: e,
  count,
  activity,
}: {
  exam: ExamCardData;
  count?: { n: number; avg: number };
  activity?: { today: number; lastHour: number; lastMinutesAgo: number | null };
}) {
  const last = agoLabel(activity?.lastMinutesAgo ?? null);
  return (
    <Link
      href={`/reviews/${e.id}`}
      className="group flex flex-col rounded-xl border border-ruby/30 bg-canvas p-5 shadow-level-1 transition-shadow hover:shadow-level-2"
    >
      <span className="flex items-center gap-3">
        <CompanyAvatar company={e} />
        <span className="min-w-0 flex-1">
          <span className="block truncate type-body-lg font-semibold text-ink">{e.companyName}</span>
          <span className="block truncate type-caption text-ink-mute">{e.label}</span>
        </span>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-ev-doc-soft px-2 py-1 type-micro font-semibold text-ruby">
          <LiveDot className="!h-2 !w-2" />
          진행 중
        </span>
      </span>

      <span className="mt-5 flex items-end justify-between gap-3">
        <span>
          <span className="block tabular type-display-md text-ink">
            {count?.n ?? 0}
            <span className="ml-1 type-body-md text-ink-mute">명 참여</span>
          </span>
          <span className="mt-1 block type-caption text-ink-secondary">
            {activity && activity.lastHour > 0 ? (
              <span className="font-semibold text-ruby">최근 1시간 {activity.lastHour}명</span>
            ) : count ? (
              difficultyWord(count.avg)
            ) : (
              "아직 아무도 남기지 않았어요"
            )}
            {last && <span className="text-ink-mute"> · 마지막 후기 {last}</span>}
          </span>
        </span>
        {count && <DifficultyMeter avg={count.avg} className="w-20" />}
      </span>

      <span className="mt-5 inline-flex items-center justify-center gap-1.5 rounded-full bg-ruby px-4 py-2.5 type-button-md text-on-primary transition-transform group-hover:scale-[1.01]">
        <PenLine className="h-4 w-4" strokeWidth={2} />
        {count ? "30초 후기 남기고 결과 보기" : "첫 후기 남기기"}
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
      </span>
    </Link>
  );
}

function ExamCard({
  exam: e,
  count,
  activity,
  today,
}: {
  exam: ExamCardData;
  count?: { n: number; avg: number };
  activity?: { today: number; lastHour: number; lastMinutesAgo: number | null };
  today: string;
}) {
  const ago = diffDays(e.date, today);
  const hot = (activity?.today ?? 0) > 0;
  return (
    <Link
      href={`/reviews/${e.id}`}
      className={cn("group card flex flex-col p-5 shadow-level-1 transition-shadow hover:shadow-level-2", hot && "!border-ruby/40")}
    >
      <span className="flex items-center gap-3">
        <CompanyAvatar company={e} />
        <span className="min-w-0 flex-1">
          <span className="block truncate type-body-lg !font-normal text-ink">{e.companyName}</span>
          <span className="block truncate type-caption text-ink-mute">
            {e.label} · {formatShort(e.date)}
          </span>
        </span>
        {hot ? (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-ev-doc-soft px-2 py-1 type-micro font-semibold text-ruby">
            <Flame className="h-3 w-3" strokeWidth={2} />
            오늘 {activity!.today}명
          </span>
        ) : (
          ago <= 7 && <span className="tag shrink-0 bg-canvas-soft text-ink-secondary">{ago}일 전</span>
        )}
      </span>
      <span className="mt-5 flex items-end justify-between gap-3">
        <span>
          <span className="block type-micro text-ink-mute">체감 난이도</span>
          <span className="mt-0.5 block type-heading-sm text-ink">{count ? difficultyWord(count.avg) : "참여 대기"}</span>
        </span>
        <span className="tabular type-caption text-ink-mute">{count ? `${count.n}명 참여` : "첫 후기를 남겨 주세요"}</span>
      </span>
      <DifficultyMeter avg={count?.avg ?? null} className="mt-3" />
      <span className="mt-4 inline-flex items-center gap-1 type-caption text-primary-text">
        {count ? "결과 보고 참여하기" : "후기 남기기"}
        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" strokeWidth={1.75} />
      </span>
    </Link>
  );
}
