import "server-only";
import type { InValue, Row } from "@libsql/client";
import { NEWS_PAGE_SIZE, isEdition, isNewsSection, type NewsItem, type NewsSection } from "../news-meta";
import { db } from "./db";

/** 데일리 브리핑(뉴스·용어·면접 질문) 조회 — 공개 = status 1 + 발행 시각이 지난 것 */

const PUBLIC = "status = 1 AND published_at <= ?";
const COLS =
  "id, edition_date, edition, section, title, summary, body, point, source_name, source_url, image_url, image_credit, headline, status, origin, published_at, updated_at, views";

function toItem(r: Row): NewsItem {
  const publishedAt = r.published_at == null ? null : Number(r.published_at);
  return {
    id: Number(r.id),
    editionDate: String(r.edition_date),
    edition: isEdition(r.edition) ? r.edition : "",
    section: (isNewsSection(r.section) ? r.section : "policy") as NewsSection,
    title: String(r.title),
    summary: String(r.summary ?? ""),
    body: String(r.body ?? ""),
    point: String(r.point ?? ""),
    sourceName: String(r.source_name ?? ""),
    sourceUrl: (r.source_url as string | null) || null,
    imageUrl: (r.image_url as string | null) || null,
    imageCredit: String(r.image_credit ?? ""),
    headline: Boolean(r.headline),
    status: Number(r.status),
    origin: String(r.origin ?? "admin"),
    publishedAt,
    updatedAt: Number(r.updated_at),
    views: Number(r.views),
    live: Number(r.status) === 1 && publishedAt != null && publishedAt <= Date.now(),
  };
}

/** 공개 뉴스가 있는 가장 최근 날짜 */
export async function latestNewsDate(): Promise<string | null> {
  const client = await db();
  const r = (await client.execute({ sql: `SELECT MAX(edition_date) AS d FROM news WHERE ${PUBLIC}`, args: [Date.now()] })).rows[0];
  return r?.d ? String(r.d) : null;
}

/** 그날의 공개 뉴스 — 헤드라인 먼저, 그다음 발행 순 */
export async function newsByDate(date: string): Promise<NewsItem[]> {
  const client = await db();
  const res = await client.execute({
    sql: `SELECT ${COLS} FROM news WHERE ${PUBLIC} AND edition_date = ? ORDER BY headline DESC, published_at DESC, id DESC`,
    args: [Date.now(), date],
  });
  return res.rows.map(toItem);
}

/** 브리핑 목록 — 카테고리·기간(from~to, 브리핑 날짜 기준)으로 거르고 날짜 최신순 */
export async function listNews(opts: {
  section?: NewsSection | null;
  from?: string | null;
  to?: string | null;
  page?: number;
  pageSize?: number;
  excludeIds?: number[];
}): Promise<{ items: NewsItem[]; total: number }> {
  const client = await db();
  const where = [PUBLIC];
  const args: InValue[] = [Date.now()];
  if (opts.section) {
    where.push("section = ?");
    args.push(opts.section);
  }
  if (opts.from) {
    where.push("edition_date >= ?");
    args.push(opts.from);
  }
  if (opts.to) {
    where.push("edition_date <= ?");
    args.push(opts.to);
  }
  const ex = (opts.excludeIds ?? []).filter((n) => Number.isInteger(n));
  if (ex.length) {
    where.push(`id NOT IN (${ex.map(() => "?").join(",")})`);
    args.push(...ex);
  }
  const pageSize = opts.pageSize ?? NEWS_PAGE_SIZE;
  const page = Math.max(1, opts.page ?? 1);
  const order = "edition_date DESC, headline DESC, published_at DESC, id DESC";
  const [rows, count] = await Promise.all([
    client.execute({
      sql: `SELECT ${COLS} FROM news WHERE ${where.join(" AND ")} ORDER BY ${order} LIMIT ? OFFSET ?`,
      args: [...args, pageSize, (page - 1) * pageSize],
    }),
    client.execute({ sql: `SELECT COUNT(*) AS n FROM news WHERE ${where.join(" AND ")}`, args }),
  ]);
  return { items: rows.rows.map(toItem), total: Number(count.rows[0]?.n ?? 0) };
}

/** 카테고리별 공개 수 (전체 기간) */
export async function newsSectionCounts(): Promise<Map<NewsSection, number>> {
  const client = await db();
  const res = await client.execute({ sql: `SELECT section, COUNT(*) AS n FROM news WHERE ${PUBLIC} GROUP BY section`, args: [Date.now()] });
  const m = new Map<NewsSection, number>();
  for (const r of res.rows) if (isNewsSection(r.section)) m.set(r.section, Number(r.n));
  return m;
}

/** 가장 최근 공개된 그 카테고리 한 건 (오늘의 용어·면접 질문 칸) */
export async function latestInSection(section: NewsSection): Promise<NewsItem | null> {
  const client = await db();
  const res = await client.execute({
    sql: `SELECT ${COLS} FROM news WHERE ${PUBLIC} AND section = ? ORDER BY edition_date DESC, published_at DESC, id DESC LIMIT 1`,
    args: [Date.now(), section],
  });
  return res.rows[0] ? toItem(res.rows[0]) : null;
}

/** 공개 브리핑이 있는 가장 오래된 날짜 (기간 선택 최솟값) */
export async function firstNewsDate(): Promise<string | null> {
  const client = await db();
  const r = (await client.execute({ sql: `SELECT MIN(edition_date) AS d FROM news WHERE ${PUBLIC}`, args: [Date.now()] })).rows[0];
  return r?.d ? String(r.d) : null;
}

