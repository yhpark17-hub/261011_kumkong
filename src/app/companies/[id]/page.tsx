import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import {
  ArrowLeft,
  BarChart3,
  BookOpen,
  CalendarClock,
  ExternalLink,
  FileText,
  Globe,
  Layers,
  MapPin,
  MessageSquareWarning,
} from "lucide-react";
import { FeedbackButton } from "@/components/feedback/Feedback";
import { AdSlot } from "@/components/ads/AdSlot";
import { FavoriteButton } from "@/components/client-ui";
import { CompanyCommunity, CompanyCommunitySkeleton } from "@/components/company/CompanyCommunity";
import { DbSection } from "@/components/db/DbSection";
import { RecruitTimeline } from "@/components/company/RecruitTimeline";
import {
  EssayList,
  ExamDetail,
  QuickFacts,
  SectionTitle,
  SourceNote,
  StatsTable,
  TracksDetail,
} from "@/components/company/sections";
import { BlindBadge, Card, CategoryBadge, CompanyAvatar } from "@/components/ui";
import { COMPANIES, getCompany, getRecruitment, latestStat } from "@/lib/data";
import { formatLong } from "@/lib/date";
import { CATEGORY_META, MAJOR_META } from "@/lib/meta";
import { AD_SLOTS, SITE } from "@/lib/site";

export function generateStaticParams() {
  return COMPANIES.map((c) => ({ id: c.id }));
}

export async function generateMetadata({ params }: PageProps<"/companies/[id]">): Promise<Metadata> {
  const { id } = await params;
  const company = getCompany(id);
  if (!company) return {};
  const r = getRecruitment(id);
  const stat = latestStat(company);
  const title = `${company.name} 채용 일정·필기·자소서 항목`;
  const description = [
    r ? `${r.title}${r.status === "expected" ? "(예상)" : ""} 서류 마감·필기·면접 일정` : null,
    `필기: ${company.written.ncs.type ?? (company.written.ncs.has === false ? "NCS 없음" : "NCS")}, ${MAJOR_META[company.written.major.type].label}`,
    stat?.ratio ? `${stat.label ?? stat.year} 경쟁률 ${stat.ratio}:1` : null,
    "자기소개서 항목까지 한 번에 확인하세요.",
  ]
    .filter(Boolean)
    .join(" · ");
  return {
    title,
    description,
    alternates: { canonical: `/companies/${id}` },
    openGraph: { title: `${title} | ${SITE.name}`, description },
  };
}

export default function CompanyPage({ params }: PageProps<"/companies/[id]">) {
  // 모든 기관 페이지는 빌드 시 정적 생성되고, 클라이언트 이동 시에는 스켈레톤이 즉시 보입니다.
  return (
    <Suspense fallback={<CompanySkeleton />}>
      {params.then(({ id }) => (
        <CompanyContent id={id} />
      ))}
    </Suspense>
  );
}

function CompanySkeleton() {
  return (
    <div className="mx-auto max-w-[1200px] animate-pulse px-4 pt-8 pb-12 md:px-6 md:pt-12">
      <div className="h-4 w-20 rounded-xs bg-canvas-soft" />
      <div className="mt-8 flex items-center gap-4">
        <div className="h-16 w-16 rounded-lg bg-canvas-soft" />
        <div className="h-10 w-64 rounded-md bg-canvas-soft" />
      </div>
      <div className="mt-12 h-96 rounded-lg bg-canvas-soft" />
    </div>
  );
}

