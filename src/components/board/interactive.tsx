"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { Flag, ThumbsUp } from "lucide-react";
import {
  addComment,
  deleteComment,
  deletePost,
  likePost,
  recordView,
  reportItem,
  type ActionState,
  type ReportTarget,
} from "@/app/board/actions";
import { cn } from "../ui";

/** 조회수 기록 (같은 탭에서 새로고침해도 한 번만) */
export function ViewCounter({ postId }: { postId: number }) {
  useEffect(() => {
    const key = `kk:viewed:${postId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {}
    void recordView(postId);
  }, [postId]);
  return null;
}

export function LikeButton({ postId, initial }: { postId: number; initial: number }) {
  const [likes, setLikes] = useState(initial);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const res = await likePost(postId);
            setLikes(res.likes);
            setMsg(res.already ? "이미 추천했어요" : "추천했어요");
          })
        }
        className="btn btn-secondary min-w-28"
      >
        <ThumbsUp className="h-4 w-4" strokeWidth={1.75} />
        추천 <span className="tabular">{likes}</span>
      </button>
      {msg && <span className="type-micro text-ink-mute">{msg}</span>}
    </div>
  );
}

export function ReportButton({ type, id, small = false }: { type: ReportTarget; id: number; small?: boolean }) {
  const [done, setDone] = useState<string | null>(null);
  const [pending, start] = useTransition();
  if (done) return <span className="type-micro text-ink-mute">{done}</span>;
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        const reason = window.prompt("신고 사유를 적어 주세요 (예: 욕설, 광고, 개인정보, 문제 원문 유출)");
        if (reason === null) return;
        start(async () => {
          const res = await reportItem(type, id, reason);
          setDone(res.already ? "이미 신고했어요" : "신고가 접수됐어요");
        });
      }}
      className={cn(
        "inline-flex items-center gap-1 text-ink-mute hover:text-ruby",
        small ? "type-micro" : "type-caption",
      )}
    >
      <Flag className={small ? "h-3 w-3" : "h-3.5 w-3.5"} strokeWidth={1.75} />
      신고
    </button>
  );
}

/** 비밀번호 확인 후 글 삭제 */
export function DeletePostForm({ postId, admin, isAdminPost }: { postId: number; admin: boolean; isAdminPost: boolean }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<ActionState, FormData>(deletePost, { ok: false });
  if (isAdminPost && !admin) return null;
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="btn btn-sm btn-toggle">
        삭제
      </button>
    );
  }
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="id" value={postId} />
      {!admin && (
        <input name="password" type="password" required placeholder="비밀번호" className="input w-32" autoFocus />
      )}
      <button type="submit" disabled={pending} className="btn btn-sm btn-on-dark">
        {admin ? "운영자 삭제" : "삭제 확인"}
      </button>
      <button type="button" onClick={() => setOpen(false)} className="btn btn-sm btn-toggle">
        취소
      </button>
      {state.error && <span className="type-caption text-ev-doc">{state.error}</span>}
    </form>
  );
}

export function CommentForm({ postId, admin }: { postId: number; admin: boolean }) {
  const [body, setBody] = useState("");
  const [state, action, pending] = useActionState<ActionState, FormData>(async (prev, fd) => {
    const res = await addComment(prev, fd);
    if (res.ok) setBody("");
    return res;
  }, { ok: false });
  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="postId" value={postId} />
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
      {!admin && (
        <div className="flex gap-2">
          <input name="nickname" maxLength={12} placeholder="닉네임 (ㅇㅇ)" className="input w-36" />
          <input name="password" type="password" minLength={4} maxLength={30} required placeholder="비밀번호" className="input w-36" />
        </div>
      )}
      <textarea
        name="body"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        required
        maxLength={500}
        rows={3}
        placeholder={admin ? "운영자 댓글" : "댓글을 입력하세요"}
        className="input w-full resize-y"
      />
      <div className="flex items-center justify-between gap-2">
        <span className="type-caption text-ev-doc">{state.error}</span>
        <button type="submit" disabled={pending} className="btn btn-sm btn-primary">
          {pending ? "등록 중…" : "댓글 등록"}
        </button>
      </div>
    </form>
  );
}

export function DeleteCommentButton({ commentId, admin, isAdminComment }: { commentId: number; admin: boolean; isAdminComment: boolean }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<ActionState, FormData>(deleteComment, { ok: false });
  if (isAdminComment && !admin) return null;
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="type-micro text-ink-mute hover:text-ink">
        삭제
      </button>
    );
  }
  return (
    <form action={action} className="flex items-center gap-1">
      <input type="hidden" name="id" value={commentId} />
      {!admin && <input name="password" type="password" required placeholder="비밀번호" className="input !min-h-0 w-24 !py-1 type-caption" autoFocus />}
      <button type="submit" disabled={pending} className="type-micro text-ruby">
        확인
      </button>
      <button type="button" onClick={() => setOpen(false)} className="type-micro text-ink-mute">
        취소
      </button>
      {state.error && <span className="type-micro text-ev-doc">{state.error}</span>}
    </form>
  );
}
