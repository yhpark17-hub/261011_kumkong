import "server-only";
import type { SceneKey, ThumbMood } from "@/lib/news-meta";

/**
 * 금콩 브리핑 공유 썸네일의 '뉴스 그림' — 1200×630 전체를 채우는 장면 (디자인팀 일러스트 느낌)
 * 굵은 테두리 없이 그라데이션·부드러운 그림자·빛 번짐으로 입체감을 줘요.
 * 왼쪽 위(브리핑 이름표)와 왼쪽 아래(제목 카드)는 비워 두고, 주인공 그림은 오른쪽·가운데 위에 크게.
 * 사진은 쓰지 않고(저작권) 모두 직접 그린 도형이에요.
 */

export const SCENE_W = 1200;
export const SCENE_H = 630;

type Stop = [number, string, number?];

/** 그라데이션 · 흐림 정의 모음 (장면마다 따로 — id 는 장면 안에서만 쓰여요) */
export class Defs {
  private items: string[] = [];
  lin(id: string, stops: Stop[], x1 = 0, y1 = 0, x2 = 0, y2 = 1): string {
    this.items.push(
      `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops.map(([o, c, a = 1]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`).join("")}</linearGradient>`,
    );
    return `url(#${id})`;
  }
  rad(id: string, stops: Stop[], cx = 0.5, cy = 0.5, r = 0.5): string {
    this.items.push(
      `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">${stops.map(([o, c, a = 1]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`).join("")}</radialGradient>`,
    );
    return `url(#${id})`;
  }
  blur(id: string, sd: number): string {
    this.items.push(`<filter id="${id}" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="${sd}"/></filter>`);
    return `url(#${id})`;
  }
  toString() {
    return `<defs>${this.items.join("")}</defs>`;
  }
}

/** 바닥 그림자 */
export const shadow = (cx: number, cy: number, rx: number, ry: number, filter: string, op = 0.22) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#0b1030" opacity="${op}" filter="${filter}"/>`;
/** 빛 번짐 */
export const blob = (cx: number, cy: number, r: number, color: string, filter: string, op = 0.55) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}" opacity="${op}" filter="${filter}"/>`;
export const bg = (fill: string) => `<rect width="${SCENE_W}" height="${SCENE_H}" fill="${fill}"/>`;

/** 동그란 화살표 배지 (오름 초록 / 내림 빨강) */
export function arrowBadge(d: Defs, cx: number, cy: number, r: number, up: boolean, id: string): string {
  const fill = up ? d.lin(`${id}g`, [[0, "#3ef0a8"], [1, "#0fb377"]]) : d.lin(`${id}g`, [[0, "#ff8aa0"], [1, "#e8335a"]]);
  const k = r / 46;
  const arrow = up
    ? `M${cx} ${cy - 24 * k} l${20 * k} ${22 * k} h${-12 * k} v${24 * k} h${-16 * k} v${-24 * k} h${-12 * k}z`
    : `M${cx} ${cy + 24 * k} l${20 * k} ${-22 * k} h${-12 * k} v${-24 * k} h${-16 * k} v${24 * k} h${-12 * k}z`;
  const glow = d.blur(`${id}b`, 14);
  return (
    `<circle cx="${cx}" cy="${cy + 8}" r="${r}" fill="${up ? "#0fb377" : "#e8335a"}" opacity=".45" filter="${glow}"/>` +
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"/>` +
    `<circle cx="${cx}" cy="${cy}" r="${r - 3}" fill="none" stroke="#ffffff" stroke-opacity=".35" stroke-width="2"/>` +
    `<path d="${arrow}" fill="#ffffff" stroke="#ffffff" stroke-width="${3 * k}" stroke-linejoin="round"/>`
  );
}

/** 동전 ($ · ₩) — 금속 느낌 */
export function coin(d: Defs, cx: number, cy: number, r: number, kind: "won" | "dollar", id: string): string {
  const face = kind === "dollar" ? d.rad(`${id}f`, [[0, "#c8f7dc"], [0.7, "#5fd394"], [1, "#279e62"]], 0.35, 0.3, 0.8) : d.rad(`${id}f`, [[0, "#fff3b8"], [0.7, "#ffc93d"], [1, "#e09a00"]], 0.35, 0.3, 0.8);
  const ink = kind === "dollar" ? "#17643d" : "#9a5d00";
  const k = r / 70;
  const glyph =
    kind === "dollar"
      ? `<path d="M${cx + 22 * k} ${cy - 22 * k}c${-10 * k} ${-11 * k} ${-44 * k} ${-11 * k} ${-44 * k} ${9 * k}c0 ${18 * k} ${44 * k} ${8 * k} ${44 * k} ${28 * k}c0 ${20 * k} ${-36 * k} ${22 * k} ${-46 * k} ${9 * k}M${cx} ${cy - 42 * k}v${84 * k}" stroke="${ink}" stroke-width="${9 * k}" stroke-linecap="round" fill="none"/>`
      : `<path d="M${cx - 32 * k} ${cy - 28 * k}l${14 * k} ${56 * k}l${18 * k} ${-42 * k}l${18 * k} ${42 * k}l${14 * k} ${-56 * k}M${cx - 40 * k} ${cy - 4 * k}h${80 * k}M${cx - 36 * k} ${cy + 12 * k}h${72 * k}" stroke="${ink}" stroke-width="${8 * k}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;
  return (
    `<circle cx="${cx}" cy="${cy + 6 * k}" r="${r}" fill="${ink}" opacity=".55"/>` +
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${face}"/>` +
    `<circle cx="${cx}" cy="${cy}" r="${r - 10 * k}" fill="none" stroke="#ffffff" stroke-opacity=".45" stroke-width="${3 * k}"/>` +
    glyph +
    `<path d="M${cx - r * 0.55} ${cy - r * 0.5} a${r * 0.75} ${r * 0.75} 0 0 1 ${r * 0.6} ${-r * 0.32}" stroke="#ffffff" stroke-opacity=".7" stroke-width="${6 * k}" stroke-linecap="round" fill="none"/>`
  );
}

