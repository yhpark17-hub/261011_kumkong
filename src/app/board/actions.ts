"use server";

import { refresh, revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isBoardCategory } from "@/lib/board-meta";
import { getCompany } from "@/lib/data";
import { getPostSecret, incrementViews } from "@/lib/server/board";
import { STATUS, db } from "@/lib/server/db";
import {
  AUTO_HIDE_REPORTS,
  LIMITS,
  containsBanned,
  hashPassword,
  isAdmin,
  isReservedNickname,
  rateLimit,
  requester,
  tooManyLinks,
  verifyPassword,
} from "@/lib/server/security";

export type ActionState = { ok: boolean; error?: string };

const ADMIN_NICKNAME = "금콩 운영자";

const str = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();

function checkText(text: string): string | null {
  if (containsBanned(text)) return "사용할 수 없는 표현이 들어 있어요.";
  if (tooManyLinks(text)) return "링크는 2개까지만 넣을 수 있어요.";
  return null;
}

function checkAuthor(nickname: string, password: string): string | null {
  if (nickname.length > LIMITS.nickname) return `닉네임은 ${LIMITS.nickname}자 이내로 적어 주세요.`;
  if (isReservedNickname(nickname)) return "운영자로 오해할 수 있는 닉네임은 쓸 수 없어요.";
  if (password.length < 4 || password.length > 30) return "비밀번호는 4~30자로 정해 주세요.";
  return null;
}

/* ------------------------------------------------------------------ */
/* 글                                                                   */
/* ------------------------------------------------------------------ */

export async function createPost(_prev: ActionState, fd: FormData): Promise<ActionState> {
  if (str(fd, "website")) return { ok: false, error: "잘못된 요청입니다." }; // 스팸봇용 숨은 칸
  const admin = await isAdmin();
  const category = str(fd, "category");
  const title = str(fd, "title");
  const body = str(fd, "body");
  const companyId = str(fd, "companyId") || null;
  const nickname = admin ? ADMIN_NICKNAME : str(fd, "nickname") || "ㅇㅇ";
  const password = str(fd, "password");
  const notice = admin && fd.get("notice") === "on";

  if (!isBoardCategory(category) || (category === "notice" && !admin)) return { ok: false, error: "말머리를 골라 주세요." };
  if (title.length < 2 || title.length > LIMITS.title) return { ok: false, error: `제목은 2~${LIMITS.title}자로 적어 주세요.` };
  const maxBody = admin ? LIMITS.adminBody : LIMITS.body;
  if (body.length < 2 || body.length > maxBody) return { ok: false, error: `내용은 2~${maxBody}자로 적어 주세요.` };
  if (companyId && !getCompany(companyId)) return { ok: false, error: "관련 기관을 다시 골라 주세요." };
  if (!admin) {
    const err = checkAuthor(nickname, password) ?? checkText(`${title}\n${body}`);
    if (err) return { ok: false, error: err };
  }

  const who = await requester();
  if (!admin && !(await rateLimit("post", who.hash, 30))) {
    return { ok: false, error: "글은 30초에 한 번 쓸 수 있어요. 잠시 후 다시 시도해 주세요." };
  }

  const client = await db();
  const now = Date.now();
  const res = await client.execute({
    sql: `INSERT INTO posts (category, company_id, title, body, nickname, pw_hash, ip_hash, ip_prefix, is_admin, is_notice, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      category,
      companyId,
      title,
      body,
      nickname,
      admin ? null : hashPassword(password),
      who.hash,
      who.prefix,
      admin ? 1 : 0,
      notice || category === "notice" ? 1 : 0,
      now,
      now,
    ],
  });
  revalidatePath("/board");
  redirect(`/board/${Number(res.lastInsertRowid)}`);
}

async function canModify(postId: number, password: string): Promise<boolean> {
  if (await isAdmin()) return true;
  const secret = await getPostSecret(postId);
  if (!secret || secret.isAdmin) return false;
  return verifyPassword(password, secret.pwHash);
}

export async function updatePost(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const id = Number(fd.get("id"));
  const title = str(fd, "title");
  const body = str(fd, "body");
  const category = str(fd, "category");
  if (!Number.isInteger(id)) return { ok: false, error: "잘못된 요청입니다." };
  const admin = await isAdmin();
  if (!isBoardCategory(category) || (category === "notice" && !admin)) return { ok: false, error: "말머리를 골라 주세요." };
  if (title.length < 2 || title.length > LIMITS.title) return { ok: false, error: `제목은 2~${LIMITS.title}자로 적어 주세요.` };
  const maxBody = admin ? LIMITS.adminBody : LIMITS.body;
  if (body.length < 2 || body.length > maxBody) return { ok: false, error: `내용은 2~${maxBody}자로 적어 주세요.` };
  if (!admin) {
    const err = checkText(`${title}\n${body}`);
    if (err) return { ok: false, error: err };
  }
  if (!(await canModify(id, str(fd, "password")))) return { ok: false, error: "비밀번호가 맞지 않아요." };

  const client = await db();
  await client.execute({
    sql: "UPDATE posts SET title = ?, body = ?, category = ?, updated_at = ? WHERE id = ?",
    args: [title, body, category, Date.now(), id],
  });
  revalidatePath("/board");
  redirect(`/board/${id}`);
}

export async function deletePost(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const id = Number(fd.get("id"));
  if (!Number.isInteger(id)) return { ok: false, error: "잘못된 요청입니다." };
  if (!(await canModify(id, str(fd, "password")))) return { ok: false, error: "비밀번호가 맞지 않아요." };
  const client = await db();
  await client.execute({ sql: "UPDATE posts SET status = ?, updated_at = ? WHERE id = ?", args: [STATUS.deleted, Date.now(), id] });
  revalidatePath("/board");
  redirect("/board");
}

/** 조회수: 같은 IP 는 글마다 10분에 한 번만 */
export async function recordView(postId: number): Promise<void> {
  if (!Number.isInteger(postId)) return;
  const who = await requester();
  if (await rateLimit(`view:${postId}`, who.hash, 600)) await incrementViews(postId);
}

/* ------------------------------------------------------------------ */
/* 댓글                                                                 */
/* ------------------------------------------------------------------ */

export async function addComment(_prev: ActionState, fd: FormData): Promise<ActionState> {
  if (str(fd, "website")) return { ok: false, error: "잘못된 요청입니다." };
  const admin = await isAdmin();
  const postId = Number(fd.get("postId"));
  const body = str(fd, "body");
  const nickname = admin ? ADMIN_NICKNAME : str(fd, "nickname") || "ㅇㅇ";
  const password = str(fd, "password");
  if (!Number.isInteger(postId)) return { ok: false, error: "잘못된 요청입니다." };
  if (body.length < 1 || body.length > LIMITS.comment) return { ok: false, error: `댓글은 ${LIMITS.comment}자 이내로 적어 주세요.` };
  if (!admin) {
    const err = checkAuthor(nickname, password) ?? checkText(body);
    if (err) return { ok: false, error: err };
  }

  const client = await db();
  const post = await client.execute({ sql: "SELECT id FROM posts WHERE id = ? AND status = ?", args: [postId, STATUS.visible] });
  if (!post.rows.length) return { ok: false, error: "댓글을 달 수 없는 글이에요." };

  const who = await requester();
  if (!admin && !(await rateLimit("comment", who.hash, 10))) {
    return { ok: false, error: "댓글은 10초에 한 번 쓸 수 있어요." };
  }
  await client.batch(
    [
      {
        sql: `INSERT INTO comments (post_id, body, nickname, pw_hash, ip_hash, ip_prefix, is_admin, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [postId, body, nickname, admin ? null : hashPassword(password), who.hash, who.prefix, admin ? 1 : 0, Date.now()],
      },
      { sql: "UPDATE posts SET comment_count = comment_count + 1 WHERE id = ?", args: [postId] },
    ],
    "write",
  );
  refresh();
  return { ok: true };
}

