import { Jua } from "next/font/google";
import { Soup, Sunrise } from "lucide-react";
import { EDITION_LABEL, type IssueEdition } from "@/lib/news-meta";
import { cn } from "../ui";
import { KongMascot } from "./KongMascot";

/** 브리핑 로고 글씨 — 둥글고 귀여운 한글 글꼴 (로고·표지에만) */
const jua = Jua({ weight: "400", subsets: ["latin"], preload: false, display: "swap" });

export function Sparkle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path d="M12 1.5c.9 5.6 3.9 8.6 9.5 9.5v2c-5.6.9-8.6 3.9-9.5 9.5h-2c-.9-5.6-3.9-8.6-9.5-9.5v-2C6.1 10.1 9.1 7.1 10 1.5z" fill="currentColor" />
    </svg>
  );
}

const SIZE = {
  lg: { box: "py-2.5 pr-6 pl-3 md:pr-8", mascot: "-my-5 -ml-5 h-20 w-20 md:h-24 md:w-24", word: "text-[34px] md:text-[42px]", cap: "text-[10px]", sticker: "text-[15px]", icon: "h-4 w-4" },
  md: { box: "py-2 pr-5 pl-2.5", mascot: "-my-4 -ml-4 h-16 w-16 md:h-[72px] md:w-[72px]", word: "text-[26px] md:text-[32px]", cap: "text-[9px]", sticker: "text-[13px]", icon: "h-3.5 w-3.5" },
  sm: { box: "py-1.5 pr-4 pl-2", mascot: "-my-3 -ml-3 h-12 w-12", word: "text-[21px]", cap: "text-[8px]", sticker: "text-[12px]", icon: "h-3 w-3" },
} as const;

/** 브리핑 로고 — 콩이(아침판 신문·점심판 책) + '금콩 브리핑' + 판 스티커 */
export function Masthead({ edition, size = "lg", className }: { edition: IssueEdition; size?: keyof typeof SIZE; className?: string }) {
  const morning = edition === "morning";
  const s = SIZE[size];
  return (
    <div className={cn("theme-light relative w-fit", className)}>
      <Sparkle className="absolute -top-4 -left-5 h-6 w-6 text-[#ffb36b]" />
      <Sparkle className="absolute -top-2 right-6 h-3.5 w-3.5 text-primary" />
      <Sparkle className="absolute -right-6 bottom-6 h-4 w-4 text-[#56c08a]" />
      <div className={cn("relative flex -rotate-1 items-center gap-1 rounded-[28px] border-[3px] border-brand-dark bg-[#fffaf0] shadow-[5px_5px_0_0_var(--color-brand-dark)]", s.box)}>
        <KongMascot hold={morning ? "news" : "book"} className={s.mascot} />
        <span className="text-left">
          <span className={cn("block font-bold tracking-[0.32em] text-primary-text", s.cap)}>DAILY BRIEFING</span>
          <span className={cn(jua.className, "block leading-[1.1] whitespace-nowrap text-brand-dark [text-shadow:2px_2px_0_#ffcf8a]", s.word)}>금콩 브리핑</span>
        </span>
      </div>
      <span
        className={cn(
          jua.className,
          "absolute -right-3 -bottom-4 inline-flex rotate-3 items-center gap-1 rounded-full border-2 border-brand-dark px-3 py-0.5 whitespace-nowrap text-brand-dark shadow-[2px_2px_0_0_var(--color-brand-dark)]",
          morning ? "bg-[#ffb36b]" : "bg-[#8fd6a8]",
          s.sticker,
        )}
      >
        {morning ? <Sunrise className={s.icon} strokeWidth={2.2} /> : <Soup className={s.icon} strokeWidth={2.2} />}
        {EDITION_LABEL[edition]}
      </span>
    </div>
  );
}

/**
 * 브리핑 표지(썸네일) — 판별 하늘색 + 해/점 무늬 + 로고 + 날짜.
 * 사진 저작권 걱정 없이 매일 자동으로 만들어져요.
 */
export function BriefingCover({
  edition,
  date,
  note,
  size = "md",
  className,
}: {
  edition: IssueEdition;
  /** 'M.D (요일)' 처럼 보여 줄 날짜 */
  date: string;
  /** 오른쪽 아래 작은 글씨 (예: 기사 7건 · 퀴즈 4문제) */
  note?: string;
  size?: "md" | "sm";
  className?: string;
}) {
  const morning = edition === "morning";
  return (
    <div
      aria-hidden
      className={cn(
        "theme-light relative flex items-center justify-center overflow-hidden",
        morning ? "bg-linear-to-b from-[#ffd9ae] via-[#ffeedb] to-[#fffaf0]" : "bg-linear-to-b from-[#bfe9cf] via-[#e3f6ea] to-[#f8fff9]",
        className,
      )}
    >
      {/* 해(아침) · 그릇 위 김(점심) 느낌의 둥근 빛 */}
      <span className={cn("absolute -top-16 right-[8%] h-48 w-48 rounded-full blur-[2px]", morning ? "bg-[#ffb36b]/70" : "bg-[#8fd6a8]/70")} />
      <span className={cn("absolute -top-8 right-[calc(8%+2.5rem)] h-28 w-28 rounded-full", morning ? "bg-[#ffcf8a]" : "bg-[#b8e8c9]")} />
      <span className="absolute inset-0 bg-[radial-gradient(rgba(28,30,84,0.09)_1.2px,transparent_1.2px)] bg-[length:16px_16px]" />
      <span className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-[#fffaf0]/80 blur-xl" />
      <Sparkle className={cn("absolute top-[18%] left-[10%] text-[#ffb36b]", size === "sm" ? "h-4 w-4" : "h-6 w-6")} />
      <Sparkle className={cn("absolute bottom-[22%] right-[14%] text-primary/60", size === "sm" ? "h-3 w-3" : "h-4 w-4")} />

      <Masthead edition={edition} size={size === "sm" ? "sm" : "md"} className="relative" />

      <span className={cn(jua.className, "absolute bottom-3 left-4 rounded-full bg-brand-dark px-3 py-1 text-on-primary", size === "sm" ? "text-[13px]" : "text-[15px] md:bottom-4 md:left-5")}>
        {date}
      </span>
      {note && (
        <span className={cn("absolute right-4 bottom-3 rounded-full border border-brand-dark/15 bg-[#fffaf0]/90 px-2.5 py-1 font-semibold text-brand-dark", size === "sm" ? "text-[11px]" : "text-[12px] md:right-5 md:bottom-4")}>
          {note}
        </span>
      )}
    </div>
  );
}
