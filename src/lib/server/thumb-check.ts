import "server-only";
import type { BriefingIssue } from "@/lib/news-meta";
import { artFacts, artOverflows, type ThumbArt } from "@/lib/thumb-art";
import { issueItems } from "./briefing";

/**
 * 직접 그린 썸네일 사실 확인 — 그림 글자에 나온 숫자·따옴표 말이 그 판 본문에 그대로 있는지.
 * 브리핑은 바로 공개되니, 지어낸 숫자·발언이 썸네일로 나가지 않게 막아요.
 */

/** 본문 비교용 — 띄어쓰기·따옴표·가운뎃점을 지운 글 (퀴즈 근거 확인과 같은 방식) */
export const plainCorpus = (t: string) => t.replace(/[\s'"‘’“”·…]/g, "");

/** 그 판 본문 (아침판: 기사 / 금콩 스터디: 용어·질문 + 숫자·논술) — 이미 plainCorpus 로 다듬은 글 */
export async function issueCorpus(issue: Pick<BriefingIssue, "date" | "edition" | "extras">): Promise<string> {
  const items = await issueItems(issue.date, issue.edition, { admin: true });
  const parts = items.map((n) => [n.title, n.takeaway, n.summary, n.point, n.body].join(" "));
  if (issue.edition === "noon") {
    parts.push(...issue.extras.numbers.map((x) => `${x.value} ${x.label} ${x.note}`));
    const e = issue.extras.essay;
    if (e) parts.push(e.topic, e.intro, e.body, e.conclusion, ...e.evidence);
  }
  return plainCorpus(parts.join(" "));
}

/** 본문에 없는 숫자·따옴표 말 (없으면 빈 배열) */
export function artFactProblems(art: ThumbArt, corpus: string): string[] {
  const { numbers, quotes } = artFacts(art);
  const out: string[] = [];
  for (const n of new Set(numbers)) if (!corpus.includes(n)) out.push(`숫자 "${n}" 가 이 판 본문에 없어요`);
  for (const q of new Set(quotes)) if (!corpus.includes(plainCorpus(q))) out.push(`따옴표 속 말 "${q}" 가 이 판 본문에 그대로 없어요`);
  return out;
}

/** 확인 결과 — problems 가 있으면 그림을 쓰지 않아요, long 은 칸보다 긴 글자(안내만) */
export function checkArt(art: ThumbArt, corpus: string): { problems: string[]; long: string[] } {
  return { problems: artFactProblems(art, corpus), long: artOverflows(art) };
}
