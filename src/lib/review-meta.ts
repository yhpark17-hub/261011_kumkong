/** 필기 후기(간편 투표) 공통 정보 — 서버·클라이언트 모두에서 사용 */

import { addDays } from "./date";
import type { Category } from "./types";

/**
 * 응시자 우선 공개: 시험일 포함 3일 동안 상세 결과는 후기를 남긴 사람에게만 보여 주고,
 * 그 뒤에는 누구나 볼 수 있게 엽니다. 결과만 보려고 허위로 참여할 이유를 줄이고,
 * 실제 응시자는 '바로 보려면 남기는' 쪽을 택하게 하려는 장치입니다.
 */
export const PRIORITY_DAYS = 3;

/** 상세 결과가 모두에게 공개되는 날 (YYYY-MM-DD, 이 날 0시부터) */
export function resultsPublicFrom(examDate: string): string {
  return addDays(examDate, PRIORITY_DAYS);
}

/** 응시자 우선 공개 기간인지 (시험일 ~ 공개일 전날) — 이 동안 후기를 안 남긴 사람에겐 난이도도 숨겨요 */
export function inPriorityWindow(examDate: string, today: string): boolean {
  return examDate <= today && today < resultsPublicFrom(examDate);
}

/**
 * 목록·기관 화면에 넘기는 시험별 요약.
 * avg 가 null 이면 '아직 후기 없음' 또는 '잠김'(locked) — 잠긴 시험은 서버에서 평균을 아예 보내지 않아요.
 */
export interface ExamSummary {
  n: number;
  avg: number | null;
  /** 응시자 우선 공개 기간이라 이 방문자에겐 난이도를 숨김 */
  locked: boolean;
  /** 이 방문자가 후기를 남긴 시험 */
  mine: boolean;
}

export interface UnsolvedOption {
  /** DB 저장값 */
  value: number;
  label: string;
  /** 구간 (hi=null 은 '이상') */
  lo: number;
  hi: number | null;
  /** 예전 선택지 — 이미 들어온 응답을 보여 줄 때만 쓰고 새로 고를 수는 없어요 */
  legacy?: boolean;
}

/**
 * 못 풀고 넘긴(찍은) 문항 수 — 총 문항 수를 몰라도 답할 수 있게 구간으로 묻습니다.
 * 배열 순서가 분포·가운데 값 계산 순서예요 (value 순서가 아님).
 * 예전 '16개 이상'(5)은 16~30개를 나누기 전 응답이라 뜻을 바꾸지 않고 그대로 둬요.
 */
export const UNSOLVED_OPTIONS: readonly UnsolvedOption[] = [
  { value: 0, label: "다 풀었어요", lo: 0, hi: 0 },
  { value: 1, label: "1~3개", lo: 1, hi: 3 },
  { value: 2, label: "4~6개", lo: 4, hi: 6 },
  { value: 3, label: "7~10개", lo: 7, hi: 10 },
  { value: 4, label: "11~15개", lo: 11, hi: 15 },
  { value: 5, label: "16개 이상(예전 응답)", lo: 16, hi: null, legacy: true },
  { value: 6, label: "16~20개", lo: 16, hi: 20 },
  { value: 7, label: "21~25개", lo: 21, hi: 25 },
  { value: 8, label: "26~30개", lo: 26, hi: 30 },
  { value: 9, label: "31개 이상", lo: 31, hi: null },
];

/** 후기 양식에서 고를 수 있는 선택지 */
export const UNSOLVED_CHOICES = UNSOLVED_OPTIONS.filter((o) => !o.legacy);

export const unsolvedOption = (value: number) => UNSOLVED_OPTIONS.find((o) => o.value === value);

/** 총 문항 수 제보가 이 수 이상 모이고, 절반 이상이 같은 값을 말해야 화면에 보여 줍니다 */
export const TOTAL_MIN_REPORTS = 3;

export const OVERALL_OPTIONS = [
  { value: 1, label: "매우 쉬움" },
  { value: 2, label: "쉬움" },
  { value: 3, label: "보통" },
  { value: 4, label: "어려움" },
  { value: 5, label: "매우 어려움" },
] as const;

export const TIME_OPTIONS = [
  { value: 1, label: "시간 여유" },
  { value: 2, label: "적당" },
  { value: 3, label: "빠듯" },
  { value: 4, label: "많이 부족" },
] as const;

export const STYLE_OPTIONS = [
  { value: "psat", label: "PSAT형 위주" },
  { value: "module", label: "모듈형 위주" },
  { value: "mixed", label: "섞여 있음" },
  { value: "unsure", label: "잘 모르겠음" },
] as const;

/** 과목별 체감 난이도 (1~5) */
export const SUBJECT_SCALE = ["쉬움", "약간 쉬움", "보통", "약간 어려움", "어려움"] as const;

export interface ExamInfo {
  id: string;
  companyId: string;
  companyName: string;
  shortName: string;
  avatar?: string;
  logo?: string;
  date: string;
  /** 회차·구분 (예: "1차 필기(NCS)") */
  label: string;
  note?: string;
  subjects: string[];
  tracks: string[];
  /** NCS 가 있는 시험이면 출제 유형 질문을 보여 줌 */
  askStyle: boolean;
  /** 못 푼 문항 수를 묻는 영역 (예: ["NCS", "전공"], 논술 제외) */
  sections: string[];
  category: Category;
  /** 공고 전 예상 일정 (투표 대상 아님) */
  expected: boolean;
}

export interface UnsolvedStat {
  section: string;
  /** UNSOLVED_OPTIONS 순서대로 응답 수 */
  dist: number[];
  n: number;
  /** 응답의 가운데 구간 (UNSOLVED_OPTIONS 의 value — 배열 위치가 아님) */
  median: number | null;
  /** 응시자 제보 총 문항 수 — 충분히 모였을 때만 값이 있음 */
  total: { value: number; votes: number } | null;
  totalReports: number;
}

export interface ReviewStats {
  count: number;
  overall: number[];
  overallAvg: number | null;
  time: number[];
  timeAvg: number | null;
  style: Record<string, number>;
  hardest: Record<string, number>;
  subjects: { name: string; avg: number; n: number }[];
  tracks: Record<string, number>;
  unsolved: UnsolvedStat[];
}

export interface ReviewComment {
  id: number;
  oneLiner: string | null;
  detail: string | null;
  track: string | null;
  overall: number;
  status: number;
  createdAt: number;
}

export interface MyReview {
  overall: number;
  timePressure: number;
  style: string | null;
  hardest: string | null;
  subjects: Record<string, number>;
  unsolved: Record<string, number>;
  totals: Record<string, number>;
  track: string | null;
  oneLiner: string | null;
  detail: string | null;
}

/** 평균 난이도(1~5) → 한 단어 요약 */
export function difficultyWord(avg: number | null): string {
  if (avg == null) return "-";
  if (avg < 1.8) return "매우 쉬움";
  if (avg < 2.6) return "쉬움";
  if (avg < 3.4) return "보통";
  if (avg < 4.2) return "어려움";
  return "매우 어려움";
}
