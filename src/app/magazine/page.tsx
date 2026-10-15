import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { ArrowRight, Newspaper } from "lucide-react";
import { AdSlot } from "@/components/ads/AdSlot";
import { DbSection } from "@/components/db/DbSection";
import { NEWS_VIEW_COOKIE, ViewToggle } from "@/components/magazine/BlogControls";
import { HeadlineCarousel } from "@/components/magazine/HeadlineCarousel";
import { ArchiveCallout, BriefingDates, FeatureItemCard, NewsCategoryNav, NewsGroupedList, PopularNews } from "@/components/magazine/news";
import { EmptyLine, MagazineShell } from "@/components/magazine/sections";
import { addDays, formatDayHeading, todayKST } from "@/lib/date";
import { MAGAZINE_NAME, isBlogCategory, magazineHref } from "@/lib/magazine-meta";
import { briefingArchiveHref, briefingDateHref, isDateKey, isNewsSection, kindOf, newsHref, type NewsItem, type NewsView } from "@/lib/news-meta";
import { latestInSection, latestNewsDate, listNews, newsByDate, newsDates, newsSectionCounts, popularNews } from "@/lib/server/news";
import { AD_SLOTS } from "@/lib/site";

export const metadata: Metadata = {
  title: `데일리 브리핑 — 오늘의 금융·경제·시사 뉴스와 용어·면접 질문 | ${MAGAZINE_NAME}`,
  description:
    "매일 아침·점심, 금융공기업 준비생이 알아야 할 금융·경제·정책·국제·공공기관 뉴스를 분야별로. 오늘의 용어와 면접 질문까지 한 페이지에.",
  alternates: { canonical: "/magazine" },
};

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => ((Array.isArray(v) ? v[0] : v) ?? "").trim();

/** 매거진 · 데일리 브리핑 첫 화면: 오늘의 헤드라인 + 어제·그제 브리핑 (그 전은 전체 브리핑에서) */
export default function BriefingPage({ searchParams }: PageProps<"/magazine">) {
  return (
    <MagazineShell section="briefing">
      <DbSection noticeTitle="데일리 브리핑을 준비하고 있어요">
        <Suspense fallback={<NewsSkeleton />}>{searchParams.then((sp) => <BriefingFront sp={sp as SP} />)}</Suspense>
      </DbSection>
    </MagazineShell>
  );
}

function NewsSkeleton() {
  return (
    <div className="mt-8 animate-pulse space-y-6">
      <div className="h-10 w-full max-w-xl rounded-full bg-canvas-soft" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="h-[440px] rounded-2xl bg-canvas-soft" />
        <div className="h-[440px] rounded-2xl bg-canvas-soft" />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="h-48 rounded-2xl bg-canvas-soft" />
        <div className="h-48 rounded-2xl bg-canvas-soft" />
      </div>
    </div>
  );
}

