/** 데일리 브리핑 공통 정보 — 서버·클라이언트 모두에서 사용 */

import type { Note } from "./glossary";
import type { NewsCard } from "./news-cards";
import { parseArt, type ThumbArt } from "./thumb-art";

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
/** 판 이름 — 아침은 '금콩 브리핑'(읽기), 점심은 '점심 3문제'(풀기 · 2026-11-08 전에는 '금콩 스터디') */
export const EDITION_LABEL: Record<Exclude<NewsEdition, "">, string> = { morning: "금콩 브리핑", noon: "점심 3문제" };
/** 올라오는 시간대 — 썸네일 스티커·부가 설명에 */
export const EDITION_SLOT: Record<Exclude<NewsEdition, "">, string> = { morning: "아침판", noon: "점심판" };
export const isEdition = (v: unknown): v is NewsEdition => v === "morning" || v === "noon" || v === "";

/** 판마다 무엇이 실리는지 — 아침판은 기사 브리핑, 금콩 스터디(점심)는 용어·논술·면접 공부 */
export const EDITION_SCHEDULE: { key: Exclude<NewsEdition, "">; label: string; time: string; items: string[] }[] = [
  { key: "morning", label: "금콩 브리핑", time: "오전 6시", items: ["오늘의 그림", "카드뉴스 기사 브리핑"] },
  { key: "noon", label: "점심 3문제", time: "낮 12시 30분", items: ["금공 필기형 3문제", "면접 1문", "이번 주 금공 일정"] },
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
  /** 한 줄 요약 — 카드뉴스 표지와 한 줄 뉴스에 */
  takeaway: string;
  /** 아침판 카드뉴스의 사이 장들 (비어 있으면 요약을 나눠 글 카드로) */
  cards: NewsCard[];
  /** 아침판 시간표에 쓰는 한 줄 제목 (16자 안 — 비면 제목) */
  short: string;
  /** 카드뉴스 표지 그림 (news-cards PICS 이름 또는 'who:인물' — 비면 제목·분야로 골라요) */
  pic: string;
  /** 괄호 풀이 — 이 기사의 전문 용어 풀이 (용어 사전 lib/glossary.ts 에 없는 말·이 기사에 맞춘 풀이, 처음 나오는 자리 뒤에 녹여 넣어요) */
  notes: Note[];
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

/** 브리핑 퀴즈 한 문제 (보기 2~4개, answer 는 0부터) — 금콩 스터디 O/X, 예전 아침판 사지선다 */
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

/** 금콩 스터디 ① 숫자로 보는 오늘 — 아침판 기사 속 숫자 하나 */
export interface NumberItem {
  /** 예: 7.57% */
  value: string;
  /** 예: 15일 코스피 하락률 */
  label: string;
  /** 한 줄 의미 (선택) */
  note: string;
}

/** 금콩 스터디 ③ 논술 한 문단 — 주제 + 서론·본론·결론 개요 + 쓸 만한 근거 */
export interface EssayItem {
  topic: string;
  intro: string;
  body: string;
  conclusion: string;
  evidence: string[];
}

/**
 * 그림 이야기 아침판 (2026-11-08 시범) — 유튜브 영상과 같은 파스텔 그림체로 호마다 그린 그림 + 기사와 기사를 잇는 다리 글.
 * 있으면 아침판을 '이야기' 화면(components/magazine/StoryLetter.tsx)으로 보여 줘요. 그림은 public/magazine/brief/<날짜>/ 에 둬요.
 */
export interface IssueStory {
  /** 맨 위 큰 그림 */
  hero: string;
  /** 큰 그림 위 두 줄 글 — '/'로 줄 나눔, *강조* (영상 썸네일 글씨) */
  hook: string;
  /** 두 줄 글 자리 — 그림에서 비워 둔 쪽 (위 왼쪽 / 아래 왼쪽) */
  hookPos: "top" | "bottom";
  /** 기사마다 (기사 순서대로) */
  items: StoryItem[];
  /** '필기·면접 포인트' 장 그림 (기사 공통) */
  pointArt: string;
  /** 맺음 '오늘 흐름 한 번 더' — 기사 순서대로 한 줄씩 */
  recap: string[];
}

export interface StoryItem {
  /** 기사 id */
  id: number;
  /** 표지 그림 */
  art: string;
  /** 사이 장 그림 — 카드 순서대로 (그림이 없는 장은 "") */
  cards: string[];
  /** 다음 기사로 넘어가는 다리 — label 은 'A → B' 한 줄, text 는 한두 문장 */
  bridge: { label: string; text: string } | null;
  /** 표지 그림 위 한눈에 보는 표시 — 나라 국기·지수 시세·기관 로고·짧은 메모 (무슨 뉴스인지 그림만 봐도 알게) */
  badges: StoryBadge[];
  /** 사이 장 그림 위 표시 — 카드 순서대로 (예: 노무라 이야기 장에 노무라 로고) */
  cardBadges: StoryBadge[][];
}

/**
 * 표지 표시 — flag: 나라(국기는 화면에서 정확히 그려요) · ticker: 지수와 등락 · logo: 회사·기관 로고 하나(글자 로고면 label 비워도 돼요)
 * · logos: 심볼 로고 여럿을 겹쳐서 + 이름 (예: 5대 금융지주) · note: 짧은 글. 로고 파일은 public/logos(/news) — news 쪽 출처는 SOURCES.md
 */
export type StoryBadge =
  | { kind: "flag"; code: FlagCode; label: string }
  | { kind: "ticker"; label: string; value: string; dir: "up" | "down" }
  | { kind: "logo"; src: string; label: string }
  | { kind: "logos"; srcs: string[]; label: string }
  | { kind: "note"; label: string };

export const FLAG_CODES = ["us", "jp", "cn", "eu"] as const;
export type FlagCode = (typeof FLAG_CODES)[number];

/**
 * 점심 3문제 (2026-11-08~) — 금공 필기 형식 객관식 문제. 오늘 아침판 기사에서 출발해요.
 * news: 시사·경제 흐름(쉬움) · major: 경제·경영 전공 개념·계산(보통) · deep: 두 기사를 잇거나 '옳지 않은 것' 고르기(어려움)
 */
export type DrillKind = "news" | "major" | "deep";
export const DRILL_KINDS: Record<DrillKind, { label: string; level: string }> = {
  news: { label: "시사", level: "쉬움" },
  major: { label: "전공", level: "보통" },
  deep: { label: "심화", level: "어려움" },
};

export interface DrillQuestion {
  kind: DrillKind;
  /** 과목 이름표 — 예: 경제학·경영학·금융상식·경제 시사 */
  subject: string;
  /** 문제 */
  stem: string;
  /** 보기 4~5개 */
  options: string[];
  /** 정답 번호 (0부터) */
  answer: number;
  /** 해설 — 왜 정답인지 + 오답 함정 + 시험·면접에서 어떻게 쓰는지 */
  explain: string;
  /** 해설 아래 '헷갈리는 짝꿍' — 이 판 용어(term) 제목 (그 용어의 뜻·짝꿍 표·출처를 보여 줘요) */
  term: string;
  /** 어느 아침판 기사에서 나온 문제인지 (기사 id — 그 기사의 그림·표시를 문제 위에 써요, 0 = 없음) */
  from: number;
  /** 점심 그림 (공유 썸네일 바탕 · 아침판 그림이 없을 때 문제 위 그림) — 비우면 과목·문제 글로 골라요 */
  art: NoonArt | "";
}

/**
 * 점심 그림 — 아침판 그림 이야기와 같은 그림체(파스텔 · 꼬마 취준생 · 점심 도시락 + 답안지)로 미리 그려 둔 장면.
 * public/magazine/brief/noon/<이름>.webp(페이지) · .jpg(1200×630 공유 썸네일 바탕). 왼쪽 절반은 하늘이라 큰 글씨가 들어가요.
 */
export const NOON_ART = ["desk", "calc", "graph", "rate", "stock", "news", "bank", "world"] as const;
export type NoonArt = (typeof NOON_ART)[number];
export const NOON_ART_INFO: Record<NoonArt, string> = {
  desk: "도시락 옆 답안지 (기본)",
  calc: "큰 계산기 · 재무표 (회계·재무 계산)",
  graph: "칠판 그래프 (경제학 · 수요·공급 · 물가·고용)",
  rate: "계기판 바늘 · 중앙은행 (금리·채권·통화정책)",
  stock: "주가 차트 화면 (주식·지수·증시)",
  news: "신문 읽기 · 전구 (시사)",
  bank: "은행 창구 · 돼지 저금통 (은행·예금·대출·보험)",
  world: "지구본 · 배·비행기 (환율·무역·국제)",
};

/** 과목·문제 글로 고르는 순서 — 먼저 맞는 것 */
const NOON_ART_RULES: [NoonArt, RegExp][] = [
  ["calc", /계산|회계|재무|ROE|ROA|이익률|현금흐름|NPV|IRR|원가|감가상각|EPS|PER|PBR|자기자본|재무제표|듀레이션/],
  ["rate", /금리|채권|통화정책|국채|수익률 곡선|연준|FOMC|한국은행|유동성|긴축|완화/],
  ["world", /환율|달러|무역|수출|수입|관세|국제수지|경상수지|원화|엔화|위안/],
  ["stock", /주가|증시|코스피|코스닥|주식|공매도|ETF|나스닥|밸류업|배당/],
  ["bank", /은행|예금|대출|보험|금융지주|가계부채|DSR|LTV|BIS|건전성|핀테크|예금자보호/],
  ["graph", /경제학|수요|공급|탄력성|GDP|물가|인플레|실업|고용|성장률|거시|미시|한계/],
];

/** 이 문제의 점심 그림 — 정해 둔 게 있으면 그것, 없으면 과목 → (시사 문제는 신문) → 문제 글 순서로 */
export function noonArt(q: Pick<DrillQuestion, "art" | "subject" | "stem" | "kind">): NoonArt {
  if (q.art) return q.art;
  const pick = (text: string) => NOON_ART_RULES.find(([, re]) => re.test(text))?.[0];
  return pick(q.subject) ?? (q.kind === "news" ? "news" : (pick(q.stem) ?? "desk"));
}

export const noonArtSrc = (key: NoonArt, ext: "webp" | "jpg" = "webp") => `/magazine/brief/noon/${key}.${ext}`;

/**
 * 점심 3문제 묶음 — share = 공유 썸네일에 싣는 문제 번호, hook = 공유 썸네일 큰 글(20자 안, *강조* 한 군데는 노랗게, 비우면 기본 문구)
 * ask = 썸네일 문제 카드에 싣는 짧은 문제 한 문장(필요한 숫자 포함, 비우면 문제 글 끝 문장), cover = 그날 새로 그린 썸네일 바탕 그림 주소(비우면 기본 점심 그림)
 */
export interface IssueDrill {
  questions: DrillQuestion[];
  share: number;
  hook: string;
  ask: string;
  cover: string;
}

/** 호마다 붙는 코너 (숫자·논술은 예전 금콩 스터디, story 는 그림 이야기 아침판, drill 은 점심 3문제) */
export interface IssueExtras {
  numbers: NumberItem[];
  essay: EssayItem | null;
  story: IssueStory | null;
  drill: IssueDrill | null;
}

/** 점심 3문제 보기 기호 */
export const CIRCLED = ["①", "②", "③", "④", "⑤"] as const;

/** 줄바꿈은 살리고 줄 안의 공백만 다듬기 (해설 문단) */
const clipLines = (v: unknown, max: number) =>
  typeof v === "string"
    ? v
        .split(/\r?\n/)
        .map((l) => l.replace(/\s+/g, " ").trim())
        .filter(Boolean)
        .join("\n")
        .slice(0, max)
    : "";

function parseDrill(v: unknown): IssueDrill | null {
  const o = (v && typeof v === "object" ? v : null) as Record<string, unknown> | null;
  if (!o) return null;
  const questions = (Array.isArray(o.questions) ? o.questions : [])
    .map((x) => (x && typeof x === "object" ? (x as Record<string, unknown>) : {}))
    .map((x): DrillQuestion | null => {
      const options = (Array.isArray(x.options) ? x.options : []).map((t) => clip(t, 120)).filter(Boolean).slice(0, 5);
      const answer = Number(x.answer);
      const kind = x.kind === "major" || x.kind === "deep" ? x.kind : "news";
      const stem = clip(x.stem, 300);
      if (!stem || options.length < 4 || !Number.isInteger(answer) || answer < 0 || answer >= options.length) return null;
      const art = (NOON_ART as readonly string[]).includes(String(x.art)) ? (x.art as NoonArt) : "";
      return { kind, subject: clip(x.subject, 16), stem, options, answer, explain: clipLines(x.explain, 700), term: clip(x.term, 60), from: Number.isInteger(Number(x.from)) ? Number(x.from) : 0, art };
    })
    .filter((q): q is DrillQuestion => q !== null)
    .slice(0, 4);
  if (!questions.length) return null;
  const share = Number(o.share);
  return { questions, share: Number.isInteger(share) && share >= 0 && share < questions.length ? share : 0, hook: clip(o.hook, 24), ask: clip(o.ask, 80), cover: coverPath(o.cover) };
}

const clip = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "");
/** 점심 3문제 썸네일 바탕 — 그림 그리기 API 가 저장한 파일(/api/files/magazine/…) 또는 사이트 안 /magazine/brief/ 그림(jpg·png) */
const coverPath = (v: unknown) =>
  typeof v === "string" && (/^\/api\/files\/magazine\/\d{8}\/[a-f0-9]{24}\.(png|jpg)$/.test(v) || /^\/magazine\/brief\/[\w-]+\/[\w-]+\.(png|jpg)$/.test(v)) ? v : "";

