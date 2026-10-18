"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Check, Clock3, PenLine, Quote, Scale, TrendingUp } from "lucide-react";
import { cn } from "../../ui";
import { KongMascot } from "../KongMascot";
import { Explain, GuideShell, KongSays, TryHint, anim, type GuideChapter } from "./GuideShell";

/**
 * 산은(한국산업은행) 경영 필기 — 범위·시간·컷을 공고와 후기로 나눠 눌러 보며 보는 가이드
 * 숫자는 2027년 5급 신입행원(일반) 공고·FAQ에 있는 것만 쓰고, 후기는 '응시 후기' 꼬리표를 붙여요.
 */

const REVIEW_HREF = "/reviews/kdb-2026-10-24";
const NOTICE_URL = "https://job.alio.go.kr/recruitview.do?idx=304398";

/* ------------------------------------------------------------------ */
/* 공통 — 출처 꼬리표                                                     */
/* ------------------------------------------------------------------ */

type Kind = "notice" | "review" | "kong";

const KIND: Record<Kind, { label: string; cls: string }> = {
  notice: { label: "공고 확인", cls: "bg-ev-written-soft text-primary-text" },
  review: { label: "응시 후기", cls: "bg-[#fff1e0] text-[#9a4a0b]" },
  kong: { label: "금콩 생각", cls: "bg-[#e3f5ea] text-[#1d6e43]" },
};

function Src({ kind }: { kind: Kind }) {
  return <span className={cn("inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] leading-4 font-bold whitespace-nowrap", KIND[kind].cls)}>{KIND[kind].label}</span>;
}

/** 꼬리표 + 한 줄 */
function Fact({ kind, children }: { kind: Kind; children: React.ReactNode }) {
  return (
    <p className="flex items-start gap-2">
      <span className="mt-[3px]">
        <Src kind={kind} />
      </span>
      <span className="min-w-0 flex-1 type-body-md text-ink ko-justify">{children}</span>
    </p>
  );
}

