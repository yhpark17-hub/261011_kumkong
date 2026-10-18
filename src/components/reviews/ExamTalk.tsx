"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowDown, Loader2, MessagesSquare, Send } from "lucide-react";
import { TALK_LIMITS, TALK_POLL_MS, type TalkItem } from "@/lib/talk-meta";
import { ModerationBar } from "../board/ModerationBar";
import { ReportButton } from "../board/interactive";
import { cn } from "../ui";

/** '방금' · 'N분 전' · '14:05' · '10/17 14:05' (한국 시각) */
function timeLabel(at: number, now: number): string {
  const min = Math.floor((now - at) / 60_000);
  if (min < 1) return "방금";
  if (min < 60) return `${min}분 전`;
  const kst = (t: number) => new Date(t + 9 * 3600_000);
  const d = kst(at);
  const hm = `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
  return kst(now).toISOString().slice(0, 10) === d.toISOString().slice(0, 10) ? hm : `${d.getUTCMonth() + 1}/${d.getUTCDate()} ${hm}`;
}

/**
 * 시험별 실시간 응시자 톡 — 익명으로 바로바로 이야기 나누는 칸.
 * 몇 초마다 새 글을 불러와요 (탭이 보일 때만). 위로 올려 읽는 중이면 '새 이야기 N개' 버튼만 띄워요.
 */
export function ExamTalk({
  examId,
  initial,
  live,
  admin = false,
}: {
  examId: string;
  initial: { items: TalkItem[]; more: boolean };
  /** 시험 당일·직후 — LIVE 표시 */
  live: boolean;
  admin?: boolean;
}) {
  const [items, setItems] = useState(initial.items);
  const [more, setMore] = useState(initial.more);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unseen, setUnseen] = useState(0);
  const [loadingOld, setLoadingOld] = useState(false);
  // 시간 글자는 화면에서만 (서버와 시계가 달라 어긋나지 않게)
  const [now, setNow] = useState<number | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const atBottom = useRef(true);
  const lastId = items.at(-1)?.id ?? 0;

  const toBottom = useCallback((smooth = false) => {
    const el = box.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
    setUnseen(0);
  }, []);

  // 처음엔 맨 아래(최신)부터
  useEffect(() => {
    const el = box.current;
    if (el) el.scrollTop = el.scrollHeight;
    const id = requestAnimationFrame(() => setNow(Date.now()));
    return () => cancelAnimationFrame(id);
  }, []);

  const append = useCallback(
    (fresh: TalkItem[]) => {
      if (!fresh.length) return;
      setItems((prev) => {
        const seen = new Set(prev.map((x) => x.id));
        return [...prev, ...fresh.filter((x) => !seen.has(x.id))];
      });
      if (atBottom.current || fresh.some((x) => x.mine)) requestAnimationFrame(() => toBottom(true));
      else setUnseen((n) => n + fresh.length);
    },
    [toBottom],
  );

  // 새 글 불러오기 — 탭이 보일 때만
  useEffect(() => {
    const tick = async () => {
      setNow(Date.now());
      if (document.visibilityState !== "visible") return;
      try {
        const res = await fetch(`/api/reviews/${examId}/talk?after=${lastId}`, { cache: "no-store" });
        if (res.ok) append(((await res.json()) as { items: TalkItem[] }).items ?? []);
      } catch {
        /* 다음 차례에 다시 */
      }
    };
    const t = window.setInterval(tick, live ? TALK_POLL_MS : TALK_POLL_MS * 2);
    const onVisible = () => document.visibilityState === "visible" && tick();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(t);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [examId, lastId, live, append]);

  async function loadOlder() {
    const first = items[0]?.id;
    if (!first || loadingOld) return;
    setLoadingOld(true);
    const el = box.current;
    const before = el ? el.scrollHeight - el.scrollTop : 0;
    try {
      const res = await fetch(`/api/reviews/${examId}/talk?before=${first}`, { cache: "no-store" });
      const data = (await res.json()) as { items: TalkItem[]; more: boolean };
      setItems((prev) => [...(data.items ?? []), ...prev]);
      setMore(Boolean(data.more));
      // 읽던 자리 그대로
      requestAnimationFrame(() => {
        if (el) el.scrollTop = el.scrollHeight - before;
      });
    } finally {
      setLoadingOld(false);
    }
  }

  async function send() {
    const body = text.trim();
    if (body.length < TALK_LIMITS.minBody || sending) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/reviews/${examId}/talk`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ body }) });
      const data = (await res.json().catch(() => ({}))) as { item?: TalkItem | null; error?: string };
      if (!res.ok || !data.item) {
        setError(data.error ?? "보내지 못했어요. 잠시 뒤 다시 보내 주세요.");
        return;
      }
      setText("");
      atBottom.current = true;
      append([data.item]);
    } catch {
      setError("보내지 못했어요. 잠시 뒤 다시 보내 주세요.");
    } finally {
      setSending(false);
    }
  }

  return (
    <section aria-labelledby="talk-title" className="card overflow-hidden shadow-level-1">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-hairline px-5 py-4 md:px-6">
        <MessagesSquare className="h-5 w-5 text-primary" strokeWidth={1.75} />
        <h2 id="talk-title" className="type-heading-md text-ink">
          실시간 응시자 톡
        </h2>
        {live && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-ruby px-2 py-0.5 type-micro font-semibold text-on-primary">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-on-primary motion-reduce:animate-none" />
            LIVE
          </span>
        )}
        <span className="tabular type-caption text-ink-mute">{items.length}개</span>
        <p className="w-full type-caption text-ink-mute">익명으로 자유롭게 이야기해요. 후기를 남긴 사람은 이름 옆에 ✓응시 표시가 붙어요.</p>
      </div>

      <div className="relative">
        <div
          ref={box}
          onScroll={(e) => {
            const el = e.currentTarget;
            atBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
            if (atBottom.current) setUnseen(0);
          }}
          className="h-[380px] overflow-y-auto overscroll-contain px-4 py-4 md:px-6"
          aria-live="polite"
        >
          {more && (
            <button type="button" onClick={loadOlder} disabled={loadingOld} className="mx-auto mb-3 flex items-center gap-1 rounded-full bg-canvas-soft px-3 py-1 type-caption text-ink-secondary hover:text-ink">
              {loadingOld && <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />}
              이전 이야기 더 보기
            </button>
          )}
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <MessagesSquare className="h-8 w-8 text-ink-mute-2" strokeWidth={1.5} />
              <p className="mt-3 type-body-md text-ink-secondary">아직 이야기가 없어요.</p>
              <p className="mt-1 type-caption text-ink-mute">시험 어땠는지, 어느 과목이 힘들었는지 한마디 남겨 보세요.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {items.map((m) => (
                <li key={m.id} className={cn("flex", m.mine && "justify-end", Boolean(m.status) && "opacity-50")}>
                  <div className={cn("max-w-[85%]", m.mine && "text-right")}>
                    <p className={cn("flex items-center gap-1.5 type-micro text-ink-mute", m.mine && "justify-end")}>
                      <span className="h-2 w-2 rounded-full" style={{ background: m.tone }} />
                      <span className="font-semibold text-ink-secondary">{m.mine ? `${m.name} (나)` : m.name}</span>
                      {m.reviewed && <span className="rounded-full bg-ev-final-soft px-1.5 py-px font-semibold text-ev-final">✓응시</span>}
                      {now != null && <span className="tabular">{timeLabel(m.createdAt, now)}</span>}
                    </p>
                    <p
                      className={cn(
                        "mt-1 inline-block rounded-2xl px-3.5 py-2 text-left type-body-md whitespace-pre-wrap [overflow-wrap:anywhere]",
                        m.mine ? "rounded-tr-md bg-primary text-on-primary" : "rounded-tl-md bg-canvas-soft text-ink",
                      )}
                    >
                      {m.body}
                    </p>
                    {!m.mine && !admin && (
                      <span className="mt-0.5 block">
                        <ReportButton type="talk" id={m.id} small />
                      </span>
                    )}
                    {admin && <ModerationBar type="talk" id={m.id} status={m.status ?? 0} reports={m.reports} compact className="mt-1" />}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        {unseen > 0 && (
          <button
            type="button"
            onClick={() => toBottom(true)}
            className="absolute bottom-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-brand-dark px-3.5 py-1.5 type-caption font-semibold text-on-primary shadow-level-2"
          >
            새 이야기 {unseen}개
            <ArrowDown className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="border-t border-hairline px-4 py-3 md:px-6"
      >
        <div className="flex items-end gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              // Enter 로 보내기 (Shift+Enter 는 줄바꿈, 한글 조합 중엔 무시)
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                send();
              }
            }}
            maxLength={TALK_LIMITS.body}
            rows={1}
            placeholder="시험 어땠어요? 익명으로 한마디"
            aria-label="톡 보내기"
            className="input max-h-28 min-h-11 w-full resize-none leading-relaxed"
          />
          <button type="submit" disabled={sending || text.trim().length < TALK_LIMITS.minBody} className="btn btn-primary !h-11 shrink-0 disabled:opacity-50" aria-label="보내기">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} /> : <Send className="h-4 w-4" strokeWidth={2} />}
          </button>
        </div>
        <p className="mt-1.5 flex justify-between gap-3 type-micro text-ink-mute">
          <span>{error ? <span className="text-ev-doc">{error}</span> : "문제 원문·복원 문항, 욕설·광고는 신고되면 가려져요."}</span>
          <span className="shrink-0 tabular">
            {text.length}/{TALK_LIMITS.body}
          </span>
        </p>
      </form>
    </section>
  );
}
