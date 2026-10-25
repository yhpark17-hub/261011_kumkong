/**
 * 전문 용어 괄호 풀이 — 카드뉴스 글에 이 말이 처음 나오면 바로 뒤에 짧은 풀이를 괄호로 녹여 넣어요.
 *   예: 코픽스는 올랐어요 → 코픽스(변동금리 대출의 기준 금리)는 올랐어요
 * 금감원·기준금리·신용대출처럼 기초적인 말은 넣지 않고, 처음 공부하는 사람이 막히는 전문 용어·사례만 (풀이는 18자 안팎).
 * 글쓴이가 이미 바로 뒤에 괄호로 풀어 썼으면 그대로 둬요. 기사마다 더 필요한 말은 notes 로 붙여요.
 */
export interface GlossaryEntry {
  term: string;
  text: string;
  match?: string[];
}

export const GLOSSARY: GlossaryEntry[] = [
  // 금리·채권
  { term: "코픽스", match: ["COFIX"], text: "변동금리 대출의 기준 금리" },
  { term: "은행채", text: "은행이 돈을 빌리려 낸 채권" },
  { term: "신용스프레드", text: "회사채와 국채의 금리 차이" },
  { term: "엔화채", match: ["엔화 표시 채권"], text: "엔화로 돈을 빌리는 채권" },
  { term: "bp", match: ["베이시스포인트"], text: "0.01%포인트" },
  { term: "FOMC", text: "미국 기준금리를 정하는 회의" },
  // 투자상품·사례
  { term: "홍콩 ELS", match: ["홍콩ELS"], text: "은행이 판 홍콩지수 연계 상품 손실 사태" },
  { term: "ELS", match: ["주가연계증권"], text: "주가지수에 따라 수익이 정해지는 상품" },
  { term: "불완전판매", text: "위험을 제대로 설명하지 않은 판매" },
  // 예금보험
  { term: "예보료율", text: "예금보험료를 매기는 비율" },
  { term: "예보료", match: ["예금보험료"], text: "예금 보호를 위해 금융사가 내는 보험료" },
  { term: "예보채상환기금", text: "외환위기 때 쓴 돈을 갚는 기금" },
  // 기관·제도
  { term: "공운위", match: ["공공기관운영위원회"], text: "공공기관 지정을 심의하는 위원회" },
  // 지표
  { term: "경상수지", text: "해외와 거래해 번 돈과 쓴 돈의 차이" },
  { term: "근원물가", text: "식료품·에너지를 뺀 물가" },
  { term: "마이크로데이터", text: "통계의 원자료" },
  // 주식시장
  { term: "VKOSPI", match: ["공포지수"], text: "주가가 얼마나 출렁일지 보여 주는 지수" },
  { term: "중복 상장", text: "모회사·자회사가 따로 상장하는 것" },
  { term: "주주가치 희석", text: "기존 주주의 몫이 줄어드는 것" },
  { term: "잉여현금흐름", text: "벌고 투자한 뒤 남은 현금" },
  { term: "서킷브레이커", text: "주가 급락 때 거래를 잠시 멈추는 제도" },
  { term: "사이드카", text: "급변할 때 프로그램 매매를 잠시 멈추는 제도" },
];

export interface Note {
  term: string;
  text: string;
}

/** 찾을 말 목록 — (찾는 말, 풀이) 긴 말부터. 기사에 붙은 풀이가 사전보다 먼저 */
export function noteIndex(extra: Note[] = []): { find: string; note: Note }[] {
  const out: { find: string; note: Note }[] = [];
  const seen = new Set<string>();
  for (const n of extra) {
    if (!n.term || seen.has(n.term)) continue;
    seen.add(n.term);
    out.push({ find: n.term, note: n });
  }
  for (const g of GLOSSARY) {
    for (const find of [g.term, ...(g.match ?? [])]) {
      if (seen.has(find)) continue;
      seen.add(find);
      out.push({ find, note: { term: g.term, text: g.text } });
    }
  }
  return out.sort((a, b) => b.find.length - a.find.length);
}

/** 글 속 그 말의 자리 (from 부터, 영문 약자는 낱말 가운데 자리를 건너뛰어요 — ETF 속 TF 같은 것). 없으면 -1 */
export function termIndex(text: string, find: string, from = 0): number {
  const ascii = /^[A-Za-z]+$/.test(find);
  let at = text.indexOf(find, from);
  while (at >= 0 && ascii && (/[A-Za-z]/.test(text[at - 1] ?? "") || /[A-Za-z]/.test(text[at + find.length] ?? ""))) at = text.indexOf(find, at + 1);
  return at;
}

/** 글에서 찾은 말 (겹치는 자리는 긴 말이 이겨요) — 나온 순서대로, 같은 풀이는 한 번만 */
export function findNotes(text: string, index: { find: string; note: Note }[]): { find: string; note: Note; at: number }[] {
  const taken: [number, number][] = [];
  const hits: { find: string; note: Note; at: number }[] = [];
  for (const it of index) {
    let from = 0;
    while (true) {
      const at = termIndex(text, it.find, from);
      if (at < 0) break;
      const end = at + it.find.length;
      if (!taken.some(([s, e]) => at < e && end > s)) {
        taken.push([at, end]);
        hits.push({ ...it, at });
        break;
      }
      from = at + 1;
    }
  }
  const seen = new Set<string>();
  return hits
    .sort((a, b) => a.at - b.at)
    .filter((h) => {
      if (seen.has(h.note.term)) return false;
      seen.add(h.note.term);
      return true;
    });
}

/** 기사에 붙는 괄호 풀이(notes) 읽기 — [{ term, text }] */
export function parseNotes(raw: unknown): Note[] {
  let v: unknown = raw;
  if (typeof raw === "string") {
    try {
      v = JSON.parse(raw || "[]");
    } catch {
      return [];
    }
  }
  if (!Array.isArray(v)) return [];
  const s = (x: unknown, max: number) => (typeof x === "string" ? x.replace(/\s+/g, " ").trim().slice(0, max) : "");
  return v
    .map((n) => (n && typeof n === "object" ? (n as Record<string, unknown>) : {}))
    .map((n) => ({ term: s(n.term, 30), text: s(n.text, 60) }))
    .filter((n) => n.term && n.text)
    .slice(0, 6);
}
