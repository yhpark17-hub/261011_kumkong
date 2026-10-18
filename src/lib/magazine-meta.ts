/** 금콩 매거진 공통 정보 — 서버·클라이언트 모두에서 사용 */

export const MAGAZINE_NAME = "금콩 매거진";
export const MAGAZINE_TAGLINE = "금공 준비가 쉬워지는 매일의 읽을거리";
export const DEFAULT_AUTHOR = "금콩 에디터";
export const MAGAZINE_PAGE_SIZE = 12;

export type MagazineCategory =
  | "briefing"
  | "exam"
  | "knowledge"
  | "starter"
  | "interview"
  | "story"
  | "insider"
  | "webtoon";

export interface CategoryInfo {
  key: MagazineCategory;
  label: string;
  /** 목록 머리에 쓰는 한 줄 설명 */
  desc: string;
  /** 태그 색 (Tailwind 클래스는 정적 문자열이어야 함) */
  tone: string;
  /** 카드 표지가 없을 때 쓰는 그라디언트 시작 색 */
  cover: string;
  /** 지금은 사이트에 보이지 않는 카테고리 (목록·메뉴·글쓰기에서 숨김) */
  hidden?: boolean;
}

export const MAGAZINE_CATEGORIES: CategoryInfo[] = [
  {
    key: "briefing",
    label: "데일리 브리핑",
    desc: "매일 아침, 금융·시사·금공 뉴스의 핵심만 5분 안에",
    tone: "bg-ev-written-soft text-primary-text",
    cover: "from-ev-written-soft",
    // 데일리 브리핑은 이제 뉴스 한 건씩(news 테이블)으로 운영 — 글 형식 브리핑은 숨김
    hidden: true,
  },
  {
    key: "exam",
    label: "필기",
    desc: "NCS·전공·논술, 유형별 준비법과 기출 경향",
    tone: "bg-ev-final-soft text-ev-final",
    cover: "from-ev-final-soft",
  },
  {
    key: "knowledge",
    label: "금공 지식",
    desc: "기관이 하는 일, 금융 제도와 시사 상식",
    tone: "bg-ev-posting-soft text-ev-posting",
    cover: "from-ev-posting-soft",
  },
  {
    key: "starter",
    label: "입문 가이드",
    desc: "금공 준비를 처음 시작한다면 여기부터",
    tone: "bg-canvas-cream text-lemon",
    cover: "from-canvas-cream",
  },
  {
    key: "interview",
    label: "면접",
    desc: "면접 유형별 준비와 합격하는 답변의 구조",
    tone: "bg-ev-interview1-soft text-ev-interview1",
    cover: "from-ev-interview1-soft",
  },
  {
    key: "story",
    label: "합격 수기",
    desc: "먼저 합격한 사람들이 들려주는 준비 과정",
    tone: "bg-ev-doc-soft text-ev-doc",
    cover: "from-ev-doc-soft",
    hidden: true,
  },
  {
    key: "insider",
    label: "현직자 이야기",
    desc: "실무진이 직접 말하는 진짜 업무와 조직 문화",
    tone: "bg-brand-dark text-on-primary",
    cover: "from-hairline",
  },
  {
    key: "webtoon",
    label: "웹툰",
    desc: "가볍게 읽는 금공 준비생 이야기",
    tone: "bg-canvas-soft text-ink-secondary",
    cover: "from-canvas-soft",
    hidden: true,
  },
];

export const CATEGORY_INFO = Object.fromEntries(MAGAZINE_CATEGORIES.map((c) => [c.key, c])) as Record<
  MagazineCategory,
  CategoryInfo
>;

export function isMagazineCategory(v: unknown): v is MagazineCategory {
  return typeof v === "string" && v in CATEGORY_INFO;
}

/** 사이트에 보이는 카테고리 */
export const VISIBLE_CATEGORIES = MAGAZINE_CATEGORIES.filter((c) => !c.hidden);
/** '금융 블로그' 섹션 = 브리핑을 뺀 보이는 카테고리 */
export const BLOG_CATEGORIES = VISIBLE_CATEGORIES.filter((c) => c.key !== "briefing");

