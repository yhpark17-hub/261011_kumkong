import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { ArticleEditor } from "@/components/admin/ArticleEditor";
import { AdminPageTitle } from "@/components/admin/parts";
import { AdminSkeleton } from "@/components/admin/Skeleton";
import { DbSection } from "@/components/db/DbSection";
import { requireAdmin } from "@/lib/server/admin";
import { editorForNew } from "@/lib/server/magazine-editor";

export const metadata = { title: "매거진 새 글" };

export default function NewArticlePage({ searchParams }: PageProps<"/admin/magazine/new">) {
  return (
    <DbSection noticeTitle="DB가 연결되지 않았어요 (DATABASE_URL 확인)">
      <Suspense fallback={<AdminSkeleton />}>
        {searchParams.then((sp) => (
          <NewArticle template={typeof sp.template === "string" ? sp.template : null} />
        ))}
      </Suspense>
    </DbSection>
  );
}

async function NewArticle({ template }: { template: string | null }) {
  await requireAdmin();
  return (
    <>
      <Link href="/admin/magazine" className="link inline-flex items-center gap-1 type-caption">
        <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
        매거진 목록
      </Link>
      <AdminPageTitle title={template === "briefing" ? "오늘의 브리핑 쓰기" : "새 글 쓰기"} desc="오른쪽 미리보기가 실제 페이지와 같은 모양이에요. 작성 중인 내용은 이 브라우저에 자동 보관돼요." />
      <ArticleEditor initial={editorForNew(template)} />
    </>
  );
}
