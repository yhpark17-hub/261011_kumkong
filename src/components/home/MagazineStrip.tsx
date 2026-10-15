import Link from "next/link";
import { connection } from "next/server";
import { ArrowRight, Newspaper } from "lucide-react";
import { NewsSectionTag } from "@/components/magazine/news";
import { ArticleRow } from "@/components/magazine/parts";
import { formatDayHeading } from "@/lib/date";
import { BLOG_CATEGORIES, SECTION_INFO } from "@/lib/magazine-meta";
import { newsHref } from "@/lib/news-meta";
import { listArticles } from "@/lib/server/magazine";
import { latestNewsDate, newsByDate } from "@/lib/server/news";

/** 홈: 오늘의 브리핑(시사 뉴스) + 금융 블로그 새 글 */
export async function MagazineStrip() {
  await connection();
  const [date, latest] = await Promise.all([latestNewsDate(), listArticles({ categories: BLOG_CATEGORIES.map((c) => c.key), pageSize: 3 })]);
  const news = date ? (await newsByDate(date)).slice(0, 5) : [];
  if (news.length === 0 && latest.items.length === 0) return null;
  const [top, ...more] = news;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <section aria-label="오늘의 브리핑" className="flex flex-col rounded-xl border border-hairline bg-canvas p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 type-heading-md text-ink">
            <Newspaper className="h-5 w-5 text-primary-text" strokeWidth={1.75} />
            오늘의 브리핑
            {date && <span className="type-caption font-normal text-ink-mute">{formatDayHeading(date)}</span>}
          </h2>
          <Link href="/magazine" className="link inline-flex shrink-0 items-center gap-1 type-caption">
            전체
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} />
          </Link>
        </div>
        {top ? (
          <>
            <Link href={newsHref(top.id)} className="group mt-4 block rounded-lg bg-canvas-soft p-4">
              <NewsSectionTag section={top.section} />
              <span className="mt-2 block type-heading-sm text-ink [word-break:keep-all] group-hover:underline">{top.title}</span>
              <span className="mt-1.5 line-clamp-2 type-body-md text-ink-secondary">{top.summary}</span>
            </Link>
            <ul className="mt-2 divide-y divide-hairline">
              {more.map((n) => (
                <li key={n.id}>
                  <Link href={newsHref(n.id)} className="group flex items-center gap-2 py-2.5">
                    <NewsSectionTag section={n.section} className="shrink-0" />
                    <span className="min-w-0 truncate type-body-md text-ink group-hover:underline">{n.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="mt-4 type-body-md text-ink-mute">오늘의 시사 뉴스를 준비하고 있어요.</p>
        )}
      </section>

      <div className="rounded-xl border border-hairline p-6">
        <div className="flex items-center justify-between">
          <h2 className="type-heading-md text-ink">{SECTION_INFO.blog.label}</h2>
          <Link href={SECTION_INFO.blog.href} className="link inline-flex items-center gap-1 type-caption">
            전체
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} />
          </Link>
        </div>
        {latest.items.length ? (
          <div className="mt-1 divide-y divide-hairline">
            {latest.items.map((a) => (
              <ArticleRow key={a.id} a={a} />
            ))}
          </div>
        ) : (
          <p className="py-6 type-body-md text-ink-mute">필기·면접·금공 지식 글을 준비하고 있어요.</p>
        )}
      </div>
    </div>
  );
}

export function MagazineStripSkeleton() {
  return (
    <div className="grid animate-pulse gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <div className="h-64 rounded-xl bg-canvas-soft" />
      <div className="h-64 rounded-xl bg-canvas-soft" />
    </div>
  );
}
