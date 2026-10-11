"use client";

import { useActionState, useState } from "react";
import { CheckCircle2, ChevronDown } from "lucide-react";
import { submitReview, type ReviewActionState } from "@/app/reviews/actions";
import {
  OVERALL_OPTIONS,
  STYLE_OPTIONS,
  SUBJECT_SCALE,
  TIME_OPTIONS,
  UNSOLVED_OPTIONS,
  type ExamInfo,
  type MyReview,
} from "@/lib/review-meta";
import { cn } from "../ui";

const LIMIT = { oneLiner: 60, detail: 800 };

/** 라디오를 알약 버튼처럼 보여 주는 선택지 */
function Pill({
  name,
  value,
  checked,
  onChange,
  children,
  className,
}: {
  name: string;
  value: string | number;
  checked: boolean;
  onChange: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label
      className={cn(
        "flex min-h-10 cursor-pointer items-center justify-center rounded-full border px-3 py-2 text-center type-caption transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primary",
        checked
          ? "border-brand-dark bg-brand-dark text-on-primary"
          : "border-hairline bg-canvas text-ink-secondary hover:border-hairline-input",
        className,
      )}
    >
      <input type="radio" name={name} value={value} checked={checked} onChange={onChange} className="sr-only" />
      {children}
    </label>
  );
}

function Question({
  n,
  title,
  hint,
  required = false,
  children,
}: {
  n: number;
  title: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="border-t border-hairline pt-5 first:border-t-0 first:pt-0">
      <legend className="flex w-full items-baseline gap-2">
        <span className="tabular type-caption text-primary-text">Q{n}</span>
        <span className="type-body-lg !font-normal text-ink">{title}</span>
        {required ? (
          <span className="type-micro text-ruby">필수</span>
        ) : (
          <span className="type-micro text-ink-mute">선택</span>
        )}
      </legend>
      {hint && <p className="mt-1 type-micro text-ink-mute">{hint}</p>}
      <div className="mt-3">{children}</div>
    </fieldset>
  );
}

