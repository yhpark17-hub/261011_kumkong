import "server-only";
import { COSTUMES, type NewsSection } from "@/lib/news-meta";
import { isPicKey, type PicKey } from "@/lib/news-cards";
import { expandKit } from "./thumb-kit";
import { photoPortrait } from "./thumb-portraits";

/**
 * 카드뉴스 그림 — 카드 위쪽에 크게 들어가는 일러스트 (400×240 상자).
 * 썸네일 그림 부품(src/lib/server/thumb-kit.ts — 콩이 변장·은행·동전·집·칩 …)을 모아 장면으로 만들어요.
 * 한 화면에 그림이 여러 장 들어가니, 그림 속 id 는 카드마다 앞말을 붙여 겹치지 않게 해요.
 */

export const PIC_W = 400;
export const PIC_H = 240;

/** 분야 색 — 카드 바탕·막대·그림 상징색 */
export const SECTION_THEME: Record<NewsSection, { accent: string; panel: string; deep: string }> = {
  finance: { accent: "#533afd", panel: "#eeebff", deep: "#2e2b8c" },
  economy: { accent: "#2457c5", panel: "#e4edfb", deep: "#123a7a" },
  policy: { accent: "#a8209b", panel: "#fbeafa", deep: "#5e1257" },
  global: { accent: "#c98a2e", panel: "#fbf1de", deep: "#6b4512" },
  public: { accent: "#ea2261", panel: "#fde9ef", deep: "#8a1239" },
  term: { accent: "#64748d", panel: "#eef2f7", deep: "#273951" },
  question: { accent: "#9b6829", panel: "#f5e9d4", deep: "#5a3c17" },
};

/** 바닥 그림자 + 뒤쪽 동그란 빛 — 그림이 떠 보이지 않게 */
const stage = (cx = 200, rx = 120) => `<circle cx="200" cy="112" r="104" fill="#fff" opacity=".6"/><ellipse cx="${cx}" cy="226" rx="${rx}" ry="9" fill="#1c1e54" opacity=".1"/>`;

/** 동전 탑 — 아래(baseY)부터 count 개 (gold = 금색, 아니면 은색) */
export function coinStack(x: number, baseY: number, count: number, r: number, gold = true): string {
  const t = r * 0.24;
  const [side, top, rim] = gold ? ["#e0a325", "#ffd766", "#b97a12"] : ["#aab4c3", "#e4e9f0", "#8a94a5"];
  let out = "";
  for (let k = 0; k < count; k++) {
    const y = baseY - k * t;
    out += `<path d="M${x - r} ${y - t}V${y}A${r} ${r * 0.34} 0 0 0 ${x + r} ${y}V${y - t}Z" fill="${side}"/><path d="M${x - r} ${y - t * 0.5}A${r} ${r * 0.34} 0 0 0 ${x + r} ${y - t * 0.5}" stroke="${rim}" stroke-width="1.2" fill="none" opacity=".7"/>`;
  }
  const yTop = baseY - count * t;
  out += `<ellipse cx="${x}" cy="${yTop}" rx="${r}" ry="${r * 0.34}" fill="${top}" stroke="${rim}" stroke-width="1.4"/><ellipse cx="${x}" cy="${yTop}" rx="${r * 0.62}" ry="${r * 0.2}" fill="none" stroke="${rim}" stroke-width="1.2" opacity=".55"/>`;
  return out;
}

const kong = (costume: string, extra = "") => `${stage(200, 90)}<kk-kong ${costume ? `costume="${costume}" ` : ""}${extra} size="236" x="82" y="0"/>`;

const SCENES: Record<PicKey, (accent: string) => string> = {
  "kong-banker": () => kong("banker"),
  "kong-trader": () => kong("trader"),
  "kong-builder": () => kong("builder"),
  "kong-shopper": () => kong("shopper"),
  "kong-money": () => kong("money"),
  "kong-oil": () => kong("oil"),
  "kong-chip": () => kong("chip"),
  "kong-security": () => kong("security"),
  "kong-president": () => kong("president"),
  "kong-reporter": () => kong("reporter"),
  "kong-study": () => kong("", `glasses="1" hold="book"`),
  "kong-worried": () => kong("", `worried="1"`),
  "kong-happy": () => kong("", `wave="1"`),
  "kong-note": () => kong("", `glasses="1" hold="pencil"`),
  bank: (c) => `${stage(200, 130)}<kk-bank x="95" y="70" s="0.5" c="${c}"/>${coinStack(64, 222, 5, 24)}<kk-coin cx="340" cy="196" r="26" kind="dollar"/>`,
  coins: () => `${stage(200, 140)}${coinStack(120, 222, 6, 34)}${coinStack(200, 222, 11, 34)}${coinStack(280, 222, 8, 34)}<kk-coin cx="330" cy="120" r="24"/>`,
  dollar: () => `${stage(200, 130)}${coinStack(150, 222, 7, 34, false)}<kk-coin cx="250" cy="150" r="58" kind="dollar"/><kk-coin cx="110" cy="96" r="24"/>`,
  house: () => `${stage(200, 120)}<kk-house x="109" y="58" s="0.7"/>${coinStack(318, 222, 5, 26)}`,
  chip: () => `${stage(200, 110)}<kk-chip x="100" y="10" s="0.78"/>`,
  oil: () => `${stage(200, 120)}<kk-barrel x="96" y="62" s="0.72"/><kk-barrel x="190" y="80" s="0.64" c="#3a4566"/>`,
  "stocks-up": () => `${stage(200, 150)}<kk-candles x="54" y="34" w="292" h="176" n="12" trend="up" seed="7"/><kk-bigarrow x="300" y="20" w="64" h="96" dir="up"/>`,
  "stocks-down": () => `${stage(200, 150)}<kk-candles x="54" y="34" w="292" h="176" n="12" trend="down" seed="11"/><kk-bigarrow x="300" y="118" w="64" h="96" dir="down"/>`,
  doc: (c) => `${stage(200, 110)}<kk-doc x="125" y="16" s="0.72" c="${c}"/>`,
  gavel: () => `${stage(200, 130)}<kk-gavel x="84" y="52" s="0.84"/>`,
  lock: () => `${stage(200, 100)}<kk-lock x="122" y="22" s="0.78"/>`,
  up: () => `${stage(200, 100)}<kk-bigarrow x="140" y="14" w="120" h="200" dir="up"/>`,
  down: () => `${stage(200, 100)}<kk-bigarrow x="140" y="14" w="120" h="200" dir="down"/>`,
  podium: (c) => `${stage(200, 140)}<kk-podium x="65" y="62" s="0.75" c="${c}"/>`,
};

