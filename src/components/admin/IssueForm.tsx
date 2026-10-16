"use client";

import { useActionState, useState } from "react";
import { Loader2 } from "lucide-react";
import { saveIssue, type IssueFormState } from "@/app/admin/issue-actions";
import type { IssueEdition, IssueExtras, QuizItem } from "@/lib/news-meta";
import { cn } from "../ui";

export interface IssueFormInitial {
  id: number | null;
  date: string;
  edition: IssueEdition;
  title: string;
  lede: string;
  closing: string;
  quiz: QuizItem[];
  extras: IssueExtras;
}

const QUIZ_SLOTS = 4;

/** 브리핑(호) 쓰기·고치기 — 기사는 같은 날짜·판으로 쓴 것이 자동으로 묶여요 */
export function IssueForm({ initial }: { initial: IssueFormInitial }) {
  const [state, action, pending] = useActionState<IssueFormState, FormData>(saveIssue, { ok: false });
  const [lede, setLede] = useState(initial.lede);
  const [edition, setEdition] = useState<IssueEdition>(initial.edition);

  return (
    <form action={action} className="space-y-5">
      {initial.id && <input type="hidden" name="id" value={initial.id} />}
      <div className="grid gap-3 sm:grid-cols-[200px_200px]">
        <label className="block">
          <span className="mb-1 block type-caption text-ink-secondary">브리핑 날짜</span>
          <input type="date" name="date" defaultValue={initial.date} required className="input w-full" />
        </label>
        <label className="block">
          <span className="mb-1 block type-caption text-ink-secondary">판</span>
          <select name="edition" value={edition} onChange={(e) => setEdition(e.target.value as IssueEdition)} className="input w-full">
            <option value="morning">아침판 — 기사 브리핑 + 퀴즈</option>
            <option value="noon">금콩 스터디 (점심) — 숫자·용어·논술·면접·퀴즈</option>
          </select>
        </label>
      </div>
      <label className="block">
        <span className="mb-1 block type-caption text-ink-secondary">제목 — 목록·카드에 보이는 한 줄 (브리핑 본문 위에는 안 나와요)</span>
        <input
          name="title"
          defaultValue={initial.title}
          maxLength={120}
          required
          className="input w-full !text-[17px]"
          placeholder={edition === "morning" ? "예: 코스피 7% 급락, 서킷브레이커까지 — 당국은 '기초체력 안정'" : "예: 광의통화(M2)부터 시장 전이 위험까지"}
        />
      </label>
      <label className="block">
        <span className="mb-1 flex justify-between gap-3 type-caption text-ink-secondary">
          <span>{edition === "morning" ? "오늘의 흐름 — 오늘 기사들이 어떻게 이어지는지 2~3문장" : "오늘의 스터디 — 오늘 공부할 것을 2~3문장으로"}</span>
          <span className="tabular text-ink-mute">{lede.length}/1200</span>
        </span>
        <textarea name="lede" value={lede} onChange={(e) => setLede(e.target.value)} rows={4} maxLength={1200} required className="input w-full resize-y leading-relaxed" />
      </label>
      <label className="block">
        <span className="mb-1 block type-caption text-ink-secondary">맺는 말 (선택) — 지금은 브리핑 화면에 나오지 않아요 (메모용)</span>
        <input name="closing" defaultValue={initial.closing} maxLength={400} className="input w-full" placeholder="예: 시장이 출렁일수록 '왜 그런지' 설명할 수 있는 사람이 돋보여요." />
      </label>

      {edition === "noon" && (
        <>
          <fieldset className="rounded-lg border border-hairline px-4 py-4">
            <legend className="px-1 type-caption font-semibold text-ink-secondary">① 숫자로 보는 오늘 (3개) — 아침판 기사에 나온 숫자만</legend>
            <div className="mt-2 space-y-3">
              {[0, 1, 2, 3].map((i) => {
                const n = initial.extras.numbers[i];
                return (
                  <div key={i} className="grid gap-2 sm:grid-cols-[120px_minmax(0,1fr)_minmax(0,1.4fr)]">
                    <input name={`num${i}_v`} defaultValue={n?.value ?? ""} maxLength={24} className="input w-full" placeholder={i === 0 ? "예: 7.57%" : `숫자 ${i + 1}${i === 3 ? " (선택)" : ""}`} />
                    <input name={`num${i}_l`} defaultValue={n?.label ?? ""} maxLength={80} className="input w-full" placeholder="무슨 숫자 (예: 15일 코스피 하락률)" />
                    <input name={`num${i}_n`} defaultValue={n?.note ?? ""} maxLength={160} className="input w-full" placeholder="한 줄 의미 (선택)" />
                  </div>
                );
              })}
            </div>
          </fieldset>
          <fieldset className="rounded-lg border border-hairline px-4 py-4">
            <legend className="px-1 type-caption font-semibold text-ink-secondary">③ 논술 한 문단 — 주제와 서론·본론·결론 개요, 쓸 만한 근거</legend>
            <div className="mt-2 space-y-2">
              <input name="essay_topic" defaultValue={initial.extras.essay?.topic ?? ""} maxLength={200} className="input w-full" placeholder="논술 주제 (예: 외국인 자금 유출과 증시 급락이 금융시장에 주는 영향과 정책 대응)" />
              <textarea name="essay_intro" defaultValue={initial.extras.essay?.intro ?? ""} rows={2} maxLength={600} className="input w-full resize-y" placeholder="서론 — 어떤 사실로 문제를 제기할지" />
              <textarea name="essay_body" defaultValue={initial.extras.essay?.body ?? ""} rows={3} maxLength={900} className="input w-full resize-y" placeholder="본론 — 원인·영향·대응을 어떻게 풀지" />
              <textarea name="essay_conclusion" defaultValue={initial.extras.essay?.conclusion ?? ""} rows={2} maxLength={600} className="input w-full resize-y" placeholder="결론 — 어떤 관점으로 마무리할지" />
              <textarea name="essay_evidence" defaultValue={initial.extras.essay?.evidence.join("\n") ?? ""} rows={3} maxLength={1000} className="input w-full resize-y" placeholder="쓸 만한 근거 — 한 줄에 하나 (기사에 나온 숫자·사실)" />
            </div>
          </fieldset>
        </>
      )}

      <fieldset className="rounded-lg border border-hairline px-4 py-4">
        <legend className="px-1 type-caption font-semibold text-ink-secondary">
          {edition === "morning" ? "브리핑 퀴즈 (3~4문제) — 오늘 기사 내용으로만, 보기 2개면 O/X 처럼 보여요" : "⑤ 점심 퀴즈 (3문제) — 보기를 O, X 두 개만 쓰면 O/X 문제가 돼요"}
        </legend>
        <div className="mt-2 space-y-5">
          {Array.from({ length: QUIZ_SLOTS }, (_, i) => {
            const q = initial.quiz[i];
            return (
              <div key={i} className="space-y-2 border-t border-hairline pt-4 first:border-t-0 first:pt-0">
                <input name={`quiz${i}_q`} defaultValue={q?.question ?? ""} maxLength={300} className="input w-full" placeholder={`Q${i + 1}. 질문 (비우면 이 문제는 빠져요)`} />
                <div className="grid gap-2 sm:grid-cols-2">
                  {[0, 1, 2, 3].map((k) => (
                    <input key={k} name={`quiz${i}_o${k}`} defaultValue={q?.options[k] ?? ""} maxLength={120} className="input w-full" placeholder={`보기 ${k + 1}${k >= 2 ? " (선택)" : ""}`} />
                  ))}
                </div>
                <div className="grid gap-2 sm:grid-cols-[140px_minmax(0,1fr)]">
                  <select name={`quiz${i}_a`} defaultValue={String(q?.answer ?? 0)} className="input w-full">
                    {[0, 1, 2, 3].map((k) => (
                      <option key={k} value={k}>
                        정답: 보기 {k + 1}
                      </option>
                    ))}
                  </select>
                  <input name={`quiz${i}_e`} defaultValue={q?.explain ?? ""} maxLength={500} className="input w-full" placeholder="해설 — 기사 내용으로 한두 문장" />
                </div>
              </div>
            );
          })}
        </div>
      </fieldset>

      {state.error && <p className="rounded-md bg-ev-doc-soft p-3 type-caption text-ev-doc">{state.error}</p>}
      {state.ok && <p className="rounded-md bg-ev-final-soft p-3 type-caption text-ev-final">저장했어요.</p>}
      <div className="flex justify-end">
        <button type="submit" disabled={pending} className={cn("btn btn-sm btn-primary", pending && "opacity-60")}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />}
          브리핑 저장
        </button>
      </div>
    </form>
  );
}
