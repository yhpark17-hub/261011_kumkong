import "server-only";
import { COMPANIES } from "@/lib/data";
import { kstDateKey } from "@/lib/magazine-meta";
import type { ExamInfo } from "@/lib/review-meta";
import type { Company } from "@/lib/types";
import { examsForCompany } from "./reviews";

/**
 * 글에 나온 기관 → 기관 정보·필기 후기·실시간 톡으로 가는 칸
 * 태그와 제목 낱말이 기관 이름·줄임말과 맞으면 그 기관이에요 (예: '산업은행', '산은 필기', 제목의 '산은').
 */

export interface ArticleCompany {
  company: Company;
  /** 후기로 연결할 필기 — 다가오는 것 중 가장 가까운 것, 없으면 가장 최근 것 */
  exam?: ExamInfo;
}

function aliases(c: Company): string[] {
  const out = new Set([c.name, c.shortName]);
  // '한국산업은행' → '산업은행'
  if (c.name.startsWith("한국") && c.name.length >= 5) out.add(c.name.slice(2));
  return [...out].filter((x) => x.length >= 2);
}

const SPLIT = /[\s,·…!?'"“”‘’()[\]/|:]+/;

export function companiesInArticle(a: { title: string; tags: string[] }, limit = 2): ArticleCompany[] {
  const tags = a.tags.map((t) => t.trim()).filter(Boolean);
  const words = a.title.split(SPLIT).filter(Boolean);
  const hit = (w: string, al: string[]) => al.some((x) => w === x || w.startsWith(`${x} `));
  const scored: { c: Company; score: number }[] = [];
  for (const c of COMPANIES) {
    const al = aliases(c);
    // 태그에 나오면 2점, 제목 낱말에 나오면 1점
    const score = tags.filter((t) => hit(t, al)).length * 2 + words.filter((w) => hit(w, al)).length;
    if (score > 0) scored.push({ c, score });
  }
  const today = kstDateKey(Date.now());
  return scored
    .sort((x, y) => y.score - x.score)
    .slice(0, limit)
    .map(({ c }) => {
      const exams = examsForCompany(c.id).filter((e) => !e.expected);
      const upcoming = exams.filter((e) => e.date >= today).sort((x, y) => (x.date < y.date ? -1 : 1))[0];
      return { company: c, exam: upcoming ?? exams[0] };
    });
}
