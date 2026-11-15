import Link from "next/link";
import { connection } from "next/server";
import { ArrowRight, BarChart3 } from "lucide-react";
import { DifficultyTag } from "@/components/reviews/DifficultyMeter";
import { ParticipantCount } from "@/components/reviews/ParticipantCount";
import { addDays, formatShort, todayKST } from "@/lib/date";
import { examCounts, listExams } from "@/lib/server/reviews";
import { Card, CompanyAvatar, cn } from "../ui";

/**
 * 최근 필기 후기 (요청 시 렌더링) — 채용 캘린더 옆 칸
 * 로고 · 기관명 · 날짜 | 체감 난이도(색) · 후기 수 (없으면 '후기 받는 중' — 0명을 내세우지 않음)
 * 홈 칸에서는 시험 직후에도 난이도 한 단어를 보여 줘요 — '어렵다던데?' 하고 눌러 보게 (상세 결과는 시험 페이지에서 후기를 남겨야)
 * limit: 보여 줄 시험 수, large: 홈처럼 넓은 칸 (다른 칸과 같은 제목 크기)
 */
export async function RecentExamsPanel({ limit = 4, large = false }: { limit?: number; large?: boolean } = {}) {
  await connection();
  const today = todayKST();
  // 최근 2주 시험 중 후기가 많은 곳 먼저 → 나머지는 최근 날짜 순 (모두 '후기 받는 중'만 보이지 않게)
  const since = addDays(today, -14);
  const past = listExams().filter((e) => !e.expected && e.date <= today);
  const counts = await examCounts();
  const n = (id: string) => counts.get(id)?.n ?? 0;
  const exams = [
    ...past.filter((e) => e.date >= since && n(e.id) > 0).sort((a, b) => n(b.id) - n(a.id) || (a.date < b.date ? 1 : -1)),
    ...past.filter((e) => !(e.date >= since && n(e.id) > 0)),
  ].slice(0, limit);

  return (
    <Card className={cn("p-6", large && "flex flex-col")}>
      <div className="flex items-center justify-between">
        <h2 className={cn("flex items-center gap-2 text-ink", large ? "type-heading-md" : "type-heading-sm")}>
          <BarChart3 className={cn("text-ink-mute", large ? "h-5 w-5" : "h-4 w-4")} strokeWidth={1.75} />
          최근 필기 후기
        </h2>
        <Link href="/reviews" className="link inline-flex items-center gap-1 type-caption">
          전체 <ArrowRight className="h-3 w-3" strokeWidth={1.75} />
        </Link>
      </div>
      <p className="mt-0.5 type-caption text-ink-mute">응시자들이 남긴 체감 난이도와 후기 수</p>
      {exams.length === 0 ? (
        <p className="py-4 type-body-md text-ink-mute">최근 치러진 필기가 없어요.</p>
      ) : (
        <ul className="-mx-2 mt-2 divide-y divide-hairline">
          {exams.map((e) => {
            const reviews = n(e.id);
            const avg = counts.get(e.id)?.avg;
            return (
              <li key={e.id}>
                <Link href={`/reviews/${e.id}`} className="group flex items-center gap-3 rounded-md px-2 py-2.5 hover:bg-canvas-soft">
                  <CompanyAvatar company={{ id: e.companyId, shortName: e.shortName, avatar: e.avatar, logo: e.logo }} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate type-body-md font-semibold text-ink group-hover:underline">{e.companyName}</span>
                    <span className="block truncate type-caption text-ink-mute">
                      {e.date === today ? <span className="font-semibold text-ruby">오늘</span> : formatShort(e.date)} · {e.label}
                    </span>
                  </span>
                  {reviews > 0 ? (
                    <span className="flex shrink-0 items-center gap-2.5">
                      {avg != null && <DifficultyTag avg={avg} />}
                      <ParticipantCount n={reviews} className="min-w-10 text-right" />
                    </span>
                  ) : (
                    <span className="shrink-0 type-caption text-ink-mute">후기 받는 중</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

export function RecentExamsPanelSkeleton() {
  return <div className="h-64 animate-pulse rounded-lg bg-canvas-soft" />;
}
