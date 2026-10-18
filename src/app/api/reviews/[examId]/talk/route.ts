import { connection } from "next/server";
import { addDays, todayKST } from "@/lib/date";
import { dbConfigured } from "@/lib/server/db";
import { getExam } from "@/lib/server/reviews";
import { BANNED_MESSAGE, containsBanned, isAdmin, isBanned, rateLimit, requester, voterToken } from "@/lib/server/security";
import { addTalk, listTalk, moderateTalk } from "@/lib/server/talk";
import { TALK_LIMITS, TALK_OPEN_BEFORE_DAYS } from "@/lib/talk-meta";

/**
 * 시험별 실시간 응시자 톡
 * GET  ?after=id (새 글) · ?before=id (옛 글 더 보기) — 화면이 몇 초마다 불러가요
 * POST { body, asAdmin?, website? } — 익명 글 올리기 (브라우저 토큰으로 이름·내 글 표시). 운영자가 asAdmin 이면 '금콩 운영자'로
 * PATCH { id, op: hide|show|delete } — 운영자만: 가리기(방문자에겐 '운영자에 의해 가려진 메시지') · 다시 보이기 · 삭제
 */

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
const num = (v: string | null) => {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : undefined;
};

/** 톡이 열려 있는 시험인지 (예상 일정 아님 · 시험 며칠 전부터) */
function openExam(examId: string) {
  const exam = getExam(examId);
  if (!exam || exam.expected) return null;
  return todayKST() >= addDays(exam.date, -TALK_OPEN_BEFORE_DAYS) ? exam : null;
}

export async function GET(req: Request, ctx: RouteContext<"/api/reviews/[examId]/talk">) {
  await connection();
  if (!dbConfigured()) return json({ items: [], more: false });
  const exam = openExam((await ctx.params).examId);
  if (!exam) return json({ error: "톡이 열리지 않은 시험이에요." }, 404);
  const q = new URL(req.url).searchParams;
  const [voter, admin] = await Promise.all([voterToken(false), isAdmin()]);
  return json(await listTalk(exam.id, { voter, admin, after: num(q.get("after")), before: num(q.get("before")) }));
}

export async function POST(req: Request, ctx: RouteContext<"/api/reviews/[examId]/talk">) {
  await connection();
  if (!dbConfigured()) return json({ error: "지금은 글을 올릴 수 없어요." }, 503);
  const exam = openExam((await ctx.params).examId);
  if (!exam) return json({ error: "톡이 열리지 않은 시험이에요." }, 404);
  const b = (await req.json().catch(() => null)) as { body?: unknown; asAdmin?: unknown; website?: unknown } | null;
  if (!b || (typeof b.website === "string" && b.website)) return json({ error: "잘못된 요청입니다." }, 400); // 스팸봇용 숨은 칸

  const body = (typeof b.body === "string" ? b.body : "").replace(/\r\n?/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  if (body.length < TALK_LIMITS.minBody) return json({ error: `${TALK_LIMITS.minBody}자 이상 적어 주세요.` }, 400);
  if (body.length > TALK_LIMITS.body) return json({ error: `${TALK_LIMITS.body}자까지 쓸 수 있어요.` }, 400);
  if (containsBanned(body)) return json({ error: "사용할 수 없는 표현이 들어 있어요." }, 400);
  if ((body.match(/https?:\/\//gi) ?? []).length > TALK_LIMITS.links) return json({ error: `링크는 ${TALK_LIMITS.links}개까지만 넣을 수 있어요.` }, 400);

  const who = await requester();
  // 운영자로 쓰기는 운영자 로그인일 때만
  const asAdmin = b.asAdmin === true && (await isAdmin());
  if (!asAdmin && (await isBanned(who.hash))) return json({ error: BANNED_MESSAGE }, 403);
  if (!asAdmin && !(await rateLimit("talk", who.hash, 4))) return json({ error: "조금 천천히 보내 주세요. (4초에 한 번)" }, 429);
  const voter = await voterToken(true);
  if (!voter) return json({ error: "브라우저 쿠키를 허용해 주세요." }, 400);

  const id = await addTalk(exam.id, voter, who.hash, body, asAdmin);
  const { items } = await listTalk(exam.id, { voter, admin: asAdmin, after: id - 1 });
  return json({ item: items.find((x) => x.id === id) ?? null });
}

export async function PATCH(req: Request, ctx: RouteContext<"/api/reviews/[examId]/talk">) {
  await connection();
  if (!(await isAdmin())) return json({ error: "운영자만 할 수 있어요." }, 403);
  const examId = (await ctx.params).examId;
  const b = (await req.json().catch(() => null)) as { id?: unknown; op?: unknown } | null;
  const id = Number(b?.id);
  const op = b?.op;
  if (!Number.isInteger(id) || (op !== "hide" && op !== "show" && op !== "delete")) return json({ error: "잘못된 요청입니다." }, 400);
  if (!(await moderateTalk(examId, id, op))) return json({ error: "메시지를 찾을 수 없어요." }, 404);
  return json({ ok: true });
}
