import "server-only";
import { isArtColor } from "@/lib/thumb-art";
import { COSTUME_LOOK, kongSvg, type OgKong } from "./og";
import { Defs, arrowBadge, coin } from "./og-scenes";
import { portraitSvg } from "./thumb-portraits";

/**
 * 금콩 그림 부품 — 브리핑 썸네일 '직접 그린 그림'(svg) 안에 <kk-이름 속성…/> 으로 넣으면 여기서 도형으로 바꿔요.
 * 사람·연단·건물처럼 손으로 매번 그리기 어려운 것을 디자인팀 일러스트 수준으로 맞춰 두려는 것.
 * 좌표는 모두 1200×630 그림 기준. x·y = 부품 상자의 왼쪽 위, s = 배율(1 = 기본 크기).
 *
 *   portrait 인물 초상 (480×560, 카툰) — who(신현송·워시 등 따로 그린 인물) 또는 hair·hc·skin·eyes·glasses·suit·shirt·tie, face·flip
 *   podium   연단 + 마이크 (360×220) — c·mics·emblem(star|won|none)
 *   kong     금콩 마스코트 (기본 300) — size·costume 또는 hold·outfit·head·glasses·worried·wave
 *   coin     동전 — cx·cy·r·kind(won|dollar)
 *   badge    동그란 오름·내림 배지 — cx·cy·r·dir(up|down)
 *   bank     기둥 있는 은행·중앙은행 건물 (420×300) — c(상징색)·stone
 *   barrel   기름통 (160×220) — c
 *   candles  주가 봉 차트 — x·y·w·h·n·trend(up|down|crash|rebound|fall-rise|choppy)·up·down·seed
 *   house    집 (260×240) — c(지붕)·wall
 *   chip     반도체 칩 (260×260) — c·glow
 *   lock     자물쇠 (200×250) — c·open(1 = 열림·깨짐)
 *   doc      서류 (220×280) — c(머리띠 색)·lines
 *   gavel    의사봉 (280×200) — c
 *   bubble   말풍선 바탕 — x·y·w·h·r·tx·ty(꼬리 끝)·c·op
 *   swoosh   굵은 곡선 화살표 — x1·y1·x2·y2·bend·w·c
 *   bigarrow 큰 입체 화살표 — x·y·w·h·dir(up|down|right|left)·c
 *   burst    폭발형 별 — cx·cy·r·r2·n·c·rot
 *   bolt     번개 (120×220) — c
 *   glow     빛 번짐 — cx·cy·r·c·op
 *   grid     바탕 격자 — step·c·op
 */

type A = Record<string, string>;

const n = (a: A, k: string, d: number) => {
  const v = Number(a[k]);
  return a[k] !== undefined && a[k] !== "" && Number.isFinite(v) ? v : d;
};
const c = (a: A, k: string, d: string) => (isArtColor(a[k]) ? a[k] : d);
const pick = <T extends string>(a: A, k: string, opts: readonly T[], d: T): T => (opts.includes(a[k] as T) ? (a[k] as T) : d);

/** 색 섞기 (#rgb·#rrggbb) — 그림자·밝은 면 만들 때 */
function mix(hex: string, to: string, t: number): string {
  const p = (h: string) => {
    const s = h.replace("#", "");
    const f = s.length === 3 ? s.replace(/./g, (x) => x + x) : s.slice(0, 6);
    return [0, 2, 4].map((i) => parseInt(f.slice(i, i + 2), 16));
  };
  if (!/^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(hex)) return hex;
  const [a, b] = [p(hex), p(to)];
  return `#${a.map((v, i) => Math.round(v + (b[i] - v) * t).toString(16).padStart(2, "0")).join("")}`;
}
const dark = (h: string, t = 0.25) => mix(h, "#000000", t);
const light = (h: string, t = 0.25) => mix(h, "#ffffff", t);

