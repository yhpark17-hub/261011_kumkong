import Link from "next/link";
import { connection } from "next/server";
import { AlarmClock, ArrowRight } from "lucide-react";
import { buildEvents } from "@/lib/catalog-client";
import { buildCatalog } from "@/lib/data";
import { addDays, diffDays, formatRange, todayKST } from "@/lib/date";
import { CompanyAvatar, EventTag, cn } from "../ui";

const DAYS = 7;
const MAX_ROWS = 6;

/** 홈: 앞으로 7일 안의 마감·시험·면접 (요청 시 렌더링) — 전체는 채용 캘린더에서 */
export async function UpcomingSchedule() {
  await connection();
  const today = todayKST();
  const until = addDays(today, DAYS);
  const list = buildEvents(buildCatalog()).filter((e) => e.type !== "posting" && (e.endDate ?? e.date) >= today && e.date <= until);
  const counts = {
    today: list.filter((e) => e.date <= today).length,
    doc: list.filter((e) => e.type === "doc").length,
    written: list.filter((e) => e.type === "written").length,
  };

  return (
    <section aria-labelledby="upcoming-title" className="card p-4 shadow-level-1 md:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 id="upcoming-title" className="flex items-center gap-2 type-heading-md text-ink">
          <AlarmClock className="h-5 w-5 text-ruby" strokeWidth={1.75} />
          다가오는 일정
        </h2>
        <Link href="/calendar" className="link inline-flex shrink-0 items-center gap-1 type-caption">
          캘린더 전체 보기
          <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} />
        </Link>
      </div>
      <p className="mt-1 type-caption text-ink-mute">
        앞으로 {DAYS}일 · 오늘 <b className="tabular text-ink">{counts.today}</b>건 · 서류 마감 <b className="tabular text-ink">{counts.doc}</b>건 · 필기{" "}
        <b className="tabular text-ink">{counts.written}</b>건
      </p>

      {list.length === 0 ? (
        <p className="mt-4 type-body-md text-ink-mute">앞으로 {DAYS}일 안에는 마감·시험 일정이 없어요.</p>
      ) : (
        <ul className="mt-3 -mx-2 divide-y divide-hairline">
          {list.slice(0, MAX_ROWS).map((e) => {
            const left = diffDays(today, e.date);
            // 며칠에 걸친 일정(면접 기간 등)이 이미 시작됐으면 '진행 중'
            const ongoing = left < 0;
            return (
              <li key={e.id}>
                <Link href={`/companies/${e.company.id}`} className="group flex items-center gap-3 rounded-md px-2 py-2.5 hover:bg-canvas-soft">
                  <span className={cn("w-12 shrink-0 text-center tabular type-caption font-semibold", left <= 0 ? "text-ruby" : left <= 2 ? "text-ink" : "text-ink-mute")}>
                    {ongoing ? "진행 중" : left === 0 ? "오늘" : left === 1 ? "내일" : `D-${left}`}
                  </span>
                  <CompanyAvatar company={e.company} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate type-body-md text-ink group-hover:underline">{e.company.name}</span>
                    <span className="block truncate type-caption text-ink-mute">
                      {formatRange(e.date, e.endDate)}
                      {e.time ? ` ${e.time}` : ""}
                    </span>
                  </span>
                  <EventTag type={e.type} label={e.label} size="sm" className="shrink-0" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      {list.length > MAX_ROWS && (
        <Link href="/calendar" className="btn btn-toggle btn-sm mt-3 w-full">
          {list.length - MAX_ROWS}건 더 보기
        </Link>
      )}
    </section>
  );
}

export function UpcomingScheduleSkeleton() {
  return <div className="h-80 animate-pulse rounded-lg bg-canvas-soft" />;
}