export async function deleteComment(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const id = Number(fd.get("id"));
  if (!Number.isInteger(id)) return { ok: false, error: "잘못된 요청입니다." };
  const client = await db();
  const row = (await client.execute({ sql: "SELECT post_id, pw_hash, is_admin FROM comments WHERE id = ? AND status != ?", args: [id, STATUS.deleted] })).rows[0];
  if (!row) return { ok: false, error: "이미 삭제된 댓글이에요." };
  const admin = await isAdmin();
  const allowed = admin || (!row.is_admin && verifyPassword(str(fd, "password"), (row.pw_hash as string | null) ?? null));
  if (!allowed) return { ok: false, error: "비밀번호가 맞지 않아요." };
  await client.batch(
    [
      { sql: "UPDATE comments SET status = ? WHERE id = ?", args: [STATUS.deleted, id] },
      { sql: "UPDATE posts SET comment_count = MAX(comment_count - 1, 0) WHERE id = ?", args: [Number(row.post_id)] },
    ],
    "write",
  );
  refresh();
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* 추천 · 신고                                                           */
/* ------------------------------------------------------------------ */

export async function likePost(postId: number): Promise<{ likes: number; already: boolean }> {
  const client = await db();
  const who = await requester();
  const ins = await client.execute({ sql: "INSERT OR IGNORE INTO post_likes (post_id, voter) VALUES (?, ?)", args: [postId, who.hash] });
  if (ins.rowsAffected) {
    await client.execute({ sql: "UPDATE posts SET likes = likes + 1 WHERE id = ?", args: [postId] });
    refresh(); // 글 머리의 추천 수도 함께 갱신
  }
  const row = (await client.execute({ sql: "SELECT likes FROM posts WHERE id = ?", args: [postId] })).rows[0];
  return { likes: Number(row?.likes ?? 0), already: !ins.rowsAffected };
}

const REPORT_TABLE = { post: "posts", comment: "comments", review: "exam_reviews" } as const;
export type ReportTarget = keyof typeof REPORT_TABLE;

export async function reportItem(type: ReportTarget, id: number, reason: string): Promise<{ ok: boolean; already: boolean }> {
  const table = REPORT_TABLE[type];
  if (!table || !Number.isInteger(id)) return { ok: false, already: false };
  const client = await db();
  const who = await requester();
  const ins = await client.execute({
    sql: "INSERT OR IGNORE INTO reports (target_type, target_id, reporter, reason, created_at) VALUES (?, ?, ?, ?, ?)",
    args: [type, id, who.hash, reason.slice(0, 100) || null, Date.now()],
  });
  if (!ins.rowsAffected) return { ok: true, already: true };
  await client.execute({
    sql: `UPDATE ${table} SET reports = reports + 1,
          status = CASE WHEN status = ? AND reports + 1 >= ? THEN ? ELSE status END WHERE id = ?`,
    args: [STATUS.visible, AUTO_HIDE_REPORTS, STATUS.hidden, id],
  });
  return { ok: true, already: false };
}
