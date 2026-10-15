import Link from "next/link";
import { Suspense } from "react";
import { Bot, Check, CircleAlert, ExternalLink, Newspaper, X } from "lucide-react";
import { decideProposal } from "@/app/admin/proposal-actions";
import { ConfirmForm } from "@/components/admin/ModerationForm";
import { AdminCard, AdminPageTitle, AdminPager, EmptyRow, listHref, nf } from "@/components/admin/parts";
import { AdminSkeleton } from "@/components/admin/Skeleton";
import { DbSection } from "@/components/db/DbSection";
import { CompanyAvatar, cn } from "@/components/ui";
import { formatPostDateTime } from "@/lib/board-meta";
import { getCompany, getRecruitment } from "@/lib/data";
import { FEEDBACK_KINDS, isFeedbackKind } from "@/lib/feedback-meta";
import { EVENT_META } from "@/lib/meta";
import {
  CONFIDENCE_META,
  KIND_META,
  PROPOSAL_STATUS,
  PROPOSAL_STATUS_META,
  type ProposalItem,
  type ProposalOption,
} from "@/lib/proposals-meta";
import type { Recruitment, ScheduleEvent } from "@/lib/types";
import { requireAdmin } from "@/lib/server/admin";
import { lastRun, setupStatus } from "@/lib/server/automation";
import { todayKST } from "@/lib/date";
import { newsAdminCounts } from "@/lib/server/news";
import { feedbackBodies, listProposals, proposalCounts, type ProposalTab } from "@/lib/server/proposals";

export const metadata = { title: "AI 검토 제안" };

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

const TABS: [ProposalTab, string][] = [
  ["pending", "검토 대기"],
  ["approved", "반영 대기"],
  ["failed", "반영 실패"],
  ["done", "처리됨"],
];

export default function ProposalsPage({ searchParams }: PageProps<"/admin/proposals">) {
  return (
    <DbSection noticeTitle="DB가 연결되지 않았어요 (DATABASE_URL 확인)">
      <Suspense fallback={<AdminSkeleton />}>{searchParams.then((sp) => <Proposals sp={sp} />)}</Suspense>
    </DbSection>
  );
}

async function Proposals({ sp }: { sp: SP }) {
  await requireAdmin();
  const tab = (TABS.find(([k]) => k === one(sp.tab))?.[0] ?? "pending") as ProposalTab;
  const page = Math.max(1, Number.parseInt(one(sp.page), 10) || 1);
  const [{ items, total }, counts, run, mag] = await Promise.all([listProposals(tab, page), proposalCounts(), lastRun(), newsAdminCounts(todayKST())]);
  const setup = setupStatus();
  const fb = await feedbackBodies(items.map((p) => p.feedbackId).filter((x): x is number => x != null));

  return (
    <>
      <AdminPageTitle
        title="AI 검토 제안"
        desc="매일 정해진 시각에 클라우드 에이전트가 일정 데이터를 점검하고, 들어온 제보를 먼저 판단해서 처리 방법을 제안해요. 승인한 것만 사이트에 반영돼요."
      />

      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <AdminCard title="마지막 자동 점검">
          {run ? (
            <div className="space-y-2">
              <p className="flex items-center gap-2 type-caption text-ink-mute">
                <Bot className="h-4 w-4" strokeWidth={1.75} />
                <span className="tabular">{formatPostDateTime(run.at)}</span>
                {run.checked != null && <span>· 기관 {nf.format(run.checked)}곳 확인</span>}
                {run.proposed != null && <span>· 제안 {nf.format(run.proposed)}건</span>}
                {run.drafts != null && run.drafts > 0 && <span>· 초안 {nf.format(run.drafts)}건</span>}
              </p>
              <p className="whitespace-pre-wrap type-body-md text-ink-secondary">{run.summary}</p>
            </div>
          ) : (
            <p className="type-body-md text-ink-mute">아직 자동 점검 기록이 없어요. 루틴이 처음 실행되면 여기에 요약이 남아요.</p>
          )}
        </AdminCard>
        <AdminCard title="연결 상태">
          <ul className="space-y-2 type-body-md">
            <SetupRow ok={setup.token} label="AUTOMATION_TOKEN" desc={setup.token ? "에이전트가 제보를 읽고 제안을 올릴 수 있어요" : "Vercel 환경 변수에 넣어야 에이전트가 접속할 수 있어요"} />
            <SetupRow
              ok={setup.github}
              label="GITHUB_TOKEN (선택)"
              desc={setup.github ? `승인 즉시 ${setup.repo} 에 커밋 → 1~2분 뒤 반영` : "없으면 승인한 일정은 다음 자동 점검 때 반영돼요"}
            />
          </ul>
          {mag.drafts > 0 && (
            <Link href="/admin/news?filter=draft" className="mt-4 flex items-center gap-2 rounded-md bg-canvas-cream px-3 py-2 type-caption text-ink-secondary hover:underline">
              <Newspaper className="h-4 w-4" strokeWidth={1.75} />
              검토할 데일리 브리핑 초안 {mag.drafts}건 →
            </Link>
          )}
        </AdminCard>
      </div>

      <div className="no-scrollbar fade-x -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0 md:fade-x-none">
        {TABS.map(([key, label]) => {
          const n = key === "pending" ? counts.pending : key === "approved" ? counts.approved : key === "failed" ? counts.failed : null;
          return (
            <Link key={key} href={listHref("/admin/proposals", { tab: key === "pending" ? null : key })} className={cn("btn btn-sm shrink-0", tab === key ? "btn-on-dark" : "btn-toggle")}>
              {label}
              {n ? <span className="tabular">{n}</span> : null}
            </Link>
          );
        })}
      </div>

      {items.length === 0 ? (
        <EmptyRow>{tab === "pending" ? "검토할 제안이 없어요. 다음 자동 점검을 기다려 주세요." : "해당하는 제안이 없어요."}</EmptyRow>
      ) : (
        <div className="space-y-4">
          {items.map((p) => (
            <ProposalCard key={p.id} p={p} feedback={p.feedbackId != null ? fb.get(p.feedbackId) : undefined} />
          ))}
        </div>
      )}
      <AdminPager page={page} total={total} size={20} hrefFor={(n) => listHref("/admin/proposals", { tab: tab === "pending" ? null : tab, page: n })} />
    </>
  );
}

