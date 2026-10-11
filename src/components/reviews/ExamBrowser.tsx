"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Search, X } from "lucide-react";
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

const UPCOMING_LIMIT = 12;

function normalize(s: string) {
  return s.replace(/\s+/g, "").toLowerCase();
}

/** 필기 후기 목록 — 기관 구분 칩 + 기관명 검색 */
export function ExamBrowser({
  past,
  upcoming,
  counts,
  today,
}: {
  past: ExamCardData[];
  upcoming: ExamCardData[];
  counts: Counts;
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

  const pastShown = past.filter(match);
  const upcomingShown = upcoming.filter(match).slice(0, filtering ? undefined : UPCOMING_LIMIT);
  const hot = filtering
    ? []
    : past
        .filter((e) => (counts[e.id]?.n ?? 0) > 0)
        .sort((a, b) => (counts[b.id]?.n ?? 0) - (counts[a.id]?.n ?? 0))
        .slice(0, 3);

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
          시험 <span className="tabular text-ink">{pastShown.length + upcomingShown.length}</span>개를 찾았어요
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

      {hot.length > 0 && (
        <section className="mt-10">
          <h2 className="type-heading-lg text-ink">참여가 많은 시험</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {hot.map((e) => (
              <ExamCard key={e.id} exam={e} count={counts[e.id]} today={today} featured />
            ))}
          </div>
        </section>
      )}

      <section className="mt-10">
        <div className="flex items-end justify-between gap-4">
          <h2 className="type-heading-lg text-ink">최근 치러진 필기</h2>
          <span className="type-caption text-ink-mute">{pastShown.length}개 시험</span>
        </div>
        {pastShown.length === 0 ? (
          <p className="mt-4 rounded-lg bg-canvas-soft px-6 py-10 text-center type-body-md text-ink-mute">
            {filtering ? "조건에 맞는 지난 시험이 없어요." : "아직 치러진 필기가 없어요."}
          </p>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pastShown.map((e, i) => (
              <ExamSlot key={e.id} index={i}>
                <ExamCard exam={e} count={counts[e.id]} today={today} />
              </ExamSlot>
            ))}
          </div>
        )}
      </section>

      <AdSlot slot={AD_SLOTS.inArticle} variant="inarticle" className="mt-12" />

      {upcomingShown.length > 0 && (
        <section className="mt-12">
          <h2 className="type-heading-lg text-ink">다가오는 필기</h2>
          <p className="mt-1 type-caption text-ink-mute">시험이 끝나는 날부터 후기 투표가 열려요.</p>
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

function ExamCard({
  exam: e,
  count,
  today,
  featured = false,
}: {
  exam: ExamCardData;
  count?: { n: number; avg: number };
  today: string;
  featured?: boolean;
}) {
  const ago = diffDays(e.date, today);
  return (
    <Link
      href={`/reviews/${e.id}`}
      className={cn(
        "group card flex flex-col p-5 shadow-level-1 transition-shadow hover:shadow-level-2",
        featured && "!border-brand-dark",
      )}
    >
      <span className="flex items-center gap-3">
        <CompanyAvatar company={e} />
        <span className="min-w-0 flex-1">
          <span className="block truncate type-body-lg !font-normal text-ink">{e.companyName}</span>
          <span className="block truncate type-caption text-ink-mute">
            {e.label} · {formatShort(e.date)}
          </span>
        </span>
        {ago <= 7 && <span className="tag bg-ev-doc-soft text-ev-doc">{ago === 0 ? "오늘" : `${ago}일 전`}</span>}
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
