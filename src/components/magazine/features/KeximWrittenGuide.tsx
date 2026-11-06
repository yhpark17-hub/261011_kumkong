"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { ArrowRight, Check, PenLine, Quote, RotateCcw, X } from "lucide-react";
import { cn } from "../../ui";
import { KongMascot } from "../KongMascot";
import { GuideShell, TryHint, anim, useGuideGo, type GuideChapter } from "./GuideShell";

/**
 * 기관별 필기 완전정리 #2 — 수은(한국수출입은행) 경영 필기를 '두 번 보는 구조'를 축으로
 * 숫자 → 구조 → 1차(NCS) → 2차(전공) → 같은 날 → 어학·우대 → 공부법 → 당일 → 정리.
 * 숫자·일정은 2026-11-06에 2026년 하반기·상반기 공고문, 채용 사이트 FAQ, 직무설명서를 열어 확인한 것만 써요.
 * 후기는 2026년 상반기 시험 기준이고, 닉네임 없이 [중론]·[카더라] 꼬리표를 붙여요. 수은의 공식 설명이 아니에요.
 */

const NOTICE_URL =
  "https://raspfiles2.incruit.com/koreaexim/data/115/SuccessData/addFile/2026%EB%85%84%20%ED%95%98%EB%B0%98%EA%B8%B0%20%EC%A0%84%EB%AC%B8%EC%A7%81%ED%96%89%EC%9B%90%28%EC%8B%A0%EC%9E%85%29%20%EC%B1%84%EC%9A%A9%20%EA%B3%B5%EA%B3%A0%EB%AC%B8.pdf";
const REVIEW_1 = "/reviews/kexim-2026-10-24";
const REVIEW_2 = "/reviews/kexim-2026-11-07";
const KDB_HREF = "/magazine/6";

/* ------------------------------------------------------------------ */
/* 공통 — 꼬리표 · 1차/2차 표시                                           */
/* ------------------------------------------------------------------ */

type Kind = "notice" | "talk" | "rumor" | "news" | "vote" | "kong";

const KIND: Record<Kind, { label: string; cls: string }> = {
  notice: { label: "공고", cls: "bg-ev-written-soft text-primary-text" },
  talk: { label: "중론", cls: "bg-[#fff1e0] text-[#9a4a0b]" },
  rumor: { label: "카더라", cls: "bg-[#fde8ef] text-[#a3164a]" },
  news: { label: "기사", cls: "bg-[#e3ecff] text-[#1d4f9a]" },
  vote: { label: "금콩 후기", cls: "bg-[#e3f3f8] text-[#0f6a80]" },
  kong: { label: "금콩 생각", cls: "bg-[#e3f5ea] text-[#1d6e43]" },
};

function Src({ kind }: { kind: Kind }) {
  return <span className={cn("inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] leading-4 font-bold whitespace-nowrap", KIND[kind].cls)}>{KIND[kind].label}</span>;
}

function Fact({ kind, children }: { kind: Kind; children: ReactNode }) {
  return (
    <p className="flex items-start gap-2">
      <span className="mt-[3px]">
        <Src kind={kind} />
      </span>
      <span className="min-w-0 flex-1 type-body-md text-ink ko-justify">{children}</span>
    </p>
  );
}

/** 1차는 보라, 2차는 주황 — 글 전체에서 같은 색 (썸네일 시험지와도 같아요) */
function Round({ n }: { n: 1 | 2 }) {
  return <span className={cn("inline-flex shrink-0 items-center rounded-md px-1.5 py-0.5 text-[11px] leading-4 font-bold whitespace-nowrap text-on-primary", n === 1 ? "bg-primary" : "bg-[#c2570c]")}>{n}차</span>;
}

function Card({ title, kind, children, className }: { title?: ReactNode; kind?: Kind; children: ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-2xl bg-canvas px-5 py-5 shadow-level-1", className)}>
      {title && (
        <div className="mb-3 flex items-start justify-between gap-2">
          <p className="type-heading-sm text-ink [word-break:keep-all]">{title}</p>
          {kind && <Src kind={kind} />}
        </div>
      )}
      {children}
    </div>
  );
}

function Tabs<T extends string>({ items, value, onChange, label }: { items: { key: T; label: string }[]; value: T; onChange: (v: T) => void; label: string }) {
  return (
    <div role="tablist" aria-label={label} className="flex flex-wrap gap-1.5 rounded-xl bg-canvas-soft p-1">
      {items.map((x) => (
        <button
          key={x.key}
          type="button"
          role="tab"
          aria-selected={value === x.key}
          onClick={() => onChange(x.key)}
          className={cn("min-w-0 flex-1 rounded-lg px-2 py-2 type-body-md font-semibold [word-break:keep-all]", anim, value === x.key ? "bg-canvas text-ink shadow-level-1" : "text-ink-secondary hover:text-ink")}
        >
          {x.label}
        </button>
      ))}
    </div>
  );
}

