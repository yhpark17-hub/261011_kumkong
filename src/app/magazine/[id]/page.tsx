import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { ArrowLeft, ArrowRight, CalendarDays, Check, ChevronRight, MessagesSquare, PenLine } from "lucide-react";
import { AdSlot } from "@/components/ads/AdSlot";
import { DbSection } from "@/components/db/DbSection";
import { Markdown, extractHeadings } from "@/components/magazine/Markdown";
import {
  ArticleActions,
  ReadingProgress,
  TableOfContents,
  ViewRecorder,
} from "@/components/magazine/interactive";
import { ArticleCard, ArticleCover, MagazineCategoryTag } from "@/components/magazine/parts";
import { Logo, cn } from "@/components/ui";
import { formatDayHeading } from "@/lib/date";
import {
  CATEGORY_INFO,
  MAGAZINE_NAME,
  SECTION_INFO,
  articleHref,
  formatArticleDate,
  kstDateKey,
  magazineHref,
  sectionOf,
  summaryLines,
  type ArticleSummary,
} from "@/lib/magazine-meta";
import { dbConfigured } from "@/lib/server/db";
import { adjacentArticles, getArticle, relatedArticles } from "@/lib/server/magazine";
import { isAdmin } from "@/lib/server/security";
import { AD_SLOTS, OG_IMAGE, SITE } from "@/lib/site";

function parseId(raw: string): number | null {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export async function generateMetadata({ params }: PageProps<"/magazine/[id]">): Promise<Metadata> {
  const id = parseId((await params).id);
  await connection(); // 발행 시각 비교(Date.now) 전에 — 본문과 같이 요청 시점에 그려요
  const a = id && dbConfigured() ? await getArticle(id).catch(() => null) : null;
  if (!a) return { title: MAGAZINE_NAME, robots: { index: false, follow: false } };
  const description = summaryLines(a.summary).join(" · ").slice(0, 160) || a.body.replace(/[#>*=|`[\]()!-]/g, "").slice(0, 150);
  return {
    title: `${a.title} - ${MAGAZINE_NAME}`,
    description,
    alternates: { canonical: articleHref(a.id) },
    keywords: a.tags,
    openGraph: {
      title: a.title,
      description,
      type: "article",
      publishedTime: a.publishedAt ? new Date(a.publishedAt).toISOString() : undefined,
      modifiedTime: new Date(a.updatedAt).toISOString(),
      section: CATEGORY_INFO[a.category].label,
      tags: a.tags,
      images: a.coverUrl ? [{ url: a.coverUrl }] : [OG_IMAGE],
    },
  };
}

export default function ArticlePage({ params }: PageProps<"/magazine/[id]">) {
  return (
    <div className="mx-auto max-w-[1200px] px-4 pt-6 pb-16 md:px-6 md:pt-10">
      <DbSection noticeTitle="매거진을 준비하고 있어요">
        <Suspense fallback={<ArticleSkeleton />}>{params.then(({ id }) => <ArticleView rawId={id} />)}</Suspense>
      </DbSection>
    </div>
  );
}

function ArticleSkeleton() {
  return (
    <div className="mx-auto max-w-[720px] animate-pulse">
      <div className="h-4 w-40 rounded bg-canvas-soft" />
      <div className="mt-8 h-6 w-20 rounded-full bg-canvas-soft" />
      <div className="mt-4 h-10 w-full rounded-md bg-canvas-soft" />
      <div className="mt-3 h-10 w-2/3 rounded-md bg-canvas-soft" />
      <div className="mt-10 aspect-[16/9] rounded-xl bg-canvas-soft" />
      <div className="mt-10 space-y-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="h-4 rounded bg-canvas-soft" />
        ))}
      </div>
    </div>
  );
}

