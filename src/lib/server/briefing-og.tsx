import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import type { CSSProperties, ReactElement, ReactNode } from "react";
import { formatDayHeading, parseKey } from "@/lib/date";
import {
  autoCostume,
  autoMood,
  autoScene,
  CIRCLED,
  DRILL_KINDS,
  dayIndex,
  noonArt,
  noonArtSrc,
  parseStats,
  studyTopic,
  THUMB_LIMITS,
  type BriefingIssue,
  type CostumeKey,
  type IssueDrill,
  type IssueLayout,
  type IssueStory,
  type IssueThumb,
  type NoonArt,
  type SceneKey,
  type ThumbMood,
  type ThumbStat,
} from "@/lib/news-meta";
import type { ThumbArt } from "@/lib/thumb-art";
import { weekRadar, type RadarItem, type WeekRadar } from "@/lib/week-radar";
import { juaWidth, VideoHeadline } from "./article-og";
import { arrangeLetter, issueItems } from "./briefing";
import { readStoredFile } from "./storage";
import { TOPIC_W, captionFit, fitText, headlineFit, speechFit, topicFit } from "../og-text";
import { BRAND_LOGO as LOGO, C, COSTUME_LOOK, OG_SIZE, juaFont, kongSvg, ogFonts, svgUri, type OgKong } from "./og";
import { GAUGE, sceneSvg } from "./og-scenes";
import { ArtView } from "./thumb-art";

/**
 * 데일리 브리핑 공유 썸네일(og:image) 그리기 — 공유 미리보기 경로와 관리자 미리보기가 같이 써요.
 * - 금콩 브리핑(아침판): 그날 뉴스 주제 그림이 칸 대부분을 채우고, 제목은 왼쪽 아래 상자에.
 *   인물 발언 뉴스만 콩이가 그 인물로 변장해 연단에서 말풍선으로 (발언은 기사에 실린 말 그대로)
 * - 점심 3문제(점심판): 그날 새로 그린 그림(아침판과 같은 그림체) 위에 주아체 큰 글 + 문제 카드(문제·보기) + 이번 주 금공
 * - 예전 금콩 스터디(점심판): 공책 템플릿은 그대로, 오늘의 논술 주제 글자만 바뀜
 */

/** "메인 — 부제" 로 된 제목 나누기 */
export function splitTitle(title: string): [string, string] {
  const i = title.indexOf(" — ");
  return i < 0 ? [title, ""] : [title.slice(0, i).trim(), title.slice(i + 3).trim()];
}

/** 말풍선 꼬리 (오른쪽 콩이 쪽으로) — 테두리 없는 흰 말풍선에 맞게 */
const TAIL = svgUri(
  `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="64" viewBox="0 0 80 64"><path d="M0 4 L76 46 L0 58 Z" fill="#ffffff"/></svg>`,
);

/** 연단 마이크 (가로 위치 · 색 · 기울기) */
const MICS: [number, string, number][] = [
  [120, "#3b3f63", -26],
  [170, "#ea2261", -8],
  [220, "#2f6fd6", 14],
];

/** 연단 (인물 발언) — 콩이 아랫몸을 가리고, 마이크 셋이 입 쪽으로 */
const PODIUM = svgUri(
  `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="210" viewBox="0 -12 360 222">` +
    MICS.map(
      ([x, c, r]) =>
        `<path d="M${x} 44 L${x + r} 8" stroke="${C.ink}" stroke-width="6" stroke-linecap="round"/><rect x="${x + r - 13}" y="-8" width="26" height="22" rx="10" fill="${c}" stroke="${C.ink}" stroke-width="5"/>`,
    ).join("") +
    `<path d="M24 40h312l-24 170H48z" fill="#26306b" stroke="${C.ink}" stroke-width="6" stroke-linejoin="round"/>` +
    `<rect x="10" y="28" width="340" height="22" rx="6" fill="#3a4486" stroke="${C.ink}" stroke-width="6"/>` +
    `<circle cx="180" cy="122" r="38" fill="#f5f3ff" stroke="#ffd84d" stroke-width="7"/>` +
    `<path d="M180 95l8 16 17.8 2.6-12.9 12.6 3 17.7L180 135.5l-15.9 8.4 3-17.7-12.9-12.6 17.8-2.6z" fill="#ffd84d" stroke="${C.ink}" stroke-width="3" stroke-linejoin="round"/>` +
    `</svg>`,
);

function Abs({ style, children }: { style: CSSProperties; children?: ReactNode }) {
  return <div style={{ position: "absolute", display: "flex", ...style }}>{children}</div>;
}

function Lines({ lines, style }: { lines: string[]; style: CSSProperties }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", ...style }}>
      {lines.map((l, i) => (
        <div key={`${i}-${l}`} style={{ display: "flex", whiteSpace: "nowrap" }}>
          {l}
        </div>
      ))}
    </div>
  );
}

export function FallbackImage() {
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: C.cream, fontSize: 64, fontWeight: 800, color: C.ink }}>
      금콩 데일리 브리핑
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 금콩 브리핑 — 뉴스 그림(꽉 채움) + 이름표 + 제목 카드                    */
/* ------------------------------------------------------------------ */

/** 숫자가 단위와 함께 있는지 (12.9%·117달러·165조·5.5bp …) */
const UNIT_NUM = /\d[\d,.]*\s?(?:조원|조|억원|억|만원|만|천|%p|%|bp|달러|원|배럴|배|개|명|건|포인트|MW)/g;

/** 숫자의 방향 — 분위기(좋다·나쁘다)가 아니라 숫자가 오르내렸다는 말이 있을 때만 */
const NUM_UP = /상승|급등|반등|회복|오름|올라|오른|증가|급증|늘|돌파|최고|확대|인상/;
const NUM_DOWN = /하락|급락|내림|내려|내린|감소|급감|줄|최저|축소|인하/;
function numDir(text: string): ThumbStat["dir"] {
  const u = text.search(NUM_UP);
  const d = text.search(NUM_DOWN);
  if (u < 0 && d < 0) return "";
  if (u < 0) return "down";
  if (d < 0) return "up";
  return u < d ? "up" : "down";
}

/** 기사 제목에서 숫자 칩 — 제목 앞부분(‘ — ’ 앞)에 단위 붙은 숫자가 있는 기사만, 최대 3개 */
function statsFromTitles(titles: string[]): ThumbStat[] {
  const out: ThumbStat[] = [];
  for (const t of titles) {
    const [seg, rest] = splitTitle(t);
    if (!seg.match(UNIT_NUM) || [...seg].length > THUMB_LIMITS.stat) continue;
    out.push({ dir: numDir(seg) || numDir(rest), text: seg });
    if (out.length === 3) break;
  }
  return out;
}