/** 이야기 그림 주소 — 사이트 안 /magazine/brief/ 그림만 */
const artPath = (v: unknown) => (typeof v === "string" && /^\/magazine\/brief\/[\w-]+\/[\w-]+\.(webp|png|jpg)$/.test(v) ? v : "");

const logoPath = (v: unknown) => (typeof v === "string" && /^\/logos\/(news\/)?[\w-]+\.png$/.test(v) ? v : "");

function parseBadge(v: unknown): StoryBadge | null {
  const b = (v && typeof v === "object" ? v : {}) as Record<string, unknown>;
  const label = clip(b.label, 20);
  if (b.kind === "logo" && logoPath(b.src)) return { kind: "logo", src: logoPath(b.src), label };
  if (b.kind === "logos") {
    const srcs = (Array.isArray(b.srcs) ? b.srcs : []).map(logoPath).filter(Boolean).slice(0, 6);
    return srcs.length ? { kind: "logos", srcs, label } : null;
  }
  if (!label) return null;
  if (b.kind === "flag" && (FLAG_CODES as readonly string[]).includes(String(b.code))) return { kind: "flag", code: b.code as FlagCode, label };
  if (b.kind === "ticker" && clip(b.value, 16)) return { kind: "ticker", label, value: clip(b.value, 16), dir: b.dir === "up" ? "up" : "down" };
  if (b.kind === "note") return { kind: "note", label };
  return null;
}

