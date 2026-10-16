import { useId } from "react";
import { cn } from "../ui";

/**
 * 금콩 마스코트 '콩이' — 로고의 콩에 얼굴과 새싹을 붙인 캐릭터.
 * hold: 아침판은 신문(news), 점심판은 책(book)을 들고 있어요.
 */
export function KongMascot({ className, wave = false, hold }: { className?: string; wave?: boolean; hold?: "news" | "book" }) {
  const id = useId().replace(/:/g, "");
  const ink = "#1c1e54";
  return (
    <svg viewBox="0 0 64 64" className={cn("shrink-0 overflow-visible", className)} aria-hidden>
      <defs>
        <linearGradient id={`kg-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f8eedc" />
          <stop offset="1" stopColor="#ffa26b" />
        </linearGradient>
      </defs>
      {/* 새싹 */}
      <path d="M40.5 9.5c-.6-3.6 1.4-6.6 5.4-7.4-.2 3.8-2 6.4-5.4 7.4z" fill="#3fa36b" />
      <path d="M40 9.8c-2.6-1.6-5.6-1.2-7.2 1.2 2.8 1.2 5.2 1 7.2-1.2z" fill="#56c08a" />
      {/* 몸 */}
      <path
        d="M41 9.5c9 3.2 13.6 14.4 10.4 26-2.8 10.2-9.8 17-18.8 19.8-9.6 3-19.4-1.4-22-10.2-2.4-8 2.2-13.8 8.2-16.8 5-2.5 7-6.4 9-11.4 2.6-6.2 7.2-9.4 13.2-7.4z"
        fill={`url(#kg-${id})`}
        stroke={ink}
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <path d="M39 15.5c-2.8 1.4-3.8 4.6-4.8 7.6" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" fill="none" opacity=".85" />
      {/* 눈 · 볼 · 입 */}
      <circle cx="26.5" cy="36.5" r="2.6" fill={ink} />
      <circle cx="38.5" cy="33.5" r="2.6" fill={ink} />
      <circle cx="27.3" cy="35.6" r=".8" fill="#fff" />
      <circle cx="39.3" cy="32.6" r=".8" fill="#fff" />
      <ellipse cx="22.5" cy="42.2" rx="3.1" ry="1.8" fill="#ff7a8a" opacity=".55" />
      <ellipse cx="43.6" cy="38.6" rx="3.1" ry="1.8" fill="#ff7a8a" opacity=".55" />
      <path d="M29.6 41.4c2 1.9 5 1.5 6.6-.6" stroke={ink} strokeWidth="2" strokeLinecap="round" fill="none" />

      {hold === "news" ? (
        <>
          {/* 신문 */}
          <g transform="rotate(-9 46 53)">
            <rect x="33" y="45" width="26" height="17" rx="2" fill="#fff" stroke={ink} strokeWidth="2" />
            <rect x="36" y="48" width="9" height="5.5" rx="1" fill="#533afd" opacity=".85" />
            <path d="M47.5 49h8.5M47.5 52.5h8.5M36 56.5h20M36 59h14" stroke={ink} strokeWidth="1.3" strokeLinecap="round" />
          </g>
          <path d="M16 44c3 5 9 8 17 8.5" stroke={ink} strokeWidth="2.2" strokeLinecap="round" fill="none" />
          <path d="M51 33c4 3 6.5 7 7 11" stroke={ink} strokeWidth="2.2" strokeLinecap="round" fill="none" />
        </>
      ) : hold === "book" ? (
        <>
          {/* 펼친 책 */}
          <path d="M21 50.5c5.4-2.2 10.6-2 15 1.2v11.6c-4.4-3.2-9.6-3.4-15-1.2z" fill="#fff" stroke={ink} strokeWidth="2" strokeLinejoin="round" />
          <path d="M51 50.5c-5.4-2.2-10.6-2-15 1.2v11.6c4.4-3.2 9.6-3.4 15-1.2z" fill="#fff" stroke={ink} strokeWidth="2" strokeLinejoin="round" />
          <path d="M24.5 54.5c3-1 6-.8 8.5.6M24.5 57.6c3-1 6-.8 8.5.6M39 55.1c2.5-1.4 5.5-1.6 8.5-.6M39 58.2c2.5-1.4 5.5-1.6 8.5-.6" stroke="#3fa36b" strokeWidth="1.3" strokeLinecap="round" fill="none" />
          <path d="M14 43c1 4 3.5 7 7 8.5M54 34c1.5 5 .5 11.5-3 16" stroke={ink} strokeWidth="2.2" strokeLinecap="round" fill="none" />
        </>
      ) : (
        <>
          {wave ? (
            <path d="M50.6 30.5c3.2-1.6 5.6-4.4 6.4-7.6" stroke={ink} strokeWidth="2.2" strokeLinecap="round" fill="none" />
          ) : (
            <path d="M50.4 34c2.6.8 4.4 2.6 5 5" stroke={ink} strokeWidth="2.2" strokeLinecap="round" fill="none" />
          )}
          <path d="M12.6 41.5c-2.6.4-4.4 2-5.2 4.4" stroke={ink} strokeWidth="2.2" strokeLinecap="round" fill="none" />
        </>
      )}
    </svg>
  );
}

/** 기사 사이 쉼표 — 콩이가 말풍선으로 한마디 */
export function MascotDivider({ text, flip = false }: { text: string; flip?: boolean }) {
  return (
    <div className={cn("my-10 flex items-end gap-2", flip && "flex-row-reverse")} aria-hidden>
      <KongMascot className="h-11 w-11" wave={flip} />
      <span className="relative mb-7 shrink-0 rounded-full border-2 border-brand-dark bg-canvas px-3 py-1 type-caption font-semibold text-brand-dark">
        {text}
      </span>
      <span className="mb-3 h-0 flex-1 border-t-[3px] border-dotted border-primary/40" />
    </div>
  );
}
