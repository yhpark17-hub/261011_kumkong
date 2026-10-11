import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "금콩 · 금융공기업 채용 캘린더";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const fontDir = join(process.cwd(), "node_modules/pretendard/dist/web/static/woff");

/* DESIGN.md 팔레트 기반 일정 칩 */
const CHIPS = [
  { label: "서류", name: "신용보증기금", color: "#ea2261", bg: "#fde9ef" },
  { label: "필기", name: "한국산업은행", color: "#533afd", bg: "#eeebff" },
  { label: "1면", name: "한국자산관리공사", color: "#a8209b", bg: "#fdeefc" },
  { label: "발표", name: "IBK기업은행", color: "#003770", bg: "#e6eef7" },
];

export default async function Image() {
  const [light, regular] = await Promise.all([
    readFile(join(fontDir, "Pretendard-Light.woff")),
    readFile(join(fontDir, "Pretendard-Regular.woff")),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          padding: 72,
          fontFamily: "Pretendard",
          color: "#0d253d",
          background:
            "radial-gradient(circle at 8% 10%, #f5e9d4 0%, transparent 45%), radial-gradient(circle at 35% 0%, #ffa26b 0%, transparent 40%), radial-gradient(circle at 60% 5%, #b9b9f9 0%, transparent 45%), radial-gradient(circle at 82% 30%, #533afd 0%, transparent 42%), radial-gradient(circle at 98% 8%, #f96bee 0%, transparent 38%), radial-gradient(circle at 95% 60%, #ea2261 0%, transparent 35%), #ffffff",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <svg width="80" height="80" viewBox="0 0 32 32">
              <rect width="32" height="32" rx="8" fill="#1c1e54" />
              <path
                d="M20.6 7.4c3.7 1.6 5 6.5 3 10.9-1.4 3.1-4.7 4.7-6.5 6.4-1.7 1.6-4.5 1.9-6.5.2-2.4-2-2.3-5.2-.6-7.3 1.3-1.6 3.3-2 4.1-3.9.9-2 .9-4.7 2.9-6 1-.7 2.3-.8 3.6-.3z"
                fill="#ffa26b"
              />
            </svg>
            <span style={{ fontSize: 72, fontWeight: 300, letterSpacing: -1.8 }}>금콩</span>
          </div>
          <div style={{ marginTop: 32, fontSize: 56, fontWeight: 300, letterSpacing: -1.4, lineHeight: 1.1 }}>
            금융공기업·공공기관
          </div>
          <div style={{ fontSize: 56, fontWeight: 300, letterSpacing: -1.4, lineHeight: 1.1, color: "#533afd" }}>
            채용 캘린더
          </div>
          <div style={{ marginTop: 24, fontSize: 26, fontWeight: 300, color: "#273951" }}>
            서류 마감 · 필기 · 면접 · 경쟁률 · 자소서 항목을 한눈에
          </div>
        </div>

        <div style={{ width: 380, display: "flex", flexDirection: "column", justifyContent: "center", gap: 12 }}>
          {CHIPS.map((c, i) => (
            <div
              key={c.name}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                background: "white",
                border: "1px solid #e3e8ee",
                borderRadius: 12,
                padding: "16px 24px",
                boxShadow: "0 8px 24px rgba(0,55,112,0.08), 0 2px 6px rgba(0,55,112,0.04)",
                marginLeft: i % 2 ? 32 : 0,
              }}
            >
              <span
                style={{
                  background: c.bg,
                  color: c.color,
                  fontSize: 20,
                  fontWeight: 400,
                  borderRadius: 9999,
                  padding: "4px 12px",
                }}
              >
                {c.label}
              </span>
              <span style={{ fontSize: 26, fontWeight: 300 }}>{c.name}</span>
            </div>
          ))}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Pretendard", data: light, weight: 300, style: "normal" },
        { name: "Pretendard", data: regular, weight: 400, style: "normal" },
      ],
    },
  );
}
