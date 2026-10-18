import "server-only";
import type { Row } from "@libsql/client";
import { TALK_ADMIN_NAME, TALK_PAGE, talkName, type TalkItem } from "../talk-meta";
import { STATUS, db } from "./db";
import { AUTO_HIDE_REPORTS } from "./security";

function toItem(r: Row, examId: string, voter: string | null, reviewers: Set<string>, admin: boolean): TalkItem {
  const v = String(r.voter);
  const isAdmin = Number(r.is_admin) === 1;
  const status = Number(r.status);
  const reports = Number(r.reports);
  const hidden = status === STATUS.hidden ? (reports >= AUTO_HIDE_REPORTS ? "reports" : "admin") : undefined;
  return {
    id: Number(r.id),
    ...(isAdmin ? { name: TALK_ADMIN_NAME, tone: "#533afd" } : talkName(v, examId)),
    // 가린 글: 방문자에게는 내용을 보내지 않아요 (운영자만 원문)
    body: hidden && !admin ? "" : String(r.body),
    createdAt: Number(r.created_at),
    mine: voter != null && v === voter,
    reviewed: !isAdmin && reviewers.has(v),
    admin: isAdmin,
    ...(hidden ? { hidden } : {}),
    ...(admin ? { status, reports } : {}),
  };
}

/**
 * 시험 톡 목록 — 오래된 것부터 (채팅처럼 아래가 최신).
 * after: 그 id 다음 새 글만 / before: 그 id 앞의 옛 글 (더 보기) / 둘 다 없으면 최근 TALK_PAGE 개.
 * 가린 글은 자리만 (운영자는 원문까지), 삭제한 글은 빠져요.
 */
export async function listTalk(
  examId: string,
  { voter = null, admin = false, after, before }: { voter?: string | null; admin?: boolean; after?: number; before?: number } = {},
): Promise<{ items: TalkItem[]; more: boolean }> {
  const client = await db();
  // 가린 글도 자리는 남겨요 (방문자에겐 '가려진 메시지') — 삭제한 글만 빠져요
  const where = [`exam_id = ?`, `status != ${STATUS.deleted}`];
  const args: (string | number)[] = [examId];
  if (after) {
    where.push("id > ?");
    args.push(after);
  }
  if (before) {
    where.push("id < ?");
    args.push(before);
  }
  const newest = !after;
  const res = await client.execute({
    sql: `SELECT id, voter, body, status, reports, is_admin, created_at FROM exam_talk WHERE ${where.join(" AND ")}
          ORDER BY id ${newest ? "DESC" : "ASC"} LIMIT ?`,
    args: [...args, TALK_PAGE + 1],
  });
  const rows = res.rows.slice(0, TALK_PAGE);
  if (newest) rows.reverse();
  // 이 시험에 후기를 남긴 사람 (✓응시 표시)
  const voters = [...new Set(rows.map((r) => String(r.voter)))];
  const reviewers = new Set<string>();
  if (voters.length) {
    const rv = await client.execute({
      sql: `SELECT DISTINCT voter FROM exam_reviews WHERE exam_id = ? AND status != ${STATUS.deleted} AND voter IN (${voters.map(() => "?").join(",")})`,
      args: [examId, ...voters],
    });
    for (const r of rv.rows) reviewers.add(String(r.voter));
  }
  return { items: rows.map((r) => toItem(r, examId, voter, reviewers, admin)), more: res.rows.length > TALK_PAGE };
}

/** 보이는 톡 수 */
export async function talkCount(examId: string): Promise<number> {
  const client = await db();
  const res = await client.execute({ sql: `SELECT COUNT(*) AS n FROM exam_talk WHERE exam_id = ? AND status = ${STATUS.visible}`, args: [examId] });
  return Number(res.rows[0]?.n ?? 0);
}

