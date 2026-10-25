import { revalidatePath } from "next/cache";
import { connection } from "next/server";
import { addDays, todayKST } from "@/lib/date";
import { EMPTY_THUMB, MAX_STORIES, isIssueEdition, isNewsSection, kindOf, parseExtras, parseQuiz, parseThumb } from "@/lib/news-meta";
import { automationAuthorized, json, unauthorized } from "@/lib/server/automation";
import { autoPublishOn, morningForAutomation, publishIssue } from "@/lib/server/briefing";
import { db, dbConfigured } from "@/lib/server/db";
import { checkArt, plainCorpus } from "@/lib/server/thumb-check";
import { parseNotes } from "@/lib/glossary";
import { CARD_LEN, cardTexts, checkCards, parseCards } from "@/lib/news-cards";
import { picExists } from "@/lib/server/card-pics";
import { parseArt } from "@/lib/thumb-art";

/**
 * 데일리 브리핑 한 호 올리기 — 자동 발행이 켜져 있으면(기본) 검사를 통과하는 대로 바로 발행돼요.
 * 관리자 화면에서 자동 발행을 끄면 '초안 · 자동'으로 들어가고 운영자가 확인 후 발행합니다.
 *
 * 아침판 { edition: "morning", title, lede, closing?, items: [기사 4~5건] } — 기사마다 옆으로 넘겨 보는 그림 카드뉴스 (퀴즈는 없어요, 보내면 빼고 warnings)
 *   - 기사: { section: finance|economy|policy|global|public, headline?: true, title, short, pic?, takeaway, summary, point, sourceName, sourceUrl, cards, notes? }
 *     헤드라인(headline: true) 정확히 1건. 모든 기사에 원문 링크·한 줄 요약. point 는 카드 한 장에 들어가게 130자 안
 *     short = 시간표에 쓰는 한 줄 제목 (16자 안, 예: "경상흑자, 독·일 합계 첫 추월") · pic = 표지 그림 (PICS 이름 · 'who:인물' · 'org:기관')
 *     notes = 각주 [{ term, text }] — 생초보가 모를 말 풀이 (용어 사전 lib/glossary.ts 에 있는 말은 저절로 붙어요)
 *   - cards: 표지와 '왜 중요할까'(point) 장 사이에 들어갈 2~4장 — 카드마다 그림이 크게, 글은 짧게 (lib/news-cards.ts)
 *     { type: "text", title, text, pic? } · { type: "stat", value, label, note?, pic? } · { type: "bars", title, bars: [{ label, value, hi? }], note? }
 *     { type: "change", title, rows: [{ label, from, to }], note? } · { type: "flow", title, steps: [2~4개] } · { type: "term", term, text, pic? }
 *     { type: "quote", who?, name, text, note? } · { type: "versus", title, left: { name, text }, right: { name, text } }
 *     숫자·도표 카드(stat·bars·change·flow·quote·versus) 1장 이상. 카드 속 숫자는 전부 그 기사 글(제목·한 줄 요약·요약·포인트)에 있어야 하고,
 *     숫자+단위 칸(value·from·to)과 인물의 말(quote.text)은 글자 그대로 있어야 해요 — 아니면 거절
 *   - lede: 공유 미리보기·검색 설명 2~3문장 (화면에는 안 나와요)
 * 금콩 스터디 { edition: "noon", title, lede, closing?, numbers: [3개], items: [용어 2~3개, 면접 질문 1~2개], essay, quiz: [O/X 3문제] }
 *   - 숫자로 보는 오늘: { value: "7.57%", label: "15일 코스피 하락률", note? } — 아침판 기사에 나온 숫자만
 *   - 용어: { section: "term", title, summary, point, body(헷갈리는 짝꿍 비교 표, 마크다운), sourceName?, sourceUrl? } — 최근 90일 안에 다룬 용어는 거절
 *   - 질문: { section: "question", title, summary, body(답변 뼈대), point, sourceName?, sourceUrl? }
 *   - 논술 한 문단: { topic, intro, body, conclusion, evidence: [근거 1~4개] }
 *   - 점심 퀴즈: { question, options: ["O", "X"], answer, explain, basis } 3문제
 *     basis = 금콩 스터디 본문(숫자·용어·논술·면접 질문)에 실린 근거 문장 그대로. 아침판에만 있고 금콩 스터디에는 없는 내용은 거절
 * 공유 썸네일 (선택)
 *   - 두 판 공통 thumb.art: 그날 뉴스에 맞춰 직접 그린 그림 { svg, texts, brand } — 있으면 아래 틀 대신 이걸로 (권장, ROUTINE.md '썸네일 그리기')
 *     글자 속 숫자·따옴표 말이 이 판 본문에 그대로 없으면 그림을 빼고 warnings. 미리보기·고치기는 /api/automation/thumb
 *   - 아침판 thumb: { layout?, scene?, costume?, kong?, mood?: "up"|"down"|"neutral", bubble?, caption?, stats? }
 *     layout = card(그림+제목 카드)|bold(유튜브식 큰 글씨)|board(오늘의 숫자 카드) — 어제와 다른 배치로 (비우면 날짜에 따라 자동)
 *     scene = speech|market|rate|gauge|fx|oil|housing|prices|security|chip|trade|bond|news (그날 헤드라인 주제 그림 — 인물 발언이면 speech, 금리는 rate·gauge 번갈아)
 *     stats = ["▼ 연 4% 미만 가계대출 비중 12.9%", "▲ 브렌트유 117달러"] 2~3개(30자 안) — 숫자는 이 판 기사에 실린 그대로만(없으면 빼고 warnings)
 *     costume = uspresident|banker|president|… (콩이가 변장할 인물·역할), kong = "auto"(분위기가 뚜렷한 날만) | "on" | "off"
 *     bubble = 큰 글(44자 안) — speech 면 기사에 실린 발언 그대로만(이 판 기사 본문에 없으면 빼고 warnings), 아니면 썸네일 제목
 *     caption = 무슨 일인지 사실 한 줄(64자 안)
 *   - 금콩 스터디 thumb: { topic? } — 논술 주제가 길 때 썸네일용으로 뜻이 바뀌지 않게 줄인 것(120자 안). 주제가 둘이면 더 중요한 하나만
 * 그날 그 판이 이미 있으면 아무것도 바꾸지 않고 skipped. 하나라도 틀리면 아무것도 저장하지 않고 errors.
 */

