import { appJson } from "@/lib/server/app-api";
import { deviceExists, isPushToken, pushToExpo } from "@/lib/server/app-push";
import { dbConfigured } from "@/lib/server/db";
import { rateLimit } from "@/lib/server/security";

/** 앱 설정의 '테스트 알림' — 등록된 기기에만, 기기마다 1분에 한 번 */
export async function POST(req: Request) {
  if (!dbConfigured()) return appJson({ error: "준비 중이에요" }, { status: 503 });
  const b = (await req.json().catch(() => null)) as { token?: unknown } | null;
  if (!b || !isPushToken(b.token) || !(await deviceExists(b.token))) return appJson({ error: "등록된 기기가 아니에요" }, { status: 400 });
  if (!(await rateLimit("app-test-push", b.token, 60))) return appJson({ error: "1분 뒤에 다시 보내 주세요" }, { status: 429 });
  const [ticket] = await pushToExpo([
    {
      to: b.token,
      title: "금콩 알림이 이렇게 와요",
      body: "관심 기관 일정을 전날 오전 9시와 당일 오전 8시에 알려 드릴게요.",
      data: { path: "/" },
      sound: "default",
      channelId: "alerts",
      priority: "high",
    },
  ]);
  return ticket?.status === "ok" ? appJson({ ok: true }) : appJson({ error: ticket?.status === "error" ? ticket.message : "보내지 못했어요" }, { status: 502 });
}
