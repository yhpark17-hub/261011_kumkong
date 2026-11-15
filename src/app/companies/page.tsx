import type { Metadata } from "next";
import Image from "next/image";
import { AdSlot } from "@/components/ads/AdSlot";
import { CompanyTable } from "@/components/company/CompanyTable";
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
    <div className="mx-auto max-w-[1200px] px-4 pt-4 pb-12 md:px-6 md:pt-6">
      <header className="flex items-center gap-6 rounded-[28px] bg-sky p-5 md:rounded-[32px] md:px-10 md:py-8">
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-[28px] leading-tight text-ink md:text-[40px]">기관 정보·경쟁률</h1>
          <p className="mt-1.5 type-body-md text-ink-secondary [word-break:keep-all] md:text-[16px]">
            블라인드 여부, 필기 유형, 전공 시험, 최근 경쟁률을 한눈에 비교하고 지원 전략을 세워 보세요.
          </p>
        </div>
        <Image src="/illust/tile-company.webp" alt="파스텔색 건물들 그림" width={140} height={140} priority className="hidden h-[112px] w-[112px] shrink-0 rounded-3xl object-cover sm:block md:h-[140px] md:w-[140px]" />
      </header>
      <AdSlot slot={AD_SLOTS.homeTop} variant="leaderboard" className="mt-8" />
      <div className="mt-6 md:mt-8">
        <CompanyTable catalog={buildCatalog()} />
      </div>
      <p className="mt-4 type-caption text-ink-mute">
        ※ 경쟁률은 알리오(ALIO) 신규채용 공시 또는 언론 보도 기준이며, 기관별 산정 방식(전체/일반 신입 기준)이
        다를 수 있습니다.
      </p>
    </div>
  );
}
