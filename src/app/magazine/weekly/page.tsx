import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { DbSection } from "@/components/db/DbSection";
import { EmptyLine, MagazineShell } from "@/components/magazine/sections";
import { WeeklyArchive, WeeklyBand, type WeeklyArchiveItem } from "@/components/magazine/WeeklyRoundup";
import { getWeekly } from "@/data/weekly";
import { MAGAZINE_NAME, SECTION_INFO, articleHref, summaryLines } from "@/lib/magazine-meta";
import { weeklyArticles } from "@/lib/server/magazine";
import { isAdmin } from "@/lib/server/security";
import { pageMetadata } from "@/lib/site";
import { articleWeeklyIn } from "@/lib/weekly";

export const metadata: Metadata = pageMetadata({
  title: `한 주 경제 몰아보기 — 한 주의 경제 뉴스를 영상 한 편으로 | ${MAGAZINE_NAME}`,
  description: "매주 한 번, 이번 주 가장 중요한 경제 뉴스 하나를 깊게 풀고 금융·시사 뉴스와 금공 준비생을 위한 논술·면접 질문까지 영상과 글로 정리해요.",
  path: "/magazine/weekly",
});

/** 한 주 경제 몰아보기 (예전 이름 '주간 정리') — 시사 뉴스의 두 번째 탭 (맨 위는 가장 최근 회를 크게) */
export default function WeeklyListPage() {
  return (
    <MagazineShell section="weekly">
      {/* 이름만 보고 무엇인지 알게 — 무엇(한 주 경제) · 어떻게(영상으로 몰아보기) */}
      <div className="mt-7 md:mt-9">
        <p className="text-[13.5px] font-extrabold text-accent-text">매주 영상 + 글</p>
        <h2 className="mt-1 text-[24px] leading-tight font-extrabold tracking-[-0.035em] text-ink md:text-[28px]">{SECTION_INFO.weekly.title}</h2>
        <p className="mt-1.5 type-body-md text-ink-secondary md:text-[15.5px]">{SECTION_INFO.weekly.desc}</p>
      </div>
      <DbSection noticeTitle="한 주 경제 몰아보기를 준비하고 있어요">
        <Suspense fallback={<div className="mt-10 h-[300px] animate-pulse rounded-3xl bg-canvas-soft" />}>
          <WeeklyList />
        </Suspense>
      </DbSection>
    </MagazineShell>
  );
}

async function WeeklyList() {
  await connection();
  // 회차 전체 (운영자는 공개 전 초안도) — 맨 위는 가장 최근 회차를 크게, 아래는 달마다 모아 보기
  const rows = await weeklyArticles({ admin: await isAdmin() });
  const items = rows.flatMap((a) => {
    const w = getWeekly(articleWeeklyIn(a.head));
    return w ? [{ a, w }] : [];
  });
  const first = items[0];
  const archive: WeeklyArchiveItem[] = items.map(({ a, w }, i) => ({
    id: a.id,
    href: articleHref(a.id),
    title: a.title,
    week: w.week,
    range: w.range,
    poster: w.poster,
    topics: w.topics,
    videoLength: w.videoLength,
    views: a.views,
    likes: a.likes,
    latest: i === 0,
    draft: a.draft,
  }));
  return (
    <div className="mt-8">
      {first ? (
        <section aria-label="가장 최근 몰아보기">
          <p className="type-micro-cap text-primary-text">가장 최근 몰아보기</p>
          <div className="mt-3">
            <WeeklyBand
              href={articleHref(first.a.id)}
              title={first.a.title}
              week={first.w.week}
              poster={first.w.poster}
              line={summaryLines(first.a.summary)[0] ?? first.w.question}
              topics={first.w.topics}
              draft={first.a.draft}
            />
          </div>
        </section>
      ) : (
        <EmptyLine text="첫 몰아보기를 준비하고 있어요. 매주 한 번 영상과 글로 찾아올게요." />
      )}

      <section aria-labelledby="weekly-archive-title" className="mt-14">
        <div className="border-b border-hairline pb-4">
          <h2 id="weekly-archive-title" className="type-heading-lg text-ink">
            지난 몰아보기
            <span className="ml-2 tabular type-body-md text-ink-mute">{archive.length}회</span>
          </h2>
          <p className="mt-0.5 type-caption text-ink-mute">지난 회차의 영상과 글을 다시 볼 수 있어요. 최신 회차가 맨 위예요.</p>
        </div>
        <div className="mt-6">
          <WeeklyArchive items={archive} />
        </div>
      </section>
    </div>
  );
}
