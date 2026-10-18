"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowDown, EyeOff, Link2, Loader2, MessagesSquare, Send, ShieldCheck } from "lucide-react";
import { TALK_HIDDEN_TEXT, TALK_LIMITS, TALK_POLL_MS, type TalkItem } from "@/lib/talk-meta";
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
 * 기관별 실시간 톡방 — 익명으로 바로바로 이야기 나누는 칸. 글은 시간이 지나도 지워지지 않아요.
 * 필기 후기 페이지(examId 있음)와 기관 정보 페이지가 같은 방이고, 시험 페이지에서 쓴 글엔 시험 꼬리표가 붙어요.
 * 몇 초마다 최근 목록을 서버와 맞춰요 (새 글 · 운영자가 가린 글 · 지운 글이 바로 반영). 탭이 보일 때만.
 * 위로 올려 읽는 중이면 화면을 움직이지 않고 '새 이야기 N개' 버튼만 띄워요.
 * admin: 운영자 — 글마다 가리기·다시 보이기·삭제, '금콩 운영자'로 쓰기
 */
export function ExamTalk({
  room,
  roomName,
  examId = "",
  initial,
  live,
  admin = false,
}: {
  /** 기관 id (톡방) */
  room: string;
  /** 기관 이름 */
  roomName: string;
  /** 시험 페이지에서 열었으면 그 시험 — 이 시험 글엔 꼬리표를 생략하고, 새 글에 이 시험 꼬리표를 달아요 */
  examId?: string;
  initial: { items: TalkItem[]; more: boolean };
  /** 시험 당일·직후 — LIVE 표시 */
  live: boolean;
  admin?: boolean;
}) {
  const [items, setItems] = useState(initial.items);
  const [more, setMore] = useState(initial.more);
  const [text, setText] = useState("");
  const [asAdmin, setAsAdmin] = useState(admin);
  const [sending, setSending] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [unseen, setUnseen] = useState(0);
  const [loadingOld, setLoadingOld] = useState(false);
  // 시간 글자는 화면에서만 (서버와 시계가 달라 어긋나지 않게)
  const [now, setNow] = useState<number | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const atBottom = useRef(true);
  const lastId = useRef(initial.items.at(-1)?.id ?? 0);

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

  /** 최근 목록을 서버와 맞추기 — 더 보기로 불러온 옛 글은 그대로 두고, 최근 부분만 서버 것으로 바꿔요 */
  const sync = useCallback(async () => {
    try {
      const res = await fetch(`/api/talk/${room}`, { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { items: TalkItem[] };
      const fresh = data.items ?? [];
      const first = fresh[0]?.id ?? Infinity;
      const added = fresh.filter((x) => x.id > lastId.current);
      lastId.current = Math.max(lastId.current, fresh.at(-1)?.id ?? 0);
      setItems((prev) => [...prev.filter((x) => x.id < first), ...fresh]);
      if (added.length) {
        if (atBottom.current || added.some((x) => x.mine)) requestAnimationFrame(() => toBottom(true));
        else setUnseen((n) => n + added.filter((x) => !x.mine).length);
      }
    } catch {
      /* 다음 차례에 다시 */
    }
  }, [room, toBottom]);

  // 몇 초마다 맞추기 — 탭이 보일 때만
  useEffect(() => {
    const tick = () => {
      setNow(Date.now());
      if (document.visibilityState === "visible") sync();
    };
    const t = window.setInterval(tick, live || admin ? TALK_POLL_MS : TALK_POLL_MS * 2);
    const onVisible = () => document.visibilityState === "visible" && tick();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(t);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [live, admin, sync]);

  async function loadOlder() {
    const first = items[0]?.id;
    if (!first || loadingOld) return;
    setLoadingOld(true);
    const el = box.current;
    const before = el ? el.scrollHeight - el.scrollTop : 0;
    try {
      const res = await fetch(`/api/talk/${room}?before=${first}`, { cache: "no-store" });
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
      const res = await fetch(`/api/talk/${room}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ body, examId, asAdmin: admin && asAdmin }),
      });
      const data = (await res.json().catch(() => ({}))) as { item?: TalkItem | null; error?: string };
      if (!res.ok || !data.item) {
        setError(data.error ?? "보내지 못했어요. 잠시 뒤 다시 보내 주세요.");
        return;
      }
      const item = data.item;
      setText("");
      lastId.current = Math.max(lastId.current, item.id);
      setItems((prev) => (prev.some((x) => x.id === item.id) ? prev : [...prev, item]));
      requestAnimationFrame(() => toBottom(true));
    } catch {
      setError("보내지 못했어요. 잠시 뒤 다시 보내 주세요.");
    } finally {
      setSending(false);
    }
  }

  /** 운영자: 가리기 · 다시 보이기 · 삭제 */
  async function moderate(id: number, op: "hide" | "show" | "delete") {
    if (op === "delete" && !window.confirm("이 메시지를 삭제할까요? 톡에서 완전히 빠져요.")) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/talk/${room}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, op }) });
      if (!res.ok) {
        setError(((await res.json().catch(() => ({}))) as { error?: string }).error ?? "처리하지 못했어요.");
        return;
      }
      setItems((prev) =>
        op === "delete"
          ? prev.filter((x) => x.id !== id)
          : prev.map((x) => (x.id === id ? { ...x, status: op === "hide" ? 1 : 0, hidden: op === "hide" ? "admin" : undefined, reports: op === "show" ? 0 : x.reports } : x)),
      );
    } finally {
      setBusyId(null);
    }
  }

  const visibleCount = items.filter((x) => !x.hidden).length;

  return (
    <section aria-labelledby={`talk-title-${room}`} className="card overflow-hidden shadow-level-1">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-hairline px-5 py-4 md:px-6">
        <MessagesSquare className="h-5 w-5 text-primary" strokeWidth={1.75} />
        <h2 id={`talk-title-${room}`} className="type-heading-md text-ink">
          {examId ? "실시간 응시자 톡" : `${roomName} 실시간 톡`}
        </h2>
        {live && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-ruby px-2 py-0.5 type-micro font-semibold text-on-primary">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-on-primary motion-reduce:animate-none" />
            LIVE
          </span>
        )}
        <span className="tabular type-caption text-ink-mute">{visibleCount}개</span>
        <p className="w-full type-caption text-ink-mute">
          {admin
            ? "운영자 화면이에요 — 글마다 가리기(방문자에겐 '운영자에 의해 가려진 메시지')·삭제할 수 있어요."
            : "익명으로 자유롭게 이야기해요. 이 기관 필기에 후기를 남긴 사람은 ✓응시 표시가 붙어요."}
        </p>
        {/* 두 페이지가 같은 방이라는 안내 */}
        <p className="flex w-full items-center gap-1 type-micro text-ink-mute">
          <Link2 className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
          {examId ? (
            <>
              <Link href={`/companies/${room}#talk`} className="link">
                {roomName} 기관 정보
              </Link>
              의 톡과 같은 방이에요.
            </>
          ) : (
            "필기 후기 페이지의 응시자 톡과 같은 방이에요. 시험 페이지에서 쓴 글엔 시험 꼬리표가 붙어요."
          )}
        </p>
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
              {items.map((m) => {
                const hiddenForMe = Boolean(m.hidden) && !admin;
                return (
                  <li key={m.id} className={cn("flex", m.mine && "justify-end")}>
                    <div className={cn("max-w-[85%]", m.mine && "text-right")}>
                      <p className={cn("flex flex-wrap items-center gap-1.5 type-micro text-ink-mute", m.mine && "justify-end")}>
                        {m.admin ? (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-brand-dark px-1.5 py-px font-semibold text-on-primary">
                            <ShieldCheck className="h-3 w-3" strokeWidth={2} />
                            운영자
                          </span>
                        ) : (
                          <span className="h-2 w-2 rounded-full" style={{ background: m.tone }} />
                        )}
                        <span className="font-semibold text-ink-secondary">{m.mine && !m.admin ? `${m.name} (나)` : m.name}</span>
                        {m.reviewed && <span className="rounded-full bg-ev-final-soft px-1.5 py-px font-semibold text-ev-final">✓응시</span>}
                        {/* 어디서 쓴 글인지 — 지금 보는 시험 글은 생략 */}
                        {m.examId !== examId && (
                          <span className="rounded-full bg-canvas-soft px-1.5 py-px text-ink-secondary">{m.tag || "기관 정보"}</span>
                        )}
                        {now != null && <span className="tabular">{timeLabel(m.createdAt, now)}</span>}
                        {admin && m.hidden && <span className="rounded-full bg-canvas-soft px-1.5 py-px font-semibold text-ink-secondary">가림</span>}
                        {admin && (m.reports ?? 0) > 0 && <span className="rounded-full bg-ev-doc-soft px-1.5 py-px font-semibold text-ev-doc">신고 {m.reports}</span>}
                      </p>
                      {hiddenForMe ? (
                        <p className="mt-1 inline-flex items-center gap-1.5 rounded-2xl border border-dashed border-hairline-input px-3.5 py-2 text-left type-caption text-ink-mute italic">
                          <EyeOff className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
                          {TALK_HIDDEN_TEXT[m.hidden!]}
                        </p>
                      ) : (
                        <p
                          className={cn(
                            "mt-1 inline-block rounded-2xl px-3.5 py-2 text-left type-body-md whitespace-pre-wrap [overflow-wrap:anywhere]",
                            m.mine ? "rounded-tr-md" : "rounded-tl-md",
                            m.admin ? "bg-brand-dark text-on-primary" : m.mine ? "bg-primary text-on-primary" : "bg-canvas-soft text-ink",
                            admin && m.hidden && "opacity-50",
                          )}
                        >
                          {m.body}
                        </p>
                      )}
                      {admin ? (
                        <span className={cn("mt-1 flex gap-1.5 type-micro", m.mine && "justify-end")}>
                          {m.hidden ? (
                            <button type="button" disabled={busyId === m.id} onClick={() => moderate(m.id, "show")} className="rounded-full border border-hairline px-2 py-0.5 text-ink-secondary hover:border-hairline-input">
                              다시 보이기
                            </button>
                          ) : (
                            <button type="button" disabled={busyId === m.id} onClick={() => moderate(m.id, "hide")} className="rounded-full border border-hairline px-2 py-0.5 text-ink-secondary hover:border-hairline-input">
                              가리기
                            </button>
                          )}
                          <button type="button" disabled={busyId === m.id} onClick={() => moderate(m.id, "delete")} className="rounded-full border border-ruby px-2 py-0.5 text-ruby">
                            삭제
                          </button>
                        </span>
                      ) : (
                        !m.mine &&
                        !m.admin &&
                        !hiddenForMe && (
                          <span className="mt-0.5 block">
                            <ReportButton type="talk" id={m.id} small />
                          </span>
                        )
                      )}
                    </div>
                  </li>
                );
              })}
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
        {admin && (
          <label className="mb-2 inline-flex items-center gap-2 type-caption text-ink">
            <input type="checkbox" checked={asAdmin} onChange={(e) => setAsAdmin(e.target.checked)} className="h-4 w-4 accent-[var(--primary)]" />
            &lsquo;금콩 운영자&rsquo;로 쓰기
          </label>
        )}
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
            placeholder={admin && asAdmin ? "운영자로 안내·공지하기" : "시험 어땠어요? 익명으로 한마디"}
            aria-label="톡 보내기"
            className="input max-h-28 min-h-11 w-full resize-none leading-relaxed"
          />
          <button type="submit" disabled={sending || text.trim().length < TALK_LIMITS.minBody} className="btn btn-primary !h-11 shrink-0 disabled:opacity-50" aria-label="보내기">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} /> : <Send className="h-4 w-4" strokeWidth={2} />}
          </button>
        </div>
        <p className="mt-1.5 flex justify-between gap-3 type-micro text-ink-mute">
          <span>{error ? <span className="text-ev-doc">{error}</span> : "남긴 글은 시간이 지나도 남아요. 문제 원문·복원 문항, 욕설·광고는 가려질 수 있어요."}</span>
          <span className="shrink-0 tabular">
            {text.length}/{TALK_LIMITS.body}
          </span>
        </p>
      </form>
    </section>
  );
}
