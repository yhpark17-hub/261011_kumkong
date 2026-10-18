"use client";

import { useActionState, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, MessageSquarePlus, X } from "lucide-react";
import { submitFeedback, type FeedbackState } from "@/app/feedback/actions";
import { MAX_FEEDBACK_ATTACHMENTS } from "@/lib/attachments";
import { FEEDBACK_KINDS, FEEDBACK_LIMITS, type FeedbackKind } from "@/lib/feedback-meta";
import { AttachmentPicker } from "../board/AttachmentPicker";
import { cn } from "../ui";

/* ------------------------------------------------------------------ */
/* 어느 버튼에서든 같은 팝업을 열 수 있게 하는 작은 전역 상태             */
/* ------------------------------------------------------------------ */

export interface FeedbackTarget {
  kind: FeedbackKind;
  companyId?: string;
  companyName?: string;
}

let current: (FeedbackTarget & { key: number }) | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function openFeedback(target: FeedbackTarget) {
  current = { ...target, key: Date.now() };
  emit();
}

function closeFeedback() {
  current = null;
  emit();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/** 레이아웃에 한 번만 둡니다 — 열린 제보 팝업을 그립니다 */
export function FeedbackHost() {
  const target = useSyncExternalStore(subscribe, () => current, () => null);
  return target ? <FeedbackDialog key={target.key} target={target} onClose={closeFeedback} /> : null;
}

/** 제보 팝업을 여는 버튼 (서버 컴포넌트 안에서도 사용 가능) */
export function FeedbackButton({
  kind,
  companyId,
  companyName,
  className,
  onOpen,
  children,
}: FeedbackTarget & { className?: string; onOpen?: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        onOpen?.();
        openFeedback({ kind, companyId, companyName });
      }}
    >
      {children}
    </button>
  );
}

/** 화면 오른쪽 아래 '의견 보내기' */
export function FeedbackFab() {
  return (
    <FeedbackButton
      kind="site"
      className="fixed right-6 bottom-6 z-40 hidden h-11 items-center gap-2 rounded-full border border-hairline bg-canvas px-4 type-button-sm text-ink-secondary shadow-level-2 transition-colors hover:text-primary-text md:inline-flex"
    >
      <MessageSquarePlus className="h-4 w-4" strokeWidth={1.75} />
      의견 보내기
    </FeedbackButton>
  );
}

/* ------------------------------------------------------------------ */
/* 팝업                                                                 */
/* ------------------------------------------------------------------ */

