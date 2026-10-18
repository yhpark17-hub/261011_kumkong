import { ImageResponse } from "next/og";
import { connection } from "next/server";
import { diffDays, parseKey, todayKST } from "@/lib/date";
import { difficultyWord, resultsPublicFrom } from "@/lib/review-meta";
import { dbConfigured } from "@/lib/server/db";
import { C, OG_SIZE, clip, companyLogo, kongSvg, ogFonts, svgUri } from "@/lib/server/og";
import { getExam, reviewStats } from "@/lib/server/reviews";

/**
 * 필기 후기 공유 썸네일 — 궁금하게 만드는 '잠긴 결과 카드'
 * 왼쪽: 기관 로고 · 필기시험 날짜 · 체감 난이도(후기가 있으면 판정 단어, 없으면 ???)
 * 오른쪽: 후기에서 볼 수 있는 항목(전체 난이도·과목별·못 푼 문항·시간 여유)을 자물쇠로 가려 둠
 * 없는 숫자(참여 인원·난이도)를 지어내지 않아요 — 실제 후기가 있을 때만 그 숫자를 보여 줘요.
 * 카톡·SNS 미리보기(og:image)에만 쓰고, 사이트 화면에는 넣지 않아요.
 */

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "금콩 필기 후기 · 체감 난이도";

const levelColor = (avg: number) => (avg >= 3.4 ? C.ruby : avg >= 2.6 ? C.primary : C.green);

/** "필기시험 2026년 10월 17일" — 회차·요일 같은 덧말 없이 한 형식으로 */
const examLine = (date: string) => {
  const { y, m, d } = parseKey(date);
  return `필기시험 ${y}년 ${m}월 ${d}일`;
};

