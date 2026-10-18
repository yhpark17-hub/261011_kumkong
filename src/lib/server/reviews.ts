import "server-only";
import type { Row } from "@libsql/client";
import { RECRUITMENTS, getCompany } from "../data";
import type { Company } from "../types";
import {
  TOTAL_MIN_REPORTS,
  UNSOLVED_OPTIONS,
  inPriorityWindow,
  type ExamInfo,
  type ExamSummary,
  type MyReview,
  type ReviewComment,
  type ReviewStats,
  type UnsolvedStat,
} from "../review-meta";
import { STATUS, db } from "./db";
import { voterToken } from "./security";

/* ------------------------------------------------------------------ */
/* 시험 목록 — 채용 데이터의 필기 일정에서 자동 생성                       */
/* ------------------------------------------------------------------ */

function simplifySubject(s: string): string {
  return s
    .replace(/\(.*?\)/g, "")
    .replace(/능력평가|능력|평가/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 12);
}

type Scope = { ncs: boolean; major: boolean; essay: boolean };

/** 회차 이름에 영역이 적혀 있으면(예: "2차 필기 (전공·논술)") 그 영역만 묻습니다 */
function labelScope(label: string): Scope | null {
  const scope = { ncs: /NCS|직업기초|인적성/.test(label), major: /전공/.test(label), essay: /논술/.test(label) };
  return scope.ncs || scope.major || scope.essay ? scope : null;
}

/** 기관 정보 기준 영역 */
function companyScope(c: Company): Scope {
  return {
    ncs: c.written.ncs.has !== false,
    major: c.written.major.type === "single" || c.written.major.type === "integrated",
    essay: (c.written.extra ?? []).some((e) => e.includes("논술")),
  };
}

function ncsSubjects(c: Company): string[] {
  const ncs = c.written.ncs;
  if (ncs.has == null) return ["NCS·인적성"];
  const subs = ncs.subjects.map(simplifySubject).filter((s) => s && !/\d+문항/.test(s));
  return subs.length ? subs.slice(0, 7) : ["NCS"];
}

function examSubjects(c: Company, scope: Scope): string[] {
  const out: string[] = [];
  if (scope.ncs) out.push(...ncsSubjects(c));
  if (scope.major) out.push("전공");
  if (scope.essay) out.push("논술");
  if (!out.length) out.push("필기 전반");
  return [...new Set(out)];
}

/** 못 푼 문항 수를 묻는 영역 — 논술은 문항 수 개념이 없어 제외 */
function examSections(c: Company, scope: Scope): string[] {
  const out: string[] = [];
  if (scope.ncs) out.push(c.written.ncs.has == null ? "NCS·인적성" : "NCS");
  if (scope.major) out.push("전공");
  if (!out.length && !scope.essay) out.push("필기");
  return out;
}

/**
 * 라벨 없이 메모 앞부분에 회차가 적힌 경우(예: "2차 필기 (전공·논술) · 합격 발표 11/18")
 * 회차 부분을 시험 이름으로, 나머지를 메모로 나눕니다.
 */
function splitStage(note?: string): { stage?: string; rest?: string } {
  if (!note) return {};
  const [head, ...tail] = note.split(" · ");
  const h = head.trim();
  if (h.length <= 20 && /^\d차\s*필기/.test(h)) return { stage: h, rest: tail.join(" · ") || undefined };
  return { rest: note };
}

let examCache: ExamInfo[] | null = null;

