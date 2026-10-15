"use server";

import { db } from "@/lib/server/db";
import { incrementArticleViews } from "@/lib/server/magazine";
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

/** 뉴스 조회수 (많이 본 뉴스 순위용) — 같은 IP 는 뉴스마다 30분에 한 번, 운영자는 세지 않음 */
export async function recordNewsView(id: number): Promise<void> {
  if (!Number.isInteger(id) || (await isAdmin())) return;
  const who = await requester();
  if (await rateLimit(`nview:${id}`, who.hash, 1800)) await incrementNewsViews(id);
}
