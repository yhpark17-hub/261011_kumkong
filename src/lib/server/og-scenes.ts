import "server-only";
import type { SceneKey, ThumbMood } from "@/lib/news-meta";

/**
 * 금콩 브리핑 공유 썸네일의 '뉴스 그림' — 만화 칸(1144×574) 전체를 채우는 장면.
 * 왼쪽 위(칸 이름)와 왼쪽 아래(제목 상자)는 비워 두고, 주인공 그림은 오른쪽·가운데 위에 크게.
 * 사진은 쓰지 않고(저작권) 모두 직접 그린 도형이에요.
 */

export const SCENE_W = 1144;
export const SCENE_H = 574;

const INK = "#1c1e54";
const RED = "#ff4d6d";
const GREEN = "#2fd27a";
const YELLOW = "#ffd84d";
const PRIMARY = "#533afd";

const o = (w = 6) => `stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
const rect = (x: number, y: number, w: number, h: number, fill: string, r = 0, sw = 6) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" ${o(sw)}/>`;
const path = (d: string, fill: string, sw = 6) => `<path d="${d}" fill="${fill}" ${o(sw)}/>`;
const line = (d: string, color = INK, w = 6) => `<path d="${d}" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;

/** 굵은 화살표 (위·아래) — 끝이 (x, y) */
function arrow(x: number, y: number, up: boolean, size = 1, fill = up ? GREEN : RED): string {
  const s = size;
  const d = up
    ? `M${x} ${y} l${54 * s} ${60 * s} h${-30 * s} v${80 * s} h${-48 * s} v${-80 * s} h${-30 * s}z`
    : `M${x} ${y} l${54 * s} ${-60 * s} h${-30 * s} v${-80 * s} h${-48 * s} v${80 * s} h${-30 * s}z`;
  return path(d, fill, 6);
}

/** 동전 ($ · ₩) */
function coin(cx: number, cy: number, r: number, kind: "won" | "dollar"): string {
  const k = r / 70;
  const glyph =
    kind === "dollar"
      ? line(`M${cx + 22 * k} ${cy - 24 * k}c${-10 * k} ${-10 * k} ${-44 * k} ${-10 * k} ${-44 * k} ${10 * k}c0 ${18 * k} ${44 * k} ${8 * k} ${44 * k} ${28 * k}c0 ${20 * k} ${-36 * k} ${22 * k} ${-46 * k} ${10 * k}`, INK, 9 * k) +
        line(`M${cx} ${cy - 42 * k}v${84 * k}`, INK, 8 * k)
      : line(`M${cx - 32 * k} ${cy - 28 * k}l${14 * k} ${56 * k}l${18 * k} ${-42 * k}l${18 * k} ${42 * k}l${14 * k} ${-56 * k}`, INK, 8 * k) +
        line(`M${cx - 40 * k} ${cy - 4 * k}h${80 * k}M${cx - 36 * k} ${cy + 12 * k}h${72 * k}`, INK, 6 * k);
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${kind === "dollar" ? "#9be3b4" : YELLOW}" ${o(6)}/><circle cx="${cx}" cy="${cy}" r="${r - 12}" fill="none" stroke="${INK}" stroke-opacity=".25" stroke-width="4"/>${glyph}`;
}

/** % 기호 */
function percent(cx: number, cy: number, k: number, fill: string): string {
  return (
    `<circle cx="${cx - 34 * k}" cy="${cy - 34 * k}" r="${22 * k}" fill="${fill}" ${o(6)}/>` +
    `<circle cx="${cx + 34 * k}" cy="${cy + 34 * k}" r="${22 * k}" fill="${fill}" ${o(6)}/>` +
    line(`M${cx + 44 * k} ${cy - 56 * k}L${cx - 44 * k} ${cy + 56 * k}`, INK, 14 * k) +
    line(`M${cx + 44 * k} ${cy - 56 * k}L${cx - 44 * k} ${cy + 56 * k}`, fill, 7 * k)
  );
}

/** 배경 점무늬 */
const dots = (color: string, op = 0.08, step = 22) =>
  `<defs><pattern id="sd" width="${step}" height="${step}" patternUnits="userSpaceOnUse"><circle cx="5" cy="5" r="2.6" fill="${color}" fill-opacity="${op}"/></pattern></defs><rect width="${SCENE_W}" height="${SCENE_H}" fill="url(#sd)"/>`;

const bg = (fill: string) => `<rect width="${SCENE_W}" height="${SCENE_H}" fill="${fill}"/>`;
const grad = (id: string, a: string, b: string, vertical = true) =>
  `<defs><linearGradient id="${id}" x1="0" y1="0" x2="${vertical ? 0 : 1}" y2="${vertical ? 1 : 0}"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="${SCENE_W}" height="${SCENE_H}" fill="url(#${id})"/>`;

