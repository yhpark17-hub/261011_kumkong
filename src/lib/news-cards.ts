/** 카드뉴스 — 아침판 기사 한 건을 옆으로 넘겨 보는 카드 몇 장으로. 서버·클라이언트 공통 */

/**
 * 기사 카드 한 장. 맨 앞 표지(제목·한 줄 요약)와 맨 뒤 '왜 중요할까'(point) 장은 기사에서 자동으로 만들고,
 * 이건 그 사이 장들 — 처음 보는 사람도 알 수 있게 쉽게 풀어 쓴 설명과 그림(숫자·비교·변화·흐름)이에요.
 *   text   쉽게 말하면 — 소제목 + 짧은 설명
 *   stat   숫자로 보기 — 큰 숫자 하나 + 무슨 숫자인지
 *   bars   비교해 보기 — 같은 단위 숫자 2~5개를 막대로 (막대 길이는 적힌 숫자에서 계산)
 *   change 무엇이 바뀌었나 — 전 → 후 (오름·내림은 숫자에서 계산)
 *   flow   흐름으로 보기 — 원인 → 결과 2~4단계
 *   term   용어 풀이 — 기사에 나온 어려운 말 하나
 */
export type NewsCard =
  | { type: "text"; title: string; text: string }
  | { type: "stat"; value: string; label: string; note: string }
  | { type: "bars"; title: string; bars: { label: string; value: string; hi: boolean }[]; note: string }
  | { type: "change"; title: string; rows: { label: string; from: string; to: string }[]; note: string }
  | { type: "flow"; title: string; steps: string[] }
  | { type: "term"; term: string; text: string };

export type NewsCardType = NewsCard["type"];

/** 그림이 있는 카드 — 기사마다 하나 이상 */
export const VISUAL_CARDS: ReadonlySet<NewsCardType> = new Set(["stat", "bars", "change", "flow"]);

/** 기사 한 건의 사이 카드 수 (표지·'왜 중요할까' 장 빼고) */
export const CARD_COUNT = { min: 2, max: 4 };

/** 카드에 들어가는 글 길이 — 휴대폰 한 장에 넘치지 않게 (넘으면 자동 점검에서 고쳐 올려요) */
export const CARD_LEN = { title: 28, text: 110, value: 16, label: 30, note: 60, step: 34, term: 20, barLabel: 14, rowLabel: 16, point: 130 };

const str = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "");
const obj = (v: unknown) => (v && typeof v === "object" ? (v as Record<string, unknown>) : {});

/** 저장된 카드(JSON 글 또는 배열) → 카드 목록. 모양이 틀린 장은 빼요 (넉넉히 자르고, 길이 안내는 checkCards 가) */
export function parseCards(raw: unknown): NewsCard[] {
  let v: unknown = raw;
  if (typeof raw === "string") {
    try {
      v = JSON.parse(raw || "[]");
    } catch {
      return [];
    }
  }
  if (!Array.isArray(v)) return [];
  const out: NewsCard[] = [];
  for (const item of v.slice(0, 8)) {
    const c = obj(item);
    if (c.type === "text") {
      const card = { type: "text" as const, title: str(c.title, 60), text: str(c.text, 240) };
      if (card.text) out.push(card);
    } else if (c.type === "stat") {
      const card = { type: "stat" as const, value: str(c.value, 30), label: str(c.label, 60), note: str(c.note, 120) };
      if (card.value && card.label) out.push(card);
    } else if (c.type === "bars") {
      const bars = (Array.isArray(c.bars) ? c.bars : [])
        .map(obj)
        .map((b) => ({ label: str(b.label, 30), value: str(b.value, 30), hi: b.hi === true }))
        .filter((b) => b.label && b.value)
        .slice(0, 5);
      if (bars.length >= 2) out.push({ type: "bars", title: str(c.title, 60), bars, note: str(c.note, 120) });
    } else if (c.type === "change") {
      const rows = (Array.isArray(c.rows) ? c.rows : [])
        .map(obj)
        .map((r) => ({ label: str(r.label, 30), from: str(r.from, 30), to: str(r.to, 30) }))
        .filter((r) => r.label && r.from && r.to)
        .slice(0, 3);
      if (rows.length) out.push({ type: "change", title: str(c.title, 60), rows, note: str(c.note, 120) });
    } else if (c.type === "flow") {
      const steps = (Array.isArray(c.steps) ? c.steps : []).map((s) => str(s, 60)).filter(Boolean).slice(0, 4);
      if (steps.length >= 2) out.push({ type: "flow", title: str(c.title, 60), steps });
    } else if (c.type === "term") {
      const card = { type: "term" as const, term: str(c.term, 40), text: str(c.text, 240) };
      if (card.term && card.text) out.push(card);
    }
  }
  return out;
}

const BIG: Record<string, number> = { 조: 1e12, 억: 1e8, 만: 1e4 };
const SMALL: Record<string, number> = { 천: 1e3, 백: 1e2, 십: 10 };

/**
 * 글로 적힌 양 → 숫자와 단위. '1166억달러' → 1166e8·달러, '137억4천만달러' → 137.4e8·달러, '9만5천명' → 95000·명, '3.43%' → 3.43·%.
 * 막대 길이·오름내림을 적힌 글에서 바로 계산해서, 글과 그림이 어긋나지 않게 해요. 숫자가 없으면 null
 */