/* ------------------------------------------------------------------ */

function market(mood: ThumbMood): string {
  const up = mood === "up";
  const d = new Defs();
  const sky = d.lin("sky", [[0, "#0d1240"], [1, "#24297a"]]);
  const soft = d.blur("soft", 60);
  const sh = d.blur("sh", 10);
  const glow = d.blur("glow", 10);
  const candleUp = d.lin("cu", [[0, "#5cf2b5"], [1, "#10b377"]]);
  const candleDown = d.lin("cd", [[0, "#ff9aae"], [1, "#e8335a"]]);
  const lineG = up ? d.lin("lg", [[0, "#7affc8"], [1, "#19d38c"]], 0, 0, 1, 0) : d.lin("lg", [[0, "#ffb3c1"], [1, "#ff3d68"]], 0, 0, 1, 0);
  const panel = d.lin("pn", [[0, "#ffffff", 0.1], [1, "#ffffff", 0.03]]);
  const parts = [bg(sky), blob(1040, 90, 220, up ? "#19d38c" : "#ff3d68", soft, 0.35), blob(520, 560, 200, "#533afd", soft, 0.5)];
  // 유리 패널 + 격자
  parts.push(`<rect x="404" y="70" width="760" height="470" rx="32" fill="${panel}" stroke="#ffffff" stroke-opacity=".14" stroke-width="2"/>`);
  for (let y = 140; y < 520; y += 76) parts.push(`<path d="M436 ${y}H1132" stroke="#ffffff" stroke-opacity=".07" stroke-width="2"/>`);
  // 위쪽 작은 시세 칩
  [0, 1, 2].forEach((i) =>
    parts.push(
      `<rect x="${440 + i * 132}" y="94" width="118" height="30" rx="15" fill="#ffffff" fill-opacity=".09"/><circle cx="${460 + i * 132}" cy="109" r="6" fill="${i === 1 ? (up ? "#19d38c" : "#ff3d68") : "#8e95ff"}"/><rect x="${474 + i * 132}" y="104" width="${54 + i * 8}" height="10" rx="5" fill="#ffffff" fill-opacity=".35"/>`,
    ),
  );
  // 촛대 14개
  const n = 14;
  const mids: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const base = up ? 470 - t * 290 : 180 + t * 290;
    const mid = base + (i % 3 === 1 ? -26 : i % 3 === 2 ? 18 : 0);
    const fall = up ? i % 4 === 2 : i % 4 !== 1;
    const h = 44 + ((i * 29) % 46);
    const x = 448 + i * 49;
    mids.push([x + 13, mid]);
    parts.push(`<path d="M${x + 13} ${mid - h / 2 - 22}V${mid + h / 2 + 22}" stroke="#c9ccff" stroke-opacity=".55" stroke-width="3" stroke-linecap="round"/>`);
    parts.push(`<rect x="${x}" y="${mid - h / 2}" width="26" height="${h}" rx="6" fill="${fall ? candleDown : candleUp}"/>`);
  }
  const trend = `M${mids.map(([x, y]) => `${x} ${y}`).join(" L")}`;
  parts.push(`<path d="${trend}" stroke="${up ? "#19d38c" : "#ff3d68"}" stroke-width="22" stroke-opacity=".45" fill="none" stroke-linejoin="round" stroke-linecap="round" filter="${glow}"/>`);
  parts.push(`<path d="${trend}" stroke="${lineG}" stroke-width="9" fill="none" stroke-linejoin="round" stroke-linecap="round"/>`);
  const [ex, ey] = mids[n - 1];
  parts.push(shadow(ex + 28, ey + (up ? -40 : 70), 50, 10, sh, 0.25));
  parts.push(arrowBadge(d, ex + 28, up ? ey - 70 : ey + 46, 46, up, "ab"));
  return d + parts.join("");
}