function FeedbackDialog({ target, onClose }: { target: FeedbackTarget; onClose: () => void }) {
  const meta = FEEDBACK_KINDS[target.kind];
  // 배포 직후 오래된 화면이거나 네트워크가 끊겨도 조용히 실패하지 않게 감쌉니다
  const [state, action, pending] = useActionState<FeedbackState, FormData>(async (prev, fd) => {
    try {
      return await submitFeedback(prev, fd);
    } catch {
      return { ok: false, error: "보내지 못했어요. 페이지를 새로고침한 뒤 다시 보내 주세요." };
    }
  }, { ok: false });
  const [topic, setTopic] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const [uploading, setUploading] = useState(false);
  // 어느 화면에서 보냈는지 함께 기록 (팝업은 클릭 뒤에만 그려지므로 window 사용 가능)
  const [page] = useState(() => `${window.location.pathname}${window.location.search}`.slice(0, 200));
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    bodyRef.current?.focus();
    // 기관 상세 패널 위에 떠 있을 때 Esc 가 패널까지 닫지 않도록 먼저 가로챕니다
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      onClose();
    };
    window.addEventListener("keydown", onKey, true);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey, true);
    };
  }, [onClose]);

  const title = target.kind === "correction" && target.companyName ? `${target.companyName} 정보 제보` : meta.title;

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center md:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="feedback-title"
    >
      <button type="button" aria-label="닫기" onClick={onClose} className="animate-fade-in absolute inset-0 bg-brand-dark/40" />
      <div className="animate-drawer-up relative flex max-h-[92dvh] w-full max-w-lg flex-col rounded-t-xl bg-canvas shadow-level-2 md:rounded-xl">
        <div className="flex items-start gap-3 border-b border-hairline px-6 pt-5 pb-4">
          <div className="min-w-0 flex-1">
            <p className="type-micro-cap text-primary-text">{meta.eyebrow}</p>
            <h2 id="feedback-title" className="mt-1 type-heading-md text-ink">
              {title}
            </h2>
            <p className="mt-1 type-caption text-ink-mute">{meta.desc}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-icon -mr-2 shrink-0 text-ink-mute hover:bg-canvas-soft hover:text-ink"
            aria-label="닫기"
          >
            <X className="h-5 w-5" strokeWidth={1.75} />
          </button>
        </div>

        {state.ok ? (
          <div className="flex flex-col items-center px-6 py-12 text-center">
            <CheckCircle2 className="h-10 w-10 text-ev-final" strokeWidth={1.5} />
            <p className="mt-4 type-heading-sm text-ink">운영자에게 전달됐어요</p>
            <p className="mt-2 max-w-xs type-body-md text-ink-secondary">
              {target.kind === "site"
                ? "보내 주신 의견은 하나하나 읽고 반영할게요. 고마워요!"
                : "확인한 뒤 사이트에 반영할게요. 알려 주셔서 고마워요!"}
            </p>
            <button type="button" onClick={onClose} className="btn btn-primary mt-6 min-w-32">
              닫기
            </button>
          </div>
        ) : (
          <form action={action} noValidate className="flex min-h-0 flex-1 flex-col">
            <div className="space-y-5 overflow-y-auto overscroll-contain px-6 py-5">
              <input type="hidden" name="kind" value={target.kind} />
              <input type="hidden" name="page" value={page} />
              {target.companyId && <input type="hidden" name="companyId" value={target.companyId} />}
              {topic && <input type="hidden" name="topic" value={topic} />}
              <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />

              {target.kind === "posting" && (
                <label className="block">
                  <span className="mb-1 block type-caption text-ink-secondary">
                    기관명 <span className="text-ruby">필수</span>
                  </span>
                  <input
                    name="companyName"
                    required
                    maxLength={FEEDBACK_LIMITS.companyName}
                    defaultValue={target.companyName ?? ""}
                    placeholder="예: 한국주택금융공사"
                    className="input w-full"
                  />
                </label>
              )}

              <fieldset>
                <legend className="mb-2 type-caption text-ink-secondary">어떤 내용인가요? (선택)</legend>
                <div className="flex flex-wrap gap-1.5">
                  {meta.topics.map((t) => (
                    <button
                      key={t}
                      type="button"
                      aria-pressed={topic === t}
                      onClick={() => setTopic(topic === t ? null : t)}
                      className={cn(
                        "rounded-full border px-3 py-1.5 type-caption transition-colors",
                        topic === t
                          ? "border-brand-dark bg-brand-dark text-on-primary"
                          : "border-hairline text-ink-secondary hover:border-hairline-input",
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </fieldset>

              <label className="block">
                <span className="mb-1 flex justify-between type-caption text-ink-secondary">
                  <span>
                    내용 <span className="text-ruby">필수</span>
                  </span>
                  <span className="tabular text-ink-mute">
                    {body.length}/{FEEDBACK_LIMITS.body}
                  </span>
                </span>
                <textarea
                  ref={bodyRef}
                  name="body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  maxLength={FEEDBACK_LIMITS.body}
                  rows={7}
                  placeholder={meta.placeholder}
                  className="input w-full resize-y leading-relaxed"
                />
              </label>

              {body.trim().length > 0 && body.trim().length < FEEDBACK_LIMITS.minBody && (
                <p className="-mt-3 type-micro text-ink-mute">
                  {FEEDBACK_LIMITS.minBody}자 이상 적으면 보낼 수 있어요 (지금 {body.trim().length}자)
                </p>
              )}

              <div>
                <span className="mb-1.5 block type-caption text-ink-secondary">사진·파일 (선택) — 화면 캡처가 있으면 이해가 빨라요</span>
                <AttachmentPicker max={MAX_FEEDBACK_ATTACHMENTS} onBusyChange={setUploading} />
              </div>

              {meta.askSource && (
                <label className="block">
                  <span className="mb-1 block type-caption text-ink-secondary">근거 링크 (선택)</span>
                  <input
                    name="sourceUrl"
                    type="text"
                    inputMode="url"
                    autoCapitalize="off"
                    maxLength={FEEDBACK_LIMITS.source}
                    placeholder="공고문·기사 주소가 있으면 확인이 빨라요"
                    className="input w-full"
                  />
                </label>
              )}

              <label className="block">
                <span className="mb-1 block type-caption text-ink-secondary">답변 받을 이메일 (선택)</span>
                <input
                  name="contact"
                  type="text"
                  inputMode="email"
                  autoCapitalize="off"
                  maxLength={FEEDBACK_LIMITS.contact}
                  placeholder="답변이 필요할 때만 적어 주세요"
                  className="input w-full"
                />
                <span className="mt-1 block type-micro text-ink-mute">
                  운영자만 볼 수 있고, 처리가 끝나면 지워요.
                </span>
              </label>

              {state.error && <p className="rounded-md bg-ev-doc-soft p-3 type-caption text-ev-doc">{state.error}</p>}
            </div>

            <div className="flex gap-2 border-t border-hairline px-6 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <button type="button" onClick={onClose} className="btn btn-toggle">
                취소
              </button>
              <button
                type="submit"
                disabled={pending || uploading || body.trim().length < FEEDBACK_LIMITS.minBody}
                className="btn btn-primary flex-1 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {pending
                  ? "보내는 중…"
                  : uploading
                    ? "사진 올리는 중…"
                  : body.trim().length < FEEDBACK_LIMITS.minBody
                    ? `${FEEDBACK_LIMITS.minBody}자 이상 적어 주세요`
                    : "운영자에게 보내기"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body,
  );
}