/** 상자 놓기 — 왼쪽 위 (x, y), 배율 s, 좌우 뒤집기(폭 w 기준) */
const place = (a: A, w: number, inner: string) => {
  const x = n(a, "x", 0);
  const y = n(a, "y", 0);
  const s = n(a, "s", 1);
  const flip = a.flip === "1" || a.flip === "true";
  return `<g transform="translate(${x} ${y}) scale(${s})">${flip ? `<g transform="translate(${w} 0) scale(-1 1)">${inner}</g>` : inner}</g>`;
};

/* ------------------------------------------------------------------ */
/* 연단 · 건물 · 사물                                                     */
/* ------------------------------------------------------------------ */

function podium(a: A, id: string): string {
  const body = c(a, "c", "#26306b");
  const d = new Defs();
  const fill = d.lin(`${id}p`, [[0, light(body, 0.12)], [1, dark(body, 0.18)]]);
  const mics = Math.round(Math.min(4, Math.max(0, n(a, "mics", 3))));
  const MIC_COLORS = ["#3b3f63", "#ea2261", "#2f6fd6", "#12b981"];
  const MIC_X = mics === 1 ? [180] : mics === 2 ? [150, 210] : mics === 3 ? [120, 170, 220] : [105, 150, 205, 250];
  const tilt = [-24, -8, 10, 22];
  const emblem = pick(a, "emblem", ["star", "won", "none"] as const, "star");
  const micSvg = MIC_X.slice(0, mics)
    .map((x, i) => {
      const r = tilt[mics === 1 ? 1 : i] ?? 0;
      return `<path d="M${x} 44L${x + r} 8" stroke="#1c1e2e" stroke-width="6" stroke-linecap="round"/><rect x="${x + r - 13}" y="-8" width="26" height="22" rx="10" fill="${MIC_COLORS[i % 4]}"/><rect x="${x + r - 13}" y="-8" width="26" height="8" rx="4" fill="#fff" opacity=".25"/>`;
    })
    .join("");
  const mark =
    emblem === "star"
      ? `<circle cx="180" cy="124" r="36" fill="#f5f3ff"/><path d="M180 97l8 16 17.8 2.6-12.9 12.6 3 17.7L180 137.5l-15.9 8.4 3-17.7-12.9-12.6 17.8-2.6z" fill="#ffd84d"/>`
      : emblem === "won"
        ? `<circle cx="180" cy="124" r="36" fill="#f5f3ff"/><path d="M160 106l8 34 12-26 12 26 8-34M156 120h48M158 130h44" stroke="${body}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`
        : "";
  return place(
    a,
    360,
    `${d}${micSvg}<path d="M24 40H336L312 220H48Z" fill="${fill}"/><path d="M24 40H336L333 62H27Z" fill="#000" opacity=".18"/><rect x="10" y="26" width="340" height="22" rx="6" fill="${light(body, 0.18)}"/>${mark}`,
  );
}

function kong(a: A): string {
  const size = n(a, "size", 300);
  const base: OgKong = a.costume && COSTUME_LOOK[a.costume] ? { ...COSTUME_LOOK[a.costume] } : {};
  const HOLDS = ["news", "book", "pencil", "mic", "gavel", "chip", "magnifier", "house", "bills", "drop", "tag"] as const;
  const OUTFITS = ["suit", "suitLongTie", "shirt", "cleanroom", "vest"] as const;
  const HEADS = ["swoop", "grayHair", "hardhat", "headset", "cap", "visor", "press"] as const;
  if (HOLDS.includes(a.hold as (typeof HOLDS)[number])) base.hold = a.hold as OgKong["hold"];
  if (OUTFITS.includes(a.outfit as (typeof OUTFITS)[number])) base.outfit = a.outfit as OgKong["outfit"];
  if (HEADS.includes(a.head as (typeof HEADS)[number])) base.head = a.head as OgKong["head"];
  if (a.glasses === "1") base.glasses = true;
  if (a.worried === "1") base.worried = true;
  if (a.wave === "1") base.wave = true;
  base.wide = true;
  const svg = kongSvg(base).replace('width="512" height="512"', `x="${n(a, "x", 0)}" y="${n(a, "y", 0)}" width="${size}" height="${size}"`);
  return a.flip === "1" ? `<g transform="translate(${2 * n(a, "x", 0) + size} 0) scale(-1 1)">${svg}</g>` : svg;
}

