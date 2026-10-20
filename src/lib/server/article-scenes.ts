import "server-only";
import type { ArticleSceneKey, ArticleTone } from "@/lib/magazine-meta";
import { Defs, SCENE_H, SCENE_W, arrowBadge, bg, blob, coin, shadow } from "./og-scenes";

/**
 * 금융 블로그 글 썸네일 그림 — 1200×630 전체를 채우는 장면 (브리핑 썸네일과 같은 디자인팀 일러스트 느낌)
 * 왼쪽 위(금콩 이름표)와 왼쪽 아래(제목 카드)는 비워 두고, 주인공 그림은 오른쪽에 크게.
 * 사진은 쓰지 않고 모두 직접 그린 도형이에요. 기관 로고는 그림 위 간판 자리에 따로 얹어요(article-og).
 */

/** 기관 건물 장면 앞에 띄우는 작은 소품 — 글 주제(카테고리)에 맞춰 */
export type ScenePropKey = "exam" | "interview" | "doc";

/** 기관 간판 자리 (그림 좌표) — article-og 가 이 자리에 로고·이름을 얹어요 */
export const SIGN = { x: 806, y: 92, w: 200, h: 64 } as const;

/** 돈의 흐름 장면의 통 이름표 자리 (로고 + 기금 이름) */
export const FUND_BADGE = { x: 804, y: 236, w: 220, h: 58 } as const;

const tree = (d: Defs, x: number, base: number, r: number, id: string, dark = false) => {
  const leaf = dark ? d.rad(id, [[0, "#4fa57f"], [0.7, "#2b6f52"], [1, "#1d4f3b"]], 0.35, 0.3, 0.8) : d.rad(id, [[0, "#8be8b0"], [0.7, "#3fb574"], [1, "#2a8a55"]], 0.35, 0.3, 0.8);
  return (
    `<rect x="${x - 5}" y="${base - r * 1.2}" width="10" height="${r * 1.2}" rx="4" fill="#7a5b3a"/>` +
    `<circle cx="${x - r * 0.45}" cy="${base - r * 1.45}" r="${r * 0.78}" fill="${leaf}"/>` +
    `<circle cx="${x + r * 0.42}" cy="${base - r * 1.55}" r="${r * 0.72}" fill="${leaf}"/>` +
    `<circle cx="${x}" cy="${base - r * 2.05}" r="${r * 0.82}" fill="${leaf}"/>`
  );
};

const clouds = (op = 0.85) =>
  `<g fill="#ffffff" opacity="${op}"><ellipse cx="610" cy="118" rx="92" ry="28"/><ellipse cx="664" cy="100" rx="54" ry="34"/><ellipse cx="1110" cy="64" rx="76" ry="22"/><ellipse cx="1150" cy="52" rx="44" ry="26"/></g>`;

/** 필기 시험지 한 장 (머리띠 + 줄 + 체크) */
function examSheet(d: Defs, x: number, y: number, w: number, h: number, rot: number, id: string): string {
  const head = d.lin(`${id}h`, [[0, "#7b66ff"], [1, "#533afd"]], 0, 0, 1, 0);
  const rows = Math.floor((h - 70) / 30);
  let lines = "";
  for (let i = 0; i < rows; i++) {
    const yy = y + 66 + i * 30;
    const done = i % 3 !== 2;
    lines +=
      `<circle cx="${x + 24}" cy="${yy}" r="9" fill="${done ? "#e7fbef" : "#f1f2f8"}"/>` +
      (done ? `<path d="M${x + 19} ${yy}l4 4 7-8" stroke="#2f9e62" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>` : "") +
      `<rect x="${x + 42}" y="${yy - 4}" width="${w - 64 - ((i * 23) % 40)}" height="8" rx="4" fill="#dfe2f0"/>`;
  }
  return (
    `<g transform="rotate(${rot} ${x + w / 2} ${y + h / 2})">` +
    `<rect x="${x + 6}" y="${y + 12}" width="${w}" height="${h}" rx="16" fill="#0b1030" opacity=".16"/>` +
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="16" fill="#ffffff"/>` +
    `<path d="M${x} ${y + 16}a16 16 0 0 1 16 -16h${w - 32}a16 16 0 0 1 16 16v26h${-w}z" fill="${head}"/>` +
    `<rect x="${x + 16}" y="${y + 16}" width="${w * 0.42}" height="10" rx="5" fill="#ffffff" opacity=".85"/>` +
    lines +
    `</g>`
  );
}

/** 스톱워치 — 지나간 시간은 빨간 호 */
function stopwatch(d: Defs, cx: number, cy: number, r: number, id: string): string {
  const ring = d.lin(`${id}r`, [[0, "#ffffff"], [1, "#cfd3ea"]]);
  const glow = d.blur(`${id}b`, 10);
  const k = r / 78;
  const ar = r * 0.74;
  const circ = 2 * Math.PI * ar;
  let ticks = "";
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const r1 = r * 0.86;
    const r2 = r * (i % 3 === 0 ? 0.74 : 0.79);
    ticks += `<path d="M${cx + Math.sin(a) * r1} ${cy - Math.cos(a) * r1}L${cx + Math.sin(a) * r2} ${cy - Math.cos(a) * r2}" stroke="#9aa0c8" stroke-width="${(i % 3 === 0 ? 4 : 2.5) * k}" stroke-linecap="round"/>`;
  }
  return (
    `<circle cx="${cx}" cy="${cy + 10 * k}" r="${r}" fill="#1c1e54" opacity=".22" filter="${glow}"/>` +
    `<rect x="${cx - 12 * k}" y="${cy - r - 26 * k}" width="${24 * k}" height="${22 * k}" rx="${6 * k}" fill="#3b3f63"/>` +
    `<rect x="${cx - 22 * k}" y="${cy - r - 34 * k}" width="${44 * k}" height="${12 * k}" rx="${6 * k}" fill="#ff3d68"/>` +
    `<g transform="rotate(40 ${cx} ${cy})"><rect x="${cx - 8 * k}" y="${cy - r - 16 * k}" width="${16 * k}" height="${18 * k}" rx="${4 * k}" fill="#3b3f63"/></g>` +
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${ring}"/>` +
    `<circle cx="${cx}" cy="${cy}" r="${r * 0.9}" fill="#ffffff"/>` +
    `<circle cx="${cx}" cy="${cy}" r="${ar}" fill="none" stroke="#ff3d68" stroke-opacity=".9" stroke-width="${9 * k}" stroke-dasharray="${circ * 0.72} ${circ}" stroke-linecap="round" transform="rotate(-90 ${cx} ${cy})"/>` +
    ticks +
    `<path d="M${cx} ${cy}L${cx + Math.sin(-1.75) * r * 0.62} ${cy - Math.cos(-1.75) * r * 0.62}" stroke="#1c1e54" stroke-width="${6 * k}" stroke-linecap="round"/>` +
    `<path d="M${cx} ${cy}L${cx} ${cy - r * 0.48}" stroke="#533afd" stroke-width="${7 * k}" stroke-linecap="round"/>` +
    `<circle cx="${cx}" cy="${cy}" r="${9 * k}" fill="#1c1e54"/>` +
    `<path d="M${cx - r * 0.62} ${cy - r * 0.42} a${r * 0.78} ${r * 0.78} 0 0 1 ${r * 0.5} ${-r * 0.4}" stroke="#ffffff" stroke-width="${6 * k}" stroke-linecap="round" fill="none" opacity=".9"/>`
  );
}

