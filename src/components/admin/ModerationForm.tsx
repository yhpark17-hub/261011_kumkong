"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { moderateMany } from "@/app/admin/actions";

/**
 * 확인 창 — 브라우저 기본 confirm() 대신 화면 안에 그립니다.
 * (앱 안 브라우저·일부 모바일 브라우저는 confirm 창을 막아서 버튼이 아무 반응 없이 멈춤)
 *
 * data-confirm 이 있는 제출 버튼을 누르면 창을 띄우고, '확인'을 누르면 같은 버튼 값으로 다시 제출해요.
 */
function useSubmitConfirm() {
  const [ask, setAsk] = useState<{ message: string; name: string; value: string; notice?: boolean } | null>(null);
  const okRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!ask) return;
    okRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setAsk(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ask]);

  /** onSubmit 에서 먼저 부름 — 막아야 하면 false */
  const guard = (e: FormEvent<HTMLFormElement>, check?: (submitter: HTMLButtonElement | null) => string | null): boolean => {
    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    if (submitter?.dataset.confirmed === "1") return true;
    const problem = check?.(submitter);
    if (problem) {
      e.preventDefault();
      setAsk({ message: problem, name: "", value: "", notice: true });
      return false;
    }
    const message = submitter?.dataset.confirm;
    if (message) {
      e.preventDefault();
      setAsk({ message, name: submitter?.name ?? "", value: submitter?.value ?? "" });
      return false;
    }
    return true;
  };

  const dialog = ask ? (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="확인"
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/35 p-4 sm:items-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) setAsk(null);
      }}
    >
      <div className="w-full max-w-sm rounded-2xl bg-canvas p-5 shadow-level-3">
        <p className="type-body-md leading-relaxed text-ink [word-break:keep-all]">{ask.message}</p>
        <div className="mt-5 flex justify-end gap-2">
          {ask.notice ? (
            <button ref={okRef} type="button" className="btn btn-sm btn-primary" onClick={() => setAsk(null)}>
              알겠어요
            </button>
          ) : (
            <>
              <button type="button" className="btn btn-sm btn-toggle" onClick={() => setAsk(null)}>
                취소
              </button>
              <button
                ref={okRef}
                type="submit"
                name={ask.name || undefined}
                value={ask.value || undefined}
                data-confirmed="1"
                className="btn btn-sm btn-primary"
                onClick={() => window.setTimeout(() => setAsk(null), 0)}
              >
                확인
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  ) : null;

  return { guard, dialog };
}

/** 일괄 버튼은 하나라도 골라야 */
const needSelection = (form: HTMLFormElement | null) => (submitter: HTMLButtonElement | null) =>
  submitter?.name === "bulk" && ![...(form?.querySelectorAll<HTMLInputElement>('input[name="ids"]') ?? [])].some((b) => b.checked)
    ? "먼저 항목을 선택해 주세요."
    : null;

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
  const { guard, dialog } = useSubmitConfirm();

  return (
    <form ref={formRef} action={moderateMany} onSubmit={(e) => guard(e, needSelection(formRef.current))}>
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
      {dialog}
    </form>
  );
}

/** 한 줄 선택 체크박스 */
export function RowCheck({ id }: { id: number }) {
  return <input type="checkbox" name="ids" value={id} className="mt-1 h-4 w-4 shrink-0 accent-[#533afd]" aria-label={`${id}번 선택`} />;
}

/** data-confirm 버튼을 확인 창으로 거르는 일반 폼 (매거진·제안·브리핑 발행 등) */
export function ConfirmForm({
  action,
  children,
  className,
}: {
  action: (fd: FormData) => Promise<void>;
  children: ReactNode;
  className?: string;
}) {
  const { guard, dialog } = useSubmitConfirm();
  return (
    <form action={action} className={className} onSubmit={(e) => guard(e)}>
      {children}
      {dialog}
    </form>
  );
}

/** 체크박스로 여러 개 골라 한 번에 처리하는 일반 폼 (name="ids" 체크박스 + name="bulk" 버튼) */
export function BulkForm({
  action,
  toolbar,
  children,
}: {
  action: (fd: FormData) => Promise<void>;
  toolbar: ReactNode;
  children: ReactNode;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const boxes = () => [...(formRef.current?.querySelectorAll<HTMLInputElement>('input[name="ids"]') ?? [])];
  const { guard, dialog } = useSubmitConfirm();
  return (
    <form ref={formRef} action={action} onSubmit={(e) => guard(e, needSelection(formRef.current))}>
      <div className="no-scrollbar fade-x -mx-4 flex items-center gap-2 overflow-x-auto border-b border-hairline px-4 pb-3 md:mx-0 md:px-0 md:fade-x-none">
        <label className="inline-flex shrink-0 items-center gap-2 type-caption text-ink-secondary">
          <input
            type="checkbox"
            className="h-4 w-4 accent-[#533afd]"
            onChange={(e) => boxes().forEach((b) => (b.checked = e.target.checked))}
            aria-label="모두 선택"
          />
          모두 선택
        </label>
        <span className="mx-1 h-4 w-px shrink-0 bg-hairline" />
        {toolbar}
      </div>
      {children}
      {dialog}
    </form>
  );
}
