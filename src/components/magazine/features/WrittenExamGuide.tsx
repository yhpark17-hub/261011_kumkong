"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowRight, CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, ClipboardList, MessagesSquare, MousePointerClick, Plus, RotateCcw } from "lucide-react";
import { cn, CompanyAvatar } from "../../ui";
import { KongMascot } from "../KongMascot";

/**
 * 금공 필기 입문 — 한 화면에 개념 하나, 눌러 보면서 익히는 인터랙티브 (숫자 통계 없이 개념만)
 * 위 번호 탭이나 본문의 ‹ › 화살표로 넘기고, 장마다 작동 방식이 달라요.
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

type Look = "pencil" | "book" | "suit";

/** 콩이 한마디 */
function KongSays({ children, look = "pencil" }: { children: ReactNode; look?: Look }) {
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

/** 설명 칸 (선택한 것) */
function Explain({ eyebrow, title, children }: { eyebrow?: string; title: ReactNode; children: ReactNode }) {
  return (
    <div className="rounded-2xl bg-canvas px-5 py-5 shadow-level-1" aria-live="polite">
      {eyebrow && <p className="type-micro-cap text-primary-text">{eyebrow}</p>}
      <p className={cn("type-heading-md text-ink [word-break:keep-all]", eyebrow && "mt-1")}>{title}</p>
      <div className="mt-2 type-body-lg leading-relaxed text-ink-secondary [word-break:keep-all]">{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 1. 필기는 채용의 어디쯤?                                               */
/* ------------------------------------------------------------------ */

const STAGES = [
  { key: "doc", label: "서류", text: "지원서와 자기소개서로 지원 자격과 직무에 맞는 사람인지 봐요. 공공기관은 블라인드 채용이라 학력·사진처럼 직무와 무관한 정보는 묻지 않아요." },
  { key: "written", label: "필기", text: "서류를 통과하면 필기시험을 봐요. 직무에 필요한 기본 역량(NCS)과 전공 지식을 확인하는 단계예요. 이 가이드에서 다룰 부분이에요." },
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
              )}
            >
              <span className={cn("inline-flex h-7 w-7 items-center justify-center rounded-full tabular type-caption font-bold", sel === i ? "bg-on-primary text-brand-dark" : "bg-canvas-soft text-ink-secondary")}>
                {i + 1}
              </span>
              <span className="type-body-md font-semibold whitespace-nowrap">{s.label}</span>
            </button>
            {i < STAGES.length - 1 && <ChevronRight aria-hidden className="h-4 w-4 shrink-0 text-ink-mute-2" strokeWidth={2} />}
          </li>
        ))}
      </ol>
      <Explain title={STAGES[sel].label}>{STAGES[sel].text}</Explain>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 2. 필기 구성 — 'NCS + 전공 + α' 식으로                                   */
/* ------------------------------------------------------------------ */

const PARTS = [
  {
    key: "ncs",
    label: "NCS",
    full: "NCS 직업기초능력",
    base: true,
    text: "직무 수행에 필요한 기본 역량을 평가하는 시험이에요. 독해력, 자료 해석, 문제 해결 능력 등을 객관식 문항으로 평가하며, 많은 공공기관에서 필기전형의 핵심 평가 요소로 활용하고 있어요.",
  },
  {
    key: "major",
    label: "전공",
    full: "전공",
    base: true,
    text: "경영·경제·법·IT 등 직무와 관련된 전문 지식을 평가하는 시험이에요. 기관에 따라 전공 시험을 실시하지 않기도 하고, 여러 과목을 함께 평가하거나 특정 과목을 심층적으로 평가하기도 해요. 자세한 내용은 5장에서 살펴볼게요.",
  },
  {
    key: "essay",
    label: "논술",
    full: "논술",
    base: false,
    text: "주제를 받고 내 생각을 글로 쓰는 시험이에요. 일부 기관에서 보며, 경제·금융 이슈를 묻는 경우가 많아 평소 시사 흐름을 정리해 두면 좋아요.",
  },
  {
    key: "personality",
    label: "인성검사",
    full: "인성검사",
    base: false,
    text: "정답이 있는 시험이 아니라 성향을 보는 검사예요. 기관에 따라 필기와 같은 날 보기도 하고, 온라인으로 따로 보기도 해요. 솔직하고 일관되게 답하는 게 중요해요.",
  },
];

