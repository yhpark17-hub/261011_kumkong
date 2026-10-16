import "server-only";
import type { InValue, Row } from "@libsql/client";
import { isIssueEdition, kindOf, parseQuiz, type BriefingIssue, type IssueEdition, type NewsItem } from "../news-meta";
import { db } from "./db";
import { COLS, PUBLIC, toItem } from "./news";

/**
 * 데일리 브리핑 (호) — 날짜·판(아침판/점심판)마다 한 편. 그날 그 판의 기사(news.edition_date·edition)를 묶어 보여 줍니다.
 * 공개 = status 1 + 발행 시각이 지난 것. 발행하면 그 판의 기사도 함께 공개됩니다(운영자 화면).
 */

const ISSUE_PUBLIC = "status = 1 AND published_at <= ?";
const ISSUE_COLS = "id, issue_date, edition, vol, title, lede, closing, quiz, status, origin, published_at, updated_at, views";

function toIssue(r: Row): BriefingIssue {
  const publishedAt = r.published_at == null ? null : Number(r.published_at);
  return {
    id: Number(r.id),
    date: String(r.issue_date),
    edition: isIssueEdition(r.edition) ? r.edition : "morning",
    vol: Number(r.vol ?? 0),
    title: String(r.title),
    lede: String(r.lede ?? ""),
    closing: String(r.closing ?? ""),
    quiz: parseQuiz(r.quiz),
    status: Number(r.status),
    origin: String(r.origin ?? "admin"),
    publishedAt,
    updatedAt: Number(r.updated_at),
    views: Number(r.views ?? 0),
    live: Number(r.status) === 1 && publishedAt != null && publishedAt <= Date.now(),
  };
}

/** 브리핑 한 호에 실린 기사 — 아침판은 헤드라인 → 기사들, 점심판은 용어 → 면접 질문 */
export interface LetterContent {
  headline: NewsItem | null;
  /** 헤드라인을 뺀 기사들 (순서대로) */
  stories: NewsItem[];
  terms: NewsItem[];
  questions: NewsItem[];
  /** 오늘 꼭 알아야 할 3가지 (헤드라인 + 앞의 두 기사) */
  top: NewsItem[];
  /** 기사 전체 (헤드라인 포함) */
  all: NewsItem[];
}

export function arrangeLetter(items: NewsItem[]): LetterContent {
  const order = (a: NewsItem, b: NewsItem) => a.position - b.position || (a.publishedAt ?? 0) - (b.publishedAt ?? 0) || a.id - b.id;
  const news = items.filter((n) => kindOf(n.section) === "news").sort(order);
  const headline = news.find((n) => n.headline) ?? news[0] ?? null;
  const stories = news.filter((n) => n !== headline);
  const all = headline ? [headline, ...stories] : stories;
  return {
    headline,
    stories,
    terms: items.filter((n) => n.section === "term").sort(order),
    questions: items.filter((n) => n.section === "question").sort(order),
    top: all.slice(0, 3),
    all,
  };
}

/** 가장 최근 발행된 호 (판을 고르면 그 판에서) */
export async function latestIssue(edition?: IssueEdition): Promise<BriefingIssue | null> {
  const client = await db();
  const res = await client.execute({
    sql: `SELECT ${ISSUE_COLS} FROM briefing_issues WHERE ${ISSUE_PUBLIC}${edition ? " AND edition = ?" : ""} ORDER BY issue_date DESC, edition DESC LIMIT 1`,
    args: edition ? [Date.now(), edition] : [Date.now()],
  });
  return res.rows[0] ? toIssue(res.rows[0]) : null;
}

export async function getIssue(date: string, edition: IssueEdition, opts: { admin?: boolean } = {}): Promise<BriefingIssue | null> {
  const client = await db();
  const res = await client.execute({
    sql: opts.admin
      ? `SELECT ${ISSUE_COLS} FROM briefing_issues WHERE issue_date = ? AND edition = ?`
      : `SELECT ${ISSUE_COLS} FROM briefing_issues WHERE issue_date = ? AND edition = ? AND ${ISSUE_PUBLIC}`,
    args: opts.admin ? [date, edition] : [date, edition, Date.now()],
  });
  return res.rows[0] ? toIssue(res.rows[0]) : null;
}

