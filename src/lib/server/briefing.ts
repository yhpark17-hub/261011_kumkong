import "server-only";
import type { InValue, Row } from "@libsql/client";
import { briefingMinutes, isIssueEdition, kindOf, parseExtras, parseQuiz, parseThumb, type BriefingIssue, type IssueEdition, type NewsItem } from "../news-meta";
import { db } from "./db";
import { COLS, PUBLIC, toItem } from "./news";

/**
 * 데일리 브리핑 (호) — 날짜·판(아침판/금콩 스터디)마다 한 편. 그날 그 판의 기사(news.edition_date·edition)를 묶어 보여 줍니다.
 * 공개 = status 1 + 발행 시각이 지난 것. 발행하면 그 판의 기사도 함께 공개됩니다(운영자 화면).
 */

const ISSUE_PUBLIC = "status = 1 AND published_at <= ?";
const ISSUE_COLS = "id, issue_date, edition, vol, title, lede, closing, quiz, extras, thumb, status, origin, published_at, updated_at, views, likes";

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
    extras: parseExtras(r.extras),
    thumb: parseThumb(r.thumb),
    status: Number(r.status),
    origin: String(r.origin ?? "admin"),
    publishedAt,
    updatedAt: Number(r.updated_at),
    views: Number(r.views ?? 0),
    likes: Number(r.likes ?? 0),
    live: Number(r.status) === 1 && publishedAt != null && publishedAt <= Date.now(),
  };
}

/** 브리핑 한 호에 실린 기사 — 아침판은 헤드라인 → 기사들, 금콩 스터디는 용어 → 면접 질문 */
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

/** 그날 발행된 호들 (아침판·금콩 스터디) */
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
  // 금콩 스터디 = 그날 용어·면접 질문, 아침판 = 아침판으로 적힌 기사
  const where = edition === "noon" ? "section IN ('term', 'question')" : "edition = 'morning' AND section NOT IN ('term', 'question')";
  const res = await client.execute({
    sql: opts.admin
      ? `SELECT ${COLS} FROM news WHERE edition_date = ? AND ${where} ORDER BY position, id`
      : `SELECT ${COLS} FROM news WHERE edition_date = ? AND ${where} AND ${PUBLIC} ORDER BY position, id`,
    args: opts.admin ? [date] : [date, Date.now()],
  });
  return res.rows.map(toItem);
}

/** 목록 한 줄: 호 + 오늘 꼭 알아야 할 3가지(아침판) 또는 용어·질문(금콩 스터디) */
export interface IssueSummary {
  issue: BriefingIssue;
  /** 아침판: 헤드라인 + 앞의 두 기사 / 금콩 스터디: 용어·질문 */
  top: NewsItem[];
  count: number;
  /** 예상 소요 시간 (최대 5분) */
  minutes: number;
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
    return { issue, top, count: issue.edition === "noon" ? c.terms.length + c.questions.length : c.all.length, minutes: briefingMinutes(issue, mine) };
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

/** 바로 앞뒤 호 — 판 상관없이 발행 순서대로 (아침판 → 금콩 스터디 → 다음 날 아침판). 'morning' < 'noon' 이라 글자 순서가 곧 하루 안의 순서 */
export async function adjacentIssues(date: string, edition: IssueEdition): Promise<{ prev: BriefingIssue | null; next: BriefingIssue | null }> {
  const client = await db();
  const now = Date.now();
  const [p, n] = await Promise.all([
    client.execute({
      sql: `SELECT ${ISSUE_COLS} FROM briefing_issues WHERE ${ISSUE_PUBLIC} AND (issue_date < ? OR (issue_date = ? AND edition < ?)) ORDER BY issue_date DESC, edition DESC LIMIT 1`,
      args: [now, date, date, edition],
    }),
    client.execute({
      sql: `SELECT ${ISSUE_COLS} FROM briefing_issues WHERE ${ISSUE_PUBLIC} AND (issue_date > ? OR (issue_date = ? AND edition > ?)) ORDER BY issue_date ASC, edition ASC LIMIT 1`,
      args: [now, date, date, edition],
    }),
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

/** 자동 점검(금콩 스터디 만들 때)이 그날 아침판 기사를 보고 용어·질문을 고를 수 있게 */
export async function morningForAutomation(date: string): Promise<{ issue: BriefingIssue | null; items: NewsItem[] }> {
  const [issue, items] = await Promise.all([getIssue(date, "morning", { admin: true }), issueItems(date, "morning", { admin: true })]);
  return { issue, items };
}

/* ------------------------------------------------------------------ */
/* 발행 — 관리자 '발행' 버튼과 자동 발행이 같이 써요                          */
/* ------------------------------------------------------------------ */

/** 그 호에 실리는 기사 조건 (아침판 = 아침판 기사, 금콩 스터디 = 그날 용어·면접 질문) */
export const ISSUE_ITEMS_WHERE = {
  morning: "edition_date = ? AND edition = 'morning' AND section NOT IN ('term', 'question')",
  noon: "edition_date = ? AND section IN ('term', 'question')",
} as const;

/** 판별 호수(Vol)를 날짜 순서대로 다시 매김 — 발행된 호만 1부터, 초안은 0. 지난 날짜 호를 나중에 발행해도 순서가 맞아요 */
export async function renumberVols(edition: IssueEdition): Promise<void> {
  const client = await db();
  await client.batch(
    [
      {
        sql: `UPDATE briefing_issues SET vol = (SELECT COUNT(*) FROM briefing_issues b WHERE b.edition = briefing_issues.edition AND b.status = 1 AND b.issue_date <= briefing_issues.issue_date)
              WHERE edition = ? AND status = 1`,
        args: [edition],
      },
      { sql: "UPDATE briefing_issues SET vol = 0 WHERE edition = ? AND status = 0", args: [edition] },
    ],
    "write",
  );
}

/** 한 호 발행 — 그 호에 실린 기사 초안도 함께 공개하고, 호수를 다시 매겨요 */
export async function publishIssue(id: number): Promise<boolean> {
  const client = await db();
  const row = (await client.execute({ sql: "SELECT issue_date, edition FROM briefing_issues WHERE id = ?", args: [id] })).rows[0];
  if (!row) return false;
  const date = String(row.issue_date);
  const edition: IssueEdition = isIssueEdition(row.edition) ? row.edition : "morning";
  const now = Date.now();
  await client.batch(
    [
      { sql: "UPDATE briefing_issues SET status = 1, published_at = COALESCE(published_at, ?), updated_at = ? WHERE id = ?", args: [now, now, id] },
      { sql: `UPDATE news SET status = 1, published_at = COALESCE(published_at, ?), updated_at = ? WHERE ${ISSUE_ITEMS_WHERE[edition]} AND status = 0`, args: [now, now, date] },
    ],
    "write",
  );
  await renumberVols(edition);
  return true;
}

const AUTO_PUBLISH_KEY = "briefing:auto-publish";

/** 자동 발행 — 자동 점검이 만든 브리핑(아침 6시·낮 12시 30분)을 확인 없이 바로 발행할지. 기본은 켜짐 */
export async function autoPublishOn(): Promise<boolean> {
  const client = await db();
  const row = (await client.execute({ sql: "SELECT value FROM kv WHERE key = ?", args: [AUTO_PUBLISH_KEY] })).rows[0];
  return row ? String(row.value) !== "0" : true;
}

export async function setAutoPublish(on: boolean): Promise<void> {
  const client = await db();
  await client.execute({
    sql: "INSERT INTO kv (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at",
    args: [AUTO_PUBLISH_KEY, on ? "1" : "0", Date.now()],
  });
}