export function isVisibleCategory(v: unknown): v is MagazineCategory {
  return isMagazineCategory(v) && !CATEGORY_INFO[v].hidden;
}

export function isBlogCategory(v: unknown): v is MagazineCategory {
  return isVisibleCategory(v) && v !== "briefing";
}

/** 매거진 안의 두 섹션 */
export type MagazineSection = "briefing" | "blog";
export const SECTION_INFO: Record<MagazineSection, { label: string; desc: string; href: string }> = {
  briefing: { label: "데일리 브리핑", desc: "아침에는 금콩 브리핑(기사 브리핑·퀴즈), 점심에는 금콩 스터디(용어·논술·면접) — 금공 준비생의 하루를 여는 브리핑", href: "/magazine" },
  blog: { label: "금융 블로그", desc: "필기·면접·금공 지식까지, 준비에 바로 쓰는 깊이 있는 글", href: "/magazine/blog" },
};

export const sectionOf = (category: MagazineCategory): MagazineSection => (category === "briefing" ? "briefing" : "blog");

/** 글 강조 표시 — 운영자가 글마다 골라요 (홈·블로그 목록에서 제목 앞 색 표시) */
export const ARTICLE_BADGES = {
  hot: { label: "인기", tone: "bg-ruby text-on-primary" },
  new: { label: "NEW", tone: "bg-ev-final text-on-primary" },
  pick: { label: "추천", tone: "bg-primary text-on-primary" },
  must: { label: "필독", tone: "bg-[#f07b12] text-on-primary" },
} as const;

export type ArticleBadge = keyof typeof ARTICLE_BADGES;

export const isArticleBadge = (v: unknown): v is ArticleBadge => typeof v === "string" && v in ARTICLE_BADGES;

export interface ArticleSummary {
  id: number;
  category: MagazineCategory;
  title: string;
  summary: string;
  coverUrl: string | null;
  /** 표지를 올리지 않았을 때 그려 쓰는 썸네일 설정 (빈 값 = 자동) */
  thumb: ArticleThumb;
  tags: string[];
  author: string;
  readMinutes: number;
  featured: boolean;
  /** 강조 표시 (없으면 null) */
  badge: ArticleBadge | null;
  status: number;
  /** 지금 공개 중 (발행 + 발행 시각 지남) */
  live: boolean;
  source: string;
  publishedAt: number | null;
  updatedAt: number;
  views: number;
  likes: number;
}

export interface ArticleDetail extends ArticleSummary {
  body: string;
}

export const ARTICLE_STATUS = { draft: 0, published: 1 } as const;

export const articleHref = (id: number) => `/magazine/${id}`;

/* ------------------------------------------------------------------ */
/* 글 썸네일 — 표지를 올리지 않은 글은 주제 그림 + 제목으로 그려요           */
/* ------------------------------------------------------------------ */

/** 썸네일 그림 (기관 글이면 그 기관 본사 건물 + 로고 간판) */
export const ARTICLE_SCENES = [
  { key: "company", label: "기관 본사 건물 + 로고" },
  { key: "exam", label: "필기 시험지 · 시계" },
  { key: "interview", label: "면접장" },
  { key: "knowledge", label: "금융 지식 (책 · 차트)" },
  { key: "starter", label: "출발선 · 로드맵" },
  { key: "insider", label: "사원증 · 사무실" },
] as const;

export type ArticleSceneKey = (typeof ARTICLE_SCENES)[number]["key"];

export const isArticleScene = (v: unknown): v is ArticleSceneKey => typeof v === "string" && ARTICLE_SCENES.some((x) => x.key === v);

export interface ArticleThumb {
  /** '' = 자동 (기관이 나온 글이면 기관 건물, 아니면 카테고리 그림) */
  scene: ArticleSceneKey | "";
  /** 간판에 넣을 기관 id ('' = 태그·제목에서 자동) */
  company: string;
  /** 왼쪽 위 이름표 옆 말 ('' = 자동, 예: '산은 필기') */
  kicker: string;
  /** 큰 제목 ('' = 글 제목) */
  headline: string;
  /** 제목 아래 한 줄 ('' = 제목의 '—' 뒤 또는 요약 첫 줄) */
  sub: string;
}

