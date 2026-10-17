import { ImageResponse } from "next/og";
import { connection } from "next/server";
import { diffDays, formatLong, parseKey, todayKST } from "@/lib/date";
import { OVERALL_OPTIONS, difficultyWord, resultsPublicFrom } from "@/lib/review-meta";
import { dbConfigured } from "@/lib/server/db";
import { C, OG_SIZE, clip, companyLogo, kongSvg, ogFonts, svgUri } from "@/lib/server/og";
import { getExam, reviewStats } from "@/lib/server/reviews";

/**
 * 필기 후기 공유 썸네일 — 기관 로고 + 응시자가 말한 체감 난이도 + 난이도 분포
 * 분포(상세 결과)는 사이트와 똑같이 전체 공개일부터만 보여 주고, 그 전엔 '후기 남기면 공개'로 가려 둬요.
 * 카톡·SNS 미리보기(og:image)에만 쓰고, 사이트 화면에는 넣지 않아요.
 */

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "금콩 필기 후기 · 체감 난이도";

const levelColor = (avg: number) => (avg >= 3.4 ? C.ruby : avg >= 2.6 ? C.primary : C.green);
const SHORT_LABEL = ["매우\n쉬움", "쉬움", "보통", "어려움", "매우\n어려움"];

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
  const avg = stats?.overallAvg ?? null;
  const publicFrom = resultsPublicFrom(exam.date);
  const isPublic = today >= publicFrom;
  const daysLeft = diffDays(today, exam.date);
  const logo = await companyLogo(exam.companyId);
  const dist = stats?.overall ?? [0, 0, 0, 0, 0];
  const pct = dist.map((x) => (n ? Math.round((x / n) * 100) : 0));
  const hard = pct[3] + pct[4];
  const easy = pct[0] + pct[1];
  const hook = isPublic && n >= 3 ? (hard >= 50 ? { text: `${hard}%가 '어렵다'`, color: C.ruby } : easy >= 50 ? { text: `${easy}%가 '쉽다'`, color: C.green } : null) : null;
  const pf = parseKey(publicFrom);

  // 로고 크기 — 가로 로고는 높이 64 기준, 정사각은 88
  const logoH = logo?.wide ? 64 : 88;
  const logoW = logo ? Math.min(Math.round((logo.width / logo.height) * logoH), 300) : 0;

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
      <div style={{ display: "flex", flex: 1, padding: "52px 64px 0 64px" }}>
        {/* 왼쪽: 기관 + 체감 난이도 */}
        <div style={{ display: "flex", flexDirection: "column", width: 600 }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            {logo && (
              <div style={{ display: "flex", padding: logo.wide ? "14px 20px" : 10, background: C.white, border: `2px solid ${C.line}`, borderRadius: 20, marginRight: 20 }}>
                {/* eslint-disable-next-line @next/next/no-img-element -- 썸네일 그림(서버 렌더) */}
                <img src={logo.src} width={logoW} height={logoH} alt="" />
              </div>
            )}
            {!logo?.wide && <div style={{ display: "flex", fontSize: 54, fontWeight: 800, color: C.ink, letterSpacing: -1.5 }}>{clip(exam.companyName, 12)}</div>}
          </div>
          {logo?.wide && <div style={{ display: "flex", marginTop: 18, fontSize: 52, fontWeight: 800, color: C.ink, letterSpacing: -1.5 }}>{clip(exam.companyName, 14)}</div>}
          <div style={{ display: "flex", marginTop: 10, fontSize: 28, fontWeight: 700, color: C.inkSoft }}>{`${clip(exam.label, 18)} · ${formatLong(exam.date)}`}</div>

          {n > 0 && avg != null ? (
            <div style={{ display: "flex", flexDirection: "column", marginTop: 34 }}>
              <div style={{ display: "flex", fontSize: 30, fontWeight: 700, color: C.inkSoft }}>{`응시자 ${n}명이 말한 체감 난이도`}</div>
              <div style={{ display: "flex", alignItems: "flex-end", marginTop: 6 }}>
                <div style={{ display: "flex", fontSize: 104, fontWeight: 800, color: levelColor(avg), letterSpacing: -4, lineHeight: 1.05 }}>{difficultyWord(avg)}</div>
              </div>
              <div style={{ display: "flex", marginTop: 16 }}>
                {[1, 2, 3, 4, 5].map((v) => (
                  <div key={v} style={{ display: "flex", width: 76, height: 16, marginRight: 8, borderRadius: 8, background: avg >= v - 0.5 ? (v >= 4 ? C.ruby : C.primary) : "#e6e4f2" }} />
                ))}
              </div>
            </div>
          ) : daysLeft > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", marginTop: 40 }}>
              <div style={{ display: "flex", alignSelf: "flex-start", padding: "6px 18px", borderRadius: 999, background: C.ink, color: C.white, fontSize: 30, fontWeight: 800 }}>{`D-${daysLeft}`}</div>
              <div style={{ display: "flex", marginTop: 18, fontSize: 52, fontWeight: 800, color: C.ink, letterSpacing: -1.5, lineHeight: 1.2 }}>시험 끝나면 체감 난이도 투표</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", marginTop: 40 }}>
              <div style={{ display: "flex", fontSize: 64, fontWeight: 800, color: C.ink, letterSpacing: -2 }}>시험 끝! 체감 난이도는?</div>
              <div style={{ display: "flex", marginTop: 14, fontSize: 32, fontWeight: 700, color: C.primary }}>첫 후기를 남겨 주세요</div>
            </div>
          )}
        </div>

        {/* 오른쪽: 난이도 분포 */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            position: "relative",
            marginLeft: "auto",
            width: 420,
            height: 430,
            padding: "26px 28px 20px",
            background: C.white,
            border: `2px solid ${C.line}`,
            borderRadius: 32,
            boxShadow: "0 18px 40px rgba(28,30,84,0.10)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", fontSize: 26, fontWeight: 800, color: C.ink }}>난이도 분포</div>
            {hook && <div style={{ display: "flex", padding: "4px 14px", borderRadius: 999, background: hook.color === C.ruby ? C.rubySoft : C.greenSoft, color: hook.color, fontSize: 24, fontWeight: 800 }}>{hook.text}</div>}
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", height: 250, marginTop: 24 }}>
            {OVERALL_OPTIONS.map((o, i) => {
              const show = isPublic && n > 0;
              const h = show ? Math.max(8, Math.round((pct[i] / Math.max(...pct, 1)) * 220)) : [70, 130, 190, 150, 90][i];
              const top = show && pct[i] === Math.max(...pct);
              return (
                <div key={o.value} style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 62 }}>
                  {show && <div style={{ display: "flex", fontSize: 22, fontWeight: 800, color: top ? (i >= 3 ? C.ruby : C.primary) : C.inkSoft, marginBottom: 6 }}>{`${pct[i]}%`}</div>}
                  <div style={{ display: "flex", width: 52, height: h, borderRadius: 12, background: show ? (top ? (i >= 3 ? C.ruby : C.primary) : "#c9c2ff") : "#ecebf5" }} />
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}>
            {SHORT_LABEL.map((l) => (
              <div key={l} style={{ display: "flex", width: 62, justifyContent: "center", textAlign: "center", fontSize: 18, fontWeight: 700, color: C.inkSoft, lineHeight: 1.15, whiteSpace: "pre-wrap" }}>
                {l}
              </div>
            ))}
          </div>
          {!(isPublic && n > 0) && (
            <div style={{ position: "absolute", left: 0, top: 70, width: 420, height: 270, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <div style={{ display: "flex", padding: "12px 22px", borderRadius: 16, background: C.ink, color: C.white, fontSize: 26, fontWeight: 800 }}>
                {n > 0 ? "후기를 남기면 바로 공개" : "첫 후기를 기다려요"}
              </div>
              {n > 0 && <div style={{ display: "flex", marginTop: 10, fontSize: 20, fontWeight: 700, color: C.inkSoft }}>{`${pf.m}월 ${pf.d}일부터 전체 공개`}</div>}
            </div>
          )}
        </div>
      </div>

      {/* 아래 띠: 금콩 + 참여 유도 */}
      <div style={{ display: "flex", alignItems: "center", height: 96, padding: "0 64px", background: C.ink, marginTop: 24 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={svgUri(kongSvg({ hold: "pencil", glasses: true }))} width={72} height={72} alt="" />
        <div style={{ display: "flex", marginLeft: 12, fontSize: 30, fontWeight: 800, color: C.white }}>금콩 필기 후기</div>
        <div style={{ display: "flex", marginLeft: "auto", padding: "12px 26px", borderRadius: 999, background: C.yellow, color: C.ink, fontSize: 28, fontWeight: 800 }}>
          {daysLeft > 0 ? "시험 일정·과목 확인하기 →" : "30초 후기 남기고 결과 보기 →"}
        </div>
      </div>
    </div>,
    { ...size, fonts },
  );
}
