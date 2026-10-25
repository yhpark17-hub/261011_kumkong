import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { Newspaper } from "lucide-react";
import { AdSlot } from "@/components/ads/AdSlot";
import { DbSection } from "@/components/db/DbSection";
import { NEWS_VIEW_COOKIE, ViewToggle } from "@/components/magazine/BlogControls";
import { HeroSwitcher } from "@/components/magazine/HeroSwitcher";
import { ArchiveCallout, BriefingHeroCard, FeatureItemCard, IssueCard, NewsCategoryNav, PopularNews } from "@/components/magazine/news";
import { EmptyLine, MagazineShell } from "@/components/magazine/sections";
import { addDays, formatDayHeading, todayKST } from "@/lib/date";
import { MAGAZINE_NAME, isBlogCategory, magazineHref } from "@/lib/magazine-meta";
import { EDITION_SCHEDULE, briefingArchiveHref, isDateKey, isNewsSection, type NewsView } from "@/lib/news-meta";
import { arrangeLetter, getIssue, issueItems, issuesBetween, latestIssue, listIssues, type IssueSummary } from "@/lib/server/briefing";
import { latestInSection, newsSectionCounts, popularNews } from "@/lib/server/news";
import { AD_SLOTS, adEnabled, pageMetadata } from "@/lib/site";
import { cn } from "@/components/ui";

export const metadata: Metadata = pageMetadata({
  title: `데일리 브리핑 — 오늘의 금융·경제·시사 뉴스와 용어·면접 질문 | ${MAGAZINE_NAME}`,
  description:
    "매일 아침 그림과 카드뉴스로 넘겨 보는 기사 브리핑, 점심에는 금콩 스터디로 오늘의 용어·논술·면접 질문. 금융공기업 준비생이 알아야 할 금융·경제·정책·국제·공공기관 뉴스를 한 편의 브리핑으로.",
  path: "/magazine",
  alternates: { types: { "application/rss+xml": "/magazine/rss.xml" } },
});

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => ((Array.isArray(v) ? v[0] : v) ?? "").trim();

/** 매거진 · 데일리 브리핑 첫 화면 — 브리핑(호)을 누르면 뉴스레터 형식으로 열려요 */
export default function BriefingPage({ searchParams }: PageProps<"/magazine">) {
  return (
    <MagazineShell section="briefing">
      <DbSection noticeTitle="데일리 브리핑을 준비하고 있어요">
        <Suspense fallback={<NewsSkeleton />}>{searchParams.then((sp) => <BriefingFront sp={sp as SP} />)}</Suspense>
      </DbSection>
    </MagazineShell>
  );
}

function NewsSkeleton() {
  return (
    <div className="mt-8 animate-pulse space-y-6">
      <div className="h-10 w-full max-w-xl rounded-full bg-canvas-soft" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="h-[440px] rounded-2xl bg-canvas-soft" />
        <div className="h-[440px] rounded-2xl bg-canvas-soft" />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="h-48 rounded-2xl bg-canvas-soft" />
        <div className="h-48 rounded-2xl bg-canvas-soft" />
      </div>
    </div>
  );
}

/** 날짜별로 묶기 (최신 날짜 먼저, 같은 날은 아침판 → 금콩 스터디) */
function byDate(rows: IssueSummary[]): { date: string; rows: IssueSummary[] }[] {
  const out: { date: string; rows: IssueSummary[] }[] = [];
  for (const r of [...rows].sort((a, b) => (a.issue.date === b.issue.date ? (a.issue.edition === "morning" ? -1 : 1) : a.issue.date < b.issue.date ? 1 : -1))) {
    const last = out.at(-1);
    if (last && last.date === r.issue.date) last.rows.push(r);
    else out.push({ date: r.issue.date, rows: [r] });
  }
  return out;
}

