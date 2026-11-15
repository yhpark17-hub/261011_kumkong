import Link from "next/link";
import { connection } from "next/server";
import { ChevronRight } from "lucide-react";
import { buildEvents } from "@/lib/catalog-client";
import { buildCatalog } from "@/lib/data";
import { ddayLabel, diffDays, formatShort, todayKST } from "@/lib/date";
import { EVENT_META } from "@/lib/meta";
import type { CalendarEvent } from "@/lib/types";
import { HeroMesh } from "../layout/MeshGlow";
import { CompanyAvatar, cn } from "../ui";
import { HomeSearch, type SearchCompany } from "./HomeSearch";

/** 첫 칸 머리말 — 일정 데이터와 상관없어서 미리 그려 둬요 */
const EYEBROW = "금융공기업 · 공공기관 · 은행 채용 준비";

/** 오늘부터 가까운 서류 마감·필기 (공고로 확인한 일정만 — '예상'은 빼요) */
function upcoming(today: string, limit: number): CalendarEvent[] {
  return buildEvents(buildCatalog())
    .filter((e) => (e.type === "doc" || e.type === "written") && e.recruitment.status !== "expected" && e.date >= today)
    .slice(0, limit);
}

const label = (e: CalendarEvent) => e.label ?? EVENT_META[e.type].label;
const when = (e: CalendarEvent) => `${formatShort(e.date)}${e.time ? ` ${e.time}` : ""}`;

/** D-day 알약 — 사흘 안은 루비, 나머지는 옅은 보라 */
function DChip({ d, className }: { d: number; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-7 min-w-[54px] shrink-0 items-center justify-center rounded-full px-2.5 tabular text-[13px] font-extrabold",
        d <= 3 ? "bg-ruby text-on-primary" : "bg-tag-soft-bg text-primary-text",
        className,
      )}
    >
      {ddayLabel(d)}
    </span>
  );
}

/**
 * 홈 첫 칸 — 흰 바탕 위로 처음 금콩의 보라·분홍·주황이 은은하게 번지고(머리 뒤까지),
 * 왼쪽 '금콩이 무엇인지 · 기관 찾기', 오른쪽 반투명 흰 판에 '곧 다가오는 마감·필기'.
 * 휴대폰: 판 대신 옆으로 넘기는 D-day 카드
 */
export async function HomeTop() {
  await connection();
  const today = todayKST();
  const catalog = buildCatalog();
  const events = upcoming(today, 6);
  const companies: SearchCompany[] = catalog.companies.map(({ id, name, shortName, logo, avatar, category }) => ({ id, name, shortName, logo, avatar, category }));

  return (
    <>
      <section data-home-top aria-labelledby="home-title" className="relative">
        <HeroMesh />
        <div className="mx-auto grid max-w-[1200px] gap-8 px-4 pt-2 md:px-6 md:pt-10 md:pb-12 lg:grid-cols-[minmax(0,1fr)_460px] lg:items-center lg:gap-14">
          <div className="min-w-0">
            <p className="inline-flex h-7 items-center gap-[7px] rounded-full border border-primary/15 bg-canvas/75 px-3 text-[12.5px] font-bold text-brand-text md:h-[30px] md:px-[13px] md:text-[13px]">
              <span aria-hidden className="h-[7px] w-[7px] rounded-full bg-linear-to-br from-primary to-magenta" />
              {EYEBROW}
            </p>
            <h1 id="home-title" className="mt-3 text-[26px] leading-[1.3] font-extrabold tracking-[-0.04em] text-ink md:mt-[18px] md:text-[42px] md:leading-[1.24]">
              금융권 채용, 일정부터
              <br />
              <span className="text-grad">필기 후기까지</span> 한 곳에서
            </h1>
            <p className="mt-4 hidden text-[16.5px] leading-[1.65] text-ink-secondary md:block">
              {catalog.companies.length}개 기관의 채용 일정과 경쟁률, 응시자들의 필기 후기,
              <br />
              매일 아침 경제 브리핑을 금콩이 모았어요.
            </p>
            <HomeSearch companies={companies} />
          </div>

          {/* 컴퓨터: 번짐 위에 반투명 흰 판 하나 */}
          <div className="hidden rounded-[24px] border border-canvas/90 bg-canvas/85 px-[22px] pt-5 pb-2 shadow-level-2 backdrop-blur-md md:block">
            <div className="mb-1 flex items-center justify-between">
              <h2 className="text-[17px] font-extrabold tracking-[-0.02em] text-ink">곧 다가오는 마감 · 필기</h2>
              <Link href="/calendar" className="flex items-center gap-0.5 text-[13.5px] font-bold text-brand-text hover:underline">
                전체 일정 <ChevronRight className="h-3.5 w-3.5" strokeWidth={2.6} />
              </Link>
            </div>
            {events.length ? (
              <ul>
                {events.slice(0, 4).map((e) => (
                  <li key={e.id} className="border-t border-hairline first:border-t-0">
                    <Link href={`/companies/${e.company.id}`} className="group flex items-center gap-3.5 py-[13px]">
                      <DChip d={diffDays(today, e.date)} />
                      <CompanyAvatar company={e.company} />
                      <span className="min-w-0">
                        <span className="block truncate text-[15.5px] font-bold text-ink group-hover:underline">{e.company.name}</span>
                        <span className="mt-0.5 block truncate tabular text-[13px] text-ink-mute">
                          <b className={cn("font-bold", EVENT_META[e.type].text)}>{label(e)}</b> · {when(e)}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-6 type-body-md text-ink-mute">곧 다가오는 확정 일정이 없어요. 채용 캘린더에서 다음 일정을 확인해 보세요.</p>
            )}
          </div>
        </div>
      </section>

      {/* 휴대폰: 옆으로 넘기는 D-day 카드 */}
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
          <ul className="no-scrollbar flex snap-x scroll-px-4 gap-2.5 overflow-x-auto px-4 pt-3.5 pb-3.5">
            {events.map((e) => (
              <li key={e.id} className="w-[152px] shrink-0 snap-start">
                <Link href={`/companies/${e.company.id}`} className="flex h-full flex-col rounded-[18px] border border-hairline bg-canvas px-3.5 pt-3.5 pb-3 shadow-level-1">
                  <DChip d={diffDays(today, e.date)} className="h-6 min-w-0 self-start px-2.5" />
                  <span className="mt-3 flex min-h-10 items-center gap-[7px]">
                    <CompanyAvatar company={e.company} size="xs" />
                    <span className="line-clamp-2 text-[14px] leading-[1.35] font-bold text-ink">{e.company.name}</span>
                  </span>
                  <span className="mt-2 line-clamp-2 tabular text-[12.5px] text-ink-mute">
                    <b className={cn("font-extrabold", EVENT_META[e.type].text)}>{label(e)}</b> · {when(e)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mx-4 mt-3 rounded-2xl bg-canvas-soft px-4 py-4 type-body-md text-ink-mute">곧 다가오는 확정 일정이 없어요. 채용 캘린더에서 다음 일정을 확인해 보세요.</p>
        )}
      </section>
    </>
  );
}

/** 첫 칸이 그려지기 전 — 같은 높이만큼 (색 번짐은 그대로) */
export function HomeTopSkeleton() {
  return (
    <div data-home-top className="relative h-[300px] md:h-[440px]">
      <HeroMesh />
    </div>
  );
}
