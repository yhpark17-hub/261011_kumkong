import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { NewsForm } from "@/components/admin/NewsForm";
import { AdminPageTitle } from "@/components/admin/parts";
import { AdminSkeleton } from "@/components/admin/Skeleton";
import { DbSection } from "@/components/db/DbSection";
import { todayKST } from "@/lib/date";
import { editionNow } from "@/lib/news-meta";
import { requireAdmin } from "@/lib/server/admin";

export const metadata = { title: "브리핑 쓰기" };

export default function NewNewsPage() {
  return (
    <DbSection noticeTitle="DB가 연결되지 않았어요 (DATABASE_URL 확인)">
      <Suspense fallback={<AdminSkeleton />}>
        <NewNews />
      </Suspense>
    </DbSection>
  );
}

async function NewNews() {
  await requireAdmin();
  return (
    <>
      <Link href="/admin/news" className="link inline-flex items-center gap-1 type-caption">
        <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
        데일리 브리핑 목록
      </Link>
      <AdminPageTitle title="브리핑 쓰기" desc="뉴스는 원문을 확인한 것만 요약해 주세요. 카테고리를 고르면 브리핑 화면에서 그 칸에 모여요." />
      <NewsForm
        initial={{ id: null, editionDate: todayKST(), edition: editionNow(), section: "finance", title: "", summary: "", point: "", body: "", sourceName: "", sourceUrl: "", tier: "key", position: 0, takeaway: "", imageUrl: "", imageCredit: "", headline: false, published: false }}
      />
    </>
  );
}
