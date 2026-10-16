import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { IssueForm } from "@/components/admin/IssueForm";
import { AdminPageTitle } from "@/components/admin/parts";
import { AdminSkeleton } from "@/components/admin/Skeleton";
import { DbSection } from "@/components/db/DbSection";
import { todayKST } from "@/lib/date";
import { requireAdmin } from "@/lib/server/admin";

export const metadata = { title: "브리핑 만들기" };

export default function NewIssuePage() {
  return (
    <DbSection noticeTitle="DB가 연결되지 않았어요 (DATABASE_URL 확인)">
      <Suspense fallback={<AdminSkeleton />}>
        <NewIssue />
      </Suspense>
    </DbSection>
  );
}

async function NewIssue() {
  await requireAdmin();
  return (
    <>
      <Link href="/admin/news" className="link inline-flex items-center gap-1 type-caption">
        <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
        데일리 브리핑
      </Link>
      <AdminPageTitle title="브리핑 만들기" desc="평소에는 자동 점검이 아침 6시(아침판)·낮 12시 30분(금콩 스터디)에 초안을 만들어요. 직접 낼 때만 여기서 만드세요. 같은 날짜·판의 기사가 이 브리핑에 묶여요." />
      <IssueForm initial={{ id: null, date: todayKST(), edition: "morning", title: "", lede: "", closing: "", quiz: [], extras: { numbers: [], essay: null } }} />
    </>
  );
}
