import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { buildEvents } from "@/lib/catalog-client";
import { buildCatalog } from "@/lib/data";
import { WEEK_START_COOKIE, addDays, formatDayHeading, parseWeekStart, todayKST, weekStartOf, type WeekStart } from "@/lib/date";
import type { EventType } from "@/lib/types";
import { WeekCalendar, type WeekDay } from "./WeekCalendar";

/** 이번 주·다음 주 칸 (일~토, 달력에서 월요일 시작을 고르면 월~일) — 며칠에 걸친 일정(면접 기간 등)은 그 날짜마다 넣어요 */
function buildWeeks(today: string, ws: WeekStart): WeekDay[][] {
  const start = weekStartOf(today, ws);
  const days: WeekDay[] = Array.from({ length: 14 }, (_, i) => ({ date: addDays(start, i), items: [] }));
  const last = days[13].date;
  const index = new Map(days.map((d, i) => [d.date, i]));
  for (const e of buildEvents(buildCatalog())) {
    const end = e.endDate ?? e.date;
    if (end < start || e.date > last) continue;
    for (let d = e.date < start ? start : e.date; d <= end && d <= last; d = addDays(d, 1)) {
      days[index.get(d)!].items.push({
        id: e.id,
        companyId: e.company.id,
        name: e.company.name,
        short: e.company.shortName,
        logo: e.company.logo,
        avatar: e.company.avatar,
        type: e.type,
        label: e.label,
        start: e.date,
        end,
        expected: e.recruitment.status === "expected",
        intern: e.recruitment.kind === "intern" || undefined,
        // '다가오는 서류 마감' 줄에만 쓰는 공고명·마감 시각
        ...(e.type === "doc" ? { title: e.recruitment.title, time: e.time } : {}),
      });
    }
  }
  return [days.slice(0, 7), days.slice(7)];
}

async function weeksNow() {
  await connection();
  const today = todayKST();
  const ws = parseWeekStart((await cookies()).get(WEEK_START_COOKIE)?.value);
  return { today, weeks: buildWeeks(today, ws) };
}

/** 홈: 이번 주 채용 일정 (요청 시 렌더링 — 오늘 기준) */
export async function WeeklySchedule() {
  const { today, weeks } = await weeksNow();
  return <WeekCalendar weeks={weeks} today={today} />;
}

export function WeeklyScheduleSkeleton() {
  return <div className="h-[460px] animate-pulse rounded-[28px] bg-canvas-soft" />;
}

/** 이번 주에 그 전형이 있는 기관 수 (같은 기관이 두 번 있어도 한 곳) */
function placesOf(week: WeekDay[], types: readonly EventType[]) {
  return new Set(week.flatMap((d) => d.items.filter((it) => types.includes(it.type)).map((it) => it.companyId))).size;
}

/**
 * 홈 첫 칸 — 그림 한 장 위에 '이번 주' 한 문장.
 * 숫자는 달력과 같은 일정 데이터에서 세요 (서류 마감·필기 = 그 날짜가 이번 주, 면접 = 이번 주에 걸친 면접 기간 포함).
 */
export async function HomeHero() {
  const { today, weeks } = await weeksNow();
  const week = weeks[0];
  const doc = placesOf(week, ["doc"]);
  const written = placesOf(week, ["written"]);
  const interview = placesOf(week, ["interview1", "interview2"]);
  const parts = [doc && `서류 마감 ${doc}곳`, written && `필기시험 ${written}곳`].filter(Boolean) as string[];

  return (
    <section aria-labelledby="home-hero-title" className="relative overflow-hidden rounded-[28px] bg-lilac md:min-h-[380px] md:rounded-[32px]">
      <div className="relative h-40 sm:h-52 md:absolute md:inset-0 md:h-auto">
        <Image
          src="/illust/home-hero.webp"
          alt="벽 달력을 보며 계획을 세우는 준비생 그림"
          fill
          priority
          sizes="(min-width: 1200px) 1152px, 100vw"
          className="object-cover object-[82%_center] md:object-right"
        />
      </div>
      <div className="relative flex flex-col gap-3 p-5 pb-6 md:max-w-[560px] md:gap-4 md:px-12 md:py-12">
        <span className="w-fit rounded-full bg-canvas/85 px-3 py-1.5 text-[13px] font-bold text-ink-mute-2 max-md:hidden">
          {formatDayHeading(today)} · 이번 주 채용
        </span>
        <h2 id="home-hero-title" className="font-display text-[27px] leading-[1.25] text-ink [word-break:keep-all] md:text-[44px] md:leading-[1.22]">
          {parts.length ? (
            <>
              이번 주, {parts[0]}
              {parts[1] ? (
                <>
                  <br />
                  {parts[1]}이 있어요
                </>
              ) : (
                "이 있어요"
              )}
            </>
          ) : (
            "이번 주는 서류 마감도 필기도 없는 숨 고르는 주예요"
          )}
        </h2>
        <p className="type-body-md text-ink-secondary [word-break:keep-all] md:text-[17px] md:leading-relaxed">
          {interview > 0 && `면접은 ${interview}곳이 진행 중이에요. `}
          금융공기업·공공기관 일정을 한 달력에 모았어요.
        </p>
        <div className="mt-1 flex flex-wrap gap-2.5">
          <Link href="/calendar" className="btn btn-primary max-md:flex-1">
            채용 캘린더 보기
          </Link>
          <Link href="/companies" className="btn bg-canvas text-ink shadow-level-1 hover:bg-canvas-soft max-md:flex-1">
            기관 정보·경쟁률
          </Link>
        </div>
      </div>
    </section>
  );
}

export function HomeHeroSkeleton() {
  return <div className="h-[420px] animate-pulse rounded-[28px] bg-lilac md:h-[380px] md:rounded-[32px]" />;
}
