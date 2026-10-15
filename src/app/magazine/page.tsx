import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { Newspaper } from "lucide-react";
import { AdSlot } from "@/components/ads/AdSlot";
import { Pagination } from "@/components/board/parts";
import { DbSection } from "@/components/db/DbSection";
import { NEWS_VIEW_COOKIE, ViewToggle } from "@/components/magazine/BlogControls";
import {
  DateBar,
  EditionSchedule,
  FeatureItemCard,
  HeadlineCard,
  NEWS_ICON,
  NewsCard,
  NewsCategoryNav,
  NewsListRow,
  PopularNews,
  TodaySchedule,
} from "@/components/magazine/news";
import { SortSegment } from "@/components/magazine/parts";
import { EmptyLine, MagazineShell } from "@/components/magazine/sections";
import { cn } from "@/components/ui";
import { formatDayHeading, formatShort, todayKST } from "@/lib/date";
import { MAGAZINE_NAME, isBlogCategory, magazineHref } from "@/lib/magazine-meta";
import {
  NEWS_PAGE_SIZE,
  NEWS_SECTION_INFO,
  briefingDateHref,
  briefingHref,
  isDateKey,
  isNewsSection,
  kindOf,
  type NewsItem,
  type NewsSort,
  type NewsView,
} from "@/lib/news-meta";
import { upcomingEvents } from "@/lib/postings";
import { latestInSection, latestNewsDate, listNews, newsByDate, newsDates, newsSectionCounts, popularNews } from "@/lib/server/news";
import { AD_SLOTS } from "@/lib/site";

export const metadata: Metadata = {
  title: `데일리 브리핑 — 오늘의 금융·경제·시사 뉴스와 용어·면접 질문 | ${MAGAZINE_NAME}`,
  description:
    "매일 아침·점심, 금융공기업 준비생이 알아야 할 금융·경제·정책·국제·공공기관 뉴스를 분야별로. 오늘의 용어, 면접 질문, 채용 일정까지 한 페이지에.",
  alternates: { canonical: "/magazine" },
};

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => ((Array.isArray(v) ? v[0] : v) ?? "").trim();

/** 매거진 · 데일리 브리핑 */
export default function BriefingPage({ searchParams }: PageProps<"/magazine">) {
  return (
    <MagazineShell section="briefing">
      <DbSection noticeTitle="데일리 브리핑을 준비하고 있어요">
        <Suspense fallback={<NewsSkeleton />}>{searchParams.then((sp) => <BriefingBody sp={sp as SP} />)}</Suspense>
      </DbSection>
    </MagazineShell>
  );
}

function NewsSkeleton() {
  return (
    <div className="mt-8 animate-pulse space-y-6">
      <div className="h-10 w-full max-w-xl rounded-full bg-canvas-soft" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="h-72 rounded-2xl bg-canvas-soft" />
        <div className="h-72 rounded-2xl bg-canvas-soft" />
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="h-56 rounded-2xl bg-canvas-soft" />
        ))}
      </div>
    </div>
  );
}

/** 날짜 목록에서 앞뒤 브리핑 */
function neighbors(dates: { date: string }[], date: string): { prev: string | null; next: string | null } {
  const older = dates.find((d) => d.date < date)?.date ?? null;
  const newer = [...dates].reverse().find((d) => d.date > date)?.date ?? null;
  return { prev: older, next: newer };
}

/** 최신순일 때 날짜별로 묶기 */
function groupByDate(items: NewsItem[]): { date: string; items: NewsItem[] }[] {
  const out: { date: string; items: NewsItem[] }[] = [];
  for (const n of items) {
    const last = out.at(-1);
    if (last && last.date === n.editionDate) last.items.push(n);
    else out.push({ date: n.editionDate, items: [n] });
  }
  return out;
}

