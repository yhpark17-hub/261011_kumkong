import Link from "next/link";
import { connection } from "next/server";
import { ArrowRight } from "lucide-react";
import { KongMascot } from "@/components/magazine/KongMascot";
import { ArticleRow } from "@/components/magazine/parts";
import { formatDayHeading } from "@/lib/date";
import { BLOG_CATEGORIES, SECTION_INFO } from "@/lib/magazine-meta";
import { EDITION_LABEL, EDITION_SLOT, NEWS_SECTION_INFO, itemHref, letterHref, type BriefingIssue, type NewsItem } from "@/lib/news-meta";
import { arrangeLetter, issueItems, latestIssue } from "@/lib/server/briefing";
import { listArticles } from "@/lib/server/magazine";
import { popularNews } from "@/lib/server/news";
import { cn } from "../ui";
import { BriefingCarousel, type BriefingSlide } from "./BriefingCarousel";

/** 브리핑 한 장 — 머리(콩이·판 이름·아침판/점심판 꼬리표·날짜) + 제목 + 세 줄. 아침판은 크림·갈색, 점심판은 보라 */
function Slide({ issue, rows }: { issue: BriefingIssue; rows: { n: NewsItem; tag: string; badge?: string; text: string }[] }) {
  const noon = issue.edition === "noon";
  const href = letterHref(issue.date, issue.edition);
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <KongMascot className="h-9 w-9 shrink-0" {...(noon ? { hold: "book" as const, glasses: true } : { hold: "news" as const })} />
          <div className="min-w-0">
            <h2 className="flex items-center gap-1.5 type-heading-sm text-ink">
              {EDITION_LABEL[issue.edition]}
              {/* 갈색(lemon)은 어두운 화면에서 밝아지므로 글자는 바탕색(canvas)으로 */}
              <span className={cn("rounded-full px-2 py-0.5 type-micro font-bold", noon ? "bg-primary text-on-primary" : "bg-lemon text-canvas")}>
                {EDITION_SLOT[issue.edition]}
              </span>
            </h2>
            <p className="truncate type-caption text-ink-mute">
              {formatDayHeading(issue.date)} · {noon ? "용어·면접 공부" : "오늘의 기사"}
            </p>
          </div>
        </div>
        <Link href={href} className="link inline-flex shrink-0 items-center gap-1 type-caption">
          {noon ? "스터디 읽기" : "브리핑 읽기"}
          <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} />
        </Link>
      </div>
      <Link href={href} className="mt-4 block type-heading-md text-ink [word-break:keep-all] hover:underline">
        {issue.title}
      </Link>
      {rows.length > 0 && (
        <ol className="mt-3 space-y-2">
          {rows.map(({ n, tag, badge, text }, i) => (
            <li key={n.id}>
              <Link href={itemHref(n)} className="group flex items-start gap-2.5 rounded-lg bg-canvas px-3 py-2.5">
                {badge ? (
                  <span className="mt-0.5 inline-flex h-5 shrink-0 items-center rounded-md bg-primary px-1.5 type-micro font-bold text-on-primary">{badge}</span>
                ) : (
                  <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-lemon tabular type-micro font-bold text-canvas">
                    {i + 1}
                  </span>
                )}
                <span className="min-w-0">
                  <span className="block truncate type-body-md font-semibold text-ink group-hover:underline">{text}</span>
                  <span className="block truncate type-caption text-ink-mute">{tag}</span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

/** 홈: 금콩 브리핑(아침판)·금콩 스터디(점심판) 최신 호를 번갈아 (요청 시 렌더링) */
export async function BriefingStrip() {
  await connection();
  const [morning, noon] = await Promise.all([latestIssue("morning"), latestIssue("noon")]);
  const slides: BriefingSlide[] = [];
  if (morning) {
    const top = arrangeLetter(await issueItems(morning.date, "morning")).top;
    slides.push({
      key: "morning",
      label: EDITION_LABEL.morning,
      sub: "아침 기사",
      content: <Slide issue={morning} rows={top.map((n) => ({ n, text: n.title, tag: `${NEWS_SECTION_INFO[n.section].label}${n.takeaway ? ` · ${n.takeaway}` : ""}` }))} />,
    });
  }
  if (noon) {
    const { terms, questions } = arrangeLetter(await issueItems(noon.date, "noon"));
    const rows = [
      ...terms.map((n) => ({ n, text: n.title, tag: "오늘의 용어", badge: "용어" })),
      ...questions.map((n) => ({ n, text: `Q. ${n.title}`, tag: "오늘의 면접 질문", badge: "면접" })),
    ].slice(0, 3);
    slides.push({ key: "noon", label: EDITION_LABEL.noon, sub: "점심 공부", content: <Slide issue={noon} rows={rows} /> });
  }
  if (!slides.length) {
    return (
      <section aria-label="오늘의 브리핑" className="flex h-full flex-col rounded-xl bg-canvas-cream p-6">
        <h2 className="flex items-center gap-2 type-heading-md text-ink">
          <KongMascot className="h-7 w-7" />
          데일리 브리핑
        </h2>
        <p className="mt-4 type-body-md text-ink-mute">매일 아침 기사 브리핑, 점심에는 금콩 스터디로 찾아올게요.</p>
      </section>
    );
  }
  return <BriefingCarousel slides={slides} />;
}

/** 홈: 금융 블로그 새 글 (강조 표시 포함) */
export async function BlogStrip() {
  await connection();
  const latest = await listArticles({ categories: BLOG_CATEGORIES.map((c) => c.key), pageSize: 3 });
  return (
    <section aria-label={SECTION_INFO.blog.label} className="flex h-full flex-col rounded-xl border border-hairline p-6">
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
        <div className="flex items-center justify-between gap-3 rounded-lg bg-canvas-soft px-4 py-3">
          <p className="min-w-0 type-caption text-ink-secondary [word-break:keep-all]">필기 준비법·면접 전략·금공 지식을 깊이 있게</p>
          <Link href={SECTION_INFO.blog.href} className="btn btn-sm btn-toggle shrink-0 bg-canvas">
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
    <section aria-labelledby="popular-title" className="flex h-full flex-col rounded-xl border border-hairline p-6">
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
              <span className="w-5 shrink-0 text-center tabular type-heading-sm text-primary-text">{i + 1}</span>
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
  return <div className="h-80 animate-pulse rounded-xl bg-canvas-soft" />;
}
