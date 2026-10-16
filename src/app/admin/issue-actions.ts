"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isDateKey, isIssueEdition, parseExtras, parseQuiz, type IssueExtras, type QuizItem } from "@/lib/news-meta";
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

/** 금콩 스터디 코너 칸(num0_v·num0_l·num0_n …, essay_topic …) → 숫자로 보는 오늘·논술 한 문단 */
function readExtras(fd: FormData): IssueExtras {
  const numbers = [0, 1, 2, 3].map((i) => ({ value: str(fd, `num${i}_v`, 24), label: str(fd, `num${i}_l`, 80), note: str(fd, `num${i}_n`, 160) }));
  const essay = {
    topic: str(fd, "essay_topic", 200),
    intro: str(fd, "essay_intro", 600),
    body: str(fd, "essay_body", 900),
    conclusion: str(fd, "essay_conclusion", 600),
    evidence: str(fd, "essay_evidence", 1000).split("\n").map((l) => l.replace(/^[-·•\s]+/, "").trim()).filter(Boolean),
  };
  return parseExtras({ numbers, essay });
}

/** 브리핑(호) 저장 — 날짜·판·제목·오늘의 흐름·맺는 말·퀴즈(·금콩 스터디 코너). 새로 만들면 편집 화면으로 */
export async function saveIssue(_prev: IssueFormState, fd: FormData): Promise<IssueFormState> {
  if (!(await isAdmin())) return { ok: false, error: "운영자 로그인이 필요해요." };
  const id = Number(fd.get("id")) || null;
  const date = str(fd, "date", 10);
  const edition = str(fd, "edition", 10);
  const title = str(fd, "title", 120);
  const lede = str(fd, "lede", 1200);
  const closing = str(fd, "closing", 400);
  if (!isDateKey(date)) return { ok: false, error: "브리핑 날짜를 골라 주세요." };
  if (!isIssueEdition(edition)) return { ok: false, error: "아침판·금콩 스터디를 골라 주세요." };
  if (title.length < 4) return { ok: false, error: "제목을 적어 주세요. (목록·카드에 쓰여요)" };
  if (lede.length < 20) return { ok: false, error: "오늘의 흐름을 20자 이상 적어 주세요." };
  const { quiz, error } = readQuiz(fd);
  if (error) return { ok: false, error };
  const extras = edition === "noon" ? readExtras(fd) : parseExtras({});

  const client = await db();
  const now = Date.now();
  const clash = await client.execute({ sql: "SELECT id FROM briefing_issues WHERE issue_date = ? AND edition = ? AND id != ?", args: [date, edition, id ?? 0] });
  if (clash.rows.length) return { ok: false, error: "그 날짜·판에는 이미 브리핑이 있어요. 하루에 아침판·금콩 스터디 한 호씩만 낼 수 있어요." };

  if (id) {
    const prev = (await client.execute({ sql: "SELECT id FROM briefing_issues WHERE id = ?", args: [id] })).rows[0];
    if (!prev) return { ok: false, error: "이미 지워진 브리핑이에요." };
    await client.execute({
      sql: "UPDATE briefing_issues SET issue_date = ?, edition = ?, title = ?, lede = ?, closing = ?, quiz = ?, extras = ?, updated_at = ? WHERE id = ?",
      args: [date, edition, title, lede, closing, JSON.stringify(quiz), JSON.stringify(extras), now, id],
    });
    revalidateBriefings();
    return { ok: true, savedAt: now };
  }

  const res = await client.execute({
    sql: "INSERT INTO briefing_issues (issue_date, edition, title, lede, closing, quiz, extras, status, origin, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, 0, 'admin', ?, ?)",
    args: [date, edition, title, lede, closing, JSON.stringify(quiz), JSON.stringify(extras), now, now],
  });
  revalidateBriefings();
  redirect(`/admin/news/issue/${Number(res.lastInsertRowid)}`);
}

/** 그 호에 실리는 기사 조건 (아침판 = 아침판 기사, 금콩 스터디 = 그날 용어·면접 질문) */
const ITEMS_OF = {
  morning: "edition_date = ? AND edition = 'morning' AND section NOT IN ('term', 'question')",
  noon: "edition_date = ? AND section IN ('term', 'question')",
} as const;

/** 판별 호수(Vol)를 날짜 순서대로 다시 매김 — 발행된 호만 1부터, 초안은 0. 지난 날짜 호를 나중에 발행해도 순서가 맞아요 */
async function renumberVols(client: Awaited<ReturnType<typeof db>>, edition: "morning" | "noon"): Promise<void> {
  await client.batch(
    [
      {
        sql: `UPDATE briefing_issues SET vol = (SELECT COUNT(*) FROM briefing_issues b WHERE b.edition = briefing_issues.edition AND b.status = 1 AND b.issue_date <= briefing_issues.issue_date)
              WHERE edition = ? AND status = 1`,
        args: [edition],
      },
      { sql: "UPDATE briefing_issues SET vol = 0 WHERE edition = ? AND status = 0", args: [edition] },
    ],
    "write",
  );
}

/**
 * 브리핑 발행·내리기·지우기 (target="publish:3")
 * - 발행: 그 호의 기사도 모두 공개, 판별 호수(Vol)는 날짜 순서대로 다시 매김
 * - 내리기: 브리핑과 그 호의 기사를 다시 초안으로
 * - 지우기: 브리핑만 지움 (기사는 초안으로 남음)
 */
export async function issueAction(fd: FormData): Promise<void> {
  if (!(await isAdmin())) redirect("/admin/login");
  const [op, raw] = String(fd.get("target") ?? "").split(":");
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) return;
  const client = await db();
  const row = (await client.execute({ sql: "SELECT issue_date, edition FROM briefing_issues WHERE id = ?", args: [id] })).rows[0];
  if (!row) return;
  const date = String(row.issue_date);
  const edition = isIssueEdition(row.edition) ? row.edition : "morning";
  const now = Date.now();

  if (op === "publish") {
    await client.batch(
      [
        { sql: "UPDATE briefing_issues SET status = 1, published_at = COALESCE(published_at, ?), updated_at = ? WHERE id = ?", args: [now, now, id] },
        { sql: `UPDATE news SET status = 1, published_at = COALESCE(published_at, ?), updated_at = ? WHERE ${ITEMS_OF[edition]} AND status = 0`, args: [now, now, date] },
      ],
      "write",
    );
    await renumberVols(client, edition);
  } else if (op === "unpublish") {
    await client.batch(
      [
        { sql: "UPDATE briefing_issues SET status = 0, published_at = NULL, updated_at = ? WHERE id = ?", args: [now, id] },
        { sql: `UPDATE news SET status = 0, published_at = NULL, updated_at = ? WHERE ${ITEMS_OF[edition]}`, args: [now, date] },
      ],
      "write",
    );
    await renumberVols(client, edition);
  } else if (op === "delete") {
    await client.execute({ sql: "DELETE FROM briefing_issues WHERE id = ?", args: [id] });
    await renumberVols(client, edition);
    revalidateBriefings();
    redirect("/admin/news");
  }
  revalidateBriefings();
}
