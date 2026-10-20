import "server-only";
import { getCompany } from "@/lib/data";
import {
  CATEGORY_INFO,
  summaryLines,
  type ArticleLayout,
  type ArticleSceneKey,
  type ArticleSummary,
  type ArticleThumb,
  type ArticleTone,
  type MagazineCategory,
} from "@/lib/magazine-meta";
import type { Company } from "@/lib/types";
import { companiesInArticle } from "./article-links";
import type { ScenePropKey } from "./article-scenes";

/**
 * 글 썸네일에 들어갈 값 — 운영자가 고친 값 > 자동.
 * 자동: 글에 기관이 나오면 그 기관 본사 건물 + 로고 간판, 아니면 카테고리 그림.
 * 제목은 글 제목('—' 앞), 아래 한 줄은 '—' 뒤나 요약 첫 줄.
 */

const CATEGORY_SCENE: Record<MagazineCategory, ArticleSceneKey> = {
  briefing: "knowledge",
  exam: "exam",
  deepdive: "knowledge",
  knowledge: "knowledge",
  starter: "starter",
  interview: "interview",
  story: "starter",
  insider: "insider",
  webtoon: "starter",
};

/** 기관 건물 앞 소품 */
const CATEGORY_PROP: Partial<Record<MagazineCategory, ScenePropKey>> = { exam: "exam", interview: "interview" };

function splitTitle(title: string): [string, string] {
  const i = title.indexOf(" — ");
  return i < 0 ? [title.trim(), ""] : [title.slice(0, i).trim(), title.slice(i + 3).trim()];
}

/** 자동 변형 — 글 번호로 번갈아 (이웃한 글끼리 같은 모양이 되지 않게) */
const TONE_ORDER: ArticleTone[] = ["day", "dusk", "night"];
const autoLayout = (id: number): ArticleLayout => (id % 2 === 1 ? "bold" : "card");
const autoTone = (id: number): ArticleTone => TONE_ORDER[((id % 3) + 3) % 3];

export interface ArticleThumbPlan {
  layout: ArticleLayout;
  tone: ArticleTone;
  scene: ArticleSceneKey;
  prop: ScenePropKey;
  company: Company | null;
  kicker: string;
  headline: string;
  sub: string;
  /** 자동이면 무엇인지 (관리자 화면 안내용) */
  auto: { layout: ArticleLayout; tone: ArticleTone; scene: ArticleSceneKey; company: string; companyName: string; kicker: string; headline: string; sub: string };
}

export function articleThumbPlan(a: Pick<ArticleSummary, "id" | "title" | "summary" | "tags" | "category">, thumb: ArticleThumb): ArticleThumbPlan {
  const detected = companiesInArticle(a)[0]?.company ?? null;
  const company = (thumb.company ? getCompany(thumb.company) : undefined) ?? detected;
  const autoScene: ArticleSceneKey = detected ? "company" : CATEGORY_SCENE[a.category];
  let scene = thumb.scene || (company ? "company" : autoScene);
  if (scene === "company" && !company) scene = CATEGORY_SCENE[a.category];
  const [main, rest] = splitTitle(a.title);
  const label = CATEGORY_INFO[a.category].label;
  const kickerFor = (c: Company | null) => (c ? `${c.shortName} ${label}` : label);
  const autoSub = rest || summaryLines(a.summary)[0] || "";
  return {
    layout: thumb.layout || autoLayout(a.id),
    tone: thumb.tone || autoTone(a.id),
    scene,
    prop: CATEGORY_PROP[a.category] ?? "doc",
    company,
    kicker: thumb.kicker || kickerFor(scene === "company" ? company : null),
    headline: thumb.headline || main,
    sub: thumb.sub || autoSub,
    auto: { layout: autoLayout(a.id), tone: autoTone(a.id), scene: autoScene, company: detected?.id ?? "", companyName: detected?.name ?? "", kicker: kickerFor(detected), headline: main, sub: autoSub },
  };
}
