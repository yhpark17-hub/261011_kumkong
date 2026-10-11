export const SITE = {
  name: "금콩",
  title: "금콩 · 금융공기업 채용 캘린더",
  tagline: "금융공기업·공공기관 채용 일정을 한 달력에",
  description:
    "한국은행·금감원·산업은행·신용보증기금 등 금융공기업과 공공기관, 공제회, 중앙회, 시중은행 채용 일정(서류 마감·필기·면접)을 달력으로 한눈에. 필기 과목, 전공 유무, 블라인드 여부, 알리오 경쟁률, 자소서 항목까지 정리했습니다.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  contactEmail: "contact@example.com",
} as const;

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
