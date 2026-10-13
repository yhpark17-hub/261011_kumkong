import { revalidatePath } from "next/cache";
import { automationAuthorized, json, unauthorized } from "@/lib/server/automation";
import { dbConfigured } from "@/lib/server/db";
import { markProposalsApplied } from "@/lib/server/proposals";

/** 에이전트가 승인된 일정 수정을 저장소에 커밋한 뒤 알려 줌 — body: { ids: number[], note?: string } */
export async function POST(req: Request) {
  if (!automationAuthorized(req)) return unauthorized();
  if (!dbConfigured()) return json({ error: "DB 없음" }, 503);
  const body = (await req.json().catch(() => null)) as { ids?: unknown; note?: unknown } | null;
  const ids = Array.isArray(body?.ids) ? body.ids.filter((x): x is number => Number.isInteger(x)).slice(0, 200) : [];
  const note = typeof body?.note === "string" ? body.note.slice(0, 500) : null;
  const updated = await markProposalsApplied(ids, note);
  revalidatePath("/admin/proposals");
  return json({ updated });
}