/** 말풍선 (점 셋 / 줄) */
function bubble(x: number, y: number, w: number, h: number, fill: string, ink: string, dots: boolean, tailLeft: boolean): string {
  const tail = tailLeft ? `M${x + 34} ${y + h - 2} l-8 30 l34 -30z` : `M${x + w - 70} ${y + h - 2} l40 28 l-6 -28z`;
  const inner = dots
    ? [0, 1, 2].map((i) => `<circle cx="${x + w / 2 - 30 + i * 30}" cy="${y + h / 2}" r="9" fill="${ink}"/>`).join("")
    : `<rect x="${x + 24}" y="${y + h / 2 - 14}" width="${w - 64}" height="10" rx="5" fill="${ink}"/><rect x="${x + 24}" y="${y + h / 2 + 6}" width="${(w - 64) * 0.62}" height="10" rx="5" fill="${ink}" opacity=".7"/>`;
  return (
    `<rect x="${x + 4}" y="${y + 10}" width="${w}" height="${h}" rx="${h / 2.4}" fill="#0b1030" opacity=".14"/>` +
    `<path d="${tail}" fill="${fill}"/>` +
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2.4}" fill="${fill}"/>` +
    inner
  );
}

/** 막대 그래프 카드 */
function chartCard(d: Defs, x: number, y: number, w: number, h: number, id: string): string {
  const bar = d.lin(`${id}b`, [[0, "#5cf2b5"], [1, "#10b377"]]);
  const n = 4;
  const gap = (w - 60) / n;
  let bars = "";
  const tops: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const bh = (h - 90) * (0.35 + i * 0.2);
    const bx = x + 30 + i * gap + gap * 0.18;
    const bw = gap * 0.64;
    bars += `<rect x="${bx}" y="${y + h - 26 - bh}" width="${bw}" height="${bh}" rx="8" fill="${bar}" opacity="${0.55 + i * 0.15}"/>`;
    tops.push([bx + bw / 2, y + h - 40 - bh]);
  }
  return (
    `<rect x="${x + 6}" y="${y + 14}" width="${w}" height="${h}" rx="24" fill="#0b1030" opacity=".14"/>` +
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="24" fill="#ffffff"/>` +
    `<rect x="${x + 28}" y="${y + 24}" width="${w * 0.36}" height="10" rx="5" fill="#dfe2f0"/>` +
    bars +
    `<path d="M${tops.map(([a, b]) => `${a} ${b}`).join(" L")}" stroke="#533afd" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>` +
    tops.map(([a, b]) => `<circle cx="${a}" cy="${b}" r="7" fill="#ffffff" stroke="#533afd" stroke-width="4"/>`).join("")
  );
}

/* ------------------------------------------------------------------ */
/* 기관 본사 건물 + 간판 자리                                              */
/* ------------------------------------------------------------------ */

/** 기관 건물 장면의 색 분위기 — 같은 기관 글이 여러 편이어도 썸네일이 달라 보이게 */
const TONES: Record<
  ArticleTone,
  {
    sky: [number, string][];
    glowA: string;
    glowB: string;
    cloud: number;
    front: [string, string, string];
    side: [string, string];
    band: string;
    back: [string, string];
    backWin: [string, number];
    ground: [string, string];
    lobby: [string, string];
    lit: boolean;
  }
> = {
  day: {
    sky: [[0, "#c6d6ff"], [0.6, "#e6edff"], [1, "#f7f9ff"]],
    glowA: "#a9c1ff",
    glowB: "#d8cdff",
    cloud: 0.8,
    front: ["#6f90ff", "#4565e2", "#2b3b9c"],
    side: ["#3a4cab", "#1c2569"],
    band: "#8ea8ff",
    back: ["#d3ddf9", "#b4c2ec"],
    backWin: ["#ffffff", 0.8],
    ground: ["#e4e9f8", "#cdd6ef"],
    lobby: ["#cfeaff", "#86bdf2"],
    lit: false,
  },
  dusk: {
    sky: [[0, "#8f7bff"], [0.45, "#ff9fb0"], [1, "#ffd3a1"]],
    glowA: "#ffe08a",
    glowB: "#ff9ec4",
    cloud: 0.55,
    front: ["#7d6bff", "#5a4bd6", "#352a8f"],
    side: ["#3d2f97", "#221a5e"],
    band: "#a99bff",
    back: ["#d9b3e6", "#b98fd6"],
    backWin: ["#fff2c4", 0.85],
    ground: ["#f3cfd6", "#dcaec9"],
    lobby: ["#ffe2b8", "#ffb36b"],
    lit: false,
  },
  night: {
    sky: [[0, "#0b1033"], [0.6, "#1a2160"], [1, "#2a2f7a"]],
    glowA: "#5b6cff",
    glowB: "#7b66ff",
    cloud: 0.1,
    front: ["#3a4cb8", "#26348c", "#151d5c"],
    side: ["#161c50", "#0b1033"],
    band: "#5a6be0",
    back: ["#272e70", "#1c225a"],
    backWin: ["#ffd86b", 0.85],
    ground: ["#1a1f52", "#10143a"],
    lobby: ["#ffe7a3", "#ffbf47"],
    lit: true,
  },
};

function company(prop: ScenePropKey, tone: ArticleTone = "day"): string {
  const t = TONES[tone];
  const d = new Defs();
  const sky = d.lin("sky", t.sky);
  const soft = d.blur("soft", 60);
  const sh = d.blur("sh", 14);
  const front = d.lin("tf", [[0, t.front[0]], [0.5, t.front[1]], [1, t.front[2]]]);
  const side = d.lin("ts", [[0, t.side[0]], [1, t.side[1]]]);
  const glass = d.lin("gl", [[0, "#ffffff", 0.34], [1, "#ffffff", 0]], 0, 0, 1, 1);
  const back = d.lin("bk", [[0, t.back[0]], [1, t.back[1]]]);
  const ground = d.lin("gd", [[0, t.ground[0]], [1, t.ground[1]]]);
  const lobby = d.lin("lb", [[0, t.lobby[0]], [1, t.lobby[1]]]);

  const X0 = 800;
  const X1 = 1012;
  const TOP = 70;
  const BASE = 560;
  let grid = "";
  for (let y = 182; y <= 452; y += 24) {
    grid += `<path d="M${X0 + 10} ${y}H${X1 - 10}" stroke="#ffffff" stroke-opacity=".24" stroke-width="2"/>`;
    grid += `<path d="M${X1} ${y + (y - TOP) * 0.03}L1062 ${y + 14 + (y - TOP) * 0.03}" stroke="#ffffff" stroke-opacity=".12" stroke-width="2"/>`;
  }
  for (const x of [842, 884, 926, 970]) grid += `<path d="M${x} 176V460" stroke="#ffffff" stroke-opacity=".18" stroke-width="2"/>`;
  // 밤: 불 켜진 창 몇 개
  let lit = "";
  if (t.lit) {
    const xs = [800, 842, 884, 926, 970, 1012];
    for (let r = 0; r < 11; r++)
      for (let c = 0; c < 5; c++) {
        if ((r * 7 + c * 3) % 5 >= 2) continue;
        const y = 182 + r * 24;
        lit += `<rect x="${xs[c] + 4}" y="${y + 4}" width="${xs[c + 1] - xs[c] - 8}" height="16" rx="2" fill="#ffd86b" opacity=".8"/>`;
      }
  }
  // 뒤 건물 창 점 (밤에는 띄엄띄엄 불이 켜져요)
  let backWin = "";
  for (let r = 0; r < 9; r++)
    for (let c = 0; c < 3; c++) {
      const on = !t.lit || (r + c * 2) % 3 !== 0;
      if (!on) continue;
      backWin += `<rect x="${704 + c * 30}" y="${262 + r * 30}" width="16" height="12" rx="3" fill="${t.backWin[0]}" opacity="${t.backWin[1]}"/>`;
      backWin += `<rect x="${1088 + c * 28}" y="${214 + r * 34}" width="14" height="12" rx="3" fill="${t.backWin[0]}" opacity="${t.backWin[1] - 0.05}"/>`;
    }
  // 하늘 장식: 노을 해 · 밤 달과 별
  const skyDeco =
    tone === "dusk"
      ? `<circle cx="1110" cy="150" r="44" fill="#ffe08a" opacity=".95"/>`
      : tone === "night"
        ? `<circle cx="1120" cy="82" r="30" fill="#fff6d6"/><circle cx="1132" cy="74" r="27" fill="#141a52"/>` +
          [
            [660, 60, 2.4],
            [720, 130, 1.8],
            [610, 200, 2],
            [1060, 40, 1.6],
            [1170, 170, 2.2],
            [760, 40, 1.6],
            [690, 260, 1.4],
          ]
            .map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#ffffff" opacity=".85"/>`)
            .join("")
        : "";

  const props: Record<ScenePropKey, string> = {
    exam: examSheet(d, 584, 126, 146, 196, -9, "ex") + stopwatch(d, 740, 300, 50, "sw"),
    interview: bubble(574, 138, 176, 84, "#ffffff", "#8d8fb8", true, true) + bubble(632, 250, 150, 70, "#533afd", "#ffffff", false, false),
    doc: chartCard(d, 586, 128, 176, 170, "cc") + coin(d, 760, 300, 42, "won", "cn"),
  };

  const body =
    "" +
    bg(sky) +
    blob(1010, 60, 210, t.glowA, soft, tone === "night" ? 0.35 : 0.6) +
    blob(600, 540, 200, t.glowB, soft, 0.28) +
    skyDeco +
    clouds(t.cloud) +
    // 뒤 건물들
    `<rect x="688" y="244" width="112" height="320" rx="6" fill="${back}"/>` +
    `<rect x="1074" y="196" width="104" height="368" rx="6" fill="${back}"/>` +
    backWin +
    // 바닥 · 그림자
    `<rect x="0" y="${BASE - 4}" width="${SCENE_W}" height="${SCENE_H - BASE + 4}" fill="${ground}"/>` +
    `<path d="M640 ${BASE + 26}H1200" stroke="#ffffff" stroke-opacity=".7" stroke-width="3"/>` +
    shadow(934, BASE + 4, 230, 14, sh, 0.3) +
    // 본사 건물 — 앞면 · 옆면
    `<path d="M${X1} ${TOP}L1062 ${TOP + 18}V${BASE}H${X1}Z" fill="${side}"/>` +
    `<rect x="${X0}" y="${TOP}" width="${X1 - X0}" height="${BASE - TOP}" fill="${front}"/>` +
    `<rect x="${X0}" y="${TOP}" width="${X1 - X0}" height="14" fill="${t.band}"/>` +
    `<path d="M${X1} ${TOP}L1062 ${TOP + 18}V${TOP + 32}L${X1} ${TOP + 14}Z" fill="#5b6fd0"/>` +
    // 모서리 빛 — 앞면 왼쪽·위, 앞면과 옆면 사이
    `<path d="M${X0 + 1.5} ${TOP + 14}V${BASE}" stroke="#b9c9ff" stroke-width="3"/>` +
    `<path d="M${X1} ${TOP}V${BASE}" stroke="#1a2266" stroke-width="2.5"/>` +
    // 간판 받침
    `<rect x="${SIGN.x - 8}" y="${SIGN.y - 8}" width="${SIGN.w + 16}" height="${SIGN.h + 16}" rx="20" fill="#18206a" opacity=".35"/>` +
    grid +
    lit +
    `<path d="M${X0} 176H884L${X0} 318Z" fill="${glass}"/>` +
    `<path d="M952 176H${X1}V214L866 462H${X0 + 24}Z" fill="#ffffff" opacity=".07"/>` +
    // 1층 로비
    `<rect x="${X0 + 8}" y="470" width="${X1 - X0 - 16}" height="16" rx="6" fill="#1c2569"/>` +
    `<rect x="${X0 + 22}" y="486" width="${X1 - X0 - 44}" height="${BASE - 486}" fill="${lobby}"/>` +
    [0, 1, 2, 3].map((i) => `<path d="M${X0 + 22 + (i + 1) * ((X1 - X0 - 44) / 5)} 486V${BASE}" stroke="#ffffff" stroke-opacity=".6" stroke-width="3"/>`).join("") +
    `<rect x="${(X0 + X1) / 2 - 22}" y="506" width="44" height="${BASE - 506}" fill="#ffffff" opacity=".35"/>` +
    // 나무
    tree(d, 752, BASE + 2, 30, "t1", t.lit) +
    tree(d, 1112, BASE + 2, 34, "t2", t.lit) +
    tree(d, 1172, BASE + 6, 24, "t3", t.lit) +
    // 글 주제 소품 (건물 앞 왼쪽 위)
    props[prop];
  return `${d}${body}`;
}

