"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { CalendarCheck, Lock, X } from "lucide-react";

/* ------------------------------------------------------------------ */
/* 시험별 '응시했나요?' 답 — 브라우저(localStorage)에만 저장               */
/* ------------------------------------------------------------------ */

type Decision = "yes" | "no";
const key = (examId: string) => `kumkong:attend:${examId}`;
const listeners = new Set<() => void>();
/** localStorage 를 못 쓰는 환경용 메모리 사본 */
const memory = new Map<string, Decision>();

function readDecision(examId: string): Decision | null {
  try {
    const v = window.localStorage.getItem(key(examId));
    if (v === "yes" || v === "no") return v;
  } catch {
    /* 저장소 사용 불가 */
  }
  return memory.get(examId) ?? null;
}

function writeDecision(examId: string, v: Decision) {
  memory.set(examId, v);
  try {
    window.localStorage.setItem(key(examId), v);
  } catch {
    /* 메모리 사본으로만 유지 */
  }
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

function scrollToForm() {
  requestAnimationFrame(() =>
    document.getElementById("review-form")?.scrollIntoView({ behavior: "smooth", block: "start" }),
  );
}

/**
 * 후기 폼 앞에 '#월 #일 시험에 응시하셨나요?'를 한 번 묻습니다.
 * - 응시: 폼으로 안내 → 남기면 상세 결과가 바로 열림
 * - 미응시: 폼을 접고, 상세 결과는 공개일(시험 후 3일)에 열린다고 안내
 * 실제 응시자가 '결과만 빨리 보려고' 미응시를 누르면 오히려 3일을 기다려야 하므로
 * 정직하게 답하는 쪽이 가장 빠르도록 설계했습니다.
 */
export function AttendGate({
  examId,
  question,
  hasVoted,
  inWindow,
  publicFromLabel,
  askPopup,
  children,
}: {
  examId: string;
  /** 예: "10월 10일(토) 중소벤처기업진흥공단 필기시험" */
  question: string;
  hasVoted: boolean;
  /** 응시자 우선 공개 기간인지 */
  inWindow: boolean;
  publicFromLabel: string;
  /** 시험 직후 기간에만 팝업으로 묻습니다 */
  askPopup: boolean;
  children: React.ReactNode;
}) {
  // 서버 렌더링 때는 'ssr' — 폼을 그대로 그리고, 브라우저에서 실제 답으로 바뀝니다
  const decision = useSyncExternalStore(subscribe, () => readDecision(examId), () => "ssr" as const);
  const [dismissed, setDismissed] = useState(false);
  const close = useCallback(() => setDismissed(true), []);

  if (hasVoted || decision === "ssr") return <>{children}</>;

  if (decision === "no") {
    return (
      <div>
        <p className="flex items-center gap-2 type-body-lg !font-normal text-ink">
          <CalendarCheck className="h-5 w-5 text-ink-mute" strokeWidth={1.75} />
          응시하지 않은 시험으로 표시했어요
        </p>
        <p className="mt-2 type-body-md text-ink-secondary">
          {inWindow ? (
            <>
              상세 결과는 <span className="text-ink">{publicFromLabel}</span>부터 누구나 볼 수 있어요.
            </>
          ) : (
            "응시자들이 남긴 결과를 확인해 보세요."
          )}
        </p>
        <button
          type="button"
          onClick={() => {
            writeDecision(examId, "yes");
            scrollToForm();
          }}
          className="btn btn-toggle btn-sm mt-4"
        >
          사실 응시했어요 · 후기 남기기
        </button>
      </div>
    );
  }

  return (
    <>
      {children}
      {decision === null && askPopup && !dismissed && (
        <AttendDialog
          question={question}
          inWindow={inWindow}
          publicFromLabel={publicFromLabel}
          onAnswer={(v) => {
            writeDecision(examId, v);
            if (v === "yes") scrollToForm();
          }}
          onClose={close}
        />
      )}
    </>
  );
}

function AttendDialog({
  question,
  inWindow,
  publicFromLabel,
  onAnswer,
  onClose,
}: {
  question: string;
  inWindow: boolean;
  publicFromLabel: string;
  onAnswer: (v: Decision) => void;
  onClose: () => void;
}) {
  const yesRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    yesRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  // sticky 카드 안에 갇히지 않도록 body 로 띄웁니다
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center" role="dialog" aria-modal="true" aria-labelledby="attend-title">
      <button type="button" aria-label="닫기" onClick={onClose} className="animate-fade-in absolute inset-0 bg-brand-dark/40" />
      <div className="animate-drawer-up relative w-full max-w-md rounded-t-xl bg-canvas p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-level-2 md:rounded-xl">
        <button
          type="button"
          onClick={onClose}
          className="btn btn-icon absolute top-3 right-3 text-ink-mute hover:bg-canvas-soft hover:text-ink"
          aria-label="닫기"
        >
          <X className="h-5 w-5" strokeWidth={1.75} />
        </button>
        <p className="type-micro-cap text-primary-text">응시 확인</p>
        <h2 id="attend-title" className="mt-2 pr-8 type-heading-md text-ink">
          {question}에 응시하셨나요?
        </h2>

        {inWindow && (
          <p className="mt-4 flex gap-2 rounded-lg bg-canvas-soft p-3 type-caption text-ink-secondary">
            <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-mute" strokeWidth={2} />
            <span>
              시험 후 3일간 상세 결과는 <span className="text-ink">후기를 남긴 응시자에게 먼저</span> 공개돼요. 응시하지
              않았다면 <span className="text-ink">{publicFromLabel}</span>부터 누구나 볼 수 있어요.
            </span>
          </p>
        )}

        <div className="mt-5 space-y-2">
          <button ref={yesRef} type="button" onClick={() => onAnswer("yes")} className="btn btn-primary w-full">
            네, 응시했어요 {inWindow ? "· 30초 후기 남기고 바로 보기" : "· 30초 후기 남기기"}
          </button>
          <button type="button" onClick={() => onAnswer("no")} className="btn btn-toggle w-full">
            아니요, 응시하지 않았어요
          </button>
        </div>
        <p className="mt-3 text-center type-micro text-ink-mute">필수 질문은 2개뿐이고, 응답은 익명으로 집계돼요.</p>
      </div>
    </div>,
    document.body,
  );
}