function rate(mood: ThumbMood): string {
  const up = mood !== "down";
  const d = new Defs();
  const sky = d.lin("sky", [[0, "#dcd6ff"], [1, "#f6f4ff"]]);
  const soft = d.blur("soft", 50);
  const sh = d.blur("sh", 12);
  const front = d.lin("fr", [[0, "#ffffff"], [1, "#e6e1ff"]]);
  const col = d.lin("col", [[0, "#ffffff"], [0.55, "#f1eeff"], [1, "#cfc6ff"]], 0, 0, 1, 0);
  const roof = d.lin("rf", [[0, "#8f7bff"], [1, "#533afd"]]);
  const step = d.lin("st", [[0, "#c9bfff"], [1, "#a998ff"]]);
  const pct = d.lin("pc", up ? [[0, "#ff9fb3"], [1, "#ff4d6d"]] : [[0, "#8fc8ff"], [1, "#3b82f6"]], 0, 0, 1, 1);
  const cols = [0, 1, 2, 3, 4].map((i) => `<rect x="${742 + i * 76}" y="318" width="42" height="168" rx="6" fill="${col}"/>`).join("");
  const body =
    "" +
    bg(sky) +
    blob(980, 120, 200, "#b9a8ff", soft, 0.6) +
    blob(420, 520, 160, "#ffd3dc", soft, 0.5) +
    // 구름
    `<g fill="#ffffff" opacity=".85"><ellipse cx="560" cy="120" rx="96" ry="30"/><ellipse cx="616" cy="100" rx="58" ry="36"/><ellipse cx="1080" cy="78" rx="78" ry="24"/></g>` +
    shadow(880, 560, 300, 22, sh, 0.25) +
    `<rect x="664" y="526" width="432" height="30" rx="10" fill="${step}"/>` +
    `<rect x="690" y="494" width="380" height="34" rx="10" fill="#d9d1ff"/>` +
    `<rect x="716" y="306" width="328" height="190" rx="8" fill="${front}"/>` +
    cols +
    `<path d="M700 300 L880 182 L1060 300 Z" fill="${roof}"/>` +
    `<path d="M700 300 L880 182 L880 300 Z" fill="#ffffff" opacity=".12"/>` +
    `<rect x="694" y="292" width="372" height="22" rx="8" fill="#7b66ff"/>` +
    `<circle cx="880" cy="256" r="24" fill="#ffd84d"/><circle cx="880" cy="256" r="14" fill="#ffb020"/>` +
    // 큰 % (입체)
    `<g transform="translate(560 230)">` +
    `<g opacity=".35" transform="translate(10 14)"><circle cx="-44" cy="-44" r="34" fill="#533afd"/><circle cx="44" cy="44" r="34" fill="#533afd"/><path d="M58 -78 L-58 78" stroke="#533afd" stroke-width="30" stroke-linecap="round"/></g>` +
    `<circle cx="-44" cy="-44" r="34" fill="${pct}"/><circle cx="44" cy="44" r="34" fill="${pct}"/><path d="M58 -78 L-58 78" stroke="${pct}" stroke-width="30" stroke-linecap="round"/>` +
    `<circle cx="-44" cy="-44" r="14" fill="#ffffff" opacity=".9"/><circle cx="44" cy="44" r="14" fill="#ffffff" opacity=".9"/>` +
    `</g>` +
    arrowBadge(d, 690, 140, 40, up, "ab");
  return `${d}${body}`;
}

function fx(): string {
  const d = new Defs();
  const sky = d.lin("sky", [[0, "#cff3e0"], [1, "#f3fbf7"]]);
  const soft = d.blur("soft", 50);
  const sh = d.blur("sh", 12);
  const gold = d.lin("gd", [[0, "#ffe08a"], [0.5, "#d7a13a"], [1, "#a8701c"]], 0, 0, 1, 0);
  const beam = d.lin("bm", [[0, "#f1c870"], [1, "#b8812a"]]);
  const dish = d.lin("ds", [[0, "#ffffff"], [1, "#d7dbe8"]]);
  const body =
    "" +
    bg(sky) +
    blob(1000, 110, 200, "#7be0aa", soft, 0.5) +
    blob(460, 540, 170, "#ffe08a", soft, 0.5) +
    shadow(800, 560, 150, 18, sh, 0.25) +
    // 받침·기둥
    `<rect x="710" y="520" width="180" height="34" rx="14" fill="${gold}"/>` +
    `<path d="M786 176 L770 522 H830 L814 176 Z" fill="${gold}"/>` +
    // 저울대 (살짝 기울어짐)
    `<g transform="rotate(-4 800 186)"><rect x="536" y="176" width="528" height="20" rx="10" fill="${beam}"/>` +
    `<path d="M560 196 L500 340 M560 196 L620 340" stroke="#a8701c" stroke-width="3"/><path d="M1040 196 L980 340 M1040 196 L1100 340" stroke="#a8701c" stroke-width="3"/>` +
    `<path d="M480 340 Q560 390 640 340 Z" fill="${dish}"/><path d="M960 340 Q1040 390 1120 340 Z" fill="${dish}"/>` +
    coin(d, 560, 262, 78, "won", "cw") +
    coin(d, 1040, 262, 78, "dollar", "cd") +
    `</g>` +
    `<circle cx="800" cy="186" r="22" fill="#ffd84d"/><circle cx="800" cy="186" r="11" fill="#d7a13a"/>` +
    // 흔들림 표시
    `<path d="M440 170 q-14 18 0 36M414 158 q-20 30 0 60M1150 150 q14 18 0 36" stroke="#3fae73" stroke-width="5" stroke-linecap="round" fill="none" opacity=".7"/>`;
  return `${d}${body}`;
}

