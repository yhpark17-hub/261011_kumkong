/**
 * 일정 계산용 순수 함수 — 데이터 파일을 import 하지 않으므로 클라이언트 번들에 안전합니다.
 */
import { EVENT_META, EVENT_SEQUENCE } from "./meta";
import type { ScheduleEvent } from "./types";

type HasEvents = { events: ScheduleEvent[] };

export function sortedEvents(r: HasEvents): ScheduleEvent[] {
  return [...r.events].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? -1 : 1;
    return EVENT_SEQUENCE.indexOf(a.type) - EVENT_SEQUENCE.indexOf(b.type);
  });
}

/** 오늘 이후(오늘 포함) 첫 번째 일정 */
export function nextEvent(r: HasEvents, today: string): ScheduleEvent | undefined {
  return sortedEvents(r).find((e) => (e.endDate ?? e.date) >= today);
}

export type PhaseTone = "open" | "soon" | "progress" | "done";

export function recruitmentPhase(r: HasEvents, today: string): { label: string; tone: PhaseTone } {
  if (!r.events.length) return { label: "공고 대기", tone: "done" };
  const next = nextEvent(r, today);
  if (!next) return { label: "전형 종료", tone: "done" };
  const posting = r.events.find((e) => e.type === "posting");
  switch (next.type) {
    case "posting":
      return { label: "접수 예정", tone: "soon" };
    case "doc":
      if (!posting || posting.date <= today) return { label: "서류 접수중", tone: "open" };
      return { label: "접수 예정", tone: "soon" };
    case "written":
      return { label: "필기 전형", tone: "progress" };
    case "interview1":
    case "interview2":
      return { label: "면접 전형", tone: "progress" };
    case "final":
      return { label: "발표 대기", tone: "progress" };
  }
}

/** 진행 상태 태그 (pill-tag 형태와 함께 사용) */
export const PHASE_TONE_CLASS: Record<PhaseTone, string> = {
  open: "bg-ruby text-on-primary",
  soon: "tag-soft",
  progress: "bg-ev-written-soft text-ev-written",
  done: "bg-canvas-soft text-ink-mute",
};

/** 일정 표시 라벨 (회차 라벨이 있으면 우선) */
export function eventLabel(e: Pick<ScheduleEvent, "type" | "label">): string {
  return e.label ?? EVENT_META[e.type].label;
}

export function compareByDateAndType<T extends ScheduleEvent & { company: { name: string } }>(a: T, b: T): number {
  if (a.date !== b.date) return a.date < b.date ? -1 : 1;
  const o = EVENT_META[a.type].order - EVENT_META[b.type].order;
  if (o !== 0) return o;
  return a.company.name.localeCompare(b.company.name, "ko");
}