function parseStory(v: unknown): IssueStory | null {
  const o = (v && typeof v === "object" ? v : null) as Record<string, unknown> | null;
  if (!o || !artPath(o.hero)) return null;
  const items = (Array.isArray(o.items) ? o.items : [])
    .map((x) => (x && typeof x === "object" ? (x as Record<string, unknown>) : {}))
    .map((x) => {
      const b = (x.bridge && typeof x.bridge === "object" ? x.bridge : null) as Record<string, unknown> | null;
      const bridge = b && clip(b.label, 40) && clip(b.text, 300) ? { label: clip(b.label, 40), text: clip(b.text, 300) } : null;
      const badges = (Array.isArray(x.badges) ? x.badges : []).map(parseBadge).filter((b): b is StoryBadge => b !== null).slice(0, 3);
      const cardBadges = (Array.isArray(x.cardBadges) ? x.cardBadges : [])
        .slice(0, 10)
        .map((list) => (Array.isArray(list) ? list : []).map(parseBadge).filter((b): b is StoryBadge => b !== null).slice(0, 2));
      return { id: Number(x.id), art: artPath(x.art), cards: (Array.isArray(x.cards) ? x.cards : []).map(artPath).slice(0, 10), bridge, badges, cardBadges };
    })
    .filter((x) => Number.isInteger(x.id) && x.id > 0)
    .slice(0, 8);
  return {
    hero: artPath(o.hero),
    hook: clip(o.hook, 60),
    hookPos: o.hookPos === "top" ? "top" : "bottom",
    items,
    pointArt: artPath(o.pointArt),
    recap: (Array.isArray(o.recap) ? o.recap : []).map((x) => clip(x, 80)).filter(Boolean).slice(0, 8),
  };
}

