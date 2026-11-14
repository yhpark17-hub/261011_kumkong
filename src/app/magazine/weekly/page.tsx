import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { CalendarRange } from "lucide-react";
import { DbSection } from "@/components/db/DbSection";
import { ArticleCard } from "@/components/magazine/parts";
import { EmptyLine, MagazineShell } from "@/components/magazine/sections";
import { WeeklyBand } from "@/components/magazine/WeeklyRoundup";
import { getWeekly } from "@/data/weekly";
import { CATEGORY_INFO, MAGAZINE_NAME, articleHref, summaryLines } from "@/lib/magazine-meta";
import { getArticle, listArticles } from "@/lib/server/magazine";
import { pageMetadata } from "@/lib/site";
import { articleWeeklyIn } from "@/lib/weekly";

export const metadata: Metadata = pageMetadata({
  title: `금콩 주간 정리 — 한 주의 경제를 영상과 글로 | ${MAGAZINE_NAME}`,
  description: "매주 한 번, 이번 주 가장 중요한 경제 뉴스 하나를 깊게 풀고 금융·시사 뉴스와 금공 준비생을 위한 논술·면접 질문까지 영상과 글로 정리해요.",
  path: "/magazine/weekly",
});

/** 금콩 주간 정리 모아 보기 — 데일리 브리핑 쪽 (맨 위는 가장 최근 호를 크게) */
export default function WeeklyListPage() {
  return (
    <MagazineShell section="briefing">
      <DbSection noticeTitle="주간 정리를 준비하고 있어요">
        <Suspense fallback={<div className="mt-10 h-[300px] animate-pulse rounded-3xl bg-canvas-soft" />}>
          <WeeklyList />
        </Suspense>
      </DbSection>
    </MagazineShell>
  );
}

async function WeeklyList() {
  await connection();
  const { items } = await listArticles({ category: "weekly", pageSize: 60 });
  const [first, ...rest] = items;
  const firstDetail = first ? await getArticle(first.id) : null;
  const firstWeekly = firstDetail ? getWeekly(articleWeeklyIn(firstDetail.body)) : null;
  return (
    <div className="mt-8">
      <div className="flex items-center gap-2">
        <CalendarRange className="h-5 w-5 text-ink-mute" strokeWidth={1.75} />
        <h2 className="type-heading-lg text-ink">{CATEGORY_INFO.weekly.label}</h2>
        <span className="tabular type-body-md text-ink-mute">{items.length}편</span>
      </div>
      <p className="mt-1 type-body-md text-ink-mute">{CATEGORY_INFO.weekly.desc}</p>

      {items.length === 0 ? (
        <div className="mt-8">
          <EmptyLine text="첫 주간 정리를 준비하고 있어요. 매주 한 번 영상과 글로 찾아올게요." />
        </div>
      ) : (
        <>
          {first && firstWeekly && (
            <div className="mt-6">
              <WeeklyBand
                href={articleHref(first.id)}
                title={first.title}
                week={firstWeekly.week}
                poster={firstWeekly.poster}
                line={summaryLines(first.summary)[0] ?? firstWeekly.question}
                chapters={firstWeekly.glance.map((g) => g.title).slice(0, 4)}
              />
            </div>
          )}
          {(firstWeekly ? rest : items).length > 0 && (
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {(firstWeekly ? rest : items).map((a) => (
                <ArticleCard key={a.id} a={a} />
              ))}
            </div>
          )}
        </>
      )}

      <p className="mt-12">
        <Link href="/magazine" className="link type-caption">
          ← 데일리 브리핑으로
        </Link>
      </p>
    </div>
  );
}
