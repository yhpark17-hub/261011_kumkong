/** 데일리 브리핑 공통 정보 — 서버·클라이언트 모두에서 사용 */

/** 브리핑 카테고리: 시사 뉴스 5분야 + 오늘의 용어 + 면접 질문 */
export type NewsSection = "finance" | "economy" | "policy" | "global" | "public" | "term" | "question";

/** 항목 종류 — 상세 화면의 칸 이름이 달라져요 */
export type NewsKind = "news" | "term" | "question";

export interface NewsSectionInfo {
  key: NewsSection;
  kind: NewsKind;
  label: string;
  desc: string;
  /** 섹션 표시 색 (점·막대) */
  dot: string;
  /** 태그 색 */
  tone: string;
  /** 카드 표지 그라디언트 시작색 */
  cover: string;
}

export const NEWS_SECTIONS: NewsSectionInfo[] = [
  { key: "finance", kind: "news", label: "금융", desc: "금리·은행·증권·보험·금융정책", dot: "bg-primary", tone: "bg-ev-written-soft text-primary-text", cover: "from-ev-written-soft" },
  { key: "economy", kind: "news", label: "경제", desc: "성장·물가·고용·부동산·산업", dot: "bg-ev-final", tone: "bg-ev-final-soft text-ev-final", cover: "from-ev-final-soft" },
  { key: "policy", kind: "news", label: "정책·사회", desc: "정부 정책·법안·인구·사회 이슈", dot: "bg-ev-interview1", tone: "bg-ev-interview1-soft text-ev-interview1", cover: "from-ev-interview1-soft" },
  { key: "global", kind: "news", label: "국제", desc: "해외 경제·외교·글로벌 금융시장", dot: "bg-lemon", tone: "bg-canvas-cream text-lemon", cover: "from-canvas-cream" },
  { key: "public", kind: "news", label: "공공기관", desc: "금융공기업·공공기관 소식", dot: "bg-ruby", tone: "bg-ev-doc-soft text-ev-doc", cover: "from-ev-doc-soft" },
  { key: "term", kind: "term", label: "오늘의 용어", desc: "필기·면접에 나오는 금융·경제 용어를 쉽게", dot: "bg-ev-posting", tone: "bg-ev-posting-soft text-ev-posting", cover: "from-ev-posting-soft" },
  { key: "question", kind: "question", label: "면접 질문", desc: "오늘 뉴스로 나올 법한 면접 질문과 답변 뼈대", dot: "bg-ev-interview2", tone: "bg-ev-interview2-soft text-ev-interview2", cover: "from-ev-interview2-soft" },
];

/** 시사 뉴스 5분야만 */
export const NEWS_ONLY_SECTIONS = NEWS_SECTIONS.filter((s) => s.kind === "news");

export const NEWS_SECTION_INFO = Object.fromEntries(NEWS_SECTIONS.map((s) => [s.key, s])) as Record<NewsSection, NewsSectionInfo>;

export function isNewsSection(v: unknown): v is NewsSection {
  return typeof v === "string" && v in NEWS_SECTION_INFO;
}

export const kindOf = (section: NewsSection): NewsKind => NEWS_SECTION_INFO[section].kind;

/** 칸 이름 — 종류마다 다르게 (상세 화면·운영자 입력) */
export const KIND_LABELS: Record<NewsKind, { title: string; summary: string; point: string; body: string; source: string }> = {
  news: { title: "제목", summary: "요약", point: "왜 중요할까 · 필기·면접 포인트", body: "더 자세히", source: "원문 보기" },
  term: { title: "용어", summary: "뜻 풀이", point: "필기·면접에서는", body: "더 알아보기", source: "참고 자료" },
  question: { title: "질문", summary: "이런 질문이 나올 수 있어요", point: "답변 팁", body: "답변 뼈대", source: "관련 뉴스" },
};

/** 발행 판 */
export type NewsEdition = "morning" | "noon" | "";
export const EDITION_LABEL: Record<Exclude<NewsEdition, "">, string> = { morning: "아침판", noon: "점심판" };
export const isEdition = (v: unknown): v is NewsEdition => v === "morning" || v === "noon" || v === "";

/** 언제 어떤 내용이 올라오는지 — 브리핑 화면 안내와 자동 점검 설명이 같은 내용을 씁니다 */
export const EDITION_SCHEDULE: { key: Exclude<NewsEdition, "">; label: string; time: string; items: string[] }[] = [
  { key: "morning", label: "아침판", time: "오전 6시", items: ["밤사이 금융·경제·시사 뉴스", "오늘의 용어", "오늘의 채용 일정"] },
  { key: "noon", label: "점심판", time: "낮 12시 30분", items: ["오전 주요 뉴스", "오늘의 면접 질문"] },
];

export interface NewsItem {
  id: number;
  editionDate: string;
  edition: NewsEdition;
  section: NewsSection;
  title: string;
  summary: string;
  body: string;
  point: string;
  sourceName: string;
  sourceUrl: string | null;
  /** 운영자가 올린 사진 (저작권 문제 없는 것만) */
  imageUrl: string | null;
  imageCredit: string;
  headline: boolean;
  status: number;
  origin: string;
  publishedAt: number | null;
  updatedAt: number;
  views: number;
  /** 지금 공개 중 */
  live: boolean;
}

export type NewsView = "card" | "list";

export const NEWS_PAGE_SIZE = 20;

export const newsHref = (id: number) => `/magazine/news/${id}`;

/** 전체 브리핑(모아보기) — 카테고리·기간으로 지난 브리핑까지 */
export const BRIEFING_ARCHIVE = "/magazine/archive";

export function briefingArchiveHref(p: { section?: NewsSection | null; from?: string | null; to?: string | null; view?: NewsView; page?: number } = {}): string {
  const sp = new URLSearchParams();
  if (p.section) sp.set("c", p.section);
  if (p.from) sp.set("from", p.from);
  if (p.to) sp.set("to", p.to);
  if (p.view) sp.set("view", p.view);
  if (p.page && p.page > 1) sp.set("page", String(p.page));
  const qs = sp.toString();
  return qs ? `${BRIEFING_ARCHIVE}?${qs}` : BRIEFING_ARCHIVE;
}

/** 하루치 브리핑 */
export const briefingDateHref = (date: string) => briefingArchiveHref({ from: date, to: date });

/** 'YYYY-MM-DD' 형식 확인 */
export const isDateKey = (v: unknown): v is string => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);

/** 발행 시각 → "오전 6:12" */
export function formatNewsTime(ms: number): string {
  return new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", hour: "numeric", minute: "2-digit" }).format(ms);
}

/** 지금(KST) 시각으로 판 추정 — 오전 11시 전이면 아침판 */
export function editionNow(ms = Date.now()): Exclude<NewsEdition, ""> {
  const h = Number(new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Seoul", hour: "numeric", hourCycle: "h23" }).format(ms));
  return h < 11 ? "morning" : "noon";
}