async function BriefingFront({ sp }: { sp: SP }) {
  const c = one(sp.c);
  const q = one(sp.q);
  // 예전 주소(/magazine?c=exam, ?q=) 는 금융 블로그로, 브리핑 거르기(?c=finance, ?date=)는 지난 브리핑으로
  if ((isBlogCategory(c) && !isNewsSection(c)) || q) redirect(magazineHref({ category: isBlogCategory(c) ? c : null, q: q || null }));
  const oldDate = one(sp.date);
  if (isNewsSection(c) || isDateKey(oldDate) || one(sp.page)) {
    redirect(briefingArchiveHref({ section: isNewsSection(c) ? c : null, from: isDateKey(oldDate) ? oldDate : null, to: isDateKey(oldDate) ? oldDate : null }));
  }

  await connection();
  const asked = one(sp.view);
  const saved = (await cookies()).get(NEWS_VIEW_COOKIE)?.value;
  const view: NewsView = asked === "card" || asked === "list" ? asked : saved === "card" ? "card" : "list";
  const today = todayKST();

  const [counts, latest, popular, all] = await Promise.all([
    newsSectionCounts(),
    latestIssue(),
    popularNews(7, 6),
    listIssues({ pageSize: 1 }),
  ]);
  // 오늘 브리핑이 아직 없으면(이른 아침) 가장 최근 브리핑을 위에
  const heroDate = latest?.date ?? today;
  const [morningIssue, noonIssue] = latest ? await Promise.all([getIssue(heroDate, "morning"), getIssue(heroDate, "noon")]) : [null, null];
  const noonItems = noonIssue ? await issueItems(heroDate, "noon") : [];
  const noon = arrangeLetter(noonItems);
  const [term, question] = await Promise.all([noon.terms[0] ?? latestInSection("term"), noon.questions[0] ?? latestInSection("question")]);

  // 아래 목록: 위 브리핑 날 기준 앞의 이틀 (16일이면 15·14일)
  const from = addDays(heroDate, -2);
  const to = addDays(heroDate, -1);
  const recent = await issuesBetween(from, to);
  const sideAd = adEnabled(AD_SLOTS.sidebar);

  return (
    <div className="mt-8">
      <NewsCategoryNav active={null} counts={counts} />

      <section aria-label="오늘의 브리핑" className="mt-8 space-y-6">
        <div>
          <p className="type-micro-cap text-primary-text">{heroDate === today ? "오늘의 브리핑" : "가장 최근 브리핑"}</p>
          <p className="mt-0.5 type-heading-lg text-ink">{formatDayHeading(heroDate)}</p>
        </div>

        {/* 대표 브리핑(아침판·금콩 스터디 번갈아)이 더 중요해서 넓게, 많이 본 기사는 옆에 좁게 */}
        <div className="grid gap-6 md:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
          {morningIssue || noonIssue ? (
            <HeroSwitcher
              slides={[
                {
                  edition: "morning",
                  card: morningIssue ? <BriefingHeroCard issue={morningIssue} /> : null,
                  hint: `${EDITION_SCHEDULE[0].time} 공개`,
                },
                {
                  edition: "noon",
                  card: noonIssue ? <BriefingHeroCard issue={noonIssue} /> : null,
                  hint: `${EDITION_SCHEDULE[1].time} 공개`,
                },
              ]}
            />
          ) : (
            <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-hairline-input px-6 py-14 text-center md:min-h-[440px]">
              <Newspaper className="h-8 w-8 text-ink-mute-2" strokeWidth={1.5} />
              <p className="mt-3 type-heading-sm text-ink">첫 브리핑을 준비하고 있어요</p>
              <p className="mt-1 type-body-md text-ink-mute">아침에는 기사 브리핑, 점심에는 금콩 스터디로 찾아올게요.</p>
            </div>
          )}
          <PopularNews items={popular} fill />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <FeatureItemCard section="term" n={term} today={today} />
          <FeatureItemCard section="question" n={question} today={today} />
        </div>
      </section>

      {/* 오른쪽 칸은 광고 자리뿐이라, 광고가 꺼져 있으면 칸을 두지 않고 위 상자들과 같은 폭으로 */}
      <div className={cn("mt-12 grid gap-10", sideAd && "lg:grid-cols-[minmax(0,1fr)_300px]")}>
        <div className="min-w-0">
          <div className="flex flex-col gap-3 border-b border-hairline pb-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <h2 className="type-heading-lg text-ink">
                최근 브리핑
                <span className="ml-2 tabular type-body-md text-ink-mute">{recent.length}호</span>
              </h2>
              <p className="mt-0.5 type-caption text-ink-mute">
                최근 이틀 동안의 브리핑만 보여 드려요. 이전 브리핑은 아래 ‘지난 브리핑 전체 보기’를 눌러 확인해 주세요.
              </p>
            </div>
            <ViewToggle view={view} cookie={NEWS_VIEW_COOKIE} hrefs={{ card: "/magazine?view=card", list: "/magazine?view=list" }} />
          </div>

          {recent.length === 0 ? (
            <div className="mt-8">
              <EmptyLine text="이 이틀 동안 올라온 브리핑이 없어요. 지난 브리핑은 아래에서 찾아보세요." />
            </div>
          ) : (
            byDate(recent).map((g) => (
              <section key={g.date} aria-label={formatDayHeading(g.date)}>
                <h3 className="mt-8 type-heading-sm text-ink">{formatDayHeading(g.date)}</h3>
                {view === "card" ? (
                  <div className="mt-4 grid gap-6 sm:grid-cols-2">
                    {g.rows.map((r) => (
                      <IssueCard key={r.issue.id} issue={r.issue} top={r.top} count={r.count} view="card" />
                    ))}
                  </div>
                ) : (
                  <ul className="mt-1 divide-y divide-hairline border-t border-hairline">
                    {g.rows.map((r) => (
                      <li key={r.issue.id}>
                        <IssueCard issue={r.issue} top={r.top} count={r.count} view="list" />
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))
          )}

          <ArchiveCallout total={all.total} className="mt-10" />
        </div>

        {sideAd && (
          <aside className="space-y-4">
            <div className="lg:sticky lg:top-24">
              <AdSlot slot={AD_SLOTS.sidebar} variant="rectangle" />
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