/** 그림 속 id 에 앞말 붙이기 — 한 화면 여러 그림의 그라데이션·마스크가 서로 섞이지 않게 */
function scopeIds(svg: string, prefix: string): string {
  const ids = [...new Set([...svg.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]))];
  let out = svg;
  for (const id of ids) {
    const esc = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    out = out
      .replace(new RegExp(`id="${esc}"`, "g"), `id="${prefix}${id}"`)
      .replace(new RegExp(`url\\(#${esc}\\)`, "g"), `url(#${prefix}${id})`)
      .replace(new RegExp(`href="#${esc}"`, "g"), `href="#${prefix}${id}"`);
  }
  return out;
}

/** 그림 이름 → 400×240 상자 안 도형 (모르는 이름이면 기자 콩이) */
export function picSvg(name: PicKey | string, accent: string, prefix: string): string {
  const scene = (isPicKey(name) ? SCENES[name] : SCENES["kong-reporter"])(accent);
  return scopeIds(expandKit(scene), prefix);
}

/** 'who:인물' 그림이면 그 인물 (등록된 초상이 있을 때만) */
export function picPerson(name: string): { who: string; credit: string } | null {
  if (!name.startsWith("who:")) return null;
  const who = name.slice(4);
  const p = photoPortrait(who);
  return p ? { who, credit: p.credit } : null;
}

/** 분야마다 기본 그림 — 그림을 고르지 않은 카드·예전 기사 */
const SECTION_PIC: Record<NewsSection, PicKey> = {
  finance: "bank",
  economy: "coins",
  policy: "doc",
  global: "dollar",
  public: "kong-president",
  term: "kong-study",
  question: "kong-reporter",
};

/** 제목에 이름이 나오면 그 인물 초상 (등록 인물만 — scripts/automation/ROUTINE.md 의 who 목록) */
const PEOPLE: [RegExp, string][] = [
  [/이재명/, "lee-jaemyung"],
  [/이형일/, "lee-hyoungil"],
  [/신현송/, "shin-hyunsong"],
  [/이억원/, "lee-eogweon"],
  [/이찬진/, "lee-chanjin"],
  [/권대영/, "kwon-daeyoung"],
  [/박홍근/, "park-hongkeun"],
  [/박상진/, "park-sangjin"],
  [/트럼프/, "donald-trump"],
  [/워시/, "kevin-warsh"],
  [/베선트/, "scott-bessent"],
  [/우에다/, "kazuo-ueda"],
  [/시진핑/, "xi-jinping"],
  [/다카이치/, "sanae-takaichi"],
  [/버넘/, "andy-burnham"],
  [/마크롱/, "emmanuel-macron"],
  [/메르츠/, "friedrich-merz"],
  [/이재용/, "lee-jaeyong"],
  [/정의선/, "chung-euisun"],
  [/최태원/, "chey-taewon"],
  [/젠슨\s?황/, "jensen-huang"],
  [/머스크/, "elon-musk"],
  [/올트먼|알트먼/, "sam-altman"],
  [/아모데이/, "dario-amodei"],
  [/저커버그/, "mark-zuckerberg"],
];

/**
 * 표지 그림을 고르지 않은 기사 — 제목에 등록 인물 이름이 있으면 그 인물(가장 앞에 나온 사람),
 * 아니면 제목 낱말로 콩이 변장(썸네일 '자동'과 같은 낱말 목록), 그것도 없으면 분야 기본 그림.
 * people = false 면 인물은 건너뛰어요 (속 장마다 같은 초상이 되풀이되지 않게)
 */
export function defaultPic(section: NewsSection, title: string, people = true): string {
  const person = !people ? undefined : PEOPLE.map(([re, who]) => ({ who, at: title.search(re) }))
    .filter((p) => p.at >= 0 && photoPortrait(p.who))
    .sort((x, y) => x.at - y.at)[0];
  if (person) return `who:${person.who}`;
  const hit = COSTUMES.filter((c) => c.match && c.key !== "uspresident")
    .map((c) => ({ key: c.key, at: c.match ? title.search(c.match) : -1 }))
    .filter((c) => c.at >= 0)
    .sort((a, b) => a.at - b.at)[0];
  const key = hit ? `kong-${hit.key}` : "";
  return isPicKey(key) ? key : SECTION_PIC[section];
}
