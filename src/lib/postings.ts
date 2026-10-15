import { RECRUITMENTS, getCompany } from "./data";
import { addDays, diffDays } from "./date";
import { EVENT_META } from "./meta";
import type { EventType } from "./types";

/** 홈 상단 '신규 공고' 띠에 올릴 항목 — 사이트 일정 데이터의 '공고·접수 시작' 일정에서만 뽑습니다 */
export interface NewPosting {
  companyId: string;
  name: string;
  title: string;
  /** 공고(접수 시작)일 */
  postedOn: string;
  /** 서류 마감일 (없으면 null) */
  docDate: string | null;
  docTime: string | null;
  /** 이틀 안에 뜬 공고 */
  fresh: boolean;
}

/**
 * 최근 days일 안에 뜬 확정 공고. 서류 마감이 지난 공고는 사흘 넘었으면 뺍니다.
 * 최신 공고가 앞에 옵니다.
 */
export function newPostings(today: string, days = 21): NewPosting[] {
  const out: NewPosting[] = [];
  for (const r of RECRUITMENTS) {
    if (r.status !== "confirmed") continue;
    const posting = r.events
      .filter((e) => e.type === "posting" && e.date <= today)
      .map((e) => e.date)
      .sort()
      .at(-1);
    if (!posting) continue;
    const age = diffDays(posting, today);
    if (age > days) continue;
    const doc = r.events
      .filter((e) => e.type === "doc" && (e.endDate ?? e.date) >= posting)
      .sort((a, b) => (a.date < b.date ? -1 : 1))[0];
    const docDate = doc ? (doc.endDate ?? doc.date) : null;
    if (docDate && docDate < today && age > 3) continue;
    const company = getCompany(r.companyId);
    if (!company) continue;
    out.push({
      companyId: r.companyId,
      name: company.name,
      title: r.title,
      postedOn: posting,
      docDate,
      docTime: doc?.time ?? null,
      fresh: age <= 2,
    });
  }
  return out.sort((a, b) => (a.postedOn === b.postedOn ? (a.name < b.name ? -1 : 1) : a.postedOn < b.postedOn ? 1 : -1));
}

/** 브리핑 '오늘의 채용 일정'·자동 점검 inbox 에 쓰는 가까운 일정 — 사이트 일정 데이터 그대로 */
export interface UpcomingEvent {
  companyId: string;
  name: string;
  type: EventType;
  stage: string;
  date: string;
  endDate?: string;
  time?: string;
  expected: boolean;
}

/** 오늘부터 days일 안에 걸친 일정 (날짜·시각 순) */
export function upcomingEvents(today: string, days = 3): UpcomingEvent[] {
  const until = addDays(today, days);
  return RECRUITMENTS.flatMap((r) =>
    r.events
      .filter((e) => (e.endDate ?? e.date) >= today && e.date <= until)
      .map((e) => ({
        companyId: r.companyId,
        name: getCompany(r.companyId)?.name ?? r.companyId,
        type: e.type,
        stage: e.label ?? EVENT_META[e.type]?.label ?? e.type,
        date: e.date,
        ...(e.endDate ? { endDate: e.endDate } : {}),
        ...(e.time ? { time: e.time } : {}),
        expected: r.status === "expected",
      })),
  ).sort((a, b) => (a.date === b.date ? ((a.time ?? "") < (b.time ?? "") ? -1 : 1) : a.date < b.date ? -1 : 1));
}
