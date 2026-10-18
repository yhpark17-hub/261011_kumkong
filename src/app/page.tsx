import type { Metadata } from "next";
import { Suspense } from "react";
import { DbSection } from "@/components/db/DbSection";
import { CommunityStrip, CommunityStripSkeleton, RecentExamsPanel, RecentExamsPanelSkeleton } from "@/components/home/CommunityStrip";
import { BlogStrip, BriefingStrip, PopularBriefing, StripSkeleton, TodayQuiz } from "@/components/home/MagazineStrip";
import { NewPostingsTicker, NewPostingsTickerSkeleton } from "@/components/home/NewPostingsTicker";
import { QuickMenu } from "@/components/home/QuickMenu";
import { WeeklySchedule, WeeklyScheduleSkeleton } from "@/components/home/WeeklySchedule";
import { Eyebrow } from "@/components/ui";
import { SITE, pageOpenGraph } from "@/lib/site";

// 제목·설명은 사이트 기본값(layout) 그대로, 대표 주소와 공유 주소만 홈으로
export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: pageOpenGraph("/", { title: SITE.title, description: SITE.description }),
};

/**
 * 홈 — 금콩의 섹션 입구가 모인 첫 화면 (전체 달력은 /calendar)
 * 휴대폰: 바로가기 → 이번 주 일정 → 브리핑 → 필기 체감 난이도 → 오늘의 퀴즈 → 많이 본 브리핑 → 블로그 → 콩밭
 * PC: 바로가기는 위 메뉴로 충분해서 숨기고, 두 칸씩 높이를 맞춰 배치
 */
export default function Home() {
  return (
    <>
      <Suspense fallback={<NewPostingsTickerSkeleton />}>
        <NewPostingsTicker />
      </Suspense>

      <div className="mx-auto max-w-[1200px] px-4 pt-4 pb-4 md:px-6 md:pt-12 md:pb-8">
        <Eyebrow className="max-md:hidden">2026 하반기 금융권 채용</Eyebrow>
        <h1 className="type-heading-lg text-ink [word-break:keep-all] md:mt-3 md:type-display-lg">금융공기업·공공기관 채용 준비</h1>
        <p className="mt-4 max-w-2xl type-body-lg text-ink-secondary [word-break:keep-all] max-md:hidden">
          채용 일정부터 필기 후기, 데일리 브리핑까지 한곳에서 확인하세요.
        </p>
      </div>

      <div className="mx-auto max-w-[1200px] space-y-6 px-4 pb-12 md:space-y-8 md:px-6">
        <QuickMenu />

        <Suspense fallback={<WeeklyScheduleSkeleton />}>
          <WeeklySchedule />
        </Suspense>

        {/* 늘 내용이 차 있는 두 칸끼리 (높이가 맞음) */}
        <DbSection silent>
          <div className="grid gap-6 md:gap-8 lg:grid-cols-2">
            <Suspense fallback={<StripSkeleton />}>
              <BriefingStrip />
            </Suspense>
            <Suspense fallback={<RecentExamsPanelSkeleton />}>
              <RecentExamsPanel limit={6} large />
            </Suspense>
          </div>
        </DbSection>

        {/* 매일 들어올 이유: 오늘의 퀴즈 한 문제 + 많이 본 브리핑 (DESIGN-MOBILE.md 6) */}
        <DbSection silent>
          <div className="grid gap-6 md:gap-8 lg:grid-cols-2">
            <Suspense fallback={<StripSkeleton />}>
              <TodayQuiz />
            </Suspense>
            <Suspense fallback={<StripSkeleton />}>
              <PopularBriefing />
            </Suspense>
          </div>
        </DbSection>

        {/* 글 수가 들쭉날쭉한 두 칸 — 아래에 '전체 보기·글쓰기' 줄을 붙여 빈 칸처럼 보이지 않게 */}
        <div className="grid gap-6 md:gap-8 lg:grid-cols-2">
          <DbSection silent>
            <Suspense fallback={<StripSkeleton />}>
              <BlogStrip />
            </Suspense>
          </DbSection>
          <section aria-label="콩밭 새 글" className="min-w-0">
            <DbSection>
              <Suspense fallback={<CommunityStripSkeleton />}>
                <CommunityStrip limit={5} />
              </Suspense>
            </DbSection>
          </section>
        </div>
      </div>
    </>
  );
}
