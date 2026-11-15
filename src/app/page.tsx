import type { Metadata } from "next";
import { Suspense } from "react";
import { DbSection } from "@/components/db/DbSection";
import { HomeBoard, HomeReviews } from "@/components/home/HomeLists";
import { HomeMagazine, HomeMagazineSkeleton } from "@/components/home/HomeMagazine";
import { ListSkeleton } from "@/components/home/HomeParts";
import { HomeTop, HomeTopSkeleton } from "@/components/home/HomeTop";
import { SITE, pageOpenGraph } from "@/lib/site";

// 제목·설명은 사이트 기본값(layout) 그대로, 대표 주소와 공유 주소만 홈으로
export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: pageOpenGraph("/", { title: SITE.title, description: SITE.description }),
};

/**
 * 홈 — 2026-11-15 5차 시안 (흰 바탕, 상자 없이)
 * 남색 첫 칸(금콩 소개 · 기관 검색 · 곧 다가오는 마감·필기) → 금콩 매거진 그림 카드 한 줄 → 필기 후기 | 콩밭
 * 달력은 채용 캘린더에만 (홈에는 '곧 다가오는 일정'만)
 */
export default function Home() {
  return (
    <>
      <Suspense fallback={<HomeTopSkeleton />}>
        <HomeTop />
      </Suspense>

      <div className="mx-auto max-w-[1200px] px-4 md:px-6">
        <DbSection silent>
          <Suspense fallback={<HomeMagazineSkeleton />}>
            <HomeMagazine />
          </Suspense>
        </DbSection>

        <div className="mt-9 grid gap-9 md:mt-14 md:grid-cols-2 md:gap-10 lg:gap-12">
          <DbSection silent>
            <Suspense fallback={<ListSkeleton />}>
              <HomeReviews />
            </Suspense>
          </DbSection>
          <DbSection silent>
            <Suspense fallback={<ListSkeleton />}>
              <HomeBoard />
            </Suspense>
          </DbSection>
        </div>
      </div>
    </>
  );
}
