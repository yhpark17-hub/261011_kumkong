"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Check, RotateCcw, X } from "lucide-react";
import type { QuizItem } from "@/lib/news-meta";
import { cn } from "../ui";
import { KongMascot } from "./KongMascot";

const LETTERS = ["①", "②", "③", "④"];

/**
 * 아침판 맨 아래 — 오늘 브리핑 내용으로 푸는 퀴즈 (고르면 바로 정답·해설)
 * more: 홈처럼 한 문제만 보여 줄 때, 다 풀면 나머지 문제가 있는 브리핑으로 안내
 */
export function BriefingQuiz({
  quiz,
  title = "오늘의 브리핑 퀴즈",
  subtitle,
  more,
}: {
  quiz: QuizItem[];
  title?: string;
  subtitle?: string;
  more?: { href: string; label: string };
}) {
  const [picked, setPicked] = useState<(number | null)[]>(() => quiz.map(() => null));
  const done = picked.every((p) => p !== null);
  const correct = picked.filter((p, i) => p === quiz[i].answer).length;
  const pick = (qi: number, oi: number) => setPicked((prev) => prev.map((p, i) => (i === qi && p === null ? oi : p)));

  return (
    <section aria-labelledby="briefing-quiz" className="rounded-2xl border-2 border-brand-dark bg-canvas px-4 py-5 sm:px-5 sm:py-6 md:px-7">
      <div className="flex items-center gap-3">
        <KongMascot className="h-12 w-12" wave />
        <div>
          <h3 id="briefing-quiz" className="type-heading-md text-ink">
            {title}
          </h3>
          <p className="type-caption text-ink-mute">{subtitle ?? `방금 읽은 내용, 얼마나 기억나요? ${quiz.length}문제`}</p>
        </div>
      </div>

      <ol className="mt-5 space-y-5">
        {quiz.map((q, qi) => {
          const chosen = picked[qi];
          const answered = chosen !== null;
          const ox = q.options.length === 2;
          return (
            <li key={qi} className="rounded-xl bg-canvas-soft px-3 py-4 sm:px-4 md:px-5">
              <p className="flex gap-2 type-body-md font-semibold text-ink [word-break:keep-all]">
                <span className="tabular text-primary-text">Q{qi + 1}.</span>
                <span>{q.question}</span>
              </p>
              <div className={cn("mt-3 grid gap-2", ox ? "grid-cols-2" : "sm:grid-cols-2")}>
                {q.options.map((o, oi) => {
                  const isAnswer = oi === q.answer;
                  const isChosen = oi === chosen;
                  return (
                    <button
                      key={oi}
                      type="button"
                      disabled={answered}
                      onClick={() => pick(qi, oi)}
                      aria-pressed={isChosen}
                      className={cn(
                        "flex items-start gap-2 rounded-lg border-2 px-3 py-2.5 text-left type-body-md transition-colors",
                        !answered
                          ? "border-hairline bg-canvas hover:border-primary"
                          : isAnswer
                            ? "border-ev-final bg-ev-final-soft text-ink"
                            : isChosen
                              ? "border-ev-doc bg-ev-doc-soft text-ink"
                              : "border-hairline bg-canvas text-ink-mute",
                      )}
                    >
                      <span className="shrink-0 font-semibold">{ox ? "" : LETTERS[oi]}</span>
                      <span className={cn("min-w-0 [word-break:keep-all]", ox && "w-full text-center text-[18px] font-bold")}>{o}</span>
                      {answered && isAnswer && <Check className="ml-auto h-4 w-4 shrink-0 text-ev-final" strokeWidth={2.5} />}
                      {answered && isChosen && !isAnswer && <X className="ml-auto h-4 w-4 shrink-0 text-ev-doc" strokeWidth={2.5} />}
                    </button>
                  );
                })}
              </div>
              {answered && (
                <p className="mt-3 rounded-lg bg-canvas px-3 py-2.5 type-caption leading-relaxed text-ink-secondary ko-justify">
                  <span className={cn("mr-1 font-semibold", chosen === q.answer ? "text-ev-final" : "text-ev-doc")}>
                    {chosen === q.answer ? "정답이에요!" : `아쉬워요. 정답은 ${ox ? q.options[q.answer] : LETTERS[q.answer]}`}
                  </span>
                  {q.explain}
                </p>
              )}
            </li>
          );
        })}
      </ol>

      {done && more && (
        <Link href={more.href} className="group mt-4 flex items-center justify-between gap-3 rounded-xl bg-brand-dark px-5 py-3.5 text-on-primary">
          <span className="type-body-md font-semibold">{more.label}</span>
          <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
        </Link>
      )}
      {done && !more && (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-brand-dark px-5 py-4 text-on-primary">
          <p className="type-body-md font-semibold">
            {quiz.length}문제 중 {correct}개 맞혔어요! {correct === quiz.length ? "완벽해요 🎉" : correct >= quiz.length / 2 ? "좋아요, 내일도 함께해요" : "기사를 한 번 더 읽어 볼까요?"}
          </p>
          <button type="button" onClick={() => setPicked(quiz.map(() => null))} className="inline-flex items-center gap-1.5 rounded-full bg-on-primary/15 px-3 py-1.5 type-caption hover:bg-on-primary/25">
            <RotateCcw className="h-3.5 w-3.5" strokeWidth={2} />
            다시 풀기
          </button>
        </div>
      )}
    </section>
  );
}