/* ------------------------------------------------------------------ */
/* 필기 — OMR 답안지 · 연필 · 스톱워치                                      */
/* ------------------------------------------------------------------ */

function exam(): string {
  const d = new Defs();
  const sky = d.lin("sky", [[0, "#e4dfff"], [1, "#f8f7ff"]]);
  const soft = d.blur("soft", 55);
  const sh = d.blur("sh", 14);
  const head = d.lin("hd", [[0, "#8f7bff"], [1, "#533afd"]], 0, 0, 1, 0);
  const wood = d.lin("pw", [[0, "#ffe27a"], [0.5, "#ffc93d"], [1, "#e9a600"]]);
  const metal = d.lin("pm", [[0, "#eef0f7"], [0.5, "#b7bdd6"], [1, "#8e95b5"]]);
  let rows = "";
  const picks = [1, 3, 0, 2, 4, 1, 2, 3];
  for (let r = 0; r < 8; r++) {
    const y = 172 + r * 42;
    rows += `<rect x="772" y="${y - 11}" width="30" height="22" rx="7" fill="#eceaff"/>`;
    for (let c = 0; c < 5; c++) {
      const on = picks[r] === c && r < 6;
      rows += `<circle cx="${836 + c * 44}" cy="${y}" r="13" fill="${on ? "#1c1e54" : "#ffffff"}" stroke="${on ? "#1c1e54" : "#c9c3ff"}" stroke-width="3"/>`;
    }
  }
  const body =
    "" +
    bg(sky) +
    blob(1020, 90, 220, "#b9a8ff", soft, 0.55) +
    blob(560, 560, 180, "#ffd3dc", soft, 0.32) +
    // 답안지
    `<g transform="rotate(6 920 320)">` +
    shadow(930, 560, 190, 16, sh, 0.22) +
    `<rect x="752" y="74" width="344" height="470" rx="24" fill="#0b1030" opacity=".12" transform="translate(8 14)"/>` +
    `<rect x="752" y="74" width="344" height="470" rx="24" fill="#ffffff"/>` +
    `<path d="M752 98a24 24 0 0 1 24 -24h296a24 24 0 0 1 24 24v40h-344z" fill="${head}"/>` +
    `<rect x="776" y="96" width="130" height="14" rx="7" fill="#ffffff" opacity=".9"/><rect x="776" y="118" width="80" height="9" rx="4.5" fill="#ffffff" opacity=".55"/>` +
    `<rect x="1010" y="92" width="64" height="36" rx="10" fill="#ffffff" opacity=".22"/>` +
    rows +
    `<rect x="776" y="506" width="296" height="10" rx="5" fill="#eceaff"/>` +
    `</g>` +
    // 연필
    `<g transform="translate(1000 520) rotate(-30)">` +
    `<rect x="-150" y="-14" width="300" height="34" rx="6" fill="#0b1030" opacity=".16" transform="translate(6 12)"/>` +
    `<path d="M-150 -16 L-206 0 L-150 16 Z" fill="#f3d3a5"/>` +
    `<path d="M-186 -5.5 L-206 0 L-186 5.5 Z" fill="#1c1e54"/>` +
    `<rect x="-150" y="-16" width="290" height="32" fill="${wood}"/>` +
    `<path d="M-150 -5H140M-150 5H140" stroke="#e09a00" stroke-opacity=".5" stroke-width="2"/>` +
    `<rect x="140" y="-17" width="26" height="34" fill="${metal}"/>` +
    `<rect x="166" y="-16" width="30" height="32" rx="8" fill="#ff8fb0"/>` +
    `</g>` +
    stopwatch(d, 640, 236, 80, "sw") +
    // 반짝임
    `<path d="M1130 200l6 14 14 6-14 6-6 14-6-14-14-6 14-6z" fill="#ffd84d"/>` +
    `<path d="M700 96l4 9 9 4-9 4-4 9-4-9-9-4 9-4z" fill="#ffffff"/>`;
  return `${d}${body}`;
}

