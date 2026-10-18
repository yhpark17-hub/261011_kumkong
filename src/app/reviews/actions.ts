"use server";

import { connection } from "next/server";
import { refresh } from "next/cache";
import { todayKST } from "@/lib/date";
import { OVERALL_OPTIONS, STYLE_OPTIONS, TIME_OPTIONS, UNSOLVED_OPTIONS } from "@/lib/review-meta";
import { db } from "@/lib/server/db";
import { getExam } from "@/lib/server/reviews";
import {
  BANNED_MESSAGE,
  LIMITS,
  containsBanned,
  isBanned,
  rateLimit,
  requester,
  tooManyLinks,
  voterToken,
} from "@/lib/server/security";

export type ReviewActionState = { ok: boolean; error?: string; updated?: boolean };

const str = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();

/** 같은 IP(같은 와이파이 등)에서 시험당 최대 응답 수 */
const MAX_PER_IP = 3;

export async function submitReview(_prev: ReviewActionState, fd: FormData): Promise<ReviewActionState> {
  await connection();
  if (str(fd, "website")) return { ok: false, error: "잘못된 요청입니다." };
  const exam = getExam(str(fd, "examId"));
  if (!exam || exam.expected) return { ok: false, error: "시험 정보를 찾을 수 없어요." };
  if (exam.date > todayKST()) return { ok: false, error: "시험이 끝난 뒤에 참여할 수 있어요." };

  const overall = Number(fd.get("overall"));
  const time = Number(fd.get("time"));
  if (!OVERALL_OPTIONS.some((o) => o.value === overall)) return { ok: false, error: "전체 난이도를 골라 주세요." };
  if (!TIME_OPTIONS.some((o) => o.value === time)) return { ok: false, error: "시간 여유를 골라 주세요." };

  const style = str(fd, "style") || null;
  if (style && !STYLE_OPTIONS.some((o) => o.value === style)) return { ok: false, error: "잘못된 선택이에요." };
  const hardest = str(fd, "hardest") || null;
  if (hardest && !exam.subjects.includes(hardest)) return { ok: false, error: "잘못된 선택이에요." };
  const track = str(fd, "track") || null;
  if (track && !exam.tracks.includes(track)) return { ok: false, error: "잘못된 선택이에요." };

  const subjects: Record<string, number> = {};
  for (const s of exam.subjects) {
    const v = Number(fd.get(`subject:${s}`));
    if (v >= 1 && v <= 5) subjects[s] = v;
  }

  // 못 푼(찍은) 문항 수 구간과, 알고 있다면 총 문항 수 (논술 제외 영역만)
  const unsolved: Record<string, number> = {};
  const totals: Record<string, number> = {};
  for (const s of exam.sections) {
    const u = str(fd, `unsolved:${s}`);
    if (u !== "" && UNSOLVED_OPTIONS.some((o) => String(o.value) === u)) unsolved[s] = Number(u);
    const t = str(fd, `total:${s}`);
    if (t !== "") {
      const n = Number(t);
      if (!Number.isInteger(n) || n < 5 || n > 300) return { ok: false, error: `${s} 총 문항 수는 5~300 사이 숫자로 적어 주세요.` };
      totals[s] = n;
    }
  }

  const oneLiner = str(fd, "oneLiner").replace(/\s+/g, " ").slice(0, LIMITS.oneLiner) || null;
  const detail = str(fd, "detail").slice(0, LIMITS.detail) || null;
  const text = `${oneLiner ?? ""}\n${detail ?? ""}`;
  if (containsBanned(text)) return { ok: false, error: "사용할 수 없는 표현이 들어 있어요." };
  if (tooManyLinks(text)) return { ok: false, error: "링크는 2개까지만 넣을 수 있어요." };

  const who = await requester();
  if (await isBanned(who.hash)) return { ok: false, error: BANNED_MESSAGE };
  if (!(await rateLimit("review", who.hash, 8))) return { ok: false, error: "잠시 후 다시 시도해 주세요." };

  const voter = await voterToken(true);
  if (!voter) return { ok: false, error: "브라우저 쿠키를 허용해 주세요." };

  const client = await db();
  const existing = await client.execute({
    sql: "SELECT id FROM exam_reviews WHERE exam_id = ? AND voter = ?",
    args: [exam.id, voter],
  });
  if (!existing.rows.length) {
    const sameIp = await client.execute({
      sql: "SELECT COUNT(*) AS n FROM exam_reviews WHERE exam_id = ? AND ip_hash = ? AND status != 2",
      args: [exam.id, who.hash],
    });
    if (Number(sameIp.rows[0]?.n ?? 0) >= MAX_PER_IP) {
      return { ok: false, error: "같은 네트워크에서 이미 여러 명이 참여했어요." };
    }
  }

  const now = Date.now();
  await client.execute({
    sql: `INSERT INTO exam_reviews (exam_id, voter, ip_hash, track, overall, time_pressure, style, hardest, subjects, unsolved, totals, one_liner, detail, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(exam_id, voter) DO UPDATE SET
            track = excluded.track, overall = excluded.overall, time_pressure = excluded.time_pressure,
            style = excluded.style, hardest = excluded.hardest, subjects = excluded.subjects,
            unsolved = excluded.unsolved, totals = excluded.totals,
            one_liner = excluded.one_liner, detail = excluded.detail, updated_at = excluded.updated_at`,
    args: [
      exam.id,
      voter,
      who.hash,
      track,
      overall,
      time,
      style,
      hardest,
      JSON.stringify(subjects),
      JSON.stringify(unsolved),
      JSON.stringify(totals),
      oneLiner,
      detail,
      now,
      now,
    ],
  });
  refresh();
  return { ok: true, updated: existing.rows.length > 0 };
}
