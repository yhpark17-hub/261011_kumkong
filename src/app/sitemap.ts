import type { MetadataRoute } from "next";
import { COMPANIES, getRecruitment } from "@/lib/data";
import { listExams } from "@/lib/server/reviews";
import { SITE } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const latest = COMPANIES.map((c) => getRecruitment(c.id)?.updatedAt)
    .filter((d): d is string => Boolean(d))
    .sort()
    .at(-1);

  return [
    { url: SITE.url, lastModified: latest, changeFrequency: "daily", priority: 1 },
    { url: `${SITE.url}/companies`, lastModified: latest, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE.url}/reviews`, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE.url}/board`, changeFrequency: "hourly", priority: 0.7 },
    { url: `${SITE.url}/board/policy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE.url}/guide`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE.url}/about`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE.url}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    ...COMPANIES.map((c) => ({
      url: `${SITE.url}/companies/${c.id}`,
      lastModified: getRecruitment(c.id)?.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...listExams()
      .filter((e) => !e.expected)
      .map((e) => ({
        url: `${SITE.url}/reviews/${e.id}`,
        changeFrequency: "daily" as const,
        priority: 0.6,
      })),
  ];
}
