"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isDateKey } from "@/lib/news-meta";
import { db } from "@/lib/server/db";
import { isAdmin } from "@/lib/server/security";

export type IssueFormState = { ok: boolean; error?: string; savedAt?: number };

const str = (fd: FormData, key: string, max: number) => String(fd.get(key) ?? "").replace(/\r\n?/g, "\n").trim().slice(0, max);

function revalidateLetters(date?: string) {
  revalidatePath("/magazine");
  revalidatePath("/magazine/archive");
  if (date) revalidatePath(`/magazine/letter/${date}`);
  revalidatePath("/");
  revalidatePath("/admin/news");
}

/** 레터(호) 저장 — 제목·여는 글·맺는 말. 새로 만들면 편집 화면으로 */
export async function saveIssue(_prev: IssueFormState, fd: FormData): Promise<IssueFormState> {
  if (!(await isAdmin())) return { ok: false, error: "운영자 로그인이 필요해요." };
  const id = Number(fd.get("id")) || null;
  const date = str(fd, "date", 10);
  const title = str(fd, "title", 120);
  const lede = str(fd, "lede", 1200);
  const closing = str(fd, "closing", 400);
  if (!isDateKey(date)) return { ok: false, error: "레터 날짜를 골라 주세요." };
  if (title.length < 4) return { ok: false, error: "제목을 적어 주세요." };
  if (lede.length < 20) return { ok: false, error: "여는 글을 20자 이상 적어 주세요." };

  const client = await db();
  const now = Date.now();
  const clash = await client.execute({ sql: "SELECT id FROM briefing_issues WHERE issue_date = ? AND id != ?", args: [date, id ?? 0] });
  if (clash.rows.length) return { ok: false, error: "그 날짜에는 이미 레터가 있어요. 하루에 한 호만 낼 수 있어요." };

  if (id) {
    const prev = (await client.execute({ sql: "SELECT issue_date FROM briefing_issues WHERE id = ?", args: [id] })).rows[0];
    if (!prev) return { ok: false, error: "이미 지워진 레터예요." };
    await client.execute({
      sql: "UPDATE briefing_issues SET issue_date = ?, title = ?, lede = ?, closing = ?, updated_at = ? WHERE id = ?",
      args: [date, title, lede, closing, now, id],
    });
    revalidateLetters(date);
    if (String(prev.issue_date) !== date) revalidatePath(`/magazine/letter/${prev.issue_date}`);
    return { ok: true, savedAt: now };
  }

  const res = await client.execute({
    sql: "INSERT INTO briefing_issues (issue_date, title, lede, closing, status, origin, created_at, updated_at) VALUES (?, ?, ?, ?, 0, 'admin', ?, ?)",
    args: [date, title, lede, closing, now, now],
  });
  revalidateLetters(date);
  redirect(`/admin/news/issue/${Number(res.lastInsertRowid)}`);
}

/**
 * 레터 발행·내리기·지우기 (target="publish:3")
 * - 발행: 호수(Vol)를 처음 한 번 정하고, 그날 기사도 모두 공개
 * - 내리기: 레터와 그날 기사를 다시 초안으로
 * - 지우기: 레터만 지움 (그날 기사는 초안으로 남음)
 */
export async function issueAction(fd: FormData): Promise<void> {
  if (!(await isAdmin())) redirect("/admin/login");
  const [op, raw] = String(fd.get("target") ?? "").split(":");
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) return;
  const client = await db();
  const row = (await client.execute({ sql: "SELECT issue_date, vol, published_at FROM briefing_issues WHERE id = ?", args: [id] })).rows[0];
  if (!row) return;
  const date = String(row.issue_date);
  const now = Date.now();

  if (op === "publish") {
    let vol = Number(row.vol ?? 0);
    if (!vol) vol = Number((await client.execute("SELECT COALESCE(MAX(vol), 0) + 1 AS v FROM briefing_issues")).rows[0]?.v ?? 1);
    await client.batch(
      [
        { sql: "UPDATE briefing_issues SET status = 1, vol = ?, published_at = COALESCE(published_at, ?), updated_at = ? WHERE id = ?", args: [vol, now, now, id] },
        { sql: "UPDATE news SET status = 1, published_at = COALESCE(published_at, ?), updated_at = ? WHERE edition_date = ? AND status = 0", args: [now, now, date] },
      ],
      "write",
    );
  } else if (op === "unpublish") {
    await client.batch(
      [
        { sql: "UPDATE briefing_issues SET status = 0, published_at = NULL, updated_at = ? WHERE id = ?", args: [now, id] },
        { sql: "UPDATE news SET status = 0, published_at = NULL, updated_at = ? WHERE edition_date = ?", args: [now, date] },
      ],
      "write",
    );
  } else if (op === "delete") {
    await client.execute({ sql: "DELETE FROM briefing_issues WHERE id = ?", args: [id] });
    revalidateLetters(date);
    redirect("/admin/news");
  }
  revalidateLetters(date);
}
