import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { HomeDashboard } from "@/components/calendar/HomeDashboard";
import { DbSection } from "@/components/db/DbSection";
import { CommunityStrip, CommunityStripSkeleton, RecentExamsPanel, RecentExamsPanelSkeleton } from "@/components/home/CommunityStrip";
import { MagazineStrip, MagazineStripSkeleton } from "@/components/home/MagazineStrip";
import { NewPostingsTicker, NewPostingsTickerSkeleton } from "@/components/home/NewPostingsTicker";
import { CompanyAvatar, Eyebrow } from "@/components/ui";
import { COMPANIES, buildCatalog, getRecruitment, sortedEvents } from "@/lib/data";
import { formatRange } from "@/lib/date";
import { CATEGORY_META, CATEGORY_ORDER, EVENT_META } from "@/lib/meta";
import { SITE, pageOpenGraph } from "@/lib/site";

// 제목·설명은 사이트 기본값(layout) 그대로, 대표 주소와 공유 주소만 홈으로
export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: pageOpenGraph("/", { title: SITE.title, description: SITE.description }),
};

export default function Home() {
  return (
    <>
      <Suspense fallback={<NewPostingsTickerSkeleton />}>
        <NewPostingsTicker />
      </Suspense>

      {/* 히어로 — 그라디언트 메시 위 */}
      <div className="mx-auto max-w-[1200px] px-4 pt-8 pb-8 md:px-6 md:pt-12">
        <Eyebrow>2026 하반기 금융권 채용</Eyebrow>
        <h1 className="mt-3 type-display-md text-ink md:type-display-lg lg:type-display-xl">
          금융공기업·공공기관 채용 캘린더
        </h1>
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

      <section aria-label="오늘의 브리핑과 매거진" className="mx-auto max-w-[1200px] px-4 pb-12 md:px-6">
        <DbSection silent>
          <Suspense fallback={<MagazineStripSkeleton />}>
            <MagazineStrip />
          </Suspense>
        </DbSection>
      </section>

      <section aria-label="콩밭 새 글" className="mx-auto max-w-[1200px] px-4 pb-16 md:px-6">
        <DbSection>
          <Suspense fallback={<CommunityStripSkeleton />}>
            <CommunityStrip />
          </Suspense>
        </DbSection>
      </section>

      <ScheduleIndex />
    </>
  );
}

/** 검색엔진이 읽을 수 있는 기관별 일정 요약 (정적 렌더링) — canvas-soft 밴드 */
function ScheduleIndex() {
  return (
    <section aria-labelledby="index-title" className="border-t border-hairline bg-canvas-soft py-16">
      <div className="mx-auto max-w-[1200px] px-4 md:px-6">
        <Eyebrow>기관별 일정</Eyebrow>
        <h2 id="index-title" className="mt-3 type-display-md text-ink md:type-display-lg">
          기관별 채용 일정 한눈에 보기
        </h2>
        <p className="mt-3 type-body-lg text-ink-secondary">
          기관명을 누르면 필기 과목, 전공 유무, 경쟁률, 자소서 항목을 자세히 볼 수 있어요.
        </p>
        <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {CATEGORY_ORDER.map((cat) => {
            const list = COMPANIES.filter((c) => c.category === cat);
            if (!list.length) return null;
            return (
              <div key={cat}>
                <h3 className="mb-3 type-heading-sm text-ink">{CATEGORY_META[cat].label}</h3>
                <ul className="card divide-y divide-hairline">
                  {list.map((c) => {
                    const r = getRecruitment(c.id);
                    const key = r ? sortedEvents(r).filter((e) => e.type === "doc" || e.type === "written") : [];
                    return (
                      <li key={c.id}>
                        <Link href={`/companies/${c.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-canvas-soft">
                          <CompanyAvatar company={c} size="sm" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate type-body-md text-ink">{c.name}</p>
                            <p className="truncate type-caption text-ink-mute">
                              {key.length
                                ? key
                                    .map((e) => `${EVENT_META[e.type].label} ${formatRange(e.date, e.endDate)}`)
                                    .join(" · ")
                                : (r?.title ?? "공고 대기")}
                              {r?.status === "expected" && r.events.length > 0 && " (예상)"}
                            </p>
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