function oil(mood: ThumbMood): string {
  const up = mood !== "down";
  const d = new Defs();
  const sky = d.lin("sky", [[0, "#ff9a5c"], [0.55, "#ffc58a"], [1, "#ffe6c7"]]);
  const soft = d.blur("soft", 40);
  const sh = d.blur("sh", 10);
  const dune1 = d.lin("d1", [[0, "#f5b46f"], [1, "#e89a52"]]);
  const dune2 = d.lin("d2", [[0, "#e8a160"], [1, "#d1803e"]]);
  const steel = d.lin("stl", [[0, "#4b5394"], [1, "#262c66"]], 0, 0, 1, 0);
  const barrel = d.lin("br", [[0, "#2a2f66"], [0.45, "#4a52a6"], [1, "#1c2050"]], 0, 0, 1, 0);
  const drop = d.rad("dp", [[0, "#5a5f8a"], [0.6, "#1c1e2e"], [1, "#0b0c16"]], 0.35, 0.35, 0.8);
  const barrelAt = (x: number, y: number) =>
    shadow(x + 66, y + 176, 72, 10, sh, 0.3) +
    `<rect x="${x}" y="${y}" width="132" height="172" rx="16" fill="${barrel}"/>` +
    `<rect x="${x}" y="${y + 46}" width="132" height="8" fill="#ffffff" opacity=".18"/><rect x="${x}" y="${y + 118}" width="132" height="8" fill="#ffffff" opacity=".18"/>` +
    `<ellipse cx="${x + 66}" cy="${y + 6}" rx="62" ry="10" fill="#5a63b8"/>` +
    `<path d="M${x + 66} ${y + 66}c14 19 21 31 21 40a21 21 0 0 1-42 0c0-9 7-21 21-40z" fill="#ffc93d"/>`;
  const body =
    "" +
    bg(sky) +
    `<circle cx="600" cy="170" r="92" fill="#fff1b8" opacity=".95"/>` +
    blob(600, 170, 150, "#fff1b8", soft, 0.7) +
    `<path d="M0 470 Q300 410 640 450 T1200 430 V630 H0 Z" fill="${dune1}"/>` +
    `<path d="M0 540 Q360 490 760 530 T1200 520 V630 H0 Z" fill="${dune2}"/>` +
    // 펌프잭
    shadow(1000, 512, 130, 10, sh, 0.3) +
    `<path d="M944 506 L1000 250 L1056 506 Z" fill="${steel}"/>` +
    `<rect x="830" y="216" width="320" height="26" rx="13" fill="${steel}" transform="rotate(8 1000 230)"/>` +
    `<path d="M806 186 q-34 66 18 118 l34-42 q-30-30 -20-76z" fill="${steel}"/>` +
    `<path d="M832 300 V506" stroke="#262c66" stroke-width="7"/>` +
    `<rect x="900" y="500" width="210" height="22" rx="8" fill="#262c66"/>` +
    `<circle cx="1000" cy="230" r="16" fill="#ffc93d"/>` +
    barrelAt(640, 352) +
    barrelAt(784, 372) +
    // 기름방울 + 화살표
    `<path d="M470 110c44 60 66 96 66 126a66 66 0 0 1-132 0c0-30 22-66 66-126z" fill="${drop}"/>` +
    `<path d="M440 236c4 20 16 34 34 38" stroke="#ffffff" stroke-opacity=".6" stroke-width="9" stroke-linecap="round" fill="none"/>` +
    arrowBadge(d, 560, up ? 128 : 300, 38, up, "ab");
  return `${d}${body}`;
}

function housing(mood: ThumbMood): string {
  const up = mood !== "down";
  const d = new Defs();
  const sky = d.lin("sky", [[0, "#bcdcff"], [1, "#f1f7ff"]]);
  const soft = d.blur("soft", 40);
  const sh = d.blur("sh", 12);
  const bld = (x: number, w: number, h: number, c1: string, c2: string, id: string) => {
    const y = 540 - h;
    const face = d.lin(`${id}f`, [[0, c1], [1, c2]]);
    const wins: string[] = [];
    for (let yy = y + 28; yy < 516; yy += 44) for (let xx = x + 18; xx < x + w - 26; xx += 38) wins.push(`<rect x="${xx}" y="${yy}" width="20" height="24" rx="4" fill="#ffffff" opacity="${(xx + yy) % 3 ? 0.75 : 0.45}"/>`);
    return `<path d="M${x + w} ${y + 10} l26 -14 v${h - 2} l-26 14z" fill="${c2}" opacity=".85"/>` + `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="${face}"/>` + wins.join("");
  };
  const tag = d.lin("tg", [[0, "#ffffff"], [1, "#eef0ff"]]);
  const body =
    "" +
    bg(sky) +
    `<circle cx="1080" cy="96" r="50" fill="#ffe27a"/>` +
    blob(1080, 96, 110, "#ffe27a", soft, 0.6) +
    `<g fill="#ffffff" opacity=".9"><ellipse cx="560" cy="130" rx="90" ry="26"/><ellipse cx="612" cy="112" rx="52" ry="32"/></g>` +
    shadow(880, 552, 330, 18, sh, 0.25) +
    bld(560, 140, 250, "#c9d4ff", "#97a8f5", "b1") +
    bld(700, 160, 400, "#ffd0e1", "#f59ab9", "b2") +
    bld(864, 140, 300, "#ffe7a3", "#f6c654", "b3") +
    bld(1006, 150, 350, "#b9f2d8", "#6fd7a8", "b4") +
    `<rect x="520" y="536" width="680" height="20" rx="4" fill="#9fb1d6"/>` +
    // 가격표 (가장 높은 건물에서)
    `<path d="M780 140 L812 92" stroke="#7a86b8" stroke-width="4"/>` +
    `<g transform="rotate(${up ? -10 : 10} 860 92)">${shadow(870, 130, 70, 8, sh, 0.25)}<path d="M802 62 h120 a14 14 0 0 1 10 4 l26 26 -26 26 a14 14 0 0 1 -10 4 h-120 a10 10 0 0 1 -10 -10 v-40 a10 10 0 0 1 10 -10z" fill="${tag}"/><circle cx="930" cy="92" r="7" fill="#c7cae6"/><rect x="822" y="82" width="70" height="10" rx="5" fill="#d9dcef"/><rect x="822" y="98" width="46" height="8" rx="4" fill="#e8eaf6"/></g>` +
    arrowBadge(d, 980, 50 + (up ? 0 : 6), 32, up, "ab");
  return `${d}${body}`;
}

