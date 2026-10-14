/**
 * 사이트 기본 주소 (sitemap·OG 이미지·canonical 에 사용)
 * 1) NEXT_PUBLIC_SITE_URL (개인 도메인 연결 시)  2) Vercel 이 자동으로 넣어 주는 운영 주소  3) 로컬
 */
function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  const vercel = process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return `https://${vercel}`;
  return "http://localhost:3000";
}

export const SITE = {
  name: "금콩",
  title: "금콩 · 금융공기업 채용 캘린더",
  tagline: "금융공기업·공공기관 채용 일정을 한 달력에",
  description:
    "한국은행·금감원·산업은행·신용보증기금 등 금융공기업과 공공기관, 공제회, 중앙회, 시중은행 채용 일정(서류 마감·필기·면접)을 달력으로 한눈에. 필기 과목, 전공 유무, 블라인드 여부, 알리오 경쟁률, 자소서 항목까지 정리했습니다.",
  url: siteUrl(),
  contactEmail: "contact@example.com",
} as const;

/**
 * 카카오톡·SNS 공유 썸네일 (public/og/kumkong.png, 1200×630)
 * 페이지별로 openGraph 를 덮어쓰면 상위 이미지가 사라지므로 각 페이지에서도 함께 넣습니다.
 */
export const OG_IMAGE = { url: "/og/kumkong.png", width: 1200, height: 630, alt: "금콩 · 금융공기업·공공기관 채용 캘린더" } as const;

/** Google AdSense 퍼블리셔 ID (예: ca-pub-1234567890123456). 비어 있으면 광고 대신 자리표시만 보입니다. */
export const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? "";

/** 광고 단위 슬롯 ID — AdSense 콘솔에서 만든 광고 단위 ID로 교체하세요. */
export const AD_SLOTS = {
  homeTop: process.env.NEXT_PUBLIC_AD_SLOT_HOME_TOP ?? "",
  sidebar: process.env.NEXT_PUBLIC_AD_SLOT_SIDEBAR ?? "",
  sidebarSticky: process.env.NEXT_PUBLIC_AD_SLOT_SIDEBAR_STICKY ?? "",
  inFeed: process.env.NEXT_PUBLIC_AD_SLOT_INFEED ?? "",
  inArticle: process.env.NEXT_PUBLIC_AD_SLOT_INARTICLE ?? "",
} as const;
