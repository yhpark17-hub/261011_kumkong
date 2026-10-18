import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { DbSection } from "@/components/db/DbSection";
import { LetterScreen } from "@/components/magazine/LetterScreen";
import { MagazineShell } from "@/components/magazine/sections";
import { formatDayHeading } from "@/lib/date";
import { EDITION_LABEL, isDateKey, isIssueEdition, letterHref, shareImageUrl } from "@/lib/news-meta";
import { adjacentIssues, arrangeLetter, getIssue, issueItems, recentIssues } from "@/lib/server/briefing";
import { dbConfigured } from "@/lib/server/db";
import { popularNews } from "@/lib/server/news";
import { isAdmin } from "@/lib/server/security";
import { pageOpenGraph } from "@/lib/site";

export async function generateMetadata({ params }: PageProps<"/magazine/letter/[date]/[edition]">): Promise<Metadata> {
  const { date, edition } = await params;
  await connection(); // 발행 시각 비교(Date.now) 전에
  const issue = isDateKey(date) && isIssueEdition(edition) && dbConfigured() ? await getIssue(date, edition).catch(() => null) : null;
  if (!issue) return { title: "데일리 브리핑", robots: { index: false, follow: false } };
  const title = `${formatDayHeading(issue.date)} ${EDITION_LABEL[issue.edition]} — ${issue.title}`;
  const description = issue.lede.replace(/\s+/g, " ").slice(0, 150);
  return {
    title: `${title} | 데일리 브리핑`,
    description,
    alternates: { canonical: letterHref(issue.date, issue.edition) },
    // 공유 썸네일: 올린 그림 또는 그날 그린 그림 — 수정 시각(?v=)을 붙여 고치면 카톡도 새 그림을 가져가요
    openGraph: pageOpenGraph(
      letterHref(issue.date, issue.edition),
      { title, description, type: "article", images: [{ url: shareImageUrl(issue), width: 1200, height: 630, alt: `${EDITION_LABEL[issue.edition]} ${formatDayHeading(issue.date)}` }] },
      { fileImage: true },
    ),
  };
}

/** 데일리 브리핑 한 호 (운영자는 초안도 미리 보기) */
export default function LetterEditionPage({ params }: PageProps<"/magazine/letter/[date]/[edition]">) {
  return (
    <MagazineShell section="briefing">
      <DbSection noticeTitle="데일리 브리핑을 준비하고 있어요">
        <Suspense fallback={<div className="mx-auto mt-8 h-[900px] max-w-[760px] animate-pulse rounded-3xl bg-canvas-soft" />}>
          {params.then(({ date, edition }) => (
            <IssueView date={date} edition={edition} />
          ))}
        </Suspense>
      </DbSection>
    </MagazineShell>
  );
}

async function IssueView({ date, edition }: { date: string; edition: string }) {
  await connection();
  if (!isDateKey(date) || !isIssueEdition(edition)) notFound();
  const admin = await isAdmin();
  const other = edition === "morning" ? "noon" : "morning";
  const [issue, sibling] = await Promise.all([getIssue(date, edition, { admin }), getIssue(date, other)]);
  if (!issue) notFound();
  const [items, around, popular, recent] = await Promise.all([issueItems(date, edition, { admin }), adjacentIssues(date, edition), popularNews(7, 5), recentIssues(8)]);
  return (
    <LetterScreen issue={issue} content={arrangeLetter(items)} admin={admin} recent={recent} popular={popular} around={around} sibling={sibling} />
  );
}