function prices(): string {
  const d = new Defs();
  const sky = d.lin("sky", [[0, "#ffd9b8"], [1, "#fff4ea"]]);
  const soft = d.blur("soft", 50);
  const sh = d.blur("sh", 12);
  const chrome = d.lin("cr", [[0, "#e9ecf7"], [1, "#9aa3c7"]], 0, 0, 1, 1);
  const basket = d.lin("bk", [[0, "#ffffff", 0.95], [1, "#e9ecf7", 0.95]]);
  const apple = d.rad("ap", [[0, "#ff9a9a"], [0.6, "#f2374f"], [1, "#b81d35"]], 0.35, 0.3, 0.8);
  const onion = d.lin("on", [[0, "#7be0a0"], [1, "#2e9e5c"]]);
  const tagF = d.lin("tf", [[0, "#ffffff"], [1, "#f1f3fb"]]);
  const tag = (x: number, y: number, rot: number) =>
    `<g transform="rotate(${rot} ${x} ${y})">${shadow(x + 54, y + 60, 54, 7, sh, 0.25)}<path d="M${x} ${y} h92 l26 26 -26 26 h-92 a8 8 0 0 1 -8 -8 v-36 a8 8 0 0 1 8 -8z" fill="${tagF}"/><path d="M${x + 38} ${y + 40}V${y + 14}M${x + 26} ${y + 26}l12-12 12 12" stroke="#f2374f" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none"/><circle cx="${x + 100}" cy="${y + 26}" r="4" fill="#c7cae6"/></g>`;
  const body =
    "" +
    bg(sky) +
    blob(1020, 120, 200, "#ffb38a", soft, 0.5) +
    blob(520, 560, 160, "#ffe08a", soft, 0.5) +
    shadow(860, 560, 230, 18, sh, 0.28) +
    // 물건
    `<path d="M740 270 L708 96" stroke="${onion}" stroke-width="24" stroke-linecap="round"/><path d="M708 96 L696 56" stroke="#c7f5d8" stroke-width="24" stroke-linecap="round"/><path d="M776 270 L786 110" stroke="${onion}" stroke-width="20" stroke-linecap="round"/>` +
    `<rect x="808" y="150" width="96" height="124" rx="10" fill="#ffffff"/><path d="M808 150 L856 110 L904 150 Z" fill="#9fd0ff"/><rect x="820" y="186" width="72" height="34" rx="6" fill="#d9ecff"/>` +
    `<circle cx="958" cy="230" r="50" fill="${apple}"/><path d="M958 182 q8-24 26-28" stroke="#2e9e5c" stroke-width="7" stroke-linecap="round" fill="none"/><ellipse cx="940" cy="210" rx="12" ry="8" fill="#ffffff" opacity=".55"/>` +
    // 장바구니
    `<path d="M690 252 H1048 L1012 438 H726 Z" fill="${basket}"/>` +
    `<path d="M700 300 H1036 M712 352 H1026 M720 404 H1018 M790 252 L800 438 M876 252 L876 438 M960 252 L950 438" stroke="#c7cde6" stroke-width="5"/>` +
    `<path d="M560 168 H636 L702 452 H1004" stroke="${chrome}" stroke-width="16" stroke-linecap="round" stroke-linejoin="round" fill="none"/>` +
    `<circle cx="744" cy="498" r="30" fill="#3b3f63"/><circle cx="744" cy="498" r="12" fill="#c7cde6"/><circle cx="972" cy="498" r="30" fill="#3b3f63"/><circle cx="972" cy="498" r="12" fill="#c7cde6"/>` +
    tag(470, 260, -10) +
    tag(1040, 80, 12) +
    tag(500, 120, 6);
  return `${d}${body}`;
}