function bank(a: A, id: string): string {
  const d = new Defs();
  const stone = c(a, "stone", "#f3efe6");
  const accent = c(a, "c", "#1f3c88");
  const col = d.lin(`${id}c`, [[0, light(stone, 0.3)], [0.55, stone], [1, dark(stone, 0.16)]], 0, 0, 1, 0);
  const roof = d.lin(`${id}r`, [[0, light(stone, 0.2)], [1, dark(stone, 0.1)]]);
  const cols = Array.from({ length: 6 }, (_, i) => {
    const x = 50 + i * 60;
    return `<rect x="${x - 4}" y="118" width="40" height="10" rx="2" fill="${dark(stone, 0.06)}"/><rect x="${x}" y="128" width="32" height="118" fill="${col}"/><path d="M${x + 10} 130V244M${x + 22} 130V244" stroke="${dark(stone, 0.12)}" stroke-width="2"/><rect x="${x - 4}" y="244" width="40" height="8" rx="2" fill="${dark(stone, 0.08)}"/>`;
  }).join("");
  return place(
    a,
    420,
    `${d}<rect x="34" y="118" width="352" height="134" fill="${dark(stone, 0.5)}"/>${cols}` +
      `<rect x="20" y="96" width="380" height="24" rx="3" fill="${roof}"/><path d="M12 98L210 22L408 98Z" fill="${roof}"/><path d="M52 92L210 34L368 92Z" fill="${dark(stone, 0.06)}"/>` +
      `<circle cx="210" cy="70" r="17" fill="${accent}"/><circle cx="210" cy="70" r="9" fill="none" stroke="#fff" stroke-width="3" opacity=".85"/>` +
      `<rect x="10" y="252" width="400" height="16" rx="3" fill="${dark(stone, 0.04)}"/><rect x="0" y="268" width="420" height="20" rx="3" fill="${dark(stone, 0.12)}"/>`,
  );
}

function barrel(a: A, id: string): string {
  const d = new Defs();
  const body = c(a, "c", "#24304f");
  const g = d.lin(`${id}b`, [[0, dark(body, 0.25)], [0.35, light(body, 0.22)], [0.7, body], [1, dark(body, 0.3)]], 0, 0, 1, 0);
  return place(
    a,
    160,
    `${d}<rect x="8" y="20" width="144" height="190" rx="16" fill="${g}"/><ellipse cx="80" cy="22" rx="72" ry="16" fill="${light(body, 0.3)}"/><ellipse cx="80" cy="22" rx="58" ry="10" fill="${dark(body, 0.2)}"/>` +
      `<path d="M8 76H152M8 150H152" stroke="${dark(body, 0.35)}" stroke-width="7"/><path d="M8 72H152M8 146H152" stroke="${light(body, 0.35)}" stroke-width="2" opacity=".7"/>` +
      `<path d="M80 92C96 114 104 126 104 138A24 24 0 0 1 56 138C56 126 64 114 80 92Z" fill="#11131c"/><path d="M68 136Q70 146 78 150" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".6"/>`,
  );
}

