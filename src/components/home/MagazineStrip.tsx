import Link from "next/link";
import { connection } from "next/server";
import { ArrowRight } from "lucide-react";
import { KongMascot } from "@/components/magazine/KongMascot";
import { ArticleRow } from "@/components/magazine/parts";
import { formatDayHeading } from "@/lib/date";
import { BLOG_CATEGORIES, SECTION_INFO } from "@/lib/magazine-meta";
import { NEWS_SECTION_INFO, itemHref, letterHref } from "@/lib/news-meta";
import { arrangeLetter, issueItems, latestIssue } from "@/lib/server/briefing";
import { listArticles } from "@/lib/server/magazine";

/** 홈: 오늘의 레터(데일리 브리핑) + 금융 블로그 새 글 */
export async function MagazineStrip() {
  await connection();
  const [issue, latest] = await Promise.all([latestIssue("morning"), listArticles({ categories: BLOG_CATEGORIES.map((c) => c.key), pageSize: 3 })]);
  const top = issue ? arrangeLetter(await issueItems(issue.date, "morning")).top : [];
  if (!issue && latest.items.length === 0) return null;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <section aria-label="오늘의 브리핑" className="flex flex-col rounded-xl bg-canvas-cream p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 type-heading-md text-ink">
            <KongMascot className="h-7 w-7" />
            데일리 브리핑
            {issue && <span className="type-caption font-normal text-ink-mute">{formatDayHeading(issue.date)} 금콩 브리핑</span>}
          </h2>
          <Link href={issue ? letterHref(issue.date, "morning") : "/magazine"} className="link inline-flex shrink-0 items-center gap-1 type-caption">
            브리핑 읽기
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} />
          </Link>
        </div>
        {issue ? (
          <>
            <Link href={letterHref(issue.date, "morning")} className="mt-4 block type-heading-md text-ink [word-break:keep-all] hover:underline">
              {issue.title}
            </Link>
            {top.length > 0 && (
              <ol className="mt-3 space-y-2">
                {top.map((n, i) => (
                  <li key={n.id}>
                    <Link href={itemHref(n)} className="group flex gap-2.5 rounded-lg bg-canvas px-3 py-2.5">
                      <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-dark tabular type-micro font-bold text-on-primary">
                        {i + 1}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate type-body-md font-semibold text-ink group-hover:underline">{n.title}</span>
                        <span className="block truncate type-caption text-ink-mute">
                          {NEWS_SECTION_INFO[n.section].label}
                          {n.takeaway ? ` · ${n.takeaway}` : ""}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
            )}
          </>
        ) : (
          <p className="mt-4 type-body-md text-ink-mute">매일 아침 기사 브리핑, 점심에는 금콩 스터디로 찾아올게요.</p>
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
