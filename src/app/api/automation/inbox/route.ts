import { connection } from "next/server";
import { automationAuthorized, json, lastRun, unauthorized } from "@/lib/server/automation";
import { scheduleIssues } from "@/lib/server/data-check";
import { dbConfigured } from "@/lib/server/db";
import { automationInbox } from "@/lib/server/proposals";

/**
 * 자동 점검 에이전트의 할 일 목록
 * - feedback: 아직 제안이 없는 새 제보 (연락처·IP 제외)
 * - approvedToApply: 운영자가 승인했지만 저장소에 아직 반영 안 된 일정 수정 (GITHUB_TOKEN 이 없을 때)
 * - knownKeys: 이미 올렸거나 최근 처리한 제안 키 (중복 제안 방지)
 * - dataIssues: 지금 사이트에 배포된 일정 데이터의 빈 곳
 */
export async function GET(req: Request) {
  await connection();
  if (!automationAuthorized(req)) return unauthorized();
  if (!dbConfigured()) return json({ error: "DB 없음" }, 503);
  const [inbox, run] = await Promise.all([automationInbox(), lastRun()]);
  const { rows, today } = scheduleIssues();
  return json({
    today,
    lastRun: run,
    ...inbox,
    dataIssues: rows
      .filter((r) => r.issues.length)
      .map((r) => ({
        companyId: r.company.id,
        name: r.company.name,
        issues: r.issues,
        lastEvent: r.lastEvent,
        updatedAt: r.recruitment?.updatedAt ?? null,
        confidence: r.recruitment?.confidence ?? null,
        events: r.recruitment?.events ?? [],
      })),
  });
}
