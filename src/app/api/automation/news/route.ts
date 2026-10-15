import { revalidatePath } from "next/cache";
import { todayKST } from "@/lib/date";
import { isNewsSection } from "@/lib/news-meta";
import { automationAuthorized, json, unauthorized } from "@/lib/server/automation";
import { db, dbConfigured } from "@/lib/server/db";

/**
 * 데일리 브리핑 뉴스 초안 올리기 — 항상 '초안 · 자동'으로만 들어가고 운영자가 골라서 공개합니다.
 * body: { items: [{ section, title, summary, point?, body?, sourceName, sourceUrl, headline? }] }
 * 같은 날 같은 원문 링크(또는 같은 제목)는 한 번만 들어갑니다.
 */
export async function POST(req: Request) {
  if (!automationAuthorized(req)) return unauthorized();
  if (!dbConfigured()) return json({ error: "DB 없음" }, 503);
  const b = (await req.json().catch(() => null)) as { items?: unknown } | null;
  const raw = Array.isArray(b?.items) ? b.items.slice(0, 30) : [];
  if (!raw.length) return json({ error: "items 가 비었어요" }, 400);

  const client = await db();
  const date = todayKST();
  const now = Date.now();
  const s = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/\r\n?/g, "\n").trim().slice(0, max) : "");
  const results: { index: number; id?: number; status: "created" | "duplicate" | "invalid"; reason?: string }[] = [];

  for (let i = 0; i < raw.length; i++) {
    const it = (raw[i] ?? {}) as Record<string, unknown>;
    const section = it.section;
    const title = s(it.title, 140);
    const summary = s(it.summary, 1500);
    const sourceUrl = s(it.sourceUrl, 500);
    if (!isNewsSection(section) || title.length < 4 || summary.length < 20) {
      results.push({ index: i, status: "invalid", reason: "section·title(4자+)·summary(20자+) 확인" });
      continue;
    }
    if (!/^https?:\/\/[^\s/]+\.\S+$/i.test(sourceUrl)) {
      results.push({ index: i, status: "invalid", reason: "sourceUrl(원문 링크)이 필요해요" });
      continue;
    }
    const dup = await client.execute({
      sql: "SELECT id FROM news WHERE edition_date = ? AND (source_url = ? OR title = ?) LIMIT 1",
      args: [date, sourceUrl, title],
    });
    if (dup.rows.length) {
      results.push({ index: i, id: Number(dup.rows[0].id), status: "duplicate" });
      continue;
    }
    const res = await client.execute({
      sql: `INSERT INTO news (edition_date, section, title, summary, point, body, source_name, source_url, headline, status, origin, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'auto', ?, ?)`,
      args: [date, section, title, summary, s(it.point, 600), s(it.body, 8000), s(it.sourceName, 60), sourceUrl, it.headline === true ? 1 : 0, now, now],
    });
    results.push({ index: i, id: Number(res.lastInsertRowid), status: "created" });
  }
  revalidatePath("/admin/news");
  return json({ date, results });
}
