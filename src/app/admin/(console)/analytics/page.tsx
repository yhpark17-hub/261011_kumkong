import Link from "next/link";
import { Suspense } from "react";
import { DailyChart } from "@/components/admin/DailyChart";
import { AdminCard, AdminPageTitle, StatTile, changePct, formatDuration, nf } from "@/components/admin/parts";
import { AdminSkeleton } from "@/components/admin/Skeleton";
import { DbSection } from "@/components/db/DbSection";
import { cn } from "@/components/ui";
import { requireAdmin } from "@/lib/server/admin";
import { activeNow, daily, lastDays, previousRange, referrers, sections, summary, topPages } from "@/lib/server/analytics";

export const metadata = { title: "방문 통계" };

const RANGES = [
  { key: "1", label: "오늘", days: 1 },
  { key: "7", label: "7일", days: 7 },
  { key: "30", label: "30일", days: 30 },
  { key: "90", label: "90일", days: 90 },
] as const;

export default function AnalyticsPage({ searchParams }: PageProps<"/admin/analytics">) {
  return (
    <DbSection noticeTitle="DB가 연결되지 않았어요 (DATABASE_URL 확인)">
      <Suspense fallback={<AdminSkeleton />}>
        {searchParams.then((sp) => (
          <Analytics rangeKey={typeof sp.range === "string" ? sp.range : "7"} />
        ))}
      </Suspense>
    </DbSection>
  );
}

/** 표 안의 가로 막대 (한 계열 — 크기만 비교) */
function InlineBar({ value, max }: { value: number; max: number }) {
  return (
    <span className="block h-2 w-full rounded-full bg-canvas-soft" aria-hidden>
      <span className="block h-full rounded-full bg-primary" style={{ width: `${max ? (value / max) * 100 : 0}%` }} />
    </span>
  );
}

