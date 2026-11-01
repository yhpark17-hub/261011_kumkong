import { BLOG_CATEGORIES, articleHref, articleThumbUrl, isBlogCategory, summaryLines } from "@/lib/magazine-meta";
import { absUrl, appJson } from "@/lib/server/app-api";
import { dbConfigured } from "@/lib/server/db";
import { categoryCounts, listArticles } from "@/lib/server/magazine";

/**
 * 앱: 금융 블로그(매거진 글) 목록 — ?category=(없으면 전체) ?page= ?sort=latest|popular
 * 글 본문은 앱이 웹 화면(webUrl)으로 열어요 (위젯·전체 화면 가이드가 많아서).
 */
const PAGE_SIZE = 20;

export async function GET(req: Request) {
  if (!dbConfigured()) return appJson({ error: "글을 준비 중이에요" }, { status: 503 });
  const sp = new URL(req.url).searchParams;
  const c = sp.get("category");
  const category = isBlogCategory(c) ? c : null;
  const page = Math.max(1, Number(sp.get("page")) || 1);
  const sort = sp.get("sort") === "popular" ? "popular" : "latest";

  const [{ items, total }, counts] = await Promise.all([
    listArticles({ category, categories: category ? undefined : BLOG_CATEGORIES.map((x) => x.key), page, pageSize: PAGE_SIZE, sort }),
    categoryCounts(),
  ]);
  return appJson(
    {
      page,
      total,
      pageSize: PAGE_SIZE,
      categories: BLOG_CATEGORIES.map((x) => ({ key: x.key, label: x.label, count: counts.get(x.key) ?? 0 })),
      items: items.map((a) => ({
        id: a.id,
        category: a.category,
        categoryLabel: BLOG_CATEGORIES.find((x) => x.key === a.category)?.label ?? "",
        title: a.title,
        summary: summaryLines(a.summary),
        badge: a.badge,
        readMinutes: a.readMinutes,
        publishedAt: a.publishedAt,
        views: a.views,
        likes: a.likes,
        // 목록 썸네일은 0.5배(600폭)면 충분
        image: absUrl(a.coverUrl || articleThumbUrl(a, 0.5))!,
        webUrl: absUrl(articleHref(a.id))!,
      })),
    },
    { headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600" } },
  );
}
