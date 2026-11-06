"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { ArrowDown, ArrowRight, BookOpen, Check, ChevronDown, Quote, X } from "lucide-react";
import { cn } from "../../ui";
import { KongMascot } from "../KongMascot";
import { Explain, GuideShell, TryHint, anim, useGuideGo, type GuideChapter } from "./GuideShell";

/**
 * 수은 논술·면접 딥다이브 ① — 대미투자 3,500억 달러와 한미 조선협력
 * 설명 순서는 돈의 흐름 세 질문: 어디서 나와 → 어디로 가고 → 무엇을 믿고 가나.
 * 숫자·날짜·발언은 2026-11-06 기준으로 금융위 보도자료·산업부 자료·기사 원문을 열어 확인한 것만 써요.
 * 수은 입장(행장 공식 발언)과 해석(금콩 풀이)을 한 문장에 섞지 않아요. 전망은 달력 항목으로만 적어요.
 */

const KEXIM_WRITTEN_HREF = "/magazine/9";
const KEXIM_HREF = "/companies/kexim";

/* ------------------------------------------------------------------ */
/* 공통                                                                 */
/* ------------------------------------------------------------------ */

type Kind = "fact" | "kexim" | "view" | "outlook" | "rumor";

const KIND: Record<Kind, { label: string; cls: string }> = {
  fact: { label: "사실", cls: "bg-ev-written-soft text-primary-text" },
  kexim: { label: "수은 입장", cls: "bg-[#e3ecff] text-[#1d4f9a]" },
  view: { label: "해석", cls: "bg-[#fff1e0] text-[#9a4a0b]" },
  outlook: { label: "전망", cls: "bg-[#e3f5ea] text-[#1d6e43]" },
  rumor: { label: "카더라", cls: "bg-canvas-soft text-ink-secondary" },
};

function Tag({ kind }: { kind: Kind }) {
  return <span className={cn("inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] leading-4 font-bold whitespace-nowrap", KIND[kind].cls)}>{KIND[kind].label}</span>;
}

function Line({ kind, children }: { kind: Kind; children: ReactNode }) {
  return (
    <p className="flex items-start gap-2">
      <span className="mt-[3px]">
        <Tag kind={kind} />
      </span>
      <span className="min-w-0 flex-1 type-body-md text-ink ko-justify">{children}</span>
    </p>
  );
}

function P({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("type-body-lg leading-relaxed text-ink-secondary ko-justify", className)}>{children}</p>;
}

function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("rounded-2xl bg-canvas px-5 py-5 shadow-level-1", className)}>{children}</div>;
}

function CardTitle({ children, kind }: { children: ReactNode; kind?: Kind }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <p className="type-heading-sm text-ink [word-break:keep-all]">{children}</p>
      {kind && <Tag kind={kind} />}
    </div>
  );
}

/** 한 줄 정의 — 용어는 처음 나오는 자리에서 */
function TermBox({ term, def, pic }: { term: string; def: ReactNode; pic?: ReactNode }) {
  return (
    <aside className="rounded-2xl border-2 border-dashed border-primary/35 bg-canvas px-4 py-3.5">
      <p className="flex items-center gap-1.5 type-caption font-bold text-primary-text">
        <BookOpen className="h-3.5 w-3.5" strokeWidth={2.2} />한 줄 정의 · {term}
      </p>
      <p className="mt-1 type-body-md font-semibold text-ink ko-justify">{def}</p>
      {pic && <p className="mt-1.5 type-caption text-ink-secondary [word-break:keep-all]">쉽게 말하면 — {pic}</p>}
    </aside>
  );
}

function Said({ who, where, children, kind = "kexim" }: { who: string; where: string; children: ReactNode; kind?: Kind }) {
  return (
    <figure className="rounded-2xl bg-canvas px-5 py-4 shadow-level-1">
      <div className="flex items-start justify-between gap-2">
        <Quote className="h-4 w-4 shrink-0 text-primary" strokeWidth={2.4} />
        <Tag kind={kind} />
      </div>
      <blockquote className="mt-2 type-body-md font-semibold text-ink [word-break:keep-all]">{children}</blockquote>
      <figcaption className="mt-2 type-caption text-ink-mute [word-break:keep-all]">
        {who} · {where}
      </figcaption>
    </figure>
  );
}

function Fold({ title, children, defaultOpen = false }: { title: ReactNode; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl border border-hairline bg-canvas">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="flex w-full items-center gap-2 px-4 py-3.5 text-left type-body-md font-semibold text-ink">
        <span className="min-w-0 flex-1 [word-break:keep-all]">{title}</span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-ink-mute transition-transform", open && "rotate-180")} strokeWidth={2} />
      </button>
      {open && <div className="space-y-3 px-4 pb-4">{children}</div>}
    </div>
  );
}

function Tabs<T extends string>({ items, value, onChange, label }: { items: { key: T; label: string }[]; value: T; onChange: (k: T) => void; label: string }) {
  return (
    <div role="tablist" aria-label={label} className="grid gap-1 rounded-xl bg-canvas-soft p-1" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
      {items.map((x) => (
        <button
          key={x.key}
          type="button"
          role="tab"
          aria-selected={value === x.key}
          onClick={() => onChange(x.key)}
          className={cn("rounded-lg px-1.5 py-2 text-center type-caption font-semibold [word-break:keep-all] sm:type-body-md", anim, value === x.key ? "bg-canvas text-ink shadow-level-1" : "text-ink-secondary hover:text-ink")}
        >
          {x.label}
        </button>
      ))}
    </div>
  );
}

/* 사진 — 재사용이 허락된 사진만 (CC BY·퍼블릭 도메인), 사진마다 출처를 그대로 */
const PHOTOS = {
  gas: {
    src: "/magazine/kexim/texas-gas.webp",
    w: 1200,
    h: 675,
    alt: "미국 텍사스주 오스틴의 가스발전소 굴뚝들",
    credit: "사진: Larry D. Moore / Wikimedia Commons, CC BY 4.0",
    href: "https://commons.wikimedia.org/wiki/File:Sand_Hill_Energy_Center_Power_Plant_Austin_Energy.jpg",
  },
  philly: {
    src: "/magazine/kexim/philly-yard.webp",
    w: 1200,
    h: 795,
    alt: "미국 필라델피아 조선소의 대형 크레인과 건조 중인 검은 선체",
    credit: "사진: R'lyeh Imaging / Wikimedia Commons, CC BY 2.0",
    href: "https://commons.wikimedia.org/wiki/File:Aker_Philadelphia_Shipyard.jpg",
  },
  navy: {
    src: "/magazine/kexim/wally-schirra.webp",
    w: 1200,
    h: 675,
    alt: "안개 낀 바다를 항해하는 미 해군 군수지원함과 강습상륙함",
    credit: "사진: 미 해군 / Wikimedia Commons, 퍼블릭 도메인",
    href: "https://commons.wikimedia.org/wiki/File:USS_Essex_(LHD_2),_right,_and_USNS_Wally_Schirra_(T-AKE_8)_transit_the_Strait_of_Hormuz_in_formation._(51531961733).jpg",
  },
  assembly: {
    src: "/magazine/kdb/yeouido.webp",
    w: 1200,
    h: 900,
    alt: "한강 건너에서 본 여의도 고층 빌딩과 국회의사당",
    credit: "사진: Kimhs5400 / Wikimedia Commons, CC BY 4.0",
    href: "https://commons.wikimedia.org/wiki/File:Yeouido2025.jpg",
  },
} as const;

function Photo({ k, caption }: { k: keyof typeof PHOTOS; caption: ReactNode }) {
  const x = PHOTOS[k];
  return (
    <figure className="overflow-hidden rounded-2xl bg-canvas shadow-level-1">
      {/* eslint-disable-next-line @next/next/no-img-element -- 정적 사진 (public/magazine) */}
      <img src={x.src} width={x.w} height={x.h} alt={x.alt} loading="lazy" decoding="async" className="block h-auto w-full" />
      <figcaption className="px-4 py-2.5">
        <p className="type-body-md text-ink [word-break:keep-all]">{caption}</p>
        <a href={x.href} target="_blank" rel="noopener noreferrer" className="mt-0.5 block type-caption text-ink-mute hover:underline [word-break:keep-all]">
          {x.credit}
        </a>
      </figcaption>
    </figure>
  );
}

