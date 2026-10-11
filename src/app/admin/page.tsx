import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { PenLine } from "lucide-react";
import { adminLogout } from "./actions";
import { ModerationBar } from "@/components/board/ModerationBar";
import { AuthorLabel, CategoryTag } from "@/components/board/parts";
import { FeedbackInbox } from "@/components/feedback/FeedbackInbox";
import { DbSection } from "@/components/db/DbSection";
import { Card } from "@/components/ui";
import { BOARD_NAME, formatPostDateTime } from "@/lib/board-meta";
import { reportedItems } from "@/lib/server/board";
import { db } from "@/lib/server/db";
import { listFeedback } from "@/lib/server/feedback";
import { reportedReviews } from "@/lib/server/reviews";
import { isAdmin } from "@/lib/server/security";

export const metadata: Metadata = {
  title: "운영자 관리",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return (
    <div className="mx-auto max-w-[1000px] px-4 pt-8 pb-12 md:px-6 md:pt-12">
      <Suspense fallback={<div className="h-96 animate-pulse rounded-lg bg-canvas-soft" />}>
        <DbSection noticeTitle="DB가 연결되지 않았어요 (DATABASE_URL 확인)">
          <Dashboard />
        </DbSection>
      </Suspense>
    </div>
  );
}

async function overview() {
  const client = await db();
  const day = Date.now() - 24 * 60 * 60 * 1000;
  const res = await client.execute({
    sql: `SELECT
            (SELECT COUNT(*) FROM posts WHERE status != 2) AS posts,
            (SELECT COUNT(*) FROM posts WHERE status != 2 AND created_at > ?) AS posts24,
            (SELECT COUNT(*) FROM comments WHERE status != 2) AS comments,
            (SELECT COUNT(*) FROM exam_reviews WHERE status != 2) AS reviews,
            (SELECT COUNT(*) FROM exam_reviews WHERE status != 2 AND created_at > ?) AS reviews24`,
    args: [day, day],
  });
  const r = res.rows[0];
  return {
    posts: Number(r?.posts ?? 0),
    posts24: Number(r?.posts24 ?? 0),
    comments: Number(r?.comments ?? 0),
    reviews: Number(r?.reviews ?? 0),
    reviews24: Number(r?.reviews24 ?? 0),
  };
}