async function ArticleView({ rawId }: { rawId: string }) {
  await connection();
  const id = parseId(rawId);
  if (!id) notFound();
  const admin = await isAdmin();
  const a = await getArticle(id, { admin });
  if (!a) notFound();

  const isPublic = a.live;
  const [adjacent, related] = isPublic
    ? await Promise.all([adjacentArticles(a), relatedArticles(a, 3)])
    : [{ prev: null, next: null }, [] as ArticleSummary[]];

  const headings = extractHeadings(a.body);
  const toc = headings.filter((h) => h.level === 2).length >= 3 || headings.length >= 5 ? headings : [];
  const isBriefing = a.category === "briefing";
  const isWebtoon = a.category === "webtoon";
  const points = summaryLines(a.summary);
  const day = a.publishedAt ? kstDateKey(a.publishedAt) : null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": isBriefing ? "NewsArticle" : "Article",
    headline: a.title,
    description: points.join(" "),
    datePublished: a.publishedAt ? new Date(a.publishedAt).toISOString() : undefined,
    dateModified: new Date(a.updatedAt).toISOString(),
    author: { "@type": "Organization", name: a.author },
    publisher: { "@type": "Organization", name: SITE.name, url: SITE.url },
    mainEntityOfPage: `${SITE.url}${articleHref(a.id)}`,
    image: a.coverUrl ? [a.coverUrl] : undefined,
    articleSection: CATEGORY_INFO[a.category].label,
    keywords: a.tags.join(", ") || undefined,
  };

  return (
    <>
      {isPublic && <ViewRecorder id={a.id} />}
      <ReadingProgress targetId="article-body" />
      {isPublic && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      )}

      {admin && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-canvas-cream px-4 py-3">
          <p className="type-caption text-ink-secondary">
            {isPublic
              ? "운영자 화면 — 공개 중인 글이에요."
              : a.status === 0
                ? "미리보기 — 아직 임시저장 상태라 다른 사람에게는 보이지 않아요."
                : `미리보기 — ${a.publishedAt ? formatArticleDate(a.publishedAt) : ""} 예약 발행 글이에요.`}
          </p>
          <Link href={`/admin/magazine/${a.id}`} className="btn btn-sm btn-secondary">
            <PenLine className="h-3.5 w-3.5" strokeWidth={1.75} />
            수정하기
          </Link>
        </div>
      )}

      <nav aria-label="위치" className="flex items-center gap-1 type-caption text-ink-mute">
        <span>{MAGAZINE_NAME}</span>
        <ChevronRight className="h-3.5 w-3.5" strokeWidth={1.75} />
        <Link href={SECTION_INFO[sectionOf(a.category)].href} className="hover:text-ink hover:underline">
          {SECTION_INFO[sectionOf(a.category)].label}
        </Link>
        {!isBriefing && (
          <>
            <ChevronRight className="h-3.5 w-3.5" strokeWidth={1.75} />
            <Link href={magazineHref({ category: a.category })} className="hover:text-ink hover:underline">
              {CATEGORY_INFO[a.category].label}
            </Link>
          </>
        )}
      </nav>

      <div className={cn("mt-6 grid gap-12", toc.length || isBriefing ? "lg:grid-cols-[minmax(0,1fr)_240px] xl:grid-cols-[minmax(0,720px)_280px] xl:justify-between" : "")}>
        <article className={cn("min-w-0", !(toc.length || isBriefing) && "mx-auto w-full max-w-[720px]")}>
          <header>
            <div className="flex flex-wrap items-center gap-2">
              <MagazineCategoryTag category={a.category} />
              {isBriefing && day && (
                <span className="inline-flex items-center gap-1 type-caption text-ink-mute">
                  <CalendarDays className="h-3.5 w-3.5" strokeWidth={1.75} />
                  {formatDayHeading(day)}
                </span>
              )}
            </div>
            <h1 className="mt-4 type-heading-lg text-ink [word-break:keep-all] md:type-display-md">{a.title}</h1>

            {!isBriefing && points.length === 1 && (
              <p className="mt-4 type-body-lg text-ink-secondary [word-break:keep-all]">{points[0]}</p>
            )}

            <div className="mt-6 flex items-center gap-3 border-b border-hairline pb-6">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-canvas-soft">
                <Logo className="h-6 w-6" />
              </span>
              <div className="min-w-0">
                <p className="type-body-md font-semibold text-ink">{a.author}</p>
                <p className="flex flex-wrap gap-x-2 type-caption text-ink-mute">
                  {a.publishedAt && <span className="tabular">{formatArticleDate(a.publishedAt)}</span>}
                  <span>· {a.readMinutes}분 분량</span>
                  {a.updatedAt - (a.publishedAt ?? 0) > 3600_000 && a.publishedAt && (
                    <span>· 수정 {formatArticleDate(a.updatedAt)}</span>
                  )}
                  {a.views > 0 && <span className="tabular">· 조회 {a.views.toLocaleString()}</span>}
                </p>
              </div>
            </div>
          </header>

          {!isBriefing && points.length > 1 && (
            <section aria-label="이 글에서 알 수 있는 것" className="mt-8 rounded-xl bg-canvas-soft px-6 py-5">
              <p className="type-micro-cap text-ink-mute">이 글에서 알 수 있어요</p>
              <ul className="mt-3 space-y-2">
                {points.map((p, i) => (
                  <li key={i} className="flex gap-2.5 type-body-md text-ink [word-break:keep-all]">
                    <Check className="mt-1 h-4 w-4 shrink-0 text-primary" strokeWidth={2} />
                    {p}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {isBriefing && points.length > 0 && (
            <section aria-label="3줄 요약" className="mt-8 rounded-xl bg-brand-dark p-6 text-on-primary">
              <p className="type-micro-cap text-on-primary/70">바쁘면 이것만</p>
              <ol className="mt-3 space-y-3">
                {points.map((p, i) => (
                  <li key={i} className="flex gap-3 type-body-lg">
                    <span className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-on-primary/15 tabular type-micro">
                      {i + 1}
                    </span>
                    <span className="[word-break:keep-all]">{p}</span>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {isBriefing && headings.filter((h) => h.level === 2).length > 1 && (
            <nav aria-label="브리핑 섹션" className="no-scrollbar fade-x -mx-4 mt-6 overflow-x-auto px-4 lg:hidden">
              <ul className="flex gap-2 [&>li]:shrink-0">
                {headings
                  .filter((h) => h.level === 2)
                  .map((h) => (
                    <li key={h.id}>
                      <a href={`#${h.id}`} className="inline-flex shrink-0 whitespace-nowrap rounded-full border border-hairline px-3 py-1.5 type-caption text-ink-secondary hover:border-hairline-input">
                        {h.text}
                      </a>
                    </li>
                  ))}
              </ul>
            </nav>
          )}

          {a.coverUrl && !isWebtoon && (
            <ArticleCover a={a} className="mt-8 aspect-[16/9] w-full rounded-xl border border-hairline" />
          )}

          <div id="article-body" className="mt-10">
            <Markdown source={a.body} variant={isBriefing ? "briefing" : isWebtoon ? "webtoon" : "article"} />
          </div>

          {a.tags.length > 0 && (
            <ul className="mt-10 flex flex-wrap gap-2">
              {a.tags.map((t) => (
                <li key={t}>
                  <Link
                    href={`/magazine?q=${encodeURIComponent(t)}`}
                    className="inline-flex rounded-full bg-canvas-soft px-3 py-1.5 type-caption text-ink-secondary hover:bg-hairline"
                  >
                    #{t}
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-12 rounded-xl border border-hairline px-5 py-7 text-center">
            <p className="type-heading-sm text-ink">이 글이 도움이 됐나요?</p>
            <p className="mt-1 type-caption text-ink-mute">반응이 많은 주제를 더 자주, 더 깊게 다룰게요.</p>
            <div className="mt-5">
              <ArticleActions id={a.id} title={a.title} category={a.category} initialLikes={a.likes} preview={!isPublic} />
            </div>
          </div>

          <AdSlot slot={AD_SLOTS.inArticle} variant="inarticle" className="mt-10" />

          {(adjacent.prev || adjacent.next) && (
            <nav aria-label="이전·다음 글" className="mt-10 grid gap-3 sm:grid-cols-2">
              {adjacent.prev ? <AdjacentLink a={adjacent.prev} dir="prev" briefing={isBriefing} /> : <span />}
              {adjacent.next ? <AdjacentLink a={adjacent.next} dir="next" briefing={isBriefing} /> : <span />}
            </nav>
          )}

          <ContinueCard briefing={isBriefing} />
        </article>

        {(toc.length > 0 || isBriefing) && (
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-6">
              {(toc.length > 0 || isBriefing) && headings.length > 0 && <TableOfContents headings={isBriefing ? headings.filter((h) => h.level === 2) : toc} />}
            </div>
          </aside>
        )}
      </div>

      {related.length > 0 && (
        <section aria-labelledby="related-title" className="mt-16 border-t border-hairline pt-10">
          <div className="mb-5 flex items-end justify-between">
            <h2 id="related-title" className="type-heading-lg text-ink">
              함께 읽으면 좋은 글
            </h2>
            <Link href={magazineHref({ category: a.category })} className="link type-caption">
              {CATEGORY_INFO[a.category].label} 더 보기 →
            </Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((r) => (
              <ArticleCard key={r.id} a={r} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}

function AdjacentLink({ a, dir, briefing }: { a: ArticleSummary; dir: "prev" | "next"; briefing: boolean }) {
  const label = briefing ? (dir === "prev" ? "이전 브리핑" : "다음 브리핑") : dir === "prev" ? "이전 글" : "다음 글";
  return (
    <Link
      href={articleHref(a.id)}
      className={cn(
        "group flex flex-col rounded-xl border border-hairline p-4 transition-colors hover:border-hairline-input hover:bg-canvas-soft",
        dir === "next" && "sm:items-end sm:text-right",
      )}
    >
      <span className="inline-flex items-center gap-1 type-caption text-ink-mute">
        {dir === "prev" && <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.75} />}
        {label}
        {dir === "next" && <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} />}
      </span>
      <span className="mt-1 line-clamp-2 type-body-md font-semibold text-ink group-hover:underline">{a.title}</span>
    </Link>
  );
}

/** 글을 다 읽은 뒤 다음 행동 — 일정 확인 / 커뮤니티 */
function ContinueCard({ briefing }: { briefing: boolean }) {
  return (
    <div className="mt-10 grid gap-3 sm:grid-cols-2">
      <Link href="/" className="group flex items-center gap-3 rounded-xl bg-canvas-soft p-4 hover:bg-hairline/60">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-canvas text-primary-text">
          <CalendarDays className="h-5 w-5" strokeWidth={1.75} />
        </span>
        <span className="min-w-0">
          <span className="block type-body-md font-semibold text-ink group-hover:underline">이번 주 채용 일정</span>
          <span className="block type-caption text-ink-mute">{briefing ? "오늘 마감·필기 일정을 바로 확인" : "서류 마감부터 면접까지 한 달력에서"}</span>
        </span>
      </Link>
      <Link href="/board" className="group flex items-center gap-3 rounded-xl bg-canvas-soft p-4 hover:bg-hairline/60">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-canvas text-primary-text">
          <MessagesSquare className="h-5 w-5" strokeWidth={1.75} />
        </span>
        <span className="min-w-0">
          <span className="block type-body-md font-semibold text-ink group-hover:underline">콩밭에서 이야기 나누기</span>
          <span className="block type-caption text-ink-mute">궁금한 점은 다른 준비생들과 함께</span>
        </span>
      </Link>
    </div>
  );
}

