import "server-only";
import { COMPANIES, RECRUITMENTS } from "@/lib/data";
import type { ArticleFeatureKey } from "@/lib/article-widgets";
import { WrittenExamStory, type StoryDay, type WrittenExamStoryData } from "./WrittenExamStory";

/**
 * 글 전체를 스크롤형 인터랙티브로 — 본문 맨 위에 {{feature:written-exam}} 한 줄
 * 숫자는 모두 금콩 기관 정보(필기 구성·전공·논술·필기 일정)에서 바로 계산
 */

/** NCS 10개 영역 — 기본 세 영역을 앞에 */
const NCS_ORDER = ["의사소통", "수리", "문제해결", "자원관리", "조직이해", "정보", "대인관계", "직업윤리", "기술", "자기개발"];
const ncsKey = (s: string) => s.replace(/\s/g, "").replace(/\(.*?\)/g, "").replace(/능력$/, "");

function writtenExamData(): WrittenExamStoryData {
  const fin = COMPANIES.filter((c) => c.category === "finance");
  const areasOf = (c: (typeof fin)[number]) => new Set(c.written.ncs.subjects.map(ncsKey));
  const known = fin.filter((c) => c.written.ncs.has && [...areasOf(c)].some((k) => NCS_ORDER.includes(k)));
  const majorTypes = { single: 0, integrated: 0, none: 0, unknown: 0 };
  for (const c of fin) majorTypes[c.written.major.type]++;

  const ids = new Map(COMPANIES.filter((c) => c.category === "finance" || c.category === "fininfra").map((c) => [c.id, c]));
  const byDate = new Map<string, StoryDay["items"]>();
  for (const r of RECRUITMENTS) {
    const c = ids.get(r.companyId);
    if (!c) continue;
    for (const e of r.events) {
      if (e.type !== "written") continue;
      const list = byDate.get(e.date) ?? [];
      if (!list.some((x) => x.id === c.id)) list.push({ id: c.id, short: c.shortName, expected: r.status === "expected" });
      byDate.set(e.date, list);
    }
  }
  const days = [...byDate.entries()]
    .filter(([, items]) => items.length >= 2)
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([date, items]) => ({ date, items }));

  return {
    total: fin.length,
    ncs: fin.filter((c) => c.written.ncs.has).length,
    major: majorTypes.single + majorTypes.integrated,
    essay: fin.filter((c) => (c.written.extra ?? []).some((x) => /논술/.test(x))).length,
    ncsKnown: known.length,
    areas: NCS_ORDER.map((k) => ({ label: k, count: known.filter((c) => areasOf(c).has(k)).length })),
    majorTypes,
    days,
  };
}

export function ArticleFeature({ name, title }: { name: ArticleFeatureKey; title: string }) {
  switch (name) {
    case "feature:written-exam":
      return <WrittenExamStory title={title} data={writtenExamData()} />;
  }
}
