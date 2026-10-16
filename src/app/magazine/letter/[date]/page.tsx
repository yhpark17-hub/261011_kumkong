import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { DbSection } from "@/components/db/DbSection";
import { LetterScreen } from "@/components/magazine/LetterScreen";
import { MagazineShell } from "@/components/magazine/sections";
import { isDateKey, letterHref, volLabel } from "@/lib/news-meta";
import { adjacentIssues, arrangeLetter, getIssue, issueItems, recentIssues } from "@/lib/server/briefing";
import { dbConfigured } from "@/lib/server/db";
import { newsSectionCounts, popularNews } from "@/lib/server/news";
import { isAdmin } from "@/lib/server/security";
import { OG_IMAGE } from "@/lib/site";

export async function generateMetadata({ params }: PageProps<"/magazine/letter/[date]">): Promise<Metadata> {
  const { date } = await params;
  await connection(); // 발행 시각 비교(Date.now) 전에
  const issue = isDateKey(date) && dbConfigured() ? await getIssue(date).catch(() => null) : null;
  if (!issue) return { title: "데일리 브리핑", robots: { index: false, follow: false } };
  const title = `${volLabel(issue.vol)} ${issue.title}`;
  const description = issue.lede.replace(/\s+/g, " ").slice(0, 150);
  return {
    title: `${title} - 데일리 브리핑`,
    description,
    alternates: { canonical: letterHref(issue.date) },
    openGraph: { title, description, type: "article", images: [OG_IMAGE] },
  };
}

/** 데일리 브리핑 레터 한 호 (운영자는 초안도 미리 보기) */
export default function LetterPage({ params }: PageProps<"/magazine/letter/[date]">) {
  return (
    <MagazineShell section="briefing">
      <DbSection noticeTitle="데일리 브리핑을 준비하고 있어요">
        <Suspense fallback={<div className="mx-auto mt-8 h-[900px] max-w-[760px] animate-pulse rounded-3xl bg-canvas-soft" />}>
          {params.then(({ date }) => (
            <IssueView date={date} />
          ))}
        </Suspense>
      </DbSection>
    </MagazineShell>
  );
}

async function IssueView({ date }: { date: string }) {
  await connection();
  if (!isDateKey(date)) notFound();
  const admin = await isAdmin();
  const issue = await getIssue(date, { admin });
  if (!issue) notFound();
  const [items, around, counts, popular, recent] = await Promise.all([
    issueItems(date, { admin }),
    adjacentIssues(date),
    newsSectionCounts(),
    popularNews(7, 5),
    recentIssues(6),
  ]);
  return <LetterScreen issue={issue} content={arrangeLetter(items)} admin={admin} recent={recent} popular={popular} around={around} counts={counts} />;
}
