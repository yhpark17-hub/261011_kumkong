import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { NewsForm } from "@/components/admin/NewsForm";
import { AdminPageTitle } from "@/components/admin/parts";
import { AdminSkeleton } from "@/components/admin/Skeleton";
import { DbSection } from "@/components/db/DbSection";
import { requireAdmin } from "@/lib/server/admin";
import { getNews } from "@/lib/server/news";

export const metadata = { title: "브리핑 편집" };

export default function EditNewsPage({ params }: PageProps<"/admin/news/[id]">) {
  return (
    <DbSection noticeTitle="DB가 연결되지 않았어요 (DATABASE_URL 확인)">
      <Suspense fallback={<AdminSkeleton />}>{params.then(({ id }) => <EditNews rawId={id} />)}</Suspense>
    </DbSection>
  );
}

async function EditNews({ rawId }: { rawId: string }) {
  await requireAdmin();
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const n = await getNews(id, { admin: true });
  if (!n) notFound();
  return (
    <>
      <Link href={`/admin/news?date=${n.editionDate}&filter=all`} className="link inline-flex items-center gap-1 type-caption">
        <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
        데일리 브리핑 목록
      </Link>
      <AdminPageTitle title="브리핑 편집" desc={n.origin === "auto" ? "자동 점검이 만든 초안이에요. 원문을 확인하고 다듬어서 공개해 주세요." : undefined} />
      <NewsForm
        key={n.updatedAt}
        initial={{
          id: n.id,
          editionDate: n.editionDate,
          edition: n.edition,
          section: n.section,
          title: n.title,
          summary: n.summary,
          point: n.point,
          body: n.body,
          sourceName: n.sourceName,
          sourceUrl: n.sourceUrl ?? "",
          imageUrl: n.imageUrl ?? "",
          imageCredit: n.imageCredit,
          headline: n.headline,
          published: n.status === 1,
        }}
      />
    </>
  );
}
