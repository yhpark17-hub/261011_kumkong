import { difficultyWord } from "@/lib/review-meta";
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

/** 체감 난이도 한 단어를 색과 함께 (어려움 빨강 · 보통 보라 · 쉬움 파랑) — 목록·홈 칸용 */
export function DifficultyTag({ avg, className }: { avg: number; className?: string }) {
  const tone = avg >= 3.4 ? "bg-ev-doc-soft text-ev-doc" : avg >= 2.6 ? "bg-ev-written-soft text-ev-written" : "bg-ev-final-soft text-ev-final";
  return <span className={cn("tag shrink-0 font-semibold", tone, className)}>{difficultyWord(avg)}</span>;
}