/* ------------------------------------------------------------------ */
/* 면접 — 면접관 책상 · 의자 · 말풍선                                       */
/* ------------------------------------------------------------------ */

function interview(): string {
  const d = new Defs();
  const sky = d.lin("sky", [[0, "#ffe3d0"], [1, "#fff8f2"]]);
  const soft = d.blur("soft", 55);
  const sh = d.blur("sh", 14);
  const chair = d.lin("ch", [[0, "#4a4f8c"], [1, "#272b5e"]]);
  const top = d.lin("tt", [[0, "#ffffff"], [1, "#e9e4f5"]]);
  const front = d.lin("tfr", [[0, "#3a4084"], [1, "#22265a"]]);
  const plate = d.lin("pl", [[0, "#ffffff"], [1, "#e4e6f2"]]);
  const chairs = [770, 920, 1070]
    .map(
      (x) =>
        `<rect x="${x - 56}" y="196" width="112" height="196" rx="34" fill="${chair}"/>` +
        `<rect x="${x - 44}" y="210" width="88" height="40" rx="18" fill="#ffffff" opacity=".08"/>`,
    )
    .join("");
  const plates = [770, 920, 1070]
    .map(
      (x) =>
        `<path d="M${x - 46} 410 L${x - 38} 380 H${x + 38} L${x + 46} 410 Z" fill="${plate}"/>` +
        `<rect x="${x - 26}" y="390" width="52" height="8" rx="4" fill="#8d8fb8"/>`,
    )
    .join("");
  const cups = [845, 995].map((x) => `<rect x="${x - 11}" y="384" width="22" height="28" rx="6" fill="#bfe3ff" opacity=".9"/><rect x="${x - 11}" y="384" width="22" height="8" rx="4" fill="#ffffff" opacity=".7"/>`).join("");
  const body =
    "" +
    bg(sky) +
    blob(1000, 110, 220, "#ffc9a8", soft, 0.55) +
    blob(600, 540, 180, "#d8cdff", soft, 0.28) +
    // 벽 창
    `<rect x="720" y="56" width="420" height="120" rx="18" fill="#ffffff" opacity=".55"/>` +
    `<path d="M860 56V176M1000 56V176" stroke="#ffe3d0" stroke-width="6"/>` +
    chairs +
    shadow(940, 560, 260, 16, sh, 0.28) +
    // 책상
    `<path d="M696 404 H1184 L1200 432 H680 Z" fill="${top}"/>` +
    `<rect x="690" y="432" width="500" height="128" fill="${front}"/>` +
    `<rect x="690" y="432" width="500" height="10" fill="#ffffff" opacity=".12"/>` +
    plates +
    cups +
    // 말풍선
    bubble(584, 150, 178, 86, "#ffffff", "#c2c4dd", true, false) +
    bubble(1010, 108, 150, 64, "#533afd", "#ffffff", false, true) +
    `<path d="M1150 230l6 13 13 6-13 6-6 13-6-13-13-6 13-6z" fill="#ffd84d"/>`;
  return `${d}${body}`;
}

