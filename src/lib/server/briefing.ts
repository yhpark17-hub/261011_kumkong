import "server-only";
import type { InValue, Row } from "@libsql/client";
import { kindOf, type BriefingIssue, type NewsItem } from "../news-meta";
import { db } from "./db";
import { COLS, PUBLIC, toItem } from "./news";

/**
 * 데일리 브리핑 레터 — 하루 한 호. 그날(issue_date) 기사들을 한 편으로 묶어 보여 줍니다.
 * 공개 = status 1 + 발행 시각이 지난 것. 발행하면 그날 기사도 함께 공개됩니다(운영자 화면).
 */

const ISSUE_PUBLIC = "status = 1 AND published_at <= ?";
const ISSUE_COLS = "id, issue_date, vol, title, lede, closing, status, origin, published_at, updated_at, views";

function toIssue(r: Row): BriefingIssue {
  const publishedAt = r.published_at == null ? null : Number(r.published_at);
  return {
    id: Number(r.id),
    date: String(r.issue_date),
    vol: Number(r.vol ?? 0),
    title: String(r.title),
    lede: String(r.lede ?? ""),
    closing: String(r.closing ?? ""),
    status: Number(r.status),
    origin: String(r.origin ?? "admin"),
    publishedAt,
    updatedAt: Number(r.updated_at),
    views: Number(r.views ?? 0),
    live: Number(r.status) === 1 && publishedAt != null && publishedAt <= Date.now(),
  };
}

/** 레터 한 호에 실린 기사 — 헤드라인 → 핵심 → 한 줄 뉴스, 같은 묶음 안에서는 순서대로 */
export interface LetterContent {
  headline: NewsItem | null;
  key: NewsItem[];
  brief: NewsItem[];
  term: NewsItem | null;
  question: NewsItem | null;
  /** 오늘 꼭 알아야 할 3가지 (헤드라인 + 핵심 앞의 둘) */
  top: NewsItem[];
  all: NewsItem[];
}

export function arrangeLetter(items: NewsItem[]): LetterContent {
  const order = (a: NewsItem, b: NewsItem) => a.position - b.position || (a.publishedAt ?? 0) - (b.publishedAt ?? 0) || a.id - b.id;
  const news = items.filter((n) => kindOf(n.section) === "news").sort(order);
  const headline = news.find((n) => n.headline) ?? news.find((n) => n.tier === "key") ?? news[0] ?? null;
  const rest = news.filter((n) => n !== headline);
  const key = rest.filter((n) => n.tier === "key");
  const brief = rest.filter((n) => n.tier === "brief");
  const term = items.filter((n) => n.section === "term").sort(order)[0] ?? null;
  const question = items.filter((n) => n.section === "question").sort(order)[0] ?? null;
  const top = [headline, ...key].filter((n): n is NewsItem => Boolean(n)).slice(0, 3);
  return { headline, key, brief, term, question, top, all: [headline, ...key, ...brief].filter((n): n is NewsItem => Boolean(n)) };
}

/** 가장 최근 발행된 레터 */
export async function latestIssue(): Promise<BriefingIssue | null> {
  const client = await db();
  const res = await client.execute({ sql: `SELECT ${ISSUE_COLS} FROM briefing_issues WHERE ${ISSUE_PUBLIC} ORDER BY issue_date DESC LIMIT 1`, args: [Date.now()] });
  return res.rows[0] ? toIssue(res.rows[0]) : null;
}

export async function getIssue(date: string, opts: { admin?: boolean } = {}): Promise<BriefingIssue | null> {
  const client = await db();
  const res = await client.execute({
    sql: opts.admin
      ? `SELECT ${ISSUE_COLS} FROM briefing_issues WHERE issue_date = ?`
      : `SELECT ${ISSUE_COLS} FROM briefing_issues WHERE issue_date = ? AND ${ISSUE_PUBLIC}`,
    args: opts.admin ? [date] : [date, Date.now()],
  });
  return res.rows[0] ? toIssue(res.rows[0]) : null;
}

export async function getIssueById(id: number): Promise<BriefingIssue | null> {
  const client = await db();
  const res = await client.execute({ sql: `SELECT ${ISSUE_COLS} FROM briefing_issues WHERE id = ?`, args: [id] });
  return res.rows[0] ? toIssue(res.rows[0]) : null;
}

/** 그날 기사 — 독자에게는 공개된 것만, 운영자 미리보기는 초안까지 */
export async function issueItems(date: string, opts: { admin?: boolean } = {}): Promise<NewsItem[]> {
  const client = await db();
  const res = await client.execute({
    sql: opts.admin
      ? `SELECT ${COLS} FROM news WHERE edition_date = ? ORDER BY position, id`
      : `SELECT ${COLS} FROM news WHERE edition_date = ? AND ${PUBLIC} ORDER BY position, id`,
    args: opts.admin ? [date] : [date, Date.now()],
  });
  return res.rows.map(toItem);
}

