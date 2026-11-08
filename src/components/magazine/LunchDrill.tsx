"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Check, Share2, X } from "lucide-react";
import { answerDrill, drillTally, type DrillTally } from "@/app/magazine/actions";
import { CIRCLED } from "@/lib/news-meta";
import { cn } from "../ui";

/**
 * 점심 3문제 — 누르면 바로 채점·해설, 다른 독자들이 고른 보기(실제 답만, 5명부터), 다 풀면 점수와 연속 풀이 일수.
 * 고른 답은 이 기기에만 저장해요(localStorage). 문제 위 그림·해설 속 짝꿍 표는 서버에서 그려 넘겨줘요.
 */

export interface DrillView {
  /** 'Q1 · 시사 · 쉬움' 이름표 */
  tag: string;
  subject: string;
  stem: string;
  options: string[];
  answer: number;
  explain: string;
  /** 문제 위 (그림·출처 기사) */
  head: ReactNode;
  /** 해설 아래 (헷갈리는 짝꿍·출처) */
  extra: ReactNode;
}

/** 정답률을 보여 주는 최소 인원 — 너무 적으면 숫자가 흔들려서 */
const MIN_VOTERS = 5;

const C = { ink: "#27325f", navy: "#2b3a7a", body: "#4a5280", mute: "#7a86b8", peri: "#7f96e8", orange: "#f7a14a", paper: "#fffdf8" };

const storeKey = (id: number) => `kk-drill:${id}`;
const STREAK = "kk-drill:streak";

function readPicks(id: number, n: number): (number | null)[] {
  try {
    const v = JSON.parse(localStorage.getItem(storeKey(id)) ?? "null") as unknown;
    if (Array.isArray(v)) return Array.from({ length: n }, (_, i) => (Number.isInteger(v[i]) ? (v[i] as number) : null));
  } catch {
    /* 저장 못 하는 브라우저 */
  }
  return Array.from({ length: n }, () => null);
}

function kstToday(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date());
}

/** 오늘 호를 다 풀었을 때 연속 풀이 일수 (어제도 풀었으면 +1) */
function bumpStreak(date: string): number {
  try {
    const prev = JSON.parse(localStorage.getItem(STREAK) ?? "null") as { last?: string; n?: number } | null;
    const y = new Date(`${date}T00:00:00Z`);
    y.setUTCDate(y.getUTCDate() - 1);
    const yesterday = y.toISOString().slice(0, 10);
    const n = prev?.last === date ? (prev.n ?? 1) : prev?.last === yesterday ? (prev.n ?? 0) + 1 : 1;
    localStorage.setItem(STREAK, JSON.stringify({ last: date, n }));
    return n;
  } catch {
    return 0;
  }
}

function readStreak(date: string): number {
  try {
    const prev = JSON.parse(localStorage.getItem(STREAK) ?? "null") as { last?: string; n?: number } | null;
    return prev?.last === date ? (prev.n ?? 0) : 0;
  } catch {
    return 0;
  }
}

export function LunchDrill({ issueId, date, live, questions, sharePath, shareTitle }: { issueId: number; date: string; live: boolean; questions: DrillView[]; sharePath: string; shareTitle: string }) {
  const [picks, setPicks] = useState<(number | null)[]>(() => questions.map(() => null));
  const [tally, setTally] = useState<DrillTally | null>(null);
  const [streak, setStreak] = useState(0);

  // 이 기기에서 이미 푼 답·연속 일수 불러오기 (+ 그 문제들의 다른 독자 답)
  useEffect(() => {
    const saved = readPicks(issueId, questions.length);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 저장된 답은 브라우저에서만 읽을 수 있어요
    setPicks(saved);
    setStreak(readStreak(date));
    if (live && saved.some((p) => p !== null)) drillTally(issueId).then((t) => t && setTally(t)).catch(() => {});
  }, [issueId, date, live, questions.length]);

  const done = picks.filter((p) => p !== null).length;
  const score = picks.filter((p, i) => p !== null && p === questions[i].answer).length;
  const finished = done === questions.length;

  function pick(q: number, choice: number) {
    if (picks[q] !== null) return;
    const next = picks.map((p, i) => (i === q ? choice : p));
    setPicks(next);
    try {
      localStorage.setItem(storeKey(issueId), JSON.stringify(next));
    } catch {
      /* 무시 */
    }
    if (next.every((p) => p !== null) && date === kstToday()) setStreak(bumpStreak(date));
    if (live) answerDrill(issueId, q, choice).then((t) => t && setTally(t)).catch(() => {});
  }

  return (
    <div className="space-y-5">
      {/* 몇 문제 풀었나 */}
      <div className="flex items-center gap-3 px-1">
        <div className="flex gap-1.5" aria-hidden>
          {questions.map((q, i) => (
            <span
              key={i}
              className="h-2.5 w-8 rounded-full transition-colors"
              style={{ background: picks[i] === null ? "#e3e8fc" : picks[i] === q.answer ? "#56b37e" : "#ef8a8a" }}
            />
          ))}
        </div>
        <p className="text-[13px] font-semibold" style={{ color: C.mute }} aria-live="polite">
          {finished ? `${questions.length}문제 다 풀었어요` : `${questions.length}문제 중 ${done}개 풀었어요`}
        </p>
      </div>

      {questions.map((q, i) => (
        <Question key={i} no={i} q={q} picked={picks[i]} counts={tally?.counts[i] ?? null} onPick={(c) => pick(i, c)} />
      ))}

      <Result total={questions.length} done={done} score={score} streak={streak} sharePath={sharePath} shareTitle={shareTitle} />
    </div>
  );
}

