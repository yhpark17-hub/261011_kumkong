import "server-only";
import { cardTexts } from "@/lib/news-cards";
import type { parseExtras } from "@/lib/news-meta";
import { morningForAutomation } from "./briefing";
import { plainCorpus } from "./thumb-check";

type Raw = Record<string, unknown>;

/**
 * 점심 3문제 검사 — 문제 3개(news·major·deep 하나씩), 보기 4~5개, 해설, 근거 문장(basis)이 아침판 기사·이 판 글에 그대로 있는지,
 * news·deep 의 숫자(문제·정답 보기·해설)가 지어낸 게 아닌지.
 */
export async function checkDrill(
  raw: unknown,
  extras: ReturnType<typeof parseExtras>,
  rows: { section: string; title: string; summary: string; point: string; body: string }[],
  date: string,
): Promise<string[]> {
  const errors: string[] = [];
  const o = (raw && typeof raw === "object" ? raw : {}) as Raw;
  const rawQs = Array.isArray(o.questions) ? (o.questions as Raw[]) : [];
  const drill = extras.drill;
  if (!drill || drill.questions.length !== rawQs.length) {
    errors.push("drill.questions: 문제마다 kind·stem·options(4~5개)·answer(0부터, 보기 안)를 확인해 주세요");
    return errors;
  }
  if (drill.questions.length !== 3) errors.push(`drill: 문제는 3개예요 (지금 ${drill.questions.length}개)`);
  const kinds = drill.questions.map((q) => q.kind).sort().join(",");
  if (kinds !== "deep,major,news") errors.push(`drill: kind 는 news(시사)·major(전공)·deep(심화)가 하나씩이에요 (지금 ${kinds})`);

  const { items: morning } = await morningForAutomation(date);
  const morningIds = new Set(morning.map((n) => n.id));
  const morningText = plainCorpus(morning.map((n) => [n.title, n.takeaway, n.summary, n.point, ...n.cards.flatMap(cardTexts)].join(" ")).join(" "));
  const noonText = plainCorpus(rows.map((r) => [r.title, r.summary, r.point, r.body].join(" ")).join(" "));
  const corpus = morningText + noonText;
  const terms = new Set(rows.filter((r) => r.section === "term").map((r) => r.title));

  drill.questions.forEach((q, i) => {
    const at = `drill.questions[${i}]`;
    if (q.stem.length < 10) errors.push(`${at}: stem(문제)이 너무 짧아요`);
    if (q.explain.length < 40) errors.push(`${at}: explain(해설)을 40자 이상 — 왜 정답인지·오답 함정·시험에서 쓰는 법`);
    if (new Set(q.options).size !== q.options.length) errors.push(`${at}: 같은 보기가 두 번 있어요`);
    if (q.kind !== "major" && !morningIds.has(q.from)) errors.push(`${at}: from 은 오늘 아침판 기사 id 예요 (GET /api/automation/issue 의 items[].id)`);
    if (q.kind === "major" && q.from && !morningIds.has(q.from)) errors.push(`${at}: from 이 오늘 아침판 기사 id 가 아니에요`);
    if (q.term && !terms.has(q.term)) errors.push(`${at}: term "${q.term}" 은 이 판 용어(items 의 term 제목)와 똑같이 써 주세요`);
    if (q.kind === "major" && !q.term) errors.push(`${at}: 전공 문제는 term(이 판 용어 제목)이 필요해요 — 공식 자료로 확인한 뜻을 해설 아래 붙여요`);
    const basis = plainCorpus(String((rawQs[i] ?? {}).basis ?? "").slice(0, 400));
    if (basis.length < 8) errors.push(`${at}: basis(정답 근거 문장 — 아침판 기사나 이 판 용어·면접 글에서 그대로 옮긴 문장)가 필요해요`);
    else if (!corpus.includes(basis)) errors.push(`${at}: basis 가 오늘 아침판 기사·이 판 글에 그대로 없어요`);
    if (q.kind !== "major") {
      const nums = [q.stem, q.options[q.answer] ?? "", q.explain].join(" ").match(/\d[\d,.]*/g) ?? [];
      const missing = [...new Set(nums.map((n) => n.replace(/[.,]$/, "")))].filter((n) => n.length > 0 && !/^[1-5]$/.test(n) && !corpus.includes(n));
      if (missing.length) errors.push(`${at}: 숫자 ${missing.join(", ")} 이 아침판 기사·이 판 글에 없어요 (지어낸 숫자 방지)`);
    }
  });
  return errors;
}
