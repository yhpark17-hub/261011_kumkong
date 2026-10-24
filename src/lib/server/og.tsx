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
let fonts: Promise<{ name: string; data: Buffer; weight: 300 | 400 | 700 | 800 | 900; style: "normal" }[]> | null = null;

/** Pretendard 300·400·700·800·900 (한 번 읽어 두고 재사용 — 300·900 은 직접 그린 썸네일 글자용) */
export function ogFonts() {
  fonts ??= Promise.all(
    ([
      [300, "Pretendard-Light.otf"],
      [400, "Pretendard-Regular.otf"],
      [700, "Pretendard-Bold.otf"],
      [800, "Pretendard-ExtraBold.otf"],
      [900, "Pretendard-Black.otf"],
    ] as const).map(async ([weight, file]) => ({ name: "Pretendard", data: await readFile(join(FONT_DIR, file)), weight, style: "normal" as const })),
  );
  return fonts;
}

export const svgUri = (svg: string) => `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;

/** 이름표 속 작은 금콩 로고 (사이트 왼쪽 위 로고와 같은 얼굴) */
export const BRAND_LOGO = svgUri(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="34" height="34"><defs><linearGradient id="b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f5e9d4"/><stop offset="1" stop-color="#ffa26b"/></linearGradient></defs><rect width="32" height="32" rx="9" fill="#1c1e54"/><path d="M20.6 7.4c3.7 1.6 5 6.5 3 10.9-1.4 3.1-4.7 4.7-6.5 6.4-1.7 1.6-4.5 1.9-6.5.2-2.4-2-2.3-5.2-.6-7.3 1.3-1.6 3.3-2 4.1-3.9.9-2 .9-4.7 2.9-6 1-.7 2.3-.8 3.6-.3z" fill="url(#b)"/><circle cx="13.7" cy="18.9" r="1.15" fill="#1c1e54"/><circle cx="18.5" cy="16.9" r="1.15" fill="#1c1e54"/><path d="M15.3 21.1c.9.8 2.2.6 2.9-.3" stroke="#1c1e54" stroke-width=".9" stroke-linecap="round" fill="none"/></svg>`,
);

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
  hold?: "news" | "book" | "pencil" | "mic" | "gavel" | "chip" | "magnifier" | "house" | "bills" | "drop" | "tag";
  glasses?: boolean;
  /** 놀람·걱정 (땀방울 + 입 모양) */
  worried?: boolean;
  /** 손 흔들기 (신남) */
  wave?: boolean;
  /** 옷 — 정장(짧은/긴 넥타이)·셔츠·방진복·안전 조끼 */
  outfit?: "suit" | "suitLongTie" | "shirt" | "cleanroom" | "vest";
  /** 머리 — 금발 앞머리·흰머리·안전모·헤드셋·제복 모자·초록 챙모자·기자 모자 */
  head?: "swoop" | "grayHair" | "hardhat" | "headset" | "cap" | "visor" | "press";
  /** 방진 마스크 */
  mask?: boolean;
  /** 소품이 몸 밖으로 나가도 잘리지 않게 그림 칸을 넓게 (만화용) */
  wide?: boolean;
}

const INK = C.ink;
const BODY =
  "M41 9.5c9 3.2 13.6 14.4 10.4 26-2.8 10.2-9.8 17-18.8 19.8-9.6 3-19.4-1.4-22-10.2-2.4-8 2.2-13.8 8.2-16.8 5-2.5 7-6.4 9-11.4 2.6-6.2 7.2-9.4 13.2-7.4z";
const S = (d: string, w = 2.2) => `<path d="${d}" stroke="${INK}" stroke-width="${w}" stroke-linecap="round" fill="none"/>`;
const F = (d: string, fill: string, w = 1.8) => `<path d="${d}" fill="${fill}" stroke="${INK}" stroke-width="${w}" stroke-linejoin="round"/>`;
/** 머리 꼭대기(새싹 옆)에 모자를 얹는 자리 — 콩이 머리가 오른쪽으로 기울어 있어 같이 돌려요 */
const ON_HEAD = (inner: string, x: number, y: number, deg: number) => `<g transform="translate(${x} ${y}) rotate(${deg})">${inner}</g>`;