/** 그날 발행된 호들 (아침판·점심판) */
export async function issuesOn(date: string): Promise<BriefingIssue[]> {
  const client = await db();
  const res = await client.execute({ sql: `SELECT ${ISSUE_COLS} FROM briefing_issues WHERE issue_date = ? AND ${ISSUE_PUBLIC} ORDER BY edition DESC`, args: [date, Date.now()] });
  return res.rows.map(toIssue);
}

export async function getIssueById(id: number): Promise<BriefingIssue | null> {
  const client = await db();
  const res = await client.execute({ sql: `SELECT ${ISSUE_COLS} FROM briefing_issues WHERE id = ?`, args: [id] });
  return res.rows[0] ? toIssue(res.rows[0]) : null;
}

/** 그날 그 판의 기사 — 독자에게는 공개된 것만, 운영자 미리보기는 초안까지 */
export async function issueItems(date: string, edition: IssueEdition, opts: { admin?: boolean } = {}): Promise<NewsItem[]> {
  const client = await db();
  // 점심판 = 그날 용어·면접 질문, 아침판 = 아침판으로 적힌 기사
  const where = edition === "noon" ? "section IN ('term', 'question')" : "edition = 'morning' AND section NOT IN ('term', 'question')";
  const res = await client.execute({
    sql: opts.admin
      ? `SELECT ${COLS} FROM news WHERE edition_date = ? AND ${where} ORDER BY position, id`
      : `SELECT ${COLS} FROM news WHERE edition_date = ? AND ${where} AND ${PUBLIC} ORDER BY position, id`,
    args: opts.admin ? [date] : [date, Date.now()],
  });
  return res.rows.map(toItem);
}

/** 목록 한 줄: 호 + 오늘 꼭 알아야 할 3가지(아침판) 또는 용어·질문(점심판) */
export interface IssueSummary {
  issue: BriefingIssue;
  /** 아침판: 헤드라인 + 앞의 두 기사 / 점심판: 용어·질문 */
  top: NewsItem[];
  count: number;
}

async function summarize(issues: BriefingIssue[]): Promise<IssueSummary[]> {
  if (!issues.length) return [];
  const client = await db();
  const dates = [...new Set(issues.map((i) => i.date))];
  const rows = await client.execute({
    sql: `SELECT ${COLS} FROM news WHERE ${PUBLIC} AND edition_date IN (${dates.map(() => "?").join(",")})`,
    args: [Date.now(), ...dates],
  });
  const items = rows.rows.map(toItem);
  return issues.map((issue) => {
    const mine = items.filter((n) => {
      if (n.editionDate !== issue.date) return false;
      const study = n.section === "term" || n.section === "question";
      return issue.edition === "noon" ? study : !study && n.edition === "morning";
    });
    const c = arrangeLetter(mine);
    const top = issue.edition === "noon" ? [...c.terms, ...c.questions].slice(0, 4) : c.top;
    return { issue, top, count: issue.edition === "noon" ? c.terms.length + c.questions.length : c.all.length };
  });
}

/** 지난 브리핑 — 기간(from~to)으로 거르고 최신 호부터 */
export async function listIssues(opts: { from?: string | null; to?: string | null; page?: number; pageSize?: number }): Promise<{ items: IssueSummary[]; total: number }> {
  const client = await db();
  const where = [ISSUE_PUBLIC];
  const args: InValue[] = [Date.now()];
  if (opts.from) {
    where.push("issue_date >= ?");
    args.push(opts.from);
  }
  if (opts.to) {
    where.push("issue_date <= ?");
    args.push(opts.to);
  }
  const pageSize = opts.pageSize ?? 10;
  const page = Math.max(1, opts.page ?? 1);
  const [rows, count] = await Promise.all([
    client.execute({
      sql: `SELECT ${ISSUE_COLS} FROM briefing_issues WHERE ${where.join(" AND ")} ORDER BY issue_date DESC, edition DESC LIMIT ? OFFSET ?`,
      args: [...args, pageSize, (page - 1) * pageSize],
    }),
    client.execute({ sql: `SELECT COUNT(*) AS n FROM briefing_issues WHERE ${where.join(" AND ")}`, args }),
  ]);
  return { items: await summarize(rows.rows.map(toIssue)), total: Number(count.rows[0]?.n ?? 0) };
}

