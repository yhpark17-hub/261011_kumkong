"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { ArrowDown, ArrowRight, BookOpen, Check, ChevronDown, Landmark, Quote, Scale } from "lucide-react";
import { cn } from "../../ui";
import { KongMascot } from "../KongMascot";
import { Explain, GuideShell, KongSays, TryHint, anim, type GuideChapter } from "./GuideShell";

/**
 * 논술·면접 딥다이브 1 — 국민성장펀드·첨단전략산업기금과 산은
 * 사전 지식이 없어도 끝까지 읽으면 논술·면접이 되도록: 왜 → 구조 → 산은 → 10개월 → 국감 → 전례 → 산은의 시각 → 앞으로 → 논술 → 면접.
 * 숫자·날짜·발언은 2026-10-20 기준으로 금융위 보도자료·국회·언론 보도를 열어 확인한 것만 써요.
 * 문장 종류: 사실(날짜·기관이 붙은 것) / 산은 입장(산은 회장·임직원이 공개적으로 한 말) / 해석(의원·전문가·언론의 평가와 금콩의 풀이) / 전망(정부 계획·예정된 절차)
 */

/* ------------------------------------------------------------------ */
/* 공통                                                                 */
/* ------------------------------------------------------------------ */

type Kind = "fact" | "kdb" | "view" | "outlook";

const KIND: Record<Kind, { label: string; cls: string; desc: string }> = {
  fact: { label: "사실", cls: "bg-ev-written-soft text-primary-text", desc: "날짜와 기관 이름이 붙은 문장 — 보도자료·법·여러 언론이 같은 숫자로 보도한 것" },
  kdb: { label: "산은 입장", cls: "bg-[#e3ecff] text-[#1d4f9a]", desc: "산은 회장·임직원이 공개적으로 한 말" },
  view: { label: "해석", cls: "bg-[#fff1e0] text-[#9a4a0b]", desc: "의원·전문가·언론의 평가, 그리고 금콩의 풀이 — 말한 사람을 함께 적어요" },
  outlook: { label: "전망", cls: "bg-[#e3f5ea] text-[#1d6e43]", desc: "정부 계획·예정된 절차 — 바뀔 수 있어요" },
};

function Tag({ kind }: { kind: Kind }) {
  return <span className={cn("inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] leading-4 font-bold whitespace-nowrap", KIND[kind].cls)}>{KIND[kind].label}</span>;
}

/** 꼬리표 + 한 문단 */
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

/** 본문 문단 */
function P({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("type-body-lg leading-relaxed text-ink-secondary ko-justify", className)}>{children}</p>;
}

/** 카드 머리 */
function CardTitle({ children, kind }: { children: ReactNode; kind?: Kind }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <p className="type-heading-sm text-ink [word-break:keep-all]">{children}</p>
      {kind && <Tag kind={kind} />}
    </div>
  );
}

function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("rounded-2xl bg-canvas px-5 py-5 shadow-level-1", className)}>{children}</div>;
}

/** 한 줄 정의 박스 — 핵심 용어는 처음 나오는 자리에서 */
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

