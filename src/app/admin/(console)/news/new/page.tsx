import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { NewsForm } from "@/components/admin/NewsForm";
import { AdminPageTitle } from "@/components/admin/parts";
import { AdminSkeleton } from "@/components/admin/Skeleton";
import { DbSection } from "@/components/db/DbSection";
import { todayKST } from "@/lib/date";
import { requireAdmin } from "@/lib/server/admin";

export const metadata = { title: "뉴스 쓰기" };

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
      <AdminPageTitle title="뉴스 쓰기" desc="원문을 확인한 뉴스만 요약해 주세요. 분야를 고르면 브리핑 화면에서 그 분야 아래에 모여요." />
      <NewsForm
        initial={{ id: null, editionDate: todayKST(), section: "finance", title: "", summary: "", point: "", body: "", sourceName: "", sourceUrl: "", headline: false, published: false }}
      />
    </>
  );
}