/** 표지 아래 — 서류 없이 시험 두 번, 내 상황으로 바로 가기 */
function Hook() {
  const go = useGuideGo();
  return (
    <div className="space-y-4 rounded-3xl bg-canvas/85 p-4 shadow-level-1 backdrop-blur sm:p-5">
      <div>
        <p className="type-heading-sm text-ink">서류는 없어요. 대신 시험이 두 번이에요.</p>
        <ol className="mt-3 flex items-stretch gap-1.5">
          <li className="flex min-w-0 flex-[0.8] flex-col items-center justify-center rounded-xl border-2 border-dashed border-ink/20 px-1.5 py-2.5 text-center">
            <X className="h-4 w-4 text-ev-doc" strokeWidth={3} />
            <span className="mt-0.5 type-body-md font-bold text-ink-mute line-through">서류</span>
          </li>
          <li className="flex shrink-0 items-center">
            <ArrowRight aria-hidden className="h-4 w-4 text-ink-mute" strokeWidth={2.2} />
          </li>
          <li className="flex min-w-0 flex-1 flex-col items-center justify-center rounded-xl border-2 border-primary bg-ev-written-soft px-1.5 py-2.5 text-center">
            <Round n={1} />
            <span className="mt-1 type-body-md font-bold text-ink">NCS</span>
            <span className="type-caption text-ink-secondary [word-break:keep-all]">+ 어학·자격증</span>
          </li>
          <li className="flex shrink-0 items-center">
            <ArrowRight aria-hidden className="h-4 w-4 text-ink-mute" strokeWidth={2.2} />
          </li>
          <li className="flex min-w-0 flex-1 flex-col items-center justify-center rounded-xl border-2 border-[#c2570c] bg-[#fff1e0] px-1.5 py-2.5 text-center">
            <Round n={2} />
            <span className="mt-1 type-body-md font-bold text-ink">전공</span>
            <span className="type-caption text-ink-secondary">+ 논술</span>
          </li>
        </ol>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <button type="button" onClick={() => go(3, true)} className={cn("flex items-center justify-between gap-3 rounded-xl bg-brand-dark px-4 py-3 text-left text-on-primary", anim, "hover:shadow-level-2")}>
          <span>
            <span className="block type-caption text-on-primary/75">11월 7일 2차를 본다면</span>
            <span className="block type-body-md font-bold">2차(전공) 장으로 바로 가기</span>
          </span>
          <ArrowRight className="h-5 w-5 shrink-0" strokeWidth={2.2} />
        </button>
        <button type="button" onClick={() => go(1, true)} className={cn("flex items-center justify-between gap-3 rounded-xl border-2 border-brand-dark/25 bg-canvas px-4 py-3 text-left text-ink", anim, "hover:border-brand-dark")}>
          <span>
            <span className="block type-caption text-ink-mute">다음에 수은을 쓸 거라면</span>
            <span className="block type-body-md font-bold">구조부터 보기</span>
          </span>
          <ArrowRight className="h-5 w-5 shrink-0" strokeWidth={2.2} />
        </button>
      </div>
      <div className="border-t border-hairline pt-3">
        <ul className="flex flex-wrap gap-x-3 gap-y-1.5">
          <li className="flex items-center gap-1.5 type-caption text-ink-secondary">
            <Src kind="notice" /> 공고문·FAQ·직무설명서
          </li>
          <li className="flex items-center gap-1.5 type-caption text-ink-secondary">
            <Src kind="talk" /> 여러 응시자의 같은 말
          </li>
          <li className="flex items-center gap-1.5 type-caption text-ink-secondary">
            <Src kind="rumor" /> 한두 명의 말
          </li>
        </ul>
        <p className="mt-2 type-caption text-ink-mute [word-break:keep-all]">수은은 산은보다 후기가 적어요. 그래서 공고 비중을 높였고, 후기는 대부분 올해 상반기 시험 얘기예요.</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 1. 숫자 — 경영 26명, 그런데 배수가 줄었어요                               */
/* ------------------------------------------------------------------ */

type HalfKey = "h2" | "h1";

const HALVES: Record<
  HalfKey,
  {
    total: number;
    sum: number;
    seats: { name: string; n: number; cls: string }[];
    read: string;
    steps: { label: string; mult: string; n: number; text: string }[];
  }
> = {
  h2: {
    total: 68,
    sum: 26,
    seats: [
      { name: "일반", n: 15, cls: "bg-brand-dark" },
      { name: "EDCF", n: 5, cls: "bg-primary" },
      { name: "지역전문가", n: 5, cls: "bg-[#ffb36b]" },
      { name: "보훈", n: 1, cls: "bg-[#6fcf97]" },
    ],
    read: "일반 경영은 15명 그대로예요. 늘어난 6명은 EDCF 5명과 지역전문가 1명이에요.",
    steps: [
      { label: "1차 필기 합격", mult: "12배수", n: 180, text: "180명" },
      { label: "2차 필기 합격", mult: "3배수", n: 45, text: "45명" },
      { label: "1차 면접 합격", mult: "1.5배수", n: 22.5, text: "약 23명" },
      { label: "최종 합격", mult: "채용 인원", n: 15, text: "15명" },
    ],
  },
  h1: {
    total: 50,
    sum: 20,
    seats: [
      { name: "일반", n: 15, cls: "bg-brand-dark" },
      { name: "지역전문가", n: 4, cls: "bg-[#ffb36b]" },
      { name: "보훈", n: 1, cls: "bg-[#6fcf97]" },
    ],
    read: "상반기엔 EDCF 부문이 따로 없었어요. 총 50명 중 경영은 20명이었어요.",
    steps: [
      { label: "1차 필기 합격", mult: "15배수", n: 225, text: "225명" },
      { label: "2차 필기 합격", mult: "4배수", n: 60, text: "60명" },
      { label: "1차 면접 합격", mult: "1.5배수", n: 22.5, text: "약 23명" },
      { label: "최종 합격", mult: "채용 인원", n: 15, text: "15명" },
    ],
  },
};

const ROAD: { when: string; what: string; round?: 1 | 2; now?: boolean }[] = [
  { when: "10.2~10.19", what: "접수" },
  { when: "10.24(토)", what: "1차 필기", round: 1 },
  { when: "10.29(목)", what: "1차 합격 발표", round: 1 },
  { when: "11.7(토)", what: "2차 필기", round: 2, now: true },
  { when: "11.18(수)", what: "2차 합격 발표", round: 2 },
  { when: "11.28(토)", what: "영어활용능력평가(TOEIC S&W)" },
  { when: "11월 말~12월 초", what: "1차 면접" },
  { when: "12월 중하순", what: "2차 면접" },
];

const TRACKS = [
  {
    key: "edcf",
    label: "EDCF",
    lines: ["대외경제협력기금(개발도상국을 돕는 정부 기금) 부문이에요.", "필기·면접 모두 일반 부문과 따로 전형해요.", "팀장급이 되기 전에 사업국 사무소나 주재원으로 한 번 이상 나가는 게 원칙이에요."],
  },
  {
    key: "region",
    label: "지역전문가",
    lines: ["수도권 밖 최종학교 졸업(예정)자와 재학·휴학생이 대상이에요.", "경상권, 충청·호남권 중 근무권역을 골라 지원해요.", "G2 승진 전 6년 이상, 관리자가 되기 전 총 8년 근무가 원칙이에요."],
  },
  {
    key: "vet",
    label: "보훈",
    lines: ["서울지방보훈청에서 추천코드를 받은 사람만 지원할 수 있어요."],
  },
] as const;

function Numbers() {
  const [half, setHalf] = useState<HalfKey>("h2");
  const [track, setTrack] = useState<(typeof TRACKS)[number]["key"]>("edcf");
  const h = HALVES[half];
  const t = TRACKS.find((x) => x.key === track) ?? TRACKS[0];
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-2.5">
        <div className="rounded-2xl bg-canvas px-4 py-3.5 shadow-level-1">
          <p className="type-caption text-ink-mute">경영 채용</p>
          <p className="mt-0.5 type-heading-md font-bold text-ink tabular">26명</p>
          <p className="mt-0.5 type-caption text-ink-secondary [word-break:keep-all]">상반기 20명보다 6명 많아요</p>
        </div>
        <div className="rounded-2xl bg-canvas px-4 py-3.5 shadow-level-1">
          <p className="type-caption text-ink-mute">2차 필기</p>
          <p className="mt-0.5 type-heading-md font-bold text-ink tabular">11.7(토)</p>
          <p className="mt-0.5 type-caption text-ink-secondary [word-break:keep-all]">합격 발표 11.18(수) 예정</p>
        </div>
      </div>

      <TryHint>공고를 바꿔 보세요</TryHint>
      <div className="rounded-3xl bg-canvas p-4 shadow-level-2 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Tabs
            label="공고 고르기"
            value={half}
            onChange={setHalf}
            items={[
              { key: "h2", label: "이번 하반기" },
              { key: "h1", label: "올해 상반기" },
            ]}
          />
          <Src kind="notice" />
        </div>

        <p className="mt-4 type-caption font-semibold text-ink-secondary">경영 {h.sum}명은 어디에 있을까요?</p>
        <div className="mt-1.5 flex h-7 gap-0.5 overflow-hidden rounded-lg bg-canvas-soft">
          {h.seats.map((s) => (
            <span key={s.name} className={cn("h-full", anim, s.cls)} style={{ width: `${(s.n / 26) * 100}%` }} />
          ))}
        </div>
        <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
          {h.seats.map((s) => (
            <li key={s.name} className="flex items-center gap-1.5 type-caption text-ink-secondary">
              <span className={cn("h-2.5 w-2.5 rounded-sm", s.cls)} />
              {s.name} <b className="tabular text-ink">{s.n}</b>
            </li>
          ))}
        </ul>
        <p className="mt-3 type-body-md text-ink-secondary ko-justify">{h.read}</p>

        <p className="mt-5 type-caption font-semibold text-ink-secondary">일반 경영 15명 기준, 단계마다 남는 인원</p>
        <ol className="mt-2 space-y-2">
          {h.steps.map((s) => (
            <li key={s.label} className="grid grid-cols-[6.2rem_1fr] items-center gap-2.5">
              <span className="type-caption font-semibold text-ink [word-break:keep-all]">{s.label}</span>
              <span className="min-w-0">
                <span className="block h-5 overflow-hidden rounded-md bg-canvas-soft">
                  <span className={cn("block h-full rounded-md bg-brand-dark", anim)} style={{ width: `${Math.max(4, (s.n / 225) * 100)}%` }} />
                </span>
                <span className="mt-0.5 block tabular type-caption font-semibold text-ink-secondary">
                  {s.mult} · {s.text}
                </span>
              </span>
            </li>
          ))}
        </ol>
        <p className="mt-3 type-caption text-ink-mute [word-break:keep-all]">※ 배수에 15명을 곱한 어림값이에요. 동점자는 전원 합격이라 더 늘 수 있어요.</p>
      </div>

      <div className="rounded-xl bg-[#f0faf4] px-5 py-4">
        <Fact kind="kong">같은 15명을 뽑는데 1차 합격 자리가 45명 줄었어요. ‘15배수라 붙을 만하다’는 상반기 후기를 그대로 믿으면 안 되는 이유예요.</Fact>
      </div>

      <Card title="공고에 적힌 하반기 일정" kind="notice">
        <ol className="space-y-1">
          {ROAD.map((r) => (
            <li key={r.when} className={cn("grid grid-cols-[7rem_1fr] items-center gap-2 rounded-lg px-2 py-1.5", r.now && "bg-[#fff1e0]")}>
              <span className="tabular type-caption font-semibold text-ink-secondary">{r.when}</span>
              <span className="flex min-w-0 items-center gap-1.5 type-body-md text-ink">
                {r.round && <Round n={r.round} />}
                <span className="[word-break:keep-all]">{r.what}</span>
              </span>
            </li>
          ))}
        </ol>
        <p className="mt-2 type-caption text-ink-mute [word-break:keep-all]">10월 29일부터는 공고에 ‘예정’으로 적혀 있어요. 바뀌면 채용 사이트에 공지돼요.</p>
      </Card>

      <Card title="일반 말고 다른 부문은요?" kind="notice">
        <Tabs label="부문 고르기" value={track} onChange={setTrack} items={TRACKS.map((x) => ({ key: x.key, label: x.label }))} />
        <ul key={track} className="mt-3 space-y-1.5 motion-safe:animate-[kk-fade-in_.3s_ease-out]" aria-live="polite">
          {t.lines.map((l) => (
            <li key={l} className="type-body-md text-ink-secondary ko-justify">
              {l}
            </li>
          ))}
        </ul>
        <p className="mt-3 border-t border-hairline pt-3 type-body-md text-ink-secondary ko-justify">세 부문은 1차 면접 통과가 2배수예요. 다만 부문별 경쟁률은 공개된 게 없어요.</p>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 2. 구조 — 첫 번째 거름망이 다른 자리에 있어요                             */
/* ------------------------------------------------------------------ */

const STAGES = {
  one: {
    label: "1차 필기",
    pass: "12배수",
    rows: [
      { what: "NCS 직업기초능력", how: "의사소통·수리·문제해결·조직이해 (경영·경제 분야)" },
      { what: "정량지표 평가", how: "외국어능력, 자격증 등. 반영 비율은 공고에 없어요." },
    ],
  },
  two: {
    label: "2차 필기",
    pass: "3배수",
    rows: [
      { what: "지원 분야 전공지식", how: "직무설명서의 필요지식·기술을 바탕으로 출제돼요." },
      { what: "일반논술", how: "경영·경제 분야의 시험과목이에요." },
      { what: "NCS 직업성격검사", how: "적·부심사(통과와 탈락만 가려요)" },
      { what: "자기소개서 심사", how: "적·부심사 및 감점" },
    ],
  },
} as const;

function Compare() {
  const rows = [
    { name: "산은", first: "서류", firstNote: "15배수", second: "필기", secondNote: "3배수", strong: false },
    { name: "수은", first: "1차 필기", firstNote: "12배수", second: "2차 필기", secondNote: "3배수", strong: true },
  ];
  return (
    <div className="rounded-3xl bg-canvas p-4 shadow-level-2 sm:p-5">
      <div className="grid grid-cols-[2.6rem_1fr_1fr] gap-2 type-caption font-semibold text-ink-mute">
        <span />
        <span>첫 번째 거름망</span>
        <span>두 번째 거름망</span>
      </div>
      <div className="mt-2 space-y-2">
        {rows.map((r) => (
          <div key={r.name} className="grid grid-cols-[2.6rem_1fr_1fr] items-stretch gap-2">
            <span className="flex items-center type-body-md font-bold text-ink">{r.name}</span>
            <span className={cn("rounded-xl px-3 py-2.5", r.strong ? "bg-primary text-on-primary" : "bg-canvas-soft text-ink")}>
              <span className="block type-body-md font-bold">{r.first}</span>
              <span className={cn("block tabular type-caption", r.strong ? "text-on-primary/80" : "text-ink-secondary")}>{r.firstNote}</span>
            </span>
            <span className={cn("rounded-xl px-3 py-2.5", r.strong ? "bg-[#c2570c] text-on-primary" : "bg-canvas-soft text-ink")}>
              <span className="block type-body-md font-bold">{r.second}</span>
              <span className={cn("block tabular type-caption", r.strong ? "text-on-primary/80" : "text-ink-secondary")}>{r.secondNote}</span>
            </span>
          </div>
        ))}
      </div>
      <figure className="mt-4 border-t border-hairline pt-3">
        <div className="flex items-center gap-2">
          <Src kind="talk" />
          <span className="type-caption text-ink-mute">준비생들 사이에 굳어진 비유</span>
        </div>
        <blockquote className="mt-2 inline-block rounded-2xl rounded-bl-sm bg-[#fff1e0] px-3.5 py-2 type-body-md font-semibold text-ink [word-break:keep-all]">“사실 수은 1차=산은 서류전형”</blockquote>
      </figure>
    </div>
  );
}

function Structure() {
  const [stage, setStage] = useState<keyof typeof STAGES>("one");
  const s = STAGES[stage];
  return (
    <div className="space-y-5">
      <Compare />

      <TryHint>시험을 골라 보세요</TryHint>
      <Card>
        <Tabs
          label="1차 2차 고르기"
          value={stage}
          onChange={setStage}
          items={[
            { key: "one", label: "1차 필기" },
            { key: "two", label: "2차 필기" },
          ]}
        />
        <div key={stage} className="mt-4 motion-safe:animate-[kk-fade-in_.3s_ease-out]" aria-live="polite">
          <div className="flex items-center justify-between gap-2">
            <p className="flex items-center gap-2 type-heading-sm text-ink">
              <Round n={stage === "one" ? 1 : 2} />
              {s.pass}로 통과
            </p>
            <Src kind="notice" />
          </div>
          <ul className="mt-3 divide-y divide-hairline">
            {s.rows.map((r) => (
              <li key={r.what} className="py-2.5">
                <p className="type-body-md font-semibold text-ink">{r.what}</p>
                <p className="mt-0.5 type-body-md text-ink-secondary ko-justify">{r.how}</p>
              </li>
            ))}
          </ul>
        </div>
      </Card>

      <Card title="자소서는 정말 안 볼까요?">
        <div className="space-y-2.5">
          <Fact kind="talk">적부(통과와 탈락만 가리는 심사)라 부담이 적다는 말이 많았어요.</Fact>
          <Fact kind="notice">그런데 공고 문구는 “적·부심사 및 감점”이에요. 감점은 2차 필기 점수에서 깎여요.</Fact>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-xl border-2 border-ev-doc/40 px-3 py-3">
            <p className="type-caption font-bold text-ev-doc">과락 요인</p>
            <ul className="mt-1.5 space-y-1 type-body-md text-ink [word-break:keep-all]">
              <li>문항 미기재</li>
              <li>문항과 무관한 내용</li>
            </ul>
          </div>
          <div className="rounded-xl border-2 border-[#ffb36b] px-3 py-3">
            <p className="type-caption font-bold text-[#9a4a0b]">감점 요인</p>
            <ul className="mt-1.5 space-y-1 type-body-md text-ink [word-break:keep-all]">
              <li>작성방식 지시 미준수</li>
              <li>블라인드 요소 위배</li>
            </ul>
          </div>
        </div>
        <div className="mt-4 space-y-2.5">
          <Fact kind="notice">FAQ 기준으로 전공, 경력, 대외활동 기업명은 블라인드 위배가 아니에요. 학교가 유추되는 전공명·과목명은 일반적인 이름으로 바꿔야 해요.</Fact>
          <Fact kind="kong">수은 자소서엔 요점을 나열하라는(개조식) 지시 문항이 있어요. 이런 지시부터 그대로 따르세요.</Fact>
        </div>
      </Card>

      <Card title="1차 점수가 2차로 이어질까요?">
        <div className="space-y-2.5">
          <Fact kind="notice">단계별 점수를 합산하는지는 공고에 없어요.</Fact>
          <Fact kind="rumor">‘허들형’(단계마다 점수를 새로 시작)이라고 들었다는 전언만 있어요. 확인된 얘기는 아니에요.</Fact>
        </div>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 3. 1차(NCS) — 악명의 실체                                              */
/* ------------------------------------------------------------------ */

const QUIZ = [
  { mark: "ㄱ", text: "하반기 1차 합격 배수는 상반기보다 작다.", ok: true, why: "12배수와 15배수예요." },
  { mark: "ㄴ", text: "경영 분야 1차 NCS엔 조직이해능력이 있다.", ok: true, why: "네 영역 중 하나예요." },
  { mark: "ㄷ", text: "토익 점수가 없으면 지원할 수 없다.", ok: false, why: "성적이 없어도 지원은 돼요." },
  { mark: "ㄹ", text: "2차 합격 배수는 상반기와 같다.", ok: false, why: "4배수에서 3배수로 줄었어요." },
];

function CountQuiz() {
  const [pick, setPick] = useState<number | null>(null);
  const answer = QUIZ.filter((q) => q.ok).length;
  return (
    <div className="rounded-3xl bg-canvas p-4 shadow-level-2 sm:p-5">
      <p className="type-micro-cap text-primary-text">유형 체험 · 기출 아님</p>
      <p className="mt-1 type-heading-sm text-ink [word-break:keep-all]">이 글의 공고 내용 중 옳은 것은 모두 몇 개일까요?</p>
      <ul className="mt-3 space-y-1.5">
        {QUIZ.map((q) => (
          <li key={q.mark} className="flex items-start gap-2 rounded-lg bg-canvas-soft/70 px-3 py-2">
            <span className="shrink-0 type-body-md font-bold text-ink-mute">{q.mark}.</span>
            <span className="min-w-0 flex-1 type-body-md text-ink [word-break:keep-all]">
              {q.text}
              {pick != null && (
                <span className={cn("mt-0.5 block type-caption font-semibold motion-safe:animate-[kk-fade-in_.3s_ease-out]", q.ok ? "text-[#1d6e43]" : "text-ev-doc")}>
                  {q.ok ? "옳아요" : "틀려요"} · {q.why}
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-3 grid grid-cols-5 gap-1.5">
        {[0, 1, 2, 3, 4].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setPick(n)}
            aria-pressed={pick === n}
            className={cn(
              "rounded-lg border-2 py-2 tabular type-body-md font-bold",
              anim,
              pick == null ? "border-hairline text-ink hover:border-brand-dark/40" : n === answer ? "border-[#1d6e43] bg-[#e3f5ea] text-[#1d6e43]" : pick === n ? "border-ev-doc text-ev-doc" : "border-hairline text-ink-mute",
            )}
          >
            {n}개
          </button>
        ))}
      </div>
      {pick != null && (
        <p className="mt-3 rounded-xl bg-canvas-cream px-4 py-3 type-body-md font-semibold text-ink ko-justify motion-safe:animate-[kk-fade-in_.3s_ease-out]">
          답은 {answer}개예요. 보기 하나만 애매해도 답이 안 나오니, 네 개를 전부 판단해야 해요.
        </p>
      )}
    </div>
  );
}

function NcsRound() {
  return (
    <div className="space-y-5">
      <div className="rounded-2xl border-2 border-brand-dark bg-canvas px-5 py-5">
        <div className="flex items-start justify-between gap-2">
          <p className="type-heading-sm text-ink [word-break:keep-all]">10월 24일 응시자 111명이 남긴 체감</p>
          <Src kind="vote" />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-[#fde8ef] px-3 py-3 text-center">
            <p className="type-caption text-ink-secondary">체감 난이도</p>
            <p className="mt-0.5 type-heading-md font-bold text-[#a3164a]">어려움</p>
          </div>
          <div className="rounded-xl bg-[#fff1e0] px-3 py-3 text-center">
            <p className="type-caption text-ink-secondary">시간</p>
            <p className="mt-0.5 type-heading-md font-bold text-[#9a4a0b]">많이 부족</p>
          </div>
        </div>
        <p className="mt-3 type-caption text-ink-mute [word-break:keep-all]">
          금콩{" "}
          <Link href={REVIEW_1} className="link">
            1차 필기 후기
          </Link>{" "}
          집계, 11월 6일 기준이에요. 후기를 남긴 사람의 체감이라 전체 응시자 의견은 아니에요.
        </p>
      </div>

      <Card title="공고에서 확인되는 건 여기까지예요" kind="notice">
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {["의사소통", "수리", "문제해결", "조직이해"].map((x) => (
            <li key={x} className="flex h-12 items-center justify-center rounded-xl border-2 border-primary/40 bg-ev-written-soft type-body-md font-bold text-ink">
              {x}
            </li>
          ))}
        </ul>
        <p className="mt-3 type-body-md text-ink-secondary ko-justify">경영·경제 분야의 영역이에요. 문항 수, 시간, 배점은 공고에 없어요.</p>
      </Card>

      <TryHint>개수를 눌러 보세요</TryHint>
      <CountQuiz />

      <Card title="상반기 1차를 본 사람들의 말">
        <div className="space-y-2.5">
          <Fact kind="talk">‘맞는 것의 개수를 고르라’는 유형이 많았다는 후기가 있어요. 위 체험처럼요.</Fact>
          <Fact kind="talk">수리, 규칙 찾기, 과학 지문 얘기가 나와요. PSAT형(공직 적격성 시험 유형)을 기대했다가 달랐다는 말도요.</Fact>
          <Fact kind="talk">오전에 100분 동안 봤다는 후기가 있어요. 시간은 공고로 확인되지 않아요.</Fact>
        </div>
      </Card>

      <Card title="어렵다, 그런데 붙을 만하다?">
        <div className="grid gap-2 sm:grid-cols-2">
          <p className="rounded-2xl rounded-bl-sm bg-canvas-soft px-3.5 py-2.5 type-body-md text-ink [word-break:keep-all]">이런 거 잘 푸는 편인데도 손을 못 댔다</p>
          <p className="rounded-2xl rounded-bl-sm bg-canvas-soft px-3.5 py-2.5 type-body-md text-ink [word-break:keep-all]">생각보다 통과는 할 만하다</p>
        </div>
        <p className="mt-2 flex items-center gap-2 type-caption text-ink-mute">
          <Src kind="talk" /> 둘 다 상반기 응시자들의 말을 다듬은 거예요
        </p>
        <div className="mt-3 rounded-xl bg-[#f0faf4] px-4 py-3">
          <Fact kind="kong">둘은 안 부딪혀요. 시험이 어려워도 배수가 넉넉하면 통과는 돼요. 다만 이번 하반기는 12배수였어요.</Fact>
        </div>
      </Card>

      <Card title="헷갈리기 쉬운 것">
        <div className="space-y-2.5">
          <Fact kind="notice">청년인턴 수료자는 1차 우대를 받아요. 우수인턴은 1차에 응시하면 합격 처리돼요. 미응시·과락이면 불합격이고, 인턴 종료 후 2년 안에 한 번만 돼요.</Fact>
          <Fact kind="talk">수은 청년인턴 필기도 NCS이고 어렵다는 후기가 있어요. 하지만 정규직 1차와는 다른 시험이니 후기를 섞어 읽지 마세요.</Fact>
          <Fact kind="notice">합격 여부는 개별 통지가 없어요. 채용 사이트에서 직접 확인해야 해요.</Fact>
        </div>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 4. 2차(전공) — 한 문제에 세 과목                                        */
/* ------------------------------------------------------------------ */

const F = { label: "재무관리", cls: "bg-primary" };
const A = { label: "회계", cls: "bg-[#ffb36b]" };
const M = { label: "일반경영", cls: "bg-[#6fcf97]" };

const SHEET = {
  split: [[F, F, F, F], [F, F, F, F], [F, F, F, F], [A, A, A, A], [A, A, A, A], [M, M, M, M], [M, M, M]],
  mixed: [[F, A, F, M], [A, F, M, A], [F, F, A, M], [M, A, F, F], [A, M, F, A], [F, A, M, F], [F, M, A]],
};

function SheetMock() {
  const [mode, setMode] = useState<keyof typeof SHEET>("mixed");
  return (
    <div className="rounded-3xl bg-canvas p-4 shadow-level-2 sm:p-5">
      <Tabs
        label="시험지 모양 비교"
        value={mode}
        onChange={setMode}
        items={[
          { key: "split", label: "흔히 상상하는 시험지" },
          { key: "mixed", label: "후기 속 수은 시험지" },
        ]}
      />
      <ol className="mt-4 space-y-1.5">
        {SHEET[mode].map((row, i) => (
          <li key={i} className="grid grid-cols-[3.2rem_1fr] items-center gap-2">
            <span className="tabular type-caption font-semibold text-ink-mute">문제 {i + 1}</span>
            <span className="flex gap-1">
              {row.map((c, j) => (
                <span key={j} className={cn("h-6 flex-1 rounded", anim, c.cls)} title={c.label} />
              ))}
              {row.length === 3 && <span className="h-6 flex-1" />}
            </span>
          </li>
        ))}
      </ol>
      <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1">
        {[F, A, M].map((c) => (
          <li key={c.label} className="flex items-center gap-1.5 type-caption text-ink-secondary">
            <span className={cn("h-2.5 w-2.5 rounded-sm", c.cls)} />
            {c.label}
          </li>
        ))}
      </ul>
      <p className="mt-2 type-caption text-ink-mute [word-break:keep-all]">※ 칸 하나가 새끼문제(작은 문제) 하나예요. 색 배치는 이해를 돕는 그림이고, 실제 배치는 몰라요.</p>
    </div>
  );
}

type SubjectKey = "fin" | "acc" | "mgt" | "exim";

const SUBJECTS: Record<SubjectKey, { label: string; notice: string[]; talk?: string; rumor?: string; kong?: string; topics: string[] }> = {
  fin: {
    label: "재무",
    notice: ["자금조달 방법·절차 및 재무관리 이론, 관련 금융상품, IR 등에 대한 이해", "재무 및 환 위험 관리·분석기법에 관한 지식"],
    talk: "상반기 응시자들은 ‘사실상 재무관리 시험이었다’고 입을 모았어요.",
    topics: ["듀레이션", "볼록성", "면역전략", "NPV와 IRR 비교 서술", "합병 교환비율"],
  },
  acc: {
    label: "회계",
    notice: ["재무회계, 관리회계 등 회계 관련 이론 및 기준에 대한 이해"],
    talk: "저가법의 이유를 서술하는 식이었다는 후기예요. 고급회계는 비중이 낮았다는 쪽이 많아요.",
    rumor: "전대리스가 말문제로 나온 것 같다는 후기도 있어요.",
    topics: ["저가법", "재평가모형 누적 OCI", "금융자산 수수료"],
  },
  mgt: {
    label: "일경",
    notice: ["경영전략 수립·실행 및 경영리스크 관리에 관한 지식", "조직·인사 운영 및 관리에 관한 지식"],
    talk: "상반기엔 일경이 별로 없었다는데, 작년엔 많았다는 말도 있어요. 소문이 매번 바뀌는 과목이에요.",
    topics: ["직무특성모형", "공정성이론", "직무충실화"],
  },
  exim: {
    label: "수출금융",
    notice: ["해외진출전략, 외환·국제금융 이론 및 국제금융시장에 대한 이해", "결제방식 및 관련 금융상품에 관한 지식"],
    rumor: "2025년엔 턴키 계약 같은 수출금융 용어가 나왔다는 후기가 있어요.",
    kong: "교과서 밖의 수출금융 용어가 섞일 수 있다는 정도만 기억해 두세요.",
    topics: ["턴키 계약"],
  },
};

function SubjectMap() {
  const [sel, setSel] = useState<SubjectKey>("fin");
  const s = SUBJECTS[sel];
  return (
    <div className="space-y-3">
      <TryHint>과목을 눌러 보세요</TryHint>
      <Card>
        <Tabs label="과목 고르기" value={sel} onChange={setSel} items={(Object.keys(SUBJECTS) as SubjectKey[]).map((k) => ({ key: k, label: SUBJECTS[k].label }))} />
        <div key={sel} className="mt-4 space-y-3 motion-safe:animate-[kk-fade-in_.3s_ease-out]" aria-live="polite">
          <div>
            <div className="flex items-center gap-2">
              <Src kind="notice" />
              <span className="type-caption font-semibold text-ink-secondary">직무설명서 필요지식</span>
            </div>
            <ul className="mt-2 space-y-1.5">
              {s.notice.map((n) => (
                <li key={n} className="border-l-4 border-primary/50 pl-3 type-body-md font-semibold text-ink [word-break:keep-all]">
                  {n}
                </li>
              ))}
            </ul>
          </div>
          {s.talk && <Fact kind="talk">{s.talk}</Fact>}
          {s.rumor && <Fact kind="rumor">{s.rumor}</Fact>}
          {s.kong && <Fact kind="kong">{s.kong}</Fact>}
          <div>
            <p className="type-caption font-semibold text-ink-mute">상반기 후기에 나온 단원</p>
            <ul className="mt-1.5 flex flex-wrap gap-1.5">
              {s.topics.map((t) => (
                <li key={t} className="rounded-full bg-canvas-soft px-3 py-1.5 type-caption font-semibold text-ink">
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Card>
      <p className="type-caption text-ink-mute [word-break:keep-all]">※ 상반기 후기는 이번 출제 예고가 아니에요. 필요지식 문구는 일부만 옮겼어요.</p>
    </div>
  );
}

function MajorRound() {
  return (
    <div className="space-y-5">
      <Card title="공고와 FAQ가 말해 주는 것" kind="notice">
        <ul className="space-y-2">
          {[
            ["형식", "전공지식은 “서술형, 논술형 위주”로 출제될 예정이에요."],
            ["범위", "각 분야 직무설명서의 필요지식·기술을 바탕으로 출제돼요."],
            ["과목", "경영 분야는 전공지식과 일반논술, 두 과목이에요."],
            ["안내", "장소와 시간은 1차 합격 발표 때 알려 줘요."],
          ].map(([k, v]) => (
            <li key={k} className="grid grid-cols-[2.6rem_1fr] gap-2">
              <span className="type-body-md font-bold text-primary-text">{k}</span>
              <span className="type-body-md text-ink-secondary ko-justify">{v}</span>
            </li>
          ))}
        </ul>
      </Card>

      <div className="space-y-2.5 rounded-2xl bg-canvas px-5 py-4 shadow-level-1">
        <Fact kind="talk">상반기 2차는 큰 문제 7개에 새끼문제가 3~4개씩 붙었다는 후기예요.</Fact>
        <Fact kind="talk">이 새끼문제들에 여러 과목이 섞여 있었다고 해요.</Fact>
      </div>

      <TryHint>시험지를 바꿔 보세요</TryHint>
      <SheetMock />

      <figure className="rounded-2xl border-2 border-brand-dark bg-canvas px-5 py-5">
        <Quote className="h-5 w-5 text-primary" strokeWidth={2.2} />
        <blockquote className="mt-2 type-heading-sm text-ink [word-break:keep-all]">“한 문제 안에 일경 회계 잼관이 진짜 다 나옴”</blockquote>
        <figcaption className="mt-2 flex items-center gap-2 type-caption text-ink-mute">
          <Src kind="talk" /> 상반기 응시자 · 일경은 일반경영, 잼관은 재무관리
        </figcaption>
      </figure>

      <SubjectMap />

      <Card title="일반논술, 나와요 안 나와요?">
        <div className="space-y-2.5">
          <Fact kind="notice">상반기·하반기 공고 모두 경영 2차 과목에 일반논술이 적혀 있어요. 시간과 배점은 없어요.</Fact>
          <Fact kind="talk">그런데 ‘수은은 논술이 안 나온다’는 후기와 ‘논술을 먼저 써야 했다’는 실수담이 함께 있어요.</Fact>
          <Fact kind="kong">공고와 후기가 부딪히면 공고를 따르세요. 논술 한 편 쓸 시간은 비워 두는 게 안전해요.</Fact>
          <Fact kind="talk">수은 간행물을 다 뒤졌는데 지난 논술 주제와 겹치는 게 없었다는 사례도 있어요. 간행물만 파는 건 답이 아닐 수 있어요.</Fact>
        </div>
      </Card>

      <figure className="flex gap-3 rounded-2xl bg-canvas px-4 py-4 shadow-level-1">
        {/* eslint-disable-next-line @next/next/no-img-element -- 운영자가 준 일러스트 초상 (public/magazine/kexim) */}
        <img src="/magazine/kexim/ceo.webp" width={640} height={743} alt="황기연 수출입은행장 일러스트" loading="lazy" decoding="async" className="h-28 w-auto shrink-0 self-end object-contain" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="type-caption font-semibold text-ink-secondary">답안에 넣을 수은 맥락 한 줄</p>
            <Src kind="news" />
          </div>
          <blockquote className="mt-1.5 type-body-md font-semibold text-ink [word-break:keep-all]">“다음 50년에도 대한민국 경제의 든든한 버팀목이 되겠다”</blockquote>
          <figcaption className="mt-1 type-caption text-ink-mute [word-break:keep-all]">황기연 행장(일러스트) · 창립 50주년 기념식, 헤럴드경제</figcaption>
          <ul className="mt-2 flex flex-wrap gap-1">
            {["전략산업 금융", "중소·중견기업 수출", "글로벌 수주 지원"].map((t) => (
              <li key={t} className="rounded-full bg-canvas-soft px-2.5 py-1 type-caption font-semibold text-ink">
                {t}
              </li>
            ))}
          </ul>
        </div>
      </figure>

      <Card title="쓰는 시험이라 다행인 것">
        <div className="space-y-2.5">
          <Fact kind="talk">서술형은 뭐라도 쓰면 점수를 주는 느낌이라는 말이 많아요. 비워 두지 마세요.</Fact>
          <Fact kind="talk">2차는 산은처럼 시간이 모자랐다는 후기가 눈에 덜 띄어요. 산은보다 쉽냐는 질문엔 확답이 없고요.</Fact>
          <Fact kind="notice">2차 컷은 공식 숫자가 없어요. 떠도는 숫자는 시험 당일 추측이라 옮기지 않을게요.</Fact>
        </div>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 5. 같은 날 — 산은이냐 수은이냐                                          */
/* ------------------------------------------------------------------ */

const VERSUS: { row: string; kdb: string; kexim: string }[] = [
  { row: "서류전형", kdb: "있음 · 15배수", kexim: "없음 · 전원 응시" },
  { row: "필기 횟수", kdb: "1번", kexim: "2번 (1차·2차)" },
  { row: "필기 합격", kdb: "3배수", kexim: "12배수 → 3배수" },
  { row: "어학", kdb: "TOEIC 750 등 기준점", kexim: "기준점 없음, 1차에 반영" },
];

const QUESTIONS = [
  {
    key: "lang",
    q: "어학 기준점을 넘었나요?",
    a: "산은은 TOEIC 750 같은 기준점을 먼저 채워야 해요. 수은은 기준점이 없지만, 어학과 자격증이 1차 평가에 들어가요.",
  },
  {
    key: "trip",
    q: "전형을 몇 번이나 뛸 수 있나요?",
    a: "수은은 필기 2번, 영어평가 1번, 면접 2번이에요. 시험 두 번이 부담이라 다른 곳을 고른 사람도 꽤 있을 거라는 얘기가 있어요.",
  },
  {
    key: "study",
    q: "NCS와 전공, 어디에 시간을 썼나요?",
    a: "수은은 NCS를 먼저 넘어야 전공 시험지를 받아요. 산은은 하루에 전공·논술·NCS를 다 봐요. 어느 쪽이 내 공부와 맞는지 따져 보세요.",
  },
];

function SameDay() {
  const [open, setOpen] = useState(0);
  return (
    <div className="space-y-5">
      <Card title="금콩 캘린더로 본 겹치는 날">
        <ul className="space-y-2.5">
          <li className="rounded-xl bg-ev-written-soft/60 px-3.5 py-3">
            <p className="flex items-center gap-2 type-body-md font-bold text-ink">
              <Round n={1} /> 10월 24일
            </p>
            <p className="mt-1 type-body-md text-ink-secondary ko-justify">산은, 코스콤, 신한은행, 농협중앙회, KOTRA 등</p>
          </li>
          <li className="rounded-xl bg-[#fff1e0]/70 px-3.5 py-3">
            <p className="flex items-center gap-2 type-body-md font-bold text-ink">
              <Round n={2} /> 11월 7일
            </p>
            <p className="mt-1 type-body-md text-ink-secondary ko-justify">NH농협은행, 금융보안원, 코리안리, 한국벤처투자, KOTRA 등</p>
          </li>
        </ul>
        <div className="mt-3 space-y-2.5">
          <Fact kind="talk">상반기엔 1차가 기은·한국벤처투자와, 2차가 산은·무보와 겹쳤다는 얘기가 많았어요.</Fact>
          <Fact kind="kong">이번엔 산은 서류 발표(9월 29일)가 수은 접수(10월 2일~)보다 빨랐어요. 결과를 보고 수은 접수를 정할 수 있었던 셈이에요.</Fact>
        </div>
      </Card>

      <Card title="산은과 나란히 놓으면" kind="notice">
        <div className="overflow-hidden rounded-xl border border-hairline">
          <div className="grid grid-cols-[4.6rem_1fr_1fr] bg-canvas-soft px-3 py-2 type-caption font-bold text-ink-secondary">
            <span />
            <span>산은</span>
            <span>수은</span>
          </div>
          {VERSUS.map((v) => (
            <div key={v.row} className="grid grid-cols-[4.6rem_1fr_1fr] gap-x-1 border-t border-hairline px-3 py-2.5 type-body-md">
              <span className="type-caption font-semibold text-ink-mute [word-break:keep-all]">{v.row}</span>
              <span className="text-ink-secondary [word-break:keep-all]">{v.kdb}</span>
              <span className="font-semibold text-ink [word-break:keep-all]">{v.kexim}</span>
            </div>
          ))}
        </div>
        <p className="mt-2 type-caption text-ink-mute [word-break:keep-all]">
          산은 필기는{" "}
          <Link href={KDB_HREF} className="link">
            1편에서 따로 정리했어요
          </Link>
          . 산은 시험의 축은 시간이에요.
        </p>
      </Card>

      <TryHint>질문을 눌러 보세요</TryHint>
      <ul className="space-y-2">
        {QUESTIONS.map((x, i) => (
          <li key={x.key}>
            <button
              type="button"
              onClick={() => setOpen(i)}
              aria-expanded={open === i}
              className={cn("w-full rounded-2xl border-2 bg-canvas px-4 py-3.5 text-left", anim, open === i ? "border-brand-dark shadow-level-1" : "border-hairline hover:border-brand-dark/40")}
            >
              <span className="block type-body-md font-bold text-ink [word-break:keep-all]">
                {i + 1}. {x.q}
              </span>
              {open === i && <span className="mt-1.5 block type-body-md text-ink-secondary ko-justify motion-safe:animate-[kk-fade-in_.3s_ease-out]">{x.a}</span>}
            </button>
          </li>
        ))}
      </ul>

      <Card title="‘빈집’이라는 말은 믿어도 될까요?">
        <div className="space-y-2.5">
          <Fact kind="talk">같은 날이라 결시가 많다는 ‘빈집’ 얘기가 매번 돌아요. 고사실마다 반 가까이 비었다는 후기부터 거의 찼다는 후기까지 있어요.</Fact>
          <Fact kind="talk">자기가 갈 곳 말고 다른 데가 빈집이라며 연막을 뿌린다는 농담도 있어요.</Fact>
          <Fact kind="rumor">‘필기가 약하면 수은, 강하면 산은’이라는 설도 돌지만 근거는 확인되지 않아요.</Fact>
        </div>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 6. 어학·우대                                                           */
/* ------------------------------------------------------------------ */

const ENGLISH = [
  { key: "apply", label: "지원할 때", tag: "기준점 없음", text: "“외국어 성적 및 자격증이 없더라도 지원 가능”하다고 공고에 적혀 있어요." },
  { key: "first", label: "1차 필기", tag: "점수에 반영", text: "외국어능력·자격증 등 정량지표가 1차 평가에 들어가요. 반영 비율은 공고에 없어요." },
  { key: "interview", label: "면접 단계", tag: "11.28 시험", text: "TOEIC S&W(말하기·쓰기)를 따로 봐요. 안 보면 1차 면접이 불합격 처리돼요." },
] as const;

const CERTS = [
  { name: "변호사", note: "국내외" },
  { name: "KICPA", note: "한국공인회계사" },
  { name: "AICPA", note: "미국공인회계사" },
  { name: "세무사", note: "" },
  { name: "노무사", note: "" },
  { name: "CFA", note: "Level 3 합격" },
  { name: "FRM", note: "Part 2 합격" },
  { name: "CDCS", note: "신용장 전문가 국제 자격" },
];

const LANGS: Record<string, string> = {
  공통: "FLEX 1A~1B(듣기·읽기 901점 이상), SNULT 1~1+(81점 이상), OPIc AL",
  중국어: "HSK 5급, TSC 6급, BCT(B) 241점 이상(L&R은 801점 이상)",
  일본어: "JPT 700점, SJPT 7급 이상, JLPT N1, 舊JLPT 1급",
  프랑스어: "DELF B2, DALF C1·C2, TCF B2 이상",
  스페인어: "DELE 중급(B2)·고급(C1·C2)",
  러시아어: "TORFL 2단계 이상",
};

function Languages() {
  const [sel, setSel] = useState(1);
  const [lang, setLang] = useState("공통");
  const e = ENGLISH[sel];
  return (
    <div className="space-y-5">
      <TryHint>단계를 눌러 보세요</TryHint>
      <div className="rounded-3xl bg-canvas p-4 shadow-level-2 sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <p className="type-caption font-semibold text-ink-secondary">영어가 나오는 자리 세 곳</p>
          <Src kind="notice" />
        </div>
        <div className="mt-3 grid grid-cols-3 gap-1.5">
          {ENGLISH.map((x, i) => (
            <button
              key={x.key}
              type="button"
              onClick={() => setSel(i)}
              aria-pressed={sel === i}
              className={cn("rounded-xl border-2 px-1.5 py-3 text-center", anim, sel === i ? "border-brand-dark bg-brand-dark text-on-primary" : "border-hairline text-ink hover:border-brand-dark/40")}
            >
              <span className="block type-body-md font-bold [word-break:keep-all]">{x.label}</span>
              <span className={cn("mt-0.5 block type-caption [word-break:keep-all]", sel === i ? "text-on-primary/80" : "text-ink-mute")}>{x.tag}</span>
            </button>
          ))}
        </div>
        <p key={e.key} className="mt-3 rounded-xl bg-canvas-cream px-4 py-3 type-body-md text-ink ko-justify motion-safe:animate-[kk-fade-in_.3s_ease-out]" aria-live="polite">
          {e.text}
        </p>
      </div>

      <Card title="그래서 몇 점이면 될까요?">
        <div className="space-y-2.5">
          <Fact kind="talk">‘수은까지 볼 거면 토익 900은 해 두라’는 말이 돌아요. ‘어학 따잇’이라는 말까지 돌아요.</Fact>
          <Fact kind="notice">점수별 계산법은 공고에 없어요. 그래서 ‘몇 점이면 안전하다’고 단정할 수 없어요.</Fact>
          <Fact kind="notice">접수 마감까지 취득하고 12월 28일에 유효한 성적만 인정돼요. 국내 정기 시험만 돼요.</Fact>
        </div>
      </Card>

      <Card title="우대 자격증" kind="notice">
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {CERTS.map((c) => (
            <li key={c.name} className="rounded-xl bg-canvas-soft/70 px-3 py-2.5">
              <span className="block type-body-md font-bold text-ink">{c.name}</span>
              {c.note && <span className="block type-caption text-ink-secondary [word-break:keep-all]">{c.note}</span>}
            </li>
          ))}
        </ul>
        <p className="mt-3 type-body-md text-ink-secondary ko-justify">실무경력은 필요 없고, 최종합격자만 우대해요. 가점 크기는 공고에 없어요.</p>
        <div className="mt-3">
          <Fact kind="talk">인턴 출신도 면접에서 떨어졌다는 후기가 있어요. 우대를 보장으로 읽진 마세요.</Fact>
        </div>
      </Card>

      <Card title="제2외국어와 그 밖의 우대" kind="notice">
        <div className="flex flex-wrap gap-1.5">
          {Object.keys(LANGS).map((k) => (
            <button key={k} type="button" onClick={() => setLang(k)} aria-pressed={lang === k} className={cn("rounded-full px-3 py-1.5 type-caption font-semibold", anim, lang === k ? "bg-brand-dark text-on-primary" : "bg-canvas-soft text-ink-secondary hover:text-ink")}>
              {k}
            </button>
          ))}
        </div>
        <p className="mt-2.5 type-body-md text-ink ko-justify">{LANGS[lang]}</p>
        <p className="mt-3 border-t border-hairline pt-3 type-body-md text-ink-secondary ko-justify">한국사능력검정 2급 이상도 우대해요. 결시·과락·부정행위가 있으면 우대는 적용되지 않아요.</p>
      </Card>

    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 7. 공부법 — 한 주제를 세 과목으로                                        */
/* ------------------------------------------------------------------ */

const LENSES = {
  merge: { label: "합병", fin: "교환비율은 어떻게 정할까", acc: "영업권은 어떻게 처리할까", mgt: "합친 뒤 조직의 공정성 인식은" },
  lease: { label: "리스", fin: "리스와 차입을 NPV로 비교하면", acc: "사용권자산, 리스부채, 전대리스", mgt: "소유 대신 빌리는 전략의 장단점" },
  rate: { label: "금리 상승", fin: "듀레이션, 볼록성, 면역전략", acc: "채권 평가손익은 어디로 갈까", mgt: "위험관리 조직과 역할 설계" },
} as const;

const PLAN = {
  early: { label: "D-13~D-8", items: ["직무설명서 필요지식을 한 줄씩 내 단원에 연결하기", "세 과목 핵심 단원을 손으로 서술해 보기"] },
  late: { label: "D-7~D-2", items: ["시간을 재고 큰 문제 하나를 끝까지 쓰기", "논술은 주장·근거·결론 개요만 빠르게 잡기"] },
  eve: { label: "D-1", items: ["새 단원은 펴지 않기", "장소·시간·수험표 안내를 다시 읽기", "자주 쓰는 정의 몇 개만 손으로 풀기"] },
} as const;

function Study() {
  const [lens, setLens] = useState<keyof typeof LENSES>("merge");
  const [plan, setPlan] = useState<keyof typeof PLAN>("eve");
  const l = LENSES[lens];
  return (
    <div className="space-y-5">
      <Card>
        <div className="space-y-2.5">
          <Fact kind="talk">비중을 묻는 질문은 많지만 답은 없어요. 해마다 달랐다는 말만 공통이에요.</Fact>
          <Fact kind="kong">그래서 한 과목에 걸기보다 세 과목을 다 놓지 않는 쪽이 안전해요.</Fact>
        </div>
      </Card>

      <TryHint>주제를 바꿔 보세요</TryHint>
      <div className="rounded-3xl bg-canvas p-4 shadow-level-2 sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <p className="type-heading-sm text-ink">한 주제, 세 과목으로 보기</p>
          <Src kind="kong" />
        </div>
        <div className="mt-3">
          <Tabs label="주제 고르기" value={lens} onChange={setLens} items={(Object.keys(LENSES) as (keyof typeof LENSES)[]).map((k) => ({ key: k, label: LENSES[k].label }))} />
        </div>
        <ul key={lens} className="mt-3 space-y-1.5 motion-safe:animate-[kk-fade-in_.3s_ease-out]" aria-live="polite">
          {[
            { c: F, t: l.fin },
            { c: A, t: l.acc },
            { c: M, t: l.mgt },
          ].map(({ c, t }) => (
            <li key={c.label} className="flex items-center gap-2.5 rounded-xl bg-canvas-soft/70 px-3 py-2.5">
              <span className={cn("h-8 w-1.5 shrink-0 rounded-full", c.cls)} />
              <span className="min-w-0">
                <span className="block type-caption font-semibold text-ink-mute">{c.label}</span>
                <span className="block type-body-md font-semibold text-ink [word-break:keep-all]">{t}</span>
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-3 type-caption text-ink-mute [word-break:keep-all]">※ 연습용으로 금콩이 묶은 예시예요. 기출 복원이 아니에요.</p>
      </div>

      <Card title="계산보다 말로 쓰는 연습" kind="kong">
        <ol className="flex items-center gap-1.5">
          {["정의 한 줄", "왜 그런지", "한계·예외"].map((t, i) => (
            <li key={t} className="flex flex-1 items-center gap-1.5">
              <span className="flex min-h-11 flex-1 items-center justify-center rounded-lg bg-[#fff1e0] px-1 text-center type-caption font-bold text-ink [word-break:keep-all]">{t}</span>
              {i < 2 && <ArrowRight aria-hidden className="h-4 w-4 shrink-0 text-ink-mute" strokeWidth={2} />}
            </li>
          ))}
        </ol>
        <p className="mt-3 type-body-md text-ink-secondary ko-justify">‘NPV가 IRR보다 나은 이유’ 같은 주제를 이 세 칸에 맞춰 써 보세요. 답안 뼈대가 빨리 잡혀요.</p>
      </Card>

      <Card title="1차와 2차 사이 2주는 이렇게" kind="kong">
        <Tabs label="기간 고르기" value={plan} onChange={setPlan} items={(Object.keys(PLAN) as (keyof typeof PLAN)[]).map((k) => ({ key: k, label: PLAN[k].label }))} />
        <ul key={plan} className="mt-3 space-y-1.5 motion-safe:animate-[kk-fade-in_.3s_ease-out]" aria-live="polite">
          {PLAN[plan].items.map((x) => (
            <li key={x} className="flex items-start gap-2 type-body-md text-ink [word-break:keep-all]">
              <Check className="mt-1 h-4 w-4 shrink-0 text-primary" strokeWidth={2.6} />
              {x}
            </li>
          ))}
        </ul>
        <p className="mt-3 type-caption text-ink-mute [word-break:keep-all]">올해 간격은 10월 24일에서 11월 7일까지 14일이에요. 다음 시즌 준비생은 1차 전부터 전공을 놓지 마세요.</p>
      </Card>

      <p className="type-body-md text-ink-secondary ko-justify">
        <Src kind="talk" /> 연도별 복기본(기억으로 되살린 문제)이 돈다는 후기는 있어요. 다만 답이 없어 혼자 풀기 불편하다는 말이 같이 나와요.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 8. 시험 당일                                                           */
/* ------------------------------------------------------------------ */

const DAY: { key: string; title: string; text: string; kind: Kind }[] = [
  { key: "place", title: "장소·시간", text: "1차 합격 발표 때 안내돼요. 후기 속 지역 얘기 말고 안내문을 믿으세요.", kind: "notice" },
  { key: "enter", title: "입실 시간", text: "상반기 1차 때도 10시, 9시 반으로 후기가 갈렸어요. 안내문 기준으로 움직이세요.", kind: "talk" },
  { key: "ticket", title: "수험표", text: "1차 땐 현장에서 뽑아 줬다는 후기가 있어요. 2차는 답을 못 찾았으니 미리 챙기세요.", kind: "talk" },
  { key: "order", title: "시험지 순서", text: "순서를 착각했다는 실수담이 있어요. 받자마자 과목 순서와 시간부터 보세요.", kind: "talk" },
  { key: "staff", title: "복도 매너", text: "복도 감독은 수은 직원 같았다는 후기가 있어요.", kind: "talk" },
  { key: "result", title: "합격 발표", text: "11월 18일(수) 예정이에요. 개별 통지가 없으니 채용 사이트에서 확인하세요.", kind: "notice" },
];

const FIVE = ["1차 필기", "2차 필기", "영어평가", "1차 면접", "2차 면접"];

function DayCheck() {
  const [on, setOn] = useState<string[]>([]);
  const toggle = (k: string) => setOn((s) => (s.includes(k) ? s.filter((x) => x !== k) : [...s, k]));
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <TryHint>확인한 것을 눌러 지워 가세요</TryHint>
        <span className="tabular type-caption font-semibold text-primary-text">
          {on.length}/{DAY.length}
        </span>
      </div>
      <ul className="divide-y divide-hairline overflow-hidden rounded-2xl bg-canvas shadow-level-1">
        {DAY.map((d) => {
          const checked = on.includes(d.key);
          return (
            <li key={d.key}>
              <button type="button" onClick={() => toggle(d.key)} aria-pressed={checked} className={cn("flex w-full items-start gap-3 px-4 py-3.5 text-left", anim, checked ? "bg-canvas-soft/60" : "hover:bg-canvas-soft/40")}>
                <span className={cn("mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2", anim, checked ? "border-primary bg-primary text-on-primary" : "border-ink/25")}>{checked && <Check className="h-3.5 w-3.5" strokeWidth={3} />}</span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className={cn("type-body-md font-bold", checked ? "text-ink-mute line-through" : "text-ink")}>{d.title}</span>
                    <Src kind={d.kind} />
                  </span>
                  <span className="mt-0.5 block type-body-md text-ink-secondary ko-justify">{d.text}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <Card title="지방에서 오면 몇 번 움직일까요?">
        <ol className="flex items-stretch gap-1">
          {FIVE.map((x, i) => (
            <li key={x} className="flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl bg-canvas-soft/70 px-0.5 py-2.5 text-center">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand-dark tabular type-caption font-bold text-on-primary">{i + 1}</span>
              <span className="type-caption font-semibold text-ink [word-break:keep-all]">{x}</span>
            </li>
          ))}
        </ol>
        <div className="mt-3 space-y-2.5">
          <Fact kind="notice">필기부터 면접까지 세면 다섯 번이에요. 면접 일정은 조정이 안 되고, 12월 하순 연수에 빠지면 합격이 취소돼요.</Fact>
          <Fact kind="talk">서울을 오가는 시간과 돈이 부담이라는 지방 준비생 후기가 많아요.</Fact>
        </div>
      </Card>

      <div className="rounded-xl border border-dashed border-ink/20 bg-canvas/70 px-5 py-4">
        <Fact kind="notice">다음 시즌 준비생은 사진·생월일 등록을 놓치지 마세요. 이번엔 접수 마감 뒤 10월 20일 17시까지였고, 안 하면 응시가 제한될 수 있었어요.</Fact>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 9. 정리                                                               */
/* ------------------------------------------------------------------ */

const SUMMARY = [
  "수은은 서류 없이 1차(NCS·어학·자격증)로 12배수를 남기고, 2차(전공·논술)로 3배수를 남겨요.",
  "2차 전공은 서술형·논술형 위주예요. 범위는 직무설명서부터 보고, 세 과목을 다 챙기세요.",
  "자소서엔 감점이 있고, 어학엔 기준점이 없어도 1차 평가에 들어가요. 둘 다 그냥 넘기지 마세요.",
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

      <Link href={REVIEW_2} className="group flex items-center gap-4 rounded-2xl bg-brand-dark px-5 py-5 text-on-primary shadow-level-2">
        <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-on-primary text-brand-dark">
          <PenLine className="h-5 w-5" strokeWidth={2} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block type-heading-sm [word-break:keep-all]">2차를 봤다면 체감 난이도를 남겨 주세요</span>
          <span className="mt-0.5 block type-caption text-on-primary/75 [word-break:keep-all]">모인 후기로 이 글의 1차·2차 부분을 고칠게요.</span>
        </span>
        <ArrowRight className="h-5 w-5 shrink-0 transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
      </Link>

      <div className="grid gap-2 sm:grid-cols-2">
        <Link href={KDB_HREF} className="flex items-center justify-between gap-3 rounded-xl border-2 border-brand-dark/20 bg-canvas px-4 py-3 type-body-md font-semibold text-ink hover:border-brand-dark">
          <span className="[word-break:keep-all]">1편 · 산은 경영 필기 보기</span>
          <ArrowRight className="h-4 w-4 shrink-0" strokeWidth={2.2} />
        </Link>
        <p className="flex items-center gap-2 rounded-xl bg-canvas-soft/70 px-4 py-3 type-body-md text-ink-secondary [word-break:keep-all]">
          <RotateCcw aria-hidden className="h-4 w-4 shrink-0 text-ink-mute" strokeWidth={2} />
          다음 편은 무역보험공사 필기예요.
        </p>
      </div>

      <div className="border-t border-hairline pt-4 type-caption text-ink-mute [word-break:keep-all]">
        <p>공고로 확인한 내용과 응시 후기를 나눠 썼어요. 후기는 개인의 체감이라 실제와 다를 수 있으니, 최종 확인은 공고와 안내문으로 해 주세요.</p>
        <p className="mt-1">
          출처:{" "}
          <a href={NOTICE_URL} target="_blank" rel="noopener noreferrer" className="link">
            한국수출입은행 2026년 하반기 전문직행원(신입) 채용 공고문
          </a>
        </p>
        <p className="mt-1">공고 확인일 2026-11-06 · 최근 수정 2026-11-06</p>
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
    title: "올해 하반기 수은, 몇 명이 어디까지 남을까?",
    lead: "공고 이름은 ‘2026년 하반기 전문직행원(신입) 채용’이에요. 총 68명이고, 경영만 보면 26명이에요.",
    kong: "인원만 보면 놓쳐요. 통과 배수(뽑을 인원의 몇 배를 남기나)가 달라졌거든요!",
    bg: "bg-[#f3f6ff]",
    body: <Numbers />,
  },
  {
    short: "구조",
    title: "서류가 없다는 게 무슨 뜻일까?",
    lead: "수은은 접수한 사람 전원이 1차 시험장에 앉아요. 서류 합격 발표 자체가 없어요.",
    kong: "자소서로는 안 떨어진다? 콩이도 그런 줄 알았는데, 반만 맞아요.",
    look: "book",
    bg: "bg-[#fffaf3]",
    body: <Structure />,
  },
  {
    short: "1차(NCS)",
    title: "1차(NCS)는 왜 악명이 높을까?",
    lead: "수은 NCS 후기는 한쪽으로 쏠려 있어요. 어렵다는 쪽으로요.",
    kong: "수은은 후기가 많지 않은 기관이에요. 꼬리표를 꼭 같이 봐 주세요.",
    look: "sweat",
    bg: "bg-[#f6f4ff]",
    body: <NcsRound />,
  },
  {
    short: "2차(전공)",
    title: "2차(전공), 한 문제에 세 과목이 나온다고요?",
    lead: "2차는 쓰는 시험이에요. 회계 문제, 재무 문제가 따로 있을 거라는 상상부터 접어 두세요.",
    kong: "OMR은 1차에 두고 오세요. 콩이는 손글씨부터 걱정이에요.",
    look: "pencil",
    bg: "bg-[#fff6ec]",
    body: <MajorRound />,
  },
  {
    short: "같은 날",
    title: "산은이랑 같은 날이면, 어디로 갈까?",
    lead: "이미 고른 사람에겐 남은 일정이, 다음 시즌 준비생에겐 고르는 기준이 필요해요.",
    kong: "콩이가 아무리 작아도 몸은 하나예요. 시험장도 한 곳뿐이고요.",
    bg: "bg-[#f2fbf5]",
    body: <SameDay />,
  },
  {
    short: "어학·우대",
    title: "수은은 왜 ‘어학 따잇’으로 불릴까?",
    lead: "토익 커트라인은 없어요. 그런데 영어가 나오는 자리는 세 곳이에요.",
    bg: "bg-[#f3f6ff]",
    body: <Languages />,
  },
  {
    short: "공부법",
    title: "통합형 문제는 어떻게 준비할까?",
    lead: "‘CPA 1차 수준이면 될까요?’ 매번 나오는 질문인데, 확답은 없어요.",
    look: "book",
    bg: "bg-[#fffaf3]",
    body: <Study />,
  },
  {
    short: "시험 당일",
    title: "시험 당일, 뭘 확인해야 할까?",
    bg: "bg-[#f6f4ff]",
    body: <DayCheck />,
  },
  {
    short: "정리",
    title: "세 줄로 끝내면?",
    kong: "11월 7일, 응원할게요. 쓰다 막혀도 비우지 마세요!",
    look: "suit",
    bg: "bg-[#f2fbf5]",
    body: <Wrap />,
  },
];

export function KeximWrittenGuide({ title }: { title: string }) {
  return (
    <GuideShell
      chapters={CHAPTERS}
      eyebrow="금콩 인터랙티브 · 기관별 필기 완전정리 #2"
      heading={title}
      sub="수출입은행 필기는 서류 없이 수은 NCS로 시작해요. 1차와 수은 2차를 나눠 한 장씩 정리했어요."
      mascot={<KongMascot hold="book" glasses className="h-24 w-24 shrink-0 md:h-32 md:w-32" />}
      tabsLabel="수은 필기 가이드 목차"
      cover={<Hook />}
      coverClass="from-[#efe8ff]"
    />
  );
}
