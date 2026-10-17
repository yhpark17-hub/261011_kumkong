import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { COMPANIES, getRecruitment } from "@/lib/data";
import { articleHref } from "@/lib/magazine-meta";
import { letterHref } from "@/lib/news-meta";
import { publishedIssueIndex } from "@/lib/server/briefing";
import { dbConfigured } from "@/lib/server/db";
import { publishedArticleIndex } from "@/lib/server/magazine";
import { publishedNewsIndex } from "@/lib/server/news";
import { examCounts, listExams } from "@/lib/server/reviews";
import { SITE } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection(); // 새 매거진 글이 바로 반영되도록 요청 때마다 생성
  const latest = COMPANIES.map((c) => getRecruitment(c.id)?.updatedAt)
    .filter((d): d is string => Boolean(d))
    .sort()
    .at(-1);
  // 매거진 글 (DB 가 없거나 잠시 안 되면 빼고 만듦)
  const articles = dbConfigured() ? await publishedArticleIndex().catch(() => []) : [];
  const news = dbConfigured() ? await publishedNewsIndex().catch(() => []) : [];
  const letters = dbConfigured() ? await publishedIssueIndex().catch(() => []) : [];
  // 필기 후기는 후기가 하나라도 있는 시험만 (빈 페이지를 검색엔진에 내지 않게) — DB 를 못 읽으면 예전처럼 전부
  const reviewCounts = dbConfigured() ? await examCounts().catch(() => null) : null;

  return [
    { url: SITE.url, lastModified: latest, changeFrequency: "daily", priority: 1 },
    { url: `${SITE.url}/companies`, lastModified: latest, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE.url}/reviews`, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE.url}/board`, changeFrequency: "hourly", priority: 0.7 },
    { url: `${SITE.url}/board/policy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE.url}/magazine`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE.url}/magazine/archive`, changeFrequency: "daily", priority: 0.6 },
    { url: `${SITE.url}/magazine/blog`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE.url}/about`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE.url}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    ...COMPANIES.map((c) => ({
      url: `${SITE.url}/companies/${c.id}`,
      lastModified: getRecruitment(c.id)?.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...listExams()
      .filter((e) => !e.expected && (!reviewCounts || (reviewCounts.get(e.id)?.n ?? 0) > 0))
      .map((e) => ({
        url: `${SITE.url}/reviews/${e.id}`,
        changeFrequency: "daily" as const,
        priority: 0.6,
      })),
    ...articles.map((a) => ({
      url: `${SITE.url}${articleHref(a.id)}`,
      lastModified: new Date(a.updatedAt),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...letters.map((i) => ({
      url: `${SITE.url}${letterHref(i.date, i.edition)}`,
      lastModified: new Date(i.updatedAt),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...news.map((n) => ({
      url: `${SITE.url}/magazine/news/${n.id}`,
      lastModified: new Date(n.updatedAt),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
  ];
}