export function ReviewForm({ exam, initial }: { exam: ExamInfo; initial: MyReview | null }) {
  const [overall, setOverall] = useState<number | null>(initial?.overall ?? null);
  const [time, setTime] = useState<number | null>(initial?.timePressure ?? null);
  const [hardest, setHardest] = useState<string | null>(initial?.hardest ?? null);
  const [subjects, setSubjects] = useState<Record<string, number>>(initial?.subjects ?? {});
  const [unsolved, setUnsolved] = useState<Record<string, number>>(initial?.unsolved ?? {});
  const [totals, setTotals] = useState<Record<string, string>>(() =>
    Object.fromEntries(Object.entries(initial?.totals ?? {}).map(([k, v]) => [k, String(v)])),
  );
  const [style, setStyle] = useState<string | null>(initial?.style ?? null);
  const [track, setTrack] = useState(initial?.track ?? "");
  const [oneLiner, setOneLiner] = useState(initial?.oneLiner ?? "");
  const [detail, setDetail] = useState(initial?.detail ?? "");
  const [detailOpen, setDetailOpen] = useState(Boolean(initial?.detail));
  const [editing, setEditing] = useState(!initial);
  const [justSaved, setJustSaved] = useState(false);

  const [state, action, pending] = useActionState<ReviewActionState, FormData>(async (prev, fd) => {
    const res = await submitReview(prev, fd);
    if (res.ok) {
      setEditing(false);
      setJustSaved(true);
    }
    return res;
  }, { ok: false });

  if (!editing) {
    return (
      <div>
        <p className="flex items-center gap-2 type-body-lg !font-normal text-ink">
          <CheckCircle2 className="h-5 w-5 text-ev-final" strokeWidth={1.75} />
          {justSaved ? (state.updated ? "응답을 고쳤어요" : "참여해 주셔서 고마워요!") : "이 시험에 이미 참여했어요"}
        </p>
        <p className="mt-2 type-body-md text-ink-secondary">
          내 응답: 전체 <span className="text-ink">{OVERALL_OPTIONS.find((o) => o.value === overall)?.label}</span> · 시간{" "}
          <span className="text-ink">{TIME_OPTIONS.find((o) => o.value === time)?.label}</span>
          {hardest && (
            <>
              {" "}
              · 가장 어려웠던 과목 <span className="text-ink">{hardest}</span>
            </>
          )}
          {exam.sections
            .filter((s) => unsolved[s] != null)
            .map((s) => (
              <span key={s}>
                {" "}
                · {s === "필기" ? "" : `${s} `}못 푼 문항{" "}
                <span className="text-ink">{UNSOLVED_OPTIONS.find((o) => o.value === unsolved[s])?.label}</span>
              </span>
            ))}
        </p>
        <p className="mt-1 type-caption text-ink-mute">결과는 바로 반영돼요. 같은 브라우저에서는 언제든 고칠 수 있어요.</p>
        <button type="button" onClick={() => setEditing(true)} className="btn btn-toggle btn-sm mt-4">
          응답 고치기
        </button>
      </div>
    );
  }

  const disabled = pending || overall == null || time == null;
  // 선택 질문은 보이는 것만 차례로 번호를 매깁니다
  let qn = 2;

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="examId" value={exam.id} />
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />

      <Question n={1} title="전체 난이도는 어땠나요?" required>
        <div className="grid grid-cols-5 gap-1.5">
          {OVERALL_OPTIONS.map((o) => (
            <Pill
              key={o.value}
              name="overall"
              value={o.value}
              checked={overall === o.value}
              onChange={() => setOverall(o.value)}
              className="!rounded-lg !px-1 leading-tight"
            >
              {o.label}
            </Pill>
          ))}
        </div>
      </Question>

      <Question n={2} title="시간은 충분했나요?" required>
        <div className="grid grid-cols-4 gap-1.5">
          {TIME_OPTIONS.map((o) => (
            <Pill key={o.value} name="time" value={o.value} checked={time === o.value} onChange={() => setTime(o.value)} className="!rounded-lg !px-1 leading-tight">
              {o.label}
            </Pill>
          ))}
        </div>
      </Question>

      {exam.sections.length > 0 && (
        <Question
          n={++qn}
          title="못 풀고 넘긴(찍은) 문항은 몇 개였나요?"
          hint="총 문항 수를 몰라도 괜찮아요. 시간이 모자라 못 풀었거나 찍은 문항을 대략 골라 주세요. (논술 제외)"
        >
          <div className="space-y-4">
            {exam.sections.map((s) => (
              <div key={s}>
                {(exam.sections.length > 1 || s !== "필기") && (
                  <p className="mb-1.5 type-caption !font-normal text-ink-secondary">{s}</p>
                )}
                <div className="grid grid-cols-3 gap-1.5">
                  {UNSOLVED_OPTIONS.map((o) => (
                    <Pill
                      key={o.value}
                      name={`unsolved:${s}`}
                      value={o.value}
                      checked={unsolved[s] === o.value}
                      onChange={() => setUnsolved((prev) => ({ ...prev, [s]: o.value }))}
                      className="!rounded-lg !px-1"
                    >
                      {o.label}
                    </Pill>
                  ))}
                </div>
                <label className="mt-2 flex items-center gap-2 type-caption text-ink-mute">
                  총 문항 수를 안다면
                  <input
                    name={`total:${s}`}
                    type="number"
                    inputMode="numeric"
                    min={5}
                    max={300}
                    value={totals[s] ?? ""}
                    onChange={(e) => setTotals((prev) => ({ ...prev, [s]: e.target.value }))}
                    placeholder="예: 50"
                    className="input !min-h-0 w-20 !py-1 tabular type-caption"
                    aria-label={`${s} 총 문항 수`}
                  />
                  문항 <span className="type-micro">(선택)</span>
                </label>
              </div>
            ))}
          </div>
        </Question>
      )}

      {exam.subjects.length > 1 && (
        <Question n={++qn} title="가장 어려웠던 과목은?">
          <div className="flex flex-wrap gap-1.5">
            {exam.subjects.map((s) => (
              <Pill key={s} name="hardest" value={s} checked={hardest === s} onChange={() => setHardest(s)}>
                {s}
              </Pill>
            ))}
          </div>
        </Question>
      )}

      <Question n={++qn} title="과목별 체감 난이도" hint="본 과목만 골라도 돼요. 왼쪽일수록 쉬움, 오른쪽일수록 어려움">
        <div className="space-y-2">
          {exam.subjects.map((s) => (
            <div key={s} className="grid grid-cols-[minmax(0,88px)_1fr] items-center gap-2">
              <span className="truncate type-caption text-ink-secondary" title={s}>
                {s}
              </span>
              <div className="grid grid-cols-5 gap-1" role="radiogroup" aria-label={`${s} 난이도`}>
                {SUBJECT_SCALE.map((label, i) => {
                  const v = i + 1;
                  const on = subjects[s] === v;
                  return (
                    <label
                      key={v}
                      title={label}
                      className={cn(
                        "flex h-8 cursor-pointer items-center justify-center rounded-md border tabular type-micro transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primary",
                        on ? "border-primary bg-primary text-on-primary" : "border-hairline text-ink-mute hover:border-hairline-input",
                      )}
                    >
                      <input
                        type="radio"
                        name={`subject:${s}`}
                        value={v}
                        checked={on}
                        onChange={() => setSubjects((prev) => ({ ...prev, [s]: v }))}
                        className="sr-only"
                        aria-label={`${s} ${label}`}
                      />
                      {v}
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
          <div className="grid grid-cols-[minmax(0,88px)_1fr] gap-2 type-micro text-ink-mute">
            <span />
            <span className="flex justify-between">
              <span>쉬움</span>
              <span>어려움</span>
            </span>
          </div>
        </div>
      </Question>

      {exam.askStyle && (
        <Question n={++qn} title="NCS 문제 스타일은?">
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
            {STYLE_OPTIONS.map((o) => (
              <Pill key={o.value} name="style" value={o.value} checked={style === o.value} onChange={() => setStyle(o.value)}>
                {o.label}
              </Pill>
            ))}
          </div>
        </Question>
      )}

      {exam.tracks.length > 1 && (
        <label className="block border-t border-hairline pt-5">
          <span className="type-body-md text-ink-secondary">응시 직렬 (선택)</span>
          <select name="track" value={track} onChange={(e) => setTrack(e.target.value)} className="input mt-2 w-full">
            <option value="">선택 안 함</option>
            {exam.tracks.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
      )}

      <div className="border-t border-hairline pt-5">
        <label className="block">
          <span className="flex justify-between type-body-md text-ink-secondary">
            한 줄 후기 (선택)
            <span className="tabular type-micro text-ink-mute">
              {oneLiner.length}/{LIMIT.oneLiner}
            </span>
          </span>
          <input
            name="oneLiner"
            value={oneLiner}
            onChange={(e) => setOneLiner(e.target.value)}
            maxLength={LIMIT.oneLiner}
            placeholder="예: 수리가 생각보다 오래 걸렸어요"
            className="input mt-2 w-full"
          />
        </label>
        {!detailOpen ? (
          <button type="button" onClick={() => setDetailOpen(true)} className="link mt-3 inline-flex items-center gap-1 type-caption">
            <ChevronDown className="h-3.5 w-3.5" strokeWidth={1.75} />
            조금 더 자세히 남기기
          </button>
        ) : (
          <label className="mt-4 block">
            <span className="flex justify-between type-body-md text-ink-secondary">
              자세한 후기 (선택)
              <span className="tabular type-micro text-ink-mute">
                {detail.length}/{LIMIT.detail}
              </span>
            </span>
            <textarea
              name="detail"
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              maxLength={LIMIT.detail}
              rows={5}
              placeholder="출제 경향, 시간 배분 팁 등을 적어 주세요. 문제 원문을 옮기는 것은 금지예요."
              className="input mt-2 w-full resize-y"
            />
          </label>
        )}
      </div>

      {state.error && <p className="rounded-md bg-ev-doc-soft p-3 type-caption text-ev-doc">{state.error}</p>}

      <div className="flex items-center gap-3">
        <button type="submit" disabled={disabled} className={cn("btn btn-primary flex-1", disabled && "cursor-not-allowed opacity-50")}>
          {pending ? "보내는 중…" : initial || justSaved ? "응답 고치기" : "후기 남기고 결과 보기"}
        </button>
        {(initial || justSaved) && (
          <button type="button" onClick={() => setEditing(false)} className="btn btn-toggle">
            취소
          </button>
        )}
      </div>
      <p className="type-micro text-ink-mute">익명으로 집계돼요. 브라우저당 한 번 참여할 수 있고, 다시 내면 고쳐집니다.</p>
    </form>
  );
}