function Question({ no, q, picked, counts, onPick }: { no: number; q: DrillView; picked: number | null; counts: number[] | null; onPick: (c: number) => void }) {
  const answered = picked !== null;
  const voters = counts ? counts.reduce((a, b) => a + b, 0) : 0;
  const showRate = answered && voters >= MIN_VOTERS;
  const right = picked === q.answer;
  const rate = showRate && counts ? Math.round((counts[q.answer] / voters) * 100) : null;
  // 가장 많이 고른 오답
  const trap = showRate && counts ? counts.map((n, i) => ({ n, i })).filter((x) => x.i !== q.answer && x.n > 0).sort((a, b) => b.n - a.n)[0] : undefined;
  return (
    <section id={`drill-${no + 1}`} className="scroll-mt-24 overflow-clip rounded-[24px] bg-[#ffffff] shadow-[0_14px_30px_-20px_rgba(43,58,122,0.55)] ring-1 ring-[#2b3a7a]/[0.07]">
      {q.head}
      <div className="px-4 pt-4 pb-5 sm:px-6">
        <p className="flex flex-wrap items-center gap-1.5 text-[12px] font-bold">
          <span className="rounded-full px-2.5 py-1 text-[#ffffff]" style={{ background: C.navy }}>
            {q.tag}
          </span>
          {q.subject && (
            <span className="rounded-full bg-[#eef1fd] px-2.5 py-1" style={{ color: C.navy }}>
              {q.subject}
            </span>
          )}
        </p>
        <h3 className="mt-3 text-[18px] leading-[1.5] font-bold tracking-[-0.02em] [word-break:keep-all] md:text-[20px]" style={{ color: C.ink }}>
          {q.stem}
        </h3>

        <ol className="mt-4 space-y-2">
          {q.options.map((o, i) => {
            const isAnswer = i === q.answer;
            const mine = i === picked;
            const n = counts?.[i] ?? 0;
            const pct = showRate ? Math.round((n / voters) * 100) : 0;
            return (
              <li key={i}>
                <button
                  type="button"
                  disabled={answered}
                  onClick={() => onPick(i)}
                  aria-pressed={mine}
                  className={cn(
                    "relative flex w-full items-start gap-2.5 overflow-hidden rounded-2xl px-3.5 py-3 text-left text-[15px] leading-[1.55] ring-1 transition-colors [word-break:keep-all]",
                    !answered && "bg-[#ffffff] ring-[#2b3a7a]/15 hover:bg-[#f5f7ff] hover:ring-[#7f96e8] active:scale-[0.99]",
                    answered && isAnswer && "bg-[#dcf1e4] font-semibold ring-2 ring-[#56b37e]",
                    answered && mine && !isAnswer && "bg-[#fbe2e2] ring-2 ring-[#e07a7a]",
                    answered && !isAnswer && !mine && "bg-[#fafbff] ring-[#2b3a7a]/10 opacity-75",
                  )}
                  style={{ color: C.ink }}
                >
                  {/* 다른 독자들이 고른 비율 (5명부터) */}
                  {showRate && <span aria-hidden className={cn("absolute inset-y-0 left-0", isAnswer ? "bg-[#56b37e]/15" : "bg-[#2b3a7a]/[0.06]")} style={{ width: `${pct}%` }} />}
                  <span className="relative shrink-0 text-[18px] leading-[1.35] font-bold" style={{ color: answered && isAnswer ? "#2f7d4f" : C.peri }}>
                    {CIRCLED[i]}
                  </span>
                  <span className="relative min-w-0 flex-1">{o}</span>
                  {answered && (isAnswer || mine) && (
                    <span className="relative mt-0.5 shrink-0">
                      {isAnswer ? <Check className="h-4.5 w-4.5 text-[#2f7d4f]" strokeWidth={2.6} /> : <X className="h-4.5 w-4.5 text-[#c24646]" strokeWidth={2.6} />}
                    </span>
                  )}
                  {showRate && <span className="relative shrink-0 self-center tabular text-[12px] font-semibold" style={{ color: C.mute }}>{pct}%</span>}
                </button>
              </li>
            );
          })}
        </ol>

        {!answered && <p className="mt-3 text-[12.5px]" style={{ color: C.mute }}>보기를 누르면 바로 채점하고 해설을 보여 드려요.</p>}

        {answered && (
          <div className="mt-4 rounded-2xl bg-[#f6f7ff] px-4 py-4 ring-1 ring-[#2b3a7a]/[0.06]">
            <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="text-[16px] font-bold" style={{ color: right ? "#2f7d4f" : "#c24646" }}>
                {right ? "정답이에요!" : `아쉬워요, 정답은 ${CIRCLED[q.answer]}`}
              </span>
              <span className="text-[12.5px]" style={{ color: C.mute }}>
                {showRate
                  ? `금콩 독자 ${voters}명 중 ${rate}%가 맞혔어요${trap ? ` · 가장 많이 고른 오답 ${CIRCLED[trap.i]}` : ""}`
                  : voters > 0
                    ? `지금까지 ${voters}명이 풀었어요 · 정답률은 ${MIN_VOTERS}명부터 보여 드려요`
                    : "정답률은 푼 사람이 모이면 보여 드려요"}
              </span>
            </p>
            <p className="mt-2 text-[15px] leading-[1.75] whitespace-pre-line [word-break:keep-all]" style={{ color: C.body }}>
              {q.explain}
            </p>
          </div>
        )}
        {answered && q.extra}
      </div>
    </section>
  );
}