export function parseExtras(raw: unknown): IssueExtras {
  let v: unknown = raw;
  if (typeof raw === "string") {
    try {
      v = JSON.parse(raw);
    } catch {
      v = {};
    }
  }
  const o = (v && typeof v === "object" ? v : {}) as Record<string, unknown>;
  const numbers = (Array.isArray(o.numbers) ? o.numbers : [])
    .map((n) => (n && typeof n === "object" ? (n as Record<string, unknown>) : {}))
    .map((n) => ({ value: clip(n.value, 24), label: clip(n.label, 80), note: clip(n.note, 160) }))
    .filter((n) => n.value && n.label)
    .slice(0, 4);
  const e = (o.essay && typeof o.essay === "object" ? o.essay : null) as Record<string, unknown> | null;
  const essay =
    e && clip(e.topic, 200)
      ? {
          topic: clip(e.topic, 200),
          intro: clip(e.intro, 600),
          body: clip(e.body, 900),
          conclusion: clip(e.conclusion, 600),
          evidence: (Array.isArray(e.evidence) ? e.evidence : []).map((x) => clip(x, 200)).filter(Boolean).slice(0, 5),
        }
      : null;
  return { numbers, essay, story: parseStory(o.story), drill: parseDrill(o.drill) };
}

/* ------------------------------------------------------------------ */
/* 썸네일 — 카톡·SNS 공유 그림(og:image)과 사이트 표지, 운영자가 미리 보고 고쳐요   */
/* ------------------------------------------------------------------ */

/**
 * 금콩 브리핑(아침판) 만화에서 콩이가 하는 변장 — 그림은 lib/server/og.tsx.
 * match 는 '자동'일 때 제목·헤드라인에서 찾는 말 (앞에 있는 것부터).
 */
