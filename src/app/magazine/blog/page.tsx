import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { X } from "lucide-react";
import { AdSlot } from "@/components/ads/AdSlot";
import { Pagination } from "@/components/board/parts";
import { DbSection } from "@/components/db/DbSection";
import { SavedArticles } from "@/components/magazine/interactive";
import { ArticleCard, ArticleRow, CATEGORY_ICON, MagazineCategoryNav, SectionHead } from "@/components/magazine/parts";
import { EmptyLine, FeatureCard, MagazineShell, MagazineSkeleton } from "@/components/magazine/sections";
import { cn } from "@/components/ui";
import {
  BLOG_CATEGORIES,
  CATEGORY_INFO,
  MAGAZINE_NAME,
  MAGAZINE_PAGE_SIZE,
  isBlogCategory,
  magazineHref,
  type MagazineCategory,
} from "@/lib/magazine-meta";
import { categoryCounts, listArticles, popularArticles } from "@/lib/server/magazine";
import { AD_SLOTS } from "@/lib/site";

export const metadata: Metadata = {
  title: `금융 블로그 — 필기·면접·금공 지식 | ${MAGAZINE_NAME}`,
  description:
    "NCS 필기 준비법, 면접 전략, 금융공기업이 하는 일과 금융 상식, 입문 가이드와 현직자 이야기까지. 금융공기업 준비생을 위한 금콩 금융 블로그.",
  alternates: { canonical: "/magazine/blog" },
};

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => ((Array.isArray(v) ? v[0] : v) ?? "").trim();
const BLOG_KEYS = BLOG_CATEGORIES.map((c) => c.key);

export default function BlogPage({ searchParams }: PageProps<"/magazine/blog">) {
  return (
    <Suspense fallback={<BlogFrame q="" />}>
      {searchParams.then((sp) => (
        <BlogFrame q={one((sp as SP).q).slice(0, 40)}>
          <BlogBody sp={sp as SP} />
        </BlogFrame>
      ))}
    </Suspense>
  );
}

function BlogFrame({ q, children }: { q: string; children?: React.ReactNode }) {
  return (
    <MagazineShell section="blog" q={q}>
      <DbSection noticeTitle="매거진을 준비하고 있어요">
        {children ? <Suspense fallback={<MagazineSkeleton />}>{children}</Suspense> : <MagazineSkeleton />}
      </DbSection>
    </MagazineShell>
  );
}

async function BlogBody({ sp }: { sp: SP }) {
  await connection();
  const c = one(sp.c);
  const category = isBlogCategory(c) ? c : null;
  const q = one(sp.q).slice(0, 40) || null;
  const page = Math.max(1, Number(one(sp.page)) || 1);
  const counts = await categoryCounts();

  return (
    <div className="mt-8">
      <MagazineCategoryNav active={category} counts={counts} />
      {category || q || page > 1 ? <ListView category={category} q={q} page={page} counts={counts} /> : <BlogFront counts={counts} />}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 블로그 첫 화면                                                         */
/* ------------------------------------------------------------------ */

async function BlogFront({ counts }: { counts: Map<MagazineCategory, number> }) {
  const [featured, starter, popular] = await Promise.all([
    listArticles({ featured: true, categories: BLOG_KEYS, pageSize: 3 }),
    listArticles({ category: "starter", pageSize: 4 }),
    popularArticles(5),
  ]);
  const latest = await listArticles({ categories: BLOG_KEYS, excludeIds: featured.items.map((a) => a.id), pageSize: 6 });

  return (
    <div className="mt-8 space-y-16">
      {featured.items.length > 0 && (
        <section>
          <SectionHead title="에디터 추천" desc="지금 읽어 두면 좋은 글" />
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

      {featured.items.length === 0 && latest.items.length === 0 && <EmptyLine text="첫 글을 준비하고 있어요. 곧 채워 둘게요." />}

      <AdSlot slot={AD_SLOTS.inFeed} variant="infeed" />

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

      <section>
        <SectionHead title="주제별로 둘러보기" />
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {BLOG_CATEGORIES.map((c) => {
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

/* ------------------------------------------------------------------ */
/* 주제별 · 검색 목록                                                     */
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
  // 검색은 브리핑까지 함께, 주제 목록은 블로그 글만
  const { items, total } = await listArticles({ category, categories: q ? undefined : BLOG_KEYS, q, page });
  const info = category ? CATEGORY_INFO[category] : null;
  const Icon = category ? CATEGORY_ICON[category] : null;

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
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((a, i) => (
              <ArticleCard key={a.id} a={a} priority={i === 0} />
            ))}
          </div>
        )}

        <div className="mt-10">
          <Pagination total={total} page={page} hrefFor={(p) => magazineHref({ category, q, page: p })} pageSize={MAGAZINE_PAGE_SIZE} />
        </div>
      </div>

      <aside className="space-y-4">
        <div className="rounded-xl border border-hairline p-5">
          <p className="type-heading-sm text-ink">저장한 글</p>
          <div className="mt-2">
            <SavedArticles />
          </div>
        </div>
        <div className="rounded-xl bg-canvas-soft p-5">
          <p className="type-heading-sm text-ink">다른 주제</p>
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {BLOG_CATEGORIES.filter((c) => c.key !== category && (counts.get(c.key) ?? 0) > 0).map((c) => (
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
