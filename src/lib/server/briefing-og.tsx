import "server-only";
import { ImageResponse } from "next/og";
import type { CSSProperties, ReactNode } from "react";
import { formatDayHeading } from "@/lib/date";
import { autoCostume, autoMood, autoScene, studyTopic, type BriefingIssue, type CostumeKey, type IssueThumb, type SceneKey } from "@/lib/news-meta";
import { arrangeLetter, issueItems } from "./briefing";
import { TOPIC_W, captionFit, headlineFit, speechFit, topicFit } from "../og-text";
import { C, COSTUME_LOOK, OG_SIZE, kongSvg, ogFonts, svgUri, type OgKong } from "./og";
import { sceneSvg } from "./og-scenes";

/**
 * 데일리 브리핑 공유 썸네일(og:image) 그리기 — 공유 미리보기 경로와 관리자 미리보기가 같이 써요.
 * - 금콩 브리핑(아침판): 그날 뉴스 주제 그림이 칸 대부분을 채우고, 제목은 왼쪽 아래 상자에.
 *   인물 발언 뉴스만 콩이가 그 인물로 변장해 연단에서 말풍선으로 (발언은 기사에 실린 말 그대로)
 * - 금콩 스터디(점심판): 공책 템플릿은 그대로, 오늘의 논술 주제 글자만 바뀜
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

/** 이름표 속 작은 금콩 로고 (사이트 왼쪽 위 로고와 같은 얼굴) */
const LOGO = svgUri(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="34" height="34"><defs><linearGradient id="b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f5e9d4"/><stop offset="1" stop-color="#ffa26b"/></linearGradient></defs><rect width="32" height="32" rx="9" fill="#1c1e54"/><path d="M20.6 7.4c3.7 1.6 5 6.5 3 10.9-1.4 3.1-4.7 4.7-6.5 6.4-1.7 1.6-4.5 1.9-6.5.2-2.4-2-2.3-5.2-.6-7.3 1.3-1.6 3.3-2 4.1-3.9.9-2 .9-4.7 2.9-6 1-.7 2.3-.8 3.6-.3z" fill="url(#b)"/><circle cx="13.7" cy="18.9" r="1.15" fill="#1c1e54"/><circle cx="18.5" cy="16.9" r="1.15" fill="#1c1e54"/><path d="M15.3 21.1c.9.8 2.2.6 2.9-.3" stroke="#1c1e54" stroke-width=".9" stroke-linecap="round" fill="none"/></svg>`,
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

/** 썸네일에 들어갈 값 (운영자가 고친 값 > 자동) — 관리자 화면에서 '자동이면 무엇인지' 보여 줄 때도 씀 */
export function comicPlan(issue: Pick<BriefingIssue, "title">, thumb: IssueThumb, headline = "") {
  const [main, sub] = splitTitle(issue.title);
  const texts = [main, sub, headline];
  const autoSceneKey = autoScene(texts);
  const scene = thumb.scene || autoSceneKey;
  // 변장 자동: 인물 발언이면 제목 속 인물로, 아니면 그림 주제에 맞는 옷 (유가면 안전모, 금리면 총재…)
  const auto = { scene: autoSceneKey, costume: scene === "speech" ? autoCostume(texts) : SCENE_COSTUME[scene], mood: autoMood(main), bubble: main, caption: sub };
  const mood = thumb.mood || auto.mood;
  // 콩이: 정해진 규칙이 아니라 그때그때 — 자동이면 인물 발언이거나 분위기가 뚜렷한 날(오름·내림)에 반응하며 등장
  const kong = thumb.kong === "on" ? true : thumb.kong === "off" ? false : scene === "speech" || mood !== "neutral";
  return { scene, costume: thumb.costume || auto.costume, kong, mood, bubble: thumb.bubble || main, caption: thumb.caption || sub, auto };
}

const ACCENT = { up: "#12b981", down: "#ff3d68", neutral: "#533afd" } as const;

/** 그림 주제별 콩이 옷 (변장을 고르지 않았을 때) */
const SCENE_COSTUME: Record<SceneKey, CostumeKey> = {
  speech: "president",
  market: "trader",
  rate: "banker",
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

function MorningThumb({ issue, plan }: { issue: BriefingIssue; plan: ReturnType<typeof comicPlan> }) {
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
      {/* eslint-disable-next-line @next/next/no-img-element -- 썸네일 그림(서버 렌더) */}
      <img src={svgUri(sceneSvg(scene, mood))} width={1200} height={630} alt="" style={{ position: "absolute", left: 0, top: 0 }} />

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
  return new ImageResponse(<MorningThumb issue={issue} plan={comicPlan(issue, thumb, headline)} />, { ...OG_SIZE, fonts, headers });
}

export async function fallbackOgImage(headers?: HeadersInit) {
  return new ImageResponse(<FallbackImage />, { ...OG_SIZE, fonts: await ogFonts(), headers });
}