/* ------------------------------------------------------------------ */

function market(mood: ThumbMood): string {
  const up = mood === "up";
  const parts = [grad("mk", "#141845", "#2a2f7a"), dots("#ffffff", 0.06)];
  // 격자
  for (let x = 380; x < SCENE_W; x += 76) parts.push(line(`M${x} 70V540`, "#ffffff", 1.5).replace('stroke-width="1.5"', 'stroke-width="1.5" stroke-opacity=".08"'));
  for (let y = 90; y < 560; y += 70) parts.push(line(`M380 ${y}H1120`, "#ffffff", 1.5).replace('stroke-width="1.5"', 'stroke-width="1.5" stroke-opacity=".08"'));
  // 촛대 12개 — 내림(빨강 위주) / 오름(초록 위주)
  const n = 12;
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const mid = up ? 470 - t * 330 + (i % 2 ? 26 : -18) : 130 + t * 330 + (i % 2 ? -22 : 24);
    const fall = up ? i % 4 === 3 : i % 4 !== 2;
    const h = 46 + ((i * 37) % 40);
    const x = 410 + i * 58;
    const color = fall ? RED : GREEN;
    parts.push(line(`M${x + 15} ${mid - h / 2 - 26}V${mid + h / 2 + 26}`, "#cfd3ff", 4));
    parts.push(rect(x, mid - h / 2, 30, h, color, 4, 4));
  }
  // 큰 화살표 (추세)
  parts.push(
    up
      ? line("M430 470 L600 380 L700 420 L900 230 L1010 150", INK, 30) + line("M430 470 L600 380 L700 420 L900 230 L1010 150", GREEN, 18) + arrow(1060, 96, true, 1.05)
      : line("M430 120 L600 220 L700 180 L900 380 L1010 450", INK, 30) + line("M430 120 L600 220 L700 180 L900 380 L1010 450", RED, 18) + arrow(1060, 506, false, 1.05),
  );
  return parts.join("");
}

function rate(mood: ThumbMood): string {
  const up = mood !== "down";
  const cols = [0, 1, 2, 3, 4].map((i) => rect(700 + i * 74, 300, 40, 170, "#f6f4ff", 4, 5)).join("");
  return (
    grad("rt", "#e4ddff", "#f7f4ff") +
    dots(PRIMARY, 0.08) +
    // 구름
    `<g fill="#ffffff" opacity=".9"><ellipse cx="520" cy="110" rx="90" ry="34"/><ellipse cx="580" cy="92" rx="60" ry="38"/><ellipse cx="1030" cy="80" rx="80" ry="28"/></g>` +
    // 은행 건물
    path("M660 300 L870 170 L1080 300 Z", "#ffffff", 6) +
    `<circle cx="870" cy="248" r="30" fill="${YELLOW}" ${o(5)}/>` +
    rect(660, 288, 420, 22, "#d9d1ff", 4, 5) +
    cols +
    rect(640, 470, 460, 26, "#d9d1ff", 4, 5) +
    rect(612, 496, 516, 30, "#c4b8ff", 4, 5) +
    // 큰 %
    percent(470, 230, 1.45, up ? "#ffb3c1" : "#bfe3ff") +
    arrow(600, up ? 120 : 380, up, 0.9, up ? RED : "#3b82f6")
  );
}

function fx(): string {
  return (
    grad("fx", "#d8f5e4", "#f2fbf6") +
    dots("#1f7a4a", 0.08) +
    // 저울 (제목 상자에 안 가리게 오른쪽 위로)
    `<g transform="translate(6 -40)">` +
    path("M760 150 L728 500 H792 Z", "#a8743f", 6) +
    rect(670, 496, 180, 34, "#8a5a2b", 8, 6) +
    line("M500 200 L1020 168", INK, 18) +
    line("M500 200 L1020 168", "#c99a62", 9) +
    `<circle cx="760" cy="184" r="20" fill="${YELLOW}" ${o(5)}/>` +
    // 왼쪽(₩)·오른쪽($) 접시
    line("M500 200 L440 350M500 200 L560 350", INK, 4) +
    line("M1020 168 L960 318M1020 168 L1080 318", INK, 4) +
    path("M420 350 Q500 396 580 350 Z", "#e3e1f0", 5) +
    path("M940 318 Q1020 364 1100 318 Z", "#e3e1f0", 5) +
    coin(500, 280, 74, "won") +
    coin(1020, 248, 74, "dollar") +
    // 흔들림 표시
    line("M380 160 q-16 20 0 40M350 150 q-22 30 0 60M1110 120 q16 20 0 40", PRIMARY, 6) +
    `</g>`
  );
}

