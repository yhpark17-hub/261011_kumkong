/**
 * 매거진 글 속 인터랙티브 블록 — 본문에 한 줄로 `{{블록 이름}}` 을 적으면 그 자리에 들어가요.
 * 내용은 금콩 기관 정보(필기 구성·전공·블라인드·필기 일정)에서 바로 가져와 숫자를 지어내지 않아요.
 * (서버·클라이언트 공용 — 편집기 '블록 넣기' 목록에도 씀)
 */

export const ARTICLE_WIDGETS = {
  "ncs-areas": { label: "NCS 10개 영역 — 기관별 출제 현황", hint: "영역을 누르면 그 영역을 내는 기관이 보여요" },
  "ncs-types": { label: "NCS 출제 유형 3가지 비교", hint: "PSAT형·모듈형·피듈형을 탭으로 비교" },
  "major-finder": { label: "내 전공으로 볼 수 있는 기관 찾기", hint: "전공을 고르면 그 과목이 있는 기관" },
  "a-match": { label: "필기 날짜가 겹치는 날 (A매치)", hint: "다가오는 필기 중 같은 날 치르는 기관" },
  "blind-compare": { label: "기관 분류별 블라인드 채용", hint: "분류마다 블라인드 채용 현황 막대" },
  "alio-steps": { label: "알리오 경쟁률 보는 법", hint: "단계별로 눌러 보는 안내" },
} as const;

export type ArticleWidgetKey = keyof typeof ARTICLE_WIDGETS;

export const isArticleWidget = (v: string): v is ArticleWidgetKey => v in ARTICLE_WIDGETS;

/** 글 전체를 인터랙티브 가이드로 바꾸는 블록 — 본문 맨 위 한 줄 */
export const ARTICLE_FEATURES = {
  "feature:written-exam": { label: "인터랙티브 가이드 — 금공 필기 입문", hint: "글 전체가 눌러 보며 배우는 7장짜리 가이드로 바뀌어요 (본문 맨 위 한 줄)" },
} as const;

export type ArticleFeatureKey = keyof typeof ARTICLE_FEATURES;

const isArticleFeature = (v: string): v is ArticleFeatureKey => v in ARTICLE_FEATURES;

/** 본문 한 줄이 블록 자리인지 — {{ncs-areas}} · {{feature:written-exam}} */
export const WIDGET_LINE = /^\s*\{\{\s*([a-z][a-z0-9:-]*)\s*\}\}\s*$/;

/** 블록 이름 → 편집기에 보일 이름·설명 */
export function blockInfo(name: string): { label: string; hint: string } | null {
  if (isArticleWidget(name)) return ARTICLE_WIDGETS[name];
  if (isArticleFeature(name)) return ARTICLE_FEATURES[name];
  return null;
}

/** 본문 첫 줄이 스토리 블록이면 그 이름 */
export function articleFeatureIn(body: string): ArticleFeatureKey | null {
  const first = body.split(/\r?\n/).find((l) => l.trim());
  const m = first?.match(WIDGET_LINE);
  return m && isArticleFeature(m[1]) ? m[1] : null;
}

/** 본문에 쓰인 블록 이름들 */
export function widgetsIn(body: string): ArticleWidgetKey[] {
  const out = new Set<ArticleWidgetKey>();
  for (const line of body.split(/\r?\n/)) {
    const m = line.match(WIDGET_LINE);
    if (m && isArticleWidget(m[1])) out.add(m[1]);
  }
  return [...out];
}
