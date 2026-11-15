import type { Metadata } from "next";
import { Suspense } from "react";
import { HomeDashboard } from "@/components/calendar/HomeDashboard";
import { DbSection } from "@/components/db/DbSection";
import { RecentExamsPanel, RecentExamsPanelSkeleton } from "@/components/home/RecentExamsPanel";
import { NewPostingsTicker, NewPostingsTickerSkeleton } from "@/components/home/NewPostingsTicker";
import { PageHeader } from "@/components/layout/PageHeader";
import { buildCatalog } from "@/lib/data";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "채용 캘린더 — 금융공기업·공공기관 채용 일정 달력",
  description:
    "한국은행·금감원·산업은행·신용보증기금 등 금융공기업과 공공기관, 공제회, 중앙회, 시중은행의 서류 마감·필기·면접·최종 발표 일정을 한 달력에서 확인하세요.",
  path: "/calendar",
});

/** 채용 캘린더 — 흰 머리(제목 한 줄) → 새 공고 한 줄 → 달력 */
export default function CalendarPage() {
  return (
    <>
      <PageHeader title="채용 캘린더" desc="서류 마감부터 필기·면접·최종 발표까지, 기관 공식 공고로 확인한 일정이에요." />

      <Suspense fallback={<NewPostingsTickerSkeleton />}>
        <NewPostingsTicker />
      </Suspense>

      <div className="mx-auto max-w-[1200px] px-4 pt-5 pb-12 md:px-6 md:pt-7">
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
