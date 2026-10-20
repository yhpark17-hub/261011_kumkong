import { connection } from "next/server";
import { isMagazineCategory, isThumbScale, parseArticleThumb } from "@/lib/magazine-meta";
import { articleOgImage, fallbackArticleImage } from "@/lib/server/article-og";
import { dbConfigured } from "@/lib/server/db";
import { getArticle } from "@/lib/server/magazine";
import { isAdmin } from "@/lib/server/security";

/**
 * 금융 블로그 글 썸네일 (목록 카드 · 카톡/SNS 미리보기) — 표지를 올리지 않은 글은 모두 이 그림을 써요.
 * 주소에 수정 시각(?v=)이 붙어 글을 고치면 새 주소가 돼요.
 * 운영자는 ?preview=1 에 그림·기관·제목 값을 붙여 저장 전 모습을 미리 볼 수 있어요 (발행 전 글도).
 */
export async function GET(req: Request, ctx: RouteContext<"/magazine/[id]/thumb">) {
  const { id: raw } = await ctx.params;
  await connection();
  const id = Number(raw);
  const admin = dbConfigured() && (await isAdmin());
  const a = Number.isInteger(id) && id > 0 && dbConfigured() ? await getArticle(id, { admin }).catch(() => null) : null;
  const headers: HeadersInit = admin
    ? { "Cache-Control": "private, no-store" }
    : { "Cache-Control": a ? "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800" : "public, max-age=60" };
  if (!a) return fallbackArticleImage(headers);

  const q = new URL(req.url).searchParams;
  // ?s= — 배율 (카드 크기에 맞춘 0.5·0.75 … 공유 미리보기용 2)
  const s = Number(q.get("s") ?? 1);
  const scale = isThumbScale(s) ? s : 1;
  if (admin && q.get("preview") === "1") {
    // 저장 전 값 — 제목·요약·태그·카테고리도 편집 중인 값으로
    const category = q.get("category");
    const draft = {
      ...a,
      title: q.get("title") || a.title,
      summary: q.get("summary") ?? a.summary,
      tags: q.has("tags") ? (q.get("tags") ?? "").split(",").map((t) => t.trim()).filter(Boolean) : a.tags,
      category: isMagazineCategory(category) ? category : a.category,
    };
    const thumb = parseArticleThumb(
      JSON.stringify({ scene: q.get("scene"), company: q.get("company"), kicker: q.get("kicker"), headline: q.get("headline"), sub: q.get("sub"), layout: q.get("layout"), tone: q.get("tone") }),
    );
    return articleOgImage(draft, { thumb, headers, scale });
  }
  return articleOgImage(a, { headers, scale });
}
