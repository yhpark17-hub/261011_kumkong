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
import { AdminBadge, CategoryTag } from "@/components/board/parts";
import { DbSection } from "@/components/db/DbSection";
import { formatPostDateTime } from "@/lib/board-meta";
import { getCompany } from "@/lib/data";
import { ADMIN_PAGE_SIZE, adminPosts, bannedSet, parseStatus, requireAdmin, type StatusFilter } from "@/lib/server/admin";

export const metadata = { title: "콩밭 글" };

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default function AdminPostsPage({ searchParams }: PageProps<"/admin/posts">) {
  return (
    <DbSection noticeTitle="DB가 연결되지 않았어요 (DATABASE_URL 확인)">
      <Suspense fallback={<AdminSkeleton />}>{searchParams.then((sp) => <Posts sp={sp} />)}</Suspense>
    </DbSection>
  );
}

async function Posts({ sp }: { sp: SP }) {
  await requireAdmin();
  const status: StatusFilter = parseStatus(one(sp.status));
  const q = one(sp.q).trim().slice(0, 40);
  const ip = /^[a-f0-9]{16,64}$/.test(one(sp.ip)) ? one(sp.ip) : "";
  const page = Math.max(1, Number.parseInt(one(sp.page), 10) || 1);
  const { rows, total } = await adminPosts({ status, q, ip, page });
  const banned = await bannedSet(rows.map((r) => r.ipHash));
  const base = { status, q, ip };

  return (
    <>
      <AdminPageTitle title="콩밭 글" desc={`조건에 맞는 글 ${nf.format(total)}개 · 숨김은 되돌릴 수 있고, 완전 삭제는 '삭제됨' 상태에서만 가능해요.`} />
      <FilterBar action="/admin/posts" status={status} q={q} placeholder="제목·내용·닉네임 검색" hidden={{ ip }} />
      {ip && (
        <p className="flex flex-wrap items-center gap-2 rounded-md bg-canvas-cream px-3 py-2 type-caption text-ink-secondary">
          같은 작성자(IP)의 글만 보는 중
          <Link href={listHref("/admin/posts", { status, q })} className="link">
            해제
          </Link>
          <Link href={listHref("/admin/comments", { ip })} className="link">
            이 작성자의 댓글 보기
          </Link>
        </p>
      )}

      <AdminCard>
        {rows.length === 0 ? (
          <EmptyRow>조건에 맞는 글이 없어요.</EmptyRow>
        ) : (
          <ModerationForm
            type="post"
            toolbar={
              <>
                <BulkButton value="hide">선택 숨김</BulkButton>
                <BulkButton value="show">선택 복구</BulkButton>
                <BulkButton value="delete" danger confirm="선택한 글을 삭제할까요? (삭제됨 목록에서 복구할 수 있어요)">
                  선택 삭제
                </BulkButton>
                {status === "deleted" && (
                  <BulkButton value="purge" danger confirm="선택한 글과 그 댓글을 DB에서 완전히 지울까요? 되돌릴 수 없어요.">
                    완전 삭제
                  </BulkButton>
                )}
                <BulkButton value="ban" danger confirm="선택한 글의 작성자를 차단할까요? 이후 글·댓글·후기를 쓸 수 없어요.">
                  작성자 차단
                </BulkButton>
              </>
            }
          >
            <ul className="divide-y divide-hairline">
              {rows.map((p) => {
                const company = p.companyId ? getCompany(p.companyId) : undefined;
                return (
                  <li key={p.id} className="flex gap-3 py-3">
                    <RowCheck id={p.id} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusTag status={p.status} />
                        <CategoryTag category={p.category} />
                        {p.isNotice && <span className="tag bg-canvas-cream text-lemon">공지</span>}
                        {company && <span className="type-micro text-ink-mute">{company.shortName}</span>}
                        <Link href={`/board/${p.id}`} className="min-w-0 truncate type-body-md !font-normal text-ink hover:underline">
                          {p.title}
                        </Link>
                      </div>
                      <p className="mt-1 line-clamp-2 type-caption text-ink-secondary">{p.excerpt}</p>
                      <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 type-micro text-ink-mute">
                        {p.isAdmin ? (
                          <AdminBadge />
                        ) : (
                          <span>
                            {p.nickname} ({p.ipPrefix})
                          </span>
                        )}
                        {banned.has(p.ipHash) && <span className="tag bg-ev-doc-soft text-ev-doc">차단됨</span>}
                        <span className="tabular">{formatPostDateTime(p.createdAt)}</span>
                        <span className="tabular">
                          조회 {p.views} · 추천 {p.likes} · 댓글 {p.commentCount}
                        </span>
                        {p.reports > 0 && <span className="text-ruby">신고 {p.reports}</span>}
                        {!p.isAdmin && !ip && (
                          <Link href={listHref("/admin/posts", { ip: p.ipHash })} className="link">
                            같은 작성자
                          </Link>
                        )}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {p.status === 0 ? <RowButton value={`hide:${p.id}`}>숨김</RowButton> : <RowButton value={`show:${p.id}`}>복구</RowButton>}
                        {p.isNotice ? <RowButton value={`unpin:${p.id}`}>공지 해제</RowButton> : <RowButton value={`pin:${p.id}`}>공지 고정</RowButton>}
                        {p.reports > 0 && <RowButton value={`clearReports:${p.id}`}>신고 초기화</RowButton>}
                        {p.status !== 2 && (
                          <RowButton value={`delete:${p.id}`} danger confirm="이 글을 삭제할까요?">
                            삭제
                          </RowButton>
                        )}
                        {p.status === 2 && (
                          <RowButton value={`purge:${p.id}`} danger confirm="이 글과 댓글을 DB에서 완전히 지울까요? 되돌릴 수 없어요.">
                            완전 삭제
                          </RowButton>
                        )}
                        {!p.isAdmin && !banned.has(p.ipHash) && (
                          <RowButton value={`ban:${p.id}`} danger confirm="이 작성자를 차단할까요?">
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
      <AdminPager page={page} total={total} size={ADMIN_PAGE_SIZE} hrefFor={(n) => listHref("/admin/posts", { ...base, page: n })} />
    </>
  );
}
