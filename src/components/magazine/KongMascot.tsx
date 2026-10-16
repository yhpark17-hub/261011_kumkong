import { useId } from "react";
import { cn } from "../ui";

const INK = "#1c1e54";
const BODY =
  "M41 9.5c9 3.2 13.6 14.4 10.4 26-2.8 10.2-9.8 17-18.8 19.8-9.6 3-19.4-1.4-22-10.2-2.4-8 2.2-13.8 8.2-16.8 5-2.5 7-6.4 9-11.4 2.6-6.2 7.2-9.4 13.2-7.4z";

export type KongHold = "news" | "book" | "resume" | "pass" | "pencil";

/** 손에 든 종이 (신문·원서·합격 통지) — 같은 자리, 안쪽 그림만 달라요 */
function Paper({ children }: { children: React.ReactNode }) {
  return (
    <>
      <g transform="rotate(-9 46 53)">
        <rect x="33" y="45" width="26" height="17" rx="2" fill="#fff" stroke={INK} strokeWidth="2" />
        {children}
      </g>
      <path d="M16 44c3 5 9 8 17 8.5" stroke={INK} strokeWidth="2.2" strokeLinecap="round" fill="none" />
      <path d="M51 33c4 3 6.5 7 7 11" stroke={INK} strokeWidth="2.2" strokeLinecap="round" fill="none" />
    </>
  );
}

/**
 * 금콩 마스코트 '콩이' — 로고의 콩에 얼굴과 새싹을 붙인 캐릭터.
 * hold: 손에 든 것 (신문·책·원서·합격 통지·연필) / glasses: 안경 / tie: 넥타이 / suit: 정장(합격) / sweat: 긴장한 땀방울
 */
