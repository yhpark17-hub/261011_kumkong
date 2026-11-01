import { appJson } from "@/lib/server/app-api";
import { cleanFavorites, isPushToken, parsePrefs, removeDevice, saveDevice } from "@/lib/server/app-push";
import { dbConfigured } from "@/lib/server/db";
import { rateLimit, requester } from "@/lib/server/security";

/**
 * 앱: 일정 알림 받을 기기 등록·해제 — 계정 없이 푸시 토큰 + 관심 기관 + 알림 설정만 (개인정보 없음)
 * POST { token, platform, favorites, prefs } / DELETE { token }
 */
async function body(req: Request): Promise<Record<string, unknown> | null> {
  const json = await req.json().catch(() => null);
  return json && typeof json === "object" ? (json as Record<string, unknown>) : null;
}

export async function POST(req: Request) {
  if (!dbConfigured()) return appJson({ error: "준비 중이에요" }, { status: 503 });
  const b = await body(req);
  if (!b || !isPushToken(b.token) || (b.platform !== "ios" && b.platform !== "android")) {
    return appJson({ error: "잘못된 요청이에요" }, { status: 400 });
  }
  const { hash } = await requester();
  if (!(await rateLimit("app-device", hash, 2))) return appJson({ error: "잠시 후 다시 시도해 주세요" }, { status: 429 });
  await saveDevice({ token: b.token, platform: b.platform, favorites: cleanFavorites(b.favorites), prefs: parsePrefs(b.prefs) });
  return appJson({ ok: true });
}

export async function DELETE(req: Request) {
  if (!dbConfigured()) return appJson({ error: "준비 중이에요" }, { status: 503 });
  const b = await body(req);
  if (!b || !isPushToken(b.token)) return appJson({ error: "잘못된 요청이에요" }, { status: 400 });
  await removeDevice(b.token);
  return appJson({ ok: true });
}
