import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { ArticleEditor } from "@/components/admin/ArticleEditor";
import { AdminPageTitle } from "@/components/admin/parts";
import { AdminSkeleton } from "@/components/admin/Skeleton";
import { DbSection } from "@/components/db/DbSection";
import { requireAdmin } from "@/lib/server/admin";
import { getArticle } from "@/lib/server/magazine";
import { editorFromArticle } from "@/lib/server/magazine-editor";

export const metadata = { title: "매거진 글 편집" };

export default function EditArticlePage({ params, searchParams }: PageProps<"/admin/magazine/[id]">) {
  return (
    <DbSection noticeTitle="DB가 연결되지 않았어요 (DATABASE_URL 확인)">
      <Suspense fallback={<AdminSkeleton />}>
        {Promise.all([params, searchParams]).then(([{ id }, sp]) => (
          <EditArticle rawId={id} justSaved={sp.saved === "1"} />
        ))}
      </Suspense>
    </DbSection>
  );
}

async function EditArticle({ rawId, justSaved }: { rawId: string; justSaved: boolean }) {
  await requireAdmin();
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const article = await getArticle(id, { admin: true });
  if (!article) notFound();
  return (
    <>
      <Link href="/admin/magazine" className="link inline-flex items-center gap-1 type-caption">
        <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
        매거진 목록
      </Link>
      <AdminPageTitle title="글 편집" desc={article.source === "auto" ? "자동 점검이 만든 초안이에요. 사실·출처를 확인한 뒤 다듬어서 발행해 주세요." : undefined} />
      {justSaved && <p className="rounded-md bg-ev-final-soft px-4 py-3 type-caption text-ev-final">저장했어요.</p>}
      <ArticleEditor key={article.updatedAt} initial={editorFromArticle(article)} />
    </>
  );
}
