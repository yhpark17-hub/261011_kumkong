import { connection } from "next/server";
import { CATEGORY_INFO, MAGAZINE_NAME, MAGAZINE_TAGLINE, articleHref, summaryLines } from "@/lib/magazine-meta";
import { NEWS_SECTION_INFO, kindOf, newsHref } from "@/lib/news-meta";
import { dbConfigured } from "@/lib/server/db";
import { listArticles } from "@/lib/server/magazine";
import { latestNewsDate, newsByDate } from "@/lib/server/news";
import { SITE } from "@/lib/site";

/** 매거진 RSS — 데일리 브리핑 뉴스 + 금융 블로그 글 (피드 구독기·뉴스 앱용) */

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

interface FeedItem {
  title: string;
  link: string;
  category: string;
  description: string;
  at: number | null;
}

export async function GET() {
  await connection();
  let items: FeedItem[] = [];
  if (dbConfigured()) {
    const [articles, date] = await Promise.all([
      listArticles({ pageSize: 20 }).catch(() => ({ items: [] })),
      latestNewsDate().catch(() => null),
    ]);
    const news = date ? await newsByDate(date).catch(() => []) : [];
    items = [
      ...news.map((n) => ({
        title: kindOf(n.section) === "question" ? `Q. ${n.title}` : kindOf(n.section) === "term" ? `오늘의 용어 · ${n.title}` : n.title,
        link: `${SITE.url}${newsHref(n.id)}`,
        category: `데일리 브리핑 · ${NEWS_SECTION_INFO[n.section].label}`,
        description: n.summary,
        at: n.publishedAt,
      })),
      ...articles.items.map((a) => ({
        title: a.title,
        link: `${SITE.url}${articleHref(a.id)}`,
        category: CATEGORY_INFO[a.category].label,
        description: summaryLines(a.summary).join(" · "),
        at: a.publishedAt,
      })),
    ].sort((a, b) => (b.at ?? 0) - (a.at ?? 0));
  }
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>${esc(`${MAGAZINE_NAME} | ${SITE.name}`)}</title>
  <link>${SITE.url}/magazine</link>
  <atom:link href="${SITE.url}/magazine/rss.xml" rel="self" type="application/rss+xml" />
  <description>${esc(MAGAZINE_TAGLINE)}</description>
  <language>ko</language>
${items
  .map(
    (i) => `  <item>
    <title>${esc(i.title)}</title>
    <link>${i.link}</link>
    <guid isPermaLink="true">${i.link}</guid>
    <category>${esc(i.category)}</category>
    <description>${esc(i.description)}</description>
    ${i.at ? `<pubDate>${new Date(i.at).toUTCString()}</pubDate>` : ""}
  </item>`,
  )
  .join("\n")}
</channel>
</rss>`;
  return new Response(xml, {
    headers: { "content-type": "application/rss+xml; charset=utf-8", "cache-control": "public, max-age=600" },
  });
}
