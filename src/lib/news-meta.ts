/** 데일리 브리핑(시사 뉴스) 공통 정보 — 서버·클라이언트 모두에서 사용 */

export type NewsSection = "finance" | "economy" | "policy" | "global" | "public";

export interface NewsSectionInfo {
  key: NewsSection;
  label: string;
  desc: string;
  /** 섹션 표시 색 (점·막대) */
  dot: string;
  /** 태그 색 */
  tone: string;
}

export const NEWS_SECTIONS: NewsSectionInfo[] = [
  { key: "finance", label: "금융", desc: "금리·은행·증권·보험·금융정책", dot: "bg-primary", tone: "bg-ev-written-soft text-primary-text" },
  { key: "economy", label: "경제", desc: "성장·물가·고용·부동산·산업", dot: "bg-ev-final", tone: "bg-ev-final-soft text-ev-final" },
  { key: "policy", label: "정책·사회", desc: "정부 정책·법안·인구·사회 이슈", dot: "bg-ev-interview1", tone: "bg-ev-interview1-soft text-ev-interview1" },
  { key: "global", label: "국제", desc: "해외 경제·외교·글로벌 금융시장", dot: "bg-lemon", tone: "bg-canvas-cream text-lemon" },
  { key: "public", label: "공공기관", desc: "금융공기업·공공기관 소식", dot: "bg-ruby", tone: "bg-ev-doc-soft text-ev-doc" },
];

export const NEWS_SECTION_INFO = Object.fromEntries(NEWS_SECTIONS.map((s) => [s.key, s])) as Record<NewsSection, NewsSectionInfo>;

export function isNewsSection(v: unknown): v is NewsSection {
  return typeof v === "string" && v in NEWS_SECTION_INFO;
}

export interface NewsItem {
  id: number;
  editionDate: string;
  section: NewsSection;
  title: string;
  summary: string;
  body: string;
  point: string;
  sourceName: string;
  sourceUrl: string | null;
  headline: boolean;
  status: number;
  origin: string;
  publishedAt: number | null;
  updatedAt: number;
  views: number;
  /** 지금 공개 중 */
  live: boolean;
}

export const newsHref = (id: number) => `/magazine/news/${id}`;
export const briefingDateHref = (date: string) => `/magazine?date=${date}`;

/** 'YYYY-MM-DD' 형식 확인 */
export const isDateKey = (v: unknown): v is string => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);

/** 발행 시각 → "오전 6:12" */
export function formatNewsTime(ms: number): string {
  return new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", hour: "numeric", minute: "2-digit" }).format(ms);
}
