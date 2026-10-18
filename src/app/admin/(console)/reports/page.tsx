import Link from "next/link";
import { Suspense } from "react";
import { AdminCard, AdminPageTitle, EmptyRow, StatusTag } from "@/components/admin/parts";
import { AdminSkeleton } from "@/components/admin/Skeleton";
import { ModerationBar } from "@/components/board/ModerationBar";
import { AuthorLabel, CategoryTag } from "@/components/board/parts";
import { DbSection } from "@/components/db/DbSection";
import { formatPostDateTime } from "@/lib/board-meta";
import { requireAdmin } from "@/lib/server/admin";
import { reportedItems } from "@/lib/server/board";
import { getExam, reportedReviews } from "@/lib/server/reviews";
import { reportedTalk } from "@/lib/server/talk";

export const metadata = { title: "신고" };

export default function ReportsPage() {
  return (
    <DbSection noticeTitle="DB가 연결되지 않았어요 (DATABASE_URL 확인)">
      <Suspense fallback={<AdminSkeleton />}>
        <Reports />
      </Suspense>
    </DbSection>
  );
}

async function Reports() {
  await requireAdmin();
  const [reported, reviews, talk] = await Promise.all([reportedItems(), reportedReviews(), reportedTalk()]);
  const total = reported.posts.length + reported.comments.length + reviews.length + talk.length;

  return (
    <>
      <AdminPageTitle
        title="신고"
        desc="신고가 5건 쌓이면 자동으로 숨겨져요. 문제가 없으면 '신고 초기화', 문제가 있으면 숨김·삭제하세요."
      />
      {total === 0 && <EmptyRow>처리할 신고가 없어요.</EmptyRow>}

      {reported.posts.length > 0 && (
        <AdminCard title={`신고된 글 ${reported.posts.length}`}>
          <ul className="divide-y divide-hairline">
            {reported.posts.map((p) => (
              <li key={p.id} className="py-3">
                <div className="flex flex-wrap items-center gap-2 type-caption">
                  <CategoryTag category={p.category} />
                  <Link href={`/board/${p.id}`} className="link type-body-md">
                    {p.title}
                  </Link>
                  <StatusTag status={p.status} />
                  <span className="tag bg-ev-doc-soft text-ev-doc">신고 {p.reports}</span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-3 type-caption text-ink-mute">
                  <AuthorLabel nickname={p.nickname} ipPrefix={p.ipPrefix} isAdmin={p.isAdmin} />
                  <span>{formatPostDateTime(p.createdAt)}</span>
                </div>
                <ModerationBar type="post" id={p.id} status={p.status} isNotice={p.isNotice} reports={p.reports} compact className="mt-2" />
              </li>
            ))}
          </ul>
        </AdminCard>
      )}

      {reported.comments.length > 0 && (
        <AdminCard title={`신고된 댓글 ${reported.comments.length}`}>
          <ul className="divide-y divide-hairline">
            {reported.comments.map((c) => (
              <li key={c.id} className="py-3">
                <p className="type-body-md whitespace-pre-wrap text-ink [overflow-wrap:anywhere]">{c.body}</p>
                <div className="mt-1 flex flex-wrap items-center gap-3 type-caption text-ink-mute">
                  <AuthorLabel nickname={c.nickname} ipPrefix={c.ipPrefix} isAdmin={false} />
                  <span>{formatPostDateTime(c.createdAt)}</span>
                  <Link href={`/board/${c.postId}`} className="link">
                    원글 보기
                  </Link>
                  <StatusTag status={c.status} />
                  <span className="tag bg-ev-doc-soft text-ev-doc">신고 {c.reports}</span>
                </div>
                <ModerationBar type="comment" id={c.id} status={c.status} reports={c.reports} compact className="mt-2" />
              </li>
            ))}
          </ul>
        </AdminCard>
      )}

      {reviews.length > 0 && (
        <AdminCard title={`신고된 필기 후기 ${reviews.length}`}>
          <ul className="divide-y divide-hairline">
            {reviews.map((r) => {
              const exam = getExam(r.examId);
              return (
                <li key={r.id} className="py-3">
                  {r.oneLiner && <p className="type-body-md text-ink">{r.oneLiner}</p>}
                  {r.detail && <p className="mt-1 type-body-md whitespace-pre-wrap text-ink-secondary">{r.detail}</p>}
                  <div className="mt-1 flex flex-wrap items-center gap-3 type-caption text-ink-mute">
                    <span>{formatPostDateTime(r.createdAt)}</span>
                    <Link href={`/reviews/${r.examId}`} className="link">
                      {exam ? `${exam.companyName} ${exam.label}` : "시험 페이지"}
                    </Link>
                    <StatusTag status={r.status} />
                    <span className="tag bg-ev-doc-soft text-ev-doc">신고 {r.reports}</span>
                  </div>
                  <ModerationBar type="review" id={r.id} status={r.status} reports={r.reports} compact className="mt-2" />
                </li>
              );
            })}
          </ul>
        </AdminCard>
      )}

      {talk.length > 0 && (
        <AdminCard title={`신고된 실시간 톡 ${talk.length}`}>
          <ul className="divide-y divide-hairline">
            {talk.map((t) => {
              const exam = getExam(t.examId);
              return (
                <li key={t.id} className="py-3">
                  <p className="type-body-md whitespace-pre-wrap text-ink [overflow-wrap:anywhere]">{t.body}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-3 type-caption text-ink-mute">
                    <span>{formatPostDateTime(t.createdAt)}</span>
                    <Link href={`/admin/reviews/${t.examId}`} className="link">
                      {exam ? `${exam.companyName} ${exam.label}` : "시험"} 톡
                    </Link>
                    <StatusTag status={t.status} />
                    <span className="tag bg-ev-doc-soft text-ev-doc">신고 {t.reports}</span>
                  </div>
                  <ModerationBar type="talk" id={t.id} status={t.status} reports={t.reports} compact className="mt-2" />
                </li>
              );
            })}
          </ul>
        </AdminCard>
      )}
    </>
  );
}
