import { ImageResponse } from "next/og";
import { connection } from "next/server";
import type { CSSProperties, ReactNode } from "react";
import { formatDayHeading } from "@/lib/date";
import { isDateKey, isIssueEdition } from "@/lib/news-meta";
import { getIssue, issueItems } from "@/lib/server/briefing";
import { dbConfigured } from "@/lib/server/db";
import { C, OG_SIZE, clip, kongSvg, ogFonts, svgUri, type OgKong } from "@/lib/server/og";

/**
 * 데일리 브리핑 공유 썸네일 — 그날 제목으로 그리는 한 칸 시사 만화
 * 아침판: 콩이가 신문을 들고 제목 분위기(급락·반등…)에 반응, 주제 스티커(증시·금리·환율…)
 * 점심판(금콩 스터디): 안경 쓴 콩이 + 칠판에 오늘의 용어
 * 카톡·SNS 미리보기(og:image)에만 쓰고, 사이트 화면에는 넣지 않아요.
 */

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "금콩 데일리 브리핑";

type Mood = "up" | "down" | "neutral";
type Topic = "chart" | "percent" | "fx" | "house" | "cart" | "shield" | "bank" | "news";

const DOWN = /급락|하락|폭락|최저|적자|위기|쇼크|우려|침해|유출|해킹|둔화|감소|하향|경고|불안|사이드카|서킷브레이커|패닉/;
const UP = /반등|상승|급등|최고|회복|흑자|돌파|호조|증가|상향|개선|훈풍|귀환/;
const TOPICS: [RegExp, Topic][] = [
  [/코스피|코스닥|증시|주가|주식|사이드카|서킷브레이커|외국인 매/, "chart"],
  [/금리|연준|FOMC|국채|채권/, "percent"],
  [/환율|달러|원화|엔화|외환/, "fx"],
  [/집값|부동산|아파트|주택|전세/, "house"],
  [/물가|CPI|인플레/, "cart"],
  [/해킹|보안|유출|사이버|망분리/, "shield"],
  [/은행|대출|예금|가계부채|통화|M2/, "bank"],
];

const moodOf = (s: string): Mood => (DOWN.test(s) ? "down" : UP.test(s) ? "up" : "neutral");
const topicOf = (s: string): Topic => TOPICS.find(([re]) => re.test(s))?.[1] ?? "news";

/** "메인 — 부제" 로 된 제목 나누기 */
function splitTitle(title: string): [string, string] {
  const i = title.indexOf(" — ");
  return i < 0 ? [title, ""] : [title.slice(0, i).trim(), title.slice(i + 3).trim()];
}

const STROKE = `stroke="${C.ink}" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"`;

