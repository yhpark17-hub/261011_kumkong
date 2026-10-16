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

/** 본문 한 줄이 블록 자리인지 — {{ncs-areas}} */
export const WIDGET_LINE = /^\s*\{\{\s*([a-z][a-z0-9-]*)\s*\}\}\s*$/;

/** 본문에 쓰인 블록 이름들 */
export function widgetsIn(body: string): ArticleWidgetKey[] {
  const out = new Set<ArticleWidgetKey>();
  for (const line of body.split(/\r?\n/)) {
    const m = line.match(WIDGET_LINE);
    if (m && isArticleWidget(m[1])) out.add(m[1]);
  }
  return [...out];
}
