"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCompany } from "@/lib/data";
import { PROPOSAL_STATUS } from "@/lib/proposals-meta";
import { db } from "@/lib/server/db";
import { FEEDBACK_STATUS } from "@/lib/server/feedback";
import { githubConfig, upsertRecruitmentRecords } from "@/lib/server/github";
import { getProposal } from "@/lib/server/proposals";
import { isAdmin } from "@/lib/server/security";

function done() {
  revalidatePath("/admin/proposals");
  revalidatePath("/admin/feedback");
  revalidatePath("/admin");
}

/**
 * 운영자 결정
 * - decision=approve + choice: 고른 선택지를 실행 (일정 반영 / 제보 처리)
 * - decision=reject: 아무것도 바꾸지 않고 '거절'로 기록 (같은 제안은 45일간 다시 올라오지 않음)
 * - decision=retry: 반영 실패한 것 다시 시도
 */
export async function decideProposal(fd: FormData): Promise<void> {
  if (!(await isAdmin())) redirect("/admin/login");
  const id = Number(fd.get("id"));
  const decision = String(fd.get("decision") ?? "");
  const note = String(fd.get("note") ?? "").trim().slice(0, 1000) || null;
  const p = Number.isInteger(id) ? await getProposal(id) : null;
  if (!p) return;
  const client = await db();
  const now = Date.now();

  if (decision === "reject") {
    if (p.status !== PROPOSAL_STATUS.pending) return;
    await client.execute({
      sql: "UPDATE proposals SET status = ?, admin_note = ?, decided_at = ? WHERE id = ?",
      args: [PROPOSAL_STATUS.rejected, note, now, id],
    });
    return done();
  }

  const choiceKey = decision === "retry" ? p.choice : String(fd.get("choice") ?? "");
  if (decision === "retry" ? p.status !== PROPOSAL_STATUS.failed : p.status !== PROPOSAL_STATUS.pending) return;
  const option = p.options.find((o) => o.key === choiceKey);
  if (!option) return;

  const finish = async (status: number, result: string | null, extra: { feedback?: number } = {}) => {
    await client.execute({
      sql: `UPDATE proposals SET status = ?, choice = ?, admin_note = COALESCE(?, admin_note), result = ?, decided_at = COALESCE(decided_at, ?),
              applied_at = CASE WHEN ? = 2 THEN ? ELSE applied_at END WHERE id = ?`,
      args: [status, option.key, note, result, now, status, now, id],
    });
    if (extra.feedback != null && p.feedbackId != null) {
      await client.execute({
        sql: "UPDATE feedback SET status = ?, handled_at = ? WHERE id = ? AND status = ?",
        args: [extra.feedback, now, p.feedbackId, FEEDBACK_STATUS.open],
      });
    }
  };

  switch (option.action) {
    case "update_schedule": {
      if (!option.record) return finish(PROPOSAL_STATUS.failed, "반영할 일정 데이터가 없어요");
      const name = getCompany(option.record.companyId)?.name ?? option.record.companyId;
      if (!githubConfig()) {
        // 토큰이 없으면 다음 자동 점검 때 에이전트가 저장소에 커밋
        await finish(PROPOSAL_STATUS.approved, "승인됨 — 다음 자동 점검 때 저장소에 반영돼요 (즉시 반영하려면 GITHUB_TOKEN 설정)", {
          feedback: p.feedbackId != null ? FEEDBACK_STATUS.done : undefined,
        });
        return done();
      }
      try {
        const { commitUrl } = await upsertRecruitmentRecords(
          [option.record],
          `일정 반영: ${name} (운영자 승인 · 제안 #${p.id})\n\n${p.title}`,
        );
        await finish(PROPOSAL_STATUS.applied, commitUrl ? `커밋 완료 — 1~2분 뒤 사이트에 반영돼요 ${commitUrl}` : "커밋 완료 — 1~2분 뒤 사이트에 반영돼요", {
          feedback: p.feedbackId != null ? FEEDBACK_STATUS.done : undefined,
        });
      } catch (err) {
        await finish(PROPOSAL_STATUS.failed, err instanceof Error ? err.message : "반영 실패");
      }
      return done();
    }
    case "feedback_done":
      await finish(PROPOSAL_STATUS.applied, "제보를 처리 완료로 표시했어요", { feedback: FEEDBACK_STATUS.done });
      return done();
    case "feedback_delete":
      await finish(PROPOSAL_STATUS.applied, "제보를 삭제했어요", { feedback: FEEDBACK_STATUS.deleted });
      return done();
    case "none":
      await finish(PROPOSAL_STATUS.applied, "기록만 남겼어요 (사이트 변경 없음)");
      return done();
  }
}