/* ------------------------------------------------------------------ */
/* 금공 지식 — 책 · 그래프 카드 · 동전                                      */
/* ------------------------------------------------------------------ */

function knowledge(): string {
  const d = new Defs();
  const sky = d.lin("sky", [[0, "#d6f4e6"], [1, "#f5fbf8"]]);
  const soft = d.blur("soft", 55);
  const sh = d.blur("sh", 14);
  const b1 = d.lin("b1", [[0, "#3fb574"], [1, "#22834f"]]);
  const b2 = d.lin("b2", [[0, "#7b66ff"], [1, "#4b33e0"]]);
  const b3 = d.lin("b3", [[0, "#ffb36b"], [1, "#f08a2c"]]);
  const book = (x: number, y: number, w: number, h: number, fill: string) =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="${fill}"/>` +
    `<rect x="${x + w - 26}" y="${y + 6}" width="20" height="${h - 12}" rx="4" fill="#ffffff" opacity=".92"/>` +
    `<path d="M${x + w - 22} ${y + 14}V${y + h - 14}M${x + w - 16} ${y + 14}V${y + h - 14}" stroke="#e4e6f2" stroke-width="2"/>` +
    `<rect x="${x + 24}" y="${y + h / 2 - 5}" width="${w * 0.36}" height="10" rx="5" fill="#ffffff" opacity=".5"/>`;
  const body =
    "" +
    bg(sky) +
    blob(1010, 100, 220, "#9ee8c0", soft, 0.55) +
    blob(580, 560, 180, "#ffe08a", soft, 0.3) +
    shadow(940, 556, 210, 16, sh, 0.28) +
    book(790, 486, 312, 62, b1) +
    `<g transform="rotate(-3 930 452)">${book(812, 424, 276, 58, b2)}</g>` +
    `<g transform="rotate(2 924 392)">${book(782, 366, 292, 54, b3)}</g>` +
    chartCard(d, 812, 92, 260, 232, "cc") +
    arrowBadge(d, 1086, 112, 38, true, "ab") +
    coin(d, 704, 262, 60, "won", "c1") +
    coin(d, 1140, 330, 34, "dollar", "c2");
  return `${d}${body}`;
}

/* ------------------------------------------------------------------ */
/* 입문 가이드 — 언덕 위 깃발로 가는 길 · 이정표                              */
/* ------------------------------------------------------------------ */

function starter(): string {
  const d = new Defs();
  const sky = d.lin("sky", [[0, "#d3e9ff"], [1, "#fbfdff"]]);
  const soft = d.blur("soft", 60);
  const hillBack = d.lin("hb", [[0, "#b9ecd0"], [1, "#8fdcb3"]]);
  const hillFront = d.lin("hf", [[0, "#7fd6a6"], [1, "#46b97c"]]);
  const flag = d.lin("fl", [[0, "#8f7bff"], [1, "#533afd"]], 0, 0, 1, 0);
  const body =
    "" +
    bg(sky) +
    blob(860, 130, 140, "#ffe27a", soft, 0.8) +
    `<circle cx="860" cy="130" r="42" fill="#ffd84d"/>` +
    clouds(0.9) +
    `<path d="M600 630 Q860 300 1200 360 V630 Z" fill="${hillBack}"/>` +
    `<path d="M700 630 Q980 420 1200 470 V630 Z" fill="${hillFront}"/>` +
    // 길
    `<path d="M772 630 C820 540 1000 560 960 470 S980 352 1010 318" stroke="#f6ecd8" stroke-width="40" fill="none" stroke-linecap="round"/>` +
    `<path d="M772 630 C820 540 1000 560 960 470 S980 352 1010 318" stroke="#ffffff" stroke-width="4" stroke-dasharray="14 16" fill="none" stroke-linecap="round"/>` +
    // 깃발
    `<rect x="1004" y="176" width="8" height="150" rx="4" fill="#5b6080"/>` +
    `<circle cx="1008" cy="172" r="9" fill="#ffd84d"/>` +
    `<path d="M1012 186 q40 -16 80 0 t80 0 v74 q-40 -16 -80 0 t-80 0z" fill="${flag}"/>` +
    // 이정표
    `<rect x="832" y="336" width="10" height="150" rx="4" fill="#7a5b3a"/>` +
    `<path d="M780 350 H900 L920 370 L900 390 H780 Z" fill="#533afd"/>` +
    `<path d="M894 400 H776 L756 420 L776 440 H894 Z" fill="#ffb36b"/>` +
    `<rect x="796" y="364" width="70" height="10" rx="5" fill="#ffffff" opacity=".85"/>` +
    `<rect x="790" y="414" width="60" height="10" rx="5" fill="#ffffff" opacity=".85"/>` +
    tree(d, 1130, 520, 26, "t1") +
    tree(d, 700, 600, 22, "t2") +
    `<path d="M640 230l6 13 13 6-13 6-6 13-6-13-13-6 13-6z" fill="#ffffff"/>`;
  return `${d}${body}`;
}

/* ------------------------------------------------------------------ */
/* 현직자 이야기 — 노트북 · 사원증 · 커피                                    */
/* ------------------------------------------------------------------ */

function insider(): string {
  const d = new Defs();
  const sky = d.lin("sky", [[0, "#e4e8f7"], [1, "#fafbff"]]);
  const soft = d.blur("soft", 55);
  const sh = d.blur("sh", 14);
  const screen = d.lin("sc", [[0, "#6f90ff"], [1, "#2b3b9c"]], 0, 0, 1, 1);
  const base = d.lin("lb", [[0, "#f3f4fa"], [1, "#c6cbe0"]]);
  const desk = d.lin("dk", [[0, "#e7eaf6"], [1, "#d3d8ec"]]);
  const mug = d.lin("mg", [[0, "#ffb36b"], [1, "#f08a2c"]], 0, 0, 1, 0);
  const body =
    "" +
    bg(sky) +
    blob(1000, 110, 220, "#b9c8ff", soft, 0.55) +
    blob(600, 560, 180, "#ffd3dc", soft, 0.3) +
    `<rect x="0" y="470" width="${SCENE_W}" height="${SCENE_H - 470}" fill="${desk}"/>` +
    shadow(920, 474, 240, 14, sh, 0.25) +
    // 노트북
    `<rect x="760" y="196" width="320" height="222" rx="18" fill="#22265a"/>` +
    `<rect x="774" y="210" width="292" height="194" rx="10" fill="${screen}"/>` +
    `<path d="M796 360 L850 322 L896 340 L950 286 L1000 300 L1046 250" stroke="#ffffff" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<rect x="796" y="230" width="90" height="10" rx="5" fill="#ffffff" opacity=".6"/>` +
    `<path d="M716 418 H1124 L1150 452 H690 Z" fill="${base}"/>` +
    `<rect x="880" y="420" width="80" height="8" rx="4" fill="#aeb4d0"/>` +
    // 사원증
    `<path d="M1112 0 L1098 262 M1170 0 L1150 262" stroke="#533afd" stroke-width="10" stroke-linecap="round"/>` +
    `<rect x="1060" y="252" width="128" height="170" rx="16" fill="#0b1030" opacity=".14" transform="translate(5 10)"/>` +
    `<rect x="1060" y="252" width="128" height="170" rx="16" fill="#ffffff"/>` +
    `<rect x="1104" y="244" width="40" height="18" rx="6" fill="#8d8fb8"/>` +
    `<circle cx="1124" cy="318" r="28" fill="#ece8ff"/><circle cx="1124" cy="310" r="11" fill="#8f7bff"/><path d="M1104 336 a20 16 0 0 1 40 0" fill="#8f7bff"/>` +
    `<rect x="1084" y="362" width="80" height="10" rx="5" fill="#1c1e54"/><rect x="1094" y="382" width="60" height="8" rx="4" fill="#c9cde2"/>` +
    // 커피
    `<rect x="704" y="398" width="58" height="72" rx="12" fill="${mug}"/>` +
    `<path d="M762 414 a16 16 0 0 1 0 34" stroke="#f08a2c" stroke-width="8" fill="none"/>` +
    `<path d="M722 380 q8 -12 0 -24 M744 380 q8 -12 0 -24" stroke="#c9cde2" stroke-width="4" fill="none" stroke-linecap="round"/>`;
  return `${d}${body}`;
}

/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/* 돈의 흐름 — 동전이 모이는 통 → 네 갈래 관 → 산업 타일 (어두운 바탕)        */
/* ------------------------------------------------------------------ */

function fund(): string {
  const d = new Defs();
  const sky = d.lin("sky", [[0, "#0b1040"], [1, "#1d2470"]], 0, 0, 1, 1);
  const soft = d.blur("soft", 60);
  const sh = d.blur("sh", 12);
  const gold = d.lin("gd", [[0, "#ffe68a"], [0.55, "#ffc93d"], [1, "#e0a000"]]);
  const pipe = d.lin("pp", [[0, "#ffe08a"], [1, "#f0a91a"]], 0, 0, 1, 0);
  const lid = d.lin("ld", [[0, "#ffe08a"], [1, "#c98a00"]]);
  const glass = d.lin("gl", [[0, "#ffffff", 0.2], [0.5, "#ffffff", 0.06], [1, "#ffffff", 0.14]], 0, 0, 1, 0);
  const JX0 = 790;
  const JX1 = 1038;
  const JY0 = 170;
  const JY1 = 420;
  const inside = d.clip("jar", `<rect x="${JX0 + 4}" y="${JY0 + 4}" width="${JX1 - JX0 - 8}" height="${JY1 - JY0 - 8}" rx="36"/>`);

  let grid = "";
  for (let x = 0; x <= 1200; x += 60) grid += `<path d="M${x} 0V630" stroke="#ffffff" stroke-opacity=".035" stroke-width="1"/>`;
  for (let y = 0; y <= 630; y += 60) grid += `<path d="M0 ${y}H1200" stroke="#ffffff" stroke-opacity=".035" stroke-width="1"/>`;

  // 통 안 동전 더미 (아래부터 층층이)
  let pile = "";
  const layers: [number, number][] = [
    [404, 9],
    [384, 9],
    [364, 8],
    [344, 8],
    [326, 7],
    [310, 5],
  ];
  layers.forEach(([y, n], li) => {
    for (let i = 0; i < n; i++) {
      const x = JX0 + 30 + i * ((JX1 - JX0 - 60) / Math.max(1, n - 1)) + (li % 2 ? 8 : -4);
      pile += `<ellipse cx="${x}" cy="${y + 4}" rx="24" ry="9" fill="#a86f00" opacity=".6"/><ellipse cx="${x}" cy="${y}" rx="24" ry="9" fill="${gold}"/>`;
    }
  });

  const tiles: { cx: number; c: [string, string]; icon: (cx: number) => string }[] = [
    {
      cx: 716,
      c: ["#8f7bff", "#533afd"],
      icon: (cx) =>
        `<rect x="${cx - 22}" y="${526}" width="44" height="44" rx="7" fill="#ffffff"/><rect x="${cx - 11}" y="${537}" width="22" height="22" rx="4" fill="#533afd"/>` +
        [0, 1, 2].map((i) => `<path d="M${cx - 12 + i * 12} 518V526M${cx - 12 + i * 12} 570V578M${cx - 30} ${536 + i * 12}H${cx - 22}M${cx + 22} ${536 + i * 12}H${cx + 30}" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round"/>`).join(""),
    },
    {
      cx: 848,
      c: ["#3fd0c9", "#178a95"],
      icon: (cx) =>
        `<path d="M${cx} 586V542" stroke="#ffffff" stroke-width="5" stroke-linecap="round"/>` +
        [-90, 30, 150]
          .map((deg) => {
            const r = (deg * Math.PI) / 180;
            return `<path d="M${cx} 542L${cx + Math.cos(r) * 32} ${542 + Math.sin(r) * 32}" stroke="#ffffff" stroke-width="6" stroke-linecap="round"/>`;
          })
          .join("") +
        `<circle cx="${cx}" cy="542" r="6" fill="#ffffff"/>`,
    },
    {
      cx: 980,
      c: ["#ff8fb0", "#e8335a"],
      icon: (cx) =>
        // 이중 나선 — 두 가닥이 번갈아 꼬이고, 벌어진 자리에 가로대
        [1, -1]
          .map(
            (k) =>
              `<path d="M${cx - 14 * k} 516C${cx - 14 * k} 526 ${cx + 14 * k} 523 ${cx + 14 * k} 533C${cx + 14 * k} 543 ${cx - 14 * k} 540 ${cx - 14 * k} 550C${cx - 14 * k} 560 ${cx + 14 * k} 557 ${cx + 14 * k} 567C${cx + 14 * k} 577 ${cx - 14 * k} 574 ${cx - 14 * k} 584" stroke="#ffffff" stroke-width="4.5" fill="none" stroke-linecap="round" opacity="${k === 1 ? 1 : 0.8}"/>`,
          )
          .join("") +
        [533, 550, 567].map((y) => `<path d="M${cx - 9} ${y}H${cx + 9}" stroke="#ffffff" stroke-width="3" stroke-linecap="round" opacity=".85"/>`).join(""),
    },
    {
      cx: 1112,
      c: ["#5cf2b5", "#10a36c"],
      icon: (cx) =>
        `<rect x="${cx - 26}" y="530" width="46" height="36" rx="7" fill="none" stroke="#ffffff" stroke-width="4.5"/><rect x="${cx + 20}" y="541" width="7" height="14" rx="2" fill="#ffffff"/>` +
        [0, 1, 2].map((i) => `<rect x="${cx - 19 + i * 12}" y="537" width="8" height="22" rx="2" fill="#ffffff"/>`).join(""),
    },
  ];
  const tileSvg = tiles
    .map((t, i) => {
      const g = d.lin(`tl${i}`, [[0, t.c[0]], [1, t.c[1]]], 0, 0, 1, 1);
      return (
        `<rect x="${t.cx - 48 + 4}" y="${502 + 8}" width="96" height="96" rx="24" fill="#05081f" opacity=".45" filter="${sh}"/>` +
        `<rect x="${t.cx - 48}" y="502" width="96" height="96" rx="24" fill="${g}"/>` +
        `<rect x="${t.cx - 48}" y="502" width="96" height="96" rx="24" fill="none" stroke="#ffffff" stroke-opacity=".25" stroke-width="2"/>` +
        t.icon(t.cx)
      );
    })
    .join("");

  const flowDots = [740, 790, 840, 890, 940, 990, 1040, 1090].map((x) => `<circle cx="${x}" cy="470" r="3.5" fill="#fff7d6" opacity=".9"/>`).join("");

  const body =
    "" +
    bg(sky) +
    grid +
    blob(914, 300, 190, "#ffc93d", soft, 0.22) +
    blob(1120, 80, 160, "#7b66ff", soft, 0.45) +
    blob(420, 560, 220, "#533afd", soft, 0.35) +
    // 떨어지는 동전
    coin(d, 858, 74, 24, "won", "c1") +
    coin(d, 962, 44, 19, "won", "c2") +
    coin(d, 1010, 104, 15, "won", "c3") +
    // 관 (통 아래 → 가로 관 → 네 갈래)
    `<path d="M914 ${JY1 - 6}V470M716 470H1112M716 470V504M848 470V504M980 470V504M1112 470V504" stroke="#a86f00" stroke-width="18" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity=".6" transform="translate(0 3)"/>` +
    `<path d="M914 ${JY1 - 6}V470M716 470H1112M716 470V504M848 470V504M980 470V504M1112 470V504" stroke="${pipe}" stroke-width="14" stroke-linecap="round" stroke-linejoin="round" fill="none"/>` +
    flowDots +
    // 통
    `<rect x="${JX0}" y="${JY0}" width="${JX1 - JX0}" height="${JY1 - JY0}" rx="40" fill="#ffffff" opacity=".05"/>` +
    `<g clip-path="${inside}">${pile}</g>` +
    `<rect x="${JX0}" y="${JY0}" width="${JX1 - JX0}" height="${JY1 - JY0}" rx="40" fill="${glass}" stroke="#ffffff" stroke-opacity=".5" stroke-width="4"/>` +
    `<rect x="${JX0 + 18}" y="${JY0 + 26}" width="14" height="${JY1 - JY0 - 60}" rx="7" fill="#ffffff" opacity=".28"/>` +
    `<rect x="836" y="150" width="156" height="26" rx="10" fill="#ffffff" fill-opacity=".1" stroke="#ffffff" stroke-opacity=".45" stroke-width="3"/>` +
    `<rect x="826" y="128" width="176" height="28" rx="12" fill="${lid}"/>` +
    `<rect x="836" y="133" width="80" height="6" rx="3" fill="#ffffff" opacity=".55"/>` +
    tileSvg +
    // 반짝임
    `<path d="M1150 260l6 14 14 6-14 6-6 14-6-14-14-6 14-6z" fill="#ffd84d"/>` +
    `<path d="M700 140l4 9 9 4-9 4-4 9-4-9-9-4 9-4z" fill="#ffffff" opacity=".8"/>`;
  return `${d}${body}`;
}

export function articleSceneSvg(key: ArticleSceneKey, prop: ScenePropKey = "doc", tone: ArticleTone = "day"): string {
  const inner =
    key === "company"
      ? company(prop, tone)
      : key === "fund"
        ? fund()
        : key === "exam"
          ? exam()
          : key === "interview"
            ? interview()
            : key === "starter"
              ? starter()
              : key === "insider"
                ? insider()
                : knowledge();
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SCENE_W}" height="${SCENE_H}" viewBox="0 0 ${SCENE_W} ${SCENE_H}">${inner}</svg>`;
}
