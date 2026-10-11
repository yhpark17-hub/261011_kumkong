import { cn } from "../ui";

/** 목록 카드용 작은 난이도 막대 (1~5) */
export function DifficultyMeter({ avg, className }: { avg: number | null; className?: string }) {
  return (
    <span className={cn("flex gap-0.5", className)} aria-label={avg != null ? `평균 난이도 ${avg.toFixed(1)}` : "참여 없음"}>
      {[1, 2, 3, 4, 5].map((v) => (
        <span
          key={v}
          className={cn(
            "h-1.5 flex-1 rounded-full",
            avg != null && avg >= v - 0.5 ? (v >= 4 ? "bg-ruby" : "bg-primary") : "bg-canvas-soft",
          )}
        />
      ))}
    </span>
  );
}