async function Analytics({ rangeKey }: { rangeKey: string }) {
  await requireAdmin();
  const range = RANGES.find((r) => r.key === rangeKey) ?? RANGES[1];
  const r = lastDays(range.days);
  const chartRange = lastDays(Math.max(range.days, 7));
  const [s, prev, now, days, secs, pages, refs] = await Promise.all([
    summary(r),
    summary(previousRange(r)),
    activeNow(),
    daily(chartRange),
    sections(r),
    topPages(r, 20),
    referrers(r, 10),
  ]);
  const deviceTotal = s.devices.mobile + s.devices.tablet + s.devices.desktop;
  const pct = (n: number) => (deviceTotal ? `${Math.round((n / deviceTotal) * 100)}%` : "-");
  const vs = range.days === 1 ? "어제 대비" : `직전 ${range.days}일 대비`;

  return (
    <>
      <AdminPageTitle
        title="방문 통계"
        desc="자체 수집 통계예요. IP는 저장하지 않고, 운영자 본인 방문과 검색 로봇은 세지 않아요."
        aside={
          <div className="flex gap-1.5">
            {RANGES.map((x) => (
              <Link
                key={x.key}
                href={`/admin/analytics?range=${x.key}`}
                className={cn("btn btn-sm", x.key === range.key ? "btn-on-dark" : "btn-toggle")}
              >
                {x.label}
              </Link>
            ))}
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatTile label="방문자" value={nf.format(s.visitors)} delta={changePct(s.visitors, prev.visitors)} sub={vs} />
        <StatTile label="조회수" value={nf.format(s.views)} delta={changePct(s.views, prev.views)} sub={vs} />
        <StatTile label="방문 횟수" value={nf.format(s.sessions)} sub={s.sessions ? `방문당 ${(s.views / s.sessions).toFixed(1)}페이지` : undefined} />
        <StatTile label="페이지당 머문 시간" value={formatDuration(s.avgViewMs)} sub="화면이 보인 시간" />
        <StatTile label="방문당 머문 시간" value={formatDuration(s.avgSessionMs)} sub="한 번 들어와서" />
        <StatTile label="지금 보고 있는 사람" value={nf.format(now)} sub="최근 5분" />
      </div>

      <AdminCard title={`일별 방문자 (최근 ${chartRange.days}일)`}>
        <DailyChart points={days} />
        <details className="mt-4">
          <summary className="cursor-pointer type-caption text-ink-secondary">표로 보기</summary>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[420px] type-caption">
              <thead className="text-left text-ink-mute">
                <tr>
                  <th className="py-1.5 font-normal">날짜</th>
                  <th className="py-1.5 text-right font-normal">방문자</th>
                  <th className="py-1.5 text-right font-normal">조회수</th>
                  <th className="py-1.5 text-right font-normal">페이지당 머문 시간</th>
                </tr>
              </thead>
              <tbody className="tabular">
                {[...days].reverse().map((d) => (
                  <tr key={d.day} className="border-t border-hairline text-ink-secondary">
                    <td className="py-1.5">{d.day}</td>
                    <td className="py-1.5 text-right text-ink">{nf.format(d.visitors)}</td>
                    <td className="py-1.5 text-right">{nf.format(d.views)}</td>
                    <td className="py-1.5 text-right">{formatDuration(d.avgViewMs)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </AdminCard>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <AdminCard title="많이 본 페이지">
          {pages.length === 0 ? (
            <p className="type-body-md text-ink-mute">아직 기록이 없어요.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] type-caption">
                <thead className="text-left text-ink-mute">
                  <tr>
                    <th className="pb-2 font-normal">페이지</th>
                    <th className="w-28 pb-2 font-normal" />
                    <th className="pb-2 text-right font-normal">조회</th>
                    <th className="pb-2 text-right font-normal">방문자</th>
                    <th className="pb-2 text-right font-normal">머문 시간</th>
                  </tr>
                </thead>
                <tbody className="tabular">
                  {pages.map((p) => (
                    <tr key={p.path} className="border-t border-hairline">
                      <td className="max-w-0 py-2 pr-3">
                        <Link href={p.path} className="block truncate text-ink hover:underline" title={p.path}>
                          {p.label}
                        </Link>
                      </td>
                      <td className="py-2 pr-3">
                        <InlineBar value={p.views} max={pages[0].views} />
                      </td>
                      <td className="py-2 text-right text-ink">{nf.format(p.views)}</td>
                      <td className="py-2 text-right text-ink-secondary">{nf.format(p.visitors)}</td>
                      <td className="py-2 text-right text-ink-secondary">{formatDuration(p.avgViewMs)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </AdminCard>

        <div className="space-y-6">
          <AdminCard title="메뉴별 조회">
            {secs.length === 0 ? (
              <p className="type-body-md text-ink-mute">아직 기록이 없어요.</p>
            ) : (
              <ul className="space-y-3">
                {secs.map((x) => (
                  <li key={x.label}>
                    <p className="mb-1 flex justify-between type-caption">
                      <span className="text-ink">{x.label}</span>
                      <span className="tabular text-ink-secondary">{nf.format(x.views)}</span>
                    </p>
                    <InlineBar value={x.views} max={secs[0].views} />
                  </li>
                ))}
              </ul>
            )}
          </AdminCard>

          <AdminCard title="기기">
            <div className="grid grid-cols-3 gap-2 text-center">
              {(
                [
                  ["휴대폰", s.devices.mobile],
                  ["태블릿", s.devices.tablet],
                  ["PC", s.devices.desktop],
                ] as const
              ).map(([label, n]) => (
                <div key={label} className="rounded-md bg-canvas-soft py-3">
                  <p className="type-micro text-ink-mute">{label}</p>
                  <p className="mt-0.5 tabular type-heading-sm text-ink">{pct(n)}</p>
                </div>
              ))}
            </div>
            <p className="mt-2 type-micro text-ink-mute">방문자 기준 · 화면 너비로 구분</p>
          </AdminCard>

          <AdminCard title="유입 경로">
            {refs.length === 0 ? (
              <p className="type-body-md text-ink-mute">외부에서 들어온 기록이 아직 없어요. 주소를 직접 입력하거나 즐겨찾기로 들어온 방문은 여기에 잡히지 않아요.</p>
            ) : (
              <ul className="space-y-2 type-caption">
                {refs.map((x) => (
                  <li key={x.host} className="flex justify-between gap-3">
                    <span className="truncate text-ink">{x.host}</span>
                    <span className="tabular text-ink-secondary">{nf.format(x.visitors)}명</span>
                  </li>
                ))}
              </ul>
            )}
          </AdminCard>
        </div>
      </div>
    </>
  );
}