function Result({ total, done, score, streak, sharePath, shareTitle }: { total: number; done: number; score: number; streak: number; sharePath: string; shareTitle: string }) {
  const [copied, setCopied] = useState(false);
  const finished = done === total;
  async function share() {
    const url = `${location.origin}${sharePath}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: shareTitle, url });
        return;
      } catch {
        /* 닫음 → 복사로 */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* 무시 */
    }
  }
  const say = score === total ? "다 맞혔어요! 오늘 개념은 확실히 챙겼어요." : score === 0 ? "오늘 처음 본 개념이라면 해설만 다시 읽어도 충분해요." : "틀린 문제의 해설과 짝꿍 표를 한 번 더 보고 가요.";
  return (
    <section aria-label="오늘의 점수" className="rounded-[24px] px-5 py-6 text-center ring-1 ring-[#2b3a7a]/[0.07]" style={{ background: "linear-gradient(180deg,#eef1fd 0%,#fffdf8 100%)" }}>
      {finished ? (
        <>
          <p className="text-[13px] font-semibold" style={{ color: C.mute }}>
            오늘의 점수
          </p>
          <p className="mt-1 tabular text-[40px] leading-none font-extrabold" style={{ color: C.ink }}>
            {score} <span className="text-[24px]" style={{ color: C.mute }}>/ {total}</span>
          </p>
          <p className="mt-3 text-[14.5px] leading-[1.6] [word-break:keep-all]" style={{ color: C.body }}>
            {say}
          </p>
          {streak > 1 && (
            <p className="mt-2 inline-flex rounded-full px-3 py-1 text-[13px] font-bold text-[#ffffff]" style={{ background: C.orange }}>
              {streak}일 연속으로 풀었어요
            </p>
          )}
        </>
      ) : (
        <p className="text-[14.5px] leading-[1.6] [word-break:keep-all]" style={{ color: C.body }}>
          {total}문제를 다 풀면 오늘의 점수가 나와요.
          <br />
          같이 공부하는 사람에게 문제를 보내 봐도 좋아요.
        </p>
      )}
      <button
        type="button"
        onClick={share}
        className="mt-4 inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-[14.5px] font-bold text-[#ffffff] shadow-[0_6px_16px_-8px_rgba(43,58,122,0.8)] active:scale-[0.98]"
        style={{ background: C.navy }}
      >
        <Share2 className="h-4 w-4" strokeWidth={2.2} />
        {copied ? "링크를 복사했어요" : "단톡방에 문제 보내기"}
      </button>
    </section>
  );
}
