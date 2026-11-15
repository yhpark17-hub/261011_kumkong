import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { Newspaper } from "lucide-react";
import { AdSlot } from "@/components/ads/AdSlot";
import { DbSection } from "@/components/db/DbSection";
import { MorningTodayCard, NoonTodayCard, PastBriefings, PopularNews } from "@/components/magazine/news";
import { MagazineShell } from "@/components/magazine/sections";
import { WeeklyStrip } from "@/components/magazine/WeeklyRoundup";
import { getWeekly } from "@/data/weekly";
import { addDays, formatDayHeading, todayKST } from "@/lib/date";
import { MAGAZINE_NAME, articleHref, isBlogCategory, kstDateKey, magazineHref } from "@/lib/magazine-meta";
import { briefingArchiveHref, isDateKey, isNewsSection, type BriefingIssue } from "@/lib/news-meta";
import { arrangeLetter, getIssue, issueItems, issuesBetween, latestIssue, listIssues } from "@/lib/server/briefing";
import { latestWeekly } from "@/lib/server/magazine";
import { popularNews } from "@/lib/server/news";
import { isAdmin } from "@/lib/server/security";
import { articleWeeklyIn } from "@/lib/weekly";
import { AD_SLOTS, pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: `데일리 브리핑 — 오늘의 금융·경제·시사 뉴스와 용어·면접 질문 | ${MAGAZINE_NAME}`,
  description:
    "매일 아침 그림과 카드뉴스로 넘겨 보는 기사 브리핑, 점심에는 그 뉴스로 푸는 금공 필기형 3문제와 이번 주 금공 일정. 금융공기업 준비생이 알아야 할 금융·경제·정책·국제·공공기관 뉴스를 한 편의 브리핑으로.",
  path: "/magazine",
  alternates: { types: { "application/rss+xml": "/magazine/rss.xml" } },
});

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => ((Array.isArray(v) ? v[0] : v) ?? "").trim();

/** 매거진 · 데일리 브리핑 첫 화면 — 오늘(아침 · 점심 나란히) → 한 주 몰아보기 띠 → 많이 본 기사 · 지난 브리핑. 호를 누르면 뉴스레터로 열려요 */
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
    <div className="mt-6 animate-pulse space-y-5 md:mt-8">
      <div className="h-12 w-64 rounded-full bg-canvas-soft" />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.75fr)_minmax(0,1fr)]">
        <div className="h-[520px] rounded-3xl bg-canvas-soft" />
        <div className="h-[520px] rounded-3xl bg-lavender" />
      </div>
    </div>
  );
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
  const today = todayKST();

  const admin = await isAdmin();
  const [latest, popular, all, weeklyArticle, previousNoon] = await Promise.all([
    latestIssue(),
    popularNews(7, 5),
    listIssues({ pageSize: 1 }),
    latestWeekly({ admin }),
    latestIssue("noon"),
  ]);
  // 한 주 몰아보기 (주 1회 영상 + 글) — 오늘 브리핑 아래 얇은 남색 띠로. 공개한 지 9일이 지나면(다음 호가 안 나왔으면) 내려요
  const weeklyFresh = weeklyArticle && (weeklyArticle.draft || (weeklyArticle.publishedAt != null && kstDateKey(weeklyArticle.publishedAt) >= addDays(today, -9)));
  const weekly = weeklyArticle && weeklyFresh ? getWeekly(articleWeeklyIn(weeklyArticle.body)) : null;
  // 오늘 브리핑이 아직 없으면(이른 아침) 가장 최근 브리핑을 위에
  const heroDate = latest?.date ?? today;
  const [morningIssue, noonIssue] = latest ? await Promise.all([getIssue(heroDate, "morning"), getIssue(heroDate, "noon")]) : [null, null];
  const noon = arrangeLetter(noonIssue ? await issueItems(heroDate, "noon") : []);

  // 아침판 기사 수 + 지난 브리핑(위 날짜 앞의 나흘) — 날짜별로 아침·점심 한 묶음
  const [heroRows, pastRows] = await Promise.all([issuesBetween(heroDate, heroDate), issuesBetween(addDays(heroDate, -4), addDays(heroDate, -1))]);
  const morningCount = heroRows.find((r) => r.issue.edition === "morning")?.count ?? 0;
  const pastDays: { date: string; morning?: BriefingIssue; noon?: BriefingIssue }[] = [];
  for (const r of pastRows) {
    let d = pastDays.find((x) => x.date === r.issue.date);
    if (!d) pastDays.push((d = { date: r.issue.date }));
    d[r.issue.edition] = r.issue;
  }
  pastDays.sort((x, y) => (x.date < y.date ? 1 : -1));

  return (
    <div className="mt-6 md:mt-8">
      <div>
        <p className="text-[13px] leading-5 font-extrabold text-accent-text">{heroDate === today ? "오늘의 데일리 브리핑" : "가장 최근 브리핑"}</p>
        <p className="mt-0.5 font-display font-extrabold tracking-[-0.03em] text-[28px] leading-tight text-ink md:text-[40px]">{formatDayHeading(heroDate)}</p>
      </div>

      {/* 오늘: 아침 브리핑 · 점심 3문제 나란히 (번갈아 넘기지 않아요) */}
      <section aria-label="오늘의 브리핑" className="mt-4 grid gap-4 md:gap-5 lg:grid-cols-[minmax(0,1.75fr)_minmax(0,1fr)]">
        {morningIssue ? (
          <MorningTodayCard issue={morningIssue} count={morningCount} />
        ) : (
          <div className="flex min-h-[300px] flex-col items-center justify-center rounded-3xl border border-dashed border-hairline-input px-6 py-14 text-center md:min-h-[440px]">
            <Newspaper className="h-8 w-8 text-ink-mute-2" strokeWidth={1.5} />
            <p className="mt-3 type-heading-sm text-ink">첫 브리핑을 준비하고 있어요</p>
            <p className="mt-1 type-body-md text-ink-mute">아침에는 기사 브리핑, 점심에는 점심 3문제로 찾아올게요.</p>
          </div>
        )}
        <NoonTodayCard
          issue={noonIssue}
          previous={noonIssue ? null : previousNoon}
          term={noon.terms[0] ?? null}
          question={noon.questions[0] ?? null}
          pending={heroDate === today}
        />
      </section>

      {weeklyArticle && weekly && (
        <section aria-label="한 주 경제 몰아보기" className="mt-5">
          <WeeklyStrip href={articleHref(weeklyArticle.id)} title={weeklyArticle.title} week={weekly.week} poster={weekly.poster} draft={weeklyArticle.draft} />
        </section>
      )}

      {/* 많이 본 기사 · 지난 브리핑 */}
      <div className="mt-8 grid items-start gap-5 md:mt-10 md:gap-6 lg:grid-cols-2">
        <PopularNews items={popular} />
        <PastBriefings days={pastDays} total={all.total} />
      </div>

      <AdSlot slot={AD_SLOTS.inArticle} variant="inarticle" className="mt-10" />
    </div>
  );
}