function security(): string {
  const d = new Defs();
  const sky = d.lin("sky", [[0, "#0b0f33"], [1, "#1b2266"]]);
  const soft = d.blur("soft", 60);
  const glow = d.blur("glow", 16);
  const shield = d.lin("sd", [[0, "#ffffff"], [1, "#c9bfff"]], 0, 0, 1, 1);
  const shield2 = d.lin("sd2", [[0, "#8f7bff"], [1, "#533afd"]], 0, 0, 1, 1);
  const lock = d.lin("lk", [[0, "#ffe08a"], [1, "#e0a000"]]);
  const warn = d.lin("wn", [[0, "#ffd84d"], [1, "#ff9f1a"]]);
  const bits: string[] = [];
  for (let y = 40; y < SCENE_H; y += 36) for (let x = 400 + ((y / 36) % 2) * 22; x < SCENE_W; x += 66) bits.push(`<rect x="${x}" y="${y}" width="${(x * 7 + y) % 3 ? 28 : 12}" height="9" rx="4.5" fill="#5eead4" opacity=".1"/>`);
  const body =
    "" +
    bg(sky) +
    bits.join("") +
    blob(880, 300, 230, "#533afd", soft, 0.7) +
    // 방패 (빛 번짐 + 두 겹)
    `<path d="M880 80 L1060 146 V290 C1060 404 984 478 880 528 C776 478 700 404 700 290 V146 Z" fill="#8f7bff" opacity=".5" filter="${glow}"/>` +
    `<path d="M880 80 L1060 146 V290 C1060 404 984 478 880 528 C776 478 700 404 700 290 V146 Z" fill="${shield}"/>` +
    `<path d="M880 112 L1028 166 V290 C1028 386 966 448 880 492 C794 448 732 386 732 290 V166 Z" fill="${shield2}"/>` +
    `<path d="M880 112 L1028 166 V290 C1028 386 966 448 880 492 Z" fill="#ffffff" opacity=".1"/>` +
    // 자물쇠
    `<path d="M836 288 V256 a44 44 0 0 1 88 0 V288" stroke="#ffffff" stroke-width="16" fill="none" stroke-linecap="round"/>` +
    `<rect x="812" y="282" width="136" height="112" rx="20" fill="${lock}"/>` +
    `<circle cx="880" cy="328" r="14" fill="#9a5d00"/><rect x="874" y="332" width="12" height="30" rx="6" fill="#9a5d00"/>` +
    // 경고 배지
    `<path d="M560 120 L640 262 H480 Z" fill="#ff9f1a" opacity=".5" filter="${glow}"/>` +
    `<path d="M560 116 Q566 106 572 116 L644 252 Q648 264 636 264 H484 Q472 264 476 252 Z" fill="${warn}"/>` +
    `<rect x="553" y="160" width="14" height="56" rx="7" fill="#1c1e54"/><circle cx="560" cy="236" r="9" fill="#1c1e54"/>` +
    // 스캔선
    `<path d="M700 300 H1060" stroke="#5eead4" stroke-width="4" opacity=".8" filter="${d.blur("sc", 3)}"/>`;
  return `${d}${body}`;
}

function chip(): string {
  const d = new Defs();
  const sky = d.lin("sky", [[0, "#1d1460"], [1, "#4b37e8"]], 0, 0, 1, 1);
  const soft = d.blur("soft", 60);
  const glow = d.blur("glow", 8);
  const chipBody = d.lin("bd", [[0, "#3a3f78"], [1, "#151838"]], 0, 0, 1, 1);
  const die = d.lin("di", [[0, "#ffe9a3"], [1, "#e0a000"]], 0, 0, 1, 1);
  const pin = d.lin("pi", [[0, "#e9ecf7"], [1, "#9aa3c7"]]);
  const ends: [number, number][] = [
    [480, 130],
    [440, 320],
    [520, 500],
    [1150, 110],
    [1170, 330],
    [1130, 540],
    [860, 40],
    [920, 600],
  ];
  const traces = ends
    .map(([x, y]) => {
      const p = `M880 320 L${x < 880 ? 760 : 1000} ${y < 320 ? Math.max(y + 60, 200) : Math.min(y - 60, 440)} L${x} ${y}`;
      return `<path d="${p}" stroke="#5eead4" stroke-width="12" opacity=".45" fill="none" stroke-linejoin="round" filter="${glow}"/><path d="${p}" stroke="#a7fff1" stroke-width="4" fill="none" stroke-linejoin="round"/><circle cx="${x}" cy="${y}" r="10" fill="#a7fff1"/>`;
    })
    .join("");
  const pins: string[] = [];
  for (let i = 0; i < 6; i++) {
    const p = 762 + i * 47;
    pins.push(`<rect x="${p}" y="166" width="14" height="34" rx="5" fill="${pin}"/><rect x="${p}" y="440" width="14" height="34" rx="5" fill="${pin}"/>`);
    pins.push(`<rect x="706" y="${208 + i * 42}" width="34" height="14" rx="5" fill="${pin}"/><rect x="1020" y="${208 + i * 42}" width="34" height="14" rx="5" fill="${pin}"/>`);
  }
  const body =
    "" +
    bg(sky) +
    blob(880, 320, 260, "#5eead4", soft, 0.35) +
    traces +
    pins.join("") +
    `<rect x="736" y="202" width="288" height="260" rx="30" fill="#000000" opacity=".35" filter="${d.blur("sh", 14)}"/>` +
    `<rect x="736" y="190" width="288" height="260" rx="30" fill="${chipBody}"/>` +
    `<rect x="736" y="190" width="288" height="260" rx="30" fill="none" stroke="#ffffff" stroke-opacity=".15" stroke-width="2"/>` +
    `<rect x="806" y="256" width="148" height="128" rx="16" fill="${die}"/>` +
    `<path d="M830 290 h100 M830 320 h100 M830 350 h64" stroke="#b37e00" stroke-width="6" stroke-linecap="round" opacity=".55"/>`;
  return `${d}${body}`;
}

