"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isDateKey, isIssueEdition, parseQuiz, type QuizItem } from "@/lib/news-meta";
import { db } from "@/lib/server/db";
import { isAdmin } from "@/lib/server/security";

export type IssueFormState = { ok: boolean; error?: string; savedAt?: number };

const str = (fd: FormData, key: string, max: number) => String(fd.get(key) ?? "").replace(/\r\n?/g, "\n").trim().slice(0, max);

function revalidateBriefings() {
  revalidatePath("/magazine");
  revalidatePath("/magazine/archive");
  revalidatePath("/magazine/letter/[date]/[edition]", "page");
  revalidatePath("/");
  revalidatePath("/admin/news");
}

/** 퀴즈 칸(quiz0_q, quiz0_o0~3, quiz0_a, quiz0_e …) → 퀴즈 목록. 질문이 빈 칸은 건너뜀 */
function readQuiz(fd: FormData): { quiz: QuizItem[]; error?: string } {
  const out: QuizItem[] = [];
  for (let i = 0; i < 5; i++) {
    const question = str(fd, `quiz${i}_q`, 300);
    if (!question) continue;
    const raw = [0, 1, 2, 3].map((k) => str(fd, `quiz${i}_o${k}`, 120));
    const options = raw.filter(Boolean);
    if (options.length < 2) return { quiz: [], error: `퀴즈 ${i + 1}번: 보기를 2개 이상 적어 주세요.` };
    const answerRaw = Number(fd.get(`quiz${i}_a`));
    const answerText = raw[answerRaw];
    if (!answerText) return { quiz: [], error: `퀴즈 ${i + 1}번: 정답으로 고른 보기가 비어 있어요.` };
    out.push({ question, options, answer: options.indexOf(answerText), explain: str(fd, `quiz${i}_e`, 500) });
  }
  return { quiz: parseQuiz(out) };
}

/** 브리핑(호) 저장 — 날짜·판·제목·오늘의 흐름·맺는 말·퀴즈. 새로 만들면 편집 화면으로 */
export async function saveIssue(_prev: IssueFormState, fd: FormData): Promise<IssueFormState> {
  if (!(await isAdmin())) return { ok: false, error: "운영자 로그인이 필요해요." };
  const id = Number(fd.get("id")) || null;
  const date = str(fd, "date", 10);
  const edition = str(fd, "edition", 10);
  const title = str(fd, "title", 120);
  const lede = str(fd, "lede", 1200);
  const closing = str(fd, "closing", 400);
  if (!isDateKey(date)) return { ok: false, error: "브리핑 날짜를 골라 주세요." };
  if (!isIssueEdition(edition)) return { ok: false, error: "아침판·점심판을 골라 주세요." };
  if (title.length < 4) return { ok: false, error: "제목을 적어 주세요. (목록·카드에 쓰여요)" };
  if (lede.length < 20) return { ok: false, error: "오늘의 흐름을 20자 이상 적어 주세요." };
  const { quiz, error } = edition === "morning" ? readQuiz(fd) : { quiz: [] as QuizItem[], error: undefined };
  if (error) return { ok: false, error };

  const client = await db();
  const now = Date.now();
  const clash = await client.execute({ sql: "SELECT id FROM briefing_issues WHERE issue_date = ? AND edition = ? AND id != ?", args: [date, edition, id ?? 0] });
  if (clash.rows.length) return { ok: false, error: "그 날짜·판에는 이미 브리핑이 있어요. 하루에 아침판·점심판 한 호씩만 낼 수 있어요." };

  if (id) {
    const prev = (await client.execute({ sql: "SELECT id FROM briefing_issues WHERE id = ?", args: [id] })).rows[0];
    if (!prev) return { ok: false, error: "이미 지워진 브리핑이에요." };
    await client.execute({
      sql: "UPDATE briefing_issues SET issue_date = ?, edition = ?, title = ?, lede = ?, closing = ?, quiz = ?, updated_at = ? WHERE id = ?",
      args: [date, edition, title, lede, closing, JSON.stringify(quiz), now, id],
    });
    revalidateBriefings();
    return { ok: true, savedAt: now };
  }

  const res = await client.execute({
    sql: "INSERT INTO briefing_issues (issue_date, edition, title, lede, closing, quiz, status, origin, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 0, 'admin', ?, ?)",
    args: [date, edition, title, lede, closing, JSON.stringify(quiz), now, now],
  });
  revalidateBriefings();
  redirect(`/admin/news/issue/${Number(res.lastInsertRowid)}`);
}

/** 그 호에 실리는 기사 조건 (아침판 = 아침판 기사, 점심판 = 그날 용어·면접 질문) */
const ITEMS_OF = {
  morning: "edition_date = ? AND edition = 'morning' AND section NOT IN ('term', 'question')",
  noon: "edition_date = ? AND section IN ('term', 'question')",
} as const;

/**
 * 브리핑 발행·내리기·지우기 (target="publish:3")
 * - 발행: 판별 호수(Vol)를 처음 한 번 정하고, 그 호의 기사도 모두 공개
 * - 내리기: 브리핑과 그 호의 기사를 다시 초안으로
 * - 지우기: 브리핑만 지움 (기사는 초안으로 남음)
 */
export async function issueAction(fd: FormData): Promise<void> {
  if (!(await isAdmin())) redirect("/admin/login");
  const [op, raw] = String(fd.get("target") ?? "").split(":");
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) return;
  const client = await db();
  const row = (await client.execute({ sql: "SELECT issue_date, edition, vol FROM briefing_issues WHERE id = ?", args: [id] })).rows[0];
  if (!row) return;
  const date = String(row.issue_date);
  const edition = isIssueEdition(row.edition) ? row.edition : "morning";
  const now = Date.now();

  if (op === "publish") {
    let vol = Number(row.vol ?? 0);
    if (!vol) {
      vol = Number((await client.execute({ sql: "SELECT COALESCE(MAX(vol), 0) + 1 AS v FROM briefing_issues WHERE edition = ?", args: [edition] })).rows[0]?.v ?? 1);
    }
    await client.batch(
      [
        { sql: "UPDATE briefing_issues SET status = 1, vol = ?, published_at = COALESCE(published_at, ?), updated_at = ? WHERE id = ?", args: [vol, now, now, id] },
        { sql: `UPDATE news SET status = 1, published_at = COALESCE(published_at, ?), updated_at = ? WHERE ${ITEMS_OF[edition]} AND status = 0`, args: [now, now, date] },
      ],
      "write",
    );
  } else if (op === "unpublish") {
    await client.batch(
      [
        { sql: "UPDATE briefing_issues SET status = 0, published_at = NULL, updated_at = ? WHERE id = ?", args: [now, id] },
        { sql: `UPDATE news SET status = 0, published_at = NULL, updated_at = ? WHERE ${ITEMS_OF[edition]}`, args: [now, date] },
      ],
      "write",
    );
  } else if (op === "delete") {
    await client.execute({ sql: "DELETE FROM briefing_issues WHERE id = ?", args: [id] });
    revalidateBriefings();
    redirect("/admin/news");
  }
  revalidateBriefings();
}