function oil(mood: ThumbMood): string {
  const up = mood !== "down";
  const barrel = (x: number, y: number) =>
    rect(x, y, 130, 170, "#2b2f55", 14, 6) + line(`M${x} ${y + 50}h130M${x} ${y + 120}h130`, INK, 6) + path(`M${x + 65} ${y + 64}c14 19 21 31 21 40a21 21 0 0 1-42 0c0-9 7-21 21-40z`, YELLOW, 4);
  return (
    grad("oi", "#ffb36b", "#fff1dc") +
    // 해
    `<circle cx="560" cy="150" r="70" fill="#ffe066" opacity=".9"/>` +
    // 땅
    path("M0 430 Q300 400 600 420 T1144 410 V574 H0 Z", "#f1c27d", 0) +
    // 펌프잭
    path("M930 470 L990 230 L1050 470 Z", "#3b3f63", 6) +
    line("M820 210 L1110 250", INK, 24) +
    line("M820 210 L1110 250", "#5c6390", 14) +
    path("M780 170 q-30 60 20 110 l30-40 q-30-30 -20-70z", "#5c6390", 6) +
    `<circle cx="990" cy="232" r="16" fill="${YELLOW}" ${o(5)}/>` +
    line("M800 270 V470", INK, 6) +
    rect(880, 466, 220, 30, "#5c6390", 6, 6) +
    // 드럼통
    barrel(640, 330) +
    barrel(780, 350) +
    // 큰 기름방울 + 화살표
    path("M420 110c40 56 60 90 60 118a60 60 0 0 1-120 0c0-28 20-62 60-118z", "#1c1e2e", 6) +
    line("M396 236c4 18 14 30 30 34", "#ffffff", 8) +
    arrow(520, up ? 70 : 300, up, 0.75, up ? RED : "#3b82f6")
  );
}

function housing(mood: ThumbMood): string {
  const up = mood !== "down";
  const bld = (x: number, w: number, h: number, fill: string) => {
    const y = 520 - h;
    const wins: string[] = [];
    for (let yy = y + 26; yy < 500; yy += 46) for (let xx = x + 20; xx < x + w - 30; xx += 42) wins.push(`<rect x="${xx}" y="${yy}" width="22" height="26" rx="3" fill="#ffffff" opacity=".85"/>`);
    return rect(x, y, w, h, fill, 8, 6) + wins.join("");
  };
  return (
    grad("hs", "#cfe6ff", "#f2f8ff") +
    `<circle cx="1050" cy="90" r="50" fill="#ffe066"/>` +
    bld(500, 150, 250, "#c7d2fe") +
    bld(640, 170, 400, "#fbcfe8") +
    bld(800, 150, 310, "#fde68a") +
    bld(940, 170, 360, "#a7f3d0") +
    rect(380, 516, 760, 30, "#94a3b8", 0, 0) +
    // 가격표 (가장 높은 건물에 매달림)
    line("M725 120 L760 70", INK, 5) +
    `<g transform="rotate(${up ? -12 : 12} 800 70)">${path("M760 40 h120 l40 30 -40 30 h-120z", "#ffffff", 6)}<circle cx="880" cy="70" r="8" fill="${INK}"/></g>` +
    arrow(820, up ? 30 : 110, up, 0.55, up ? RED : "#3b82f6")
  );
}

function prices(): string {
  const tag = (x: number, y: number, rot: number) =>
    `<g transform="rotate(${rot} ${x} ${y})">${path(`M${x} ${y} h90 l30 26 -30 26 h-90z`, "#ffffff", 5)}${line(`M${x + 40} ${y + 40}V${y + 12}M${x + 28} ${y + 24}l12-12 12 12`, RED, 6)}</g>`;
  return (
    grad("pr", "#ffe2c2", "#fff6ea") +
    dots("#9b6829", 0.07) +
    `<g transform="translate(30 0)">` +
    // 장바구니
    line("M520 150 H600 L660 420 H1000 L1050 220 H630", INK, 12) +
    `<circle cx="700" cy="470" r="30" fill="${INK}"/><circle cx="960" cy="470" r="30" fill="${INK}"/>` +
    // 물건: 대파·우유·사과·빵
    line("M720 230 L690 70", "#3fa36b", 22) + line("M690 70 L676 30", "#9be3b4", 22) + line("M752 230 L760 90", "#56c08a", 18) +
    rect(790, 120, 90, 120, "#ffffff", 8, 6) + path("M790 120 L835 80 L880 120 Z", "#bfe3ff", 6) +
    `<circle cx="930" cy="200" r="46" fill="${RED}" ${o(6)}/>` + line("M930 154 q6-20 22-24", "#3fa36b", 6) +
    rect(680, 220, 300, 200, "#fff6e5", 6, 0) +
    line("M650 280 H1020M670 350 H1000", INK, 4) +
    line("M650 220 L700 420M760 220 L790 420M870 220 L870 420M980 220 L950 420", INK, 4) +
    tag(430, 260, -10) +
    tag(1000, 70, 12) +
    tag(480, 120, 8) +
    `</g>`
  );
}

