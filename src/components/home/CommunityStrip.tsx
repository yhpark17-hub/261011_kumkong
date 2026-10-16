import Link from "next/link";
import { connection } from "next/server";
import { ArrowRight, BarChart3, MessagesSquare } from "lucide-react";
import { AuthorLabel, CategoryTag } from "@/components/board/parts";
import { DifficultyMeter } from "@/components/reviews/DifficultyMeter";
import { BOARD_NAME, formatPostTime } from "@/lib/board-meta";
import { formatShort, todayKST } from "@/lib/date";
import { difficultyWord } from "@/lib/review-meta";
import { listPosts } from "@/lib/server/board";
import { examCounts, listExams } from "@/lib/server/reviews";
import { Card, CompanyAvatar } from "../ui";

/** 홈 옆 칸: 최근 필기 체감 난이도 — '지금 채용 현황' 바로 아래 (요청 시 렌더링) */
export async function RecentExamsPanel() {
  await connection();
  const today = todayKST();
  const counts = await examCounts();
  const exams = listExams()
    .filter((e) => !e.expected && e.date <= today)
    .slice(0, 4);

  return (
    <Card className="p-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 type-heading-sm text-ink">
          <BarChart3 className="h-4 w-4 text-ink-mute" strokeWidth={1.75} />
          최근 필기 체감 난이도
        </h2>
        <Link href="/reviews" className="link inline-flex items-center gap-1 type-caption">
          전체 <ArrowRight className="h-3 w-3" strokeWidth={1.75} />
        </Link>
      </div>
      {exams.length === 0 ? (
        <p className="py-4 type-body-md text-ink-mute">최근 치러진 필기가 없어요.</p>
      ) : (
        <ul className="-mx-2">
          {exams.map((e) => {
            const c = counts.get(e.id);
            return (
              <li key={e.id}>
                <Link href={`/reviews/${e.id}`} className="group flex items-center gap-3 rounded-md px-2 py-2 hover:bg-canvas-soft">
                  <CompanyAvatar company={{ id: e.companyId, shortName: e.shortName, avatar: e.avatar, logo: e.logo }} size="sm" />
                  {/* 좁은 옆 칸이라 기관명은 한 줄을 다 쓰고, LIVE 표시는 아래 날짜 줄에 */}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate type-body-md text-ink group-hover:underline">
                      {e.companyName} <span className="text-ink-mute">{e.label}</span>
                    </span>
                    <span className="flex items-center gap-1.5 type-caption text-ink-mute">
                      {e.date === today && (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-ruby px-1.5 py-px text-[10px] leading-4 font-semibold text-on-primary">
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-on-primary motion-reduce:animate-none" />
                          LIVE
                        </span>
                      )}
                      <span className="truncate">
                        {formatShort(e.date)} · {c ? `${c.n}명 · ${difficultyWord(c.avg)}` : "첫 후기를 남겨 주세요"}
                      </span>
                    </span>
                  </span>
                  <DifficultyMeter avg={c?.avg ?? null} className="w-12 shrink-0" />
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

/** 홈: 콩밭 새 글 (요청 시 렌더링) */
export async function CommunityStrip() {
  await connection();
  const today = todayKST();
  const board = await listPosts({ page: 1 });
  const posts = [...board.notices.slice(0, 1), ...board.posts].slice(0, 6);

  return (
    <div>
      <Card className="p-6">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="flex items-center gap-2 type-heading-md text-ink">
            <MessagesSquare className="h-5 w-5 text-ink-mute" strokeWidth={1.5} />
            {BOARD_NAME} 새 글
          </h2>
          <Link href="/board" className="link inline-flex items-center gap-1 type-caption">
            전체
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} />
          </Link>
        </div>
        {posts.length === 0 ? (
          <div className="py-6">
            <p className="type-body-md text-ink-mute">아직 글이 없어요. 로그인 없이 첫 글을 남겨 보세요.</p>
            <Link href="/board/write" className="btn btn-secondary btn-sm mt-4">
              글쓰기
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-hairline">
            {posts.map((p) => (
              <li key={p.id}>
                <Link href={`/board/${p.id}`} className="group flex items-center gap-2 py-3">
                  {p.isNotice ? <span className="tag bg-brand-dark text-on-primary">공지</span> : <CategoryTag category={p.category} />}
                  <span className="min-w-0 flex-1 truncate type-body-md text-ink group-hover:underline">{p.title}</span>
                  {p.commentCount > 0 && <span className="tabular type-caption text-primary-text">[{p.commentCount}]</span>}
                  <AuthorLabel
                    nickname={p.nickname}
                    ipPrefix={p.ipPrefix}
                    isAdmin={p.isAdmin}
                    className="hidden max-w-32 type-caption sm:inline-flex"
                  />
                  <span className="tabular type-caption text-ink-mute">{formatPostTime(p.createdAt, today)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

export function CommunityStripSkeleton() {
  return <div className="h-72 animate-pulse rounded-lg bg-canvas-soft" />;
}