/** 옷 (몸 모양대로 잘라 아래쪽만) */
function outfitSvg(outfit: NonNullable<OgKong["outfit"]>): string {
  const clip = (inner: string) => `<g clip-path="url(#kc)">${inner}</g>`;
  switch (outfit) {
    case "suit":
    case "suitLongTie":
      return clip(
        `<rect x="-4" y="45.5" width="76" height="24" fill="#26306b"/>` +
          `<path d="M26 45.5 32 57.5l6-12z" fill="#fff"/>` +
          `<path d="M26 45.5 30.2 53.5M38 45.5 33.8 53.5" stroke="#4a55a8" stroke-width="1.5" fill="none"/>` +
          (outfit === "suit" ? `<path d="M31 46.4h2l.9 1.4-.9 6.6-1 1.2-1-1.2-.9-6.6z" fill="#2f6fd6"/>` : ""),
      );
    case "shirt":
      return clip(
        `<rect x="-4" y="45.5" width="76" height="24" fill="#cfe0ff"/><path d="M-4 45.5h76" stroke="${INK}" stroke-width="1.3"/>` +
          `<path d="M26 45.5 32 50.6l6-5.1z" fill="#fff" stroke="${INK}" stroke-width="1.3" stroke-linejoin="round"/>` +
          `<path d="M14 52.5l5-1M44 49l5-1.4" stroke="#9db8e8" stroke-width="1.4" stroke-linecap="round"/>`,
      );
    case "vest":
      return clip(
        `<rect x="-4" y="45" width="76" height="24" fill="#ff8a3d"/><path d="M-4 45h76" stroke="${INK}" stroke-width="1.3"/>` +
          `<path d="M-4 50.5h76" stroke="#f1f3f8" stroke-width="2.6"/><path d="M26 45l6 6.5 6-6.5" stroke="${INK}" stroke-width="1.3" fill="none"/>`,
      );
    case "cleanroom":
      // 방진복: 얼굴 창만 남기고 하얗게 (evenodd 로 얼굴 자리를 뚫음)
      return clip(
        `<path fill-rule="evenodd" d="M-4-4h76v76H-4z M20.6 37.2a12.6 8.8 -17 1 0 25.2-7.6a12.6 8.8 -17 1 0 -25.2 7.6z" fill="#f4f6fb"/>` +
          `<path d="M20.6 37.2a12.6 8.8 -17 1 0 25.2-7.6a12.6 8.8 -17 1 0 -25.2 7.6z" fill="none" stroke="#b8c2d9" stroke-width="1.6"/>` +
          `<path d="M14 50l40-10" stroke="#dfe4f0" stroke-width="1.4"/>`,
      );
  }
}

