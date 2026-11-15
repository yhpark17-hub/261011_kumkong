import type { Metadata } from "next";
import { AdSlot } from "@/components/ads/AdSlot";
import { CompanyTable } from "@/components/company/CompanyTable";
import { PageHeader } from "@/components/layout/PageHeader";
import { buildCatalog } from "@/lib/data";
import { AD_SLOTS, pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "기관 정보·경쟁률 비교",
  description:
    "금융공기업·공공기관·공제회·중앙회·시중은행의 블라인드 여부, 필기 유형(NCS·PSAT형), 전공 시험, 알리오 경쟁률을 한 표로 비교하세요.",
  path: "/companies",
});

export default function CompaniesPage() {
  return (
    <>
      <PageHeader title="기관 정보·경쟁률" desc="블라인드 여부, 필기 유형, 전공 시험, 최근 경쟁률을 한눈에 비교해요." />
      <div className="mx-auto max-w-[1200px] px-4 pt-5 pb-12 md:px-6 md:pt-7">
        <AdSlot slot={AD_SLOTS.homeTop} variant="leaderboard" className="mb-6" />
        <CompanyTable catalog={buildCatalog()} />
        <p className="mt-4 type-caption text-ink-mute">
          ※ 경쟁률은 알리오(ALIO) 신규채용 공시 또는 언론 보도 기준이며, 기관별 산정 방식(전체/일반 신입 기준)이
          다를 수 있습니다.
        </p>
      </div>
    </>
  );
}