export const EMPTY_ARTICLE_THUMB: ArticleThumb = { scene: "", company: "", kicker: "", headline: "", sub: "" };

export const ARTICLE_THUMB_LIMITS = { kicker: 16, headline: 60, sub: 60 } as const;

export function parseArticleThumb(raw: unknown): ArticleThumb {
  let o: Record<string, unknown> = {};
  try {
    o = typeof raw === "string" && raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
  } catch {
    o = {};
  }
  const text = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");
  return {
    scene: isArticleScene(o.scene) ? o.scene : "",
    company: typeof o.company === "string" && /^[a-z0-9-]{1,40}$/.test(o.company) ? o.company : "",
    kicker: text(o.kicker, ARTICLE_THUMB_LIMITS.kicker),
    headline: text(o.headline, ARTICLE_THUMB_LIMITS.headline),
    sub: text(o.sub, ARTICLE_THUMB_LIMITS.sub),
  };
}

/** 저장용 — 다 비었으면 '' */
export function serializeArticleThumb(t: ArticleThumb): string {
  return Object.values(t).some(Boolean) ? JSON.stringify(t) : "";
}

/** 그려 쓰는 썸네일 주소 — 고치면(수정 시각) 주소가 바뀌어 카톡·브라우저가 새 그림을 받아요 */
export const articleThumbUrl = (a: Pick<ArticleSummary, "id" | "updatedAt">) => `/magazine/${a.id}/thumb?v=${a.updatedAt.toString(36)}`;

/** 카드·공유에 쓰는 그림 — 올린 표지가 있으면 그것, 없으면 그린 썸네일 */
export const articleImageUrl = (a: Pick<ArticleSummary, "id" | "updatedAt" | "coverUrl">) => a.coverUrl || articleThumbUrl(a);

/**
 * 매거진 목록 주소
 * - 데일리 브리핑: /magazine (?page=)
 * - 금융 블로그: /magazine/blog (?c=카테고리&q=검색&page=)
 */
export function magazineHref({
  category,
  page,
  q,
}: {
  category?: MagazineCategory | null;
  page?: number;
  q?: string | null;
}): string {
  const sp = new URLSearchParams();
  const briefing = category === "briefing" && !q;
  if (category && !briefing) sp.set("c", category);
  if (q) sp.set("q", q);
  if (page && page > 1) sp.set("page", String(page));
  const base = briefing ? "/magazine" : "/magazine/blog";
  const qs = sp.toString();
  return qs ? `${base}?${qs}` : base;
}

/** 한국어 기준 1분에 약 500자 + 사진 한 장 6초 */
export function computeReadMinutes(body: string): number {
  const images = (body.match(/!\[[^\]]*\]\([^)]+\)/g) ?? []).length;
  const text = body.replace(/!\[[^\]]*\]\([^)]+\)/g, "").replace(/[#>*=|`\-[\]()]/g, "").replace(/\s+/g, "");
  return Math.max(1, Math.round(text.length / 500 + images * 0.1));
}

/** 요약 칸: 줄마다 한 항목 ("3줄 요약") */
export function summaryLines(summary: string): string[] {
  return summary
    .split("\n")
    .map((l) => l.replace(/^\s*[-•·*]\s*/, "").trim())
    .filter(Boolean);
}

export function parseTags(raw: string): string[] {
  return [
    ...new Set(
      raw
        .split(/[,#\n]/)
        .map((t) => t.trim())
        .filter(Boolean),
    ),
  ].slice(0, 8);
}

const kstDay = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" });

/** 발행 시각 → 한국 날짜 키 'YYYY-MM-DD' */
export function kstDateKey(ms: number): string {
  return kstDay.format(ms);
}

/** "2026.10.14" */
export function formatArticleDate(ms: number): string {
  return kstDateKey(ms).replace(/-/g, ".");
}

/** datetime-local 입력값(한국 시각) ↔ ms */
export function kstInputToMs(v: string): number | null {
  const m = v.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!m) return null;
  return Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4] - 9, +m[5]);
}

