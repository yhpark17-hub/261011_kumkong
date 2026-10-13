import Link from "next/link";
import { connection } from "next/server";
import { ArrowRight, Newspaper } from "lucide-react";
import { BriefingStreak, UnreadDot } from "@/components/magazine/interactive";
import { ArticleRow } from "@/components/magazine/parts";
import { formatDayHeading } from "@/lib/date";
import { MAGAZINE_NAME, articleHref, kstDateKey, summaryLines } from "@/lib/magazine-meta";
import { listArticles } from "@/lib/server/magazine";

/** 홈: 오늘의 브리핑 + 매거진 새 글 */
export async function MagazineStrip() {
  await connection();
  const [briefing, latest] = await Promise.all([
    listArticles({ category: "briefing", pageSize: 1 }),
    listArticles({ excludeCategory: "briefing", pageSize: 3 }),
  ]);
  const today = briefing.items[0];
  if (!today && latest.items.length === 0) return null;
  const points = today ? summaryLines(today.summary).slice(0, 3) : [];
  const day = today?.publishedAt ? kstDateKey(today.publishedAt) : null;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      {today ? (
        <Link href={articleHref(today.id)} className="group relative flex flex-col overflow-hidden rounded-xl bg-brand-dark p-6 text-on-primary">
          <span aria-hidden className="pointer-events-none absolute -top-20 -right-20 h-56 w-56 rounded-full bg-primary/30 blur-3xl" />
          <span className="relative flex flex-wrap items-center gap-2">
            <span className="tag bg-on-primary/15 text-on-primary">
              <Newspaper className="h-3 w-3" strokeWidth={2} />
              오늘의 브리핑
            </span>
            {day && <span className="type-caption text-on-primary/70">{formatDayHeading(day)}</span>}
            <UnreadDot id={today.id} />
          </span>
          <span className="relative mt-3 type-heading-md md:type-heading-lg">{today.title}</span>
          {points.length > 0 && (
            <ol className="relative mt-4 space-y-2">
              {points.map((p, i) => (
                <li key={i} className="flex gap-2.5 type-body-md text-on-primary/90">
                  <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-on-primary/15 tabular type-micro">
                    {i + 1}
                  </span>
                  <span className="line-clamp-2">{p}</span>
                </li>
              ))}
            </ol>
          )}
          <span className="relative mt-auto inline-flex items-center gap-1 pt-5 type-button-sm text-on-primary">
            {today.readMinutes}분 브리핑 읽기
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
          </span>
        </Link>
      ) : (
        <BriefingStreak />
      )}

      <div className="rounded-xl border border-hairline p-6">
        <div className="flex items-center justify-between">
          <h2 className="type-heading-md text-ink">{MAGAZINE_NAME}</h2>
          <Link href="/magazine" className="link inline-flex items-center gap-1 type-caption">
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
          <p className="py-6 type-body-md text-ink-mute">필기·면접·합격 수기 글을 준비하고 있어요.</p>
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
