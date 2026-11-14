import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { DbSection } from "@/components/db/DbSection";
import { ArticleCard } from "@/components/magazine/parts";
import { EmptyLine, MagazineShell } from "@/components/magazine/sections";
import { WeeklyBand } from "@/components/magazine/WeeklyRoundup";
import { getWeekly } from "@/data/weekly";
import { MAGAZINE_NAME, articleHref, summaryLines } from "@/lib/magazine-meta";
import { latestWeekly, listArticles } from "@/lib/server/magazine";
import { isAdmin } from "@/lib/server/security";
import { pageMetadata } from "@/lib/site";
import { articleWeeklyIn } from "@/lib/weekly";

export const metadata: Metadata = pageMetadata({
  title: `금콩 주간 정리 — 한 주의 경제를 영상과 글로 | ${MAGAZINE_NAME}`,
  description: "매주 한 번, 이번 주 가장 중요한 경제 뉴스 하나를 깊게 풀고 금융·시사 뉴스와 금공 준비생을 위한 논술·면접 질문까지 영상과 글로 정리해요.",
  path: "/magazine/weekly",
});

/** 금콩 주간 정리 모아 보기 — 시사 뉴스의 세 번째 탭 (맨 위는 가장 최근 호를 크게) */
export default function WeeklyListPage() {
  return (
    <MagazineShell section="weekly">
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
  // 맨 위는 가장 최근 호 (운영자는 공개 전 초안도 미리 보기), 아래는 지난 호
  const [{ items: all }, first] = await Promise.all([listArticles({ category: "weekly", pageSize: 60 }), latestWeekly({ admin: await isAdmin() })]);
  const firstWeekly = first ? getWeekly(articleWeeklyIn(first.body)) : null;
  const rest = all.filter((a) => a.id !== first?.id);
  const items = first ? [first, ...rest] : all;
  return (
    <div className="mt-8">
      {items.length === 0 ? (
        <div className="mt-8">
          <EmptyLine text="첫 주간 정리를 준비하고 있어요. 매주 한 번 영상과 글로 찾아올게요." />
        </div>
      ) : (
        <>
          {first && firstWeekly && (
            <section aria-label="이번 주 정리">
              <p className="type-micro-cap text-primary-text">가장 최근 주간 정리</p>
              <div className="mt-3">
                <WeeklyBand
                  href={articleHref(first.id)}
                  title={first.title}
                  week={firstWeekly.week}
                  poster={firstWeekly.poster}
                  line={summaryLines(first.summary)[0] ?? firstWeekly.question}
                  topics={firstWeekly.topics}
                  draft={first.draft}
                />
              </div>
            </section>
          )}
          {(firstWeekly ? rest : items).length > 0 && (
            <h2 className="mt-12 type-heading-lg text-ink">
              지난 주간 정리
              <span className="ml-2 tabular type-body-md text-ink-mute">{(firstWeekly ? rest : items).length}편</span>
            </h2>
          )}
          {(firstWeekly ? rest : items).length > 0 && (
            <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {(firstWeekly ? rest : items).map((a) => (
                <ArticleCard key={a.id} a={a} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