function trade(): string {
  const d = new Defs();
  const sky = d.lin("sky", [[0, "#bfe0ff"], [1, "#eef6ff"]]);
  const sea = d.lin("sea", [[0, "#6fb3f2"], [1, "#2f7fd6"]]);
  const soft = d.blur("soft", 40);
  const hull = d.lin("hl", [[0, "#2b357e"], [1, "#161b48"]]);
  const box = (x: number, y: number, c1: string, c2: string, id: string) => {
    const f = d.lin(id, [[0, c1], [1, c2]]);
    return `<rect x="${x}" y="${y}" width="108" height="54" rx="5" fill="${f}"/>` + `<path d="M${x + 18} ${y + 8}v38M${x + 36} ${y + 8}v38M${x + 54} ${y + 8}v38M${x + 72} ${y + 8}v38M${x + 90} ${y + 8}v38" stroke="#ffffff" stroke-opacity=".25" stroke-width="3"/>`;
  };
  const body =
    "" +
    bg(sky) +
    blob(1060, 110, 160, "#ffffff", soft, 0.8) +
    `<g fill="#ffffff" opacity=".85"><ellipse cx="620" cy="110" rx="90" ry="24"/><ellipse cx="672" cy="94" rx="52" ry="30"/></g>` +
    `<path d="M0 452 Q150 430 300 452 T600 452 T900 452 T1200 452 V630 H0 Z" fill="${sea}"/>` +
    `<g transform="translate(40 0)">` +
    `<path d="M520 410 H1130 L1080 508 H572 Z" fill="${hull}"/>` +
    `<rect x="520" y="400" width="610" height="16" rx="4" fill="#ff4d6d"/>` +
    `<rect x="1000" y="240" width="92" height="164" rx="10" fill="#ffffff"/><rect x="1014" y="262" width="64" height="12" rx="6" fill="#9fd0ff"/><rect x="1014" y="288" width="64" height="12" rx="6" fill="#9fd0ff"/>` +
    box(560, 346, "#ffa45c", "#f27a2a", "c1") +
    box(670, 346, "#4fe39a", "#1bb36c", "c2") +
    box(780, 346, "#8f7bff", "#533afd", "c3") +
    box(890, 346, "#ffd84d", "#f2b100", "c4") +
    box(615, 290, "#6fb7ff", "#2f7fd6", "c5") +
    box(725, 290, "#ff8aa0", "#e8335a", "c6") +
    box(835, 290, "#5eead4", "#14b8a6", "c7") +
    box(670, 234, "#c38bff", "#9333ea", "c8") +
    box(780, 234, "#ffa45c", "#f27a2a", "c9") +
    `</g>` +
    `<path d="M560 540 q30-12 60 0 t60 0 t60 0M860 556 q30-12 60 0 t60 0" stroke="#ffffff" stroke-opacity=".7" stroke-width="5" fill="none" stroke-linecap="round"/>`;
  return `${d}${body}`;
}

function bond(): string {
  const d = new Defs();
  const sky = d.lin("sky", [[0, "#8f9bdc"], [1, "#e4e8ff"]]);
  const soft = d.blur("soft", 30);
  const sh = d.blur("sh", 12);
  const umb = d.lin("um", [[0, "#ffe27a"], [1, "#ffb020"]]);
  const goldB = d.lin("gb", [[0, "#ffe9a3"], [1, "#d99a00"]]);
  const paperF = d.lin("pp", [[0, "#ffffff"], [1, "#f1f2fb"]]);
  const rain: string[] = [];
  for (let i = 0; i < 46; i++) {
    const x = (i * 97) % SCENE_W;
    const y = 110 + ((i * 53) % 420);
    if (x > 620 && x < 1120 && y > 220) continue; // 우산 아래는 비가 안 와요
    rain.push(`<path d="M${x} ${y}l-9 26" stroke="#ffffff" stroke-opacity=".55" stroke-width="3.5" stroke-linecap="round"/>`);
  }
  const paper = (x: number, y: number, rot: number) =>
    `<g transform="rotate(${rot} ${x + 85} ${y + 55})">${shadow(x + 85, y + 112, 80, 8, sh, 0.22)}<rect x="${x}" y="${y}" width="170" height="110" rx="10" fill="${paperF}"/><rect x="${x + 18}" y="${y + 24}" width="92" height="10" rx="5" fill="#c9cdf0"/><rect x="${x + 18}" y="${y + 46}" width="120" height="8" rx="4" fill="#e1e4f7"/><rect x="${x + 18}" y="${y + 64}" width="80" height="8" rx="4" fill="#e1e4f7"/><circle cx="${x + 140}" cy="${y + 82}" r="15" fill="#ff4d6d"/><circle cx="${x + 140}" cy="${y + 82}" r="7" fill="#ffd3dc"/></g>`;
  const body =
    "" +
    bg(sky) +
    `<g fill="#6b76b8" opacity=".85" filter="${soft}"><ellipse cx="220" cy="70" rx="200" ry="60"/><ellipse cx="560" cy="40" rx="190" ry="52"/><ellipse cx="1020" cy="60" rx="230" ry="62"/></g>` +
    rain.join("") +
    `<g transform="translate(60 -6)">` +
    shadow(860, 540, 230, 16, sh, 0.25) +
    // 우산
    `<path d="M600 290 Q860 30 1120 290 Z" fill="${umb}"/>` +
    `<path d="M860 46 Q790 160 730 290 M860 46 Q930 160 990 290" stroke="#e09a00" stroke-width="4" fill="none" opacity=".6"/>` +
    `<path d="M600 290 Q665 262 730 290 Q795 262 860 290 Q925 262 990 290 Q1055 262 1120 290 L1120 296 Q1055 272 990 296 Q925 272 860 296 Q795 272 730 296 Q665 272 600 296 Z" fill="#e09a00"/>` +
    `<path d="M660 230 Q720 120 840 80" stroke="#ffffff" stroke-opacity=".55" stroke-width="10" stroke-linecap="round" fill="none"/>` +
    `<path d="M860 40 V496 q0 40 -36 40 q-30 0 -30 -30" stroke="#3b3f63" stroke-width="12" fill="none" stroke-linecap="round"/>` +
    paper(660, 360, -4) +
    paper(690, 318, 3) +
    `<path d="M900 500 h130 l-22 -54 h-86z" fill="${goldB}"/><path d="M932 446 h76 l-16 -38 h-44z" fill="${goldB}"/><path d="M930 470 h70" stroke="#ffffff" stroke-opacity=".5" stroke-width="5" stroke-linecap="round"/>` +
    `</g>`;
  return `${d}${body}`;
}

