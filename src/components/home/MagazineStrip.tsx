import Link from "next/link";
import { connection } from "next/server";
import { ArrowRight } from "lucide-react";
import { KongMascot } from "@/components/magazine/KongMascot";
import { IssueCover } from "@/components/magazine/news";
import { ArticleRow } from "@/components/magazine/parts";
import { WeeklyStrip } from "@/components/magazine/WeeklyRoundup";
import { getWeekly } from "@/data/weekly";
import { addDays, parseKey, todayKST } from "@/lib/date";
import { BLOG_CATEGORIES, SECTION_INFO, articleHref, kstDateKey } from "@/lib/magazine-meta";
import { NEWS_SECTION_INFO, itemHref, letterHref } from "@/lib/news-meta";
import { latestIssue } from "@/lib/server/briefing";
import { latestWeekly, listArticles } from "@/lib/server/magazine";
import { articleWeeklyIn } from "@/lib/weekly";
import { popularNews } from "@/lib/server/news";

/**
 * 홈 오른쪽 칸 — 오늘의 브리핑(그림 + 제목 + 읽기) · 점심 3문제 한 줄 · 이번 주 정리 띠.
 * 아침판이 아직 없으면(새벽) 가장 최근 호, 점심판은 12:30 전이면 어제 것이 보여요 (날짜를 같이 적어요).
 */
export async function TodayBriefing() {
  await connection();
  const today = todayKST();
  const [morning, noon, weeklyArticle] = await Promise.all([latestIssue("morning"), latestIssue("noon"), latestWeekly({ admin: false })]);
  const weeklyFresh = weeklyArticle && weeklyArticle.publishedAt != null && kstDateKey(weeklyArticle.publishedAt) >= addDays(today, -9);
  const weekly = weeklyArticle && weeklyFresh ? getWeekly(articleWeeklyIn(weeklyArticle.body)) : null;
  const md = (key: string) => `${parseKey(key).m}월 ${parseKey(key).d}일`;

  if (!morning && !noon) {
    return (
      <section aria-label="오늘의 브리핑" className="card flex h-full flex-col justify-center bg-butter p-6 shadow-level-1">
        <KongMascot className="h-12 w-12" hold="news" />
        <h2 className="mt-3 type-heading-md text-ink">데일리 브리핑</h2>
        <p className="mt-1 type-body-md text-ink-mute">매일 아침 기사 브리핑, 점심에는 점심 3문제로 찾아올게요.</p>
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-3.5">
      {morning && (
        <article aria-labelledby="home-brief-title" className="card overflow-hidden shadow-level-1">
          <Link href={letterHref(morning.date, "morning")} tabIndex={-1} aria-hidden className="block">
            <IssueCover issue={morning} className="aspect-[40/21] w-full" sizes="(min-width: 1024px) 480px, 100vw" />
          </Link>
          <div className="p-5 md:p-6">
            <p className="text-[13px] leading-5 font-extrabold text-accent-text">
              {morning.date === today ? "오늘의 금콩 브리핑" : `${md(morning.date)} 금콩 브리핑`} · 아침판
            </p>
            <h2 id="home-brief-title" className="mt-1.5 text-[19px] leading-snug font-extrabold text-ink [word-break:keep-all] md:text-[21px]">
              <Link href={letterHref(morning.date, "morning")} className="hover:underline">
                {morning.title}
              </Link>
            </h2>
            <Link href={letterHref(morning.date, "morning")} className="btn btn-primary mt-4 max-md:w-full">
              브리핑 읽기
              <ArrowRight className="h-4 w-4" strokeWidth={2} />
            </Link>
          </div>
        </article>
      )}
      {noon && (
        <Link href={letterHref(noon.date, "noon")} className="group flex items-center gap-3.5 rounded-[22px] bg-lavender p-3 pr-4 transition-shadow hover:shadow-level-1">
          <IssueCover issue={noon} size="sm" className="aspect-[40/21] w-28 shrink-0 rounded-xl md:w-32" sizes="128px" />
          <span className="min-w-0">
            <span className="block text-[12px] leading-4 font-extrabold text-primary-text">
              점심 3문제 · {noon.date === today ? "오늘" : md(noon.date)}
            </span>
            <span className="mt-1 line-clamp-2 text-[14px] leading-snug font-bold text-ink [word-break:keep-all] group-hover:underline">{noon.title}</span>
          </span>
        </Link>
      )}
      {weeklyArticle && weekly && <WeeklyStrip href={articleHref(weeklyArticle.id)} title={weeklyArticle.title} week={weekly.week} poster={weekly.poster} />}
    </div>
  );
}

/** 홈: 금융 블로그 새 글 (강조 표시 포함) */
export async function BlogStrip() {
  await connection();
  const latest = await listArticles({ categories: BLOG_CATEGORIES.map((c) => c.key), pageSize: 3 });
  return (
    <section aria-label={SECTION_INFO.blog.label} className="card flex h-full flex-col p-6 shadow-level-1">
      <div className="flex items-center justify-between">
        <h2 className="type-heading-md text-ink">{SECTION_INFO.blog.label}</h2>
        <Link href={SECTION_INFO.blog.href} className="link inline-flex items-center gap-1 type-caption">
          전체
          <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} />
        </Link>
      </div>
      {latest.items.length ? (
        <div className="mt-1 divide-y divide-hairline">
          {latest.items.map((a) => (
            <ArticleRow key={a.id} a={a} />
          ))}
        </div>
      ) : (
        <p className="py-6 type-body-md text-ink-mute">필기·면접·금공 지식 글을 준비하고 있어요.</p>
      )}
      {/* 글이 적어도 칸이 비어 보이지 않게 맨 아래 붙는 줄 */}
      <div className="mt-auto pt-4">
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-canvas-soft px-4 py-3">
          <p className="min-w-0 type-caption text-ink-secondary [word-break:keep-all]">필기 준비법·면접 전략·금공 지식을 깊이 있게</p>
          <Link href={SECTION_INFO.blog.href} className="btn btn-sm btn-secondary shrink-0">
            블로그 보기
          </Link>
        </div>
      </div>
    </section>
  );
}

