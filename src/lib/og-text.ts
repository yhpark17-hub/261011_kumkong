/**
 * 썸네일 글자 맞추기 — 공유 썸네일 그리기(서버)와 관리자 화면(미리 넘침 경고)이 같이 써요.
 * 썸네일 그리기 도구는 '2%'·단어 중간에서도 줄을 바꿔서, 띄어쓰기에서만 직접 나눠요.
 */

/** 글자 폭 어림 (Pretendard, 글자 크기 1 기준) */
function charWidth(ch: string): number {
  if (/[ᄀ-ᇿ㄰-㆏가-힣]/.test(ch)) return 0.95;
  if (/\s/.test(ch)) return 0.28;
  if (/[.,·'’"()\-:!?]/.test(ch)) return 0.36;
  if (/[A-Z%$₩@&]/.test(ch)) return 0.72;
  if (/[0-9a-z]/.test(ch)) return 0.58;
  return 0.8;
}
const textWidth = (s: string, size: number) => [...s].reduce((w, ch) => w + charWidth(ch), 0) * size;

/**
 * 띄어쓰기에서만 줄을 바꿔 maxLines 줄로 나누기 — 썸네일 그리기 도구는 '2%'·단어 중간에서도 줄을 바꿔서 직접 나눠요.
 * 넘치면 마지막 줄 끝을 … 로.
 */
export function wrapLines(text: string, size: number, maxWidth: number, maxLines: number): { lines: string[]; overflow: boolean } {
  // 한 글자 낱말(한·두·첫·왜·더…)은 뒤 낱말과 붙여서 — '최악의 한 / 주' 처럼 갈라지지 않게
  const words: string[] = [];
  for (const w of text.trim().split(/\s+/)) {
    const prev = words.at(-1);
    if (prev !== undefined && /^[가-힣]$/.test(prev)) words[words.length - 1] = `${prev} ${w}`;
    else words.push(w);
  }
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (textWidth(next, size) <= maxWidth) cur = next;
    else {
      if (cur) lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  if (lines.length <= maxLines) return { lines, overflow: false };
  const kept = lines.slice(0, maxLines);
  let last = kept[maxLines - 1];
  while (last.length > 1 && textWidth(`${last}…`, size) > maxWidth) last = last.slice(0, -1);
  kept[maxLines - 1] = `${last.trimEnd()}…`;
  return { lines: kept, overflow: true };
}

/** 정해진 칸에 들어가는 가장 큰 글자 크기와 그때의 줄들 */
export function fitText(text: string, sizes: number[], maxWidth: number, maxLines: number): { size: number; lines: string[] } {
  for (const size of sizes) {
    const r = wrapLines(text, size, maxWidth, maxLines);
    if (!r.overflow) return { size, lines: r.lines };
  }
  const size = sizes[sizes.length - 1];
  return { size, lines: wrapLines(text, size, maxWidth, maxLines).lines };
}

/** 정해진 칸에 맞추기 — 앞 단계(큰 글자·적은 줄)부터, 다 넘치면 마지막 단계에서 … 로 자르고 overflow */
function fitSteps(text: string, width: number, steps: (readonly [readonly number[], number])[]): { size: number; lines: string[]; overflow: boolean } {
  for (const [sizes, max] of steps)
    for (const size of sizes) {
      const r = wrapLines(text, size, width, max);
      if (!r.overflow) return { size, lines: r.lines, overflow: false };
    }
  const [sizes, max] = steps[steps.length - 1];
  const size = sizes[sizes.length - 1];
  return { size, lines: wrapLines(text, size, width, max).lines, overflow: true };
}

/** 금콩 브리핑 제목 상자 (안쪽 폭 560) — 두 줄에 크게, 길면 세 줄 */
export const headlineFit = (text: string) =>
  fitSteps(text, 560, [
    [[52, 47, 43], 2],
    [[40, 37], 3],
  ]);

/** 금콩 브리핑 인물 발언 말풍선 (안쪽 폭 500) */
export const speechFit = (text: string) =>
  fitSteps(text, 500, [
    [[50, 45, 41], 2],
    [[38, 35], 3],
  ]);

/** 제목 상자 아래 사실 한 줄 (폭 560) */
export const captionFit = (text: string) =>
  fitSteps(text, 560, [
    [[26, 24], 1],
    [[23, 21], 2],
  ]);

export const TOPIC_W = 640;
/** 금콩 스터디 논술 주제 — 세 줄까지는 크게, 그래도 길면 네 줄로 작게. 그래도 넘치면 overflow (끝이 … 로 잘림) */
export function topicFit(text: string): { size: number; lines: string[]; overflow: boolean } {
  for (const [sizes, max] of [
    [[60, 56, 52, 48], 3],
    [[46, 43, 40, 37], 4],
  ] as const) {
    for (const size of sizes) {
      const r = wrapLines(text, size, TOPIC_W, max);
      if (!r.overflow) return { size, lines: r.lines, overflow: false };
    }
  }
  const r = wrapLines(text, 37, TOPIC_W, 4);
  return { size: 37, lines: r.lines, overflow: true };
}
