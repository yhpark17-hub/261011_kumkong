import { Clock, Gauge, Lock, Users } from "lucide-react";
import {
  OVERALL_OPTIONS,
  STYLE_OPTIONS,
  TIME_OPTIONS,
  TOTAL_MIN_REPORTS,
  UNSOLVED_OPTIONS,
  difficultyWord,
  unsolvedOption,
  type ReviewStats,
  type UnsolvedStat,
} from "@/lib/review-meta";
import { cn } from "../ui";

const pct = (n: number, total: number) => (total ? Math.round((n / total) * 100) : 0);

function timeWord(avg: number | null): string {
  if (avg == null) return "-";
  if (avg < 1.6) return "여유";
  if (avg < 2.4) return "적당";
  if (avg < 3.2) return "빠듯";
  return "많이 부족";
}

/** 가로 막대 한 줄 */
function BarRow({ label, count, total, max, tone = "bg-primary" }: { label: string; count: number; total: number; max: number; tone?: string }) {
  const p = pct(count, total);
  const top = count > 0 && count === max;
  return (
    <div className="grid grid-cols-[88px_1fr_64px] items-center gap-3">
      <span className={cn("truncate type-caption", top ? "text-ink" : "text-ink-secondary")} title={label}>
        {label}
      </span>
      <span className="h-2.5 overflow-hidden rounded-full bg-canvas-soft">
        <span className={cn("block h-full rounded-full", top ? tone : "bg-primary-subdued")} style={{ width: `${p}%` }} />
      </span>
      <span className={cn("text-right tabular type-caption", top ? "text-ink" : "text-ink-mute")}>
        {p}% <span className="type-micro text-ink-mute">({count})</span>
      </span>
    </div>
  );
}

function Block({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("border-t border-hairline pt-6", className)}>
      <h3 className="mb-4 type-body-lg !font-normal text-ink">{title}</h3>
      {children}
    </div>
  );
}

function Stat({ icon: Icon, label, value, sub }: { icon: typeof Users; label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg bg-canvas-soft p-4">
      <p className="flex items-center gap-1.5 type-caption text-ink-mute">
        <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
        {label}
      </p>
      <p className="mt-2 type-heading-lg text-ink">{value}</p>
      {sub && <p className="mt-1 tabular type-micro text-ink-mute">{sub}</p>}
    </div>
  );
}

/** 가운데 응답 구간 + (총 문항 수가 모였으면) 대략 푼 문항 수 */
function unsolvedSummary(stat: UnsolvedStat): string | null {
  if (stat.median == null) return null;
  const m = unsolvedOption(stat.median);
  if (!m) return null;
  const head =
    m.value === 0
      ? "응답자 절반 이상이 끝까지 다 풀었어요."
      : m.hi == null
        ? `응답자 절반 이상이 ${m.label}을 못 풀고 넘겼어요.`
        : `가운데 응답은 '${m.label}' 못 풂이에요.`;
  const t = stat.total?.value;
  if (!t) return head;
  const solved =
    m.value === 0 ? `${t}문항 모두` : m.hi == null ? `${Math.max(t - m.lo, 0)}문항 이하` : `약 ${Math.max(t - m.hi, 0)}~${Math.max(t - m.lo, 0)}문항`;
  return `${head} 총 ${t}문항 기준 ${solved} 풀이예요.`;
}

function UnsolvedSection({ stat, showName }: { stat: UnsolvedStat; showName: boolean }) {
  const max = Math.max(...stat.dist);
  const summary = unsolvedSummary(stat);
  return (
    <div>
      <p className="mb-3 flex items-baseline justify-between gap-2">
        <span className="type-body-md !font-normal text-ink">{showName ? stat.section : "응답 분포"}</span>
        <span className="tabular type-micro text-ink-mute">{stat.n}명 응답</span>
      </p>
      {stat.n > 0 && (
        <div className="space-y-2.5">
          {UNSOLVED_OPTIONS.map((o, i) =>
            // 예전 선택지는 그 응답이 있을 때만
            o.legacy && !stat.dist[i] ? null : (
              <BarRow key={o.value} label={o.label} count={stat.dist[i]} total={stat.n} max={max} tone="bg-ev-interview1" />
            ),
          )}
        </div>
      )}
      {summary && <p className="mt-3 type-caption text-ink-secondary">{summary}</p>}
      <p className="mt-1 type-micro text-ink-mute">
        {stat.total
          ? `총 문항 수는 응시자 제보 기준이에요 (${stat.totalReports}명 중 ${stat.total.votes}명이 ${stat.total.value}문항).`
          : stat.totalReports > 0
            ? `총 문항 수 제보 ${stat.totalReports}건 — ${TOTAL_MIN_REPORTS}건 이상 모이고 절반 이상 일치하면 표시돼요.`
            : "총 문항 수는 아직 제보가 없어요. 아는 분은 후기를 남길 때 알려 주세요."}
      </p>
    </div>
  );
}

