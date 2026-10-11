/**
 * 날짜 유틸리티
 * 모든 일정은 'YYYY-MM-DD' 문자열 키(한국 시간 기준)로 다룹니다.
 * 내부 계산은 UTC 자정 기준으로 해서 사용자 PC의 시간대와 무관하게 동작합니다.
 */

export const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"] as const;

const DAY_MS = 86_400_000;

const kstFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** 현재 한국 날짜 키. 브라우저, 또는 서버에서는 connection() 이후에만 호출하세요 (프리렌더 시 시각이 고정됨). */
export function todayKST(): string {
  return kstFormatter.format(new Date());
}

export function toKey(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export function parseKey(key: string): { y: number; m: number; d: number } {
  const [y, m, d] = key.split("-").map(Number);
  return { y, m, d };
}

function keyToUTC(key: string): number {
  const { y, m, d } = parseKey(key);
  return Date.UTC(y, m - 1, d);
}

function utcToKey(ms: number): string {
  const dt = new Date(ms);
  return toKey(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate());
}

export function addDays(key: string, n: number): string {
  return utcToKey(keyToUTC(key) + n * DAY_MS);
}

/** b - a (일 단위) */
export function diffDays(a: string, b: string): number {
  return Math.round((keyToUTC(b) - keyToUTC(a)) / DAY_MS);
}

export function dayOfWeek(key: string): number {
  return new Date(keyToUTC(key)).getUTCDay();
}

export function weekdayLabel(key: string): string {
  return WEEKDAYS[dayOfWeek(key)];
}

/** "10.14 (화)" */
export function formatShort(key: string): string {
  const { m, d } = parseKey(key);
  return `${m}.${d} (${weekdayLabel(key)})`;
}

/** "2026년 10월 14일 (화)" */
export function formatLong(key: string): string {
  const { y, m, d } = parseKey(key);
  return `${y}년 ${m}월 ${d}일 (${weekdayLabel(key)})`;
}

/** "10월 14일 화요일" */
export function formatDayHeading(key: string): string {
  const { m, d } = parseKey(key);
  return `${m}월 ${d}일 ${weekdayLabel(key)}요일`;
}

export function formatRange(start: string, end?: string): string {
  if (!end || end === start) return formatShort(start);
  const s = parseKey(start);
  const e = parseKey(end);
  const endLabel = s.m === e.m ? `${e.d} (${weekdayLabel(end)})` : formatShort(end);
  return `${formatShort(start)} ~ ${endLabel}`;
}

export interface YearMonth {
  y: number;
  m: number;
}

export function ymOf(key: string): YearMonth {
  const { y, m } = parseKey(key);
  return { y, m };
}

export function shiftMonth({ y, m }: YearMonth, delta: number): YearMonth {
  const idx = y * 12 + (m - 1) + delta;
  return { y: Math.floor(idx / 12), m: (idx % 12) + 1 };
}

export function monthKey({ y, m }: YearMonth): string {
  return `${y}-${String(m).padStart(2, "0")}`;
}

/** 일요일 시작 6주(42칸) 달력 매트릭스 */
export function monthMatrix({ y, m }: YearMonth): string[] {
  const first = toKey(y, m, 1);
  const start = addDays(first, -dayOfWeek(first));
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}

/** 해당 월에 필요한 주 수만큼만 (5주 또는 6주) */
export function monthWeeks(ym: YearMonth): string[][] {
  const cells = monthMatrix(ym);
  const weeks: string[][] = [];
  for (let i = 0; i < 6; i++) {
    const week = cells.slice(i * 7, i * 7 + 7);
    if (i >= 4 && parseKey(week[0]).m !== ym.m) break;
    weeks.push(week);
  }
  return weeks;
}

export function ddayLabel(diff: number): string {
  if (diff === 0) return "D-DAY";
  if (diff > 0) return `D-${diff}`;
  return `D+${-diff}`;
}

/** 대한민국 공휴일 (대체공휴일 포함). 매년 초에 다음 해 분을 추가하세요. */
export const HOLIDAYS: Record<string, string> = {
  "2026-01-01": "신정",
  "2026-02-16": "설날 연휴",
  "2026-02-17": "설날",
  "2026-02-18": "설날 연휴",
  "2026-03-01": "삼일절",
  "2026-03-02": "대체공휴일",
  "2026-05-05": "어린이날",
  "2026-05-24": "부처님오신날",
  "2026-05-25": "대체공휴일",
  "2026-06-03": "지방선거",
  "2026-06-06": "현충일",
  "2026-08-15": "광복절",
  "2026-08-17": "대체공휴일",
  "2026-09-24": "추석 연휴",
  "2026-09-25": "추석",
  "2026-09-26": "추석 연휴",
  "2026-10-03": "개천절",
  "2026-10-05": "대체공휴일",
  "2026-10-09": "한글날",
  "2026-12-25": "성탄절",
  "2027-01-01": "신정",
};
