import { connection } from "next/server";
import { todayKST } from "@/lib/date";
import { isAlertKind, runAlerts } from "@/lib/server/app-push";
import { dbConfigured } from "@/lib/server/db";

/**
 * 앱 일정 알림 크론 — vercel.json: d1 = 매일 00시 UTC(한국 오전 9시) 내일 일정, d0 = 23시 UTC(한국 오전 8시) 오늘 일정.
 * Vercel이 'Authorization: Bearer CRON_SECRET'을 붙여 불러요 (환경변수가 없으면 아무것도 안 해요). ?dry=1 = 보낼 것만 세기
 */
export async function GET(req: Request, ctx: RouteContext<"/api/app/v1/cron/alerts/[kind]">) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return new Response("Unauthorized", { status: 401 });
  const { kind } = await ctx.params;
  if (!isAlertKind(kind)) return new Response("Not found", { status: 404 });
  if (!dbConfigured()) return Response.json({ error: "DB 없음" }, { status: 503 });

  await connection();
  const dry = new URL(req.url).searchParams.get("dry") === "1";
  const result = await runAlerts(kind, todayKST(), { dry });
  return Response.json(result);
}
