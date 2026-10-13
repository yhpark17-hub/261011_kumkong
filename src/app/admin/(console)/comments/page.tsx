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
import { AdminBadge } from "@/components/board/parts";
import { DbSection } from "@/components/db/DbSection";
import { formatPostDateTime } from "@/lib/board-meta";
import { ADMIN_PAGE_SIZE, adminComments, bannedSet, parseStatus, requireAdmin } from "@/lib/server/admin";

export const metadata = { title: "댓글" };

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default function AdminCommentsPage({ searchParams }: PageProps<"/admin/comments">) {
  return (
    <DbSection noticeTitle="DB가 연결되지 않았어요 (DATABASE_URL 확인)">
      <Suspense fallback={<AdminSkeleton />}>{searchParams.then((sp) => <Comments sp={sp} />)}</Suspense>
    </DbSection>
  );
}

async function Comments({ sp }: { sp: SP }) {
  await requireAdmin();
  const status = parseStatus(one(sp.status));
  const q = one(sp.q).trim().slice(0, 40);
  const ip = /^[a-f0-9]{16,64}$/.test(one(sp.ip)) ? one(sp.ip) : "";
  const page = Math.max(1, Number.parseInt(one(sp.page), 10) || 1);
  const { rows, total } = await adminComments({ status, q, ip, page });
  const banned = await bannedSet(rows.map((r) => r.ipHash));

  return (
    <>
      <AdminPageTitle title="댓글" desc={`조건에 맞는 댓글 ${nf.format(total)}개`} />
      <FilterBar action="/admin/comments" status={status} q={q} placeholder="댓글 내용·닉네임 검색" hidden={{ ip }} />
      {ip && (
        <p className="flex flex-wrap items-center gap-2 rounded-md bg-canvas-cream px-3 py-2 type-caption text-ink-secondary">
          같은 작성자(IP)의 댓글만 보는 중
          <Link href={listHref("/admin/comments", { status, q })} className="link">
            해제
          </Link>
          <Link href={listHref("/admin/posts", { ip })} className="link">
            이 작성자의 글 보기
          </Link>
        </p>
      )}

      <AdminCard>
        {rows.length === 0 ? (
          <EmptyRow>조건에 맞는 댓글이 없어요.</EmptyRow>
        ) : (
          <ModerationForm
            type="comment"
            toolbar={
              <>
                <BulkButton value="hide">선택 숨김</BulkButton>
                <BulkButton value="show">선택 복구</BulkButton>
                <BulkButton value="delete" danger confirm="선택한 댓글을 삭제할까요?">
                  선택 삭제
                </BulkButton>
                {status === "deleted" && (
                  <BulkButton value="purge" danger confirm="선택한 댓글을 DB에서 완전히 지울까요? 되돌릴 수 없어요.">
                    완전 삭제
                  </BulkButton>
                )}
                <BulkButton value="ban" danger confirm="선택한 댓글의 작성자를 차단할까요?">
                  작성자 차단
                </BulkButton>
              </>
            }
          >
            <ul className="divide-y divide-hairline">
              {rows.map((c) => (
                <li key={c.id} className="flex gap-3 py-3">
                  <RowCheck id={c.id} />
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 type-caption text-ink-mute">
                      <StatusTag status={c.status} />
                      <Link href={`/board/${c.postId}`} className="min-w-0 truncate hover:underline">
                        원글: {c.postTitle}
                      </Link>
                    </p>
                    <p className="mt-1 type-body-md whitespace-pre-wrap text-ink [overflow-wrap:anywhere]">{c.body}</p>
                    <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 type-micro text-ink-mute">
                      {c.isAdmin ? (
                        <AdminBadge />
                      ) : (
                        <span>
                          {c.nickname} ({c.ipPrefix})
                        </span>
                      )}
                      {banned.has(c.ipHash) && <span className="tag bg-ev-doc-soft text-ev-doc">차단됨</span>}
                      <span className="tabular">{formatPostDateTime(c.createdAt)}</span>
                      {c.reports > 0 && <span className="text-ruby">신고 {c.reports}</span>}
                      {!c.isAdmin && !ip && (
                        <Link href={listHref("/admin/comments", { ip: c.ipHash })} className="link">
                          같은 작성자
                        </Link>
                      )}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {c.status === 0 ? <RowButton value={`hide:${c.id}`}>숨김</RowButton> : <RowButton value={`show:${c.id}`}>복구</RowButton>}
                      {c.reports > 0 && <RowButton value={`clearReports:${c.id}`}>신고 초기화</RowButton>}
                      {c.status !== 2 && (
                        <RowButton value={`delete:${c.id}`} danger confirm="이 댓글을 삭제할까요?">
                          삭제
                        </RowButton>
                      )}
                      {c.status === 2 && (
                        <RowButton value={`purge:${c.id}`} danger confirm="이 댓글을 DB에서 완전히 지울까요?">
                          완전 삭제
                        </RowButton>
                      )}
                      {!c.isAdmin && !banned.has(c.ipHash) && (
                        <RowButton value={`ban:${c.id}`} danger confirm="이 작성자를 차단할까요?">
                          작성자 차단
                        </RowButton>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </ModerationForm>
        )}
      </AdminCard>
      <AdminPager page={page} total={total} size={ADMIN_PAGE_SIZE} hrefFor={(n) => listHref("/admin/comments", { status, q, ip, page: n })} />
    </>
  );
}
