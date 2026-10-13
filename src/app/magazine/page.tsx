import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { ArrowRight, Newspaper, Search, X } from "lucide-react";
import { AdSlot } from "@/components/ads/AdSlot";
import { Pagination } from "@/components/board/parts";
import { DbSection } from "@/components/db/DbSection";
import { BriefingStreak, ReadBadge, SavedArticles, UnreadDot } from "@/components/magazine/interactive";
import {
  ArticleCard,
  ArticleCover,
  ArticleMeta,
  ArticleRow,
  CATEGORY_ICON,
  MagazineCategoryNav,
  MagazineCategoryTag,
  SectionHead,
} from "@/components/magazine/parts";
import { Eyebrow, cn } from "@/components/ui";
import { formatDayHeading } from "@/lib/date";
import {
  CATEGORY_INFO,
  MAGAZINE_CATEGORIES,
  MAGAZINE_NAME,
  MAGAZINE_PAGE_SIZE,
  MAGAZINE_TAGLINE,
  articleHref,
  formatArticleDate,
  isMagazineCategory,
  kstDateKey,
  magazineHref,
  summaryLines,
  type ArticleSummary,
  type MagazineCategory,
} from "@/lib/magazine-meta";
import { categoryCounts, listArticles, popularArticles } from "@/lib/server/magazine";
import { AD_SLOTS } from "@/lib/site";

export const metadata: Metadata = {
  title: `${MAGAZINE_NAME} — 데일리 금융 브리핑·필기·면접·합격 수기`,
  description:
    "매일 아침 금융·시사·금공 뉴스 브리핑과 NCS 필기 준비법, 면접 전략, 합격 수기, 현직자 이야기까지. 금융공기업 준비생을 위한 금콩 매거진.",
  alternates: { canonical: "/magazine", types: { "application/rss+xml": "/magazine/rss.xml" } },
};

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => ((Array.isArray(v) ? v[0] : v) ?? "").trim();

export default function MagazinePage({ searchParams }: PageProps<"/magazine">) {
  return (
    <div className="mx-auto max-w-[1200px] px-4 pt-8 pb-16 md:px-6 md:pt-12">
      <header className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <Eyebrow>{MAGAZINE_NAME}</Eyebrow>
          <h1 className="mt-3 type-display-md text-ink md:type-display-lg">{MAGAZINE_TAGLINE}</h1>
          <p className="mt-3 max-w-2xl type-body-lg text-ink-secondary">
            아침마다 금융·시사·금공 뉴스를 5분 브리핑으로, 필기·면접·합격 노하우는 깊이 있게 정리해 드려요.
          </p>
        </div>
        <Suspense fallback={<SearchBox q="" />}>{searchParams.then((sp) => <SearchBox q={one((sp as SP).q)} />)}</Suspense>
      </header>

      <DbSection noticeTitle="매거진을 준비하고 있어요">
        <Suspense fallback={<MagazineSkeleton />}>{searchParams.then((sp) => <MagazineBody sp={sp as SP} />)}</Suspense>
      </DbSection>
    </div>
  );
}

function SearchBox({ q }: { q: string }) {
  return (
    <form action="/magazine" role="search" className="relative w-full md:w-72">
      <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-ink-mute" strokeWidth={1.75} />
      <input name="q" defaultValue={q} placeholder="매거진 검색 (예: NCS, 면접)" className="input w-full pl-9" maxLength={40} />
    </form>
  );
}

function MagazineSkeleton() {
  return (
    <div className="mt-8 animate-pulse space-y-8">
      <div className="flex gap-2">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="h-9 w-24 rounded-full bg-canvas-soft" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="h-80 rounded-xl bg-canvas-soft" />
        <div className="h-80 rounded-xl bg-canvas-soft" />
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="h-72 rounded-xl bg-canvas-soft" />
        ))}
      </div>
    </div>
  );
}

