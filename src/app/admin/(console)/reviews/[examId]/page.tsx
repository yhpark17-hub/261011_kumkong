import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft, ExternalLink, ListChecks } from "lucide-react";
import { AdminCard, AdminPageTitle, EmptyRow, StatusTag, listHref } from "@/components/admin/parts";
import { AdminSkeleton } from "@/components/admin/Skeleton";
import { DbSection } from "@/components/db/DbSection";
import { ExamTalk } from "@/components/reviews/ExamTalk";
import { ReviewResults } from "@/components/reviews/Results";
import { Chip, cn } from "@/components/ui";
import { formatPostDateTime } from "@/lib/board-meta";
import { formatLong } from "@/lib/date";
import { OVERALL_OPTIONS } from "@/lib/review-meta";
import { requireAdmin } from "@/lib/server/admin";
import { getExam, reviewComments, reviewStats } from "@/lib/server/reviews";
import { listTalk } from "@/lib/server/talk";

export const metadata = { title: "필기 후기 결과" };

/** 운영자용 시험별 결과 — 후기를 남기지 않아도 사이트와 같은 결과 그래프를 그대로 봐요 */
export default function AdminExamResultPage({ params }: PageProps<"/admin/reviews/[examId]">) {
  return (
    <DbSection noticeTitle="DB가 연결되지 않았어요 (DATABASE_URL 확인)">
      <Suspense fallback={<AdminSkeleton />}>{params.then(({ examId }) => <Result examId={examId} />)}</Suspense>
    </DbSection>
  );
}

async function Result({ examId }: { examId: string }) {
  await requireAdmin();
  const exam = getExam(examId);
  if (!exam) notFound();
  const [stats, comments, talk] = await Promise.all([reviewStats(exam), reviewComments(exam.id, true), listTalk(exam.companyId, { admin: true })]);

  return (
    <>
      <Link href="/admin/reviews" className="link inline-flex items-center gap-1 type-caption">
        <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
        필기 후기
      </Link>
      <AdminPageTitle
        title={`${exam.companyName} ${exam.label}`}
        desc={`${formatLong(exam.date)} · 응답 ${stats.count}명 · 운영자 화면이라 후기를 남기지 않아도 전체 결과가 보여요`}
        aside={
          <div className="flex flex-wrap gap-2">
            <Link href={listHref("/admin/reviews", { exam: exam.id })} className="btn btn-sm btn-toggle">
              <ListChecks className="h-3.5 w-3.5" strokeWidth={1.75} />
              응답 관리
            </Link>
            <Link href={`/reviews/${exam.id}`} target="_blank" className="btn btn-sm btn-toggle">
              <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.75} />
              사이트에서 보기
            </Link>
          </div>
        }
      />
      <div className="flex flex-wrap gap-1.5">
        {exam.subjects.map((s) => (
          <Chip key={s}>{s}</Chip>
        ))}
      </div>

      <AdminCard title="응시자 체감 결과">
        {stats.count === 0 ? <EmptyRow>아직 들어온 응답이 없어요.</EmptyRow> : <ReviewResults stats={stats} />}
      </AdminCard>

      {/* 실시간 응시자 톡 — 숨긴 글도 흐리게, 글마다 숨김·삭제 */}
      {!exam.expected && <ExamTalk room={exam.companyId} roomName={exam.companyName} examId={exam.id} initial={talk} live={false} admin />}

      <AdminCard title={`한 줄 후기 ${comments.length}`} aside={<span className="type-caption text-ink-mute">숨긴 후기도 함께 보여요 (흐리게)</span>}>
        {comments.length === 0 ? (
          <EmptyRow>남겨진 한 줄 후기가 없어요.</EmptyRow>
        ) : (
          <ul className="divide-y divide-hairline">
            {comments.map((c) => (
              <li key={c.id} className={cn("py-3", c.status !== 0 && "opacity-60")}>
                <p className="flex flex-wrap items-center gap-2 type-caption text-ink-mute">
                  <StatusTag status={c.status} />
                  <span className="tag bg-canvas-soft text-ink-secondary">{OVERALL_OPTIONS.find((o) => o.value === c.overall)?.label}</span>
                  {c.track && <span>{c.track}</span>}
                  <span className="tabular">{formatPostDateTime(c.createdAt)}</span>
                </p>
                {c.oneLiner && <p className="mt-1 type-body-md !font-normal text-ink">{c.oneLiner}</p>}
                {c.detail && <p className="mt-1 type-body-md whitespace-pre-wrap text-ink-secondary [overflow-wrap:anywhere]">{c.detail}</p>}
              </li>
            ))}
          </ul>
        )}
      </AdminCard>
    </>
  );
}
