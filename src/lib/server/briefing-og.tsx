import "server-only";
import { ImageResponse } from "next/og";
import type { CSSProperties, ReactNode } from "react";
import { formatDayHeading } from "@/lib/date";
import { autoCostume, autoMood, studyTopic, type BriefingIssue, type CostumeKey, type IssueThumb, type ThumbMood } from "@/lib/news-meta";
import { arrangeLetter, issueItems } from "./briefing";
import { TOPIC_W, bubbleFit, captionFit, topicFit } from "../og-text";
import { C, COSTUME_LOOK, OG_SIZE, kongSvg, ogFonts, svgUri, type OgKong } from "./og";

/**
 * 데일리 브리핑 공유 썸네일(og:image) 그리기 — 공유 미리보기 경로와 관리자 미리보기가 같이 써요.
 * - 금콩 브리핑(아침판): 그날 주제에 맞게 변장한 콩이가 말풍선으로 말하는 한 칸 시사 만화
 * - 금콩 스터디(점심판): 공책 템플릿은 그대로, 오늘의 논술 주제 글자만 바뀜
 */

type Topic = "chart" | "percent" | "fx" | "house" | "cart" | "shield" | "bank" | "oil" | "chip" | "news";

/** 변장별 오른쪽 위 스티커 (정상 연설은 연단을 그려서 스티커 없음) */
const COSTUME_STICKER: Record<CostumeKey, Topic | null> = {
  uspresident: null,
  president: null,
  banker: "percent",
  trader: "chart",
  oil: "oil",
  chip: "chip",
  security: "shield",
  builder: "house",
  money: "fx",
  shopper: "cart",
  reporter: "news",
};

/** "메인 — 부제" 로 된 제목 나누기 */
export function splitTitle(title: string): [string, string] {
  const i = title.indexOf(" — ");
  return i < 0 ? [title, ""] : [title.slice(0, i).trim(), title.slice(i + 3).trim()];
}

const STROKE = `stroke="${C.ink}" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"`;

