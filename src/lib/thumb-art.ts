/**
 * 브리핑 썸네일 '직접 그린 그림' — 호마다 그날 뉴스에 맞춰 새로 짜는 1200×630 그림과 글자 배치.
 * 정해진 틀(카드·큰 글씨·숫자판·공책) 대신 이게 있으면 이걸로 그려요.
 *   - svg: 그림 (도형만 — 글자는 texts 로). 금콩 부품(<kk-person …/> 등, src/lib/server/thumb-kit.ts)을 섞어 써요
 *   - texts: 글자 상자들 — 위치·크기·색·굵기를 호마다 마음대로
 *   - brand: 금콩 이름표(판 이름·날짜) 자리와 색
 * 서버(그리기)·관리자 화면·자동 점검 API 가 같이 써요.
 */

export const ART_W = 1200;
export const ART_H = 630;
export const ART_LIMITS = { svg: 60000, texts: 10, text: 90 } as const;

export const ART_WEIGHTS = [300, 400, 700, 800, 900] as const;
export type ArtWeight = (typeof ART_WEIGHTS)[number];

export interface ArtText {
  /** 글 — 줄바꿈은 \n, 강조는 *별표* (em 색으로) */
  t: string;
  x: number;
  y: number;
  /** 글자 상자 폭 — 넘치면 글자를 줄이고, 그래도 넘치면 띄어쓰기에서 줄을 바꿔요 */
  w: number;
  /** 가장 큰 글자 크기 */
  size: number;
  /** 가장 작은 글자 크기 (기본 size 의 60%) */
  min: number;
  color: string;
  /** *강조* 색 */
  em: string;
  /** *강조* 형광펜 바탕 */
  hl: string;
  weight: ArtWeight;
  align: "left" | "center" | "right";
  /** y 가 글 위쪽(top)인지 아래쪽(bottom)인지 */
  anchor: "top" | "bottom";
  /** 줄 간격 (글자 크기 배수) */
  lh: number;
  /** 자간 (글자 크기 배수, 보통 -0.06 ~ 0.1) */
  ls: number;
  /** 최대 줄 수 */
  lines: number;
  /** 상자 바탕 · 안쪽 여백 · 모서리 */
  bg: string;
  pad: number;
  radius: number;
  rotate: number;
  shadow: "" | "soft" | "hard" | "glow";
  /** 글자 테두리 (유튜브식) */
  stroke: string;
  strokeW: number;
}

export type BrandPos = "tl" | "tr" | "bl" | "br" | "none";
export interface ArtBrand {
  pos: BrandPos;
  theme: "light" | "dark";
}

export interface ThumbArt {
  svg: string;
  texts: ArtText[];
  brand: ArtBrand;
}

const COLOR = /^(#[0-9a-f]{3,8}|rgba?\(\s*[\d.]+%?\s*,\s*[\d.]+%?\s*,\s*[\d.]+%?\s*(,\s*[\d.]+\s*)?\)|transparent|white|black)$/i;
export const isArtColor = (v: unknown): v is string => typeof v === "string" && COLOR.test(v.trim());

const num = (v: unknown, d: number, lo: number, hi: number) => {
  const n = typeof v === "number" ? v : typeof v === "string" && v.trim() ? Number(v) : NaN;
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : d;
};
const color = (v: unknown, d: string) => (isArtColor(v) ? v.trim() : d);

function parseText(raw: unknown): ArtText | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const t = typeof o.t === "string" ? o.t.replace(/\r\n?/g, "\n").trim().slice(0, ART_LIMITS.text) : "";
  if (!t) return null;
  const size = num(o.size, 64, 12, 260);
  const weight = ART_WEIGHTS.find((w) => w === Number(o.weight)) ?? 800;
  return {
    t,
    x: num(o.x, 60, -200, ART_W),
    y: num(o.y, 60, -200, ART_H + 200),
    w: num(o.w, 600, 40, ART_W + 200),
    size,
    min: num(o.min, Math.round(size * 0.6), 10, size),
    color: color(o.color, "#ffffff"),
    em: color(o.em, "#ffd84d"),
    hl: color(o.hl, ""),
    weight,
    align: o.align === "center" || o.align === "right" ? o.align : "left",
    anchor: o.anchor === "bottom" ? "bottom" : "top",
    lh: num(o.lh, 1.14, 0.8, 2),
    ls: num(o.ls, -0.03, -0.12, 0.3),
    lines: Math.round(num(o.lines, 4, 1, 6)),
    bg: color(o.bg, ""),
    pad: num(o.pad, 0, 0, 60),
    radius: num(o.radius, 0, 0, 200),
    rotate: num(o.rotate, 0, -30, 30),
    shadow: o.shadow === "soft" || o.shadow === "hard" || o.shadow === "glow" ? o.shadow : "",
    stroke: color(o.stroke, ""),
    strokeW: num(o.strokeW, 0, 0, 16),
  };
}

