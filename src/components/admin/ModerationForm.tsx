"use client";

import { useRef, type ReactNode } from "react";
import { moderateMany } from "@/app/admin/actions";

/**
 * 콘텐츠 목록 전체를 감싸는 폼.
 * - 한 줄 버튼(name="target") 또는 선택 후 일괄 버튼(name="bulk")으로 moderateMany 실행
 * - data-confirm 이 있는 버튼은 확인 창을 거침, 일괄 버튼은 선택이 없으면 막음
 */
export function ModerationForm({
  type,
  toolbar,
  children,
}: {
  type: "post" | "comment" | "review";
  /** 목록 위 일괄 조치 버튼들 */
  toolbar: ReactNode;
  children: ReactNode;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const boxes = () => [...(formRef.current?.querySelectorAll<HTMLInputElement>('input[name="ids"]') ?? [])];

  return (
    <form
      ref={formRef}
      action={moderateMany}
      onSubmit={(e) => {
        const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
        if (submitter?.name === "bulk" && !boxes().some((b) => b.checked)) {
          e.preventDefault();
          window.alert("먼저 항목을 선택해 주세요.");
          return;
        }
        const message = submitter?.dataset.confirm;
        if (message && !window.confirm(message)) e.preventDefault();
      }}
    >
      <input type="hidden" name="type" value={type} />
      <div className="no-scrollbar fade-x -mx-4 flex items-center gap-2 overflow-x-auto border-b border-hairline px-4 pb-3 md:mx-0 md:px-0 md:fade-x-none">
        <label className="inline-flex shrink-0 items-center gap-2 type-caption text-ink-secondary">
          <input
            type="checkbox"
            className="h-4 w-4 accent-[#533afd]"
            onChange={(e) => boxes().forEach((b) => (b.checked = e.target.checked))}
            aria-label="이 페이지 모두 선택"
          />
          모두 선택
        </label>
        <span className="mx-1 h-4 w-px shrink-0 bg-hairline" />
        {toolbar}
      </div>
      {children}
    </form>
  );
}

/** 한 줄 선택 체크박스 */
export function RowCheck({ id }: { id: number }) {
  return <input type="checkbox" name="ids" value={id} className="mt-1 h-4 w-4 shrink-0 accent-[#533afd]" aria-label={`${id}번 선택`} />;
}

/** data-confirm 버튼을 확인 창으로 거르는 일반 폼 (매거진·제안 목록 등) */
export function ConfirmForm({
  action,
  children,
  className,
}: {
  action: (fd: FormData) => Promise<void>;
  children: ReactNode;
  className?: string;
}) {
  return (
    <form
      action={action}
      className={className}
      onSubmit={(e) => {
        const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
        const message = submitter?.dataset.confirm;
        if (message && !window.confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </form>
  );
}
