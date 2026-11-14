/** 경량 카탈로그 → 달력 이벤트 (클라이언트에서 사용, 데이터 파일 import 없음) */
import { EVENT_META } from "./meta";
import { compareByDateAndType } from "./schedule";
import type { CalendarEvent, Catalog } from "./types";

export function buildEvents(catalog: Catalog): CalendarEvent[] {
  const companyMap = new Map(catalog.companies.map((c) => [c.id, c]));
  return catalog.recruitments
    .flatMap((r, ri) => {
      const company = companyMap.get(r.companyId);
      if (!company) return [];
      // 같은 기관의 신입 공고와 체험형 인턴 공고가 함께 있을 수 있어 id 에 구분을 넣어요
      // 체험형 인턴은 전형 이름 앞에 '인턴' (목록·일간·임박 띠·홈 '이번 주'에서 바로 구분되게)
      return r.events.map((e, i) => ({
        ...e,
        ...(r.kind === "intern" ? { label: `인턴 ${e.label ?? EVENT_META[e.type].label}` } : {}),
        id: `${r.companyId}${r.kind ? `-${r.kind}${ri}` : ""}-${e.type}-${i}`,
        company,
        recruitment: r,
      }));
    })
    .sort(compareByDateAndType);
}