/** 그린 그림 읽기 — JSON 글이나 객체. 그림(svg)이 없으면 null (정해진 틀로 그려요) */
export function parseArt(raw: unknown): ThumbArt | null {
  let v: unknown = raw;
  if (typeof raw === "string") {
    if (!raw.trim()) return null;
    try {
      v = JSON.parse(raw);
    } catch {
      return null;
    }
  }
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  const svg = typeof o.svg === "string" ? sanitizeArtSvg(o.svg.slice(0, ART_LIMITS.svg)) : "";
  if (!svg) return null;
  const texts = (Array.isArray(o.texts) ? o.texts : []).slice(0, ART_LIMITS.texts).map(parseText).filter((x): x is ArtText => Boolean(x));
  const b = (o.brand && typeof o.brand === "object" ? o.brand : {}) as Record<string, unknown>;
  const pos: BrandPos = b.pos === "tr" || b.pos === "bl" || b.pos === "br" || b.pos === "none" ? b.pos : "tl";
  return { svg, texts, brand: { pos, theme: b.theme === "dark" ? "dark" : "light" } };
}

/* ------------------------------------------------------------------ */
/* 그림 안전 검사 — 도형·그라데이션·흐림만 남기고 나머지는 지워요              */
/* ------------------------------------------------------------------ */

