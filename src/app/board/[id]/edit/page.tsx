import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { PostForm } from "@/components/board/PostForm";
import { DbSection } from "@/components/db/DbSection";
import { Card } from "@/components/ui";
import { BOARD_NAME } from "@/lib/board-meta";
import { companyOptions } from "@/lib/data";
import { getPost } from "@/lib/server/board";
import { isAdmin } from "@/lib/server/security";

export const metadata: Metadata = {
  title: `글 수정 - ${BOARD_NAME}`,
  robots: { index: false, follow: false },
};

export default function EditPage({ params }: PageProps<"/board/[id]/edit">) {
  return (
    <div className="mx-auto max-w-[840px] px-4 pt-8 pb-12 md:px-6 md:pt-12">
      <DbSection noticeTitle="콩밭(게시판)을 준비하고 있어요">
        <Suspense fallback={<div className="h-[600px] animate-pulse rounded-lg bg-canvas-soft" />}>
          {params.then(({ id }) => (
            <EditForm rawId={id} />
          ))}
        </Suspense>
      </DbSection>
    </div>
  );
}

async function EditForm({ rawId }: { rawId: string }) {
  await connection();
  const id = Number(rawId);
  if (!Number.isInteger(id) || id < 1) notFound();
  const [post, admin] = await Promise.all([getPost(id), isAdmin()]);
  if (!post || (post.status !== 0 && !admin)) notFound();

  return (
    <>
      <Link href={`/board/${id}`} className="link inline-flex items-center gap-1 type-caption">
        <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
        글로 돌아가기
      </Link>
      <h1 className="mt-6 type-display-md text-ink">글 수정</h1>
      {post.isAdmin && !admin ? (
        <p className="mt-4 type-body-md text-ink-secondary">운영자 글은 운영자만 고칠 수 있어요.</p>
      ) : (
        <Card className="mt-8 p-6 md:p-8">
          <PostForm
            mode="edit"
            admin={admin}
            companies={companyOptions()}
            initial={{ id: post.id, category: post.category, title: post.title, body: post.body, companyId: post.companyId, attachments: post.attachments }}
          />
        </Card>
      )}
    </>
  );
}
