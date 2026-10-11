"use client";

import { Check } from "lucide-react";
import { formatRange } from "@/lib/date";
import { sortedEvents } from "@/lib/schedule";
import { useTodayKey } from "@/lib/hooks";
import { EVENT_META } from "@/lib/meta";
import type { Recruitment } from "@/lib/types";
import { DDayBadge } from "../client-ui";
import { cn } from "../ui";

export function RecruitTimeline({ recruitment }: { recruitment: Recruitment }) {
  const today = useTodayKey();
  const events = sortedEvents(recruitment);
  const nextIdx = today ? events.findIndex((e) => (e.endDate ?? e.date) >= today) : -1;

  if (!events.length) {
    return (
      <p className="card-cream p-4 text-ink-secondary">
        아직 확인된 채용 일정이 없어요. 관심기관으로 등록해 두면 공고가 나왔을 때 달력에서 바로 확인할 수
        있어요.
      </p>
    );
  }

  return (
    <ol className="relative">
      {events.map((e, i) => {
        const m = EVENT_META[e.type];
        const past = today != null && (e.endDate ?? e.date) < today;
        const isNext = i === nextIdx;
        const last = i === events.length - 1;
        return (
          <li key={`${e.type}-${i}`} className="relative flex gap-3 pb-4 last:pb-0">
            {!last && (
              <span
                className={cn("absolute top-6 bottom-0 left-[11px] w-px", past ? "bg-hairline-input" : "bg-hairline")}
                aria-hidden
              />
            )}
            <span
              className={cn(
                "relative z-10 mt-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                past ? "border border-hairline bg-canvas-soft text-ink-mute" : cn(m.soft, m.text),
                isNext && "ring-2 ring-current ring-offset-2 ring-offset-canvas",
              )}
            >
              {past ? (
                <Check className="h-3.5 w-3.5" strokeWidth={1.75} />
              ) : (
                <span className={cn("h-2 w-2 rounded-full", m.dot)} />
              )}
            </span>
            <div
              className={cn(
                "flex min-w-0 flex-1 flex-wrap items-start justify-between gap-x-3 gap-y-1 rounded-md px-3 py-2",
                isNext && m.soft,
              )}
            >
              <div className="min-w-0">
                <p className={cn("type-body-md !font-normal", past ? "text-ink-mute" : "text-ink")}>
                  {e.label ?? m.label}
                  {recruitment.status === "expected" && (
                    <span className="ml-2 type-caption text-ink-mute">(예상)</span>
                  )}
                </p>
                <p className={cn("mt-1 type-body-tabular", past ? "text-ink-mute" : "text-ink-secondary")}>
                  {formatRange(e.date, e.endDate)}
                  {e.time && ` ${e.time}`}
                </p>
                {e.note && <p className="mt-1 type-micro text-ink-mute">{e.note}</p>}
              </div>
              {!past && <DDayBadge date={e.date} endDate={e.endDate} size="sm" />}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
