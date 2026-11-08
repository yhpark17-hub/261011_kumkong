"use server";

import { db } from "@/lib/server/db";
import { incrementArticleViews } from "@/lib/server/magazine";
import { incrementIssueViews } from "@/lib/server/briefing";
import { incrementNewsViews } from "@/lib/server/news";
import { isAdmin, rateLimit, requester } from "@/lib/server/security";

/** '도움돼요' — 같은 사람(IP)은 글마다 한 번 */
export async function likeArticle(id: number): Promise<{ likes: number; already: boolean }> {
  if (!Number.isInteger(id)) return { likes: 0, already: false };
  const client = await db();
  const who = await requester();
  const exists = await client.execute({
    sql: "SELECT likes FROM articles WHERE id = ? AND status = 1 AND published_at <= ?",
    args: [id, Date.now()],
  });
  if (!exists.rows.length) return { likes: 0, already: false };
  const ins = await client.execute({ sql: "INSERT OR IGNORE INTO article_likes (article_id, voter) VALUES (?, ?)", args: [id, who.hash] });
  if (ins.rowsAffected) await client.execute({ sql: "UPDATE articles SET likes = likes + 1 WHERE id = ?", args: [id] });
  const row = (await client.execute({ sql: "SELECT likes FROM articles WHERE id = ?", args: [id] })).rows[0];
  return { likes: Number(row?.likes ?? 0), already: !ins.rowsAffected };
}

/** 조회수: 같은 IP 는 글마다 30분에 한 번만 (운영자는 세지 않음) */
export async function recordArticleView(id: number): Promise<void> {
  if (!Number.isInteger(id) || (await isAdmin())) return;
  const who = await requester();
  if (await rateLimit(`aview:${id}`, who.hash, 1800)) await incrementArticleViews(id);
}

/** 데일리 브리핑 추천 — 같은 사람(IP)은 호마다 한 번 */
export async function likeIssue(id: number): Promise<{ likes: number; already: boolean }> {
  if (!Number.isInteger(id)) return { likes: 0, already: false };
  const client = await db();
  const who = await requester();
  const exists = await client.execute({ sql: "SELECT likes FROM briefing_issues WHERE id = ? AND status = 1 AND published_at <= ?", args: [id, Date.now()] });
  if (!exists.rows.length) return { likes: 0, already: false };
  const ins = await client.execute({ sql: "INSERT OR IGNORE INTO issue_likes (issue_id, voter) VALUES (?, ?)", args: [id, who.hash] });
  if (ins.rowsAffected) await client.execute({ sql: "UPDATE briefing_issues SET likes = likes + 1 WHERE id = ?", args: [id] });
  const row = (await client.execute({ sql: "SELECT likes FROM briefing_issues WHERE id = ?", args: [id] })).rows[0];
  return { likes: Number(row?.likes ?? 0), already: !ins.rowsAffected };
}

/** 점심 3문제 — 보기마다 고른 사람 수 (문제 순서대로) */
export interface DrillTally {
  /** 문제마다 보기별 인원 */
  counts: number[][];
}

async function publishedDrill(issueId: number): Promise<number[] | null> {
  const client = await db();
  const row = (await client.execute({ sql: "SELECT extras FROM briefing_issues WHERE id = ? AND status = 1 AND published_at <= ?", args: [issueId, Date.now()] })).rows[0];
  if (!row) return null;
  try {
    const drill = (JSON.parse(String(row.extras)) as { drill?: { questions?: { options?: unknown[] }[] } }).drill;
    const qs = Array.isArray(drill?.questions) ? drill.questions : [];
    return qs.length ? qs.map((q) => (Array.isArray(q.options) ? Math.min(q.options.length, 5) : 0)) : null;
  } catch {
    return null;
  }
}

async function tally(issueId: number, sizes: number[]): Promise<DrillTally> {
  const client = await db();
  const rows = (await client.execute({ sql: "SELECT q, choice, COUNT(*) AS n FROM drill_answers WHERE issue_id = ? GROUP BY q, choice", args: [issueId] })).rows;
  const counts = sizes.map((n) => Array.from({ length: n }, () => 0));
  for (const r of rows) {
    const q = Number(r.q);
    const c = Number(r.choice);
    if (counts[q] && c >= 0 && c < counts[q].length) counts[q][c] = Number(r.n);
  }
  return { counts };
}

/** 점심 3문제 답 저장 — 같은 사람(IP)은 문제마다 첫 답만 세요 (운영자 답은 세지 않음). 다른 독자들의 보기별 인원을 돌려줘요 */
export async function answerDrill(issueId: number, q: number, choice: number): Promise<DrillTally | null> {
  if (!Number.isInteger(issueId) || !Number.isInteger(q) || !Number.isInteger(choice)) return null;
  const sizes = await publishedDrill(issueId);
  if (!sizes || q < 0 || q >= sizes.length || choice < 0 || choice >= sizes[q]) return null;
  if (!(await isAdmin())) {
    const who = await requester();
    const client = await db();
    await client.execute({ sql: "INSERT OR IGNORE INTO drill_answers (issue_id, q, voter, choice, at) VALUES (?, ?, ?, ?, ?)", args: [issueId, q, who.hash, choice, Date.now()] });
  }
  return tally(issueId, sizes);
}

/** 이미 푼 문제를 다시 열었을 때 — 보기별 인원만 */
export async function drillTally(issueId: number): Promise<DrillTally | null> {
  if (!Number.isInteger(issueId)) return null;
  const sizes = await publishedDrill(issueId);
  return sizes ? tally(issueId, sizes) : null;
}

/** 레터 조회수 — 같은 IP 는 호마다 30분에 한 번, 운영자는 세지 않음 */
export async function recordIssueView(id: number): Promise<void> {
  if (!Number.isInteger(id) || (await isAdmin())) return;
  const who = await requester();
  if (await rateLimit(`iview:${id}`, who.hash, 1800)) await incrementIssueViews(id);
}

/** 뉴스 조회수 (많이 본 뉴스 순위용) — 같은 IP 는 뉴스마다 30분에 한 번, 운영자는 세지 않음 */
export async function recordNewsView(id: number): Promise<void> {
  if (!Number.isInteger(id) || (await isAdmin())) return;
  const who = await requester();
  if (await rateLimit(`nview:${id}`, who.hash, 1800)) await incrementNewsViews(id);
}
