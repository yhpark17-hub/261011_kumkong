import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { getCompany } from "../data";
import type { EventType, Recruitment, ScheduleEvent } from "../types";
import { db } from "./db";
import { githubConfig } from "./github";

/**
 * 자동 점검(클라우드 에이전트) 연결
 * - 에이전트는 Authorization: Bearer <AUTOMATION_TOKEN> 으로 /api/automation/* 를 호출합니다.
 * - 토큰은 제보 열람(연락처 제외)·제안 등록·초안 등록만 할 수 있고, 사이트 반영은 운영자 승인이 있어야 합니다.
 */

export function automationConfigured(): boolean {
  return (process.env.AUTOMATION_TOKEN?.trim().length ?? 0) >= 24;
}

/** 요청의 토큰 확인 (길이와 무관하게 일정한 시간 비교) */
export function automationAuthorized(req: Request): boolean {
  const expected = process.env.AUTOMATION_TOKEN?.trim();
  if (!expected || expected.length < 24) return false;
  const header = req.headers.get("authorization") ?? "";
  const given = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  const a = createHash("sha256").update(given).digest();
  const b = createHash("sha256").update(expected).digest();
  return given.length > 0 && timingSafeEqual(a, b);
}

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });

export function unauthorized(): Response {
  return automationConfigured() ? json({ error: "unauthorized" }, 401) : json({ error: "AUTOMATION_TOKEN 이 설정되지 않았어요" }, 503);
}

/* ------------------------------------------------------------------ */
/* 마지막 실행 기록                                                       */
/* ------------------------------------------------------------------ */

export interface RunInfo {
  at: number;
  runId: string | null;
  summary: string;
  checked: number | null;
  proposed: number | null;
  drafts: number | null;
}

export async function recordRun(info: Omit<RunInfo, "at">): Promise<void> {
  const client = await db();
  const value: RunInfo = { ...info, at: Date.now() };
  await client.execute({
    sql: "INSERT INTO kv (key, value, updated_at) VALUES ('automation:last-run', ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at",
    args: [JSON.stringify(value), value.at],
  });
}

export async function lastRun(): Promise<RunInfo | null> {
  const client = await db();
  const row = (await client.execute("SELECT value FROM kv WHERE key = 'automation:last-run'")).rows[0];
  if (!row) return null;
  try {
    return JSON.parse(String(row.value)) as RunInfo;
  } catch {
    return null;
  }
}

export function setupStatus() {
  const gh = githubConfig();
  return {
    token: automationConfigured(),
    github: Boolean(gh),
    repo: gh?.repo ?? null,
  };
}

/* ------------------------------------------------------------------ */
/* 일정 레코드 검증 (에이전트가 보낸 값을 그대로 믿지 않음)                     */
/* ------------------------------------------------------------------ */

const EVENT_TYPES = new Set<EventType>(["posting", "doc", "written", "interview1", "interview2", "final"]);
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^\d{2}:\d{2}$/;

const s = (v: unknown, max: number) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : undefined);
const url = (v: unknown) => {
  const u = s(v, 500);
  return u && /^https?:\/\//i.test(u) ? u : undefined;
};
const validDate = (v: unknown) => {
  if (typeof v !== "string" || !DATE.test(v)) return undefined;
  const d = new Date(`${v}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v ? v : undefined;
};

/** 올바른 Recruitment 레코드면 정리해서 돌려주고, 아니면 이유 문자열 */
export function validateRecord(raw: unknown, companyId: string | null): Recruitment | string {
  if (!raw || typeof raw !== "object") return "record 가 없어요";
  const r = raw as Record<string, unknown>;
  const id = s(r.companyId, 80);
  if (!id || !getCompany(id)) return `알 수 없는 기관 id: ${String(r.companyId)}`;
  if (companyId && id !== companyId) return "제안의 기관과 record 의 기관이 달라요";
  if (!Array.isArray(r.events) || r.events.length === 0 || r.events.length > 40) return "events 가 비었거나 너무 많아요";

  const events: ScheduleEvent[] = [];
  for (const e of r.events) {
    if (!e || typeof e !== "object") return "events 형식 오류";
    const ev = e as Record<string, unknown>;
    const type = ev.type as EventType;
    const date = validDate(ev.date);
    if (!EVENT_TYPES.has(type) || !date) return `잘못된 일정: ${JSON.stringify(e).slice(0, 120)}`;
    const endDate = validDate(ev.endDate);
    const time = typeof ev.time === "string" && TIME.test(ev.time) ? ev.time : undefined;
    events.push({
      type,
      date,
      ...(endDate && endDate >= date ? { endDate } : {}),
      ...(time ? { time } : {}),
      ...(s(ev.label, 60) ? { label: s(ev.label, 60) } : {}),
      ...(s(ev.note, 400) ? { note: s(ev.note, 400) } : {}),
    });
  }
  events.sort((a, b) => (a.date === b.date ? 0 : a.date < b.date ? -1 : 1));

  const tracks = Array.isArray(r.tracks) ? r.tracks.map((t) => s(t, 200)).filter((t): t is string => Boolean(t)).slice(0, 60) : [];
  const essayQuestions = Array.isArray(r.essayQuestions)
    ? r.essayQuestions
        .map((q) => {
          if (!q || typeof q !== "object") return null;
          const o = q as Record<string, unknown>;
          const text = s(o.q, 1000);
          if (!text) return null;
          const limit = typeof o.limit === "number" && o.limit > 0 && o.limit < 10000 ? Math.round(o.limit) : undefined;
          return { q: text, ...(limit ? { limit } : {}), ...(o.unit === "byte" ? { unit: "byte" as const } : {}) };
        })
        .filter((q): q is NonNullable<typeof q> => Boolean(q))
        .slice(0, 12)
    : [];
  const confidence = r.confidence === "high" || r.confidence === "medium" || r.confidence === "low" ? r.confidence : undefined;
  const headcount = typeof r.headcount === "number" && r.headcount > 0 && r.headcount < 100000 ? Math.round(r.headcount) : undefined;

  return {
    companyId: id,
    title: s(r.title, 200) ?? "신입 채용",
    period: s(r.period, 40) ?? "",
    status: r.status === "expected" ? "expected" : "confirmed",
    ...(headcount ? { headcount } : {}),
    tracks,
    events,
    essayQuestions,
    ...(s(r.essayRef, 100) ? { essayRef: s(r.essayRef, 100) } : {}),
    ...(url(r.postingUrl) ? { postingUrl: url(r.postingUrl) } : {}),
    ...(url(r.sourceUrl) ? { sourceUrl: url(r.sourceUrl) } : {}),
    ...(confidence ? { confidence } : {}),
    updatedAt: validDate(r.updatedAt) ?? new Date().toISOString().slice(0, 10),
    ...(s(r.note, 3000) ? { note: s(r.note, 3000) } : {}),
  };
}