/** 주제 스티커 속 그림 (64×64) */
function topicSvg(topic: Topic, mood: ThumbMood): string | null {
  const tone = mood === "down" ? C.ruby : C.green;
  switch (topic) {
    case "chart":
      return mood === "down"
        ? `<path d="M10 52h46M10 52V12" ${STROKE} fill="none"/><path d="M15 18l12 13 9-7 16 20" stroke="${tone}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M42 45h11V34" stroke="${tone}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`
        : `<path d="M10 52h46M10 52V12" ${STROKE} fill="none"/><path d="M15 44l12-13 9 7 16-20" stroke="${tone}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M42 19h11v11" stroke="${tone}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;
    case "house":
      return `<path d="M10 30L32 12l22 18" ${STROKE} fill="none"/><path d="M16 26v26h32V26" ${STROKE} fill="#fff1e0"/><path d="M27 52V38h10v14" ${STROKE} fill="#ffd84d"/>`;
    case "cart":
      return `<path d="M8 14h8l6 26h28l5-18H20" ${STROKE} fill="none"/><circle cx="26" cy="50" r="4.5" fill="${C.ink}"/><circle cx="46" cy="50" r="4.5" fill="${C.ink}"/><path d="M27 28h22" stroke="${tone}" stroke-width="5" stroke-linecap="round"/>`;
    case "shield":
      return `<path d="M32 8l20 7v14c0 13-8 22-20 27C20 51 12 42 12 29V15z" ${STROKE} fill="#ece8ff"/><rect x="24" y="30" width="16" height="13" rx="2" fill="${C.ink}"/><path d="M27 30v-4a5 5 0 0 1 10 0v4" ${STROKE} fill="none"/>`;
    case "bank":
      return `<path d="M8 24L32 10l24 14z" ${STROKE} fill="#ffd84d"/><path d="M14 28v18M25 28v18M39 28v18M50 28v18" ${STROKE}/><path d="M8 52h48" ${STROKE}/>`;
    case "oil":
      return `<rect x="16" y="12" width="32" height="42" rx="5" ${STROKE} fill="#3b3f63"/><path d="M16 24h32M16 42h32" ${STROKE}/><path d="M32 27c3.4 4.6 5 7.4 5 9.6a5 5 0 0 1-10 0c0-2.2 1.6-5 5-9.6z" fill="#ffd84d"/>`;
    case "chip":
      return `<rect x="16" y="16" width="32" height="32" rx="4" ${STROKE} fill="#2b2f55"/><rect x="25" y="25" width="14" height="14" rx="2" fill="#ffd84d"/><path d="M22 16V9M32 16V9M42 16V9M22 55v-7M32 55v-7M42 55v-7M16 22H9M16 32H9M16 42H9M55 22h-7M55 32h-7M55 42h-7" ${STROKE}/>`;
    default:
      return null;
  }
}

/** 별 모양 터짐 (만화 효과) */
function burstSvg(fill: string): string {
  const pts: string[] = [];
  const n = 18;
  for (let i = 0; i < n * 2; i++) {
    const r = i % 2 ? 172 : 232;
    const a = (Math.PI * i) / n - Math.PI / 2;
    pts.push(`${(240 + r * Math.cos(a)).toFixed(1)},${(240 + r * Math.sin(a)).toFixed(1)}`);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="480" viewBox="0 0 480 480"><polygon points="${pts.join(" ")}" fill="${fill}" stroke="${C.ink}" stroke-width="5" stroke-linejoin="round"/></svg>`;
}

const DOTS = svgUri(
  `<svg xmlns="http://www.w3.org/2000/svg" width="1144" height="574"><defs><pattern id="d" width="18" height="18" patternUnits="userSpaceOnUse"><circle cx="5" cy="5" r="2.4" fill="${C.ink}" fill-opacity=".07"/></pattern></defs><rect width="1144" height="574" fill="url(#d)"/></svg>`,
);

/** 말풍선 꼬리 (오른쪽 아래 콩이 쪽으로) */
const TAIL = svgUri(
  `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="80" viewBox="0 0 96 80"><path d="M2 6 L90 58 L2 72" fill="#fff" stroke="${C.ink}" stroke-width="6" stroke-linejoin="round"/></svg>`,
);

/** 연단 (정상·장관 연설) — 콩이 아랫몸을 가리고, 마이크가 입 쪽으로 */
const PODIUM = svgUri(
  `<svg xmlns="http://www.w3.org/2000/svg" width="330" height="200" viewBox="0 0 330 200">` +
    `<path d="M118 40 C 104 18 92 8 74 2" stroke="${C.ink}" stroke-width="6" fill="none" stroke-linecap="round"/>` +
    `<rect x="58" y="-6" width="30" height="18" rx="9" transform="rotate(-24 73 3)" fill="#3b3f63" stroke="${C.ink}" stroke-width="5"/>` +
    `<path d="M20 34h290l-22 166H42z" fill="#26306b" stroke="${C.ink}" stroke-width="6" stroke-linejoin="round"/>` +
    `<rect x="8" y="22" width="314" height="22" rx="6" fill="#3a4486" stroke="${C.ink}" stroke-width="6"/>` +
    `<circle cx="165" cy="112" r="36" fill="#f5f3ff" stroke="#ffd84d" stroke-width="7"/>` +
    `<path d="M165 86l7.6 15.4 17 2.5-12.3 12 2.9 16.9L165 124.8l-15.2 8 2.9-16.9-12.3-12 17-2.5z" fill="#ffd84d" stroke="${C.ink}" stroke-width="3" stroke-linejoin="round"/>` +
    `</svg>`,
);

function Abs({ style, children }: { style: CSSProperties; children?: ReactNode }) {
  return <div style={{ position: "absolute", display: "flex", ...style }}>{children}</div>;
}

function Sticker({ topic, mood }: { topic: Topic; mood: ThumbMood }) {
  const svg = topicSvg(topic, mood);
  const text = topic === "percent" ? "%" : topic === "fx" ? "₩$" : topic === "news" ? "NEWS" : null;
  return (
    <Abs
      style={{
        left: 1004,
        top: 76,
        width: 132,
        height: 132,
        borderRadius: 999,
        background: C.white,
        border: `5px solid ${C.ink}`,
        alignItems: "center",
        justifyContent: "center",
        transform: "rotate(8deg)",
      }}
    >
      {svg ? (
        // eslint-disable-next-line @next/next/no-img-element -- 썸네일 그림(서버 렌더)
        <img src={svgUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="84" height="84">${svg}</svg>`)} width={84} height={84} alt="" />
      ) : (
        <div style={{ display: "flex", fontSize: text === "NEWS" ? 30 : 52, fontWeight: 800, color: mood === "down" ? C.ruby : mood === "up" ? C.green : C.primary, letterSpacing: -1 }}>
          {text}
        </div>
      )}
    </Abs>
  );
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
/* 금콩 브리핑 — 시사 만화 한 칸                                          */
/* ------------------------------------------------------------------ */

/** 만화에 들어갈 값 (운영자가 고친 값 > 자동) — 관리자 화면에서 '자동이면 무엇인지' 보여 줄 때도 씀 */
export function comicPlan(issue: Pick<BriefingIssue, "title">, thumb: IssueThumb, headline = "") {
  const [main, sub] = splitTitle(issue.title);
  const auto = { costume: autoCostume([main, sub, headline]), mood: autoMood(main), bubble: main, caption: sub };
  return { costume: thumb.costume || auto.costume, mood: thumb.mood || auto.mood, bubble: thumb.bubble || main, caption: thumb.caption || sub, auto };
}

function MorningComic({ issue, plan }: { issue: BriefingIssue; plan: ReturnType<typeof comicPlan> }) {
  const { costume, mood, bubble, caption } = plan;
  const look: OgKong = { ...COSTUME_LOOK[costume], wide: true, worried: mood === "down" };
  // 신나는 날엔 빈손이면 손을 흔들어요
  if (mood === "up" && !look.hold) look.wave = true;
  const podium = costume === "president" || costume === "uspresident";
  const sticker = COSTUME_STICKER[costume];
  const burst = mood === "down" ? "#ffb3c1" : mood === "up" ? "#ffe066" : "#d9d1ff";
  const head = bubbleFit(bubble);
  const cap = caption ? captionFit(caption) : null;

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: C.cream, fontFamily: "Pretendard" }}>
      <Abs style={{ left: 28, top: 28, width: 1144, height: 574, borderRadius: 20, border: `6px solid ${C.ink}`, background: C.white, overflow: "hidden" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={DOTS} width={1144} height={574} alt="" style={{ position: "absolute", left: 0, top: 0 }} />
      </Abs>

      {/* 콩이 + 터짐 효과 (+ 연단) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={svgUri(burstSvg(burst))} width={470} height={470} alt="" style={{ position: "absolute", left: 694, top: 102 }} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={svgUri(kongSvg(look))} width={420} height={420} alt="" style={{ position: "absolute", left: 714, top: podium ? 88 : 118 }} />
      {podium && (
        // 연단은 넥타이가 보이게 조금 아래로
        // eslint-disable-next-line @next/next/no-img-element
        <img src={PODIUM} width={330} height={200} alt="" style={{ position: "absolute", left: 776, top: 424 }} />
      )}
      {sticker && <Sticker topic={sticker} mood={mood} />}

      {/* 칸 이름 (노란 상자) */}
      <Abs
        style={{
          left: 60,
          top: 56,
          padding: "8px 18px",
          background: C.yellow,
          border: `4px solid ${C.ink}`,
          fontSize: 28,
          fontWeight: 800,
          color: C.ink,
          transform: "rotate(-2deg)",
          letterSpacing: -0.5,
        }}
      >
        {`금콩 브리핑 · ${formatDayHeading(issue.date)} 아침판`}
      </Abs>

      {/* 말풍선 */}
      <Abs
        style={{
          left: 64,
          top: 132,
          width: 640,
          minHeight: 250,
          padding: "30px 40px",
          background: C.white,
          border: `6px solid ${C.ink}`,
          borderRadius: 40,
          alignItems: "center",
        }}
      >
        <Lines lines={head.lines} style={{ fontSize: head.size, fontWeight: 800, color: C.ink, lineHeight: 1.22, letterSpacing: -1.5 }} />
      </Abs>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={TAIL} width={96} height={80} alt="" style={{ position: "absolute", left: 694, top: 280 }} />

      {/* 아래 띠: 무슨 일인지 사실 한 줄 */}
      {cap && (
        <Abs style={{ left: 64, top: cap.lines.length > 1 ? 418 : 436, maxWidth: 648, padding: "12px 22px", background: C.ink, borderRadius: 12 }}>
          <Lines lines={cap.lines} style={{ fontSize: cap.size, fontWeight: 700, color: C.white, letterSpacing: -0.5, lineHeight: 1.3 }} />
        </Abs>
      )}

      <Abs style={{ left: 64, top: 540, fontSize: 22, fontWeight: 700, color: C.inkSoft, alignItems: "center" }}>출근길 3분 금융 뉴스 · 금콩</Abs>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 금콩 스터디 — 공책 템플릿 + 오늘의 논술 주제                             */
/* ------------------------------------------------------------------ */

const PAPER = svgUri(
  `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">` +
    `<rect width="1200" height="630" fill="#fffdf6"/>` +
    Array.from({ length: 12 }, (_, i) => `<path d="M0 ${118 + i * 46}h1200" stroke="#dfe8f7" stroke-width="2"/>`).join("") +
    `<path d="M140 0v630" stroke="#f4a6b4" stroke-width="3"/>` +
    Array.from({ length: 9 }, (_, i) => `<circle cx="66" cy="${52 + i * 66}" r="13" fill="#e9e3d3"/><path d="M40 ${52 + i * 66}h40" stroke="#8d8fb8" stroke-width="6" stroke-linecap="round"/>`).join("") +
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
      <img src={PAPER} width={1200} height={630} alt="" style={{ position: "absolute", left: 0, top: 0 }} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={DOODLES} width={300} height={420} alt="" style={{ position: "absolute", left: 880, top: 96 }} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={svgUri(kongSvg({ hold: "pencil", glasses: true }))} width={330} height={330} alt="" style={{ position: "absolute", left: 846, top: 196 }} />

      {/* 마스킹 테이프 이름표 */}
      <Abs
        style={{
          left: 168,
          top: 34,
          padding: "10px 22px",
          background: "rgba(255, 216, 77, 0.85)",
          fontSize: 27,
          fontWeight: 800,
          color: C.ink,
          transform: "rotate(-1.5deg)",
          letterSpacing: -0.5,
        }}
      >
        {`금콩 스터디 · ${formatDayHeading(issue.date)} 점심판`}
      </Abs>

      <Abs style={{ left: 172, top: 120, alignItems: "center", padding: "8px 20px 8px 14px", borderRadius: 999, background: C.primary, color: C.white, fontSize: 26, fontWeight: 800 }}>
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

/**
 * 한 호의 공유 썸네일 — thumb 를 주면 저장된 값 대신 그걸로 (관리자 미리보기).
 * admin 이면 초안 기사까지 읽어요.
 */
export async function briefingOgImage(issue: BriefingIssue, { thumb = issue.thumb, admin = false, headers }: { thumb?: IssueThumb; admin?: boolean; headers?: HeadersInit } = {}) {
  const fonts = await ogFonts();
  const items = await issueItems(issue.date, issue.edition, { admin }).catch(() => []);
  if (issue.edition === "noon") {
    const terms = items.filter((n) => n.section === "term").map((n) => n.title);
    const topic = studyTopic(thumb, issue.extras) || splitTitle(issue.title)[0];
    return new ImageResponse(<NoonStudy issue={issue} topic={topic} terms={terms} />, { ...OG_SIZE, fonts, headers });
  }
  const headline = arrangeLetter(items).headline?.title ?? "";
  return new ImageResponse(<MorningComic issue={issue} plan={comicPlan(issue, thumb, headline)} />, { ...OG_SIZE, fonts, headers });
}

export async function fallbackOgImage(headers?: HeadersInit) {
  return new ImageResponse(<FallbackImage />, { ...OG_SIZE, fonts: await ogFonts(), headers });
}