/** 표지 아래 — 후기 속 이상한 점 */
function Hook() {
  return (
    <div className="grid gap-4 rounded-3xl bg-canvas/85 p-4 shadow-level-1 backdrop-blur sm:grid-cols-[1fr_auto] sm:items-end sm:p-5">
      <div>
        <p className="type-caption font-semibold text-ink-mute">산은 필기 후기를 모아 보면, 같은 사람한테서 이런 말이 나와요</p>
        <div className="mt-2.5 flex flex-wrap gap-2">
          <span className="rounded-2xl rounded-bl-sm bg-ev-written-soft px-3.5 py-2 type-body-md font-semibold text-ink">“문제는 안 어려웠다”</span>
          <span className="rounded-2xl rounded-bl-sm bg-[#fff1e0] px-3.5 py-2 type-body-md font-semibold text-ink">“반도 못 풀었다”</span>
        </div>
        <p className="mt-2.5 type-body-md text-ink-secondary">쉬운데 못 푼다니, 무슨 일일까요?</p>
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-hairline pt-3 sm:flex-col sm:items-end sm:border-t-0 sm:pt-0">
        <span className="type-caption text-ink-mute">이 글의 꼬리표</span>
        <span className="flex items-center gap-1.5 type-caption text-ink-secondary">
          <Src kind="notice" /> 공고·FAQ
        </span>
        <span className="flex items-center gap-1.5 type-caption text-ink-secondary">
          <Src kind="review" /> 준비생 후기
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 1. 숫자 — 몇 명이 남나                                                 */
/* ------------------------------------------------------------------ */

const FUNNEL = [
  { key: "doc", label: "서류 합격", when: "9/29(화) 발표", mult: "15배수 내외", people: 525, approx: "약 525명", text: "서류에서 최종 인원의 15배수 내외를 뽑아요. 경영직렬만 대략 500명 넘게 필기 시험장에 앉는 셈이에요." },
  { key: "written", label: "필기 합격", when: "10/24(토) 시험 · 10/30(금) 발표", mult: "3배수 내외", people: 105, approx: "약 105명", text: "필기를 지나면 3배수 내외, 100명 남짓만 남아요. 서류 합격자 다섯 명 중 한 명꼴이에요." },
  { key: "int1", label: "1차 면접", when: "11월 초중순 · 11/17(화) 발표", mult: "1.5배수 내외", people: 52, approx: "약 52명", text: "1차 면접 점수는 면접 70%에 필기 30%를 더해서 매겨요. 필기 점수가 여기까지 따라와요." },
  { key: "final", label: "최종 합격", when: "2차 면접 11월 하순 · 12/2(수) 발표", mult: "35명 + 예비합격 3명", people: 38, approx: "35명 + 예비합격 3명", text: "2차 면접까지 마치면 경영직렬 35명이 최종 합격하고, 예비합격 3명이 함께 정해져요." },
];

function Stat({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="rounded-2xl bg-canvas px-4 py-3.5 shadow-level-1">
      <p className="type-caption text-ink-mute">{label}</p>
      <p className="mt-0.5 type-heading-md font-bold text-ink tabular">{value}</p>
      <p className="mt-0.5 type-caption text-ink-secondary [word-break:keep-all]">{note}</p>
    </div>
  );
}

/** 1차 면접 점수 = 면접 70% + 필기 30% */
function WeightBar() {
  return (
    <div className="rounded-2xl border-2 border-brand-dark bg-canvas px-5 py-5">
      <div className="flex items-start justify-between gap-2">
        <p className="type-heading-sm text-ink [word-break:keep-all]">1차 면접 점수는 이렇게 매겨요</p>
        <Src kind="notice" />
      </div>
      <div className="mt-4 flex h-12 gap-0.5 overflow-hidden rounded-xl type-body-md font-bold">
        <span className="flex items-center justify-center bg-brand-dark text-on-primary" style={{ width: "70%" }}>
          면접 70%
        </span>
        <span className="flex items-center justify-center bg-[#ffb36b] text-ink" style={{ width: "30%" }}>
          필기 30%
        </span>
      </div>
      <p className="mt-3 type-body-md text-ink-secondary ko-justify">필기는 붙으면 끝이 아니라, 면접까지 따라오는 점수예요.</p>
    </div>
  );
}

function Funnel() {
  const [sel, setSel] = useState(1);
  const f = FUNNEL[sel];
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-2.5">
        <Stat label="경영직렬 채용" value="35명" note="직전 공고 30명보다 5명 늘었어요" />
        <Stat label="필기 날짜" value="10.24(토)" note="합격 발표 10.30(금)" />
      </div>
      <TryHint>단계를 눌러 보세요</TryHint>
      <div className="rounded-3xl bg-canvas p-3 shadow-level-2 sm:p-5">
        <div className="flex items-center justify-between gap-2 px-1">
          <p className="type-caption font-semibold text-ink-secondary">경영직렬 기준, 단계마다 남는 인원</p>
          <Src kind="notice" />
        </div>
        <ol className="mt-3 space-y-1">
          {FUNNEL.map((x, i) => (
            <li key={x.key}>
              <button
                type="button"
                onClick={() => setSel(i)}
                aria-pressed={sel === i}
                className={cn(
                  "grid w-full grid-cols-[4.75rem_1fr] items-center gap-3 rounded-xl px-2.5 py-2.5 text-left sm:grid-cols-[6.5rem_1fr]",
                  anim,
                  sel === i ? "bg-canvas-cream ring-2 ring-brand-dark" : "hover:bg-canvas-soft",
                )}
              >
                <span className="type-body-md font-semibold text-ink [word-break:keep-all]">{x.label}</span>
                <span className="min-w-0">
                  <span className="block h-6 overflow-hidden rounded-md bg-canvas-soft">
                    <span className={cn("block h-full rounded-md", anim, sel === i ? "bg-brand-dark" : "bg-primary/40")} style={{ width: `${Math.max(5, (x.people / 525) * 100)}%` }} />
                  </span>
                  <span className="mt-1 block truncate tabular type-caption font-semibold text-ink-secondary">
                    {x.mult === x.approx ? x.approx : `${x.mult} · ${x.approx}`}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ol>
      </div>
      <Explain eyebrow={f.when} title={`${f.label} · ${f.approx}`}>
        {f.text}
      </Explain>
      <WeightBar />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 2. 범위 — '경영학' 세 글자의 속                                         */
/* ------------------------------------------------------------------ */

const LEVELS = [
  { label: "안 나온다는 게 중론", tile: "h-16 border-2 border-dashed border-ink/20 bg-canvas text-ink-mute" },
  { label: "한두 문제", tile: "h-24 border-2 border-[#ffb36b] bg-[#fff1e0] text-ink" },
  { label: "중심 과목", tile: "h-32 border-2 border-brand-dark bg-brand-dark text-on-primary" },
];

const AREAS: { name: string; sub?: string; level: 0 | 1 | 2; notice: string; review: string }[] = [
  { name: "재무관리", level: 2, notice: "FAQ에 '재무관리학'이 그대로 적혀 있어요.", review: "후기를 모아 보면 재무회계와 함께 중심 과목이에요." },
  { name: "재무회계", level: 2, notice: "FAQ의 '회계학'에 들어가요.", review: "후기를 모아 보면 재무관리와 함께 중심 과목이에요." },
  { name: "고급회계", sub: "연결·합병", level: 1, notice: "따로 언급이 없어요.", review: "1~2문제 나왔다는 후기가 있어요." },
  { name: "일반경영", sub: "인사·조직·마케팅", level: 1, notice: "'전공과목 전체'라는 말에 들어가요.", review: "한두 문제 수준이었다는 후기가 많았어요." },
  { name: "원가·관리회계", level: 0, notice: "따로 언급이 없어요.", review: "안 나온다는 게 중론이에요." },
];

const TOPICS = ["통화스와프 가치 평가", "재무비율", "확정급여제도", "차입원가", "합병·연결", "MM 이론", "분개"];

function Scope() {
  const [sel, setSel] = useState(0);
  const [done, setDone] = useState<Set<string>>(new Set());
  const a = AREAS[sel];
  const toggle = (t: string) =>
    setDone((s) => {
      const n = new Set(s);
      if (n.has(t)) n.delete(t);
      else n.add(t);
      return n;
    });
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {["고급회계 나와요?", "원가는요?", "경제도 봐야 해요?"].map((q) => (
          <span key={q} className="rounded-2xl rounded-bl-sm border border-hairline bg-canvas px-3 py-1.5 type-caption font-semibold text-ink-secondary">
            {q}
          </span>
        ))}
      </div>
      <TryHint>영역을 눌러 보세요</TryHint>
      <div className="rounded-3xl bg-canvas p-4 shadow-level-2 sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <p className="type-caption font-semibold text-ink-secondary">후기로 본 경영학 출제 지도</p>
          <Src kind="review" />
        </div>
        <ul className="mt-4 grid grid-cols-2 items-end gap-2 sm:grid-cols-5">
          {AREAS.map((x, i) => (
            <li key={x.name} className={cn(x.level === 0 && "max-sm:col-span-2")}>
              <button
                type="button"
                onClick={() => setSel(i)}
                aria-pressed={sel === i}
                className={cn(
                  "flex w-full flex-col items-start justify-end rounded-2xl px-3 py-2.5 text-left",
                  LEVELS[x.level].tile,
                  anim,
                  sel === i ? "ring-2 ring-primary ring-offset-2" : "hover:-translate-y-0.5",
                )}
              >
                <span className="type-body-md font-bold [word-break:keep-all]">{x.name}</span>
                {x.sub && <span className="type-caption opacity-75">{x.sub}</span>}
              </button>
            </li>
          ))}
        </ul>
        <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1 type-caption text-ink-mute">
          {[...LEVELS].reverse().map((l, i) => (
            <li key={l.label} className="flex items-center gap-1.5">
              <span className={cn("h-2.5 w-2.5 rounded-sm", i === 0 ? "bg-brand-dark" : i === 1 ? "bg-[#ffb36b]" : "border border-dashed border-ink/40")} />
              {l.label}
            </li>
          ))}
        </ul>
      </div>
      <Explain eyebrow={LEVELS[a.level].label} title={a.sub ? `${a.name} (${a.sub})` : a.name}>
        <div className="mt-1 space-y-2.5">
          <Fact kind="notice">{a.notice}</Fact>
          <Fact kind="review">{a.review}</Fact>
        </div>
      </Explain>

      <figure className="rounded-2xl bg-canvas px-5 py-5 shadow-level-1">
        <div className="flex items-center gap-2">
          <Src kind="notice" />
          <p className="type-caption font-semibold text-ink-secondary">공식 답에 가장 가까운 것</p>
        </div>
        <blockquote className="mt-3 border-l-4 border-primary pl-3 type-body-lg font-semibold text-ink [word-break:keep-all]">“재무관리학, 회계학 등을 포함한 전공과목 전체”</blockquote>
        <figcaption className="mt-1 pl-4 type-caption text-ink-mute">산은 채용 FAQ · 경영학 범위</figcaption>
        <blockquote className="mt-4 border-l-4 border-primary/40 pl-3 type-body-md font-semibold text-ink [word-break:keep-all]">“재무관리, 회계 등 기본 경영학 지식”</blockquote>
        <figcaption className="mt-1 pl-4 type-caption text-ink-mute">직무설명자료 · 필요지식</figcaption>
      </figure>

      <div className="rounded-2xl bg-canvas px-5 py-4 shadow-level-1">
        <p className="type-heading-sm text-ink">경제도 봐야 해요?</p>
        <div className="mt-2 space-y-2">
          <Fact kind="notice">과목이 “경영학 또는 경제학 중 택1”이라, 경영학을 고르면 경제학은 따로 안 봐도 돼요.</Fact>
          <p className="type-caption text-ink-mute [word-break:keep-all]">준비생들 사이엔 ‘산은 필기 꿀팁은 경제학을 고르는 것’이라는 농담도 돌아요. 물론 농담이에요.</p>
        </div>
      </div>

      <div className="rounded-2xl border border-dashed border-ink/20 bg-canvas/70 px-5 py-4">
        <div className="flex flex-wrap items-center gap-2">
          <Src kind="review" />
          <p className="type-caption font-semibold text-ink-secondary">상반기(4월 25일) 시험에 나왔다는 단원 — 정리한 건 눌러 체크</p>
        </div>
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {TOPICS.map((t) => {
            const on = done.has(t);
            return (
              <li key={t}>
                <button
                  type="button"
                  onClick={() => toggle(t)}
                  aria-pressed={on}
                  className={cn("inline-flex items-center gap-1 rounded-full px-3 py-1.5 type-caption font-semibold shadow-level-1", anim, on ? "bg-primary text-on-primary" : "bg-canvas text-ink hover:bg-canvas-soft")}
                >
                  {on && <Check className="h-3 w-3" strokeWidth={3} />}
                  {t}
                </button>
              </li>
            );
          })}
        </ul>
        <p className="mt-3 type-caption text-ink-mute [word-break:keep-all]">같은 단원이 또 나온다는 보장은 없으니, 자주 언급된 단원 정도로만 보세요.</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 3. 시간 — 두 가지 푸는 순서 비교                                        */
/* ------------------------------------------------------------------ */

type Step = { id: string; label: string; tag: string; cost: number; stuck?: boolean; scan?: boolean };

// 예시 시험지: 큰 문제 5 + 짧은 문제 5 (후기) — 걸리는 시간·순서는 이해를 돕는 예시
const STEP: Record<string, Step> = {
  scan: { id: "scan", label: "전체 훑기", tag: "버릴 문제 정하기", cost: 1, scan: true },
  b1: { id: "b1", label: "큰 문제 1", tag: "아는 문제", cost: 5 },
  b2: { id: "b2", label: "큰 문제 2", tag: "긴 계산", cost: 9 },
  b3: { id: "b3", label: "큰 문제 3", tag: "막히는 문제", cost: 7, stuck: true },
  b4: { id: "b4", label: "큰 문제 4", tag: "아는 문제", cost: 5 },
  b5: { id: "b5", label: "큰 문제 5", tag: "보통", cost: 5 },
  ...Object.fromEntries([1, 2, 3, 4, 5].map((n) => [`s${n}`, { id: `s${n}`, label: `짧은 문제 ${n}`, tag: "짧은 문제", cost: 1.5 }])),
};

const TIME = 30;

const PLANS = [
  { key: "order", label: "앞에서부터 차례로", order: ["b1", "b2", "b3", "b4", "b5", "s1", "s2", "s3", "s4", "s5"], drop: [] as string[] },
  { key: "scan", label: "훑고 고르기", order: ["scan", "s1", "s2", "s3", "s4", "s5", "b1", "b4", "b5", "b2"], drop: ["b3"] },
];

type Result = "done" | "part" | "blank" | "drop" | "scan";

const RESULT: Record<Result, { label: string; chip: string; bar: string }> = {
  done: { label: "다 씀", chip: "bg-primary text-on-primary", bar: "bg-primary" },
  part: { label: "일부만", chip: "bg-[#ffb36b] text-ink", bar: "bg-[#ffb36b]" },
  blank: { label: "비움", chip: "border border-dashed border-ink/30 bg-canvas text-ink-mute", bar: "" },
  drop: { label: "버림", chip: "bg-canvas-soft text-ink-mute line-through", bar: "" },
  scan: { label: "훑기", chip: "bg-[#d9ecff] text-[#1d4f86]", bar: "bg-[#8cc3f5]" },
};

function simulate(plan: (typeof PLANS)[number]) {
  let used = 0;
  const rows: { s: Step; spent: number; result: Result }[] = plan.order.map((id) => {
    const s = STEP[id];
    const left = TIME - used;
    const spent = Math.max(0, Math.min(s.cost, left));
    used += spent;
    const result: Result = s.scan ? "scan" : spent === 0 ? "blank" : spent < s.cost || s.stuck ? "part" : "done";
    return { s, spent, result };
  });
  for (const id of plan.drop) rows.push({ s: STEP[id], spent: 0, result: "drop" });
  const count = (r: Result) => rows.filter((x) => x.result === r).length;
  return { rows, done: count("done"), part: count("part"), blank: count("blank"), drop: count("drop") };
}

function Clock() {
  const [p, setP] = useState(0);
  const [tips, setTips] = useState<Set<number>>(new Set());
  const plan = PLANS[p];
  const sim = simulate(plan);
  const TIPS = ["시작하자마자 전체를 한 번 훑고, 버릴 문제부터 정하기", "아는 문제를 먼저 확실히 쓰고, 막히면 바로 다음으로", "계산이 긴 문제는 마지막으로 미루기"];
  return (
    <div className="space-y-5">
      <div className="space-y-2 rounded-2xl bg-canvas px-5 py-4 shadow-level-1">
        <Fact kind="review">큰 문제 다섯 개에 짧은 문제 다섯 개였다는 후기가 많았어요.</Fact>
        <Fact kind="review">풀이 과정을 쓰는 주관식 서술·계산형이었다고 해요. (공고와 FAQ엔 형식이 나와 있지 않아요)</Fact>
        <Fact kind="review">큰 문제 두 개를 아예 비우고 나왔다는 사람도 있었어요.</Fact>
      </div>

      <TryHint>푸는 순서를 바꿔 보세요</TryHint>
      <div className="rounded-3xl bg-canvas p-4 shadow-level-2 sm:p-5">
        <div role="tablist" aria-label="푸는 순서" className="grid grid-cols-2 gap-2">
          {PLANS.map((x, i) => (
            <button
              key={x.key}
              type="button"
              role="tab"
              aria-selected={p === i}
              onClick={() => setP(i)}
              className={cn("rounded-xl border-2 px-3 py-2.5 type-body-md font-semibold", anim, p === i ? "border-brand-dark bg-brand-dark text-on-primary" : "border-hairline bg-canvas text-ink hover:border-brand-dark/40")}
            >
              {x.label}
            </button>
          ))}
        </div>

        {/* 시험 시간 막대 */}
        <div key={plan.key} className="mt-4">
          <p className="flex items-center gap-1.5 type-caption font-semibold text-ink-secondary">
            <Clock3 className="h-3.5 w-3.5" strokeWidth={2} />
            시험 시간
          </p>
          <div className="mt-1.5 flex h-7 gap-0.5 overflow-hidden rounded-lg bg-canvas-soft">
            {sim.rows
              .filter((r) => r.spent > 0)
              .map((r, i) => (
                <span
                  key={r.s.id}
                  title={r.s.label}
                  className={cn("h-full motion-safe:animate-[kk-fade-in_.4s_ease-out_both]", RESULT[r.result].bar)}
                  style={{ width: `${(r.spent / TIME) * 100}%`, animationDelay: `${i * 70}ms` }}
                />
              ))}
          </div>
          <p className="mt-1 text-right type-caption text-ink-mute">여기서 시험 끝 ⏰</p>

          <ol className="mt-3 grid gap-1.5 sm:grid-cols-2">
            {sim.rows.map((r, i) => (
              <li
                key={r.s.id}
                className="flex items-center gap-2.5 rounded-xl bg-canvas-soft/70 px-3 py-2 motion-safe:animate-[kk-fade-in_.35s_ease-out_both]"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <span className="w-5 shrink-0 text-center tabular type-caption font-bold text-ink-mute">{r.result === "drop" ? "–" : i + 1}</span>
                <span className="min-w-0 flex-1">
                  <span className="block type-body-md font-semibold text-ink">{r.s.label}</span>
                  <span className="block type-caption text-ink-mute">{r.s.tag}</span>
                </span>
                <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold", RESULT[r.result].chip)}>{RESULT[r.result].label}</span>
              </li>
            ))}
          </ol>
          <p className="mt-3 rounded-xl bg-canvas-cream px-4 py-3 type-body-md font-semibold text-ink [word-break:keep-all]">
            다 쓴 문제 {sim.done}개 · 일부만 {sim.part}개 · {sim.drop ? `버린 문제 ${sim.drop}개` : `비운 문제 ${sim.blank}개`}
          </p>
        </div>
        <p className="mt-3 type-caption text-ink-mute [word-break:keep-all]">※ 큰 문제 5개·짧은 문제 5개는 후기 기준이고, 문제 순서와 걸리는 시간은 이해를 돕는 예시예요.</p>
      </div>

      <figure className="rounded-2xl border-2 border-brand-dark bg-canvas px-5 py-5">
        <Quote className="h-5 w-5 text-primary" strokeWidth={2.2} />
        <blockquote className="mt-2 type-heading-sm text-ink [word-break:keep-all]">“난이도가 문제가 아니라, 시간 안에 문제를 보게라도 해 줬으면.”</blockquote>
        <figcaption className="mt-2 flex items-center gap-2 type-caption text-ink-mute">
          <Src kind="review" /> 한 응시자
        </figcaption>
        <p className="mt-3 type-body-md text-ink-secondary ko-justify">다른 기관과 비교한 후기도 있어요. 거래소는 시간이 남았는데, 산은은 끝까지 빠듯했다고 해요.</p>
      </figure>

      <div className="rounded-2xl bg-canvas px-5 py-5 shadow-level-1">
        <div className="flex items-center justify-between gap-2">
          <p className="type-heading-sm text-ink">시계를 이기는 법</p>
          <span className="tabular type-caption font-semibold text-primary-text">
            {tips.size}/{TIPS.length}
          </span>
        </div>
        <ul className="mt-3 space-y-2">
          {TIPS.map((t, i) => {
            const on = tips.has(i);
            return (
              <li key={t}>
                <button
                  type="button"
                  onClick={() =>
                    setTips((s) => {
                      const n = new Set(s);
                      if (n.has(i)) n.delete(i);
                      else n.add(i);
                      return n;
                    })
                  }
                  aria-pressed={on}
                  className={cn("flex w-full items-start gap-3 rounded-xl border-2 px-3.5 py-3 text-left", anim, on ? "border-primary bg-ev-written-soft" : "border-hairline hover:border-brand-dark/40")}
                >
                  <span className={cn("mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2", on ? "border-primary bg-primary text-on-primary" : "border-ink/25")}>
                    {on && <Check className="h-3 w-3" strokeWidth={3} />}
                  </span>
                  <span className="type-body-md text-ink [word-break:keep-all]">{t}</span>
                </button>
              </li>
            );
          })}
        </ul>
        <p className="mt-3 type-body-md text-ink-secondary ko-justify">스와프 가치 같은 계산 문제는 과감히 버릴 걸 그랬다는 후회도 후기에 꽤 보여요.</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 4. 컷 — 40~50점대                                                    */
/* ------------------------------------------------------------------ */

/** 0~100 눈금, 40~50 구간 */
function CutRuler() {
  return (
    <div className="px-1 pt-7 pb-1">
      <div className="relative h-4 rounded-full bg-canvas-soft">
        <span className="absolute inset-y-0 rounded-full bg-[#ffb36b]" style={{ left: "40%", width: "10%" }} />
        <span className="absolute -top-7 -translate-x-1/2 rounded-md bg-brand-dark px-2 py-0.5 text-[11px] font-bold whitespace-nowrap text-on-primary" style={{ left: "45%" }}>
          40~50점대
        </span>
      </div>
      <div className="mt-1.5 flex justify-between tabular type-caption text-ink-mute">
        {[0, 25, 50, 75, 100].map((n) => (
          <span key={n}>{n}</span>
        ))}
      </div>
    </div>
  );
}

/** 컷 근처를 확대 — 0.5점·1.5점 차이 */
function CloseCall() {
  return (
    <div className="px-1 pt-2 pb-1">
      <div className="relative h-20">
        <span aria-hidden className="absolute inset-x-0 top-10 h-px bg-ink/25" />
        {/* 컷 */}
        <span className="absolute top-3 bottom-3 w-0.5 bg-ev-doc" style={{ left: "70%" }} />
        <span className="absolute top-0 -translate-x-1/2 type-caption font-bold text-ev-doc" style={{ left: "70%" }}>
          컷
        </span>
        {[
          { at: 55, t: "1.5점 차이" },
          { at: 65, t: "0.5점 차이" },
        ].map((m) => (
          <span key={m.at} className="absolute top-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center" style={{ left: `${m.at}%` }}>
            <span className="h-3.5 w-3.5 rounded-full border-2 border-canvas bg-brand-dark shadow-level-1" />
            <span className="mt-1 type-caption font-semibold whitespace-nowrap text-ink-secondary">{m.t}</span>
          </span>
        ))}
        <span className="absolute top-12 right-0 type-caption text-ink-mute">합격 →</span>
      </div>
    </div>
  );
}

const CUT_VIEWS = [
  {
    key: "band",
    label: "도는 컷",
    title: "준비생들 사이에 도는 산은 필기 컷은 40~50점대예요",
    visual: <CutRuler />,
    facts: [
      { kind: "review" as Kind, text: "40~50점대라는 말이 오래 돌아서 ‘반토막 컷’이라고들 해요." },
      { kind: "review" as Kind, text: "컷이 낮으니 끝까지 버티라는 조언도 많아요." },
    ],
  },
  {
    key: "close",
    label: "아슬아슬",
    title: "0.5점 차이로 갈리기도 해요",
    visual: <CloseCall />,
    facts: [
      { kind: "review" as Kind, text: "발표 날 결과 화면에서 본인 점수와 컷을 봤다는 후기가 여럿 있었어요." },
      { kind: "review" as Kind, text: "0.5점, 1.5점 차이로 떨어졌다는 후기도 드물지 않아요." },
    ],
  },
  {
    key: "carry",
    label: "면접까지",
    title: "턱걸이보다 여유 있게 붙는 게 나아요",
    visual: (
      <div className="flex h-11 gap-0.5 overflow-hidden rounded-xl type-caption font-bold">
        <span className="flex items-center justify-center bg-brand-dark text-on-primary" style={{ width: "70%" }}>
          면접 70%
        </span>
        <span className="flex items-center justify-center bg-[#ffb36b] text-ink" style={{ width: "30%" }}>
          필기 30%
        </span>
      </div>
    ),
    facts: [
      { kind: "notice" as Kind, text: "필기 점수는 1차 면접 점수에 30% 들어가요." },
      { kind: "review" as Kind, text: "그래서 턱걸이보다 여유 있게 붙는 게 낫다는 합격자들 얘기가 괜히 나온 게 아니에요." },
    ],
  },
];

function Cut() {
  const [sel, setSel] = useState(0);
  const v = CUT_VIEWS[sel];
  return (
    <div className="space-y-5">
      <TryHint>탭을 눌러 보세요</TryHint>
      <div className="rounded-3xl bg-canvas p-4 shadow-level-2 sm:p-5">
        <div role="tablist" aria-label="컷 이야기" className="grid grid-cols-3 gap-1.5 rounded-xl bg-canvas-soft p-1">
          {CUT_VIEWS.map((x, i) => (
            <button
              key={x.key}
              type="button"
              role="tab"
              aria-selected={sel === i}
              onClick={() => setSel(i)}
              className={cn("rounded-lg px-2 py-2 type-body-md font-semibold", anim, sel === i ? "bg-canvas text-ink shadow-level-1" : "text-ink-secondary hover:text-ink")}
            >
              {x.label}
            </button>
          ))}
        </div>
        <div key={v.key} className="mt-5 motion-safe:animate-[kk-fade-in_.3s_ease-out]">
          {v.visual}
        </div>
      </div>
      <Explain title={v.title}>
        <div className="mt-1 space-y-2.5">
          {v.facts.map((f) => (
            <Fact key={f.text} kind={f.kind}>
              {f.text}
            </Fact>
          ))}
        </div>
      </Explain>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 5. NCS와 논술                                                         */
/* ------------------------------------------------------------------ */

const PARTS = [
  { key: "major", name: "직무지식", sub: "경영학" },
  { key: "essay", name: "논리적 사고력", sub: "일반시사논술" },
  { key: "ncs", name: "직업공통능력", sub: "NCS" },
];

function NcsAreas() {
  const [prev, setPrev] = useState(false);
  const areas = ["의사소통", "수리", "문제해결", prev ? "정보" : "디지털"];
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="type-caption font-semibold text-ink-secondary">NCS 출제 영역</p>
        <div className="inline-flex rounded-full bg-canvas-soft p-0.5 type-caption font-semibold">
          {[
            { on: !prev, t: "이번 공고", v: false },
            { on: prev, t: "직전 공고", v: true },
          ].map((x) => (
            <button key={x.t} type="button" onClick={() => setPrev(x.v)} aria-pressed={x.on} className={cn("rounded-full px-3 py-1", anim, x.on ? "bg-brand-dark text-on-primary" : "text-ink-secondary")}>
              {x.t}
            </button>
          ))}
        </div>
      </div>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {areas.map((x, i) => (
          <li
            key={x}
            className={cn(
              "flex h-14 items-center justify-center rounded-xl border-2 type-body-md font-bold motion-safe:animate-[kk-fade-in_.3s_ease-out]",
              i === 3 ? "border-[#ffb36b] bg-[#fff1e0] text-ink" : "border-primary/40 bg-ev-written-soft text-ink",
            )}
          >
            {x}
          </li>
        ))}
      </ul>
      <Fact kind="notice">직전 공고에선 ‘정보능력’이던 자리가 이번엔 ‘디지털’로 바뀌었어요. 디지털 영역에 어떤 문제가 나올지는 공고에 설명이 없어요.</Fact>
    </div>
  );
}

function ThreeParts() {
  const [sel, setSel] = useState(2);
  return (
    <div className="space-y-5">
      <TryHint>덩어리를 눌러 보세요</TryHint>
      <div className="rounded-3xl bg-canvas p-4 shadow-level-2 sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <p className="type-caption font-semibold text-ink-secondary">산은 필기 =</p>
          <Src kind="notice" />
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {PARTS.map((x, i) => (
            <button
              key={x.key}
              type="button"
              onClick={() => setSel(i)}
              aria-pressed={sel === i}
              className={cn(
                "flex min-h-24 flex-col items-center justify-center gap-1 rounded-2xl border-2 px-1.5 py-3 text-center",
                anim,
                sel === i ? "border-brand-dark bg-brand-dark text-on-primary shadow-level-2" : "border-hairline bg-canvas text-ink hover:border-brand-dark/40",
              )}
            >
              <span className="type-body-md font-bold [word-break:keep-all]">{x.name}</span>
              <span className={cn("type-caption [word-break:keep-all]", sel === i ? "text-on-primary/80" : "text-ink-mute")}>{x.sub}</span>
            </button>
          ))}
        </div>
      </div>

      <div key={sel} className="rounded-2xl bg-canvas px-5 py-5 shadow-level-1 motion-safe:animate-[kk-fade-in_.3s_ease-out]" aria-live="polite">
        {sel === 0 && (
          <div className="space-y-2.5">
            <p className="type-heading-md text-ink">직무지식 · 경영학</p>
            <Fact kind="notice">경영학 또는 경제학 중 하나를 골라 봐요.</Fact>
            <p className="type-body-md text-ink-secondary ko-justify">앞에서 본 범위(재무관리·재무회계 중심)와 시간 싸움이 바로 이 시험 이야기예요.</p>
          </div>
        )}
        {sel === 1 && (
          <div className="space-y-4">
            <p className="type-heading-md text-ink">논리적 사고력 · 일반시사논술</p>
            <div>
              <div className="flex items-center gap-2">
                <Src kind="review" />
                <p className="type-caption font-semibold text-ink-secondary">의견이 갈려요</p>
              </div>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <p className="rounded-2xl rounded-bl-sm bg-canvas-soft px-3.5 py-2.5 type-body-md text-ink [word-break:keep-all]">“어차피 대비가 안 된다”</p>
                <p className="rounded-2xl rounded-bl-sm bg-canvas-soft px-3.5 py-2.5 type-body-md text-ink [word-break:keep-all]">“뭐라도 쓰면 점수를 주는 것 같다”</p>
              </div>
            </div>
            <div className="rounded-xl bg-[#f0faf4] px-4 py-3.5">
              <div className="flex items-center gap-2">
                <Src kind="kong" />
                <p className="type-body-md font-semibold text-ink">비우지만 말고, 구조만 잡아서 채우세요</p>
              </div>
              <ol className="mt-3 flex items-center gap-1.5">
                {["주장", "근거", "결론"].map((t, i) => (
                  <li key={t} className="flex flex-1 items-center gap-1.5">
                    <span className="flex h-11 flex-1 items-center justify-center rounded-lg bg-canvas type-body-md font-bold text-ink shadow-level-1">{t}</span>
                    {i < 2 && <ArrowRight aria-hidden className="h-4 w-4 shrink-0 text-ink-mute" strokeWidth={2} />}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}
        {sel === 2 && (
          <div className="space-y-4">
            <p className="type-heading-md text-ink">직업공통능력 · NCS</p>
            <NcsAreas />
            <Fact kind="review">NCS가 만만하지 않다는 후기도 많아요. NCS를 꽤 잘하는 응시자도 많이 못 풀었다는 얘기가 나올 정도였어요.</Fact>
          </div>
        )}
      </div>

      <div className="flex items-start gap-3 rounded-2xl border border-hairline bg-canvas px-5 py-4">
        <Scale className="mt-0.5 h-5 w-5 shrink-0 text-primary" strokeWidth={2} />
        <div className="space-y-1">
          <p className="type-body-md font-semibold text-ink">배점은 공고에도 FAQ에도 없어요</p>
          <p className="type-body-md text-ink-secondary ko-justify">과목별 비중을 숫자로 단정하는 글이 있다면 걸러 들으셔도 돼요.</p>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 6. 객관식만으로 될까? — 두 쪽 주장 + 계단식 실력                          */
/* ------------------------------------------------------------------ */

const SIDES = [
  {
    key: "book",
    label: "연습서까지 봐야 한다",
    points: ["산은부터는 연습서(서술형 문제집) 예제까진 봐야 한다는 쪽이에요.", "‘할 사람은 다 하더라’는 반론도 함께 있어요."],
  },
  {
    key: "mcq",
    label: "객관식으로도 된다",
    points: ["객관식 위주로 공부해서 산은을 포함해 여러 곳 필기를 붙었다는 합격자 후기가 있어요.", "고급회계를 버리고 필기를 통과했다는 후기도 있어요."],
  },
];

/** 생각하는 실력 곡선(직선) vs 합격자가 말한 실력 곡선(계단) — 눈금 숫자 없는 그림 */
function StairChart({ real }: { real: boolean }) {
  return (
    <svg viewBox="0 0 320 150" className="mx-auto h-auto w-full max-w-[440px]" role="img" aria-label={real ? "오랫동안 제자리 같다가 한 번에 오르는 계단 모양 곡선" : "공부한 만큼 고르게 오르는 직선"}>
      <line x1="28" y1="126" x2="306" y2="126" stroke="currentColor" strokeOpacity="0.25" strokeWidth="1.5" />
      <line x1="28" y1="14" x2="28" y2="126" stroke="currentColor" strokeOpacity="0.25" strokeWidth="1.5" />
      <text x="306" y="144" textAnchor="end" fontSize="11" fill="currentColor" fillOpacity="0.55">
        공부한 시간 →
      </text>
      <text x="32" y="12" fontSize="11" fill="currentColor" fillOpacity="0.55">
        ↑ 실력
      </text>
      <path d="M30 122 L300 30" fill="none" stroke="#9aa0c8" strokeWidth="2.5" strokeDasharray="5 5" opacity={real ? 0.45 : 1} className="transition-opacity duration-300" />
      <path
        d="M30 122 C90 120 150 118 196 114 L210 52 C240 48 270 46 300 44"
        fill="none"
        stroke="#533afd"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={real ? 1 : 0}
        className="transition-opacity duration-500"
      />
      {real && (
        <text x="224" y="74" fontSize="11" fontWeight="700" fill="#533afd">
          어느 순간 한 번에!
        </text>
      )}
    </svg>
  );
}

function Debate() {
  const [side, setSide] = useState<number | null>(null);
  const [real, setReal] = useState(false);
  return (
    <div className="space-y-5">
      <TryHint>한쪽을 눌러 보세요</TryHint>
      <div className="relative grid grid-cols-2 gap-2.5">
        {SIDES.map((x, i) => (
          <button
            key={x.key}
            type="button"
            onClick={() => setSide(i)}
            aria-pressed={side === i}
            className={cn(
              "flex min-h-24 items-center justify-center rounded-2xl border-2 px-3 py-4 text-center type-body-md font-bold [word-break:keep-all]",
              anim,
              side === i ? "border-brand-dark bg-brand-dark text-on-primary shadow-level-2" : side == null ? "border-hairline bg-canvas text-ink hover:border-brand-dark/40" : "border-hairline bg-canvas-soft text-ink-mute",
            )}
          >
            {x.label}
          </button>
        ))}
        <span aria-hidden className="absolute top-1/2 left-1/2 inline-flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-canvas bg-[#ffb36b] type-caption font-black text-ink">
          VS
        </span>
      </div>
      {side != null && (
        <div key={side} className="space-y-2.5 rounded-2xl bg-canvas px-5 py-5 shadow-level-1 motion-safe:animate-[kk-fade-in_.3s_ease-out]" aria-live="polite">
          <p className="type-heading-md text-ink">{SIDES[side].label}</p>
          {SIDES[side].points.map((t) => (
            <Fact key={t} kind="review">
              {t}
            </Fact>
          ))}
        </div>
      )}
      <div className="rounded-xl bg-[#f0faf4] px-5 py-4">
        <div className="flex items-center gap-2">
          <Src kind="kong" />
          <p className="type-body-md font-semibold text-ink">교재보다 시간 관리가 더 큰 변수예요</p>
        </div>
        <p className="mt-2 type-body-md text-ink-secondary ko-justify">연습서를 여러 번 보고도 떨어졌다는 후기가 적지 않거든요. 어떤 교재를 쓰든, 손으로 풀이를 써 보는 연습은 꼭 해 두세요.</p>
      </div>

      <div className="rounded-3xl bg-canvas p-4 shadow-level-2 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="flex items-center gap-1.5 type-heading-sm text-ink">
            <TrendingUp className="h-4 w-4 text-primary" strokeWidth={2.2} />
            실력은 계단식으로 늘어요
          </p>
          <button type="button" onClick={() => setReal((v) => !v)} aria-pressed={real} className={cn("rounded-full px-3 py-1.5 type-caption font-semibold", anim, real ? "bg-primary text-on-primary" : "bg-brand-dark text-on-primary")}>
            {real ? "다시 보기" : "합격자 말대로 그려 보기"}
          </button>
        </div>
        <div className="mt-3 text-ink">
          <StairChart real={real} />
        </div>
        <Fact kind="review">한 합격자는 1년 넘게 제자리 같다가, 어느 순간 한 번에 오른다고 했어요.</Fact>
      </div>

      <p className="type-body-md text-ink-secondary ko-justify">
        시험 직후 기억으로 문제를 되살린 ‘복기’ 자료를 나누는 문화도 있어요. 다만 처음 준비하는 사람은 구하기 어렵다는 게 함정이에요. 금콩{" "}
        <Link href={REVIEW_HREF} className="link">
          산은 필기 후기
        </Link>
        에는 누구나 체감 난이도를 남기고 볼 수 있어요.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 7. 시험 당일 체크리스트                                                 */
/* ------------------------------------------------------------------ */

const DAY: { key: string; title: string; text: string; kind?: Kind }[] = [
  { key: "calc", title: "계산기", text: "공고와 FAQ엔 반입 규정이 없어요. 수험표 안내를 따르세요.", kind: "notice" },
  { key: "absent", title: "결시", text: "거의 없다는 후기가 많아요. 빈자리 기대는 접어 두세요.", kind: "review" },
  { key: "order", title: "순서", text: "상반기엔 전공 → NCS → 논술 순이었고, 오후 1시쯤 끝났다는 후기가 있어요.", kind: "review" },
  { key: "result", title: "결과", text: "문자를 기다리지 말고 채용 홈페이지에서 직접 확인하세요. 필기 합격자는 온라인 인성검사가 이어져요." },
];

function DayChecklist() {
  const [on, setOn] = useState<Set<string>>(new Set());
  const all = on.size === DAY.length;
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <TryHint>챙긴 것을 눌러 체크하세요</TryHint>
        <span className="tabular type-caption font-semibold text-primary-text">
          {on.size}/{DAY.length} 챙김
        </span>
      </div>
      <ul className="grid gap-2.5 sm:grid-cols-2">
        {DAY.map((d) => {
          const checked = on.has(d.key);
          return (
            <li key={d.key}>
              <button
                type="button"
                onClick={() =>
                  setOn((s) => {
                    const n = new Set(s);
                    if (n.has(d.key)) n.delete(d.key);
                    else n.add(d.key);
                    return n;
                  })
                }
                aria-pressed={checked}
                className={cn("flex h-full w-full items-start gap-3 rounded-2xl border-2 bg-canvas px-4 py-4 text-left", anim, checked ? "border-primary shadow-level-1" : "border-hairline hover:border-brand-dark/40")}
              >
                <span className={cn("mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2", anim, checked ? "border-primary bg-primary text-on-primary" : "border-ink/25")}>
                  {checked && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className={cn("type-heading-sm", checked ? "text-ink-mute line-through" : "text-ink")}>{d.title}</span>
                    {d.kind && <Src kind={d.kind} />}
                  </span>
                  <span className="mt-1 block type-body-md text-ink-secondary ko-justify">{d.text}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <div className="rounded-2xl bg-canvas px-5 py-4 shadow-level-1">
        <div className="flex items-center gap-2">
          <Src kind="review" />
          <p className="type-caption font-semibold text-ink-secondary">상반기 시험 순서</p>
        </div>
        <ol className="mt-3 flex items-center gap-1.5">
          {["전공", "NCS", "논술"].map((t, i) => (
            <li key={t} className="flex flex-1 items-center gap-1.5">
              <span className="flex h-11 flex-1 items-center justify-center rounded-lg bg-ev-written-soft type-body-md font-bold text-ink">{t}</span>
              <ArrowRight aria-hidden className="h-4 w-4 shrink-0 text-ink-mute" strokeWidth={2} />
              {i === 2 && <span className="shrink-0 type-caption font-semibold whitespace-nowrap text-ink-secondary">오후 1시쯤 끝</span>}
            </li>
          ))}
        </ol>
      </div>
      {all && (
        <div className="motion-safe:animate-[kk-fade-in_.35s_ease-out]">
          <KongSays look="suit">준비 끝! 10월 24일, 시계부터 이기고 와요.</KongSays>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 8. 정리                                                              */
/* ------------------------------------------------------------------ */

const SUMMARY = [
  "경영학 범위는 재무관리·재무회계가 중심이에요. 고급회계는 나왔다는 후기가 있고, 원가는 안 나온다는 게 중론이에요.",
  "적은 문제가 아니라 시간이에요. 시작하자마자 훑고, 버릴 문제부터 정하세요.",
  "필기 점수는 1차 면접에 30% 들어가요. 턱걸이보다 여유 있게 붙는 게 유리해요.",
];

function Wrap() {
  return (
    <div className="space-y-6">
      <ol className="space-y-2">
        {SUMMARY.map((t, i) => (
          <li key={t} className="flex gap-3 rounded-xl bg-canvas px-4 py-3.5 shadow-level-1">
            <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-dark tabular type-caption font-bold text-on-primary">{i + 1}</span>
            <span className="type-body-md text-ink ko-justify">{t}</span>
          </li>
        ))}
      </ol>

      <Link href={REVIEW_HREF} className="group flex items-center gap-4 rounded-2xl bg-brand-dark px-5 py-5 text-on-primary shadow-level-2">
        <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-on-primary text-brand-dark">
          <PenLine className="h-5 w-5" strokeWidth={2} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block type-heading-sm [word-break:keep-all]">시험이 끝나면, 산은 필기 후기에 체감 난이도를 남겨 주세요</span>
          <span className="mt-0.5 block type-caption text-on-primary/75 [word-break:keep-all]">모인 후기로 이 글의 범위·시간·컷 부분을 업데이트할게요.</span>
        </span>
        <ArrowRight className="h-5 w-5 shrink-0 transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
      </Link>

      <p className="type-body-md text-ink-secondary">다음 편은 한국거래소 경영 필기예요.</p>

      <div className="border-t border-hairline pt-4 type-caption text-ink-mute [word-break:keep-all]">
        <p>공고로 확인한 내용과 준비생 후기를 구분해 썼어요.</p>
        <p className="mt-1">
          출처:{" "}
          <a href={NOTICE_URL} target="_blank" rel="noopener noreferrer" className="link">
            한국산업은행 2027년 5급 신입행원(일반) 채용공고 · 잡알리오
          </a>{" "}
          · 공고 확인일 2026-10-15
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 전체                                                                  */
/* ------------------------------------------------------------------ */

const CHAPTERS: GuideChapter[] = [
  {
    short: "숫자",
    title: "올해 산은 필기, 숫자부터 볼까요",
    lead: "이번 공고 이름은 ‘2027년 5급 신입행원(일반) 채용’이에요. 연도가 2027이라 헷갈리지만, 지금 하반기에 치르는 시험이 맞아요.",
    kong: "인원보다 무서운 건 배수(최종 인원의 몇 배를 통과시키느냐)예요!",
    bg: "bg-[#f3f6ff]",
    body: <Funnel />,
  },
  {
    short: "범위",
    title: "공고엔 ‘경영학’ 세 글자, 실제 범위는?",
    lead: "공고 과목란엔 “경영학”이라고만 적혀 있어요. 그래서 매 시즌 같은 질문이 돌아요.",
    kong: "FAQ와 후기를 겹쳐 보면 그림이 선명해져요.",
    look: "book",
    bg: "bg-[#fffaf3]",
    body: <Scope />,
  },
  {
    short: "시간",
    title: "적은 문제가 아니라 시계예요",
    lead: "산은 필기 후기에서 가장 한결같은 말은 “시간이 없다”예요.",
    kong: "다 풀려고 하다 다 못 쓰는 게 제일 아까워요.",
    look: "sweat",
    bg: "bg-[#f3f6ff]",
    body: <Clock />,
  },
  {
    short: "컷",
    title: "‘반토막 컷’이라던데, 진짜예요?",
    lead: "준비생들 사이에 오래 돈 말이 있어요. 후기로 하나씩 볼게요.",
    kong: "컷이 낮은 편이니, 막혀도 끝까지 버티세요!",
    bg: "bg-[#fff6ec]",
    body: <Cut />,
  },
  {
    short: "NCS·논술",
    title: "NCS와 논술, 버려도 될까요?",
    lead: "공고상 필기는 세 덩어리예요. 직무지식(경영학), 논리적 사고력(일반시사논술), 직업공통능력(NCS)이에요.",
    bg: "bg-[#f2fbf5]",
    body: <ThreeParts />,
  },
  {
    short: "공부법",
    title: "객관식만으로 될까? 오래된 논쟁",
    lead: "산은 준비생들이 가장 오래 다투는 주제예요. 양쪽 다 실제 후기가 있어요.",
    look: "book",
    bg: "bg-[#f6f4ff]",
    body: <Debate />,
  },
  {
    short: "시험 당일",
    title: "시험 당일, 이것만 챙기세요",
    bg: "bg-[#fffaf3]",
    body: <DayChecklist />,
  },
  {
    short: "정리",
    title: "바쁘면 이것만",
    lead: "오늘 본 내용을 세 줄로 정리했어요.",
    kong: "10월 24일, 응원할게요!",
    look: "suit",
    bg: "bg-[#f2fbf5]",
    body: <Wrap />,
  },
];

export function KdbWrittenGuide({ title }: { title: string }) {
  return (
    <GuideShell
      chapters={CHAPTERS}
      eyebrow="금콩 인터랙티브 · 산은 필기"
      heading={title}
      sub="10월 24일 산은 경영 필기, 범위·시간·컷을 공고와 후기로 나눠 한 장씩 정리했어요."
      mascot={<KongMascot hold="pencil" sweat className="h-24 w-24 shrink-0 md:h-32 md:w-32" />}
      tabsLabel="산은 필기 가이드 목차"
      cover={<Hook />}
      coverClass="from-[#e6edff]"
    />
  );
}
