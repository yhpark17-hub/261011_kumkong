import Link from "next/link";
import { ArrowRight, Newspaper, Search } from "lucide-react";
import { formatDayHeading } from "@/lib/date";
import {
  MAGAZINE_NAME,
  SECTION_INFO,
  articleHref,
  kstDateKey,
  summaryLines,
  type ArticleSummary,
  type MagazineSection,
} from "@/lib/magazine-meta";
import { Eyebrow, cn } from "../ui";
import { ReadBadge, UnreadDot } from "./interactive";
import { ArticleCover, ArticleMeta, MagazineCategoryTag, MagazineSectionTabs } from "./parts";

/** 매거진 공통 머리: 이름 · 섹션 설명 · 검색 · 섹션 탭 */
export function MagazineShell({ section, q = "", children }: { section: MagazineSection; q?: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-[1200px] px-4 pt-8 pb-16 md:px-6 md:pt-12">
      <header className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <Eyebrow>{MAGAZINE_NAME}</Eyebrow>
          <h1 className="mt-3 type-display-md text-ink md:type-display-lg">{SECTION_INFO[section].label}</h1>
          <p className="mt-3 max-w-2xl type-body-lg text-ink-secondary">{SECTION_INFO[section].desc}</p>
        </div>
        <form action="/magazine/blog" role="search" className="relative w-full md:w-72">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-ink-mute" strokeWidth={1.75} />
          <input name="q" defaultValue={q} placeholder="매거진 검색 (예: NCS, 기준금리)" className="input w-full pl-9" maxLength={40} aria-label="매거진 검색" />
        </form>
      </header>
      <div className="mt-6">
        <MagazineSectionTabs active={section} />
      </div>
      {children}
    </div>
  );
}

export function MagazineSkeleton() {
  return (
    <div className="mt-8 animate-pulse space-y-8">
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

export function EmptyLine({ text }: { text: string }) {
  return <p className="rounded-xl border border-dashed border-hairline-input px-5 py-8 text-center type-body-md text-ink-mute">{text}</p>;
}

/** 오늘(최신) 브리핑 큰 카드 */
export function BriefingHero({ a }: { a: ArticleSummary }) {
  const day = a.publishedAt ? kstDateKey(a.publishedAt) : null;
  const points = summaryLines(a.summary).slice(0, 3);
  return (
    <Link href={articleHref(a.id)} className="group relative flex flex-col overflow-hidden rounded-xl bg-brand-dark p-6 text-on-primary md:p-8">
      <span aria-hidden className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/30 blur-3xl" />
      <span className="relative flex flex-wrap items-center gap-2">
        <span className="tag bg-on-primary/15 text-on-primary">
          <Newspaper className="h-3 w-3" strokeWidth={2} />
          데일리 브리핑
        </span>
        {day && <span className="type-caption text-on-primary/70">{formatDayHeading(day)}</span>}
        <UnreadDot id={a.id} />
      </span>
      <h2 className="relative mt-4 type-heading-lg md:type-display-md">{a.title}</h2>
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

export function BriefingEmpty() {
  return (
    <div className="flex flex-col justify-center rounded-xl bg-brand-dark p-8 text-on-primary">
      <span className="tag self-start bg-on-primary/15 text-on-primary">
        <Newspaper className="h-3 w-3" strokeWidth={2} />
        데일리 브리핑
      </span>
      <p className="mt-4 type-heading-lg">첫 브리핑을 준비하고 있어요</p>
      <p className="mt-2 type-body-md text-on-primary/75">
        매일 아침·점심 금융·시사·금공 소식의 핵심과, 필기·면접에서 어떻게 쓰일지까지 짚어 드릴게요.
      </p>
    </div>
  );
}

/** 날짜별 브리핑 한 줄 */
export function BriefingRow({ a }: { a: ArticleSummary }) {
  const day = a.publishedAt ? kstDateKey(a.publishedAt) : null;
  const [, m, d] = day ? day.split("-") : ["", "", ""];
  const points = summaryLines(a.summary);
  return (
    <li>
      <Link href={articleHref(a.id)} className="group flex gap-4 py-5 md:gap-5">
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

/** 에디터 추천 큰 카드 (혼자면 가로로 넓게) */
export function FeatureCard({ a, wide = false }: { a: ArticleSummary; wide?: boolean }) {
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
