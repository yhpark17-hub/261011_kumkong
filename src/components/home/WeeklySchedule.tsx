import { connection } from "next/server";
import { buildEvents } from "@/lib/catalog-client";
import { buildCatalog } from "@/lib/data";
import { addDays, dayOfWeek, todayKST } from "@/lib/date";
import { WeekCalendar, type WeekDay } from "./WeekCalendar";

/** 이번 주·다음 주 (일~토) 칸 — 며칠에 걸친 일정(면접 기간 등)은 그 날짜마다 넣어요 */
function buildWeeks(today: string): WeekDay[][] {
  const start = addDays(today, -dayOfWeek(today));
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
        expected: e.recruitment.status === "expected",
      });
    }
  }
  return [days.slice(0, 7), days.slice(7)];
}

/** 홈: 이번 주 채용 일정 (요청 시 렌더링 — 오늘 기준) */
export async function WeeklySchedule() {
  await connection();
  const today = todayKST();
  return <WeekCalendar weeks={buildWeeks(today)} today={today} />;
}

export function WeeklyScheduleSkeleton() {
  return <div className="h-[340px] animate-pulse rounded-lg bg-canvas-soft" />;
}
