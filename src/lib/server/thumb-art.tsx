import "server-only";
import type { CSSProperties } from "react";
import { formatDayHeading } from "@/lib/date";
import { EDITION_LABEL, EDITION_SLOT, type BriefingIssue } from "@/lib/news-meta";
import { ART_H, ART_W, layoutArtText, type ArtBrand, type ArtText, type ThumbArt } from "@/lib/thumb-art";
import { BRAND_LOGO, C, svgUri } from "./og";
import { expandKit, kitCredits } from "./thumb-kit";

/**
 * 브리핑 썸네일 '직접 그린 그림' 그리기 — 그림(svg + 금콩 부품)을 바탕에 깔고, 글자 상자들을 그 위에 놓아요.
 * 정해진 틀이 없어서 호마다 구도·글자 배치·색이 완전히 달라질 수 있어요.
 */

/** 그림 한 장 (1200×630 SVG) */
export function artSvgDoc(art: ThumbArt): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${ART_W}" height="${ART_H}" viewBox="0 0 ${ART_W} ${ART_H}">${expandKit(art.svg)}</svg>`;
}

const SHADOWS = {
  soft: "0 6px 22px rgba(0,0,0,0.38)",
  hard: "0 7px 0 rgba(0,0,0,0.32)",
} as const;

/** *강조* 를 나눈 조각들 — 줄을 넘어가도 이어져요 */
function segments(lines: string[]): { text: string; em: boolean }[][] {
  let em = false;
  return lines.map((line) => {
    const out: { text: string; em: boolean }[] = [];
    for (const [i, part] of line.split("*").entries()) {
      if (i > 0) em = !em;
      if (part) out.push({ text: part, em });
    }
    return out;
  });
}

function TextBox({ t }: { t: ArtText }) {
  const fit = layoutArtText(t);
  const segs = segments(fit.lines);
  const lh = Math.round(fit.size * t.lh);
  const shadow = t.shadow === "glow" ? `0 0 ${Math.round(fit.size * 0.35)}px ${t.em}` : t.shadow ? SHADOWS[t.shadow] : undefined;
  const stroke: CSSProperties = t.stroke && t.strokeW ? { WebkitTextStrokeWidth: t.strokeW, WebkitTextStrokeColor: t.stroke } : {};
  const justify = t.align === "center" ? "center" : t.align === "right" ? "flex-end" : "flex-start";
  // 바깥 칸(폭 w)에서 정렬하고, 바탕색 상자는 글자 길이에 딱 맞게
  const outer: CSSProperties = {
    position: "absolute",
    display: "flex",
    justifyContent: justify,
    alignItems: t.anchor === "bottom" ? "flex-end" : "flex-start",
    left: t.x,
    width: t.w + t.pad * 2,
    ...(t.anchor === "bottom" ? { bottom: ART_H - t.y } : { top: t.y }),
    ...(t.rotate ? { transform: `rotate(${t.rotate}deg)` } : {}),
  };
  const inner: CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: justify,
    ...(t.bg ? { background: t.bg, padding: t.pad, borderRadius: t.radius } : {}),
  };
  return (
    <div style={outer}>
      <div style={inner}>
      {segs.map((line, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            justifyContent: justify,
            whiteSpace: "pre",
            height: lh,
            alignItems: "center",
            fontSize: fit.size,
            fontWeight: t.weight,
            letterSpacing: t.ls * fit.size,
            color: t.color,
            // 값이 없는 속성은 아예 빼요 (그리기 도구가 undefined 를 못 읽어요)
            ...(shadow ? { textShadow: shadow } : {}),
            ...stroke,
          }}
        >
          {line.map((s, j) => (
            <span
              key={j}
              style={{
                display: "flex",
                color: s.em ? t.em : t.color,
                ...(s.em && t.hl ? { background: t.hl, padding: `0 ${Math.round(fit.size * 0.12)}px`, borderRadius: Math.round(fit.size * 0.12) } : {}),
              }}
            >
              {s.text}
            </span>
          ))}
        </div>
      ))}
      </div>
    </div>
  );
}

