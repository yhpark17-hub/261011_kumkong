"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isDateKey, isIssueEdition, parseExtras, parseQuiz, parseThumb, type IssueExtras, type QuizItem } from "@/lib/news-meta";
import { ISSUE_ITEMS_WHERE, publishIssue, renumberVols, setAutoPublish } from "@/lib/server/briefing";
import { db } from "@/lib/server/db";
import { isAdmin } from "@/lib/server/security";
import { ART_LIMITS } from "@/lib/thumb-art";

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
  if (!isIssueEdition(edition)) return { ok: false, error: "금콩 브리핑(아침판)·금콩 스터디(점심판) 중에 골라 주세요." };
  if (title.length < 4) return { ok: false, error: "제목을 적어 주세요. (목록·카드에 쓰여요)" };
  if (lede.length < 20) return { ok: false, error: "오늘의 흐름을 20자 이상 적어 주세요." };
  const { quiz, error } = readQuiz(fd);
  if (error) return { ok: false, error };
  const extras = edition === "noon" ? readExtras(fd) : parseExtras({});

  const client = await db();
  const now = Date.now();
  const clash = await client.execute({ sql: "SELECT id FROM briefing_issues WHERE issue_date = ? AND edition = ? AND id != ?", args: [date, edition, id ?? 0] });
  if (clash.rows.length) return { ok: false, error: "그 날짜·판에는 이미 브리핑이 있어요. 하루에 금콩 브리핑·금콩 스터디 한 호씩만 낼 수 있어요." };

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
    await publishIssue(id);
  } else if (op === "unpublish") {
    await client.batch(
      [
        { sql: "UPDATE briefing_issues SET status = 0, published_at = NULL, updated_at = ? WHERE id = ?", args: [now, id] },
        { sql: `UPDATE news SET status = 0, published_at = NULL, updated_at = ? WHERE ${ISSUE_ITEMS_WHERE[edition]}`, args: [now, date] },
      ],
      "write",
    );
    await renumberVols(edition);
  } else if (op === "delete") {
    await client.execute({ sql: "DELETE FROM briefing_issues WHERE id = ?", args: [id] });
    await renumberVols(edition);
    revalidateBriefings();
    redirect("/admin/news");
  }
  revalidateBriefings();
}

/** 자동 발행 켜고 끄기 — 켜면 자동 점검이 만든 브리핑이 확인 없이 바로 공개돼요 */
export async function toggleAutoPublish(fd: FormData): Promise<void> {
  if (!(await isAdmin())) redirect("/admin/login");
  await setAutoPublish(fd.get("on") === "1");
  revalidatePath("/admin/news");
}

export type ThumbFormState = { ok: boolean; error?: string; savedAt?: number };

/**
 * 썸네일 저장 — 만화 변장·표정·말풍선·아래 띠(아침판) / 논술 주제(금콩 스터디) / 올린 그림 / 사이트 표지 / 확인 표시.
 * 저장하면 수정 시각이 바뀌어 공유 썸네일 주소(?v=)도 새로 바뀌어요 (카톡이 새 그림을 가져가게).
 */
export async function saveIssueThumb(_prev: ThumbFormState, fd: FormData): Promise<ThumbFormState> {
  if (!(await isAdmin())) return { ok: false, error: "운영자 로그인이 필요해요." };
  const id = Number(fd.get("id"));
  if (!Number.isInteger(id) || id <= 0) return { ok: false, error: "브리핑을 찾을 수 없어요." };
  const thumb = parseThumb({
    scene: str(fd, "scene", 20),
    kong: str(fd, "kong", 4),
    costume: str(fd, "costume", 20),
    mood: str(fd, "mood", 10),
    bubble: str(fd, "bubble", 200),
    caption: str(fd, "caption", 200),
    topic: str(fd, "topic", 400),
    shareUrl: str(fd, "shareUrl", 500),
    cover: str(fd, "cover", 10),
    coverUrl: str(fd, "coverUrl", 500),
    checked: fd.get("checked") === "on",
    layout: str(fd, "layout", 10),
    stats: String(fd.get("stats") ?? "").slice(0, 200),
    art: String(fd.get("art") ?? "").slice(0, ART_LIMITS.svg + 8000),
  });
  if (str(fd, "cover", 10) === "upload" && !thumb.coverUrl) return { ok: false, error: "사이트 표지로 쓸 그림을 먼저 올려 주세요." };
  if (str(fd, "art", 10) && !thumb.art) return { ok: false, error: "직접 그린 그림(JSON)을 읽을 수 없어요. svg 가 있는지, JSON 형식이 맞는지 확인해 주세요." };
  const client = await db();
  const res = await client.execute({ sql: "UPDATE briefing_issues SET thumb = ?, updated_at = ? WHERE id = ?", args: [JSON.stringify(thumb), Date.now(), id] });
  if (!res.rowsAffected) return { ok: false, error: "브리핑을 찾을 수 없어요." };
  revalidateBriefings();
  revalidatePath(`/admin/news/issue/${id}`);
  return { ok: true, savedAt: Date.now() };
}