export function listExams(): ExamInfo[] {
  if (examCache) return examCache;
  const exams: ExamInfo[] = [];
  for (const r of RECRUITMENTS) {
    const c = getCompany(r.companyId);
    if (!c) continue;
    for (const e of r.events) {
      if (e.type !== "written") continue;
      // AI역량검사처럼 문제를 푸는 시험이 아닌 온라인 검사는 달력에만 표시하고 후기 투표는 열지 않습니다
      if (e.label && /AI\s*역량|역량검사/.test(e.label) && !/필기|NCS|직무|인적성|코딩/.test(e.label)) continue;
      const { stage, rest } = e.label ? { stage: e.label, rest: e.note } : splitStage(e.note);
      const scope = (stage && labelScope(stage)) || companyScope(c);
      exams.push({
        id: `${c.id}-${e.date}`,
        companyId: c.id,
        companyName: c.name,
        shortName: c.shortName,
        avatar: c.avatar,
        logo: c.logo,
        date: e.date,
        label: stage ?? "필기시험",
        note: rest,
        subjects: examSubjects(c, scope),
        sections: examSections(c, scope),
        category: c.category,
        tracks: r.tracks.slice(0, 12),
        askStyle: scope.ncs,
        expected: r.status === "expected",
      });
    }
  }
  examCache = exams.sort((a, b) => (a.date < b.date ? 1 : -1));
  return examCache;
}

export function getExam(id: string): ExamInfo | undefined {
  return listExams().find((e) => e.id === id);
}

export function examsForCompany(companyId: string): ExamInfo[] {
  return listExams().filter((e) => e.companyId === companyId);
}

/* ------------------------------------------------------------------ */
/* 집계                                                                 */
/* ------------------------------------------------------------------ */

export async function examCounts(): Promise<Map<string, { n: number; avg: number }>> {
  const client = await db();
  const res = await client.execute({
    sql: "SELECT exam_id, COUNT(*) AS n, AVG(overall) AS avg FROM exam_reviews WHERE status = ? GROUP BY exam_id",
    args: [STATUS.visible],
  });
  return new Map(res.rows.map((r) => [String(r.exam_id), { n: Number(r.n), avg: Number(r.avg) }]));
}

/** 이 방문자(쿠키)가 후기를 남긴 시험 id */
export async function myReviewedExamIds(voter: string | null): Promise<Set<string>> {
  if (!voter) return new Set();
  const client = await db();
  const res = await client.execute({ sql: "SELECT exam_id FROM exam_reviews WHERE voter = ? AND status != 2", args: [voter] });
  return new Set(res.rows.map((r) => String(r.exam_id)));
}

/**
 * 목록·기관 화면용 시험별 요약 — 시험 후 3일(요약도 잠긴 기간)에는 후기를 남긴 사람에게만 평균 난이도를 보내요.
 * 참여 수는 누구에게나 보여 줘요 (참여를 부르는 숫자). connection() 이후 호출.
 */
export async function examSummaries(exams: ExamInfo[], today: string): Promise<Record<string, ExamSummary>> {
  const [counts, mine] = await Promise.all([examCounts(), voterToken(false).then(myReviewedExamIds)]);
  const out: Record<string, ExamSummary> = {};
  for (const e of exams) {
    const c = counts.get(e.id);
    const isMine = mine.has(e.id);
    const locked = !isMine && inPriorityWindow(e.date, today);
    if (!c && !isMine) continue;
    out[e.id] = { n: c?.n ?? 0, avg: c && !locked ? c.avg : null, locked, mine: isMine };
  }
  return out;
}

/** 한 시험의 보이는 후기 수 (검색 노출 여부 판단용) */
export async function examReviewCount(examId: string): Promise<number> {
  const client = await db();
  const res = await client.execute({
    sql: "SELECT COUNT(*) AS n FROM exam_reviews WHERE exam_id = ? AND status = ?",
    args: [examId, STATUS.visible],
  });
  return Number(res.rows[0]?.n ?? 0);
}

export interface ExamActivity {
  /** 오늘(한국 시각 0시 이후) 들어온 후기 수 */
  today: number;
  /** 최근 1시간 */
  lastHour: number;
  /** 마지막 후기가 몇 분 전인지 */
  lastMinutesAgo: number | null;
}

