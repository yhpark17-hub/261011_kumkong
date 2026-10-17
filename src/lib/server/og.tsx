import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import wideLogos from "@/data/logos-wide.json";
import logos from "@/data/logos.json";

/**
 * 카카오톡·SNS 공유 썸네일(og:image) 공통 — 사이트 화면에는 쓰지 않아요.
 * 글꼴은 node_modules 의 Pretendard 를 읽고(next.config 의 outputFileTracingIncludes 로 함께 배포),
 * 기관 로고는 public/logos 에서 읽어요.
 */

export const OG_SIZE = { width: 1200, height: 630 } as const;

export const C = {
  ink: "#1c1e54",
  inkSoft: "#4a4d7a",
  mute: "#8d8fb8",
  primary: "#533afd",
  lavender: "#ece8ff",
  cream: "#fff6e5",
  peach: "#ffe2c2",
  yellow: "#ffd84d",
  ruby: "#ea2261",
  rubySoft: "#ffe3ea",
  green: "#2f9e62",
  greenSoft: "#dff5e8",
  white: "#ffffff",
  line: "#e3e1f0",
} as const;

const FONT_DIR = join(process.cwd(), "node_modules/pretendard/dist/public/static");
let fonts: Promise<{ name: string; data: Buffer; weight: 400 | 700 | 800; style: "normal" }[]> | null = null;

/** Pretendard 400·700·800 (한 번 읽어 두고 재사용) */
export function ogFonts() {
  fonts ??= Promise.all(
    ([
      [400, "Pretendard-Regular.otf"],
      [700, "Pretendard-Bold.otf"],
      [800, "Pretendard-ExtraBold.otf"],
    ] as const).map(async ([weight, file]) => ({ name: "Pretendard", data: await readFile(join(FONT_DIR, file)), weight, style: "normal" as const })),
  );
  return fonts;
}

