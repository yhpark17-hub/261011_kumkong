import { connection } from "next/server";
import { parseThumb } from "@/lib/news-meta";
import { getIssueById } from "@/lib/server/briefing";
import { briefingOgImage } from "@/lib/server/briefing-og";
import { isAdmin } from "@/lib/server/security";

/**
 * 관리자 썸네일 미리보기 — 저장하기 전 값(?scene=&costume=&kong=&mood=&bubble=&caption=&topic=)으로 공유 썸네일을 그려 봐요.
 * 운영자만, 어디에도 저장되지 않게 no-store.
 */
export async function GET(req: Request, ctx: RouteContext<"/admin/news/issue/[id]/thumb">) {
  await connection();
  if (!(await isAdmin())) return new Response("운영자 로그인이 필요해요.", { status: 401 });
  const issue = await getIssueById(Number((await ctx.params).id)).catch(() => null);
  if (!issue) return new Response("브리핑을 찾을 수 없어요.", { status: 404 });
  const q = new URL(req.url).searchParams;
  const pick = (k: string) => q.get(k) ?? "";
  const thumb = parseThumb({ ...issue.thumb, scene: pick("scene"), kong: pick("kong"), costume: pick("costume"), mood: pick("mood"), bubble: pick("bubble"), caption: pick("caption"), topic: pick("topic") });
  return briefingOgImage(issue, { thumb, admin: true, headers: { "Cache-Control": "private, no-store" } });
}
