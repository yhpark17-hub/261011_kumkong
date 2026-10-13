import Link from "next/link";
import { adminLogout } from "@/app/admin/actions";
import { openFeedbackCount } from "@/lib/server/feedback";
import { isAdmin } from "@/lib/server/security";
import { cn } from "../ui";
import { AdminBadge } from "./parts";

/** 운영자로 로그인했을 때만 보이는 얇은 띠 */
export async function AdminBar({ className }: { className?: string }) {
  if (!(await isAdmin())) return null;
  const newFeedback = await openFeedbackCount();
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg bg-brand-dark px-4 py-3 type-caption text-on-primary",
        className,
      )}
    >
      <AdminBadge className="bg-[#ffffff] !text-brand-dark" />
      <span>운영자로 로그인 중이에요. 지금 쓰는 글·댓글은 운영자로 표시됩니다.</span>
      <span className="ml-auto flex items-center gap-3">
        {newFeedback > 0 && (
          <Link href="/admin/feedback" className="tag bg-ruby tabular text-on-primary">
            새 제보 {newFeedback}
          </Link>
        )}
        <Link href="/admin" className="underline underline-offset-2">
          관리 페이지
        </Link>
        <form action={adminLogout}>
          <button type="submit" className="underline underline-offset-2">
            로그아웃
          </button>
        </form>
      </span>
    </div>
  );
}