export const svgUri = (svg: string) => `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;

/** 기관 로고 — 글자형(가로) 로고가 있으면 그걸로 (없으면 정사각 로고, 그것도 없으면 null). 크기는 PNG 머리에서 */
export async function companyLogo(companyId: string): Promise<{ src: string; wide: boolean; width: number; height: number } | null> {
  const wide = (wideLogos as Record<string, string>)[companyId];
  const square = (logos as Record<string, string>)[companyId];
  const path = wide ?? square;
  if (!path) return null;
  try {
    const buf = await readFile(join(process.cwd(), "public", path));
    return { src: `data:image/png;base64,${buf.toString("base64")}`, wide: Boolean(wide), width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/* 콩이 — KongMascot 과 같은 그림을 SVG 글로 (썸네일 안에 넣으려고)            */
/* ------------------------------------------------------------------ */

export interface OgKong {
  hold?: "news" | "book" | "pencil";
  glasses?: boolean;
  /** 놀람·걱정 (땀방울 + 입 모양) */
  worried?: boolean;
  /** 손 흔들기 (신남) */
  wave?: boolean;
}

const INK = C.ink;
const BODY =
  "M41 9.5c9 3.2 13.6 14.4 10.4 26-2.8 10.2-9.8 17-18.8 19.8-9.6 3-19.4-1.4-22-10.2-2.4-8 2.2-13.8 8.2-16.8 5-2.5 7-6.4 9-11.4 2.6-6.2 7.2-9.4 13.2-7.4z";
const S = (d: string, w = 2.2) => `<path d="${d}" stroke="${INK}" stroke-width="${w}" stroke-linecap="round" fill="none"/>`;

export function kongSvg({ hold, glasses, worried, wave }: OgKong = {}): string {
  const parts: string[] = [
    `<defs><linearGradient id="kg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f8eedc"/><stop offset="1" stop-color="#ffa26b"/></linearGradient></defs>`,
    `<path d="M40.5 9.5c-.6-3.6 1.4-6.6 5.4-7.4-.2 3.8-2 6.4-5.4 7.4z" fill="#3fa36b"/>`,
    `<path d="M40 9.8c-2.6-1.6-5.6-1.2-7.2 1.2 2.8 1.2 5.2 1 7.2-1.2z" fill="#56c08a"/>`,
    `<path d="${BODY}" fill="url(#kg)"/>`,
    `<path d="M39 15.5c-2.8 1.4-3.8 4.6-4.8 7.6" stroke="#fff" stroke-width="2.4" stroke-linecap="round" fill="none" opacity=".85"/>`,
    `<path d="${BODY}" fill="none" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/>`,
    `<circle cx="26.5" cy="36.5" r="2.6" fill="${INK}"/><circle cx="38.5" cy="33.5" r="2.6" fill="${INK}"/>`,
    `<circle cx="27.3" cy="35.6" r=".8" fill="#fff"/><circle cx="39.3" cy="32.6" r=".8" fill="#fff"/>`,
  ];
  if (glasses)
    parts.push(
      `<circle cx="26.5" cy="36.5" r="4.8" fill="#fff" fill-opacity=".22" stroke="${INK}" stroke-width="1.7"/>`,
      `<circle cx="38.5" cy="33.5" r="4.8" fill="#fff" fill-opacity=".22" stroke="${INK}" stroke-width="1.7"/>`,
      S("M31.2 35.5c1-.9 2.1-1.2 3.1-1.2", 1.7),
      S("M21.8 37.4l-3 .9M43.2 32.4l2.9-1.3", 1.5),
    );
  parts.push(
    `<ellipse cx="22.5" cy="42.2" rx="3.1" ry="1.8" fill="#ff7a8a" opacity=".55"/>`,
    `<ellipse cx="43.6" cy="38.6" rx="3.1" ry="1.8" fill="#ff7a8a" opacity=".55"/>`,
    // 걱정: 동그랗게 벌린 입 / 평소: 웃는 입
    worried ? `<ellipse cx="32.9" cy="42.4" rx="2.1" ry="2.6" fill="${INK}"/>` : S("M29.6 41.4c2 1.9 5 1.5 6.6-.6", 2),
  );
  if (worried)
    parts.push(
      `<path d="M54.6 13.5c1.7 2.5 2.6 4 2.6 5.3a2.6 2.6 0 0 1-5.2 0c0-1.3.9-2.8 2.6-5.3z" fill="#9fd8ff" stroke="${INK}" stroke-width="1.3" stroke-linejoin="round"/>`,
    );
  if (hold === "news") {
    parts.push(
      `<g transform="rotate(-9 46 53)"><rect x="33" y="45" width="26" height="17" rx="2" fill="#fff" stroke="${INK}" stroke-width="2"/>`,
      `<rect x="36" y="48" width="9" height="5.5" rx="1" fill="#533afd" opacity=".85"/>`,
      `<path d="M47.5 49h8.5M47.5 52.5h8.5M36 56.5h20M36 59h14" stroke="${INK}" stroke-width="1.3" stroke-linecap="round"/></g>`,
      S("M16 44c3 5 9 8 17 8.5"),
      S("M51 33c4 3 6.5 7 7 11"),
    );
  } else if (hold === "book") {
    parts.push(
      `<path d="M21 50.5c5.4-2.2 10.6-2 15 1.2v11.6c-4.4-3.2-9.6-3.4-15-1.2z" fill="#fff" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>`,
      `<path d="M51 50.5c-5.4-2.2-10.6-2-15 1.2v11.6c4.4-3.2 9.6-3.4 15-1.2z" fill="#fff" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>`,
      `<path d="M24.5 54.5c3-1 6-.8 8.5.6M24.5 57.6c3-1 6-.8 8.5.6M39 55.1c2.5-1.4 5.5-1.6 8.5-.6M39 58.2c2.5-1.4 5.5-1.6 8.5-.6" stroke="#3fa36b" stroke-width="1.3" stroke-linecap="round" fill="none"/>`,
      S("M14 43c1 4 3.5 7 7 8.5"),
      S("M54 34c1.5 5 .5 11.5-3 16"),
    );
  } else if (hold === "pencil") {
    parts.push(
      `<g transform="rotate(28 55 44)"><rect x="52.5" y="31" width="5" height="16" rx="1" fill="#ffcf4d" stroke="${INK}" stroke-width="1.6"/>`,
      `<rect x="52.5" y="31" width="5" height="3.2" fill="#ff7a8a" stroke="${INK}" stroke-width="1.6"/>`,
      `<path d="M52.5 47l2.5 5 2.5-5z" fill="#f8e0b0" stroke="${INK}" stroke-width="1.4" stroke-linejoin="round"/></g>`,
      S("M50.4 36c2.4.6 3.6 2 3.8 4"),
      S("M12.6 41.5c-2.6.4-4.4 2-5.2 4.4"),
    );
  } else {
    parts.push(wave ? S("M50.6 30.5c3.2-1.6 5.6-4.4 6.4-7.6") : S("M50.4 34c2.6.8 4.4 2.6 5 5"), S("M12.6 41.5c-2.6.4-4.4 2-5.2 4.4"));
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="2 0 64 64" width="512" height="512">${parts.join("")}</svg>`;
}

/** 텍스트를 n 글자에서 자르고 … */
export const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);
