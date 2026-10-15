import Link from "next/link";
import { ChevronLeft, ChevronRight, Lightbulb, TrendingUp } from "lucide-react";
import { formatDayHeading } from "@/lib/date";
import { NEWS_SECTION_INFO, briefingDateHref, formatNewsTime, newsHref, type NewsItem, type NewsSection } from "@/lib/news-meta";
import { cn } from "../ui";

export function NewsSectionTag({ section, className }: { section: NewsSection; className?: string }) {
  return <span className={cn("tag", NEWS_SECTION_INFO[section].tone, className)}>{NEWS_SECTION_INFO[section].label}</span>;
}

function Meta({ n, className }: { n: NewsItem; className?: string }) {
  return (
    <span className={cn("flex flex-wrap items-center gap-x-1.5 type-caption text-ink-mute", className)}>
      {n.sourceName && <span>{n.sourceName}</span>}
      {n.sourceName && n.publishedAt && <span aria-hidden>·</span>}
      {n.publishedAt && <span className="tabular">{formatNewsTime(n.publishedAt)}</span>}
      {n.point && (
        <span className="ml-1 inline-flex items-center gap-0.5 rounded-full bg-canvas-cream px-1.5 py-px text-[11px] text-lemon">
          <Lightbulb className="h-3 w-3" strokeWidth={2} />
          면접 포인트
        </span>
      )}
    </span>
  );
}

/** 오늘의 헤드라인 — 가장 크게 */
export function HeadlineCard({ n }: { n: NewsItem }) {
  return (
    <Link href={newsHref(n.id)} className="group flex h-full flex-col rounded-2xl border border-hairline bg-canvas p-6 shadow-level-1 transition-shadow hover:shadow-level-2 md:p-8">
      <span className="flex items-center gap-2">
        <span className="tag bg-brand-dark text-on-primary">헤드라인</span>
        <NewsSectionTag section={n.section} />
      </span>
      <h2 className="mt-4 type-heading-lg text-ink [word-break:keep-all] group-hover:underline md:type-display-md">{n.title}</h2>
      <p className="mt-4 line-clamp-4 type-body-lg leading-[1.75] text-ink-secondary">{n.summary}</p>
      <Meta n={n} className="mt-auto pt-6" />
    </Link>
  );
}

/** 한 줄 뉴스 (분야별 목록) */
export function NewsRow({ n, showSection = false }: { n: NewsItem; showSection?: boolean }) {
  return (
    <Link href={newsHref(n.id)} className="group block py-4">
      {showSection && <NewsSectionTag section={n.section} className="mb-1.5" />}
      <span className="block type-heading-sm text-ink [word-break:keep-all] group-hover:underline">{n.title}</span>
      <span className="mt-1.5 line-clamp-2 type-body-md leading-relaxed text-ink-secondary">{n.summary}</span>
      <Meta n={n} className="mt-2" />
    </Link>
  );
}

/** 많이 본 뉴스 */
export function PopularNews({ items }: { items: NewsItem[] }) {
  return (
    <section aria-labelledby="popular-news" className="flex h-full flex-col rounded-2xl border border-hairline bg-canvas p-5">
      <h2 id="popular-news" className="flex items-center gap-2 type-heading-sm text-ink">
        <TrendingUp className="h-4 w-4 text-ruby" strokeWidth={2} />
        많이 본 뉴스
        <span className="ml-auto type-micro font-normal text-ink-mute">최근 3일</span>
      </h2>
      {items.length === 0 ? (
        <p className="mt-4 type-caption text-ink-mute">뉴스가 쌓이면 많이 본 순서로 보여 드려요.</p>
      ) : (
        <ol className="mt-2 divide-y divide-hairline">
          {items.map((n, i) => (
            <li key={n.id}>
              <Link href={newsHref(n.id)} className="group flex gap-3 py-3">
                <span className={cn("w-5 shrink-0 tabular type-heading-sm", i < 3 ? "text-ruby" : "text-ink-mute")}>{i + 1}</span>
                <span className="min-w-0">
                  <span className="line-clamp-2 type-body-md text-ink [word-break:keep-all] group-hover:underline">{n.title}</span>
                  <span className="mt-0.5 block type-micro text-ink-mute">{NEWS_SECTION_INFO[n.section].label}</span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

/** 날짜 머리 + 이전·다음 브리핑 */
export function DateBar({ date, count, prev, next }: { date: string; count: number; prev: string | null; next: string | null }) {
  const arrow = "inline-flex h-9 w-9 items-center justify-center rounded-full border border-hairline text-ink-secondary hover:border-hairline-input";
  return (
    <div className="flex items-center gap-3">
      <div className="min-w-0 flex-1">
        <p className="type-micro-cap text-primary-text">오늘의 브리핑</p>
        <p className="mt-0.5 flex flex-wrap items-baseline gap-x-2 type-heading-lg text-ink">
          {formatDayHeading(date)}
          <span className="tabular type-body-md text-ink-mute">뉴스 {count}건</span>
        </p>
      </div>
      {prev ? (
        <Link href={briefingDateHref(prev)} className={arrow} aria-label="이전 브리핑">
          <ChevronLeft className="h-4 w-4" strokeWidth={2} />
        </Link>
      ) : (
        <span className={cn(arrow, "opacity-30")} aria-hidden>
          <ChevronLeft className="h-4 w-4" strokeWidth={2} />
        </span>
      )}
      {next ? (
        <Link href={briefingDateHref(next)} className={arrow} aria-label="다음 브리핑">
          <ChevronRight className="h-4 w-4" strokeWidth={2} />
        </Link>
      ) : (
        <span className={cn(arrow, "opacity-30")} aria-hidden>
          <ChevronRight className="h-4 w-4" strokeWidth={2} />
        </span>
      )}
    </div>
  );
}
