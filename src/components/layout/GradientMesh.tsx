/**
 * Gradient Mesh Backdrop (DESIGN.md Signature Component)
 * cream → sherbet orange → lavender → indigo → ruby/magenta 를 화면 상단 1/3에 가로로 번지게 깝니다.
 * 문서 권장대로 CSS 그라디언트가 아닌 SVG 블롭 + 블러로 구현하고, 아래쪽은 canvas 로 자연스럽게 사라집니다.
 */
export function GradientMesh() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] overflow-hidden md:h-[560px]"
      style={{ opacity: "var(--mesh-opacity)" }}
    >
      <svg
        className="h-full w-full"
        viewBox="0 0 1440 560"
        preserveAspectRatio="xMidYMin slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id="kk-mesh-blur" x="-30%" y="-60%" width="160%" height="220%">
            <feGaussianBlur stdDeviation="72" />
          </filter>
        </defs>
        <g filter="url(#kk-mesh-blur)">
          {/* 상단(내비 영역)은 밝은 스톱, 진한 indigo·ruby 는 아래쪽 오른편에 두어 메뉴 글자 대비를 지킵니다 */}
          <ellipse cx="80" cy="60" rx="380" ry="190" fill="#f5e9d4" />
          <ellipse cx="430" cy="40" rx="320" ry="140" fill="#ffa26b" fillOpacity="0.65" />
          <ellipse cx="760" cy="40" rx="360" ry="120" fill="#b9b9f9" fillOpacity="0.8" />
          <ellipse cx="1040" cy="190" rx="300" ry="130" fill="#533afd" fillOpacity="0.8" />
          <ellipse cx="1260" cy="230" rx="240" ry="110" fill="#ea2261" fillOpacity="0.7" />
          <ellipse cx="1360" cy="70" rx="240" ry="120" fill="#f96bee" fillOpacity="0.55" />
          <ellipse cx="600" cy="260" rx="420" ry="90" fill="#b9b9f9" fillOpacity="0.4" />
        </g>
      </svg>
      {/* 아래쪽을 canvas 로 페이드 */}
      <div
        className="absolute inset-x-0 bottom-0 h-3/5"
        style={{ background: "linear-gradient(to bottom, transparent, var(--canvas))" }}
      />
    </div>
  );
}
