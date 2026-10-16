import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import Link from "next/link";
import { DbSection } from "@/components/db/DbSection";
import { KongMascot } from "@/components/magazine/KongMascot";
import { LetterScreen } from "@/components/magazine/LetterScreen";
import { NewsCategoryNav } from "@/components/magazine/news";
import { MagazineShell } from "@/components/magazine/sections";
import { MAGAZINE_NAME, isBlogCategory, magazineHref } from "@/lib/magazine-meta";
import { LETTER_TAGLINE, briefingArchiveHref, isDateKey, isNewsSection } from "@/lib/news-meta";
import { adjacentIssues, arrangeLetter, issueItems, latestIssue, recentIssues } from "@/lib/server/briefing";
import { newsSectionCounts, popularNews } from "@/lib/server/news";
import { isAdmin } from "@/lib/server/security";

export const metadata: Metadata = {
  title: `데일리 브리핑 — 금공 준비생의 아침을 여는 5분 레터 | ${MAGAZINE_NAME}`,
  description:
    "매일 아침 한 편의 레터로. 오늘 꼭 알아야 할 금융·경제·시사 뉴스 3가지와 핵심 기사, 한 줄 뉴스, 오늘의 용어와 면접 질문까지 금공 준비생 눈높이로 정리합니다.",
  alternates: { canonical: "/magazine", types: { "application/rss+xml": "/magazine/rss.xml" } },
};

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => ((Array.isArray(v) ? v[0] : v) ?? "").trim();

/** 매거진 · 데일리 브리핑 = 가장 최근 레터 */
export default function BriefingPage({ searchParams }: PageProps<"/magazine">) {
  return (
    <MagazineShell section="briefing">
      <DbSection noticeTitle="데일리 브리핑을 준비하고 있어요">
        <Suspense fallback={<div className="mx-auto mt-8 h-[900px] max-w-[760px] animate-pulse rounded-3xl bg-canvas-soft" />}>
          {searchParams.then((sp) => (
            <LatestLetter sp={sp as SP} />
          ))}
        </Suspense>
      </DbSection>
    </MagazineShell>
  );
}

async function LatestLetter({ sp }: { sp: SP }) {
  const c = one(sp.c);
  const q = one(sp.q);
  // 예전 주소(/magazine?c=exam, ?q=) 는 금융 블로그로, 브리핑 거르기(?c=finance, ?date=)는 전체 브리핑으로
  if ((isBlogCategory(c) && !isNewsSection(c)) || q) redirect(magazineHref({ category: isBlogCategory(c) ? c : null, q: q || null }));
  const oldDate = one(sp.date);
  if (isNewsSection(c) || isDateKey(oldDate) || one(sp.page)) {
    redirect(briefingArchiveHref({ section: isNewsSection(c) ? c : null, from: isDateKey(oldDate) ? oldDate : null, to: isDateKey(oldDate) ? oldDate : null }));
  }

  await connection();
  const [issue, admin, counts, popular, recent] = await Promise.all([latestIssue(), isAdmin(), newsSectionCounts(), popularNews(7, 5), recentIssues(6)]);

  if (!issue) {
    return (
      <div className="mt-8">
        <NewsCategoryNav active={null} counts={counts} />
        <div className="mx-auto mt-8 max-w-[760px] rounded-3xl bg-canvas-cream px-6 py-16 text-center">
          <KongMascot className="mx-auto h-16 w-16" wave />
          <p className="mt-4 type-heading-md text-ink">첫 레터를 준비하고 있어요</p>
          <p className="mt-1 type-body-md text-ink-secondary">{LETTER_TAGLINE} — 매일 아침 한 편으로 찾아올게요.</p>
          {admin && (
            <Link href="/admin/news" className="btn btn-sm btn-secondary mt-6">
              운영자: 검토 대기 레터 보기
            </Link>
          )}
        </div>
      </div>
    );
  }

  const [items, around] = await Promise.all([issueItems(issue.date), adjacentIssues(issue.date)]);
  return (
    <LetterScreen issue={issue} content={arrangeLetter(items)} admin={admin} recent={recent} popular={popular} around={around} counts={counts} />
  );
}
