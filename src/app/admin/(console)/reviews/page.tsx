import Link from "next/link";
import { Suspense } from "react";
import { ModerationForm, RowCheck } from "@/components/admin/ModerationForm";
import {
  AdminCard,
  AdminPageTitle,
  AdminPager,
  BulkButton,
  EmptyRow,
  FilterBar,
  RowButton,
  StatusTag,
  listHref,
  nf,
} from "@/components/admin/parts";
import { AdminSkeleton } from "@/components/admin/Skeleton";
import { DbSection } from "@/components/db/DbSection";
import { cn } from "@/components/ui";
import { formatPostDateTime } from "@/lib/board-meta";
import { OVERALL_OPTIONS, TIME_OPTIONS } from "@/lib/review-meta";
import { ADMIN_PAGE_SIZE, adminReviews, bannedSet, parseStatus, requireAdmin } from "@/lib/server/admin";
import { getExam } from "@/lib/server/reviews";

export const metadata = { title: "필기 후기" };

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default function AdminReviewsPage({ searchParams }: PageProps<"/admin/reviews">) {
  return (
    <DbSection noticeTitle="DB가 연결되지 않았어요 (DATABASE_URL 확인)">
      <Suspense fallback={<AdminSkeleton />}>{searchParams.then((sp) => <Reviews sp={sp} />)}</Suspense>
    </DbSection>
  );
}

async function Reviews({ sp }: { sp: SP }) {
  await requireAdmin();
  const status = parseStatus(one(sp.status));
  const q = one(sp.q).trim().slice(0, 40);
  const exam = getExam(one(sp.exam))?.id ?? "";
  const text = one(sp.text) === "1";
  const page = Math.max(1, Number.parseInt(one(sp.page), 10) || 1);
  const { rows, total } = await adminReviews({ status, q, exam, textOnly: text, page });
  const banned = await bannedSet(rows.map((r) => r.ipHash));
  const examInfo = exam ? getExam(exam) : undefined;

  return (
    <>
      <AdminPageTitle
        title="필기 후기"
        desc={`조건에 맞는 응답 ${nf.format(total)}개 · 숨기거나 지운 응답은 결과 그래프 집계에서도 빠져요.`}
      />
      <FilterBar
        action="/admin/reviews"
        status={status}
        q={q}
        placeholder="한 줄·자세한 후기 검색"
        hidden={{ exam, text: text ? "1" : undefined }}
        extra={
          <Link
            href={listHref("/admin/reviews", { status, q, exam, text: text ? undefined : "1" })}
            className={cn("btn btn-sm shrink-0", text ? "btn-on-dark" : "btn-toggle")}
          >
            글 남긴 것만
          </Link>
        }
      />
      {examInfo && (
        <p className="flex flex-wrap items-center gap-2 rounded-md bg-canvas-cream px-3 py-2 type-caption text-ink-secondary">
          {examInfo.companyName} {examInfo.label}({examInfo.date}) 응답만 보는 중
          <Link href={listHref("/admin/reviews", { status, q, text: text ? "1" : undefined })} className="link">
            해제
          </Link>
          <Link href={`/reviews/${examInfo.id}`} className="link">
            결과 페이지
          </Link>
        </p>
      )}

      <AdminCard>
        {rows.length === 0 ? (
          <EmptyRow>조건에 맞는 후기가 없어요.</EmptyRow>
        ) : (
          <ModerationForm
            type="review"
            toolbar={
              <>
                <BulkButton value="hide">선택 숨김</BulkButton>
                <BulkButton value="show">선택 복구</BulkButton>
                <BulkButton value="delete" danger confirm="선택한 후기를 삭제할까요? 집계에서도 빠져요.">
                  선택 삭제
                </BulkButton>
                {status === "deleted" && (
                  <BulkButton value="purge" danger confirm="선택한 후기를 DB에서 완전히 지울까요? 되돌릴 수 없어요.">
                    완전 삭제
                  </BulkButton>
                )}
                <BulkButton value="ban" danger confirm="선택한 후기의 작성자를 차단할까요?">
                  작성자 차단
                </BulkButton>
              </>
            }
          >
            <ul className="divide-y divide-hairline">
              {rows.map((r) => {
                const info = getExam(r.examId);
                return (
                  <li key={r.id} className="flex gap-3 py-3">
                    <RowCheck id={r.id} />
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-2 type-caption text-ink-mute">
                        <StatusTag status={r.status} />
                        <Link href={listHref("/admin/reviews", { exam: r.examId })} className="hover:underline">
                          {info ? `${info.companyName} ${info.label}` : r.examId}
                        </Link>
                        <span>· 난이도 {OVERALL_OPTIONS.find((o) => o.value === r.overall)?.label}</span>
                        <span>· 시간 {TIME_OPTIONS.find((o) => o.value === r.timePressure)?.label}</span>
                        {r.track && <span>· {r.track}</span>}
                      </p>
                      {r.oneLiner && <p className="mt-1 type-body-md !font-normal text-ink">{r.oneLiner}</p>}
                      {r.detail && (
                        <p className="mt-1 type-body-md whitespace-pre-wrap text-ink-secondary [overflow-wrap:anywhere]">{r.detail}</p>
                      )}
                      {!r.oneLiner && !r.detail && <p className="mt-1 type-caption text-ink-mute">(선택 응답만 있음)</p>}
                      <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 type-micro text-ink-mute">
                        <span className="tabular">{formatPostDateTime(r.createdAt)}</span>
                        {banned.has(r.ipHash) && <span className="tag bg-ev-doc-soft text-ev-doc">차단됨</span>}
                        {r.reports > 0 && <span className="text-ruby">신고 {r.reports}</span>}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {r.status === 0 ? <RowButton value={`hide:${r.id}`}>숨김</RowButton> : <RowButton value={`show:${r.id}`}>복구</RowButton>}
                        {r.reports > 0 && <RowButton value={`clearReports:${r.id}`}>신고 초기화</RowButton>}
                        {r.status !== 2 && (
                          <RowButton value={`delete:${r.id}`} danger confirm="이 후기를 삭제할까요?">
                            삭제
                          </RowButton>
                        )}
                        {r.status === 2 && (
                          <RowButton value={`purge:${r.id}`} danger confirm="이 후기를 DB에서 완전히 지울까요?">
                            완전 삭제
                          </RowButton>
                        )}
                        {!banned.has(r.ipHash) && (
                          <RowButton value={`ban:${r.id}`} danger confirm="이 작성자를 차단할까요?">
                            작성자 차단
                          </RowButton>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </ModerationForm>
        )}
      </AdminCard>
      <AdminPager
        page={page}
        total={total}
        size={ADMIN_PAGE_SIZE}
        hrefFor={(n) => listHref("/admin/reviews", { status, q, exam, text: text ? "1" : undefined, page: n })}
      />
    </>
  );
}
