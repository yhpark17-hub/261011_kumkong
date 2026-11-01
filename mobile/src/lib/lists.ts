/**
 * 홈 화면 목록 계산 — 사이트 UrgentStrip·newPostings와 같은 규칙.
 * 사이트에서 규칙을 바꾸면 여기도 맞춘다.
 */
import { addDays, diffDays } from '@/shared/date';
import { nextEvent } from '@/shared/schedule';
import type { CalendarEvent, CatalogCompany, CatalogRecruitment, ScheduleEvent } from '@/shared/types';

const URGENT_WINDOW_DAYS = 14;
const URGENT_MAX = 16;
/** 접수 시작은 '마감'이 아니므로 임박 목록에서 제외 */
const URGENT_TYPES = new Set(['doc', 'written', 'interview1', 'interview2', 'final']);

export function urgentEvents(events: CalendarEvent[], today: string) {
  const until = addDays(today, URGENT_WINDOW_DAYS);
  const week = addDays(today, 7);
  const list = events.filter((e) => URGENT_TYPES.has(e.type) && (e.endDate ?? e.date) >= today && e.date <= until);
  return {
    windowDays: URGENT_WINDOW_DAYS,
    list: list.slice(0, URGENT_MAX),
    counts: {
      today: list.filter((e) => e.date === today || (e.endDate && e.date <= today && today <= e.endDate)).length,
      doc: list.filter((e) => e.type === 'doc' && e.date <= week).length,
      written: list.filter((e) => e.type === 'written' && e.date <= week).length,
    },
  };
}

export type NewPosting = {
  company: CatalogCompany;
  title: string;
  postedOn: string;
  docDate: string | null;
  docTime: string | null;
  fresh: boolean;
};

/** 최근 공고 (확정 공고만, 접수 시작 21일 이내, 서류 마감이 지난 지 오래된 건 제외) */
export function newPostings(
  recruitments: CatalogRecruitment[],
  company: (id: string) => CatalogCompany | undefined,
  today: string,
  days = 21,
): NewPosting[] {
  const out: NewPosting[] = [];
  for (const r of recruitments) {
    if (r.status !== 'confirmed') continue;
    const posting = r.events
      .filter((e) => e.type === 'posting' && e.date <= today)
      .map((e) => e.date)
      .sort()
      .at(-1);
    if (!posting) continue;
    const age = diffDays(posting, today);
    if (age > days) continue;
    const doc = r.events
      .filter((e) => e.type === 'doc' && (e.endDate ?? e.date) >= posting)
      .sort((a, b) => (a.date < b.date ? -1 : 1))[0];
    const docDate = doc ? (doc.endDate ?? doc.date) : null;
    if (docDate && docDate < today && age > 3) continue;
    const c = company(r.companyId);
    if (!c) continue;
    out.push({ company: c, title: r.title, postedOn: posting, docDate, docTime: doc?.time ?? null, fresh: age <= 2 });
  }
  return out.sort((a, b) =>
    a.postedOn === b.postedOn ? a.company.name.localeCompare(b.company.name, 'ko') : a.postedOn < b.postedOn ? 1 : -1,
  );
}

export type FavoriteNext = {
  company: CatalogCompany;
  recruitment: CatalogRecruitment | undefined;
  next: ScheduleEvent | undefined;
};

/** 관심 기관마다 다음 일정 — 다가오는 순, 일정 없는 기관은 뒤로 */
export function favoritesNext(
  ids: Iterable<string>,
  company: (id: string) => CatalogCompany | undefined,
  recruitment: (id: string) => CatalogRecruitment | undefined,
  today: string,
): FavoriteNext[] {
  const rows: FavoriteNext[] = [];
  for (const id of ids) {
    const c = company(id);
    if (!c) continue;
    const r = recruitment(id);
    rows.push({ company: c, recruitment: r, next: r ? nextEvent(r, today) : undefined });
  }
  return rows.sort((a, b) => {
    if (!a.next || !b.next) return a.next ? -1 : b.next ? 1 : a.company.name.localeCompare(b.company.name, 'ko');
    return a.next.date < b.next.date ? -1 : a.next.date > b.next.date ? 1 : 0;
  });
}