function SetupRow({ ok, label, desc }: { ok: boolean; label: string; desc: string }) {
  return (
    <li className="flex items-start gap-2">
      {ok ? <Check className="mt-0.5 h-4 w-4 shrink-0 text-ev-final" strokeWidth={2} /> : <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-lemon" strokeWidth={2} />}
      <span>
        <span className="font-mono text-[13px] text-ink">{label}</span>
        <span className="block type-caption text-ink-mute">{desc}</span>
      </span>
    </li>
  );
}

function ProposalCard({
  p,
  feedback,
}: {
  p: ProposalItem;
  feedback?: { kind: string; body: string; companyName: string | null; sourceUrl: string | null; createdAt: number; status: number };
}) {
  const company = p.companyId ? getCompany(p.companyId) : undefined;
  const current = p.companyId ? getRecruitment(p.companyId) : undefined;
  const status = PROPOSAL_STATUS_META[p.status] ?? PROPOSAL_STATUS_META[0];
  const pending = p.status === PROPOSAL_STATUS.pending;
  const chosen = p.options.find((o) => o.key === p.choice);

  return (
    <section className="card overflow-hidden shadow-level-1">
      <header className="flex flex-wrap items-center gap-2 border-b border-hairline px-5 py-3">
        <span className={cn("tag", KIND_META[p.kind].tone)}>{KIND_META[p.kind].label}</span>
        <span className={cn("tag", status.tone)}>{status.label}</span>
        {p.confidence && CONFIDENCE_META[p.confidence] && <span className={cn("tag", CONFIDENCE_META[p.confidence].tone)}>{CONFIDENCE_META[p.confidence].label}</span>}
        {company && (
          <Link href={`/companies/${company.id}`} target="_blank" className="inline-flex items-center gap-1.5 type-caption text-ink-secondary hover:underline">
            <CompanyAvatar company={company} size="sm" />
            {company.name}
          </Link>
        )}
        <span className="ml-auto tabular type-micro text-ink-mute">
          #{p.id} · {formatPostDateTime(p.createdAt)}
        </span>
      </header>

      <div className="space-y-4 px-5 py-4">
        <h2 className="type-heading-sm text-ink">{p.title}</h2>

        {feedback && (
          <div className="rounded-md bg-canvas-soft p-3">
            <p className="type-micro text-ink-mute">
              받은 {isFeedbackKind(feedback.kind) ? FEEDBACK_KINDS[feedback.kind].label : "제보"} · {formatPostDateTime(feedback.createdAt)}
              {feedback.companyName && ` · ${feedback.companyName}`}
            </p>
            <p className="mt-1 line-clamp-6 whitespace-pre-wrap type-body-md text-ink">{feedback.body}</p>
            {feedback.sourceUrl && (
              <a href={feedback.sourceUrl} target="_blank" rel="noopener noreferrer" className="link mt-1 inline-flex items-center gap-1 type-caption">
                첨부 링크 <ExternalLink className="h-3 w-3" strokeWidth={1.75} />
              </a>
            )}
          </div>
        )}

        <div>
          <p className="flex items-center gap-1.5 type-micro-cap text-ink-mute">
            <Bot className="h-3.5 w-3.5" strokeWidth={1.75} />
            AI 판단
          </p>
          <p className="mt-1 whitespace-pre-wrap type-body-md text-ink-secondary">{p.analysis}</p>
        </div>

        {p.sources.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {p.sources.map((s) => (
              <li key={s.url}>
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="inline-flex max-w-[320px] items-center gap-1 rounded-full border border-hairline px-2.5 py-1 type-caption text-ink-secondary hover:border-hairline-input">
                  <span className="truncate">{s.title}</span>
                  <ExternalLink className="h-3 w-3 shrink-0" strokeWidth={1.75} />
                </a>
              </li>
            ))}
          </ul>
        )}

        {pending ? (
          <ConfirmForm action={decideProposal} className="space-y-3">
            <input type="hidden" name="id" value={p.id} />
            <fieldset className="space-y-2">
              <legend className="mb-1 type-caption text-ink-secondary">처리 방법</legend>
              {p.options.map((o) => (
                <OptionCard key={o.key} o={o} recommended={o.key === p.recommended} defaultChecked={o.key === (p.recommended ?? p.options[0]?.key)} current={current} />
              ))}
            </fieldset>
            <input name="note" placeholder="메모 (선택) — 나중에 참고할 이유" maxLength={1000} className="input w-full" />
            <div className="flex flex-wrap justify-end gap-2">
              <button type="submit" name="decision" value="reject" className="btn btn-sm btn-toggle">
                <X className="h-3.5 w-3.5" strokeWidth={2} />
                거절
              </button>
              <button
                type="submit"
                name="decision"
                value="approve"
                data-confirm="고른 방법대로 처리할까요? 일정 반영을 고르면 사이트 데이터가 바뀌어요."
                className="btn btn-sm btn-primary"
              >
                <Check className="h-3.5 w-3.5" strokeWidth={2} />
                선택한 대로 처리
              </button>
            </div>
          </ConfirmForm>
        ) : (
          <div className="space-y-2 rounded-md border border-hairline p-3">
            {chosen && (
              <p className="type-body-md text-ink">
                선택: <span className="font-semibold">{chosen.label}</span>
              </p>
            )}
            {p.result && <p className="break-all type-caption text-ink-secondary">{p.result}</p>}
            {p.adminNote && <p className="type-caption text-ink-mute">메모: {p.adminNote}</p>}
            {p.decidedAt && <p className="tabular type-micro text-ink-mute">처리 {formatPostDateTime(p.decidedAt)}</p>}
            {chosen?.record && <ScheduleDiff current={current} next={chosen.record} />}
            {p.status === PROPOSAL_STATUS.failed && (
              <ConfirmForm action={decideProposal}>
                <input type="hidden" name="id" value={p.id} />
                <button type="submit" name="decision" value="retry" className="btn btn-sm btn-secondary">
                  다시 반영 시도
                </button>
              </ConfirmForm>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function OptionCard({ o, recommended, defaultChecked, current }: { o: ProposalOption; recommended: boolean; defaultChecked: boolean; current: Recruitment | undefined }) {
  return (
    <label className="block cursor-pointer rounded-lg border border-hairline p-3 has-[:checked]:border-primary has-[:checked]:bg-ev-written-soft">
      <span className="flex flex-wrap items-center gap-2">
        <input type="radio" name="choice" value={o.key} defaultChecked={defaultChecked} className="accent-[#533afd]" />
        <span className="type-body-md font-semibold text-ink">{o.label}</span>
        {recommended && <span className="tag bg-brand-dark text-on-primary">AI 추천</span>}
        <span className="tag bg-canvas-soft text-ink-mute">{ACTION_LABEL[o.action]}</span>
      </span>
      {o.description && <span className="mt-1 block pl-6 type-caption text-ink-secondary">{o.description}</span>}
      {o.record && (
        <span className="mt-3 block pl-6">
          <ScheduleDiff current={current} next={o.record} />
        </span>
      )}
    </label>
  );
}

const ACTION_LABEL: Record<ProposalOption["action"], string> = {
  update_schedule: "일정 데이터 반영",
  feedback_done: "제보 처리 완료",
  feedback_delete: "제보 삭제",
  none: "변경 없음",
};

/* ------------------------------------------------------------------ */
/* 지금 일정 vs 제안 일정                                                 */
/* ------------------------------------------------------------------ */

function fmt(e: ScheduleEvent | undefined): string {
  if (!e) return "—";
  const d = (k: string) => k.slice(2).replace(/-/g, "."); // 26.10.18
  return `${d(e.date)}${e.endDate && e.endDate !== e.date ? `~${d(e.endDate)}` : ""}${e.time ? ` ${e.time}` : ""}`;
}

function ScheduleDiff({ current, next }: { current: Recruitment | undefined; next: Recruitment }) {
  const key = (e: ScheduleEvent) => `${e.type}|${e.label ?? ""}`;
  // 제안 일정 순서(날짜순) 기준, 빠진 기존 일정은 날짜 자리에 끼워 넣음
  const keys = [
    ...new Map(
      [...next.events, ...(current?.events ?? [])].sort((a, b) => (a.date === b.date ? 0 : a.date < b.date ? -1 : 1)).map((e) => [key(e), e]),
    ).keys(),
  ];
  const cur = new Map((current?.events ?? []).map((e) => [key(e), e]));
  const nxt = new Map(next.events.map((e) => [key(e), e]));
  const field = (label: string, a: string | number | undefined, b: string | number | undefined) =>
    String(a ?? "") !== String(b ?? "") ? (
      <tr key={label} className="border-t border-hairline">
        <td className="px-2 py-1.5 text-ink-mute">{label}</td>
        <td className="px-2 py-1.5 text-ink-mute line-through">{a ?? "—"}</td>
        <td className="px-2 py-1.5 text-ink">{b ?? "—"}</td>
        <td className="px-2 py-1.5" />
      </tr>
    ) : null;

  return (
    <span className="block overflow-x-auto rounded-md border border-hairline bg-canvas">
      <table className="w-full min-w-[460px] type-caption">
        <thead className="bg-canvas-soft text-ink-mute">
          <tr>
            <th className="px-2 py-1.5 text-left font-normal">단계</th>
            <th className="px-2 py-1.5 text-left font-normal">지금 사이트</th>
            <th className="px-2 py-1.5 text-left font-normal">제안</th>
            <th className="px-2 py-1.5 text-left font-normal" />
          </tr>
        </thead>
        <tbody>
          {field("공고명", current?.title, next.title)}
          {field("시기", current?.period, next.period)}
          {field("인원", current?.headcount, next.headcount)}
          {field("상태", current?.status === "expected" ? "예상" : current ? "확정" : undefined, next.status === "expected" ? "예상" : "확정")}
          {keys.map((k) => {
            const a = cur.get(k);
            const b = nxt.get(k);
            const ev = (b ?? a)!;
            const changed = fmt(a) !== fmt(b);
            const tag = !a ? "추가" : !b ? "삭제" : changed ? "변경" : "";
            return (
              <tr key={k} className={cn("border-t border-hairline", changed && "bg-canvas-cream/50")}>
                <td className="px-2 py-1.5 whitespace-nowrap text-ink-secondary">
                  {EVENT_META[ev.type]?.label ?? ev.type}
                  {ev.label && <span className="text-ink-mute"> · {ev.label}</span>}
                </td>
                <td className={cn("px-2 py-1.5 tabular", changed ? "text-ink-mute line-through" : "text-ink-secondary")}>{fmt(a)}</td>
                <td className={cn("px-2 py-1.5 tabular", changed ? "font-semibold text-ink" : "text-ink-secondary")}>{fmt(b)}</td>
                <td className="px-2 py-1.5">
                  {tag && <span className={cn("tag", tag === "삭제" ? "bg-ev-doc-soft text-ev-doc" : tag === "추가" ? "bg-ev-final-soft text-ev-final" : "bg-canvas-cream text-lemon")}>{tag}</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {next.note && <span className="block border-t border-hairline px-2 py-1.5 type-micro text-ink-mute">메모: {next.note}</span>}
    </span>
  );
}
