import { appJson } from "@/lib/server/app-api";
import { appPicImage } from "@/lib/server/app-pic";

/** 앱: 카드뉴스 그림 PNG (그림 이름 = PICS · 'who:인물' · 'org:기관', accent = 분야 색) */
export async function GET(req: Request, ctx: RouteContext<"/api/app/v1/pic/[name]">) {
  const { name: raw } = await ctx.params;
  const name = raw.includes("%") ? decodeURIComponent(raw) : raw;
  const accent = new URL(req.url).searchParams.get("accent") ?? "";
  const res = await appPicImage(name, /^#[0-9a-f]{6}$/i.test(accent) ? accent : "#533afd");
  return res ?? appJson({ error: "없는 그림이에요" }, { status: 404 });
}