/** 머리 (모자·머리카락) */
function headSvg(head: NonNullable<OgKong["head"]>): string {
  switch (head) {
    case "swoop":
      // 금발: 정수리를 덮고, 앞머리를 크게 쓸어 넘겨 이마 위로 말아 올린 모양
      return (
        F("M54 21c1-9.6-5.4-16.6-14.6-16.8-10.2-.2-19.4 6.4-22.4 18.8 5.2-4 11.8-6.8 19-7.8 7.2-1 13.4.8 18 5.8z", "#f7d35e") +
        F("M47.6 9C37.4 3.4 22 6.6 13.6 18.6c-1.8 2.6-2.4 5.4-1 7.2 1.4-2.6 4-4.2 7-4.4 5-5.6 13.4-9.2 22.2-9 2.6-1.4 4.6-2.6 5.8-3.4z", "#ffe27a", 1.6) +
        S("M18.6 18.4c5.4-5.6 13-8.8 21.6-8.8M24 18.8c4.8-3.4 10.6-5.2 16.6-5.2M44.4 9.4c3.8.8 6.8 3.2 8.2 6.6", 1.1)
      );
    case "grayHair":
      // 양옆 흰머리 (작게)
      return (
        F("M14.8 33.6c-1.4-2.4-1.2-4.8.4-6.6.6 1.8 1.8 3 3.4 3.6-1.6.8-2.8 1.8-3.8 3z", "#e3e5ee", 1.3) +
        F("M51.6 19.4c2.2-.6 4.2.2 5.2 2-1.6 0-3 .4-4.2 1.4 0-1.2-.4-2.4-1-3.4z", "#e3e5ee", 1.3)
      );
    case "hardhat":
      return ON_HEAD(
        F("M-12.5 0C-12.5-9.5-6.5-14.5 0-14.5S12.5-9.5 12.5 0z", "#ffd84d") +
          `<path d="M0-14.5V-1M-6-12.4l1.6 11.4M6-12.4 4.4-1" stroke="${INK}" stroke-width="1.3" fill="none"/>` +
          F("M-16.5-1.2h33a1.8 1.8 0 0 1 0 3.6h-33a1.8 1.8 0 0 1 0-3.6z", "#ffc21a", 1.6),
        40.6,
        10.8,
        9,
      );
    case "cap":
      return ON_HEAD(
        F("M-11.5 0C-12-8-7-11.5.5-11.5c8 0 12.5 4 12 11.5z", "#26306b") +
          `<path d="M-11.5-2.4h23.5" stroke="#4a55a8" stroke-width="2.2"/>` +
          F("M-13-.2c7 3.4 17.6 3.4 26.5 0l-.6 2.4c-8.4 3-17.6 3-25.4 0z", "#12163a", 1.4) +
          `<path d="M.5-9.8l1.4 2.9 3.2.4-2.3 2.2.6 3.2-2.9-1.5-2.9 1.5.6-3.2-2.3-2.2 3.2-.4z" fill="#ffd84d" stroke="${INK}" stroke-width=".8"/>`,
        40.8,
        10.6,
        9,
      );
    case "visor":
      // 환전소 초록 챙모자: 이마 띠 + 앞으로 내민 반투명 챙
      return (
        `<path d="M17.6 27.6c8.4-9 21-13.6 36.4-11" stroke="#1f7a4a" stroke-width="3" stroke-linecap="round" fill="none"/>` +
        F("M17.6 27.6c-3.8 1.6-6.6 4-7.6 6.6 13-4.6 26.4-8 41.4-8.2 1.6-2.6 2.4-5.6 2.6-9.4-13.4-2.4-26.4 1.6-36.4 11z", "rgba(47,158,98,.58)", 1.5)
      );
    case "press":
      return ON_HEAD(
        F("M-9.5 0c-.6-6.6 1.6-11.6 4.6-12 2.4-.4 3.6 1.6 4.9 1.6S2.7-12.4 5-12c3 .4 5.2 5.4 4.5 12z", "#8a6a4f") +
          `<path d="M-9.4-3.2h18.8" stroke="#3a2b20" stroke-width="2.6"/>` +
          F("M-15 0c9-1.6 21-1.6 30 0-1.6 1.8-6.6 3-15 3S-13.4 1.8-15 0z", "#6f523a", 1.5) +
          `<rect x="2.4" y="-7.8" width="7.4" height="5.2" rx=".8" fill="#fff" stroke="${INK}" stroke-width="1" transform="rotate(10 6 -5)"/>` +
          `<path d="M3.9-5.9h4.4M3.9-4.2h3" stroke="#ea2261" stroke-width="1" stroke-linecap="round" transform="rotate(10 6 -5)"/>`,
        40.4,
        10.8,
        8,
      );
    case "headset":
      return (
        `<path d="M18 31.5C14.4 15.4 31 1.6 50.8 12.6" stroke="${INK}" stroke-width="3.2" stroke-linecap="round" fill="none"/>` +
        `<path d="M18 31.5C14.4 15.4 31 1.6 50.8 12.6" stroke="#5c6390" stroke-width="1.4" stroke-linecap="round" fill="none"/>` +
        F("M14.6 28.4a4 5.4-12 1 1 7.8-1.6l-1 6.4a4 5.4-12 1 1-7.8 1.6z", "#5c6390", 1.6) +
        `<path d="M18 34.6c.4 4.8 3.6 8.2 8.4 8.8" stroke="${INK}" stroke-width="1.6" stroke-linecap="round" fill="none"/>` +
        `<circle cx="27.4" cy="43.4" r="1.9" fill="#12163a"/>`
      );
  }
}

