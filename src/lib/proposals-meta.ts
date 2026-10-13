import type { Recruitment } from "./types";

/**
 * 자동 점검 제안 (클라우드 에이전트가 판단 → 운영자가 승인)
 * - schedule : 채용 일정 데이터 수정 (승인하면 recruitment-updates.json 에 반영 → 재배포)
 * - feedback : 사용자 제보·공고 제보·의견 처리 방법
 */

export type ProposalKind = "schedule" | "feedback";

/** 선택지를 고르면 실제로 일어나는 일 */
export type ProposalAction =
  | "update_schedule" // record 를 일정 데이터에 반영
  | "feedback_done" // 제보를 '처리 완료'로
  | "feedback_delete" // 제보 삭제 (스팸·무의미)
  | "none"; // 기록만 하고 아무것도 바꾸지 않음

export interface ProposalOption {
  key: string;
  label: string;
  description?: string;
  action: ProposalAction;
  /** update_schedule 일 때 반영할 기관 일정 전체 (recruitment-updates.json 의 한 항목) */
  record?: Recruitment;
}

export interface ProposalSource {
  title: string;
  url: string;
}

export const PROPOSAL_STATUS = { pending: 0, approved: 1, applied: 2, rejected: 3, failed: 4 } as const;

export const PROPOSAL_STATUS_META: Record<number, { label: string; tone: string }> = {
  0: { label: "검토 대기", tone: "bg-ev-written-soft text-primary-text" },
  1: { label: "승인 · 반영 대기", tone: "bg-canvas-cream text-lemon" },
  2: { label: "반영 완료", tone: "bg-ev-final-soft text-ev-final" },
  3: { label: "거절", tone: "bg-canvas-soft text-ink-secondary" },
  4: { label: "반영 실패", tone: "bg-ev-doc-soft text-ev-doc" },
};

export const KIND_META: Record<ProposalKind, { label: string; tone: string }> = {
  schedule: { label: "일정 수정", tone: "bg-ev-written-soft text-ev-written" },
  feedback: { label: "제보 처리", tone: "bg-ev-interview2-soft text-ev-interview2" },
};

export const CONFIDENCE_META: Record<string, { label: string; tone: string }> = {
  high: { label: "확신 높음", tone: "bg-ev-final-soft text-ev-final" },
  medium: { label: "확신 보통", tone: "bg-canvas-cream text-lemon" },
  low: { label: "확신 낮음", tone: "bg-ev-doc-soft text-ev-doc" },
};

export interface ProposalItem {
  id: number;
  kind: ProposalKind;
  title: string;
  analysis: string;
  companyId: string | null;
  feedbackId: number | null;
  options: ProposalOption[];
  recommended: string | null;
  sources: ProposalSource[];
  confidence: string | null;
  status: number;
  choice: string | null;
  adminNote: string | null;
  result: string | null;
  createdAt: number;
  decidedAt: number | null;
  appliedAt: number | null;
}
