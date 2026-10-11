"use server";

import { getCompany } from "@/lib/data";
import { FEEDBACK_KINDS, FEEDBACK_LIMITS, isFeedbackKind } from "@/lib/feedback-meta";
import { db } from "@/lib/server/db";
import { rateLimit, requester } from "@/lib/server/security";

export type FeedbackState = { ok: boolean; error?: string };

const str = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();

/** 제보·의견 접수 — 운영자 화면(/admin)에서만 볼 수 있습니다 */
export async function submitFeedback(_prev: FeedbackState, fd: FormData): Promise<FeedbackState> {
  if (str(fd, "website")) return { ok: false, error: "잘못된 요청입니다." }; // 스팸봇용 숨은 칸

  const kind = str(fd, "kind");
  if (!isFeedbackKind(kind)) return { ok: false, error: "잘못된 요청입니다." };
  const meta = FEEDBACK_KINDS[kind];

  const topic = str(fd, "topic") || null;
  if (topic && !meta.topics.includes(topic)) return { ok: false, error: "항목을 다시 골라 주세요." };

  const companyId = str(fd, "companyId") || null;
  const company = companyId ? getCompany(companyId) : undefined;
  if (companyId && !company) return { ok: false, error: "기관 정보를 찾을 수 없어요." };

  const companyName = str(fd, "companyName").slice(0, FEEDBACK_LIMITS.companyName) || null;
  if (kind === "posting" && !companyName) return { ok: false, error: "어느 기관인지 적어 주세요." };

  const body = str(fd, "body");
  if (body.length < FEEDBACK_LIMITS.minBody) return { ok: false, error: `내용을 ${FEEDBACK_LIMITS.minBody}자 이상 적어 주세요.` };
  if (body.length > FEEDBACK_LIMITS.body) return { ok: false, error: `내용은 ${FEEDBACK_LIMITS.body}자 이내로 적어 주세요.` };
  if ((body.match(/https?:\/\//gi) ?? []).length > 5) return { ok: false, error: "링크가 너무 많아요." };

  const sourceUrl = str(fd, "sourceUrl") || null;
  if (sourceUrl && (!/^https?:\/\/\S+$/i.test(sourceUrl) || sourceUrl.length > FEEDBACK_LIMITS.source)) {
    return { ok: false, error: "근거 링크는 http(s):// 로 시작하는 주소로 적어 주세요." };
  }

  const contact = str(fd, "contact").slice(0, FEEDBACK_LIMITS.contact) || null;
  const pageRaw = str(fd, "page");
  // 사이트 안 경로만 (운영자 화면에서 링크로 보여 주므로 //다른주소 형태는 버림)
  const page = /^\/(?!\/)/.test(pageRaw) ? pageRaw.slice(0, 200) : null;

  const who = await requester();
  if (!(await rateLimit("feedback", who.hash, 30))) {
    return { ok: false, error: "조금 전에 보내셨어요. 30초 뒤에 다시 보내 주세요." };
  }

  const client = await db();
  await client.execute({
    sql: `INSERT INTO feedback (kind, topic, company_id, company_name, page, body, source_url, contact, ip_hash, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [kind, topic, company?.id ?? null, companyName, page, body, sourceUrl, contact, who.hash, Date.now()],
  });
  return { ok: true };
}