function CompanyContent({ id }: { id: string }) {
  const company = getCompany(id);
  const recruitment = getRecruitment(id);
  if (!company || !recruitment) notFound();

  const related = COMPANIES.filter((c) => c.category === company.category && c.id !== company.id).slice(0, 6);
  const postingHref = recruitment.postingUrl ?? company.recruitUrl;

  return (
    <div className="mx-auto max-w-[1200px] px-4 pt-8 pb-12 md:px-6 md:pt-12">
      <Link href="/companies" className="link inline-flex items-center gap-1 type-caption">
        <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
        기관 목록
      </Link>

      {/* 히어로 */}
      <header className="mt-6 flex flex-col gap-6 md:flex-row md:items-start">
        {company.wideLogo && !company.logo ? (
          <span className="inline-flex h-16 items-center self-start rounded-lg border border-hairline bg-[#ffffff] px-4">
            <Image
              src={company.wideLogo}
              alt={`${company.name} 로고`}
              width={240}
              height={60}
              className="h-9 w-auto max-w-[220px] object-contain"
            />
          </span>
        ) : (
          <CompanyAvatar company={company} size="lg" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <CategoryBadge category={company.category} />
            {company.blind !== "unknown" && <BlindBadge blind={company.blind} />}
            {company.tags?.map((t) => (
              <span key={t} className="tag tag-soft">
                {t}
              </span>
            ))}
          </div>
          <h1 className="mt-3 type-display-md text-ink md:type-display-lg lg:type-display-xl">{company.name}</h1>
          <p className="mt-3 max-w-2xl type-body-lg text-ink-secondary">{company.description}</p>
          <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 type-caption text-ink-mute">
            {company.hq && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" strokeWidth={1.75} />
                본사 {company.hq}
              </span>
            )}
            {company.homepage && (
              <a
                href={company.homepage}
                target="_blank"
                rel="noopener noreferrer"
                className="link inline-flex items-center gap-1"
              >
                <Globe className="h-3.5 w-3.5" strokeWidth={1.75} />
                공식 홈페이지
              </a>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 md:self-end">
          <FavoriteButton companyId={company.id} companyName={company.name} withLabel />
          {postingHref && (
            <a href={postingHref} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm">
              채용 공고 보기
              <ExternalLink className="h-4 w-4" strokeWidth={1.75} />
            </a>
          )}
        </div>
      </header>

      <div className="mt-12 grid gap-8 lg:grid-cols-[minmax(0,1fr)_304px]">
        <div className="min-w-0 space-y-6">
          <Card className="p-6 md:p-8">
            <SectionTitle
              icon={CalendarClock}
              aside={
                !recruitment.events.length ? null : recruitment.status === "expected" ? (
                  <span className="tag bg-canvas-cream text-lemon">예상 일정</span>
                ) : (
                  <span className="tag bg-ev-final-soft text-ev-final">공고 확인</span>
                )
              }
            >
              {recruitment.title}
            </SectionTitle>
            {recruitment.status === "expected" && recruitment.events.length > 0 && (
              <p className="mb-4 type-caption text-ink-mute">
                올해 공고 전이라 전년도 일정을 기준으로 추정했습니다. 공고가 나오면 업데이트됩니다.
              </p>
            )}
            <RecruitTimeline recruitment={recruitment} />
            {recruitment.note && <p className="mt-4 type-caption text-ink-mute">※ {recruitment.note}</p>}
            <SourceNote recruitment={recruitment} />
          </Card>

          <Card className="p-6 md:p-8">
            <SectionTitle icon={Layers}>전형 요약</SectionTitle>
            <QuickFacts company={company} className="md:grid-cols-4" />
          </Card>

          <AdSlot slot={AD_SLOTS.inArticle} variant="inarticle" />

          <Card className="p-6 md:p-8">
            <SectionTitle icon={BookOpen}>필기시험 구성</SectionTitle>
            <ExamDetail company={company} />
          </Card>

          <div id="community" className="scroll-mt-24">
            <DbSection silent>
              <Suspense fallback={<CompanyCommunitySkeleton />}>
                <CompanyCommunity companyId={company.id} companyName={company.name} />
              </Suspense>
            </DbSection>
          </div>

          <Card className="p-6 md:p-8">
            <SectionTitle icon={Layers}>모집 직렬·인원</SectionTitle>
            <TracksDetail recruitment={recruitment} />
          </Card>

          <Card className="p-6 md:p-8">
            <SectionTitle icon={FileText}>자기소개서 항목</SectionTitle>
            <EssayList recruitment={recruitment} />
          </Card>

          <Card className="p-6 md:p-8">
            <SectionTitle icon={BarChart3}>신규채용 경쟁률</SectionTitle>
            <StatsTable company={company} />
            <p className="mt-4 type-caption text-ink-mute">
              ※ 알리오(ALIO) 공시는 정규직 신규채용 전체(일반·고졸·경력 등 포함) 기준인 경우가 많아 공채 실제
              경쟁률과 차이가 있을 수 있습니다.
            </p>
          </Card>

          <AdSlot slot={AD_SLOTS.inArticle} variant="inarticle" />

          <p className="type-caption text-ink-mute">
            최종 확인 {formatLong(recruitment.updatedAt)}. 본 정보는 참고용이며, 지원 전 반드시 {company.name} 공식
            채용 공고를 확인하세요. 정보가 다르다면{" "}
            <FeedbackButton kind="correction" companyId={company.id} companyName={company.name} className="link">
              여기에서 제보
            </FeedbackButton>
            해 주세요.
          </p>
        </div>

        <aside className="space-y-4">
          <Card className="p-6">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-ev-doc-soft text-ev-doc">
              <MessageSquareWarning className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <h2 className="mt-4 type-heading-sm text-ink">공고와 다른 점이 있나요?</h2>
            <p className="mt-2 type-body-md text-ink-secondary">
              일정·필기·경쟁률·자소서 항목이 다르면 알려 주세요. 확인 후 바로 고칠게요.
            </p>
            <FeedbackButton
              kind="correction"
              companyId={company.id}
              companyName={company.name}
              className="btn btn-secondary btn-sm mt-4"
            >
              {company.shortName} 정보 제보하기
            </FeedbackButton>
          </Card>
          <AdSlot slot={AD_SLOTS.sidebar} variant="rectangle" />
          {related.length > 0 && (
            <Card className="p-6">
              <h2 className="mb-3 type-heading-sm text-ink">다른 {CATEGORY_META[company.category].label}</h2>
              <ul className="-mx-2">
                {related.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/companies/${c.id}`}
                      className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-canvas-soft"
                    >
                      <CompanyAvatar company={c} size="sm" />
                      <span className="truncate type-body-md text-ink">{c.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          )}
          <div className="lg:sticky lg:top-24">
            <AdSlot slot={AD_SLOTS.sidebarSticky} variant="skyscraper" className="hidden lg:block" />
          </div>
        </aside>
      </div>
    </div>
  );
}
