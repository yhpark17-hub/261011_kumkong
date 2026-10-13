import "server-only";
import type { Row } from "@libsql/client";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { isBoardCategory, type BoardCategory } from "../board-meta";
import { db } from "./db";
import { isAdmin } from "./security";

/** 운영자 화면 전용 조회 — 숨김·삭제된 것까지 모두 봅니다 */

/** 운영자 페이지 맨 앞에서 호출 — 로그인이 안 돼 있으면 로그인 화면으로 */
export async function requireAdmin(): Promise<void> {
  await connection();
  if (!(await isAdmin())) redirect("/admin/login");
}

export const ADMIN_PAGE_SIZE = 30;

export type StatusFilter = "all" | "visible" | "hidden" | "deleted";
const STATUS_WHERE: Record<StatusFilter, string> = {
  all: "1 = 1",
  visible: "status = 0",
  hidden: "status = 1",
  deleted: "status = 2",
};

export function parseStatus(v: string | undefined): StatusFilter {
  return v === "visible" || v === "hidden" || v === "deleted" || v === "all" ? v : "all";
}

const excerpt = (s: unknown, n = 120) => String(s ?? "").replace(/\s+/g, " ").trim().slice(0, n);

export interface AdminPost {
  id: number;
  category: BoardCategory;
  companyId: string | null;
  title: string;
  excerpt: string;
  nickname: string;
  ipPrefix: string;
  ipHash: string;
  isAdmin: boolean;
  isNotice: boolean;
  views: number;
  likes: number;
  commentCount: number;
  reports: number;
  status: number;
  createdAt: number;
}

function toPost(r: Row): AdminPost {
  return {
    id: Number(r.id),
    category: isBoardCategory(r.category) ? r.category : "free",
    companyId: (r.company_id as string | null) ?? null,
    title: String(r.title),
    excerpt: excerpt(r.body),
    nickname: String(r.nickname),
    ipPrefix: String(r.ip_prefix),
    ipHash: String(r.ip_hash),
    isAdmin: Boolean(r.is_admin),
    isNotice: Boolean(r.is_notice),
    views: Number(r.views),
    likes: Number(r.likes),
    commentCount: Number(r.comment_count),
    reports: Number(r.reports),
    status: Number(r.status),
    createdAt: Number(r.created_at),
  };
}

export async function adminPosts(opts: { status: StatusFilter; q?: string | null; ip?: string | null; page: number }) {
  const client = await db();
  const where = [STATUS_WHERE[opts.status]];
  const args: (string | number)[] = [];
  if (opts.q) {
    where.push("(title LIKE ? OR body LIKE ? OR nickname LIKE ?)");
    args.push(`%${opts.q}%`, `%${opts.q}%`, `%${opts.q}%`);
  }
  if (opts.ip) {
    where.push("ip_hash = ?");
    args.push(opts.ip);
  }
  const w = where.join(" AND ");
  const [rows, count] = await Promise.all([
    client.execute({
      sql: `SELECT * FROM posts WHERE ${w} ORDER BY id DESC LIMIT ? OFFSET ?`,
      args: [...args, ADMIN_PAGE_SIZE, (opts.page - 1) * ADMIN_PAGE_SIZE],
    }),
    client.execute({ sql: `SELECT COUNT(*) AS n FROM posts WHERE ${w}`, args }),
  ]);
  return { rows: rows.rows.map(toPost), total: Number(count.rows[0]?.n ?? 0) };
}

export interface AdminComment {
  id: number;
  postId: number;
  postTitle: string;
  body: string;
  nickname: string;
  ipPrefix: string;
  ipHash: string;
  isAdmin: boolean;
  reports: number;
  status: number;
  createdAt: number;
}

export async function adminComments(opts: { status: StatusFilter; q?: string | null; ip?: string | null; page: number }) {
  const client = await db();
  const where = [STATUS_WHERE[opts.status].replace("status", "c.status")];
  const args: (string | number)[] = [];
  if (opts.q) {
    where.push("(c.body LIKE ? OR c.nickname LIKE ?)");
    args.push(`%${opts.q}%`, `%${opts.q}%`);
  }
  if (opts.ip) {
    where.push("c.ip_hash = ?");
    args.push(opts.ip);
  }
  const w = where.join(" AND ");
  const [rows, count] = await Promise.all([
    client.execute({
      sql: `SELECT c.*, p.title AS post_title FROM comments c LEFT JOIN posts p ON p.id = c.post_id
            WHERE ${w} ORDER BY c.id DESC LIMIT ? OFFSET ?`,
      args: [...args, ADMIN_PAGE_SIZE, (opts.page - 1) * ADMIN_PAGE_SIZE],
    }),
    client.execute({ sql: `SELECT COUNT(*) AS n FROM comments c WHERE ${w}`, args }),
  ]);
  return {
    rows: rows.rows.map(
      (r): AdminComment => ({
        id: Number(r.id),
        postId: Number(r.post_id),
        postTitle: String(r.post_title ?? "(삭제된 글)"),
        body: String(r.body),
        nickname: String(r.nickname),
        ipPrefix: String(r.ip_prefix),
        ipHash: String(r.ip_hash),
        isAdmin: Boolean(r.is_admin),
        reports: Number(r.reports),
        status: Number(r.status),
        createdAt: Number(r.created_at),
      }),
    ),
    total: Number(count.rows[0]?.n ?? 0),
  };
}

