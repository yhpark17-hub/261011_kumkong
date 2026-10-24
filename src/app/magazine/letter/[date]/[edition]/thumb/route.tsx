import { connection } from "next/server";
import { isDateKey, isIssueEdition, isIssueThumbScale } from "@/lib/news-meta";
import { getIssue } from "@/lib/server/briefing";
import { briefingOgImage, fallbackOgImage } from "@/lib/server/briefing-og";
import { dbConfigured } from "@/lib/server/db";
import { isAdmin } from "@/lib/server/security";

/**
 * 데일리 브리핑 썸네일 — 사이트 화면(브리핑 목록·카드)용. 카톡 공유 그림(opengraph-image)과 같은 그림을
 * 카드 크기에 맞는 배율(?s=0.5~2)로 그려요. 주소에 수정 시각(?v=)이 붙어 고치면 새 주소가 돼요.
 */
export async function GET(req: Request, ctx: RouteContext<"/magazine/letter/[date]/[edition]/thumb">) {
  const { date, edition } = await ctx.params;
  await connection();
  const admin = dbConfigured() && (await isAdmin());
  const issue = isDateKey(date) && isIssueEdition(edition) && dbConfigured() ? await getIssue(date, edition, { admin }).catch(() => null) : null;
  const headers: HeadersInit = admin
    ? { "Cache-Control": "private, no-store" }
    : { "Cache-Control": issue ? "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800" : "public, max-age=60" };
  if (!issue) return fallbackOgImage(headers);
  const s = Number(new URL(req.url).searchParams.get("s") ?? 1);
  return briefingOgImage(issue, { admin, headers, scale: isIssueThumbScale(s) ? s : 1 });
}