/** 지금 참여 중인 느낌을 주는 실제 수치 (최근 3일 안에 들어온 후기만 집계) — connection() 이후 호출 */
export async function examActivity(): Promise<Record<string, ExamActivity>> {
  const client = await db();
  const now = Date.now();
  const kstMidnight = Math.floor((now + 9 * 3600_000) / 86_400_000) * 86_400_000 - 9 * 3600_000;
  const res = await client.execute({
    sql: `SELECT exam_id,
                 SUM(CASE WHEN created_at >= ? THEN 1 ELSE 0 END) AS today,
                 SUM(CASE WHEN created_at >= ? THEN 1 ELSE 0 END) AS last_hour,
                 MAX(created_at) AS last_at
          FROM exam_reviews WHERE status = ? AND created_at >= ? GROUP BY exam_id`,
    args: [kstMidnight, now - 3600_000, STATUS.visible, now - 3 * 86_400_000],
  });
  return Object.fromEntries(
    res.rows.map((r) => [
      String(r.exam_id),
      {
        today: Number(r.today ?? 0),
        lastHour: Number(r.last_hour ?? 0),
        lastMinutesAgo: r.last_at == null ? null : Math.max(0, Math.round((now - Number(r.last_at)) / 60_000)),
      },
    ]),
  );
}

function parseJson(raw: unknown): Record<string, number> {
  try {
    const v: unknown = JSON.parse(String(raw ?? "{}"));
    return v && typeof v === "object" ? (v as Record<string, number>) : {};
  } catch {
    return {};
  }
}

/** 섹션별 못 푼 문항 수 분포 + 응시자 제보 총 문항 수(최빈값) */
function unsolvedStats(exam: ExamInfo, rows: Row[]): UnsolvedStat[] {
  const parsed = rows.map((r) => ({ unsolved: parseJson(r.unsolved), totals: parseJson(r.totals) }));
  return exam.sections
    .map((section) => {
      const dist = UNSOLVED_OPTIONS.map(() => 0);
      const totals = new Map<number, number>();
      let totalReports = 0;
      for (const r of parsed) {
        const i = UNSOLVED_OPTIONS.findIndex((o) => o.value === r.unsolved[section]);
        if (i >= 0) dist[i]++;
        const t = r.totals[section];
        if (Number.isInteger(t) && t > 0) {
          totals.set(t, (totals.get(t) ?? 0) + 1);
          totalReports++;
        }
      }
      const n = dist.reduce((s, x) => s + x, 0);
      let median: number | null = null;
      for (let i = 0, acc = 0; i < dist.length && n; i++) {
        acc += dist[i];
        if (acc >= n / 2) {
          median = UNSOLVED_OPTIONS[i].value;
          break;
        }
      }
      // 제보가 충분하고 절반 이상이 같은 값을 말할 때만 '총 문항 수'로 인정
      const [mode, votes] = [...totals.entries()].sort((a, b) => b[1] - a[1])[0] ?? [0, 0];
      const total = totalReports >= TOTAL_MIN_REPORTS && votes / totalReports >= 0.5 ? { value: mode, votes } : null;
      return { section, dist, n, median, total, totalReports };
    })
    .filter((s) => s.n > 0 || s.totalReports > 0);
}