/** 홈: 많이 본 브리핑 기사 1~5위 (조회가 아직 없으면 '새 브리핑 기사' — 없는 인기를 꾸미지 않음) */
export async function PopularBriefing() {
  await connection();
  const items = await popularNews(7, 5);
  if (!items.length) return null;
  const ranked = items.some((n) => n.views > 0);
  return (
    <section aria-labelledby="popular-title" className="card flex h-full flex-col p-6 shadow-level-1">
      <div className="flex items-center justify-between">
        <h2 id="popular-title" className="type-heading-md text-ink">
          {ranked ? "많이 본 브리핑 기사" : "새 브리핑 기사"}
        </h2>
        <Link href="/magazine" className="link inline-flex items-center gap-1 type-caption">
          전체
          <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} />
        </Link>
      </div>
      <p className="mt-0.5 type-caption text-ink-mute">최근 7일{ranked ? " · 조회 많은 순" : ""}</p>
      <ol className="mt-2 divide-y divide-hairline">
        {items.map((n, i) => (
          <li key={n.id}>
            <Link href={itemHref(n)} className="group flex items-start gap-3 py-3">
              <span className="w-5 shrink-0 text-center font-display text-[20px] leading-6 text-accent-text">{i + 1}</span>
              <span className="min-w-0">
                <span className="line-clamp-2 type-body-md font-semibold text-ink [word-break:keep-all] group-hover:underline">{n.title}</span>
                <span className="mt-0.5 block truncate type-caption text-ink-mute">{NEWS_SECTION_INFO[n.section].label}</span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function StripSkeleton() {
  return <div className="h-80 animate-pulse rounded-3xl bg-canvas-soft" />;
}
