import { Wrench } from "lucide-react";
import { dbConfigured } from "@/lib/server/db";
import { DbBoundary } from "./DbBoundary";

/** DB 가 아직 연결되지 않았을 때 보여 주는 안내 */
export function DbNotice({ title = "게시판·필기 후기를 준비하고 있어요" }: { title?: string }) {
  return (
    <div className="flex flex-col items-center rounded-lg border border-hairline bg-canvas-soft px-6 py-10 text-center">
      <Wrench className="h-6 w-6 text-ink-mute" strokeWidth={1.5} />
      <p className="mt-3 type-body-lg !font-normal text-ink">{title}</p>
      <p className="mt-1 type-caption text-ink-mute">곧 열릴 예정이에요. 채용 달력과 기관 정보는 지금 바로 이용할 수 있어요.</p>
    </div>
  );
}

/**
 * 게시판·후기 DB 를 쓰는 영역을 감쌉니다.
 * - DB 미설정(예: Vercel 에 DATABASE_URL 없음): 안내 문구로 대신
 * - 실행 중 DB 오류: 이 영역만 '다시 시도' 화면으로 바꾸고 나머지 페이지는 그대로
 * silent 이면 두 경우 모두 아무것도 그리지 않습니다 (운영자 띠 같은 부가 요소용).
 */
export function DbSection({
  children,
  silent = false,
  noticeTitle,
}: {
  children: React.ReactNode;
  silent?: boolean;
  noticeTitle?: string;
}) {
  if (!dbConfigured()) return silent ? null : <DbNotice title={noticeTitle} />;
  return <DbBoundary silent={silent}>{children}</DbBoundary>;
}
