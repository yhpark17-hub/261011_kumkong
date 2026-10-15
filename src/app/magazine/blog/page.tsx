import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { Suspense } from "react";
import { X } from "lucide-react";
import { AdSlot } from "@/components/ads/AdSlot";
import { Pagination } from "@/components/board/parts";
import { DbSection } from "@/components/db/DbSection";
import { BLOG_VIEW_COOKIE, ViewToggle, type BlogView } from "@/components/magazine/BlogControls";
import { SavedArticles } from "@/components/magazine/interactive";
import { ArticleCard, ArticleListRow, CATEGORY_ICON, MagazineCategoryNav } from "@/components/magazine/parts";
import { EmptyLine, FeatureCard, MagazineShell, MagazineSkeleton } from "@/components/magazine/sections";
import { cn } from "@/components/ui";
import {
  BLOG_CATEGORIES,
  CATEGORY_INFO,
  MAGAZINE_NAME,
  MAGAZINE_PAGE_SIZE,
  articleHref,
  isBlogCategory,
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
type Sort = "latest" | "popular";
const one = (v: string | string[] | undefined) => ((Array.isArray(v) ? v[0] : v) ?? "").trim();
const BLOG_KEYS = BLOG_CATEGORIES.map((c) => c.key);

/** 블로그 목록 주소 (주제·검색·정렬·보기·쪽) */
function blogHref(p: { category?: MagazineCategory | null; q?: string | null; sort?: Sort; view?: BlogView; page?: number }): string {
  const sp = new URLSearchParams();
  if (p.category) sp.set("c", p.category);
  if (p.q) sp.set("q", p.q);
  if (p.sort === "popular") sp.set("sort", "popular");
  if (p.view) sp.set("view", p.view);
  if (p.page && p.page > 1) sp.set("page", String(p.page));
  const qs = sp.toString();
  return qs ? `/magazine/blog?${qs}` : "/magazine/blog";
}

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
  const sort: Sort = one(sp.sort) === "popular" ? "popular" : "latest";
  const page = Math.max(1, Number(one(sp.page)) || 1);
  const saved = (await cookies()).get(BLOG_VIEW_COOKIE)?.value;
  const view: BlogView = one(sp.view) === "list" || one(sp.view) === "card" ? (one(sp.view) as BlogView) : saved === "list" ? "list" : "card";

  // 전체·최신순일 때 에디터 추천 1편을 1쪽 맨 위에 크게 (다른 쪽에서도 목록에서 빼서 중복 없이)
  const front = !category && !q && sort === "latest";
  const [counts, featured, popular] = await Promise.all([
    categoryCounts(),
    front ? listArticles({ featured: true, categories: BLOG_KEYS, pageSize: 1 }) : Promise.resolve({ items: [], total: 0 }),
    popularArticles(5),
  ]);
  const pick = featured.items[0];
  const showPick = pick && page === 1;
  const { items, total } = await listArticles({
    category,
    categories: q ? undefined : BLOG_KEYS, // 검색은 브리핑 글까지, 목록은 블로그 글만
    q,
    sort,
    page,
    excludeIds: pick ? [pick.id] : undefined,
  });

  const info = category ? CATEGORY_INFO[category] : null;
  const Icon = category ? CATEGORY_ICON[category] : null;
  const seg = "inline-flex h-8 items-center rounded-md px-3 type-caption transition-colors";

  return (
    <div className="mt-8">
      <MagazineCategoryNav active={category} counts={counts} />

      {showPick && (
        <section aria-label="에디터 추천" className="mt-8">
          <p className="mb-3 type-micro-cap text-primary-text">에디터 추천 · 먼저 읽어 보세요</p>
          <FeatureCard a={pick} wide />
        </section>
      )}

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0">
          {/* 목록 머리: 지금 보는 것 + 정렬 + 보기 방식 */}
          <div className="flex flex-col gap-3 border-b border-hairline pb-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              {info && Icon && (
                <span className={cn("inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", info.tone)}>
                  <Icon className="h-5 w-5" strokeWidth={1.75} />
                </span>
              )}
              <div className="min-w-0">
                <h2 className="type-heading-lg text-ink">
                  {q ? `‘${q}’ 검색 결과` : info ? info.label : "전체 글"}
                  <span className="ml-2 tabular type-body-md text-ink-mute">{total + (pick ? 1 : 0)}편</span>
                </h2>
                {info && !q && <p className="mt-0.5 type-caption text-ink-mute">{info.desc}</p>}
              </div>
              {q && (
                <Link href={blogHref({ category })} className="btn btn-toggle btn-sm shrink-0">
                  <X className="h-3.5 w-3.5" strokeWidth={2} />
                  검색 지우기
                </Link>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <div role="group" aria-label="정렬" className="inline-flex rounded-lg bg-canvas-soft p-1">
                {(
                  [
                    ["latest", "최신순"],
                    ["popular", "인기순"],
                  ] as const
                ).map(([key, label]) => (
                  <Link
                    key={key}
                    href={blogHref({ category, q, sort: key, view })}
                    aria-current={sort === key ? "true" : undefined}
                    className={cn(seg, sort === key ? "bg-canvas text-ink shadow-level-1" : "text-ink-mute hover:text-ink")}
                  >
                    {label}
                  </Link>
                ))}
              </div>
              <ViewToggle
                view={view}
                hrefs={{ card: blogHref({ category, q, sort, page, view: "card" }), list: blogHref({ category, q, sort, page, view: "list" }) }}
              />
            </div>
          </div>

          {items.length === 0 ? (
            <div className="mt-8">
              <EmptyLine text={q ? "검색어와 맞는 글이 없어요. 다른 단어로 찾아보세요." : pick ? "다른 글을 준비하고 있어요." : "아직 이 주제의 글이 없어요. 곧 채워 둘게요."} />
            </div>
          ) : view === "card" ? (
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              {items.map((a) => (
                <ArticleCard key={a.id} a={a} large />
              ))}
            </div>
          ) : (
            <ul className="divide-y divide-hairline">
              {items.map((a) => (
                <li key={a.id}>
                  <ArticleListRow a={a} />
                </li>
              ))}
            </ul>
          )}

          <div className="mt-10">
            <Pagination total={total} page={page} hrefFor={(p) => blogHref({ category, q, sort, view, page: p })} pageSize={MAGAZINE_PAGE_SIZE} />
          </div>
        </div>

        <aside className="space-y-4">
          <section aria-labelledby="popular-title" className="rounded-xl border border-hairline p-5">
            <h2 id="popular-title" className="type-heading-sm text-ink">
              많이 읽은 글
            </h2>
            {popular.length === 0 ? (
              <p className="mt-2 type-caption text-ink-mute">글이 쌓이면 많이 읽은 순서로 보여 드려요.</p>
            ) : (
              <ol className="mt-2 divide-y divide-hairline">
                {popular.map((a, i) => (
                  <li key={a.id}>
                    <Link href={articleHref(a.id)} className="group flex gap-3 py-3">
                      <span className={cn("w-5 shrink-0 tabular type-heading-sm", i < 3 ? "text-primary-text" : "text-ink-mute")}>{i + 1}</span>
                      <span className="min-w-0">
                        <span className="line-clamp-2 type-body-md text-ink [word-break:keep-all] group-hover:underline">{a.title}</span>
                        <span className="mt-0.5 block type-micro text-ink-mute">{CATEGORY_INFO[a.category].label}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
            )}
          </section>
          <div className="rounded-xl border border-hairline p-5">
            <p className="type-heading-sm text-ink">저장한 글</p>
            <div className="mt-2">
              <SavedArticles />
            </div>
          </div>
          <div className="lg:sticky lg:top-24">
            <AdSlot slot={AD_SLOTS.sidebar} variant="rectangle" />
          </div>
        </aside>
      </div>
    </div>
  );
}
