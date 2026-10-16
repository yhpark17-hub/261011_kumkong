"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  ChevronDown,
  ClipboardList,
  MessagesSquare,
  MousePointerClick,
  RotateCcw,
  X,
} from "lucide-react";
import { cn } from "../../ui";
import { KongMascot } from "../KongMascot";

/**
 * 금공 필기 입문 — 한 화면에 개념 하나, 눌러 보면서 익히는 인터랙티브 (숫자 통계 없이 개념만)
 * 위 번호 탭이나 아래 '다음'으로 넘기고, 장마다 작동 방식이 달라요.
 */

const anim = "transition-all duration-300 ease-out motion-reduce:transition-none";

/** 눌러 보라는 작은 안내 */
function TryHint({ children }: { children: ReactNode }) {
  return (
    <p className="inline-flex items-center gap-1.5 rounded-full bg-canvas px-3 py-1 type-caption font-semibold text-primary-text shadow-level-1">
      <MousePointerClick className="h-3.5 w-3.5" strokeWidth={2} />
      {children}
    </p>
  );
}

/** 콩이 한마디 */
function KongSays({ children, look = "pencil" }: { children: ReactNode; look?: "pencil" | "suit" | "book" }) {
  return (
    <div className="flex items-end gap-2">
      <KongMascot
        className="h-12 w-12 shrink-0"
        {...(look === "suit" ? { suit: true, wave: true } : look === "book" ? { hold: "book" as const, glasses: true } : { hold: "pencil" as const, glasses: true })}
      />
      <p className="relative rounded-2xl rounded-bl-sm border-2 border-brand-dark bg-canvas px-3.5 py-2 type-body-md font-semibold text-ink [word-break:keep-all]">{children}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 1. 필기는 채용의 어디쯤?                                               */
/* ------------------------------------------------------------------ */

const STAGES = [
  { key: "doc", label: "서류", text: "지원서와 자기소개서로 지원 자격과 직무에 맞는 사람인지 봐요. 공공기관은 블라인드 채용이라 학력·사진처럼 직무와 무관한 정보는 묻지 않아요." },
  { key: "written", label: "필기", text: "서류를 통과하면 필기시험을 봐요. 직무에 필요한 기본기(NCS)와 전공 지식을 확인하는 단계예요. 이 가이드에서 다룰 부분이에요." },
  { key: "interview", label: "면접", text: "필기를 통과하면 면접에서 직무 역량과 인성을 봐요. 1차·2차로 나뉘는 경우가 많고, 기관에 따라 필기 점수가 면접 단계 점수에 함께 반영되기도 해요." },
  { key: "final", label: "최종 합격", text: "면접까지 마치면 최종 합격자가 정해져요. 채용 신체검사나 신원 조회 같은 절차가 이어지기도 해요." },
];

function Flow() {
  const [sel, setSel] = useState(1);
  return (
    <div className="space-y-5">
      <TryHint>단계를 눌러 보세요</TryHint>
      <ol className="flex items-stretch gap-1.5 sm:gap-2">
        {STAGES.map((s, i) => (
          <li key={s.key} className="flex min-w-0 flex-1 items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => setSel(i)}
              aria-pressed={sel === i}
              className={cn(
                "flex w-full flex-col items-center gap-1.5 rounded-2xl border-2 px-1 py-3 sm:py-4",
                anim,
                sel === i ? "border-brand-dark bg-brand-dark text-on-primary shadow-level-2" : "border-hairline bg-canvas text-ink hover:border-brand-dark/40",
                s.key === "written" && sel !== i && "border-primary/50",
              )}
            >
              <span className={cn("inline-flex h-7 w-7 items-center justify-center rounded-full tabular type-caption font-bold", sel === i ? "bg-on-primary text-brand-dark" : "bg-canvas-soft text-ink-secondary")}>
                {i + 1}
              </span>
              <span className="type-body-md font-semibold whitespace-nowrap">{s.label}</span>
            </button>
            {i < STAGES.length - 1 && <ArrowRight aria-hidden className="h-4 w-4 shrink-0 text-ink-mute-2" strokeWidth={2} />}
          </li>
        ))}
      </ol>
      <div className="rounded-2xl bg-canvas px-5 py-4 shadow-level-1" aria-live="polite">
        <p className="type-heading-sm text-ink">{STAGES[sel].label}</p>
        <p className="mt-1.5 type-body-lg leading-relaxed text-ink-secondary [word-break:keep-all]">{STAGES[sel].text}</p>
      </div>
      <KongSays>필기는 서류 다음, 면접 바로 앞의 관문이에요!</KongSays>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 2. 필기 시험지 들여다보기                                               */
/* ------------------------------------------------------------------ */

const PARTS = [
  {
    key: "ncs",
    label: "NCS 직업기초능력",
    tag: "대부분의 기관",
    tone: "border-primary/40 bg-ev-written-soft",
    text: "일을 잘하는 데 필요한 기본기를 보는 시험이에요. 글 읽기, 표 계산, 문제 해결 같은 능력을 객관식으로 물어요. 공공기관 필기의 중심이에요.",
  },
  {
    key: "major",
    label: "전공",
    tag: "기관·직렬마다 달라요",
    tone: "border-[#ffb36b] bg-[#fff1e0]",
    text: "경영·경제·법·IT 같은 전공 지식을 봐요. 전공 시험이 아예 없는 곳도 있고, 여러 과목을 섞어 내거나 한 과목만 깊게 내기도 해요. 5장에서 자세히 볼게요.",
  },
  {
    key: "essay",
    label: "논술",
    tag: "일부 기관",
    tone: "border-dashed border-[#56c08a] bg-[#e3f6ea]",
    text: "주제를 받고 내 생각을 글로 써요. 경제·금융 이슈를 묻는 경우가 많아, 평소 시사 흐름을 정리해 두면 좋아요.",
  },
  {
    key: "personality",
    label: "인성검사",
    tag: "기관에 따라",
    tone: "border-dashed border-hairline-input bg-canvas-soft",
    text: "정답이 있는 시험이 아니라 성향을 보는 검사예요. 필기와 같은 날 보기도 하고, 온라인으로 따로 보기도 해요. 솔직하고 일관되게 답하는 게 중요해요.",
  },
];

function ExamParts() {
  const [sel, setSel] = useState<number | null>(null);
  const p = sel == null ? null : PARTS[sel];
  return (
    <div className="grid gap-5 md:grid-cols-[minmax(0,320px)_minmax(0,1fr)] md:items-start">
      <div className="rounded-2xl border border-hairline bg-canvas p-4 shadow-level-2">
        <p className="flex items-center justify-between type-caption font-semibold text-ink-secondary">
          필기 시험지
          <span className="font-normal text-ink-mute">칸을 눌러 보세요</span>
        </p>
        <div className="mt-3 space-y-2">
          {PARTS.map((x, i) => (
            <button
              key={x.key}
              type="button"
              onClick={() => setSel(i)}
              aria-pressed={sel === i}
              className={cn("flex w-full items-center justify-between gap-2 rounded-xl border-2 px-4 py-3 text-left", x.tone, anim, sel === i ? "scale-[1.02] ring-2 ring-brand-dark" : "hover:-translate-y-0.5")}
            >
              <span className="type-body-md font-semibold text-ink">{x.label}</span>
              <span className="shrink-0 rounded-full bg-canvas/80 px-2 py-0.5 type-caption text-ink-secondary">{x.tag}</span>
            </button>
          ))}
        </div>
      </div>
      <div aria-live="polite">
        {p ? (
          <div className="rounded-2xl bg-canvas px-5 py-5 shadow-level-1">
            <p className="type-micro-cap text-primary-text">{p.tag}</p>
            <p className="mt-1 type-heading-md text-ink">{p.label}</p>
            <p className="mt-2 type-body-lg leading-relaxed text-ink-secondary [word-break:keep-all]">{p.text}</p>
          </div>
        ) : (
          <div className="flex h-full min-h-40 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-hairline-input px-5 py-8 text-center">
            <TryHint>왼쪽 시험지의 칸을 눌러 보세요</TryHint>
            <p className="mt-3 type-body-md text-ink-mute [word-break:keep-all]">필기는 보통 NCS와 전공이 중심이고, 기관에 따라 논술·인성검사가 붙어요.</p>
          </div>
        )}
      </div>
      <div className="md:col-span-2">
        <KongSays>기본은 NCS + 전공, 나머지는 기관마다 달라요.</KongSays>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 3. NCS 10가지 기본기 — 카드 뒤집기                                       */
/* ------------------------------------------------------------------ */

const AREAS = [
  { name: "의사소통", core: true, front: "읽고 쓰고 말하기", back: "글의 중심 내용 찾기, 문서 내용 이해하기처럼 글과 말로 뜻을 주고받는 능력이에요." },
  { name: "수리", core: true, front: "숫자와 표 다루기", back: "표·그래프를 읽고 증가율이나 비율을 계산하는 능력이에요." },
  { name: "문제해결", core: true, front: "조건 따져 답 찾기", back: "주어진 조건과 상황을 논리적으로 따져 알맞은 결론을 내는 능력이에요." },
  { name: "자원관리", core: false, front: "시간·돈·사람 배분", back: "일정·예산·인원을 가장 효율적으로 나누고 계획하는 능력이에요." },
  { name: "조직이해", core: false, front: "회사가 움직이는 방식", back: "조직 구조, 업무 흐름, 경영의 기본 개념을 이해하는 능력이에요." },
  { name: "정보", core: false, front: "컴퓨터로 정보 다루기", back: "필요한 정보를 찾고 정리하고, 컴퓨터로 처리하는 능력이에요." },
  { name: "대인관계", core: false, front: "함께 일하기", back: "동료와 협력하고, 갈등이 생겼을 때 원만하게 풀어 가는 능력이에요." },
  { name: "직업윤리", core: false, front: "일하는 태도", back: "직장인으로서 지켜야 할 올바른 태도와 책임감이에요." },
  { name: "기술", core: false, front: "도구와 기술 활용", back: "업무에 필요한 기술을 이해하고 알맞게 골라 쓰는 능력이에요." },
  { name: "자기개발", core: false, front: "스스로 성장하기", back: "자신을 이해하고 목표를 세워 꾸준히 발전해 가는 능력이에요." },
];

function NcsCards() {
  const [open, setOpen] = useState<Set<number>>(new Set());
  const toggle = (i: number) =>
    setOpen((s) => {
      const n = new Set(s);
      if (n.has(i)) n.delete(i);
      else n.add(i);
      return n;
    });
  const all = open.size === AREAS.length;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <TryHint>카드를 눌러 뒤집어 보세요</TryHint>
        <button type="button" onClick={() => setOpen(all ? new Set() : new Set(AREAS.map((_, i) => i)))} className="inline-flex items-center gap-1 type-caption text-primary-text hover:underline">
          <RotateCcw className="h-3.5 w-3.5" strokeWidth={2} />
          {all ? "모두 덮기" : "모두 뒤집기"}
        </button>
      </div>
      <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
        {AREAS.map((a, i) => {
          const flipped = open.has(i);
          return (
            <li key={a.name} className="[perspective:900px]">
              <button
                type="button"
                onClick={() => toggle(i)}
                aria-pressed={flipped}
                aria-label={`${a.name}능력 — ${flipped ? a.back : a.front}`}
                className={cn("relative h-36 w-full text-left [transform-style:preserve-3d] motion-safe:transition-transform motion-safe:duration-500", flipped && "[transform:rotateY(180deg)]")}
              >
                <span
                  className={cn(
                    "absolute inset-0 flex flex-col justify-between rounded-2xl border-2 p-3.5 [backface-visibility:hidden]",
                    a.core ? "border-primary bg-primary text-on-primary" : "border-hairline bg-canvas text-ink",
                  )}
                >
                  <span className="flex items-start justify-between gap-1">
                    <span className="type-heading-sm">{a.name}</span>
                    {a.core && <span className="shrink-0 rounded-full bg-on-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-text">기본</span>}
                  </span>
                  <span className={cn("type-caption [word-break:keep-all]", a.core ? "text-on-primary/85" : "text-ink-secondary")}>{a.front}</span>
                </span>
                <span className="absolute inset-0 flex items-center rounded-2xl border-2 border-brand-dark bg-canvas-cream p-3.5 [backface-visibility:hidden] [transform:rotateY(180deg)]">
                  <span className="type-caption leading-relaxed text-ink [word-break:keep-all]">{a.back}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <KongSays>보라색 &lsquo;기본&rsquo; 세 장은 금융공기업 필기에서 거의 빠지지 않아요. 나머지는 기관마다 골라서 내요.</KongSays>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 4. 문제 모양 3가지 — 보고 맞혀 보기                                      */
/* ------------------------------------------------------------------ */

const TYPES = [
  { key: "PSAT형", one: "긴 지문 + 표·그래프", text: "자료를 빠르게 읽고 해석하는 문제예요. 지문이 길어서 시간 관리가 핵심이에요." },
  { key: "모듈형", one: "짧은 문제 + 이론", text: "NCS 이론·개념을 알고 있는지 묻는 문제예요. 지문이 짧아 개념만 알면 빨리 풀어요." },
  { key: "피듈형", one: "둘을 섞은 형태", text: "자료 해석 문제와 이론 문제가 함께 나와요. 기관마다 섞는 비중이 달라요." },
];

const QUIZ = [
  {
    q: "다음은 두 지점의 분기별 예금 잔액을 나타낸 표이다. 표를 보고 옳은 설명을 고르면?",
    visual: "table",
    answer: 0,
    why: "표를 읽고 해석하는 문제라 PSAT형에 가까워요. 이론을 몰라도 자료만 정확히 읽으면 풀 수 있어요.",
  },
  {
    q: "다음 중 효과적인 경청 태도로 적절하지 않은 것은?",
    visual: "short",
    answer: 1,
    why: "의사소통 이론(경청)을 아는지 묻는 짧은 문제라 모듈형이에요.",
  },
  {
    q: "다음 업무 목록을 읽고, 시간관리의 긴급·중요 기준에 따라 가장 먼저 할 일을 고르면?",
    visual: "mixed",
    answer: 2,
    why: "자료(업무 목록)도 읽어야 하고 시간관리 이론도 알아야 해서 피듈형이에요.",
  },
] as const;

function QuestionVisual({ kind }: { kind: "table" | "short" | "mixed" }) {
  const bar = (w: string, k: number) => <span key={k} className="block h-1.5 rounded-full bg-ink/15" style={{ width: w }} />;
  if (kind === "table")
    return (
      <span className="mt-3 grid grid-cols-4 gap-px overflow-hidden rounded-md bg-hairline text-[10px]">
        {["", "1분기", "2분기", "3분기", "A지점", "○○", "○○", "○○", "B지점", "○○", "○○", "○○"].map((c, i) => (
          <span key={i} className={cn("bg-canvas px-1.5 py-1 text-center", i < 4 || i % 4 === 0 ? "font-semibold text-ink-secondary" : "text-ink-mute")}>
            {c}
          </span>
        ))}
      </span>
    );
  if (kind === "mixed")
    return <span className="mt-3 block space-y-1.5 rounded-md bg-canvas p-2">{["90%", "70%", "80%"].map(bar)}</span>;
  return null;
}

function TypeQuiz() {
  const [qi, setQi] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const done = qi >= QUIZ.length;
  const q = QUIZ[Math.min(qi, QUIZ.length - 1)];
  const pick = (i: number) => {
    if (picked != null) return;
    setPicked(i);
    if (i === q.answer) setScore((s) => s + 1);
  };
  const next = () => {
    setPicked(null);
    setQi((i) => i + 1);
  };
  const reset = () => {
    setQi(0);
    setPicked(null);
    setScore(0);
  };
  return (
    <div className="space-y-5">
      <ul className="grid gap-2.5 sm:grid-cols-3">
        {TYPES.map((t) => (
          <li key={t.key} className="rounded-2xl bg-canvas px-4 py-3.5 shadow-level-1">
            <p className="type-heading-sm text-primary-text">{t.key}</p>
            <p className="mt-0.5 type-caption font-semibold text-ink">{t.one}</p>
            <p className="mt-1.5 type-caption leading-relaxed text-ink-secondary [word-break:keep-all]">{t.text}</p>
          </li>
        ))}
      </ul>

      <div className="rounded-2xl border-2 border-brand-dark bg-canvas px-5 py-5">
        <div className="flex items-center justify-between gap-2">
          <p className="type-heading-sm text-ink">맞혀 보기 — 이 문제는 어떤 유형일까요?</p>
          <span className="shrink-0 tabular type-caption text-ink-mute">{done ? `${QUIZ.length}/${QUIZ.length}` : `${qi + 1}/${QUIZ.length}`}</span>
        </div>
        {done ? (
          <div className="mt-4 text-center">
            <p className="type-heading-md text-ink">
              {QUIZ.length}문제 중 <span className="text-primary-text">{score}문제</span> 맞혔어요
            </p>
            <p className="mt-1 type-body-md text-ink-secondary">
              {score === QUIZ.length ? "유형 구분 완벽해요!" : "괜찮아요, 문제 모양을 몇 번 보면 금방 익숙해져요."}
            </p>
            <button type="button" onClick={reset} className="btn btn-sm btn-secondary mt-4">
              <RotateCcw className="h-3.5 w-3.5" strokeWidth={2} />
              다시 풀기
            </button>
          </div>
        ) : (
          <>
            <div className="mt-3 rounded-xl bg-canvas-soft px-4 py-3.5">
              <p className="type-body-md text-ink [word-break:keep-all]">{q.q}</p>
              <QuestionVisual kind={q.visual} />
              <p className="mt-2 type-caption text-ink-mute">※ 유형을 보여 주려고 만든 예시 문제예요.</p>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {TYPES.map((t, i) => {
                const right = picked != null && i === q.answer;
                const wrong = picked === i && i !== q.answer;
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => pick(i)}
                    disabled={picked != null}
                    className={cn(
                      "inline-flex items-center justify-center gap-1 rounded-xl border-2 px-2 py-2.5 type-body-md font-semibold",
                      anim,
                      right ? "border-[#3fa36b] bg-[#e3f6ea] text-[#2f7d4f]" : wrong ? "border-ev-doc bg-ev-doc-soft text-ev-doc" : "border-hairline bg-canvas text-ink hover:border-brand-dark",
                      picked != null && !right && !wrong && "opacity-50",
                    )}
                  >
                    {right && <Check className="h-4 w-4" strokeWidth={2.5} />}
                    {wrong && <X className="h-4 w-4" strokeWidth={2.5} />}
                    {t.key}
                  </button>
                );
              })}
            </div>
            {picked != null && (
              <div className="mt-3 flex flex-col gap-3 rounded-xl bg-canvas-cream px-4 py-3 sm:flex-row sm:items-center sm:justify-between" aria-live="polite">
                <p className="type-body-md text-ink [word-break:keep-all]">
                  <strong className="font-semibold">{picked === q.answer ? "정답! " : `정답은 ${TYPES[q.answer].key}. `}</strong>
                  {q.why}
                </p>
                <button type="button" onClick={next} className="btn btn-sm btn-primary shrink-0">
                  {qi === QUIZ.length - 1 ? "결과 보기" : "다음 문제"}
                  <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
      <KongSays>지원할 기관이 어떤 유형을 내는지는 그 기관 필기 후기로 확인하는 게 가장 빨라요.</KongSays>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 5. 전공 시험 — 넓게 vs 깊게                                             */
/* ------------------------------------------------------------------ */

const MAJORS = [
  {
    key: "none",
    label: "전공 없음",
    x: 14,
    y: 18,
    color: "#56c08a",
    text: "전공 시험 없이 NCS 등으로만 봐요. 비전공자도 도전하기 쉽지만, 모두 같은 시험을 보니 NCS 점수 경쟁이 치열해요.",
    fit: "전공 공부 부담 없이 NCS에 집중하고 싶은 사람",
  },
  {
    key: "integrated",
    label: "통합 전공",
    x: 78,
    y: 40,
    color: "#ff9a4d",
    text: "경영·경제·법 등 여러 과목이 한 시험에 섞여 나와요. 범위가 넓은 대신 한 과목을 깊게 묻지는 않는 편이에요.",
    fit: "여러 과목의 기본 개념을 고르게 아는 사람",
  },
  {
    key: "single",
    label: "단일 전공",
    x: 30,
    y: 84,
    color: "#533afd",
    text: "경영·경제·법·IT 중 한 과목을 골라 깊게 봐요. 서술형·논술형이 많아 답안을 직접 써 보는 연습이 필요해요.",
    fit: "한 과목을 깊이 공부해 온 사람",
  },
];

function MajorMap() {
  const [sel, setSel] = useState<number | null>(null);
  const m = sel == null ? null : MAJORS[sel];
  return (
    <div className="grid gap-5 md:grid-cols-[minmax(0,360px)_minmax(0,1fr)] md:items-start">
      <div className="rounded-2xl border border-hairline bg-canvas p-4 shadow-level-2">
        <div className="relative aspect-square w-full">
          {/* 축 */}
          <span aria-hidden className="absolute top-0 bottom-7 left-6 w-px bg-ink/20" />
          <span aria-hidden className="absolute right-0 bottom-7 left-6 h-px bg-ink/20" />
          <span className="absolute top-0 left-8 type-caption font-semibold text-ink-mute">↑ 깊게</span>
          <span className="absolute right-0 bottom-0 type-caption font-semibold text-ink-mute">넓게 →</span>
          <span className="absolute bottom-0 left-6 type-caption text-ink-mute-2">얕고 좁게</span>
          {MAJORS.map((x, i) => (
            <button
              key={x.key}
              type="button"
              onClick={() => setSel(i)}
              aria-pressed={sel === i}
              className={cn("absolute flex -translate-x-1/2 translate-y-1/2 flex-col items-center gap-1", anim, sel != null && sel !== i && "opacity-40")}
              style={{ left: `calc(24px + (100% - 24px) * ${x.x / 100})`, bottom: `calc(28px + (100% - 28px) * ${x.y / 100})` }}
            >
              <span className={cn("block h-6 w-6 rounded-full border-4 border-canvas shadow-level-2", anim, sel === i && "scale-125")} style={{ background: x.color }} />
              <span className="rounded-full bg-canvas px-2 py-0.5 type-caption font-semibold whitespace-nowrap text-ink shadow-level-1">{x.label}</span>
            </button>
          ))}
        </div>
      </div>
      <div aria-live="polite">
        {m ? (
          <div className="rounded-2xl bg-canvas px-5 py-5 shadow-level-1">
            <p className="flex items-center gap-2 type-heading-md text-ink">
              <span className="h-3 w-3 rounded-full" style={{ background: m.color }} />
              {m.label}
            </p>
            <p className="mt-2 type-body-lg leading-relaxed text-ink-secondary [word-break:keep-all]">{m.text}</p>
            <p className="mt-3 rounded-xl bg-canvas-soft px-4 py-3 type-body-md text-ink [word-break:keep-all]">
              <span className="font-semibold text-primary-text">이런 사람에게 맞아요 · </span>
              {m.fit}
            </p>
          </div>
        ) : (
          <div className="flex h-full min-h-40 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-hairline-input px-5 py-8 text-center">
            <TryHint>그림의 점을 눌러 보세요</TryHint>
            <p className="mt-3 type-body-md text-ink-mute [word-break:keep-all]">전공 시험은 얼마나 넓게, 얼마나 깊게 묻느냐에 따라 세 가지로 나뉘어요.</p>
          </div>
        )}
      </div>
      <div className="md:col-span-2">
        <KongSays look="book">같은 기관이라도 직렬마다 전공 과목이 달라요. 지원할 직렬의 공고를 꼭 확인하세요!</KongSays>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 6. A매치 — 같은 날, 하나만                                              */
/* ------------------------------------------------------------------ */

const TICKETS = ["가 기관", "나 기관", "다 기관"];

function AMatch() {
  const [pick, setPick] = useState<number | null>(null);
  return (
    <div className="space-y-5">
      <TryHint>필기를 볼 기관을 하나 골라 보세요</TryHint>
      <div className="rounded-2xl border border-hairline bg-canvas p-4 shadow-level-2 sm:p-5">
        <p className="flex items-center gap-2 type-body-md font-semibold text-ink">
          <CalendarDays className="h-4 w-4 text-primary" strokeWidth={2} />
          어느 토요일 오전 10시 — 필기 세 곳이 동시에
        </p>
        <ul className="mt-4 grid gap-2.5 sm:grid-cols-3">
          {TICKETS.map((t, i) => {
            const chosen = pick === i;
            const blocked = pick != null && !chosen;
            return (
              <li key={t}>
                <button
                  type="button"
                  onClick={() => setPick(i)}
                  aria-pressed={chosen}
                  className={cn(
                    "relative flex w-full flex-col items-start overflow-hidden rounded-xl border-2 px-4 py-4 text-left",
                    anim,
                    chosen ? "border-brand-dark bg-brand-dark text-on-primary shadow-level-2" : blocked ? "border-hairline bg-canvas-soft text-ink-mute" : "border-hairline bg-canvas text-ink hover:border-brand-dark",
                  )}
                >
                  <span className="type-caption opacity-70">필기시험 응시표</span>
                  <span className="mt-1 type-heading-sm">{t}</span>
                  <span className="mt-2 type-caption opacity-70">토요일 오전 10:00</span>
                  {chosen && <span className="absolute top-3 right-3 rounded-full bg-on-primary px-2 py-0.5 type-caption font-bold text-brand-dark">응시</span>}
                  {blocked && (
                    <span className="absolute inset-0 flex items-center justify-center bg-canvas/70">
                      <span className="-rotate-6 rounded-md border-2 border-ev-doc px-2 py-1 type-caption font-bold text-ev-doc">같은 시간이라 못 봐요</span>
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
      <div aria-live="polite">
        {pick == null ? (
          <p className="type-body-lg text-ink-secondary [word-break:keep-all]">주요 금융공기업들은 같은 날 같은 시간에 필기를 치르기도 해요. 준비생들은 이걸 &lsquo;A매치&rsquo;라고 불러요.</p>
        ) : (
          <div className="rounded-2xl bg-canvas px-5 py-4 shadow-level-1">
            <p className="type-heading-sm text-ink">{TICKETS[pick]}을 골랐다면, 나머지 두 곳은 포기해야 해요.</p>
            <p className="mt-1.5 type-body-lg leading-relaxed text-ink-secondary [word-break:keep-all]">
              하루에 한 곳만 볼 수 있으니, 서류를 낼 때부터 어느 기관 필기를 볼지 미리 정해 두는 게 좋아요.
            </p>
            <Link href="/" className="link mt-3 inline-flex items-center gap-1 type-body-md">
              채용 캘린더에서 실제 필기 날짜 보기 <ArrowRight className="h-4 w-4" strokeWidth={2} />
            </Link>
          </div>
        )}
      </div>
      <KongSays>필기 날짜가 겹치는지 미리 보고, 꼭 가고 싶은 곳부터 골라 두세요!</KongSays>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 마무리                                                                */
/* ------------------------------------------------------------------ */

const SUMMARY = [
  "필기는 서류 다음, 면접 바로 앞의 관문",
  "필기 = NCS + 전공, 기관에 따라 논술·인성검사",
  "NCS는 의사소통·수리·문제해결이 기본",
  "문제 모양은 PSAT형·모듈형·피듈형 — 지원 기관 후기로 확인",
  "전공은 없음·통합·단일 — 넓게 볼지, 깊게 볼지",
  "같은 날 시험(A매치)이 있으니 미리 골라 두기",
];

const MORE = [
  {
    q: "블라인드 채용이 뭐예요?",
    a: "2017년부터 공공기관은 입사지원서에 출신지역·가족관계·학력·신체조건·사진처럼 직무와 무관한 정보를 요구하지 않아요. 공공기관이 아닌 공제회·중앙회·시중은행은 기관마다 기준이 달라 학력이나 자격을 적기도 해요.",
  },
  {
    q: "경쟁률은 어디서 봐요?",
    a: "공공기관 경영정보 공개시스템 알리오(ALIO)에서 기관을 검색하고 경영공시의 '신규채용 현황'을 보면 돼요. 다만 일반·고졸·경력 채용이 합쳐진 숫자인 경우가 많아, 대졸 신입 공채의 실제 경쟁률과는 차이가 있어요.",
  },
];

function Wrap() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="space-y-6">
      <ol className="grid gap-2 sm:grid-cols-2">
        {SUMMARY.map((t, i) => (
          <li key={t} className="flex gap-3 rounded-xl bg-canvas px-4 py-3.5 shadow-level-1">
            <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-dark tabular type-caption font-bold text-on-primary">{i + 1}</span>
            <span className="type-body-md text-ink [word-break:keep-all]">{t}</span>
          </li>
        ))}
      </ol>
      <div className="grid gap-2.5 sm:grid-cols-3">
        {[
          { href: "/companies", label: "기관별 필기 구성 보기", Icon: ClipboardList },
          { href: "/", label: "다가오는 필기 일정", Icon: CalendarDays },
          { href: "/reviews", label: "필기 후기·체감 난이도", Icon: MessagesSquare },
        ].map((c) => (
          <Link key={c.href} href={c.href} className="group flex items-center gap-2 rounded-xl bg-brand-dark px-4 py-3.5 type-body-md font-semibold text-on-primary">
            <c.Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
            <span className="min-w-0 flex-1 [word-break:keep-all]">{c.label}</span>
            <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
          </Link>
        ))}
      </div>
      <div>
        <p className="type-caption font-semibold text-ink-secondary">더 알아 두면 좋은 것</p>
        <ul className="mt-2 divide-y divide-hairline rounded-2xl border border-hairline bg-canvas">
          {MORE.map((it, i) => (
            <li key={it.q}>
              <button type="button" onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i} className="flex w-full items-center gap-2 px-4 py-3.5 text-left type-body-md font-semibold text-ink">
                <span className="flex-1">{it.q}</span>
                <ChevronDown className={cn("h-4 w-4 shrink-0 text-ink-mute transition-transform", open === i && "rotate-180")} strokeWidth={2} />
              </button>
              {open === i && <p className="px-4 pb-4 type-body-md leading-relaxed text-ink-secondary [word-break:keep-all]">{it.a}</p>}
            </li>
          ))}
        </ul>
      </div>
      <p className="type-caption text-ink-mute [word-break:keep-all]">시험 구성과 일정은 기관·직렬·해마다 달라질 수 있어요. 지원 전에 각 기관 채용 공고를 꼭 확인하세요.</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 전체 — 장 단위로 넘겨 보기                                              */
/* ------------------------------------------------------------------ */

const CHAPTERS = [
  { short: "채용 흐름", title: "필기는 채용의 어디쯤일까요?", lead: "금공 채용은 보통 네 단계예요. 필기가 어디에 있는지부터 볼게요.", bg: "bg-[#f6f4ff]", body: <Flow /> },
  { short: "필기 구성", title: "필기 시험지를 들여다볼까요?", lead: "필기는 몇 가지 시험으로 이루어져 있어요.", bg: "bg-[#fffaf3]", body: <ExamParts /> },
  { short: "NCS", title: "NCS는 일 잘하는 기본기 10가지예요", lead: "NCS 직업기초능력은 10개 영역이 있고, 기관마다 그중 몇 개를 골라 내요.", bg: "bg-[#f6f4ff]", body: <NcsCards /> },
  { short: "문제 유형", title: "같은 NCS도 문제 모양이 달라요", lead: "NCS 문제는 크게 세 가지 모양이에요. 보고 맞혀 보세요.", bg: "bg-[#f2fbf5]", body: <TypeQuiz /> },
  { short: "전공", title: "전공 시험은 넓게 볼까, 깊게 볼까", lead: "전공 시험은 범위와 깊이에 따라 세 가지로 나뉘어요.", bg: "bg-[#fff6ec]", body: <MajorMap /> },
  { short: "A매치", title: "같은 날 시험, 하나만 고를 수 있어요", lead: "필기 날짜가 겹치면 어떻게 될까요? 직접 골라 보세요.", bg: "bg-[#f6f4ff]", body: <AMatch /> },
  { short: "정리", title: "이것만 기억하세요", lead: "오늘 본 내용을 한 장으로 정리했어요.", bg: "bg-[#f2fbf5]", body: <Wrap /> },
];

export function WrittenExamGuide({ title }: { title: string }) {
  const [ch, setCh] = useState(0);
  const top = useRef<HTMLDivElement>(null);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  // 휴대폰에서 지금 장 탭이 목차 줄 밖에 있으면 보이게 옆으로 밀기
  useEffect(() => {
    const t = tabs.current[ch];
    const bar = t?.parentElement;
    if (!t || !bar) return;
    bar.scrollTo({ left: t.offsetLeft - bar.clientWidth / 2 + t.clientWidth / 2, behavior: "smooth" });
  }, [ch]);
  const go = (i: number) => {
    setCh(i);
    // 장을 바꾸면 장 머리로
    const el = top.current;
    if (el && el.getBoundingClientRect().top < 0) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const c = CHAPTERS[ch];
  const last = ch === CHAPTERS.length - 1;

  return (
    <div id="article-body" className="theme-light bg-canvas text-ink">
      {/* 표지 */}
      <section className="relative overflow-hidden bg-linear-to-b from-[#ece9ff] to-canvas">
        <span aria-hidden className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[#ffd9ae]/60 blur-3xl" />
        <span aria-hidden className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-[#bfe9cf]/60 blur-3xl" />
        <div className="relative mx-auto flex max-w-[960px] flex-col items-center gap-6 px-5 pt-10 pb-8 text-center md:flex-row md:gap-10 md:px-8 md:pt-14 md:text-left">
          <KongMascot hold="pencil" glasses className="h-24 w-24 shrink-0 md:h-32 md:w-32" />
          <div>
            <p className="type-micro-cap text-primary-text">금콩 인터랙티브 · 필기 입문</p>
            <h1 className="mt-2 type-heading-lg font-bold text-ink [word-break:keep-all] md:type-display-md">금공 필기, 처음이라면 여기서 시작해요</h1>
            <p className="mt-2 type-body-lg text-ink-secondary [word-break:keep-all]">한 장씩 눌러 보면서 필기의 기본 개념을 익혀요. 7장, 5분이면 충분해요.</p>
          </div>
        </div>
        <h2 className="sr-only">{title}</h2>
      </section>

      {/* 장 고르기 */}
      <div ref={top} className="sticky top-[73px] z-20 border-y border-hairline bg-canvas/95 backdrop-blur md:top-[65px]">
        <div className="mx-auto max-w-[960px] px-3 md:px-8">
          <div role="tablist" aria-label="필기 입문 목차" className="no-scrollbar flex gap-1.5 overflow-x-auto py-2.5">
            {CHAPTERS.map((x, i) => (
              <button
                key={x.short}
                ref={(el) => {
                  tabs.current[i] = el;
                }}
                type="button"
                role="tab"
                aria-selected={ch === i}
                onClick={() => go(i)}
                className={cn(
                  "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 type-caption font-semibold whitespace-nowrap",
                  anim,
                  ch === i ? "bg-brand-dark text-on-primary" : i < ch ? "bg-ev-written-soft text-primary-text" : "text-ink-secondary hover:bg-canvas-soft",
                )}
              >
                <span className={cn("inline-flex h-5 w-5 items-center justify-center rounded-full tabular text-[11px]", ch === i ? "bg-on-primary text-brand-dark" : i < ch ? "bg-primary text-on-primary" : "bg-canvas-soft")}>
                  {i < ch ? <Check className="h-3 w-3" strokeWidth={3} /> : i + 1}
                </span>
                {x.short}
              </button>
            ))}
          </div>
          <div aria-hidden className="h-1 overflow-hidden rounded-full bg-canvas-soft">
            <div className={cn("h-full rounded-full bg-primary", anim)} style={{ width: `${((ch + 1) / CHAPTERS.length) * 100}%` }} />
          </div>
        </div>
      </div>

      {/* 지금 장 */}
      <section role="tabpanel" aria-label={c.title} className={cn("min-h-[70svh]", c.bg)}>
        <div key={ch} className="mx-auto max-w-[960px] px-5 py-8 motion-safe:animate-[kk-fade-in_.35s_ease-out] md:px-8 md:py-12">
          <p className="type-micro-cap text-primary-text">
            {String(ch + 1).padStart(2, "0")} · {c.short}
          </p>
          <h2 className="mt-1 type-heading-lg font-bold text-ink [word-break:keep-all] md:type-display-md">{c.title}</h2>
          <p className="mt-2 type-body-lg text-ink-secondary [word-break:keep-all]">{c.lead}</p>
          <div className="mt-7">{c.body}</div>

          <nav aria-label="장 넘기기" className="mt-10 flex items-center justify-between gap-3 border-t border-ink/10 pt-6">
            {ch > 0 ? (
              <button type="button" onClick={() => go(ch - 1)} className="btn btn-sm btn-secondary">
                <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
                이전
              </button>
            ) : (
              <span />
            )}
            {last ? (
              <button type="button" onClick={() => go(0)} className="btn btn-sm btn-secondary">
                <RotateCcw className="h-3.5 w-3.5" strokeWidth={2} />
                처음부터 다시
              </button>
            ) : (
              <button type="button" onClick={() => go(ch + 1)} className="btn btn-primary">
                다음 · {CHAPTERS[ch + 1].short}
                <ArrowRight className="h-4 w-4" strokeWidth={2} />
              </button>
            )}
          </nav>
        </div>
      </section>
    </div>
  );
}
