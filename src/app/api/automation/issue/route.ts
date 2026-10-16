import { revalidatePath } from "next/cache";
import { connection } from "next/server";
import { addDays, todayKST } from "@/lib/date";
import { isIssueEdition, isNewsSection, kindOf, parseExtras, parseQuiz } from "@/lib/news-meta";
import { automationAuthorized, json, unauthorized } from "@/lib/server/automation";
import { morningForAutomation } from "@/lib/server/briefing";
import { db, dbConfigured } from "@/lib/server/db";

/**
 * 데일리 브리핑 초안 한 호 올리기 — 항상 '초안 · 자동'으로만 들어가고 운영자가 확인 후 발행합니다.
 *
 * 아침판 { edition: "morning", title, lede, closing?, items: [기사 6~8건], quiz: [3~4문제] }
 *   - 기사: { section: finance|economy|policy|global|public, headline?: true, title, takeaway, summary, point, sourceName, sourceUrl }
 *     헤드라인(headline: true) 정확히 1건. 모든 기사에 원문 링크·한 줄 요약
 *   - 퀴즈: { question, options: [2~4개], answer: 정답 보기 번호(0부터), explain } — 그날 기사 내용으로만
 * 점심판 { edition: "noon", title, lede, closing?, numbers: [3개], items: [용어 2~3개, 면접 질문 1~2개], essay, quiz: [O/X 3문제] }
 *   - 숫자로 보는 오늘: { value: "7.57%", label: "15일 코스피 하락률", note? } — 아침판 기사에 나온 숫자만
 *   - 용어: { section: "term", title, summary, point, body(헷갈리는 짝꿍 비교 표, 마크다운), sourceName?, sourceUrl? } — 최근 90일 안에 다룬 용어는 거절
 *   - 질문: { section: "question", title, summary, body(답변 뼈대), point, sourceName?, sourceUrl? }
 *   - 논술 한 문단: { topic, intro, body, conclusion, evidence: [근거 1~4개] }
 *   - 점심 퀴즈: { question, options: ["O", "X"], answer, explain } 3문제
 * 그날 그 판이 이미 있으면 아무것도 바꾸지 않고 skipped. 하나라도 틀리면 아무것도 저장하지 않고 errors.
 */

type Raw = Record<string, unknown>;
const LIMITS = {
  morning: { min: 6, max: 8 },
  terms: { min: 2, max: 3 },
  questions: { min: 1, max: 2 },
  quiz: { min: 3, max: 4 },
  numbers: { min: 2, max: 4 },
  noonQuiz: { min: 2, max: 4 },
};

/** 점심판을 만들 때 그날 아침판 기사 보기 */
export async function GET(req: Request) {
  await connection();
  if (!automationAuthorized(req)) return unauthorized();
  if (!dbConfigured()) return json({ error: "DB 없음" }, 503);
  const date = todayKST();
  const { issue, items } = await morningForAutomation(date);
  return json({
    date,
    morning: issue ? { title: issue.title, lede: issue.lede, status: issue.status === 1 ? "published" : "draft" } : null,
    items: items.map((n) => ({ section: n.section, title: n.title, takeaway: n.takeaway, summary: n.summary, sourceName: n.sourceName, sourceUrl: n.sourceUrl })),
  });
}