function news(): string {
  const d = new Defs();
  const sky = d.lin("sky", [[0, "#e4ddff"], [1, "#f8f6ff"]]);
  const soft = d.blur("soft", 50);
  const sh = d.blur("sh", 14);
  const lens = d.rad("ln", [[0, "#ffffff", 0.9], [1, "#bfe3ff", 0.6]], 0.35, 0.35, 0.8);
  const rim = d.lin("rm", [[0, "#8f7bff"], [1, "#3a2fb8"]], 0, 0, 1, 1);
  const paper = (x: number, y: number, rot: number) =>
    `<g transform="rotate(${rot} ${x + 170} ${y + 120})">${shadow(x + 170, y + 250, 170, 14, sh, 0.25)}<rect x="${x}" y="${y}" width="340" height="240" rx="14" fill="#ffffff"/><rect x="${x + 24}" y="${y + 24}" width="130" height="86" rx="10" fill="#d9d1ff"/><rect x="${x + 172}" y="${y + 30}" width="140" height="14" rx="7" fill="#c7cae6"/><rect x="${x + 172}" y="${y + 58}" width="120" height="10" rx="5" fill="#e1e3f3"/><rect x="${x + 172}" y="${y + 80}" width="100" height="10" rx="5" fill="#e1e3f3"/><rect x="${x + 24}" y="${y + 134}" width="290" height="10" rx="5" fill="#e1e3f3"/><rect x="${x + 24}" y="${y + 158}" width="290" height="10" rx="5" fill="#e1e3f3"/><rect x="${x + 24}" y="${y + 182}" width="200" height="10" rx="5" fill="#e1e3f3"/></g>`;
  const body =
    "" +
    bg(sky) +
    blob(1000, 140, 200, "#b9a8ff", soft, 0.6) +
    paper(600, 160, -7) +
    paper(690, 200, 5) +
    // 돋보기
    `<path d="M1084 290 L1150 368" stroke="#3a2fb8" stroke-width="30" stroke-linecap="round"/>` +
    `<circle cx="1034" cy="226" r="92" fill="${lens}"/>` +
    `<circle cx="1034" cy="226" r="92" fill="none" stroke="${rim}" stroke-width="16"/>` +
    `<path d="M986 184 q22-30 58-36" stroke="#ffffff" stroke-width="12" stroke-linecap="round" fill="none"/>`;
  return `${d}${body}`;
}

/** 인물 발언 장면의 배경 (기자회견장) — 콩이·연단은 따로 그림 */
function speech(): string {
  const d = new Defs();
  const sky = d.lin("sky", [[0, "#1a2163"], [1, "#363f93"]]);
  const soft = d.blur("soft", 40);
  const beam = d.lin("bm", [[0, "#ffffff", 0.22], [1, "#ffffff", 0]]);
  const flagA = d.lin("fa", [[0, "#e7e1ff"], [0.5, "#ffffff"], [1, "#cfc6ff"]], 0, 0, 1, 0);
  const flagB = d.lin("fb", [[0, "#ffe1e7"], [0.5, "#ffffff"], [1, "#ffc2cf"]], 0, 0, 1, 0);
  const flag = (x: number, f: string) =>
    `<rect x="${x - 4}" y="70" width="8" height="380" rx="4" fill="#9aa3c7"/><circle cx="${x}" cy="66" r="9" fill="#ffd84d"/>` +
    `<path d="M${x + 4} 86 q64 -22 128 0 t128 0 v128 q-64 -22 -128 0 t-128 0z" fill="${f}"/>`;
  const body =
    "" +
    bg(sky) +
    `<path d="M600 0 L780 0 L1040 630 L380 630 Z" fill="${beam}"/>` +
    `<path d="M930 0 L1070 0 L1200 330 L1200 630 L900 630 Z" fill="${beam}"/>` +
    blob(880, 330, 220, "#7b66ff", soft, 0.5) +
    flag(600, flagA) +
    flag(1010, flagB) +
    // 뒤 벽 무늬
    Array.from({ length: 6 }, (_, i) => `<rect x="${440 + i * 130}" y="470" width="110" height="160" rx="10" fill="#ffffff" opacity=".04"/>`).join("");
  return `${d}${body}`;
}

export const SCENE_SVG: Record<SceneKey, (mood: ThumbMood) => string> = {
  speech,
  market,
  rate,
  fx,
  oil,
  housing,
  prices,
  security,
  chip,
  trade,
  bond,
  news,
};

export function sceneSvg(key: SceneKey, mood: ThumbMood): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SCENE_W}" height="${SCENE_H}" viewBox="0 0 ${SCENE_W} ${SCENE_H}">${SCENE_SVG[key](mood)}</svg>`;
}
