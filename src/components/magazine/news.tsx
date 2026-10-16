import Link from "next/link";
import { ArrowRight, Lightbulb, Mail, Newspaper, Soup, Sunrise, TrendingUp } from "lucide-react";
import { formatDayHeading, formatShort } from "@/lib/date";
import {
  BRIEFING_ARCHIVE,
  EDITION_LABEL,
  NEWS_SECTIONS,
  NEWS_SECTION_INFO,
  briefingArchiveHref,
  briefingDateHref,
  formatNewsTime,
  itemHref,
  kindOf,
  letterHref,
  volLabel,
  type BriefingIssue,
  type NewsItem,
  type NewsSection,
  type NewsView,
} from "@/lib/news-meta";
import { cn } from "../ui";
import { BriefingCover } from "./BriefingBrand";
import { NEWS_ICON } from "./news-icons";

export { NEWS_ICON };

/** 질문은 앞에 Q. 를 붙여 보여 줘요 */
export const newsTitle = (n: Pick<NewsItem, "section" | "title">) => (kindOf(n.section) === "question" ? `Q. ${n.title}` : n.title);

export function NewsSectionTag({ section, className }: { section: NewsSection; className?: string }) {
  return <span className={cn("tag", NEWS_SECTION_INFO[section].tone, className)}>{NEWS_SECTION_INFO[section].label}</span>;
}

function Meta({ n, className, views = false }: { n: NewsItem; className?: string; views?: boolean }) {
  const parts: React.ReactNode[] = [];
  if (n.edition) parts.push(<span key="ed">{EDITION_LABEL[n.edition]}</span>);
  if (n.sourceName) parts.push(<span key="src">{n.sourceName}</span>);
  if (n.publishedAt) parts.push(<span key="t" className="tabular">{formatNewsTime(n.publishedAt)}</span>);
  if (views && n.views > 0) parts.push(<span key="v" className="tabular">조회 {n.views.toLocaleString()}</span>);
  return (
    <span className={cn("flex flex-wrap items-center gap-x-1.5 type-caption text-ink-mute", className)}>
      {parts.map((p, i) => (
        <span key={i} className="contents">
          {i > 0 && <span aria-hidden>·</span>}
          {p}
        </span>
      ))}
      {n.point && kindOf(n.section) === "news" && (
        <span className="ml-1 inline-flex items-center gap-0.5 rounded-full bg-canvas-cream px-1.5 py-px text-[11px] text-lemon">
          <Lightbulb className="h-3 w-3" strokeWidth={2} />
          면접 포인트
        </span>
      )}
    </span>
  );
}

/** 한 줄 뉴스 (상세 화면 '최근 뉴스') */
export function NewsRow({ n, showSection = false }: { n: NewsItem; showSection?: boolean }) {
  return (
    <Link href={itemHref(n)} className="group block py-4">
      {showSection && <NewsSectionTag section={n.section} className="mb-1.5" />}
      <span className="block type-heading-sm text-ink [word-break:keep-all] group-hover:underline">{newsTitle(n)}</span>
      <span className="mt-1.5 line-clamp-2 type-body-md leading-relaxed text-ink-secondary">{n.summary}</span>
      <Meta n={n} className="mt-2" />
    </Link>
  );
}

/** 카드 표지 — 사진 대신 카테고리 색 + 아이콘 (용어는 용어 이름, 질문은 Q) */
function NewsCover({ n, className }: { n: NewsItem; className?: string }) {
  const info = NEWS_SECTION_INFO[n.section];
  const Icon = NEWS_ICON[n.section];
  const kind = info.kind;
  if (n.imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- 운영자가 올린 사진 (Blob 주소)
      <img src={n.imageUrl} alt="" loading="lazy" decoding="async" className={cn("bg-canvas-soft object-cover", className)} />
    );
  }
  return (
    <div className={cn("relative flex items-center justify-center overflow-hidden bg-linear-to-br to-canvas px-6", info.cover, className)}>
      <Icon aria-hidden className={cn("absolute -right-3 -bottom-4 h-28 w-28 opacity-[0.07]", info.tone.split(" ")[1])} strokeWidth={1.25} />
      {kind === "term" ? (
        <span className="line-clamp-2 text-center type-display-md text-ev-posting [word-break:keep-all]">{n.title}</span>
      ) : kind === "question" ? (
        <span className="type-display-lg text-ev-interview2">Q.</span>
      ) : (
        <span className="flex flex-col items-center gap-2">
          <Icon className="h-10 w-10 text-ink-mute-2" strokeWidth={1.25} />
          <span className="type-micro-cap text-ink-mute">{info.label}</span>
        </span>
      )}
    </div>
  );
}