function security(): string {
  const bits: string[] = [];
  for (let y = 40; y < SCENE_H; y += 34) for (let x = 20 + ((y / 34) % 2) * 20; x < SCENE_W; x += 64) bits.push(`<rect x="${x}" y="${y}" width="${(x * 7 + y) % 3 ? 26 : 12}" height="10" rx="5" fill="#34d399" opacity=".13"/>`);
  return (
    bg("#12163a") +
    bits.join("") +
    // 방패 + 자물쇠
    path("M840 70 L1010 130 V270 C1010 380 940 450 840 500 C740 450 670 380 670 270 V130 Z", "#ece8ff", 7) +
    path("M840 110 L970 156 V270 C970 360 915 420 840 458 Z", "#d9d1ff", 0) +
    rect(780, 260, 120, 100, INK, 12, 0) +
    line("M800 260 V230 a40 40 0 0 1 80 0 V260", INK, 16) +
    `<circle cx="840" cy="300" r="12" fill="${YELLOW}"/>` +
    // 경고 표시
    path("M520 120 L600 260 H440 Z", YELLOW, 6) +
    line("M520 170 V215", INK, 10) +
    `<circle cx="520" cy="238" r="7" fill="${INK}"/>` +
    // 깨진 금
    line("M1040 330 l40 30 -30 30 40 40", RED, 8)
  );
}

function chip(): string {
  const traces: string[] = [];
  const ends = [
    [470, 120],
    [430, 300],
    [520, 470],
    [1120, 100],
    [1130, 300],
    [1100, 500],
    [800, 40],
    [880, 560],
  ];
  for (const [x, y] of ends) {
    traces.push(line(`M820 300 L${(820 + x) / 2} ${y < 300 ? 300 : 300} L${x} ${y}`, "#5eead4", 6).replace("stroke-width=\"6\"", 'stroke-width="6" stroke-opacity=".55"'));
    traces.push(`<circle cx="${x}" cy="${y}" r="12" fill="#5eead4"/>`);
  }
  const pins: string[] = [];
  for (let i = 0; i < 6; i++) {
    const p = 690 + i * 52;
    pins.push(line(`M${p} 170V140M${p} 430V460`, "#cfd3ff", 10));
    pins.push(line(`M690 ${170 + i * 52}H660M950 ${170 + i * 52}H980`, "#cfd3ff", 10).replace(`M690 ${170 + i * 52}`, `M690 ${178 + i * 46}`).replace(`M950 ${170 + i * 52}`, `M950 ${178 + i * 46}`));
  }
  return (
    grad("cp", "#24186b", "#533afd", false) +
    traces.join("") +
    pins.join("") +
    rect(690, 170, 260, 260, "#2b2f55", 22, 7) +
    rect(750, 230, 140, 140, YELLOW, 12, 6) +
    line("M780 270 h80M780 300 h80M780 330 h80", "#c99a1a", 6)
  );
}

function trade(): string {
  const box = (x: number, y: number, w: number, fill: string) => rect(x, y, w, 56, fill, 4, 5) + line(`M${x + 20} ${y + 10}v36M${x + 40} ${y + 10}v36M${x + 60} ${y + 10}v36`, INK, 3);
  return (
    grad("td", "#cfe6ff", "#eef6ff") +
    // 바다
    path("M0 440 Q100 420 200 440 T400 440 T600 440 T800 440 T1000 440 T1200 440 V574 H0 Z", "#7cb7f0", 0) +
    // 배 (제목 상자에 안 가리게 오른쪽으로)
    `<g transform="translate(40 0) scale(.96)">` +
    path("M470 400 H1110 L1060 500 H530 Z", "#26306b", 7) +
    rect(470, 392, 640, 20, "#ea2261", 0, 6) +
    rect(980, 230, 90, 166, "#ffffff", 8, 6) +
    line("M995 260 h60M995 290 h60", "#7cb7f0", 10) +
    box(520, 336, 110, "#ff8a3d") +
    box(630, 336, 110, "#22c55e") +
    box(740, 336, 110, "#533afd") +
    box(850, 336, 110, YELLOW) +
    box(575, 280, 110, "#3b82f6") +
    box(685, 280, 110, "#ea2261") +
    box(795, 280, 110, "#14b8a6") +
    box(630, 224, 110, "#a855f7") +
    box(740, 224, 110, "#ff8a3d") +
    // 물결
    line("M520 520 q30-14 60 0 t60 0 t60 0M820 530 q30-14 60 0 t60 0", "#ffffff", 5) +
    `</g>`
  );
}

