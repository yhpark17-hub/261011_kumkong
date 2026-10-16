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

/** 금공 취업 여정 — 브리핑을 읽어 내려갈수록 콩이가 한 단계씩 나아가요 */
type Look = { hold?: KongHold; glasses?: boolean; tie?: boolean; suit?: boolean; sweat?: boolean; wave?: boolean };
const JOURNEY: { label: string; say: string; look: Look }[] = [
  { label: "원서", say: "원서 냈콩!", look: { hold: "resume" } },
  { label: "서류", say: "서류 붙었콩!", look: { hold: "pass" } },
  { label: "필기", say: "필기 공부 중이콩", look: { hold: "pencil", glasses: true } },
  { label: "1차 면접", say: "면접 준비 됐콩!", look: { tie: true, wave: true } },
  { label: "최종 면접", say: "마지막 면접이콩!", look: { tie: true, sweat: true } },
  { label: "합격", say: "최종 합격했콩!", look: { suit: true, wave: true } },
];
/** 마지막 단계(합격) — 브리핑을 끝까지 읽었을 때만 */
export const JOURNEY_DONE = JOURNEY.length - 1;

/** 사이 칸 count 개 중 index 번째에 보일 단계 (원서 ~ 최종 면접에 고르게 나눔) */
export function journeyStage(index: number, count: number): number {
  if (count <= 1) return 0;
  return Math.min(JOURNEY_DONE - 1, Math.round((index * (JOURNEY_DONE - 1)) / (count - 1)));
}

/**
 * 읽은 만큼 보여 주는 쉼표 — 원서 → 서류 → 필기 → 면접 → 합격 길 위에 콩이가 서 있어요.
 * 퍼센트 대신 '취업 과정 어디쯤 왔는지'로 읽은 정도를 보여 주고, 끝까지 읽으면 정장 입은 합격 콩이.
 */
export function JourneyDivider({ stage }: { stage: number }) {
  const s = JOURNEY[stage];
  const p = stage / JOURNEY_DONE;
  const done = stage === JOURNEY_DONE;
  // 길 위 점의 가로 위치 (양끝 9px 여백) · 콩이는 점 위에, 넘치면 안쪽으로
  const x = (q: number) => `(9px + (100% - 18px) * ${q})`;
  const kong = `clamp(0px, calc(${x(p)} - 26px), calc(100% - 52px))`;
  return (
    <div className="my-8 px-1" role="img" aria-label={`여기까지 읽었어요 — 취업 여정 ${s.label} 단계`}>
      <div className="relative h-[64px]">
        <span className="absolute bottom-0" style={{ left: kong }}>
          <KongMascot className="h-[52px] w-[52px]" {...s.look} />
        </span>
        <span
          className={cn(
            "absolute bottom-[30px] rounded-full border-2 border-brand-dark px-3 py-1 type-caption font-semibold whitespace-nowrap text-brand-dark",
            done ? "bg-[#ffcf8a]" : "bg-canvas",
          )}
          style={p <= 0.5 ? { left: `calc(${kong} + 54px)` } : { right: `calc(100% - ${kong} + 2px)` }}
        >
          {s.say}
        </span>
        {done && (
          <>
            <span aria-hidden className="absolute top-0 right-3 h-2 w-2 rotate-12 rounded-[2px] bg-[#ff7a8a]" />
            <span aria-hidden className="absolute top-4 right-0 h-1.5 w-1.5 -rotate-12 rounded-[2px] bg-primary" />
            <span aria-hidden className="absolute top-1 right-12 h-2 w-1 rotate-45 rounded-[2px] bg-[#56c08a]" />
            <span aria-hidden className="absolute top-6 right-16 h-1.5 w-1.5 rotate-45 rounded-[2px] bg-[#ffb36b]" />
          </>
        )}
      </div>
      {/* 길: 지나온 곳은 진하게, 남은 곳은 점선 */}
      <div className="relative mt-1.5 h-9">
        <span className="absolute top-[6px] right-[9px] left-[9px] border-t-[3px] border-dotted border-primary/30" />
        <span className="absolute top-[6px] left-[9px] h-[3px] rounded-full bg-primary" style={{ width: `calc((100% - 18px) * ${p})` }} />
        {JOURNEY.map((j, i) => {
          const passed = i <= stage;
          return (
            <span key={j.label} className="absolute top-0 flex -translate-x-1/2 flex-col items-center" style={{ left: `calc${x(i / JOURNEY_DONE)}` }}>
              <span className={cn("h-[15px] w-[15px] rounded-full border-[3px]", passed ? "border-primary bg-primary" : "border-primary/30 bg-canvas", i === stage && "ring-4 ring-primary/20")} />
              <span className={cn("mt-1 text-[11px] leading-none whitespace-nowrap", i === stage ? "font-bold text-primary-text" : passed ? "text-ink-secondary" : "text-ink-mute")}>
                {j.label}
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
