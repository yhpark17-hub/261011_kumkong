"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "./ui";

/**
 * 아래에서 올라오는 목록 창 (휴대폰) · 가운데 창 (넓은 화면)
 * 배경을 누르거나 X·Esc 로 닫혀요. 열려 있는 동안 뒤 화면은 스크롤되지 않아요.
 */
export function Sheet({
  open,
  onClose,
  title,
  aside,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  /** 제목 옆 (예: 앞뒤 날짜 화살표) */
  aside?: ReactNode;
  children: ReactNode;
}) {
  const closeBtn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeBtn.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center md:p-6" role="dialog" aria-modal="true">
      <button type="button" aria-label="닫기" onClick={onClose} className="animate-fade-in absolute inset-0 bg-brand-dark/45" />
      <div
        className={cn(
          "relative flex max-h-[82vh] w-full flex-col bg-canvas shadow-level-2",
          "rounded-t-2xl pb-[env(safe-area-inset-bottom)] motion-safe:animate-[kk-sheet-up_.22s_ease-out]",
          "md:max-w-lg md:rounded-2xl md:pb-0 md:motion-safe:animate-[kk-fade-in_.2s_ease-out]",
        )}
      >
        {/* 휴대폰: 끌어내리는 손잡이 모양 (장식) */}
        <span aria-hidden className="mx-auto mt-2 h-1 w-10 rounded-full bg-hairline-input md:hidden" />
        <header className="flex items-center gap-2 border-b border-hairline px-5 pt-3 pb-3 md:pt-4">
          <h3 className="min-w-0 flex-1 truncate type-heading-sm text-ink">{title}</h3>
          {aside}
          <button ref={closeBtn} type="button" onClick={onClose} aria-label="닫기" className="btn btn-icon -mr-2 text-ink-mute hover:bg-canvas-soft hover:text-ink">
            <X className="h-5 w-5" strokeWidth={1.75} />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-2">{children}</div>
      </div>
    </div>
  );
}
