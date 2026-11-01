/**
 * 카드뉴스 글 계산 — 웹 카드뉴스(components/magazine/NewsDeck.tsx)와 앱 API(/api/app/v1/briefing)가 같이 써요.
 * 전문 용어는 처음 나오는 자리에 짧은 괄호 풀이를 녹여 넣어요 — 용어 사전(lib/glossary.ts) + 기사마다 붙은 notes.
 */
import { findNotes, noteIndex, termIndex } from "./glossary";
import type { NewsCard } from "./news-cards";
import type { NewsItem } from "./news-meta";

/** 사이 장이 없는 예전 기사 — 요약을 한두 문장씩 나눠 글 카드로 (한 장 120자 안쪽) */
export function summaryChunks(text: string): string[] {
  const sentences = text
    .split(/\n+/)
    .flatMap((b) => b.split(/(?<=[.!?]["'”’)]?)\s+/))
    .map((t) => t.trim())
    .filter(Boolean);
  const out: string[] = [];
  for (const s of sentences) {
    const last = out.length - 1;
    if (last >= 0 && out[last].length + s.length < 120) out[last] = `${out[last]} ${s}`;
    else out.push(s);
  }
  return out.slice(0, 4);
}

/** 카드 장 수 — 표지 + 사이 장(카드, 없으면 요약 글) + '왜 중요할까' */
export const deckSize = (n: NewsItem) => 1 + (n.cards.length || summaryChunks(n.summary).length) + (n.point ? 1 : 0);

/* ------------------------------------------------------------------ */
/* 괄호 풀이                                                             */
/* ------------------------------------------------------------------ */

/** 풀이를 넣은 글 조각 — 글 그대로이거나 (풀이) */
export type GlossPart = string | { gloss: string };

export interface Glosser {
  /** 글 → 처음 나온 전문 용어 뒤에 (풀이)를 넣은 조각들 */
  r: (s: string) => GlossPart[];
}
const PLAIN: Glosser = { r: (s) => [s] };

type NoteIndex = ReturnType<typeof noteIndex>;

/** 괄호 풀이를 넣어도 되는 자리 — 말 뒤가 끝·띄어쓰기·문장부호·조사일 때만 (예: '홍콩ELS식'처럼 붙은 말 가운데는 안 넣어요) */
const PARTICLE = /[은는이가을를의에와과로으도만까부처보며나랑]/;
function glossAt(text: string, find: string): number {
  let at = termIndex(text, find);
  while (at >= 0) {
    const next = text[at + find.length] ?? "";
    if (next === "(") return -2;
    if (!next || !/[가-힣A-Za-z0-9]/.test(next) || PARTICLE.test(next)) return at;
    at = termIndex(text, find, at + 1);
  }
  return -1;
}

/**
 * 카드 한 장의 괄호 풀이 — 이 묶음(기사)에서 아직 풀지 않은 말만, 설명하는 글(prose)에만.
 * 글쓴이가 이미 바로 뒤에 괄호로 풀어 썼으면 그대로 두고 푼 것으로 쳐요. 넣을 자리가 없으면 다음 장에서 풀어요.
 */
function annotate(prose: string[], index: NoteIndex, used: Set<string>): Glosser {
  const joined = prose.filter(Boolean).join("\n");
  const todo: { find: string; text: string; term: string }[] = [];
  for (const h of findNotes(joined, index)) {
    if (used.has(h.note.term)) continue;
    const at = glossAt(joined, h.find);
    if (at === -1) continue;
    used.add(h.note.term);
    if (at >= 0) todo.push({ find: h.find, text: h.note.text, term: h.note.term });
  }
  if (!todo.length) return PLAIN;
  const done = new Set<string>();
  const r = (s: string): GlossPart[] => {
    if (!s) return [s];
    const out: GlossPart[] = [];
    let rest = s;
    while (rest) {
      let best: { at: number; h: (typeof todo)[number] } | null = null;
      for (const h of todo) {
        if (done.has(h.term)) continue;
        const at = glossAt(rest, h.find);
        if (at >= 0 && (!best || at < best.at)) best = { at, h };
      }
      if (!best) {
        out.push(rest);
        break;
      }
      done.add(best.h.term);
      const end = best.at + best.h.find.length;
      out.push(rest.slice(0, end), { gloss: best.h.text });
      rest = rest.slice(end);
    }
    return out;
  };
  return { r };
}

/**
 * 기사 한 건의 괄호 풀이 — 말마다 기사 안에서 한 번 (배경·용어 카드가 이미 풀어 쓴 말은 빼요).
 * 돌려준 함수를 표지 → 사이 장 → '왜 중요할까' 차례로 불러야 웹과 앱의 풀이 자리가 같아요.
 */
export function deckGlosser(n: Pick<NewsItem, "notes" | "cards">): (prose: string[]) => Glosser {
  const index = noteIndex(n.notes);
  const explained = n.cards
    .filter((c) => c.type === "term" || c.type === "background")
    .flatMap((c) => findNotes(c.type === "term" ? `${c.term} ${c.text}` : `${c.title} ${c.text}`, index).map((h) => h.note.term));
  const used = new Set(explained);
  return (prose) => annotate(prose, index, used);
}

/** 카드에서 괄호 풀이를 넣을 설명 글 (제목·이름표·인물의 말·단계는 그대로) */
export function proseStrings(c: NewsCard): string[] {
  switch (c.type) {
    case "background":
    case "text":
      return [c.text];
    case "stat":
      return [c.note];
    case "bars":
    case "change":
      return [c.note];
    case "term":
      return [c.text];
    case "quote":
      return [c.note];
    case "versus":
      return [c.left.text, c.right.text];
    case "flow":
      return [];
  }
}
