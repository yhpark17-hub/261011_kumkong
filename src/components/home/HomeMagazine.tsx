import Link from "next/link";
import { connection } from "next/server";
import { Play } from "lucide-react";
import { IssueCover } from "@/components/magazine/news";
import { ArticleCover } from "@/components/magazine/parts";
import { getWeekly } from "@/data/weekly";
import { formatShort } from "@/lib/date";
import { BLOG_CATEGORIES, CATEGORY_INFO, SECTION_INFO, articleHref, formatArticleDate } from "@/lib/magazine-meta";
import { letterHref, volLabel } from "@/lib/news-meta";
import { listIssues } from "@/lib/server/briefing";
import { latestWeekly, listArticles } from "@/lib/server/magazine";
import { articleWeeklyIn } from "@/lib/weekly";
import { SectionHead } from "./HomeParts";

interface ShelfItem {
  key: string;
  href: string;
  thumb: React.ReactNode;
  kicker: string;
  sub: string;
  title: string;
  meta: string;
  /** 영상이 있는 글 — 그림 위에 '영상 + 글' */
  video?: boolean;
}

const THUMB = "absolute inset-0 h-full w-full";
const SIZES = "(min-width: 1024px) 280px, (min-width: 768px) 45vw, 236px";

/**
 * 홈 '금콩 매거진' — 오늘의 아침판 · 점심 3문제 · 한 주 경제 몰아보기 · 금융 블로그 새 글을 그림 카드 한 줄로.
 * 그림은 글마다 그린 썸네일 그대로 (사이트 틀에는 그림을 넣지 않고 여기서만).
 */
export async function HomeMagazine() {
  await connection();
  const [issues, weeklyArticle, blog] = await Promise.all([
    listIssues({ page: 1, pageSize: 6 }),
    latestWeekly({ admin: false }),
    listArticles({ categories: BLOG_CATEGORIES.map((c) => c.key), pageSize: 3 }),
  ]);
  const morning = issues.items.find((s) => s.issue.edition === "morning");
  const noon = issues.items.find((s) => s.issue.edition === "noon");
  const weekly = weeklyArticle ? getWeekly(articleWeeklyIn(weeklyArticle.body)) : null;

  const items: ShelfItem[] = [];
  if (morning) {
    const i = morning.issue;
    items.push({
      key: `m-${i.id}`,
      href: letterHref(i.date, "morning"),
      thumb: <IssueCover issue={i} className={THUMB} sizes={SIZES} />,
      kicker: "데일리 브리핑",
      sub: `아침판 ${volLabel(i.vol)}`,
      title: i.title,
      meta: `${formatShort(i.date)} · ${morning.minutes}분 읽기`,
    });
  }
  if (noon) {
    const i = noon.issue;
    items.push({
      key: `n-${i.id}`,
      href: letterHref(i.date, "noon"),
      thumb: <IssueCover issue={i} className={THUMB} sizes={SIZES} />,
      kicker: "점심 3문제",
      sub: volLabel(i.vol),
      title: i.title,
      meta: `${formatShort(i.date)} · 조회 ${i.views.toLocaleString()}`,
    });
  }
  if (weeklyArticle && weekly) {
    items.push({
      key: `w-${weeklyArticle.id}`,
      href: articleHref(weeklyArticle.id),
      // eslint-disable-next-line @next/next/no-img-element -- 영상 썸네일
      thumb: <img src={weekly.poster} alt="" loading="lazy" decoding="async" className={`${THUMB} object-cover`} />,
      kicker: SECTION_INFO.weekly.title,
      sub: weekly.week.replace(/^\d{4}년\s*/, ""),
      title: weeklyArticle.title,
      meta: `${weekly.range} · 영상 ${weekly.videoLength}`,
      video: true,
    });
  }
  // 블로그는 남은 칸만큼 (보통 한 편, 다른 칸이 비면 더)
  for (const a of blog.items.slice(0, Math.max(1, 4 - items.length))) {
    items.push({
      key: `b-${a.id}`,
      href: articleHref(a.id),
      thumb: <ArticleCover a={a} className={THUMB} sizes={SIZES} />,
      kicker: SECTION_INFO.blog.label,
      sub: CATEGORY_INFO[a.category].label,
      title: a.title,
      meta: `${a.publishedAt != null ? `${formatArticleDate(a.publishedAt)} · ` : ""}조회 ${a.views.toLocaleString()}`,
    });
  }
  if (!items.length) return null;

  return (
    <section aria-labelledby="home-magazine" className="mt-9 md:mt-[52px]">
      <SectionHead
        id="home-magazine"
        title="금콩 매거진"
        meta="매일 브리핑 · 매주 영상 · 금융 블로그"
        more={{ href: "/magazine" }}
        links={[
          { href: SECTION_INFO.briefing.href, label: SECTION_INFO.briefing.label },
          { href: SECTION_INFO.weekly.href, label: SECTION_INFO.weekly.label },
          { href: SECTION_INFO.blog.href, label: SECTION_INFO.blog.label },
        ]}
      />
      {/* 휴대폰: 옆으로 넘기는 카드 · 태블릿 2칸 · 컴퓨터 4칸 */}
      <ul className="no-scrollbar -mx-4 mt-3.5 flex snap-x scroll-px-4 gap-3.5 overflow-x-auto px-4 md:mx-0 md:mt-[18px] md:grid md:grid-cols-2 md:gap-6 md:overflow-visible md:px-0 lg:grid-cols-4">
        {items.map((it) => (
          <li key={it.key} className="w-[236px] shrink-0 snap-start md:w-auto">
            <Link href={it.href} className="group block">
              <span className="relative block aspect-[40/21] overflow-hidden rounded-xl bg-canvas-soft">
                {it.thumb}
                {it.video && (
                  <span className="absolute bottom-2.5 left-2.5 inline-flex h-[26px] items-center gap-[5px] rounded-md bg-[#141a33]/85 px-[9px] text-[12px] font-bold text-[#ffffff]">
                    <Play className="h-3 w-3 fill-current" strokeWidth={0} />
                    영상 + 글
                  </span>
                )}
              </span>
              <span className="mt-3 block text-[12.5px] font-extrabold text-accent-text">
                {it.kicker}
                <span className="ml-1 font-semibold text-ink-mute">{it.sub}</span>
              </span>
              <span className="mt-1 line-clamp-2 text-[15px] leading-[1.45] font-bold text-ink group-hover:underline md:text-[16px]">{it.title}</span>
              <span className="mt-1.5 block tabular text-[12.5px] font-semibold text-ink-mute">{it.meta}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function HomeMagazineSkeleton() {
  return (
    <div className="mt-9 animate-pulse md:mt-[52px]">
      <div className="h-7 w-36 rounded-md bg-canvas-soft" />
      <div className="mt-4 flex gap-3.5 overflow-hidden md:grid md:grid-cols-2 md:gap-6 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="w-[236px] shrink-0 md:w-auto">
            <div className="aspect-[40/21] rounded-xl bg-canvas-soft" />
            <div className="mt-3 h-4 w-24 rounded bg-canvas-soft" />
            <div className="mt-2 h-10 rounded bg-canvas-soft" />
          </div>
        ))}
      </div>
    </div>
  );
}