const TAGS = new Set(
  [
    "g", "path", "rect", "circle", "ellipse", "line", "polyline", "polygon", "defs", "linearGradient", "radialGradient", "stop",
    "clipPath", "mask", "filter", "feGaussianBlur", "feOffset", "feBlend", "feFlood", "feComposite", "feMerge", "feMergeNode",
    "feColorMatrix", "feDropShadow", "feMorphology", "feTurbulence", "feDisplacementMap", "pattern", "use", "symbol",
  ].map((t) => t.toLowerCase()),
);
const TOKEN = /<!--[\s\S]*?-->|<(\/?)([a-zA-Z][\w:.-]*)((?:\s+[\w:.-]+\s*=\s*(?:"[^"]*"|'[^']*'))*)\s*(\/?)>|[^<]+|</g;
const ATTR = /([\w:.-]+)\s*=\s*("[^"]*"|'[^']*')/g;

function cleanAttrs(raw: string, kit: boolean): string {
  let out = "";
  for (const m of raw.matchAll(ATTR)) {
    const name = m[1];
    let value = m[2].slice(1, -1);
    const lower = name.toLowerCase();
    if (lower.startsWith("on") || lower === "xmlns" || lower.startsWith("xmlns:")) continue;
    if (kit && !/^[a-z][a-z0-9-]*$/.test(lower)) continue;
    if ((lower === "href" || lower === "xlink:href") && !value.startsWith("#")) continue;
    // 바깥 주소를 부르는 url(…) 은 빼요 — 안쪽 정의(#id)만
    if (/url\(\s*['"]?(?!#)/i.test(value) || /javascript:|expression\(|@import/i.test(value)) continue;
    value = value.replace(/&(?!(?:#\d+|#x[0-9a-f]+|[a-z]+);)/gi, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    out += ` ${name}="${value}"`;
  }
  return out;
}

/** 직접 쓴 SVG 조각 정리 — 허용한 도형 태그와 금콩 부품(kk-*)만, 글자·스크립트·바깥 그림은 빼요 */
export function sanitizeArtSvg(svg: string): string {
  let out = "";
  const stack: string[] = [];
  let skip = 0;
  for (const m of svg.matchAll(TOKEN)) {
    const [, close, rawName, attrs = "", self] = m;
    if (!rawName) continue; // 주석·글자
    const name = rawName.toLowerCase();
    const kit = name.startsWith("kk-");
    const allowed = kit || TAGS.has(name);
    // 허용하지 않은 태그는 안쪽까지 통째로 건너뛰어요
    if (skip) {
      if (close) skip--;
      else if (!self) skip++;
      continue;
    }
    if (close) {
      if (stack.at(-1) === name) {
        stack.pop();
        out += `</${rawName}>`;
      }
      continue;
    }
    if (!allowed) {
      if (!self) skip = 1;
      continue;
    }
    if (kit) {
      // 부품은 늘 닫힌 한 태그로
      out += `<${name}${cleanAttrs(attrs, true)}/>`;
      continue;
    }
    out += `<${rawName}${cleanAttrs(attrs, false)}${self ? "/" : ""}>`;
    if (!self) stack.push(name);
  }
  while (stack.length) {
    const name = stack.pop() as string;
    out += `</${name}>`;
  }
  return out.trim();
}

/* ------------------------------------------------------------------ */
/* 글자 맞추기 — 상자 폭에 들어가는 가장 큰 크기 (관리자 화면 넘침 안내도)        */
/* ------------------------------------------------------------------ */

/** 글자 폭 (Pretendard 실제 폭에 맞춘 값, 글자 크기 1 기준) — 정해진 틀용 og-text 보다 덜 보수적으로 */
function artCharWidth(ch: string): number {
  if (/[ᄀ-ᇿ㄰-㆏가-힣]/.test(ch)) return 0.87;
  if (/\s/.test(ch)) return 0.26;
  if (/[0-9]/.test(ch)) return 0.64;
  if (ch === "%") return 0.9;
  if (/[.,·'’"“”:!]/.test(ch)) return 0.32;
  if (/[-()?]/.test(ch)) return 0.42;
  if (/[A-Z₩$@&]/.test(ch)) return 0.7;
  if (/[a-z]/.test(ch)) return 0.56;
  return 0.9;
}
/** 굵기에 따른 글자 폭 보정 */
const WEIGHT_W: Record<ArtWeight, number> = { 300: 0.95, 400: 0.97, 700: 0.99, 800: 1, 900: 1.02 };
const strip = (s: string) => s.replace(/\*/g, "");

export function artLineWidth(line: string, size: number, t: Pick<ArtText, "ls" | "weight">): number {
  const chars = [...strip(line)];
  return (chars.reduce((w, ch) => w + artCharWidth(ch), 0) * size + chars.length * t.ls * size) * WEIGHT_W[t.weight];
}

/** 한 문단을 띄어쓰기에서 나눠 폭 안에 (별표는 그대로 둬요) */
function wrapPara(p: string, size: number, t: ArtText): string[] {
  const words = p.trim().split(/\s+/).filter(Boolean);
  const out: string[] = [];
  let cur = "";
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (!cur || artLineWidth(next, size, t) <= t.w) cur = next;
    else {
      out.push(cur);
      cur = w;
    }
  }
  if (cur) out.push(cur);
  return out.length ? out : [""];
}

/** 글자 상자 배치 — 줄바꿈(\n)은 지키고, 넘치면 먼저 글자를 줄이고, 가장 작은 크기로도 넘치면 띄어쓰기에서 더 나눠요 */
export function layoutArtText(t: ArtText): { size: number; lines: string[]; overflow: boolean } {
  const paras = t.t.split("\n");
  if (paras.length <= t.lines)
    for (let size = t.size; size >= t.min; size -= 2) {
      if (paras.every((p) => artLineWidth(p, size, t) <= t.w + 1)) return { size, lines: paras, overflow: false };
    }
  for (let size = t.size; size >= t.min; size -= 2) {
    const lines = paras.flatMap((p) => wrapPara(p, size, t));
    if (lines.length <= t.lines && lines.every((l) => artLineWidth(l, size, t) <= t.w + 1)) return { size, lines, overflow: false };
  }
  const lines = paras.flatMap((p) => wrapPara(p, t.min, t));
  return { size: t.min, lines: lines.slice(0, t.lines), overflow: true };
}

/** 넘치는 글자 상자 안내 */
export function artOverflows(art: ThumbArt): string[] {
  return art.texts.filter((t) => layoutArtText(t).overflow).map((t) => t.t.replace(/\n/g, " / "));
}

/* ------------------------------------------------------------------ */
/* 사실 확인용 — 글자 속 숫자와 따옴표 말                                    */
/* ------------------------------------------------------------------ */

/** 그림 글자에 나온 숫자들과 따옴표 안 말 (지어낸 숫자·발언을 막으려고 기사 본문과 맞춰 봐요) */
export function artFacts(art: ThumbArt): { numbers: string[]; quotes: string[] } {
  const all = art.texts.map((t) => t.t.replace(/\*/g, "").replace(/\n/g, " ")).join(" ");
  const numbers = [...all.matchAll(/\d[\d,.]*\d|\d/g)].map((m) => m[0]);
  const quotes = [...all.matchAll(/["“]([^"”]{2,})["”]|['‘]([^'’]{2,})['’]/g)].map((m) => (m[1] ?? m[2]).trim());
  return { numbers, quotes };
}
