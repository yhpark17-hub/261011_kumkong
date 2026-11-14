/**
 * 금콩 주간 정리 — 데일리 브리핑 옆의 주 1회 콘텐츠 (영상 + 글).
 * 글(articles, category 'weekly')의 본문 첫 줄 {{weekly:2026-11-2}} 이 내용 파일(src/data/weekly/<키>.ts)을 가리켜요.
 * 둘째 줄 {{youtube:주소}} 가 있으면 영상이 붙고, 장마다 같은 장면으로 가는 링크가 생겨요.
 * 숫자는 출처 기사에 있는 것만 — 출처는 장마다 sources 로.
 */

/** 본문 덩어리 — **굵게** 는 강조로 그려요 */
export type WeeklyBlock =
  | { t: "p"; text: string }
  /** 짧은 말 풀이 (용어 세 개 등) */
  | { t: "terms"; items: { term: string; text: string }[] }
  /** 번호 단계 (연결고리) */
  | { t: "steps"; items: string[] }
  | { t: "table"; head: string[]; rows: string[][]; note?: string }
  /** 두 쪽 견주기 (걱정하는 쪽 / 지나치다고 보는 쪽) */
  | { t: "versus"; left: { title: string; items: string[] }; right: { title: string; items: string[] } }
  /** 큰 숫자 */
  | { t: "stats"; items: { value: string; label: string }[] }
  /** 항목별 정리 (무슨 일 / 시장 반응 / 쉽게 말하면 …) */
  | { t: "facts"; items: { label: string; text: string }[] }
  /** 한 줄 상자 — tone: easy(쉽게 말하면) · warn(조심할 점) · key(핵심) */
  | { t: "note"; tone: "easy" | "warn" | "key"; title?: string; text: string };

export interface WeeklySource {
  name: string;
  url?: string;
}

export interface WeeklySection {
  /** 쪽 안 주소 (#id) */
  id: string;
  /** 예: 메인 1 · 금융 1 · 시사 1 */
  kicker: string;
  title: string;
  /** 영상에서 이 부분이 시작하는 초 (유튜브 챕터와 같은 값) */
  at?: number;
  /** 그림 (public 경로) */
  art?: string;
  artAlt?: string;
  blocks: WeeklyBlock[];
  sources?: WeeklySource[];
}

export interface WeeklyEdition {
  key: string;
  /** 2026년 11월 2주차 */
  week: string;
  /** 11월 9일(월) ~ 13일(금) */
  range: string;
  /** 숫자 기준 시점 */
  asOf: string;
  /** 영상 길이 (예: 12:10) */
  videoLength: string;
  /** 영상이 아직 없을 때 보여 줄 썸네일 */
  poster: string;
  /** 유튜브 챕터 — 초·제목·이 글의 장 id */
  chapters: { at: number; title: string; id: string }[];
  /** 이번 주 한눈에 — 구분(메인·금융·시사)·뉴스·한 줄 */
  glance: { kind: "메인" | "금융" | "시사"; title: string; line: string; id: string }[];
  /** 메인 질문과 한 문장 답 */
  question: string;
  answer: string;
  main: WeeklySection[];
  finance: WeeklySection[];
  current: WeeklySection[];
  /** 다음 주 볼 날짜 */
  next: { when: string; what: string; why: string }[];
  nextSources?: WeeklySource[];
  /** 금공 준비생용 — 논술·면접 질문 (답할 재료) */
  essays: { q: string; points: string[] }[];
  /** 이번 주 상식 체크 */
  quiz: { q: string; a: string }[];
  /** 끝의 주의 문구 */
  notes: string[];
}

const WEEKLY_LINE = /^\s*\{\{\s*weekly:\s*([0-9]{4}-[0-9]{2}-[1-5])\s*\}\}\s*$/;

/** 본문 첫 줄이 {{weekly:키}} 면 그 키 */
export function articleWeeklyIn(body: string): string | null {
  const first = body.split(/\r?\n/).find((l) => l.trim());
  return first?.match(WEEKLY_LINE)?.[1] ?? null;
}

export const mmss = (t: number) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;
export const youtubeAt = (id: string, t = 0) => `https://www.youtube.com/watch?v=${id}${t > 0 ? `&t=${Math.floor(t)}s` : ""}`;
