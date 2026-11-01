// 자동 복사본 — 사이트 src/lib/format.ts에서 고친 뒤 scripts/sync-shared.mjs를 돌리세요.
export const nf = new Intl.NumberFormat("ko-KR");

/** 45.3 → "45.3 : 1", 114.5 → "114 : 1" */
export function formatRatio(ratio?: number | null) {
  if (ratio == null) return null;
  return `${ratio >= 100 ? Math.round(ratio) : ratio.toFixed(1).replace(/\.0$/, "")} : 1`;
}
