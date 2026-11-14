/**
 * 금콩 주간 정리 — 데일리 브리핑 옆의 주 1회 콘텐츠 (영상 + 글).
 * 글(articles, category 'weekly')의 본문 첫 줄 {{weekly:2026-11-2}} 이 내용 파일(src/data/weekly/<키>.ts)을 가리켜요.
 * 둘째 줄 {{youtube:주소}} 가 있으면 영상이 붙고, 장마다 같은 장면으로 가는 링크가 생겨요.
 * 숫자는 출처 기사에 있는 것만 — 출처는 장마다 sources 로.
 */

/** 본문 덩어리 — **굵게** 는 강조로 그려요. id 를 주면 목차에서 그 자리로 바로 가요 (예: 장 안의 엔비디아 이야기) */
export type WeeklyBlock = { id?: string } & (
  | { t: "p"; text: string }
  /** 짧은 말 풀이 (용어 세 개 등) */
  | { t: "terms"; items: { term: string; text: string }[] }
  /** 번호 단계 (연결고리) */
  | { t: "steps"; items: string[] }
  | { t: "table"; head: string[]; rows: string[][]; note?: string }
  /** 두 쪽 견주기 (걱정하는 쪽 / 지나치다고 보는 쪽) */
  | { t: "versus"; left: { title: string; items: string[] }; right: { title: string; items: string[] } }
  /** 큰 숫자 */
  | { t: "stats"; items: { value: string; label: string }[] }
  /** 항목별 정리 (무슨 일 / 시장 반응 / 쉽게 말하면 …) */
  | { t: "facts"; items: { label: string; text: string }[] }
  /** 한 줄 상자 — tone: easy(쉽게 말하면) · warn(조심할 점) · key(핵심) */
  | { t: "note"; tone: "easy" | "warn" | "key"; title?: string; text: string }
);

export interface WeeklySource {
  name: string;
  url?: string;
}

/** 목차 한 줄 — 독자가 '이거 궁금했는데' 하고 고를 수 있게 질문과 한 줄 힌트로 */
export interface WeeklyTocLine {
  /** 독자가 궁금해할 질문 (예: 미국 선거가 왜 한국 반도체를 흔들었을까?) */
  ask: string;
  /** 그 장에서 알 수 있는 것 — 숫자·키워드 한 줄 */
  hint: string;
}

export interface WeeklySection extends WeeklyTocLine {
  /** 쪽 안 주소 (#id) */
  id: string;
  /** 예: 메인 1 · 미국 물가 · 청해부대 */
  kicker: string;
  title: string;
  /** 영상에서 이 부분이 시작하는 초 (유튜브 챕터와 같은 값) */
  at?: number;
  /** 그림 (public 경로) */
  art?: string;
  artAlt?: string;
  blocks: WeeklyBlock[];
  sources?: WeeklySource[];
}

export interface WeeklyEdition {
  key: string;
  /** 2026년 11월 2주차 */
  week: string;
  /** 11월 9일(월) ~ 13일(금) */
  range: string;
  /** 숫자 기준 시점 */
  asOf: string;
  /** 영상 길이 (예: 12:10) */
  videoLength: string;
  /** 영상이 아직 없을 때 보여 줄 썸네일 */
  poster: string;
  /** 이번 주에 다룬 주제 — 브리핑 첫 화면 띠·목록의 칩 */
  topics: string[];
  /** 목차에 따로 세울 장 안의 지점 — after 장 바로 아래에 (블록 id 와 같은 id) */
  spots?: (WeeklyTocLine & { id: string; after: string; at?: number })[];
  /** 메인 질문과 한 문장 답 */
  question: string;
  answer: string;
  main: WeeklySection[];
  finance: WeeklySection[];
  current: WeeklySection[];
  /** 다음 주 볼 날짜 (목차 줄 · 영상 시각 포함) */
  nextToc: WeeklyTocLine & { at?: number };
  next: { when: string; what: string; why: string }[];
  nextSources?: WeeklySource[];
  /** 금공 준비생용 — 논술·면접 질문 (답할 재료). 영상에는 없고 글에만 있어요 */
  essays: { q: string; points: string[] }[];
  /** 이번 주 상식 체크 */
  quiz: { q: string; a: string }[];
  /** 끝의 주의 문구 */
  notes: string[];
}

const WEEKLY_LINE = /^\s*\{\{\s*weekly:\s*([0-9]{4}-[0-9]{2}-[1-5])\s*\}\}\s*$/;

/** 본문 첫 줄이 {{weekly:키}} 면 그 키 */
export function articleWeeklyIn(body: string): string | null {
  const first = body.split(/\r?\n/).find((l) => l.trim());
  return first?.match(WEEKLY_LINE)?.[1] ?? null;
}

export const mmss = (t: number) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;
export const youtubeAt = (id: string, t = 0) => `https://www.youtube.com/watch?v=${id}${t > 0 ? `&t=${Math.floor(t)}s` : ""}`;

/** 목차 한 줄 (그릴 때 쓰는 꼴) — onlyText 는 영상엔 없고 글에만 있는 부분 */
export interface WeeklyTocItem extends WeeklyTocLine {
  id: string;
  /** 떠 있는 목차 단추에 보일 짧은 이름 */
  label: string;
  at?: number;
  onlyText?: boolean;
}

export interface WeeklyTocGroup {
  key: "main" | "finance" | "current" | "next" | "prep";
  title: string;
  items: WeeklyTocItem[];
}

/** 목차 — 메인(장 안의 지점 포함) · 금융 · 시사 · 다음 주 · 준비생 코너 */
export function weeklyToc(w: WeeklyEdition): WeeklyTocGroup[] {
  const line = (s: WeeklySection): WeeklyTocItem => ({ id: s.id, label: s.kicker, at: s.at, ask: s.ask, hint: s.hint });
  const main: WeeklyTocItem[] = [];
  for (const s of w.main) {
    main.push(line(s));
    for (const p of w.spots ?? []) if (p.after === s.id) main.push({ id: p.id, label: s.kicker, at: p.at, ask: p.ask, hint: p.hint });
  }
  return [
    { key: "main", title: "메인 · 깊게", items: main },
    { key: "finance", title: `금융 소식 ${w.finance.length}`, items: w.finance.map(line) },
    { key: "current", title: `시사 ${w.current.length}`, items: w.current.map(line) },
    { key: "next", title: "다음 주", items: [{ id: "next", label: "다음 주", ...w.nextToc }] },
    {
      key: "prep",
      title: "금공 준비생 코너",
      items: [
        { id: "prep", label: "논술·면접", ask: "논술·면접에선 이렇게 물을 수 있어요", hint: `질문 ${w.essays.length}개와 답할 때 쓸 재료`, onlyText: true },
        { id: "quiz", label: "상식 체크", ask: "이번 주 상식, 다 맞힐 수 있을까?", hint: `눌러서 답을 확인하는 ${w.quiz.length}문제`, onlyText: true },
      ],
    },
  ];
}
