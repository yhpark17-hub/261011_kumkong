import "server-only";
import type { Row } from "@libsql/client";
import { isFeedbackKind, type FeedbackItem } from "../feedback-meta";
import { db } from "./db";

/** feedback.status: 0 = 새 제보, 1 = 처리 완료, 2 = 삭제 */
export const FEEDBACK_STATUS = { open: 0, done: 1, deleted: 2 } as const;

function toItem(r: Row): FeedbackItem {
  return {
    id: Number(r.id),
    kind: isFeedbackKind(r.kind) ? r.kind : "site",
    topic: (r.topic as string | null) ?? null,
    companyId: (r.company_id as string | null) ?? null,
    companyName: (r.company_name as string | null) ?? null,
    page: (r.page as string | null) ?? null,
    body: String(r.body),
    sourceUrl: (r.source_url as string | null) ?? null,
    contact: (r.contact as string | null) ?? null,
    status: Number(r.status),
    createdAt: Number(r.created_at),
    handledAt: r.handled_at == null ? null : Number(r.handled_at),
  };
}

/** 운영자 화면: 새 제보 전부 + 최근 처리한 것 일부 */
export async function listFeedback(doneLimit = 20): Promise<{ open: FeedbackItem[]; done: FeedbackItem[] }> {
  const client = await db();
  const [open, done] = await Promise.all([
    client.execute({ sql: "SELECT * FROM feedback WHERE status = ? ORDER BY id DESC LIMIT 200", args: [FEEDBACK_STATUS.open] }),
    client.execute({
      sql: "SELECT * FROM feedback WHERE status = ? ORDER BY handled_at DESC LIMIT ?",
      args: [FEEDBACK_STATUS.done, doneLimit],
    }),
  ]);
  return { open: open.rows.map(toItem), done: done.rows.map(toItem) };
}

export async function openFeedbackCount(): Promise<number> {
  const client = await db();
  const res = await client.execute({ sql: "SELECT COUNT(*) AS n FROM feedback WHERE status = ?", args: [FEEDBACK_STATUS.open] });
  return Number(res.rows[0]?.n ?? 0);
}
