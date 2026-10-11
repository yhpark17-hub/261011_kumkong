/**
 * 전체 데이터 (서버 컴포넌트·기관 상세 패널 전용)
 * 클라이언트 달력/목록은 buildCatalog() 로 만든 경량 카탈로그를 props 로 받습니다.
 */
import { COMPANIES as CURATED_COMPANIES } from "@/data/companies";
import { DATA_UPDATED_AT, RECRUITMENTS as CURATED_RECRUITMENTS } from "@/data/recruitments";
import generatedCompanies from "@/data/generated/companies.json";
import generatedRecruitments from "@/data/generated/recruitments.json";
import logoManifest from "@/data/logos.json";
import wideLogoManifest from "@/data/logos-wide.json";
import { CATEGORY_META, CATEGORY_ORDER } from "./meta";
import { sortedEvents } from "./schedule";
import type { Catalog, Company, CompetitionStat, Recruitment } from "./types";

export { nextEvent, recruitmentPhase, sortedEvents, PHASE_TONE_CLASS } from "./schedule";
export type { PhaseTone } from "./schedule";

const LOGOS = logoManifest as Record<string, string>;
const WIDE_LOGOS = wideLogoManifest as Record<string, string>;
const curatedIds = new Set(CURATED_COMPANIES.map((c) => c.id));

/** 직접 정리한 데이터가 우선, 리서치 자동 병합 데이터(generated)는 겹치지 않는 기관만 추가 */
export const COMPANIES: Company[] = [
  ...CURATED_COMPANIES,
  ...(generatedCompanies as unknown as Company[]).filter((c) => !curatedIds.has(c.id)),
].map((c) => ({ ...c, logo: LOGOS[c.id], wideLogo: WIDE_LOGOS[c.id] }));

export const RECRUITMENTS: Recruitment[] = [
  ...CURATED_RECRUITMENTS,
  ...(generatedRecruitments as unknown as Recruitment[]).filter((r) => !curatedIds.has(r.companyId)),
];

const companyMap = new Map(COMPANIES.map((c) => [c.id, c]));

export function getCompany(id: string): Company | undefined {
  return companyMap.get(id);
}

/** 기관별 가장 최근 채용 (데이터 파일의 뒤쪽이 최신) */
const recruitmentMap = new Map<string, Recruitment>();
for (const r of RECRUITMENTS) recruitmentMap.set(r.companyId, r);
// 아직 공고 정보가 없는 기관도 상세 페이지는 보여 줍니다.
for (const c of COMPANIES) {
  if (!recruitmentMap.has(c.id)) {
    recruitmentMap.set(c.id, {
      companyId: c.id,
      title: "채용 공고 확인 중",
      period: "",
      status: "expected",
      tracks: [],
      events: [],
      essayQuestions: [],
      updatedAt: DATA_UPDATED_AT,
    });
  }
}

export function getRecruitment(companyId: string): Recruitment | undefined {
  return recruitmentMap.get(companyId);
}

/** 최근 경쟁률 — 경쟁률이 확정된 가장 최근 회차 우선 (같은 해면 데이터 파일에서 뒤쪽이 최신) */
export function latestStat(company: Company): CompetitionStat | undefined {
  const ordered = company.stats
    .map((s, i) => ({ s, i }))
    .sort((a, b) => b.s.year - a.s.year || b.i - a.i)
    .map((x) => x.s);
  return ordered.find((s) => s.ratio != null) ?? ordered.find((s) => s.applicants != null);
}

export function isAlioListed(company: Company): boolean {
  return company.alioListed ?? (company.category === "finance" || company.category === "public");
}

export function ncsLabel(c: Company): string {
  if (c.written.ncs.has === false) return "NCS 없음";
  if (c.written.ncs.has == null) return "확인 중";
  return c.written.ncs.type ?? "NCS";
}

/** 같은 날 필기를 보는 다른 기관 (중복 응시 불가 → 지원 전략에 중요) */
export function sameDayWritten(companyId: string): { date: string; companies: Company[] } | null {
  const written = getRecruitment(companyId)?.events.find((e) => e.type === "written");
  if (!written) return null;
  const companies = RECRUITMENTS.filter(
    (r) => r.companyId !== companyId && r.events.some((e) => e.type === "written" && e.date === written.date),
  )
    .map((r) => getCompany(r.companyId))
    .filter((c): c is Company => Boolean(c));
  return companies.length ? { date: written.date, companies } : null;
}

/** 글쓰기의 '관련 기관' 선택지 (구분별 가나다순) */
export function companyOptions(): { id: string; name: string; shortName: string; group: string }[] {
  return CATEGORY_ORDER.flatMap((cat) =>
    COMPANIES.filter((c) => c.category === cat)
      .map((c) => ({ id: c.id, name: c.name, shortName: c.shortName, group: CATEGORY_META[cat].label }))
      .sort((a, b) => a.name.localeCompare(b.name, "ko")),
  );
}

/** 달력·목록용 경량 카탈로그 (자소서·필기 상세 제외) */
export function buildCatalog(): Catalog {
  return {
    companies: COMPANIES.map((c) => {
      const stat = latestStat(c);
      return {
        id: c.id,
        name: c.name,
        shortName: c.shortName,
        avatar: c.avatar,
        logo: c.logo,
        category: c.category,
        hq: c.hq,
        blind: c.blind,
        majorType: c.written.major.type,
        ncsLabel: ncsLabel(c),
        ratio: stat?.ratio != null ? { value: stat.ratio, label: stat.label ?? String(stat.year) } : undefined,
      };
    }),
    recruitments: RECRUITMENTS.filter((r) => companyMap.has(r.companyId)).map((r) => ({
      companyId: r.companyId,
      title: r.title,
      status: r.status,
      events: sortedEvents(r),
    })),
  };
}