/** 같은 판의 앞뒤 호 */
export async function adjacentIssues(date: string, edition: IssueEdition): Promise<{ prev: BriefingIssue | null; next: BriefingIssue | null }> {
  const client = await db();
  const now = Date.now();
  const [p, n] = await Promise.all([
    client.execute({ sql: `SELECT ${ISSUE_COLS} FROM briefing_issues WHERE ${ISSUE_PUBLIC} AND edition = ? AND issue_date < ? ORDER BY issue_date DESC LIMIT 1`, args: [now, edition, date] }),
    client.execute({ sql: `SELECT ${ISSUE_COLS} FROM briefing_issues WHERE ${ISSUE_PUBLIC} AND edition = ? AND issue_date > ? ORDER BY issue_date ASC LIMIT 1`, args: [now, edition, date] }),
  ]);
  return { prev: p.rows[0] ? toIssue(p.rows[0]) : null, next: n.rows[0] ? toIssue(n.rows[0]) : null };
}

/** 최근 호 (옆 칸·홈) */
export async function recentIssues(limit = 6): Promise<BriefingIssue[]> {
  const client = await db();
  const res = await client.execute({
    sql: `SELECT ${ISSUE_COLS} FROM briefing_issues WHERE ${ISSUE_PUBLIC} ORDER BY issue_date DESC, edition DESC LIMIT ?`,
    args: [Date.now(), limit],
  });
  return res.rows.map(toIssue);
}

/** 기간 안의 호 목록 (첫 화면 '최근 브리핑') */
export async function issuesBetween(from: string, to: string): Promise<IssueSummary[]> {
  const client = await db();
  const res = await client.execute({
    sql: `SELECT ${ISSUE_COLS} FROM briefing_issues WHERE ${ISSUE_PUBLIC} AND issue_date >= ? AND issue_date <= ? ORDER BY issue_date DESC, edition DESC`,
    args: [Date.now(), from, to],
  });
  return summarize(res.rows.map(toIssue));
}

export async function incrementIssueViews(id: number): Promise<void> {
  const client = await db();
  await client.execute({ sql: "UPDATE briefing_issues SET views = views + 1 WHERE id = ?", args: [id] });
}

/** 사이트맵·RSS */
export async function publishedIssueIndex(limit = 2000): Promise<BriefingIssue[]> {
  const client = await db();
  const res = await client.execute({
    sql: `SELECT ${ISSUE_COLS} FROM briefing_issues WHERE ${ISSUE_PUBLIC} ORDER BY issue_date DESC, edition DESC LIMIT ?`,
    args: [Date.now(), limit],
  });
  return res.rows.map(toIssue);
}

/* ------------------------------------------------------------------ */
/* 운영자                                                               */
/* ------------------------------------------------------------------ */

export interface AdminIssueRow {
  issue: BriefingIssue;
  items: number;
  drafts: number;
}

/** 운영자 브리핑 목록 — 발행 대기 먼저, 그다음 최신 호 */
export async function adminListIssues(limit = 30): Promise<AdminIssueRow[]> {
  const client = await db();
  const res = await client.execute({ sql: `SELECT ${ISSUE_COLS} FROM briefing_issues ORDER BY status ASC, issue_date DESC, edition DESC LIMIT ?`, args: [limit] });
  const issues = res.rows.map(toIssue);
  return Promise.all(
    issues.map(async (issue) => {
      const items = await issueItems(issue.date, issue.edition, { admin: true });
      return { issue, items: items.length, drafts: items.filter((n) => n.status === 0).length };
    }),
  );
}

/** 자동 점검(점심판)이 그날 아침판 기사를 보고 용어·질문을 고를 수 있게 */
export async function morningForAutomation(date: string): Promise<{ issue: BriefingIssue | null; items: NewsItem[] }> {
  const [issue, items] = await Promise.all([getIssue(date, "morning", { admin: true }), issueItems(date, "morning", { admin: true })]);
  return { issue, items };
}