type Raw = Record<string, unknown>;
const LIMITS = {
  morning: { min: 4, max: MAX_STORIES },
  terms: { min: 2, max: 3 },
  questions: { min: 1, max: 2 },
  numbers: { min: 2, max: 4 },
  noonQuiz: { min: 2, max: 4 },
};

/** 금콩 스터디를 만들 때 그날 아침판 기사 보기 */
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
  if (!isIssueEdition(edition)) return json({ date, ok: false, errors: ['edition 은 "morning"(금콩 브리핑·아침판) 또는 "noon"(금콩 스터디·점심판)이에요'] }, 400);
  const title = s(b.title, 120);
  const lede = s(b.lede, 1200);
  const closing = s(b.closing, 400);
  const raw = Array.isArray(b.items) ? (b.items as Raw[]).slice(0, 20) : [];

  const errors: string[] = [];
  if (title.length < 4) errors.push("title(목록·카드에 보이는 제목)이 필요해요");
  if (lede.length < 30) errors.push(edition === "morning" ? "lede(공유 미리보기·검색 설명)를 30자 이상 써 주세요" : "lede(오늘의 스터디)를 30자 이상 써 주세요");

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
      cards: edition === "morning" ? parseCards(it.cards) : [],
      short: s(it.short, 30),
      pic: s(it.pic, 60),
      notes: edition === "morning" ? parseNotes(it.notes) : [],
      sourceName: s(it.sourceName, 60),
      sourceUrl: url(it.sourceUrl),
      headline: 0,
      position: i,
    };
    if (row.title.length < (kind === "term" ? 2 : 4)) errors.push(`${where}: title 이 너무 짧아요`);
    if (row.summary.length < 20) errors.push(`${where}: summary 를 20자 이상 써 주세요`);
    if (edition === "morning") {
      if (kind !== "news") errors.push(`${where}: 아침판에는 기사(finance·economy·policy·global·public)만 넣어요. 용어·면접 질문은 금콩 스터디에`);
      if (!row.sourceUrl) errors.push(`${where}: 기사는 sourceUrl(직접 연 원문 링크)이 필요해요`);
      if (row.takeaway.length < 8) errors.push(`${where}: takeaway(한 줄 요약)가 필요해요`);
      if (row.point.length < 10) errors.push(`${where}: point(왜 중요할까·필기·면접 포인트)가 필요해요`);
      else if (row.point.length > CARD_LEN.point) errors.push(`${where}: point 는 카드 한 장에 들어가게 ${CARD_LEN.point}자 안으로 줄여 주세요 (지금 ${row.point.length}자)`);
      if (!row.short) errors.push(`${where}: short(시간표에 쓰는 한 줄 제목, ${CARD_LEN.short}자 안)가 필요해요`);
      else if (row.short.length > CARD_LEN.short) errors.push(`${where}: short "${row.short}" 를 ${CARD_LEN.short}자 안으로 줄여 주세요`);
      if (row.pic && !picExists(row.pic)) errors.push(`${where}: pic "${row.pic}" 는 없는 그림이에요 (ROUTINE.md 그림·인물·기관 목록)`);
      for (const [k, c] of row.cards.entries()) {
        const pic = c.type === "quote" ? (c.who ? `who:${c.who}` : "") : c.type === "text" || c.type === "stat" || c.type === "term" ? c.pic : "";
        if (pic && !picExists(pic)) errors.push(`${where} cards[${k}]: "${pic}" 는 없는 그림·인물·기관이에요 (ROUTINE.md 목록 — 없으면 비워 두세요)`);
      }
      // 각주(notes) — 생초보가 모를 말 풀이. 말은 이 기사 글에 실제로 나와야 해요
      const rawNotes = Array.isArray(it.notes) ? it.notes : [];
      if (row.notes.length !== rawNotes.length) errors.push(`${where}: notes 는 [{ term, text }] 모양이에요`);
      const cardText = row.cards.flatMap(cardTexts).join(" ");
      for (const n of row.notes) {
        if (n.term.length > CARD_LEN.noteTerm || n.text.length > CARD_LEN.noteText) errors.push(`${where}: notes "${n.term}" — 말 ${CARD_LEN.noteTerm}자·풀이 ${CARD_LEN.noteText}자 안으로`);
        if (![row.title, row.takeaway, row.point, cardText].join(" ").includes(n.term)) errors.push(`${where}: notes "${n.term}" 가 이 기사 카드·제목에 나오지 않아요`);
      }
      // 카드뉴스 — 숫자는 이 기사 글에 실린 그대로만
      const corpus = plainCorpus([row.title, row.takeaway, row.summary, row.point].join(" "));
      errors.push(...checkCards(it.cards, row.cards, corpus).map((p) => `${where} ${p.startsWith("cards[") ? p : `cards: ${p}`}`));
      if (it.headline === true || it.tier === "headline") {
        row.headline = 1;
        headlines++;
      }
    } else {
      if (kind === "news") errors.push(`${where}: 금콩 스터디에는 용어(term)·면접 질문(question)만 넣어요`);
      if (kind === "question" && row.body.length < 10) errors.push(`${where}: 면접 질문은 body(답변 뼈대)가 필요해요`);
    }
    return row;
  });
  const ok = rows.filter((r): r is NonNullable<typeof r> => Boolean(r));

  // 아침판은 퀴즈를 싣지 않아요 (카드뉴스로 바뀜)
  const sentQuiz = Array.isArray(b.quiz) ? b.quiz : [];
  const rawQuiz = edition === "morning" ? [] : sentQuiz;
  const quiz = parseQuiz(rawQuiz);
  if (quiz.length !== rawQuiz.length) errors.push("quiz: 질문·보기(2~4개)·정답 번호(answer, 0부터)를 확인해 주세요");
  if (quiz.some((q) => q.explain.length < 10)) errors.push("quiz: 문제마다 explain(해설)을 써 주세요");
  const extras = edition === "noon" ? parseExtras({ numbers: b.numbers, essay: b.essay }) : parseExtras({});

  // 퀴즈 근거 확인 — 문제마다 basis(근거 문장)가 이 판 본문에 그대로 있어야 해요.
  // 독자가 읽은 내용만으로 풀 수 있게, 본문에 없는 지식(예: 본문에 설명 없는 용어의 정의)으로 낸 문제를 막아요.
  const plain = plainCorpus;
  const corpus = plain(
    edition === "morning"
      ? ok.map((r) => [r.title, r.takeaway, r.summary, r.point].join(" ")).join(" ")
      : [
          ...ok.map((r) => [r.title, r.summary, r.point, r.body].join(" ")),
          ...extras.numbers.map((n) => `${n.value} ${n.label} ${n.note}`),
          ...(extras.essay ? [extras.essay.topic, extras.essay.intro, extras.essay.body, extras.essay.conclusion, ...extras.essay.evidence] : []),
        ].join(" "),
  );
  const where = edition === "noon" ? "금콩 스터디 본문(숫자·용어·논술·면접 질문)" : "오늘 기사(제목·한 줄 요약·요약·포인트)";

  // 썸네일 — 틀려도 브리핑은 저장하고, 빼고 알려 줘요 (운영자가 발행 전에 확인)
  const warnings: string[] = [];
  if (edition === "morning" && sentQuiz.length) warnings.push("quiz: 아침판은 이제 퀴즈를 싣지 않아 뺐어요");
  const rawThumb = b.thumb && typeof b.thumb === "object" ? (b.thumb as Raw) : {};
  const thumb = parseThumb(
    edition === "morning"
      ? { layout: rawThumb.layout, scene: rawThumb.scene, costume: rawThumb.costume, kong: rawThumb.kong, mood: rawThumb.mood, bubble: rawThumb.bubble, caption: rawThumb.caption, stats: rawThumb.stats }
      : { topic: rawThumb.topic },
  );
  if (rawThumb.costume && !thumb.costume) warnings.push("thumb.costume: 없는 변장이라 자동으로 골라요");
  if (rawThumb.scene && !thumb.scene) warnings.push("thumb.scene: 없는 그림이라 자동으로 골라요");
  if (rawThumb.layout && !thumb.layout) warnings.push("thumb.layout: card·bold·board 가 아니라 날짜에 따라 자동으로 골라요");
  // 숫자 칩 — 숫자는 이 판 기사에 실린 그대로만 (지어낸 숫자 방지)
  if (thumb.stats) {
    thumb.stats = thumb.stats
      .split("\n")
      .filter((line) => {
        const ok = (line.match(/\d[\d,.]*/g) ?? []).every((n) => corpus.includes(n));
        if (!ok) warnings.push(`thumb.stats: "${line}" 의 숫자가 이 판 기사에 없어 뺐어요`);
        return ok;
      })
      .join("\n");
  }
  // 인물 발언(말풍선)은 기사에 실린 말 그대로일 때만 — 지어낸 발언 방지
  if (thumb.bubble && (!thumb.scene || thumb.scene === "speech") && !corpus.includes(plain(thumb.bubble.replace(/\*/g, "")))) {
    warnings.push("thumb.bubble: 이 판 기사에 그대로 실린 문장이 아니라 뺐어요 (지어낸 말 방지) — 제목으로 그려요");
    thumb.bubble = "";
  }
  // 직접 그린 그림 — 글자 속 숫자·따옴표 말이 이 판 본문에 그대로 있을 때만 (아니면 빼고 틀로 그려요)
  if (rawThumb.art) {
    const art = parseArt(rawThumb.art);
    if (!art) warnings.push("thumb.art: 그림을 읽을 수 없어 정해진 틀로 그려요 (svg·texts·brand 확인)");
    else {
      const { problems, long } = checkArt(art, corpus);
      if (problems.length) warnings.push(...problems.map((p) => `thumb.art: ${p} — 그림을 빼고 정해진 틀로 그려요 (api.mjs thumb 로 고쳐 올릴 수 있어요)`));
      else thumb.art = art;
      if (long.length) warnings.push(`thumb.art: 칸보다 긴 글자 — ${long.join(" / ")}`);
    }
  }
  const thumbJson = JSON.stringify({ ...EMPTY_THUMB, ...thumb, checked: false });
  rawQuiz.forEach((q, i) => {
    const basis = plain(s(q && typeof q === "object" ? (q as Raw).basis : "", 400));
    if (basis.length < 8) errors.push(`quiz[${i}]: basis(이 문제의 근거 문장 — ${where}에서 그대로 옮긴 문장)가 필요해요`);
    else if (!corpus.includes(basis)) errors.push(`quiz[${i}]: basis 가 ${where}에 없어요. 이 판 본문에 실린 내용으로만 문제와 해설을 써 주세요`);
  });
  if (edition === "morning") {
    const n = ok.length;
    if (n < LIMITS.morning.min || n > LIMITS.morning.max) errors.push(`아침판 기사는 ${LIMITS.morning.min}~${LIMITS.morning.max}건이에요 (지금 ${n}건)`);
    if (headlines !== 1) errors.push(`헤드라인(headline: true)은 정확히 1건이어야 해요 (지금 ${headlines}건)`);
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
        sql: "INSERT INTO briefing_issues (issue_date, edition, title, lede, closing, quiz, extras, thumb, status, origin, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 'auto', ?, ?)",
        args: [date, edition, title, lede, closing, JSON.stringify(quiz), JSON.stringify(extras), thumbJson, now, now],
      },
      ...ok.map((r) => ({
        sql: `INSERT INTO news (edition_date, edition, section, title, summary, point, body, source_name, source_url, tier, position, takeaway, cards, short, pic, notes, headline, status, origin, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'key', ?, ?, ?, ?, ?, ?, ?, 0, 'auto', ?, ?)`,
        args: [date, edition, r.section, r.title, r.summary, r.point, r.body, r.sourceName, r.sourceUrl, r.position, r.takeaway, JSON.stringify(r.cards), r.short, r.pic, JSON.stringify(r.notes), r.headline, now, now],
      })),
    ],
    "write",
  );
  const issueId = Number(res[0].lastInsertRowid);
  // 자동 발행 — 검사를 다 통과한 호만 여기까지 와요
  const published = (await autoPublishOn()) && (await publishIssue(issueId));
  revalidatePath("/admin/news");
  if (published) {
    revalidatePath("/magazine");
    revalidatePath("/magazine/archive");
    revalidatePath("/magazine/letter/[date]/[edition]", "page");
    revalidatePath("/");
  }
  return json({ date, edition, ok: true, issueId, published, items: ok.length, quiz: quiz.length, ...(warnings.length ? { warnings } : {}) });
}
