import "server-only";
import type { Row } from "@libsql/client";
import { TALK_PAGE, talkName, type TalkItem } from "../talk-meta";
import { STATUS, db } from "./db";

function toItem(r: Row, examId: string, voter: string | null, reviewers: Set<string>, admin: boolean): TalkItem {
  const v = String(r.voter);
  return {
    id: Number(r.id),
    ...talkName(v, examId),
    body: String(r.body),
    createdAt: Number(r.created_at),
    mine: voter != null && v === voter,
    reviewed: reviewers.has(v),
    ...(admin ? { status: Number(r.status), reports: Number(r.reports) } : {}),
  };
}

/**
 * 시험 톡 목록 — 오래된 것부터 (채팅처럼 아래가 최신).
 * after: 그 id 다음 새 글만 / before: 그 id 앞의 옛 글 (더 보기) / 둘 다 없으면 최근 TALK_PAGE 개.
 * 운영자는 숨긴 글도 함께 (삭제 제외).
 */
export async function listTalk(
  examId: string,
  { voter = null, admin = false, after, before }: { voter?: string | null; admin?: boolean; after?: number; before?: number } = {},
): Promise<{ items: TalkItem[]; more: boolean }> {
  const client = await db();
  const where = [`exam_id = ?`, admin ? `status != ${STATUS.deleted}` : `status = ${STATUS.visible}`];
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
    sql: `SELECT id, voter, body, status, reports, created_at FROM exam_talk WHERE ${where.join(" AND ")}
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

export async function addTalk(examId: string, voter: string, ipHash: string, body: string): Promise<number> {
  const client = await db();
  const res = await client.execute({
    sql: "INSERT INTO exam_talk (exam_id, voter, body, ip_hash, created_at) VALUES (?, ?, ?, ?, ?)",
    args: [examId, voter, body, ipHash, Date.now()],
  });
  return Number(res.lastInsertRowid);
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