/** 자물쇠 그림 */
const LOCK = svgUri(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48"><rect x="4.5" y="10.5" width="15" height="11" rx="2.5" fill="${C.ink}"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" stroke="${C.ink}" stroke-width="2.6" fill="none" stroke-linecap="round"/><circle cx="12" cy="16" r="1.7" fill="#fff"/></svg>`,
);

/** 가려 둔 막대 길이 — 시험마다 다르지만 늘 같은 모양 (실제 값이 아니라 장식) */
function maskWidths(seed: string, n: number): number[] {
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return Array.from({ length: n }, (_, i) => 38 + (((h >>> (i * 5)) & 31) / 31) * 52);
}

function Fallback() {
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: C.lavender, fontSize: 64, fontWeight: 800, color: C.ink }}>
      금콩 필기 후기
    </div>
  );
}

export default async function Image({ params }: { params: Promise<{ examId: string }> }) {
  const exam = getExam((await params).examId);
  await connection(); // 후기 수·난이도가 계속 바뀌니 요청 때 그림
  const fonts = await ogFonts();
  if (!exam) return new ImageResponse(<Fallback />, { ...size, fonts });

  const today = todayKST();
  const stats = dbConfigured() ? await reviewStats(exam).catch(() => null) : null;
  const n = stats?.count ?? 0;
  const isPublic = today >= resultsPublicFrom(exam.date);
  // 시험 후 3일(요약도 잠긴 기간)에는 썸네일에도 난이도를 싣지 않아요 — ??? 로 궁금하게
  const avg = n > 0 && isPublic ? (stats?.overallAvg ?? null) : null;
  const daysLeft = diffDays(today, exam.date);
  const logo = await companyLogo(exam.companyId);

  // 결과가 공개된 뒤 응답이 충분하면 한 가지만 살짝 (나머지는 잠금)
  const dist = stats?.overall ?? [];
  const hardPct = n ? Math.round(((dist[3] ?? 0) + (dist[4] ?? 0)) / n * 100) : 0;
  const peek = isPublic && n >= 3 && hardPct >= 50 ? `응시자 ${hardPct}%가 '어렵다'` : null;

  // 후기 결과 화면에 실제로 있는 항목 6개 (과목은 이 시험의 실제 과목 이름)
  const subjects = exam.subjects.filter((s) => s !== "논술");
  const rows = [
    "전체 난이도 분포",
    ...subjects.slice(0, 3).map((s) => `${s} 체감 난이도`),
    "못 푼 문항 수",
    "시간 여유",
    "한 줄 후기",
    ...(subjects.length > 1 ? ["가장 어려웠던 과목"] : []),
  ].slice(0, 6);
  const widths = maskWidths(exam.id, rows.length);

  // 기관 이름의 괄호 설명은 빼고 (예: '전국 농·축협 (6급 통합채용)' → '전국 농·축협')
  const name = exam.companyName.replace(/\s*\([^)]*\)/g, "").trim() || exam.companyName;
  const logoH = logo?.wide ? 60 : 84;
  const logoW = logo ? Math.min(Math.round((logo.width / logo.height) * logoH), 280) : 0;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        fontFamily: "Pretendard",
        background: "linear-gradient(135deg, #f3f0ff 0%, #ffffff 52%, #fff3e3 100%)",
      }}
    >
      <div style={{ display: "flex", flex: 1, padding: "48px 64px 0 64px" }}>
        {/* 왼쪽: 기관 · 날짜 · 체감 난이도 */}
        <div style={{ display: "flex", flexDirection: "column", width: 560 }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            {logo && (
              <div style={{ display: "flex", padding: logo.wide ? "12px 18px" : 8, background: C.white, border: `2px solid ${C.line}`, borderRadius: 18, marginRight: 18 }}>
                {/* eslint-disable-next-line @next/next/no-img-element -- 썸네일 그림(서버 렌더) */}
                <img src={logo.src} width={logoW} height={logoH} alt="" />
              </div>
            )}
            {!logo?.wide && <div style={{ display: "flex", fontSize: 50, fontWeight: 800, color: C.ink, letterSpacing: -1.5 }}>{clip(name, 11)}</div>}
          </div>
          {logo?.wide && <div style={{ display: "flex", marginTop: 14, fontSize: 48, fontWeight: 800, color: C.ink, letterSpacing: -1.5 }}>{clip(name, 13)}</div>}
          <div style={{ display: "flex", alignItems: "center", marginTop: 12 }}>
            <div style={{ display: "flex", fontSize: 30, fontWeight: 700, color: C.inkSoft }}>{examLine(exam.date)}</div>
            {daysLeft > 0 && (
              <div style={{ display: "flex", marginLeft: 12, padding: "2px 14px", borderRadius: 999, background: C.ink, color: C.white, fontSize: 24, fontWeight: 800 }}>{`D-${daysLeft}`}</div>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", marginTop: 30 }}>
            <div style={{ display: "flex", fontSize: 34, fontWeight: 800, color: C.ink, letterSpacing: -1 }}>체감 난이도는?</div>
            {avg != null ? (
              <div style={{ display: "flex", alignItems: "flex-end", marginTop: 4 }}>
                <div style={{ display: "flex", fontSize: 92, fontWeight: 800, color: levelColor(avg), letterSpacing: -4, lineHeight: 1.08 }}>{difficultyWord(avg)}</div>
              </div>
            ) : (
              <div style={{ display: "flex", marginTop: 12 }}>
                {[0, 1, 2].map((k) => (
                  <div
                    key={k}
                    style={{
                      display: "flex",
                      width: 92,
                      height: 104,
                      marginRight: 12,
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: 20,
                      background: k === 1 ? C.primary : C.white,
                      border: `4px solid ${C.primary}`,
                      color: k === 1 ? C.white : C.primary,
                      fontSize: 64,
                      fontWeight: 800,
                    }}
                  >
                    ?
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", marginTop: 16 }}>
              {[1, 2, 3, 4, 5].map((v) => (
                <div
                  key={v}
                  style={{ display: "flex", width: 64, height: 14, marginRight: 8, borderRadius: 7, background: avg != null && avg >= v - 0.5 ? (v >= 4 ? C.ruby : C.primary) : "#e2def3" }}
                />
              ))}
            </div>
            {n > 0 && (
              <div style={{ display: "flex", alignSelf: "flex-start", marginTop: 14, padding: "6px 16px", borderRadius: 999, background: C.lavender, color: C.primary, fontSize: 24, fontWeight: 800, whiteSpace: "nowrap" }}>
                {peek ?? `응시자 ${n}명 참여`}
              </div>
            )}
          </div>
        </div>

        {/* 오른쪽: 잠긴 결과 카드 */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginLeft: "auto",
            width: 470,
            height: 440,
            padding: "26px 28px",
            background: C.white,
            border: `2px solid ${C.line}`,
            borderRadius: 32,
            boxShadow: "0 18px 40px rgba(28,30,84,0.10)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", fontSize: 26, fontWeight: 800, color: C.ink }}>응시자 후기 결과</div>
            <div style={{ display: "flex", alignItems: "center", padding: "4px 12px", borderRadius: 999, background: C.yellow, fontSize: 20, fontWeight: 800, color: C.ink }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={LOCK} width={18} height={18} alt="" style={{ marginRight: 6 }} />
              잠금
            </div>
          </div>
          {/* 항목 수가 적어도 카드가 비지 않게 줄 높이를 나눠 가짐 */}
          <div style={{ display: "flex", flexDirection: "column", flex: 1, marginTop: 14 }}>
            {rows.map((label, k) => (
              <div key={label} style={{ display: "flex", flex: 1, alignItems: "center", borderTop: k ? `2px solid ${C.line}` : "none" }}>
                <div style={{ display: "flex", width: 236, fontSize: 20, fontWeight: 700, color: C.inkSoft }}>{clip(label, 14)}</div>
                <div style={{ display: "flex", flex: 1, height: 16, borderRadius: 8, background: "#eeecf6" }}>
                  <div style={{ display: "flex", width: `${widths[k]}%`, height: 16, borderRadius: 8, background: "#cdc6f5" }} />
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={LOCK} width={22} height={22} alt="" style={{ marginLeft: 12 }} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 아래 띠: 금콩 + 참여 유도 */}
      <div style={{ display: "flex", alignItems: "center", height: 96, padding: "0 64px", background: C.ink, marginTop: 24 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={svgUri(kongSvg({ hold: "pencil", glasses: true }))} width={72} height={72} alt="" />
        <div style={{ display: "flex", marginLeft: 12, fontSize: 30, fontWeight: 800, color: C.white }}>금콩 필기 후기</div>
        <div style={{ display: "flex", marginLeft: "auto", padding: "12px 26px", borderRadius: 999, background: C.yellow, color: C.ink, fontSize: 28, fontWeight: 800 }}>
          {daysLeft > 0 ? "시험 끝나면 30초 후기로 결과 공개 →" : "30초 후기 남기면 결과 바로 공개 →"}
        </div>
      </div>
    </div>,
    { ...size, fonts },
  );
}
