import type { Metadata } from "next";
import { AdSlot } from "@/components/ads/AdSlot";
import { CompanyTable } from "@/components/company/CompanyTable";
import { Eyebrow } from "@/components/ui";
import { buildCatalog } from "@/lib/data";
import { AD_SLOTS } from "@/lib/site";

export const metadata: Metadata = {
  title: "기관 정보·경쟁률 비교",
  description:
    "금융공기업·공공기관·공제회·중앙회·시중은행의 블라인드 여부, 필기 유형(NCS·PSAT형), 전공 시험, 알리오 경쟁률을 한 표로 비교하세요.",
  alternates: { canonical: "/companies" },
};

export default function CompaniesPage() {
  return (
    <div className="mx-auto max-w-[1200px] px-4 pt-8 pb-12 md:px-6 md:pt-12">
      <Eyebrow>기관 비교</Eyebrow>
      <h1 className="mt-3 type-display-md text-ink md:type-display-lg lg:type-display-xl">기관 정보·경쟁률 비교</h1>
      <p className="mt-4 max-w-2xl type-body-lg text-ink-secondary">
        블라인드 여부, 필기 유형, 전공 시험, 최근 경쟁률을 한눈에 비교하고 지원 전략을 세워 보세요.
      </p>
      <AdSlot slot={AD_SLOTS.homeTop} variant="leaderboard" className="mt-8" />
      <div className="mt-8 md:mt-10">
        <CompanyTable catalog={buildCatalog()} />
      </div>
      <p className="mt-4 type-caption text-ink-mute">
        ※ 경쟁률은 알리오(ALIO) 신규채용 공시 또는 언론 보도 기준이며, 기관별 산정 방식(전체/일반 신입 기준)이
        다를 수 있습니다.
      </p>
    </div>
  );
}