export async function reviewStats(exam: ExamInfo): Promise<ReviewStats> {
  const client = await db();
  const res = await client.execute({
    sql: "SELECT overall, time_pressure, style, hardest, subjects, unsolved, totals, track FROM exam_reviews WHERE exam_id = ? AND status = ? LIMIT 5000",
    args: [exam.id, STATUS.visible],
  });
  const overall = [0, 0, 0, 0, 0];
  const time = [0, 0, 0, 0];
  const style: Record<string, number> = {};
  const hardest: Record<string, number> = {};
  const tracks: Record<string, number> = {};
  const subjectSum: Record<string, { sum: number; n: number }> = {};
  let overallSum = 0;
  let timeSum = 0;
  for (const r of res.rows) {
    const o = Number(r.overall);
    const t = Number(r.time_pressure);
    if (o >= 1 && o <= 5) {
      overall[o - 1]++;
      overallSum += o;
    }
    if (t >= 1 && t <= 4) {
      time[t - 1]++;
      timeSum += t;
    }
    if (r.style) style[String(r.style)] = (style[String(r.style)] ?? 0) + 1;
    if (r.hardest) hardest[String(r.hardest)] = (hardest[String(r.hardest)] ?? 0) + 1;
    if (r.track) tracks[String(r.track)] = (tracks[String(r.track)] ?? 0) + 1;
    for (const [name, v] of Object.entries(parseJson(r.subjects))) {
      if (!exam.subjects.includes(name) || !(v >= 1 && v <= 5)) continue;
      subjectSum[name] ??= { sum: 0, n: 0 };
      subjectSum[name].sum += v;
      subjectSum[name].n++;
    }
  }
  const count = res.rows.length;
  return {
    count,
    overall,
    overallAvg: count ? overallSum / count : null,
    time,
    timeAvg: count ? timeSum / count : null,
    style,
    hardest,
    tracks,
    subjects: exam.subjects
      .filter((s) => subjectSum[s])
      .map((s) => ({ name: s, avg: subjectSum[s].sum / subjectSum[s].n, n: subjectSum[s].n }))
      .sort((a, b) => b.avg - a.avg),
    unsolved: unsolvedStats(exam, res.rows),
  };
}

export async function reviewComments(examId: string, includeHidden = false): Promise<ReviewComment[]> {
  const client = await db();
  const res = await client.execute({
    sql: `SELECT id, one_liner, detail, track, overall, status, created_at FROM exam_reviews
          WHERE exam_id = ? AND status ${includeHidden ? "!= 2" : "= 0"} AND (one_liner IS NOT NULL OR detail IS NOT NULL)
          ORDER BY id DESC LIMIT 60`,
    args: [examId],
  });
  return res.rows.map((r) => ({
    id: Number(r.id),
    oneLiner: (r.one_liner as string | null) ?? null,
    detail: (r.detail as string | null) ?? null,
    track: (r.track as string | null) ?? null,
    overall: Number(r.overall),
    status: Number(r.status),
    createdAt: Number(r.created_at),
  }));
}

/** 운영자 화면: 신고가 들어온 후기 */
export async function reportedReviews() {
  const client = await db();
  const res = await client.execute(
    "SELECT id, exam_id, one_liner, detail, reports, status, created_at FROM exam_reviews WHERE reports > 0 AND status != 2 ORDER BY reports DESC, id DESC LIMIT 50",
  );
  return res.rows.map((r) => ({
    id: Number(r.id),
    examId: String(r.exam_id),
    oneLiner: (r.one_liner as string | null) ?? null,
    detail: (r.detail as string | null) ?? null,
    reports: Number(r.reports),
    status: Number(r.status),
    createdAt: Number(r.created_at),
  }));
}

export async function myReview(examId: string, voter: string | null): Promise<MyReview | null> {
  if (!voter) return null;
  const client = await db();
  const res = await client.execute({
    sql: "SELECT overall, time_pressure, style, hardest, subjects, unsolved, totals, track, one_liner, detail FROM exam_reviews WHERE exam_id = ? AND voter = ? AND status != 2",
    args: [examId, voter],
  });
  const r = res.rows[0];
  if (!r) return null;
  return {
    overall: Number(r.overall),
    timePressure: Number(r.time_pressure),
    style: (r.style as string | null) ?? null,
    hardest: (r.hardest as string | null) ?? null,
    subjects: parseJson(r.subjects),
    unsolved: parseJson(r.unsolved),
    totals: parseJson(r.totals),
    track: (r.track as string | null) ?? null,
    oneLiner: (r.one_liner as string | null) ?? null,
    detail: (r.detail as string | null) ?? null,
  };
}
