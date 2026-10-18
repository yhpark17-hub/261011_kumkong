import { connection } from "next/server";
import { isDateKey, isIssueEdition } from "@/lib/news-meta";
import { getIssue } from "@/lib/server/briefing";
import { briefingOgImage, fallbackOgImage } from "@/lib/server/briefing-og";
import { dbConfigured } from "@/lib/server/db";
import { OG_SIZE } from "@/lib/server/og";
import { isAdmin } from "@/lib/server/security";
import { SITE } from "@/lib/site";

/**
 * 데일리 브리핑 공유 썸네일 (카톡·SNS 미리보기)
 * 금콩 브리핑은 그날 주제로 변장한 콩이 만화, 금콩 스터디는 공책 템플릿 + 오늘의 논술 주제.
 * 운영자가 /admin/news 에서 변장·말풍선·주제를 고치거나 그림을 직접 올릴 수 있어요 (그리는 코드는 lib/server/briefing-og).
 */

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "금콩 데일리 브리핑";

export default async function Image({ params }: { params: Promise<{ date: string; edition: string }> }) {
  const { date, edition } = await params;
  await connection(); // 발행 여부·썸네일 설정이 바뀌면 바로 반영 (요청 때 그림)
  // 운영자가 관리자 화면에서 볼 때는 발행 전 초안도 그려 보여 줘요 (그 그림은 어디에도 저장되지 않게 no-store)
  const admin = dbConfigured() && (await isAdmin());
  const issue = isDateKey(date) && isIssueEdition(edition) && dbConfigured() ? await getIssue(date, edition, { admin }).catch(() => null) : null;
  // 공개 그림은 잠깐 캐시 (사이트 표지로도 쓰여서 매번 새로 그리지 않게) — 주소에 수정 시각(?v=)이 붙어 고치면 새 주소가 돼요
  const headers: HeadersInit = admin ? { "Cache-Control": "private, no-store" } : { "Cache-Control": issue ? "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400" : "public, max-age=60" };
  if (!issue) return fallbackOgImage(headers);

  // 운영자가 직접 올린 그림이 있으면 그걸 그대로
  if (issue.thumb.shareUrl) {
    const src = issue.thumb.shareUrl.startsWith("/") ? new URL(issue.thumb.shareUrl, SITE.url).toString() : issue.thumb.shareUrl;
    const res = await fetch(src).catch(() => null);
    if (res?.ok) return new Response(await res.arrayBuffer(), { headers: { ...headers, "Content-Type": res.headers.get("content-type") ?? "image/png" } });
  }
  return briefingOgImage(issue, { admin, headers });
}