export const COSTUMES = [
  { key: "uspresident", label: "미국 대통령 (금발 앞머리·빨간 넥타이)", hint: "트럼프 대통령 발언·관세", match: /트럼프|백악관/ },
  { key: "banker", label: "중앙은행 총재 (안경·의사봉)", hint: "금통위·연준·기준금리", match: /금통위|연준|FOMC|파월|기준금리|한국은행|한은|총재|금리 (인하|인상|동결)/ },
  { key: "president", label: "정상·장관 연설 (정장·연단)", hint: "대통령·장관·당국 발표", match: /대통령|정상회담|장관|기재부|금융위|금감원장|당국|정부/ },
  { key: "oil", label: "유가·원자재 (안전모·기름방울)", hint: "유가·OPEC·원자재", match: /유가|원유|OPEC|배럴|원자재|중동/ },
  { key: "chip", label: "반도체·기술 (방진복·칩)", hint: "반도체·AI·빅테크", match: /반도체|엔비디아|하이닉스|삼성전자|AI|인공지능|빅테크/ },
  { key: "security", label: "보안·수사 (모자·돋보기)", hint: "해킹·유출·금융사고·제재", match: /해킹|보안|유출|사이버|망분리|횡령|제재|검사|수사|사고/ },
  { key: "builder", label: "부동산·건설 (안전모·집)", hint: "집값·대출 규제·PF", match: /집값|부동산|아파트|주택|전세|PF|건설/ },
  { key: "money", label: "환율·외환 (초록 챙모자·지폐)", hint: "환율·달러·외환", match: /환율|달러|원화|엔화|외환|위안/ },
  { key: "shopper", label: "물가·소비 (가격표)", hint: "물가·CPI·소비", match: /물가|CPI|PPI|인플레|소비|장바구니/ },
  { key: "trader", label: "증권 트레이더 (헤드셋)", hint: "코스피·나스닥·증시", match: /코스피|코스닥|나스닥|증시|주가|주식|사이드카|서킷브레이커|S&P|다우/ },
  { key: "reporter", label: "기자 (기본)", hint: "맞는 변장이 없을 때", match: null },
] as const satisfies readonly { key: string; label: string; hint: string; match: RegExp | null }[];
export type CostumeKey = (typeof COSTUMES)[number]["key"];
export const isCostume = (v: unknown): v is CostumeKey => COSTUMES.some((c) => c.key === v);
/** 글 안에서 가장 앞에 나온 낱말의 항목 (같은 자리면 목록 앞의 것) */
function earliest<T extends { match: RegExp | null }>(list: readonly T[], text: string): T | undefined {
  let best: T | undefined;
  let at = Infinity;
  for (const c of list) {
    const i = c.match ? text.search(c.match) : -1;
    if (i >= 0 && i < at) {
      at = i;
      best = c;
    }
  }
  return best;
}

/** 제목·헤드라인으로 고르는 변장 — 앞 글(제목 앞부분)에서 먼저, 그 안에서는 가장 앞에 나온 낱말로 */
export function autoCostume(texts: string | string[]): CostumeKey {
  for (const t of typeof texts === "string" ? [texts] : texts) {
    const hit = earliest(COSTUMES, t);
    if (hit) return hit.key;
  }
  return "reporter";
}

/**
 * 금콩 브리핑 썸네일의 뉴스 그림 — 그림은 lib/server/og-scenes.ts.
 * 인물 발언(speech)만 콩이가 그 인물로 변장해 등장하고, 나머지는 주제 그림이 칸을 채워요.
 */