/** 금콩 이름표 — 작은 로고 + 판 이름 + 날짜 (자리·밝기는 그림마다) */
function Brand({ issue, brand }: { issue: Pick<BriefingIssue, "date" | "edition">; brand: ArtBrand }) {
  if (brand.pos === "none") return null;
  const darkTheme = brand.theme === "dark";
  const at: CSSProperties = {
    ...(brand.pos === "tl" || brand.pos === "bl" ? { left: 48 } : { right: 48 }),
    ...(brand.pos === "tl" || brand.pos === "tr" ? { top: 44 } : { bottom: 44 }),
  };
  return (
    <div
      style={{
        position: "absolute",
        display: "flex",
        alignItems: "center",
        padding: "8px 20px 8px 10px",
        borderRadius: 999,
        background: darkTheme ? "rgba(10,12,40,0.62)" : "rgba(255,255,255,0.94)",
        border: darkTheme ? "1.5px solid rgba(255,255,255,0.22)" : "none",
        boxShadow: "0 8px 24px rgba(12,16,48,0.18)",
        ...at,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={BRAND_LOGO} width={34} height={34} alt="" style={{ marginRight: 10 }} />
      <div style={{ display: "flex", fontSize: 24, fontWeight: 800, color: darkTheme ? C.white : C.ink, letterSpacing: -0.5 }}>{EDITION_LABEL[issue.edition]}</div>
      <div style={{ display: "flex", marginLeft: 10, fontSize: 22, fontWeight: 700, color: darkTheme ? "rgba(255,255,255,0.78)" : C.inkSoft, letterSpacing: -0.3 }}>
        {`${formatDayHeading(issue.date)} ${EDITION_SLOT[issue.edition]}`}
      </div>
    </div>
  );
}

/** 원본 사진 출처 (사진 기반 인물 초상을 쓴 그림) — 아래 가장자리에 작게 */
/** "인물 그림 원본 사진: A", "인물 그림 원본 사진: B" → "인물 그림 원본 사진: A / B" (인물이 여럿이어도 짧게) */
function joinCredits(items: string[]): string {
  const head = /^[^:]+: /.exec(items[0])?.[0];
  return head && items.every((s) => s.startsWith(head)) ? head + items.map((s) => s.slice(head.length)).join(" / ") : items.join(" / ");
}

function Credits({ items, left }: { items: string[]; left: boolean }) {
  if (!items.length) return null;
  return (
    <div
      style={{
        position: "absolute",
        display: "flex",
        bottom: 8,
        ...(left ? { left: 10 } : { right: 10 }),
        maxWidth: ART_W - 20,
        padding: "3px 10px",
        borderRadius: 12,
        background: "rgba(12,14,30,0.42)",
        color: "rgba(255,255,255,0.92)",
        fontSize: 14,
        lineHeight: 1.35,
        fontWeight: 700,
        letterSpacing: -0.2,
      }}
    >
      {/* 길면 줄을 바꿔요 (상자도 같이 커지게 글자를 한 번 더 감싸요) */}
      <span style={{ display: "flex", flexWrap: "wrap" }}>{joinCredits(items)}</span>
    </div>
  );
}

export function ArtView({ issue, art }: { issue: Pick<BriefingIssue, "date" | "edition">; art: ThumbArt }) {
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", fontFamily: "Pretendard", background: "#0b1040" }}>
      {/* eslint-disable-next-line @next/next/no-img-element -- 썸네일 그림(서버 렌더) */}
      <img src={svgUri(artSvgDoc(art))} width={ART_W} height={ART_H} alt="" style={{ position: "absolute", left: 0, top: 0 }} />
      {art.texts.map((t, i) => (
        <TextBox key={i} t={t} />
      ))}
      <Brand issue={issue} brand={art.brand} />
      <Credits items={kitCredits(art.svg)} left={art.brand.pos === "br"} />
    </div>
  );
}
