import { revalidatePath } from "next/cache";
import { addDays, todayKST } from "@/lib/date";
import { isDateKey, isIssueEdition, thumbVersion } from "@/lib/news-meta";
import { automationAuthorized, json, unauthorized } from "@/lib/server/automation";
import { getIssue } from "@/lib/server/briefing";
import { artOgImage } from "@/lib/server/briefing-og";
import { db, dbConfigured } from "@/lib/server/db";
import { checkArt, issueCorpus } from "@/lib/server/thumb-check";
import { ART_LIMITS, parseArt } from "@/lib/thumb-art";

/**
 * 데일리 브리핑 썸네일 '직접 그린 그림' 미리보기·고치기 (자동 점검용)
 *
 * { edition: "morning"|"noon", date?: 오늘(기본)·어제, art: { svg, texts, brand }, preview?: true }
 *   - preview: true → 저장하지 않고 PNG 로 그려서 돌려줘요. 확인할 거리는 x-thumb-warnings 머리글(JSON, URL 인코딩)에
 *     (그 호가 이미 있으면 글자 속 숫자·따옴표 말이 본문에 있는지도 확인해요)
 *   - preview 없이 → 이미 올린 그 호의 썸네일 그림을 바꿔요. 숫자·따옴표 말이 본문에 없으면 거절
 */
export async function POST(req: Request) {
  if (!automationAuthorized(req)) return unauthorized();
  if (!dbConfigured()) return json({ error: "DB 없음" }, 503);
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!b) return json({ error: "JSON 본문이 필요해요" }, 400);
  const edition = b.edition;
  if (!isIssueEdition(edition)) return json({ ok: false, errors: ['edition 은 "morning" 또는 "noon" 이에요'] }, 400);
  const today = todayKST();
  const date = isDateKey(b.date) ? b.date : today;
  if (date !== today && date !== addDays(today, -1)) return json({ ok: false, errors: ["오늘·어제 호만 그릴 수 있어요"] }, 400);
  if (typeof b.art === "object" && JSON.stringify(b.art).length > ART_LIMITS.svg + 10000) return json({ ok: false, errors: ["art 가 너무 길어요"] }, 400);
  const art = parseArt(b.art);
  if (!art) return json({ ok: false, errors: ["art 를 읽을 수 없어요 — svg(도형, 글자 없이)·texts·brand 를 확인해 주세요"] }, 400);

  const issue = await getIssue(date, edition, { admin: true });
  const { problems, long } = issue ? checkArt(art, await issueCorpus(issue)) : { problems: [], long: [] };
  const notes = [...problems, ...long.map((t) => `칸보다 긴 글자: ${t}`), ...(issue ? [] : ["이 날짜·판 호가 아직 없어 숫자·따옴표 확인은 올릴 때 해요"])];

  if (b.preview === true)
    return artOgImage({ date, edition }, art, { headers: { "Cache-Control": "no-store", "x-thumb-warnings": encodeURIComponent(JSON.stringify(notes)) } });

  if (!issue) return json({ ok: false, errors: ["이 날짜·판 호가 없어요 — 먼저 issue 로 올려 주세요"] }, 404);
  if (problems.length) return json({ ok: false, errors: problems }, 400);
  const now = Date.now();
  const client = await db();
  await client.execute({ sql: "UPDATE briefing_issues SET thumb = ?, updated_at = ? WHERE id = ?", args: [JSON.stringify({ ...issue.thumb, art }), now, issue.id] });
  revalidatePath("/admin/news");
  revalidatePath("/magazine");
  revalidatePath("/magazine/archive");
  revalidatePath("/magazine/letter/[date]/[edition]", "page");
  revalidatePath("/");
  return json({
    ok: true,
    date,
    edition,
    image: `/magazine/letter/${date}/${edition}/opengraph-image?v=${thumbVersion({ updatedAt: now })}`,
    ...(long.length ? { warnings: long.map((t) => `칸보다 긴 글자: ${t}`) } : {}),
  });
}
