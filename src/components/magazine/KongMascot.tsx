import { useId } from "react";
import { cn } from "../ui";

/** 금콩 마스코트 '콩이' — 로고의 콩에 얼굴과 새싹을 붙인 캐릭터 */
export function KongMascot({ className, wave = false }: { className?: string; wave?: boolean }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 64 64" className={cn("shrink-0", className)} aria-hidden>
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
        stroke="#1c1e54"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <path d="M39 15.5c-2.8 1.4-3.8 4.6-4.8 7.6" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" fill="none" opacity=".85" />
      {/* 눈 · 볼 · 입 */}
      <circle cx="26.5" cy="38.5" r="2.6" fill="#1c1e54" />
      <circle cx="38.5" cy="35.5" r="2.6" fill="#1c1e54" />
      <circle cx="27.3" cy="37.6" r=".8" fill="#fff" />
      <circle cx="39.3" cy="34.6" r=".8" fill="#fff" />
      <ellipse cx="22.5" cy="44.2" rx="3.1" ry="1.8" fill="#ff7a8a" opacity=".55" />
      <ellipse cx="43.6" cy="40.6" rx="3.1" ry="1.8" fill="#ff7a8a" opacity=".55" />
      <path d="M29.6 43.4c2 1.9 5 1.5 6.6-.6" stroke="#1c1e54" strokeWidth="2" strokeLinecap="round" fill="none" />
      {/* 손 */}
      {wave ? (
        <path d="M50.6 30.5c3.2-1.6 5.6-4.4 6.4-7.6" stroke="#1c1e54" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      ) : (
        <path d="M50.4 34c2.6.8 4.4 2.6 5 5" stroke="#1c1e54" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      )}
      <path d="M12.6 41.5c-2.6.4-4.4 2-5.2 4.4" stroke="#1c1e54" strokeWidth="2.2" strokeLinecap="round" fill="none" />
    </svg>
  );
}

/** 기사 사이 쉼표 — 콩이가 말풍선으로 한마디 (샘플의 기차 구분선처럼) */
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