/** 카드 보기 */
export function NewsCard({ n }: { n: NewsItem }) {
  return (
    <Link href={itemHref(n)} className="group flex flex-col overflow-hidden rounded-xl border border-hairline bg-canvas transition-shadow hover:shadow-level-2">
      <NewsCover n={n} className="aspect-[16/9] w-full" />
      <div className="flex flex-1 flex-col p-5 md:p-6">
        <span className="flex flex-wrap items-center gap-2">
          <NewsSectionTag section={n.section} />
          {n.headline && <span className="tag bg-brand-dark text-on-primary">헤드라인</span>}
        </span>
        <h3 className="mt-3 line-clamp-2 type-heading-md text-ink [word-break:keep-all] group-hover:underline">{newsTitle(n)}</h3>
        <p className="mt-2 line-clamp-3 type-body-md leading-relaxed text-ink-secondary">{n.summary}</p>
        <Meta n={n} className="mt-auto pt-4" />
      </div>
    </Link>
  );
}

/** 목록 보기 — 글만 */
export function NewsListRow({ n }: { n: NewsItem }) {
  return (
    <Link href={itemHref(n)} className="group flex items-start gap-4 py-5">
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <NewsSectionTag section={n.section} />
          {n.headline && <span className="tag bg-brand-dark text-on-primary">헤드라인</span>}
        </span>
        <span className="mt-2 block type-heading-sm text-ink [word-break:keep-all] group-hover:underline">{newsTitle(n)}</span>
        <span className="mt-1 line-clamp-1 type-body-md text-ink-secondary">{n.summary}</span>
        <Meta n={n} className="mt-2 sm:hidden" />
      </span>
      <span className="hidden w-28 shrink-0 flex-col items-end gap-1 pt-1 text-right type-caption text-ink-mute sm:flex">
        {n.sourceName && <span className="max-w-full truncate">{n.sourceName}</span>}
        <span>
          {n.edition ? EDITION_LABEL[n.edition] : ""}
          {n.edition && n.publishedAt ? " · " : ""}
          {n.publishedAt ? <span className="tabular">{formatNewsTime(n.publishedAt)}</span> : null}
        </span>
        {n.views > 0 && <span className="tabular">조회 {n.views.toLocaleString()}</span>}
      </span>
    </Link>
  );
}

