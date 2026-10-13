import "server-only";
import type { InValue, Row } from "@libsql/client";
import {
  MAGAZINE_PAGE_SIZE,
  isMagazineCategory,
  type ArticleDetail,
  type ArticleSummary,
  type MagazineCategory,
} from "../magazine-meta";
import { db } from "./db";

/**
 * 매거진 조회
 * 공개 글 = 발행 상태이고 발행 시각이 지난 글 (예약 글은 시각이 되면 자동으로 보임)
 */

const SUMMARY_COLS =
  "id, category, title, summary, cover_url, tags, author, read_minutes, featured, status, source, published_at, updated_at, views, likes";

const PUBLIC = "status = 1 AND published_at <= ?";

function toSummary(r: Row): ArticleSummary {
  const publishedAt = r.published_at == null ? null : Number(r.published_at);
  return {
    id: Number(r.id),
    category: (isMagazineCategory(r.category) ? r.category : "knowledge") as MagazineCategory,
    title: String(r.title),
    summary: String(r.summary ?? ""),
    coverUrl: (r.cover_url as string | null) || null,
    tags: String(r.tags ?? "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
    author: String(r.author),
    readMinutes: Number(r.read_minutes) || 1,
    featured: Boolean(r.featured),
    status: Number(r.status),
    live: Number(r.status) === 1 && publishedAt != null && publishedAt <= Date.now(),
    source: String(r.source ?? "admin"),
    publishedAt,
    updatedAt: Number(r.updated_at),
    views: Number(r.views),
    likes: Number(r.likes),
  };
}

export async function listArticles(opts: {
  category?: MagazineCategory | null;
  page?: number;
  pageSize?: number;
  featured?: boolean;
  excludeCategory?: MagazineCategory;
  excludeIds?: number[];
  q?: string | null;
}): Promise<{ items: ArticleSummary[]; total: number }> {
  const client = await db();
  const now = Date.now();
  const pageSize = opts.pageSize ?? MAGAZINE_PAGE_SIZE;
  const page = Math.max(1, opts.page ?? 1);
  const where = [PUBLIC];
  const args: InValue[] = [now];
  if (opts.category) {
    where.push("category = ?");
    args.push(opts.category);
  }
  if (opts.excludeCategory) {
    where.push("category != ?");
    args.push(opts.excludeCategory);
  }
  if (opts.featured) where.push("featured = 1");
  if (opts.excludeIds?.length) {
    where.push(`id NOT IN (${opts.excludeIds.map(() => "?").join(",")})`);
    args.push(...opts.excludeIds);
  }
  if (opts.q) {
    where.push("(title LIKE ? OR summary LIKE ? OR tags LIKE ? OR body LIKE ?)");
    const like = `%${opts.q}%`;
    args.push(like, like, like, like);
  }
  const whereSql = where.join(" AND ");
  const [rows, count] = await Promise.all([
    client.execute({
      sql: `SELECT ${SUMMARY_COLS} FROM articles WHERE ${whereSql} ORDER BY published_at DESC, id DESC LIMIT ? OFFSET ?`,
      args: [...args, pageSize, (page - 1) * pageSize],
    }),
    client.execute({ sql: `SELECT COUNT(*) AS n FROM articles WHERE ${whereSql}`, args }),
  ]);
  return { items: rows.rows.map(toSummary), total: Number(count.rows[0]?.n ?? 0) };
}

/** 카테고리별 공개 글 수 */
export async function categoryCounts(): Promise<Map<MagazineCategory, number>> {
  const client = await db();
  const res = await client.execute({
    sql: `SELECT category, COUNT(*) AS n FROM articles WHERE ${PUBLIC} GROUP BY category`,
    args: [Date.now()],
  });
  const map = new Map<MagazineCategory, number>();
  for (const r of res.rows) if (isMagazineCategory(r.category)) map.set(r.category, Number(r.n));
  return map;
}

/** 공개 글 하나 (운영자는 임시저장·예약 글도 미리 보기) */
export async function getArticle(id: number, opts: { admin?: boolean } = {}): Promise<ArticleDetail | null> {
  const client = await db();
  const res = await client.execute({
    sql: opts.admin
      ? `SELECT ${SUMMARY_COLS}, body FROM articles WHERE id = ?`
      : `SELECT ${SUMMARY_COLS}, body FROM articles WHERE id = ? AND ${PUBLIC}`,
    args: opts.admin ? [id] : [id, Date.now()],
  });
  const r = res.rows[0];
  return r ? { ...toSummary(r), body: String(r.body) } : null;
}

/** 같은 카테고리의 이전·다음 글 (발행 순) */
export async function adjacentArticles(
  a: ArticleSummary,
): Promise<{ prev: ArticleSummary | null; next: ArticleSummary | null }> {
  if (a.publishedAt == null) return { prev: null, next: null };
  const client = await db();
  const now = Date.now();
  const [prev, next] = await Promise.all([
    client.execute({
      sql: `SELECT ${SUMMARY_COLS} FROM articles WHERE ${PUBLIC} AND category = ? AND (published_at < ? OR (published_at = ? AND id < ?))
            ORDER BY published_at DESC, id DESC LIMIT 1`,
      args: [now, a.category, a.publishedAt, a.publishedAt, a.id],
    }),
    client.execute({
      sql: `SELECT ${SUMMARY_COLS} FROM articles WHERE ${PUBLIC} AND category = ? AND (published_at > ? OR (published_at = ? AND id > ?))
            ORDER BY published_at ASC, id ASC LIMIT 1`,
      args: [now, a.category, a.publishedAt, a.publishedAt, a.id],
    }),
  ]);
  return {
    prev: prev.rows[0] ? toSummary(prev.rows[0]) : null,
    next: next.rows[0] ? toSummary(next.rows[0]) : null,
  };
}

/** 함께 읽을 글: 같은 카테고리 최신 → 모자라면 전체 인기 글 */
export async function relatedArticles(a: ArticleSummary, limit = 3): Promise<ArticleSummary[]> {
  const same = await listArticles({ category: a.category, pageSize: limit, excludeIds: [a.id] });
  if (same.items.length >= limit) return same.items;
  const client = await db();
  const exclude = [a.id, ...same.items.map((x) => x.id)];
  const more = await client.execute({
    sql: `SELECT ${SUMMARY_COLS} FROM articles WHERE ${PUBLIC} AND category != 'briefing' AND id NOT IN (${exclude.map(() => "?").join(",")})
          ORDER BY likes * 3 + views DESC LIMIT ?`,
    args: [Date.now(), ...exclude, limit - same.items.length],
  });
  return [...same.items, ...more.rows.map(toSummary)];
}

/** 많이 읽은 글 (최근 30일 발행 중) */
export async function popularArticles(limit = 5): Promise<ArticleSummary[]> {
  const client = await db();
  const now = Date.now();
  const res = await client.execute({
    sql: `SELECT ${SUMMARY_COLS} FROM articles WHERE ${PUBLIC} AND category != 'briefing' AND published_at > ?
          ORDER BY likes * 3 + views DESC, published_at DESC LIMIT ?`,
    args: [now, now - 30 * 86_400_000, limit],
  });
  if (res.rows.length >= Math.min(3, limit)) return res.rows.map(toSummary);
  // 새 글이 적을 때는 기간 제한 없이
  const all = await client.execute({
    sql: `SELECT ${SUMMARY_COLS} FROM articles WHERE ${PUBLIC} AND category != 'briefing' ORDER BY likes * 3 + views DESC, published_at DESC LIMIT ?`,
    args: [now, limit],
  });
  return all.rows.map(toSummary);
}

export async function incrementArticleViews(id: number): Promise<void> {
  const client = await db();
  await client.execute({ sql: "UPDATE articles SET views = views + 1 WHERE id = ?", args: [id] });
}

/** 사이트맵용 */
export async function publishedArticleIndex(): Promise<{ id: number; updatedAt: number }[]> {
  const client = await db();
  const res = await client.execute({ sql: `SELECT id, updated_at FROM articles WHERE ${PUBLIC} ORDER BY id DESC LIMIT 5000`, args: [Date.now()] });
  return res.rows.map((r) => ({ id: Number(r.id), updatedAt: Number(r.updated_at) }));
}

/* ------------------------------------------------------------------ */
/* 운영자                                                               */
/* ------------------------------------------------------------------ */

export type AdminArticleFilter = "all" | "draft" | "scheduled" | "published" | "auto";

export async function adminListArticles(opts: {
  filter?: AdminArticleFilter;
  category?: MagazineCategory | null;
  q?: string | null;
  page?: number;
}): Promise<{ items: ArticleSummary[]; total: number }> {
  const client = await db();
  const now = Date.now();
  const page = Math.max(1, opts.page ?? 1);
  const where: string[] = ["1 = 1"];
  const args: InValue[] = [];
  switch (opts.filter) {
    case "draft":
      where.push("status = 0");
      break;
    case "scheduled":
      where.push("status = 1 AND published_at > ?");
      args.push(now);
      break;
    case "published":
      where.push("status = 1 AND published_at <= ?");
      args.push(now);
      break;
    case "auto":
      where.push("source = 'auto' AND status = 0");
      break;
  }
  if (opts.category) {
    where.push("category = ?");
    args.push(opts.category);
  }
  if (opts.q) {
    where.push("(title LIKE ? OR body LIKE ?)");
    args.push(`%${opts.q}%`, `%${opts.q}%`);
  }
  const whereSql = where.join(" AND ");
  const size = 30;
  const [rows, count] = await Promise.all([
    client.execute({
      sql: `SELECT ${SUMMARY_COLS} FROM articles WHERE ${whereSql}
            ORDER BY CASE WHEN status = 0 THEN 0 ELSE 1 END, COALESCE(published_at, updated_at) DESC, id DESC LIMIT ? OFFSET ?`,
      args: [...args, size, (page - 1) * size],
    }),
    client.execute({ sql: `SELECT COUNT(*) AS n FROM articles WHERE ${whereSql}`, args }),
  ]);
  return { items: rows.rows.map(toSummary), total: Number(count.rows[0]?.n ?? 0) };
}

export async function magazineAdminCounts(): Promise<{
  draft: number;
  auto: number;
  scheduled: number;
  published: number;
  briefingToday: boolean;
}> {
  const client = await db();
  const now = Date.now();
  // 오늘(한국 시각) 0시
  const kstMidnight = Math.floor((now + 9 * 3600_000) / 86_400_000) * 86_400_000 - 9 * 3600_000;
  const res = await client.execute({
    sql: `SELECT
            SUM(CASE WHEN status = 0 THEN 1 ELSE 0 END) AS draft,
            SUM(CASE WHEN status = 0 AND source = 'auto' THEN 1 ELSE 0 END) AS auto,
            SUM(CASE WHEN status = 1 AND published_at > ? THEN 1 ELSE 0 END) AS scheduled,
            SUM(CASE WHEN status = 1 AND published_at <= ? THEN 1 ELSE 0 END) AS published,
            SUM(CASE WHEN status = 1 AND category = 'briefing' AND published_at >= ? AND published_at <= ? THEN 1 ELSE 0 END) AS today
          FROM articles`,
    args: [now, now, kstMidnight, now],
  });
  const r = res.rows[0];
  return {
    draft: Number(r?.draft ?? 0),
    auto: Number(r?.auto ?? 0),
    scheduled: Number(r?.scheduled ?? 0),
    published: Number(r?.published ?? 0),
    briefingToday: Number(r?.today ?? 0) > 0,
  };
}
