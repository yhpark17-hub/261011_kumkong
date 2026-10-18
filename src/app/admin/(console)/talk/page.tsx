import Link from "next/link";
import { Suspense } from "react";
import { ModerationForm, RowCheck } from "@/components/admin/ModerationForm";
import { AdminCard, AdminPageTitle, AdminPager, BulkButton, EmptyRow, FilterBar, RowButton, StatusTag, listHref, nf } from "@/components/admin/parts";
import { AdminSkeleton } from "@/components/admin/Skeleton";
import { DbSection } from "@/components/db/DbSection";
import { formatPostDateTime } from "@/lib/board-meta";
import { bannedSet, parseStatus, requireAdmin } from "@/lib/server/admin";
import { getExam } from "@/lib/server/reviews";
import { adminTalk } from "@/lib/server/talk";
import { TALK_HIDDEN_TEXT } from "@/lib/talk-meta";

export const metadata = { title: "실시간 톡" };

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
const PAGE = 50;

/** 운영자: 모든 시험의 실시간 응시자 톡 — 골라서 가리기·다시 보이기·삭제·작성자 차단 */
export default function AdminTalkPage({ searchParams }: PageProps<"/admin/talk">) {
  return (
    <DbSection noticeTitle="DB가 연결되지 않았어요 (DATABASE_URL 확인)">
      <Suspense fallback={<AdminSkeleton />}>{searchParams.then((sp) => <Talk sp={sp} />)}</Suspense>
    </DbSection>
  );
}

async function Talk({ sp }: { sp: SP }) {
  await requireAdmin();
  const status = parseStatus(one(sp.status));
  const q = one(sp.q).trim().slice(0, 40);
  const exam = getExam(one(sp.exam))?.id ?? "";
  const page = Math.max(1, Number.parseInt(one(sp.page), 10) || 1);
  const { rows, total } = await adminTalk({ status, exam, q, page, size: PAGE });
  const banned = await bannedSet(rows.map((r) => r.ipHash));
  const examInfo = exam ? getExam(exam) : undefined;

  return (
    <>
      <AdminPageTitle
        title="실시간 톡"
        desc={`조건에 맞는 메시지 ${nf.format(total)}개 · '가리기'하면 방문자에게는 "${TALK_HIDDEN_TEXT.admin}"로 보여요. 삭제하면 톡에서 빠져요.`}
      />
      <FilterBar action="/admin/talk" status={status} q={q} placeholder="메시지 검색" hidden={{ exam }} />
      {examInfo && (
        <p className="flex flex-wrap items-center gap-2 rounded-md bg-canvas-cream px-3 py-2 type-caption text-ink-secondary">
          {examInfo.companyName} {examInfo.label}({examInfo.date}) 톡만 보는 중
          <Link href={listHref("/admin/talk", { status, q })} className="link">
            해제
          </Link>
          <Link href={`/admin/reviews/${examInfo.id}`} className="link">
            이 시험 톡에서 운영자로 쓰기
          </Link>
        </p>
      )}

      <AdminCard>
        {rows.length === 0 ? (
          <EmptyRow>조건에 맞는 메시지가 없어요.</EmptyRow>
        ) : (
          <ModerationForm
            type="talk"
            toolbar={
              <>
                <BulkButton value="hide">선택 가리기</BulkButton>
                <BulkButton value="show">선택 다시 보이기</BulkButton>
                <BulkButton value="delete" danger confirm="선택한 메시지를 삭제할까요? 톡에서 빠져요.">
                  선택 삭제
                </BulkButton>
                {status === "deleted" && (
                  <BulkButton value="purge" danger confirm="선택한 메시지를 DB에서 완전히 지울까요? 되돌릴 수 없어요.">
                    완전 삭제
                  </BulkButton>
                )}
                <BulkButton value="ban" danger confirm="선택한 메시지의 작성자를 차단할까요?">
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
                        {r.admin && <span className="tag bg-brand-dark text-on-primary">운영자</span>}
                        <span className="font-semibold text-ink-secondary">{r.name}</span>
                        <Link href={listHref("/admin/talk", { exam: r.examId })} className="hover:underline">
                          {info ? `${info.companyName} ${info.label}` : r.examId}
                        </Link>
                        <span className="tabular">{formatPostDateTime(r.createdAt)}</span>
                        {r.reports > 0 && <span className="text-ruby">신고 {r.reports}</span>}
                        {banned.has(r.ipHash) && <span className="tag bg-ev-doc-soft text-ev-doc">차단됨</span>}
                      </p>
                      <p className="mt-1 type-body-md whitespace-pre-wrap text-ink [overflow-wrap:anywhere]">{r.body}</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {r.status === 0 ? <RowButton value={`hide:${r.id}`}>가리기</RowButton> : r.status === 1 ? <RowButton value={`show:${r.id}`}>다시 보이기</RowButton> : null}
                        {r.reports > 0 && <RowButton value={`clearReports:${r.id}`}>신고 초기화</RowButton>}
                        {r.status !== 2 ? (
                          <RowButton value={`delete:${r.id}`} danger confirm="이 메시지를 삭제할까요?">
                            삭제
                          </RowButton>
                        ) : (
                          <RowButton value={`purge:${r.id}`} danger confirm="이 메시지를 DB에서 완전히 지울까요?">
                            완전 삭제
                          </RowButton>
                        )}
                        {!banned.has(r.ipHash) && !r.admin && (
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
      <AdminPager page={page} total={total} size={PAGE} hrefFor={(n) => listHref("/admin/talk", { status, q, exam, page: n })} />
    </>
  );
}