export function ReviewResults({ stats }: { stats: ReviewStats }) {
  const { count } = stats;
  if (!count) {
    return (
      <div className="rounded-lg bg-canvas-soft px-6 py-12 text-center">
        <p className="type-heading-sm text-ink">아직 참여한 사람이 없어요</p>
        <p className="mt-2 type-body-md text-ink-mute">첫 번째로 체감 난이도를 남기면 결과가 바로 여기에 표시돼요.</p>
      </div>
    );
  }

  const overallMax = Math.max(...stats.overall);
  const timeMax = Math.max(...stats.time);
  const hardestEntries = Object.entries(stats.hardest).sort((a, b) => b[1] - a[1]);
  const hardestTotal = hardestEntries.reduce((s, [, n]) => s + n, 0);
  const hardestMax = hardestEntries[0]?.[1] ?? 0;
  const styleTotal = Object.values(stats.style).reduce((s, n) => s + n, 0);
  const trackEntries = Object.entries(stats.tracks).sort((a, b) => b[1] - a[1]).slice(0, 8);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-2 md:gap-3">
        <Stat icon={Users} label="참여" value={`${count}명`} />
        <Stat
          icon={Gauge}
          label="체감 난이도"
          value={difficultyWord(stats.overallAvg)}
          sub={stats.overallAvg != null ? `평균 ${stats.overallAvg.toFixed(1)} / 5` : undefined}
        />
        <Stat
          icon={Clock}
          label="시간"
          value={timeWord(stats.timeAvg)}
          sub={stats.timeAvg != null ? `평균 ${stats.timeAvg.toFixed(1)} / 4` : undefined}
        />
      </div>
      {count < 5 && (
        <p className="type-caption text-ink-mute">※ 참여자가 5명 미만이라 결과가 크게 바뀔 수 있어요.</p>
      )}

      <Block title="전체 난이도">
        <div className="space-y-2.5">
          {OVERALL_OPTIONS.map((o, i) => (
            <BarRow key={o.value} label={o.label} count={stats.overall[i]} total={count} max={overallMax} />
          ))}
        </div>
      </Block>

      <Block title="시간 여유">
        <div className="space-y-2.5">
          {TIME_OPTIONS.map((o, i) => (
            <BarRow key={o.value} label={o.label} count={stats.time[i]} total={count} max={timeMax} tone="bg-ev-final" />
          ))}
        </div>
      </Block>

      {stats.unsolved.length > 0 && (
        <Block title="못 풀고 넘긴(찍은) 문항 수">
          <div className="space-y-6">
            {stats.unsolved.map((s) => (
              <UnsolvedSection key={s.section} stat={s} showName={stats.unsolved.length > 1 || s.section !== "필기"} />
            ))}
          </div>
        </Block>
      )}

      {hardestEntries.length > 0 && (
        <Block title="가장 어려웠던 과목">
          <div className="space-y-2.5">
            {hardestEntries.map(([name, n]) => (
              <BarRow key={name} label={name} count={n} total={hardestTotal} max={hardestMax} tone="bg-ruby" />
            ))}
          </div>
        </Block>
      )}

      {stats.subjects.length > 0 && (
        <Block title="과목별 평균 체감 난이도">
          <table className="w-full type-caption">
            <thead>
              <tr className="text-left text-ink-mute">
                <th className="pb-2 font-normal">과목</th>
                <th className="pb-2 font-normal">쉬움 ← → 어려움</th>
                <th className="pb-2 text-right font-normal">평균</th>
              </tr>
            </thead>
            <tbody>
              {stats.subjects.map((s) => (
                <tr key={s.name} className="border-t border-hairline">
                  <td className="w-24 py-2.5 pr-2 text-ink">{s.name}</td>
                  <td className="py-2.5">
                    <span className="relative block h-2.5 rounded-full bg-linear-to-r from-ev-final-soft via-canvas-soft to-ev-doc-soft">
                      <span
                        className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-canvas bg-brand-dark shadow-level-1"
                        style={{ left: `${((s.avg - 1) / 4) * 100}%` }}
                      />
                    </span>
                  </td>
                  <td className="w-20 py-2.5 pl-3 text-right tabular text-ink">
                    {s.avg.toFixed(1)} <span className="type-micro text-ink-mute">({s.n})</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Block>
      )}

      {styleTotal > 0 && (
        <Block title="NCS 문제 스타일">
          <div className="flex h-3 overflow-hidden rounded-full bg-canvas-soft">
            {STYLE_OPTIONS.map((o, i) => {
              const n = stats.style[o.value] ?? 0;
              return n ? (
                <span
                  key={o.value}
                  className={cn("h-full", ["bg-primary", "bg-ev-final", "bg-magenta", "bg-ink-mute"][i])}
                  style={{ width: `${pct(n, styleTotal)}%` }}
                  title={`${o.label} ${n}명`}
                />
              ) : null;
            })}
          </div>
          <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 type-caption text-ink-secondary">
            {STYLE_OPTIONS.map((o, i) => (
              <li key={o.value} className="inline-flex items-center gap-1.5">
                <span className={cn("h-2 w-2 rounded-full", ["bg-primary", "bg-ev-final", "bg-magenta", "bg-ink-mute"][i])} />
                {o.label} <span className="tabular text-ink-mute">{pct(stats.style[o.value] ?? 0, styleTotal)}%</span>
              </li>
            ))}
          </ul>
        </Block>
      )}

      {trackEntries.length > 0 && (
        <Block title="참여자 직렬">
          <ul className="flex flex-wrap gap-2">
            {trackEntries.map(([t, n]) => (
              <li key={t} className="rounded-full border border-hairline px-3 py-1 type-caption text-ink-secondary">
                {t} <span className="tabular text-ink-mute">{n}</span>
              </li>
            ))}
          </ul>
        </Block>
      )}
    </div>
  );
}

/** 잠긴 막대 모양 (실제 값이 아닌 자리표시) */
const PLACEHOLDER_BARS = [62, 38, 81, 24, 55, 70, 33];

/**
 * 후기를 남기지 않은 사람에게 보여 주는 요약 — 참여 수와 전체 체감 난이도·시간 한 단어만.
 * 시험 후 3일 동안은 그 한 단어도 잠가요 (overallAvg·timeAvg 를 null 로 넘김). 상세 수치는 서버에서 아예 보내지 않습니다.
 */
export function LockedResults({
  count,
  overallAvg,
  timeAvg,
  publicFromLabel,
}: {
  count: number;
  overallAvg: number | null;
  timeAvg: number | null;
  /** 요약이 아직 잠긴 기간이면 공개일 (예: 10월 20일(화)) */
  publicFromLabel: string | null;
}) {
  const locked = Boolean(publicFromLabel);
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-2 md:gap-3">
        <Stat icon={Users} label="참여" value={`${count}명`} />
        {locked || !count ? (
          <Stat icon={Lock} label="체감 난이도" value={count ? "잠김" : "-"} sub={count ? `${publicFromLabel} 공개` : undefined} />
        ) : (
          <Stat icon={Gauge} label="체감 난이도" value={difficultyWord(overallAvg)} />
        )}
        {locked || !count ? (
          <Stat icon={Lock} label="시간" value={count ? "잠김" : "-"} />
        ) : (
          <Stat icon={Clock} label="시간" value={timeWord(timeAvg)} />
        )}
      </div>
      <div className="relative overflow-hidden rounded-lg border border-hairline">
        <div aria-hidden className="space-y-3 p-6 blur-[3px] select-none">
          {PLACEHOLDER_BARS.map((w, i) => (
            <div key={i} className="grid grid-cols-[72px_1fr] items-center gap-3">
              <span className="h-3 rounded-full bg-canvas-soft" />
              <span className="h-2.5 rounded-full bg-canvas-soft">
                <span className="block h-full rounded-full bg-primary-subdued" style={{ width: `${w}%` }} />
              </span>
            </div>
          ))}
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-canvas/80 p-6 text-center">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand-dark text-on-primary">
            <Lock className="h-4 w-4" strokeWidth={2} />
          </span>
          <p className="mt-3 type-heading-sm text-ink">상세 결과는 후기를 남긴 응시자만 볼 수 있어요</p>
          <p className="mt-2 max-w-sm type-body-md text-ink-secondary">
            전체 난이도 분포·과목별 체감 난이도·못 푼 문항 수·시간 여유·한 줄 후기를 30초 후기를 남기면 바로 볼 수 있어요.
          </p>
          <a href="#review-form" className="btn btn-primary btn-sm mt-4">
            응시했어요 · 후기 남기고 보기
          </a>
        </div>
      </div>
    </div>
  );
}
