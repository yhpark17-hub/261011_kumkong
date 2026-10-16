import { revalidatePath } from "next/cache";
import { addDays, todayKST } from "@/lib/date";
import { isNewsSection, kindOf } from "@/lib/news-meta";
import { automationAuthorized, json, unauthorized } from "@/lib/server/automation";
import { db, dbConfigured } from "@/lib/server/db";

/**
 * 데일리 브리핑 레터 초안 한 호 올리기 — 항상 '초안 · 자동'으로만 들어가고 운영자가 확인 후 발행합니다.
 *
 * body: {
 *   title, lede, closing?,
 *   items: [
 *     { section: finance|economy|policy|global|public, tier: "headline"|"key"|"brief", title, takeaway, summary, point?, sourceName, sourceUrl },
 *     { section: "term", title, summary, point, sourceName?, sourceUrl? },
 *     { section: "question", title, summary, body(답변 뼈대), point, sourceName?, sourceUrl? }
 *   ]
 * }
 * - 뉴스: headline 정확히 1건, key 1~3건, brief 0~6건. 모든 뉴스는 원문 링크(sourceUrl)와 한 줄 요약(takeaway) 필수
 * - 용어·면접 질문 각 1건 필수. 용어는 최근 90일 안에 다룬 것이면 거절
 * - 그날 레터가 이미 있으면 아무것도 바꾸지 않고 skipped
 * 항목 순서 = 배열 순서. 하나라도 틀리면 아무것도 저장하지 않고 errors 를 돌려줍니다.
 */

type Raw = Record<string, unknown>;
const MAX = { headline: 1, key: 3, brief: 6 } as const;

export async function POST(req: Request) {
  if (!automationAuthorized(req)) return unauthorized();
  if (!dbConfigured()) return json({ error: "DB 없음" }, 503);
  const b = (await req.json().catch(() => null)) as Raw | null;
  if (!b) return json({ error: "JSON 본문이 필요해요" }, 400);

  const s = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/\r\n?/g, "\n").trim().slice(0, max) : "");
  const url = (v: unknown) => {
    const u = s(v, 500);
    return /^https?:\/\/[^\s/]+\.\S+$/i.test(u) ? u : null;
  };
  const date = todayKST();
  const title = s(b.title, 120);
  const lede = s(b.lede, 1200);
  const closing = s(b.closing, 400);
  const raw = Array.isArray(b.items) ? (b.items as Raw[]).slice(0, 20) : [];

  const errors: string[] = [];
  if (title.length < 4) errors.push("title(레터 제목)이 필요해요");
  if (lede.length < 30) errors.push("lede(오늘의 흐름)를 30자 이상 써 주세요");

  const counts = { headline: 0, key: 0, brief: 0, term: 0, question: 0 };
  const rows = raw.map((it, i) => {
    const section = it.section;
    const where = `items[${i}]`;
    if (!isNewsSection(section)) {
      errors.push(`${where}: section 이 올바르지 않아요`);
      return null;
    }
    const kind = kindOf(section);
    const row = {
      section,
      title: s(it.title, 140),
      summary: s(it.summary, 1500),
      point: s(it.point, 600),
      body: s(it.body, 8000),
      takeaway: s(it.takeaway, 160),
      sourceName: s(it.sourceName, 60),
      sourceUrl: url(it.sourceUrl),
      headline: 0,
      tier: "key" as "key" | "brief",
      position: i,
    };
    if (row.title.length < (kind === "term" ? 2 : 4)) errors.push(`${where}: title 이 너무 짧아요`);
    if (row.summary.length < 20) errors.push(`${where}: summary 를 20자 이상 써 주세요`);
    if (kind === "news") {
      const tier = it.tier === "headline" || it.tier === "key" || it.tier === "brief" ? it.tier : null;
      if (!tier) errors.push(`${where}: tier 는 headline·key·brief 중 하나예요`);
      else {
        counts[tier]++;
        row.headline = tier === "headline" ? 1 : 0;
        row.tier = tier === "brief" ? "brief" : "key";
      }
      if (!row.sourceUrl) errors.push(`${where}: 뉴스는 sourceUrl(직접 연 원문 링크)이 필요해요`);
      if (row.takeaway.length < 8) errors.push(`${where}: takeaway(한 줄 요약)가 필요해요`);
    } else {
      counts[kind]++;
      if (kind === "question" && row.body.length < 10) errors.push(`${where}: 면접 질문은 body(답변 뼈대)가 필요해요`);
    }
    return row;
  });

  if (counts.headline !== 1) errors.push(`헤드라인(tier: headline)은 정확히 1건이어야 해요 (지금 ${counts.headline}건)`);
  if (counts.key < 1 || counts.key > MAX.key) errors.push(`핵심 기사(tier: key)는 1~${MAX.key}건이에요 (지금 ${counts.key}건)`);
  if (counts.brief > MAX.brief) errors.push(`한 줄 뉴스(tier: brief)는 ${MAX.brief}건까지예요 (지금 ${counts.brief}건)`);
  if (counts.term !== 1) errors.push(`오늘의 용어(section: term)는 1건이어야 해요 (지금 ${counts.term}건)`);
  if (counts.question !== 1) errors.push(`면접 질문(section: question)은 1건이어야 해요 (지금 ${counts.question}건)`);

  const client = await db();
  const existing = await client.execute({ sql: "SELECT id, status FROM briefing_issues WHERE issue_date = ?", args: [date] });
  if (existing.rows.length) {
    return json({ date, skipped: true, issueId: Number(existing.rows[0].id), reason: "오늘 레터가 이미 있어요" });
  }

  const term = rows.find((r) => r?.section === "term");
  if (term) {
    const dup = await client.execute({
      sql: "SELECT id FROM news WHERE section = 'term' AND title = ? AND edition_date >= ? LIMIT 1",
      args: [term.title, addDays(date, -90)],
    });
    if (dup.rows.length) errors.push(`오늘의 용어 '${term.title}'는 최근 90일 안에 다뤘어요. 다른 용어를 골라 주세요`);
  }
  if (errors.length) return json({ date, ok: false, errors }, 400);

  const now = Date.now();
  const stmts = [
    {
      sql: "INSERT INTO briefing_issues (issue_date, title, lede, closing, status, origin, created_at, updated_at) VALUES (?, ?, ?, ?, 0, 'auto', ?, ?)",
      args: [date, title, lede, closing, now, now],
    },
    ...rows
      .filter((r): r is NonNullable<typeof r> => Boolean(r))
      .map((r) => ({
        sql: `INSERT INTO news (edition_date, edition, section, title, summary, point, body, source_name, source_url, tier, position, takeaway, headline, status, origin, created_at, updated_at)
              VALUES (?, 'morning', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'auto', ?, ?)`,
        args: [date, r.section, r.title, r.summary, r.point, r.body, r.sourceName, r.sourceUrl, r.tier, r.position, r.takeaway, r.headline, now, now],
      })),
  ];
  const res = await client.batch(stmts, "write");
  revalidatePath("/admin/news");
  return json({ date, ok: true, issueId: Number(res[0].lastInsertRowid), items: stmts.length - 1 });
}