async function Dashboard() {
  await connection();
  if (!(await isAdmin())) redirect("/admin/login");
  const [stats, reported, reviews, feedback] = await Promise.all([
    overview(),
    reportedItems(),
    reportedReviews(),
    listFeedback(),
  ]);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="type-display-md text-ink">운영자 관리</h1>
        <div className="flex gap-2">
          <Link href="/board/write" className="btn btn-primary btn-sm">
            <PenLine className="h-4 w-4" strokeWidth={1.75} />
            운영자 글쓰기
          </Link>
          <form action={adminLogout}>
            <button type="submit" className="btn btn-toggle btn-sm">
              로그아웃
            </button>
          </form>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-5">
        {[
          { label: "새 제보·의견", value: feedback.open.length },
          { label: `${BOARD_NAME} 글`, value: stats.posts, sub: `24시간 +${stats.posts24}` },
          { label: "댓글", value: stats.comments },
          { label: "필기 후기", value: stats.reviews, sub: `24시간 +${stats.reviews24}` },
          { label: "신고 대기", value: reported.posts.length + reported.comments.length + reviews.length },
        ].map((s) => (
          <div key={s.label} className="rounded-lg bg-canvas-soft p-4">
            <p className="type-caption text-ink-mute">{s.label}</p>
            <p className="mt-1 tabular type-heading-lg text-ink">{s.value}</p>
            {s.sub && <p className="mt-1 type-micro text-ink-mute">{s.sub}</p>}
          </div>
        ))}
      </div>

      <Card id="feedback" className="mt-8 scroll-mt-24 p-6">
        <h2 className="flex items-center gap-2 type-heading-sm text-ink">
          제보·의견
          {feedback.open.length > 0 && (
            <span className="tag bg-ruby tabular text-on-primary">새 {feedback.open.length}</span>
          )}
        </h2>
        <p className="mt-1 type-caption text-ink-mute">
          기관 정보 제보, 공고 제보, 사이트 의견이 모여요. &lsquo;처리 완료&rsquo;를 누르면 답변용 이메일은 지워져요.
        </p>
        <FeedbackInbox items={feedback.open} />
        {feedback.done.length > 0 && (
          <details className="mt-4 border-t border-hairline pt-4">
            <summary className="cursor-pointer type-caption text-ink-secondary">
              최근 처리한 제보 {feedback.done.length}건
            </summary>
            <FeedbackInbox items={feedback.done} done />
          </details>
        )}
      </Card>

      <Card className="mt-4 p-6">
        <h2 className="type-heading-sm text-ink">신고된 글</h2>
        {reported.posts.length === 0 ? (
          <p className="mt-3 type-body-md text-ink-mute">없어요.</p>
        ) : (
          <ul className="mt-3 divide-y divide-hairline">
            {reported.posts.map((p) => (
              <li key={p.id} className="py-3">
                <div className="flex flex-wrap items-center gap-2 type-caption">
                  <CategoryTag category={p.category} />
                  <Link href={`/board/${p.id}`} className="link type-body-md">
                    {p.title}
                  </Link>
                  {p.status !== 0 && <span className="tag bg-ev-doc-soft text-ev-doc">숨김</span>}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-3 type-caption text-ink-mute">
                  <AuthorLabel nickname={p.nickname} ipPrefix={p.ipPrefix} isAdmin={p.isAdmin} />
                  <span>{formatPostDateTime(p.createdAt)}</span>
                </div>
                <ModerationBar type="post" id={p.id} status={p.status} isNotice={p.isNotice} reports={p.reports} className="mt-2" />
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="mt-4 p-6">
        <h2 className="type-heading-sm text-ink">신고된 댓글</h2>
        {reported.comments.length === 0 ? (
          <p className="mt-3 type-body-md text-ink-mute">없어요.</p>
        ) : (
          <ul className="mt-3 divide-y divide-hairline">
            {reported.comments.map((c) => (
              <li key={c.id} className="py-3">
                <p className="type-body-md whitespace-pre-wrap text-ink">{c.body}</p>
                <div className="mt-1 flex flex-wrap items-center gap-3 type-caption text-ink-mute">
                  <AuthorLabel nickname={c.nickname} ipPrefix={c.ipPrefix} isAdmin={false} />
                  <span>{formatPostDateTime(c.createdAt)}</span>
                  <Link href={`/board/${c.postId}`} className="link">
                    원글 보기
                  </Link>
                  {c.status !== 0 && <span className="tag bg-ev-doc-soft text-ev-doc">숨김</span>}
                </div>
                <ModerationBar type="comment" id={c.id} status={c.status} reports={c.reports} className="mt-2" />
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="mt-4 p-6">
        <h2 className="type-heading-sm text-ink">신고된 필기 후기</h2>
        {reviews.length === 0 ? (
          <p className="mt-3 type-body-md text-ink-mute">없어요.</p>
        ) : (
          <ul className="mt-3 divide-y divide-hairline">
            {reviews.map((r) => (
              <li key={r.id} className="py-3">
                {r.oneLiner && <p className="type-body-md text-ink">{r.oneLiner}</p>}
                {r.detail && <p className="mt-1 type-body-md whitespace-pre-wrap text-ink-secondary">{r.detail}</p>}
                <div className="mt-1 flex flex-wrap items-center gap-3 type-caption text-ink-mute">
                  <span>{formatPostDateTime(r.createdAt)}</span>
                  <Link href={`/reviews/${r.examId}`} className="link">
                    시험 페이지
                  </Link>
                  {r.status !== 0 && <span className="tag bg-ev-doc-soft text-ev-doc">숨김</span>}
                </div>
                <ModerationBar type="review" id={r.id} status={r.status} reports={r.reports} className="mt-2" />
              </li>
            ))}
          </ul>
        )}
      </Card>

      <p className="mt-6 type-caption text-ink-mute">
        신고가 5건 쌓이면 자동으로 숨김 처리돼요. 숨김은 복구할 수 있고, 삭제는 목록에서 사라져요(DB에는 기록이 남음).
      </p>
    </>
  );
}