function ExamParts() {
  const [sel, setSel] = useState(0);
  const p = PARTS[sel];
  return (
    <div className="space-y-5">
      <TryHint>블록을 눌러 보세요</TryHint>
      <div className="rounded-3xl bg-canvas p-4 shadow-level-2 sm:p-6">
        <p className="type-caption font-semibold text-ink-secondary">필기전형 =</p>
        <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-stretch gap-2 sm:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr]">
          {PARTS.map((x, i) => (
            <div key={x.key} className={cn("contents", i === 2 && "max-sm:[&>*:first-child]:hidden")}>
              {i > 0 && (
                <span aria-hidden className={cn("flex items-center justify-center text-ink-mute", i === 2 && "max-sm:hidden")}>
                  <Plus className="h-5 w-5" strokeWidth={2.5} />
                </span>
              )}
              <button
                type="button"
                onClick={() => setSel(i)}
                aria-pressed={sel === i}
                className={cn(
                  "flex min-h-24 flex-col items-center justify-center gap-1.5 rounded-2xl border-2 px-2 py-3 text-center",
                  // 대부분 보는 기본 시험 / 기관마다 다른 시험 — 두 가지 색으로만
                  x.base ? "border-primary/50 bg-ev-written-soft" : "border-[#ffb36b] bg-[#fff1e0]",
                  anim,
                  sel === i ? "scale-[1.03] ring-2 ring-brand-dark ring-offset-2" : "hover:-translate-y-0.5",
                )}
              >
                <span className="type-heading-sm text-ink">{x.label}</span>
                <span className={cn("rounded-full px-2 py-0.5 type-caption font-semibold", x.base ? "bg-brand-dark text-on-primary" : "bg-canvas text-ink-secondary")}>{x.base ? "기본" : "기관마다 달라요"}</span>
              </button>
            </div>
          ))}
        </div>
      </div>
      <Explain eyebrow={p.base ? "기본" : "기관마다 달라요"} title={p.full}>
        {p.text}
      </Explain>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 3. NCS 10가지 기본 역량 — 카드 뒤집기                                     */
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
                className={cn("relative h-40 w-full text-left [transform-style:preserve-3d] motion-safe:transition-transform motion-safe:duration-500", flipped && "[transform:rotateY(180deg)]")}
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
                <span className="absolute inset-0 flex flex-col rounded-2xl border-2 border-brand-dark bg-canvas-cream p-3.5 [backface-visibility:hidden] [transform:rotateY(180deg)]">
                  <span className="type-caption font-bold text-primary-text">{a.name}능력</span>
                  <span className="mt-1.5 type-caption leading-relaxed text-ink [word-break:keep-all]">{a.back}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 4. 문제 유형 3가지 — 유형을 고르면 특징과 예시 문제                        */
/* ------------------------------------------------------------------ */

interface Example {
  passage?: string;
  table?: { head: string[]; rows: string[][] };
  question: string;
  options: string[];
}

const TYPES: { key: string; one: string; points: [string, string][]; example: Example }[] = [
  {
    key: "PSAT형",
    one: "긴 지문 + 표·그래프를 빠르게 해석",
    points: [
      ["지문", "길고 표·그래프가 많아요"],
      ["핵심", "자료를 정확히 읽고 계산하는 힘, 시간 관리"],
      ["준비", "PSAT 기출로 실전 감각을 기르고, 문항당 풀이 시간 정해 두기"],
    ],
    example: {
      passage: "다음은 ○○공사의 연도별 신규 채용 인원이다.",
      table: {
        head: ["구분", "2023년", "2024년", "2025년"],
        rows: [
          ["사무직", "40명", "48명", "60명"],
          ["기술직", "30명", "27명", "36명"],
        ],
      },
      question: "자료에 대한 설명으로 옳은 것은?",
      options: ["사무직 채용 인원은 매년 늘었다.", "기술직 채용 인원은 매년 늘었다.", "2025년 전체 채용 인원은 2023년의 두 배다.", "2024년 전체 채용 인원 중 기술직이 절반을 넘는다."],
    },
  },
  {
    key: "모듈형",
    one: "짧은 문제 + NCS 이론·개념",
    points: [
      ["지문", "짧아요"],
      ["핵심", "NCS 학습모듈의 이론·개념을 아는지"],
      ["준비", "NCS 10개 영역 이론서를 한 번 정리해 두기"],
    ],
    example: {
      question: "다음 중 효과적인 경청 방법으로 적절하지 않은 것은?",
      options: ["상대의 말을 끝까지 듣는다.", "상대가 말하는 동안 내가 할 대답을 미리 준비한다.", "고개를 끄덕이는 등 듣고 있다는 반응을 보인다.", "들은 내용을 요약해서 다시 확인한다."],
    },
  },
  {
    key: "피듈형",
    one: "자료 읽기 + 이론 적용이 함께",
    points: [
      ["지문", "자료가 주어지고, 이론을 적용해야 풀려요"],
      ["핵심", "자료 해석과 이론 개념을 둘 다"],
      ["준비", "지원 기관 필기 후기로 두 유형의 비중 확인하기"],
    ],
    example: {
      passage: "다음은 김 주임이 오늘 처리해야 할 업무 목록이다.",
      question: "시간관리 매트릭스(긴급성·중요성)에 따를 때, 가장 먼저 처리해야 할 일은?",
      options: ["다음 달 신입 직원 교육 계획 세우기", "오늘 오후 3시까지 제출할 분기 실적 보고서 작성", "옆 팀 동료가 부탁한 단순 자료 찾기 (오늘 중)", "업무와 관련 없는 광고성 메일 정리"],
    },
  },
];

function ExampleCard({ ex }: { ex: Example }) {
  return (
    <div className="rounded-2xl border-2 border-brand-dark bg-canvas px-4 py-4 sm:px-5 sm:py-5">
      <p className="type-caption font-semibold text-primary-text">예시 문제</p>
      {ex.passage && <p className="mt-2 type-body-md text-ink [word-break:keep-all]">{ex.passage}</p>}
      {ex.table && (
        <div className="mt-3 overflow-x-auto rounded-lg border border-hairline">
          <table className="w-full min-w-[300px] border-collapse text-center type-caption">
            <thead className="bg-canvas-soft">
              <tr>
                {ex.table.head.map((h) => (
                  <th key={h} className="px-2 py-1.5 font-semibold text-ink-secondary">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ex.table.rows.map((r) => (
                <tr key={r[0]} className="border-t border-hairline">
                  {r.map((c, i) => (
                    <td key={i} className={cn("px-2 py-1.5 tabular", i === 0 ? "font-semibold text-ink" : "text-ink-secondary")}>
                      {c}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-3 type-body-md font-semibold text-ink [word-break:keep-all]">{ex.question}</p>
      <ol className="mt-3 space-y-1.5">
        {ex.options.map((o, i) => (
          <li key={o} className="flex gap-2 rounded-lg bg-canvas-soft px-3 py-2 type-body-md text-ink [word-break:keep-all]">
            <span className="tabular">{"①②③④"[i]}</span>
            <span>{o}</span>
          </li>
        ))}
      </ol>
      <p className="mt-3 type-caption text-ink-mute">※ 유형을 보여 드리려고 새로 만든 예시 문제예요. 실제 시험 문제가 아니에요.</p>
    </div>
  );
}

function TypeExamples() {
  const [sel, setSel] = useState(0);
  const t = TYPES[sel];
  return (
    <div className="space-y-5">
      <div role="tablist" aria-label="문제 유형" className="grid grid-cols-3 gap-2">
        {TYPES.map((x, i) => (
          <button
            key={x.key}
            type="button"
            role="tab"
            aria-selected={sel === i}
            onClick={() => setSel(i)}
            className={cn(
              "flex flex-col items-center gap-0.5 rounded-2xl border-2 px-2 py-3 text-center",
              anim,
              sel === i ? "border-brand-dark bg-brand-dark text-on-primary shadow-level-2" : "border-hairline bg-canvas text-ink hover:border-brand-dark/40",
            )}
          >
            <span className="type-heading-sm">{x.key}</span>
            <span className={cn("hidden type-caption sm:block [word-break:keep-all]", sel === i ? "text-on-primary/80" : "text-ink-mute")}>{x.one}</span>
          </button>
        ))}
      </div>
      <div key={sel} role="tabpanel" className="grid gap-4 motion-safe:animate-[kk-fade-in_.3s_ease-out] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] lg:items-start">
        <div className="rounded-2xl bg-canvas px-5 py-5 shadow-level-1">
          <p className="type-heading-md text-ink">{t.key}</p>
          <p className="mt-0.5 type-body-md text-ink-secondary">{t.one}</p>
          <dl className="mt-4 space-y-3">
            {t.points.map(([k, v]) => (
              <div key={k} className="flex gap-3">
                <dt className="w-10 shrink-0 type-caption font-semibold text-primary-text">{k}</dt>
                <dd className="type-body-md text-ink [word-break:keep-all]">{v}</dd>
              </div>
            ))}
          </dl>
          {t.key === "피듈형" && (
            <Link href="/reviews" className="link mt-4 inline-flex items-center gap-1 type-caption">
              필기 후기 보러 가기 <ArrowRight className="h-3 w-3" strokeWidth={2} />
            </Link>
          )}
        </div>
        <ExampleCard ex={t.example} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 5. 전공 시험 — 넓이(과목 수)와 깊이(난이도)를 모양으로                      */
/* ------------------------------------------------------------------ */

const MAJORS = [
  {
    key: "none",
    label: "전공 없음",
    w: 0,
    h: 0,
    color: "#56c08a",
    scope: "전공 과목 없음",
    depth: "—",
    text: "전공 시험 없이 NCS 등으로만 봐요. 비전공자도 도전하기 쉽지만, 모두 같은 시험을 보니 NCS 점수 경쟁이 치열해요.",
    fit: "전공 공부 부담 없이 NCS에 집중하고 싶은 사람",
  },
  {
    key: "integrated",
    label: "통합 전공",
    w: 100,
    h: 34,
    color: "#ff9a4d",
    scope: "여러 과목 (넓게)",
    depth: "기본 개념 위주 (얕게)",
    text: "경영·경제·법 등 여러 과목이 한 시험에 섞여 나와요. 범위가 넓은 대신 한 과목을 깊게 묻지는 않는 편이에요.",
    fit: "여러 과목의 기본 개념을 고르게 아는 사람",
  },
  {
    key: "single",
    label: "단일 전공",
    w: 34,
    h: 100,
    color: "#533afd",
    scope: "한 과목 (좁게)",
    depth: "심화 내용까지 (깊게)",
    text: "경영·경제·법·IT 중 한 과목을 골라 깊게 봐요. 서술형·논술형이 많아 답안을 직접 써 보는 연습이 필요해요.",
    fit: "한 과목을 깊이 공부해 온 사람",
  },
];

/** 상자 모양: 가로 = 시험 범위(과목 수), 세로 = 깊이 */
function ShapeBox({ w, h, color }: { w: number; h: number; color: string }) {
  return (
    <div className="relative h-36 w-full pt-5 pr-1 pb-8 pl-5">
      {/* 세로축: 깊이 */}
      <span aria-hidden className="absolute top-4 bottom-7 left-2 w-px bg-ink/25" />
      <span className="absolute top-0 left-4 text-[11px] font-semibold text-ink-mute">↑ 깊이(난이도)</span>
      {/* 가로축: 범위 */}
      <span aria-hidden className="absolute right-1 bottom-7 left-2 h-px bg-ink/25" />
      <span className="absolute right-1 bottom-0 text-[11px] leading-4 font-semibold text-ink-mute">범위(과목 수) →</span>
      <div className="relative flex h-full w-full items-end">
        {w > 0 ? (
          <span className="block rounded-md" style={{ width: `${w}%`, height: `${h}%`, background: color, opacity: 0.85 }} />
        ) : (
          <span className="flex h-full w-full items-center justify-center rounded-md border-2 border-dashed border-ink/20 text-center text-[11px] text-ink-mute">
            전공 시험 없음
            <br />
            (NCS만)
          </span>
        )}
      </div>
    </div>
  );
}

function MajorShapes() {
  const [sel, setSel] = useState(2);
  const m = MAJORS[sel];
  return (
    <div className="space-y-5">
      <TryHint>카드를 눌러 비교해 보세요</TryHint>
      <ul className="grid gap-3 sm:grid-cols-3">
        {MAJORS.map((x, i) => (
          <li key={x.key}>
            <button
              type="button"
              onClick={() => setSel(i)}
              aria-pressed={sel === i}
              className={cn("w-full rounded-2xl border-2 bg-canvas px-4 pt-3.5 pb-4 text-left", anim, sel === i ? "border-brand-dark shadow-level-2" : "border-hairline hover:border-brand-dark/40")}
            >
              <span className="flex items-center gap-2 type-heading-sm text-ink">
                <span className="h-3 w-3 rounded-full" style={{ background: x.color }} />
                {x.label}
              </span>
              <span className="mt-3 block">
                <ShapeBox w={x.w} h={x.h} color={x.color} />
              </span>
              <span className="mt-3 grid grid-cols-[auto_1fr] gap-x-2 gap-y-1 type-caption">
                <span className="font-semibold text-ink-secondary">범위</span>
                <span className="text-ink">{x.scope}</span>
                <span className="font-semibold text-ink-secondary">깊이</span>
                <span className="text-ink">{x.depth}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      <Explain eyebrow="이런 시험이에요" title={m.label}>
        <p>{m.text}</p>
        <p className="mt-3 rounded-xl bg-canvas-soft px-4 py-3 type-body-md text-ink">
          <span className="font-semibold text-primary-text">이런 사람에게 맞아요 · </span>
          {m.fit}
        </p>
      </Explain>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 6. A매치 — 같은 날, 하나만                                              */
/* ------------------------------------------------------------------ */

/** 흔히 A매치로 불리는 대표 기관 — 같은 날 시험을 보는 장면을 보여 주는 예시 (날짜는 적지 않아요) */
const TICKETS = [
  { id: "bok", name: "한국은행", shortName: "한은", logo: "/logos/bok.png" },
  { id: "fss", name: "금융감독원", shortName: "금감원", logo: "/logos/fss.png" },
  { id: "kdb", name: "산업은행", shortName: "산은", logo: "/logos/kdb.png" },
];

/** 받침 있으면 '을', 없으면 '를' */
const eulReul = (word: string) => {
  const code = word.charCodeAt(word.length - 1) - 0xac00;
  return code >= 0 && code <= 11171 && code % 28 !== 0 ? "을" : "를";
};

function AMatch() {
  const [pick, setPick] = useState<number | null>(null);
  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-hairline bg-canvas p-4 shadow-level-2 sm:p-5">
        <p className="flex items-start gap-2 type-body-md font-semibold text-ink [word-break:keep-all]">
          <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-primary" strokeWidth={2} />
          어느 토요일 오전 10시 — 필기 세 곳이 동시에... 나의 선택은!?
        </p>
        <ul className="mt-4 grid gap-2.5 sm:grid-cols-3">
          {TICKETS.map((t, i) => {
            const chosen = pick === i;
            const blocked = pick != null && !chosen;
            return (
              <li key={t.id}>
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
                  <span className="mt-2 flex items-center gap-2">
                    <CompanyAvatar company={t} size="sm" />
                    <span className="type-heading-sm [word-break:keep-all]">{t.name}</span>
                  </span>
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
        <p className="mt-3 type-caption text-ink-mute [word-break:keep-all]">※ 이해를 돕기 위한 예시 장면이에요. 실제 필기 날짜와 시간은 해마다 기관 공고를 확인하세요.</p>
      </div>
      <KongSays>시험 일정이 겹치는 만큼 지원자는 응시할 기관을 전략적으로 선택해야 해요.</KongSays>
      {pick != null && (
        <Explain title={`${TICKETS[pick].name}${eulReul(TICKETS[pick].name)} 골랐다면, 나머지 두 곳은 포기해야 해요.`}>
          하루에 한 곳만 볼 수 있으니, 서류를 낼 때부터 어느 기관 필기를 볼지 미리 정해 두는 게 좋아요.
          <Link href="/calendar" className="link mt-3 flex items-center gap-1 type-body-md">
            채용 캘린더에서 실제 필기 날짜 보기 <ArrowRight className="h-4 w-4" strokeWidth={2} />
          </Link>
        </Explain>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 마무리                                                                */
/* ------------------------------------------------------------------ */

const SUMMARY = [
  "필기시험은 서류전형 다음, 면접전형 이전의 핵심 관문",
  "필기전형의 기본은 NCS와 전공시험, 세부 구성은 기관마다 달라요",
  "NCS는 10가지 기본 역량을 평가하며, 출제 영역은 기관마다 달라요",
  "NCS 문제는 크게 세 가지 유형, 지원 기관의 출제 유형을 확인하세요",
  "전공시험은 미실시·통합전공·단일전공으로 구분돼요",
  "같은 날 치러지는 A매치, 지원 기관을 전략적으로 선택하세요",
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
      <div className="grid gap-2.5 sm:grid-cols-3">
        {[
          { href: "/companies", label: "기관별 필기 구성 보기", Icon: ClipboardList },
          { href: "/calendar", label: "다가오는 필기 일정", Icon: CalendarDays },
          { href: "/reviews", label: "필기 후기·체감 난이도", Icon: MessagesSquare },
        ].map((c) => (
          <Link key={c.href} href={c.href} className="group flex items-center gap-2 rounded-xl bg-brand-dark px-4 py-3.5 type-body-md font-semibold text-on-primary">
            <c.Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
            <span className="min-w-0 flex-1 [word-break:keep-all]">{c.label}</span>
            <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
          </Link>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 전체 — 장 단위로 넘겨 보기                                              */
/* ------------------------------------------------------------------ */

interface Chapter {
  short: string;
  title: string;
  lead?: string;
  /** 장 머리(서브헤드 아래) 콩이 한마디 — 없으면 안 보임 */
  kong?: string;
  look?: Look;
  bg: string;
  body: ReactNode;
}

const CHAPTERS: Chapter[] = [
  {
    short: "채용 흐름",
    title: "필기는 채용의 어디쯤일까요?",
    lead: "금공 채용은 보통 네 단계예요. 필기가 어디에 있는지부터 볼게요.",
    kong: "필기는 서류 다음, 면접 바로 앞의 관문이에요!",
    bg: "bg-[#f6f4ff]",
    body: <Flow />,
  },
  {
    short: "필기 구성",
    title: "필기 시험지를 들여다볼까요?",
    kong: "필기전형의 기본은 NCS와 전공시험이며, 세부 구성은 기관마다 달라요.",
    bg: "bg-[#fffaf3]",
    body: <ExamParts />,
  },
  {
    short: "NCS",
    title: "NCS는 직무 수행에 필요한 10가지 기본 역량을 평가해요",
    lead: "NCS 직업기초능력은 총 10개 영역으로 구성되어 있어요. 기관마다 직무 특성에 따라 평가하는 영역과 출제 비중이 달라요.",
    kong: "보라색 '기본' 세 장은 금융공기업 필기에서 거의 빠지지 않아요.",
    bg: "bg-[#f6f4ff]",
    body: <NcsCards />,
  },
  {
    short: "문제 유형",
    title: "같은 NCS라도 문제 유형은 달라요",
    lead: "NCS는 출제 방식에 따라 크게 세 가지 유형으로 나뉘어요. 각 유형이 어떤 특징을 가지고 있는지 살펴볼게요.",
    bg: "bg-[#f2fbf5]",
    body: <TypeExamples />,
  },
  {
    short: "전공",
    title: "전공 시험은 넓게 볼까, 깊게 볼까",
    lead: "전공 시험은 몇 과목을 보는지(범위)와 얼마나 깊이 묻는지(깊이)에 따라 세 가지로 나뉘어요.",
    kong: "같은 기관이라도 직렬마다 전공 과목이 달라요. 지원할 직렬의 공고를 꼭 확인하세요!",
    look: "book",
    bg: "bg-[#fff6ec]",
    body: <MajorShapes />,
  },
  {
    short: "A매치",
    title: "같은 날 펼쳐지는 금융공기업 입사 경쟁",
    lead: "한국은행, 금융감독원 등 주요 금융공공기관들이 같은 날 필기시험을 치르는 것을 흔히 ‘A매치’라고 불러요.",
    bg: "bg-[#f6f4ff]",
    body: <AMatch />,
  },
  {
    short: "정리",
    title: "이것만 기억하세요",
    lead: "오늘 본 내용을 한 장으로 정리했어요.",
    kong: "이제 필기 준비, 시작할 수 있겠죠?",
    look: "suit",
    bg: "bg-[#f2fbf5]",
    body: <Wrap />,
  },
];

/** 본문 좌우 넘기기 화살표 — 반투명이라 뒤 내용이 비쳐 보여요 */
function ArrowBtn({ dir, disabled, onClick, label }: { dir: "prev" | "next"; disabled: boolean; onClick: () => void; label: string }) {
  const Icon = dir === "prev" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(
        "pointer-events-auto inline-flex items-center justify-center border border-brand-dark/10 bg-canvas/45 text-brand-dark/55 backdrop-blur-[2px] transition-all",
        "hover:border-brand-dark/25 hover:bg-canvas/90 hover:text-brand-dark hover:shadow-level-2",
        // 휴대폰: 화면 가장자리에 붙은 반원 손잡이(글자와 안 겹치게) / 넓은 화면: 본문 양옆 여백의 동그란 버튼
        "h-12 w-7",
        dir === "prev" ? "rounded-r-full border-l-0" : "rounded-l-full border-r-0",
        "sm:h-12 sm:w-12 sm:rounded-full sm:border md:h-14 md:w-14",
        "disabled:invisible",
      )}
    >
      <Icon className="h-5 w-5 sm:h-7 sm:w-7" strokeWidth={2} />
    </button>
  );
}

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
    if (i < 0 || i >= CHAPTERS.length) return;
    setCh(i);
    // 장을 바꾸면 장 머리로
    const el = top.current;
    if (el && el.getBoundingClientRect().top < 0) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const c = CHAPTERS[ch];
  const prevLabel = ch > 0 ? `이전 장 · ${CHAPTERS[ch - 1].short}` : "이전 장 없음";
  const nextLabel = ch < CHAPTERS.length - 1 ? `다음 장 · ${CHAPTERS[ch + 1].short}` : "마지막 장";

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
            <p className="mt-2 type-body-lg text-ink-secondary [word-break:keep-all]">한 장씩 눌러 보면서 필기의 기본 개념을 익혀요.</p>
          </div>
        </div>
        <h2 className="sr-only">{title}</h2>
      </section>

      {/* 장 고르기 */}
      <div ref={top} className="sticky top-[61px] z-20 border-y border-hairline bg-canvas/95 backdrop-blur md:top-[65px]">
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
      <section role="tabpanel" aria-label={c.title} className={cn("relative min-h-[70svh]", c.bg)}>
        {/* 본문 좌우 화살표 — 화면 세로 가운데에 붙어 따라오고, 내용을 가리지 않게 반투명 */}
        <div aria-hidden={false} className="pointer-events-none absolute inset-0 z-10">
          <div className="sticky top-[50svh] flex -translate-y-1/2 justify-between sm:px-2 md:px-3">
            <ArrowBtn dir="prev" disabled={ch === 0} onClick={() => go(ch - 1)} label={prevLabel} />
            <ArrowBtn dir="next" disabled={ch === CHAPTERS.length - 1} onClick={() => go(ch + 1)} label={nextLabel} />
          </div>
        </div>

        <div key={ch} className="mx-auto max-w-[1040px] px-5 py-8 motion-safe:animate-[kk-fade-in_.35s_ease-out] sm:px-14 md:px-20 md:py-12">
          <ChapterContent i={ch} />
        </div>
      </section>

      {/* 검색엔진용 — 지금 장이 아닌 장의 글도 HTML 에 (화면에는 안 보이고, 장을 고르면 위에서 새로 열려요) */}
      {CHAPTERS.map((x, i) =>
        i === ch ? null : (
          <section key={x.short} hidden>
            <ChapterContent i={i} />
          </section>
        ),
      )}
    </div>
  );
}

/** 한 장의 머리(번호·제목·서브헤드·콩이)와 본문 */
function ChapterContent({ i }: { i: number }) {
  const c = CHAPTERS[i];
  return (
    <>
      <p className="type-micro-cap text-primary-text">
        {String(i + 1).padStart(2, "0")} · {c.short}
        <span className="ml-2 tabular text-ink-mute">
          {i + 1}/{CHAPTERS.length}
        </span>
      </p>
      <h2 className="mt-1 type-heading-lg font-bold text-ink [word-break:keep-all] md:type-display-md">{c.title}</h2>
      {c.lead && <p className="mt-2 type-body-lg text-ink-secondary [word-break:keep-all]">{c.lead}</p>}
      {c.kong && (
        <div className="mt-5">
          <KongSays look={c.look}>{c.kong}</KongSays>
        </div>
      )}
      <div className="mt-7">{c.body}</div>
    </>
  );
}
