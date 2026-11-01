import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { PIC_H, PIC_W, picExists, picPerson, picSvg } from "./card-pics";
import { ogFonts, svgUri } from "./og";
import { photoPortrait } from "./thumb-portraits";

/**
 * 앱 카드 그림 PNG — 웹은 그림 SVG를 화면에 바로 넣지만, 앱은 그림 파일로 받아요 (휴대폰마다 SVG 지원이 달라서).
 * 그림 속 글자(<text>, 기관 이름띠 등)는 서버에 한글 글꼴이 없어도 똑같이 나오게 빼내서 Pretendard로 따로 얹어요.
 */

/** 카드 그림은 2배로 (휴대폰 화면이 촘촘해서) */
const SCALE = 2;
/** Pretendard: 한 줄 상자(line-height 1) 맨 위에서 글자 바닥선까지 = 0.856em (hhea 1950/-494, 2048) */
const BASELINE = 0.856;

const logoCache = new Map<string, string>();

/** 그림 속 기관 로고 (/logos/x.png) → 파일을 읽어 그림 안에 넣기 */
async function inlineLogos(svg: string): Promise<string> {
  const paths = [...new Set([...svg.matchAll(/href="(\/logos\/[\w/.-]+\.png)"/g)].map((m) => m[1]))];
  for (const p of paths) {
    if (!logoCache.has(p)) {
      const buf = await readFile(join(process.cwd(), "public", p)).catch(() => null);
      logoCache.set(p, buf ? `data:image/png;base64,${buf.toString("base64")}` : "");
    }
    svg = svg.split(`href="${p}"`).join(`href="${logoCache.get(p)}"`);
  }
  return svg;
}

interface Label {
  x: number;
  y: number;
  size: number;
  weight: 400 | 700 | 800 | 900;
  fill: string;
  anchor: string;
  text: string;
}

const attr = (attrs: string, name: string) => attrs.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1];
const unescape = (t: string) => t.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&");
const weightOf = (w: string | undefined): Label["weight"] => {
  const n = Number(w ?? 400);
  return n >= 900 ? 900 : n >= 800 ? 800 : n >= 600 ? 700 : 400;
};

/** <text> 를 빼내 따로 얹을 글자로 */
function liftLabels(svg: string): { svg: string; labels: Label[] } {
  const labels: Label[] = [];
  const rest = svg.replace(/<text\b([^>]*)>([\s\S]*?)<\/text>/g, (_, attrs: string, body: string) => {
    labels.push({
      x: Number(attr(attrs, "x") ?? 0),
      y: Number(attr(attrs, "y") ?? 0),
      size: Number(attr(attrs, "font-size") ?? 16),
      weight: weightOf(attr(attrs, "font-weight")),
      fill: attr(attrs, "fill") ?? "#1c1e54",
      anchor: attr(attrs, "text-anchor") ?? "start",
      text: unescape(body.replace(/<[^>]+>/g, "")),
    });
    return "";
  });
  return { svg: rest, labels };
}

const CACHE = { "Cache-Control": "public, max-age=86400, s-maxage=31536000, stale-while-revalidate=604800" };

/** 그림 이름(PICS · 'who:인물' · 'org:기관') → PNG. 모르는 이름이면 null */
export async function appPicImage(name: string, accent: string): Promise<Response | null> {
  const person = picPerson(name);
  if (person) {
    const portrait = photoPortrait(person.who);
    if (!portrait) return null;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 560" width="480" height="560">${portrait.svg}</svg>`;
    // eslint-disable-next-line @next/next/no-img-element -- ImageResponse 안 (Satori)
    return new ImageResponse(<img src={svgUri(svg)} width={480} height={560} alt="" />, { width: 480, height: 560, headers: CACHE });
  }
  if (!picExists(name)) return null;

  const { svg, labels } = liftLabels(await inlineLogos(picSvg(name, accent, "p")));
  const W = PIC_W * SCALE;
  const H = PIC_H * SCALE;
  const full = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${PIC_W} ${PIC_H}" width="${W}" height="${H}">${svg}</svg>`;
  return new ImageResponse(
    (
      <div style={{ display: "flex", position: "relative", width: W, height: H }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse 안 (Satori) */}
        <img src={svgUri(full)} width={W} height={H} alt="" style={{ position: "absolute", left: 0, top: 0 }} />
        {labels.map((l, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              display: "flex",
              justifyContent: l.anchor === "middle" ? "center" : l.anchor === "end" ? "flex-end" : "flex-start",
              // 가운데 맞춤이면 x를 가운데로 하는 넓은 상자, 아니면 x에서 시작·끝
              left: (l.anchor === "middle" ? l.x - PIC_W / 2 : l.anchor === "end" ? l.x - PIC_W : l.x) * SCALE,
              width: PIC_W * SCALE,
              top: (l.y - BASELINE * l.size) * SCALE,
              fontFamily: "Pretendard",
              fontSize: l.size * SCALE,
              fontWeight: l.weight,
              lineHeight: 1,
              color: l.fill,
              whiteSpace: "nowrap",
            }}
          >
            {l.text}
          </div>
        ))}
      </div>
    ),
    { width: W, height: H, fonts: await ogFonts(), headers: CACHE },
  );
}
