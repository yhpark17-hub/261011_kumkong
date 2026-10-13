import { connection } from "next/server";
import { CATEGORY_INFO, MAGAZINE_NAME, MAGAZINE_TAGLINE, articleHref, summaryLines } from "@/lib/magazine-meta";
import { dbConfigured } from "@/lib/server/db";
import { listArticles } from "@/lib/server/magazine";
import { SITE } from "@/lib/site";

/** 매거진 RSS — 피드 구독기·뉴스 앱에서 매일 브리핑을 받아 볼 수 있게 */

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export async function GET() {
  await connection();
  const items = dbConfigured() ? (await listArticles({ pageSize: 30 }).catch(() => ({ items: [] }))).items : [];
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
    (a) => `  <item>
    <title>${esc(a.title)}</title>
    <link>${SITE.url}${articleHref(a.id)}</link>
    <guid isPermaLink="true">${SITE.url}${articleHref(a.id)}</guid>
    <category>${esc(CATEGORY_INFO[a.category].label)}</category>
    <description>${esc(summaryLines(a.summary).join(" · "))}</description>
    ${a.publishedAt ? `<pubDate>${new Date(a.publishedAt).toUTCString()}</pubDate>` : ""}
  </item>`,
  )
  .join("\n")}
</channel>
</rss>`;
  return new Response(xml, {
    headers: { "content-type": "application/rss+xml; charset=utf-8", "cache-control": "public, max-age=600" },
  });
}
