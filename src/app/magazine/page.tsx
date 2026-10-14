import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { BookOpen, CalendarDays, Clock } from "lucide-react";
import { AdSlot } from "@/components/ads/AdSlot";
import { Pagination } from "@/components/board/parts";
import { DbSection } from "@/components/db/DbSection";
import { ArticleCard, SectionHead } from "@/components/magazine/parts";
import { BriefingEmpty, BriefingHero, BriefingRow, EmptyLine, MagazineShell, MagazineSkeleton } from "@/components/magazine/sections";
import {
  BLOG_CATEGORIES,
  MAGAZINE_NAME,
  MAGAZINE_PAGE_SIZE,
  isBlogCategory,
  magazineHref,
} from "@/lib/magazine-meta";
import { listArticles } from "@/lib/server/magazine";
import { AD_SLOTS } from "@/lib/site";

export const metadata: Metadata = {
  title: `데일리 브리핑 — 금융·시사·금공 뉴스 5분 정리 | ${MAGAZINE_NAME}`,
  description:
    "매일 아침과 점심, 금융공기업 준비생이 꼭 알아야 할 금융·시사·공공기관 뉴스와 오늘의 채용 일정을 5분 브리핑으로 정리합니다.",
  alternates: { canonical: "/magazine", types: { "application/rss+xml": "/magazine/rss.xml" } },
};

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => ((Array.isArray(v) ? v[0] : v) ?? "").trim();
const BLOG_KEYS = BLOG_CATEGORIES.map((c) => c.key);

/** 매거진 · 데일리 브리핑 */
export default function BriefingPage({ searchParams }: PageProps<"/magazine">) {
  return (
    <MagazineShell section="briefing">
      <DbSection noticeTitle="매거진을 준비하고 있어요">
        <Suspense fallback={<MagazineSkeleton />}>{searchParams.then((sp) => <BriefingBody sp={sp as SP} />)}</Suspense>
      </DbSection>
    </MagazineShell>
  );
}

async function BriefingBody({ sp }: { sp: SP }) {
  // 예전 주소(/magazine?c=exam, ?q=) 는 금융 블로그로
  const c = one(sp.c);
  const q = one(sp.q);
  if (isBlogCategory(c) || q) redirect(magazineHref({ category: isBlogCategory(c) ? c : null, q: q || null }));

  await connection();
  const page = Math.max(1, Number(one(sp.page)) || 1);
  const latest = await listArticles({ category: "briefing", pageSize: 1 });
  const hero = page === 1 ? latest.items[0] : undefined;
  const [past, blog] = await Promise.all([
    listArticles({ category: "briefing", page, excludeIds: latest.items[0] ? [latest.items[0].id] : [] }),
    page === 1 ? listArticles({ categories: BLOG_KEYS, pageSize: 3 }) : Promise.resolve({ items: [], total: 0 }),
  ]);

  return (
    <div className="mt-8 space-y-14">
      {page === 1 && (
        <section aria-label="오늘의 브리핑" className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          {hero ? <BriefingHero a={hero} /> : <BriefingEmpty />}
          <div className="flex flex-col gap-4">
            <div className="rounded-xl border border-hairline p-5">
              <p className="flex items-center gap-2 type-heading-sm text-ink">
                <Clock className="h-4 w-4 text-ink-mute" strokeWidth={1.75} />
                매일 두 번
              </p>
              <ul className="mt-3 space-y-2 type-body-md text-ink-secondary">
                <li>
                  <span className="font-semibold text-ink">아침판</span> — 전날 저녁~아침 뉴스, 오늘의 채용 일정, 오늘의 용어
                </li>
                <li>
                  <span className="font-semibold text-ink">점심판</span> — 오전 주요 뉴스, 오늘의 면접 질문
                </li>
              </ul>
              <p className="mt-3 type-caption text-ink-mute">모든 뉴스는 원문 출처 링크를 함께 달아요.</p>
            </div>
            <Link href="/" className="group flex flex-1 items-center gap-3 rounded-xl bg-canvas-soft p-5 hover:bg-hairline/60">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-canvas text-primary-text">
                <CalendarDays className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <span className="min-w-0">
                <span className="block type-body-md font-semibold text-ink group-hover:underline">이번 주 채용 일정</span>
                <span className="block type-caption text-ink-mute">서류 마감·필기·면접을 달력에서 확인</span>
              </span>
            </Link>
          </div>
        </section>
      )}

      <section>
        <SectionHead title={page === 1 ? "지난 브리핑" : `지난 브리핑 · ${page}쪽`} desc="날짜별로 다시 읽어 보세요" />
        {past.items.length === 0 ? (
          <EmptyLine text="브리핑이 쌓이면 날짜별로 다시 볼 수 있어요." />
        ) : (
          <ol className="divide-y divide-hairline border-y border-hairline">
            {past.items.map((a) => (
              <BriefingRow key={a.id} a={a} />
            ))}
          </ol>
        )}
        <div className="mt-8">
          <Pagination
            total={past.total}
            page={page}
            hrefFor={(p) => magazineHref({ category: "briefing", page: p })}
            pageSize={MAGAZINE_PAGE_SIZE}
          />
        </div>
      </section>

      <AdSlot slot={AD_SLOTS.inFeed} variant="infeed" />

      {blog.items.length > 0 && (
        <section>
          <SectionHead title="금융 블로그 새 글" desc="필기·면접·금공 지식" href={magazineHref({})} linkLabel="블로그 전체" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {blog.items.map((a) => (
              <ArticleCard key={a.id} a={a} />
            ))}
          </div>
          <Link href={magazineHref({})} className="btn btn-toggle btn-sm mt-6">
            <BookOpen className="h-4 w-4" strokeWidth={1.75} />
            금융 블로그 둘러보기
          </Link>
        </section>
      )}
    </div>
  );
}