/** 레터 목록 한 줄: 레터 + 오늘 꼭 알아야 할 3가지 */
export interface IssueSummary {
  issue: BriefingIssue;
  top: NewsItem[];
  count: number;
}

/** 지난 레터 — 기간(from~to)으로 거르고 최신 호부터 */
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
      sql: `SELECT ${ISSUE_COLS} FROM briefing_issues WHERE ${where.join(" AND ")} ORDER BY issue_date DESC LIMIT ? OFFSET ?`,
      args: [...args, pageSize, (page - 1) * pageSize],
    }),
    client.execute({ sql: `SELECT COUNT(*) AS n FROM briefing_issues WHERE ${where.join(" AND ")}`, args }),
  ]);
  const issues = rows.rows.map(toIssue);
  if (!issues.length) return { items: [], total: Number(count.rows[0]?.n ?? 0) };
  const dates = issues.map((i) => i.date);
  const itemRows = await client.execute({
    sql: `SELECT ${COLS} FROM news WHERE ${PUBLIC} AND edition_date IN (${dates.map(() => "?").join(",")})`,
    args: [Date.now(), ...dates],
  });
  const byDate = new Map<string, NewsItem[]>();
  for (const n of itemRows.rows.map(toItem)) byDate.set(n.editionDate, [...(byDate.get(n.editionDate) ?? []), n]);
  return {
    items: issues.map((issue) => {
      const content = arrangeLetter(byDate.get(issue.date) ?? []);
      return { issue, top: content.top, count: content.all.length };
    }),
    total: Number(count.rows[0]?.n ?? 0),
  };
}

/** 앞뒤 호 */
export async function adjacentIssues(date: string): Promise<{ prev: BriefingIssue | null; next: BriefingIssue | null }> {
  const client = await db();
  const now = Date.now();
  const [p, n] = await Promise.all([
    client.execute({ sql: `SELECT ${ISSUE_COLS} FROM briefing_issues WHERE ${ISSUE_PUBLIC} AND issue_date < ? ORDER BY issue_date DESC LIMIT 1`, args: [now, date] }),
    client.execute({ sql: `SELECT ${ISSUE_COLS} FROM briefing_issues WHERE ${ISSUE_PUBLIC} AND issue_date > ? ORDER BY issue_date ASC LIMIT 1`, args: [now, date] }),
  ]);
  return { prev: p.rows[0] ? toIssue(p.rows[0]) : null, next: n.rows[0] ? toIssue(n.rows[0]) : null };
}

/** 최근 레터 (옆 칸·홈) */
export async function recentIssues(limit = 6): Promise<BriefingIssue[]> {
  const client = await db();
  const res = await client.execute({ sql: `SELECT ${ISSUE_COLS} FROM briefing_issues WHERE ${ISSUE_PUBLIC} ORDER BY issue_date DESC LIMIT ?`, args: [Date.now(), limit] });
  return res.rows.map(toIssue);
}

export async function incrementIssueViews(id: number): Promise<void> {
  const client = await db();
  await client.execute({ sql: "UPDATE briefing_issues SET views = views + 1 WHERE id = ?", args: [id] });
}

/** 사이트맵·RSS */
export async function publishedIssueIndex(limit = 2000): Promise<BriefingIssue[]> {
  const client = await db();
  const res = await client.execute({ sql: `SELECT ${ISSUE_COLS} FROM briefing_issues WHERE ${ISSUE_PUBLIC} ORDER BY issue_date DESC LIMIT ?`, args: [Date.now(), limit] });
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

/** 운영자 레터 목록 — 초안 먼저, 그다음 최신 호 */
export async function adminListIssues(limit = 30): Promise<AdminIssueRow[]> {
  const client = await db();
  const res = await client.execute({
    sql: `SELECT ${ISSUE_COLS},
            (SELECT COUNT(*) FROM news WHERE news.edition_date = briefing_issues.issue_date) AS items,
            (SELECT COUNT(*) FROM news WHERE news.edition_date = briefing_issues.issue_date AND news.status = 0) AS drafts
          FROM briefing_issues ORDER BY status ASC, issue_date DESC LIMIT ?`,
    args: [limit],
  });
  return res.rows.map((r) => ({ issue: toIssue(r), items: Number(r.items), drafts: Number(r.drafts) }));
}

export async function issueAdminCounts(): Promise<{ drafts: number; latest: string | null }> {
  const client = await db();
  const r = (
    await client.execute(`SELECT SUM(CASE WHEN status = 0 THEN 1 ELSE 0 END) AS drafts, MAX(CASE WHEN status = 1 THEN issue_date END) AS latest FROM briefing_issues`)
  ).rows[0];
  return { drafts: Number(r?.drafts ?? 0), latest: r?.latest ? String(r.latest) : null };
}
