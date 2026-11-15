import type { Metadata } from "next";
import Image from "next/image";
import { Suspense } from "react";
import { HomeDashboard } from "@/components/calendar/HomeDashboard";
import { DbSection } from "@/components/db/DbSection";
import { RecentExamsPanel, RecentExamsPanelSkeleton } from "@/components/home/CommunityStrip";
import { NewPostingsTicker, NewPostingsTickerSkeleton } from "@/components/home/NewPostingsTicker";
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

      {/* 그림 배너 — 오른쪽 그림, 왼쪽 빈 벽 위에 제목 */}
      <div className="mx-auto max-w-[1200px] px-4 pt-4 pb-5 md:px-6 md:pt-6 md:pb-7">
        <section aria-labelledby="calendar-title" className="relative min-h-[150px] overflow-hidden rounded-[28px] bg-lilac md:min-h-[230px] md:rounded-[32px]">
          <Image
            src="/illust/calendar-banner.webp"
            alt="책상 위 탁상 달력과 시계 그림"
            fill
            priority
            sizes="(min-width: 1200px) 1152px, 100vw"
            className="object-cover object-[88%_center] md:object-right"
          />
          <div className="relative max-w-[62%] p-5 md:max-w-[560px] md:px-11 md:py-10">
            <h1 id="calendar-title" className="font-display text-[28px] leading-tight text-ink md:text-[42px]">
              채용 캘린더
            </h1>
            <p className="mt-2 text-[13px] leading-relaxed text-ink-secondary [word-break:keep-all] md:text-[16px]">
              서류 마감부터 필기·면접·최종 발표까지, 금융공기업·공공기관 일정을 한 달력에서 확인하세요.
            </p>
          </div>
        </section>
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