/** 그 날짜 앞뒤로 공개 브리핑이 있는 날 */
export async function adjacentNewsDates(date: string): Promise<{ prev: string | null; next: string | null }> {
  const client = await db();
  const now = Date.now();
  const [p, n] = await Promise.all([
    client.execute({ sql: `SELECT MAX(edition_date) AS d FROM news WHERE ${PUBLIC} AND edition_date < ?`, args: [now, date] }),
    client.execute({ sql: `SELECT MIN(edition_date) AS d FROM news WHERE ${PUBLIC} AND edition_date > ?`, args: [now, date] }),
  ]);
  return { prev: p.rows[0]?.d ? String(p.rows[0].d) : null, next: n.rows[0]?.d ? String(n.rows[0].d) : null };
}

/** 날짜별 공개 뉴스 수 (최근 순) */
export async function newsDates(limit = 14): Promise<{ date: string; count: number }[]> {
  const client = await db();
  const res = await client.execute({
    sql: `SELECT edition_date, COUNT(*) AS n FROM news WHERE ${PUBLIC} GROUP BY edition_date ORDER BY edition_date DESC LIMIT ?`,
    args: [Date.now(), limit],
  });
  return res.rows.map((r) => ({ date: String(r.edition_date), count: Number(r.n) }));
}

/** 많이 본 기사 — 최근 days일 발행분 중 조회수 순 */
export async function popularNews(days = 3, limit = 5): Promise<NewsItem[]> {
  const client = await db();
  const now = Date.now();
  const res = await client.execute({
    sql: `SELECT ${COLS} FROM news WHERE ${PUBLIC} AND published_at > ? ORDER BY views DESC, published_at DESC LIMIT ?`,
    args: [now, now - days * 86_400_000, limit],
  });
  return res.rows.map(toItem);
}

export async function getNews(id: number, opts: { admin?: boolean } = {}): Promise<NewsItem | null> {
  const client = await db();
  const res = await client.execute({
    sql: opts.admin ? `SELECT ${COLS} FROM news WHERE id = ?` : `SELECT ${COLS} FROM news WHERE id = ? AND ${PUBLIC}`,
    args: opts.admin ? [id] : [id, Date.now()],
  });
  return res.rows[0] ? toItem(res.rows[0]) : null;
}

/** 같은 카테고리의 최근 항목 (자기 자신 제외) */
export async function sameSectionNews(item: NewsItem, limit = 5): Promise<NewsItem[]> {
  const client = await db();
  const res = await client.execute({
    sql: `SELECT ${COLS} FROM news WHERE ${PUBLIC} AND section = ? AND id != ? ORDER BY published_at DESC LIMIT ?`,
    args: [Date.now(), item.section, item.id, limit],
  });
  return res.rows.map(toItem);
}

export async function incrementNewsViews(id: number): Promise<void> {
  const client = await db();
  await client.execute({ sql: "UPDATE news SET views = views + 1 WHERE id = ?", args: [id] });
}

/** 사이트맵용 */
export async function publishedNewsIndex(): Promise<{ id: number; updatedAt: number }[]> {
  const client = await db();
  const res = await client.execute({ sql: `SELECT id, updated_at FROM news WHERE ${PUBLIC} ORDER BY id DESC LIMIT 5000`, args: [Date.now()] });
  return res.rows.map((r) => ({ id: Number(r.id), updatedAt: Number(r.updated_at) }));
}

/* ------------------------------------------------------------------ */
/* 운영자                                                               */
/* ------------------------------------------------------------------ */

export type AdminNewsFilter = "all" | "draft" | "published";

export async function adminListNews(opts: { filter?: AdminNewsFilter; date?: string | null; q?: string | null; section?: NewsSection | null }): Promise<NewsItem[]> {
  const client = await db();
  const where: string[] = ["1 = 1"];
  const args: InValue[] = [];
  if (opts.filter === "draft") where.push("status = 0");
  if (opts.filter === "published") where.push("status = 1");
  if (opts.date) {
    where.push("edition_date = ?");
    args.push(opts.date);
  }
  if (opts.section) {
    where.push("section = ?");
    args.push(opts.section);
  }
  if (opts.q) {
    where.push("(title LIKE ? OR summary LIKE ?)");
    args.push(`%${opts.q}%`, `%${opts.q}%`);
  }
  const res = await client.execute({
    sql: `SELECT ${COLS} FROM news WHERE ${where.join(" AND ")} ORDER BY edition_date DESC, status ASC, headline DESC, id DESC LIMIT 200`,
    args,
  });
  return res.rows.map(toItem);
}

/** 운영자 대시보드: 오늘 공개 수 · 검토 대기 초안 수 */
export async function newsAdminCounts(today: string): Promise<{ todayPublished: number; drafts: number }> {
  const client = await db();
  const r = (
    await client.execute({
      sql: `SELECT SUM(CASE WHEN status = 1 AND edition_date = ? THEN 1 ELSE 0 END) AS pub, SUM(CASE WHEN status = 0 THEN 1 ELSE 0 END) AS drafts FROM news`,
      args: [today],
    })
  ).rows[0];
  return { todayPublished: Number(r?.pub ?? 0), drafts: Number(r?.drafts ?? 0) };
}
