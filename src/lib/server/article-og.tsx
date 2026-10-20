import "server-only";
import { ImageResponse } from "next/og";
import type { CSSProperties, ReactNode } from "react";
import type { ArticleSummary, ArticleThumb, ThumbScale } from "@/lib/magazine-meta";
import { captionFit, fitText, headlineFit } from "../og-text";
import { FUND_BADGE, SIGN, articleSceneSvg } from "./article-scenes";
import { articleThumbPlan, type ArticleThumbPlan } from "./article-thumb";
import { C, OG_SIZE, companyLogo, ogFonts, svgUri } from "./og";

/**
 * 금융 블로그 글 썸네일 — 표지를 올리지 않은 글의 목록 카드·공유 미리보기(og:image)
 * 주제 그림이 칸을 채우고, 왼쪽 위 금콩 이름표 · 왼쪽 아래 제목 카드. 기관 글이면 본사 건물 간판에 그 기관 로고.
 */

/** 이름표 속 작은 금콩 로고 (사이트 왼쪽 위 로고와 같은 얼굴) */
const LOGO = svgUri(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="34" height="34"><defs><linearGradient id="b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f5e9d4"/><stop offset="1" stop-color="#ffa26b"/></linearGradient></defs><rect width="32" height="32" rx="9" fill="#1c1e54"/><path d="M20.6 7.4c3.7 1.6 5 6.5 3 10.9-1.4 3.1-4.7 4.7-6.5 6.4-1.7 1.6-4.5 1.9-6.5.2-2.4-2-2.3-5.2-.6-7.3 1.3-1.6 3.3-2 4.1-3.9.9-2 .9-4.7 2.9-6 1-.7 2.3-.8 3.6-.3z" fill="url(#b)"/><circle cx="13.7" cy="18.9" r="1.15" fill="#1c1e54"/><circle cx="18.5" cy="16.9" r="1.15" fill="#1c1e54"/><path d="M15.3 21.1c.9.8 2.2.6 2.9-.3" stroke="#1c1e54" stroke-width=".9" stroke-linecap="round" fill="none"/></svg>`,
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

type Logo = Awaited<ReturnType<typeof companyLogo>>;

type Box = { x: number; y: number; w: number; h: number };

const signBox = (b: Box): CSSProperties => ({
  left: b.x,
  top: b.y,
  width: b.w,
  height: b.h,
  alignItems: "center",
  justifyContent: "center",
  background: C.white,
  borderRadius: 16,
  border: "1.5px solid rgba(255,255,255,0.9)",
  boxShadow: "0 6px 14px rgba(10,16,60,0.32)",
});

/** 본사 건물 간판·통 이름표 — 로고 + 기관 이름 (글자형 로고면 로고만) */
function CompanySign({ name, logo, box = SIGN }: { name: string; logo: Logo; box?: Box }) {
  const inner = box.w - 28;
  if (logo?.wide) {
    const h = Math.min(40, (inner * logo.height) / logo.width);
    const w = (h * logo.width) / logo.height;
    return (
      <Abs style={signBox(box)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logo.src} width={w} height={h} alt="" />
      </Abs>
    );
  }
  const icon = logo ? 40 : 0;
  const room = inner - (icon ? icon + 10 : 0);
  const size = Math.max(14, Math.min(23, Math.floor(room / ([...name].length * 0.97))));
  return (
    <Abs style={signBox(box)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {logo && <img src={logo.src} width={icon} height={icon} alt="" style={{ marginRight: 10 }} />}
      <div style={{ display: "flex", fontSize: size, fontWeight: 800, color: C.ink, letterSpacing: -0.6, whiteSpace: "nowrap" }}>{name}</div>
    </Abs>
  );
}

/** 강조할 말 — *별표*로 감싼 말, 없으면 제목 속 첫 숫자(200조·86.6% 등) */
const NUM = /\d[\d,.]*\s?(?:조원|조|억원|억|만원|만|천|%|배|개|명|년|위|건)?/;

function splitEmphasis(text: string): { pre: string; big: string; post: string } | null {
  const star = text.match(/^([^*]*)\*([^*]+)\*(.*)$/);
  if (star) return { pre: star[1].trim(), big: star[2].trim(), post: star[3].trim() };
  const m = text.match(NUM);
  if (!m || m.index == null) return null;
  return { pre: text.slice(0, m.index).trim(), big: m[0].trim(), post: text.slice(m.index + m[0].length).trim() };
}

const plain = (t: string) => t.replace(/\*/g, "");

/** 한 줄 안에서 강조할 말만 색을 바꿔요 */
function EmLines({ lines, em, color, style }: { lines: string[]; em: string | null; color: string; style: CSSProperties }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", ...style }}>
      {lines.map((line, i) => {
        const at = em ? line.indexOf(em) : -1;
        return (
          <div key={`${i}-${line}`} style={{ display: "flex", whiteSpace: "pre" }}>
            {at < 0 || !em ? (
              line
            ) : (
              <>
                {at > 0 && <span style={{ whiteSpace: "pre" }}>{line.slice(0, at)}</span>}
                <span style={{ whiteSpace: "pre", color }}>{em}</span>
                {at + em.length < line.length && <span style={{ whiteSpace: "pre" }}>{line.slice(at + em.length)}</span>}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** 왼쪽 위 이름표 — 금콩 블로그 · 주제 */
function BrandPill({ kicker }: { kicker: string }) {
  return (
    <Abs style={{ left: 52, top: 48, alignItems: "center", padding: "8px 20px 8px 10px", borderRadius: 999, background: C.white, border: "1.5px solid rgba(28,30,84,0.08)", boxShadow: "0 4px 12px rgba(12,16,48,0.14)" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={LOGO} width={34} height={34} alt="" style={{ marginRight: 10 }} />
      <div style={{ display: "flex", fontSize: 24, fontWeight: 800, color: C.ink, letterSpacing: -0.5 }}>금콩 블로그</div>
      {kicker && <div style={{ display: "flex", width: 2, height: 20, margin: "0 12px", background: C.line }} />}
      {kicker && <div style={{ display: "flex", fontSize: 22, fontWeight: 700, color: C.primary, letterSpacing: -0.4 }}>{kicker}</div>}
    </Abs>
  );
}

/** 그림 + 간판·통 이름표 */
function SceneLayer({ plan, logo }: { plan: ArticleThumbPlan; logo: Logo }) {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element -- 썸네일 그림(서버 렌더) */}
      <img src={svgUri(articleSceneSvg(plan.scene, plan.prop, plan.tone))} width={1200} height={630} alt="" style={{ position: "absolute", left: 0, top: 0 }} />
      {plan.scene === "company" && plan.company && <CompanySign name={plan.company.name} logo={logo} />}
      {plan.scene === "fund" && plan.company && <CompanySign name={plan.company.name} logo={logo} box={FUND_BADGE} />}
    </>
  );
}

/** 카드형 — 그림이 칸을 채우고 왼쪽 아래 흰 제목 카드 */
function CardView({ plan, logo }: { plan: ArticleThumbPlan; logo: Logo }) {
  const head = headlineFit(plain(plan.headline));
  const cap = plan.sub ? captionFit(plan.sub) : null;
  const em = splitEmphasis(plan.headline)?.big ?? null;
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", fontFamily: "Pretendard" }}>
      <SceneLayer plan={plan} logo={logo} />
      <BrandPill kicker={plan.kicker} />
      <Abs style={{ left: 52, bottom: 52, width: 640, background: C.white, borderRadius: 28, overflow: "hidden", border: "1.5px solid rgba(28,30,84,0.08)", boxShadow: "0 12px 28px rgba(12,16,48,0.2)" }}>
        <div style={{ display: "flex", width: 10, background: C.primary }} />
        <div style={{ display: "flex", flexDirection: "column", padding: "22px 30px 24px 26px" }}>
          <EmLines lines={head.lines} em={em} color={C.primary} style={{ fontSize: head.size, fontWeight: 800, color: "#13163f", lineHeight: 1.18, letterSpacing: -1.6 }} />
          {cap && <Lines lines={cap.lines} style={{ marginTop: 10, fontSize: cap.size, fontWeight: 600, color: "#5b6080", letterSpacing: -0.4, lineHeight: 1.3 }} />}
        </div>
      </Abs>
    </div>
  );
}

/** 쉼표가 있으면 쉼표에서 두 줄로 (‘국민성장펀드,’ / ‘산은은 뭘 하나?’) — 안 들어가면 보통 줄바꿈 */
function fitByComma(text: string, sizes: number[], width: number, maxLines: number): { size: number; lines: string[] } {
  const parts = text.split(/(?<=,)\s+/);
  if (parts.length === 2)
    for (const size of sizes) {
      const a = fitText(parts[0], [size], width, 1);
      const b = fitText(parts[1], [size], width, 1);
      if (!a.lines[0].endsWith("…") && !b.lines[0].endsWith("…") && a.lines.length === 1 && b.lines.length === 1) return { size, lines: parts };
    }
  return fitText(text, sizes, width, maxLines);
}

const GOLD = "#ffd84d";
const TEXT_W = 590;
/** 큰 글씨 칸: 이름표 아래부터 아래 한 줄 위까지 */
const BOLD_TOP = 118;
const BOLD_H = 384;

/** 큰 글씨형 — 유튜브 썸네일처럼 왼쪽에 큰 글씨, 숫자·강조 말은 노랗게 크게 */
function BoldView({ plan, logo }: { plan: ArticleThumbPlan; logo: Logo }) {
  const em = splitEmphasis(plan.headline);
  const giant = em && [...em.big].length <= 7 ? em : null;
  const cap = plan.sub ? fitText(plan.sub, [28, 26, 24, 22], 600, 1) : null;
  const dark = plan.scene === "fund";
  const shadow = "0 4px 18px rgba(0,0,0,0.35)";

  let block: ReactNode;
  if (giant) {
    const pre = giant.pre ? fitByComma(giant.pre, [54, 48, 44], TEXT_W, 2) : null;
    const post = giant.post ? fitByComma(giant.post, [60, 54, 48, 44], TEXT_W, 2) : null;
    const rest = (pre ? pre.lines.length * pre.size * 1.14 + 8 : 0) + (post ? post.lines.length * post.size * 1.14 + 10 : 0);
    const big = [184, 164, 146, 128, 112, 100].find((sz) => fitText(giant.big, [sz], TEXT_W, 1).size === sz && !fitText(giant.big, [sz], TEXT_W, 1).lines[0].endsWith("…") && sz + rest <= BOLD_H) ?? 100;
    const total = big + rest;
    block = (
      <Abs style={{ left: 56, top: BOLD_TOP + Math.max(0, (BOLD_H - total) / 2), width: 640, flexDirection: "column" }}>
        {pre && <Lines lines={pre.lines} style={{ fontSize: pre.size, fontWeight: 800, color: C.white, lineHeight: 1.14, letterSpacing: -1.5, textShadow: shadow, marginBottom: 8 }} />}
        <div style={{ display: "flex", fontSize: big, fontWeight: 800, color: GOLD, lineHeight: 1, letterSpacing: -big * 0.035, textShadow: "0 8px 0 rgba(0,0,0,0.35)" }}>{giant.big}</div>
        {post && <Lines lines={post.lines} style={{ marginTop: 10, fontSize: post.size, fontWeight: 800, color: C.white, lineHeight: 1.14, letterSpacing: -1.6, textShadow: shadow }} />}
      </Abs>
    );
  } else {
    const head = fitText(plain(plan.headline), [80, 72, 64, 58, 52], TEXT_W, 3);
    const total = head.lines.length * head.size * 1.14;
    block = (
      <Abs style={{ left: 56, top: BOLD_TOP + Math.max(0, (BOLD_H - total) / 2), width: 640 }}>
        <EmLines lines={head.lines} em={em?.big ?? null} color={GOLD} style={{ fontSize: head.size, fontWeight: 800, color: C.white, lineHeight: 1.14, letterSpacing: -2, textShadow: shadow }} />
      </Abs>
    );
  }

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", fontFamily: "Pretendard" }}>
      <SceneLayer plan={plan} logo={logo} />
      {/* 왼쪽을 어둡게 — 그림 위에서도 글씨가 또렷하게 */}
      <Abs
        style={{
          left: 0,
          top: 0,
          width: 900,
          height: 630,
          backgroundImage: dark
            ? "linear-gradient(90deg, rgba(8,11,42,0.8) 0%, rgba(8,11,42,0.55) 55%, rgba(8,11,42,0) 100%)"
            : "linear-gradient(90deg, rgba(10,14,48,0.95) 0%, rgba(10,14,48,0.86) 48%, rgba(10,14,48,0) 100%)",
        }}
      />
      <BrandPill kicker={plan.kicker} />
      {block}
      {cap && (
        <Abs style={{ left: 56, bottom: 52, alignItems: "center", padding: "10px 18px", borderRadius: 14, background: "rgba(255,255,255,0.13)", border: "1.5px solid rgba(255,255,255,0.3)" }}>
          <div style={{ display: "flex", width: 8, height: 8, borderRadius: 99, background: GOLD, marginRight: 12 }} />
          <div style={{ display: "flex", fontSize: cap.size, fontWeight: 700, color: C.white, letterSpacing: -0.4, whiteSpace: "nowrap" }}>{cap.lines[0]}</div>
        </Abs>
      )}
    </div>
  );
}

/**
 * 글 한 편의 썸네일 — thumb 를 주면 저장된 값 대신 그걸로 (관리자 미리보기).
 * scale 은 같은 그림을 그 배율 크기로 그려요 (모두 도형·글자라 크기를 바꿔도 깨지지 않고, 그 크기에서 바로 그려 또렷해요).
 */
export async function articleOgImage(a: ArticleSummary, { thumb = a.thumb, headers, scale = 1 }: { thumb?: ArticleThumb; headers?: HeadersInit; scale?: ThumbScale } = {}) {
  const plan = articleThumbPlan(a, thumb);
  const needsLogo = (plan.scene === "company" || plan.scene === "fund") && plan.company;
  const [fonts, logo] = await Promise.all([ogFonts(), needsLogo && plan.company ? companyLogo(plan.company.id) : Promise.resolve(null)]);
  const view = plan.layout === "bold" ? <BoldView plan={plan} logo={logo} /> : <CardView plan={plan} logo={logo} />;
  if (scale === 1) return new ImageResponse(view, { ...OG_SIZE, fonts, headers });
  return new ImageResponse(
    <div style={{ display: "flex", width: OG_SIZE.width * scale, height: OG_SIZE.height * scale }}>
      <div style={{ display: "flex", width: OG_SIZE.width, height: OG_SIZE.height, flexShrink: 0, transform: `scale(${scale})`, transformOrigin: "top left" }}>{view}</div>
    </div>,
    { width: Math.round(OG_SIZE.width * scale), height: Math.round(OG_SIZE.height * scale), fonts, headers },
  );
}

export async function fallbackArticleImage(headers?: HeadersInit) {
  const fonts = await ogFonts();
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: C.cream, fontSize: 64, fontWeight: 800, color: C.ink, fontFamily: "Pretendard" }}>
      금콩 블로그
    </div>,
    { ...OG_SIZE, fonts, headers },
  );
}
