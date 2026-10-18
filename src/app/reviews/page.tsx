import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { BarChart3, Lock, MousePointerClick } from "lucide-react";
import { ExamBrowser, type ExamCardData } from "@/components/reviews/ExamBrowser";
import { DbSection } from "@/components/db/DbSection";
import { Eyebrow } from "@/components/ui";
import { diffDays, todayKST } from "@/lib/date";
import { PRIORITY_DAYS, type ExamInfo } from "@/lib/review-meta";
import { examActivity, examSummaries, listExams } from "@/lib/server/reviews";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "필기 후기 — 금융공기업·공공기관 필기 체감 난이도 투표",
  description:
    "금감원·한국은행·산업은행 등 금융공기업과 공공기관 필기시험이 끝나면, 응시자들이 남긴 전체 난이도·과목별 체감 난이도·못 푼 문항 수·시간 여유를 그래프로 확인하세요.",
  path: "/reviews",
});

const STEPS = [
  { icon: MousePointerClick, title: "터치 몇 번", desc: "전체 난이도, 시간 여유, 못 푼 문항 수를 고르기만 하면 돼요." },
  { icon: BarChart3, title: "결과는 바로", desc: "후기를 남기면 다른 응시자들의 체감 결과를 그래프로 바로 볼 수 있어요." },
  {
    icon: Lock,
    title: "응시자만 보는 상세 결과",
    desc: `과목별 난이도·한 줄 후기는 후기를 남긴 응시자만. 전체 체감 난이도는 시험 ${PRIORITY_DAYS}일 뒤부터 누구나 볼 수 있어요.`,
  },
];

export default function ReviewsPage() {
  return (
    <div className="mx-auto max-w-[1200px] px-4 pt-4 pb-12 md:px-6 md:pt-12">
      <Eyebrow className="max-md:hidden">필기 후기</Eyebrow>
      <h1 className="type-heading-lg text-ink md:mt-3 md:type-display-lg lg:type-display-xl">필기 끝나고, 30초 후기</h1>
      <p className="mt-4 max-w-2xl type-body-lg text-ink-secondary max-md:hidden">
        다들 쉬웠다는데 나만 어려웠을까? 시험 본 사람들의 체감 난이도와 과목별 후기를 숫자로 확인하세요.
      </p>
      {/* 기능 안내는 PC 에서만 — 휴대폰은 오늘 시험(LIVE)·목록이 첫 화면에 */}
      <ul className="mt-8 hidden grid-cols-3 gap-3 md:grid">
        {STEPS.map(({ icon: Icon, title, desc }) => (
          <li key={title} className="flex flex-col items-center gap-1.5 rounded-lg bg-canvas-soft px-2 py-3 text-center md:flex-row md:items-start md:gap-3 md:p-4 md:text-left">
            <Icon className="h-5 w-5 shrink-0 text-primary-text md:mt-0.5" strokeWidth={1.75} />
            <span>
              <span className="block type-caption !font-normal text-ink md:type-body-md">{title}</span>
              <span className="mt-1 hidden type-caption text-ink-secondary md:block">{desc}</span>
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-4 md:mt-12">
        <DbSection noticeTitle="필기 후기 투표를 준비하고 있어요">
          <Suspense fallback={<GridSkeleton />}>
            <ExamLists />
          </Suspense>
        </DbSection>
      </div>
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="flex gap-2">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="h-9 w-20 rounded-full bg-canvas-soft" />
        ))}
      </div>
      <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="h-44 rounded-lg bg-canvas-soft" />
        ))}
      </div>
    </div>
  );
}

/** 클라이언트로는 목록에 필요한 값만 넘깁니다 */
function toCard(e: ExamInfo): ExamCardData {
  return {
    id: e.id,
    companyId: e.companyId,
    companyName: e.companyName,
    shortName: e.shortName,
    avatar: e.avatar,
    logo: e.logo,
    date: e.date,
    label: e.label,
    category: e.category,
    expected: e.expected,
  };
}

async function ExamLists() {
  await connection();
  const today = todayKST();
  const all = listExams();
  const done = all.filter((e) => !e.expected && e.date <= today);
  // 시험 직후 3일은 후기를 남긴 방문자에게만 평균 난이도가 넘어가요
  const [summaries, activity] = await Promise.all([examSummaries(done, today), examActivity()]);
  // 지난 시험: 최근 순, 참여가 있는 시험은 1년이 지나도 남김
  const past = done.filter((e) => diffDays(e.date, today) <= 365 || summaries[e.id]);
  const upcoming = all.filter((e) => e.date > today).sort((a, b) => (a.date < b.date ? -1 : 1));

  return (
    <ExamBrowser
      past={past.map(toCard)}
      upcoming={upcoming.map(toCard)}
      summaries={summaries}
      activity={activity}
      today={today}
    />
  );
}