function bond(): string {
  const rain: string[] = [];
  for (let i = 0; i < 40; i++) {
    const x = (i * 97) % SCENE_W;
    const y = 120 + ((i * 53) % 380);
    rain.push(line(`M${x} ${y}l-10 26`, "#7c8bd6", 4));
  }
  const paper = (x: number, y: number) => rect(x, y, 170, 110, "#fffdf6", 6, 5) + line(`M${x + 20} ${y + 30}h90M${x + 20} ${y + 55}h120M${x + 20} ${y + 80}h70`, "#b9b9f9", 6) + `<circle cx="${x + 140}" cy="${y + 82}" r="14" fill="${RED}"/>`;
  return (
    grad("bd", "#aab6ec", "#e6eaff") +
    `<g fill="#6b76b8"><ellipse cx="200" cy="70" rx="160" ry="50"/><ellipse cx="420" cy="50" rx="140" ry="46"/><ellipse cx="1000" cy="60" rx="190" ry="52"/></g>` +
    rain.join("") +
    // 우산 (제목 상자에 안 가리게 오른쪽으로)
    `<g transform="translate(60 -10)">` +
    path("M600 280 Q840 40 1080 280 Q1020 250 960 280 Q900 250 840 280 Q780 250 720 280 Q660 250 600 280 Z", YELLOW, 7) +
    line("M840 120 V470 q0 40 -36 40 q-30 0 -30 -30", INK, 12) +
    // 우산 아래: 채권 종이 · 금괴
    paper(650, 340) +
    paper(680, 300) +
    path("M890 470 h120 l-20 -50 h-80z", "#ffcf4d", 6) +
    path("M920 420 h70 l-14 -36 h-42z", "#ffe27a", 6) +
    `</g>`
  );
}

function news(): string {
  const paper = (x: number, y: number, rot: number) =>
    `<g transform="rotate(${rot} ${x + 170} ${y + 120})">${rect(x, y, 340, 240, "#ffffff", 10, 6)}${rect(x + 24, y + 26, 120, 80, "#d9d1ff", 6, 0)}${line(`M${x + 164} ${y + 40}h150M${x + 164} ${y + 70}h150M${x + 164} ${y + 100}h110M${x + 24} ${y + 140}h290M${x + 24} ${y + 170}h290M${x + 24} ${y + 200}h200`, "#c7cae6", 8)}</g>`;
  return (
    grad("nw", "#ece8ff", "#f8f6ff") +
    dots(PRIMARY, 0.09) +
    paper(560, 150, -8) +
    paper(650, 190, 6) +
    // 돋보기
    `<circle cx="1000" cy="200" r="90" fill="#d8f0ff" fill-opacity=".8" ${o(10)}/>` +
    line("M1064 264 L1130 340", INK, 26) +
    line("M960 160 q20-30 54-34", "#ffffff", 10)
  );
}

/** 인물 발언 장면의 배경 (기자회견장) — 콩이·연단은 따로 그림 */
function speech(): string {
  const flag = (x: number, c1: string, c2: string) =>
    line(`M${x} 80 V420`, "#8d8fb8", 8) + path(`M${x} 90 q60 -20 120 0 t120 0 v120 q-60 -20 -120 0 t-120 0z`, c1, 5) + path(`M${x} 150 q60 -20 120 0 t120 0 v20 q-60 -20 -120 0 t-120 0z`, c2, 0);
  return (
    grad("sp", "#1f2a6b", "#3a4486") +
    // 조명
    `<path d="M560 0 L760 0 L1000 574 L360 574 Z" fill="#ffffff" opacity=".07"/><path d="M900 0 L1060 0 L1144 300 L1144 574 L880 574 Z" fill="#ffffff" opacity=".05"/>` +
    flag(560, "#d9d1ff", "#ffffff") +
    flag(980, "#ffd3dc", "#ffffff") +
    dots("#ffffff", 0.06, 26)
  );
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
