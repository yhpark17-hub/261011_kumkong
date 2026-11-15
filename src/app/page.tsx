import type { Metadata } from "next";
import { Suspense } from "react";
import { DbSection } from "@/components/db/DbSection";
import { CommunityStrip, CommunityStripSkeleton, RecentExamsPanel, RecentExamsPanelSkeleton } from "@/components/home/CommunityStrip";
import { BlogStrip, PopularBriefing, StripSkeleton, TodayBriefing } from "@/components/home/MagazineStrip";
import { NewPostingsTicker, NewPostingsTickerSkeleton } from "@/components/home/NewPostingsTicker";
import { QuickMenu } from "@/components/home/QuickMenu";
import { HomeHero, HomeHeroSkeleton, WeeklySchedule, WeeklyScheduleSkeleton } from "@/components/home/WeeklySchedule";
import { SITE, pageOpenGraph } from "@/lib/site";

// 제목·설명은 사이트 기본값(layout) 그대로, 대표 주소와 공유 주소만 홈으로
export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: pageOpenGraph("/", { title: SITE.title, description: SITE.description }),
};

/**
 * 홈 — '그림책 금콩' (2026-11-15 시안)
 * 새 공고 한 줄 → 그림 히어로(이번 주 한 문장) → 그림 타일 바로가기 → 이번 주 일정 | 오늘의 브리핑
 * → 최근 필기 후기 | 많이 본 브리핑 기사 → 금융 블로그 | 콩밭 새 글
 */
export default function Home() {
  return (
    <>
      <h1 className="sr-only">금콩 — 금융공기업·공공기관 채용 준비</h1>
      <Suspense fallback={<NewPostingsTickerSkeleton />}>
        <NewPostingsTicker />
      </Suspense>

      <div className="mx-auto max-w-[1200px] space-y-5 px-4 pt-3 pb-12 md:space-y-7 md:px-6 md:pt-5">
        <Suspense fallback={<HomeHeroSkeleton />}>
          <HomeHero />
        </Suspense>

        <QuickMenu />

        <div className="grid items-start gap-5 md:gap-7 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <Suspense fallback={<WeeklyScheduleSkeleton />}>
            <WeeklySchedule />
          </Suspense>
          <DbSection silent>
            <Suspense fallback={<StripSkeleton />}>
              <TodayBriefing />
            </Suspense>
          </DbSection>
        </div>

        <DbSection silent>
          <div className="grid gap-5 md:gap-7 lg:grid-cols-2">
            <Suspense fallback={<RecentExamsPanelSkeleton />}>
              <RecentExamsPanel limit={5} large />
            </Suspense>
            <Suspense fallback={<StripSkeleton />}>
              <PopularBriefing />
            </Suspense>
          </div>
        </DbSection>

        <DbSection silent>
          <div className="grid gap-5 md:gap-7 lg:grid-cols-2">
            <Suspense fallback={<StripSkeleton />}>
              <BlogStrip />
            </Suspense>
            <Suspense fallback={<CommunityStripSkeleton />}>
              <CommunityStrip limit={5} />
            </Suspense>
          </div>
        </DbSection>
      </div>
    </>
  );
}
