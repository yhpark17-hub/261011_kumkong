import "server-only";
import type { ReactNode } from "react";
import { ARTICLE_WIDGETS, widgetsIn, type ArticleWidgetKey } from "@/lib/article-widgets";
import { COMPANIES, RECRUITMENTS } from "@/lib/data";
import { CATEGORY_META, CATEGORY_ORDER } from "@/lib/meta";
import type { Company } from "@/lib/types";
import {
  AMatchWidget,
  AlioStepsWidget,
  BlindCompareWidget,
  MajorFinderWidget,
  NcsAreasWidget,
  NcsTypesWidget,
  type AMatchDay,
  type BlindRow,
  type MajorCompany,
  type NcsArea,
  type WCategory,
  type WCompany,
} from "./ArticleWidgets";

/**
 * 글 본문의 {{블록}} 자리에 넣을 인터랙티브 블록 — 금콩 기관 정보에서 바로 계산 (숫자를 지어내지 않음)
 * 글 화면(서버)에서 만들어 <Markdown widgets={…} /> 로 넘겨요.
 */

const slim = (c: Company): WCompany => ({ id: c.id, short: c.shortName, name: c.name, cat: c.category });
const cats = (keys: Iterable<string>): WCategory[] => CATEGORY_ORDER.filter((k) => new Set(keys).has(k)).map((k) => ({ key: k, label: CATEGORY_META[k].label }));

/** NCS 직업기초능력 10개 영역 (+ 일부 기관이 따로 내는 '디지털') — 설명은 NCS 직업기초능력 정의를 짧게 */
const NCS_AREAS: NcsArea[] = [
  { key: "의사소통", label: "의사소통능력", desc: "글과 말을 읽고 들어 상대의 뜻을 파악하고, 내 뜻을 글과 말로 정확하게 전하는 능력이에요." },
  { key: "수리", label: "수리능력", desc: "사칙연산·통계·확률의 의미를 정확히 이해하고 업무에 적용하는 능력이에요. 표·그래프 해석이 많이 나와요." },
  { key: "문제해결", label: "문제해결능력", desc: "문제 상황을 논리적·창의적으로 생각해 올바르게 인식하고 해결하는 능력이에요." },
  { key: "자원관리", label: "자원관리능력", desc: "시간·예산·물적·인적 자원 가운데 필요한 것을 확인하고, 계획해서 배분하는 능력이에요." },
  { key: "조직이해", label: "조직이해능력", desc: "업무를 원활히 하기 위해 조직의 체제와 경영, 국제 동향을 이해하는 능력이에요." },
  { key: "정보", label: "정보능력", desc: "컴퓨터를 활용해 필요한 정보를 찾고, 분석해서 업무에 활용하는 능력이에요." },
  { key: "대인관계", label: "대인관계능력", desc: "함께 일하는 사람들과 문제없이 원만하게 협력하는 능력이에요." },
  { key: "직업윤리", label: "직업윤리", desc: "원만한 직업생활에 필요한 태도·매너와 올바른 직업관이에요." },
  { key: "기술", label: "기술능력", desc: "업무에 필요한 기술을 이해하고, 알맞은 기술을 골라 적용하는 능력이에요." },
  { key: "자기개발", label: "자기개발능력", desc: "자신을 이해하고 발전 목표를 세워 스스로 관리하며 이뤄 가는 능력이에요." },
  { key: "디지털", label: "디지털", desc: "NCS 10개 영역 밖에서 일부 기관이 따로 내는 영역이에요. 어떤 문제가 나오는지는 기관 공고를 확인하세요.", extra: true },
];

/** '의사소통능력(사무)' → '의사소통' */
const ncsKey = (s: string) => s.replace(/\s/g, "").replace(/\(.*?\)/g, "").replace(/능력$/, "");

function ncsAreas(title: string, hint: string) {
  const companies = COMPANIES.filter((c) => c.written.ncs.has)
    .map((c) => ({ ...slim(c), areas: [...new Set(c.written.ncs.subjects.map(ncsKey))].filter((k) => NCS_AREAS.some((a) => a.key === k)) }))
    .filter((c) => c.areas.length > 0);
  return <NcsAreasWidget title={title} hint={hint} areas={NCS_AREAS} companies={companies} cats={cats(companies.map((c) => c.cat))} />;
}

function majorFinder(title: string, hint: string) {
  const companies: MajorCompany[] = COMPANIES.filter((c) => c.written.major.type !== "unknown").map((c) => ({
    ...slim(c),
    majorType: c.written.major.type as MajorCompany["majorType"],
    subjects: (c.written.major.subjects ?? "").trim(),
  }));
  return <MajorFinderWidget title={title} hint={hint} companies={companies} cats={cats(companies.map((c) => c.cat))} />;
}

function aMatch(title: string, hint: string) {
  const byId = new Map(COMPANIES.map((c) => [c.id, c]));
  const days = new Map<string, AMatchDay["items"]>();
  for (const r of RECRUITMENTS) {
    const c = byId.get(r.companyId);
    if (!c) continue;
    for (const e of r.events) {
      if (e.type !== "written") continue;
      const list = days.get(e.date) ?? [];
      if (!list.some((x) => x.id === c.id)) list.push({ ...slim(c), expected: r.status === "expected" });
      days.set(e.date, list);
    }
  }
  const out: AMatchDay[] = [...days.entries()]
    .filter(([, items]) => items.length >= 2)
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([date, items]) => ({ date, items: items.sort((a, b) => CATEGORY_ORDER.indexOf(a.cat as Company["category"]) - CATEGORY_ORDER.indexOf(b.cat as Company["category"])) }));
  return <AMatchWidget title={title} hint={hint} days={out} financeCats={["finance", "fininfra"]} />;
}

function blindCompare(title: string, hint: string) {
  const rows: BlindRow[] = CATEGORY_ORDER.map((k) => {
    const list = COMPANIES.filter((c) => c.category === k);
    const pick = (b: Company["blind"]) => list.filter((c) => c.blind === b).map(slim);
    return { key: k, label: CATEGORY_META[k].label, groups: { full: pick("full"), partial: pick("partial"), none: pick("none"), unknown: pick("unknown") } };
  });
  return <BlindCompareWidget title={title} hint={hint} rows={rows} />;
}

const BUILD: Record<ArticleWidgetKey, (title: string, hint: string) => ReactNode> = {
  "ncs-areas": ncsAreas,
  "ncs-types": (t, h) => <NcsTypesWidget title={t} hint={h} />,
  "major-finder": majorFinder,
  "a-match": aMatch,
  "blind-compare": blindCompare,
  "alio-steps": (t, h) => <AlioStepsWidget title={t} hint={h} />,
};

/** 본문에 쓰인 블록만 만들어서 { 이름: 블록 } */
export function articleWidgets(body: string): Record<string, ReactNode> {
  return Object.fromEntries(widgetsIn(body).map((k) => [k, BUILD[k](ARTICLE_WIDGETS[k].label, ARTICLE_WIDGETS[k].hint)]));
}