async function BriefingBody({ sp }: { sp: SP }) {
  const c = one(sp.c);
  const q = one(sp.q);
  // 예전 주소(/magazine?c=exam, ?q=) 는 금융 블로그로
  if ((isBlogCategory(c) && !isNewsSection(c)) || q) redirect(magazineHref({ category: isBlogCategory(c) ? c : null, q: q || null }));

  await connection();
  const section = isNewsSection(c) ? c : null;
  const date = isDateKey(one(sp.date)) ? one(sp.date) : null;
  const sort: NewsSort = one(sp.sort) === "popular" ? "popular" : "latest";
  const page = Math.max(1, Number(one(sp.page)) || 1);
  const asked = one(sp.view);
  const saved = (await cookies()).get(NEWS_VIEW_COOKIE)?.value;
  const view: NewsView = asked === "card" || asked === "list" ? asked : saved === "card" ? "card" : "list";
  const today = todayKST();

  // 전체·최신순 첫 화면: 가장 최근 브리핑의 헤드라인 + 오늘의 용어 + 면접 질문을 위에 크게 (목록에서는 빼서 중복 없이)
  const front = !section && !date && sort === "latest";
  const [counts, latestDate, dates, popular] = await Promise.all([newsSectionCounts(), latestNewsDate(), newsDates(30), popularNews(3, 5)]);
  const heroDate = front ? (latestDate ?? today) : null;
  const dayItems = heroDate && latestDate ? await newsByDate(heroDate) : [];
  const headline = dayItems.find((n) => n.headline) ?? dayItems.find((n) => kindOf(n.section) === "news") ?? null;
  const [term, question] = front
    ? await Promise.all([
        dayItems.find((n) => n.section === "term") ?? latestInSection("term"),
        dayItems.find((n) => n.section === "question") ?? latestInSection("question"),
      ])
    : [null, null];
  const heroIds = [headline, term, question].filter((n): n is NewsItem => Boolean(n)).map((n) => n.id);
  const showHero = front && page === 1;

  const { items, total } = await listNews({ section, date, sort, page, excludeIds: front ? heroIds : undefined });
  const groups = sort === "latest" && !date ? groupByDate(items) : [{ date: "", items }];
  const info = section ? NEWS_SECTION_INFO[section] : null;
  const Icon = section ? NEWS_ICON[section] : Newspaper;
  const href = (p: { sort?: NewsSort; view?: NewsView; page?: number }) =>
    briefingHref({ section, date, sort: p.sort ?? sort, view: p.view ?? (asked ? view : undefined), page: p.page });

  return (
    <div className="mt-8">
      <NewsCategoryNav active={section} counts={counts} sort={sort} />

      {showHero && heroDate && (
        <section aria-label="오늘의 브리핑" className="mt-8 space-y-6">
          <DateBar
            date={heroDate}
            count={dayItems.length}
            {...neighbors(dates, heroDate)}
            eyebrow={heroDate === today ? "오늘의 브리핑" : "가장 최근 브리핑"}
          />
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
            {headline ? (
              <HeadlineCard n={headline} />
            ) : (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-hairline-input px-6 py-14 text-center">
                <Newspaper className="h-8 w-8 text-ink-mute-2" strokeWidth={1.5} />
                <p className="mt-3 type-heading-sm text-ink">첫 브리핑을 준비하고 있어요</p>
                <p className="mt-1 type-body-md text-ink-mute">매일 아침·점심 금융·경제·시사 뉴스를 분야별로 정리해 드려요.</p>
              </div>
            )}
            <PopularNews items={popular} />
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            <FeatureItemCard section="term" n={term} today={today} />
            <FeatureItemCard section="question" n={question} today={today} />
            <TodaySchedule events={upcomingEvents(today, 2)} today={today} />
          </div>
          <EditionSchedule />
        </section>
      )}

      {date && (
        <div className="mt-8">
          <DateBar date={date} count={total} {...neighbors(dates, date)} eyebrow={date === today ? "오늘의 브리핑" : "지난 브리핑"} />
        </div>
      )}

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0">
          {/* 목록 머리: 지금 보는 것 + 정렬 + 보기 방식 */}
          <div className="flex flex-col gap-3 border-b border-hairline pb-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <span className={cn("inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", info ? info.tone : "bg-canvas-soft text-ink-secondary")}>
                <Icon className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <div className="min-w-0">
                <h2 className="type-heading-lg text-ink">
                  {info ? info.label : date ? `${formatDayHeading(date)} 브리핑` : "전체 브리핑"}
                  <span className="ml-2 tabular type-body-md text-ink-mute">{total + (front ? heroIds.length : 0)}건</span>
                </h2>
                <p className="mt-0.5 type-caption text-ink-mute">{info ? info.desc : "뉴스 · 오늘의 용어 · 면접 질문을 모두 모아 봐요"}</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <SortSegment sort={sort} hrefs={{ latest: href({ sort: "latest" }), popular: href({ sort: "popular" }) }} />
              <ViewToggle view={view} cookie={NEWS_VIEW_COOKIE} hrefs={{ card: href({ view: "card", page }), list: href({ view: "list", page }) }} />
            </div>
          </div>

          {items.length === 0 ? (
            <div className="mt-8">
              <EmptyLine
                text={
                  front && heroIds.length
                    ? "위의 오늘 브리핑이 지금까지 올라온 전부예요."
                    : info
                      ? `아직 '${info.label}' 기사가 없어요. 곧 채워 둘게요.`
                      : "브리핑이 쌓이면 여기에 모두 모여요."
                }
              />
            </div>
          ) : (
            groups.map((g) => (
              <section key={g.date || "all"} aria-label={g.date ? formatDayHeading(g.date) : undefined}>
                {g.date && (
                  <div className="mt-8 flex items-baseline justify-between gap-3">
                    <h3 className="type-heading-sm text-ink">{formatDayHeading(g.date)}</h3>
                    <Link href={briefingDateHref(g.date)} className="link shrink-0 type-caption">
                      이날 브리핑만 보기 →
                    </Link>
                  </div>
                )}
                {view === "card" ? (
                  <div className={cn("grid gap-6 sm:grid-cols-2", g.date ? "mt-4" : "mt-6")}>
                    {g.items.map((n) => (
                      <NewsCard key={n.id} n={n} />
                    ))}
                  </div>
                ) : (
                  <ul className={cn("divide-y divide-hairline", g.date && "mt-1 border-t border-hairline")}>
                    {g.items.map((n) => (
                      <li key={n.id}>
                        <NewsListRow n={n} />
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))
          )}

          <div className="mt-10">
            <Pagination total={total} page={page} hrefFor={(p) => href({ page: p })} pageSize={NEWS_PAGE_SIZE} />
          </div>
        </div>

        <aside className="space-y-4">
          {!showHero && <PopularNews items={popular} />}
          {!showHero && <EditionSchedule />}
          {dates.length > 0 && (
            <section aria-labelledby="past-title" className="rounded-xl border border-hairline p-5">
              <h2 id="past-title" className="type-heading-sm text-ink">
                날짜별 브리핑
              </h2>
              <ul className="mt-2 divide-y divide-hairline">
                {dates.slice(0, 10).map((d) => (
                  <li key={d.date}>
                    <Link
                      href={briefingDateHref(d.date)}
                      aria-current={d.date === date ? "page" : undefined}
                      className={cn("group flex items-center justify-between gap-3 py-2.5", d.date === date && "font-semibold")}
                    >
                      <span className="tabular type-body-md text-ink group-hover:underline">
                        {formatShort(d.date)}
                        {d.date === today && <span className="ml-1.5 type-micro text-primary-text">오늘</span>}
                      </span>
                      <span className="tabular type-caption text-ink-mute">{d.count}건</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
          <div className="lg:sticky lg:top-24">
            <AdSlot slot={AD_SLOTS.sidebar} variant="rectangle" />
          </div>
        </aside>
      </div>
    </div>
  );
}
