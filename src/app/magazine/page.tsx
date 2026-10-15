import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { Newspaper } from "lucide-react";
import { AdSlot } from "@/components/ads/AdSlot";
import { DbSection } from "@/components/db/DbSection";
import { DateBar, HeadlineCard, NewsRow, PopularNews } from "@/components/magazine/news";
import { MagazineShell } from "@/components/magazine/sections";
import { cn } from "@/components/ui";
import { todayKST } from "@/lib/date";
import { MAGAZINE_NAME, isBlogCategory, magazineHref } from "@/lib/magazine-meta";
import { NEWS_SECTIONS, briefingDateHref, isDateKey, type NewsItem } from "@/lib/news-meta";
import { latestNewsDate, newsByDate, newsDates, popularNews } from "@/lib/server/news";
import { AD_SLOTS } from "@/lib/site";

export const metadata: Metadata = {
  title: `데일리 브리핑 — 오늘의 금융·경제·시사 뉴스 | ${MAGAZINE_NAME}`,
  description:
    "금융공기업 준비생이 알아야 할 금융·경제·정책·국제·공공기관 뉴스를 분야별로 한 페이지에. 많이 본 뉴스와 필기·면접 포인트까지.",
  alternates: { canonical: "/magazine" },
};

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => ((Array.isArray(v) ? v[0] : v) ?? "").trim();

/** 매거진 · 데일리 브리핑 = 시사 뉴스 메인 */
export default function BriefingPage({ searchParams }: PageProps<"/magazine">) {
  return (
    <MagazineShell section="briefing">
      <DbSection noticeTitle="데일리 브리핑을 준비하고 있어요">
        <Suspense fallback={<NewsSkeleton />}>{searchParams.then((sp) => <NewsFront sp={sp as SP} />)}</Suspense>
      </DbSection>
    </MagazineShell>
  );
}

function NewsSkeleton() {
  return (
    <div className="mt-8 animate-pulse space-y-6">
      <div className="h-12 w-72 rounded-md bg-canvas-soft" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="h-72 rounded-2xl bg-canvas-soft" />
        <div className="h-72 rounded-2xl bg-canvas-soft" />
      </div>
      <div className="h-96 rounded-2xl bg-canvas-soft" />
    </div>
  );
}

async function NewsFront({ sp }: { sp: SP }) {
  // 예전 주소(/magazine?c=exam, ?q=) 는 금융 블로그로
  const c = one(sp.c);
  const q = one(sp.q);
  if (isBlogCategory(c) || q) redirect(magazineHref({ category: isBlogCategory(c) ? c : null, q: q || null }));

  await connection();
  const asked = one(sp.date);
  const [latest, dates, popular] = await Promise.all([latestNewsDate(), newsDates(30), popularNews(3, 5)]);
  const date = isDateKey(asked) ? asked : (latest ?? todayKST());
  const items = await newsByDate(date);

  const idx = dates.findIndex((d) => d.date === date);
  const prev = idx >= 0 ? (dates[idx + 1]?.date ?? null) : (dates.find((d) => d.date < date)?.date ?? null);
  const next = idx > 0 ? dates[idx - 1].date : idx === -1 ? ([...dates].reverse().find((d) => d.date > date)?.date ?? null) : null;

  const [headline, ...rest] = items;
  const bySection = NEWS_SECTIONS.map((s) => ({ s, list: rest.filter((n) => n.section === s.key) })).filter((g) => g.list.length);

  return (
    <div className="mt-8 space-y-10">
      <DateBar date={date} count={items.length} prev={prev} next={next} />

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-hairline-input px-6 py-14 text-center">
          <Newspaper className="mx-auto h-8 w-8 text-ink-mute-2" strokeWidth={1.5} />
          <p className="mt-3 type-heading-sm text-ink">이 날짜의 브리핑이 아직 없어요</p>
          {latest && latest !== date && (
            <Link href={briefingDateHref(latest)} className="btn btn-toggle btn-sm mt-5">
              가장 최근 브리핑 보기
            </Link>
          )}
        </div>
      ) : (
        <>
          {/* 분야 바로가기 — 한 페이지에 모두 있고, 누르면 그 분야로 이동 */}
          <nav aria-label="분야" className="no-scrollbar fade-x -mx-4 overflow-x-auto px-4 md:fade-x-none md:mx-0 md:px-0">
            <ul className="flex gap-2 [&>li]:shrink-0">
              {NEWS_SECTIONS.map((s) => {
                const n = items.filter((i) => i.section === s.key).length;
                return (
                  <li key={s.key}>
                    <a
                      href={n ? `#sec-${s.key}` : undefined}
                      aria-disabled={!n}
                      className={cn(
                        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-hairline px-3.5 py-2 type-caption",
                        n ? "text-ink-secondary hover:border-hairline-input" : "pointer-events-none text-ink-mute-2",
                      )}
                    >
                      <span className={cn("h-2 w-2 rounded-full", s.dot, !n && "opacity-30")} />
                      {s.label}
                      <span className="tabular text-ink-mute">{n}</span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
            {headline && <HeadlineCard n={headline} />}
            <PopularNews items={popular} />
          </div>

          {bySection.length > 0 && (
            <div className="space-y-10">
              {bySection.map(({ s, list }) => (
                <SectionBlock key={s.key} id={`sec-${s.key}`} label={s.label} desc={s.desc} dot={s.dot} list={list} />
              ))}
            </div>
          )}
        </>
      )}

      <AdSlot slot={AD_SLOTS.inFeed} variant="infeed" />

      {dates.length > 1 && (
        <section>
          <h2 className="type-heading-md text-ink">지난 브리핑</h2>
          <ul className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-7">
            {dates.slice(0, 14).map((d) => (
              <li key={d.date}>
                <Link
                  href={briefingDateHref(d.date)}
                  aria-current={d.date === date ? "page" : undefined}
                  className={cn(
                    "flex flex-col items-center rounded-xl border px-2 py-3 transition-colors",
                    d.date === date ? "border-brand-dark bg-brand-dark text-on-primary" : "border-hairline hover:border-hairline-input",
                  )}
                >
                  <span className="tabular type-heading-sm">{d.date.slice(5).replace("-", ".")}</span>
                  <span className={cn("type-micro", d.date === date ? "text-on-primary/70" : "text-ink-mute")}>뉴스 {d.count}건</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function SectionBlock({ id, label, desc, dot, list }: { id: string; label: string; desc: string; dot: string; list: NewsItem[] }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-24">
      <div className="flex items-baseline gap-3 border-b-2 border-ink pb-3">
        <span className={cn("h-3 w-3 shrink-0 self-center rounded-full", dot)} aria-hidden />
        <h2 id={`${id}-title`} className="type-heading-lg text-ink">
          {label}
        </h2>
        <span className="hidden type-caption text-ink-mute sm:inline">{desc}</span>
        <span className="ml-auto tabular type-caption text-ink-mute">{list.length}건</span>
      </div>
      <div className="grid md:grid-cols-2 md:gap-x-10">
        {list.map((n) => (
          <div key={n.id} className="border-b border-hairline">
            <NewsRow n={n} />
          </div>
        ))}
      </div>
    </section>
  );
}
