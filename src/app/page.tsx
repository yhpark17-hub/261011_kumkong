import type { Metadata } from "next";
import { Suspense } from "react";
import { DbSection } from "@/components/db/DbSection";
import { CommunityStrip, CommunityStripSkeleton, RecentExamsPanel, RecentExamsPanelSkeleton } from "@/components/home/CommunityStrip";
import { MagazineStrip, MagazineStripSkeleton } from "@/components/home/MagazineStrip";
import { NewPostingsTicker, NewPostingsTickerSkeleton } from "@/components/home/NewPostingsTicker";
import { QuickMenu } from "@/components/home/QuickMenu";
import { UpcomingSchedule, UpcomingScheduleSkeleton } from "@/components/home/UpcomingSchedule";
import { Eyebrow } from "@/components/ui";
import { SITE, pageOpenGraph } from "@/lib/site";

// 제목·설명은 사이트 기본값(layout) 그대로, 대표 주소와 공유 주소만 홈으로
export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: pageOpenGraph("/", { title: SITE.title, description: SITE.description }),
};

/**
 * 홈 — 금콩의 섹션 입구가 모인 첫 화면 (전체 달력은 /calendar)
 * 휴대폰에서 첫 화면에 바로가기가 다 보이고, 아래로 일정·후기·브리핑·콩밭이 이어져요.
 */
export default function Home() {
  return (
    <>
      <Suspense fallback={<NewPostingsTickerSkeleton />}>
        <NewPostingsTicker />
      </Suspense>

      <div className="mx-auto max-w-[1200px] px-4 pt-6 pb-6 md:px-6 md:pt-12 md:pb-8">
        <Eyebrow>2026 하반기 금융권 채용</Eyebrow>
        <h1 className="mt-2 type-heading-lg text-ink [word-break:keep-all] md:mt-3 md:type-display-lg">금융공기업·공공기관 채용 준비</h1>
        <p className="mt-2 max-w-2xl type-body-md text-ink-secondary [word-break:keep-all] md:mt-4 md:type-body-lg">
          채용 일정부터 필기 후기, 데일리 브리핑까지 한곳에서 확인하세요.
        </p>
      </div>

      <div className="mx-auto max-w-[1200px] space-y-6 px-4 pb-12 md:space-y-8 md:px-6">
        <QuickMenu />

        <div className="grid gap-6 md:gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <Suspense fallback={<UpcomingScheduleSkeleton />}>
            <UpcomingSchedule />
          </Suspense>
          <DbSection silent>
            <Suspense fallback={<RecentExamsPanelSkeleton />}>
              <RecentExamsPanel />
            </Suspense>
          </DbSection>
        </div>

        <section aria-label="오늘의 브리핑과 매거진">
          <DbSection silent>
            <Suspense fallback={<MagazineStripSkeleton />}>
              <MagazineStrip />
            </Suspense>
          </DbSection>
        </section>

        <section aria-label="콩밭 새 글">
          <DbSection>
            <Suspense fallback={<CommunityStripSkeleton />}>
              <CommunityStrip />
            </Suspense>
          </DbSection>
        </section>
      </div>
    </>
  );
}
