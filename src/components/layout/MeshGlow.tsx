import { cn } from "../ui";

/** [cx, cy, rx, ry, 색, 진하기] — 흐리게 번지는 타원 하나 */
type Blob = readonly [number, number, number, number, string, number];

/* 10월 처음 금콩의 번짐 색: 크림 · 셔벗 주황 · 라벤더 · 보라 · 루비 · 마젠타 (글자가 놓이는 왼쪽·위쪽은 옅게) */
const HERO_PC: readonly Blob[] = [
  [110, 30, 360, 170, "#f5e9d4", 0.9],
  [470, 0, 300, 130, "#ffa26b", 0.45],
  [780, 40, 360, 130, "#b9b9f9", 0.75],
  [1070, 250, 300, 150, "#533afd", 0.7],
  [1270, 330, 250, 130, "#ea2261", 0.55],
  [1340, 90, 240, 130, "#f96bee", 0.5],
  [560, 420, 420, 90, "#b9b9f9", 0.28],
];
const HERO_M: readonly Blob[] = [
  [40, 20, 200, 110, "#f5e9d4", 0.9],
  [250, 0, 170, 90, "#ffa26b", 0.45],
  [380, 110, 150, 110, "#f96bee", 0.42],
  [330, 300, 170, 110, "#533afd", 0.38],
  [60, 330, 170, 90, "#b9b9f9", 0.45],
];

function Mesh({ id, blobs, w, h, blur, className }: { id: string; blobs: readonly Blob[]; w: number; h: number; blur: number; className?: string }) {
  return (
    <svg aria-hidden viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMin slice" className={cn("absolute inset-0 h-full w-full", className)}>
      <defs>
        <filter id={id} x="-50%" y="-80%" width="200%" height="260%">
          <feGaussianBlur stdDeviation={blur} />
        </filter>
      </defs>
      <g filter={`url(#${id})`}>
        {blobs.map(([cx, cy, rx, ry, fill, o], i) => (
          <ellipse key={i} cx={cx} cy={cy} rx={rx} ry={ry} fill={fill} fillOpacity={o} />
        ))}
      </g>
    </svg>
  );
}

/**
 * 홈 첫 칸의 색 번짐 — 사이트 머리 뒤까지 올라가게 머리 높이만큼 위로 (휴대폰 56px · 컴퓨터 68px).
 * 그림 대신 색만 은은하게 — 아래쪽은 흰 바탕으로 사라져요.
 */
export function HeroMesh() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 -top-14 -z-10 h-[430px] overflow-hidden md:-top-[68px] md:h-[640px]"
      style={{ opacity: "var(--mesh-opacity)" }}
    >
      <Mesh id="kk-mesh-pc" blobs={HERO_PC} w={1440} h={620} blur={70} className="hidden md:block" />
      <Mesh id="kk-mesh-m" blobs={HERO_M} w={390} h={430} blur={46} className="md:hidden" />
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-b from-transparent to-canvas" />
    </div>
  );
}

/** 화면 머리 오른쪽의 옅은 번짐 — 홈과 같은 색을 아주 옅게 (가벼운 CSS 그라데이션) */
export function HeaderGlow({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0", className)}
      style={{
        opacity: "var(--mesh-opacity)",
        background:
          "radial-gradient(42% 95% at 84% 15%, rgba(185,185,249,0.78), transparent 70%), radial-gradient(30% 85% at 99% 100%, rgba(249,107,238,0.42), transparent 70%), radial-gradient(32% 70% at 68% 115%, rgba(255,162,107,0.36), transparent 70%)",
      }}
    />
  );
}