export const SCENES = [
  { key: "speech", label: "인물 발언·연설 (콩이가 그 인물로 변장)", match: /트럼프|백악관|파월|대통령|총재 ?["'‘“]|장관|위원장|정상회담/ },
  { key: "market", label: "증시 (차트 급락·반등)", match: /코스피|코스닥|나스닥|증시|주가|주식|다우|S&P|사이드카|서킷브레이커/ },
  { key: "rate", label: "금리·통화정책 (중앙은행·%)", match: /금통위|기준금리|금리|연준|FOMC|통화정책|한국은행|한은/ },
  { key: "gauge", label: "금리 계기판 (저금리↔고금리 바늘)", match: null },
  { key: "fx", label: "환율 (원·달러 저울)", match: /환율|달러|원화|엔화|외환|위안/ },
  { key: "oil", label: "유가·원자재 (드럼통·펌프)", match: /유가|원유|OPEC|배럴|원자재/ },
  { key: "housing", label: "부동산 (아파트·가격표)", match: /집값|부동산|아파트|주택|전세|PF/ },
  { key: "prices", label: "물가 (장바구니·가격표)", match: /물가|CPI|PPI|인플레|장바구니|소비자/ },
  { key: "security", label: "보안·해킹 (방패·자물쇠)", match: /해킹|보안|유출|사이버|망분리|침해/ },
  { key: "chip", label: "반도체·AI (칩·회로)", match: /반도체|엔비디아|하이닉스|삼성전자|AI|인공지능/ },
  { key: "trade", label: "무역·관세 (컨테이너선)", match: /관세|무역|수출|수입|통상|공급망/ },
  { key: "bond", label: "국채·안전자산 (우산·채권)", match: /국채|채권|안전자산|금값|금 ?가격/ },
  { key: "news", label: "기본 (신문·돋보기)", match: null },
] as const satisfies readonly { key: string; label: string; match: RegExp | null }[];
export type SceneKey = (typeof SCENES)[number]["key"];
export const isScene = (v: unknown): v is SceneKey => SCENES.some((c) => c.key === v);
/** 날짜 → 일련번호 (썸네일을 날마다 번갈아 바꿀 때) */
export const dayIndex = (date: string) => {
  const [y, m, d] = date.split("-").map(Number);
  return Math.floor(Date.UTC(y, (m || 1) - 1, d || 1) / 86_400_000);
};

/**
 * 제목·헤드라인으로 고르는 뉴스 그림 (변장과 같은 방식).
 * date 를 주면 금리 기사는 날마다 중앙은행 그림 ↔ 금리 계기판을 번갈아 — 같은 그림이 이어지지 않게.
 */
export function autoScene(texts: string[], date?: string): SceneKey {
  for (const t of texts) {
    const hit = earliest(SCENES, t);
    if (hit) return hit.key === "rate" && date && dayIndex(date) % 2 === 0 ? "gauge" : hit.key;
  }
  return "news";
}

/**
 * 아침판 썸네일 배치 — 비우면 날짜에 따라 번갈아 (카드형 → 큰 글씨형 → 숫자판)
 * card: 그림 + 왼쪽 아래 제목 카드 / bold: 유튜브 썸네일처럼 큰 글씨 / board: 오늘의 숫자 카드
 */
export const ISSUE_LAYOUTS = [
  { key: "card", label: "카드형 — 그림 + 제목 카드" },
  { key: "bold", label: "큰 글씨형 — 유튜브 썸네일처럼" },
  { key: "board", label: "숫자판 — 오늘의 숫자 2~3개" },
] as const;
export type IssueLayout = (typeof ISSUE_LAYOUTS)[number]["key"];
export const isIssueLayout = (v: unknown): v is IssueLayout => ISSUE_LAYOUTS.some((x) => x.key === v);

/** 숫자 칩 한 줄 — 맨 앞 ▲(오름)·▼(내림) 표시는 선택 */
export interface ThumbStat {
  dir: "up" | "down" | "";
  text: string;
}

export function parseStats(raw: string): ThumbStat[] {
  return raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 3)
    .map((l) => {
      const dir = /^(▲|↑)/.test(l) ? "up" : /^(▼|↓)/.test(l) ? "down" : "";
      return { dir, text: l.replace(/^(▲|▼|↑|↓)\s*/, "").slice(0, THUMB_LIMITS.stat) } as ThumbStat;
    });
}

export type ThumbMood = "up" | "down" | "neutral";
export const THUMB_MOODS: { key: ThumbMood | ""; label: string }[] = [
  { key: "", label: "자동 (제목 분위기)" },
  { key: "up", label: "신남 · 오름" },
  { key: "down", label: "걱정 · 내림" },
  { key: "neutral", label: "보통" },
];
const MOOD_DOWN = /급락|하락|폭락|급감|최저|최악|적자|위기|쇼크|우려|침해|유출|해킹|둔화|감소|하향|경고|불안|사이드카|서킷브레이커|패닉/;
const MOOD_UP = /반등|상승|급등|최고|회복|흑자|돌파|호조|증가|상향|개선|훈풍|귀환/;
export const autoMood = (text: string): ThumbMood => (MOOD_DOWN.test(text) ? "down" : MOOD_UP.test(text) ? "up" : "neutral");

/** 사이트 표지(시사 뉴스 첫 화면·목록 카드) — 기본 표지 / 공유 썸네일과 같은 그림 / 직접 올린 그림 */
/** 사이트 표지 — default: 그날 썸네일(공유 그림과 같은 것) / brand: 판 색 표지 / upload: 직접 올린 그림 */
export type CoverMode = "default" | "brand" | "upload";

export const THUMB_LIMITS = { bubble: 44, caption: 64, topic: 120, stat: 30 } as const;

export interface IssueThumb {
  /** 아침판 뉴스 그림 ("" = 자동) */
  scene: SceneKey | "";
  /** 아침판 콩이 변장 — 인물 발언 그림에서 ("" = 자동) */
  costume: CostumeKey | "";
  /** 콩이 — auto: 인물 발언이거나 분위기가 뚜렷한 날 반응하며 등장 / on: 늘 / off: 빼기 */
  kong: "auto" | "on" | "off";
  /** 콩이 표정 ("" = 자동) */
  mood: ThumbMood | "";
  /** 큰 글(제목 상자·인물 발언이면 말풍선) — 비우면 제목 앞부분. 발언은 기사에 실린 말 그대로 (지어내지 않기) */
  bubble: string;
  /** 아래 띠 한 줄 — 비우면 제목 뒷부분 */
  caption: string;
  /** 금콩 스터디: 썸네일에 넣을 논술 주제 — 비우면 '논술 한 문단' 주제 */
  topic: string;
  /** 직접 올린 공유 썸네일 (있으면 그린 그림 대신 이것) */
  shareUrl: string;
  cover: CoverMode;
  coverUrl: string;
  /** 운영자가 썸네일을 확인했는지 */
  checked: boolean;
  /** 아침판 배치 ("" = 날짜에 따라 자동) */
  layout: IssueLayout | "";
  /** 아침판 숫자 칩 — 한 줄에 하나(최대 3줄), 맨 앞 ▲·▼ 선택. 비우면 오늘 기사 제목에서 */
  stats: string;
  /** 직접 그린 그림 — 있으면 위의 틀(배치·그림·콩이·공책) 대신 그날 뉴스에 맞춰 새로 짠 그림으로 (두 판 모두) */
  art: ThumbArt | null;
}

export const EMPTY_THUMB: IssueThumb = { scene: "", costume: "", kong: "auto", mood: "", bubble: "", caption: "", topic: "", shareUrl: "", cover: "default", coverUrl: "", checked: false, layout: "", stats: "", art: null };

/** 올린 그림 주소 — 우리 파일 주소(/api/files/…)나 https 만 */
const imageUrl = (v: unknown) => {
  const u = typeof v === "string" ? v.trim().slice(0, 500) : "";
  // 올린 그림(https·/api/files) 또는 그림 이야기 아침판의 썸네일(/magazine/brief/<날짜>/…)
  return /^(https:\/\/[^\s"'<>]+|\/api\/files\/[^\s"'<>]+|\/magazine\/brief\/[\w-]+\/[\w-]+\.(jpg|png|webp))$/.test(u) ? u : "";
};

export function parseThumb(raw: unknown): IssueThumb {
  let v: unknown = raw;
  if (typeof raw === "string") {
    try {
      v = JSON.parse(raw);
    } catch {
      v = {};
    }
  }
  const o = (v && typeof v === "object" ? v : {}) as Record<string, unknown>;
  // 예전 'share'(공유 그림과 같은 표지)는 이제 기본이에요
  const cover = o.cover === "brand" || o.cover === "upload" ? o.cover : "default";
  const coverUrl = imageUrl(o.coverUrl);
  return {
    scene: isScene(o.scene) ? o.scene : "",
    costume: isCostume(o.costume) ? o.costume : "",
    kong: o.kong === true || o.kong === "on" ? "on" : o.kong === "off" ? "off" : "auto",
    mood: o.mood === "up" || o.mood === "down" || o.mood === "neutral" ? o.mood : "",
    bubble: clip(o.bubble, THUMB_LIMITS.bubble),
    caption: clip(o.caption, THUMB_LIMITS.caption),
    topic: clip(o.topic, THUMB_LIMITS.topic),
    shareUrl: imageUrl(o.shareUrl),
    cover: cover === "upload" && !coverUrl ? "default" : cover,
    coverUrl,
    checked: o.checked === true,
    layout: isIssueLayout(o.layout) ? o.layout : "",
    stats: (Array.isArray(o.stats) ? o.stats.join("\n") : typeof o.stats === "string" ? o.stats : "")
      .split(/\r?\n/)
      .map((l: string) => l.trim().slice(0, THUMB_LIMITS.stat + 2))
      .filter(Boolean)
      .slice(0, 3)
      .join("\n"),
    art: parseArt(o.art),
  };
}

/**
 * 썸네일에 넣을 논술 주제 — 운영자가 적은 것 > 논술 한 문단 주제.
 * 주제가 둘(①…②…, 또는 ' / ' 로 나눔)이면 앞의 것(더 중요한 것을 앞에 쓰기로 함) 하나만.
 */
export function studyTopic(thumb: IssueThumb, extras: IssueExtras): string {
  if (thumb.topic) return thumb.topic;
  const t = extras.essay?.topic ?? "";
  const circled = t.match(/①\s*(.+?)\s*②/);
  if (circled) return circled[1].trim();
  const parts = t.split(/\s+\/\s+|\s*;\s*/);
  return (parts[0] ?? t).trim();
}

/** 썸네일 그림 디자인 판 — 그리는 방식을 바꾸면 올려서, 이미 공유된 주소도 새 그림으로 가져가게 */
export const OG_DESIGN = 7;

/** 썸네일 버전 — 썸네일·제목을 고치거나 디자인 판이 바뀌면 달라져요 */
export const thumbVersion = (issue: Pick<BriefingIssue, "updatedAt">) => `${issue.updatedAt.toString(36)}${OG_DESIGN}`;

/** 사이트 화면용 썸네일 (배율 0.5~2 — 카드 크기에 맞춰 그린 그림을 골라 쓰면 또렷해요) */
export const ISSUE_THUMB_SCALES = [0.5, 0.75, 1, 1.5, 2] as const;
export type IssueThumbScale = (typeof ISSUE_THUMB_SCALES)[number];
export const isIssueThumbScale = (v: number): v is IssueThumbScale => (ISSUE_THUMB_SCALES as readonly number[]).includes(v);

export const issueThumbUrl = (issue: Pick<BriefingIssue, "date" | "edition" | "updatedAt">, scale: IssueThumbScale = 1) =>
  `/magazine/letter/${issue.date}/${issue.edition}/thumb?v=${thumbVersion(issue)}${scale === 1 ? "" : `&s=${scale}`}`;

export const issueThumbSrcSet = (issue: Pick<BriefingIssue, "date" | "edition" | "updatedAt">) => ISSUE_THUMB_SCALES.map((s) => `${issueThumbUrl(issue, s)} ${1200 * s}w`).join(", ");

/** 공유 썸네일 주소 — 올린 그림이 있으면 그것, 아니면 그날 그린 그림 (고칠 때마다 주소가 바뀌어 카톡도 새로 가져가요) */
export function shareImageUrl(issue: Pick<BriefingIssue, "date" | "edition" | "updatedAt" | "thumb">): string {
  return issue.thumb.shareUrl || `/magazine/letter/${issue.date}/${issue.edition}/opengraph-image?v=${thumbVersion(issue)}`;
}

/**
 * 공유용 브리핑 주소 — 썸네일 버전(?s=)을 붙여요.
 * 카톡은 한 번 읽은 주소의 미리보기를 한동안 그대로 쓰기 때문에, 썸네일이 바뀌면 주소도 바뀌어야 새 그림이 떠요.
 */
export const letterShareHref = (issue: Pick<BriefingIssue, "date" | "edition" | "updatedAt">) => `${letterHref(issue.date, issue.edition)}?s=${thumbVersion(issue)}`;

export interface BriefingIssue {
  id: number;
  /** 'YYYY-MM-DD' — 그날 그 판의 기사(news.edition_date·edition)를 묶음 */
  date: string;
  edition: IssueEdition;
  /** 판별로 처음 발행할 때 정해짐 (초안은 0) */
  vol: number;
  /** 제목 — 목록·카드·검색과 브리핑 맨 위 그림 아래에 */
  title: string;
  /** 공유 미리보기·검색 설명 2~3문장 (금콩 스터디는 '오늘의 스터디'로 화면에도) */
  lede: string;
  /** 맺는 말 (선택) */
  closing: string;
  /** 퀴즈 (금콩 스터디 O/X · 예전 아침판 사지선다 — 아침판은 이제 화면에 안 나와요) */
  quiz: QuizItem[];
  /** 금콩 스터디 코너 (숫자로 보는 오늘·논술 한 문단) */
  extras: IssueExtras;
  /** 공유 썸네일·사이트 표지 설정 */
  thumb: IssueThumb;
  status: number;
  origin: string;
  publishedAt: number | null;
  updatedAt: number;
  views: number;
  /** 추천 수 */
  likes: number;
  live: boolean;
}

/** 브리핑 한 호 주소 (기사 id 를 주면 그 기사 자리로) */
export function letterHref(date: string, edition: IssueEdition = "morning", itemId?: number): string {
  return `/magazine/letter/${date}/${edition}${itemId ? `#item-${itemId}` : ""}`;
}

/** 기사가 실린 판 — 용어·면접 질문은 금콩 스터디, 기사는 아침판 */
export const itemEdition = (n: Pick<NewsItem, "section">): IssueEdition => (n.section === "term" || n.section === "question" ? "noon" : "morning");

/** 기사를 누르면 → 그 기사가 실린 브리핑의 그 자리 */
export const itemHref = (n: Pick<NewsItem, "id" | "section" | "editionDate">) => letterHref(n.editionDate, itemEdition(n), n.id);

/** 아침판 한 호에 싣는 기사 수의 최댓값 — 더 많이 저장된 예전 호도 앞에서부터 이만큼만 보여 줘요 */
export const MAX_STORIES = 5;

/** 썸네일·머리에 적는 예상 소요 시간의 최댓값 — 실제로 더 걸려도 이보다 길게 적지 않아요 */
export const MAX_MINUTES = 5;

/** 예상 소요 시간 (한국어 약 500자/분, 3~5분) — 기사 본문 + 숫자·논술 코너 + 퀴즈 */
export function briefingMinutes(issue: Pick<BriefingIssue, "quiz" | "extras">, items: Pick<NewsItem, "summary" | "point" | "body">[]): number {
  const { numbers, essay, drill } = issue.extras;
  // 점심 3문제 — 문제마다 풀고 해설 읽는 데 2분 + 면접 1문 1분 (주말 논술은 따로)
  if (drill) return Math.min(10, drill.questions.length * 2 + 1);
  const chars =
    items.reduce((s, n) => s + n.summary.length + n.point.length + n.body.length, 0) +
    numbers.reduce((s, n) => s + n.value.length + n.label.length + n.note.length, 0) +
    (essay ? essay.topic.length + essay.intro.length + essay.body.length + essay.conclusion.length + essay.evidence.join("").length : 0) +
    issue.quiz.reduce((s, q) => s + q.question.length + q.options.join("").length, 0);
  return Math.min(MAX_MINUTES, Math.max(3, Math.round(chars / 500)));
}

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
