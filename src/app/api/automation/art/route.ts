import { addDays, todayKST } from "@/lib/date";
import { isDateKey, isIssueEdition } from "@/lib/news-meta";
import { artConfigured, generateArt, imageKind } from "@/lib/server/art-gen";
import { automationAuthorized, json, unauthorized } from "@/lib/server/automation";
import { db, dbConfigured } from "@/lib/server/db";
import { saveFile, storageConfigured } from "@/lib/server/storage";

/** 그림 한 장에 10~40초 */
export const maxDuration = 120;

/** 하루(호 날짜)에 그릴 수 있는 그림 수 — 비용 상한 */
const DAILY_CAP = 8;

/**
 * 데일리 브리핑 그림 그리기 (자동 점검용) — 그날 문제·기사에 맞춘 새 그림 한 장
 *
 * POST { edition: "noon"|"morning", date?: 오늘(기본)·어제, name: "cover", scene: "장면 설명(영어)", layout?: "thumb"|"full", id?: true }
 *   → { ok, url } — url 을 점심 3문제 drill.cover 등에 넣어요. 그림체·색·선은 서버가 붙여요 (scene 에는 무엇을 그릴지만)
 *   layout "thumb"(기본) = 왼쪽 절반을 비운 썸네일 바탕 · id: true = 장면에 적은 국기·짧은 영어 낱말만 그려도 됨
 *   GEMINI_API_KEY 가 없으면 503 — 그때는 기본 점심 그림(art)으로 대신해요
 * GET → 최근 그림 14장의 장면 설명 (어제·그제와 다른 그림을 고르게)
 */
export async function POST(req: Request) {
  if (!automationAuthorized(req)) return unauthorized();
  if (!dbConfigured()) return json({ error: "DB 없음" }, 503);
  if (!artConfigured()) return json({ ok: false, errors: ["그림 키(GEMINI_API_KEY)가 사이트에 없어요 — 이번엔 기본 점심 그림(art)으로 대신해 주세요"] }, 503);
  if (!storageConfigured()) return json({ ok: false, errors: ["파일 저장소가 없어요 — 기본 점심 그림(art)으로 대신해 주세요"] }, 503);
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!b) return json({ error: "JSON 본문이 필요해요" }, 400);
  const edition = b.edition;
  if (!isIssueEdition(edition)) return json({ ok: false, errors: ['edition 은 "morning" 또는 "noon" 이에요'] }, 400);
  const today = todayKST();
  const date = isDateKey(b.date) ? b.date : today;
  if (date !== today && date !== addDays(today, -1)) return json({ ok: false, errors: ["오늘·어제 호 그림만 그려요"] }, 400);
  const name = typeof b.name === "string" && /^[a-z0-9-]{1,24}$/.test(b.name) ? b.name : "";
  if (!name) return json({ ok: false, errors: ["name 은 영어 소문자·숫자·- 24자 안 (예: cover)"] }, 400);
  const scene = typeof b.scene === "string" ? b.scene.replace(/\s+/g, " ").trim() : "";
  if (scene.length < 60 || scene.length > 1500) return json({ ok: false, errors: ["scene 은 60~1500자 장면 설명이에요 (누가·어디서·무엇을·주인공 소품)"] }, 400);
  const layout = b.layout === "full" ? "full" : "thumb";

  const client = await db();
  const used = Number((await client.execute({ sql: "SELECT COUNT(*) AS n FROM briefing_art WHERE issue_date = ?", args: [date] })).rows[0]?.n ?? 0);
  if (used >= DAILY_CAP) return json({ ok: false, errors: [`${date} 그림은 ${DAILY_CAP}장까지예요 — 이미 그린 그림을 써 주세요`] }, 429);

  let img: Buffer;
  try {
    img = await generateArt(scene, { layout, id: b.id === true });
  } catch (e) {
    return json({ ok: false, errors: [`그림을 못 그렸어요: ${e instanceof Error ? e.message : String(e)} — 장면을 바꿔 한 번 더, 안 되면 기본 점심 그림(art)으로`] }, 502);
  }
  const kind = imageKind(img);
  const url = await saveFile("magazine", kind.ext, kind.mime, img);
  await client.execute({
    sql: "INSERT INTO briefing_art (issue_date, edition, name, url, prompt, created_at) VALUES (?, ?, ?, ?, ?, ?)",
    args: [date, edition, name, url, scene, Date.now()],
  });
  return json({ ok: true, date, edition, name, url, left: DAILY_CAP - used - 1 });
}

export async function GET(req: Request) {
  if (!automationAuthorized(req)) return unauthorized();
  if (!dbConfigured()) return json({ error: "DB 없음" }, 503);
  const client = await db();
  const rows = (await client.execute("SELECT issue_date, edition, name, prompt FROM briefing_art ORDER BY id DESC LIMIT 14")).rows;
  return json({
    configured: artConfigured(),
    recent: rows.map((r) => ({ date: String(r.issue_date), edition: String(r.edition), name: String(r.name), scene: String(r.prompt).slice(0, 300) })),
  });
}