/** 손에 든 것 (오른손 — 화면에서 오른쪽) */
function holdSvg(hold: NonNullable<OgKong["hold"]>): string {
  const armUp = S("M50.6 30.5c3.2-1.6 5.6-4.4 6.4-7.6");
  const armOut = S("M50.4 34c2.6.8 4.4 2.6 5 5");
  const left = S("M12.6 41.5c-2.6.4-4.4 2-5.2 4.4");
  switch (hold) {
    case "news":
      return (
        `<g transform="rotate(-9 46 53)"><rect x="33" y="45" width="26" height="17" rx="2" fill="#fff" stroke="${INK}" stroke-width="2"/>` +
        `<rect x="36" y="48" width="9" height="5.5" rx="1" fill="#533afd" opacity=".85"/>` +
        `<path d="M47.5 49h8.5M47.5 52.5h8.5M36 56.5h20M36 59h14" stroke="${INK}" stroke-width="1.3" stroke-linecap="round"/></g>` +
        S("M16 44c3 5 9 8 17 8.5") +
        S("M51 33c4 3 6.5 7 7 11")
      );
    case "book":
      return (
        `<path d="M21 50.5c5.4-2.2 10.6-2 15 1.2v11.6c-4.4-3.2-9.6-3.4-15-1.2z" fill="#fff" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>` +
        `<path d="M51 50.5c-5.4-2.2-10.6-2-15 1.2v11.6c4.4-3.2 9.6-3.4 15-1.2z" fill="#fff" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>` +
        `<path d="M24.5 54.5c3-1 6-.8 8.5.6M24.5 57.6c3-1 6-.8 8.5.6M39 55.1c2.5-1.4 5.5-1.6 8.5-.6M39 58.2c2.5-1.4 5.5-1.6 8.5-.6" stroke="#3fa36b" stroke-width="1.3" stroke-linecap="round" fill="none"/>` +
        S("M14 43c1 4 3.5 7 7 8.5") +
        S("M54 34c1.5 5 .5 11.5-3 16")
      );
    case "pencil":
      return (
        `<g transform="rotate(28 55 44)"><rect x="52.5" y="31" width="5" height="16" rx="1" fill="#ffcf4d" stroke="${INK}" stroke-width="1.6"/>` +
        `<rect x="52.5" y="31" width="5" height="3.2" fill="#ff7a8a" stroke="${INK}" stroke-width="1.6"/>` +
        `<path d="M52.5 47l2.5 5 2.5-5z" fill="#f8e0b0" stroke="${INK}" stroke-width="1.4" stroke-linejoin="round"/></g>` +
        S("M50.4 36c2.4.6 3.6 2 3.8 4") +
        left
      );
    case "mic":
      // 마이크를 입 앞으로
      return (
        S("M50.4 34c1.6 3.4.6 7-2.6 9.4") +
        `<g transform="rotate(-38 46 44)"><rect x="44.6" y="42" width="3.4" height="11" rx="1.2" fill="#3b3f63" stroke="${INK}" stroke-width="1.4"/>` +
        `<circle cx="46.3" cy="40.4" r="3.6" fill="#9aa0bd" stroke="${INK}" stroke-width="1.6"/><path d="M43.4 39.6h5.8M44 41.6h4.6" stroke="#5c6390" stroke-width=".9"/></g>` +
        left
      );
    case "gavel":
      return (
        armUp +
        `<g transform="rotate(-30 58 20)"><rect x="57" y="16" width="2.6" height="15" rx="1" fill="#a8743f" stroke="${INK}" stroke-width="1.4"/>` +
        `<rect x="51.6" y="10.4" width="13.4" height="6.4" rx="1.6" fill="#8a5a2b" stroke="${INK}" stroke-width="1.6"/><path d="M54.4 10.4v6.4M62.2 10.4v6.4" stroke="#c99a62" stroke-width="1.2"/></g>` +
        left
      );
    case "magnifier":
      return (
        armUp +
        `<path d="M57.6 23.4l4.6 6.2" stroke="#3b3f63" stroke-width="3.2" stroke-linecap="round"/>` +
        `<circle cx="55.4" cy="18.6" r="6.2" fill="#d8f0ff" fill-opacity=".85" stroke="${INK}" stroke-width="2"/><path d="M52.4 16.4c.8-1.6 2.2-2.6 4-2.8" stroke="#fff" stroke-width="1.4" stroke-linecap="round" fill="none"/>` +
        left
      );
    case "chip":
      return (
        `<g transform="rotate(-9 46 53)"><rect x="37" y="45" width="18" height="16" rx="2" fill="#2b2f55" stroke="${INK}" stroke-width="1.8"/>` +
        `<rect x="41.5" y="49" width="9" height="8" rx="1" fill="#ffd84d"/>` +
        `<path d="M39.5 45v-2.4M43.5 45v-2.4M47.5 45v-2.4M51.5 45v-2.4M39.5 61v2.4M43.5 61v2.4M47.5 61v2.4M51.5 61v2.4" stroke="#b8c2d9" stroke-width="1.4"/></g>` +
        S("M16 44c3 5 9 8 21 8") +
        S("M51 33c4 3 6 7 5.4 12")
      );
    case "house":
      return (
        `<g transform="rotate(-6 46 54)">${F("M34 52l11-9 11 9", "#ea2261")}${F("M36.5 51.5v10h17v-10", "#fff6e5")}<rect x="43" y="55" width="4.4" height="6.5" fill="#ffd84d" stroke="${INK}" stroke-width="1.3"/></g>` +
        S("M16 44c3 5 9 8 18 8.5") +
        S("M51 33c4 3 6.5 7 5.6 13")
      );
    case "bills":
      return (
        armOut +
        `<g transform="translate(57 40)">` +
        [-28, -8, 12].map((d) => `<rect x="-3" y="-11" width="8" height="13" rx="1" fill="#9be3b4" stroke="${INK}" stroke-width="1.3" transform="rotate(${d})"/>`).join("") +
        `<circle cx="1" cy="-5" r="2" fill="none" stroke="#1f7a4a" stroke-width="1.1"/></g>` +
        left
      );
    case "drop":
      return (
        armOut +
        F("M58.6 31.4c3.6 5 5.4 8 5.4 10.6a5.4 5.4 0 0 1-10.8 0c0-2.6 1.8-5.6 5.4-10.6z", "#1c1e2e", 1.6) +
        `<path d="M56.4 40.6c.2 1.6 1 2.6 2.2 3" stroke="#fff" stroke-width="1.2" stroke-linecap="round" fill="none"/>` +
        left
      );
    case "tag":
      // 장바구니 + 대파 + 오른 가격표
      return (
        S("M50.4 34c2.6 1.6 4 4 4.2 7") +
        `<path d="M58 30.6l3.4-8.6" stroke="#3fa36b" stroke-width="3.2" stroke-linecap="round"/><path d="M61.4 22l1.4-3.6" stroke="#9be3b4" stroke-width="3.2" stroke-linecap="round"/>` +
        `<path d="M55.6 31.4l1-9" stroke="#56c08a" stroke-width="2.6" stroke-linecap="round"/>` +
        F("M49 38h18l-2.2 11.6c-.2 1-1 1.6-2 1.6H53.2c-1 0-1.8-.6-2-1.6z", "#e8b46a", 1.6) +
        `<path d="M49.6 41.6h16.8M50.4 45.4h15.2M55 38v13M60.6 38v13" stroke="#b98236" stroke-width="1.1"/>` +
        S("M51.4 38c.4-4.4 3-7.2 6.6-7.2s6.2 2.8 6.6 7.2", 1.6) +
        `<g transform="rotate(12 66 50)">${F("M62.4 47.4h7l2.4 3.4-2.4 3.4h-7z", "#fff6e5", 1.3)}<path d="M66 53v-4.4M64.4 50.2 66 48.6l1.6 1.6" stroke="#ea2261" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" fill="none"/></g>` +
        left
      );
  }
}

