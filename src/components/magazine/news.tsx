import Link from "next/link";
import {
  ArrowRight,
  BookA,
  Building2,
  CalendarDays,
  ChartLine,
  ChevronLeft,
  ChevronRight,
  Clock,
  Globe,
  Landmark,
  Lightbulb,
  MessageCircleQuestion,
  Newspaper,
  Scale,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { diffDays, formatDayHeading, formatShort } from "@/lib/date";
import { EVENT_META } from "@/lib/meta";
import {
  EDITION_LABEL,
  EDITION_SCHEDULE,
  NEWS_SECTIONS,
  NEWS_SECTION_INFO,
  briefingDateHref,
  briefingHref,
  formatNewsTime,
  kindOf,
  newsHref,
  type NewsItem,
  type NewsSection,
  type NewsSort,
  type NewsView,
} from "@/lib/news-meta";
import type { UpcomingEvent } from "@/lib/postings";
import { cn } from "../ui";

export const NEWS_ICON: Record<NewsSection, LucideIcon> = {
  finance: Landmark,
  economy: ChartLine,
  policy: Scale,
  global: Globe,
  public: Building2,
  term: BookA,
  question: MessageCircleQuestion,
};

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

/** 한 줄 뉴스 (상세 화면 '최근 뉴스') */
export function NewsRow({ n, showSection = false }: { n: NewsItem; showSection?: boolean }) {
  return (
    <Link href={newsHref(n.id)} className="group block py-4">
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
    <Link href={newsHref(n.id)} className="group flex flex-col overflow-hidden rounded-xl border border-hairline bg-canvas transition-shadow hover:shadow-level-2">
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
    <Link href={newsHref(n.id)} className="group flex items-start gap-4 py-5">
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
export function PopularNews({ items, className }: { items: NewsItem[]; className?: string }) {
  return (
    <section aria-labelledby="popular-news" className={cn("flex flex-col rounded-2xl border border-hairline bg-canvas p-5", className)}>
      <h2 id="popular-news" className="flex items-center gap-2 type-heading-sm text-ink">
        <TrendingUp className="h-4 w-4 text-ruby" strokeWidth={2} />
        많이 본 기사
        <span className="ml-auto type-micro font-normal text-ink-mute">최근 3일</span>
      </h2>
      {items.length === 0 ? (
        <p className="mt-4 type-caption text-ink-mute">기사가 쌓이면 많이 본 순서로 보여 드려요.</p>
      ) : (
        <ol className="mt-2 divide-y divide-hairline">
          {items.map((n, i) => (
            <li key={n.id}>
              <Link href={newsHref(n.id)} className="group flex gap-3 py-3">
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

/** 날짜 머리 + 이전·다음 브리핑 */
export function DateBar({
  date,
  count,
  prev,
  next,
  eyebrow = "오늘의 브리핑",
}: {
  date: string;
  count: number;
  prev: string | null;
  next: string | null;
  eyebrow?: string;
}) {
  const arrow = "inline-flex h-9 w-9 items-center justify-center rounded-full border border-hairline text-ink-secondary hover:border-hairline-input";
  return (
    <div className="flex items-center gap-3">
      <div className="min-w-0 flex-1">
        <p className="type-micro-cap text-primary-text">{eyebrow}</p>
        <p className="mt-0.5 flex flex-wrap items-baseline gap-x-2 type-heading-lg text-ink">
          {formatDayHeading(date)}
          <span className="tabular type-body-md text-ink-mute">{count}건</span>
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

/** 브리핑 카테고리 칩 줄 — 금융 블로그와 같은 모양 */
export function NewsCategoryNav({
  active,
  counts,
  sort,
  view,
}: {
  active: NewsSection | null;
  counts: Map<NewsSection, number>;
  sort: NewsSort;
  view?: NewsView;
}) {
  const chip = "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 py-2 type-caption transition-colors";
  const total = [...counts.values()].reduce((a, b) => a + b, 0);
  const on = (yes: boolean) => (yes ? "border-brand-dark bg-brand-dark text-on-primary" : "border-hairline text-ink-secondary hover:border-hairline-input");
  return (
    <nav aria-label="데일리 브리핑 카테고리" className="no-scrollbar fade-x -mx-4 overflow-x-auto px-4 md:fade-x-none md:mx-0 md:px-0">
      <ul className="flex gap-2 pb-1 md:flex-wrap [&>li]:shrink-0">
        <li>
          <Link href={briefingHref({ sort, view })} aria-current={active === null ? "page" : undefined} className={cn(chip, on(active === null))}>
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
              <Link href={briefingHref({ section: s.key, sort, view })} aria-current={isOn ? "page" : undefined} className={cn(chip, on(isOn))}>
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

/** 언제 어떤 내용이 올라오는지 */
export function EditionSchedule({ className }: { className?: string }) {
  return (
    <section aria-label="발행 시간" className={cn("rounded-xl bg-canvas-soft px-5 py-4", className)}>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-8">
        <p className="flex shrink-0 items-center gap-2 type-heading-sm text-ink">
          <Clock className="h-4 w-4 text-primary-text" strokeWidth={2} />
          매일 두 번 올라와요
        </p>
        <ul className="flex flex-1 flex-col gap-2 md:flex-row md:gap-8">
          {EDITION_SCHEDULE.map((e) => (
            <li key={e.key} className="flex min-w-0 flex-wrap items-baseline gap-x-2 type-body-md text-ink-secondary">
              <span className="font-semibold text-ink">{e.label}</span>
              <span className="tabular text-primary-text">{e.time}</span>
              <span className="min-w-0">{e.items.join(" · ")}</span>
            </li>
          ))}
        </ul>
      </div>
      <p className="mt-2 type-micro text-ink-mute">모든 뉴스는 원문을 확인해 출처 링크를 달고, 운영자가 검토한 뒤 공개해요.</p>
    </section>
  );
}

/** 오늘의 용어 · 면접 질문 칸 */
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
        <Link href={newsHref(n.id)} className="group mt-4 flex flex-1 flex-col">
          <span className={cn("[word-break:keep-all] group-hover:underline", section === "term" ? "type-heading-lg text-ev-posting" : "type-heading-sm text-ink")}>
            {newsTitle(n)}
          </span>
          <span className="mt-2 line-clamp-3 type-body-md leading-relaxed text-ink-secondary">{n.summary}</span>
          <span className="mt-auto inline-flex items-center gap-1 pt-4 type-caption text-primary-text">
            {section === "term" ? "뜻·출제 포인트 보기" : "답변 뼈대 보기"}
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
          </span>
        </Link>
      ) : (
        <p className="mt-4 type-body-md text-ink-mute">
          {section === "term" ? "아침판에서 필기·면접에 나오는 용어를 하나씩 풀어 드려요." : "점심판에서 그날 뉴스로 나올 법한 면접 질문을 드려요."}
        </p>
      )}
    </section>
  );
}

/** 오늘의 채용 일정 — 사이트 달력 데이터 그대로 */
export function TodaySchedule({ events, today, className }: { events: UpcomingEvent[]; today: string; className?: string }) {
  const when = (e: UpcomingEvent) => {
    if (e.date <= today && (e.endDate ?? e.date) >= today) return "오늘";
    const d = diffDays(today, e.date);
    return d === 1 ? "내일" : d === 2 ? "모레" : formatShort(e.date);
  };
  const list = events.slice(0, 6);
  return (
    <section aria-label="오늘의 채용 일정" className={cn("flex flex-col rounded-2xl border border-hairline bg-canvas p-5", className)}>
      <p className="flex items-center gap-2 type-caption font-semibold text-ink">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-ev-doc-soft text-ev-doc">
          <CalendarDays className="h-4 w-4" strokeWidth={1.75} />
        </span>
        오늘의 채용 일정
        <span className="ml-auto font-normal text-ink-mute">오늘~모레</span>
      </p>
      {list.length === 0 ? (
        <p className="mt-4 type-body-md text-ink-mute">오늘부터 사흘 안에 잡힌 일정이 없어요.</p>
      ) : (
        <ul className="mt-3 divide-y divide-hairline">
          {list.map((e, i) => (
            <li key={`${e.companyId}-${e.type}-${i}`}>
              <Link href={`/companies/${e.companyId}`} className="group flex items-center gap-3 py-2.5">
                <span className={cn("w-10 shrink-0 type-caption", when(e) === "오늘" ? "font-semibold text-ev-doc" : "text-ink-mute")}>{when(e)}</span>
                <span className={cn("h-2 w-2 shrink-0 rounded-full", EVENT_META[e.type]?.dot ?? "bg-ink-mute")} aria-hidden />
                <span className="min-w-0 flex-1 truncate type-body-md text-ink group-hover:underline">{e.name}</span>
                <span className="shrink-0 type-caption text-ink-secondary">
                  {e.stage}
                  {e.time ? ` ${e.time}` : ""}
                  {e.expected ? " (예상)" : ""}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <Link href="/" className="link mt-auto inline-flex items-center gap-1 pt-4 type-caption">
        채용 캘린더에서 전체 보기
        <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
      </Link>
    </section>
  );
}
