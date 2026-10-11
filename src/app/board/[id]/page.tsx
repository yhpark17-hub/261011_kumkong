import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { ArrowLeft, BadgeCheck, BarChart3, EyeOff, PenLine } from "lucide-react";
import { AdSlot } from "@/components/ads/AdSlot";
import { ModerationBar } from "@/components/board/ModerationBar";
import { AuthorLabel, CategoryTag, PostBody } from "@/components/board/parts";
import {
  CommentForm,
  DeleteCommentButton,
  DeletePostForm,
  LikeButton,
  ReportButton,
  ViewCounter,
} from "@/components/board/interactive";
import { Card, CompanyAvatar, cn } from "@/components/ui";
import { BOARD_NAME, formatPostDateTime } from "@/lib/board-meta";
import { getCompany } from "@/lib/data";
import { getPost, listComments } from "@/lib/server/board";
import { isAdmin } from "@/lib/server/security";
import { AD_SLOTS, SITE } from "@/lib/site";

function parseId(raw: string): number | null {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export async function generateMetadata({ params }: PageProps<"/board/[id]">): Promise<Metadata> {
  const id = parseId((await params).id);
  const post = id ? await getPost(id) : null;
  if (!post || post.status !== 0) return { title: BOARD_NAME, robots: { index: false, follow: false } };
  const description = post.body.replace(/[#*>\[\]()]/g, "").replace(/\s+/g, " ").trim().slice(0, 140);
  // 짧은 익명 글은 검색 노출에서 빼고, 운영자 가이드·충분히 긴 글만 색인합니다.
  const thin = !post.isAdmin && post.body.length < 200;
  return {
    title: `${post.title} - ${BOARD_NAME}`,
    description,
    alternates: { canonical: `/board/${post.id}` },
    robots: thin ? { index: false, follow: true } : undefined,
    openGraph: { title: `${post.title} | ${BOARD_NAME} · ${SITE.name}`, description, type: "article" },
  };
}

export default function PostPage({ params }: PageProps<"/board/[id]">) {
  return (
    <div className="mx-auto max-w-[1200px] px-4 pt-8 pb-12 md:px-6 md:pt-12">
      <Link href="/board" className="link inline-flex items-center gap-1 type-caption">
        <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
        {BOARD_NAME} 목록
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_304px]">
        <div className="min-w-0">
          <Suspense fallback={<PostSkeleton />}>{params.then(({ id }) => <PostView rawId={id} />)}</Suspense>
        </div>
        <aside className="space-y-4">
          <AdSlot slot={AD_SLOTS.sidebar} variant="rectangle" />
          <Card className="p-6">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-ev-written-soft text-ev-written">
              <BarChart3 className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <h2 className="mt-4 type-heading-sm text-ink">필기 체감 난이도 투표</h2>
            <p className="mt-2 type-body-md text-ink-secondary">
              시험 본 사람들이 남긴 과목별 난이도·시간 여유를 표와 그래프로 확인하세요.
            </p>
            <Link href="/reviews" className="btn btn-secondary btn-sm mt-4">
              필기 후기 보기
            </Link>
          </Card>
          <div className="lg:sticky lg:top-24">
            <AdSlot slot={AD_SLOTS.sidebarSticky} variant="skyscraper" className="hidden lg:block" />
          </div>
        </aside>
      </div>
    </div>
  );
}

function PostSkeleton() {
  return (
    <div className="card animate-pulse p-8">
      <div className="h-5 w-16 rounded-full bg-canvas-soft" />
      <div className="mt-4 h-8 w-3/4 rounded-md bg-canvas-soft" />
      <div className="mt-3 h-4 w-1/2 rounded-md bg-canvas-soft" />
      <div className="mt-10 space-y-3">
        <div className="h-4 rounded-md bg-canvas-soft" />
        <div className="h-4 rounded-md bg-canvas-soft" />
        <div className="h-4 w-2/3 rounded-md bg-canvas-soft" />
      </div>
    </div>
  );
}

async function PostView({ rawId }: { rawId: string }) {
  await connection();
  const id = parseId(rawId);
  if (!id) notFound();
  const [post, admin] = await Promise.all([getPost(id), isAdmin()]);
  if (!post) notFound();

  const hidden = post.status !== 0;
  if (hidden && !admin) {
    return (
      <Card className="flex flex-col items-center p-12 text-center">
        <EyeOff className="h-8 w-8 text-ink-mute" strokeWidth={1.5} />
        <p className="mt-4 type-heading-sm text-ink">신고가 누적되어 임시로 숨겨진 글이에요.</p>
        <p className="mt-2 type-body-md text-ink-mute">운영자가 검토한 뒤 복구하거나 삭제합니다.</p>
        <Link href="/board" className="btn btn-toggle btn-sm mt-6">
          목록으로
        </Link>
      </Card>
    );
  }

  const comments = await listComments(id, admin);
  const company = post.companyId ? getCompany(post.companyId) : undefined;
  const canEdit = !post.isAdmin || admin;

  return (
    <>
      <ViewCounter postId={id} />
      <article className={cn("card overflow-hidden shadow-level-1", post.isAdmin && "!border-brand-dark")}>
        {post.isAdmin && (
          <div className="flex items-center gap-2 bg-brand-dark px-6 py-2.5 type-caption text-on-primary md:px-8">
            <BadgeCheck className="h-4 w-4" strokeWidth={1.75} />
            {SITE.name} 운영자가 작성한 글이에요
          </div>
        )}
        <header className="border-b border-hairline px-6 py-6 md:px-8">
          <div className="flex flex-wrap items-center gap-2">
            <CategoryTag category={post.category} />
            {post.isNotice && <span className="tag bg-canvas-cream text-lemon">고정</span>}
            {company && (
              <Link
                href={`/companies/${company.id}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-hairline py-0.5 pr-2.5 pl-0.5 type-caption text-ink-secondary hover:border-hairline-input"
              >
                <CompanyAvatar company={company} size="sm" />
                {company.name}
              </Link>
            )}
          </div>
          <h1 className="mt-4 type-heading-lg text-ink md:type-display-md">{post.title}</h1>
          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 type-caption text-ink-mute">
            <AuthorLabel nickname={post.nickname} ipPrefix={post.ipPrefix} isAdmin={post.isAdmin} />
            <span className="tabular">{formatPostDateTime(post.createdAt)}</span>
            <span>조회 {post.views}</span>
            <span>추천 {post.likes}</span>
            <span>댓글 {post.commentCount}</span>
          </div>
        </header>

        {hidden && (
          <p className="bg-ev-doc-soft px-6 py-3 type-caption text-ev-doc md:px-8">
            현재 숨김 상태예요 (신고 {post.reports}건). 운영자에게만 보입니다.
          </p>
        )}

        <div className="px-6 py-8 md:px-8 md:py-10">
          <PostBody body={post.body} rich={post.isAdmin} />
        </div>

        <div className="flex justify-center pb-8">
          <LikeButton postId={post.id} initial={post.likes} />
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-hairline px-6 py-4 md:px-8">
          <ReportButton type="post" id={post.id} />
          <div className="flex flex-wrap items-center gap-2">
            {canEdit && (
              <Link href={`/board/${post.id}/edit`} className="btn btn-sm btn-toggle">
                수정
              </Link>
            )}
            <DeletePostForm postId={post.id} admin={admin} isAdminPost={post.isAdmin} />
          </div>
        </footer>
        {admin && (
          <div className="border-t border-hairline bg-canvas-soft px-6 py-3 md:px-8">
            <ModerationBar
              type="post"
              id={post.id}
              status={post.status}
              isNotice={post.isNotice}
              reports={post.reports}
              returnTo="/board"
            />
          </div>
        )}
      </article>

      <AdSlot slot={AD_SLOTS.inArticle} variant="inarticle" className="mt-6" />

      <section className="card mt-6 p-6 md:p-8" aria-label="댓글">
        <h2 className="type-heading-sm text-ink">
          댓글 <span className="tabular text-primary-text">{comments.filter((c) => c.status === 0).length}</span>
        </h2>
        {comments.length > 0 && (
          <ul className="mt-4 border-t border-hairline">
            {comments.map((c) => (
              <li
                key={c.id}
                className={cn(
                  "border-b border-hairline py-4",
                  c.isAdmin && "-mx-3 rounded-md bg-canvas-cream/60 px-3",
                  c.status !== 0 && "opacity-60",
                )}
              >
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 type-caption">
                  <AuthorLabel nickname={c.nickname} ipPrefix={c.ipPrefix} isAdmin={c.isAdmin} />
                  <span className="tabular text-ink-mute">{formatPostDateTime(c.createdAt)}</span>
                  {c.status !== 0 && <span className="tag bg-ev-doc-soft text-ev-doc">숨김</span>}
                  <span className="ml-auto flex items-center gap-3">
                    <ReportButton type="comment" id={c.id} small />
                    <DeleteCommentButton commentId={c.id} admin={admin} isAdminComment={c.isAdmin} />
                  </span>
                </div>
                <p className="mt-2 type-body-md whitespace-pre-wrap text-ink [overflow-wrap:anywhere]">{c.body}</p>
                {admin && <ModerationBar type="comment" id={c.id} status={c.status} compact className="mt-2" />}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-6">
          {post.status === 0 ? (
            <CommentForm postId={post.id} admin={admin} />
          ) : (
            <p className="type-caption text-ink-mute">숨김 상태인 글에는 댓글을 달 수 없어요.</p>
          )}
        </div>
      </section>

      <div className="mt-6 flex justify-between">
        <Link href="/board" className="btn btn-toggle btn-sm">
          목록
        </Link>
        <Link href="/board/write" className="btn btn-primary btn-sm">
          <PenLine className="h-4 w-4" strokeWidth={1.75} />
          글쓰기
        </Link>
      </div>
    </>
  );
}
