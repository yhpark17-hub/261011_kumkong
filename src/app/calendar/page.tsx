import type { Metadata } from "next";
import { Suspense } from "react";
import { HomeDashboard } from "@/components/calendar/HomeDashboard";
import { DbSection } from "@/components/db/DbSection";
import { RecentExamsPanel, RecentExamsPanelSkeleton } from "@/components/home/CommunityStrip";
import { NewPostingsTicker, NewPostingsTickerSkeleton } from "@/components/home/NewPostingsTicker";
import { Eyebrow } from "@/components/ui";
import { buildCatalog } from "@/lib/data";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "채용 캘린더 — 금융공기업·공공기관 채용 일정 달력",
  description:
    "한국은행·금감원·산업은행·신용보증기금 등 금융공기업과 공공기관, 공제회, 중앙회, 시중은행의 서류 마감·필기·면접·최종 발표 일정을 한 달력에서 확인하세요.",
  path: "/calendar",
});

/** 채용 캘린더 — 예전 홈 화면의 달력 (홈은 섹션 입구가 모인 첫 화면으로 바뀜) */
export default function CalendarPage() {
  return (
    <>
      <Suspense fallback={<NewPostingsTickerSkeleton />}>
        <NewPostingsTicker />
      </Suspense>

      <div className="mx-auto max-w-[1200px] px-4 pt-8 pb-8 md:px-6 md:pt-12">
        <Eyebrow>2026 하반기 금융권 채용</Eyebrow>
        <h1 className="mt-3 type-display-md text-ink md:type-display-lg lg:type-display-xl">금융공기업·공공기관 채용 캘린더</h1>
        <p className="mt-4 max-w-2xl type-body-lg text-ink-secondary">
          서류 마감부터 필기·면접·최종 발표까지, 놓치면 안 되는 일정을 한 달력에서 확인하세요.
        </p>
      </div>

      <div className="mx-auto max-w-[1200px] px-4 pb-12 md:px-6">
        <HomeDashboard
          catalog={buildCatalog()}
          afterStatus={
            <DbSection silent>
              <Suspense fallback={<RecentExamsPanelSkeleton />}>
                <RecentExamsPanel />
              </Suspense>
            </DbSection>
          }
        />
      </div>
    </>
  );
}