export function KongMascot({
  className,
  wave = false,
  hold,
  glasses = false,
  tie = false,
  suit = false,
  sweat = false,
}: {
  className?: string;
  wave?: boolean;
  hold?: KongHold;
  glasses?: boolean;
  tie?: boolean;
  suit?: boolean;
  sweat?: boolean;
}) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 64 64" className={cn("shrink-0 overflow-visible", className)} aria-hidden>
      <defs>
        <linearGradient id={`kg-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f8eedc" />
          <stop offset="1" stopColor="#ffa26b" />
        </linearGradient>
        <clipPath id={`kc-${id}`}>
          <path d={BODY} />
        </clipPath>
      </defs>
      {/* 새싹 */}
      <path d="M40.5 9.5c-.6-3.6 1.4-6.6 5.4-7.4-.2 3.8-2 6.4-5.4 7.4z" fill="#3fa36b" />
      <path d="M40 9.8c-2.6-1.6-5.6-1.2-7.2 1.2 2.8 1.2 5.2 1 7.2-1.2z" fill="#56c08a" />
      {/* 몸 */}
      <path d={BODY} fill={`url(#kg-${id})`} />
      <path d="M39 15.5c-2.8 1.4-3.8 4.6-4.8 7.6" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" fill="none" opacity=".85" />
      {/* 정장 — 몸 모양대로 잘라서 아래쪽만 */}
      {suit && (
        <g clipPath={`url(#kc-${id})`}>
          <rect x="0" y="45.5" width="64" height="20" fill={INK} />
          <path d="M26.5 45.5 32 57l5.5-11.5z" fill="#fff" />
          <path d="M31 46.6h2l.9 1.4-.9 6.2-1 1.2-1-1.2-.9-6.2z" fill="#ea2261" />
          <path d="M26.5 45.5 30 53M37.5 45.5 34 53" stroke="#3a3d8f" strokeWidth="1.4" fill="none" />
          {/* 사원증 */}
          <rect x="39.5" y="49" width="6" height="7.5" rx="1" fill="#fff" />
          <rect x="40.7" y="50.2" width="3.6" height="2.4" rx=".5" fill="#ffb36b" />
        </g>
      )}
      {/* 면접 — 하늘색 셔츠와 흰 깃 (몸 모양대로 아래쪽만) */}
      {tie && !suit && (
        <g clipPath={`url(#kc-${id})`}>
          <rect x="0" y="45.5" width="64" height="20" fill="#d6e4ff" />
          <path d="M0 45.5h64" stroke={INK} strokeWidth="1.3" />
          <path d="M26.2 45.5 32 50.4l5.8-4.9z" fill="#fff" stroke={INK} strokeWidth="1.3" strokeLinejoin="round" />
        </g>
      )}
      <path d={BODY} fill="none" stroke={INK} strokeWidth="2.2" strokeLinejoin="round" />
      {/* 눈 · 볼 · 입 */}
      <circle cx="26.5" cy="36.5" r="2.6" fill={INK} />
      <circle cx="38.5" cy="33.5" r="2.6" fill={INK} />
      <circle cx="27.3" cy="35.6" r=".8" fill="#fff" />
      <circle cx="39.3" cy="32.6" r=".8" fill="#fff" />
      {glasses && (
        <>
          <circle cx="26.5" cy="36.5" r="4.8" fill="#fff" fillOpacity=".22" stroke={INK} strokeWidth="1.7" />
          <circle cx="38.5" cy="33.5" r="4.8" fill="#fff" fillOpacity=".22" stroke={INK} strokeWidth="1.7" />
          <path d="M31.2 35.5c1-.9 2.1-1.2 3.1-1.2" stroke={INK} strokeWidth="1.7" strokeLinecap="round" fill="none" />
          <path d="M21.8 37.4l-3 .9M43.2 32.4l2.9-1.3" stroke={INK} strokeWidth="1.5" strokeLinecap="round" />
        </>
      )}
      <ellipse cx="22.5" cy="42.2" rx="3.1" ry="1.8" fill="#ff7a8a" opacity=".55" />
      <ellipse cx="43.6" cy="38.6" rx="3.1" ry="1.8" fill="#ff7a8a" opacity=".55" />
      <path d="M29.6 41.4c2 1.9 5 1.5 6.6-.6" stroke={INK} strokeWidth="2" strokeLinecap="round" fill="none" />
      {sweat && (
        <path d="M54.6 13.5c1.7 2.5 2.6 4 2.6 5.3a2.6 2.6 0 0 1-5.2 0c0-1.3.9-2.8 2.6-5.3z" fill="#9fd8ff" stroke={INK} strokeWidth="1.3" strokeLinejoin="round" />
      )}
      {/* 넥타이 (면접) */}
      {tie && !suit && (
        <>
          <path d="M29.9 46.6h4.2l-.8 2.6h-2.6z" fill="#ea2261" stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
          <path d="M30.7 49.2h2.6l1.5 4.6-2.8 2.4-2.8-2.4z" fill="#ea2261" stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
        </>
      )}

      {hold === "news" ? (
        <Paper>
          <rect x="36" y="48" width="9" height="5.5" rx="1" fill="#533afd" opacity=".85" />
          <path d="M47.5 49h8.5M47.5 52.5h8.5M36 56.5h20M36 59h14" stroke={INK} strokeWidth="1.3" strokeLinecap="round" />
        </Paper>
      ) : hold === "resume" ? (
        <Paper>
          <rect x="36" y="48" width="6" height="7" rx="1" fill="#b9b9f9" />
          <path d="M44.5 49h11M44.5 52h11M36 58h20" stroke={INK} strokeWidth="1.3" strokeLinecap="round" />
        </Paper>
      ) : hold === "pass" ? (
        <Paper>
          <path d="M39.5 53.5l4 3.8 8-9" stroke="#3fa36b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </Paper>
      ) : hold === "book" ? (
        <>
          <path d="M21 50.5c5.4-2.2 10.6-2 15 1.2v11.6c-4.4-3.2-9.6-3.4-15-1.2z" fill="#fff" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
          <path d="M51 50.5c-5.4-2.2-10.6-2-15 1.2v11.6c4.4-3.2 9.6-3.4 15-1.2z" fill="#fff" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
          <path d="M24.5 54.5c3-1 6-.8 8.5.6M24.5 57.6c3-1 6-.8 8.5.6M39 55.1c2.5-1.4 5.5-1.6 8.5-.6M39 58.2c2.5-1.4 5.5-1.6 8.5-.6" stroke="#3fa36b" strokeWidth="1.3" strokeLinecap="round" fill="none" />
          <path d="M14 43c1 4 3.5 7 7 8.5M54 34c1.5 5 .5 11.5-3 16" stroke={INK} strokeWidth="2.2" strokeLinecap="round" fill="none" />
        </>
      ) : hold === "pencil" ? (
        <>
          <g transform="rotate(28 55 44)">
            <rect x="52.5" y="31" width="5" height="16" rx="1" fill="#ffcf4d" stroke={INK} strokeWidth="1.6" />
            <rect x="52.5" y="31" width="5" height="3.2" fill="#ff7a8a" stroke={INK} strokeWidth="1.6" />
            <path d="M52.5 47l2.5 5 2.5-5z" fill="#f8e0b0" stroke={INK} strokeWidth="1.4" strokeLinejoin="round" />
          </g>
          <path d="M50.4 36c2.4.6 3.6 2 3.8 4" stroke={INK} strokeWidth="2.2" strokeLinecap="round" fill="none" />
          <path d="M12.6 41.5c-2.6.4-4.4 2-5.2 4.4" stroke={INK} strokeWidth="2.2" strokeLinecap="round" fill="none" />
        </>
      ) : (
        <>
          {wave ? (
            <path d="M50.6 30.5c3.2-1.6 5.6-4.4 6.4-7.6" stroke={INK} strokeWidth="2.2" strokeLinecap="round" fill="none" />
          ) : (
            <path d="M50.4 34c2.6.8 4.4 2.6 5 5" stroke={INK} strokeWidth="2.2" strokeLinecap="round" fill="none" />
          )}
          <path d="M12.6 41.5c-2.6.4-4.4 2-5.2 4.4" stroke={INK} strokeWidth="2.2" strokeLinecap="round" fill="none" />
        </>
      )}
    </svg>
  );
}

