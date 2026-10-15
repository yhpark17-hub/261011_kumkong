import { revalidatePath } from "next/cache";
import { addDays, todayKST } from "@/lib/date";
import { editionNow, isNewsSection, kindOf } from "@/lib/news-meta";
import { automationAuthorized, json, unauthorized } from "@/lib/server/automation";
import { db, dbConfigured } from "@/lib/server/db";

/**
 * 데일리 브리핑 초안 올리기 — 항상 '초안 · 자동'으로만 들어가고 운영자가 골라서 공개합니다.
 * body: { edition?: "morning"|"noon", items: [{ section, title, summary, point?, body?, sourceName?, sourceUrl?, headline? }] }
 * - section: finance·economy·policy·global·public(뉴스, 원문 링크 필수) · term(오늘의 용어) · question(면접 질문)
 * - edition 을 빼면 지금 시각으로 정해요 (오전 11시 전 = 아침판)
 * - 같은 날 같은 원문 링크(또는 같은 제목)는 한 번만, 용어는 최근 90일 안에 다룬 것이면 건너뜁니다.
 */
export async function POST(req: Request) {
  if (!automationAuthorized(req)) return unauthorized();
  if (!dbConfigured()) return json({ error: "DB 없음" }, 503);
  const b = (await req.json().catch(() => null)) as { items?: unknown; edition?: unknown } | null;
  const raw = Array.isArray(b?.items) ? b.items.slice(0, 30) : [];
  if (!raw.length) return json({ error: "items 가 비었어요" }, 400);
  const edition = b?.edition === "morning" || b?.edition === "noon" ? b.edition : editionNow();

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
    if (!isNewsSection(section)) {
      results.push({ index: i, status: "invalid", reason: "section 은 finance·economy·policy·global·public·term·question 중 하나" });
      continue;
    }
    const kind = kindOf(section);
    if (title.length < (kind === "term" ? 2 : 4) || summary.length < 20) {
      results.push({ index: i, status: "invalid", reason: "title·summary(20자+) 확인" });
      continue;
    }
    const urlOk = /^https?:\/\/[^\s/]+\.\S+$/i.test(sourceUrl);
    if (kind === "news" && !urlOk) {
      results.push({ index: i, status: "invalid", reason: "뉴스는 sourceUrl(원문 링크)이 필요해요" });
      continue;
    }
    if (kind === "question" && s(it.body, 8000).length < 10) {
      results.push({ index: i, status: "invalid", reason: "면접 질문은 body(답변 뼈대)가 필요해요" });
      continue;
    }
    const dup =
      kind === "term"
        ? await client.execute({
            sql: "SELECT id FROM news WHERE section = 'term' AND title = ? AND edition_date >= ? LIMIT 1",
            args: [title, addDays(date, -90)],
          })
        : kind === "question"
          ? await client.execute({ sql: "SELECT id FROM news WHERE edition_date = ? AND section = 'question' AND title = ? LIMIT 1", args: [date, title] })
          : await client.execute({
              // 면접 질문이 같은 기사를 '관련 뉴스'로 달아도 뉴스 중복으로 보지 않게
              sql: "SELECT id FROM news WHERE edition_date = ? AND section NOT IN ('term', 'question') AND (source_url = ? OR title = ?) LIMIT 1",
              args: [date, sourceUrl, title],
            });
    if (dup.rows.length) {
      results.push({ index: i, id: Number(dup.rows[0].id), status: "duplicate" });
      continue;
    }
    const res = await client.execute({
      sql: `INSERT INTO news (edition_date, edition, section, title, summary, point, body, source_name, source_url, headline, status, origin, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'auto', ?, ?)`,
      args: [
        date,
        edition,
        section,
        title,
        summary,
        s(it.point, 600),
        s(it.body, 8000),
        s(it.sourceName, 60),
        urlOk ? sourceUrl : null,
        it.headline === true && kind === "news" ? 1 : 0,
        now,
        now,
      ],
    });
    results.push({ index: i, id: Number(res.lastInsertRowid), status: "created" });
  }
  revalidatePath("/admin/news");
  return json({ date, edition, results });
}
