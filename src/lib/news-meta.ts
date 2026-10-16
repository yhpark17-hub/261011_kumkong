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

/** 판마다 무엇이 실리는지 — 아침판은 기사 브리핑, 점심판은 용어·면접 공부 */
export const EDITION_SCHEDULE: { key: Exclude<NewsEdition, "">; label: string; time: string; items: string[] }[] = [
  { key: "morning", label: "아침판", time: "오전 6시", items: ["오늘의 기사 브리핑", "브리핑 퀴즈"] },
  { key: "noon", label: "점심판", time: "낮 12시 30분", items: ["오늘의 용어", "오늘의 면접 질문"] },
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
  /** 예전 '한 줄 뉴스' 구분 (지금은 모두 key) */
  tier: NewsTier;
  /** 브리핑 안 순서 (작을수록 앞) */
  position: number;
  /** 한 줄 요약 — '오늘 꼭 알아야 할 3가지'와 헤드라인 표지에 */
  takeaway: string;
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

export type NewsTier = "key" | "brief";
export const isNewsTier = (v: unknown): v is NewsTier => v === "key" || v === "brief";

/* ------------------------------------------------------------------ */
/* 데일리 브리핑 (호) — 날짜·판마다 한 편의 뉴스레터                       */
/* ------------------------------------------------------------------ */

export type IssueEdition = Exclude<NewsEdition, "">;
export const isIssueEdition = (v: unknown): v is IssueEdition => v === "morning" || v === "noon";

export const BRIEFING_TAGLINE: Record<IssueEdition, string> = {
  morning: "금공 준비생의 아침을 여는 5분 브리핑",
  noon: "점심시간 10분, 오늘의 용어·면접 공부",
};

/** 아침판 브리핑 퀴즈 한 문제 (보기 2~4개, answer 는 0부터) */
export interface QuizItem {
  question: string;
  options: string[];
  answer: number;
  explain: string;
}

export function parseQuiz(raw: unknown): QuizItem[] {
  let v: unknown = raw;
  if (typeof raw === "string") {
    try {
      v = JSON.parse(raw);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(v)) return [];
  return v
    .map((q) => q as Partial<QuizItem>)
    .filter(
      (q) =>
        typeof q.question === "string" &&
        q.question.trim().length > 0 &&
        Array.isArray(q.options) &&
        q.options.filter((o) => typeof o === "string" && o.trim()).length >= 2 &&
        Number.isInteger(q.answer),
    )
    .map((q) => {
      const options = (q.options as string[]).map((o) => String(o).trim().slice(0, 120)).filter(Boolean).slice(0, 4);
      return {
        question: String(q.question).trim().slice(0, 300),
        options,
        answer: Math.min(Math.max(0, Number(q.answer)), options.length - 1),
        explain: String(q.explain ?? "").trim().slice(0, 500),
      };
    })
    .slice(0, 5);
}

export interface BriefingIssue {
  id: number;
  /** 'YYYY-MM-DD' — 그날 그 판의 기사(news.edition_date·edition)를 묶음 */
  date: string;
  edition: IssueEdition;
  /** 판별로 처음 발행할 때 정해짐 (초안은 0) */
  vol: number;
  /** 제목 — 목록·카드·검색에 쓰임 (브리핑 본문 위에는 안 나옴) */
  title: string;
  /** 오늘의 흐름: 2~3문장 */
  lede: string;
  /** 맺는 말 (선택) */
  closing: string;
  /** 아침판 퀴즈 */
  quiz: QuizItem[];
  status: number;
  origin: string;
  publishedAt: number | null;
  updatedAt: number;
  views: number;
  live: boolean;
}

/** 브리핑 한 호 주소 (기사 id 를 주면 그 기사 자리로) */
export function letterHref(date: string, edition: IssueEdition = "morning", itemId?: number): string {
  return `/magazine/letter/${date}/${edition}${itemId ? `#item-${itemId}` : ""}`;
}

/** 기사가 실린 판 — 용어·면접 질문은 점심판, 기사는 아침판 */
export const itemEdition = (n: Pick<NewsItem, "section">): IssueEdition => (n.section === "term" || n.section === "question" ? "noon" : "morning");

/** 기사를 누르면 → 그 기사가 실린 브리핑의 그 자리 */
export const itemHref = (n: Pick<NewsItem, "id" | "section" | "editionDate">) => letterHref(n.editionDate, itemEdition(n), n.id);

export const volLabel = (vol: number) => (vol > 0 ? `Vol.${vol}` : "Vol.—");
export const issueLabel = (i: Pick<BriefingIssue, "edition" | "vol">) => `${EDITION_LABEL[i.edition]} ${volLabel(i.vol)}`;

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