/** 주제 스티커 속 그림 (64×64) */
function topicSvg(topic: Topic, mood: Mood): string | null {
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

function Abs({ style, children }: { style: CSSProperties; children?: ReactNode }) {
  return <div style={{ position: "absolute", display: "flex", ...style }}>{children}</div>;
}

function Sticker({ topic, mood }: { topic: Topic; mood: Mood }) {
  const svg = topicSvg(topic, mood);
  const text = topic === "percent" ? "%" : topic === "fx" ? "₩$" : topic === "news" ? "NEWS" : null;
  return (
    <Abs
      style={{
        left: 1000,
        top: 84,
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

function Fallback() {
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: C.cream, fontSize: 64, fontWeight: 800, color: C.ink }}>
      금콩 데일리 브리핑
    </div>
  );
}

export default async function Image({ params }: { params: Promise<{ date: string; edition: string }> }) {
  const { date, edition } = await params;
  await connection(); // 발행 여부·제목이 바뀌면 바로 반영 (요청 때 그림)
  const fonts = await ogFonts();
  const issue = isDateKey(date) && isIssueEdition(edition) && dbConfigured() ? await getIssue(date, edition).catch(() => null) : null;
  if (!issue) return new ImageResponse(<Fallback />, { ...size, fonts });

  const noon = issue.edition === "noon";
  const [main, sub] = splitTitle(issue.title);
  const mood = noon ? "neutral" : moodOf(main);
  const topic = topicOf(main);
  const items = noon ? await issueItems(issue.date, "noon").catch(() => []) : [];
  const terms = items.filter((n) => n.section === "term").map((n) => n.title);
  const question = items.find((n) => n.section === "question")?.title;

  const kong: OgKong = noon
    ? { hold: "book", glasses: true }
    : { hold: mood === "up" ? undefined : "news", worried: mood === "down", wave: mood === "up" };
  const burst = noon ? "#d9d1ff" : mood === "down" ? "#ffb3c1" : mood === "up" ? "#ffe066" : "#d9d1ff";
  const headline = clip(main, 40);
  const fontSize = headline.length <= 14 ? 66 : headline.length <= 22 ? 58 : headline.length <= 30 ? 50 : 44;

  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: C.cream, fontFamily: "Pretendard" }}>
      {/* 만화 칸 */}
      <Abs style={{ left: 28, top: 28, width: 1144, height: 574, borderRadius: 20, border: `6px solid ${C.ink}`, background: C.white, overflow: "hidden" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={DOTS} width={1144} height={574} alt="" style={{ position: "absolute", left: 0, top: 0 }} />
      </Abs>

      {/* 콩이 + 터짐 효과 */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={svgUri(burstSvg(burst))} width={470} height={470} alt="" style={{ position: "absolute", left: 692, top: 108 }} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={svgUri(kongSvg(kong))} width={380} height={380} alt="" style={{ position: "absolute", left: 742, top: 150 }} />
      {noon ? (
        <>
          <Abs style={{ left: 1040, top: 92, fontSize: 96, fontWeight: 800, color: C.primary, transform: "rotate(12deg)" }}>?</Abs>
          <Abs style={{ left: 990, top: 64, fontSize: 56, fontWeight: 800, color: C.primary, transform: "rotate(-10deg)" }}>?</Abs>
        </>
      ) : (
        <Sticker topic={topic} mood={mood} />
      )}

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
        {`${noon ? "금콩 스터디" : "금콩 브리핑"} · ${formatDayHeading(issue.date)} ${noon ? "점심판" : "아침판"}`}
      </Abs>

      {/* 말풍선 */}
      <Abs
        style={{
          left: 64,
          top: 132,
          width: 640,
          minHeight: noon ? 220 : 250,
          padding: "30px 40px",
          background: C.white,
          border: `6px solid ${C.ink}`,
          borderRadius: 40,
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", fontSize, fontWeight: 800, color: C.ink, lineHeight: 1.22, letterSpacing: -1.5, wordBreak: "keep-all" }}>{headline}</div>
      </Abs>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={TAIL} width={96} height={80} alt="" style={{ position: "absolute", left: 694, top: noon ? 250 : 280 }} />

      {/* 아래: 아침판은 부제, 점심판은 칠판(오늘의 용어) */}
      {noon ? (
        <Abs
          style={{
            left: 64,
            top: 384,
            width: 640,
            height: 156,
            padding: "18px 28px",
            flexDirection: "column",
            justifyContent: "center",
            background: "#2d4b3f",
            border: "8px solid #a8743f",
            borderRadius: 10,
          }}
        >
          <div style={{ display: "flex", fontSize: 24, fontWeight: 700, color: "#ffe9a8" }}>{terms.length ? "오늘의 용어" : "오늘의 면접 질문"}</div>
          <div style={{ display: "flex", marginTop: 8, fontSize: terms.length ? 40 : 30, fontWeight: 800, color: "#f6f4ec", letterSpacing: -1, lineHeight: 1.25 }}>
            {terms.length ? clip(terms.slice(0, 2).join(" · "), 26) : clip(question ?? sub ?? "", 44)}
          </div>
        </Abs>
      ) : (
        sub && (
          <Abs
            style={{
              left: 64,
              top: 436,
              maxWidth: 640,
              padding: "12px 22px",
              background: C.ink,
              borderRadius: 12,
              fontSize: 30,
              fontWeight: 700,
              color: C.white,
              letterSpacing: -0.5,
            }}
          >
            {clip(sub, 30)}
          </Abs>
        )
      )}

      {/* 금콩 표시 */}
      <Abs style={{ left: 64, top: noon ? 556 : 528, fontSize: 22, fontWeight: 700, color: C.inkSoft, alignItems: "center" }}>
        {noon ? "점심에 보는 금융 공부 · 금콩" : "출근길 3분 금융 뉴스 · 금콩"}
      </Abs>
    </div>,
    { ...size, fonts },
  );
}