async function BriefingFront({ sp }: { sp: SP }) {
  const c = one(sp.c);
  const q = one(sp.q);
  // 예전 주소(/magazine?c=exam, ?q=) 는 금융 블로그로, 브리핑 거르기(?c=finance, ?date=)는 전체 브리핑으로
  if ((isBlogCategory(c) && !isNewsSection(c)) || q) redirect(magazineHref({ category: isBlogCategory(c) ? c : null, q: q || null }));
  const oldDate = one(sp.date);
  if (isNewsSection(c) || isDateKey(oldDate) || one(sp.page)) {
    redirect(briefingArchiveHref({ section: isNewsSection(c) ? c : null, from: isDateKey(oldDate) ? oldDate : null, to: isDateKey(oldDate) ? oldDate : null }));
  }

  await connection();
  const asked = one(sp.view);
  const saved = (await cookies()).get(NEWS_VIEW_COOKIE)?.value;
  const view: NewsView = asked === "card" || asked === "list" ? asked : saved === "card" ? "card" : "list";
  const today = todayKST();

  const [counts, latestDate, dates, popular] = await Promise.all([newsSectionCounts(), latestNewsDate(), newsDates(10), popularNews(3, 5)]);
  // 오늘 브리핑이 아직 없으면(이른 아침) 가장 최근 브리핑을 위에
  const heroDate = latestDate ?? today;
  const dayItems = latestDate ? await newsByDate(heroDate) : [];
  const slides = dayItems.filter((n) => kindOf(n.section) === "news").slice(0, 10);
  const [term, question] = await Promise.all([
    dayItems.find((n) => n.section === "term") ?? latestInSection("term"),
    dayItems.find((n) => n.section === "question") ?? latestInSection("question"),
  ]);
  const shownIds = [term, question].filter((n): n is NewsItem => Boolean(n)).map((n) => n.id);

  // 아래 목록: 위 브리핑 날 기준 앞의 이틀 (16일이면 15·14일)
  const from = addDays(heroDate, -2);
  const to = addDays(heroDate, -1);
  const [recent, all] = await Promise.all([listNews({ from, to, pageSize: 100, excludeIds: shownIds }), listNews({ pageSize: 1 })]);

  return (
    <div className="mt-8">
      <NewsCategoryNav active={null} counts={counts} />

      <section aria-label="오늘의 브리핑" className="mt-8 space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="type-micro-cap text-primary-text">{heroDate === today ? "오늘의 브리핑" : "가장 최근 브리핑"}</p>
            <p className="mt-0.5 flex flex-wrap items-baseline gap-x-2 type-heading-lg text-ink">
              {formatDayHeading(heroDate)}
              <span className="tabular type-body-md text-ink-mute">{dayItems.length}건</span>
            </p>
          </div>
          {dayItems.length > 0 && (
            <Link href={briefingDateHref(heroDate)} className="link inline-flex items-center gap-1 type-caption">
              이날 브리핑 모두 보기
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
            </Link>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          {slides.length > 0 ? (
            <HeadlineCarousel
              slides={slides.map((n) => ({
                id: n.id,
                href: newsHref(n.id),
                title: n.title,
                section: n.section,
                headline: n.headline,
                imageUrl: n.imageUrl,
                imageCredit: n.imageCredit,
              }))}
            />
          ) : (
            <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-hairline-input px-6 py-14 text-center lg:min-h-[440px]">
              <Newspaper className="h-8 w-8 text-ink-mute-2" strokeWidth={1.5} />
              <p className="mt-3 type-heading-sm text-ink">첫 브리핑을 준비하고 있어요</p>
              <p className="mt-1 type-body-md text-ink-mute">매일 아침·점심 금융·경제·시사 뉴스를 분야별로 정리해 드려요.</p>
            </div>
          )}
          <PopularNews items={popular} />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <FeatureItemCard section="term" n={term} today={today} />
          <FeatureItemCard section="question" n={question} today={today} />
        </div>
      </section>

      <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0">
          <div className="flex flex-col gap-3 border-b border-hairline pb-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <h2 className="type-heading-lg text-ink">
                최근 브리핑
                <span className="ml-2 tabular type-body-md text-ink-mute">{recent.total}건</span>
              </h2>
              <p className="mt-0.5 type-caption text-ink-mute">
                {formatDayHeading(to)} · {formatDayHeading(from)} 브리핑이에요. 그 전 브리핑은 아래 ‘지난 브리핑 전체 보기’에서.
              </p>
            </div>
            <ViewToggle view={view} cookie={NEWS_VIEW_COOKIE} hrefs={{ card: "/magazine?view=card", list: "/magazine?view=list" }} />
          </div>

          {recent.items.length === 0 ? (
            <div className="mt-8">
              <EmptyLine text="이 이틀 동안 올라온 브리핑이 없어요. 지난 브리핑은 아래에서 찾아보세요." />
            </div>
          ) : (
            <NewsGroupedList items={recent.items} view={view} />
          )}

          <ArchiveCallout total={all.total} className="mt-10" />
        </div>

        <aside className="space-y-4">
          <BriefingDates dates={dates} today={today} />
          <div className="lg:sticky lg:top-24">
            <AdSlot slot={AD_SLOTS.sidebar} variant="rectangle" />
          </div>
        </aside>
      </div>
    </div>
  );
}