/** 칩 글 → 큰 숫자 + 설명 (맨 뒤의 단위 붙은 숫자를 크게) */
export function splitStat(text: string): { value: string; label: string } {
  const all = [...text.matchAll(UNIT_NUM)];
  const last = all[all.length - 1];
  if (!last || last.index == null) return { value: "", label: text };
  const value = last[0].trim();
  const label = (text.slice(0, last.index) + text.slice(last.index + last[0].length)).replace(/\s+/g, " ").replace(/\s+([,·])/g, "$1").replace(/\s*[·,]\s*$/, "").trim();
  return { value, label };
}

/** 날짜에 따라 번갈아 — 카드형 → 큰 글씨형 → 숫자판 */
const LAYOUT_ORDER: IssueLayout[] = ["card", "bold", "board"];

/** 썸네일에 들어갈 값 (운영자가 고친 값 > 자동) — 관리자 화면에서 '자동이면 무엇인지' 보여 줄 때도 씀 */
export function comicPlan(issue: Pick<BriefingIssue, "title" | "date">, thumb: IssueThumb, headline = "", stories: string[] = []) {
  const [main, sub] = splitTitle(issue.title);
  const texts = [main, sub, headline];
  const autoSceneKey = autoScene(texts, issue.date);
  const scene = thumb.scene || autoSceneKey;
  // 아래 줄(사실 한 줄)과 같은 이야기인 숫자 칩은 빼요 — 같은 말이 두 번 보이지 않게
  const capWord = (thumb.caption || sub).split(/\s+/)[0] ?? "";
  const autoStats = statsFromTitles(stories).filter((x) => !capWord || x.text.split(/\s+/)[0] !== capWord);
  const stats = thumb.stats ? parseStats(thumb.stats) : autoStats;
  const autoLayoutKey = LAYOUT_ORDER[(((dayIndex(issue.date) + 2) % 3) + 3) % 3];
  const want = thumb.layout || autoLayoutKey;
  // 숫자판인데 숫자가 없으면 큰 글씨형으로
  const layout: IssueLayout = want === "board" && stats.length < 2 ? "bold" : want;
  // 변장 자동: 인물 발언이면 제목 속 인물로, 아니면 그림 주제에 맞는 옷 (유가면 안전모, 금리면 총재…)
  const auto = { scene: autoSceneKey, costume: scene === "speech" ? autoCostume(texts) : SCENE_COSTUME[scene], mood: autoMood(main), bubble: main, caption: sub };
  const mood = thumb.mood || auto.mood;
  // 콩이: 정해진 규칙이 아니라 그때그때 — 자동이면 인물 발언이거나 분위기가 뚜렷한 날(오름·내림)에 반응하며 등장
  const kong = thumb.kong === "on" ? true : thumb.kong === "off" ? false : scene === "speech" || mood !== "neutral";
  return {
    scene,
    costume: thumb.costume || auto.costume,
    kong,
    mood,
    bubble: thumb.bubble || main,
    caption: thumb.caption || sub,
    layout,
    stats,
    /** 금리 계기판의 저금리 칸 자물쇠 (‘저금리’ 이야기일 때) */
    lockLow: /저금리/.test([main, sub, headline, thumb.bubble].join(" ")),
    /** 금리 계기판 바늘 — 분위기가 아니라 금리 방향(인상·인하·동결)으로 */
    needle: (/인상/.test(main) ? "up" : /인하/.test(main) ? "down" : thumb.mood || "neutral") as ThumbMood,
    auto: { ...auto, layout: autoLayoutKey, stats: autoStats.map((x) => `${x.dir === "up" ? "▲ " : x.dir === "down" ? "▼ " : ""}${x.text}`).join("\n") },
  };
}

const ACCENT = { up: "#12b981", down: "#ff3d68", neutral: "#533afd" } as const;

/** 그림 주제별 콩이 옷 (변장을 고르지 않았을 때) */
const SCENE_COSTUME: Record<SceneKey, CostumeKey> = {
  speech: "president",
  market: "trader",
  rate: "banker",
  gauge: "banker",
  fx: "money",
  oil: "oil",
  housing: "builder",
  prices: "shopper",
  security: "security",
  chip: "chip",
  trade: "reporter",
  bond: "money",
  news: "reporter",
};

/** 왼쪽 위 이름표 — 작은 금콩 로고 + 판 이름 + 날짜 */
function BrandPill({ date, label, slot }: { date: string; label: string; slot: string }) {
  return (
    <Abs
      style={{
        left: 52,
        top: 48,
        alignItems: "center",
        padding: "8px 20px 8px 10px",
        borderRadius: 999,
        background: "rgba(255,255,255,0.94)",
        boxShadow: "0 8px 24px rgba(12,16,48,0.18)",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={LOGO} width={34} height={34} alt="" style={{ marginRight: 10 }} />
      <div style={{ display: "flex", fontSize: 24, fontWeight: 800, color: C.ink, letterSpacing: -0.5 }}>{label}</div>
      <div style={{ display: "flex", marginLeft: 10, fontSize: 22, fontWeight: 600, color: C.inkSoft, letterSpacing: -0.3 }}>{`${formatDayHeading(date)} ${slot}`}</div>
    </Abs>
  );
}

type Plan = ReturnType<typeof comicPlan>;

/** 계기판 양 끝 글자 (저금리·고금리) */
function GaugeLabels() {
  const { cx, cy, r } = GAUGE;
  const pill: CSSProperties = { top: cy + 36, padding: "6px 14px", borderRadius: 999, fontSize: 22, fontWeight: 800, color: C.white };
  return (
    <>
      <Abs style={{ ...pill, left: cx - r - 50, background: "#3d5fd6" }}>저금리</Abs>
      <Abs style={{ ...pill, left: cx + r - 56, background: "#e2365a" }}>고금리</Abs>
    </>
  );
}

/** 그림 한 장 (계기판이면 양 끝 글자까지) */
function SceneImage({ plan }: { plan: Plan }) {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element -- 썸네일 그림(서버 렌더) */}
      <img src={svgUri(sceneSvg(plan.scene, plan.scene === "gauge" ? plan.needle : plan.mood, { lockLow: plan.lockLow }))} width={1200} height={630} alt="" style={{ position: "absolute", left: 0, top: 0 }} />
      {plan.scene === "gauge" && <GaugeLabels />}
    </>
  );
}