export function msToKstInput(ms: number): string {
  const d = new Date(ms + 9 * 3600_000);
  return d.toISOString().slice(0, 16);
}

/** 글쓰기 도우미: 카테고리별 시작 틀 */
export const TEMPLATES: { key: string; label: string; category: MagazineCategory; title: string; summary: string; body: string }[] = [
  {
    key: "briefing",
    label: "아침 브리핑",
    category: "briefing",
    title: "M월 D일 아침 브리핑",
    summary: "오늘 꼭 알아야 할 금융 뉴스 한 줄\n오늘의 시사 이슈 한 줄\n금공 채용·기관 소식 한 줄",
    body: `## 오늘의 채용 일정

- [기관 이름](/companies/기관id) 서류 마감 18:00
- [기관 이름](/companies/기관id) 필기시험

## 금융

### 뉴스 제목
무슨 일이 있었는지 2~3문장으로 정리해 주세요.

> [!포인트] 필기·면접 포인트
> 이 뉴스가 시험이나 면접에서 어떻게 쓰일 수 있는지

출처: [언론사 이름](https://)

## 시사

### 뉴스 제목
요약

출처: [언론사 이름](https://)

## 금공 소식

### 기관 이름 · 소식 제목
요약 (채용 일정이면 [기관 정보](/companies) 페이지로 연결)

출처: [기관 보도자료](https://)

## 오늘의 용어

> [!용어] 용어 이름
> 한두 문장 정의와 관련 예시
`,
  },
  {
    key: "briefing-noon",
    label: "점심 브리핑",
    category: "briefing",
    title: "M월 D일 점심 브리핑",
    summary: "오전에 나온 핵심 뉴스 한 줄\n금공 준비생이 챙길 소식 한 줄\n오늘의 면접 질문 한 줄",
    body: `## 오전 주요 뉴스

### 뉴스 제목
요약 2~3문장

> [!포인트] 필기·면접 포인트
> 왜 중요한지 한두 문장

출처: [언론사 이름](https://)

## 금공 소식

### 기관 이름 · 소식 제목
요약

출처: [기관 보도자료](https://)

## 오늘의 면접 질문

> [!요약] 질문
> 오늘 뉴스와 연결해 나올 법한 면접 질문

- 답변 뼈대 1
- 답변 뼈대 2
`,
  },
  {
    key: "story",
    label: "합격 수기",
    category: "story",
    title: "OO기관 OO직렬 최종 합격 수기",
    summary: "준비 기간과 스펙 한 줄\n가장 효과 있었던 방법 한 줄\n후배에게 하고 싶은 말 한 줄",
    body: `> [!메모] 합격자 정보
> 지원 직렬 · 준비 기간 · 전공 · 응시 연도

## 준비 기간과 전략

## 서류

## 필기

| 영역 | 공부 방법 | 걸린 시간 |
| --- | --- | --- |
| NCS |  |  |
| 전공 |  |  |

## 면접

## 다시 준비한다면

> [!팁] 한 줄 조언
>
`,
  },
  {
    key: "insider",
    label: "현직자 인터뷰",
    category: "insider",
    title: "현직자에게 물었다: OO기관 OO부서의 하루",
    summary: "어떤 일을 하는 부서인지 한 줄\n가장 인상 깊은 답변 한 줄",
    body: `> [!메모] 인터뷰이
> 기관 · 부서 · 연차 (익명 처리 여부)

## 어떤 일을 하나요?

## 하루 일과

## 입사 전과 후, 달랐던 점

## 이런 사람에게 잘 맞아요

## 준비생에게 한마디
`,
  },
  {
    key: "guide",
    label: "가이드·정보글",
    category: "starter",
    title: "",
    summary: "이 글에서 알 수 있는 것 한 줄\n핵심 결론 한 줄",
    body: `## 한눈에 보기

> [!요약] 핵심 정리
> -
> -

## 자세히 알아보기

## 체크리스트

- [ ]
- [ ]
`,
  },
];
