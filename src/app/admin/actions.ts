"use server";

import { refresh, revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { STATUS, db } from "@/lib/server/db";
import { FEEDBACK_STATUS } from "@/lib/server/feedback";
import {
  adminEnabled,
  checkAdminPassword,
  endAdminSession,
  isAdmin,
  rateLimit,
  requester,
  startAdminSession,
} from "@/lib/server/security";

export type AdminState = { ok: boolean; error?: string };

export async function adminLogin(_prev: AdminState, fd: FormData): Promise<AdminState> {
  if (!adminEnabled()) return { ok: false, error: "운영자 로그인이 설정되지 않았어요(.env.local 의 ADMIN_PASSWORD·ADMIN_SECRET)." };
  const who = await requester();
  if (!(await rateLimit("admin-login", who.hash, 5))) return { ok: false, error: "잠시 후 다시 시도해 주세요." };
  if (!checkAdminPassword(String(fd.get("password") ?? ""))) return { ok: false, error: "비밀번호가 맞지 않아요." };
  await startAdminSession();
  redirect("/admin");
}

export async function adminLogout(): Promise<void> {
  await endAdminSession();
  redirect("/board");
}

/** 운영자 전용: 제보·의견 처리 완료 / 다시 열기 / 삭제 */
export async function handleFeedback(fd: FormData): Promise<void> {
  if (!(await isAdmin())) throw new Error("운영자만 할 수 있어요.");
  const id = Number(fd.get("id"));
  const op = String(fd.get("op"));
  if (!Number.isInteger(id)) throw new Error("잘못된 요청입니다.");
  const client = await db();
  if (op === "done") {
    // 처리가 끝나면 답변용 연락처는 지웁니다 (개인정보 최소 보관)
    await client.execute({
      sql: "UPDATE feedback SET status = ?, handled_at = ?, contact = NULL WHERE id = ?",
      args: [FEEDBACK_STATUS.done, Date.now(), id],
    });
  } else if (op === "reopen") {
    await client.execute({ sql: "UPDATE feedback SET status = ?, handled_at = NULL WHERE id = ?", args: [FEEDBACK_STATUS.open, id] });
  } else if (op === "delete") {
    await client.execute({
      sql: "UPDATE feedback SET status = ?, handled_at = ?, contact = NULL WHERE id = ?",
      args: [FEEDBACK_STATUS.deleted, Date.now(), id],
    });
  }
  revalidatePath("/admin");
  refresh();
}

const TABLES = { post: "posts", comment: "comments", review: "exam_reviews" } as const;
type Target = keyof typeof TABLES;
type Op = "hide" | "show" | "delete" | "pin" | "unpin" | "clearReports";

/** 운영자 전용: 숨김·복구·삭제·공지 고정 */
export async function moderate(fd: FormData): Promise<void> {
  if (!(await isAdmin())) throw new Error("운영자만 할 수 있어요.");
  const type = String(fd.get("type")) as Target;
  const op = String(fd.get("op")) as Op;
  const id = Number(fd.get("id"));
  const table = TABLES[type];
  if (!table || !Number.isInteger(id)) throw new Error("잘못된 요청입니다.");

  const client = await db();
  if (op === "hide" || op === "show" || op === "delete") {
    const status = op === "hide" ? STATUS.hidden : op === "show" ? STATUS.visible : STATUS.deleted;
    await client.execute({ sql: `UPDATE ${table} SET status = ? WHERE id = ?`, args: [status, id] });
    if (type === "comment") {
      // 댓글 수 다시 계산
      await client.execute({
        sql: "UPDATE posts SET comment_count = (SELECT COUNT(*) FROM comments WHERE post_id = posts.id AND status = 0) WHERE id = (SELECT post_id FROM comments WHERE id = ?)",
        args: [id],
      });
    }
  } else if ((op === "pin" || op === "unpin") && type === "post") {
    await client.execute({ sql: "UPDATE posts SET is_notice = ? WHERE id = ?", args: [op === "pin" ? 1 : 0, id] });
  } else if (op === "clearReports") {
    await client.batch(
      [
        { sql: `UPDATE ${table} SET reports = 0 WHERE id = ?`, args: [id] },
        { sql: "DELETE FROM reports WHERE target_type = ? AND target_id = ?", args: [type, id] },
      ],
      "write",
    );
  }
  revalidatePath("/board");
  revalidatePath("/admin");
  // 글 화면에서 그 글을 지웠다면 목록으로 이동
  const returnTo = String(fd.get("returnTo") ?? "");
  if (op === "delete" && /^\/[a-z]/.test(returnTo)) redirect(returnTo);
  refresh();
}