function MorningThumb({ issue, plan }: { issue: BriefingIssue; plan: Plan }) {
  const { scene, costume, mood, bubble, caption } = plan;
  const speech = scene === "speech";
  const look: OgKong = { ...COSTUME_LOOK[costume], wide: true, worried: mood === "down" };
  if (mood === "up" && !look.hold) look.wave = true;
  const cap = caption ? captionFit(caption) : null;
  const head = speech ? speechFit(bubble) : headlineFit(bubble);
  const accent = ACCENT[mood];

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", fontFamily: "Pretendard" }}>
      {/* 뉴스 그림 — 화면 전체 */}
      <SceneImage plan={plan} />

      {speech ? (
        <>
          {/* 인물 발언: 변장한 콩이가 연단에서 */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={svgUri(kongSvg(look))} width={500} height={500} alt="" style={{ position: "absolute", left: 680, top: 54 }} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={PODIUM} width={360} height={210} alt="" style={{ position: "absolute", left: 750, top: 424 }} />
        </>
      ) : (
        plan.kong && (
          // 다른 그림에서는 왼쪽 빈자리에서 뉴스에 반응하는 콩이
          // eslint-disable-next-line @next/next/no-img-element
          <img src={svgUri(kongSvg(look))} width={270} height={270} alt="" style={{ position: "absolute", left: 96, top: 112 }} />
        )
      )}

      <BrandPill date={issue.date} label="금콩 브리핑" slot="아침판" />

      {speech ? (
        <>
          {/* 말풍선 — 기사에 실린 발언 그대로 */}
          <Abs
            style={{
              left: 52,
              top: 128,
              width: 590,
              minHeight: 190,
              padding: "28px 36px",
              background: C.white,
              borderRadius: 36,
              alignItems: "center",
              boxShadow: "0 18px 40px rgba(12,16,48,0.28)",
            }}
          >
            <Lines lines={head.lines} style={{ fontSize: head.size, fontWeight: 800, color: "#13163f", lineHeight: 1.22, letterSpacing: -1.2 }} />
          </Abs>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={TAIL} width={80} height={64} alt="" style={{ position: "absolute", left: 630, top: 236 }} />
          {cap && (
            <Abs style={{ left: 52, bottom: 52, maxWidth: 640, padding: "12px 22px", background: "rgba(12,16,48,0.72)", borderRadius: 14 }}>
              <Lines lines={cap.lines} style={{ fontSize: cap.size, fontWeight: 700, color: C.white, letterSpacing: -0.5, lineHeight: 1.3 }} />
            </Abs>
          )}
        </>
      ) : (
        // 제목 카드 — 왼쪽 아래 (분위기 색 띠)
        <Abs style={{ left: 52, bottom: 52, width: 640, background: C.white, borderRadius: 28, overflow: "hidden", boxShadow: "0 22px 48px rgba(12,16,48,0.3)" }}>
          <div style={{ display: "flex", width: 10, background: accent }} />
          <div style={{ display: "flex", flexDirection: "column", padding: "22px 30px 22px 26px" }}>
            <Lines lines={head.lines} style={{ fontSize: head.size, fontWeight: 800, color: "#13163f", lineHeight: 1.18, letterSpacing: -1.6 }} />
            {cap && <Lines lines={cap.lines} style={{ marginTop: 10, fontSize: cap.size, fontWeight: 600, color: "#5b6080", letterSpacing: -0.4, lineHeight: 1.3 }} />}
          </div>
        </Abs>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 큰 글씨형 · 숫자판 — 같은 주제라도 날마다 모양이 달라 보이게             */
/* ------------------------------------------------------------------ */

const GOLD = "#ffd84d";

/** 쉼표가 있으면 쉼표에서 두 줄로 (‘오늘 금통위,’ / ‘동결 무게’) — 안 들어가면 보통 줄바꿈 */
function fitByComma(text: string, sizes: number[], width: number, maxLines: number): { size: number; lines: string[] } {
  const parts = text.split(/(?<=,)\s+/);
  if (parts.length === 2)
    for (const size of sizes) {
      const a = fitText(parts[0], [size], width, 1);
      const b = fitText(parts[1], [size], width, 1);
      if (a.lines.length === 1 && b.lines.length === 1 && !a.lines[0].endsWith("…") && !b.lines[0].endsWith("…")) return { size, lines: parts };
    }
  return fitText(text, sizes, width, maxLines);
}

/** 숫자판 바탕 — 남색 그라데이션 + 옅은 격자 + 빛 번짐 */
const BOARD_BG = svgUri(
  `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0b1040"/><stop offset="1" stop-color="#1d2470"/></linearGradient>` +
    `<filter id="b" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="70"/></filter></defs>` +
    `<rect width="1200" height="630" fill="url(#g)"/>` +
    Array.from({ length: 21 }, (_, i) => `<path d="M${i * 60} 0V630" stroke="#ffffff" stroke-opacity=".035"/>`).join("") +
    Array.from({ length: 11 }, (_, i) => `<path d="M0 ${i * 60}H1200" stroke="#ffffff" stroke-opacity=".035"/>`).join("") +
    `<circle cx="940" cy="320" r="230" fill="#533afd" opacity=".45" filter="url(#b)"/>` +
    `<circle cx="1120" cy="60" r="150" fill="#ffd84d" opacity=".16" filter="url(#b)"/>` +
    `<circle cx="180" cy="600" r="200" fill="#7b66ff" opacity=".25" filter="url(#b)"/>` +
    `</svg>`,
);

const ARROW = { up: { c: "#12b981", t: "▲" }, down: { c: "#ff3d68", t: "▼" }, "": { c: GOLD, t: "•" } } as const;

/** 강조할 말 — *별표*로 감싼 말, 없으면 첫 숫자 */
function splitEmphasis(text: string): { pre: string; big: string; post: string } | null {
  const star = text.match(/^([^*]*)\*([^*]+)\*(.*)$/);
  if (star) return { pre: star[1].trim(), big: star[2].trim(), post: star[3].trim() };
  const m = text.match(/\d[\d,.]*\s?(?:조원|조|억원|억|만원|만|천|%p|%|bp|달러|원|배|개|명|건|포인트)?/);
  if (!m || m.index == null) return null;
  return { pre: text.slice(0, m.index).trim(), big: m[0].trim(), post: text.slice(m.index + m[0].length).trim() };
}
const plainText = (t: string) => t.replace(/\*/g, "");

/** 인물 발언이면 오른쪽에 연단 콩이 */
function SpeechKong({ plan }: { plan: Plan }) {
  if (plan.scene !== "speech") return null;
  const look: OgKong = { ...COSTUME_LOOK[plan.costume], wide: true, worried: plan.mood === "down" };
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={svgUri(kongSvg(look))} width={470} height={470} alt="" style={{ position: "absolute", left: 700, top: 70 }} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={PODIUM} width={340} height={198} alt="" style={{ position: "absolute", left: 770, top: 432 }} />
    </>
  );
}

function StatChip({ st }: { st: ThumbStat }) {
  const a = ARROW[st.dir];
  const fit = fitText(st.text, [24, 22, 20], 520, 1);
  return (
    <div style={{ display: "flex", alignItems: "center", marginRight: 10, marginTop: 10, padding: "8px 16px 8px 10px", borderRadius: 14, background: "rgba(255,255,255,0.12)", border: "1.5px solid rgba(255,255,255,0.28)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: 99, background: a.c, color: C.white, fontSize: 15, fontWeight: 800, marginRight: 10 }}>{a.t}</div>
      <div style={{ display: "flex", fontSize: fit.size, fontWeight: 700, color: C.white, letterSpacing: -0.4, whiteSpace: "nowrap" }}>{fit.lines[0]}</div>
    </div>
  );
}

/** 큰 글씨형 — 왼쪽에 큰 글씨(강조 말은 노랗게 크게), 아래 사실 한 줄과 숫자 칩 */
function MorningBold({ issue, plan }: { issue: BriefingIssue; plan: Plan }) {
  const text = plan.bubble;
  const em = splitEmphasis(text);
  const giant = em && [...em.big].length <= 7 ? em : null;
  const chips = plan.stats.slice(0, 2);
  const cap = plan.caption ? fitText(plan.caption, [26, 24, 22], 600, 1) : null;
  const shadow = "0 4px 18px rgba(0,0,0,0.35)";
  // 큰 글씨 칸: 이름표 아래 ~ 아래 줄 위
  const top = 120;
  const room = chips.length ? 300 : 360;
  let block: ReactNode;
  if (giant) {
    const pre = giant.pre ? fitByComma(giant.pre, [54, 48, 44], 600, 2) : null;
    const post = giant.post ? fitByComma(giant.post, [62, 56, 50, 44], 600, 2) : null;
    const rest = (pre ? pre.lines.length * pre.size * 1.14 + 8 : 0) + (post ? post.lines.length * post.size * 1.14 + 8 : 0);
    const big = [170, 150, 134, 118, 104, 92].find((sz) => {
      const f = fitText(giant.big, [sz], 600, 1);
      return !f.lines[0].endsWith("…") && sz + rest <= room;
    }) ?? 92;
    block = (
      <Abs style={{ left: 56, top: top + Math.max(0, (room - big - rest) / 2), width: 640, flexDirection: "column" }}>
        {pre && <Lines lines={pre.lines} style={{ fontSize: pre.size, fontWeight: 800, color: C.white, lineHeight: 1.14, letterSpacing: -1.5, textShadow: shadow, marginBottom: 8 }} />}
        <div style={{ display: "flex", fontSize: big, fontWeight: 800, color: GOLD, lineHeight: 1, letterSpacing: -big * 0.035, textShadow: "0 8px 0 rgba(0,0,0,0.35)" }}>{giant.big}</div>
        {post && <Lines lines={post.lines} style={{ marginTop: 8, fontSize: post.size, fontWeight: 800, color: C.white, lineHeight: 1.14, letterSpacing: -1.6, textShadow: shadow }} />}
      </Abs>
    );
  } else {
    const head = fitText(plainText(text), [76, 68, 60, 54, 48], 600, 3);
    block = (
      <Abs style={{ left: 56, top: top + Math.max(0, (room - head.lines.length * head.size * 1.14) / 2), width: 640 }}>
        <Lines lines={head.lines} style={{ fontSize: head.size, fontWeight: 800, color: C.white, lineHeight: 1.14, letterSpacing: -2, textShadow: shadow }} />
      </Abs>
    );
  }
  const dark = plan.scene === "gauge" || plan.scene === "market";
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", fontFamily: "Pretendard" }}>
      <SceneImage plan={plan} />
      <Abs
        style={{
          left: 0,
          top: 0,
          width: 900,
          height: 630,
          backgroundImage: dark
            ? "linear-gradient(90deg, rgba(8,11,42,0.86) 0%, rgba(8,11,42,0.6) 55%, rgba(8,11,42,0) 100%)"
            : "linear-gradient(90deg, rgba(10,14,48,0.95) 0%, rgba(10,14,48,0.86) 50%, rgba(10,14,48,0) 100%)",
        }}
      />
      <SpeechKong plan={plan} />
      <BrandPill date={issue.date} label="금콩 브리핑" slot="아침판" />
      {block}
      <Abs style={{ left: 56, bottom: 50, width: 680, flexDirection: "column" }}>
        {cap && (
          <div style={{ display: "flex", alignItems: "center", fontSize: cap.size, fontWeight: 700, color: "rgba(255,255,255,0.86)", letterSpacing: -0.4, whiteSpace: "nowrap" }}>
            <div style={{ display: "flex", width: 8, height: 8, borderRadius: 99, background: GOLD, marginRight: 12 }} />
            {cap.lines[0]}
          </div>
        )}
        {chips.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", marginTop: cap ? 4 : 0 }}>
            {chips.map((st) => (
              <StatChip key={st.text} st={st} />
            ))}
          </div>
        )}
      </Abs>
    </div>
  );
}

/** 숫자판 — 왼쪽 제목, 오른쪽 오늘의 숫자 카드 2~3장 */
function MorningBoard({ issue, plan }: { issue: BriefingIssue; plan: Plan }) {
  const head = fitByComma(plainText(plan.bubble), [60, 54, 48, 44], 560, 3);
  const cap = plan.caption ? fitText(plan.caption, [24, 22, 20], 560, 2) : null;
  const cards = plan.stats.slice(0, 3);
  const cardH = cards.length === 3 ? 122 : 150;
  const gap = 16;
  const total = cards.length * cardH + (cards.length - 1) * gap;
  const headH = head.lines.length * head.size * 1.16 + (cap ? cap.lines.length * cap.size * 1.35 + 16 : 0);
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", fontFamily: "Pretendard" }}>
      {/* 숫자판은 깨끗한 어두운 바탕 — 숫자가 주인공 */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={BOARD_BG} width={1200} height={630} alt="" style={{ position: "absolute", left: 0, top: 0 }} />
      <BrandPill date={issue.date} label="금콩 브리핑" slot="아침판" />
      <Abs style={{ left: 56, top: 122 + Math.max(0, (420 - headH) / 2), width: 580, flexDirection: "column" }}>
        <div style={{ display: "flex", width: 56, height: 8, borderRadius: 99, background: GOLD, marginBottom: 18 }} />
        <Lines lines={head.lines} style={{ fontSize: head.size, fontWeight: 800, color: C.white, lineHeight: 1.16, letterSpacing: -1.8 }} />
        {cap && <Lines lines={cap.lines} style={{ marginTop: 16, fontSize: cap.size, fontWeight: 600, color: "rgba(255,255,255,0.78)", lineHeight: 1.35, letterSpacing: -0.4 }} />}
      </Abs>
      <Abs style={{ left: 676, top: (630 - total) / 2 + 24, width: 476, flexDirection: "column" }}>
        <div style={{ display: "flex", position: "absolute", left: 0, top: -40, fontSize: 20, fontWeight: 800, color: GOLD, letterSpacing: 1 }}>오늘의 숫자</div>
        {cards.map((st, i) => {
          const { value, label } = splitStat(st.text);
          const a = ARROW[st.dir];
          const v = fitText(value || st.text, [48, 42, 36], 330, 1);
          const l = fitText(label, [22, 20, 18], 330, 1);
          return (
            <div
              key={st.text}
              style={{
                display: "flex",
                alignItems: "center",
                height: cardH,
                marginTop: i ? gap : 0,
                padding: "0 24px",
                borderRadius: 22,
                background: "rgba(255,255,255,0.08)",
                border: "1.5px solid rgba(255,255,255,0.2)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 48, height: 48, borderRadius: 99, background: a.c, color: C.white, fontSize: 22, fontWeight: 800, marginRight: 20 }}>{a.t}</div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", fontSize: v.size, fontWeight: 800, color: GOLD, letterSpacing: -1.2, lineHeight: 1.1 }}>{v.lines[0]}</div>
                {label && <div style={{ display: "flex", marginTop: 6, fontSize: l.size, fontWeight: 700, color: "rgba(255,255,255,0.82)", letterSpacing: -0.4, whiteSpace: "nowrap" }}>{l.lines[0]}</div>}
              </div>
            </div>
          );
        })}
      </Abs>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 금콩 스터디 — 공책 템플릿 + 오늘의 논술 주제                             */
/* ------------------------------------------------------------------ */

/** 금콩 스터디 공책 — 날마다 종이·테이프·이름표 색이 바뀌어요 (틀은 그대로) */
const STUDY_THEMES = [
  { paper: "#fffdf6", line: "#dfe8f7", margin: "#f4a6b4", ring: "#e9e3d3", tape: "rgba(255, 216, 77, 0.85)", pill: C.primary, kong: { hold: "pencil", glasses: true } },
  { paper: "#f4fbf7", line: "#d4ebdf", margin: "#8fd3ae", ring: "#dcebe2", tape: "rgba(255, 158, 196, 0.8)", pill: "#178a5b", kong: { hold: "book", glasses: true } },
  { paper: "#f8f6ff", line: "#e3defa", margin: "#b9a8ff", ring: "#e6e1f5", tape: "rgba(127, 224, 170, 0.8)", pill: "#1c1e54", kong: { hold: "pencil", wave: true } },
] as const satisfies readonly { paper: string; line: string; margin: string; ring: string; tape: string; pill: string; kong: OgKong }[];

const paperSvg = (t: (typeof STUDY_THEMES)[number]) =>
  svgUri(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">` +
      `<rect width="1200" height="630" fill="${t.paper}"/>` +
      Array.from({ length: 12 }, (_, i) => `<path d="M0 ${118 + i * 46}h1200" stroke="${t.line}" stroke-width="2"/>`).join("") +
      `<path d="M140 0v630" stroke="${t.margin}" stroke-width="3"/>` +
      Array.from({ length: 9 }, (_, i) => `<circle cx="66" cy="${52 + i * 66}" r="13" fill="${t.ring}"/><path d="M40 ${52 + i * 66}h40" stroke="#8d8fb8" stroke-width="6" stroke-linecap="round"/>`).join("") +
      `</svg>`,
  );

/** '오늘의 논술 주제' 앞 연필 */
const PENCIL = svgUri(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="28" height="28"><path d="M16.5 3.5l4 4L8 20H4v-4z" fill="none" stroke="#fff" stroke-width="2.4" stroke-linejoin="round"/><path d="M13.5 6.5l4 4" stroke="#fff" stroke-width="2.4"/></svg>`,
);

/** 오른쪽 아래 낙서 — 별·체크·밑줄 */
const DOODLES = svgUri(
  `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="420" viewBox="0 0 300 420">` +
    `<path d="M40 40l7 14 15 2-11 10 3 15-14-7-14 7 3-15-11-10 15-2z" fill="#ffd84d" stroke="${C.ink}" stroke-width="3" stroke-linejoin="round"/>` +
    `<path d="M236 70l12 14 26-30" stroke="${C.primary}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>` +
    `<path d="M20 390c40-12 90-14 150-6" stroke="${C.primary}" stroke-width="6" stroke-linecap="round" fill="none" opacity=".5"/>` +
    `</svg>`,
);

function NoonStudy({ issue, topic, terms }: { issue: BriefingIssue; topic: string; terms: string[] }) {
  const theme = STUDY_THEMES[((dayIndex(issue.date) % STUDY_THEMES.length) + STUDY_THEMES.length) % STUDY_THEMES.length];
  const fit = topicFit(topic);
  // 용어는 이름만, 한 줄에 들어가는 만큼만 (잘라 쓰지 않고 통째로 빼요)
  const chips: string[] = [];
  let used = 0;
  for (const t of terms.map((x) => x.replace(/\s*\([^)]*\)/g, "").trim()).filter(Boolean)) {
    const w = [...t].length * 24 + 40;
    if (used + w > 560) break;
    chips.push(t);
    used += w + 12;
  }

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", fontFamily: "Pretendard" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={paperSvg(theme)} width={1200} height={630} alt="" style={{ position: "absolute", left: 0, top: 0 }} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={DOODLES} width={300} height={420} alt="" style={{ position: "absolute", left: 880, top: 96 }} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={svgUri(kongSvg(theme.kong))} width={330} height={330} alt="" style={{ position: "absolute", left: 846, top: 196 }} />

      {/* 마스킹 테이프 이름표 */}
      <Abs
        style={{
          left: 168,
          top: 34,
          padding: "10px 22px",
          background: theme.tape,
          fontSize: 27,
          fontWeight: 800,
          color: C.ink,
          transform: "rotate(-1.5deg)",
          letterSpacing: -0.5,
        }}
      >
        {`금콩 스터디 · ${formatDayHeading(issue.date)} 점심판`}
      </Abs>

      <Abs style={{ left: 172, top: 120, alignItems: "center", padding: "8px 20px 8px 14px", borderRadius: 999, background: theme.pill, color: C.white, fontSize: 26, fontWeight: 800 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={PENCIL} width={28} height={28} alt="" style={{ marginRight: 8 }} />
        오늘의 논술 주제
      </Abs>

      <Abs style={{ left: 172, top: fit.lines.length > 3 ? 184 : 196, width: TOPIC_W }}>
        <Lines lines={fit.lines} style={{ fontSize: fit.size, fontWeight: 800, color: C.ink, lineHeight: 1.24, letterSpacing: -1.5 }} />
      </Abs>

      {chips.length > 0 && (
        <Abs style={{ left: 172, top: 486, alignItems: "center" }}>
          <div style={{ display: "flex", fontSize: 22, fontWeight: 700, color: C.inkSoft, marginRight: 12 }}>오늘의 용어</div>
          {chips.map((t) => (
            <div key={t} style={{ display: "flex", marginRight: 10, padding: "5px 14px", borderRadius: 10, background: C.lavender, border: `2px solid ${C.ink}`, fontSize: 22, fontWeight: 800, color: C.ink }}>
              {t}
            </div>
          ))}
        </Abs>
      )}

      <Abs style={{ left: 172, top: 560, fontSize: 22, fontWeight: 700, color: C.inkSoft }}>점심에 보는 금융 공부 · 금콩</Abs>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 점심 3문제 — 아침판 그림 이야기와 같은 그림체: 그날 새로 그린 그림 위에 큰 글 + 문제 카드 + 이번 주 금공 */
/* ------------------------------------------------------------------ */

const LUNCH = { navy: "#2b3a7a", ink: "#27325f", body: "#3d4778", orange: "#f7a14a", cream: "#fffdf8" } as const;

/** 바탕 그림 — wide = 16:9 그림(그날 그린 그림)이라 위아래를 조금 잘라 채워요, 아니면 1200×630 그대로 */
type NoonBg = { src: string; wide: boolean };

/** 형식은 파일 이름이 아니라 내용(첫 바이트)으로 — 그림 서비스가 PNG 대신 JPG 를 줄 때가 있어요 */
const dataUri = (buf: Uint8Array) => `data:image/${buf[0] === 0xff && buf[1] === 0xd8 ? "jpeg" : "png"};base64,${Buffer.from(buf).toString("base64")}`;

/** webp 는 썸네일 그리개가 못 읽어요 (11/8 시범판 그림) — 그때는 null */
const isWebp = (buf: Uint8Array) => buf[0] === 0x52 && buf[1] === 0x49 && buf[8] === 0x57 && buf[9] === 0x45;

/** 그날 그린 그림 — 그림 그리기 API 가 저장한 파일(/api/files/…) 또는 사이트 안 /magazine/brief/… (next.config 로 함께 배포) */
async function coverData(src: string): Promise<string | null> {
  try {
    if (src.startsWith("/api/files/")) {
      const body = await readStoredFile(src.slice("/api/files/".length));
      if (!body) return null;
      const buf = body instanceof Uint8Array ? body : new Uint8Array(await new Response(body).arrayBuffer());
      return isWebp(buf) ? null : dataUri(buf);
    }
    const buf = await readFile(join(process.cwd(), "public", src));
    return isWebp(buf) ? null : dataUri(buf);
  } catch {
    return null;
  }
}

/** 기본 점심 그림 (그날 그림이 없을 때만 — public/magazine/brief/noon/*.jpg) */
async function noonArtData(key: NoonArt): Promise<string | null> {
  const buf = await readFile(join(process.cwd(), "public", noonArtSrc(key, "jpg"))).catch(() => null);
  return buf ? dataUri(buf) : null;
}

/** 큰 글 줄 나누기 — ' / ' 가 있으면 거기서, 쉼표가 있으면 쉼표 뒤에서, 아니면 가운데 띄어쓰기에서 */
function hookLines(text: string, width: number): { size: number; lines: string[] } {
  const sizes = [84, 78, 72, 66, 60];
  let lines: string[];
  if (/\s\/\s/.test(text)) lines = text.split(/\s+\/\s+/).filter(Boolean);
  else if (juaWidth(text, 78) <= width) lines = [text];
  else if (/,\s/.test(text)) {
    const i = text.search(/,\s/);
    lines = [text.slice(0, i + 1), text.slice(i + 2)];
  } else {
    const mid = text.length / 2;
    const spaces = [...text.matchAll(/ /g)].map((m) => m.index ?? 0);
    const at = spaces.sort((a, b) => Math.abs(a - mid) - Math.abs(b - mid))[0];
    lines = at ? [text.slice(0, at), text.slice(at + 1)] : [text];
  }
  const size = sizes.find((s) => lines.every((l) => juaWidth(l, s) <= width)) ?? sizes[sizes.length - 1];
  return { size, lines: lines.slice(0, 2) };
}

/** Pretendard 굵은 글 대충 폭 (보기 칸 고르기용) */
const optWidth = (t: string, size: number) =>
  [...t].reduce((w, ch) => w + (/[가-힣]/.test(ch) ? 0.98 : ch === " " ? 0.28 : /[0-9]/.test(ch) ? 0.6 : /[A-Z]/.test(ch) ? 0.7 : 0.55), 0) * size;

/** 썸네일 문제 문장 — ask 가 있으면 그것. 없으면 문제 글이 세 줄에 들면 전체, 아니면 끝 문장('이·그·위·다음'으로 시작하지 않을 때) */
function askText(drill: IssueDrill, stem: string, width: number): string {
  if (drill.ask) return drill.ask;
  const whole = fitText(stem, [25, 23], width, 3);
  if (!whole.lines[whole.lines.length - 1]?.endsWith("…")) return stem;
  const parts = stem.split(/(?<=[.?!])\s+/);
  const last = parts[parts.length - 1] ?? stem;
  return [...last].length >= 25 && !/^(이|그|위|다음|이런|이러한)\s/.test(last) ? last : stem;
}

/** 이번 주 금공 한 줄 — 있는 것만 두 가지까지 (서류 마감 > 새 공고 > 필기 > 면접), 기관 수 */
function radarLine(radar: WeekRadar): string {
  const places = (list: RadarItem[]) => new Set(list.map((s) => s.companyId)).size;
  const stage = (types: string[]) => places(radar.stages.filter((s) => types.includes(s.type)));
  const parts: [string, number][] = [
    ["서류 마감", places(radar.deadlines)],
    ["새 공고", places(radar.postings)],
    ["필기", stage(["written"])],
    ["면접", stage(["interview1", "interview2"])],
  ];
  const on = parts.filter(([, n]) => n > 0).slice(0, 2);
  return on.length ? `이번 주 ${on.map(([l, n]) => `${l} ${n}곳`).join(" · ")}` : "";
}

const NOON_LEFT = 46;
const NOON_W = 640;
/** 문제 카드가 내려올 수 있는 맨 아래 (아래 이름표 위) */
const CARD_FLOOR = 516;

function NoonDrillView({ issue, drill, radar, bg }: { issue: BriefingIssue; drill: IssueDrill; radar: WeekRadar; bg: NoonBg | null }) {
  const q = drill.questions[drill.share] ?? drill.questions[0];
  const k = DRILL_KINDS[q.kind];
  const raw = drill.hook || "오늘의 문제, 풀어 볼까요?";
  const em = raw.match(/\*([^*]+)\*/)?.[1] ?? null;
  const hook = hookLines(raw.replace(/\*/g, ""), NOON_W);
  const { m, d } = parseKey(issue.date);
  const tag = `점심 3문제 · ${(q.subject || k.label).replace(/\s*·\s*/g, " ")}`;
  const radarText = radarLine(radar);

  // 문제 카드: 문제 문장 + 보기 (보기만 있는 일은 없게 — 들어갈 자리가 없으면 보기를 빼고 문제만)
  const hookTop = 118;
  const cardTop = Math.round(hookTop + hook.lines.length * hook.size * 1.2 + 10);
  const PAD = 18;
  const textW = NOON_W - 44 - 54; // 여백 + 'Q' 동그라미
  const ask = fitText(askText(drill, q.stem, textW), [27, 25, 23], textW, 3);
  const askH = ask.lines.length * ask.size * 1.36;
  const room = CARD_FLOOR - cardTop - PAD * 2 - askH - 10;
  // 보기 — 두 칸(짧을 때) → 한 줄씩(들어가면) → 없음
  const colW = (NOON_W - 44) / 2 - 12;
  const twoSize = q.options.length <= 4 ? [24, 23, 22].find((s) => q.options.every((o) => optWidth(o, s) + s + 12 <= colW) && Math.ceil(q.options.length / 2) * s * 1.5 <= room) : undefined;
  const oneSize = twoSize ? undefined : [23, 22, 21].find((s) => q.options.every((o) => optWidth(o, s) + s + 12 <= NOON_W - 44) && q.options.length * s * 1.45 <= room);
  const optSize = twoSize ?? oneSize ?? 0;

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", fontFamily: "Pretendard", background: "#dfe6fb" }}>
      {bg && (
        // eslint-disable-next-line @next/next/no-img-element -- satori 그림
        <img src={bg.src} width={1200} height={bg.wide ? 675 : 630} alt="" style={{ position: "absolute", left: 0, top: bg.wide ? -22 : 0, width: 1200, height: bg.wide ? 675 : 630 }} />
      )}

      {/* 맨 위 주황 이름표 — 아침판 썸네일과 같은 모양 */}
      <Abs style={{ left: NOON_LEFT - 4, top: 36, alignItems: "center", padding: "5px 20px 7px", borderRadius: 20, background: LUNCH.orange, border: `5px solid ${LUNCH.navy}` }}>
        <div style={{ display: "flex", fontFamily: "Jua", fontSize: 36, color: "#ffffff", WebkitTextStrokeWidth: 6, WebkitTextStrokeColor: LUNCH.navy, whiteSpace: "nowrap" }}>{tag}</div>
      </Abs>

      <VideoHeadline lines={hook.lines} em={em} size={hook.size} left={NOON_LEFT} top={hookTop} />

      {/* 문제 카드 — 시험지처럼: Q + 문제 문장, 아래 보기 */}
      <Abs
        style={{
          left: NOON_LEFT - 4,
          top: cardTop,
          width: NOON_W,
          flexDirection: "column",
          padding: `${PAD}px 22px`,
          borderRadius: 24,
          background: LUNCH.cream,
          border: `4px solid ${LUNCH.navy}`,
          boxShadow: "6px 8px 0 rgba(39,50,95,0.25)",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 40,
              height: 40,
              marginRight: 14,
              marginTop: 1,
              borderRadius: 99,
              background: LUNCH.navy,
              color: "#ffffff",
              fontFamily: "Jua",
              fontSize: 26,
              flexShrink: 0,
            }}
          >
            Q
          </div>
          <Lines lines={ask.lines} style={{ fontSize: ask.size, fontWeight: 800, color: LUNCH.ink, lineHeight: 1.36, letterSpacing: -0.7 }} />
        </div>
        {optSize > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", marginTop: 10, paddingTop: 8, borderTop: "2px dashed rgba(43,58,122,0.25)" }}>
            {q.options.map((o, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  width: twoSize ? "50%" : "100%",
                  paddingTop: 4,
                  fontSize: optSize,
                  lineHeight: 1.3,
                  fontWeight: 700,
                  color: LUNCH.body,
                  whiteSpace: "nowrap",
                }}
              >
                <span style={{ color: LUNCH.orange, fontWeight: 800, marginRight: 8 }}>{CIRCLED[i]}</span>
                {o}
              </div>
            ))}
          </div>
        )}
        {optSize === 0 && (
          <div style={{ display: "flex", marginTop: 8, marginLeft: 54, fontSize: 20, fontWeight: 700, color: "#7a86b8" }}>{`보기 ${q.options.length}개 · 정답과 해설은 금콩에서`}</div>
        )}
      </Abs>

      {/* 아래 — 날짜·이름 + 이번 주 금공 */}
      <Abs style={{ left: NOON_LEFT - 4, bottom: 34, alignItems: "center" }}>
        <div
          style={{
            display: "flex",
            padding: "7px 20px 9px",
            borderRadius: 30,
            background: LUNCH.cream,
            border: `4px solid ${LUNCH.navy}`,
            fontFamily: "Jua",
            fontSize: 28,
            color: LUNCH.navy,
            whiteSpace: "nowrap",
          }}
        >
          {`${m}월 ${d}일 금콩 점심 3문제`}
        </div>
        {radarText && (
          <div
            style={{
              display: "flex",
              marginLeft: 10,
              padding: "7px 18px 9px",
              borderRadius: 30,
              background: LUNCH.navy,
              border: `4px solid ${LUNCH.navy}`,
              fontFamily: "Jua",
              fontSize: 25,
              color: "#ffffff",
              whiteSpace: "nowrap",
            }}
          >
            {radarText}
          </div>
        )}
      </Abs>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 그림 이야기 아침판 — 그날 그린 큰 그림 위에 주황 이름표 + 주아체 큰 글 두 줄 + 날짜 이름표       */
/* ------------------------------------------------------------------ */

/** 한 줄 안의 *강조* 를 노랗게 — 여러 군데 가능 */
function EmSpans({ line, em }: { line: string; em: string | null }) {
  const parts = line.split(/(\*[^*]+\*)/).filter(Boolean);
  return (
    <div style={{ display: "flex", whiteSpace: "pre" }}>
      {parts.map((p, i) =>
        p.startsWith("*") && p.endsWith("*") ? (
          <span key={i} style={{ whiteSpace: "pre", ...(em ? { color: em } : {}) }}>
            {p.slice(1, -1)}
          </span>
        ) : (
          <span key={i} style={{ whiteSpace: "pre" }}>
            {p}
          </span>
        ),
      )}
    </div>
  );
}

/** 영상 썸네일 글씨 (흰 글자 · 굵은 남색 테두리 · 오른쪽 아래 그림자) — *강조* 여러 군데 */
function JuaHeadline({ lines, size, left, top }: { lines: string[]; size: number; left: number; top: number }) {
  const base: CSSProperties = { fontFamily: "Jua", fontSize: size, fontWeight: 400, lineHeight: 1.2, WebkitTextStrokeWidth: size * 0.31, WebkitTextStrokeColor: LUNCH.navy };
  const shade = "rgba(39,50,95,0.43)";
  return (
    <>
      <Abs style={{ left: left + size * 0.077, top: top + size * 0.096, flexDirection: "column", ...base, color: shade, WebkitTextStrokeColor: shade }}>
        {lines.map((l, i) => (
          <EmSpans key={i} line={l} em={null} />
        ))}
      </Abs>
      <Abs style={{ left, top, flexDirection: "column", ...base, color: "#ffffff" }}>
        {lines.map((l, i) => (
          <EmSpans key={i} line={l} em={GOLD} />
        ))}
      </Abs>
    </>
  );
}

function MorningStoryView({ issue, story, hero }: { issue: BriefingIssue; story: IssueStory; hero: string }) {
  const { m, d } = parseKey(issue.date);
  const lines = (story.hook || splitTitle(issue.title)[0]).split(/\s+\/\s+/).slice(0, 2);
  const W = 680;
  const size = [104, 96, 88, 80, 72, 64].find((s) => lines.every((l) => juaWidth(l.replace(/\*/g, ""), s) <= W)) ?? 64;
  const top = story.tag ? 134 : 60;
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", fontFamily: "Pretendard", background: "#dfe6fb" }}>
      {/* eslint-disable-next-line @next/next/no-img-element -- satori 그림 (16:9 → 위아래 조금 잘라 채움) */}
      <img src={hero} width={1200} height={675} alt="" style={{ position: "absolute", left: 0, top: -22, width: 1200, height: 675 }} />
      {story.tag && (
        <Abs style={{ left: NOON_LEFT - 4, top: 40, alignItems: "center", padding: "5px 22px 8px", borderRadius: 22, background: LUNCH.orange, border: `5px solid ${LUNCH.navy}` }}>
          <div style={{ display: "flex", fontFamily: "Jua", fontSize: 42, color: "#ffffff", WebkitTextStrokeWidth: 6, WebkitTextStrokeColor: LUNCH.navy, whiteSpace: "nowrap" }}>{story.tag}</div>
        </Abs>
      )}
      <JuaHeadline lines={lines} size={size} left={NOON_LEFT} top={top} />
      <Abs style={{ left: NOON_LEFT - 4, bottom: 38, alignItems: "center" }}>
        <div
          style={{
            display: "flex",
            padding: "7px 22px 9px",
            borderRadius: 30,
            background: LUNCH.cream,
            border: `4px solid ${LUNCH.navy}`,
            fontFamily: "Jua",
            fontSize: 32,
            color: LUNCH.navy,
            whiteSpace: "nowrap",
          }}
        >
          {`${m}월 ${d}일 금콩 데일리 브리핑`}
        </div>
      </Abs>
    </div>
  );
}

/* ------------------------------------------------------------------ */

/**
 * 한 호의 공유 썸네일 — thumb 를 주면 저장된 값 대신 그걸로 (관리자 미리보기).
 * admin 이면 초안 기사까지 읽어요.
 */
export async function briefingOgImage(
  issue: BriefingIssue,
  { thumb = issue.thumb, admin = false, headers, scale = 1 }: { thumb?: IssueThumb; admin?: boolean; headers?: HeadersInit; scale?: number } = {},
) {
  // 점심 3문제 — 그날 그림 위에 문제 카드 + 이번 주 금공 (친구에게 공유했을 때 문제가 바로 보이게)
  if (issue.edition === "noon" && issue.extras.drill) {
    const drill = issue.extras.drill;
    // 그날 새로 그린 그림이 먼저, 없거나 못 읽으면 기본 점심 그림
    const [base, jua, cover] = await Promise.all([ogFonts(), juaFont(), drill.cover ? coverData(drill.cover) : null]);
    const fallback = cover ? null : await noonArtData(noonArt(drill.questions[drill.share] ?? drill.questions[0]));
    const bg: NoonBg | null = cover ? { src: cover, wide: true } : fallback ? { src: fallback, wide: false } : null;
    return render(<NoonDrillView issue={issue} drill={drill} radar={weekRadar(issue.date)} bg={bg} />, { fonts: [...base, jua], headers, scale });
  }
  // 그날 뉴스에 맞춰 직접 그린 그림 — 정해진 틀 대신
  if (thumb.art) return artOgImage(issue, thumb.art, { headers, scale });
  // 그림 이야기 아침판 — 그날 그린 큰 그림 + 이름표 + 큰 글 (그림을 못 읽으면 아래 예전 틀로)
  const story = issue.edition === "morning" ? issue.extras.story : null;
  if (story?.hero) {
    const [base, jua, hero] = await Promise.all([ogFonts(), juaFont(), coverData(story.hero)]);
    if (hero) return render(<MorningStoryView issue={issue} story={story} hero={hero} />, { fonts: [...base, jua], headers, scale });
  }
  const fonts = await ogFonts();
  let view: ReactElement;
  const items = await issueItems(issue.date, issue.edition, { admin }).catch(() => []);
  if (issue.edition === "noon") {
    const terms = items.filter((n) => n.section === "term").map((n) => n.title);
    const topic = studyTopic(thumb, issue.extras) || splitTitle(issue.title)[0];
    view = <NoonStudy issue={issue} topic={topic} terms={terms} />;
  } else {
    const letter = arrangeLetter(items);
    const plan = comicPlan(issue, thumb, letter.headline?.title ?? "", letter.stories.map((n) => n.title));
    view =
      plan.layout === "bold" ? <MorningBold issue={issue} plan={plan} /> : plan.layout === "board" ? <MorningBoard issue={issue} plan={plan} /> : <MorningThumb issue={issue} plan={plan} />;
  }
  return render(view, { fonts, headers, scale });
}

/** 직접 그린 그림 한 장 — 자동 점검 미리보기도 이걸로 (호가 아직 없어도 날짜·판만 있으면 그려요) */
export async function artOgImage(issue: Pick<BriefingIssue, "date" | "edition">, art: ThumbArt, { headers, scale = 1 }: { headers?: HeadersInit; scale?: number } = {}) {
  return render(<ArtView issue={issue} art={art} />, { fonts: await ogFonts(), headers, scale });
}

function render(view: ReactElement, { fonts, headers, scale }: { fonts: Awaited<ReturnType<typeof ogFonts>>; headers?: HeadersInit; scale: number }) {
  if (scale === 1) return new ImageResponse(view, { ...OG_SIZE, fonts, headers });
  // 같은 그림을 그 배율 크기로 (도형·글자라 또렷해요)
  return new ImageResponse(
    <div style={{ display: "flex", width: OG_SIZE.width * scale, height: OG_SIZE.height * scale }}>
      <div style={{ display: "flex", width: OG_SIZE.width, height: OG_SIZE.height, flexShrink: 0, transform: `scale(${scale})`, transformOrigin: "top left" }}>{view}</div>
    </div>,
    { width: Math.round(OG_SIZE.width * scale), height: Math.round(OG_SIZE.height * scale), fonts, headers },
  );
}

export async function fallbackOgImage(headers?: HeadersInit) {
  return new ImageResponse(<FallbackImage />, { ...OG_SIZE, fonts: await ogFonts(), headers });
}

