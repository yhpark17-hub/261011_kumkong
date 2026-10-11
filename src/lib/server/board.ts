import "server-only";
import type { Row } from "@libsql/client";
import { PAGE_SIZE, isBoardCategory, type BoardCategory, type CommentItem, type PostDetail, type PostSummary } from "../board-meta";
import { STATUS, db } from "./db";

const SUMMARY_COLS =
  "id, category, company_id, title, nickname, ip_prefix, is_admin, is_notice, views, likes, comment_count, status, created_at";

function toSummary(r: Row): PostSummary {
  return {
    id: Number(r.id),
    category: (isBoardCategory(r.category) ? r.category : "free") as BoardCategory,
    companyId: (r.company_id as string | null) ?? null,
    title: String(r.title),
    nickname: String(r.nickname),
    ipPrefix: String(r.ip_prefix),
    isAdmin: Boolean(r.is_admin),
    isNotice: Boolean(r.is_notice),
    views: Number(r.views),
    likes: Number(r.likes),
    commentCount: Number(r.comment_count),
    status: Number(r.status),
    createdAt: Number(r.created_at),
  };
}

export async function listPosts(opts: {
  category?: BoardCategory | null;
  page?: number;
  q?: string | null;
  bestOnly?: boolean;
  companyId?: string | null;
}): Promise<{ notices: PostSummary[]; posts: PostSummary[]; total: number }> {
  const client = await db();
  const page = Math.max(1, opts.page ?? 1);
  const where: string[] = ["status = ?"];
  const args: (string | number)[] = [STATUS.visible];
  if (opts.category) {
    where.push("category = ?");
    args.push(opts.category);
  } else if (!opts.companyId) {
    // 공지는 맨 위에 따로 고정 (기관별로 볼 때는 그 기관 글이면 공지도 목록에 포함)
    where.push("is_notice = 0");
  }
  if (opts.companyId) {
    where.push("company_id = ?");
    args.push(opts.companyId);
  }
  if (opts.q) {
    where.push("(title LIKE ? OR body LIKE ?)");
    args.push(`%${opts.q}%`, `%${opts.q}%`);
  }
  if (opts.bestOnly) where.push("likes >= 5");
  const whereSql = where.join(" AND ");

  const [rows, count, notices] = await Promise.all([
    client.execute({
      sql: `SELECT ${SUMMARY_COLS} FROM posts WHERE ${whereSql} ORDER BY id DESC LIMIT ? OFFSET ?`,
      args: [...args, PAGE_SIZE, (page - 1) * PAGE_SIZE],
    }),
    client.execute({ sql: `SELECT COUNT(*) AS n FROM posts WHERE ${whereSql}`, args }),
    !opts.category && !opts.q && !opts.companyId && page === 1
      ? client.execute({
          sql: `SELECT ${SUMMARY_COLS} FROM posts WHERE status = ? AND is_notice = 1 ORDER BY id DESC LIMIT 5`,
          args: [STATUS.visible],
        })
      : Promise.resolve(null),
  ]);
  return {
    notices: notices ? notices.rows.map(toSummary) : [],
    posts: rows.rows.map(toSummary),
    total: Number(count.rows[0]?.n ?? 0),
  };
}

export async function getPost(id: number): Promise<PostDetail | null> {
  const client = await db();
  const res = await client.execute({
    sql: `SELECT ${SUMMARY_COLS}, body, reports FROM posts WHERE id = ? AND status != ?`,
    args: [id, STATUS.deleted],
  });
  const r = res.rows[0];
  if (!r) return null;
  return { ...toSummary(r), body: String(r.body), reports: Number(r.reports) };
}

export async function getPostSecret(id: number): Promise<{ pwHash: string | null; isAdmin: boolean } | null> {
  const client = await db();
  const res = await client.execute({ sql: "SELECT pw_hash, is_admin FROM posts WHERE id = ? AND status != ?", args: [id, STATUS.deleted] });
  const r = res.rows[0];
  return r ? { pwHash: (r.pw_hash as string | null) ?? null, isAdmin: Boolean(r.is_admin) } : null;
}

export async function listComments(postId: number, includeHidden: boolean): Promise<CommentItem[]> {
  const client = await db();
  const res = await client.execute({
    sql: `SELECT id, body, nickname, ip_prefix, is_admin, status, created_at FROM comments
          WHERE post_id = ? AND status ${includeHidden ? "!= 2" : "= 0"} ORDER BY id`,
    args: [postId],
  });
  return res.rows.map((r) => ({
    id: Number(r.id),
    body: String(r.body),
    nickname: String(r.nickname),
    ipPrefix: String(r.ip_prefix),
    isAdmin: Boolean(r.is_admin),
    status: Number(r.status),
    createdAt: Number(r.created_at),
  }));
}

export async function incrementViews(id: number) {
  const client = await db();
  await client.execute({ sql: "UPDATE posts SET views = views + 1 WHERE id = ?", args: [id] });
}

/** 기관별 공개 글 수 (기관 필터 목록에 표시) */
export async function companyPostCounts(): Promise<Record<string, number>> {
  const client = await db();
  const res = await client.execute({
    sql: "SELECT company_id, COUNT(*) AS n FROM posts WHERE status = ? AND company_id IS NOT NULL GROUP BY company_id",
    args: [STATUS.visible],
  });
  return Object.fromEntries(res.rows.map((r) => [String(r.company_id), Number(r.n)]));
}

export async function recentPostsForCompany(companyId: string, limit = 5): Promise<PostSummary[]> {
  const client = await db();
  const res = await client.execute({
    sql: `SELECT ${SUMMARY_COLS} FROM posts WHERE company_id = ? AND status = ? ORDER BY id DESC LIMIT ?`,
    args: [companyId, STATUS.visible, limit],
  });
  return res.rows.map(toSummary);
}

/** 운영자 화면: 신고가 들어온 글·댓글 */
export async function reportedItems() {
  const client = await db();
  const [posts, comments] = await Promise.all([
    client.execute(`SELECT ${SUMMARY_COLS}, reports FROM posts WHERE reports > 0 AND status != 2 ORDER BY reports DESC, id DESC LIMIT 50`),
    client.execute(
      "SELECT id, post_id, body, nickname, ip_prefix, reports, status, created_at FROM comments WHERE reports > 0 AND status != 2 ORDER BY reports DESC, id DESC LIMIT 50",
    ),
  ]);
  return {
    posts: posts.rows.map((r) => ({ ...toSummary(r), reports: Number(r.reports) })),
    comments: comments.rows.map((r) => ({
      id: Number(r.id),
      postId: Number(r.post_id),
      body: String(r.body),
      nickname: String(r.nickname),
      ipPrefix: String(r.ip_prefix),
      reports: Number(r.reports),
      status: Number(r.status),
      createdAt: Number(r.created_at),
    })),
  };
}
