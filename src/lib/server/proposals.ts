import "server-only";
import type { Row } from "@libsql/client";
import { getCompany } from "../data";
import {
  PROPOSAL_STATUS,
  type ProposalAction,
  type ProposalItem,
  type ProposalKind,
  type ProposalOption,
  type ProposalSource,
} from "../proposals-meta";
import { validateRecord } from "./automation";
import { db } from "./db";
import { FEEDBACK_STATUS } from "./feedback";

function parseJson<T>(raw: unknown, fallback: T): T {
  try {
    return typeof raw === "string" ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function toItem(r: Row): ProposalItem {
  return {
    id: Number(r.id),
    kind: r.kind === "feedback" ? "feedback" : "schedule",
    title: String(r.title),
    analysis: String(r.analysis),
    companyId: (r.company_id as string | null) ?? null,
    feedbackId: r.feedback_id == null ? null : Number(r.feedback_id),
    options: parseJson<ProposalOption[]>(r.options, []),
    recommended: (r.recommended as string | null) ?? null,
    sources: parseJson<ProposalSource[]>(r.sources, []),
    confidence: (r.confidence as string | null) ?? null,
    status: Number(r.status),
    choice: (r.choice as string | null) ?? null,
    adminNote: (r.admin_note as string | null) ?? null,
    result: (r.result as string | null) ?? null,
    createdAt: Number(r.created_at),
    decidedAt: r.decided_at == null ? null : Number(r.decided_at),
    appliedAt: r.applied_at == null ? null : Number(r.applied_at),
  };
}

export type ProposalTab = "pending" | "approved" | "failed" | "done";
const TAB_WHERE: Record<ProposalTab, string> = {
  pending: "status = 0",
  approved: "status = 1",
  failed: "status = 4",
  done: "status IN (2, 3)",
};

export async function listProposals(tab: ProposalTab, page = 1, size = 20): Promise<{ items: ProposalItem[]; total: number }> {
  const client = await db();
  const order = tab === "done" ? "COALESCE(decided_at, created_at) DESC" : "id DESC";
  const [rows, count] = await Promise.all([
    client.execute({ sql: `SELECT * FROM proposals WHERE ${TAB_WHERE[tab]} ORDER BY ${order} LIMIT ? OFFSET ?`, args: [size, (page - 1) * size] }),
    client.execute(`SELECT COUNT(*) AS n FROM proposals WHERE ${TAB_WHERE[tab]}`),
  ]);
  return { items: rows.rows.map(toItem), total: Number(count.rows[0]?.n ?? 0) };
}

export async function proposalCounts(): Promise<{ pending: number; approved: number; failed: number }> {
  const client = await db();
  const r = (
    await client.execute(
      "SELECT SUM(status = 0) AS pending, SUM(status = 1) AS approved, SUM(status = 4) AS failed FROM proposals",
    )
  ).rows[0];
  return { pending: Number(r?.pending ?? 0), approved: Number(r?.approved ?? 0), failed: Number(r?.failed ?? 0) };
}

export async function getProposal(id: number): Promise<ProposalItem | null> {
  const client = await db();
  const r = (await client.execute({ sql: "SELECT * FROM proposals WHERE id = ?", args: [id] })).rows[0];
  return r ? toItem(r) : null;
}

/** 제안과 연결된 원래 제보 (운영자 화면 표시용) */
export async function feedbackBodies(ids: number[]): Promise<Map<number, { kind: string; body: string; companyName: string | null; sourceUrl: string | null; createdAt: number; status: number }>> {
  const map = new Map<number, { kind: string; body: string; companyName: string | null; sourceUrl: string | null; createdAt: number; status: number }>();
  if (!ids.length) return map;
  const client = await db();
  const res = await client.execute({
    sql: `SELECT id, kind, body, company_name, source_url, created_at, status FROM feedback WHERE id IN (${ids.map(() => "?").join(",")})`,
    args: ids,
  });
  for (const r of res.rows)
    map.set(Number(r.id), {
      kind: String(r.kind),
      body: String(r.body),
      companyName: (r.company_name as string | null) ?? null,
      sourceUrl: (r.source_url as string | null) ?? null,
      createdAt: Number(r.created_at),
      status: Number(r.status),
    });
  return map;
}

/* ------------------------------------------------------------------ */
/* 에이전트가 올린 제안 저장                                               */
/* ------------------------------------------------------------------ */

const ACTIONS = new Set<ProposalAction>(["update_schedule", "feedback_done", "feedback_delete", "none"]);

export interface IncomingResult {
  index: number;
  id?: number;
  status: "created" | "updated" | "skipped" | "invalid";
  reason?: string;
}

const str = (v: unknown, max: number) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null);

export async function saveIncomingProposals(raw: unknown[], runId: string | null): Promise<IncomingResult[]> {
  const client = await db();
  const out: IncomingResult[] = [];
  for (let i = 0; i < raw.length && i < 100; i++) {
    const p = raw[i] as Record<string, unknown> | null;
    if (!p || typeof p !== "object") {
      out.push({ index: i, status: "invalid", reason: "객체가 아님" });
      continue;
    }
    const kind: ProposalKind | null = p.kind === "schedule" || p.kind === "feedback" ? p.kind : null;
    const title = str(p.title, 200);
    const analysis = str(p.analysis, 8000);
    const companyId = str(p.companyId, 80);
    const feedbackId = typeof p.feedbackId === "number" && Number.isInteger(p.feedbackId) ? p.feedbackId : null;
    if (!kind || !title || !analysis) {
      out.push({ index: i, status: "invalid", reason: "kind·title·analysis 필요" });
      continue;
    }
    if (companyId && !getCompany(companyId)) {
      out.push({ index: i, status: "invalid", reason: `알 수 없는 기관 ${companyId}` });
      continue;
    }
    if (kind === "feedback" && feedbackId == null) {
      out.push({ index: i, status: "invalid", reason: "feedback 제안에는 feedbackId 필요" });
      continue;
    }

    // 선택지 검증 — 일정 반영 레코드는 형식을 다시 확인
    const options: ProposalOption[] = [];
    let invalid: string | null = null;
    for (const o of Array.isArray(p.options) ? p.options.slice(0, 6) : []) {
      if (!o || typeof o !== "object") continue;
      const op = o as Record<string, unknown>;
      const key = str(op.key, 40);
      const label = str(op.label, 80);
      const action = ACTIONS.has(op.action as ProposalAction) ? (op.action as ProposalAction) : null;
      if (!key || !label || !action) {
        invalid = "선택지 형식 오류 (key·label·action)";
        break;
      }
      const option: ProposalOption = { key, label, action, ...(str(op.description, 600) ? { description: str(op.description, 600)! } : {}) };
      if (action === "update_schedule") {
        const rec = validateRecord(op.record, companyId);
        if (typeof rec === "string") {
          invalid = rec;
          break;
        }
        option.record = rec;
      }
      if ((action === "feedback_done" || action === "feedback_delete") && feedbackId == null) {
        invalid = "제보 처리 선택지에는 feedbackId 가 필요해요";
        break;
      }
      options.push(option);
    }
    if (invalid || options.length === 0) {
      out.push({ index: i, status: "invalid", reason: invalid ?? "선택지가 없어요" });
      continue;
    }
    const recommended = str(p.recommended, 40);
    const sources: ProposalSource[] = (Array.isArray(p.sources) ? p.sources : [])
      .map((s) => {
        const o = (s ?? {}) as Record<string, unknown>;
        const url = str(o.url, 500);
        return url && /^https?:\/\//i.test(url) ? { title: str(o.title, 200) ?? url, url } : null;
      })
      .filter((s): s is ProposalSource => Boolean(s))
      .slice(0, 12);
    const confidence = p.confidence === "high" || p.confidence === "medium" || p.confidence === "low" ? p.confidence : null;
    const dedupeKey = str(p.dedupeKey, 200) ?? (kind === "feedback" ? `feedback:${feedbackId}` : null);

    // 같은 내용이 이미 대기 중이면 새로 고치고, 처리(승인·거절)된 것이면 건너뜀
    if (dedupeKey) {
      const prev = (await client.execute({ sql: "SELECT id, status FROM proposals WHERE dedupe_key = ?", args: [dedupeKey] })).rows[0];
      if (prev) {
        if (Number(prev.status) === PROPOSAL_STATUS.pending) {
          await client.execute({
            sql: `UPDATE proposals SET title = ?, analysis = ?, company_id = ?, feedback_id = ?, options = ?, recommended = ?, sources = ?, confidence = ?, run_id = ?, created_at = ? WHERE id = ?`,
            args: [title, analysis, companyId, feedbackId, JSON.stringify(options), recommended, JSON.stringify(sources), confidence, runId, Date.now(), Number(prev.id)],
          });
          out.push({ index: i, id: Number(prev.id), status: "updated" });
        } else {
          out.push({ index: i, id: Number(prev.id), status: "skipped", reason: "이미 처리된 제안 (dedupeKey 같음)" });
        }
        continue;
      }
    }
    const res = await client.execute({
      sql: `INSERT INTO proposals (kind, title, analysis, company_id, feedback_id, options, recommended, sources, confidence, dedupe_key, run_id, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [kind, title, analysis, companyId, feedbackId, JSON.stringify(options), recommended, JSON.stringify(sources), confidence, dedupeKey, runId, Date.now()],
    });
    out.push({ index: i, id: Number(res.lastInsertRowid), status: "created" });
  }
  return out;
}

/** 에이전트에게 줄 할 일 목록 */
export async function automationInbox() {
  const client = await db();
  const [feedback, approved, keys] = await Promise.all([
    // 아직 제안이 없는 새 제보 (연락처·IP 는 주지 않음 · 거절된 제안의 제보는 운영자가 직접 처리)
    client.execute({
      sql: `SELECT f.id, f.kind, f.topic, f.company_id, f.company_name, f.page, f.body, f.source_url, f.created_at
            FROM feedback f WHERE f.status = ? AND NOT EXISTS (SELECT 1 FROM proposals p WHERE p.feedback_id = f.id)
            ORDER BY f.id LIMIT 100`,
      args: [FEEDBACK_STATUS.open],
    }),
    // 승인됐지만 저장소에 아직 반영 못 한 일정 수정 (GITHUB_TOKEN 이 없을 때)
    client.execute("SELECT * FROM proposals WHERE status = 1 ORDER BY id"),
    client.execute({
      sql: "SELECT dedupe_key, status, decided_at FROM proposals WHERE dedupe_key IS NOT NULL AND (status IN (0, 1) OR decided_at > ?)",
      args: [Date.now() - 45 * 86_400_000],
    }),
  ]);
  return {
    feedback: feedback.rows.map((r) => ({
      id: Number(r.id),
      kind: String(r.kind),
      topic: (r.topic as string | null) ?? null,
      companyId: (r.company_id as string | null) ?? null,
      companyName: (r.company_name as string | null) ?? null,
      page: (r.page as string | null) ?? null,
      body: String(r.body),
      sourceUrl: (r.source_url as string | null) ?? null,
      createdAt: new Date(Number(r.created_at)).toISOString(),
    })),
    approvedToApply: approved.rows.map(toItem).map((p) => ({
      id: p.id,
      title: p.title,
      record: p.options.find((o) => o.key === p.choice)?.record ?? null,
    })),
    // 이미 대기 중이거나 최근 45일 안에 처리한 제안 — 같은 dedupeKey 로 다시 올리지 마세요
    knownKeys: keys.rows.map((r) => ({
      key: String(r.dedupe_key),
      state: Number(r.status) === 0 ? "pending" : Number(r.status) === 1 ? "approved" : Number(r.status) === 3 ? "rejected" : "applied",
    })),
  };
}

export async function markProposalsApplied(ids: number[], note: string | null): Promise<number> {
  if (!ids.length) return 0;
  const client = await db();
  const res = await client.execute({
    sql: `UPDATE proposals SET status = 2, applied_at = ?, result = COALESCE(?, result) WHERE status IN (1, 4) AND id IN (${ids.map(() => "?").join(",")})`,
    args: [Date.now(), note, ...ids],
  });
  return res.rowsAffected;
}
