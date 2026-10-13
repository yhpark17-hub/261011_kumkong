import { db, dbConfigured } from "@/lib/server/db";
import { isAdmin } from "@/lib/server/security";

/**
 * 방문 통계 수집 (src/components/analytics/Tracker.tsx 가 보냄)
 * - view: 페이지 열람 1건 기록 / leave: 그 열람의 머문 시간(보이는 동안) 갱신
 * - IP 는 받지도 저장하지도 않습니다. 운영자 본인 방문과 검색 로봇은 세지 않습니다.
 */

const BOT = /bot|crawl|spider|slurp|facebookexternalhit|preview|headless|lighthouse|vercel/i;
const ID = /^[a-z0-9-]{8,64}$/i;
const MAX_DURATION_MS = 30 * 60 * 1000;

const kstDay = (ms: number) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).format(ms);

function referrerHost(raw: unknown, ownHost: string | null): string | null {
  if (typeof raw !== "string" || !raw) return null;
  try {
    const host = new URL(raw).hostname.replace(/^www\./, "");
    if (!host || (ownHost && host === ownHost.replace(/^www\./, "").split(":")[0])) return null;
    return host.slice(0, 100);
  } catch {
    return null;
  }
}

const noContent = () => new Response(null, { status: 204 });

export async function POST(req: Request) {
  if (!dbConfigured()) return noContent();
  if (BOT.test(req.headers.get("user-agent") ?? "")) return noContent();
  if (await isAdmin()) return noContent();

  const text = await req.text();
  if (text.length > 2000) return noContent();
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(text);
  } catch {
    return noContent();
  }

  const viewId = typeof body.id === "string" && ID.test(body.id) ? body.id : null;
  if (!viewId) return noContent();

  try {
    const client = await db();
    if (body.t === "view") {
      const path = typeof body.p === "string" && body.p.startsWith("/") ? body.p.split(/[?#]/)[0].slice(0, 200) : null;
      const visitor = typeof body.v === "string" && ID.test(body.v) ? body.v : null;
      const session = typeof body.s === "string" && ID.test(body.s) ? body.s : null;
      if (!path || !visitor || !session || path.startsWith("/admin") || path.startsWith("/api")) return noContent();
      const width = typeof body.w === "number" ? body.w : 0;
      const device = width && width < 768 ? "mobile" : width && width < 1024 ? "tablet" : "desktop";
      const now = Date.now();
      await client.execute({
        sql: `INSERT OR IGNORE INTO page_views (view_id, at, day, path, visitor, session, referrer, device)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [viewId, now, kstDay(now), path, visitor, session, referrerHost(body.r, req.headers.get("host")), device],
      });
      // 가끔 오래된 기록 정리 (400일 보관)
      if (Math.random() < 0.01) {
        await client.execute({ sql: "DELETE FROM page_views WHERE at < ?", args: [now - 400 * 24 * 60 * 60 * 1000] });
      }
    } else if (body.t === "leave") {
      const ms = typeof body.d === "number" ? Math.round(Math.min(Math.max(body.d, 0), MAX_DURATION_MS)) : 0;
      if (ms > 0) {
        await client.execute({
          sql: "UPDATE page_views SET duration_ms = MAX(duration_ms, ?) WHERE view_id = ? AND at > ?",
          args: [ms, viewId, Date.now() - 2 * 60 * 60 * 1000],
        });
      }
    }
  } catch (err) {
    console.error("[collect]", err);
  }
  return noContent();
}
