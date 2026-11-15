import type { Metadata } from "next";
import Image from "next/image";
import { connection } from "next/server";
import { Suspense } from "react";
import { ExamBrowser, type ExamCardData } from "@/components/reviews/ExamBrowser";
import { ReviewsSearchInput, ReviewsSearchProvider } from "@/components/reviews/ReviewsSearch";
import { DbSection } from "@/components/db/DbSection";
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
 * 필기 후기 — 그림 배너 + 큰 검색창 하나 → 지금 후기 받는 중 · 다가오는 필기 → 후기가 많이 모인 시험 → (눌러서) 지난 필기 전체
 * 검색창(배너)과 목록(ExamBrowser)은 ReviewsSearchProvider 로 같은 검색어를 나눠 써요.
 */
export default function ReviewsPage() {
  return (
    <ReviewsSearchProvider>
      <div className="mx-auto max-w-[1200px] px-4 pt-4 pb-12 md:px-6 md:pt-6">
        <section aria-labelledby="reviews-title" className="flex items-center gap-6 rounded-[28px] bg-lavender p-5 pb-6 md:rounded-[32px] md:px-11 md:py-9">
          <div className="min-w-0 flex-1">
            <h1 id="reviews-title" className="font-display text-[28px] leading-[1.2] text-ink md:text-[44px]">
              필기 끝나고, 30초 후기
            </h1>
            <p className="mt-2 type-body-md text-ink-secondary [word-break:keep-all] md:text-[16px]">시험 본 사람들이 남긴 체감 난이도를 모아 보여 드려요.</p>
            <ReviewsSearchInput />
          </div>
          <Image
            src="/illust/tile-exam.webp"
            alt="답안지와 연필 그림"
            width={156}
            height={156}
            priority
            className="hidden h-[120px] w-[120px] shrink-0 rounded-3xl object-cover sm:block md:h-[156px] md:w-[156px] md:rounded-[28px]"
          />
        </section>

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
      <div className="h-[460px] rounded-3xl bg-canvas-soft" />
      <div className="h-[220px] rounded-3xl bg-canvas-soft" />
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
