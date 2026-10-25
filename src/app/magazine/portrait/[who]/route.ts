import { PHOTO_WHO, photoPortrait } from "@/lib/server/thumb-portraits";

/**
 * 등록 인물 초상 그림 (480×560 SVG) — 카드뉴스 '한마디' 카드·인물 표지에서 <img> 로 불러요.
 * 초상 한 장이 100KB 넘게 커서 브리핑 화면에 바로 넣지 않고 따로 받아요 (빌드 때 미리 만들어 두고 오래 캐시).
 */
export function generateStaticParams() {
  return PHOTO_WHO.map((who) => ({ who }));
}

export async function GET(_req: Request, ctx: RouteContext<"/magazine/portrait/[who]">) {
  const { who } = await ctx.params;
  const p = photoPortrait(who);
  if (!p) return new Response("없는 인물이에요", { status: 404 });
  return new Response(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 560" width="480" height="560">${p.svg}</svg>`, {
    headers: { "Content-Type": "image/svg+xml; charset=utf-8", "Cache-Control": "public, max-age=86400, s-maxage=31536000, stale-while-revalidate=604800" },
  });
}
