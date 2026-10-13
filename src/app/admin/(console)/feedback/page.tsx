import Link from "next/link";
import { Suspense } from "react";
import { AdminCard, AdminPageTitle } from "@/components/admin/parts";
import { AdminSkeleton } from "@/components/admin/Skeleton";
import { DbSection } from "@/components/db/DbSection";
import { FeedbackInbox } from "@/components/feedback/FeedbackInbox";
import { cn } from "@/components/ui";
import { FEEDBACK_KINDS, isFeedbackKind } from "@/lib/feedback-meta";
import { requireAdmin } from "@/lib/server/admin";
import { listFeedback } from "@/lib/server/feedback";

export const metadata = { title: "제보·의견" };

export default function FeedbackPage({ searchParams }: PageProps<"/admin/feedback">) {
  return (
    <DbSection noticeTitle="DB가 연결되지 않았어요 (DATABASE_URL 확인)">
      <Suspense fallback={<AdminSkeleton />}>
        {searchParams.then((sp) => (
          <Inbox tab={sp.tab === "done" ? "done" : "open"} kind={typeof sp.kind === "string" && isFeedbackKind(sp.kind) ? sp.kind : null} />
        ))}
      </Suspense>
    </DbSection>
  );
}

async function Inbox({ tab, kind }: { tab: "open" | "done"; kind: keyof typeof FEEDBACK_KINDS | null }) {
  await requireAdmin();
  const { open, done } = await listFeedback(100);
  const list = (tab === "open" ? open : done).filter((f) => !kind || f.kind === kind);
  const href = (t: string, k: string | null) => {
    const u = new URLSearchParams();
    if (t === "done") u.set("tab", "done");
    if (k) u.set("kind", k);
    const q = u.toString();
    return q ? `/admin/feedback?${q}` : "/admin/feedback";
  };

  return (
    <>
      <AdminPageTitle
        title="제보·의견"
        desc="기관 정보 제보, 공고 제보, 사이트 의견이 모여요. '처리 완료'를 누르면 답변용 이메일은 지워져요."
      />
      <div className="flex flex-wrap gap-2">
        <Link href={href("open", kind)} className={cn("btn btn-sm", tab === "open" ? "btn-on-dark" : "btn-toggle")}>
          처리할 것 <span className="tabular opacity-60">{open.length}</span>
        </Link>
        <Link href={href("done", kind)} className={cn("btn btn-sm", tab === "done" ? "btn-on-dark" : "btn-toggle")}>
          처리 완료
        </Link>
        <span className="mx-1 w-px self-stretch bg-hairline" />
        <Link href={href(tab, null)} className={cn("btn btn-sm", !kind ? "btn-on-dark" : "btn-toggle")}>
          전체 종류
        </Link>
        {(Object.keys(FEEDBACK_KINDS) as (keyof typeof FEEDBACK_KINDS)[]).map((k) => (
          <Link key={k} href={href(tab, k)} className={cn("btn btn-sm", kind === k ? "btn-on-dark" : "btn-toggle")}>
            {FEEDBACK_KINDS[k].label}
          </Link>
        ))}
      </div>
      <AdminCard>
        <FeedbackInbox items={list} done={tab === "done"} />
      </AdminCard>
    </>
  );
}
