import Link from "next/link";
import { connection } from "next/server";
import { ChevronRight } from "lucide-react";
import { buildEvents } from "@/lib/catalog-client";
import { buildCatalog } from "@/lib/data";
import { ddayLabel, diffDays, formatShort, todayKST } from "@/lib/date";
import { EVENT_META } from "@/lib/meta";
import type { CalendarEvent } from "@/lib/types";
import { CompanyAvatar, cn } from "../ui";
import { HomeSearch, type SearchCompany } from "./HomeSearch";

/** 남색 첫 칸의 글 — 일정 데이터와 상관없어서 미리 그려 둬요 */
const EYEBROW = "금융공기업 · 공공기관 · 은행 채용 준비";

/** 오늘부터 가까운 서류 마감·필기 (공고로 확인한 일정만 — '예상'은 빼요) */
function upcoming(today: string, limit: number): CalendarEvent[] {
  return buildEvents(buildCatalog())
    .filter((e) => (e.type === "doc" || e.type === "written") && e.recruitment.status !== "expected" && e.date >= today)
    .slice(0, limit);
}

const label = (e: CalendarEvent) => e.label ?? EVENT_META[e.type].label;
const when = (e: CalendarEvent) => `${formatShort(e.date)}${e.time ? ` ${e.time}` : ""}`;

/**
 * 홈 첫 칸 — 남색 띠 하나에 '금콩이 무엇인지 · 기관 찾기 · 곧 다가오는 마감·필기'.
 * 컴퓨터: 띠 오른쪽에 D-day 네 줄을 상자 없이 바로 · 휴대폰: 띠 아래에 옆으로 넘기는 D-day 카드
 */
export async function HomeTop() {
  await connection();
  const today = todayKST();
  const catalog = buildCatalog();
  const events = upcoming(today, 6);
  const companies: SearchCompany[] = catalog.companies.map(({ id, name, shortName, logo, avatar, category }) => ({ id, name, shortName, logo, avatar, category }));

  return (
    <>
      <section data-home-top aria-labelledby="home-title" className="bg-brand-dark">
        <div className="mx-auto grid max-w-[1200px] gap-8 px-4 pt-1.5 pb-6 md:px-6 md:py-12 lg:grid-cols-[minmax(0,1fr)_450px] lg:items-center lg:gap-16 lg:py-[52px]">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-[13px] font-extrabold text-accent md:text-[14px]">
              <span aria-hidden className="hidden h-2 w-2 rounded-full bg-accent md:inline-block" />
              {EYEBROW}
            </p>
            <h1 id="home-title" className="mt-1.5 text-[24px] leading-[1.32] font-extrabold tracking-[-0.04em] text-on-primary md:mt-3.5 md:text-[38px] md:leading-[1.28]">
              금융권 채용, 일정부터
              <br />
              필기 후기까지 한 곳에서
            </h1>
            <p className="mt-3.5 hidden text-[16px] leading-[1.65] text-[#c3cbea] md:block">
              {catalog.companies.length}개 기관의 채용 일정과 경쟁률, 응시자들의 필기 후기,
              <br />
              매일 아침 경제 브리핑을 금콩이 모았어요.
            </p>
            <HomeSearch companies={companies} />
          </div>

          {/* 컴퓨터: 띠 위에 바로 놓는 D-day 목록 */}
          <div className="hidden md:block">
            <div className="mb-1.5 flex items-center justify-between">
              <h2 className="text-[17px] font-extrabold tracking-[-0.02em] text-on-primary">곧 다가오는 마감 · 필기</h2>
              <Link href="/calendar" className="flex items-center gap-0.5 text-[13.5px] font-bold text-[#aeb7dd] hover:text-on-primary">
                전체 일정 <ChevronRight className="h-3.5 w-3.5" strokeWidth={2.6} />
              </Link>
            </div>
            {events.length ? (
              <ul>
                {events.slice(0, 4).map((e) => {
                  const d = diffDays(today, e.date);
                  return (
                    <li key={e.id} className="border-t border-[#ffffff]/[0.13] first:border-t-0">
                      <Link href={`/companies/${e.company.id}`} className="group flex items-center gap-3.5 py-[13px]">
                        <span
                          className={cn(
                            "inline-flex h-7 min-w-[50px] shrink-0 items-center justify-center rounded-[7px] px-1.5 tabular text-[13.5px] font-extrabold",
                            d <= 3 ? "bg-accent text-[#1f2a5c]" : "bg-[#ffffff]/[0.12] text-on-primary",
                          )}
                        >
                          {ddayLabel(d)}
                        </span>
                        <CompanyAvatar company={e.company} size="sm" />
                        <span className="min-w-0">
                          <span className="block truncate text-[15.5px] font-bold text-on-primary group-hover:underline">{e.company.name}</span>
                          <span className="mt-0.5 block truncate tabular text-[13px] text-[#aeb7dd]">
                            <b className="font-bold text-on-primary">{label(e)}</b> · {when(e)}
                          </span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="py-6 type-body-md text-[#c3cbea]">곧 다가오는 확정 일정이 없어요. 채용 캘린더에서 다음 일정을 확인해 보세요.</p>
            )}
          </div>
        </div>
      </section>

      {/* 휴대폰: 띠 아래에 옆으로 넘기는 D-day 카드 */}
      <section aria-labelledby="home-dday-m" className="pt-7 md:hidden">
        <div className="flex items-center px-4">
          <h2 id="home-dday-m" className="text-[19px] font-extrabold tracking-[-0.035em] text-ink">
            곧 다가오는 마감 · 필기
          </h2>
          <Link href="/calendar" className="ml-auto flex items-center gap-0.5 text-[13.5px] font-bold text-ink-mute">
            전체 일정 <ChevronRight className="h-3.5 w-3.5" strokeWidth={2.6} />
          </Link>
        </div>
        {events.length ? (
          <ul className="no-scrollbar mt-3.5 flex snap-x scroll-px-4 gap-2.5 overflow-x-auto px-4">
            {events.map((e) => {
              const d = diffDays(today, e.date);
              return (
                <li key={e.id} className="w-[152px] shrink-0 snap-start">
                  <Link href={`/companies/${e.company.id}`} className="flex h-full flex-col rounded-[14px] bg-canvas-soft px-3.5 pt-3.5 pb-3">
                    <span className={cn("tabular text-[20px] leading-none font-extrabold tracking-[-0.02em]", d <= 3 ? "text-ruby" : "text-navy-text")}>{ddayLabel(d)}</span>
                    <span className="mt-2.5 flex min-h-10 items-center gap-[7px]">
                      <CompanyAvatar company={e.company} size="xs" />
                      <span className="line-clamp-2 text-[14px] leading-[1.35] font-bold text-ink">{e.company.name}</span>
                    </span>
                    <span className="mt-2 line-clamp-2 tabular text-[12.5px] font-semibold text-ink-mute">
                      <b className={cn("font-extrabold", EVENT_META[e.type].text)}>{label(e)}</b> · {when(e)}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mx-4 mt-3 rounded-xl bg-canvas-soft px-4 py-4 type-body-md text-ink-mute">곧 다가오는 확정 일정이 없어요. 채용 캘린더에서 다음 일정을 확인해 보세요.</p>
        )}
      </section>
    </>
  );
}

/** 첫 칸이 그려지기 전 — 남색 띠 높이만큼 */
export function HomeTopSkeleton() {
  return <div data-home-top className="h-[210px] bg-brand-dark md:h-[420px]" />;
}
