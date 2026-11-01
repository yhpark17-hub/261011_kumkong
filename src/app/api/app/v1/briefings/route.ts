import { NEWS_SECTION_INFO } from "@/lib/news-meta";
import { appJson } from "@/lib/server/app-api";
import { appIssue } from "@/lib/server/app-briefing";
import { listIssues } from "@/lib/server/briefing";
import { dbConfigured } from "@/lib/server/db";

/** 앱: 지난 브리핑 목록 (최신 호부터, ?page=) */
const PAGE_SIZE = 20;

export async function GET(req: Request) {
  if (!dbConfigured()) return appJson({ error: "브리핑을 준비 중이에요" }, { status: 503 });
  const page = Math.max(1, Number(new URL(req.url).searchParams.get("page")) || 1);
  const { items, total } = await listIssues({ page, pageSize: PAGE_SIZE });
  return appJson(
    {
      page,
      total,
      pageSize: PAGE_SIZE,
      items: items.map((s) => ({
        ...appIssue(s.issue, s.minutes),
        count: s.count,
        top: s.top.map((n) => ({ id: n.id, title: n.title, section: n.section, sectionLabel: NEWS_SECTION_INFO[n.section].label })),
      })),
    },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } },
  );
}
