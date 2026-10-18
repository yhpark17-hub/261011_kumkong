import "server-only";
import type { EditorInitial } from "@/components/admin/ArticleEditor";
import { COMPANIES } from "../data";
import { DEFAULT_AUTHOR, EMPTY_ARTICLE_THUMB, TEMPLATES, msToKstInput, type ArticleDetail } from "../magazine-meta";
import { articleThumbPlan } from "./article-thumb";

/** 간판 기관 고르기 목록 (가나다순) */
const companyOptions = () => COMPANIES.map((c) => ({ id: c.id, name: c.name })).sort((a, b) => a.name.localeCompare(b.name, "ko"));

/** 운영자 편집기 초기값 — 서버에서 지금 시각 기준으로 상태를 계산 (requireAdmin 이후 호출) */

/** 내일 오전 7시 (한국 시각) — 예약 발행 기본값 */
function tomorrowMorning(now: number): string {
  const kst = new Date(now + 9 * 3600_000);
  const at = Date.UTC(kst.getUTCFullYear(), kst.getUTCMonth(), kst.getUTCDate() + 1, 7 - 9, 0);
  return msToKstInput(at);
}

/** 썸네일을 비워 두면 어떤 그림·기관이 들어가는지 */
function autoInfo(a: ArticleDetail): EditorInitial["thumbAuto"] {
  const { scene, company, companyName, kicker } = articleThumbPlan(a, EMPTY_ARTICLE_THUMB).auto;
  return { scene, company, companyName, kicker };
}

export function editorFromArticle(a: ArticleDetail, now = Date.now()): EditorInitial {
  const scheduled = a.status === 1 && a.publishedAt != null && a.publishedAt > now;
  return {
    id: a.id,
    category: a.category,
    title: a.title,
    summary: a.summary,
    coverUrl: a.coverUrl ?? "",
    body: a.body,
    tags: a.tags.join(", "),
    author: a.author,
    featured: a.featured,
    badge: a.badge ?? "",
    mode: a.status === 0 ? "draft" : scheduled ? "schedule" : "now",
    publishAt: scheduled && a.publishedAt ? msToKstInput(a.publishedAt) : tomorrowMorning(now),
    updatedAt: a.updatedAt,
    source: a.source,
    statusLabel: a.status === 0 ? "임시저장" : scheduled ? "예약 발행" : "공개 중",
    thumbScene: a.thumb.scene,
    thumbCompany: a.thumb.company,
    thumbKicker: a.thumb.kicker,
    thumbHeadline: a.thumb.headline,
    thumbSub: a.thumb.sub,
    thumbAuto: autoInfo(a),
    companies: companyOptions(),
  };
}

export function editorForNew(templateKey: string | null, now = Date.now()): EditorInitial {
  const t = TEMPLATES.find((x) => x.key === templateKey);
  const kst = new Date(now + 9 * 3600_000);
  return {
    id: null,
    category: t?.category ?? "knowledge",
    title: t ? t.title.replace("M월 D일", `${kst.getUTCMonth() + 1}월 ${kst.getUTCDate()}일`) : "",
    summary: t?.summary ?? "",
    coverUrl: "",
    body: t?.body ?? "",
    tags: "",
    author: DEFAULT_AUTHOR,
    featured: false,
    badge: "",
    mode: "draft",
    publishAt: tomorrowMorning(now),
    updatedAt: null,
    source: "admin",
    statusLabel: "새 글",
    thumbScene: "",
    thumbCompany: "",
    thumbKicker: "",
    thumbHeadline: "",
    thumbSub: "",
    thumbAuto: null,
    companies: companyOptions(),
  };
}