export function amountOf(s: string): { n: number; unit: string } | null {
  const start = s.search(/\d/);
  if (start < 0) return null;
  const re = /(\d[\d,]*(?:\.\d+)?)([천백십])?([조억만])?\s*/y;
  re.lastIndex = start;
  let n = 0;
  let end = start;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s))) {
    const v = Number(m[1].replace(/,/g, ""));
    if (!Number.isFinite(v)) return null;
    n += v * (m[2] ? SMALL[m[2]] : 1) * (m[3] ? BIG[m[3]] : 1);
    end = re.lastIndex;
    // 큰 단위(조·억·만)가 붙어야 뒤에 숫자가 더 이어져요 (예: 1조 4천억)
    if (!m[3]) break;
  }
  return { n, unit: s.slice(end).replace(/[\s↑↓▲▼]/g, "") };
}

/** 카드 글 전부 — 숫자 확인용 */
export function cardTexts(c: NewsCard): string[] {
  switch (c.type) {
    case "text":
      return [c.title, c.text];
    case "stat":
      return [c.value, c.label, c.note];
    case "bars":
      return [c.title, c.note, ...c.bars.flatMap((b) => [b.label, b.value])];
    case "change":
      return [c.title, c.note, ...c.rows.flatMap((r) => [r.label, r.from, r.to])];
    case "flow":
      return [c.title, ...c.steps];
    case "term":
      return [c.term, c.text];
  }
}

/** 카드에서 숫자+단위로 적는 칸 (큰 숫자·막대·전후) — 이 글은 기사에 통째로 있어야 해요 */
function amountTexts(c: NewsCard): string[] {
  if (c.type === "stat") return [c.value];
  if (c.type === "bars") return c.bars.map((b) => b.value);
  if (c.type === "change") return c.rows.flatMap((r) => [r.from, r.to]);
  return [];
}

/**
 * 자동 점검이 올린 카드 확인 — 고칠 점(없으면 빈 배열).
 * corpus = 그 기사 글(제목·한 줄 요약·요약·포인트)을 띄어쓰기·따옴표를 지우고 이은 것 (plainCorpus).
 * 카드 속 숫자는 전부 여기에 있어야 하고, 숫자+단위 칸(value·from·to)은 글자 그대로 있어야 해요 (지어낸 숫자 방지)
 */
export function checkCards(raw: unknown, cards: NewsCard[], corpus: string): string[] {
  const problems: string[] = [];
  const rawLen = Array.isArray(raw) ? raw.length : 0;
  if (cards.length !== rawLen) problems.push("모양이 틀린 카드가 있어요 (type 과 칸 이름을 확인해 주세요)");
  if (cards.length < CARD_COUNT.min || cards.length > CARD_COUNT.max) problems.push(`카드는 ${CARD_COUNT.min}~${CARD_COUNT.max}장이에요 (지금 ${cards.length}장)`);
  if (!cards.some((c) => VISUAL_CARDS.has(c.type))) problems.push("그림 카드(stat·bars·change·flow)가 하나 이상 있어야 해요");
  const long = (label: string, text: string, max: number) => {
    if (text.length > max) problems.push(`${label} "${text.slice(0, 20)}…" 가 ${max}자보다 길어요 (${text.length}자)`);
  };
  cards.forEach((c, i) => {
    const at = `cards[${i}] ${c.type}`;
    for (const n of cardTexts(c).join(" ").match(/\d[\d,.]*\d|\d/g) ?? []) {
      if (!corpus.includes(n)) problems.push(`${at}: 숫자 "${n}" 가 이 기사 글에 없어요`);
    }
    for (const v of amountTexts(c)) {
      if (!corpus.includes(v.replace(/[\s'"‘’“”·…]/g, ""))) problems.push(`${at}: "${v}" 가 이 기사 글에 그대로 없어요 (숫자+단위는 기사에 적힌 그대로)`);
    }
    if (c.type === "text") {
      long(`${at} title`, c.title, CARD_LEN.title);
      long(`${at} text`, c.text, CARD_LEN.text);
    } else if (c.type === "stat") {
      long(`${at} value`, c.value, CARD_LEN.value);
      long(`${at} label`, c.label, CARD_LEN.label);
      long(`${at} note`, c.note, CARD_LEN.note);
    } else if (c.type === "bars") {
      long(`${at} title`, c.title, CARD_LEN.title);
      long(`${at} note`, c.note, CARD_LEN.note);
      const amounts = c.bars.map((b) => amountOf(b.value));
      if (amounts.some((a) => !a || a.n <= 0)) problems.push(`${at}: 막대 value 는 0보다 큰 숫자여야 해요 (예: "1166억달러")`);
      else if (new Set(amounts.map((a) => a!.unit)).size > 1) problems.push(`${at}: 막대끼리 단위가 같아야 해요 (${amounts.map((a) => a!.unit || "단위 없음").join(" · ")})`);
      c.bars.forEach((b) => long(`${at} 막대 label`, b.label, CARD_LEN.barLabel));
    } else if (c.type === "change") {
      long(`${at} title`, c.title, CARD_LEN.title);
      long(`${at} note`, c.note, CARD_LEN.note);
      for (const r of c.rows) {
        long(`${at} label`, r.label, CARD_LEN.rowLabel);
        const a = amountOf(r.from);
        const b = amountOf(r.to);
        if (!a || !b) problems.push(`${at}: from·to 는 숫자여야 해요 ("${r.from}" → "${r.to}")`);
        else if (a.unit !== b.unit) problems.push(`${at}: from·to 단위가 같아야 해요 ("${r.from}" → "${r.to}")`);
      }
    } else if (c.type === "flow") {
      long(`${at} title`, c.title, CARD_LEN.title);
      c.steps.forEach((s) => long(`${at} step`, s, CARD_LEN.step));
    } else if (c.type === "term") {
      long(`${at} term`, c.term, CARD_LEN.term);
      long(`${at} text`, c.text, CARD_LEN.text);
    }
  });
  return problems;
}
