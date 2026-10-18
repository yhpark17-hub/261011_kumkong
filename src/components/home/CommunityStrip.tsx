import Link from "next/link";
import { connection } from "next/server";
import { ArrowRight, BarChart3, MessagesSquare } from "lucide-react";
import { AuthorLabel, CategoryTag } from "@/components/board/parts";
import { BOARD_NAME, formatPostTime } from "@/lib/board-meta";
import { addDays, formatShort, todayKST } from "@/lib/date";
import { listPosts } from "@/lib/server/board";
import { examCounts, listExams } from "@/lib/server/reviews";
import { Card, CompanyAvatar, cn } from "../ui";

/**
 * 최근 필기 후기 (요청 시 렌더링) — 홈, 캘린더 옆 칸
 * 한눈에 '몇 명이 후기를 남겼는지'만: 로고 · 기관명 · 날짜 | 후기 수 (없으면 '후기 받는 중' — 0명을 내세우지 않음)
 * limit: 보여 줄 시험 수, large: 홈처럼 넓은 칸 (다른 칸과 같은 제목 크기)
 */
export async function RecentExamsPanel({ limit = 4, large = false }: { limit?: number; large?: boolean } = {}) {
  await connection();
  const today = todayKST();
  const counts = await examCounts();
  // 최근 2주 시험 중 후기가 많은 곳 먼저 → 나머지는 최근 날짜 순 (모두 '후기 받는 중'만 보이지 않게)
  const since = addDays(today, -14);
  const past = listExams().filter((e) => !e.expected && e.date <= today);
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
      <p className="mt-0.5 type-caption text-ink-mute">시험별로 응시자가 남긴 후기 수</p>
      {exams.length === 0 ? (
        <p className="py-4 type-body-md text-ink-mute">최근 치러진 필기가 없어요.</p>
      ) : (
        <ul className="-mx-2 mt-2 divide-y divide-hairline">
          {exams.map((e) => {
            const reviews = n(e.id);
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
                    <span className="shrink-0 text-right">
                      <span className="tabular type-heading-sm text-ink">{reviews}</span>
                      <span className="ml-0.5 type-caption text-ink-mute">명</span>
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

/** 홈: 콩밭 새 글 (요청 시 렌더링) */
export async function CommunityStrip({ limit = 6 }: { limit?: number } = {}) {
  await connection();
  const today = todayKST();
  const board = await listPosts({ page: 1 });
  const posts = [...board.notices.slice(0, 1), ...board.posts].slice(0, limit);

  return (
    <div className="h-full">
      <Card className="flex h-full flex-col p-6">
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
          // 구분선이 카드 끝까지 닿게 (카드 안쪽 여백만큼 바깥으로 넓히고, 줄마다 여백을 다시 줌)
          <ul className="-mx-6 divide-y divide-hairline border-t border-hairline">
            {posts.map((p) => (
              <li key={p.id}>
                <Link href={`/board/${p.id}`} className="group flex items-center gap-2 px-6 py-3 hover:bg-canvas-soft">
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
        {posts.length > 0 && (
          // 글이 적어도 칸이 비어 보이지 않게 맨 아래 붙는 줄
          <div className="mt-auto pt-4">
            <div className="flex items-center justify-between gap-3 rounded-lg bg-canvas-soft px-4 py-3">
              <p className="min-w-0 type-caption text-ink-secondary [word-break:keep-all]">로그인 없이 익명으로 필기·면접 정보를 나눠요</p>
              <Link href="/board/write" className="btn btn-sm btn-secondary shrink-0">
                글쓰기
              </Link>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

export function CommunityStripSkeleton() {
  return <div className="h-72 animate-pulse rounded-lg bg-canvas-soft" />;
}