/** 많이 본 기사 */
export function PopularNews({ items, className, days = 7 }: { items: NewsItem[]; className?: string; days?: number }) {
  return (
    <section aria-labelledby="popular-news" className={cn("flex flex-col rounded-2xl border border-hairline bg-canvas p-5", className)}>
      <h2 id="popular-news" className="flex items-center gap-2 type-heading-sm text-ink">
        <TrendingUp className="h-4 w-4 text-ruby" strokeWidth={2} />
        많이 본 기사
        <span className="ml-auto type-micro font-normal text-ink-mute">최근 {days}일</span>
      </h2>
      {items.length === 0 ? (
        <p className="mt-4 type-caption text-ink-mute">기사가 쌓이면 많이 본 순서로 보여 드려요.</p>
      ) : (
        <ol className="mt-2 divide-y divide-hairline">
          {items.map((n, i) => (
            <li key={n.id}>
              <Link href={itemHref(n)} className="group flex gap-3 py-3">
                <span className={cn("w-5 shrink-0 tabular type-heading-sm", i < 3 ? "text-ruby" : "text-ink-mute")}>{i + 1}</span>
                <span className="min-w-0">
                  <span className="line-clamp-2 type-body-md text-ink [word-break:keep-all] group-hover:underline">{newsTitle(n)}</span>
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

/**
 * 브리핑 카테고리 칩 줄 — 금융 블로그와 같은 모양.
 * 첫 화면에서는 '전체'가 첫 화면, 카테고리는 전체 브리핑(모아보기)으로 이동. 모아보기에서는 기간을 그대로 두고 카테고리만 바꿔요.
 */
export function NewsCategoryNav({
  active,
  counts,
  archive,
}: {
  active: NewsSection | null;
  counts: Map<NewsSection, number>;
  /** 모아보기 화면이면 지금 고른 기간·보기 */
  archive?: { from: string | null; to: string | null; view?: NewsView };
}) {
  const chip = "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 py-2 type-caption transition-colors";
  const total = [...counts.values()].reduce((a, b) => a + b, 0);
  const on = (yes: boolean) => (yes ? "border-brand-dark bg-brand-dark text-on-primary" : "border-hairline text-ink-secondary hover:border-hairline-input");
  const href = (section: NewsSection | null) =>
    archive ? briefingArchiveHref({ section, from: archive.from, to: archive.to, view: archive.view }) : section ? briefingArchiveHref({ section }) : "/magazine";
  return (
    <nav aria-label="데일리 브리핑 카테고리" className="no-scrollbar fade-x -mx-4 overflow-x-auto px-4 md:fade-x-none md:mx-0 md:px-0">
      <ul className="flex gap-2 pb-1 md:flex-wrap [&>li]:shrink-0">
        <li>
          <Link href={href(null)} aria-current={active === null ? "page" : undefined} className={cn(chip, on(active === null))}>
            <Newspaper className="h-3.5 w-3.5" strokeWidth={1.75} />
            전체
            {total > 0 && <span className={cn("tabular", active === null ? "text-on-primary/70" : "text-ink-mute")}>{total}</span>}
          </Link>
        </li>
        {NEWS_SECTIONS.map((s, i) => {
          const Icon = NEWS_ICON[s.key];
          const n = counts.get(s.key) ?? 0;
          const isOn = active === s.key;
          return (
            <li key={s.key} className={cn(i === 5 && "md:ml-3 md:border-l md:border-hairline md:pl-3")}>
              <Link href={href(s.key)} aria-current={isOn ? "page" : undefined} className={cn(chip, on(isOn))}>
                <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
                {s.label}
                {n > 0 && <span className={cn("tabular", isOn ? "text-on-primary/70" : "text-ink-mute")}>{n}</span>}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** 날짜별로 묶어 카드 / 목록으로 */
export function NewsGroupedList({ items, view, dayLinks = true }: { items: NewsItem[]; view: NewsView; dayLinks?: boolean }) {
  const groups: { date: string; items: NewsItem[] }[] = [];
  for (const n of items) {
    const last = groups.at(-1);
    if (last && last.date === n.editionDate) last.items.push(n);
    else groups.push({ date: n.editionDate, items: [n] });
  }
  return (
    <>
      {groups.map((g) => (
        <section key={g.date} aria-label={formatDayHeading(g.date)}>
          <div className="mt-8 flex items-baseline justify-between gap-3">
            <h3 className="type-heading-sm text-ink">
              {formatDayHeading(g.date)}
              <span className="ml-2 tabular type-caption font-normal text-ink-mute">{g.items.length}건</span>
            </h3>
            {dayLinks && (
              <Link href={briefingDateHref(g.date)} className="link shrink-0 type-caption">
                이날만 보기 →
              </Link>
            )}
          </div>
          {view === "card" ? (
            <div className="mt-4 grid gap-6 sm:grid-cols-2">
              {g.items.map((n) => (
                <NewsCard key={n.id} n={n} />
              ))}
            </div>
          ) : (
            <ul className="mt-1 divide-y divide-hairline border-t border-hairline">
              {g.items.map((n) => (
                <li key={n.id}>
                  <NewsListRow n={n} />
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </>
  );
}

/** 오늘의 용어 · 면접 질문 칸 — 누르면 점심판 브리핑의 그 자리로 */
export function FeatureItemCard({ section, n, today }: { section: "term" | "question"; n: NewsItem | null; today: string }) {
  const info = NEWS_SECTION_INFO[section];
  const Icon = NEWS_ICON[section];
  const head = section === "term" ? "오늘의 용어" : "오늘의 면접 질문";
  const old = n && n.editionDate !== today;
  return (
    <section aria-label={head} className="flex flex-col rounded-2xl border border-hairline bg-canvas p-5">
      <p className="flex items-center gap-2 type-caption font-semibold text-ink">
        <span className={cn("inline-flex h-7 w-7 items-center justify-center rounded-lg", info.tone)}>
          <Icon className="h-4 w-4" strokeWidth={1.75} />
        </span>
        {head}
        {old && <span className="ml-auto font-normal text-ink-mute tabular">{formatShort(n.editionDate)}</span>}
      </p>
      {n ? (
        <Link href={itemHref(n)} className="group mt-4 flex flex-1 flex-col">
          <span className={cn("[word-break:keep-all] group-hover:underline", section === "term" ? "type-heading-lg text-ev-posting" : "type-heading-sm text-ink")}>
            {newsTitle(n)}
          </span>
          <span className="mt-2 line-clamp-3 type-body-md leading-relaxed text-ink-secondary ko-justify">{n.summary}</span>
          <span className="mt-auto inline-flex items-center gap-1 pt-4 type-caption text-primary-text">
            점심판 브리핑에서 보기
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
          </span>
        </Link>
      ) : (
        <p className="mt-4 type-body-md text-ink-mute">
          {section === "term" ? "점심판에서 그날 기사에 나온 용어를 풀어 드려요." : "점심판에서 그날 기사로 나올 법한 면접 질문을 드려요."}
        </p>
      )}
    </section>
  );
}

/** 브리핑 한 호 카드 — 카드(크게) / 목록(글만) */
export function IssueCard({ issue, top, count, view }: { issue: BriefingIssue; top: NewsItem[]; count: number; view: NewsView }) {
  const morning = issue.edition === "morning";
  const Icon = morning ? Sunrise : Soup;
  const what = morning ? `기사 ${count}건` : "점심 공부 5코스";
  if (view === "list") {
    return (
      <Link href={letterHref(issue.date, issue.edition)} className="group flex items-start gap-4 py-5">
        <span className={cn("inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", morning ? "bg-[#ffe6cc] text-[#b85c12]" : "bg-[#d9f2e2] text-[#2f7d4f]")}>
          <Icon className="h-5 w-5" strokeWidth={1.75} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="type-caption text-ink-mute">
            {EDITION_LABEL[issue.edition]} · {volLabel(issue.vol)} · {what}
          </span>
          <span className="mt-1 block type-heading-sm text-ink [word-break:keep-all] group-hover:underline">{issue.title}</span>
          {issue.lede && <span className="mt-1 line-clamp-1 block type-body-md text-ink-secondary">{issue.lede}</span>}
        </span>
      </Link>
    );
  }
  return (
    <Link href={letterHref(issue.date, issue.edition)} className="group flex flex-col overflow-hidden rounded-2xl border border-hairline bg-canvas transition-shadow hover:shadow-level-2">
      <BriefingCover edition={issue.edition} date={formatShort(issue.date)} note={coverNote(issue, count)} size="sm" className="aspect-[16/9] w-full" />
      <span className="flex flex-1 flex-col p-5">
        <span className="type-caption text-ink-mute">
          {EDITION_LABEL[issue.edition]} · {volLabel(issue.vol)}
        </span>
        <span className="mt-1 type-heading-md text-ink [word-break:keep-all] group-hover:underline">{issue.title}</span>
        {top.length > 0 && (
          <ol className="mt-3 space-y-1.5">
            {top.map((n, i) => (
              <li key={n.id} className="flex gap-2 type-caption text-ink-secondary">
                <span className="tabular font-semibold text-primary-text">{i + 1}</span>
                <span className="min-w-0 truncate">
                  [{NEWS_SECTION_INFO[n.section].label}] {n.title}
                </span>
              </li>
            ))}
          </ol>
        )}
        <span className="mt-auto inline-flex items-center gap-1 pt-4 type-caption text-primary-text">
          브리핑 읽기
          <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
        </span>
      </span>
    </Link>
  );
}

/** 표지 오른쪽 아래 한 줄 (기사 7건 · 퀴즈 4문제) */
function coverNote(issue: BriefingIssue, count: number): string {
  return issue.edition === "morning" ? `기사 ${count}건${issue.quiz.length ? ` · 퀴즈 ${issue.quiz.length}문제` : ""}` : "점심 공부 5코스";
}

/** 첫 화면 맨 위 — 오늘의 브리핑 한 편 (위 썸네일 · 아래 헤드라인), 누르면 브리핑으로 */
export function BriefingHeroCard({ issue, count }: { issue: BriefingIssue; count: number }) {
  return (
    <Link
      href={letterHref(issue.date, issue.edition)}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-hairline bg-canvas shadow-level-1 transition-shadow hover:shadow-level-2"
    >
      <BriefingCover edition={issue.edition} date={formatShort(issue.date)} note={coverNote(issue, count)} className="aspect-[16/9] w-full" />
      <span className="flex flex-1 flex-col p-5 md:p-6">
        <span className="type-caption font-semibold text-primary-text">
          {EDITION_LABEL[issue.edition]} 브리핑 · {volLabel(issue.vol)}
        </span>
        <span className="mt-1.5 type-heading-lg text-ink [word-break:keep-all] group-hover:underline md:type-display-md">{issue.title}</span>
        {issue.lede && <span className="mt-2 line-clamp-2 type-body-md leading-relaxed text-ink-secondary ko-justify">{issue.lede}</span>}
        <span className="mt-auto inline-flex items-center gap-1 pt-4 type-caption font-semibold text-primary-text">
          브리핑 읽기
          <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
        </span>
      </span>
    </Link>
  );
}

/** 지난 브리핑 모아보기로 가는 큰 버튼 */
export function ArchiveCallout({ total, className }: { total: number; className?: string }) {
  return (
    <Link
      href={BRIEFING_ARCHIVE}
      className={cn("group flex items-center gap-4 rounded-2xl border border-hairline bg-canvas-soft px-5 py-5 transition-colors hover:border-hairline-input md:px-6", className)}
    >
      <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-canvas text-primary-text">
        <Mail className="h-5 w-5" strokeWidth={1.75} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block type-heading-sm text-ink group-hover:underline">지난 브리핑 전체 보기</span>
        <span className="mt-0.5 block type-caption text-ink-mute">
          지금까지 {total.toLocaleString()}호 · 날짜와 기간을 골라 한 달 전, 두 달 전 브리핑도 찾아볼 수 있어요
        </span>
      </span>
      <ArrowRight className="h-5 w-5 shrink-0 text-ink-mute transition-transform group-hover:translate-x-0.5" strokeWidth={1.75} />
    </Link>
  );
}
