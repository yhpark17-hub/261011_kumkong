import Link from "next/link";
import { connection } from "next/server";
import { ArrowRight, MessagesSquare, PenLine } from "lucide-react";
import { DifficultyMeter } from "@/components/reviews/DifficultyMeter";
import { CategoryTag } from "@/components/board/parts";
import { BOARD_NAME, formatPostTime } from "@/lib/board-meta";
import { ddayLabel, diffDays, formatShort, todayKST } from "@/lib/date";
import { difficultyWord } from "@/lib/review-meta";
import { recentPostsForCompany } from "@/lib/server/board";
import { examCounts, examsForCompany } from "@/lib/server/reviews";
import { Card } from "../ui";
import { SectionTitle } from "./sections";

/** 기관 상세: 필기 후기 투표 결과 + 콩밭 최근 글 (요청 시 렌더링) */
export async function CompanyCommunity({ companyId, companyName }: { companyId: string; companyName: string }) {
  await connection();
  const today = todayKST();
  const exams = examsForCompany(companyId).filter((e) => !e.expected || e.date > today);
  const [counts, posts] = await Promise.all([examCounts(), recentPostsForCompany(companyId, 5)]);

  return (
    <Card className="p-6 md:p-8">
      <SectionTitle icon={MessagesSquare}>필기 후기 · {BOARD_NAME} 이야기</SectionTitle>
      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <h4 className="type-caption text-ink-mute">응시자 체감 난이도</h4>
          {exams.length === 0 ? (
            <p className="mt-3 type-body-md text-ink-mute">등록된 필기 일정이 없어요.</p>
          ) : (
            <ul className="mt-2 divide-y divide-hairline">
              {exams.slice(0, 4).map((e) => {
                const done = e.date <= today && !e.expected;
                const c = counts.get(e.id);
                return (
                  <li key={e.id}>
                    <Link href={`/reviews/${e.id}`} className="group flex items-center gap-3 py-3">
                      <span className="min-w-0 flex-1">
                        <span className="block truncate type-body-md text-ink group-hover:underline">{e.label}</span>
                        <span className="block type-caption text-ink-mute">
                          {formatShort(e.date)} ·{" "}
                          {done ? (c ? `${c.n}명 참여 · ${difficultyWord(c.avg)}` : "첫 후기를 남겨 주세요") : "시험 후 투표 열림"}
                        </span>
                      </span>
                      {done ? (
                        <DifficultyMeter avg={c?.avg ?? null} className="w-16" />
                      ) : (
                        <span className="tag bg-ev-written-soft tabular text-ev-written">{ddayLabel(diffDays(today, e.date))}</span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div>
          <h4 className="flex items-center justify-between type-caption text-ink-mute">
            {BOARD_NAME} 최근 글
            <Link href={`/board/write?company=${companyId}`} className="link inline-flex items-center gap-1">
              <PenLine className="h-3.5 w-3.5" strokeWidth={1.75} />
              글쓰기
            </Link>
          </h4>
          {posts.length === 0 ? (
            <p className="mt-3 type-body-md text-ink-mute">
              아직 {companyName} 관련 글이 없어요. 준비 과정이나 궁금한 점을 첫 글로 남겨 보세요.
            </p>
          ) : (
            <ul className="mt-2 divide-y divide-hairline">
              {posts.map((p) => (
                <li key={p.id}>
                  <Link href={`/board/${p.id}`} className="group flex items-center gap-2 py-3">
                    <CategoryTag category={p.category} />
                    <span className="min-w-0 flex-1 truncate type-body-md text-ink group-hover:underline">{p.title}</span>
                    {p.commentCount > 0 && <span className="tabular type-caption text-primary-text">[{p.commentCount}]</span>}
                    <span className="tabular type-caption text-ink-mute">{formatPostTime(p.createdAt, today)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Link href={`/board?company=${companyId}`} className="link mt-3 inline-flex items-center gap-1 type-caption">
            {BOARD_NAME}에서 {companyName} 글 모아 보기
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} />
          </Link>
        </div>
      </div>
    </Card>
  );
}

export function CompanyCommunitySkeleton() {
  return <div className="h-64 animate-pulse rounded-lg bg-canvas-soft" />;
}
