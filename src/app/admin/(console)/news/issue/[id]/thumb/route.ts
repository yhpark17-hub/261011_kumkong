import { connection } from "next/server";
import { parseThumb, type BriefingIssue } from "@/lib/news-meta";
import { getIssueById } from "@/lib/server/briefing";
import { briefingOgImage } from "@/lib/server/briefing-og";
import { isAdmin } from "@/lib/server/security";
import { ART_LIMITS } from "@/lib/thumb-art";

/**
 * 관리자 썸네일 미리보기 — 저장하기 전 값(?scene=&costume=&kong=&mood=&bubble=&caption=&topic=&layout=&stats=)으로 공유 썸네일을 그려 봐요.
 * 직접 그린 그림: ?art=off 면 그림 없이(틀로), POST { art } 면 고치는 중인 그림으로 (주소에 담기엔 길어서).
 * 운영자만, 어디에도 저장되지 않게 no-store.
 */
async function preview(req: Request, ctx: RouteContext<"/admin/news/issue/[id]/thumb">, art?: unknown) {
  await connection();
  if (!(await isAdmin())) return new Response("운영자 로그인이 필요해요.", { status: 401 });
  const issue: BriefingIssue | null = await getIssueById(Number((await ctx.params).id)).catch(() => null);
  if (!issue) return new Response("브리핑을 찾을 수 없어요.", { status: 404 });
  const q = new URL(req.url).searchParams;
  const pick = (k: string) => q.get(k) ?? "";
  const thumb = parseThumb({
    ...issue.thumb,
    scene: pick("scene"),
    kong: pick("kong"),
    costume: pick("costume"),
    mood: pick("mood"),
    bubble: pick("bubble"),
    caption: pick("caption"),
    topic: pick("topic"),
    layout: pick("layout"),
    stats: pick("stats"),
    art: q.get("art") === "off" ? null : art !== undefined ? art : issue.thumb.art,
  });
  return briefingOgImage(issue, { thumb, admin: true, headers: { "Cache-Control": "private, no-store" } });
}

export function GET(req: Request, ctx: RouteContext<"/admin/news/issue/[id]/thumb">) {
  return preview(req, ctx);
}

export async function POST(req: Request, ctx: RouteContext<"/admin/news/issue/[id]/thumb">) {
  const text = (await req.text()).slice(0, ART_LIMITS.svg + 10000);
  let art: unknown = null;
  try {
    art = (JSON.parse(text) as { art?: unknown }).art ?? null;
  } catch {
    art = null;
  }
  return preview(req, ctx, art);
}
