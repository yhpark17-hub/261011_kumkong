import { moderate } from "@/app/admin/actions";
import { cn } from "../ui";

type Op = "hide" | "show" | "delete" | "pin" | "unpin" | "clearReports";

/** 운영자 전용 버튼 묶음 (서버 액션 form) */
export function ModerationBar({
  type,
  id,
  status,
  isNotice,
  reports,
  compact = false,
  returnTo,
  className,
}: {
  type: "post" | "comment" | "review";
  id: number;
  status: number;
  isNotice?: boolean;
  reports?: number;
  compact?: boolean;
  /** 삭제 후 이동할 경로 (글 화면에서 그 글을 지울 때) */
  returnTo?: string;
  className?: string;
}) {
  const ops: { op: Op; label: string }[] = [
    status === 0 ? { op: "hide", label: "숨김" } : { op: "show", label: "복구" },
    ...(type === "post" ? [isNotice ? { op: "unpin" as const, label: "공지 해제" } : { op: "pin" as const, label: "공지 고정" }] : []),
    ...(reports ? [{ op: "clearReports" as const, label: `신고 ${reports}건 초기화` }] : []),
    { op: "delete", label: "삭제" },
  ];
  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {!compact && <span className="mr-1 type-micro-cap text-ink-mute">운영자</span>}
      {ops.map(({ op, label }) => (
        <form key={op} action={moderate}>
          <input type="hidden" name="type" value={type} />
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="op" value={op} />
          {op === "delete" && returnTo && <input type="hidden" name="returnTo" value={returnTo} />}
          <button
            type="submit"
            className={cn(
              "rounded-full border px-2.5 py-1 type-micro",
              op === "delete" ? "border-ruby text-ruby" : "border-hairline text-ink-secondary hover:border-hairline-input",
            )}
          >
            {label}
          </button>
        </form>
      ))}
    </div>
  );
}
