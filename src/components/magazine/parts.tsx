import Link from "next/link";
import {
  BookOpen,
  BriefcaseBusiness,
  Clock,
  Compass,
  Landmark,
  MessagesSquare,
  Newspaper,
  PencilLine,
  Smile,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import {
  BLOG_CATEGORIES,
  CATEGORY_INFO,
  SECTION_INFO,
  articleHref,
  formatArticleDate,
  magazineHref,
  summaryLines,
  type ArticleSummary,
  type MagazineCategory,
  type MagazineSection,
} from "@/lib/magazine-meta";
import { cn } from "../ui";
import { ReadBadge } from "./interactive";

export const CATEGORY_ICON: Record<MagazineCategory, LucideIcon> = {
  briefing: Newspaper,
  exam: PencilLine,
  knowledge: Landmark,
  starter: Compass,
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

/** 카드: 표지 + 카테고리 + 제목 + 요약 (large = 블로그 '카드 보기'용 큰 카드) */
export function ArticleCard({ a, priority = false, large = false }: { a: ArticleSummary; priority?: boolean; large?: boolean }) {
  const lines = summaryLines(a.summary);
  return (
    <Link href={articleHref(a.id)} className="group flex flex-col overflow-hidden rounded-xl border border-hairline bg-canvas transition-shadow hover:shadow-level-2">
      <div className="relative">
        <ArticleCover a={a} className="aspect-[16/9] w-full" iconSize={large ? "h-10 w-10" : undefined} />
        <ReadBadge id={a.id} className="absolute top-3 right-3" />
      </div>
      <div className={cn("flex flex-1 flex-col", large ? "p-6" : "p-5")}>
        <MagazineCategoryTag category={a.category} className="self-start" />
        <h3
          className={cn(
            "mt-3 line-clamp-2 text-ink [word-break:keep-all] group-hover:underline",
            large ? "type-heading-md" : "type-heading-sm",
            priority && "md:type-heading-md",
          )}
        >
          {a.title}
        </h3>
        {lines[0] && <p className={cn("mt-2 type-body-md leading-relaxed text-ink-secondary", large ? "line-clamp-3" : "line-clamp-2")}>{large ? lines.join(" ") : lines[0]}</p>}
        <ArticleMeta a={a} className="mt-auto pt-4" />
      </div>
    </Link>
  );
}

/** 글만 나열하는 목록 줄 (블로그 '목록 보기') */
export function ArticleListRow({ a }: { a: ArticleSummary }) {
  const first = summaryLines(a.summary)[0];
  return (
    <Link href={articleHref(a.id)} className="group flex items-start gap-4 py-5">
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <MagazineCategoryTag category={a.category} />
          <ReadBadge id={a.id} />
        </span>
        <span className="mt-2 block type-heading-sm text-ink [word-break:keep-all] group-hover:underline">{a.title}</span>
        {first && <span className="mt-1 line-clamp-1 type-body-md text-ink-secondary">{first}</span>}
        <ArticleMeta a={a} className="mt-2 sm:hidden" />
      </span>
      <span className="hidden w-24 shrink-0 flex-col items-end gap-1 pt-1 text-right type-caption text-ink-mute sm:flex">
        {a.publishedAt != null && <span className="tabular">{formatArticleDate(a.publishedAt)}</span>}
        <span>{a.readMinutes}분 분량</span>
      </span>
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
        <span className="mt-1.5 line-clamp-2 type-body-md font-semibold text-ink group-hover:underline">{a.title}</span>
        <ArticleMeta a={a} className="mt-1" />
      </span>
      <ArticleCover a={a} className="aspect-square w-20 shrink-0 rounded-lg" iconSize="h-6 w-6" />
    </Link>
  );
}

/** 금융 블로그 카테고리 칩 줄 */
export function MagazineCategoryNav({
  active,
  counts,
}: {
  active: MagazineCategory | null;
  counts: Map<MagazineCategory, number>;
}) {
  const chip = "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 py-2 type-caption transition-colors";
  return (
    <nav aria-label="금융 블로그 주제" className="no-scrollbar fade-x -mx-4 overflow-x-auto px-4 md:fade-x-none md:mx-0 md:px-0">
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
        {BLOG_CATEGORIES.map((c) => {
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

/** 최신순 / 인기순 */
export function SortSegment({ sort, hrefs }: { sort: "latest" | "popular"; hrefs: Record<"latest" | "popular", string> }) {
  const seg = "inline-flex h-8 items-center rounded-md px-3 type-caption transition-colors";
  return (
    <div role="group" aria-label="정렬" className="inline-flex rounded-lg bg-canvas-soft p-1">
      {(
        [
          ["latest", "최신순"],
          ["popular", "인기순"],
        ] as const
      ).map(([key, label]) => (
        <Link
          key={key}
          href={hrefs[key]}
          aria-current={sort === key ? "true" : undefined}
          className={cn(seg, sort === key ? "bg-canvas text-ink shadow-level-1" : "text-ink-mute hover:text-ink")}
        >
          {label}
        </Link>
      ))}
    </div>
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

/** 매거진 두 섹션 탭: 데일리 브리핑 / 금융 블로그 */
export function MagazineSectionTabs({ active }: { active: MagazineSection }) {
  const tabs: { key: MagazineSection; Icon: LucideIcon }[] = [
    { key: "briefing", Icon: Newspaper },
    { key: "blog", Icon: BookOpen },
  ];
  return (
    <nav aria-label="매거진 섹션" className="grid grid-cols-2 gap-2 rounded-xl bg-canvas-soft p-1.5 sm:inline-grid sm:w-auto">
      {tabs.map(({ key, Icon }) => {
        const on = key === active;
        return (
          <Link
            key={key}
            href={SECTION_INFO[key].href}
            aria-current={on ? "page" : undefined}
            className={cn(
              "flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 type-button-md transition-colors sm:px-6",
              on ? "bg-canvas text-ink shadow-level-1" : "text-ink-mute hover:text-ink",
            )}
          >
            <Icon className="h-4 w-4" strokeWidth={1.75} />
            {SECTION_INFO[key].label}
          </Link>
        );
      })}
    </nav>
  );
}
