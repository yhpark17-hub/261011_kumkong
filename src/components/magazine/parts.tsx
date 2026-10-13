import Link from "next/link";
import {
  BookOpen,
  BriefcaseBusiness,
  Clock,
  Compass,
  Landmark,
  Lightbulb,
  MessagesSquare,
  Newspaper,
  PencilLine,
  Smile,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import {
  CATEGORY_INFO,
  MAGAZINE_CATEGORIES,
  articleHref,
  formatArticleDate,
  magazineHref,
  summaryLines,
  type ArticleSummary,
  type MagazineCategory,
} from "@/lib/magazine-meta";
import { cn } from "../ui";
import { ReadBadge } from "./interactive";

export const CATEGORY_ICON: Record<MagazineCategory, LucideIcon> = {
  briefing: Newspaper,
  exam: PencilLine,
  knowledge: Landmark,
  starter: Compass,
  tips: Lightbulb,
  interview: MessagesSquare,
  story: Trophy,
  insider: BriefcaseBusiness,
  webtoon: Smile,
};

export function MagazineCategoryTag({ category, className }: { category: MagazineCategory; className?: string }) {
  return <span className={cn("tag", CATEGORY_INFO[category].tone, className)}>{CATEGORY_INFO[category].label}</span>;
}

export function ArticleMeta({ a, className, showViews = false }: { a: ArticleSummary; className?: string; showViews?: boolean }) {
  return (
    <span className={cn("flex flex-wrap items-center gap-x-2 gap-y-1 type-caption text-ink-mute", className)}>
      {a.publishedAt != null && <span className="tabular">{formatArticleDate(a.publishedAt)}</span>}
      <span aria-hidden>·</span>
      <span className="inline-flex items-center gap-1">
        <Clock className="h-3 w-3" strokeWidth={1.75} />
        {a.readMinutes}분
      </span>
      {showViews && (
        <>
          <span aria-hidden>·</span>
          <span className="tabular">조회 {a.views.toLocaleString()}</span>
        </>
      )}
    </span>
  );
}

/** 표지 — 이미지가 없으면 카테고리 색 그라디언트 + 아이콘 (너비·비율은 className 으로) */
export function ArticleCover({ a, className, iconSize = "h-8 w-8" }: { a: ArticleSummary; className?: string; iconSize?: string }) {
  const Icon = CATEGORY_ICON[a.category];
  if (a.coverUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- 운영자가 올린 표지 (Blob 주소)
      <img src={a.coverUrl} alt="" loading="lazy" decoding="async" className={cn("bg-canvas-soft object-cover", className)} />
    );
  }
  return (
    <div className={cn("flex items-center justify-center bg-linear-to-br to-canvas", CATEGORY_INFO[a.category].cover, className)}>
      <Icon className={cn("text-ink-mute-2", iconSize)} strokeWidth={1.25} />
    </div>
  );
}

/** 기본 카드: 표지 + 카테고리 + 제목 + 요약 */
export function ArticleCard({ a, priority = false }: { a: ArticleSummary; priority?: boolean }) {
  const first = summaryLines(a.summary)[0];
  return (
    <Link href={articleHref(a.id)} className="group flex flex-col overflow-hidden rounded-xl border border-hairline bg-canvas transition-shadow hover:shadow-level-2">
      <div className="relative">
        <ArticleCover a={a} className="aspect-[16/9] w-full" />
        <ReadBadge id={a.id} className="absolute top-3 right-3" />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <MagazineCategoryTag category={a.category} className="self-start" />
        <h3 className={cn("mt-3 line-clamp-2 type-heading-sm text-ink group-hover:underline", priority && "md:type-heading-md")}>{a.title}</h3>
        {first && <p className="mt-2 line-clamp-2 type-body-md text-ink-secondary">{first}</p>}
        <ArticleMeta a={a} className="mt-auto pt-4" />
      </div>
    </Link>
  );
}

/** 가로형 목록 줄 (작은 썸네일) */
export function ArticleRow({ a, rank }: { a: ArticleSummary; rank?: number }) {
  return (
    <Link href={articleHref(a.id)} className="group flex items-start gap-4 py-4">
      {rank != null ? (
        <span className="w-6 shrink-0 pt-0.5 text-center tabular type-heading-md text-primary-text">{rank}</span>
      ) : null}
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <MagazineCategoryTag category={a.category} />
          <ReadBadge id={a.id} />
        </span>
        <span className="mt-1.5 line-clamp-2 block type-body-md font-semibold text-ink group-hover:underline">{a.title}</span>
        <ArticleMeta a={a} className="mt-1" />
      </span>
      <ArticleCover a={a} className="aspect-square w-20 shrink-0 rounded-lg" iconSize="h-6 w-6" />
    </Link>
  );
}

/** 카테고리 칩 줄 */
export function MagazineCategoryNav({
  active,
  counts,
}: {
  active: MagazineCategory | null;
  counts: Map<MagazineCategory, number>;
}) {
  const chip = "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 py-2 type-caption transition-colors";
  return (
    <nav aria-label="매거진 카테고리" className="no-scrollbar fade-x -mx-4 overflow-x-auto px-4 md:fade-x-none md:mx-0 md:px-0">
      <ul className="flex gap-2 pb-1 md:flex-wrap [&>li]:shrink-0">
        <li>
          <Link
            href={magazineHref({})}
            aria-current={active === null ? "page" : undefined}
            className={cn(chip, active === null ? "border-brand-dark bg-brand-dark text-on-primary" : "border-hairline text-ink-secondary hover:border-hairline-input")}
          >
            <BookOpen className="h-3.5 w-3.5" strokeWidth={1.75} />
            전체
          </Link>
        </li>
        {MAGAZINE_CATEGORIES.map((c) => {
          const Icon = CATEGORY_ICON[c.key];
          const n = counts.get(c.key) ?? 0;
          const on = active === c.key;
          return (
            <li key={c.key}>
              <Link
                href={magazineHref({ category: c.key })}
                aria-current={on ? "page" : undefined}
                className={cn(chip, on ? "border-brand-dark bg-brand-dark text-on-primary" : "border-hairline text-ink-secondary hover:border-hairline-input")}
              >
                <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
                {c.label}
                {n > 0 && <span className={cn("tabular", on ? "text-on-primary/70" : "text-ink-mute")}>{n}</span>}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** 섹션 머리 */
export function SectionHead({ title, desc, href, linkLabel = "더 보기" }: { title: string; desc?: string; href?: string; linkLabel?: string }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        <h2 className="type-heading-lg text-ink">{title}</h2>
        {desc && <p className="mt-1 type-body-md text-ink-mute">{desc}</p>}
      </div>
      {href && (
        <Link href={href} className="link shrink-0 type-caption">
          {linkLabel} →
        </Link>
      )}
    </div>
  );
}