export function kongSvg({ hold, glasses, worried, wave, outfit, head, mask, wide }: OgKong = {}): string {
  const sprout = `<path d="M40.5 9.5c-.6-3.6 1.4-6.6 5.4-7.4-.2 3.8-2 6.4-5.4 7.4z" fill="#3fa36b"/><path d="M40 9.8c-2.6-1.6-5.6-1.2-7.2 1.2 2.8 1.2 5.2 1 7.2-1.2z" fill="#56c08a"/>`;
  // 모자·머리카락·헤드셋 위로 새싹이 삐죽 나오게 (그 위에 다시 그림)
  const sproutOnTop = Boolean(head) && head !== "grayHair" && head !== "visor";
  const parts: string[] = [
    `<defs><linearGradient id="kg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f8eedc"/><stop offset="1" stop-color="#ffa26b"/></linearGradient><clipPath id="kc"><path d="${BODY}"/></clipPath></defs>`,
    sproutOnTop ? "" : sprout,
    `<path d="${BODY}" fill="url(#kg)"/>`,
    outfit === "cleanroom" ? "" : `<path d="M39 15.5c-2.8 1.4-3.8 4.6-4.8 7.6" stroke="#fff" stroke-width="2.4" stroke-linecap="round" fill="none" opacity=".85"/>`,
    outfit ? outfitSvg(outfit) : "",
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
  if (mask)
    parts.push(
      `<g transform="rotate(-16 33 42)"><rect x="26.4" y="39" width="13.4" height="6.6" rx="2.6" fill="#bfe3ff" stroke="${INK}" stroke-width="1.4"/><path d="M28.4 41.4h9.4M28.4 43.2h9.4" stroke="#8fc2ea" stroke-width=".9"/></g>`,
    );
  if (outfit === "suitLongTie")
    // 길게 늘어진 빨간 넥타이 (몸 밖까지)
    parts.push(F("M30.4 46.2h3.4l.7 2-1 1.4 1.6 10.2-2.9 2.8-2.9-2.8 1.6-10.2-1-1.4z", "#e0262f", 1.2));
  if (worried)
    parts.push(
      `<path d="M54.6 13.5c1.7 2.5 2.6 4 2.6 5.3a2.6 2.6 0 0 1-5.2 0c0-1.3.9-2.8 2.6-5.3z" fill="#9fd8ff" stroke="${INK}" stroke-width="1.3" stroke-linejoin="round"/>`,
    );
  if (head) parts.push(headSvg(head));
  if (sproutOnTop) parts.push(sprout);
  if (hold) parts.push(holdSvg(hold));
  else parts.push(wave ? S("M50.6 30.5c3.2-1.6 5.6-4.4 6.4-7.6") : S("M50.4 34c2.6.8 4.4 2.6 5 5"), S("M12.6 41.5c-2.6.4-4.4 2-5.2 4.4"));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${wide ? "-6 -6 78 78" : "2 0 64 64"}" width="512" height="512">${parts.join("")}</svg>`;
}

/** 변장 이름 → 콩이 옷차림 (금콩 브리핑 만화) */
export const COSTUME_LOOK: Record<string, OgKong> = {
  reporter: { head: "press", hold: "mic" },
  president: { outfit: "suit", wave: true },
  uspresident: { outfit: "suitLongTie", head: "swoop", wave: true },
  banker: { outfit: "suit", head: "grayHair", glasses: true, hold: "gavel" },
  trader: { outfit: "shirt", head: "headset" },
  oil: { outfit: "vest", head: "hardhat", hold: "drop" },
  chip: { outfit: "cleanroom", mask: true, hold: "chip" },
  security: { head: "cap", hold: "magnifier" },
  builder: { outfit: "vest", head: "hardhat", hold: "house" },
  money: { head: "visor", hold: "bills" },
  shopper: { hold: "tag" },
};

/** 텍스트를 n 글자에서 자르고 … */
export const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);

export { fitText, wrapLines } from "../og-text";