export async function POST(req: Request) {
  if (!automationAuthorized(req)) return unauthorized();
  if (!dbConfigured()) return json({ error: "DB 없음" }, 503);
  const b = (await req.json().catch(() => null)) as Raw | null;
  if (!b) return json({ error: "JSON 본문이 필요해요" }, 400);

  const s = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/\r\n?/g, "\n").trim().slice(0, max) : "");
  const url = (v: unknown) => {
    const u = s(v, 500);
    return /^https?:\/\/[^\s/]+\.\S+$/i.test(u) ? u : null;
  };
  const date = todayKST();
  const edition = b.edition;
  if (!isIssueEdition(edition)) return json({ date, ok: false, errors: ['edition 은 "morning"(아침판) 또는 "noon"(점심판)이에요'] }, 400);
  const title = s(b.title, 120);
  const lede = s(b.lede, 1200);
  const closing = s(b.closing, 400);
  const raw = Array.isArray(b.items) ? (b.items as Raw[]).slice(0, 20) : [];

  const errors: string[] = [];
  if (title.length < 4) errors.push("title(목록·카드에 보이는 제목)이 필요해요");
  if (lede.length < 30) errors.push("lede(오늘의 흐름)를 30자 이상 써 주세요");

  let headlines = 0;
  const rows = raw.map((it, i) => {
    const where = `items[${i}]`;
    const section = it.section;
    if (!isNewsSection(section)) {
      errors.push(`${where}: section 이 올바르지 않아요`);
      return null;
    }
    const kind = kindOf(section);
    const row = {
      section,
      title: s(it.title, 140),
      summary: s(it.summary, 1500),
      point: s(it.point, 600),
      body: s(it.body, 8000),
      takeaway: s(it.takeaway, 160),
      sourceName: s(it.sourceName, 60),
      sourceUrl: url(it.sourceUrl),
      headline: 0,
      position: i,
    };
    if (row.title.length < (kind === "term" ? 2 : 4)) errors.push(`${where}: title 이 너무 짧아요`);
    if (row.summary.length < 20) errors.push(`${where}: summary 를 20자 이상 써 주세요`);
    if (edition === "morning") {
      if (kind !== "news") errors.push(`${where}: 아침판에는 기사(finance·economy·policy·global·public)만 넣어요. 용어·면접 질문은 점심판에`);
      if (!row.sourceUrl) errors.push(`${where}: 기사는 sourceUrl(직접 연 원문 링크)이 필요해요`);
      if (row.takeaway.length < 8) errors.push(`${where}: takeaway(한 줄 요약)가 필요해요`);
      if (row.point.length < 10) errors.push(`${where}: point(왜 중요할까·필기·면접 포인트)가 필요해요`);
      if (it.headline === true || it.tier === "headline") {
        row.headline = 1;
        headlines++;
      }
    } else {
      if (kind === "news") errors.push(`${where}: 점심판에는 용어(term)·면접 질문(question)만 넣어요`);
      if (kind === "question" && row.body.length < 10) errors.push(`${where}: 면접 질문은 body(답변 뼈대)가 필요해요`);
    }
    return row;
  });
  const ok = rows.filter((r): r is NonNullable<typeof r> => Boolean(r));

  const rawQuiz = Array.isArray(b.quiz) ? b.quiz : [];
  const quiz = parseQuiz(rawQuiz);
  if (quiz.length !== rawQuiz.length) errors.push("quiz: 질문·보기(2~4개)·정답 번호(answer, 0부터)를 확인해 주세요");
  if (quiz.some((q) => q.explain.length < 10)) errors.push("quiz: 문제마다 explain(해설)을 써 주세요");
  const extras = edition === "noon" ? parseExtras({ numbers: b.numbers, essay: b.essay }) : parseExtras({});
  if (edition === "morning") {
    const n = ok.length;
    if (n < LIMITS.morning.min || n > LIMITS.morning.max) errors.push(`아침판 기사는 ${LIMITS.morning.min}~${LIMITS.morning.max}건이에요 (지금 ${n}건)`);
    if (headlines !== 1) errors.push(`헤드라인(headline: true)은 정확히 1건이어야 해요 (지금 ${headlines}건)`);
    if (quiz.length < LIMITS.quiz.min || quiz.length > LIMITS.quiz.max) errors.push(`퀴즈는 ${LIMITS.quiz.min}~${LIMITS.quiz.max}문제예요 (지금 ${quiz.length}문제)`);
  } else {
    const rawNumbers = Array.isArray(b.numbers) ? b.numbers : [];
    if (extras.numbers.length !== rawNumbers.length) errors.push("numbers: 숫자마다 value(숫자)와 label(무슨 숫자)을 써 주세요");
    if (extras.numbers.length < LIMITS.numbers.min || extras.numbers.length > LIMITS.numbers.max)
      errors.push(`숫자로 보는 오늘은 ${LIMITS.numbers.min}~${LIMITS.numbers.max}개예요 (권장 3개, 지금 ${extras.numbers.length}개)`);
    const e = extras.essay;
    if (!e || e.topic.length < 8 || e.intro.length < 10 || e.body.length < 10 || e.conclusion.length < 10)
      errors.push("essay: 논술 한 문단의 topic(주제)·intro(서론)·body(본론)·conclusion(결론)을 모두 써 주세요");
    else if (e.evidence.length < 1) errors.push("essay: evidence(쓸 만한 근거)를 1개 이상 써 주세요");
    if (quiz.length < LIMITS.noonQuiz.min || quiz.length > LIMITS.noonQuiz.max)
      errors.push(`점심 퀴즈는 ${LIMITS.noonQuiz.min}~${LIMITS.noonQuiz.max}문제예요 (권장 O/X 3문제, 지금 ${quiz.length}문제)`);
    const terms = ok.filter((r) => r.section === "term");
    const questions = ok.filter((r) => r.section === "question");
    if (terms.length < LIMITS.terms.min || terms.length > LIMITS.terms.max) errors.push(`용어는 ${LIMITS.terms.min}~${LIMITS.terms.max}개예요 (지금 ${terms.length}개)`);
    if (questions.length < LIMITS.questions.min || questions.length > LIMITS.questions.max)
      errors.push(`면접 질문은 ${LIMITS.questions.min}~${LIMITS.questions.max}개예요 (지금 ${questions.length}개)`);
  }

  const client = await db();
  const existing = await client.execute({ sql: "SELECT id FROM briefing_issues WHERE issue_date = ? AND edition = ?", args: [date, edition] });
  if (existing.rows.length) return json({ date, edition, skipped: true, issueId: Number(existing.rows[0].id), reason: "오늘 이 판이 이미 있어요" });

  for (const t of ok.filter((r) => r.section === "term")) {
    const dup = await client.execute({
      sql: "SELECT id FROM news WHERE section = 'term' AND title = ? AND edition_date >= ? LIMIT 1",
      args: [t.title, addDays(date, -90)],
    });
    if (dup.rows.length) errors.push(`용어 '${t.title}'는 최근 90일 안에 다뤘어요. 다른 용어를 골라 주세요`);
  }
  if (errors.length) return json({ date, edition, ok: false, errors }, 400);

  const now = Date.now();
  const res = await client.batch(
    [
      {
        sql: "INSERT INTO briefing_issues (issue_date, edition, title, lede, closing, quiz, extras, status, origin, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, 0, 'auto', ?, ?)",
        args: [date, edition, title, lede, closing, JSON.stringify(quiz), JSON.stringify(extras), now, now],
      },
      ...ok.map((r) => ({
        sql: `INSERT INTO news (edition_date, edition, section, title, summary, point, body, source_name, source_url, tier, position, takeaway, headline, status, origin, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'key', ?, ?, ?, 0, 'auto', ?, ?)`,
        args: [date, edition, r.section, r.title, r.summary, r.point, r.body, r.sourceName, r.sourceUrl, r.position, r.takeaway, r.headline, now, now],
      })),
    ],
    "write",
  );
  revalidatePath("/admin/news");
  return json({ date, edition, ok: true, issueId: Number(res[0].lastInsertRowid), items: ok.length, quiz: quiz.length });
}
