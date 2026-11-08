import { RECRUITMENTS, getCompany } from "./data";
import { addDays } from "./date";
import { EVENT_META } from "./meta";
import type { Category, EventType } from "./types";

/**
 * 점심 3문제 '이번 주 금공 체크' — 사이트 채용 일정 데이터(공고문으로 확인한 일정만)에서 그날부터 7일을 뽑아요.
 * 지어낸 일정은 없어요: 없으면 없다고 보여 줘요.
 */
export interface RadarItem {
  companyId: string;
  name: string;
  short: string;
  logo?: string;
  avatar?: string;
  category: Category;
  type: EventType;
  /** 전형 이름 (예: 1차 면접, 필기 · 온라인 코딩테스트) */
  stage: string;
  /** 서류 마감은 마감일, 새 공고는 접수 시작일, 나머지는 시작일 */
  date: string;
  endDate?: string;
  time?: string;
}

export interface WeekRadar {
  /** 그날 (호 날짜) */
  from: string;
  /** 그날부터 7일째 */
  to: string;
  /** 서류 마감 — from~to 사이에 마감 */
  deadlines: RadarItem[];
  /** 새 공고 — 최근 7일(from-6 ~ from) 안에 접수 시작 */
  postings: RadarItem[];
  /** 필기·면접·발표 — from~to 에 걸친 일정 */
  stages: RadarItem[];
}

/** 금공 준비생에게 가까운 기관부터 */
const PRIORITY: Record<Category, number> = { finance: 0, fininfra: 1, insurance: 2, mutual: 3, assoc: 4, bank: 5, capital: 6, public: 7 };
/** 같은 날이면 서류 마감 → 필기 → 면접 → 발표 → 접수 순 */
const order = (a: RadarItem, b: RadarItem) =>
  PRIORITY[a.category] - PRIORITY[b.category] || (a.date < b.date ? -1 : a.date > b.date ? 1 : 0) || EVENT_META[a.type].order - EVENT_META[b.type].order || (a.name < b.name ? -1 : 1);

export function weekRadar(date: string): WeekRadar {
  const to = addDays(date, 6);
  const since = addDays(date, -6);
  const deadlines: RadarItem[] = [];
  const postings: RadarItem[] = [];
  const stages: RadarItem[] = [];
  for (const r of RECRUITMENTS) {
    if (r.status !== "confirmed") continue;
    const c = getCompany(r.companyId);
    if (!c) continue;
    for (const e of r.events) {
      const end = e.endDate ?? e.date;
      const item: RadarItem = {
        companyId: c.id,
        name: c.name,
        short: c.shortName,
        logo: c.logo,
        avatar: c.avatar,
        category: c.category,
        type: e.type,
        stage: e.label ?? EVENT_META[e.type].label,
        date: e.date,
        ...(e.endDate && e.endDate !== e.date ? { endDate: e.endDate } : {}),
        ...(e.time ? { time: e.time } : {}),
      };
      if (e.type === "doc") {
        if (end >= date && end <= to) deadlines.push({ ...item, date: end, endDate: undefined });
      } else if (e.type === "posting") {
        if (e.date >= since && e.date <= date) postings.push(item);
      } else if (end >= date && e.date <= to) stages.push(item);
    }
  }
  return { from: date, to, deadlines: deadlines.sort(order), postings: postings.sort(order), stages: stages.sort(order) };
}