export interface AdminReview {
  id: number;
  examId: string;
  overall: number;
  timePressure: number;
  track: string | null;
  oneLiner: string | null;
  detail: string | null;
  ipHash: string;
  reports: number;
  status: number;
  createdAt: number;
}

export async function adminReviews(opts: {
  status: StatusFilter;
  q?: string | null;
  exam?: string | null;
  textOnly?: boolean;
  page: number;
}) {
  const client = await db();
  const where = [STATUS_WHERE[opts.status]];
  const args: (string | number)[] = [];
  if (opts.q) {
    where.push("(one_liner LIKE ? OR detail LIKE ?)");
    args.push(`%${opts.q}%`, `%${opts.q}%`);
  }
  if (opts.exam) {
    where.push("exam_id = ?");
    args.push(opts.exam);
  }
  if (opts.textOnly) where.push("(one_liner IS NOT NULL OR detail IS NOT NULL)");
  const w = where.join(" AND ");
  const [rows, count] = await Promise.all([
    client.execute({
      sql: `SELECT * FROM exam_reviews WHERE ${w} ORDER BY id DESC LIMIT ? OFFSET ?`,
      args: [...args, ADMIN_PAGE_SIZE, (opts.page - 1) * ADMIN_PAGE_SIZE],
    }),
    client.execute({ sql: `SELECT COUNT(*) AS n FROM exam_reviews WHERE ${w}`, args }),
  ]);
  return {
    rows: rows.rows.map(
      (r): AdminReview => ({
        id: Number(r.id),
        examId: String(r.exam_id),
        overall: Number(r.overall),
        timePressure: Number(r.time_pressure),
        track: (r.track as string | null) ?? null,
        oneLiner: (r.one_liner as string | null) ?? null,
        detail: (r.detail as string | null) ?? null,
        ipHash: String(r.ip_hash),
        reports: Number(r.reports),
        status: Number(r.status),
        createdAt: Number(r.created_at),
      }),
    ),
    total: Number(count.rows[0]?.n ?? 0),
  };
}

export interface BanRow {
  ipHash: string;
  reason: string | null;
  sample: string | null;
  createdAt: number;
  posts: number;
  comments: number;
}

export async function listBans(): Promise<BanRow[]> {
  const client = await db();
  const res = await client.execute(`
    SELECT b.*, (SELECT COUNT(*) FROM posts WHERE ip_hash = b.ip_hash) AS posts,
           (SELECT COUNT(*) FROM comments WHERE ip_hash = b.ip_hash) AS comments
    FROM bans b ORDER BY created_at DESC LIMIT 200`);
  return res.rows.map((r) => ({
    ipHash: String(r.ip_hash),
    reason: (r.reason as string | null) ?? null,
    sample: (r.sample as string | null) ?? null,
    createdAt: Number(r.created_at),
    posts: Number(r.posts),
    comments: Number(r.comments),
  }));
}

/** 차단 여부를 한 번에 확인 (목록에 '차단됨' 표시용) */
export async function bannedSet(hashes: string[]): Promise<Set<string>> {
  if (!hashes.length) return new Set();
  const client = await db();
  const unique = [...new Set(hashes)];
  const res = await client.execute({
    sql: `SELECT ip_hash FROM bans WHERE ip_hash IN (${unique.map(() => "?").join(",")})`,
    args: unique,
  });
  return new Set(res.rows.map((r) => String(r.ip_hash)));
}

export async function dashboardCounts() {
  const client = await db();
  const day = Date.now() - 24 * 60 * 60 * 1000;
  const res = await client.execute({
    sql: `SELECT
      (SELECT COUNT(*) FROM posts WHERE status != 2) AS posts,
      (SELECT COUNT(*) FROM posts WHERE created_at > ?) AS posts24,
      (SELECT COUNT(*) FROM comments WHERE created_at > ?) AS comments24,
      (SELECT COUNT(*) FROM exam_reviews WHERE status != 2) AS reviews,
      (SELECT COUNT(*) FROM exam_reviews WHERE created_at > ?) AS reviews24,
      (SELECT COUNT(*) FROM feedback WHERE status = 0) AS open_feedback,
      (SELECT COUNT(*) FROM posts WHERE reports > 0 AND status != 2)
        + (SELECT COUNT(*) FROM comments WHERE reports > 0 AND status != 2)
        + (SELECT COUNT(*) FROM exam_reviews WHERE reports > 0 AND status != 2) AS reported,
      (SELECT COUNT(*) FROM posts WHERE status = 1) + (SELECT COUNT(*) FROM comments WHERE status = 1)
        + (SELECT COUNT(*) FROM exam_reviews WHERE status = 1) AS hidden,
      (SELECT COUNT(*) FROM bans) AS bans`,
    args: [day, day, day],
  });
  const r = res.rows[0];
  const n = (k: string) => Number(r?.[k] ?? 0);
  return {
    posts: n("posts"),
    posts24: n("posts24"),
    comments24: n("comments24"),
    reviews: n("reviews"),
    reviews24: n("reviews24"),
    openFeedback: n("open_feedback"),
    reported: n("reported"),
    hidden: n("hidden"),
    bans: n("bans"),
  };
}
