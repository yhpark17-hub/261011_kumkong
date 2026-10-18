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
/** 판 이름 — 아침은 '금콩 브리핑', 점심은 '금콩 스터디' */
export const EDITION_LABEL: Record<Exclude<NewsEdition, "">, string> = { morning: "금콩 브리핑", noon: "금콩 스터디" };
/** 올라오는 시간대 — 썸네일 스티커·부가 설명에 */
export const EDITION_SLOT: Record<Exclude<NewsEdition, "">, string> = { morning: "아침판", noon: "점심판" };
export const isEdition = (v: unknown): v is NewsEdition => v === "morning" || v === "noon" || v === "";

/** 판마다 무엇이 실리는지 — 아침판은 기사 브리핑, 금콩 스터디(점심)는 용어·논술·면접 공부 */
export const EDITION_SCHEDULE: { key: Exclude<NewsEdition, "">; label: string; time: string; items: string[] }[] = [
  { key: "morning", label: "금콩 브리핑", time: "오전 6시", items: ["오늘의 기사 브리핑", "브리핑 퀴즈"] },
  { key: "noon", label: "금콩 스터디", time: "낮 12시 30분", items: ["오늘의 용어", "오늘의 면접 질문"] },
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
  noon: "점심 10분, 주요 뉴스로 보는 금공 시사 스터디",
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

/** 호마다 붙는 코너 (지금은 금콩 스터디만 씀) */
export interface IssueExtras {
  numbers: NumberItem[];
  essay: EssayItem | null;
}

const clip = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "");

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
  return { numbers, essay };
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
/** 제목·헤드라인으로 고르는 뉴스 그림 (변장과 같은 방식) */
export function autoScene(texts: string[]): SceneKey {
  for (const t of texts) {
    const hit = earliest(SCENES, t);
    if (hit) return hit.key;
  }
  return "news";
}

export type ThumbMood = "up" | "down" | "neutral";
export const THUMB_MOODS: { key: ThumbMood | ""; label: string }[] = [
  { key: "", label: "자동 (제목 분위기)" },
  { key: "up", label: "신남 · 오름" },
  { key: "down", label: "걱정 · 내림" },
  { key: "neutral", label: "보통" },
];
const MOOD_DOWN = /급락|하락|폭락|최저|최악|적자|위기|쇼크|우려|침해|유출|해킹|둔화|감소|하향|경고|불안|사이드카|서킷브레이커|패닉/;
const MOOD_UP = /반등|상승|급등|최고|회복|흑자|돌파|호조|증가|상향|개선|훈풍|귀환/;
export const autoMood = (text: string): ThumbMood => (MOOD_DOWN.test(text) ? "down" : MOOD_UP.test(text) ? "up" : "neutral");

/** 사이트 표지(시사 뉴스 첫 화면·목록 카드) — 기본 표지 / 공유 썸네일과 같은 그림 / 직접 올린 그림 */
export type CoverMode = "default" | "share" | "upload";

export const THUMB_LIMITS = { bubble: 44, caption: 64, topic: 120 } as const;

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
}

export const EMPTY_THUMB: IssueThumb = { scene: "", costume: "", kong: "auto", mood: "", bubble: "", caption: "", topic: "", shareUrl: "", cover: "default", coverUrl: "", checked: false };

/** 올린 그림 주소 — 우리 파일 주소(/api/files/…)나 https 만 */
const imageUrl = (v: unknown) => {
  const u = typeof v === "string" ? v.trim().slice(0, 500) : "";
  return /^(https:\/\/[^\s"'<>]+|\/api\/files\/[^\s"'<>]+)$/.test(u) ? u : "";
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
  const cover = o.cover === "share" || o.cover === "upload" ? o.cover : "default";
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
export const OG_DESIGN = 3;

/** 썸네일 버전 — 썸네일·제목을 고치거나 디자인 판이 바뀌면 달라져요 */
export const thumbVersion = (issue: Pick<BriefingIssue, "updatedAt">) => `${issue.updatedAt.toString(36)}${OG_DESIGN}`;

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
  /** 제목 — 목록·카드·검색에 쓰임 (브리핑 본문 위에는 안 나옴) */
  title: string;
  /** 오늘의 흐름: 2~3문장 */
  lede: string;
  /** 맺는 말 (선택) */
  closing: string;
  /** 퀴즈 (아침판 사지선다·금콩 스터디 O/X) */
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

/** 썸네일·머리에 적는 예상 소요 시간의 최댓값 — 실제로 더 걸려도 이보다 길게 적지 않아요 */
export const MAX_MINUTES = 5;

/** 예상 소요 시간 (한국어 약 500자/분, 3~5분) — 기사 본문 + 숫자·논술 코너 + 퀴즈 */
export function briefingMinutes(issue: Pick<BriefingIssue, "quiz" | "extras">, items: Pick<NewsItem, "summary" | "point" | "body">[]): number {
  const { numbers, essay } = issue.extras;
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