/** 장으로 건너뛰기 작은 버튼 */
function GoChip({ to, children }: { to: number; children: ReactNode }) {
  const go = useGuideGo();
  return (
    <button type="button" onClick={() => go(to, true)} className={cn("inline-flex items-center gap-1 rounded-full bg-canvas-soft px-2.5 py-1 type-caption font-semibold text-primary-text hover:bg-ev-written-soft", anim)}>
      {children}
      <ArrowRight className="h-3 w-3" strokeWidth={2.4} />
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* 표지 — 국감 한 장면 + 첫 문제                                          */
/* ------------------------------------------------------------------ */

function Hook() {
  const go = useGuideGo();
  const [pick, setPick] = useState<"yes" | "no" | null>(null);
  return (
    <div className="space-y-4">
      <div className="rounded-3xl bg-canvas/90 p-4 shadow-level-1 backdrop-blur sm:p-5">
        <p className="type-caption font-semibold text-ink-mute">10월 6일, 국회 국정감사장</p>
        <p className="mt-2 mr-6 rounded-2xl rounded-bl-sm bg-canvas-soft px-3.5 py-2.5 type-body-md text-ink [word-break:keep-all]">
          “9월 30일과 10월 1일 각각 팩트시트를 한미가 공동발표하고 나서 10월 1일 24억 달러가 송금됐느냐”
          <span className="mt-1 block type-caption text-ink-mute">임이자 의원(국민의힘)</span>
        </p>
        <p className="mt-2 ml-auto w-fit rounded-2xl rounded-br-sm bg-brand-dark px-3.5 py-2.5 text-right type-body-md font-semibold text-on-primary">
          “네”
          <span className="mt-1 block type-caption font-normal text-on-primary/70">이형일 부총리</span>
        </p>
        <p className="mt-3 type-body-md text-ink-secondary ko-justify">정부가 대미투자금 송금을 공식 확인한 첫 순간이에요. 3,500억 달러 약속이 진짜 돈이 됐어요.</p>

        <p className="mt-4 type-heading-sm text-ink [word-break:keep-all]">그럼 이 돈, 수출입은행이 보냈을까요?</p>
        <div className="mt-2.5 grid grid-cols-2 gap-2">
          {(
            [
              ["yes", "수은이 보냈다"],
              ["no", "수은이 아니다"],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => setPick(k)}
              aria-pressed={pick === k}
              className={cn("rounded-xl border-2 px-3 py-2.5 type-body-md font-semibold", anim, pick === k ? "border-brand-dark bg-brand-dark text-on-primary" : "border-hairline bg-canvas text-ink hover:border-brand-dark/40")}
            >
              {label}
            </button>
          ))}
        </div>
        {pick && (
          <div className="mt-3 rounded-2xl bg-ev-written-soft px-4 py-3.5 motion-safe:animate-[kk-fade-in_.3s_ease-out]">
            <p className="type-body-md font-bold text-ink">{pick === "no" ? "맞아요." : "많이들 그렇게 알아요."} 보낸 곳은 한미전략투자공사예요.</p>
            <p className="mt-1 type-body-md text-ink-secondary ko-justify">면접에서 “수은이 대미투자를 집행한다”고 하면 첫 문장부터 틀려요. 수은은 주인공이 아니라 조연 셋이에요.</p>
          </div>
        )}
        <p className="mt-3 type-body-md font-semibold text-ink [word-break:keep-all]">이 글을 끝까지 읽으면, 이 주제는 논술도 면접도 두렵지 않아요.</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <button type="button" onClick={() => go(1, true)} className={cn("flex items-center justify-between gap-2 rounded-xl bg-brand-dark px-4 py-3 text-left type-body-md font-semibold text-on-primary", anim)}>
            돈의 흐름부터 보기
            <ArrowRight className="h-4 w-4 shrink-0" strokeWidth={2.2} />
          </button>
          <button type="button" onClick={() => go(8, true)} className={cn("flex items-center justify-between gap-2 rounded-xl border-2 border-brand-dark/20 bg-canvas px-4 py-3 text-left type-body-md font-semibold text-ink hover:border-brand-dark", anim)}>
            면접 질문부터 보기
            <ArrowRight className="h-4 w-4 shrink-0" strokeWidth={2.2} />
          </button>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 px-1">
        <span className="type-caption text-ink-mute">이 글의 꼬리표</span>
        {(Object.keys(KIND) as Kind[]).map((k) => (
          <Tag key={k} kind={k} />
        ))}
        <span className="type-caption text-ink-mute">· 2026년 11월 6일 기준이에요.</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 1. 왜                                                                */
/* ------------------------------------------------------------------ */

const TRAITS = [
  { key: "big", label: "크다", head: "한 해에 최대 200억 달러", text: "연간 집행 한도가 200억 달러예요. 첫 사업 하나의 총사업비만 223억 달러고요. 금융회사 한 곳이 해마다 낼 돈이 아니에요." },
  { key: "long", label: "길다", head: "회수 계산이 20년짜리", text: "첫 사업은 20년 동안의 회수액을 따졌어요. 공사도 20년만 운영하는 한시 조직으로 만들었어요." },
  { key: "gov", label: "정치적", head: "상대가 미국 정부", text: "사업은 미국 대통령이 투자위원회 추천을 받아 골라요. 납입이 밀리면 관세가 다시 오를 수도 있어요." },
];

function WhyMoney() {
  const [sel, setSel] = useState(0);
  const t = TRAITS[sel];
  return (
    <div className="space-y-5">
      <Line kind="fact">2025년 7월 30일 한미 관세협상이 타결됐어요. 미국은 상호관세와 자동차 관세를 15%로 낮추고, 한국은 3,500억 달러를 투자하기로 했어요.</Line>
      <Line kind="fact">11월 14일 전략적 투자 양해각서(MOU)로 구체화됐어요.</Line>
      <Card>
        <CardTitle kind="fact">3,500억 달러는 두 덩어리예요</CardTitle>
        <div className="mt-3 flex h-12 gap-0.5 overflow-hidden rounded-xl" role="img" aria-label="전략투자 2,000억 달러, 조선협력 1,500억 달러">
          <div className="flex items-center justify-center bg-brand-dark type-body-md font-bold text-on-primary" style={{ width: `${(2000 / 3500) * 100}%` }}>
            2,000억
          </div>
          <div className="flex items-center justify-center bg-primary type-body-md font-bold text-on-primary" style={{ width: `${(1500 / 3500) * 100}%` }}>
            1,500억
          </div>
        </div>
        <div className="mt-2 grid grid-cols-[4fr_3fr] gap-2 type-caption text-ink-secondary [word-break:keep-all]">
          <p>전략투자: 텍사스 가스발전 같은 사업</p>
          <p>조선협력: 미국 조선업 재건</p>
        </div>
        <p className="mt-3 type-caption text-ink-mute [word-break:keep-all]">원화로는 약 465조 원(10월 국감 보도 환산)이에요. 환율에 따라 500조 원 안팎으로도 적혀요.</p>
      </Card>
      <TermBox term="한미전략투자공사(KUIC)" def="대미투자를 전담하려고 2026년 6월 세운 공기업이에요. 법정 자본금 2조 원, 운영 기간 20년이에요." pic="나라가 미국 사업에만 투자하는 전담 펀드 회사를 새로 차린 것." />
      <P>왜 민간에 맡기지 않았을까요? 이 돈에는 세 가지 성격이 있어요.</P>
      <TryHint>세 가지를 눌러 보세요</TryHint>
      <div className="grid grid-cols-3 gap-2">
        {TRAITS.map((x, i) => (
          <button
            key={x.key}
            type="button"
            onClick={() => setSel(i)}
            aria-pressed={sel === i}
            className={cn("flex min-h-16 items-center justify-center rounded-2xl border-2 px-2 py-3 text-center type-heading-sm font-bold", anim, sel === i ? "border-brand-dark bg-brand-dark text-on-primary shadow-level-2" : "border-hairline bg-canvas text-ink hover:border-brand-dark/40")}
          >
            {x.label}
          </button>
        ))}
      </div>
      <Explain eyebrow={t.label} title={t.head}>
        {t.text}
      </Explain>
      <Line kind="view">그래서 정부가 앞에 서고, 정책금융기관이 손발이 되는 구조가 나왔어요.</Line>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 2. 돈의 흐름                                                          */
/* ------------------------------------------------------------------ */

const FLOW = [
  {
    q: "어디서",
    name: "재원",
    sub: "운용수익 · 위탁자산 · 채권",
    text: "기금의 재원은 네 갈래예요. 공사 출연금, 한국은행·외국환평형기금의 위탁자산, 한미전략투자채권, 정부·금융기관 차입금이에요. 첫 송금 24억 달러는 한은과 외평기금의 외화자산에서 나왔어요.",
    note: "외국환평형기금은 환율이 크게 흔들릴 때 쓰는 정부 자금이에요. 채권에 정부 보증을 붙이려면 국회 동의가 필요해요.",
  },
  {
    q: "누가",
    name: "한미전략투자공사",
    sub: "기금을 만들고 굴려요",
    text: "공사가 한미전략투자기금을 조성하고 운용해요. 미국으로 돈을 보내는 곳도 여기예요. 수은이 아니에요.",
    note: "사업마다 산업통상부 사업관리위원회가 먼저 검토하고, 재정경제부 운영위원회가 최종 의결해요.",
  },
  {
    q: "어디로",
    name: "I-SPV",
    sub: "미국 측 상위 투자 법인",
    text: "24억 달러가 먼저 도착한 곳이에요. 자금을 모으고 관리해요. SPV는 사업 하나를 위해 만든 서류상 회사예요.",
    note: "여러 사업은 한 법인으로 묶었어요. 한 사업의 손실을 다른 사업 수익으로 메우는 ‘리스크 풀링’ 장치예요.",
  },
  {
    q: "어디로",
    name: "P-SPV",
    sub: "사업별 법인",
    text: "프로젝트마다 따로 만든 법인이에요. 실제 사업은 여기서 진행해요.",
    note: "24억 달러는 주로 자재비로 쓰이고, 인건비와 행정비용도 일부 들어가요.",
  },
  {
    q: "어디로",
    name: "프로젝트 스타",
    sub: "텍사스 가스발전 (1호)",
    text: "텍사스 엔시날에 AI 데이터센터용 가스복합발전소를 지어요. 총사업비 223억 달러를 한국이 다 내진 않아요. 기금은 일부만 대고, 나머지는 미국 사업자 출자와 프로젝트파이낸싱으로 채워요.",
    note: "프로젝트파이낸싱은 사업이 벌어들일 돈을 믿고 빌려주는 대출이에요.",
  },
];

function FlowMap() {
  const [sel, setSel] = useState(1);
  const x = FLOW[sel];
  return (
    <Card>
      <CardTitle kind="fact">그림 1 · 첫 24억 달러가 간 길</CardTitle>
      <TryHint>칸을 눌러 보세요</TryHint>
      <ol className="mt-3">
        {FLOW.map((n, i) => (
          <li key={n.name}>
            {i > 0 && (
              <div className="flex h-5 items-center justify-center text-primary" aria-hidden>
                <ArrowDown className="h-4 w-4" strokeWidth={2.6} />
              </div>
            )}
            <button
              type="button"
              onClick={() => setSel(i)}
              aria-pressed={sel === i}
              className={cn("flex w-full items-center gap-3 rounded-xl border-2 px-3.5 py-2.5 text-left", anim, sel === i ? "border-brand-dark bg-brand-dark text-on-primary shadow-level-2" : i === 1 ? "border-primary/50 bg-ev-written-soft text-ink" : "border-hairline bg-canvas text-ink hover:border-brand-dark/40")}
            >
              <span className={cn("w-11 shrink-0 type-caption font-bold", sel === i ? "text-on-primary/75" : "text-primary-text")}>{n.q}</span>
              <span className="min-w-0 flex-1">
                <span className="block type-body-md font-bold [word-break:keep-all]">{n.name}</span>
                <span className={cn("block type-caption [word-break:keep-all]", sel === i ? "text-on-primary/75" : "text-ink-secondary")}>{n.sub}</span>
              </span>
            </button>
          </li>
        ))}
      </ol>
      <div key={x.name} className="mt-3 rounded-xl bg-canvas-soft px-4 py-3.5 motion-safe:animate-[kk-fade-in_.3s_ease-out]">
        <p className="type-body-md text-ink ko-justify">{x.text}</p>
        <p className="mt-1.5 type-caption text-ink-secondary ko-justify">{x.note}</p>
      </div>
    </Card>
  );
}

/** 수익 배분 계산기 — 비율은 실제, 금액은 가상 */
function ShareSim() {
  const [earned, setEarned] = useState(120);
  const korea = Math.round((Math.min(earned, 200) * 0.5 + Math.max(0, earned - 200) * 0.1) * 10) / 10;
  const us = earned - korea;
  const done = earned >= 200;
  return (
    <Card>
      <CardTitle kind="fact">수익은 어떻게 나누나</CardTitle>
      <p className="mt-2 type-body-md text-ink-secondary ko-justify">원금과 이자를 다 회수하기 전에는 5:5, 회수한 뒤에는 미국 90 : 한국 10이에요. 원리금을 100으로 놓고 움직여 보세요.</p>
      <label className="mt-3 block">
        <span className="flex items-baseline justify-between type-caption font-semibold text-ink-secondary">
          사업이 번 돈 <span className="tabular type-heading-sm text-ink">{earned}</span>
        </span>
        <input type="range" min={0} max={400} step={10} value={earned} onChange={(e) => setEarned(Number(e.target.value))} className="mt-1 w-full accent-[#533afd]" aria-label="사업이 번 돈" />
      </label>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-ev-written-soft px-3 py-2.5">
          <p className="type-caption text-ink-secondary">한국 몫</p>
          <p className="tabular type-heading-md font-bold text-ink">{korea}</p>
        </div>
        <div className="rounded-xl bg-canvas-soft px-3 py-2.5">
          <p className="type-caption text-ink-secondary">미국 몫</p>
          <p className="tabular type-heading-md font-bold text-ink">{us}</p>
        </div>
      </div>
      <p className="mt-2.5 type-body-md font-semibold text-ink [word-break:keep-all]">{done ? "원리금 회수 끝. 이제부터 번 돈의 90%는 미국 몫이에요." : `원리금 회수 전이라 5:5예요. 앞으로 ${100 - korea} 더 돌아와야 해요.`}</p>
      <p className="mt-1.5 type-caption text-ink-mute [word-break:keep-all]">금액은 설명용 가상 숫자예요. 비율만 실제이고, 20년 안에 회수가 어려우면 비율을 조정할 수 있어요.</p>
    </Card>
  );
}

function FlowChapter() {
  return (
    <div className="space-y-5">
      <P>복잡해 보여도 질문은 셋이에요. 돈이 어디서 나와서, 어디로 가고, 무엇을 믿고 가나요?</P>
      <FlowMap />
      <Line kind="fact">
        구윤철 당시 부총리(국회): “환전이 아니라 외화자산 운용수익 정도로 집행하기 때문에 올해 투자액은 많지 않을 것”
      </Line>
      <Photo k="gas" caption="엔시날 발전소는 아직 없어요. 사진은 같은 텍사스주 오스틴의 가스발전소예요. 대략 이런 모습을 떠올리면 돼요." />
      <TermBox term="상업적 합리성" def="사업 기간 동안 한국에 돌아올 예상 수입이 투자 원금과 이자를 모두 충당하면 합격이에요." pic="이 돈을 빌려줘도 이자까지 받아낼 수 있나, 라는 질문." />
      <div className="space-y-2.5">
        <Line kind="fact">이자율은 투자 시점의 미국 20년 국채 금리에 한미가 협의한 가산금리를 더해요.</Line>
        <Line kind="fact">합리성이 부족해도 안보·공급망 때문에 꼭 해야 하면, 국회 상임위 사전 동의를 받아야 해요.</Line>
        <Line kind="fact">손실은 공사 적립금으로 먼저 메우고, 모자라면 정부가 메우도록 돼 있어요.</Line>
      </div>
      <ShareSim />
      <Card>
        <CardTitle kind="fact">두 덩어리는 구조가 달라요</CardTitle>
        <div className="mt-3 overflow-hidden rounded-xl border border-hairline">
          <table className="w-full table-fixed border-collapse text-left">
            <thead className="bg-canvas-soft type-caption text-ink-secondary">
              <tr>
                <th className="w-[22%] px-2.5 py-2 font-semibold" />
                <th className="px-2.5 py-2 font-semibold">전략투자 2,000억</th>
                <th className="px-2.5 py-2 font-semibold">조선협력 1,500억</th>
              </tr>
            </thead>
            <tbody className="type-caption text-ink [word-break:keep-all]">
              {[
                ["돈의 모양", "공사가 납입", "민간투자·보증·선박금융"],
                ["누가 앞에", "공사", "한국 기업 + 정책금융"],
                ["수익", "5:5 → 미국 90", "전부 한국 기업 몫"],
              ].map(([a, b, c]) => (
                <tr key={a} className="border-t border-hairline">
                  <th scope="row" className="px-2.5 py-2 font-semibold text-ink-secondary">
                    {a}
                  </th>
                  <td className="px-2.5 py-2">{b}</td>
                  <td className="px-2.5 py-2">{c}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Line kind="fact">안전장치도 있어요. 회계연도마다 200억 달러를 넘겨 집행할 수 없어요. 외환시장이 불안하면 시기와 규모 조정을 요청할 수 있는데, 미국은 성실히 고려한다고만 돼 있어요.</Line>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 3. 수은의 자리 — 세 조연                                               */
/* ------------------------------------------------------------------ */

type Role = "trust" | "bond" | "ship";

const OX = [
  { q: "수은이 대미투자금을 미국에 보낸다", a: false, why: "보내는 곳은 한미전략투자공사예요." },
  { q: "수은은 조선협력 협의체의 간사다", a: true, why: "6월 25일 협약에서 맡았어요." },
  { q: "공사는 업무를 수은에 맡길 수 있다", a: true, why: "시행령의 위탁 대상 6곳에 들어 있어요." },
  { q: "공사 자본금 2조 원은 수은이 낸다", a: false, why: "정부가 해마다 나눠 현금으로 납입해요." },
];

function OxCard({ q, a, why }: (typeof OX)[number]) {
  const [pick, setPick] = useState<boolean | null>(null);
  return (
    <div className="rounded-xl border border-hairline bg-canvas px-3.5 py-3">
      <p className="type-body-md font-semibold text-ink [word-break:keep-all]">{q}</p>
      <div className="mt-2 flex gap-1.5">
        {[true, false].map((v) => (
          <button key={String(v)} type="button" onClick={() => setPick(v)} aria-pressed={pick === v} aria-label={v ? "맞다" : "틀리다"} className={cn("inline-flex h-9 w-12 items-center justify-center rounded-lg border-2", anim, pick === v ? "border-brand-dark bg-brand-dark text-on-primary" : "border-hairline text-ink-secondary hover:border-brand-dark/40")}>
            {v ? <Check className="h-4 w-4" strokeWidth={2.6} /> : <X className="h-4 w-4" strokeWidth={2.6} />}
          </button>
        ))}
        {pick !== null && (
          <p className="ml-1 min-w-0 flex-1 self-center type-caption text-ink-secondary [word-break:keep-all] motion-safe:animate-[kk-fade-in_.3s_ease-out]">
            <b className="text-ink">{pick === a ? "정답!" : "아쉬워요."}</b> {why}
          </p>
        )}
      </div>
    </div>
  );
}

function RoleChapter() {
  const [role, setRole] = useState<Role>("trust");
  return (
    <div className="space-y-5">
      <P>수은의 자리는 세 가지예요. 집행자가 아니라 위탁 후보, 채권 절차의 원형, 조선 협의체 간사예요.</P>
      <Tabs<Role>
        label="수은의 세 가지 역할"
        value={role}
        onChange={setRole}
        items={[
          { key: "trust", label: "① 위탁 후보" },
          { key: "bond", label: "② 채권 절차" },
          { key: "ship", label: "③ 조선 간사" },
        ]}
      />
      <div key={role} className="space-y-3 motion-safe:animate-[kk-fade-in_.3s_ease-out]">
        {role === "trust" && (
          <>
            <Line kind="fact">시행령은 공사가 업무를 맡길 수 있는 곳으로 여섯 기관을 적었어요.</Line>
            <div className="flex flex-wrap gap-1.5">
              {["수출입은행", "산업은행", "무역보험공사", "한국투자공사", "해양진흥공사", "KIND"].map((x) => (
                <span key={x} className={cn("rounded-full px-3 py-1 type-caption font-semibold", x === "수출입은행" ? "bg-brand-dark text-on-primary" : "bg-canvas text-ink-secondary shadow-level-1")}>
                  {x}
                </span>
              ))}
            </div>
            <Line kind="fact">공사 정원은 50명이고, 10월 국감 때 근무 인원은 32명이었어요.</Line>
            <Line kind="view">사람이 적은 공사의 심사·집행 실무를 기존 기관이 받칠 수 있는 구조로 읽혀요.</Line>
          </>
        )}
        {role === "bond" && (
          <>
            <Line kind="fact">한미전략투자채권의 발행 절차는 수출입금융채권 절차를 그대로 따라요. 수출입금융채권은 수은이 돈을 마련하려고 찍는 채권이에요.</Line>
            <Line kind="fact">공사는 10월 26일 첫 신용등급을 받았어요. 무디스 Aa2, S&P AA로 나라 등급과 같아요.</Line>
            <Line kind="outlook">블룸버그는 공사가 내년 초 최대 20억 달러의 첫 달러채를 검토한다고 보도했어요.</Line>
          </>
        )}
        {role === "ship" && (
          <>
            <Line kind="fact">6월 25일 여의도 수은에서 공사·수은·산은·무보·해진공과 조선 3사가 협약을 맺었어요. 금융위 자료에는 “수출입은행이 간사를 맡아 대내외 소통과 사업 추진 현황 등을 관리”한다고 적혀 있어요.</Line>
            <TermBox term="RG(선수금환급보증)" def="조선사가 배를 못 만들면 받은 선수금을 금융기관이 대신 돌려주겠다는 보증이에요." pic="선박금융과 함께 수은이 조선사를 돕는 대표 도구." />
            <Photo k="philly" caption="2012년의 애커 필라델피아 조선소예요. 2024년 한화가 인수한 지금의 한화 필리조선소예요. 뱃머리 스마일은 합성이 아니에요." />
          </>
        )}
      </div>
      <Card>
        <CardTitle>맞을까, 틀릴까</CardTitle>
        <div className="mt-3 space-y-2">
          {OX.map((x) => (
            <OxCard key={x.q} {...x} />
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 4. 타임라인 + 숫자                                                     */
/* ------------------------------------------------------------------ */

type Track = "all" | "rule" | "ship" | "money";

const EVENTS: { when: string; track: Exclude<Track, "all">; text: string }[] = [
  { when: "2025.7.30", track: "rule", text: "한미 관세협상 타결" },
  { when: "2025.11.14", track: "rule", text: "전략적 투자 MOU, 3,500억 달러 확정" },
  { when: "2026.3.12", track: "rule", text: "대미투자특별법 국회 통과 (재석 242명 중 찬성 226명)" },
  { when: "5.8", track: "ship", text: "산업부·미 상무부 조선협력 MOU" },
  { when: "6.18", track: "rule", text: "법 시행, 공사 출범 (사장 박종원)" },
  { when: "6.19", track: "ship", text: "G7에서 트럼프가 군함 10척을 빠르게 건조할 수 있느냐고 물었다고 이재명 대통령이 공개" },
  { when: "6.25", track: "ship", text: "여의도 수은에서 조선협력 협약, 수은이 간사" },
  { when: "7.23", track: "ship", text: "워싱턴에 한미 조선협력센터 개소, MOU 15건" },
  { when: "10.1", track: "money", text: "프로젝트 스타에 첫 송금 24억 달러" },
  { when: "10.20", track: "rule", text: "수은과 공사가 같은 날 국감 (공사는 첫 국감)" },
  { when: "10.26", track: "money", text: "공사 첫 신용등급 (무디스 Aa2, S&P AA)" },
  { when: "11.2", track: "rule", text: "공사 투자이사에 문재연 전 코람코자산운용 상무 임명" },
];

function Timeline() {
  const [track, setTrack] = useState<Track>("all");
  const list = EVENTS.filter((e) => track === "all" || e.track === track);
  return (
    <Card>
      <CardTitle kind="fact">그림 2 · 15개월의 달력</CardTitle>
      <div className="mt-3">
        <Tabs<Track>
          label="타임라인 거르기"
          value={track}
          onChange={setTrack}
          items={[
            { key: "all", label: "전체" },
            { key: "rule", label: "제도" },
            { key: "ship", label: "조선" },
            { key: "money", label: "돈" },
          ]}
        />
      </div>
      <ol key={track} className="mt-3 space-y-2 motion-safe:animate-[kk-fade-in_.3s_ease-out]">
        {list.map((e) => (
          <li key={e.when + e.text} className="flex gap-3">
            <span className="w-[70px] shrink-0 tabular type-caption font-bold text-primary-text">{e.when}</span>
            <span className="min-w-0 flex-1 type-body-md text-ink [word-break:keep-all]">{e.text}</span>
          </li>
        ))}
      </ol>
    </Card>
  );
}

const STAR = [
  { k: "총사업비", v: "223억 달러" },
  { k: "용량", v: "약 6.4GW" },
  { k: "상업운전", v: "2029년 1단계" },
  { k: "전체 가동", v: "2032년" },
  { k: "20년 회수 전망", v: "430억~454억 달러" },
  { k: "내부수익률", v: "약 15%" },
];

const SCALE = [
  { of: "총사업비 223억 달러", pct: (24 / 223) * 100 },
  { of: "연간 한도 200억 달러", pct: (24 / 200) * 100 },
  { of: "전략투자 2,000억 달러", pct: (24 / 2000) * 100 },
];

function TimeChapter() {
  return (
    <div className="space-y-5">
      <Timeline />
      <Photo k="navy" caption="가운데가 미 해군 군수지원함 USNS 월리 쉬라, 오른쪽이 강습상륙함 USS 에식스예요(2021년). 월리 쉬라는 2025년 3월 한화오션 거제에서 정비를 마쳤어요. 국내 첫 미 해군 함정 MRO(정비·수리)예요." />
      <Card>
        <CardTitle kind="fact">프로젝트 스타, 숫자로 보면</CardTitle>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {STAR.map((x) => (
            <div key={x.k} className="rounded-xl bg-canvas-soft px-3 py-2.5">
              <p className="type-caption text-ink-secondary">{x.k}</p>
              <p className="mt-0.5 type-body-md font-bold text-ink [word-break:keep-all]">{x.v}</p>
            </div>
          ))}
        </div>
        <p className="mt-2.5 type-caption text-ink-mute [word-break:keep-all]">회수 전망과 내부수익률은 정부 추산이에요. 내부수익률은 투자금이 해마다 몇 %씩 불어나는지 나타낸 값이에요.</p>
      </Card>
      <Card>
        <CardTitle>첫 24억 달러는 어느 정도일까</CardTitle>
        <div className="mt-3 space-y-3">
          {SCALE.map((x) => (
            <div key={x.of}>
              <div className="flex items-baseline justify-between gap-2 type-caption text-ink-secondary">
                <span className="[word-break:keep-all]">{x.of} 중</span>
                <span className="tabular type-body-md font-bold text-ink">{x.pct.toFixed(1)}%</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-canvas-soft">
                <div className="h-full rounded-r bg-primary" style={{ width: `${x.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
        <p className="mt-2.5 type-caption text-ink-mute">공개 숫자로 금콩이 계산한 비율이에요.</p>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 5. 국감 쟁점                                                          */
/* ------------------------------------------------------------------ */

function Side({ label, kind, children }: { label: string; kind: Kind; children: ReactNode }) {
  return (
    <div>
      <p className="flex items-center gap-1.5 type-caption font-bold text-ink-mute">
        {label} <Tag kind={kind} />
      </p>
      <div className="mt-1 space-y-1.5 type-body-md text-ink ko-justify">{children}</div>
    </div>
  );
}

const FX = [
  { m: "6월", v: 1528.0 },
  { m: "7월", v: 1488.9 },
  { m: "8월", v: 1404.4 },
  { m: "9월", v: 1358.8 },
  { m: "10월*", v: 1337.2 },
];

function FxBars() {
  return (
    <div className="rounded-xl bg-canvas-soft px-3.5 py-3">
      <p className="type-caption font-bold text-ink-secondary">원/달러 월평균 환율(원)</p>
      <div className="mt-2 space-y-1.5">
        {FX.map((x) => (
          <div key={x.m} className="flex items-center gap-2">
            <span className="w-9 shrink-0 type-caption text-ink-secondary">{x.m}</span>
            <div className="h-3.5 min-w-0 flex-1">
              <div className="h-full rounded-r bg-primary" style={{ width: `${(x.v / 1600) * 100}%` }} />
            </div>
            <span className="w-12 shrink-0 text-right tabular type-caption font-semibold text-ink">{x.v.toLocaleString("ko-KR", { minimumFractionDigits: 1 })}</span>
          </div>
        ))}
      </div>
      <p className="mt-2 type-caption text-ink-mute [word-break:keep-all]">*10월은 23일까지예요. 6월 6일 야간 거래에선 1,561.5원까지 올랐고, 10월 26일 장중엔 1,320.6원까지 내렸어요.</p>
    </div>
  );
}

const FIVE = [
  { n: "한화오션", v: 8.8 },
  { n: "삼성중공업", v: 4.057 },
  { n: "HD현대중공업", v: 3.65 },
  { n: "HD현대삼호", v: 2.207 },
  { n: "한화에어로스페이스", v: 1.923 },
];

function FiveBars() {
  return (
    <div className="rounded-xl bg-canvas-soft px-3.5 py-3">
      <p className="type-caption font-bold text-ink-secondary">수은 여신 상위 5개사 (조 원, 2024년 말)</p>
      <div className="mt-2 space-y-1.5">
        {FIVE.map((x) => (
          <div key={x.n}>
            <div className="flex items-baseline justify-between type-caption text-ink-secondary">
              <span>{x.n}</span>
              <span className="tabular font-semibold text-ink">{x.v.toFixed(2)}</span>
            </div>
            <div className="mt-0.5 h-2.5">
              <div className="h-full rounded-r bg-primary" style={{ width: `${(x.v / 8.8) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
      <p className="mt-2 type-caption text-ink-mute">합계 20조 6,370억 원 · 자기자본의 87.5% · 전체 여신의 13.3%</p>
    </div>
  );
}

function AuditChapter() {
  return (
    <div className="space-y-5">
      <Photo k="assembly" caption="여의도와 국회의사당이에요. 10월 20일 수은과 공사가 같은 날 이곳에서 국감을 받았어요." />
      <P>쟁점은 다섯이에요. 그림 3을 하나씩 펼쳐 보세요. 비판과 답변, 금콩의 풀이를 나눠 적었어요.</P>
      <div className="space-y-2">
        <Fold title="① 공사가 이 일을 감당하나" defaultOpen>
          <Side label="비판" kind="fact">
            <p>이종욱 의원(국민의힘): 리스크관리위 첫 회의가 송금 뒤에 열렸어요. “투자 사업 선정이 제일 큰 리스크 아니냐”.</p>
            <p>임이자 의원(국민의힘): 임원·본부장·감사가 없어 “굉장히 불안정해 보인다”.</p>
            <p>정성호 의원(민주당): 리스크관리위의 미국 법률 전문가가 한 명뿐이에요.</p>
            <p>박수영 의원(국민의힘): 송금 기한이 통보 후 45일 이내인데 왜 발표 다음 날 보냈나. “수출입은행이나 한국투자공사(KIC)에 맡기는 편이 나았을 것”.</p>
          </Side>
          <Side label="답변" kind="fact">
            <p>박종원 사장: “법률전문가를 계속 채용해 나가면서 대형 법률자문사도 고용”할 예정. 송금은 “이면합의는 아니다”. 11월 2일 투자이사가 임명됐어요.</p>
          </Side>
          <Side label="금콩 풀이" kind="view">
            <p>숫자는 정원 50명 중 32명, 이것 하나면 돼요. 수은 준비생의 논점은 그다음이에요. 공사 일이 수은으로 넘어올까요?</p>
          </Side>
        </Fold>
        <Fold title="② 정말 돈이 되는 사업인가">
          <Side label="비판" kind="fact">
            <p>임이자 의원: PPA와 데이터센터 수요처가 불확실한데 사업성을 어떻게 산정했나. PPA는 전기를 장기로 사 주기로 맺는 전력구매계약이에요.</p>
          </Side>
          <Side label="답변" kind="fact">
            <p>이형일 부총리(10월 6일): “충족됐다고 본다”.</p>
            <p>박종원 사장: “합리적인 범위에 들어가 있는 거로” 검토했어요.</p>
          </Side>
          <Side label="금콩 풀이" kind="view">
            <p>NPV(순현재가치)로 보면 쉬워요. 미래의 돈을 오늘 가치로 깎아 비교하는 계산이에요.</p>
            <p>그래서 20년 합계 430억 달러를 오늘 돈과 바로 견주면 안 돼요. 기준 금리는 미국 20년 국채 금리에 가산금리를 더한 값이에요.</p>
          </Side>
        </Fold>
        <Fold title="③ 환율을 밀어 올리나">
          <Side label="비판" kind="fact">
            <p>최지욱 한국투자증권 연구원: 연 200억 달러가 더해진다고 단순 가정하면 균형환율 상승 압력은 20~25원이에요.</p>
          </Side>
          <Side label="답변" kind="fact">
            <p>신현송 한은 총재(8월): 연 200억 달러 한도는 “충분히 감당할 수 있는 수준”.</p>
          </Side>
          <FxBars />
          <Side label="금콩 풀이" kind="view">
            <p>올해 환율은 오히려 내려왔어요. 다만 반도체 기업의 달러 매도도 함께 작용해서, 이것만으로 부담이 없다고 볼 순 없어요. 두 사실을 나란히 쓰면 돼요.</p>
          </Side>
        </Fold>
        <Fold title="④ 수은 여신이 한곳에 쏠리나">
          <Side label="비판" kind="fact">
            <p>안도걸 의원(민주당): 상위 5개사 여신이 자기자본의 87.5%예요. 국회예산정책처 자료 기준으로는 2024년 말 숫자예요.</p>
          </Side>
          <FiveBars />
          <Side label="답변" kind="kexim">
            <p>황기연 행장: “전체 여신에 대한 스트레스 테스트를 실시하고 있고 개별 기업에 대해서도 최선과 최악의 상황을 가정한 위험 평가를 하고 있다”.</p>
          </Side>
          <Side label="금콩 풀이" kind="view">
            <p>조선 4사에 한화에어로스페이스가 더해진 숫자라 ‘조선 여신’이라고만 쓰면 틀려요. 수은법의 동일인 한도는 자기자본의 40%, 은행법은 20%예요.</p>
            <p>87.5%에서 역산한 자기자본은 약 23.6조 원, 40%면 약 9.4조 원이에요. 한화오션이 8.8조 원이고요. 금콩의 단순 계산이라 법정 한도 계산과는 다를 수 있어요.</p>
            <p>10월 선박 수출 -43.6%를 조선 위기로 읽으면 곤란해요. 산업부는 지난해 해양플랜트 수출(24.7억 달러)의 기저효과로 설명했어요.</p>
          </Side>
        </Fold>
        <Fold title="⑤ 미국은 뭘 기대하나">
          <Side label="미국 쪽 말" kind="fact">
            <p>러트닉 상무장관: “얼마나 많은 양해각서(MOU)를 체결했는지”로 평가하지 않겠대요. 기준은 “함께 생산해 낸 미국 내 선박 숫자”예요.</p>
          </Side>
          <Side label="금콩 풀이" kind="view">
            <p>미국 법은 미군 함정의 해외 건조를 원칙적으로 막아요(번스-톨레프슨 규정). 그래서 현지 조선소와 정비(MRO)가 먼저 거론돼요.</p>
          </Side>
        </Fold>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 6. 수은의 눈                                                          */
/* ------------------------------------------------------------------ */

function ViewChapter() {
  const [lens, setLens] = useState<"said" | "seat">("said");
  return (
    <div className="space-y-5">
      <Tabs
        label="수은의 관점"
        value={lens}
        onChange={setLens}
        items={[
          { key: "said", label: "수은이 말한 것" },
          { key: "seat", label: "자리에서 보이는 것" },
        ]}
      />
      {lens === "said" ? (
        <div className="space-y-3 motion-safe:animate-[kk-fade-in_.3s_ease-out]">
          <figure className="flex gap-3.5 rounded-2xl bg-canvas px-4 py-4 shadow-level-1">
            {/* eslint-disable-next-line @next/next/no-img-element -- 사용자 제공 일러스트 (public/magazine/kexim) */}
            <img src="/magazine/kexim/ceo.webp" width={640} height={743} alt="황기연 수출입은행장 일러스트" loading="lazy" decoding="async" className="h-28 w-auto shrink-0 self-end rounded-xl" />
            <div className="min-w-0 flex-1">
              <Tag kind="kexim" />
              <blockquote className="mt-1.5 type-body-md font-semibold text-ink [word-break:keep-all]">“수은은 우리나라 대표 선박금융기관으로서 그간 축적된 전문성과 노하우를 바탕으로 정부의 한미 조선협력투자 이행을 적극적으로 뒷받침할 것”</blockquote>
              <figcaption className="mt-1.5 type-caption text-ink-mute">황기연 행장(일러스트) · 6월 25일 협약식</figcaption>
            </div>
          </figure>
          <Said who="황기연 행장" where="2025년 11월 취임 보도">
            “대미투자사업 금융 수요에 적극 부응”
          </Said>
          <Said who="황기연 행장" where="10월 20일 국감 업무보고">
            “우리 기업들이 대외 충격에 흔들리지 않도록 정책금융이 든든히 뒷받침해야 할 때”
          </Said>
          <Said who="구윤철 당시 부총리" where="6월 25일 협약식" kind="fact">
            “적시에 충분한 자금이 공급될 수 있도록 금융지원 방안을 마련해달라”
          </Said>
        </div>
      ) : (
        <div className="space-y-3 motion-safe:animate-[kk-fade-in_.3s_ease-out]">
          <div className="flex items-start justify-between gap-2 rounded-xl bg-[#fff1e0] px-4 py-3">
            <p className="type-body-md font-semibold text-[#7a3a08] [word-break:keep-all]">아래 셋은 수은이 말한 게 아니에요. 금콩이 수은 자리에서 읽은 고민이에요.</p>
            <Tag kind="view" />
          </div>
          {[
            ["쏠림", "상위 5개사 여신이 이미 자기자본의 87.5%(2024년 말)예요. 조선협력의 보증·선박금융까지 얹히면 집중이 커질 수 있어요."],
            ["일감", "공사 인력이 모자라면 심사·집행 실무가 위탁기관으로 넘어올 수 있어요."],
            ["책임", "미국 사업의 수익성이 수은 심사 기준에 못 미치면, 위탁받은 쪽은 어디까지 책임질까요?"],
          ].map(([k, t], i) => (
            <div key={k} className="flex gap-3 rounded-2xl bg-canvas px-4 py-3.5 shadow-level-1">
              <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#fff1e0] tabular type-caption font-bold text-[#9a4a0b]">{i + 1}</span>
              <p className="min-w-0 flex-1 type-body-md text-ink ko-justify">
                <b>{k}.</b> {t}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 7. 앞으로                                                             */
/* ------------------------------------------------------------------ */

const CALENDAR = [
  { when: "올해 말까지", head: "원전 8기 선납금", text: "미국이 요청하면 국내법 절차를 거쳐 100억 달러를 보내기로 했어요. 실제 요청이 오는지 봐요." },
  { when: "검토 중", head: "알래스카 LNG ‘프로젝트 노스’", text: "이형일 부총리는 10월 6일 검토를 시작하는 단계라고 했어요. 3호 사업이 되는지 봐요." },
  { when: "2027년 초", head: "공사 첫 달러채", text: "최대 20억 달러 규모로 검토한다는 보도가 있어요. 실제 발행 여부와 조건을 봐요." },
  { when: "2027년", head: "텍사스 PPA 체결", text: "산업부가 체결을 추진해요. 사업성 논쟁을 가를 계약이에요." },
  { when: "시기 미정", head: "미국 301조 결과 · 함정 법안", text: "과잉생산 301조 조사 결과와, 동맹국의 함정 건조를 여는 미 의회 법안의 처리를 봐요." },
];

function NextChapter() {
  return (
    <div className="space-y-4">
      <P>잘될지 어려울지는 적지 않아요. 날짜가 오면 확인할 항목만 적어요.</P>
      <ol className="space-y-2">
        {CALENDAR.map((x) => (
          <li key={x.head} className="rounded-2xl bg-canvas px-4 py-3.5 shadow-level-1">
            <div className="flex items-center justify-between gap-2">
              <span className="type-caption font-bold text-primary-text">{x.when}</span>
              <Tag kind="outlook" />
            </div>
            <p className="mt-1 type-heading-sm text-ink [word-break:keep-all]">{x.head}</p>
            <p className="mt-1 type-body-md text-ink-secondary ko-justify">{x.text}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 8. 논술                                                               */
/* ------------------------------------------------------------------ */

const ESSAY = [
  { q: "대미투자 패키지의 구조와 정책금융기관의 역할을 논하라", to: [[1, "2장 흐름"], [2, "3장 수은"]] as const },
  { q: "해외투자의 ‘상업적 합리성’을 판단하는 기준은?", to: [[1, "2장 정의"], [4, "5장 ②"]] as const },
  { q: "대규모 해외투자가 환율에 미치는 영향과 정책 대응은?", to: [[1, "2장 재원"], [4, "5장 ③"]] as const },
];

const NUMS = [
  { n: "3,500억 달러", t: "전략투자 2,000억 + 조선협력 1,500억" },
  { n: "200억 달러", t: "회계연도별 집행 한도" },
  { n: "24억 달러", t: "10월 1일 첫 송금, 사업비의 10% 남짓" },
  { n: "87.5%", t: "상위 5개사 여신 ÷ 자기자본 (2024년 말)" },
];

function NumCard({ n, t }: { n: string; t: string }) {
  const [open, setOpen] = useState(false);
  return (
    <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className={cn("min-h-20 rounded-xl border-2 px-3 py-2.5 text-center", anim, open ? "border-brand-dark bg-brand-dark text-on-primary" : "border-hairline bg-canvas text-ink hover:border-brand-dark/40")}>
      {open ? <span className="type-caption [word-break:keep-all]">{t}</span> : <span className="tabular type-heading-sm font-bold">{n}</span>}
    </button>
  );
}

function EssayChapter() {
  return (
    <div className="space-y-5">
      <P>
        수은 경영 2차에는 일반논술이 들어 있어요. 시험 구조는 <Link href={KEXIM_WRITTEN_HREF} className="link">수은 필기 글</Link>에 정리했어요. 아래 문제는 금콩이 뽑은 예상이고, 모범답안 대신 어느 장을 쓰면 되는지 적었어요.
      </P>
      <div className="space-y-2">
        {ESSAY.map((x, i) => (
          <div key={x.q} className="rounded-2xl bg-canvas px-4 py-3.5 shadow-level-1">
            <div className="flex items-start justify-between gap-2">
              <p className="type-body-md font-semibold text-ink [word-break:keep-all]">
                {i + 1}. {x.q}
              </p>
              <Tag kind="view" />
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {x.to.map(([to, label]) => (
                <GoChip key={label} to={to}>
                  {label}
                </GoChip>
              ))}
            </div>
          </div>
        ))}
      </div>
      <Card>
        <CardTitle kind="view">1번 답안 뼈대, 네 줄</CardTitle>
        <ol className="mt-3 space-y-2">
          {["정의: 전략투자 2,000억 + 조선협력 1,500억", "돈의 흐름: 기금 → 공사 → SPV → 사업", "수은: 위탁 후보·채권 절차·조선 협의체 간사", "리스크와 장치: 역량·환율·집중 vs 연 200억 달러 한도"].map((t, i) => (
            <li key={t} className="flex gap-2.5 type-body-md text-ink [word-break:keep-all]">
              <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-dark tabular text-[11px] font-bold text-on-primary">{i + 1}</span>
              {t}
            </li>
          ))}
        </ol>
      </Card>
      <div>
        <TryHint>외울 숫자, 눌러서 뜻을 확인하세요</TryHint>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {NUMS.map((x) => (
            <NumCard key={x.n} {...x} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 9. 면접                                                               */
/* ------------------------------------------------------------------ */

const QNA = [
  { q: "대미투자에서 수은이 하는 일이 뭔가요?", hint: "주인공이 아니라는 걸 아는지 봐요. 3장의 세 조연으로 답해요.", tail: "공사가 있는데 수은이 왜 필요한가요?", to: [2, "3장"] as const },
  { q: "상위 5개사 여신이 자기자본의 87.5%인데 더 늘려도 되나요?", hint: "신용집중 감각을 봐요. 숫자의 기준 시점과 황 행장 답변까지 함께 말해요.", tail: "87.5%에는 어느 회사들이 들어가나요?", to: [4, "5장 ④"] as const },
  { q: "환율이 내려가면 수출기업은 어떻게 되나요?", hint: "6월 월평균 1,528원, 10월 1,337원 흐름에서 시작해요.", tail: "환헤지(환율 변동 위험을 미리 막는 거래)는 어떻게 돕나요?", to: [4, "5장 ③"] as const },
  { q: "미국 가스발전소가 실패하면 누가 책임지나요?", hint: "수익 배분 5:5, 공사 적립금 다음 정부 보전 순서로 답해요.", tail: "PPA 없이 상업적 합리성을 어떻게 따졌나요?", to: [1, "2장"] as const },
  { q: "조선 1,500억 달러는 전략투자 2,000억 달러와 뭐가 다른가요?", hint: "돈의 모양과 수익 귀속을 비교해요.", tail: "수익이 기업 몫인데 왜 정책금융이 나서나요?", to: [1, "2장 표"] as const },
];

function InterviewChapter() {
  return (
    <div className="space-y-5">
      <Card>
        <CardTitle kind="fact">면접까지 남은 관문 (하반기 공고)</CardTitle>
        <ol className="mt-3 space-y-1.5 type-body-md text-ink [word-break:keep-all]">
          <li>
            <b className="tabular">11월 28일</b> 영어활용능력평가(TOEIC S&W)
          </li>
          <li>
            <b>11월 말~12월 초(예정)</b> 1차 면접, NCS 기반 직무역량평가
          </li>
          <li>
            <b>12월 중하순(예정)</b> 2차 면접, 조직가치적합도 평가
          </li>
        </ol>
      </Card>
      <aside className="rounded-2xl bg-brand-dark px-5 py-4 text-on-primary">
        <div className="flex items-start justify-between gap-2">
          <p className="type-heading-sm [word-break:keep-all]">30초 규칙: 결론 → 숫자 하나 → 수은 연결</p>
          <Tag kind="view" />
        </div>
        <p className="mt-1.5 type-body-md text-on-primary/85 ko-justify">수은을 칭찬하지 말고 역할을 설명해요. “확대해야 한다”로 끝내지 말고 비용·쏠림 중 하나를 붙여요. 국감 비판을 말할 땐 수은 답변도 같이요.</p>
      </aside>
      <div className="space-y-2">
        {QNA.map((x) => (
          <Fold key={x.q} title={x.q}>
            <p className="type-body-md text-ink ko-justify">{x.hint}</p>
            <p className="type-body-md text-ink-secondary [word-break:keep-all]">
              <b className="text-ink">꼬리질문</b> {x.tail}
            </p>
            <GoChip to={x.to[0]}>{x.to[1]} 다시 보기</GoChip>
          </Fold>
        ))}
      </div>
      <Card>
        <CardTitle kind="view">PT 연습 주제 둘</CardTitle>
        <ul className="mt-2.5 space-y-1.5 type-body-md text-ink [word-break:keep-all]">
          <li>· 한미 조선협력 1,500억 달러에서 수은의 금융지원 구조를 설계하라</li>
          <li>· 중형 조선사·기자재사의 마스가(한미 조선협력) 참여를 위한 금융 방안</li>
        </ul>
      </Card>
      <Line kind="rumor">상반기 수은 면접에 인바스켓(서류를 주고 처리안을 쓰게 하는 과제)이 있었대요. PT 주제는 중소·중견기업 지원이었다는 후기도 있어요. 한두 명의 말이에요.</Line>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 10. 정리                                                              */
/* ------------------------------------------------------------------ */

const SUMMARY = [
  "3,500억 달러는 전략투자 2,000억과 조선협력 1,500억이에요. 돈을 보내는 곳은 한미전략투자공사예요.",
  "수은은 위탁 후보, 채권 절차의 원형, 조선 협의체 간사예요. 주인공이 아니라 조연 셋이에요.",
  "쟁점은 공사 역량, 사업성, 환율, 신용집중이에요. 양쪽 말을 함께 알아야 해요.",
];

const SERIES = [
  { n: "①", t: "대미투자 3,500억 달러와 조선협력", now: true },
  { n: "②", t: "방산 수출금융과 수은 자본금" },
  { n: "③", t: "공급망안정화기금" },
  { n: "④", t: "EDCF와 유상원조" },
];

const SOURCES: [string, string][] = [
  ["금융위원회 보도자료, 조선협력투자 업무협약 (6/25)", "https://www.fsc.go.kr/no010101/87187"],
  ["산업통상부, 2026년 10월 수출입 동향 (11/1)", "https://www.motir.go.kr/kor/article/ATCL3f49a5a8c/172360/view"],
  ["KB Think, 대미투자특별법 해설", "https://kbthink.com/investment/issues/us-investment-act.html"],
  ["KB Think, 첫 대미투자 사업 해설", "https://kbthink.com/investment/issues/korea-us-investment.html"],
  ["헤럴드경제, 시행령 위탁기관·채권 준용 (6/8)", "https://www.heraldk.com/article/2026060820300072759"],
  ["뉴시스, 한미 전략투자 MOU (2025/11/14)", "https://www.newsis.com/view/NISX20251114_0003403546"],
  ["더팩트, 한미 공동 설명자료 전문 (2025/11/14)", "https://news.tf.co.kr/read/ptoday/2262501.htm"],
  ["데일리안, 대미투자 일지 (10/1)", "https://www.dailian.co.kr/news/view/1694105"],
  ["CEO스코어데일리, 이형일 부총리 국감 답변 (10/6)", "https://m.ceoscoredaily.com/page/view/2026100615492559261"],
  ["파이낸셜뉴스, 프로젝트 스타 구조 (10/2)", "https://www.fnnews.com/news/202610020601211936"],
  ["파이낸셜뉴스(뉴스1), 환율 영향 (9/9)", "https://www.fnnews.com/news/202609090555269502"],
  ["MTN, 프로젝트 스타·원전 8기 (10/1)", "https://news.mtn.co.kr/news-detail/2026100104283999993"],
  ["아이뉴스24, 공사 국감 (10/20)", "https://inews24.com/view/2016899"],
  ["서울경제, 이면합의 답변 (10/20)", "https://m.sedaily.com/article/20103906"],
  ["뉴데일리, 송금 논란 (10/20)", "https://www.newdaily.co.kr/site/data/html/2026/10/20/2026102000283.html"],
  ["주간한국, 수은 국감 (10/20)", "https://weekly.hankooki.com/news/articleView.html?idxno=7189826"],
  ["서울경제, 국회예산정책처 수은 여신 집중 (10/10)", "https://m.sedaily.com/article/20099936"],
  ["쿠키뉴스, 황기연 국감 업무보고 (10/20)", "https://www.kukinews.com/article/view/kuk202610200068"],
  ["SBS Biz, 공사 달러채 검토 (9/18)", "https://biz.sbs.co.kr/amp/article/20000335583"],
  ["코리아중앙데일리, 공사 신용등급 (10/26)", "https://www.koreajoongangdaily.com/business/koreaus-investment-vehicle-wins-top-ratings/12937976"],
  ["한국경제TV, 공사 투자이사 임명 (11/2)", "https://www.wowtv.co.kr/NewsCenter/News/Read?articleId=A202611020072"],
  ["디지털데일리, 군함 10척 (6/19)", "https://www.ddaily.co.kr/page/view/2026061918105439306"],
  ["노컷뉴스, 러트닉 발언 (7/23)", "https://nocutnews.co.kr/news/6552681"],
  ["경북매일, 환율 월평균 (10/26)", "https://kbmaeil.com/article/20261026500025"],
  ["SBS Biz, 월리 쉬라 MRO 완료 (2025/3/13)", "https://biz.sbs.co.kr/amp/article/20000222592"],
];

function Wrap() {
  return (
    <div className="space-y-5">
      <ol className="space-y-2">
        {SUMMARY.map((t, i) => (
          <li key={t} className="flex gap-3 rounded-xl bg-canvas px-4 py-3.5 shadow-level-1">
            <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-dark tabular type-caption font-bold text-on-primary">{i + 1}</span>
            <span className="type-body-md text-ink ko-justify">{t}</span>
          </li>
        ))}
      </ol>
      <Card>
        <CardTitle>수은 논술·면접 딥다이브</CardTitle>
        <ol className="mt-3 space-y-1.5">
          {SERIES.map((x) => (
            <li key={x.n} className={cn("flex items-center gap-2 type-body-md [word-break:keep-all]", x.now ? "font-bold text-ink" : "text-ink-secondary")}>
              <span className="tabular">{x.n}</span>
              <span className="min-w-0 flex-1">{x.t}</span>
              <span className={cn("shrink-0 type-caption", x.now ? "text-primary-text" : "text-ink-mute")}>{x.now ? "이 글" : "예정"}</span>
            </li>
          ))}
        </ol>
        <p className="mt-3 type-body-md text-ink-secondary ko-justify">다음 편은 방산 수출금융이에요. 은행 자본금이 왜 탱크 수출을 막는지, 87.5%가 거기서 어떻게 이어지는지 풀어요.</p>
      </Card>
      <div className="grid gap-2 sm:grid-cols-2">
        <Link href={KEXIM_WRITTEN_HREF} className="flex items-center justify-between gap-3 rounded-xl border-2 border-brand-dark/20 bg-canvas px-4 py-3 type-body-md font-semibold text-ink hover:border-brand-dark">
          <span className="[word-break:keep-all]">수은 필기 가이드 보기</span>
          <ArrowRight className="h-4 w-4 shrink-0" strokeWidth={2.2} />
        </Link>
        <Link href={KEXIM_HREF} className="flex items-center justify-between gap-3 rounded-xl border-2 border-brand-dark/20 bg-canvas px-4 py-3 type-body-md font-semibold text-ink hover:border-brand-dark">
          <span className="[word-break:keep-all]">수은 채용 일정 보기</span>
          <ArrowRight className="h-4 w-4 shrink-0" strokeWidth={2.2} />
        </Link>
      </div>
      <Fold title="출처 전체 보기">
        <ul className="space-y-1.5">
          {SOURCES.map(([t, href]) => (
            <li key={href} className="type-caption [word-break:keep-all]">
              <a href={href} target="_blank" rel="noopener noreferrer" className="link">
                {t}
              </a>
            </li>
          ))}
        </ul>
      </Fold>
      <div className="border-t border-hairline pt-4 type-caption text-ink-mute [word-break:keep-all]">
        <p>이 글은 2026년 11월 6일 기준이에요. 공고·보도로 확인한 사실과 금콩의 해석을 나눠 썼어요.</p>
        <p className="mt-1">썸네일 바탕 사진: 미 해군 / Wikimedia Commons, 퍼블릭 도메인</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 장 목록                                                               */
/* ------------------------------------------------------------------ */

const CHAPTERS: GuideChapter[] = [
  { short: "왜", title: "왜 이런 게 생겼나?", kong: "관세 깎으려고 465조를 약속했대요. 제 통장 잔고는 4만 원대인데요.", look: "sweat", bg: "bg-[#f4f2ff]", body: <WhyMoney /> },
  { short: "돈의 흐름", title: "돈은 어떻게 흐르나?", kong: "제 월급이 어디로 새는지는 몰라도, 이 돈은 그림이 있더라고요.", look: "book", bg: "bg-[#eef6ff]", body: <FlowChapter /> },
  { short: "수은", title: "수은은 여기서 뭘 하나?", kong: "주인공이 아니라 서운하냐고요? 저도 제 인생에선 조연이에요.", look: "suit", bg: "bg-[#fff8ec]", body: <RoleChapter /> },
  { short: "지금까지", title: "지금까지 무슨 일이 있었나?", kong: "15개월 동안 이만큼이요? 전 그동안 자소서 한 장 고쳤어요.", look: "pencil", bg: "bg-[#f2fbf5]", body: <TimeChapter /> },
  { short: "국감", title: "국감에서 뭐가 논쟁이었나?", kong: "양쪽 말을 다 외워야 한대요. 전 제 말도 잘 못 외우는데요.", look: "sweat", bg: "bg-[#fff4f0]", body: <AuditChapter /> },
  { short: "수은의 눈", title: "수은은 이 문제를 어떻게 보나?", kong: "수은 속마음은 저도 몰라요. 그래서 꼬리표를 나눴어요.", look: "book", bg: "bg-[#f4f2ff]", body: <ViewChapter /> },
  { short: "앞으로", title: "앞으로 뭘 보면 되나?", kong: "예측은 안 해요. 전 오늘 점심 메뉴도 못 맞혀요.", look: "pencil", bg: "bg-[#eef6ff]", body: <NextChapter /> },
  { short: "논술", title: "논술에서는 어떻게 쓰나?", kong: "모범답안은 없어요. 있었으면 제가 먼저 베꼈어요.", look: "pencil", bg: "bg-[#fff8ec]", body: <EssayChapter /> },
  { short: "면접", title: "면접에서는 뭘 묻나?", kong: "30초 안에 말하래요. 전 자기소개만 40초예요.", look: "suit", bg: "bg-[#f2fbf5]", body: <InterviewChapter /> },
  { short: "정리", title: "세 줄로 끝내면?", kong: "여기까지 읽었으면 저보다 잘 아세요. 그건 별로 어렵지 않아요.", look: "suit", bg: "bg-[#f6f4ff]", body: <Wrap /> },
];

export function KeximUsInvestGuide({ title }: { title: string }) {
  return (
    <GuideShell
      chapters={CHAPTERS}
      eyebrow="금콩 인터랙티브 · 수은 논술·면접 딥다이브 ①"
      heading={title}
      sub="3,500억 달러가 어디서 나와 어디로 가는지, 수은은 그 사이 어디에 서 있는지 한 장씩 따라가요."
      mascot={<KongMascot hold="book" glasses className="h-24 w-24 shrink-0 md:h-32 md:w-32" />}
      tabsLabel="대미투자 딥다이브 목차"
      cover={<Hook />}
      coverClass="from-[#e6ebff]"
    />
  );
}
