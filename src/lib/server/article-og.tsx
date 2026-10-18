import "server-only";
import { ImageResponse } from "next/og";
import type { CSSProperties, ReactNode } from "react";
import type { ArticleSummary, ArticleThumb } from "@/lib/magazine-meta";
import { captionFit, headlineFit } from "../og-text";
import { SIGN, articleSceneSvg } from "./article-scenes";
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

const SIGN_BOX: CSSProperties = {
  left: SIGN.x,
  top: SIGN.y,
  width: SIGN.w,
  height: SIGN.h,
  alignItems: "center",
  justifyContent: "center",
  background: C.white,
  borderRadius: 16,
  boxShadow: "0 10px 24px rgba(10,16,60,0.35)",
};

/** 본사 건물 간판 — 로고 + 기관 이름 (글자형 로고면 로고만) */
function CompanySign({ name, logo }: { name: string; logo: Logo }) {
  const inner = SIGN.w - 28;
  if (logo?.wide) {
    const h = Math.min(40, (inner * logo.height) / logo.width);
    const w = (h * logo.width) / logo.height;
    return (
      <Abs style={SIGN_BOX}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logo.src} width={w} height={h} alt="" />
      </Abs>
    );
  }
  const icon = logo ? 40 : 0;
  const room = inner - (icon ? icon + 10 : 0);
  const size = Math.max(14, Math.min(23, Math.floor(room / ([...name].length * 0.97))));
  return (
    <Abs style={SIGN_BOX}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {logo && <img src={logo.src} width={icon} height={icon} alt="" style={{ marginRight: 10 }} />}
      <div style={{ display: "flex", fontSize: size, fontWeight: 800, color: C.ink, letterSpacing: -0.6, whiteSpace: "nowrap" }}>{name}</div>
    </Abs>
  );
}

function ArticleThumbView({ plan, logo }: { plan: ArticleThumbPlan; logo: Logo }) {
  const head = headlineFit(plan.headline);
  const cap = plan.sub ? captionFit(plan.sub) : null;
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", fontFamily: "Pretendard" }}>
      {/* eslint-disable-next-line @next/next/no-img-element -- 썸네일 그림(서버 렌더) */}
      <img src={svgUri(articleSceneSvg(plan.scene, plan.prop))} width={1200} height={630} alt="" style={{ position: "absolute", left: 0, top: 0 }} />
      {plan.scene === "company" && plan.company && <CompanySign name={plan.company.name} logo={logo} />}

      {/* 왼쪽 위 이름표 — 금콩 블로그 · 주제 */}
      <Abs style={{ left: 52, top: 48, alignItems: "center", padding: "8px 20px 8px 10px", borderRadius: 999, background: "rgba(255,255,255,0.95)", boxShadow: "0 8px 24px rgba(12,16,48,0.16)" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={LOGO} width={34} height={34} alt="" style={{ marginRight: 10 }} />
        <div style={{ display: "flex", fontSize: 24, fontWeight: 800, color: C.ink, letterSpacing: -0.5 }}>금콩 블로그</div>
        {plan.kicker && <div style={{ display: "flex", width: 2, height: 20, margin: "0 12px", background: C.line }} />}
        {plan.kicker && <div style={{ display: "flex", fontSize: 22, fontWeight: 700, color: C.primary, letterSpacing: -0.4 }}>{plan.kicker}</div>}
      </Abs>

      {/* 제목 카드 — 왼쪽 아래 */}
      <Abs style={{ left: 52, bottom: 52, width: 640, background: C.white, borderRadius: 28, overflow: "hidden", boxShadow: "0 22px 48px rgba(12,16,48,0.26)" }}>
        <div style={{ display: "flex", width: 10, background: C.primary }} />
        <div style={{ display: "flex", flexDirection: "column", padding: "22px 30px 24px 26px" }}>
          <Lines lines={head.lines} style={{ fontSize: head.size, fontWeight: 800, color: "#13163f", lineHeight: 1.18, letterSpacing: -1.6 }} />
          {cap && <Lines lines={cap.lines} style={{ marginTop: 10, fontSize: cap.size, fontWeight: 600, color: "#5b6080", letterSpacing: -0.4, lineHeight: 1.3 }} />}
        </div>
      </Abs>
    </div>
  );
}

/** 글 한 편의 썸네일 — thumb 를 주면 저장된 값 대신 그걸로 (관리자 미리보기) */
export async function articleOgImage(a: ArticleSummary, { thumb = a.thumb, headers }: { thumb?: ArticleThumb; headers?: HeadersInit } = {}) {
  const plan = articleThumbPlan(a, thumb);
  const [fonts, logo] = await Promise.all([ogFonts(), plan.scene === "company" && plan.company ? companyLogo(plan.company.id) : Promise.resolve(null)]);
  return new ImageResponse(<ArticleThumbView plan={plan} logo={logo} />, { ...OG_SIZE, fonts, headers });
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
