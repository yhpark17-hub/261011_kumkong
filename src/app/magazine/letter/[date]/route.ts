import { NextResponse, type NextRequest } from "next/server";
import { isDateKey, letterHref } from "@/lib/news-meta";
import { getIssue } from "@/lib/server/briefing";
import { dbConfigured } from "@/lib/server/db";
import { isAdmin } from "@/lib/server/security";

/**
 * 날짜만 있는 예전 주소 → 그날 아침판 (없으면 금콩 스터디)
 * 화면 안에서 옮기지 않고 HTTP 이동(308/307)으로 보내야 검색엔진도 새 주소로 알아봐요.
 */
export async function GET(req: NextRequest, { params }: RouteContext<"/magazine/letter/[date]">) {
  const { date } = await params;
  const go = (edition: "morning" | "noon", permanent: boolean) =>
    NextResponse.redirect(new URL(letterHref(date, edition), req.url), permanent ? 308 : 307);
  if (isDateKey(date) && dbConfigured()) {
    const admin = await isAdmin();
    // 아침판이 발행돼 있으면 늘 그쪽이라 영구 이동, 금콩 스터디로 보낼 때와 운영자 미리 보기는 임시 이동
    if (await getIssue(date, "morning", { admin }).catch(() => null)) return go("morning", !admin);
    if (await getIssue(date, "noon", { admin }).catch(() => null)) return go("noon", false);
  }
  // 그날 브리핑이 없으면 아침판 주소로 — 거기서 사이트의 '페이지를 찾을 수 없어요' 화면(검색 제외)이 나와요
  // (route 에서 notFound() 를 부르면 빈 404 만 나가서 화면이 달라져요)
  return go("morning", false);
}