/** 여기까지 요약 */
function SoFar({ items }: { items: string[] }) {
  return (
    <div className="rounded-2xl bg-brand-dark px-5 py-5 text-on-primary">
      <p className="type-micro-cap text-on-primary/70">여기까지 요약</p>
      <ol className="mt-3 space-y-2">
        {items.map((t, i) => (
          <li key={t} className="flex gap-3 type-body-md [word-break:keep-all]">
            <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-on-primary/15 tabular text-[11px] font-bold">{i + 1}</span>
            <span>{t}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** 따옴표 카드 — 누가, 언제, 어디서 */
function Said({ who, where, children, kind = "kdb" }: { who: string; where: string; children: ReactNode; kind?: Kind }) {
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

/** 접었다 펴는 줄 */
function Fold({ title, children, defaultOpen = false }: { title: ReactNode; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl border border-hairline bg-canvas">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="flex w-full items-center gap-2 px-4 py-3.5 text-left type-body-md font-semibold text-ink">
        <span className="min-w-0 flex-1 [word-break:keep-all]">{title}</span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-ink-mute transition-transform", open && "rotate-180")} strokeWidth={2} />
      </button>
      {open && <div className="space-y-2.5 px-4 pb-4">{children}</div>}
    </div>
  );
}

/** 탭 줄 */
function Tabs<T extends string>({ items, value, onChange, label }: { items: { key: T; label: string }[]; value: T; onChange: (k: T) => void; label: string }) {
  return (
    <div role="tablist" aria-label={label} className="no-scrollbar flex gap-1.5 overflow-x-auto rounded-xl bg-canvas-soft p-1">
      {items.map((x) => (
        <button
          key={x.key}
          type="button"
          role="tab"
          aria-selected={value === x.key}
          onClick={() => onChange(x.key)}
          className={cn("shrink-0 grow rounded-lg px-3 py-2 type-body-md font-semibold whitespace-nowrap", anim, value === x.key ? "bg-canvas text-ink shadow-level-1" : "text-ink-secondary hover:text-ink")}
        >
          {x.label}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 표지 — 한 준비생의 말 · 3줄 요약 · 문장 꼬리표                            */
/* ------------------------------------------------------------------ */

function Cover() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 rounded-3xl bg-canvas/85 p-4 shadow-level-1 backdrop-blur sm:p-5 md:grid-cols-[1.1fr_1fr]">
        <div>
          <p className="type-caption font-semibold text-ink-mute">산은 서류에서 떨어진 한 준비생의 말</p>
          <p className="mt-2 rounded-2xl rounded-bl-sm bg-[#fff1e0] px-3.5 py-2.5 type-body-md font-semibold text-ink [word-break:keep-all]">“국민성장펀드 이야기만 써 놓았더니 떨어졌네요”</p>
          <p className="mt-3 type-body-md text-ink-secondary ko-justify">
            저도 비슷했어요. 산은이 국민성장펀드를 맡는다는 건 알았어요. 그런데 어떤 기업이 어떤 길로 돈을 받는지, 운용사는 뭘 하는지, 심사는 왜 다른 위원회가 하는지 몰랐어요. 산은이 정확히 무슨 일을 하는지도요.
          </p>
          <p className="mt-2 type-body-md font-semibold text-ink [word-break:keep-all]">이 글을 끝까지 읽으면, 논술과 면접에서 이 주제가 더는 두렵지 않을 거예요.</p>
        </div>
        <div className="rounded-2xl bg-brand-dark px-4 py-4 text-on-primary">
          <p className="type-micro-cap text-on-primary/70">3줄 요약</p>
          <ol className="mt-2.5 space-y-2 type-body-md [word-break:keep-all]">
            <li>1. 국민성장펀드는 5년 동안 첨단산업에 돈을 대는 정책 펀드예요. 150조원으로 시작해 200조원으로 커졌어요.</li>
            <li>2. 처음 설계에서 절반(75조원)이 산은 안의 첨단전략산업기금이에요. 산은은 그 그릇이자 사무국이고, 비용도 대요.</li>
            <li>3. 10월 국감 쟁점은 쏠림·심사·손실·시장 왜곡 넷이에요. 양쪽 논리를 다 아는 사람이 차별화돼요.</li>
          </ol>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-1">
        <span className="type-caption text-ink-mute">이 글의 문장 꼬리표</span>
        {(Object.keys(KIND) as Kind[]).map((k) => (
          <span key={k} className="flex items-center gap-1.5 type-caption text-ink-secondary" title={KIND[k].desc}>
            <Tag kind={k} />
          </span>
        ))}
        <span className="type-caption text-ink-mute">· 2026년 10월 20일 기준이에요. 숫자는 바뀌어요.</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 1. 왜 — 민간이 혼자 못 가는 돈                                        */
/* ------------------------------------------------------------------ */

const TRAITS = [
  {
    key: "big",
    label: "크다",
    head: "한 건에 조 단위",
    text: "전남 신안 앞바다의 우이 해상풍력 사업은 총사업비가 3.4조원이에요. 은행 한 곳이 혼자 빌려주기엔 부담스러운 크기예요.",
  },
  {
    key: "long",
    label: "길다",
    head: "돌려받는 데 20년 가까이",
    text: "이 사업에 국민성장펀드가 빌려준 7,500억원은 갚는 기간이 18~19년이에요. 발전소는 2029년부터 본격 가동이 목표예요.",
  },
  {
    key: "risky",
    label: "위험하다",
    head: "기술이 될지 아무도 몰라요",
    text: "AI 반도체 같은 기술은 성공하면 크게 벌지만, 실패하면 투자금을 잃어요. 담보로 잡을 건물도 마땅치 않아요.",
  },
];

function WhyMoney() {
  const [sel, setSel] = useState(0);
  const [lens, setLens] = useState<"bank" | "policy">("bank");
  const t = TRAITS[sel];
  return (
    <div className="space-y-5">
      <TermBox term="생산적 금융" def="가계대출과 부동산으로 쏠린 돈을 기업·첨단산업·벤처로 돌리자는 정부의 금융정책 구호예요." pic="같은 돈이라도 아파트로 가면 집값이 오르고, 공장과 연구소로 가면 기술과 일자리가 남는다는 발상." />
      <P>문제는 공장과 연구소로 가는 돈이 민간 혼자 대기 어려운 돈이라는 거예요. 첨단산업에 필요한 돈에는 세 가지 성격이 있어요.</P>
      <TryHint>세 가지를 눌러 보세요</TryHint>
      <div className="grid grid-cols-3 gap-2">
        {TRAITS.map((x, i) => (
          <button
            key={x.key}
            type="button"
            onClick={() => setSel(i)}
            aria-pressed={sel === i}
            className={cn(
              "flex min-h-20 flex-col items-center justify-center rounded-2xl border-2 px-2 py-3 text-center",
              anim,
              sel === i ? "border-brand-dark bg-brand-dark text-on-primary shadow-level-2" : "border-hairline bg-canvas text-ink hover:border-brand-dark/40",
            )}
          >
            <span className="type-heading-md font-bold">{x.label}</span>
          </button>
        ))}
      </div>
      <Explain eyebrow={t.label} title={t.head}>
        {t.text}
      </Explain>

      <Card>
        <CardTitle>같은 사업, 두 가지 눈</CardTitle>
        <div className="mt-3">
          <Tabs
            label="은행의 눈"
            value={lens}
            onChange={setLens}
            items={[
              { key: "bank", label: "민간 은행의 눈" },
              { key: "policy", label: "정책금융의 눈" },
            ]}
          />
        </div>
        <div key={lens} className="mt-3 space-y-2 motion-safe:animate-[kk-fade-in_.3s_ease-out]">
          {(lens === "bank"
            ? ["돈 떼일 일은 없나? 담보는 뭐지?", "언제 돌려받나? 20년은 너무 길다.", "같은 돈을 더 안전한 주택담보대출에 쓰면 안 되나?"]
            : ["나라에 꼭 필요한 일인가?", "민간이 안 하거나 못 하는 일인가?", "우리가 먼저 들어가면 민간 돈이 따라올까?"]
          ).map((q) => (
            <p key={q} className="flex items-start gap-2 type-body-md text-ink [word-break:keep-all]">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              {q}
            </p>
          ))}
        </div>
      </Card>

      <TermBox
        term="정책금융"
        def="돈을 버는 것보다 정책 목적(산업 육성, 위기 대응, 지역 균형)을 위해, 정부가 소유하거나 지원하는 금융기관이 하는 금융이에요."
        pic="민간 은행이 '갚을 수 있나'를 먼저 본다면, 정책금융은 '나라에 필요한데 민간이 안 하는 일인가'를 먼저 봐요. 산은·수은·기은이 대표예요."
      />
      <P>
        여기에 나라 밖 사정도 겹쳤어요. 미국은 반도체법(CHIPS Act)으로 자국 공장에 보조금을 주고, 일본은 라피더스라는 반도체 회사에 정부 돈을 넣었어요. 국가끼리 기술을 두고 경쟁하는 판이 된 거예요.
      </P>
      <Line kind="kdb">산은도 10월 국감 업무보고에서 지금 상황을 “기술패권 경쟁 가속화, 통상질서 재편, 지역 간 불균형 심화 등 복합적인 도전”으로 적었어요.</Line>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 2. 구조 — 돈은 어디서 와서 어디로 가나                                  */
/* ------------------------------------------------------------------ */

const FLOW = {
  budget: { title: "정부 재정", tag: "후순위", text: "나라 예산이에요. 2026년 예산 1조원, 2027년 예산안에도 1조원이 들어 있어요. 손실이 나면 제일 먼저 맞는 자리(후순위)에 들어가요. 금융위는 이걸 “위험을 먼저 부담하거나 마중물” 역할이라고 설명해요." },
  bond: { title: "기금채", tag: "국가보증", text: "첨단전략산업기금이 돈을 빌리려고 발행하는 채권이에요. 나라가 보증을 서 줘서 국고채처럼 싸게 빌릴 수 있어요. 대신 이자 같은 비용은 산은이 내요(출연). 나라가 보증을 서려면 국회 동의가 필요해요." },
  private: { title: "민간·연기금·금융회사·국민", tag: "75조", text: "나머지 절반이에요. 금융지주, 연기금, 운용사가 모은 투자자, 그리고 국민참여형 펀드에 넣은 개인의 돈이에요." },
  fund: { title: "첨단전략산업기금", tag: "75조 · 산은 안", text: "산업은행법을 고쳐 산은 안에 만든 법정 기금이에요. 국민성장펀드의 절반이자, 모펀드처럼 다른 통에 돈을 나눠 주는 큰 통 역할을 해요." },
  firms: { title: "기업·프로젝트", tag: "12대 첨단산업", text: "AI·반도체·바이오·이차전지 같은 첨단전략산업의 기업과, 데이터센터·전력망·해상풍력 같은 대형 사업이에요." },
} as const;

type FlowKey = keyof typeof FLOW;

const WAYS = [
  {
    key: "direct",
    label: "직접투자",
    amount: 15,
    text: "기금이 기업 지분을 직접 사요. 잘되면 크게 벌고, 잘못되면 원금을 잃어요.",
    ex: "퓨리오사AI — 총 8,000억원 안팎 투자 가운데 기금 몫 3,700억원 (2026년 5월 28일 승인)",
  },
  {
    key: "indirect",
    label: "간접투자 (자펀드)",
    amount: 35,
    text: "기금이 운용사가 만든 작은 펀드(자펀드)에 돈을 넣고, 운용사가 기업을 골라 투자해요. 중소·벤처로 돈이 가는 길이 주로 이쪽이에요.",
    ex: "1차 정책성펀드 운용사 12곳 (11개 자리에 81곳 지원, 2026년 5월 27일 확정) — 결성 규모 2조4,400억원",
  },
  {
    key: "infra",
    label: "인프라 투융자",
    amount: 50,
    text: "데이터센터·전력망·해상풍력 같은 시설에 투자와 대출을 섞어서 넣어요. 사업이 앞으로 벌어들일 돈을 믿고 빌려주는 방식(PF, 프로젝트 파이낸싱)이 많아요.",
    ex: "신안우이 해상풍력 — 18~19년 장기대출 7,500억원 (2026년 1월 29일 1호 의결). 390MW, 약 36만 가구가 쓰는 전기 (금융위 설명)",
  },
  {
    key: "loan",
    label: "초저리대출",
    amount: 50,
    text: "이자를 받고 빌려줘요. '초저리'는 국고채 금리 수준이라는 뜻이에요(금융위 설명 '2%대'). 싸게 빌려 와서 싸게 빌려주는 구조예요.",
    ex: "SK바이오사이언스 — 대출 3,000억원 (2026년 5월 28일 승인)",
  },
];

function FlowBox({ k, sel, onSel, className }: { k: FlowKey; sel: FlowKey; onSel: (k: FlowKey) => void; className?: string }) {
  const f = FLOW[k];
  return (
    <button
      type="button"
      onClick={() => onSel(k)}
      aria-pressed={sel === k}
      className={cn(
        "flex min-w-0 flex-col items-center justify-center rounded-2xl border-2 px-2 py-3 text-center",
        anim,
        sel === k ? "border-brand-dark bg-brand-dark text-on-primary shadow-level-2" : "border-hairline bg-canvas text-ink hover:border-brand-dark/40",
        className,
      )}
    >
      <span className="type-body-md font-bold [word-break:keep-all]">{f.title}</span>
      <span className={cn("mt-1 rounded-full px-2 py-0.5 text-[11px] font-bold", sel === k ? "bg-on-primary/15" : "bg-canvas-soft text-ink-secondary")}>{f.tag}</span>
    </button>
  );
}

const Down = () => (
  <div aria-hidden className="flex justify-center py-1 text-ink-mute">
    <ArrowDown className="h-5 w-5" strokeWidth={2.2} />
  </div>
);

function MoneyFlow() {
  const [sel, setSel] = useState<FlowKey>("fund");
  const [way, setWay] = useState(0);
  const w = WAYS[way];
  return (
    <div className="space-y-5">
      <TermBox term="펀드 · 기금" def="펀드는 여러 사람 돈을 한 통에 모아 전문가가 대신 투자하는 거예요. 기금은 특정 목적을 위해 법으로 따로 만든 돈주머니예요." pic="펀드 = 돈을 모은 통. 첨단전략산업기금은 법이 만든 통이고, 국민성장펀드는 그 통과 민간 통을 합친 전체 이름이에요." />

      <TryHint>그림의 칸을 눌러 보세요</TryHint>
      <div className="rounded-3xl bg-canvas p-3 shadow-level-2 sm:p-5">
        <div className="flex items-center justify-between gap-2 px-1">
          <p className="type-caption font-semibold text-ink-secondary">국민성장펀드 돈의 흐름 (처음 설계도 150조원 기준)</p>
          <Tag kind="fact" />
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <FlowBox k="budget" sel={sel} onSel={setSel} />
          <FlowBox k="bond" sel={sel} onSel={setSel} />
          <FlowBox k="private" sel={sel} onSel={setSel} />
        </div>
        <Down />
        <div className="grid grid-cols-3 gap-2">
          <FlowBox k="fund" sel={sel} onSel={setSel} className="col-span-2" />
          <div className="flex flex-col items-center justify-center rounded-2xl bg-canvas-soft px-2 py-3 text-center">
            <span className="type-caption font-semibold text-ink-secondary">민간 75조</span>
            <span className="text-[11px] text-ink-mute">자펀드·공동투자로 합류</span>
          </div>
        </div>
        <Down />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {WAYS.map((x, i) => (
            <button
              key={x.key}
              type="button"
              onClick={() => setWay(i)}
              aria-pressed={way === i}
              className={cn("rounded-2xl border-2 px-2 py-2.5 text-center", anim, way === i ? "border-primary bg-ev-written-soft" : "border-hairline bg-canvas hover:border-primary/40")}
            >
              <span className="block type-body-md font-bold text-ink [word-break:keep-all]">{x.label}</span>
              <span className="block tabular type-caption font-semibold text-primary-text">{x.amount}조</span>
            </button>
          ))}
        </div>
        <Down />
        <FlowBox k="firms" sel={sel} onSel={setSel} className="w-full" />
      </div>

      <Explain eyebrow={FLOW[sel].tag} title={FLOW[sel].title}>
        {FLOW[sel].text}
      </Explain>

      <Card>
        <CardTitle kind="fact">돈이 나가는 네 갈래 · {w.label}</CardTitle>
        <div className="mt-3 flex h-4 gap-0.5 overflow-hidden rounded-full">
          {WAYS.map((x, i) => (
            <span key={x.key} className={cn("h-full", i === way ? "bg-primary" : "bg-primary/25")} style={{ width: `${(x.amount / 150) * 100}%` }} />
          ))}
        </div>
        <p className="mt-1 tabular type-caption text-ink-mute">150조 중 {w.amount}조 ({Math.round((w.amount / 150) * 100)}%)</p>
        <p className="mt-3 type-body-md text-ink ko-justify">{w.text}</p>
        <p className="mt-2 rounded-xl bg-canvas-soft px-3.5 py-2.5 type-caption text-ink-secondary [word-break:keep-all]">예: {w.ex}</p>
      </Card>

      <TermBox
        term="모펀드 · 자펀드"
        def="큰 통(모펀드)에 넣은 돈을 여러 작은 통(자펀드)에 나눠 담고, 작은 통마다 운용사가 민간 돈을 더 모아 기업에 투자하는 구조예요."
        pic="통을 굴리는 사람이 운용사(GP), 통에 돈을 넣는 사람이 출자자(LP)예요. 국민성장펀드에서 기금은 주로 출자자 자리에 앉아요."
      />
      <Fold title="왜 굳이 운용사에 맡길까요?" defaultOpen>
        <P>저도 처음엔 이게 제일 궁금했어요. 산은이 직접 고르면 되지 않나 싶었거든요.</P>
        <P>이유는 세 가지예요. 기업 수천 곳을 한 기관이 다 찾아보고 고를 수 없어요. 운용사는 분야별로 딜을 찾고 심사하는 전문가예요. 그리고 운용사가 민간 돈을 더 모아 오면, 같은 기금으로 더 큰 통을 만들 수 있어요.</P>
        <Line kind="fact">
          실제로 산은은 2026년 10월 16일 딜사이트 M&amp;A 포럼에서, 블라인드 자펀드(어디에 투자할지 정하지 않고 먼저 돈을 모으는 통) 약 8조원을 만들고 있다고 밝혔어요. 146곳이 지원해 18곳이 뽑혔고(8.1대 1), 금융지주가 맞춰 넣는 비율은 30% 안팎에서 60% 이상으로 늘었다고 했어요.
        </Line>
        <P>
          제가 일하는 공제조합의 자산운용 이야기도 들은 적이 있어요. 제가 잘 아는 분야는 아니지만, 팀장님 말로는 증권사가 딜을 가져오면 몇 개를 추려 숫자를 보고 괜찮으면 투자한다고 해요. 큰돈을 굴리는 기관은 직접 찾아다니기보다 ‘골라서 맡기는’ 쪽이라는 뜻이에요. 국민성장펀드는 여기에 정책 목적과 공개 심사라는 단계가 더 붙어 있어요.
        </P>
      </Fold>

      <TermBox
        term="후순위"
        def="손실이 나면 누가 먼저 맞을지 정한 순서에서, 먼저 맞는 자리예요. 후순위가 다 맞은 뒤에야 선순위가 손실을 봐요."
        pic="정부 재정이 후순위에 들어간다 = 손실이 나면 세금이 먼저 맞는다. 그래서 민간이 덜 겁내고 들어와요."
      />
      <TermBox
        term="기금채"
        def="기금이 돈을 빌리려고 발행하는 채권이에요. 나라가 보증을 서 주면 국고채만큼 싸게 빌릴 수 있어요."
        pic="나라가 보증 서 준 차용증. 이자는 산은이 대고, 보증에는 국회 동의가 필요해요."
      />
      <TermBox
        term="마중물 (금융위가 쓰는 말)"
        def="정부 돈이 먼저 위험을 지면 민간 돈이 따라 들어온다는 논리예요."
        pic="펌프에서 물을 끌어 올리려고 먼저 붓는 한 바가지. 이 글에서는 ‘먼저 위험을 지는 돈’이라고 부를게요."
      />

      <Card>
        <CardTitle kind="fact">150조원에서 200조원으로</CardTitle>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[300px] border-collapse text-left type-caption">
            <thead>
              <tr className="border-b border-hairline text-ink-mute">
                <th className="py-2 pr-2 font-semibold">항목</th>
                <th className="py-2 pr-2 font-semibold">처음 (2025.9.10)</th>
                <th className="py-2 font-semibold">확대 발표 (2026.7.15)</th>
              </tr>
            </thead>
            <tbody className="text-ink">
              {[
                ["총규모 (5년)", "150조원", "200조원"],
                ["1년에 공급", "약 30조원", "약 40조원 (2027년부터)"],
                ["직접 지분투자", "연 최대 3조원", "연 최대 5조원"],
                ["새로 생기는 것", "—", "한국전략기술파트너스(KSTP) 최대 10조원"],
                ["지원 산업", "12개 첨단전략산업", "우주항공 등 추가 추진"],
              ].map((r) => (
                <tr key={r[0]} className="border-b border-hairline last:border-0">
                  <td className="py-2 pr-2 font-semibold text-ink-secondary [word-break:keep-all]">{r[0]}</td>
                  <td className="py-2 pr-2 tabular [word-break:keep-all]">{r[1]}</td>
                  <td className="py-2 tabular [word-break:keep-all]">{r[2]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 type-caption text-ink-mute [word-break:keep-all]">
          기금 75조 + 민간 75조, 네 갈래 15·35·50·50조는 처음 150조 설계도 기준이에요. 200조의 세부 배분은 아직 따로 나오지 않았어요.
        </p>
      </Card>

      <Fold title="12대 첨단전략산업은 뭐예요?">
        <Line kind="fact">2025년 8월 법이 통과될 때는 10개였어요. 같은 해 11월 18일 시행령이 국무회의를 통과하면서 2개가 더해져 12개가 됐어요.</Line>
        <div className="flex flex-wrap gap-1.5">
          {["인공지능", "반도체", "바이오", "백신", "방산", "로봇", "수소", "이차전지", "디스플레이", "미래차"].map((t) => (
            <span key={t} className="rounded-full bg-ev-written-soft px-3 py-1 type-caption font-semibold text-ink">
              {t}
            </span>
          ))}
          {["문화·콘텐츠", "핵심광물"].map((t) => (
            <span key={t} className="rounded-full bg-[#fff1e0] px-3 py-1 type-caption font-semibold text-ink">
              {t} · 시행령
            </span>
          ))}
        </div>
        <Line kind="outlook">우주항공 등을 더하는 시행령 개정은 2026년 7월 발표 뒤 추진 중이에요. 10월 국감 시점까지 확정되진 않았어요.</Line>
      </Fold>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 3. 산은의 역할 — 그릇 · 사무국 · 당사자                                  */
/* ------------------------------------------------------------------ */

const ROLES = [
  {
    key: "bowl",
    label: "그릇",
    head: "기금이 산은 안에 있어요",
    text: "2025년 8월 27일 국회를 통과한 산업은행법 개정안이 첨단전략산업기금을 산은 안에 두게 했어요. 같은 법으로 정부가 산은에 넣을 수 있는 자본금 한도(수권자본금)도 30조원에서 45조원으로 올렸어요. 11년 만의 증액이에요.",
  },
  {
    key: "office",
    label: "사무국",
    head: "들어온 사업을 먼저 검토하고 집행해요",
    text: "산은은 기금의 사무국이에요. 투자·대출 신청을 먼저 검토(예비심사)하고, 승인된 건의 돈을 내보내고 관리해요. 2025년 12월 ‘국민성장펀드부문’을 새로 만들었어요.",
  },
  {
    key: "party",
    label: "당사자",
    head: "비용을 대고, 자기 돈도 넣어요",
    text: "기금채 이자 같은 비용은 산은이 내요. 산은 자체로도 ‘국민성장 프로그램’ 5년 25조원(기금 특별자금 10조원 포함)과 ‘혁신성장 프로그램’ 5년 100조원을 꾸렸어요. 단순한 집행 창구가 아니라 손익이 걸린 당사자예요.",
  },
];

const STEPS = [
  {
    key: "office",
    who: "사무국 (산은)",
    what: "실무 검토 · 예비심사",
    text: "신청이 들어오면 산은이 먼저 서류와 사업성을 봐요. 여기서 걸러지는 건이 많아요.",
    issue: "김형연 의원(조국혁신당)은 산은이 낸 관리 목록 268건 중 정식 신청서 접수는 45건이었다며, 예비심사 기준이 공개되지 않은 점을 문제 삼았어요.",
  },
  {
    key: "panel",
    who: "투자심의위원회",
    what: "민간 전문가 심의",
    text: "민간 전문가들이 투자할 만한지 따져요. 이해관계가 있는 위원은 빠져야 해요(제척).",
    issue: "일부 위원이 반대한 건(업스테이지·퓨리오사AI)도 다음 단계로 넘어갔다는 지적이 국민의힘 박준태·송언석 의원에게서 나왔어요.",
  },
  {
    key: "board",
    who: "기금운용심의회",
    what: "최종 의결",
    text: "마지막으로 투자·대출을 확정해요. 여기서 의결되면 돈이 나가요.",
    issue: "박준태 의원(국민의힘)은 8월까지 상정된 30건 정도가 모두 승인됐고, 그중 7건은 위원 이해관계로 제척·회피가 있었다고 지적했어요.",
  },
];

function KdbRoles() {
  const [role, setRole] = useState(0);
  const [step, setStep] = useState(0);
  const r = ROLES[role];
  const s = STEPS[step];
  return (
    <div className="space-y-5">
      <P>제가 제일 헷갈렸던 대목이에요. 산은이 심사하는 줄 알았는데 최종 결정은 다른 위원회가 하더라고요. 산은의 자리는 세 가지로 나눠 보면 정리돼요.</P>
      <TryHint>세 역할을 눌러 보세요</TryHint>
      <div className="grid grid-cols-3 gap-2">
        {ROLES.map((x, i) => (
          <button
            key={x.key}
            type="button"
            onClick={() => setRole(i)}
            aria-pressed={role === i}
            className={cn(
              "flex min-h-20 flex-col items-center justify-center gap-1 rounded-2xl border-2 px-2 py-3",
              anim,
              role === i ? "border-brand-dark bg-brand-dark text-on-primary shadow-level-2" : "border-hairline bg-canvas text-ink hover:border-brand-dark/40",
            )}
          >
            <Landmark className="h-5 w-5" strokeWidth={2} />
            <span className="type-heading-sm">{x.label}</span>
          </button>
        ))}
      </div>
      <Explain eyebrow={`산은의 역할 ${role + 1} · ${r.label}`} title={r.head}>
        {r.text}
      </Explain>
      <TermBox term="수권자본금" def="정부가 산은에 넣을 수 있는 자본금의 상한이에요." pic="30조에서 45조로 올린 건, 앞으로 산은에 돈을 더 넣을 수 있게 길을 미리 열어 둔 거예요." />

      <Card>
        <CardTitle kind="fact">국민성장펀드부문은 어떻게 생겼나</CardTitle>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {["총괄사무국", "대출운용국", "투자운용국", "심사지원국"].map((t) => (
            <span key={t} className="rounded-xl bg-ev-written-soft px-3 py-2.5 text-center type-body-md font-semibold text-ink">
              {t}
            </span>
          ))}
        </div>
        <p className="mt-3 type-body-md text-ink-secondary ko-justify">2025년 12월 9일 부문이 생겼고, 신혜숙 부행장이 부문장을 맡았어요. 2026년 6월 한 언론 보도에 따르면 15개 팀, 인력은 54명에서 75명으로 늘었어요.</p>
      </Card>

      <div className="space-y-3">
        <p className="type-heading-sm text-ink">심사는 세 단계예요</p>
        <TryHint>단계를 눌러 보세요</TryHint>
        <div className="rounded-3xl bg-canvas p-3 shadow-level-2 sm:p-5">
          <div className="rounded-2xl border border-dashed border-ink/20 px-3 py-2.5 text-center">
            <p className="type-caption font-semibold text-ink-secondary">전략위원회 (자문)</p>
            <p className="text-[11px] text-ink-mute [word-break:keep-all]">금융위원장과 민간 위원장이 함께 이끄는 약 20명. 메가프로젝트 방향을 내놓지만 개별 투자는 정하지 않아요.</p>
          </div>
          <Down />
          <ol className="grid gap-2 sm:grid-cols-3">
            {STEPS.map((x, i) => (
              <li key={x.key} className="flex items-center gap-2 sm:flex-col sm:items-stretch">
                <button
                  type="button"
                  onClick={() => setStep(i)}
                  aria-pressed={step === i}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-2xl border-2 px-3 py-3 text-left sm:flex-col sm:items-center sm:text-center",
                    anim,
                    step === i ? "border-brand-dark bg-brand-dark text-on-primary shadow-level-2" : "border-hairline bg-canvas text-ink hover:border-brand-dark/40",
                  )}
                >
                  <span className={cn("inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full tabular type-caption font-bold", step === i ? "bg-on-primary text-brand-dark" : "bg-canvas-soft text-ink-secondary")}>{i + 1}</span>
                  <span>
                    <span className="block type-body-md font-bold [word-break:keep-all]">{x.who}</span>
                    <span className={cn("block type-caption", step === i ? "text-on-primary/75" : "text-ink-mute")}>{x.what}</span>
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </div>
        <Explain eyebrow={`${step + 1}단계 · ${s.what}`} title={s.who}>
          <p>{s.text}</p>
          <div className="mt-3">
            <Line kind="view">{s.issue}</Line>
          </div>
        </Explain>
        <TermBox
          term="메가프로젝트"
          def="정부가 골라 국민성장펀드가 집중해서 돈을 대는 대형 사업이에요."
          pic="1차 7건(2025년 12월 후보 발표): K-엔비디아 육성, 국가 AI컴퓨팅센터, 신안우이 해상풍력, AI반도체 파운드리, 반도체 에너지인프라, 이차전지 소재공장, 차세대 전력반도체. 2차 6건(2026년 4월 14일): 차세대 바이오·백신, OLED, 미래모빌리티·방산, 소버린 AI, 에너지 인프라, 새만금 첨단벨트."
        />
      </div>

      <Card>
        <CardTitle>산은이 떠안는 것</CardTitle>
        <div className="mt-3 space-y-2.5">
          <Line kind="fact">기금채를 찍으면 이자가 나가요. 이 비용은 산은이 출연해서 내요.</Line>
          <Line kind="kdb">
            박상진 산은 회장은 10월 8일 국감에서, 150조 공급 계획에 드는 산은 비용을 “정확하게 산출하지는 못했다”면서 약 2조원으로 추산했어요(이강일 의원 질의). 정부가 1년에 넣는 재정 1조원의 두 배 크기예요.
          </Line>
        </div>
      </Card>

      <SoFar
        items={[
          "국민성장펀드는 첨단산업에 5년간 돈을 대는 정책 펀드예요. 150조로 시작해 200조로 커졌어요.",
          "절반은 산은 안의 첨단전략산업기금이에요. 나라가 보증 선 기금채로 싸게 빌리고, 정부 재정이 손실을 먼저 맞는 자리에 서요.",
          "산은은 그릇이자 사무국이고, 비용(약 2조원 추산)을 대는 당사자예요. 최종 승인은 기금운용심의회가 해요.",
        ]}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 4. 10개월 — 타임라인 · 승인 현황                                       */
/* ------------------------------------------------------------------ */

type TLKind = "law" | "deal" | "people" | "assembly";

const TL_KIND: Record<TLKind, string> = { law: "법·제도", deal: "투자·승인", people: "국민참여형", assembly: "국회·예산" };

const TIMELINE: { at: string; kind: TLKind; text: string }[] = [
  { at: "2025.3.5", kind: "law", text: "정부, 첨단전략산업기금 신설 방안 발표 (5년간 최대 50조원)" },
  { at: "2025.3.28", kind: "law", text: "산업은행법 개정안 발의 — 정무위 여야 간사(강준현·강민국 의원)가 함께" },
  { at: "2025.8.27", kind: "law", text: "개정안 국회 본회의 통과. 기금을 산은 안에 두고, 수권자본금 30조→45조" },
  { at: "2025.9.10", kind: "law", text: "국민보고대회에서 ‘150조원 국민성장펀드’ 발표" },
  { at: "2025.11.18", kind: "law", text: "시행령 국무회의 통과 — 지원 산업에 문화·콘텐츠, 핵심광물 추가 (12개)" },
  { at: "2025.12.9~11", kind: "law", text: "산은 국민성장펀드부문 신설 → 법 시행(12.10) → 출범식·1차 전략위원회(12.11)" },
  { at: "2025.12.19", kind: "deal", text: "1차 메가프로젝트 후보 7건 발표 (대통령 업무보고)" },
  { at: "2026.1.29", kind: "deal", text: "1호 투자 의결: 신안우이 해상풍력 장기대출 7,500억원 (390MW, 약 36만 가구 전기)" },
  { at: "2026.4.14", kind: "deal", text: "2차 전략위원회, 2차 메가프로젝트 6건 제시" },
  { at: "2026.5.22~29", kind: "people", text: "국민참여형 1차 6,000억원 — 첫날 87.1% 팔리고 5월 29일 완판, 3만258명 가입" },
  { at: "2026.5.27", kind: "deal", text: "1차 정책성펀드 운용사 12곳 확정 (11개 자리에 81곳 지원)" },
  { at: "2026.5.28", kind: "deal", text: "5건 승인: 퓨리오사AI·SK바이오사이언스·스마일게이트·엘앤에프플러스·근우. 누적 16건 12.5조원" },
  { at: "2026.7.15", kind: "law", text: "금융위 업무보고: 200조원으로 확대, 2027년부터 연 약 40조원" },
  { at: "2026.8.12", kind: "assembly", text: "금융위, 2027년 기금채 국가보증 최대 18조원 의견 의결 → 재정경제부·국무회의·국회 동의 절차로" },
  { at: "2026.9.1", kind: "assembly", text: "2027년 예산안에 국민성장펀드 재정 1조원" },
  { at: "2026.9.30~10.15", kind: "people", text: "국민참여형 2차 모집 5,198억원 — 목표의 86.6%, 802억원 미달" },
  { at: "2026.10.8", kind: "assembly", text: "국회 정무위 국정감사 (금융위·산은·기은) — 산은 질의 대부분이 국민성장펀드" },
  { at: "2026.10.16", kind: "deal", text: "산은, 블라인드 자펀드 약 8조원 결성 중 (146곳 지원, 18곳 선정)" },
];

function Timeline() {
  const [filter, setFilter] = useState<TLKind | "all">("all");
  const list = TIMELINE.filter((e) => filter === "all" || e.kind === filter);
  return (
    <div className="space-y-4">
      <TryHint>종류를 골라 보세요</TryHint>
      <Tabs
        label="사건 종류"
        value={filter}
        onChange={setFilter}
        items={[{ key: "all", label: "전체" }, ...(Object.keys(TL_KIND) as TLKind[]).map((k) => ({ key: k, label: TL_KIND[k] }))]}
      />
      <ol className="relative space-y-2 pl-5 before:absolute before:top-2 before:bottom-2 before:left-[7px] before:w-0.5 before:bg-primary/20">
        {list.map((e) => (
          <li key={e.at + e.text} className="relative motion-safe:animate-[kk-fade-in_.3s_ease-out]">
            <span aria-hidden className="absolute top-4 -left-5 h-3.5 w-3.5 rounded-full border-2 border-canvas bg-primary" />
            <div className="rounded-xl bg-canvas px-4 py-3 shadow-level-1">
              <p className="flex flex-wrap items-center gap-2">
                <span className="tabular type-caption font-bold text-primary-text">{e.at}</span>
                <span className="rounded-full bg-canvas-soft px-2 py-0.5 text-[11px] font-semibold text-ink-secondary">{TL_KIND[e.kind]}</span>
              </p>
              <p className="mt-1 type-body-md text-ink [word-break:keep-all]">{e.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

const BARS = {
  field: {
    label: "분야",
    rows: [
      ["인프라", 42.9],
      ["반도체", 26.4],
      ["디스플레이", 8.3],
      ["AI", 6.3],
      ["바이오·백신", 5.0],
      ["이차전지", 4.8],
    ],
  },
  size: {
    label: "기업 규모",
    rows: [
      ["대기업", 60.6],
      ["중견기업", 27.5],
      ["중소기업", 11.9],
    ],
  },
  region: {
    label: "지역",
    rows: [
      ["수도권", 55.4],
      ["호남", 28.7],
      ["영남", 7.9],
      ["충청", 7.5],
    ],
  },
} as const;

type BarKey = keyof typeof BARS;

function ApprovalBars() {
  const [k, setK] = useState<BarKey>("field");
  const b = BARS[k];
  return (
    <Card>
      <CardTitle kind="fact">9월 말까지 어디로 갔나</CardTitle>
      <p className="mt-1 type-caption text-ink-mute [word-break:keep-all]">승인 35건, 약 18조원의 비중 · 한민수 의원실(더불어민주당)이 받은 산은 자료</p>
      <div className="mt-3">
        <Tabs label="나눠 보기" value={k} onChange={setK} items={(Object.keys(BARS) as BarKey[]).map((x) => ({ key: x, label: BARS[x].label }))} />
      </div>
      <ul key={k} className="mt-4 space-y-2.5">
        {b.rows.map(([name, v], i) => (
          <li key={name} className="grid grid-cols-[5.5rem_1fr_3rem] items-center gap-2">
            <span className="type-body-md font-semibold text-ink [word-break:keep-all]">{name}</span>
            <span className="h-5 overflow-hidden rounded-r-md bg-canvas-soft">
              <span className={cn("block h-full rounded-r-[4px] motion-safe:animate-[kk-fade-in_.4s_ease-out_both]", i === 0 ? "bg-primary" : "bg-primary/45")} style={{ width: `${v}%`, animationDelay: `${i * 60}ms` }} />
            </span>
            <span className="text-right tabular type-body-md font-semibold text-ink">{v.toFixed(1)}%</span>
          </li>
        ))}
      </ul>
      {k === "field" && <p className="mt-2 type-caption text-ink-mute">AI와 반도체를 합치면 32.7%예요. 나머지는 기타 분야예요.</p>}
      <div className="mt-4 rounded-xl bg-canvas-soft px-4 py-3">
        <p className="flex items-baseline justify-between type-body-md font-semibold text-ink">
          집행률 <span className="tabular">25.4%</span>
        </p>
        <span className="mt-2 block h-2.5 overflow-hidden rounded-full bg-canvas">
          <span className="block h-full rounded-full bg-[#ffb36b]" style={{ width: "25.4%" }} />
        </span>
        <p className="mt-2 type-caption text-ink-secondary [word-break:keep-all]">승인한 100원 중 실제로 나간 돈이 25원 남짓이라는 뜻이에요 (승인 18조328억원 중 4조5,784억원).</p>
      </div>
      <p className="mt-3 type-caption text-ink-mute [word-break:keep-all]">
        ※ 총액은 집계 기준에 따라 달라요. 금융위는 1~9월 승인·결성 기준 18.9조원, 위 자료는 국민참여형·K-콘텐츠펀드를 뺀 18조328억원이에요. 같은 국감에서 송언석 의원(국민의힘)은 대기업 86%·중소 2%를, 박민규 의원(더불어민주당)은 반도체·AI 32.9%를 다른 기준으로 제시했어요.
      </p>
    </Card>
  );
}

function TenMonths() {
  return (
    <div className="space-y-5">
      <P>법이 만들어진 2025년부터 국감이 열린 2026년 10월까지예요. 기금이 실제로 돌기 시작한 건 2025년 12월이라, 굴러간 지 10개월 남짓이에요.</P>
      <Timeline />
      <ApprovalBars />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 5. 국감 쟁점 — 비판과 반론                                            */
/* ------------------------------------------------------------------ */

const ISSUES: { key: string; label: string; q: string; con: [Kind, string][]; pro: [Kind, string][]; sum: string }[] = [
  {
    key: "tilt",
    label: "쏠림",
    q: "대기업·수도권·반도체로 몰리나?",
    con: [
      ["view", "한민수 의원(더불어민주당)이 받은 산은 자료로 보면 대기업 60.6%, 수도권 55.4%, AI·반도체 32.7%예요."],
      ["view", "송언석 의원(국민의힘)은 대기업 86%·중소 2%라는 숫자를 들며, 경북이 산은 남부권 관할에서 빠진 이유를 물었어요."],
    ],
    pro: [
      ["view", "이억원 금융위원장은 “지방은 40% 이상으로 계속 늘려 가려고” 한다고 답했어요. 호남 비중 28.7%는 신안우이 해상풍력 영향이라고 설명했어요."],
      ["kdb", "박상진 산은 회장은 남부권 관할을 조정할 필요성에 공감한다고 답했어요."],
      ["view", "가장 큰 몫인 인프라(42.9%)는 발전소·전력망처럼 지역에 깔리는 시설이에요."],
    ],
    sum: "첨단산업이 원래 수도권 대기업에 몰려 있는 ‘구조’와, 지방 40%라는 ‘목표’ 사이의 거리가 핵심이에요.",
  },
  {
    key: "review",
    label: "심사",
    q: "30건 다 통과면 심사가 맞나?",
    con: [
      ["view", "박준태 의원(국민의힘)은 8월까지 상정된 30건 정도가 모두 승인돼 “사실상 추인 역할”이었다고 지적했어요. 그중 7건은 위원 이해관계로 제척·회피가 있었어요."],
      ["view", "퓨리오사AI 건은 “민간투자가 확정되기 전 정부가 3,700억원 투자를 결정”했다는 지적이 나왔어요. 의원 질의에서는 대통령이 방문했던 기업이라는 점도 거론됐어요."],
      ["view", "김형연 의원(조국혁신당)은 예비심사 기준이 공개되지 않았다고, 조정훈 의원(국민의힘)은 정성평가가 정량평가를 뒤집을 수 있는 구조를 문제 삼았어요."],
    ],
    pro: [
      ["view", "이억원 금융위원장은 별도 투자심의위원회와 이해관계자 제척 절차를 두고, 의사록 작성과 보도자료로 공개한다고 답했어요."],
      ["view", "퓨리오사AI에 대해서도 이 위원장은 투심위 “전체가 아니라 일부 위원”이 반대했고, “민간 투자가 거의 마무리되고 일부만 남은 상태”였다고 설명했어요."],
      ["kdb", "박상진 산은 회장은 운용사 선정에 “개입하지 않는다”며, 더 투명하고 객관적으로 운영할 방안을 보겠다고 했어요."],
    ],
    sum: "예비심사에서 미리 거르면 본심사 통과율은 높아져요. 그래서 승인율 숫자보다, 어느 단계에서 무엇을 걸렀는지가 공개되느냐가 관건이에요.",
  },
  {
    key: "loss",
    label: "손실",
    q: "잘못되면 누가 얼마나 물어내나?",
    con: [
      ["fact", "구조상 손실이 나면 후순위에 선 정부 재정과 기금이 먼저 맞아요."],
      ["view", "이강일 의원(더불어민주당)은 산은이 지는 부담을 집중해서 물었어요. 정책 비용과 투자 손실이 섞이면 산은이 떠안고, 결국 정부가 산은에 돈을 더 넣어야 할 수 있다는 우려도 함께 보도됐어요."],
      ["view", "기금채에 서는 나라의 보증은 국회 동의가 필요한 일이에요. 손실이 현실이 되면 결국 국민 부담이 될 수 있다는 지적이에요."],
    ],
    pro: [
      ["view", "이억원 금융위원장: “민간자금만으로는 잘 안 움직이니까 정부가 마중물이 돼서…” — 정부 돈이 먼저 위험을 지는 건 설계상 의도라는 설명이에요."],
      ["kdb", "박상진 산은 회장은 정책 수행 비용과 투자 손실은 구분할 수 있다고 답했어요."],
    ],
    sum: "손실이 날지 말지가 아니라, 얼마까지·누가·어떻게 장부에 드러나는지가 논쟁의 진짜 대상이에요.",
  },
  {
    key: "market",
    label: "시장 왜곡",
    q: "민간 돈을 밀어내나, 끌어오나?",
    con: [
      ["view", "인베스트조선(2026년 4월)은 메자닌(대출과 주식의 중간, 전환사채 등)을 사실상 배제하고 상환권 없는 주식 투자만 강제한다는 업계 불만을 전했어요."],
      ["view", "헤럴드경제(2026년 7월)는 국민성장펀드가 모험자본의 ‘블랙홀’이 되는지 물었어요."],
      ["view", "김대종 세종대 교수는 “한국은 회수 시장이 취약해 출구가 막히는 구조적 문제가 있다”고 지적했어요."],
    ],
    pro: [
      ["kdb", "이인범 산은 정책펀드기획팀장은 10월 16일 포럼에서 “기존에 있던 시장 자금을 뺏어오는 역할을 한 건 아니”고 “새로운 자금을 만들어냈다”고 했어요. 금융지주가 맞춰 넣는 비율이 30% 안팎에서 60% 이상으로 늘었다는 걸 근거로 들었어요."],
      ["view", "산은도 메자닌 허용을 고민 중이라는 보도가 있었어요(확정 아님)."],
    ],
    sum: "늘어난 민간 돈이 ‘새로 생긴 돈’인지 ‘다른 데서 옮겨 온 돈’인지는 데이터로 확인해야 해요. 아직은 어느 쪽도 단정하기 어려워요.",
  },
];

function Debates() {
  const [sel, setSel] = useState(0);
  const it = ISSUES[sel];
  return (
    <div className="space-y-5">
      <Line kind="fact">2026년 10월 8일 정무위원회 국정감사는 금융위·산은·기은을 함께 불렀어요. 자정까지 이어진 질의에서 산은에 대한 질문 대부분이 국민성장펀드였다고 한국금융신문은 전했어요.</Line>
      <TermBox term="국정감사" def="매년 가을 국회가 정부와 공공기관의 일을 따져 묻는 자리예요." pic="산은은 정무위원회 소관이에요. 그래서 산은 면접 직전에 관련 기사가 쏟아져요." />
      <TryHint>쟁점을 골라 보세요</TryHint>
      <Tabs label="국감 쟁점" value={it.key} onChange={(k) => setSel(ISSUES.findIndex((x) => x.key === k))} items={ISSUES.map((x) => ({ key: x.key, label: x.label }))} />
      <div key={it.key} className="space-y-3 motion-safe:animate-[kk-fade-in_.3s_ease-out]">
        <p className="type-heading-md text-ink [word-break:keep-all]">{it.q}</p>
        <div className="grid gap-3 lg:grid-cols-2">
          <Card className="border-l-4 border-[#ff8aa0]">
            <p className="type-caption font-bold text-[#c2264a]">비판</p>
            <div className="mt-2 space-y-2">
              {it.con.map(([k, t]) => (
                <Line key={t} kind={k}>
                  {t}
                </Line>
              ))}
            </div>
          </Card>
          <Card className="border-l-4 border-primary">
            <p className="type-caption font-bold text-primary-text">반론</p>
            <div className="mt-2 space-y-2">
              {it.pro.map(([k, t]) => (
                <Line key={t} kind={k}>
                  {t}
                </Line>
              ))}
            </div>
          </Card>
        </div>
        <div className="flex items-start gap-3 rounded-2xl bg-canvas-cream px-5 py-4">
          <Scale className="mt-0.5 h-5 w-5 shrink-0 text-primary" strokeWidth={2} />
          <p className="type-body-md font-semibold text-ink ko-justify">
            <span className="mr-1.5 align-middle">
              <Tag kind="view" />
            </span>
            {it.sum}
          </p>
        </div>
      </div>
      {it.key === "market" && (
        <TermBox
          term="구축효과 · 밸류에이션"
          def="구축효과는 정부 돈이 들어오면서 민간 돈이 밀려나는 현상이에요. 밸류에이션은 기업의 몸값이에요."
          pic="인기 식당에 단체 예약이 잡히면 원래 손님이 앉을 자리가 없어지는 것. 같은 분야에 정책 돈이 몰리면 몸값만 오를 수 있다는 걱정도 같은 뿌리예요."
        />
      )}
      <SoFar
        items={[
          "국감 쟁점은 넷이에요: 대기업·수도권 쏠림, 심사 공정성, 손실 부담, 민간 시장 왜곡.",
          "어느 쟁점이든 비판과 반론에 모두 근거가 있어요. 한쪽만 쓰면 논술에서 약해요.",
          "산은은 투명성 개선, 비용과 손실의 구분, ‘새 자금 창출’로 답하고 있어요.",
        ]}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 6. 관제펀드 전례 — 이번엔 다를까                                       */
/* ------------------------------------------------------------------ */

const PRECEDENTS = [
  { name: "녹색성장펀드", year: "2009", what: "출시 2년 수익률 -37.10%. 설정액 3,230억원이 1,174억원으로 줄었어요 (뉴스핌, 2013)." },
  { name: "유전펀드 (한국패러랠)", year: "2013", what: "4,000억원 규모. 공모가 5,000원이 2017년 1월 2,605원이 됐고, 누적 수익률은 약 -30%였어요 (뉴스핌, 2017)." },
  { name: "선박펀드", year: "2004~", what: "코리아퍼시픽 05·06·07호가 2013년 4월 상장폐지됐어요. 세 펀드 순손실은 245억원이었어요 (서울신문, 2013)." },
  { name: "통일펀드", year: "2014", what: "20여 개가 나왔어요. 초기 약 22% 수익률은 삼성전자 등을 담은 덕이라는 ‘착시’ 평가가 있었어요(매경). 2016년 개성공단 폐쇄 뒤 돈이 빠져 대부분 청산됐어요(한경)." },
  {
    name: "뉴딜펀드 국민참여형",
    year: "2021",
    what: "만기 청산된 10개의 수익률(IRR) 평균은 2.14%였어요(금융위 국회 제출 자료). 자펀드 17개 중 8개가 마이너스였고, 손실 205억8,800만원 중 139억3,000만원을 재정이 부담했어요(박준태 의원실, 산은 자료). 산은은 “국민이 입은 손실은 없다”고 반박했어요.",
  },
];

function Precedents() {
  const [side, setSide] = useState<"diff" | "same">("diff");
  return (
    <div className="space-y-5">
      <P>정권마다 ‘나라가 미는 펀드’가 있었어요. 언론은 이런 펀드를 “관제펀드”라고 불러요. 결과는 대체로 좋지 않았어요.</P>
      <Card>
        <CardTitle kind="fact">역대 정부 테마 펀드</CardTitle>
        <ul className="mt-3 divide-y divide-hairline">
          {PRECEDENTS.map((p) => (
            <li key={p.name} className="py-3 first:pt-0 last:pb-0">
              <p className="flex items-baseline justify-between gap-2">
                <span className="type-body-md font-bold text-ink">{p.name}</span>
                <span className="tabular type-caption font-semibold text-ink-mute">{p.year}</span>
              </p>
              <p className="mt-1 type-body-md text-ink-secondary ko-justify">{p.what}</p>
            </li>
          ))}
        </ul>
      </Card>

      <TryHint>이번엔 다를까요? 양쪽을 눌러 보세요</TryHint>
      <Tabs
        label="이번엔 다를까"
        value={side}
        onChange={setSide}
        items={[
          { key: "diff", label: "다르다는 근거" },
          { key: "same", label: "같다는 우려" },
        ]}
      />
      <Card key={side} className="motion-safe:animate-[kk-fade-in_.3s_ease-out]">
        <div className="space-y-2.5">
          {side === "diff" ? (
            <>
              <Line kind="fact">이번엔 법(산업은행법 개정)으로 기금을 만들었어요. 법안은 정무위 여야 간사가 함께 발의했어요.</Line>
              <Line kind="fact">임시 조직이 아니라 산은 안에 상설 ‘부문’을 뒀어요.</Line>
              <Line kind="fact">특정 테마 하나가 아니라 12개 산업 전반이 대상이에요. 손실을 먼저 맞는 후순위 구조와 세제 혜택도 처음부터 설계에 들어 있어요.</Line>
            </>
          ) : (
            <>
              <Line kind="view">5년짜리 계획은 다음 정부를 거쳐야 해요. 정권이 바뀌면 관심이 식은 전례가 반복됐어요.</Line>
              <Line kind="view">김대종 세종대 교수의 지적처럼 회수 시장이 약하면, 들어간 돈이 나올 길이 좁아요.</Line>
              <Line kind="view">뉴딜펀드 국민참여형도 후순위 구조가 있었지만 자펀드 절반 가까이가 마이너스였어요.</Line>
            </>
          )}
        </div>
      </Card>

      <Card>
        <CardTitle>국민참여형: 1차 완판, 2차 86.6%의 미스터리</CardTitle>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-ev-written-soft px-3 py-3 text-center">
            <p className="type-caption text-ink-secondary">1차 (2026.5)</p>
            <p className="tabular type-heading-md font-bold text-ink">완판</p>
            <p className="type-caption text-ink-secondary">6,000억 · 첫날 87.1%</p>
          </div>
          <div className="rounded-xl bg-[#fff1e0] px-3 py-3 text-center">
            <p className="type-caption text-ink-secondary">2차 (2026.9~10)</p>
            <p className="tabular type-heading-md font-bold text-ink">86.6%</p>
            <p className="type-caption text-ink-secondary">5,198억 · 802억 미달</p>
          </div>
        </div>
        <p className="mt-3 type-body-md text-ink-secondary ko-justify">반년 만에 분위기가 바뀌었어요. 이유로는 세 가지가 거론돼요. 하나로 단정하긴 어려워요.</p>
        <div className="mt-2 space-y-2">
          <Line kind="view">1차 펀드의 초기 수익률: 9월 29일 기준 약 0.65%, 10월 6일 기준 1.40%로 보도됐어요. 데일리안은 이걸 2차 부진의 원인으로 들었고, 금융위는 “초기 수익률은 큰 의미가 없다”고 설명했어요.</Line>
          <Line kind="view">시장 분위기: MTN은 그사이 코스피 하락을 원인으로 들었어요.</Line>
          <Line kind="fact">상품 구조: 5년 동안 중도에 돈을 뺄 수 없어요. 대신 투자금 구간별 소득공제(40·20·10%, 최대 1,800만원)와 배당 분리과세(9.9%) 혜택이 있어요. 손실이 나면 정부 재정이 먼저 맞는 몫도 있어요(2차 개별 펀드 기준 18.8~23.3%).</Line>
        </div>
        <p className="mt-3 rounded-xl bg-canvas-soft px-3.5 py-2.5 type-caption text-ink-secondary [word-break:keep-all]">
          국민참여형은 두 번을 합쳐도 약 1.1조원으로, 200조원의 1%가 안 돼요. ‘펀드 전체의 실패’로 읽기엔 작고, 여론의 온도계로는 의미가 있어요. 상품 가입 여부는 각자의 판단이에요.
        </p>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 7. 산은의 시각                                                        */
/* ------------------------------------------------------------------ */

const PRESSURES = [
  { key: "speed", label: "속도 vs 심사", text: "정부는 빨리 집행하길 원하고(집행률 25.4%가 국감에서 지적됐어요), 국회는 꼼꼼한 심사를 요구해요(30건 전부 승인 비판). 산은은 두 요구를 동시에 받아요." },
  { key: "region", label: "대기업 vs 지역", text: "첨단산업은 구조적으로 수도권 대기업에 몰려 있어요. 지방 40%라는 정부 목표와 수도권 55.4%라는 현실 사이를 메우는 게 숙제예요. 산은은 2026년 7월 광주에 KDB NextONE을 열었고, 대구·전주는 하반기, 충청 Next Hub는 2029년 하반기 준공이 목표예요." },
  { key: "people", label: "사람", text: "직접 지분투자를 연 최대 5조원까지 늘리면, 그걸 심사하고 관리할 사람이 함께 늘어야 해요. 부문 인력이 어디까지 커질지가 지켜볼 지점이에요." },
  { key: "cycle", label: "정권 주기", text: "5년짜리 계획은 다음 정부를 거쳐요. 법으로 만든 기금이고, 여야 간사가 함께 발의했다는 점은 산은 입장에서 안전장치예요." },
];

function KdbView() {
  const [p, setP] = useState(0);
  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-2">
        <Said who="박상진 산은 회장" where="2026년 1월 2일 시무식">
          “바로 지금이 … 진짜 성장을 위한 … 골든타임”, “단기간의 성과보다 미래 20년을 내다보는 안목”
        </Said>
        <Said who="박상진 산은 회장" where="2026년 1월 2일 시무식">
          “산은의 수익성은 … 정책금융을 흔들림 없이 지속하는 데 필요한 기초체력”
        </Said>
        <Said who="박상진 산은 회장" where="2026년 10월 8일 국감 (박민규 의원 질의)">
          “국민성장펀드가 3~4년 후에는 피지컬 AI 쪽으로 빨리 전환되기를 강하게 희망”
        </Said>
        <Said who="이인범 산은 정책펀드기획팀장" where="2026년 10월 16일 딜사이트 M&amp;A 포럼">
          “기존에 있던 시장 자금을 뺏어오는 역할을 한 건 아니” — “새로운 자금을 만들어냈다”
        </Said>
      </div>
      <Line kind="kdb">같은 시무식에서 박 회장은 올해 목표 가운데 하나로 ‘국민성장펀드와의 협업을 통한 첨단전략산업 지원 효과 극대화’를 꼽았어요. 정책 수행과 수익성, 두 축을 함께 말한 셈이에요.</Line>

      <Card>
        <CardTitle kind="view">간판이 바뀌고 있어요</CardTitle>
        <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-center">
          <div className="rounded-xl bg-canvas-soft px-3 py-3">
            <p className="type-caption text-ink-mute">외환위기 이후의 기억</p>
            <p className="mt-1 type-body-md font-bold text-ink [word-break:keep-all]">쓰러진 회사를 살리는 은행</p>
            <p className="mt-1 text-[11px] text-ink-mute [word-break:keep-all]">대우조선·쌍용차·HMM·아시아나 구조조정</p>
          </div>
          <ArrowRight className="h-5 w-5 text-primary" strokeWidth={2.4} />
          <div className="rounded-xl bg-brand-dark px-3 py-3 text-on-primary">
            <p className="type-caption text-on-primary/70">국민성장펀드 이후</p>
            <p className="mt-1 type-body-md font-bold [word-break:keep-all]">쓰러지기 전에 키우는 은행</p>
            <p className="mt-1 text-[11px] text-on-primary/70 [word-break:keep-all]">첨단산업 성장금융</p>
          </div>
        </div>
        <p className="mt-3 type-body-md text-ink-secondary ko-justify">금콩의 해석이에요. 면접에서 산은의 정체성을 물으면, 이 이동을 말할 수 있는 사람이 “알고 쓴다”는 인상을 줘요.</p>
      </Card>

      <Card>
        <CardTitle kind="view">수익성과 공공성의 고리</CardTitle>
        <ol className="mt-3 flex flex-wrap items-center gap-1.5 type-caption font-semibold text-ink">
          {["정책 투자에서 손실", "자기자본 감소", "BIS 비율 하락", "정부 출자 필요"].map((t, i) => (
            <li key={t} className="flex items-center gap-1.5">
              <span className="rounded-lg bg-ev-written-soft px-2.5 py-1.5">{t}</span>
              {i < 3 && <ArrowRight className="h-3.5 w-3.5 text-ink-mute" strokeWidth={2.2} />}
            </li>
          ))}
        </ol>
        <p className="mt-3 type-body-md text-ink-secondary ko-justify">
          BIS 비율은 국제결제은행(BIS) 기준의 자기자본비율이에요. 은행이 위험한 자산에 비해 자기 돈을 얼마나 가졌는지 보는 숫자예요. 수권자본금을 45조원으로 올린 것도 이 고리에 대비한 장치로 읽혀요. 실제로 한 합격자는 산은 서류에 “생산적금융이랑 BIS 자기자본비율 관리”로 썼다고 했어요.
        </p>
      </Card>

      <div className="space-y-3">
        <p className="type-heading-sm text-ink">산은이 동시에 받는 압력</p>
        <TryHint>하나씩 눌러 보세요</TryHint>
        <Tabs label="산은이 받는 압력" value={PRESSURES[p].key} onChange={(k) => setP(PRESSURES.findIndex((x) => x.key === k))} items={PRESSURES.map((x) => ({ key: x.key, label: x.label }))} />
        <Explain eyebrow="금콩의 해석" title={PRESSURES[p].label}>
          {PRESSURES[p].text}
        </Explain>
      </div>

      <Card>
        <CardTitle kind="view">“왜 산은이어야 하나요?”에 대한 산은의 논리</CardTitle>
        <ul className="mt-3 space-y-2 type-body-md text-ink [word-break:keep-all]">
          {[
            "긴 돈을 싸게 조달할 수 있어요 — 나라가 보증 선 기금채, 산은채.",
            "산업 구조조정을 해 본 경험과 기업 정보가 쌓여 있어요.",
            "민간이 지기 어려운 위험을 먼저 지는 자리예요. 금융지주 매칭이 늘었다는 게 산은이 드는 근거예요.",
          ].map((t) => (
            <li key={t} className="flex gap-2">
              <Check className="mt-1 h-4 w-4 shrink-0 text-primary" strokeWidth={2.4} />
              {t}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 8. 앞으로                                                            */
/* ------------------------------------------------------------------ */

const WATCH = [
  { what: "2027년 기금채 국가보증 최대 18조원", how: "정부 절차를 거쳐 국회 동의를 받아야 해요. 통과 여부와 조건을 보세요.", where: "2장 기금채 · 5장 손실" },
  { what: "블라인드 자펀드 약 8조원 결성 (10~11월)", how: "결성 뒤 첫 투자가 얼마나 빨리 나가는지 보세요.", where: "2장 모펀드·자펀드" },
  { what: "집행률 25.4%", how: "연말까지 얼마나 오르는지가 국감 후속 기사의 단골이에요.", where: "4장 승인 현황" },
  { what: "우주항공 등 산업 추가", how: "시행령 개정이 확정되는지 보세요.", where: "2장 12대 산업" },
  { what: "3차 메가프로젝트", how: "어떤 분야가 뽑히는지, 지역이 어디인지 보세요.", where: "3장 메가프로젝트" },
  { what: "2027년부터 연 약 40조원 · KSTP 최대 10조원", how: "계획대로 굴러가는지, 직접 지분투자가 연 5조원에 가까워지는지 보세요.", where: "2장 150→200조 표" },
];

function Watchlist() {
  const [done, setDone] = useState<Set<number>>(new Set());
  return (
    <div className="space-y-5">
      <P>다음 뉴스가 나오면 아래 목록에 맞춰 읽어 보세요. 이 글의 어느 장을 다시 보면 되는지도 적어 뒀어요.</P>
      <TryHint>확인한 뉴스는 눌러 체크하세요</TryHint>
      <ul className="space-y-2">
        {WATCH.map((w, i) => {
          const on = done.has(i);
          return (
            <li key={w.what}>
              <button
                type="button"
                onClick={() =>
                  setDone((s) => {
                    const n = new Set(s);
                    if (n.has(i)) n.delete(i);
                    else n.add(i);
                    return n;
                  })
                }
                aria-pressed={on}
                className={cn("flex w-full items-start gap-3 rounded-2xl border-2 bg-canvas px-4 py-3.5 text-left", anim, on ? "border-primary" : "border-hairline hover:border-brand-dark/40")}
              >
                <span className={cn("mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2", on ? "border-primary bg-primary text-on-primary" : "border-ink/25")}>
                  {on && <Check className="h-3 w-3" strokeWidth={3} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="type-body-md font-bold text-ink [word-break:keep-all]">{w.what}</span>
                    <Tag kind="outlook" />
                  </span>
                  <span className="mt-1 block type-body-md text-ink-secondary [word-break:keep-all]">{w.how}</span>
                  <span className="mt-1 block type-caption text-primary-text">다시 볼 곳 · {w.where}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <Line kind="outlook">10월 22일에는 금융 분야 종합감사가 예정돼 있어요. 산은 관련 추가 질의가 나오면 이 글에 반영할게요.</Line>
      <p className="rounded-2xl bg-canvas-cream px-5 py-4 type-body-md text-ink ko-justify">제 생각에는 11월 산은 면접 무렵 가장 많이 나올 소식이 기금채 보증 동의안과 자펀드 결성이에요. 두 가지만은 기사 제목이라도 챙겨 보세요.</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 9. 논술                                                              */
/* ------------------------------------------------------------------ */

const ESSAYS = [
  {
    key: "q1",
    label: "직접투자",
    q: "정책금융의 대규모 직접투자는 정당한가",
    core: "주장은 ‘정당하다’ 또는 ‘조건부 정당’. 근거는 장기·고위험·대규모라 민간만으론 돈이 비는 시장실패, 그리고 미국·일본도 국가가 직접 들어간다는 점.",
    nums: "직접 지분투자 연 최대 3조→5조원, 퓨리오사AI 기금 3,700억원",
    avoid: "구축효과·관제펀드 전례를 아예 안 쓰는 것",
  },
  {
    key: "q2",
    label: "쏠림",
    q: "국민성장펀드의 대기업·수도권 쏠림, 문제인가 구조인가",
    core: "60.6%·55.4%를 인용하되, ‘첨단산업의 지리적 분포’와 ‘지방 40% 목표’를 나눠서 보세요. 인프라 42.9%는 지역에 깔리는 자산이라는 점, 산은 지역 거점(NextONE)과 잇기.",
    nums: "대기업 60.6%, 수도권 55.4%, 지방 목표 40% 이상",
    avoid: "‘지방에 더 줘야 한다’로 끝내기. 어느 지방의 어떤 산업에 어떤 방식(대출·투자·인프라)인지까지 가야 해요.",
  },
  {
    key: "q3",
    label: "재정",
    q: "첨단전략산업기금이 재정 건전성에 주는 영향과 통제 방안",
    core: "기금채 국가보증은 ‘우발채무’예요. 보증이라 당장 국가채무로 잡히진 않지만, 손실이 현실이 되면 재정 부담이 돼요. 통제 방안 예: 후순위 비율 상한, 투자 손실과 정책 비용의 분리 공시, 연도별 보증 한도 국회 심사.",
    nums: "2027년 기금채 보증 최대 18조원, 산은 비용 약 2조원 추산",
    avoid: "‘국가채무가 늘어난다’고 단정하기 — 개념 오류예요.",
  },
  {
    key: "q4",
    label: "수익성",
    q: "정책금융기관의 수익성과 공공성, 양립 가능한가",
    core: "산은 회장이 신년사에서 두 축을 같이 말했다는 점. 단기 수익성은 내려놓을 수 있어도, 자본을 다시 만드는 장기 지속가능성은 공공성 수행의 전제예요.",
    nums: "수권자본금 30조→45조원, 혁신성장 프로그램 5년 100조원",
    avoid: "‘공공기관이니 수익은 상관없다’는 결론",
  },
  {
    key: "q5",
    label: "지문 반박",
    q: "“국민성장펀드는 또 하나의 관제펀드다”라는 칼럼에 대해 논하라",
    core: "칼럼의 근거(전례·정권 주기)를 먼저 정확히 요약 → 동의할 부분 인정 → 구조적 차이(법정 기금·여야 공동발의·상설 조직·산업 범위) → 그래도 남는 위험과 조건.",
    nums: "뉴딜펀드 국민참여형 IRR 2.14%, 자펀드 17개 중 8개 마이너스",
    avoid: "전면 부정도, 전면 옹호도 약해요. ‘다르게 설계했지만 성패는 집행에 달렸다’ 쪽이 안전해요.",
  },
];

const SKELETON = [
  { step: "주장", text: "조건부로 정당하다. 첨단산업의 자금 공백을 메울 주체는 지금 정책금융뿐이다." },
  { step: "근거 ①", text: "첨단산업 투자는 크고·길고·위험하다. 신안우이 해상풍력은 사업비 3.4조원, 대출 기간 18~19년이다." },
  { step: "근거 ②", text: "경쟁국도 국가가 직접 들어간다. 미국 반도체법, 일본 라피더스가 그 예다." },
  { step: "반대 인정", text: "다만 국감에서 지적됐듯 쏠림·심사 공정성·구축효과 우려는 근거가 있다. 관제펀드 전례도 있다." },
  { step: "재반박", text: "정부 재정이 손실을 먼저 지는 구조로 금융지주 매칭이 30%에서 60% 이상으로 늘었다는 산은 설명이 있다." },
  { step: "산은 역할", text: "산은은 그릇·사무국·투자자를 겸한다. 그래서 심사 단계별 공개와 손실·비용 분리 공시가 먼저다." },
];

const ESSAY_CHECK = ["숫자를 3개 이상 넣었나 (150조→200조, 75+75, 집행률 25.4% 등)", "기금과 펀드를 구분했나", "반대 근거를 하나 이상 인정했나", "산은을 ‘집행 창구’가 아니라 ‘당사자’로 썼나", "“적극 지원해야 한다”로 끝내지 않았나", "문장을 40자 안팎으로 짧게 썼나"];

function Essay() {
  const [q, setQ] = useState(0);
  const [shown, setShown] = useState(1);
  const [check, setCheck] = useState<Set<number>>(new Set());
  const e = ESSAYS[q];
  return (
    <div className="space-y-5">
      <Line kind="view">준비생들 사이에선 산은 일반시사논술이 ‘지문을 주고 견해를 쓰게 하는’ 형태가 많다고 해요. 아래 문제는 금콩이 만든 예시예요. 기출이 아니에요.</Line>
      <TryHint>예상 문제를 골라 보세요</TryHint>
      <Tabs label="예상 문제" value={e.key} onChange={(k) => setQ(ESSAYS.findIndex((x) => x.key === k))} items={ESSAYS.map((x, i) => ({ key: x.key, label: `${i + 1}. ${x.label}` }))} />
      <Card key={e.key} className="motion-safe:animate-[kk-fade-in_.3s_ease-out]">
        <p className="type-heading-sm text-ink [word-break:keep-all]">{e.q}</p>
        <dl className="mt-3 space-y-2.5">
          {[
            ["핵심", e.core],
            ["쓸 숫자", e.nums],
            ["피할 것", e.avoid],
          ].map(([k, v]) => (
            <div key={k} className="flex gap-3">
              <dt className="w-14 shrink-0 type-caption font-bold text-primary-text">{k}</dt>
              <dd className="type-body-md text-ink ko-justify">{v}</dd>
            </div>
          ))}
        </dl>
      </Card>

      <Card>
        <CardTitle>1번 문제 답안 뼈대 (주장 → 근거 2개 → 반대 인정 → 재반박 → 산은 역할)</CardTitle>
        <ol className="mt-3 space-y-2">
          {SKELETON.slice(0, shown).map((s, i) => (
            <li key={s.step} className="flex flex-col gap-1 rounded-xl bg-canvas-soft px-3.5 py-3 motion-safe:animate-[kk-fade-in_.3s_ease-out] sm:flex-row sm:gap-3">
              <span className="shrink-0 type-caption font-bold whitespace-nowrap text-primary-text sm:w-24">
                {i + 1}. {s.step}
              </span>
              <span className="type-body-md text-ink ko-justify">{s.text}</span>
            </li>
          ))}
        </ol>
        {shown < SKELETON.length ? (
          <button type="button" onClick={() => setShown((n) => n + 1)} className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-brand-dark px-4 py-2 type-body-md font-semibold text-on-primary">
            다음 단락 보기 <ArrowDown className="h-4 w-4" strokeWidth={2.2} />
          </button>
        ) : (
          <button type="button" onClick={() => setShown(1)} className="mt-3 inline-flex items-center gap-1.5 rounded-full border-2 border-brand-dark/20 px-4 py-2 type-body-md font-semibold text-brand-dark">
            처음부터 다시
          </button>
        )}
      </Card>

      <Card>
        <CardTitle>외워 둘 숫자 셋</CardTitle>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {[
            ["200조원", "5년, 2027년부터 1년에 약 40조원 (처음 150조)"],
            ["75 + 75", "기금 75조 + 민간·국민 75조 (150조 설계도)"],
            ["25.4%", "9월 말 집행률 — 승인 약 18조원 중 실제로 나간 몫"],
          ].map(([n, d]) => (
            <div key={n} className="rounded-xl bg-ev-written-soft px-3 py-3">
              <p className="tabular type-heading-md font-bold text-ink">{n}</p>
              <p className="mt-1 type-caption text-ink-secondary [word-break:keep-all]">{d}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <p className="type-heading-sm text-ink">답안 다 쓰고 체크</p>
          <span className="tabular type-caption font-semibold text-primary-text">
            {check.size}/{ESSAY_CHECK.length}
          </span>
        </div>
        <ul className="mt-3 space-y-1.5">
          {ESSAY_CHECK.map((t, i) => {
            const on = check.has(i);
            return (
              <li key={t}>
                <button
                  type="button"
                  onClick={() =>
                    setCheck((s) => {
                      const n = new Set(s);
                      if (n.has(i)) n.delete(i);
                      else n.add(i);
                      return n;
                    })
                  }
                  aria-pressed={on}
                  className="flex w-full items-start gap-2.5 rounded-lg px-1 py-1.5 text-left"
                >
                  <span className={cn("mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded border-2", on ? "border-primary bg-primary text-on-primary" : "border-ink/25")}>{on && <Check className="h-3 w-3" strokeWidth={3} />}</span>
                  <span className={cn("type-body-md [word-break:keep-all]", on ? "text-ink-mute line-through" : "text-ink")}>{t}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 10. 면접                                                             */
/* ------------------------------------------------------------------ */

const QUESTIONS = [
  { q: "국민성장펀드가 뭐예요? 1분 안에요.", tail: "기금이에요, 펀드예요?", point: "150조로 시작해 200조, 기금 75조 + 민간 75조, 기금은 산은 안에. ‘기금이 큰 통(모펀드) 역할을 한다’까지 말하면 차별화돼요." },
  { q: "왜 민간이 안 하고 산은이 해야 하나요?", tail: "그럼 손실 나면 누가 책임지죠?", point: "크고·길고·위험한 돈이라 민간만으론 비어요. 정부 재정이 손실을 먼저 맞는 구조로 민간을 끌어와요. 손실은 설계된 비용이지만, 상한과 공시를 관리하는 게 과제라고 답하세요." },
  { q: "국감에서 산은이 무슨 지적을 받았는지 아세요?", tail: "그 지적에 동의하세요?", point: "쏠림·심사 공정성·손실 세 가지. ‘일부는 타당하고, 산은이 투명성 개선을 약속한 부분도 있다’가 안전해요." },
  { q: "뉴딜펀드와 뭐가 다릅니까?", tail: "그래도 정권 바뀌면 사라지지 않을까요?", point: "법으로 만든 기금, 여야 간사 공동발의, 상설 부문, 12개 산업. ‘제도는 다르지만 성과가 답’이라고 마무리." },
  { q: "본인이 심사역이라면 퓨리오사AI 직접투자를 승인했을까요?", tail: "투심위 일부 위원이 반대했는데요?", point: "정답은 없어요. 기술의 대체 가능성, 회수 경로, 정책 목적과의 정합성 같은 판단 기준을 먼저 세우는 사고 과정을 보여 주세요. 기업 평가는 하지 마세요." },
  { q: "국민참여형 2차 미달, 어떻게 봅니까?", tail: "본인은 가입하셨나요?", point: "전체에서 1%가 안 되는 규모지만 여론 온도계예요. 수익률·5년 묶임·세제 세 요인을 들고, 가입 여부는 솔직하게." },
  { q: "들어오면 국민성장펀드부문에서 뭘 하고 싶어요?", tail: "신입이 거기서 할 수 있는 게 있나요?", point: "4국(총괄사무국·대출운용국·투자운용국·심사지원국) 구조를 알고 말하세요. 신입에겐 심사 지원·대출 운용 쪽이 현실적이에요." },
  { q: "대기업 쏠림, 어떻게 풀까요?", tail: "지방 중소기업에 첨단산업이 있나요?", point: "인프라, 공급망 하위 협력사, 지역 거점(NextONE) 세 갈래로. ‘무조건 지방’은 약해요." },
  { q: "구축효과 우려는 어떻게 생각하세요?", tail: "‘새 자금 창출’, 증명할 수 있나요?", point: "금융지주 매칭이 늘어난 게 기존 벤처 출자를 줄인 결과인지 데이터로 봐야 한다고. 정직한 ‘아직 모른다’가 강해요." },
  { q: "10년 뒤 이 기금이 성공했다면 어떤 모습일까요?", tail: "실패했다면요?", point: "성공: 민간이 혼자 투자하게 되고 기금 역할은 줄어요. 실패: 소수 기업을 연명시키는 돈. 양쪽을 다 그리면 상위권이에요." },
];

function Interview() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="space-y-5">
      <Line kind="view">준비생들 말로는 산은 1차 면접은 PT·직무역량·인성으로 나뉘고, 꼬리질문이 깊어요. 아래는 금콩이 뽑은 예상 질문이에요. 기출이 아니에요.</Line>
      <KongSays look="suit">답은 30초 안에: 결론 → 근거 하나 → 산은과 연결!</KongSays>
      <TryHint>질문을 눌러 꼬리질문과 답변 포인트를 보세요</TryHint>
      <ul className="space-y-2">
        {QUESTIONS.map((x, i) => (
          <li key={x.q} className="rounded-2xl border border-hairline bg-canvas">
            <button type="button" onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i} className="flex w-full items-center gap-3 px-4 py-3.5 text-left">
              <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-dark tabular type-caption font-bold text-on-primary">{i + 1}</span>
              <span className="min-w-0 flex-1 type-body-md font-semibold text-ink [word-break:keep-all]">{x.q}</span>
              <ChevronDown className={cn("h-4 w-4 shrink-0 text-ink-mute transition-transform", open === i && "rotate-180")} strokeWidth={2} />
            </button>
            {open === i && (
              <div className="space-y-2 px-4 pb-4">
                <p className="rounded-xl bg-[#fff1e0] px-3.5 py-2.5 type-body-md text-ink [word-break:keep-all]">
                  <span className="font-bold">꼬리질문 · </span>
                  {x.tail}
                </p>
                <p className="rounded-xl bg-ev-written-soft px-3.5 py-2.5 type-body-md text-ink ko-justify">
                  <span className="font-bold">답변 포인트 · </span>
                  {x.point}
                </p>
              </div>
            )}
          </li>
        ))}
      </ul>

      <Card>
        <CardTitle>PT 주제로 나온다면</CardTitle>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {["자펀드 운용사 선정 기준을 설계하라", "지방 투자 비중 40% 달성 방안", "기금 직접투자의 성과 평가 지표(KPI) 설계 — 재무 수익률만으론 안 돼요", "피지컬 AI 산업에 대한 금융 지원 전략"].map((t) => (
            <li key={t} className="rounded-xl bg-canvas-soft px-3.5 py-2.5 type-body-md text-ink [word-break:keep-all]">
              {t}
            </li>
          ))}
        </ul>
        <p className="mt-3 type-body-md text-ink-secondary ko-justify">PT 순서는 문제 정의 → 기준 세우기 → 대안 2~3개 비교 → 선택과 리스크 → 산은의 역할. 숫자 하나는 꼭 넣으세요.</p>
      </Card>

      <Card>
        <CardTitle>자소서에 ‘국민성장펀드’만 쓰면 묻혀요</CardTitle>
        <p className="mt-2 type-body-md text-ink-secondary ko-justify">표지의 그 준비생처럼, 다들 써요. 차이를 만드는 건 이런 것들이에요.</p>
        <ul className="mt-3 space-y-2 type-body-md text-ink [word-break:keep-all]">
          {["승인된 건 하나(신안우이 해상풍력, 퓨리오사AI 등)를 골라 내 전공으로 분석하기", "국감 쟁점 하나에 대한 내 입장", "4국 중 어디에서 무엇을 하고 싶은지"].map((t) => (
            <li key={t} className="flex gap-2">
              <Check className="mt-1 h-4 w-4 shrink-0 text-primary" strokeWidth={2.4} />
              {t}
            </li>
          ))}
        </ul>
        <p className="mt-3 rounded-xl bg-canvas-cream px-4 py-3 type-body-md text-ink ko-justify">
          제가 막혔던 질문은 이거였어요. 누가 돈을 받나, 운용사는 뭘 하나, 산은과 위원회는 무엇이 다른가. 이 글 2·3장이 그 답이에요. 면접에서 이 세 가지를 막힘없이 말하면, 꼬리질문에도 버틸 수 있다고 봐요.
        </p>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 11. 정리                                                             */
/* ------------------------------------------------------------------ */

const SOURCES: [string, string][] = [
  ["금융위원회 · 산업은행법 개정안 국회 통과 (2025.8.27)", "https://www.fsc.go.kr/po010101/85181"],
  ["금융위원회 · 150조원 국민성장펀드 국민보고대회 (2025.9.10)", "https://www.fsc.go.kr/po010101/85265"],
  ["금융위원회 · 첨단전략산업기금 시행령 국무회의 통과 (2025.11.18)", "https://www.fsc.go.kr/no010101/85671"],
  ["금융위원회 · 신안우이 해상풍력 1호 투자 (2026.1.29)", "https://www.fsc.go.kr/po010101/86170"],
  ["금융위원회 · 기금운용심의회 5건 승인 (2026.5.29)", "https://www.fsc.go.kr/no010101/87003"],
  ["정책브리핑 · 금융위 업무보고, 200조원 확대 (2026.7.15)", "https://www.korea.kr/news/policyNewsView.do?newsId=148968206"],
  ["전자신문 · 2027년 기금채 국가보증 최대 18조원 (2026.8.18)", "https://www.etnews.com/20260818000142"],
  ["아주경제 · 9월 말 승인 현황 (한민수 의원실, 2026.10.5)", "https://www.ajunews.com/view/20261005150614758"],
  ["한국금융신문 · 국민성장펀드 국감 (2026.10.12)", "https://www.fntimes.com/html/view.php?ud=202610111736175173b4a7c6999c_18"],
  ["딜사이트 · 2026 M&A 포럼, 블라인드 자펀드 8조원 (2026.10.20)", "https://dealsite.co.kr/articles/170830"],
  ["세계일보 · 뉴딜펀드 국민참여형 자펀드 손실 (2026.10.2)", "https://www.segye.com/newsView/20261002512525"],
];

function Wrap() {
  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl bg-brand-dark px-5 py-5 text-on-primary">
          <p className="type-micro-cap text-on-primary/70">논술용 3줄</p>
          <ol className="mt-3 space-y-2 type-body-md [word-break:keep-all]">
            <li>1. 첨단산업 돈은 크고·길고·위험해서, 정부 재정이 손실을 먼저 지는 구조로 민간을 끌어온다.</li>
            <li>2. 쏠림·심사·손실·시장 왜곡 비판에는 모두 근거가 있고, 반론에도 근거가 있다.</li>
            <li>3. 성패는 설계보다 집행이다. 산은은 당사자로서 심사 공개와 손실 분리 공시를 먼저 해야 한다.</li>
          </ol>
        </div>
        <div className="rounded-2xl bg-canvas px-5 py-5 shadow-level-1">
          <p className="type-micro-cap text-primary-text">면접용 3줄</p>
          <ol className="mt-3 space-y-2 type-body-md text-ink [word-break:keep-all]">
            <li>1. 150조로 시작해 200조, 기금 75 + 민간 75, 기금은 산은 안에 있다.</li>
            <li>2. 산은은 그릇·사무국·당사자이고, 비용은 약 2조원으로 추산된다.</li>
            <li>3. 국감 지적은 일부 타당하다. 산은은 쓰러진 회사를 살리던 은행에서 키우는 은행으로 바뀌는 중이다.</li>
          </ol>
        </div>
      </div>

      <Card>
        <p className="type-heading-sm text-ink">다음 편 예고</p>
        <p className="mt-2 type-body-md text-ink-secondary ko-justify">이 글이 ‘돈을 넣는 산은’이었다면, 다음 편은 ‘돈을 거두고 정리하는 산은’이에요. 석유화학 구조조정과 산은을 같은 방식으로 풀어 볼게요. 두 편을 같이 읽으면 산은의 양면이 보여요.</p>
      </Card>

      <div className="grid gap-2.5 sm:grid-cols-2">
        {[
          { href: "/magazine/6", label: "산은 필기 가이드 — 범위·시간·컷" },
          { href: "/companies/kdb", label: "산은 채용 일정·기관 정보" },
        ].map((c) => (
          <Link key={c.href} href={c.href} className="group flex items-center gap-2 rounded-xl bg-brand-dark px-4 py-3.5 type-body-md font-semibold text-on-primary">
            <span className="min-w-0 flex-1 [word-break:keep-all]">{c.label}</span>
            <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
          </Link>
        ))}
      </div>

      <Fold title="출처 (주요 자료)">
        <ul className="space-y-1.5">
          {SOURCES.map(([t, u]) => (
            <li key={u} className="type-caption [word-break:keep-all]">
              <a href={u} target="_blank" rel="noopener noreferrer" className="link">
                {t}
              </a>
            </li>
          ))}
        </ul>
        <p className="type-caption text-ink-mute [word-break:keep-all]">이 밖에 이데일리·머니투데이·파이낸셜뉴스·뉴스핌·이투데이·뉴스웨이·인베스트조선·헤럴드경제·MTN·한국경제 보도를 함께 확인했어요.</p>
      </Fold>

      <p className="type-caption text-ink-mute [word-break:keep-all]">이 글은 2026년 10월 20일 기준이에요. 숫자는 바뀌어요. 기금채 보증 동의안, 새 승인 통계, 산은 조직 개편이 나오면 고쳐 둘게요.</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 전체                                                                  */
/* ------------------------------------------------------------------ */

const CHAPTERS: GuideChapter[] = [
  {
    short: "왜",
    title: "왜 나라가 직접 돈주머니를 만들었을까요?",
    lead: "구조보다 이유가 먼저예요. 첨단산업에 필요한 돈이 어떤 돈인지부터 볼게요.",
    kong: "돈이 아파트 말고 공장으로 가게 하자는 게 출발점이에요!",
    bg: "bg-[#f3f6ff]",
    body: <WhyMoney />,
  },
  {
    short: "구조",
    title: "돈은 어디서 와서 어디로 갈까요?",
    lead: "국민성장펀드라는 큰 이름 안에 기금, 기금채, 자펀드가 들어 있어요. 통 하나씩 열어 볼게요.",
    look: "book",
    bg: "bg-[#fffaf3]",
    body: <MoneyFlow />,
  },
  {
    short: "산은의 역할",
    title: "산은은 여기서 정확히 무엇을 할까요?",
    lead: "심사는 위원회가 하는데, 그럼 산은은 뭘까요? 세 가지 역할로 나눠 보면 보여요.",
    bg: "bg-[#f2fbf5]",
    body: <KdbRoles />,
  },
  {
    short: "10개월",
    title: "출범 10개월, 무슨 일이 있었을까요?",
    lead: "법이 만들어지고, 1호 투자가 나가고, 국민이 펀드에 줄을 섰다가 식기까지.",
    bg: "bg-[#f6f4ff]",
    body: <TenMonths />,
  },
  {
    short: "국감 쟁점",
    title: "국감에서 무엇이 논쟁이었을까요?",
    lead: "쟁점은 넷이에요. 비판 한 문단에는 반론 한 문단을 붙였어요.",
    kong: "한쪽 말만 외우면 꼬리질문에 무너져요.",
    look: "sweat",
    bg: "bg-[#fff6ec]",
    body: <Debates />,
  },
  {
    short: "관제펀드",
    title: "관제펀드는 늘 망했다? 이번엔요?",
    lead: "역대 정부의 테마 펀드를 먼저 보고, 이번에 무엇이 다르고 무엇이 같은지 따져 봐요. 판단은 여러분 몫이에요.",
    bg: "bg-[#f3f6ff]",
    body: <Precedents />,
  },
  {
    short: "산은의 시각",
    title: "산은은 이 논쟁을 어떻게 볼까요?",
    lead: "산은이 공개적으로 한 말과, 그 말을 금콩이 풀이한 것을 나눠서 적었어요.",
    bg: "bg-[#f2fbf5]",
    body: <KdbView />,
  },
  {
    short: "앞으로",
    title: "앞으로 무엇을 보면 될까요?",
    lead: "면접 전까지 나올 뉴스를 미리 지도에 꽂아 둘게요.",
    bg: "bg-[#fffaf3]",
    body: <Watchlist />,
  },
  {
    short: "논술",
    title: "논술에서는 이렇게 써요",
    lead: "예상 문제 다섯 개와 답안 뼈대 하나. 숫자와 반대 논리가 점수를 가른다고 봐요.",
    look: "book",
    bg: "bg-[#f6f4ff]",
    body: <Essay />,
  },
  {
    short: "면접",
    title: "면접에서는 이렇게 답해요",
    lead: "“국민성장펀드로 제 성장도 지원 가능합니까?” 한 준비생의 농담이었는데, 진짜 답을 준비해 볼게요.",
    bg: "bg-[#f3f6ff]",
    body: <Interview />,
  },
  {
    short: "정리",
    title: "바쁘면 이것만",
    lead: "논술용 3줄, 면접용 3줄로 접었어요.",
    kong: "11월 면접장에서 만나요!",
    look: "suit",
    bg: "bg-[#f2fbf5]",
    body: <Wrap />,
  },
];

export function GrowthFundGuide({ title }: { title: string }) {
  return (
    <GuideShell
      chapters={CHAPTERS}
      eyebrow="금콩 논술·면접 딥다이브 · 산은"
      heading={title}
      sub="국민성장펀드와 첨단전략산업기금, 아무것도 몰라도 끝까지 읽으면 산은 논술과 면접이 되도록 처음부터 풀었어요."
      mascot={<KongMascot hold="news" glasses className="h-24 w-24 shrink-0 md:h-32 md:w-32" />}
      tabsLabel="국민성장펀드 딥다이브 목차"
      cover={<Cover />}
      coverClass="from-[#e6edff]"
    />
  );
}
