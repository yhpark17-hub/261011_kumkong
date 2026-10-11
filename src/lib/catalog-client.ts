/** 경량 카탈로그 → 달력 이벤트 (클라이언트에서 사용, 데이터 파일 import 없음) */
import { compareByDateAndType } from "./schedule";
import type { CalendarEvent, Catalog } from "./types";

export function buildEvents(catalog: Catalog): CalendarEvent[] {
  const companyMap = new Map(catalog.companies.map((c) => [c.id, c]));
  return catalog.recruitments
    .flatMap((r) => {
      const company = companyMap.get(r.companyId);
      if (!company) return [];
      return r.events.map((e, i) => ({ ...e, id: `${r.companyId}-${e.type}-${i}`, company, recruitment: r }));
    })
    .sort(compareByDateAndType);
}
