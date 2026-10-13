import { revalidatePath } from "next/cache";
import { automationAuthorized, json, unauthorized } from "@/lib/server/automation";
import { db, dbConfigured } from "@/lib/server/db";
import { computeReadMinutes, isMagazineCategory, kstDateKey, parseTags } from "@/lib/magazine-meta";

/**
 * 매거진 초안 올리기 (데일리 브리핑 등) — 항상 '임시저장 · 자동 초안'으로만 들어가고,
 * 운영자가 확인·수정한 뒤 발행해야 공개됩니다. 같은 날·같은 판(edition)의 자동 초안은 하나만.
 * body: { category, title, summary, body, tags?, edition?: "morning" | "noon" }
 */
export async function POST(req: Request) {
  if (!automationAuthorized(req)) return unauthorized();
  if (!dbConfigured()) return json({ error: "DB 없음" }, 503);
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const category = b?.category;
  const title = typeof b?.title === "string" ? b.title.trim().slice(0, 120) : "";
  const summary = typeof b?.summary === "string" ? b.summary.trim().slice(0, 600) : "";
  const body = typeof b?.body === "string" ? b.body.replace(/\r\n?/g, "\n").trim().slice(0, 60000) : "";
  const tags = typeof b?.tags === "string" ? parseTags(b.tags).join(",") : Array.isArray(b?.tags) ? parseTags(b.tags.join(",")).join(",") : "";
  if (!isMagazineCategory(category) || title.length < 2 || body.length < 20) {
    return json({ error: "category·title·body 를 확인해 주세요" }, 400);
  }

  const client = await db();
  const now = Date.now();
  const edition = b?.edition === "morning" || b?.edition === "noon" ? b.edition : "daily";
  const key = `auto-draft:${category}:${kstDateKey(now)}:${edition}`;
  const claim = await client.execute({ sql: "INSERT OR IGNORE INTO kv (key, value, updated_at) VALUES (?, '', ?)", args: [key, now] });
  if (!claim.rowsAffected) return json({ skipped: true, reason: "오늘 같은 판의 자동 초안이 이미 있어요" });

  const res = await client.execute({
    sql: `INSERT INTO articles (category, title, summary, body, tags, author, read_minutes, status, featured, source, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, '금콩 에디터', ?, 0, 0, 'auto', ?, ?)`,
    args: [category, title, summary, body, tags, computeReadMinutes(body), now, now],
  });
  const id = Number(res.lastInsertRowid);
  await client.execute({ sql: "UPDATE kv SET value = ? WHERE key = ?", args: [String(id), key] });
  revalidatePath("/admin/magazine");
  return json({ id, editUrl: `/admin/magazine/${id}` });
}
