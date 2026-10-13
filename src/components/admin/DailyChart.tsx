"use client";

import { useState } from "react";
import { cn } from "../ui";

export interface DailyPoint {
  day: string;
  visitors: number;
  views: number;
  avgViewMs: number | null;
}

/** 깔끔한 눈금 최댓값 (1·2·5 × 10^n) */
function niceMax(v: number): number {
  if (v <= 4) return 4;
  const p = 10 ** Math.floor(Math.log10(v));
  for (const m of [1, 2, 2.5, 5, 10]) if (m * p >= v) return m * p;
  return 10 * p;
}

const fmtDuration = (ms: number | null) => {
  if (ms == null || ms <= 0) return "-";
  const s = Math.round(ms / 1000);
  return s < 60 ? `${s}초` : `${Math.floor(s / 60)}분 ${s % 60}초`;
};
const nf = new Intl.NumberFormat("ko-KR");
const label = (day: string) => `${Number(day.slice(5, 7))}.${Number(day.slice(8, 10))}`;

/** 일별 방문자 막대 (한 계열이라 범례 없이 제목이 설명) — 막대에 올리면 조회수·머문 시간 */
export function DailyChart({ points, height = 180 }: { points: DailyPoint[]; height?: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = niceMax(Math.max(0, ...points.map((p) => p.visitors)));
  const ticks = [0, max / 4, max / 2, (max * 3) / 4, max];
  const every = points.length > 14 ? Math.ceil(points.length / 8) : 1;

  return (
    <div className="relative">
      <div className="flex gap-2">
        {/* y 눈금 */}
        <div className="relative w-8 shrink-0" style={{ height }} aria-hidden>
          {ticks.map((t) => (
            <span key={t} className="absolute right-0 -translate-y-1/2 tabular type-micro text-ink-mute" style={{ top: `${100 - (t / max) * 100}%` }}>
              {nf.format(Math.round(t))}
            </span>
          ))}
        </div>
        <div className="relative min-w-0 flex-1" style={{ height }}>
          {/* 가로 눈금선 (가는 실선) */}
          {ticks.map((t) => (
            <span key={t} className="absolute inset-x-0 h-px bg-hairline" style={{ top: `${100 - (t / max) * 100}%` }} aria-hidden />
          ))}
          {/* 막대 — 칸 전체가 마우스 영역 */}
          <div className="absolute inset-0 flex items-end gap-0.5" role="list" aria-label="일별 방문자 수">
            {points.map((p, i) => (
              <div
                key={p.day}
                role="listitem"
                tabIndex={0}
                aria-label={`${label(p.day)} 방문자 ${p.visitors}명, 조회 ${p.views}회`}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
                className="flex h-full min-w-0 flex-1 cursor-default items-end justify-center outline-none"
              >
                <span
                  className={cn("block w-full max-w-6 rounded-t-[4px] transition-colors", hover === i ? "bg-primary-deep" : "bg-primary")}
                  style={{ height: `${(p.visitors / max) * 100}%`, minHeight: p.visitors ? 2 : 0 }}
                />
              </div>
            ))}
          </div>
          {/* 툴팁 */}
          {hover != null && points[hover] && (
            <div
              className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-md border border-hairline bg-canvas px-3 py-2 shadow-level-2"
              style={{
                left: `${((hover + 0.5) / points.length) * 100}%`,
                bottom: `${Math.min((points[hover].visitors / max) * 100, 70) + 6}%`,
              }}
            >
              <p className="type-caption !font-normal text-ink">{label(points[hover].day)}</p>
              <p className="mt-0.5 whitespace-nowrap tabular type-micro text-ink-secondary">
                방문자 {nf.format(points[hover].visitors)} · 조회 {nf.format(points[hover].views)}
              </p>
              <p className="whitespace-nowrap tabular type-micro text-ink-mute">평균 머문 시간 {fmtDuration(points[hover].avgViewMs)}</p>
            </div>
          )}
        </div>
      </div>
      {/* x 날짜 */}
      <div className="mt-2 flex gap-0.5 pl-10" aria-hidden>
        {points.map((p, i) => (
          <span key={p.day} className="min-w-0 flex-1 text-center tabular type-micro text-ink-mute">
            {i % every === 0 || i === points.length - 1 ? label(p.day) : ""}
          </span>
        ))}
      </div>
    </div>
  );
}
