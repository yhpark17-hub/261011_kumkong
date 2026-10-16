"use client";

import { useActionState, useState } from "react";
import { Loader2 } from "lucide-react";
import { saveIssue, type IssueFormState } from "@/app/admin/issue-actions";
import { cn } from "../ui";

export interface IssueFormInitial {
  id: number | null;
  date: string;
  title: string;
  lede: string;
  closing: string;
}

/** 레터(호) 쓰기·고치기 — 기사는 그날 날짜로 쓴 브리핑 기사가 자동으로 묶여요 */
export function IssueForm({ initial }: { initial: IssueFormInitial }) {
  const [state, action, pending] = useActionState<IssueFormState, FormData>(saveIssue, { ok: false });
  const [lede, setLede] = useState(initial.lede);
  return (
    <form action={action} className="space-y-5">
      {initial.id && <input type="hidden" name="id" value={initial.id} />}
      <label className="block max-w-[200px]">
        <span className="mb-1 block type-caption text-ink-secondary">레터 날짜 (이 날짜의 기사가 묶여요)</span>
        <input type="date" name="date" defaultValue={initial.date} required className="input w-full" />
      </label>
      <label className="block">
        <span className="mb-1 block type-caption text-ink-secondary">제목 — 그날 가장 중요한 이야기를 한 줄로 (메일 제목처럼)</span>
        <input name="title" defaultValue={initial.title} maxLength={120} required className="input w-full !text-[17px]" placeholder="예: 코스피 7% 급락, 서킷브레이커까지 — 당국은 '기초체력 안정'" />
      </label>
      <label className="block">
        <span className="mb-1 flex justify-between gap-3 type-caption text-ink-secondary">
          <span>오늘의 흐름 (여는 글) — 오늘 기사들이 어떻게 이어지는지 2~3문장</span>
          <span className="tabular text-ink-mute">{lede.length}/1200</span>
        </span>
        <textarea name="lede" value={lede} onChange={(e) => setLede(e.target.value)} rows={4} maxLength={1200} required className="input w-full resize-y leading-relaxed" />
      </label>
      <label className="block">
        <span className="mb-1 block type-caption text-ink-secondary">맺는 말 (선택) — 레터 끝에 콩이 옆에 들어가는 한마디</span>
        <input name="closing" defaultValue={initial.closing} maxLength={400} className="input w-full" placeholder="예: 시장이 출렁일수록 '왜 그런지' 설명할 수 있는 사람이 돋보여요." />
      </label>

      {state.error && <p className="rounded-md bg-ev-doc-soft p-3 type-caption text-ev-doc">{state.error}</p>}
      {state.ok && <p className="rounded-md bg-ev-final-soft p-3 type-caption text-ev-final">저장했어요.</p>}
      <div className="flex justify-end">
        <button type="submit" disabled={pending} className={cn("btn btn-sm btn-primary", pending && "opacity-60")}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />}
          레터 저장
        </button>
      </div>
    </form>
  );
}
