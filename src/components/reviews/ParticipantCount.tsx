import { Flame } from "lucide-react";
import { cn } from "../ui";

/** 많이 모인 후기 — 20명부터 옅은 루비 알약, 50명부터 루비로 채운 알약 + 불꽃 */
export const WARM_REVIEWS = 20;
export const HOT_REVIEWS = 50;

/**
 * 후기 참여 수 — 많이 참여한 시험이 한눈에 보이게 (예전처럼 빨갛게, 지금은 알약 모양으로).
 * 20명 미만은 숫자만 굵게.
 */
export function ParticipantCount({ n, size = "md", suffix = "명", className }: { n: number; size?: "md" | "lg"; suffix?: string; className?: string }) {
  const lg = size === "lg";
  if (n >= WARM_REVIEWS) {
    const hot = n >= HOT_REVIEWS;
    return (
      <span
        title={hot ? "후기가 아주 많이 모였어요" : "후기가 많이 모였어요"}
        className={cn(
          "inline-flex shrink-0 items-center gap-1 rounded-full tabular leading-none font-extrabold whitespace-nowrap",
          lg ? "h-8 px-3 text-[16px]" : "h-6 px-2.5 text-[12.5px]",
          hot ? "bg-ruby text-on-primary" : "bg-ev-doc-soft text-ruby",
          className,
        )}
      >
        {hot && <Flame className={lg ? "h-4 w-4" : "h-3.5 w-3.5"} strokeWidth={2.4} />}
        {n.toLocaleString()}
        <span className={cn("font-semibold", lg ? "text-[13px]" : "text-[11.5px]", hot ? "opacity-85" : "opacity-80")}>{suffix}</span>
      </span>
    );
  }
  return (
    <span className={cn("shrink-0 tabular font-extrabold whitespace-nowrap text-ink", lg ? "text-[20px] leading-tight" : "text-[13px]", className)}>
      {n.toLocaleString()}
      <span className={cn("ml-0.5 font-medium text-ink-mute", lg ? "text-[13px]" : "")}>{suffix}</span>
    </span>
  );
}
