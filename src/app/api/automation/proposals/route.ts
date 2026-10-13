import { revalidatePath } from "next/cache";
import { automationAuthorized, json, recordChecked, recordRun, unauthorized } from "@/lib/server/automation";
import { dbConfigured } from "@/lib/server/db";
import { saveIncomingProposals } from "@/lib/server/proposals";

/**
 * 제안 올리기 — 사이트는 바뀌지 않고, 운영자 화면(AI 검토 제안)에 쌓입니다.
 * body: { runId?, run?: { summary, checked?, drafts?, checkedCompanies?: string[] }, proposals: Proposal[] }
 */
export async function POST(req: Request) {
  if (!automationAuthorized(req)) return unauthorized();
  if (!dbConfigured()) return json({ error: "DB 없음" }, 503);
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return json({ error: "JSON 본문이 필요해요" }, 400);
  const runId = typeof body.runId === "string" ? body.runId.slice(0, 80) : null;
  const list = Array.isArray(body.proposals) ? body.proposals : [];
  const results = await saveIncomingProposals(list, runId);

  const run = body.run as Record<string, unknown> | undefined;
  if (run && typeof run.summary === "string") {
    const n = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);
    await recordRun({
      runId,
      summary: run.summary.slice(0, 4000),
      checked: n(run.checked),
      proposed: results.filter((r) => r.status === "created" || r.status === "updated").length,
      drafts: n(run.drafts),
    });
  }
  // 변경이 없었던 기관도 '점검함'으로 기록 (다음 실행에서 건너뛰도록)
  if (run && Array.isArray(run.checkedCompanies)) await recordChecked(run.checkedCompanies.filter((x): x is string => typeof x === "string"));
  revalidatePath("/admin/proposals");
  revalidatePath("/admin");
  return json({ results });
}
