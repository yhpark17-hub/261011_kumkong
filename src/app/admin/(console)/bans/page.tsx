import Link from "next/link";
import { Suspense } from "react";
import { unban } from "../../actions";
import { AdminCard, AdminPageTitle, EmptyRow, listHref } from "@/components/admin/parts";
import { AdminSkeleton } from "@/components/admin/Skeleton";
import { DbSection } from "@/components/db/DbSection";
import { formatPostDateTime } from "@/lib/board-meta";
import { listBans, requireAdmin } from "@/lib/server/admin";

export const metadata = { title: "차단 목록" };

export default function BansPage() {
  return (
    <DbSection noticeTitle="DB가 연결되지 않았어요 (DATABASE_URL 확인)">
      <Suspense fallback={<AdminSkeleton />}>
        <Bans />
      </Suspense>
    </DbSection>
  );
}

async function Bans() {
  await requireAdmin();
  const bans = await listBans();
  return (
    <>
      <AdminPageTitle
        title="차단 목록"
        desc="차단된 작성자는 글·댓글·필기 후기·신고를 할 수 없어요. '의견 보내기'로 문의는 할 수 있어요. 같은 네트워크(같은 IP)를 쓰는 다른 사람도 함께 막힐 수 있으니 신중하게 써 주세요."
      />
      <AdminCard>
        {bans.length === 0 ? (
          <EmptyRow>차단한 작성자가 없어요. 콘텐츠 목록에서 &lsquo;작성자 차단&rsquo;으로 추가할 수 있어요.</EmptyRow>
        ) : (
          <ul className="divide-y divide-hairline">
            {bans.map((b) => (
              <li key={b.ipHash} className="flex flex-wrap items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate type-body-md text-ink">{b.sample ? `“${b.sample}”` : "(예시 없음)"}</p>
                  <p className="mt-1 flex flex-wrap gap-x-3 type-micro text-ink-mute">
                    <span className="tabular">{formatPostDateTime(b.createdAt)} 차단</span>
                    {b.reason && <span>{b.reason}</span>}
                    <Link href={listHref("/admin/posts", { ip: b.ipHash })} className="link">
                      글 {b.posts}
                    </Link>
                    <Link href={listHref("/admin/comments", { ip: b.ipHash })} className="link">
                      댓글 {b.comments}
                    </Link>
                    <span className="font-mono">#{b.ipHash.slice(0, 8)}</span>
                  </p>
                </div>
                <form action={unban}>
                  <input type="hidden" name="ipHash" value={b.ipHash} />
                  <button type="submit" className="btn btn-sm btn-toggle">
                    차단 해제
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </AdminCard>
    </>
  );
}