/** 의사 난수 (같은 seed 면 같은 모양) */
function rng(seed: number) {
  let s = seed * 9301 + 49297;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function candles(a: A): string {
  const x = n(a, "x", 600);
  const y = n(a, "y", 120);
  const w = n(a, "w", 520);
  const h = n(a, "h", 360);
  const count = Math.round(Math.min(40, Math.max(4, n(a, "n", 14))));
  const up = c(a, "up", "#ff4d5e");
  const down = c(a, "down", "#3d7bff");
  const trend = pick(a, "trend", ["up", "down", "crash", "rebound", "fall-rise", "choppy"] as const, "down");
  const r = rng(n(a, "seed", 7));
  // 0 = 아래, 1 = 위 — 흐름 모양
  const path = (t: number) => {
    switch (trend) {
      case "up":
        return 0.15 + t * 0.7;
      case "down":
        return 0.85 - t * 0.7;
      case "crash":
        return t < 0.62 ? 0.82 - t * 0.12 : 0.74 - (t - 0.62) * 1.85;
      case "rebound":
        return t < 0.7 ? 0.8 - t * 0.9 : 0.17 + (t - 0.7) * 1.4;
      case "fall-rise":
        return 0.5 + 0.38 * Math.cos(t * Math.PI * 2) * 0.9 - 0.04;
      default:
        return 0.5 + Math.sin(t * 9) * 0.18;
    }
  };
  const step = w / count;
  const bw = step * 0.58;
  let prev = path(0);
  let out = "";
  for (let i = 0; i < count; i++) {
    const t = (i + 1) / count;
    const close = Math.min(0.97, Math.max(0.03, path(t) + (r() - 0.5) * 0.06));
    const open = prev;
    const hi = Math.max(open, close) + r() * 0.05;
    const lo = Math.min(open, close) - r() * 0.05;
    const cx = x + step * i + step / 2;
    const Y = (v: number) => y + h - v * h;
    const col = close >= open ? up : down;
    const top = Y(Math.max(open, close));
    const bh = Math.max(4, Math.abs(Y(open) - Y(close)));
    out += `<path d="M${cx} ${Y(hi)}V${Y(lo)}" stroke="${col}" stroke-width="${Math.max(2, bw * 0.12)}" stroke-linecap="round"/><rect x="${cx - bw / 2}" y="${top}" width="${bw}" height="${bh}" rx="${Math.min(4, bw * 0.15)}" fill="${col}"/>`;
    prev = close;
  }
  return out;
}

function house(a: A, id: string): string {
  const d = new Defs();
  const roof = c(a, "c", "#ea4d5d");
  const wall = c(a, "wall", "#fff6e5");
  const wf = d.lin(`${id}w`, [[0, light(wall, 0.2)], [1, dark(wall, 0.1)]]);
  return place(
    a,
    260,
    `${d}<rect x="34" y="100" width="192" height="136" rx="6" fill="${wf}"/><path d="M14 112L130 18L246 112Z" fill="${roof}"/><path d="M14 112L130 18L136 23L28 112Z" fill="${light(roof, 0.25)}"/>` +
      `<rect x="176" y="34" width="26" height="46" fill="${dark(roof, 0.2)}"/><rect x="104" y="160" width="52" height="76" rx="6" fill="${dark(roof, 0.25)}"/><circle cx="146" cy="200" r="4" fill="#ffd84d"/>` +
      `<rect x="54" y="128" width="40" height="38" rx="5" fill="#9fd0ff"/><rect x="166" y="128" width="40" height="38" rx="5" fill="#9fd0ff"/><path d="M74 128V166M54 147H94M186 128V166M166 147H206" stroke="#fff" stroke-width="4"/>`,
  );
}

function chip(a: A, id: string): string {
  const d = new Defs();
  const core = c(a, "c", "#3a2fd6");
  const g = d.lin(`${id}c`, [[0, light(core, 0.3)], [1, dark(core, 0.25)]], 0, 0, 1, 1);
  const glow = a.glow === "0" ? "" : `<rect x="40" y="40" width="180" height="180" rx="26" fill="${light(core, 0.2)}" opacity=".6" filter="${d.blur(`${id}b`, 22)}"/>`;
  const pins = Array.from({ length: 6 }, (_, i) => {
    const p = 62 + i * 27;
    return `<rect x="${p}" y="14" width="10" height="32" rx="4" fill="#c9cde6"/><rect x="${p}" y="214" width="10" height="32" rx="4" fill="#c9cde6"/><rect x="14" y="${p}" width="32" height="10" rx="4" fill="#c9cde6"/><rect x="214" y="${p}" width="32" height="10" rx="4" fill="#c9cde6"/>`;
  }).join("");
  return place(
    a,
    260,
    `${d}${glow}${pins}<rect x="40" y="40" width="180" height="180" rx="22" fill="${g}"/><rect x="70" y="70" width="120" height="120" rx="14" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="4"/>` +
      `<path d="M92 130H120L130 108L142 152L152 130H168" stroke="#fff" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/><rect x="48" y="48" width="70" height="14" rx="7" fill="#fff" opacity=".25"/>`,
  );
}

function lock(a: A, id: string): string {
  const d = new Defs();
  const body = c(a, "c", "#ffc93d");
  const g = d.lin(`${id}l`, [[0, light(body, 0.25)], [1, dark(body, 0.2)]], 0, 0, 1, 1);
  const open = a.open === "1";
  const shackle = open
    ? `<path d="M50 110V70Q50 18 100 18Q146 18 150 62" stroke="#aeb4c8" stroke-width="22" fill="none" stroke-linecap="round" transform="rotate(-18 50 110)"/>`
    : `<path d="M50 112V72Q50 20 100 20Q150 20 150 72V112" stroke="#aeb4c8" stroke-width="22" fill="none"/>`;
  const crack = open ? `<path d="M100 120L88 160L112 178L94 220L118 248" stroke="#1c1e2e" stroke-width="7" fill="none" stroke-linejoin="round" stroke-linecap="round"/>` : "";
  return place(
    a,
    200,
    `${d}${shackle}<rect x="14" y="104" width="172" height="142" rx="26" fill="${g}"/><rect x="26" y="114" width="148" height="12" rx="6" fill="#fff" opacity=".3"/>` +
      `<circle cx="100" cy="166" r="18" fill="#1c1e2e"/><path d="M92 172H108L104 206H96Z" fill="#1c1e2e"/>${crack}`,
  );
}

function doc(a: A, id: string): string {
  const d = new Defs();
  const head = c(a, "c", "#533afd");
  const lines = Math.round(Math.min(9, Math.max(2, n(a, "lines", 6))));
  const shadowF = d.blur(`${id}s`, 10);
  const rows = Array.from({ length: lines }, (_, i) => `<rect x="30" y="${96 + i * 22}" width="${i % 3 === 2 ? 110 : 160}" height="9" rx="4.5" fill="#d9dbea"/>`).join("");
  return place(
    a,
    220,
    `${d}<rect x="14" y="18" width="200" height="262" rx="16" fill="#0b1030" opacity=".22" filter="${shadowF}"/><path d="M8 0H160L212 52V270Q212 280 202 280H18Q8 280 8 270Z" fill="#fff"/><path d="M160 0V42Q160 52 170 52H212Z" fill="#e3e1f0"/>` +
      `<rect x="30" y="34" width="110" height="22" rx="6" fill="${head}"/>${rows}`,
  );
}

function gavel(a: A, id: string): string {
  const d = new Defs();
  const wood = c(a, "c", "#a8642c");
  const g = d.lin(`${id}g`, [[0, light(wood, 0.25)], [1, dark(wood, 0.25)]]);
  return place(
    a,
    280,
    // 받침 위로 내려치는 의사봉 — 손잡이는 오른쪽 위로
    `${d}<ellipse cx="150" cy="186" rx="104" ry="14" fill="#000" opacity=".25"/><rect x="62" y="160" width="176" height="24" rx="9" fill="${g}"/><rect x="62" y="160" width="176" height="7" rx="3.5" fill="#fff" opacity=".2"/>` +
      `<path d="M128 96L266 16" stroke="${dark(wood, 0.15)}" stroke-width="16" stroke-linecap="round"/>` +
      `<g transform="rotate(60 120 100)"><rect x="56" y="70" width="128" height="60" rx="14" fill="${g}"/><rect x="70" y="64" width="16" height="72" rx="5" fill="${dark(wood, 0.3)}"/><rect x="154" y="64" width="16" height="72" rx="5" fill="${dark(wood, 0.3)}"/></g>`,
  );
}

function bubble(a: A): string {
  const x = n(a, "x", 60);
  const y = n(a, "y", 120);
  const w = n(a, "w", 520);
  const h = n(a, "h", 200);
  const r = Math.min(n(a, "r", 36), h / 2);
  const fill = c(a, "c", "#ffffff");
  const op = Math.min(1, Math.max(0, n(a, "op", 1)));
  const tx = n(a, "tx", x + w + 70);
  const ty = n(a, "ty", y + h * 0.7);
  // 꼬리 — 끝점과 가장 가까운 변에서 뽑아요
  const cx = Math.min(Math.max(tx, x + r + 30), x + w - r - 30);
  const cy = Math.min(Math.max(ty, y + r + 20), y + h - r - 20);
  let tail: string;
  if (tx > x + w) tail = `M${x + w - 4} ${cy - 30}L${tx} ${ty}L${x + w - 4} ${cy + 18}Z`;
  else if (tx < x) tail = `M${x + 4} ${cy - 30}L${tx} ${ty}L${x + 4} ${cy + 18}Z`;
  else if (ty > y + h) tail = `M${cx - 30} ${y + h - 4}L${tx} ${ty}L${cx + 18} ${y + h - 4}Z`;
  else tail = `M${cx - 30} ${y + 4}L${tx} ${ty}L${cx + 18} ${y + 4}Z`;
  return `<g opacity="${op}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}"/><path d="${tail}" fill="${fill}"/></g>`;
}

function swoosh(a: A): string {
  const x1 = n(a, "x1", 100);
  const y1 = n(a, "y1", 500);
  const x2 = n(a, "x2", 500);
  const y2 = n(a, "y2", 200);
  const bend = n(a, "bend", 80);
  const w = n(a, "w", 22);
  const col = c(a, "c", "#ff3d57");
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const len = Math.hypot(x2 - x1, y2 - y1) || 1;
  const nx = -(y2 - y1) / len;
  const ny = (x2 - x1) / len;
  const qx = mx + nx * bend;
  const qy = my + ny * bend;
  // 끝 방향 (곡선 접선)
  const tx = x2 - qx;
  const ty = y2 - qy;
  const tl = Math.hypot(tx, ty) || 1;
  const ux = tx / tl;
  const uy = ty / tl;
  const head = w * 2.4;
  const bx = x2 - ux * head;
  const by = y2 - uy * head;
  const px = -uy * head * 0.75;
  const py = ux * head * 0.75;
  return (
    `<path d="M${x1} ${y1}Q${qx} ${qy} ${bx} ${by}" stroke="${col}" stroke-width="${w}" fill="none" stroke-linecap="round"/>` +
    `<path d="M${x2 + ux * 4} ${y2 + uy * 4}L${bx + px} ${by + py}L${bx - px} ${by - py}Z" fill="${col}" stroke="${col}" stroke-width="${w * 0.3}" stroke-linejoin="round"/>`
  );
}

function bigarrow(a: A, id: string): string {
  const x = n(a, "x", 700);
  const y = n(a, "y", 80);
  const w = n(a, "w", 260);
  const h = n(a, "h", 420);
  const dir = pick(a, "dir", ["up", "down", "right", "left"] as const, "up");
  const col = c(a, "c", dir === "down" ? "#3d7bff" : "#ff4d5e");
  const d = new Defs();
  const g = d.lin(`${id}a`, [[0, light(col, 0.25)], [1, dark(col, 0.18)]], 0, 0, 1, 1);
  // 위쪽 화살표를 0..1 상자에 그리고 돌려요
  const shape = "M0.5 0L1 0.42H0.68V1H0.32V0.42H0Z";
  const rot = dir === "up" ? 0 : dir === "down" ? 180 : dir === "right" ? 90 : -90;
  const [bw, bh] = dir === "up" || dir === "down" ? [w, h] : [h, w];
  return `${d}<g transform="translate(${x + w / 2} ${y + h / 2}) rotate(${rot}) translate(${-bw / 2} ${-bh / 2}) scale(${bw} ${bh})"><path d="${shape}" fill="${dark(col, 0.4)}" transform="translate(0.03 0.02)"/><path d="${shape}" fill="${g}"/></g>`;
}

function burst(a: A): string {
  const cx = n(a, "cx", 600);
  const cy = n(a, "cy", 315);
  const r = n(a, "r", 160);
  const r2 = n(a, "r2", r * 0.72);
  const k = Math.round(Math.min(40, Math.max(5, n(a, "n", 16))));
  const rot = (n(a, "rot", 0) * Math.PI) / 180;
  const pts = Array.from({ length: k * 2 }, (_, i) => {
    const ang = rot + (i * Math.PI) / k;
    const rr = i % 2 ? r2 : r;
    return `${(cx + Math.cos(ang) * rr).toFixed(1)},${(cy + Math.sin(ang) * rr).toFixed(1)}`;
  }).join(" ");
  return `<polygon points="${pts}" fill="${c(a, "c", "#ffd84d")}" opacity="${Math.min(1, Math.max(0, n(a, "op", 1)))}"/>`;
}

function bolt(a: A): string {
  return place(a, 120, `<path d="M70 0L8 128H56L36 220L112 82H64L92 0Z" fill="${c(a, "c", "#ffd84d")}"/><path d="M70 0L60 22H86L92 0Z" fill="#fff" opacity=".45"/>`);
}

function glow(a: A, id: string): string {
  const r = n(a, "r", 200);
  return `<defs><filter id="${id}g" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="${Math.round(r / 3)}"/></filter></defs><circle cx="${n(a, "cx", 600)}" cy="${n(a, "cy", 315)}" r="${r}" fill="${c(a, "c", "#533afd")}" opacity="${Math.min(1, Math.max(0, n(a, "op", 0.5)))}" filter="url(#${id}g)"/>`;
}

function grid(a: A): string {
  const step = Math.max(20, n(a, "step", 60));
  const col = c(a, "c", "#ffffff");
  const op = Math.min(1, Math.max(0, n(a, "op", 0.05)));
  let p = "";
  for (let x = step; x < 1200; x += step) p += `M${x} 0V630`;
  for (let y = step; y < 630; y += step) p += `M0 ${y}H1200`;
  return `<path d="${p}" stroke="${col}" stroke-opacity="${op}" stroke-width="1.5"/>`;
}

const KIT: Record<string, (a: A, id: string) => string> = {
  portrait: (a, id) => place(a, 480, portraitSvg(a, id)),
  // 예전 이름 — 조합형 초상으로 그려요
  person: (a, id) => place(a, 480, portraitSvg({ ...a, who: "" }, id)),
  podium,
  kong: (a) => kong(a),
  coin: (a, id) => {
    const d = new Defs();
    const body = coin(d, n(a, "cx", 600), n(a, "cy", 315), n(a, "r", 70), a.kind === "dollar" ? "dollar" : "won", id);
    return `${d}${body}`;
  },
  badge: (a, id) => {
    const d = new Defs();
    const body = arrowBadge(d, n(a, "cx", 600), n(a, "cy", 315), n(a, "r", 46), a.dir !== "down", id);
    return `${d}${body}`;
  },
  bank,
  barrel,
  candles: (a) => candles(a),
  house,
  chip,
  lock,
  doc,
  gavel,
  bubble: (a) => bubble(a),
  swoosh: (a) => swoosh(a),
  bigarrow,
  burst: (a) => burst(a),
  bolt: (a) => bolt(a),
  glow,
  grid: (a) => grid(a),
};

export const KIT_NAMES = Object.keys(KIT);

/** 정리된 그림 속 <kk-이름 …/> 부품을 도형으로 바꿔요 (모르는 부품은 지워요) */
export function expandKit(svg: string): string {
  let i = 0;
  return svg.replace(/<kk-([a-z]+)((?:\s+[a-z][a-z0-9-]*="[^"]*")*)\s*\/>/g, (_, name: string, attrs: string) => {
    const make = KIT[name];
    if (!make) return "";
    const a: A = {};
    for (const m of attrs.matchAll(/([a-z][a-z0-9-]*)="([^"]*)"/g)) a[m[1]] = m[2].replace(/&quot;/g, '"').replace(/&amp;/g, "&");
    i += 1;
    return make(a, `k${i}`);
  });
}
