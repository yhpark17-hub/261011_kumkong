import "server-only";
import { COMPANIES, getRecruitment } from "../data";
import { addDays, todayKST } from "../date";
import type { Company, Recruitment } from "../types";

/** 채용 일정 데이터의 빈 곳 점검 (운영자 '일정 데이터 점검' 화면) */

export type IssueKey = "none" | "noWritten" | "staleCycle" | "lowConfidence" | "oldCheck" | "expectedSoon";

export const ISSUE_META: Record<IssueKey, { label: string; desc: string; tone: string }> = {
  none: { label: "채용 정보 없음", desc: "등록된 일정이 하나도 없어요", tone: "bg-ev-doc-soft text-ev-doc" },
  noWritten: { label: "필기 날짜 없음", desc: "서류 마감이 지났는데 필기 일정이 없어요", tone: "bg-ev-doc-soft text-ev-doc" },
  staleCycle: { label: "지난 회차만", desc: "가장 최근 일정이 5개월 넘게 지났어요 — 새 공고 확인", tone: "bg-canvas-cream text-lemon" },
  lowConfidence: { label: "출처 약함", desc: "2차 출처 위주라 공고문 원문 확인이 필요해요", tone: "bg-canvas-cream text-lemon" },
  oldCheck: { label: "오래 전 확인", desc: "마지막 확인 후 3주가 넘었어요", tone: "bg-canvas-soft text-ink-secondary" },
  expectedSoon: { label: "예상 일정 임박", desc: "공고 전 예상 일정이 30일 안에 다가와요", tone: "bg-ev-written-soft text-ev-written" },
};

export interface DataIssueRow {
  company: Company;
  recruitment: Recruitment | undefined;
  issues: IssueKey[];
  lastEvent: string | null;
}

/** connection() 이후에 호출 (오늘 날짜 사용) */
export function scheduleIssues(): { rows: DataIssueRow[]; counts: Record<IssueKey, number>; today: string } {
  const today = todayKST();
  const rows: DataIssueRow[] = [];
  const counts = Object.fromEntries(Object.keys(ISSUE_META).map((k) => [k, 0])) as Record<IssueKey, number>;

  for (const company of COMPANIES) {
    const r = getRecruitment(company.id);
    const events = r?.events ?? [];
    const issues: IssueKey[] = [];
    const lastEvent = events.map((e) => e.endDate ?? e.date).sort().at(-1) ?? null;
    const lastDoc = events.filter((e) => e.type === "doc").map((e) => e.date).sort().at(-1);

    if (!events.length) issues.push("none");
    else {
      if (lastDoc && lastDoc < today && !events.some((e) => e.type === "written") && lastEvent && lastEvent >= addDays(today, -150)) {
        issues.push("noWritten");
      }
      if (lastEvent && lastEvent < addDays(today, -150)) issues.push("staleCycle");
      if (r?.confidence === "low") issues.push("lowConfidence");
      if (r?.status === "expected" && events.some((e) => e.date >= today && e.date <= addDays(today, 30))) issues.push("expectedSoon");
    }
    if (r?.updatedAt && r.updatedAt < addDays(today, -21)) issues.push("oldCheck");

    for (const i of issues) counts[i]++;
    if (issues.length) rows.push({ company, recruitment: r, issues, lastEvent });
  }

  const order: IssueKey[] = ["none", "noWritten", "expectedSoon", "lowConfidence", "staleCycle", "oldCheck"];
  const rank = (row: DataIssueRow) => Math.min(...row.issues.map((i) => order.indexOf(i)));
  rows.sort((a, b) => rank(a) - rank(b) || a.company.name.localeCompare(b.company.name, "ko"));
  return { rows, counts, today };
}
