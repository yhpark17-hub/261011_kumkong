import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { ArrowLeft, ArrowRight, Mail, ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { AdSlot } from "@/components/ads/AdSlot";
import { Pagination } from "@/components/board/parts";
import { DbSection } from "@/components/db/DbSection";
import { NEWS_VIEW_COOKIE, ViewToggle } from "@/components/magazine/BlogControls";
import { NEWS_ICON, NewsCategoryNav, NewsGroupedList, PopularNews } from "@/components/magazine/news";
import { EmptyLine, MagazineShell } from "@/components/magazine/sections";
import { cn } from "@/components/ui";
import { addDays, formatDayHeading, formatShort, todayKST } from "@/lib/date";
import { MAGAZINE_NAME } from "@/lib/magazine-meta";
import {
  NEWS_PAGE_SIZE,
  EDITION_LABEL,
  NEWS_SECTION_INFO,
  briefingArchiveHref,
  isDateKey,
  isNewsSection,
  letterHref,
  volLabel,
  type NewsSection,
  type NewsView,
} from "@/lib/news-meta";
import { getIssue, listIssues, type IssueSummary } from "@/lib/server/briefing";
import { adjacentNewsDates, firstNewsDate, listNews, newsSectionCounts, popularNews } from "@/lib/server/news";
import { AD_SLOTS } from "@/lib/site";

export const metadata: Metadata = {
  title: `지난 브리핑 — 데일리 브리핑을 기간별로 | ${MAGAZINE_NAME}`,
  description: "지난 데일리 브리핑(아침판·점심판)을 기간으로 찾아보고, 카테고리(금융·경제·용어·면접 질문 등)를 고르면 기사별로 모아 볼 수 있어요.",
  alternates: { canonical: "/magazine/archive" },
};

type SP = Record<string, string | string[] | undefined>;
const LETTER_PAGE_SIZE = 10;
const one = (v: string | string[] | undefined) => ((Array.isArray(v) ? v[0] : v) ?? "").trim();

export default function ArchivePage({ searchParams }: PageProps<"/magazine/archive">) {
  return (
    <MagazineShell section="briefing">
      <DbSection noticeTitle="데일리 브리핑을 준비하고 있어요">
        <Suspense fallback={<div className="mt-8 h-[640px] animate-pulse rounded-2xl bg-canvas-soft" />}>
          {searchParams.then((sp) => (
            <Archive sp={sp as SP} />
          ))}
        </Suspense>
      </DbSection>
    </MagazineShell>
  );
}

/** "10월 1일 ~ 10월 16일" */
function rangeLabel(from: string | null, to: string | null): string {
  if (from && to) return from === to ? formatDayHeading(from) : `${formatShort(from)} ~ ${formatShort(to)}`;
  if (from) return `${formatShort(from)}부터`;
  if (to) return `${formatShort(to)}까지`;
  return "전체 기간";
}

async function Archive({ sp }: { sp: SP }) {
  await connection();
  const today = todayKST();
  const c = one(sp.c);
  const section: NewsSection | null = isNewsSection(c) ? c : null;
  // 예전 ?date= 주소는 하루 범위로
  const oldDate = isDateKey(one(sp.date)) ? one(sp.date) : null;
  let from = isDateKey(one(sp.from)) ? one(sp.from) : oldDate;
  let to = isDateKey(one(sp.to)) ? one(sp.to) : oldDate;
  if (from && to && from > to) [from, to] = [to, from];
  const page = Math.max(1, Number(one(sp.page)) || 1);
  const asked = one(sp.view);
  const saved = (await cookies()).get(NEWS_VIEW_COOKIE)?.value;
  const view: NewsView = asked === "card" || asked === "list" ? asked : saved === "card" ? "card" : "list";
  const keepView = asked === "card" || asked === "list" ? view : undefined;
  const single = from && to && from === to ? from : null;
  // 카테고리 없이 하루만 고르면 그날 아침판(없으면 점심판)으로
  if (single && !section) {
    if (await getIssue(single, "morning")) redirect(letterHref(single, "morning"));
    if (await getIssue(single, "noon")) redirect(letterHref(single, "noon"));
  }

  // 카테고리를 고르지 않으면 레터(호) 단위, 고르면 기사 단위
  const letters = !section;
  const noIssues: { items: IssueSummary[]; total: number } = { items: [], total: 0 };
  const [counts, first, popular, news, issues, around] = await Promise.all([
    newsSectionCounts(),
    firstNewsDate(),
    popularNews(7, 5),
    letters ? Promise.resolve({ items: [], total: 0 }) : listNews({ section, from, to, page }),
    letters ? listIssues({ from, to, page, pageSize: LETTER_PAGE_SIZE }) : Promise.resolve(noIssues),
    single && !letters ? adjacentNewsDates(single) : Promise.resolve(null),
  ]);
  const total = letters ? issues.total : news.total;

  const info = section ? NEWS_SECTION_INFO[section] : null;
  const Icon = section ? NEWS_ICON[section] : Mail;
  const href = (p: { from?: string | null; to?: string | null; view?: NewsView; page?: number; section?: NewsSection | null }) =>
    briefingArchiveHref({
      section: p.section === undefined ? section : p.section,
      from: p.from === undefined ? from : p.from,
      to: p.to === undefined ? to : p.to,
      view: p.view ?? keepView,
      page: p.page,
    });

  // 빠른 기간 고르기
  const monthStart = `${today.slice(0, 8)}01`;
  const lastMonthEnd = addDays(monthStart, -1);
  const presets: { label: string; from: string | null; to: string | null }[] = [
    { label: "전체 기간", from: null, to: null },
    { label: "최근 7일", from: addDays(today, -6), to: today },
    { label: "최근 30일", from: addDays(today, -29), to: today },
    { label: "최근 3개월", from: addDays(today, -89), to: today },
    { label: "이번 달", from: monthStart, to: today },
    { label: "지난달", from: `${lastMonthEnd.slice(0, 8)}01`, to: lastMonthEnd },
  ];
  const presetOn = (p: { from: string | null; to: string | null }) => p.from === from && p.to === to;
  const chip = "inline-flex shrink-0 items-center whitespace-nowrap rounded-full border px-3 py-1.5 type-caption transition-colors";

  return (
    <div className="mt-8">
      <Link href="/magazine" className="link inline-flex items-center gap-1 type-caption">
        <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
        데일리 브리핑
      </Link>
      <h2 className="mt-3 type-heading-lg text-ink md:type-display-md">지난 브리핑</h2>
      <p className="mt-1 type-body-md text-ink-mute">지난 브리핑을 기간으로 찾아보세요. 카테고리를 고르면 기사별로 모아 볼 수 있어요.</p>

      <div className="mt-6">
        <NewsCategoryNav active={section} counts={counts} archive={{ from, to, view: keepView }} />
      </div>

      {/* 기간 고르기 — 자바스크립트 없이도 되는 GET 폼 */}
      <section aria-label="기간 고르기" className="mt-4 rounded-2xl border border-hairline bg-canvas p-4 md:p-5">
        <form action="/magazine/archive" className="grid gap-3 sm:flex sm:flex-wrap sm:items-end">
          {section && <input type="hidden" name="c" value={section} />}
          {keepView && <input type="hidden" name="view" value={keepView} />}
          <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-end gap-2 sm:flex">
            <label className="block min-w-0">
              <span className="mb-1 block type-caption text-ink-secondary">시작일</span>
              <input type="date" name="from" defaultValue={from ?? ""} min={first ?? undefined} max={today} className="input w-full min-w-0 sm:w-[170px]" />
            </label>
            <span className="pb-2.5 text-ink-mute" aria-hidden>
              ~
            </span>
            <label className="block min-w-0">
              <span className="mb-1 block type-caption text-ink-secondary">종료일</span>
              <input type="date" name="to" defaultValue={to ?? ""} min={first ?? undefined} max={today} className="input w-full min-w-0 sm:w-[170px]" />
            </label>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn btn-sm btn-primary h-10 flex-1 sm:flex-none">
              <Search className="h-4 w-4" strokeWidth={2} />
              이 기간 보기
            </button>
            {(from || to) && (
              <Link href={href({ from: null, to: null })} className="btn btn-sm btn-toggle h-10">
                <X className="h-4 w-4" strokeWidth={2} />
                기간 지우기
              </Link>
            )}
          </div>
        </form>
        <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto">
          {presets.map((p) => (
            <Link
              key={p.label}
              href={href({ from: p.from, to: p.to })}
              aria-current={presetOn(p) ? "true" : undefined}
              className={cn(chip, presetOn(p) ? "border-brand-dark bg-brand-dark text-on-primary" : "border-hairline text-ink-secondary hover:border-hairline-input")}
            >
              {p.label}
            </Link>
          ))}
        </div>
        {first && <p className="mt-3 type-micro text-ink-mute">브리핑은 {formatDayHeading(first)}부터 있어요.</p>}
      </section>

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0">
          <div className="flex flex-col gap-3 border-b border-hairline pb-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <span className={cn("inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", info ? info.tone : "bg-canvas-soft text-ink-secondary")}>
                <Icon className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <div className="min-w-0">
                <h3 className="type-heading-lg text-ink">
                  {rangeLabel(from, to)}
                  <span className="ml-2 tabular type-body-md text-ink-mute">
                    {total}
                    {letters ? "호" : "건"}
                  </span>
                </h3>
                <p className="mt-0.5 type-caption text-ink-mute">{info ? `${info.label} · ${info.desc}` : "아침판·점심판 브리핑 — 최신 호부터"}</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {single && around && (
                <>
                  {around.prev ? (
                    <Link href={href({ from: around.prev, to: around.prev })} className="btn btn-sm btn-toggle" aria-label="이전 브리핑 날짜">
                      <ChevronLeft className="h-4 w-4" strokeWidth={2} />
                      {formatShort(around.prev)}
                    </Link>
                  ) : null}
                  {around.next ? (
                    <Link href={href({ from: around.next, to: around.next })} className="btn btn-sm btn-toggle" aria-label="다음 브리핑 날짜">
                      {formatShort(around.next)}
                      <ChevronRight className="h-4 w-4" strokeWidth={2} />
                    </Link>
                  ) : null}
                </>
              )}
              {!letters && <ViewToggle view={view} cookie={NEWS_VIEW_COOKIE} hrefs={{ card: href({ view: "card", page }), list: href({ view: "list", page }) }} />}
            </div>
          </div>

          {letters ? (
            issues.items.length === 0 ? (
              <div className="mt-8">
                <EmptyLine text="이 기간에는 발행된 브리핑이 없어요. 기간을 넓혀 보세요." />
              </div>
            ) : (
              <ul className="mt-6 space-y-4">
                {issues.items.map((row) => (
                  <li key={row.issue.id}>
                    <IssueRow row={row} />
                  </li>
                ))}
              </ul>
            )
          ) : news.items.length === 0 ? (
            <div className="mt-8">
              <EmptyLine text={`이 기간에는 '${info?.label ?? ""}' 기사가 없어요. 기간을 넓혀 보세요.`} />
            </div>
          ) : (
            <NewsGroupedList items={news.items} view={view} dayLinks={!single} />
          )}

          <div className="mt-10">
            <Pagination total={total} page={page} hrefFor={(p) => href({ page: p })} pageSize={letters ? LETTER_PAGE_SIZE : NEWS_PAGE_SIZE} />
          </div>
        </div>

        <aside className="space-y-4">
          <PopularNews items={popular} />
          <div className="lg:sticky lg:top-24">
            <AdSlot slot={AD_SLOTS.sidebar} variant="rectangle" />
          </div>
        </aside>
      </div>
    </div>
  );
}

/** 지난 브리핑 한 줄 — 판·호수·날짜·제목·여는 글·핵심 3가지(또는 용어·질문) */
function IssueRow({ row }: { row: IssueSummary }) {
  const { issue, top, count } = row;
  const morning = issue.edition === "morning";
  return (
    <Link href={letterHref(issue.date, issue.edition)} className="group block rounded-2xl border border-hairline bg-canvas p-5 transition-shadow hover:shadow-level-2 md:p-6">
      <span className="flex flex-wrap items-center gap-x-2 gap-y-1 type-caption text-ink-mute">
        <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold", morning ? "bg-[#fff1e0] text-[#b85c12]" : "bg-[#e6f6ec] text-[#2f7d4f]")}>
          <Mail className="h-3 w-3" strokeWidth={2} />
          {EDITION_LABEL[issue.edition]} {volLabel(issue.vol)}
        </span>
        <span className="tabular">{formatDayHeading(issue.date)}</span>
        <span aria-hidden>·</span>
        <span>{morning ? `기사 ${count}건` : "점심 공부 5코스"}</span>
      </span>
      <span className="mt-2 block type-heading-md text-ink [word-break:keep-all] group-hover:underline">{issue.title}</span>
      {issue.lede && <span className="mt-1.5 line-clamp-2 block type-body-md text-ink-secondary">{issue.lede}</span>}
      {top.length > 0 && (
        <ol className="mt-3 space-y-1">
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
      <span className="mt-4 inline-flex items-center gap-1 type-caption text-primary-text">
        브리핑 읽기
        <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
      </span>
    </Link>
  );
}