async function MagazineBody({ sp }: { sp: SP }) {
  await connection();
  const c = one(sp.c);
  const category = isMagazineCategory(c) ? c : null;
  const q = one(sp.q).slice(0, 40) || null;
  const page = Math.max(1, Number(one(sp.page)) || 1);
  const counts = await categoryCounts();

  return (
    <div className="mt-8">
      <MagazineCategoryNav active={category} counts={counts} />
      {category || q || page > 1 ? (
        <ListView category={category} q={q} page={page} counts={counts} />
      ) : (
        <FrontPage counts={counts} />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 첫 화면                                                               */
/* ------------------------------------------------------------------ */

async function FrontPage({ counts }: { counts: Map<MagazineCategory, number> }) {
  const [briefings, featured, starter, popular] = await Promise.all([
    listArticles({ category: "briefing", pageSize: 6 }),
    listArticles({ featured: true, excludeCategory: "briefing", pageSize: 3 }),
    listArticles({ category: "starter", pageSize: 4 }),
    popularArticles(5),
  ]);
  const shown = featured.items.map((a) => a.id);
  const latest = await listArticles({ excludeCategory: "briefing", excludeIds: shown, pageSize: 6 });
  const [today, ...pastBriefings] = briefings.items;

  return (
    <div className="mt-8 space-y-16">
      {/* 오늘의 브리핑 + 연속 읽기 */}
      <section aria-labelledby="briefing-title" className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <h2 id="briefing-title" className="sr-only">
          데일리 브리핑
        </h2>
        {today ? <BriefingHero a={today} /> : <BriefingEmpty />}
        <div className="flex flex-col gap-4">
          <BriefingStreak />
          <div className="flex-1 rounded-xl border border-hairline p-5">
            <div className="flex items-center justify-between">
              <p className="type-heading-sm text-ink">지난 브리핑</p>
              <Link href={magazineHref({ category: "briefing" })} className="link type-caption">
                전체 →
              </Link>
            </div>
            {pastBriefings.length === 0 ? (
              <p className="mt-3 type-caption text-ink-mute">브리핑이 쌓이면 날짜별로 다시 볼 수 있어요.</p>
            ) : (
              <ul className="mt-2 divide-y divide-hairline">
                {pastBriefings.slice(0, 4).map((b) => (
                  <li key={b.id}>
                    <Link href={articleHref(b.id)} className="group flex items-baseline gap-3 py-2.5">
                      <span className="w-12 shrink-0 tabular type-caption text-ink-mute">
                        {b.publishedAt ? formatArticleDate(b.publishedAt).slice(5) : ""}
                      </span>
                      <span className="line-clamp-1 type-body-md text-ink group-hover:underline">{b.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      {/* 에디터 추천 */}
      {featured.items.length > 0 && (
        <section aria-labelledby="featured-title">
          <SectionHead title="에디터 추천" desc="지금 읽어 두면 좋은 글" />
          <h2 id="featured-title" className="sr-only">
            에디터 추천
          </h2>
          <div className={cn("grid gap-6", featured.items.length > 1 && "lg:grid-cols-[1.35fr_1fr]")}>
            <FeatureCard a={featured.items[0]} wide={featured.items.length === 1} />
            {featured.items.length > 1 && (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1">
                {featured.items.slice(1).map((a) => (
                  <ArticleCard key={a.id} a={a} />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* 새 글 */}
      {latest.items.length > 0 && (
        <section>
          <SectionHead title="새로 올라온 글" href={magazineHref({ page: 2 })} linkLabel="전체 글" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {latest.items.map((a) => (
              <ArticleCard key={a.id} a={a} />
            ))}
          </div>
        </section>
      )}

      <AdSlot slot={AD_SLOTS.inFeed} variant="infeed" />

      {/* 입문 + 인기 */}
      <section className="grid gap-10 lg:grid-cols-2">
        <div>
          <SectionHead title="처음이라면 여기부터" desc={CATEGORY_INFO.starter.desc} href={magazineHref({ category: "starter" })} />
          {starter.items.length ? (
            <div className="divide-y divide-hairline border-y border-hairline">
              {starter.items.map((a) => (
                <ArticleRow key={a.id} a={a} />
              ))}
            </div>
          ) : (
            <EmptyLine text="입문 가이드를 준비하고 있어요." />
          )}
        </div>
        <div>
          <SectionHead title="많이 읽은 글" desc="최근 30일 기준" />
          {popular.length ? (
            <div className="divide-y divide-hairline border-y border-hairline">
              {popular.map((a, i) => (
                <ArticleRow key={a.id} a={a} rank={i + 1} />
              ))}
            </div>
          ) : (
            <EmptyLine text="글이 쌓이면 많이 읽은 순서로 보여 드려요." />
          )}
        </div>
      </section>

      {/* 카테고리 둘러보기 */}
      <section aria-labelledby="browse-title">
        <SectionHead title="주제별로 둘러보기" />
        <h2 id="browse-title" className="sr-only">
          주제별로 둘러보기
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {MAGAZINE_CATEGORIES.map((c) => {
            const Icon = CATEGORY_ICON[c.key];
            const n = counts.get(c.key) ?? 0;
            return (
              <li key={c.key}>
                <Link
                  href={magazineHref({ category: c.key })}
                  className="group flex h-full items-start gap-4 rounded-xl border border-hairline p-5 transition-colors hover:border-hairline-input hover:bg-canvas-soft"
                >
                  <span className={cn("inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", c.tone)}>
                    <Icon className="h-5 w-5" strokeWidth={1.75} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="type-heading-sm text-ink">{c.label}</span>
                      <span className="tabular type-caption text-ink-mute">{n > 0 ? `${n}편` : "준비 중"}</span>
                    </span>
                    <span className="mt-1 block type-caption text-ink-secondary">{c.desc}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

function BriefingHero({ a }: { a: ArticleSummary }) {
  const day = a.publishedAt ? kstDateKey(a.publishedAt) : null;
  const points = summaryLines(a.summary).slice(0, 3);
  return (
    <Link
      href={articleHref(a.id)}
      className="group relative flex flex-col overflow-hidden rounded-xl bg-brand-dark p-6 text-on-primary md:p-8"
    >
      <span aria-hidden className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/30 blur-3xl" />
      <span className="relative flex flex-wrap items-center gap-2">
        <span className="tag bg-on-primary/15 text-on-primary">
          <Newspaper className="h-3 w-3" strokeWidth={2} />
          데일리 브리핑
        </span>
        {day && <span className="type-caption text-on-primary/70">{formatDayHeading(day)}</span>}
        <UnreadDot id={a.id} />
      </span>
      <h3 className="relative mt-4 type-heading-lg md:type-display-md">{a.title}</h3>
      {points.length > 0 && (
        <ol className="relative mt-6 space-y-3">
          {points.map((p, i) => (
            <li key={i} className="flex gap-3 type-body-md text-on-primary/90">
              <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-on-primary/15 tabular type-micro">
                {i + 1}
              </span>
              <span>{p}</span>
            </li>
          ))}
        </ol>
      )}
      <span className="relative mt-auto flex items-center justify-between gap-3 pt-8">
        <span className="type-caption text-on-primary/70">{a.readMinutes}분이면 다 읽어요</span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-on-primary px-4 py-2 type-button-sm text-brand-dark transition-transform group-hover:translate-x-0.5">
          브리핑 읽기
          <ArrowRight className="h-4 w-4" strokeWidth={2} />
        </span>
      </span>
    </Link>
  );
}

function BriefingEmpty() {
  return (
    <div className="flex flex-col justify-center rounded-xl bg-brand-dark p-8 text-on-primary">
      <span className="tag self-start bg-on-primary/15 text-on-primary">
        <Newspaper className="h-3 w-3" strokeWidth={2} />
        데일리 브리핑
      </span>
      <p className="mt-4 type-heading-lg">첫 브리핑을 준비하고 있어요</p>
      <p className="mt-2 type-body-md text-on-primary/75">
        매일 아침 금융·시사·금공 소식의 핵심과, 필기·면접에서 어떻게 쓰일지까지 짚어 드릴게요.
      </p>
    </div>
  );
}

function FeatureCard({ a, wide = false }: { a: ArticleSummary; wide?: boolean }) {
  const points = summaryLines(a.summary);
  return (
    <Link
      href={articleHref(a.id)}
      className={cn(
        "group flex flex-col overflow-hidden rounded-xl border border-hairline bg-canvas transition-shadow hover:shadow-level-2",
        wide && "md:flex-row",
      )}
    >
      <ArticleCover a={a} className={cn("aspect-[16/9] w-full", wide && "md:aspect-auto md:min-h-[300px] md:w-[52%] md:shrink-0")} iconSize="h-12 w-12" />
      <div className="flex flex-1 flex-col p-6">
        <MagazineCategoryTag category={a.category} className="self-start" />
        <h3 className="mt-3 type-heading-lg text-ink group-hover:underline">{a.title}</h3>
        {points.length > 0 && (
          <ul className="mt-3 space-y-1.5">
            {points.slice(0, 3).map((p, i) => (
              <li key={i} className="flex gap-2 type-body-md text-ink-secondary">
                <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-ink-mute-2" />
                {p}
              </li>
            ))}
          </ul>
        )}
        <ArticleMeta a={a} className="mt-auto pt-5" />
      </div>
    </Link>
  );
}

function EmptyLine({ text }: { text: string }) {
  return <p className="rounded-xl border border-dashed border-hairline-input px-5 py-8 text-center type-body-md text-ink-mute">{text}</p>;
}

/* ------------------------------------------------------------------ */
/* 카테고리 · 검색 목록                                                    */
/* ------------------------------------------------------------------ */

async function ListView({
  category,
  q,
  page,
  counts,
}: {
  category: MagazineCategory | null;
  q: string | null;
  page: number;
  counts: Map<MagazineCategory, number>;
}) {
  const { items, total } = await listArticles({ category, q, page });
  const info = category ? CATEGORY_INFO[category] : null;
  const Icon = category ? CATEGORY_ICON[category] : null;
  const hrefFor = (p: number) => {
    const base = magazineHref({ category, page: p });
    return q ? `${base}${base.includes("?") ? "&" : "?"}q=${encodeURIComponent(q)}` : base;
  };

  return (
    <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-3 border-b border-hairline pb-5">
          {info && Icon && (
            <span className={cn("inline-flex h-11 w-11 items-center justify-center rounded-lg", info.tone)}>
              <Icon className="h-5 w-5" strokeWidth={1.75} />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="type-heading-lg text-ink">
              {q ? `‘${q}’ 검색 결과` : info ? info.label : "전체 글"}
              <span className="ml-2 tabular type-body-md text-ink-mute">{total}편</span>
            </h2>
            {info && !q && <p className="mt-0.5 type-body-md text-ink-mute">{info.desc}</p>}
          </div>
          {q && (
            <Link href={magazineHref({ category })} className="btn btn-toggle btn-sm">
              <X className="h-3.5 w-3.5" strokeWidth={2} />
              검색 지우기
            </Link>
          )}
        </div>

        {items.length === 0 ? (
          <div className="mt-8">
            <EmptyLine text={q ? "검색어와 맞는 글이 없어요. 다른 단어로 찾아보세요." : "아직 이 주제의 글이 없어요. 곧 채워 둘게요."} />
          </div>
        ) : category === "briefing" && !q ? (
          <ol className="mt-2 divide-y divide-hairline">
            {items.map((a) => (
              <BriefingRow key={a.id} a={a} />
            ))}
          </ol>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((a, i) => (
              <ArticleCard key={a.id} a={a} priority={i === 0} />
            ))}
          </div>
        )}

        <div className="mt-10">
          <Pagination total={total} page={page} hrefFor={hrefFor} pageSize={MAGAZINE_PAGE_SIZE} />
        </div>
      </div>

      <aside className="space-y-4">
        <BriefingStreak compact />
        <div className="rounded-xl border border-hairline p-5">
          <p className="type-heading-sm text-ink">저장한 글</p>
          <div className="mt-2">
            <SavedArticles />
          </div>
        </div>
        <div className="rounded-xl bg-canvas-soft p-5">
          <p className="type-heading-sm text-ink">다른 주제</p>
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {MAGAZINE_CATEGORIES.filter((c) => c.key !== category && (counts.get(c.key) ?? 0) > 0).map((c) => (
              <li key={c.key}>
                <Link href={magazineHref({ category: c.key })} className={cn("tag hover:opacity-80", c.tone)}>
                  {c.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="lg:sticky lg:top-24">
          <AdSlot slot={AD_SLOTS.sidebar} variant="rectangle" />
        </div>
      </aside>
    </div>
  );
}

function BriefingRow({ a }: { a: ArticleSummary }) {
  const day = a.publishedAt ? kstDateKey(a.publishedAt) : null;
  const [, m, d] = day ? day.split("-") : ["", "", ""];
  const points = summaryLines(a.summary);
  return (
    <li>
      <Link href={articleHref(a.id)} className="group flex gap-5 py-5">
        <span className="flex w-14 shrink-0 flex-col items-center rounded-lg border border-hairline py-2">
          <span className="type-micro text-ink-mute">{Number(m)}월</span>
          <span className="tabular type-heading-lg text-ink">{Number(d)}</span>
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="line-clamp-1 type-heading-sm text-ink group-hover:underline">{a.title}</span>
            <ReadBadge id={a.id} />
          </span>
          {points.length > 0 && (
            <span className="mt-1.5 block space-y-0.5">
              {points.slice(0, 3).map((p, i) => (
                <span key={i} className="line-clamp-1 block type-body-md text-ink-secondary">
                  <span className="mr-1.5 tabular text-primary-text">{i + 1}</span>
                  {p}
                </span>
              ))}
            </span>
          )}
          <ArticleMeta a={a} className="mt-2" />
        </span>
      </Link>
    </li>
  );
}