export async function addTalk(examId: string, voter: string, ipHash: string, body: string, asAdmin = false): Promise<number> {
  const client = await db();
  const res = await client.execute({
    sql: "INSERT INTO exam_talk (exam_id, voter, body, ip_hash, is_admin, created_at) VALUES (?, ?, ?, ?, ?, ?)",
    args: [examId, voter, body, ipHash, asAdmin ? 1 : 0, Date.now()],
  });
  return Number(res.lastInsertRowid);
}

/** 운영자: 톡 가리기·다시 보이기·삭제 (다시 보이면 쌓인 신고도 지워요) */
export async function moderateTalk(examId: string, id: number, op: "hide" | "show" | "delete"): Promise<boolean> {
  const client = await db();
  const status = op === "hide" ? STATUS.hidden : op === "show" ? STATUS.visible : STATUS.deleted;
  const res = await client.execute({
    sql: `UPDATE exam_talk SET status = ?${op === "show" ? ", reports = 0" : ""} WHERE id = ? AND exam_id = ?`,
    args: [status, id, examId],
  });
  if (op === "show") await client.execute({ sql: "DELETE FROM reports WHERE target_type = 'talk' AND target_id = ?", args: [id] });
  return res.rowsAffected > 0;
}

export interface AdminTalkRow {
  id: number;
  examId: string;
  name: string;
  body: string;
  admin: boolean;
  status: number;
  reports: number;
  ipHash: string;
  createdAt: number;
}

/** 운영자 화면: 모든 시험의 톡 (최근 순) — 상태·시험·검색어로 거르기 */
export async function adminTalk({
  status = "all",
  exam = "",
  q = "",
  page = 1,
  size = 50,
}: { status?: "all" | "visible" | "hidden" | "deleted"; exam?: string; q?: string; page?: number; size?: number }): Promise<{ rows: AdminTalkRow[]; total: number }> {
  const client = await db();
  const where: string[] = [];
  const args: (string | number)[] = [];
  if (status === "visible") where.push(`status = ${STATUS.visible}`);
  else if (status === "hidden") where.push(`status = ${STATUS.hidden}`);
  else if (status === "deleted") where.push(`status = ${STATUS.deleted}`);
  else where.push(`status != ${STATUS.deleted}`);
  if (exam) {
    where.push("exam_id = ?");
    args.push(exam);
  }
  if (q) {
    where.push("body LIKE ?");
    args.push(`%${q}%`);
  }
  const w = where.join(" AND ");
  const [rows, count] = await Promise.all([
    client.execute({ sql: `SELECT id, exam_id, voter, body, is_admin, status, reports, ip_hash, created_at FROM exam_talk WHERE ${w} ORDER BY id DESC LIMIT ? OFFSET ?`, args: [...args, size, (page - 1) * size] }),
    client.execute({ sql: `SELECT COUNT(*) AS n FROM exam_talk WHERE ${w}`, args }),
  ]);
  return {
    rows: rows.rows.map((r) => ({
      id: Number(r.id),
      examId: String(r.exam_id),
      name: Number(r.is_admin) === 1 ? TALK_ADMIN_NAME : talkName(String(r.voter), String(r.exam_id)).name,
      body: String(r.body),
      admin: Number(r.is_admin) === 1,
      status: Number(r.status),
      reports: Number(r.reports),
      ipHash: String(r.ip_hash),
      createdAt: Number(r.created_at),
    })),
    total: Number(count.rows[0]?.n ?? 0),
  };
}

/** 운영자 화면: 신고가 들어온 톡 */
export async function reportedTalk() {
  const client = await db();
  const res = await client.execute(`SELECT id, exam_id, body, reports, status, created_at FROM exam_talk WHERE reports > 0 AND status != ${STATUS.deleted} ORDER BY reports DESC, id DESC LIMIT 50`);
  return res.rows.map((r) => ({
    id: Number(r.id),
    examId: String(r.exam_id),
    body: String(r.body),
    reports: Number(r.reports),
    status: Number(r.status),
    createdAt: Number(r.created_at),
  }));
}