/** 읽은 정도에 따라 바뀌는 콩이 옷차림 — 취준생에서 시작해 끝까지 읽으면 정장 입은 합격 콩이 */
type Look = { hold?: KongHold; glasses?: boolean; tie?: boolean; suit?: boolean; sweat?: boolean; wave?: boolean };
const LOOKS: Look[] = [
  { hold: "resume" }, // 원서 든 취준생
  { hold: "pass" }, // 서류 합격 통지
  { hold: "pencil", glasses: true }, // 필기 공부
  { tie: true, wave: true }, // 면접
  { tie: true, sweat: true }, // 최종 면접
];
const lookAt = (progress: number): Look => (progress >= 1 ? { suit: true, wave: true } : LOOKS[Math.min(LOOKS.length - 1, Math.max(0, Math.floor(progress * LOOKS.length)))]);

/**
 * 읽은 정도 쉼표 — 빈 바에 지금 어디쯤인지 대략 채워 보이고, 그 끝에 콩이가 본문 흐름에 맞는 한마디를 해요.
 * progress: 0~1 (1 = 끝까지 읽음). 글자나 퍼센트는 적지 않아요.
 */
export function ReadingProgress({ progress, say }: { progress: number; say: string }) {
  const p = Math.min(1, Math.max(0, progress));
  const done = p >= 1;
  // 콩이는 채워진 끝 위에 (양끝에서는 안쪽으로)
  const kong = `clamp(0px, calc(${p} * 100% - 26px), calc(100% - 52px))`;
  return (
    <div className="my-8 px-1" role="img" aria-label={done ? `끝까지 읽었어요. ${say}` : `읽은 정도 표시. ${say}`}>
      <div className="relative h-[60px]">
        <span className="absolute bottom-0" style={{ left: kong }}>
          <KongMascot className="h-[52px] w-[52px]" {...lookAt(p)} />
        </span>
        <span
          className={cn(
            "absolute bottom-[28px] w-max rounded-2xl border-2 border-brand-dark px-3 py-1 type-caption font-semibold text-brand-dark [word-break:keep-all]",
            done ? "bg-[#ffcf8a]" : "bg-canvas",
          )}
          style={
            p <= 0.5
              ? { left: `calc(${kong} + 54px)`, maxWidth: `calc(100% - ${kong} - 54px)` }
              : { right: `calc(100% - ${kong} + 2px)`, maxWidth: `calc(${kong} - 2px)` }
          }
        >
          {say}
        </span>
        {done && (
          <>
            <span aria-hidden className="absolute top-0 right-3 h-2 w-2 rotate-12 rounded-[2px] bg-[#ff7a8a]" />
            <span aria-hidden className="absolute top-4 right-0 h-1.5 w-1.5 -rotate-12 rounded-[2px] bg-primary" />
            <span aria-hidden className="absolute top-1 right-12 h-2 w-1 rotate-45 rounded-[2px] bg-[#56c08a]" />
          </>
        )}
      </div>
      {/* 빈 바 — 읽은 만큼만 채움 */}
      <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-brand-dark/10">
        <div className="h-full rounded-full bg-linear-to-r from-[#ffb36b] to-primary" style={{ width: `${p * 100}%` }} />
      </div>
    </div>
  );
}
