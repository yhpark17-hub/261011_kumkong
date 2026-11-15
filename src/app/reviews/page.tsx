import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { ExamBrowser, type ExamCardData } from "@/components/reviews/ExamBrowser";
import { ReviewsSearchInput, ReviewsSearchProvider } from "@/components/reviews/ReviewsSearch";
import { DbSection } from "@/components/db/DbSection";
import { PageHeader } from "@/components/layout/PageHeader";
import { diffDays, todayKST } from "@/lib/date";
import type { ExamInfo } from "@/lib/review-meta";
import { examActivity, examSummaries, listExams } from "@/lib/server/reviews";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "필기 후기 — 금융공기업·공공기관 필기 체감 난이도 투표",
  description:
    "금감원·한국은행·산업은행 등 금융공기업과 공공기관 필기시험이 끝나면, 응시자들이 남긴 전체 난이도·과목별 체감 난이도·못 푼 문항 수·시간 여유를 그래프로 확인하세요.",
  path: "/reviews",
});

/**
 * 필기 후기 — 흰 머리(제목 + 오른쪽 검색창) → 지금 후기 받는 중 · 다가오는 필기 → 후기가 많이 모인 시험 → (눌러서) 지난 필기 전체
 * 검색창(머리)과 목록(ExamBrowser)은 ReviewsSearchProvider 로 같은 검색어를 나눠 써요.
 */
export default function ReviewsPage() {
  return (
    <ReviewsSearchProvider>
      <PageHeader title="필기 후기" desc="시험 본 사람들이 남긴 체감 난이도를 모아 보여 드려요. 시험이 끝나면 30초 후기를 남겨 주세요." actions={<ReviewsSearchInput />} />
      <div className="mx-auto max-w-[1200px] px-4 pb-12 md:px-6">
        <DbSection noticeTitle="필기 후기 투표를 준비하고 있어요">
          <Suspense fallback={<ListSkeleton />}>
            <ExamLists />
          </Suspense>
        </DbSection>
      </div>
    </ReviewsSearchProvider>
  );
}

function ListSkeleton() {
  return (
    <div className="mt-6 grid animate-pulse gap-5 md:mt-8 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
      <div className="h-[460px] rounded-xl bg-canvas" />
      <div className="h-[220px] rounded-xl bg-canvas" />
    </div>
  );
}

/** 클라이언트로는 목록에 필요한 값만 넘깁니다 */
function toCard(e: ExamInfo): ExamCardData {
  return {
    id: e.id,
    companyId: e.companyId,
    companyName: e.companyName,
    shortName: e.shortName,
    avatar: e.avatar,
    logo: e.logo,
    date: e.date,
    label: e.label,
    category: e.category,
    expected: e.expected,
  };
}

async function ExamLists() {
  await connection();
  const today = todayKST();
  const all = listExams();
  const done = all.filter((e) => !e.expected && e.date <= today);
  // 시험 직후 3일은 후기를 남긴 방문자에게만 평균 난이도가 넘어가요
  const [summaries, activity] = await Promise.all([examSummaries(done, today), examActivity()]);
  // 지난 시험: 최근 순, 참여가 있는 시험은 1년이 지나도 남김
  const past = done.filter((e) => diffDays(e.date, today) <= 365 || summaries[e.id]);
  const upcoming = all.filter((e) => e.date > today).sort((a, b) => (a.date < b.date ? -1 : 1));

  return <ExamBrowser past={past.map(toCard)} upcoming={upcoming.map(toCard)} summaries={summaries} activity={activity} today={today} />;
}
