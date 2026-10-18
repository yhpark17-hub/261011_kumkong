"use server";

import { refresh, revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parseAttachments } from "@/lib/attachments";
import { STATUS, db } from "@/lib/server/db";
import { FEEDBACK_STATUS } from "@/lib/server/feedback";
import { deleteFiles } from "@/lib/server/storage";
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
  revalidatePath("/admin", "layout");
  refresh();
}

const TABLES = { post: "posts", comment: "comments", review: "exam_reviews", talk: "exam_talk" } as const;
type Target = keyof typeof TABLES;
type Op = "hide" | "show" | "delete" | "pin" | "unpin" | "clearReports" | "purge" | "ban";
const OPS = new Set<Op>(["hide", "show", "delete", "pin", "unpin", "clearReports", "purge", "ban"]);

type Client = Awaited<ReturnType<typeof db>>;

/** 글·댓글·후기 하나에 운영 조치를 적용 */
async function applyModeration(client: Client, type: Target, op: Op, id: number) {
  const table = TABLES[type];
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
  } else if (op === "purge") {
    // 완전 삭제는 이미 '삭제' 상태인 것만 — 실수로 공개 글을 바로 없애지 않게
    const files =
      type === "post"
        ? parseAttachments(
            (await client.execute({ sql: "SELECT attachments FROM posts WHERE id = ? AND status = ?", args: [id, STATUS.deleted] })).rows[0]
              ?.attachments,
          )
        : [];
    const statements = [
      { sql: `DELETE FROM ${table} WHERE id = ? AND status = ?`, args: [id, STATUS.deleted] },
      {
        sql: `DELETE FROM reports WHERE target_type = ? AND target_id = ? AND NOT EXISTS (SELECT 1 FROM ${table} WHERE id = ?)`,
        args: [type, id, id],
      },
    ];
    if (type === "post") {
      statements.push(
        { sql: "DELETE FROM comments WHERE post_id = ? AND NOT EXISTS (SELECT 1 FROM posts WHERE id = ?)", args: [id, id] },
        { sql: "DELETE FROM post_likes WHERE post_id = ? AND NOT EXISTS (SELECT 1 FROM posts WHERE id = ?)", args: [id, id] },
      );
    }
    await client.batch(statements, "write");
    if (files.length) await deleteFiles(files.map((f) => f.url)); // 첨부 사진·파일도 저장소에서 지움
  } else if (op === "ban") {
    // 작성자(IP 해시)를 차단 목록에 추가 — 이후 글·댓글·후기·신고를 막음
    const res = await client.execute({
      sql:
        type === "post"
          ? "SELECT ip_hash, title AS sample FROM posts WHERE id = ?"
          : type === "comment"
            ? "SELECT ip_hash, body AS sample FROM comments WHERE id = ?"
            : type === "talk"
              ? "SELECT ip_hash, body AS sample FROM exam_talk WHERE id = ?"
              : "SELECT ip_hash, COALESCE(one_liner, detail, '') AS sample FROM exam_reviews WHERE id = ?",
      args: [id],
    });
    const row = res.rows[0];
    if (row?.ip_hash) {
      await client.execute({
        sql: "INSERT OR IGNORE INTO bans (ip_hash, reason, sample, created_at) VALUES (?, ?, ?, ?)",
        args: [String(row.ip_hash), "운영자 차단", String(row.sample ?? "").slice(0, 80), Date.now()],
      });
    }
  }
}

function revalidateAll() {
  revalidatePath("/board");
  revalidatePath("/reviews");
  revalidatePath("/admin", "layout");
}

/** 운영자 전용: 숨김·복구·삭제·공지 고정 (글 화면의 운영자 버튼) */
export async function moderate(fd: FormData): Promise<void> {
  if (!(await isAdmin())) throw new Error("운영자만 할 수 있어요.");
  const type = String(fd.get("type")) as Target;
  const op = String(fd.get("op")) as Op;
  const id = Number(fd.get("id"));
  if (!TABLES[type] || !OPS.has(op) || !Number.isInteger(id)) throw new Error("잘못된 요청입니다.");

  await applyModeration(await db(), type, op, id);
  revalidateAll();
  // 글 화면에서 그 글을 지웠다면 목록으로 이동
  const returnTo = String(fd.get("returnTo") ?? "");
  if (op === "delete" && /^\/[a-z]/.test(returnTo)) redirect(returnTo);
  refresh();
}

/**
 * 운영자 콘텐츠 목록: 한 줄 버튼(target="op:id") 또는 선택한 여러 개(bulk=op + ids)에 조치
 */
export async function moderateMany(fd: FormData): Promise<void> {
  if (!(await isAdmin())) throw new Error("운영자만 할 수 있어요.");
  const type = String(fd.get("type")) as Target;
  if (!TABLES[type]) throw new Error("잘못된 요청입니다.");

  let op: Op;
  let ids: number[];
  const target = String(fd.get("target") ?? "");
  if (target) {
    const [o, id] = target.split(":");
    op = o as Op;
    ids = [Number(id)];
  } else {
    op = String(fd.get("bulk") ?? "") as Op;
    ids = fd.getAll("ids").map(Number);
  }
  ids = ids.filter((n) => Number.isInteger(n) && n > 0).slice(0, 200);
  if (!OPS.has(op) || !ids.length) return;

  const client = await db();
  for (const id of ids) await applyModeration(client, type, op, id);
  revalidateAll();
  refresh();
}

/** 차단 해제 */
export async function unban(fd: FormData): Promise<void> {
  if (!(await isAdmin())) throw new Error("운영자만 할 수 있어요.");
  const hash = String(fd.get("ipHash") ?? "");
  if (!/^[a-f0-9]{16,64}$/.test(hash)) throw new Error("잘못된 요청입니다.");
  await (await db()).execute({ sql: "DELETE FROM bans WHERE ip_hash = ?", args: [hash] });
  revalidatePath("/admin", "layout");
  refresh();
}
