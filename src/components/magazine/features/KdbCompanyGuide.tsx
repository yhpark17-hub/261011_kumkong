"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { ArrowRight, BookOpen, Check, ChevronDown, Coins, Factory, Landmark, MessageCircle, Quote, Search, ShieldCheck, Sparkles, Wrench, type LucideIcon } from "lucide-react";
import { cn } from "../../ui";
import { KongMascot } from "../KongMascot";
import { Explain, GuideShell, TryHint, anim, useGuideGo, type GuideChapter } from "./GuideShell";

/**
 * 논술·면접 딥다이브 2 — 산업은행이라는 회사 자체를 '돈의 여행' 순서로
 * 은행인데 은행이 아니다 → 70년 → 1조 원의 여행(부서) → 신입의 자리 → 상사 셋 → 올해 10장면 → 논쟁 넷 → 면접 하루 → 질문 → 준비 → 정리.
 * 숫자·조직·날짜는 2026-10-31에 산은 홈페이지·경영공시·알리오·채용공고·보도자료·언론 보도를 열어 확인한 것만 써요.
 * 면접 후기(2026년 5월 상반기 단톡방)는 닉네임·날짜를 지우고 [중론]·[카더라] 꼬리표를 붙여요. 산은의 공식 설명이 아니에요.
 */

/* ------------------------------------------------------------------ */
/* 공통 — 꼬리표 다섯 가지                                                */
/* ------------------------------------------------------------------ */

type Kind = "official" | "news" | "talk" | "rumor" | "view";

const KIND: Record<Kind, { label: string; cls: string; desc: string }> = {
  official: { label: "공식", cls: "bg-ev-written-soft text-primary-text", desc: "산은 홈페이지·경영공시·알리오·채용공고·법령, 금융위·금감원·재정경제부 보도자료" },
  news: { label: "기사", cls: "bg-[#e3ecff] text-[#1d4f9a]", desc: "언론 보도 — 언론사 이름을 함께 적어요" },
  talk: { label: "중론", cls: "bg-[#fff1e0] text-[#9a4a0b]", desc: "올해 5월 면접을 본 여러 사람이 같은 말을 한 것" },
  rumor: { label: "카더라", cls: "bg-[#fde8ef] text-[#a3164a]", desc: "한두 명의 말·전해 들은 말 — 확인할 수 없어요" },
  view: { label: "해석", cls: "bg-[#e3f5ea] text-[#1d6e43]", desc: "금콩의 정리와 의견 — 정답이 아니에요" },
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

/** 용어는 처음 나오는 자리에서 한 번만 */
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

/** 장 끝 '면접에서 이렇게 쓴다' — 답안이 아니라 연결선 */
function UseBox({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl bg-brand-dark px-5 py-4 text-on-primary">
      <p className="flex items-center justify-between gap-2 type-micro-cap text-on-primary/70">
        면접에서 이렇게 써요
        <span className="rounded-full bg-on-primary/15 px-2 py-0.5 text-[11px] font-bold tracking-normal text-on-primary normal-case">해석</span>
      </p>
      <div className="mt-2 space-y-1.5 type-body-md [word-break:keep-all]">{children}</div>
    </div>
  );
}

/** 단톡방 한 장면 — 닉네임·날짜는 지우고 */
function Chat({ who, kind, children, note }: { who: string; kind: Kind; children: ReactNode; note?: string }) {
  return (
    <figure className="rounded-2xl bg-canvas px-4 py-3.5 shadow-level-1">
      <div className="flex items-center justify-between gap-2">
        <figcaption className="flex items-center gap-1.5 type-caption font-semibold text-ink-mute">
          <MessageCircle className="h-3.5 w-3.5" strokeWidth={2.2} />
          {who}
        </figcaption>
        <Tag kind={kind} />
      </div>
      <blockquote className="mt-2 inline-block rounded-2xl rounded-bl-sm bg-[#fff1e0] px-3.5 py-2 type-body-md font-semibold text-ink [word-break:keep-all]">{children}</blockquote>
      {note && <p className="mt-1.5 type-caption text-ink-mute [word-break:keep-all]">{note}</p>}
    </figure>
  );
}

/** 따옴표 카드 — 누가, 언제, 어디서 (초상 그림이 있으면 함께) */
function Said({ who, where, portrait, kind = "news", children }: { who: string; where: string; portrait?: string; kind?: Kind; children: ReactNode }) {
  return (
    <figure className="flex gap-3 rounded-2xl bg-canvas px-4 py-4 shadow-level-1">
      {portrait ? (
        // eslint-disable-next-line @next/next/no-img-element -- 금콩이 그린 인물 그림 (SVG)
        <img src={`/magazine/portrait/${portrait}`} alt="" loading="lazy" decoding="async" className="h-20 w-[4.3rem] shrink-0 self-end rounded-xl bg-canvas-soft object-contain object-bottom" />
      ) : (
        <Quote className="h-4 w-4 shrink-0 text-primary" strokeWidth={2.4} />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex justify-end">
          <Tag kind={kind} />
        </div>
        <blockquote className="mt-1 type-body-md font-semibold text-ink [word-break:keep-all]">{children}</blockquote>
        <figcaption className="mt-2 type-caption text-ink-mute [word-break:keep-all]">
          {who} · {where}
        </figcaption>
      </div>
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
      {open && <div className="space-y-2.5 px-4 pb-4">{children}</div>}
    </div>
  );
}

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

/** 숫자 한 칸 — 비교 대상과 함께 */
function Stat({ label, value, vs, kind }: { label: string; value: string; vs: ReactNode; kind: Kind }) {
  return (
    <div className="rounded-2xl bg-canvas px-4 py-3.5 shadow-level-1">
      <div className="flex items-start justify-between gap-2">
        <p className="type-caption text-ink-mute">{label}</p>
        <Tag kind={kind} />
      </div>
      <p className="mt-0.5 type-heading-md font-bold text-ink tabular [word-break:keep-all]">{value}</p>
      <p className="mt-0.5 type-caption text-ink-secondary [word-break:keep-all]">{vs}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 다섯 정거장 — 3장의 지도, 4·6·11장이 같이 써요                          */
/* ------------------------------------------------------------------ */

type StationKey = "raise" | "check" | "send" | "fix" | "plan";

const STATION_STYLE: Record<StationKey, { Icon: LucideIcon; dot: string; soft: string; text: string }> = {
  raise: { Icon: Coins, dot: "bg-[#f0a91a]", soft: "bg-[#fff4d6]", text: "text-[#8a5a00]" },
  check: { Icon: Search, dot: "bg-[#2f7be0]", soft: "bg-[#e3efff]", text: "text-[#1d4f9a]" },
  send: { Icon: Factory, dot: "bg-[#5b44f0]", soft: "bg-[#ece9ff]", text: "text-[#3d2bb8]" },
  fix: { Icon: Wrench, dot: "bg-[#e5533c]", soft: "bg-[#ffe9e3]", text: "text-[#a8321f]" },
  plan: { Icon: ShieldCheck, dot: "bg-[#0f9f6e]", soft: "bg-[#e3f5ea]", text: "text-[#1d6e43]" },
};

interface Station {
  key: StationKey;
  no: number;
  verb: string;
  label: string;
  what: string;
  units: string[];
  without: string;
  year: ReactNode;
  term?: { term: string; def: string; pic?: string };
}

const STATIONS: Station[] = [
  {
    key: "raise",
    no: 1,
    verb: "돈을 모은다",
    label: "조달",
    what: "산금채와 외화채권을 팔고, 예금을 받아요. 들어오는 돈과 나가는 돈의 만기와 금리를 맞추는 일(ALM, 자산·부채 관리)도 여기서 해요.",
    units: ["재무·지원부문 (재무기획부·자금부·수신기획부)", "글로벌사업부문 (자금운용실·금융공학실 등)"],
    without: "빌려줄 돈이 없어요. 산은의 모든 일은 여기서 시작해요.",
    year: "1월, 해외 투자자에게 달러 채권(글로벌본드) 30억달러어치를 팔았어요. 사겠다는 주문이 52억달러 몰렸고, 5년 고정금리물은 같은 만기로는 역대 가장 낮은 가산금리였다고 보도됐어요.",
  },
  {
    key: "check",
    no: 2,
    verb: "누구에게 줄지 따진다",
    label: "심사·리스크",
    what: "기업이 돈을 갚을 힘을 등급으로 매기고(신용평가), 대출·투자를 해도 될지 심사해요. 나간 돈은 다시 점검하고(여신감리), 은행 전체가 감당할 위험의 한도를 관리해요.",
    units: ["심사평가부문 (심사1부·심사2부·신용평가부)", "리스크관리부문 (리스크관리부·여신감리부)"],
    without: "나라 신용으로 빌려 온 돈이 떼여요. 국감에서 ‘다 승인해 준다’는 비판이 나오면, 결국 이 정거장을 묻는 거예요.",
    year: "4월, 기업 재무분석을 돕는 AI 에이전트를 여신 업무에 들였어요. 담당자가 아낀 시간을 숫자 너머의 분석에 쓰게 하겠다는 설명이에요. HMM 지분에 아주 높은 위험가중치를 매기는 규정은 2028년 6월까지 면제받았어요(2025년 6월 금융당국 비조치의견서).",
    term: {
      term: "BIS비율",
      def: "은행의 자기 돈(자본)을 위험을 반영한 자산으로 나눈 비율이에요. 높을수록 손실이 나도 버틸 힘이 커요.",
      pic: "산은은 위험한 곳에 돈을 넣는 게 일이라, 이 비율이 국내 은행 평균보다 낮은 편이에요.",
    },
  },
  {
    key: "send",
    no: 3,
    verb: "돈을 내보낸다",
    label: "기업금융·투자",
    what: "대출(여신)과 지분투자로 돈이 실제로 나가는 곳이에요. 대기업·중견기업 대출, 벤처 투자와 펀드 출자, 회사채·M&A·PF, 해외 사업, 지역 지점, 국민성장펀드까지 여섯 부문이 나눠 맡아요.",
    units: ["기업금융부문", "혁신성장금융부문", "자본시장부문", "글로벌사업부문", "지역성장부문", "국민성장펀드부문"],
    without: "산은이 있을 이유가 사라져요. 2025년에만 95.9조원이 이 정거장에서 나갔어요.",
    year: "4월 신안우이 해상풍력 PF 약정, 6월 넥스트라운드 900회, 7월 KDB 넥스트원 광주 개소, 10월 국민성장펀드 누적 승인 22.3조원이 모두 이 정거장의 일이에요.",
    term: {
      term: "PF (프로젝트 파이낸싱)",
      def: "회사의 담보 대신, 사업(발전소·도로 등)이 앞으로 벌어들일 돈을 믿고 빌려주는 방식이에요.",
    },
  },
  {
    key: "fix",
    no: 4,
    verb: "흔들리는 기업을 다룬다",
    label: "구조조정",
    what: "빚을 못 갚게 된 기업을 살릴지, 고칠지, 정리할지 정해요. 빚 갚는 날을 미뤄 주고 회사를 고치거나(워크아웃·사업재편), 빌려준 돈을 주식으로 바꿔(출자전환) 주인이 되기도 해요. 그렇게 갖게 된 주식을 관리하다 파는 것도 이 정거장의 일이에요.",
    units: ["기업금융부문 기업개선본부 (기업구조조정1·2실·투자관리실)"],
    without: "큰 회사가 쓰러질 때 협력업체와 지역 일자리까지 한꺼번에 흔들릴 수 있어요.",
    year: "석유화학 대산·여수 사업재편 금융지원, HMM 경영권 매각 검토, KDB생명 매각이 모두 이 정거장에 있어요.",
    term: {
      term: "워크아웃 · 출자전환",
      def: "워크아웃은 채권자들이 빚 갚을 날을 미뤄 주는 대신 회사가 고치는 약속을 지키게 하는 절차예요. 출자전환은 빌려준 돈을 그 회사 주식으로 바꾸는 거예요.",
      pic: "산은이 HMM·한진칼 주식을 갖게 된 것도 이런 과정을 거쳐서예요.",
    },
  },
  {
    key: "plan",
    no: 5,
    verb: "설계하고 감시한다",
    label: "전략·연구·준법",
    what: "한 해 계획을 짜고, 산업·경제를 연구하고, 법과 내부 규칙을 지키는지 감시해요. AI·IT 시스템을 만드는 IT·AI본부는 리스크관리부문 아래에 있고, 인사는 재무·지원부문이 맡아요.",
    units: ["전략기획부문 (종합기획부·영업·투자기획부·ESG기획부)", "KDB미래전략연구소 (전략기획부문)", "IT·AI본부 (리스크관리부문)", "부문 밖 — 준법감시인·검사부·소비자보호부"],
    without: "네 정거장이 각자 움직이고, 금융위·국회에 설명할 말이 없어져요.",
    year: "5년 250조원 공급 계획을 1월 금융위에 보고하고 2월에 공개했어요. 3월 공시까지 ‘기획관리부문’이던 이름도 지금은 ‘전략기획부문’으로 바뀌었어요.",
  },
];

const ST = (k: StationKey) => STATIONS.find((s) => s.key === k)!;

function StationDot({ k, size = "md" }: { k: StationKey; size?: "sm" | "md" }) {
  const { Icon, dot } = STATION_STYLE[k];
  return (
    <span className={cn("inline-flex shrink-0 items-center justify-center rounded-full text-on-primary", dot, size === "sm" ? "h-6 w-6" : "h-10 w-10")}>
      <Icon className={size === "sm" ? "h-3.5 w-3.5" : "h-5 w-5"} strokeWidth={2.4} />
    </span>
  );
}

function StationTag({ k }: { k: StationKey }) {
  const s = ST(k);
  const st = STATION_STYLE[k];
  return (
    <span className={cn("inline-flex shrink-0 items-center gap-1 rounded-full py-0.5 pr-2 pl-0.5 text-[11px] font-bold whitespace-nowrap", st.soft, st.text)}>
      <StationDot k={k} size="sm" />
      {s.no} {s.label}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* 표지                                                                  */
/* ------------------------------------------------------------------ */

function Cover() {
  const go = useGuideGo();
  return (
    <div className="space-y-4">
      <div className="grid gap-4 rounded-3xl bg-canvas/85 p-4 shadow-level-1 backdrop-blur sm:p-5 md:grid-cols-[1.1fr_1fr]">
        <div>
          <p className="flex items-center justify-between gap-2 type-caption font-semibold text-ink-mute">
            올해 5월, 산은 1차 면접을 앞둔 단톡방
            <Tag kind="talk" />
          </p>
          <p className="mt-2 inline-block rounded-2xl rounded-bl-sm bg-[#fff1e0] px-3.5 py-2.5 type-body-md font-semibold text-ink [word-break:keep-all]">“산은 피티 제발 구조조정만 안 나왔으면”</p>
          <p className="mt-3 type-body-md text-ink-secondary ko-justify">준비생들이 아는 산은은 대개 두 단어예요. 정책금융, 구조조정. 그런데 면접은 그다음을 물어요. 돈은 어디서 오는지, 어느 부서가 무슨 일을 하는지, 올해 무엇을 했는지요.</p>
          <p className="mt-2 type-body-md font-semibold text-ink [word-break:keep-all]">이 글은 1조 원을 따라가며 산은을 처음부터 풀어요. 다 읽으면 “산은은 무슨 일을 하나요?”에 1분 안에 답할 수 있어요.</p>
        </div>
        <div className="rounded-2xl bg-brand-dark px-4 py-4 text-on-primary">
          <p className="type-micro-cap text-on-primary/70">3줄 요약</p>
          <ol className="mt-2.5 space-y-2 type-body-md [word-break:keep-all]">
            <li>1. 산은은 예금보다 채권(산금채)으로 돈을 모아요. 그래서 지점이 적고, 나라 신용을 빌리고, 정책 일을 맡아요.</li>
            <li>2. 부서는 돈이 흐르는 순서로 보면 다섯 정거장이에요. 모으고, 따지고, 내보내고, 다루고, 설계해요.</li>
            <li>3. 면접은 ‘산은을 구조로 이해했나’를 확인해요. 올해 뉴스 하나를 부서 이름과 함께 말할 수 있으면 출발이 좋아요.</li>
          </ol>
        </div>
      </div>

      <div className="rounded-2xl bg-canvas/85 px-4 py-3.5 shadow-level-1 backdrop-blur">
        <p className="type-caption font-semibold text-ink">이 글의 꼬리표 — 공식 자료와 면접 후기를 섞지 않으려고 붙였어요</p>
        <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
          {(Object.keys(KIND) as Kind[]).map((k) => (
            <li key={k} className="flex items-start gap-2 type-caption text-ink-secondary [word-break:keep-all]">
              <Tag kind={k} />
              <span className="pt-px">{KIND[k].desc}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-wrap items-center gap-2 px-1">
        <span className="type-caption font-semibold text-ink">면접이 코앞이라면</span>
        {[
          { to: 0, label: "1장 은행 아닌 은행" },
          { to: 2, label: "3장 돈의 여행" },
          { to: 8, label: "9장 질문 10" },
          { to: 9, label: "10장 준비" },
        ].map((x) => (
          <button key={x.to} type="button" onClick={() => go(x.to)} className="rounded-full bg-brand-dark px-3 py-1.5 type-caption font-semibold text-on-primary transition-transform active:scale-95">
            {x.label}
          </button>
        ))}
        <span className="type-caption text-ink-mute">· 시간이 있으면 1장부터 차례로 읽어요</span>
      </div>
      <p className="px-1 type-caption text-ink-mute [word-break:keep-all]">2026년 11월 기준이에요 (10월 31일 확인). 조직도와 숫자는 바뀌어요.</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 1. 은행 아닌 은행                                                      */
/* ------------------------------------------------------------------ */

const FUNDING = [
  {
    key: "bond",
    label: "채권 (산금채 등)",
    share: 62.7,
    amount: "182.2조원",
    cls: "bg-[#f0a91a]",
    text: "시장에 채권을 팔아 모은 돈이에요. 산은이 쓰는 돈의 대부분이 여기서 와요.",
  },
  {
    key: "deposit",
    label: "예금",
    share: 24.1,
    amount: "69.9조원",
    cls: "bg-[#2f7be0]",
    text: "산은도 예금을 받아요. 다만 넷 중 하나 꼴이에요. 예금으로 돈 대부분을 모으는 시중은행과 달라요.",
  },
  {
    key: "borrow",
    label: "차입",
    share: 13.2,
    amount: "38.4조원",
    cls: "bg-[#8a8fb5]",
    text: "다른 곳에서 꾼 돈(차입금)이에요.",
  },
] as const;

function FundingBar() {
  const [sel, setSel] = useState(0);
  const f = FUNDING[sel];
  return (
    <div className="rounded-3xl bg-canvas p-4 shadow-level-2 sm:p-5">
      <CardTitle kind="official">산은이 빌려 온 돈 100원, 어디서 왔을까요?</CardTitle>
      <p className="mt-1 type-caption text-ink-mute">2025년 말 연결 기준 · 채권·예금·차입 세 항목만 놓고 본 비율</p>
      <div className="mt-4 flex h-14 gap-1 overflow-hidden rounded-xl">
        {FUNDING.map((x, i) => (
          <button
            key={x.key}
            type="button"
            onClick={() => setSel(i)}
            aria-pressed={sel === i}
            style={{ width: `${x.share}%` }}
            className={cn("flex min-w-0 items-center justify-center px-1 text-on-primary", x.cls, anim, sel === i ? "opacity-100" : "opacity-55 hover:opacity-80")}
          >
            <span className="truncate tabular type-body-md font-bold">{x.share}원</span>
          </button>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
        {FUNDING.map((x, i) => (
          <button key={x.key} type="button" onClick={() => setSel(i)} className={cn("flex items-center gap-1.5 type-caption", sel === i ? "font-bold text-ink" : "text-ink-secondary")}>
            <span className={cn("h-2.5 w-2.5 rounded-full", x.cls)} />
            {x.label}
          </button>
        ))}
      </div>
      <div key={f.key} className="mt-3 rounded-xl bg-canvas-soft px-4 py-3 motion-safe:animate-[kk-fade-in_.3s_ease-out]">
        <p className="type-body-md font-bold text-ink">
          {f.label} · <span className="tabular">{f.amount}</span>
        </p>
        <p className="mt-1 type-body-md text-ink-secondary ko-justify">{f.text}</p>
      </div>
    </div>
  );
}

const COMPARE = [
  { row: "돈은 어디서", bank: "예금이 대부분", kdb: "채권 62.7% · 예금 24.1%", so: "그래서 동네마다 창구를 낼 필요가 적어요. 지점이 수십 곳이에요." },
  { row: "주인", bank: "주주 (대개 금융지주)", kdb: "정부 100%", so: "그래서 나라와 같은 신용등급으로 싸게 빌리고, 정부 정책을 맡아요." },
  { row: "고객", bank: "개인 + 기업", kdb: "기업·산업 중심 (개인은 소수)", so: "그래서 창구에 줄 서는 은행이 아니에요. 다만 연금·신탁처럼 개인을 상대하는 일도 조금 있어요." },
  { row: "국내 영업점", bank: "수백 곳 (국민은행 771곳)", kdb: "59곳", so: "그래서 작은 기업은 다른 은행 손을 빌려 지원해요(온렌딩, 4장)." },
  { row: "잘했나 보는 눈", bank: "이익 · 주가", kdb: "정책 성과 + 이익 둘 다", so: "그래서 국감에서 ‘왜 손해 봤나’와 ‘왜 안 도왔나’를 둘 다 들어요." },
  { row: "흔들리는 기업", bank: "빌려준 돈 먼저 회수", kdb: "살릴지 정리할지 앞장서 정하는 주채권은행", so: "그래서 구조조정이 산은의 이름처럼 붙어 다녀요." },
  { row: "누가 살피나", bank: "금융감독원", kdb: "금감원 + 금융위 + 국회 국정감사", so: "그래서 매년 10월이면 산은 뉴스가 쏟아져요." },
];

function CompareTable() {
  const [sel, setSel] = useState(0);
  return (
    <div className="rounded-3xl bg-canvas p-3 shadow-level-2 sm:p-5">
      <div className="flex items-center justify-between gap-2 px-1">
        <p className="type-heading-sm text-ink">시중은행 vs 산은</p>
        <Tag kind="view" />
      </div>
      <div className="mt-3 grid grid-cols-[5.5rem_1fr_1fr] gap-x-2 px-1 pb-1.5 type-caption font-bold text-ink-mute sm:grid-cols-[8rem_1fr_1fr]">
        <span />
        <span>시중은행</span>
        <span className="text-primary-text">산은</span>
      </div>
      <ul className="space-y-1">
        {COMPARE.map((r, i) => (
          <li key={r.row}>
            <button
              type="button"
              onClick={() => setSel(i)}
              aria-pressed={sel === i}
              className={cn(
                "grid w-full grid-cols-[5.5rem_1fr_1fr] items-center gap-x-2 rounded-xl px-2 py-2.5 text-left type-body-md sm:grid-cols-[8rem_1fr_1fr]",
                anim,
                sel === i ? "bg-canvas-cream ring-2 ring-brand-dark" : "hover:bg-canvas-soft",
              )}
            >
              <span className="type-caption font-bold text-ink [word-break:keep-all]">{r.row}</span>
              <span className="text-ink-secondary [word-break:keep-all]">{r.bank}</span>
              <span className="font-semibold text-ink [word-break:keep-all]">{r.kdb}</span>
            </button>
            {sel === i && (
              <p className="mx-2 mt-1 mb-2 flex items-start gap-2 rounded-xl bg-ev-written-soft px-3 py-2 type-body-md text-ink motion-safe:animate-[kk-fade-in_.3s_ease-out] [word-break:keep-all]">
                <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-primary" strokeWidth={2.4} />
                {r.so}
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function NotABank() {
  return (
    <div className="space-y-5">
      <P>은행이라고 하면 예금을 받아 그 돈으로 대출해 주는 곳을 떠올려요. 산은도 예금을 받긴 해요. 그런데 비중이 작아요. 산은이 쓰는 돈의 대부분은 시장에서 채권을 팔아 마련해요.</P>
      <TermBox
        term="정책금융기관"
        def="돈을 버는 것보다 정책 목적(산업 육성·위기 대응·지역 균형)을 위해 정부가 만들고 소유한 금융기관이에요."
        pic="산업은행(산은)·한국수출입은행(수은)·IBK기업은행(기은)을 흔히 ‘국책은행 3사’라고 불러요."
      />
      <FundingBar />
      <TermBox
        term="산금채"
        def="산업금융채권. 산은이 시장에서 돈을 빌리면서 발행하는 채권(돈을 빌렸다는 증서)이에요."
        pic="산은의 주인은 정부 100%예요. 그래서 산은의 신용등급이 대한민국 국가 신용등급과 같고, 시장에서 낮은 금리로 큰돈을 빌릴 수 있어요."
      />
      <P>예금은 이자가 싸지만, 모으려면 지점과 사람이 필요해요. 채권은 지점 없이도 큰돈을 한 번에 모으지만, 이자가 더 들어요.</P>
      <Line kind="view">비싸게 빌려 오면, 빌려준 이자와 빌려 온 이자의 차이(순이자마진)가 얇아지기 쉬워요. 산은이 ‘수익성’을 자주 말하는 이유가 여기 있어요. 이 차이 하나에서 지점이 적은 이유, 개인 고객이 드문 이유, 정책 일을 맡는 이유가 다 따라 나와요.</Line>
      <TryHint>줄을 눌러 ‘그래서’를 이어 보세요</TryHint>
      <CompareTable />
      <div className="grid grid-cols-2 gap-2.5">
        <Stat kind="official" label="총자산 (2025년 말, 은행 별도)" value="346.3조원" vs="국민은행(563.6조원)의 약 60%. 자회사까지 합친 연결로는 384.6조원이에요" />
        <Stat kind="official" label="임직원 정원 (2026년 9월 말)" value="3,419명" vs="국민은행 직원(1만 5,389명, 2025년 말)의 약 5분의 1이에요" />
        <Stat kind="official" label="국내 영업점 (2026년 6월 말)" value="59곳" vs="국민은행(771곳)의 13분의 1 수준이에요. 본점 영업부를 포함한 숫자예요" />
        <Stat kind="official" label="신용등급" value="Aa2 · AA · AA-" vs="무디스·S&P·피치 모두 대한민국 국가등급과 같아요" />
      </div>
      <p className="px-1 type-caption text-ink-mute [word-break:keep-all]">해외에는 2025년 말 18개국 25곳(지점 12·현지법인 7·사무소 6)이 있고, 올해 1월 하노이지점 인가를 받아 홈페이지 목록에는 26곳이 올라 있어요.</p>
      <UseBox>
        <p>“산은은 무슨 일을 하나요?”에는 ‘예금보다 채권으로 돈을 모아, 정책 목적의 기업금융을 하는 은행’으로 시작해요.</p>
        <p>이어서 3장의 다섯 정거장으로 넘어가면 1분이 금방 차요.</p>
      </UseBox>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 2. 70년                                                               */
/* ------------------------------------------------------------------ */

const HISTORY: { when: string; what: string; kind: Kind }[] = [
  { when: "1954년 4월", what: "한국산업은행법으로 설립. 전쟁 뒤 공장을 다시 세울 돈(산업화 자금)을 대는 게 첫 일이었어요.", kind: "official" },
  { when: "1990년대 말", what: "외환위기. 대우·기아 같은 대기업 구조조정의 한가운데에 섰어요.", kind: "news" },
  { when: "2010년대", what: "대우조선해양·STX·쌍용차·아시아나·HMM. ‘쓰러진 회사를 살리는 은행’이라는 이미지가 굳었어요.", kind: "news" },
  { when: "2016년 8월", what: "넥스트라운드 시작. 스타트업과 투자자를 잇는 산은의 투자 설명회로, 2026년 6월 900회를 넘겼어요.", kind: "news" },
  { when: "2024년 9월", what: "‘구조조정본부’ 이름을 ‘기업개선본부’로 바꿨어요. 무너진 뒤가 아니라 무너지기 전에 손을 쓰겠다는 뜻이에요.", kind: "news" },
  { when: "2025년 9월", what: "박상진 회장 취임. 창립 71년 만의 첫 내부 출신 회장이에요.", kind: "news" },
  { when: "2025년 12월", what: "국민성장펀드부문 신설. 첨단산업에 돈을 대는 정책 펀드의 그릇이 됐어요.", kind: "news" },
  { when: "2026년", what: "홈페이지 조직도 기준 10개 부문 · 8개 본부 · 8개 지역본부 · 65개 부(실). ‘기획관리부문’은 ‘전략기획부문’으로 이름이 바뀌었어요.", kind: "official" },
];

function History() {
  return (
    <div className="space-y-5">
      <ol className="relative space-y-3 pl-6">
        <span aria-hidden className="absolute top-2 bottom-2 left-[7px] w-0.5 rounded-full bg-primary/25" />
        {HISTORY.map((h) => (
          <li key={h.when} className="relative">
            <span aria-hidden className="absolute top-1.5 -left-6 h-4 w-4 rounded-full border-[3px] border-canvas bg-primary shadow-level-1" />
            <div className="rounded-2xl bg-canvas px-4 py-3 shadow-level-1">
              <div className="flex items-center justify-between gap-2">
                <p className="type-body-md font-bold text-primary-text tabular">{h.when}</p>
                <Tag kind={h.kind} />
              </div>
              <p className="mt-1 type-body-md text-ink ko-justify">{h.what}</p>
            </div>
          </li>
        ))}
      </ol>
      <Line kind="view">한 줄로 줄이면, 쓰러진 회사를 살리던 은행에서 쓰러지기 전에 키우는 은행으로 간판을 바꾸는 중이에요. 다만 구조조정도 여전히 진행형이에요(석유화학·HMM·KDB생명). ‘둘 다 하는 은행’이 정확한 표현이에요.</Line>
      <p className="type-heading-sm text-ink">회사가 스스로 급하다고 말하는 것</p>
      <div className="grid gap-3 md:grid-cols-2">
        <Said who="박상진 회장 2026년 신년사" where="산은 보도자료, 2026년 1월 2일" portrait="park-sangjin" kind="official">
          2026년은 “대한민국 경제와 산은의 진짜 성장을 위한 골든타임”
        </Said>
        <Said who="박상진 회장 2026년 신년사" where="산은 보도자료, 2026년 1월 2일" portrait="park-sangjin" kind="official">
          “산은의 수익성은 정책금융을 흔들림 없이 지속하는 데 필요한 기초체력”
        </Said>
      </div>
      <Card>
        <CardTitle kind="official">신년사가 꼽은 올해 목표 세 가지</CardTitle>
        <ol className="mt-3 space-y-1.5 type-body-md text-ink [word-break:keep-all]">
          <li>1. 산업·기업 육성 — 첨단전략산업, 지역 경제, 중소·벤처 투자, 전통 주력산업의 사업구조 재편</li>
          <li>2. 지속적 수익 창출 — 자산·부채 리밸런싱, 글로벌 시장의 새 기회, 투자금융 역량</li>
          <li>3. 주인의식을 가지고 소통하는 문화 조성</li>
        </ol>
        <p className="mt-3 type-body-md text-ink-secondary ko-justify">정책을 하려면 돈도 벌어야 한다는 말이에요. 1장의 ‘비싸게 빌려 오는 은행’과 이어서 읽으면 무게가 느껴져요.</p>
      </Card>
      <div className="grid gap-2.5 sm:grid-cols-2">
        <div className="rounded-2xl bg-canvas px-4 py-3.5 shadow-level-1">
          <p className="flex items-center justify-between gap-2 type-caption text-ink-mute">
            미션 <Tag kind="official" />
          </p>
          <p className="mt-1 type-body-md font-bold text-ink [word-break:keep-all]">“대한민국 경제와 산업의 미래를 여는 성장 파트너”</p>
        </div>
        <div className="rounded-2xl bg-canvas px-4 py-3.5 shadow-level-1">
          <p className="flex items-center justify-between gap-2 type-caption text-ink-mute">
            비전 <Tag kind="official" />
          </p>
          <p className="mt-1 type-body-md font-bold text-ink [word-break:keep-all]">“글로벌 대한민국을 완성하는 Top-Tier Bank, KDB”</p>
        </div>
      </div>
      <UseBox>
        <p>“10년 뒤 산은은 어떤 은행이어야 하나”를 물으면, 이 흐름 위에 답을 올려요.</p>
        <p>키우는 일과 정리하는 일을 둘 다 말하면 균형이 잡혀요.</p>
      </UseBox>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 3. 1조 원의 여행                                                       */
/* ------------------------------------------------------------------ */

function SupplyNote() {
  return (
    <Card>
      <CardTitle kind="news">2025년, 3번 정거장에서 나간 돈</CardTitle>
      <div className="mt-3 grid grid-cols-2 gap-2.5">
        <div className="rounded-xl bg-[#ece9ff] px-3.5 py-3">
          <p className="type-caption font-semibold text-[#3d2bb8]">산은 발표 (3월 주주총회)</p>
          <p className="mt-0.5 type-heading-md font-bold text-ink tabular">95.9조원</p>
        </div>
        <div className="rounded-xl bg-canvas-soft px-3.5 py-3">
          <p className="type-caption font-semibold text-ink-secondary">국회 의원실이 받은 자료</p>
          <p className="mt-0.5 type-heading-md font-bold text-ink tabular">90.6조원</p>
        </div>
      </div>
      <p className="mt-3 type-body-md text-ink-secondary ko-justify">같은 해 숫자가 다른 건, 무엇을 ‘공급’으로 세는지 기준이 달라서로 보여요. 면접에서는 산은 발표치(95.9조원)를 말하고, 기준에 따라 다르다는 것만 알아 두면 돼요.</p>
    </Card>
  );
}

function Journey() {
  const [sel, setSel] = useState(0);
  const s = STATIONS[sel];
  const st = STATION_STYLE[s.key];
  return (
    <div className="space-y-5">
      <TermBox term="여신 · 투자" def="여신은 돈을 빌려주는 것(대출·지급보증), 투자는 회사 지분(주식)을 사서 주인 몫을 갖는 거예요. 산은은 둘 다 해요." />
      <TryHint>정거장을 눌러 보세요</TryHint>
      <div className="rounded-3xl bg-[#0b2a3a] p-3 shadow-level-2 sm:p-5">
        <p className="flex items-center justify-between gap-2 px-1 type-caption font-semibold text-on-primary/80">
          산은에 들어온 1조 원이 지나는 다섯 정거장
          <Tag kind="view" />
        </p>
        <div className="mt-3 grid gap-3 md:grid-cols-[minmax(0,15.5rem)_1fr]">
          <ol className="relative">
            <span aria-hidden className="absolute top-7 bottom-7 left-[27px] w-3 rounded-full bg-linear-to-b from-[#ffe08a] to-[#f0a91a]" />
            <span aria-hidden className="absolute top-7 bottom-7 left-[32px] w-0.5 bg-[repeating-linear-gradient(to_bottom,#fff_0_8px,transparent_8px_16px)] opacity-70" />
            {STATIONS.map((x, i) => {
              const xs = STATION_STYLE[x.key];
              const on = sel === i;
              return (
                <li key={x.key} className="relative">
                  <button
                    type="button"
                    onClick={() => setSel(i)}
                    aria-pressed={on}
                    className={cn("flex h-[4.25rem] w-full items-center gap-3 rounded-2xl px-1.5 text-left", anim, on ? "bg-on-primary/12" : "hover:bg-on-primary/6")}
                  >
                    <span className={cn("relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full ring-4", xs.dot, on ? "ring-on-primary" : "ring-[#0b2a3a]")}>
                      <xs.Icon className="h-5 w-5 text-on-primary" strokeWidth={2.4} />
                      {on && <span aria-hidden className="absolute -right-1.5 -bottom-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#ffc93d] text-[10px] font-extrabold text-[#7a4a00] shadow-level-1">₩</span>}
                    </span>
                    <span className="min-w-0">
                      <span className="block type-caption font-semibold text-on-primary/60 tabular">정거장 {x.no}</span>
                      <span className={cn("block type-body-md font-bold [word-break:keep-all]", on ? "text-on-primary" : "text-on-primary/80")}>{x.verb}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
          <div key={s.key} className="rounded-2xl bg-canvas px-4 py-4 motion-safe:animate-[kk-fade-in_.3s_ease-out] sm:px-5" aria-live="polite">
            <p className={cn("flex items-center gap-2 type-caption font-bold", st.text)}>
              <StationDot k={s.key} size="sm" />
              정거장 {s.no} · {s.label}
            </p>
            <p className="mt-1 type-heading-md text-ink [word-break:keep-all]">{s.verb}</p>
            <p className="mt-2 type-body-md text-ink-secondary ko-justify">{s.what}</p>
            <p className="mt-3 flex items-center justify-between gap-2 type-caption font-bold text-ink">
              맡는 곳 <span className="flex items-center gap-1.5 font-normal text-ink-mute">홈페이지 조직도 기준 <Tag kind="official" /></span>
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {s.units.map((u) => (
                <span key={u} className={cn("rounded-lg px-2.5 py-1 type-caption font-semibold [word-break:keep-all]", st.soft, st.text)}>
                  {u}
                </span>
              ))}
            </div>
            <div className="mt-3 rounded-xl bg-canvas-soft px-3.5 py-2.5">
              <p className="type-caption font-bold text-ink">이 정거장이 없으면?</p>
              <p className="mt-0.5 type-body-md text-ink ko-justify">{s.without}</p>
            </div>
            <div className="mt-2.5 flex items-start gap-2">
              <span className="mt-[3px]">
                <Tag kind="news" />
              </span>
              <p className="min-w-0 flex-1 type-body-md text-ink ko-justify">
                <span className="font-bold">올해 이 정거장에서 — </span>
                {s.year}
              </p>
            </div>
          </div>
        </div>
      </div>
      {s.term && <TermBox term={s.term.term} def={s.term.def} pic={s.term.pic} />}
      {s.key === "send" && <SupplyNote />}
      {s.key === "check" && <Line kind="news">{BIS}</Line>}
      {s.key === "fix" && (
        <Chat who="올해 5월, 면접을 앞둔 한 준비생" kind="talk" note="구조조정은 산은 PT에서 가장 두려운 주제로 자주 꼽혀요. 이 정거장을 알면 덜 무서워요.">
          “산은 피티 제발 구조조정만 안 나왔으면”
        </Chat>
      )}
      <Card>
        <CardTitle kind="official">10개 부문을 다섯 정거장에 올리면</CardTitle>
        <p className="mt-1 type-caption text-ink-mute">산은 홈페이지 조직도 (2026년 10월 31일 확인) · 부문 밖 조직(준법·검사·소비자보호)은 5번에 함께</p>
        <ul className="mt-3 space-y-2">
          {STATIONS.map((x) => (
            <li key={x.key} className="flex flex-wrap items-center gap-1.5">
              <StationTag k={x.key} />
              {DIVISIONS.filter((d) => d.station === x.key).map((d) => (
                <span key={d.name} className="rounded-lg bg-canvas-soft px-2 py-1 type-caption font-semibold text-ink">
                  {d.name}
                </span>
              ))}
            </li>
          ))}
        </ul>
        <Line kind="official">심사평가부문 아래에는 개인·기관을 상대하는 연금신탁본부도 있어요. 그래서 ‘산은은 개인 고객이 아예 없다’고 말하면 틀려요.</Line>
      </Card>
      <UseBox>
        <p>“산은 부서는 어떻게 나뉘나요?”에 10개 부문을 외워 답하지 않아도 돼요.</p>
        <p>‘돈을 모으고, 따지고, 내보내고, 다루고, 설계하는 부서’로 30초에 말하고, 가고 싶은 정거장 하나를 덧붙여요.</p>
      </UseBox>
    </div>
  );
}

/* 10개 부문 — 하는 일 한 줄과 올해 한 일 (11장 요약표도 이걸 써요) */
const DIVISIONS: { name: string; station: StationKey; does: string; year: string }[] = [
  { name: "재무·지원부문", station: "raise", does: "산금채 발행·자금 관리(자금부), 예금(수신기획부), 인사·총무", year: "2025 결산 정부 배당 8,806억원 (3월)" },
  { name: "심사평가부문", station: "check", does: "여신·투자 심사, 기업 신용평가, 연금·신탁(연금신탁본부)", year: "재무분석 AI 에이전트를 여신 업무에 도입 (4월)" },
  { name: "리스크관리부문", station: "check", does: "BIS비율·위험 한도 관리, 여신감리, IT·AI본부", year: "HMM 지분 위험가중치 면제가 2028년 6월까지 이어져요" },
  { name: "기업금융부문", station: "send", does: "대기업·중견기업 대출, 산업 지원 프로그램, 구조조정(기업개선본부)", year: "석유화학 대산·여수 사업재편 금융지원" },
  { name: "혁신성장금융부문", station: "send", does: "벤처 직접투자(벤처금융본부), 정책펀드 출자, 간접투융자, 넥스트라운드", year: "넥스트라운드 900회 (6월)" },
  { name: "자본시장부문", station: "send", does: "회사채 발행 주선, M&A 자문, PE, PF(PF본부)", year: "신안우이 해상풍력 PF 약정 — KB국민은행과 공동 주선 (4월)" },
  { name: "글로벌사업부문", station: "send", does: "해외 지점·법인 네트워크, 무역금융, 금융공학, 자금 운용", year: "하노이지점 본인가 (1월)" },
  { name: "지역성장부문", station: "send", does: "8개 지역본부·국내 지점, 해양산업금융본부, 남부권투자금융본부(부산)", year: "KDB 넥스트원 광주 개소 (7월)" },
  { name: "국민성장펀드부문", station: "send", does: "첨단전략산업기금 운용 — 총괄협력·대출운용·투자운용·심사지원", year: "10월 말 누적 39건, 22.3조원 승인" },
  { name: "전략기획부문", station: "plan", does: "경영계획(종합기획부), 영업·투자 기획, ESG, KDB미래전략연구소", year: "5년 250조원 계획 (1월 보고·2월 공개)" },
];

/* ------------------------------------------------------------------ */
/* 4. 신입의 자리                                                         */
/* ------------------------------------------------------------------ */

const DUTIES: { text: string; st: StationKey }[] = [
  { text: "대출·투자·보증 등 산업자금 공급", st: "send" },
  { text: "온렌딩 대출·간접투자", st: "send" },
  { text: "회사채 주선·인수, PF, M&A, PEF", st: "send" },
  { text: "해외채권 발행 주선·해외투자", st: "send" },
  { text: "기업구조조정·컨설팅", st: "fix" },
  { text: "산금채 발행·외화차입·예수금", st: "raise" },
  { text: "금융경제분석·법률지원·기술·산업분석", st: "plan" },
  { text: "내부 경영관리", st: "plan" },
  { text: "AI·IT 관련 업무", st: "plan" },
];

function BranchGuess() {
  const [pick, setPick] = useState<"yes" | "no" | null>(null);
  return (
    <Card>
      <CardTitle kind="rumor">단톡방 퀴즈 — 맞을까요, 틀릴까요?</CardTitle>
      <p className="mt-2 inline-block rounded-2xl rounded-bl-sm bg-[#fde8ef] px-3.5 py-2 type-body-md font-semibold text-ink">“산은은 지방지점이 60개임”</p>
      <div className="mt-3 flex gap-2">
        {(
          [
            ["yes", "맞다"],
            ["no", "틀리다"],
          ] as const
        ).map(([k, l]) => (
          <button
            key={k}
            type="button"
            onClick={() => setPick(k)}
            aria-pressed={pick === k}
            className={cn("flex-1 rounded-xl border-2 py-2.5 type-body-md font-bold", anim, pick === k ? "border-brand-dark bg-brand-dark text-on-primary" : "border-hairline bg-canvas text-ink hover:border-brand-dark/40")}
          >
            {l}
          </button>
        ))}
      </div>
      {pick && (
        <div className="mt-3 space-y-2 motion-safe:animate-[kk-fade-in_.3s_ease-out]">
          <Line kind="official">틀려요. 국내 영업점은 본점 영업부까지 합쳐 전국 59곳이에요(2026년 6월 말). 서울 16곳, 경기·인천 15곳을 빼면 28곳이고, 12월 말 경산·용인지점이 합쳐지면 전국 57곳이 돼요.</Line>
          <Line kind="official">단톡방에 ‘대한민국 최동북단 고성지점’ 농담도 있었지만, 강원도의 산은 영업점은 원주지점 한 곳뿐이에요.</Line>
          <Line kind="view">60이라는 숫자는 지방이 아니라 전국 전체에 가까워요. 1장에서 본 ‘예금보다 채권’ 구조가 지점 수로 드러나는 장면이에요.</Line>
        </div>
      )}
    </Card>
  );
}

function Rookie() {
  return (
    <div className="space-y-5">
      <Card>
        <CardTitle kind="official">공고에 적힌 신입의 일 — 다섯 정거장이 다 있어요</CardTitle>
        <p className="mt-1 type-caption text-ink-mute">2027년 5급 신입행원(일반) 채용공고 ‘주요 담당직무’</p>
        <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
          {DUTIES.map((d) => (
            <li key={d.text} className="flex items-center gap-2 rounded-xl bg-canvas-soft px-3 py-2 type-body-md text-ink [word-break:keep-all]">
              <StationDot k={d.st} size="sm" />
              {d.text}
            </li>
          ))}
        </ul>
        <p className="mt-3 type-body-md text-ink-secondary ko-justify">어느 정거장에서 시작할지는 정해져 있지 않아요. 지원서를 쓸 때 정거장 하나를 골라 두면, 면접에서 할 말이 생겨요.</p>
      </Card>
      <Line kind="official">근무지는 공고에 “본점, KDB Digital Square 또는 전국 영업점 배치 가능”이라고 적혀 있어요. KDB Digital Square는 경기도 하남에 있어요. 지방인재로 뽑힌 사람은 해당 권역의 부서나 영업점에서 일하는 게 원칙이에요.</Line>
      <Line kind="official">2024년 상반기 신입행원(일반직A) 84명은 1월 31일부터 3월 8일까지 본점과 디지털스퀘어 등에서 연수를 받았어요. 여신 이론과 실습, 신용평가시스템 실습, 산업 스터디가 들어 있었어요 (산은 사보 「KDB소식」 2024년 4월호).</Line>

      <p className="type-heading-sm text-ink">지점은 무슨 일을 할까요?</p>
      <P>산은 지점은 창구에 번호표를 뽑고 줄 서는 곳이 아니에요. 지역 기업에 대출하고, 다른 은행을 거쳐 작은 기업을 돕고, 수출입 기업의 외화 거래를 처리해요.</P>
      <TermBox
        term="온렌딩"
        def="산은이 시중은행에 돈을 대 주고, 시중은행이 그 돈으로 중소·중견기업에 대출하는 방식이에요."
        pic="지점이 적은 산은이, 직접 닿기 어려운 작은 기업까지 다른 은행의 손을 빌려 지원하는 길이에요."
      />
      <Line kind="news">산은은 지역 지점의 대출 기능에 본점이 하던 벤처투자·펀드 조성 기능을 더해, 지역 안에서 일을 끝낼 수 있는 체계를 만들겠다고 설명해요 (메트로신문, 2026년 10월 12일). 지금 지점의 중심이 대출이라는 뜻이기도 해요.</Line>
      <BranchGuess />

      <Fold title="단톡방에서 도는 신입 생활 이야기 (확인할 수 없는 말이에요)">
        <Chat who="필기 전후, 여러 준비생" kind="talk">
          “연수원이 거의 내무반이래요” · “시험, 시험, 시험”
        </Chat>
        <Line kind="official">공식 자료에서 별도 연수원 시설은 확인되지 않아요. 2024년 사보에는 본점과 디지털스퀘어 등에서 연수했다고 나와요.</Line>
        <Line kind="rumor">신입 지점 발령이 고민거리로 자주 나와요. 어디로 가는지에 따라 생활이 크게 달라진다는 이야기예요.</Line>
        <Line kind="rumor">“IB 부서는 오래 못 있고 순환한다”는 말도 있어요. 부서를 옮기는 주기는 공식 자료에서 확인되지 않아요.</Line>
        <Line kind="rumor">“작년에 30대 중반 입행자도 있었다”는 말도 있어요. 공고상 연령 제한은 없어요(만 60세 이상 제외).</Line>
      </Fold>
      <Line kind="news">산은은 2026년 4월 기업 재무분석을 돕는 AI 에이전트를 여신 업무에 들였고, 앞으로 여신 업무 전반으로 넓히겠다고 했어요. 신입이 하던 재무분석 초안을 AI가 쓰는 시대라면, 사람은 무엇을 할까요? 면접 질문으로 나오기 좋은 재료예요.</Line>
      <UseBox>
        <p>“지방 지점에 가면 어떻게 하겠나”에는 ‘어디든 가겠다’보다, 지점이 하는 일(지역 기업 대출·온렌딩)을 알고 거기서 배울 것 하나를 말하는 편이 힘이 있어요.</p>
      </UseBox>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 5. 상사 셋                                                            */
/* ------------------------------------------------------------------ */

const BOSSES = [
  { key: "fsc", who: "금융위원회", role: "주무부처", text: "정책 방향을 정하고 산은에 과제를 줘요. 산은은 매년 1월 금융공공기관 업무보고에서 한 해 계획을 보고해요(2026년 1월 13일).", like: "감독" },
  { key: "gov", who: "정부", role: "지분 100% 주주", text: "배당을 받고, 필요하면 돈을 더 넣어요(출자). 2025년 결산 산은 배당은 8,806억원으로, 정부가 출자기관에서 받은 배당 2조 7,951억원 가운데 가장 큰 몫이에요 (재정경제부, 2026년 5월).", like: "구단주" },
  { key: "na", who: "국회 정무위원회", role: "국정감사 · 법", text: "매년 10월 국감에서 산은을 따져 물어요. 본점 위치나 자본금 한도처럼 산은법을 바꾸는 일도 여기서 해요.", like: "심판" },
];

const PLAN250 = [
  { label: "첨단·미래전략산업 경쟁력 강화", v: 100 },
  { label: "지역금융 확대", v: 75 },
  { label: "주력산업 지원 (산업 균형 유도)", v: 50 },
  { label: "국민성장펀드 연계", v: 25 },
];

function Bosses() {
  const [sel, setSel] = useState(0);
  const b = BOSSES[sel];
  return (
    <div className="space-y-5">
      <TryHint>상사를 눌러 보세요</TryHint>
      <div className="rounded-3xl bg-canvas p-3 shadow-level-2 sm:p-5">
        <div className="grid grid-cols-3 gap-2">
          {BOSSES.map((x, i) => (
            <button
              key={x.key}
              type="button"
              onClick={() => setSel(i)}
              aria-pressed={sel === i}
              className={cn("flex min-h-20 flex-col items-center justify-center rounded-2xl border-2 px-1.5 py-3 text-center", anim, sel === i ? "border-brand-dark bg-brand-dark text-on-primary shadow-level-2" : "border-hairline bg-canvas text-ink hover:border-brand-dark/40")}
            >
              <span className="type-body-md font-bold [word-break:keep-all]">{x.who}</span>
              <span className={cn("mt-1 rounded-full px-2 py-0.5 text-[11px] font-bold", sel === i ? "bg-on-primary/15" : "bg-canvas-soft text-ink-secondary")}>{x.role}</span>
            </button>
          ))}
        </div>
        <div aria-hidden className="flex justify-center py-2 text-ink-mute">
          <ArrowRight className="h-5 w-5 rotate-90" strokeWidth={2.2} />
        </div>
        <div className="flex items-center justify-center gap-2 rounded-2xl bg-brand-dark px-4 py-3 text-on-primary">
          <Landmark className="h-5 w-5" strokeWidth={2.2} />
          <span className="type-body-md font-bold">한국산업은행 회장</span>
        </div>
      </div>
      <Explain eyebrow={b.role} title={b.who}>
        {b.text}
      </Explain>
      <Line kind="view">비유하면 금융위는 감독, 정부는 구단주, 국회는 심판이에요. 산은 회장은 이 셋을 동시에 상대해요.</Line>

      <TermBox
        term="생산적 금융"
        def="가계대출과 부동산으로 쏠린 돈을 기업·첨단산업·벤처로 돌리자는 정부의 금융정책 방향이에요."
        pic="2026년 금융위의 첫 번째 과제예요. 산은은 그 전환을 실제로 집행하는 도구예요."
      />
      <Card>
        <CardTitle kind="news">산은의 5년 공급 계획 — 250조원</CardTitle>
        <p className="mt-1 type-caption text-ink-mute">영문 연차보고서 이름은 ‘KDB NEXT Korea Program’ · 1월 금융위 업무보고, 2월 25일 회장 기자간담회에서 축별 금액 공개</p>
        <ul className="mt-4 space-y-2.5">
          {PLAN250.map((x, i) => (
            <li key={x.label}>
              <div className="flex items-baseline justify-between gap-2">
                <span className="type-body-md font-semibold text-ink [word-break:keep-all]">{x.label}</span>
                <span className="tabular type-body-md font-bold text-ink">{x.v}조</span>
              </div>
              <span className="mt-1 block h-3 overflow-hidden rounded-full bg-canvas-soft">
                <span className={cn("block h-full rounded-full", i === 0 ? "bg-primary" : "bg-primary/40")} style={{ width: `${x.v}%` }} />
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-3 type-body-md text-ink-secondary ko-justify">이 네 숫자가 산은의 앞으로 5년 우선순위예요. “요즘 산은은 뭐에 집중하나요?”에 이 순서대로 말하면 돼요. 첨단산업 100조원 가운데 90조원은 ‘AI 대전환 지원자금’ 같은 특별 대출 상품에, 10조원은 새 펀드에 배정했다고 해요 (메트로신문, 10월 12일).</p>
      </Card>
      <Line kind="news">1월 업무보고 때 금융위 사무처장은 정책금융기관끼리 협의체를 꾸리는 게 통폐합이나 기능 재조정을 염두에 둔 것은 아니라고 했어요. 3월 27일 산은·기은·수은·신보·무보·기보 6대 정책금융기관이 생산적 금융 협의회를 꾸렸고, 산은이 주관을 맡았어요.</Line>
      <Fold title="올해 상사들이 산은에 깔아 준 길 (제도 정비)">
        <Line kind="official">3월 6일 — 금융위 면책심의위원회가 국민성장펀드에 함께 참여한 금융기관은 고의·중과실이 없으면 손실이 나도 제재하지 않기로 했어요. 위험한 투자를 승인할 수 있게 하려는 장치예요.</Line>
        <Line kind="news">3월 — 은행이 국민성장펀드에 넣는 비상장 주식의 위험가중치를 400%에서 100%로 낮출 길이 열렸어요(정부 보조 등 세 요건). 시중은행이 산은 옆에 돈을 넣기 쉬워졌어요.</Line>
        <Line kind="news">7월 15일 — 금융위 하반기 업무보고에서 국민성장펀드를 150조원에서 200조원으로 키우고(연 30조 → 40조원), 지역 배정도 연 12조원에서 16조원으로 늘리기로 했어요.</Line>
      </Fold>
      <div className="grid gap-3 md:grid-cols-2">
        <Said who="이억원 금융위원장" where="2026년 10월 22일 종합감사, 오전 (딜사이트)" portrait="lee-eogweon">
          산은 부산 이전은 “그렇게 하지 않는 것으로 정리가 된 것으로 알고 있다”
        </Said>
        <Said who="이억원 금융위원장" where="같은 날 오후, 발언을 고치며 (딜사이트)" portrait="lee-eogweon">
          “국회에서 결정하실 것이고 국회의 권한이 있으신 것”
        </Said>
      </div>
      <Line kind="view">7월 KDB 넥스트원 광주 개소식에는 금융위원장이 직접 왔어요. 상사가 산은에 기대하는 게 펀드·지역·벤처라는 신호로 읽혀요. 반면 부산 이전은 위원장도 하루 사이에 말을 고칠 만큼 민감한 사안이에요.</Line>
      <UseBox>
        <p>“금융위와 산은은 어떤 관계인가요?”에는 상사 셋 구조를 20초에 말해요.</p>
        <p>정책을 칭찬하거나 비판하기보다, ‘이렇게 설계돼 있고 산은은 여기서 이 역할’까지만 말하는 편이 안전해요.</p>
      </UseBox>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 6. 올해 10장면                                                        */
/* ------------------------------------------------------------------ */

const SCENES: { when: string; title: string; st: StationKey; unit: string; text: string; use: string; href?: string }[] = [
  {
    when: "2월 · 7월",
    title: "석유화학 사업재편 — 전통 역할의 2026년판",
    st: "fix",
    unit: "기업금융부문 기업개선본부",
    text: "대산 1호(HD현대케미칼·롯데케미칼)는 2월 채권단 회의에 올라 3월 결의됐어요. 채권기관들이 7.9조원 상환을 3년 미뤄 주고, 신규 자금 최대 1조원 중 약 4,300억원을 산은이 맡았어요. 7월 여수 1호(여천NCC·롯데케미칼)는 산은이 혼자 신규 최대 4,500억원을 대고, 기존 대출 4.4조원은 2029년 말까지 미뤄 줘요. 대신 에틸렌 설비를 멈춰요. 두 곳을 합친 감축(249만t)은 최소 목표(270만t)의 92%이고, 울산은 아직이에요.",
    use: "‘구조조정의 의미’를 물으면 10년 전 조선업 대신 이 사례로. 돈을 넣는 조건이 ‘설비 감축’이라는 점이 핵심이에요.",
  },
  {
    when: "1년 내내",
    title: "국민성장펀드 — 3편에서 자세히",
    st: "send",
    unit: "국민성장펀드부문",
    text: "150조원으로 시작해 200조원으로 커진 첨단산업 정책 펀드예요. 10월 29일까지 39건, 22.3조원이 승인됐어요(올해 목표 30조원의 74.3%). 구조와 국감 쟁점은 3편에 따로 정리했어요.",
    use: "다들 말하는 주제라, 말할 거면 숫자 하나와 쟁점 하나를 붙여야 묻히지 않아요.",
    href: "/magazine/7",
  },
  {
    when: "9월",
    title: "HMM 경영권 매각 검토 — 구조조정의 끝은 파는 것",
    st: "fix",
    unit: "기업개선본부 투자관리실",
    text: "산은(35.42%)과 해양진흥공사(35.08%)가 대주주인 HMM의 매각 방식 검토에 들어갔어요. 다만 10월 말까지 매각 공고나 매각 주관사 선정은 없어요. 박 회장은 2월에 ‘부산 이전이 먼저’라는 입장을 밝혔고, 2024년 초 하림그룹과의 매각 협상은 결렬된 전례가 있어요.",
    use: "‘구조조정의 성공이 뭔가’에는 살린 것보다 민간에 돌려준 것. 왜 팔기 어려운지(덩치·가격·노조·지역)까지 말하면 한 걸음 더 가요.",
  },
  {
    when: "1월 · 2월",
    title: "5년 250조원 계획 — 산은의 중기 청사진",
    st: "plan",
    unit: "기획관리부문",
    text: "첨단·미래전략산업 100조, 지역금융 75조, 주력산업 지원 50조, 국민성장펀드 연계 25조원. 첨단산업 몫 100조원은 AI 대전환 지원자금 같은 특별 대출 상품 90조원과 새 펀드 10조원으로 나눠요.",
    use: "“산은의 요즘 방향”에는 이 네 숫자를 순서대로.",
  },
  {
    when: "6월",
    title: "넥스트라운드 900회 · 넥스트라이즈 540여 개사",
    st: "send",
    unit: "혁신성장금융부문",
    text: "2016년 시작한 스타트업 투자 설명회 넥스트라운드가 6월 900회를 넘겼고, 스타트업 행사 넥스트라이즈에는 540여 개 스타트업이 전시에 나왔어요. 4,000억원 규모 세컨더리펀드(먼저 투자한 사람의 지분을 사 주는 펀드)는 6월과 8월 운용사를 골라 조성 절차를 마쳤어요.",
    use: "벤처 지망이면 성과와 함께, 아래 7장의 ‘벤처 공급이 줄었다’는 비판도 같이 알고 말해요.",
  },
  {
    when: "5월 · 7월",
    title: "KDB 넥스트원 광주 · 지방은행 4곳과 협약",
    st: "send",
    unit: "지역성장부문",
    text: "5월 BNK·iM·JB 금융지주, Sh수협은행과 지역성장 협약을 맺었고, 7월 광주에 창업 지원 거점 KDB 넥스트원을 열었어요. 부산에 이은 두 번째 지역 거점이고, 개소식에는 금융위원장도 왔어요. 하반기 전주·대구 계획은 10월 말까지 개소 소식이 없어요.",
    use: "지방인재 전형이거나 지역 지점을 생각한다면, 이 항목이 곧 내 이야기예요.",
  },
  {
    when: "4월",
    title: "신안우이 해상풍력 PF 약정",
    st: "send",
    unit: "자본시장부문 PF본부",
    text: "전남 신안 앞바다 해상풍력에 총사업비 3.4조원, 자기자본 5,100억원에 차입 2.89조원을 모았어요. 약정식은 산은 본점에서 열렸고, 금융주선은 산은과 KB국민은행이 공동으로 맡았어요(공동 대표금융주간사).",
    use: "PF를 설명해 보라면 이 사례로. ‘발전소가 벌 돈을 믿고 빌려주는 것’.",
  },
  {
    when: "8월 · 2월",
    title: "KDB생명 · 한진칼 · 홈플러스",
    st: "fix",
    unit: "기업개선본부",
    text: "산은이 99.66%를 가진 KDB생명은 여러 번 매각에 실패한 끝에 8월 한국투자금융지주가 우선협상대상자가 됐어요. 다만 매각 전 증자 규모를 두고 협상이 길어져 본계약은 아직이에요. 한진칼 지분 10.58%는 처리 방향이 정해지지 않았어요. 홈플러스는 산은이 채권단이 아니라 직접 개입이 어렵다고 했어요.",
    use: "“왜 홈플러스는 안 돕고 석유화학은 돕나”에는 채권 보유 여부, 산업 전체에 미치는 파장, 회사의 자구 노력 세 기준으로.",
  },
  {
    when: "1월",
    title: "30억달러 글로벌본드",
    st: "raise",
    unit: "1번 정거장 (조달)",
    text: "해외 투자자에게 3년·5년 만기 달러 채권을 팔아 30억달러를 모았어요. 주문은 52억달러가 몰렸고, 5년 고정금리물은 같은 만기로는 역대 가장 낮은 가산금리였다고 보도됐어요.",
    use: "1번 정거장(조달)을 사례로 말할 때 쓰기 좋아요.",
  },
  {
    when: "3월",
    title: "성적표 — 순이익 · 공급 · 배당",
    st: "raise",
    unit: "재무·지원부문",
    text: "2025년 순이익 1조 7,152억원(은행 별도), 자금 공급 95.9조원, 정부 배당 8,806억원. 자회사까지 합친 연결 순이익은 5조 2,296억원인데, 지분법이익이 크게 늘어서예요. 정부 배당 수입 2조 7,951억원 가운데 산은·기은·수은이 69.9%를 냈어요.",
    use: "“산은 실적 아세요?”에는 이 세 숫자.",
  },
];

function TenScenes() {
  const [f, setF] = useState<StationKey | "all">("all");
  const list = SCENES.filter((x) => f === "all" || x.st === f);
  return (
    <div className="space-y-5">
      <TryHint>정거장으로 골라 보세요</TryHint>
      <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
        <button type="button" onClick={() => setF("all")} aria-pressed={f === "all"} className={cn("shrink-0 rounded-full px-3 py-1.5 type-caption font-bold", anim, f === "all" ? "bg-brand-dark text-on-primary" : "bg-canvas text-ink-secondary shadow-level-1")}>
          전체 {SCENES.length}
        </button>
        {STATIONS.map((x) => {
          const n = SCENES.filter((s) => s.st === x.key).length;
          if (!n) return null;
          return (
            <button
              key={x.key}
              type="button"
              onClick={() => setF(x.key)}
              aria-pressed={f === x.key}
              className={cn("inline-flex shrink-0 items-center gap-1.5 rounded-full py-1 pr-3 pl-1 type-caption font-bold", anim, f === x.key ? "bg-brand-dark text-on-primary" : "bg-canvas text-ink-secondary shadow-level-1")}
            >
              <StationDot k={x.key} size="sm" />
              {x.label} {n}
            </button>
          );
        })}
      </div>
      <ol className="space-y-3">
        {list.map((x) => (
          <li key={x.title} className="rounded-2xl bg-canvas px-4 py-4 shadow-level-1 motion-safe:animate-[kk-fade-in_.3s_ease-out] sm:px-5">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="type-caption font-bold text-ink-mute tabular">{x.when}</span>
              <StationTag k={x.st} />
              <span className="ml-auto">
                <Tag kind="news" />
              </span>
            </div>
            <p className="mt-1.5 type-heading-sm text-ink [word-break:keep-all]">{x.title}</p>
            <p className="mt-1.5 type-body-md text-ink-secondary ko-justify">{x.text}</p>
            <p className="mt-2 type-caption font-semibold text-ink-mute">맡은 곳 · {x.unit}</p>
            <p className="mt-2 flex items-start gap-2 rounded-xl bg-[#e3f5ea] px-3 py-2 type-body-md text-ink [word-break:keep-all]">
              <Sparkles className="mt-1 h-4 w-4 shrink-0 text-[#1d6e43]" strokeWidth={2.2} />
              <span>
                <span className="font-bold">면접 연결 · </span>
                {x.use}
              </span>
            </p>
            {x.href && (
              <Link href={x.href} className="mt-2 inline-flex items-center gap-1 type-caption font-semibold text-primary-text hover:underline">
                3편 국민성장펀드 딥다이브 보기 <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.2} />
              </Link>
            )}
          </li>
        ))}
      </ol>
      <Line kind="view">국민성장펀드는 다들 말해요. 석유화학, 신안우이 해상풍력, KDB 넥스트원 광주처럼 덜 겹치는 장면을 부서 이름과 함께 말하면 ‘알고 왔다’는 인상을 줘요.</Line>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 7. 논쟁 넷                                                            */
/* ------------------------------------------------------------------ */

type DebateKey = "busan" | "overlap" | "capital" | "identity";

const DEBATES: Record<DebateKey, { label: string; title: string; one: string; other: string; stance: string; use: string; timeline?: { when: string; what: string }[] }> = {
  busan: {
    label: "부산 이전",
    title: "본점을 부산으로 옮길까?",
    one: "국가 균형발전을 위해 옮겨야 한다는 쪽이에요. 2023년 이전 대상으로 정했는데 진전이 없다는 비판이 국감에서 다시 나왔어요(박성훈 의원 등). 부산시장도 이전 대상이 되면 반드시 부산으로 와야 한다고 했어요.",
    other: "금융 중심지를 떠나면 기능이 약해지고 사람이 빠져나간다는 반론이에요. 노조 설문(1,986명 응답)에서 반대 97.4%, 이전하면 퇴사·이직을 생각하겠다는 답이 57.4%였어요. 산은을 옮기는 대신 부산에 별도 정책금융기관(동남권투자공사)을 세우자는 논의도 있어요.",
    stance: "산은법 제4조는 “본점을 서울특별시에 둔다”고 정해요. 옮기려면 법을 고쳐야 해서 국회가 결정권을 쥐고 있어요. 박 회장은 2월 간담회에서 이전이 결정되면 적극 지원하겠다고 했어요. 국토교통부 장관은 10월 23일, 2차 공공기관 이전 계획을 11월 중 발표하겠다며 산은 포함 여부는 아직 정해지지 않았다고 했어요.",
    use: "찬반을 물으면 양쪽 논거를 한 문장씩 말하고, 결정은 국회의 몫이라는 점을 짚어요. ‘모른다’가 가장 위험해요. 타임라인을 아는 게 답이에요.",
    timeline: [
      { when: "9월 3일", what: "정부가 2차 공공기관 이전의 대상·지역 발표를 4분기로 미룸" },
      { when: "9월 30일", what: "산은 노조 설문 공개 — 반대 97.4%" },
      { when: "10월 13일", what: "금융위원회는 2027년 하반기 세종 이전 확정. 산은 등 국책은행은 별도 검토" },
      { when: "10월 22일", what: "금융위원장 “하지 않는 것으로 정리” 발언 뒤 같은 날 “국회의 권한”으로 수정" },
      { when: "10월 23일", what: "국토부 장관 “2차 이전 계획 11월 중 발표, 산은은 아직 결정된 것 없다”" },
      { when: "10월 26~27일", what: "부산 시민단체 규탄 성명, 부산시장 “이전 대상이 되면 무조건 부산으로”" },
    ],
  },
  overlap: {
    label: "역할 중복",
    title: "정책금융기관이 너무 많지 않나?",
    one: "산은·수은·기은·신보의 일이 겹친다는 지적이에요. 동남권투자공사까지 생기면 더 겹친다는 거예요.",
    other: "고객이 다르다는 반론이에요. 수은은 수출, 기은은 중소기업, 신보는 보증, 산은은 산업 전반과 구조조정이에요.",
    stance: "1월 업무보고에서 금융위 사무처장은 기관끼리 협의체를 꾸리는 게 통폐합·기능 재조정을 염두에 둔 것은 아니라고 했어요. 3월에 꾸린 6대 정책금융기관 협의회(산은 주관)로 일을 나누고 있어요.",
    use: "‘타기관 인턴을 했는데 왜 산은이냐’와 같은 뿌리의 질문이에요. 그 기관이 안 하고 산은만 하는 일 하나를 말할 수 있으면 돼요.",
  },
  capital: {
    label: "건전성·출자",
    title: "정부 돈에 기대는 구조 아닌가?",
    one: "BIS비율(2026년 6월 말 14.52%)이 국내은행 평균(15.77%)보다 낮고, 자본금 한도를 30조원에서 45조원으로 올린 것(2025년 8월 국회 통과)은 앞으로 정부 돈이 더 들어간다는 예고라는 지적이에요.",
    other: "정책 역할의 대가라는 반론이에요. 산은에 따르면 최근 5년 동안 정부에 배당으로 약 3.5조원을 돌려줬어요.",
    stance: "박 회장은 신년사에서 수익성을 ‘정책금융을 흔들림 없이 지속하는 데 필요한 기초체력’이라고 했어요. 정책을 하려면 버는 힘도 필요하다는 입장이에요.",
    use: "“산은이 손실 나는 투자를 해도 되나”와 이어져요. 설계된 손실(정책 목적, 면책 장치)과 잘못된 손실(부실 심사)을 나눠 말해요.",
  },
  identity: {
    label: "구조조정 vs 성장",
    title: "산은은 살리는 은행인가, 키우는 은행인가?",
    one: "대기업과 국민성장펀드로 돈이 쏠린다는 비판이에요. 민병덕 의원실 자료로는 창업 7년 이내 기업 공급이 2021년 1조 9,139억원에서 2025년 8,860억원으로 줄었고, 대기업 비중은 20.9%에서 25.3%로 올랐어요. 2023년부터 올해 7월까지 중소기업 자금의 53.1%는 수도권으로 갔어요.",
    other: "산은은 수도권 비중이 수도권의 경제 규모 비중(2024년 지역내총생산 52.8%)과 비슷하다고 해명했어요. 올해 넥스트라운드 900회, 세컨더리펀드 조성처럼 벤처 쪽 일도 이어지고 있어요.",
    stance: "신년사는 첫째 목표로 ‘산은 본연의 역할인 산업과 기업 육성’을 꼽으면서, 같은 목표 안에 전통 주력산업의 사업구조 재편 지원도 넣었어요.",
    use: "어느 한쪽을 고르기보다 ‘둘 다 해야 하는 은행’이라는 2장의 결론으로 돌아가요.",
  },
};

function Debates() {
  const [k, setK] = useState<DebateKey>("busan");
  const d = DEBATES[k];
  return (
    <div className="space-y-5">
      <Tabs label="논쟁 고르기" value={k} onChange={setK} items={(Object.keys(DEBATES) as DebateKey[]).map((x) => ({ key: x, label: DEBATES[x].label }))} />
      <div key={k} className="space-y-3 motion-safe:animate-[kk-fade-in_.3s_ease-out]">
        <p className="type-heading-md text-ink [word-break:keep-all]">{d.title}</p>
        <div className="grid gap-3 md:grid-cols-2">
          <Card>
            <CardTitle kind="news">한쪽</CardTitle>
            <p className="mt-2 type-body-md text-ink ko-justify">{d.one}</p>
          </Card>
          <Card>
            <CardTitle kind="news">다른 쪽</CardTitle>
            <p className="mt-2 type-body-md text-ink ko-justify">{d.other}</p>
          </Card>
        </div>
        <Card className="bg-canvas-cream">
          <CardTitle kind="news">산은·정부 입장</CardTitle>
          <p className="mt-2 type-body-md text-ink ko-justify">{d.stance}</p>
        </Card>
        {d.timeline && (
          <Fold title="부산 이전 타임라인 (2026년)" defaultOpen>
            <ol className="space-y-1.5">
              {d.timeline.map((t) => (
                <li key={t.when} className="grid grid-cols-[4.5rem_1fr] gap-2 type-body-md [word-break:keep-all]">
                  <span className="font-bold text-primary-text tabular">{t.when}</span>
                  <span className="text-ink">{t.what}</span>
                </li>
              ))}
            </ol>
            {BUSAN_LATEST && <Line kind="news">{BUSAN_LATEST}</Line>}
          </Fold>
        )}
        <UseBox>
          <p>{d.use}</p>
        </UseBox>
      </div>
      <Line kind="view">네 논쟁 모두 정답을 고르는 문제가 아니에요. 면접에서 물으면 양쪽을 다 알고 있다는 걸 보여 주는 게 답이에요.</Line>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 8. 면접 하루                                                          */
/* ------------------------------------------------------------------ */

const FUNNEL = [
  { step: "서류", mult: "15배수 내외" },
  { step: "필기", mult: "3배수 내외" },
  { step: "1차 면접", mult: "1.5배수 내외" },
  { step: "2차 면접", mult: "최종" },
];

const SCHEDULE = [
  { when: "10월 30일(금)", what: "필기 합격 발표" },
  { when: "그 뒤", what: "온라인 인성검사 (면접 참고자료)" },
  { when: "11월 초중순", what: "1차 면접" },
  { when: "11월 17일(화)", what: "1차 발표" },
  { when: "11월 하순", what: "2차 면접 (조별 인터뷰)" },
  { when: "12월 2일(수)", what: "채용예정자 발표" },
];

function InterviewDay() {
  const [pt, setPt] = useState(0);
  const PT = [
    { label: "준비 25분", w: 25, text: "제시문을 받고 25분 동안 발표 자료를 만들어요. 갤럭시탭에 적었다는 후기가 여럿이에요. “제시문 2장을 꽉꽉 채워 적었다”는 사람도 있었어요." },
    { label: "발표 5분", w: 8, text: "적은 화면을 스크린에 띄우고, 면접관이 보면서 진행했다고 해요." },
    { label: "꼬리질문 ×7", w: 20, text: "면접관 세 명이 돌아가며 7개 안팎의 꼬리질문을 했다는 후기가 많아요. 표정을 일부러 굳히고 압박 상황을 관찰하는 것 같다는 해석도 있었어요." },
  ];
  const p = PT[pt];
  return (
    <div className="space-y-5">
      <Card>
        <CardTitle kind="official">공고에 적힌 것부터</CardTitle>
        <p className="mt-1 type-caption text-ink-mute">2027년 5급 신입행원(일반) 채용공고 · 경영·경제 기준</p>
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {FUNNEL.map((f, i) => (
            <span key={f.step} className="flex items-center gap-1.5">
              <span className="rounded-xl bg-canvas-soft px-3 py-2 text-center">
                <span className="block type-body-md font-bold text-ink">{f.step}</span>
                <span className="block type-caption text-ink-secondary tabular">{f.mult}</span>
              </span>
              {i < FUNNEL.length - 1 && <ArrowRight className="h-4 w-4 text-ink-mute" strokeWidth={2.2} />}
            </span>
          ))}
        </div>
        <ul className="mt-3 space-y-1.5 type-body-md text-ink [word-break:keep-all]">
          <li className="flex gap-2">
            <Check className="mt-1 h-4 w-4 shrink-0 text-primary" strokeWidth={2.4} />
            1차 면접은 직무능력면접, P/T면접, 심층과제면접 세 가지예요.
          </li>
          <li className="flex gap-2">
            <Check className="mt-1 h-4 w-4 shrink-0 text-primary" strokeWidth={2.4} />
            1차 점수는 면접 70%에 필기 30%를 더해요. 필기 점수가 여기까지 따라와요.
          </li>
          <li className="flex gap-2">
            <Check className="mt-1 h-4 w-4 shrink-0 text-primary" strokeWidth={2.4} />
            2차 면접은 ‘조별 인터뷰’예요. 공고에 토론·영어 면접이라는 말은 없어요.
          </li>
        </ul>
        <ol className="mt-3 grid gap-1 sm:grid-cols-2">
          {SCHEDULE.map((s) => (
            <li key={s.what} className="grid grid-cols-[6.5rem_1fr] gap-2 rounded-lg px-2 py-1 type-caption [word-break:keep-all]">
              <span className="font-bold text-primary-text">{s.when}</span>
              <span className="text-ink">{s.what}</span>
            </li>
          ))}
        </ol>
      </Card>

      <div className="flex items-center gap-2">
        <p className="type-heading-sm text-ink">올해 5월 면접을 본 사람들의 하루</p>
        <Tag kind="talk" />
      </div>
      <P>여기부터는 2026년 5월 상반기 1차 면접을 본 사람들이 단톡방에 남긴 후기예요. 산은의 공식 설명이 아니고, 하반기에 똑같다는 보장도 없어요.</P>
      <div className="rounded-3xl bg-canvas p-4 shadow-level-2 sm:p-5">
        <div className="flex items-center justify-between type-caption font-bold text-ink-mute tabular">
          <span>오전 9시</span>
          <span>오후 5시</span>
        </div>
        <div className="mt-1.5 flex h-12 gap-1 overflow-hidden rounded-xl">
          {["인성", "PT", "조별(팀)"].map((x) => (
            <span key={x} className="flex flex-1 items-center justify-center bg-brand-dark/85 type-body-md font-bold text-on-primary">
              {x}
            </span>
          ))}
        </div>
        <p className="mt-2 type-caption text-ink-secondary [word-break:keep-all]">하루 종일 세 파트를 봤다는 후기가 많아요. 파트 순서와 시간 배분은 후기마다 달라 그림에서는 같은 크기로 그렸어요.</p>
        <p className="mt-4 type-caption font-bold text-ink">PT 파트를 눌러 보면</p>
        <div className="mt-1.5 flex h-11 gap-1 overflow-hidden rounded-xl">
          {PT.map((x, i) => (
            <button
              key={x.label}
              type="button"
              onClick={() => setPt(i)}
              aria-pressed={pt === i}
              style={{ flexGrow: x.w }}
              className={cn("basis-0 px-1 type-caption font-bold whitespace-nowrap", anim, pt === i ? "bg-[#e5533c] text-on-primary" : "bg-[#ffe9e3] text-[#a8321f] hover:bg-[#ffd9cf]")}
            >
              {x.label}
            </button>
          ))}
        </div>
        <p key={pt} className="mt-2 rounded-xl bg-canvas-soft px-3.5 py-2.5 type-body-md text-ink motion-safe:animate-[kk-fade-in_.3s_ease-out] ko-justify">
          {p.text}
        </p>
      </div>
      <Line kind="view">후기에 나온 ‘인성·PT·조별’이 공고의 ‘직무능력·P/T·심층과제’와 하나씩 맞는지는 확인할 수 없어요. 이름보다, 하루 종일 세 가지를 본다는 점을 기억해 두면 돼요.</Line>

      <div className="grid gap-3 md:grid-cols-2">
        <Chat who="5월 어느 저녁, 면접을 마친 한 준비생" kind="talk" note="꼬리질문에서 막혔다는 후기가 여럿이에요.">
          “꼬리질문 7개 중에 절반 넘게 버벅였어요”
        </Chat>
        <Chat who="다른 준비생" kind="talk" note="PT 주제는 서로 밝히지 않아 공개된 게 없어요.">
          “뻔한 주제가 더 어려워요. 뻔한 걸 제대로 못 하면 티가 나요”
        </Chat>
        <Chat who="같은 날 면접을 본 사람" kind="talk" note="압박의 세기는 방마다, 파트마다 달랐다는 게 가장 정직한 정리예요.">
          “인성은 다정했는데, 피티는 정색”
        </Chat>
        <Chat who="면접을 마친 한 준비생" kind="talk" note="이게 정상이에요.">
          “대답 못 한 건 없었는데, 맞았는지는 모르겠어요”
        </Chat>
      </div>
      <Line kind="official">올해 상반기 채용(공고 이름은 ‘2026년 하반기 5급 신입행원’)은 75명 모집에 경쟁률 62.47대 1, 최종 74명이 뽑혔어요 (잡알리오).</Line>
      <Line kind="talk">1차 발표는 면접이 끝나고 이틀 뒤(5월 22일)에 나왔어요. 상반기는 서류 발표(4월 13일) → 필기(4월 25일) → 1차 면접(5월 15~20일) → 2차 면접(5월 27일부터) → 최종 발표(6월 12일) 순이었어요. 하반기도 같은 간격이라고 단정할 수는 없어요.</Line>
      <Line kind="rumor">2차 면접 후기는 단톡방에 거의 없어요. “1차에서 이미 정해진다”는 말도 돌지만, 한 사람이 전해 들은 말이라 확인할 수 없어요.</Line>
      <Fold title="예전 후기의 ‘토론’은 지금과 달라요">
        <Line kind="news">예전 공고에는 1차에 심층토론·팀과제수행, 2차에 임원면접이 있었다는 기록이 있어요(법률저널 등). 지금 공고의 1차는 심층과제면접, 2차는 조별 인터뷰예요. 예전 후기의 토론 이야기는 지금 전형과 다를 수 있어요.</Line>
      </Fold>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 9. 질문 10                                                            */
/* ------------------------------------------------------------------ */

const QUESTIONS: { q: string; check: string; use: string; to: number; hot?: boolean }[] = [
  { q: "산은이 무슨 일을 하는 은행인지 1분 안에 말해 보세요", check: "회사를 구조로 이해했나", use: "다섯 정거장 + 예금이 아니라 채권으로 모은다는 것", to: 2 },
  { q: "타기관 인턴을 했는데, 왜 거기 말고 산은인가요?", check: "두 기관의 차이를 아는가", use: "그 기관이 안 하고 산은만 하는 일 하나(구조조정·직접투자·기금 운용). 그 기관을 깎아내리지 않기", to: 6, hot: true },
  { q: "정책금융과 민간금융은 무엇이 다른가요?", check: "기본 개념", use: "시중은행 vs 산은 표 가운데 세 줄 + 흔들리는 기업을 다루는 방식의 차이", to: 0 },
  { q: "올해 산은 뉴스 중 기억나는 것은?", check: "관심이 진짜인가", use: "10장면 중 하나를 부서 이름까지. 석유화학·신안우이·넥스트원 광주가 덜 겹쳐요", to: 5 },
  { q: "어느 부서에서 일하고 싶나요? 지점에 가게 되면요?", check: "현실을 알고 왔나", use: "지점이 하는 일(지역 기업 대출·온렌딩)을 알고, 거기서 배울 것 하나", to: 3 },
  { q: "산은이 손실 나는 투자를 해도 되나요?", check: "공공성과 수익성의 균형 감각", use: "“수익성은 기초체력”(신년사) + 고의·중과실이 없으면 제재하지 않는 면책 장치(5장). 설계된 손실과 잘못된 손실은 달라요", to: 4 },
  { q: "부산 이전에 대해 어떻게 생각하나요?", check: "민감한 사안을 다루는 태도", use: "타임라인 + 양쪽 논거 한 문장씩 + 결정은 국회. 한쪽으로 열변하지 않기", to: 6 },
  { q: "산은은 왜 홈플러스는 안 돕고 석유화학은 돕나요?", check: "정책금융이 끼어드는 기준", use: "채권 보유 여부 · 산업 전체 파장 · 자구 노력", to: 5 },
  { q: "전공(경영·경제)을 산은에서 어떻게 쓰겠나요?", check: "직무와 이어 보는 힘", use: "경영은 재무제표 → 신용평가·심사(정거장 2). 경제는 산업·거시 분석 → 연구소·정책 설계(정거장 5). AI가 재무분석을 한다면 사람은 무엇을 하는지까지", to: 2 },
  { q: "10년 뒤 산은은 어떤 은행이어야 하나요?", check: "정체성 변화를 이해했나", use: "살리는 은행 → 키우는 은행, 다만 구조조정도 진행형. ‘둘 다 하는 은행’", to: 1 },
];

function Questions() {
  const [open, setOpen] = useState<number | null>(1);
  const go = useGuideGo();
  return (
    <div className="space-y-5">
      <Line kind="view">아래는 기출이 아니라 예상 질문이에요. 답안을 외우기보다, 질문이 사실 무엇을 확인하는지와 이 글 어디에 재료가 있는지를 적었어요.</Line>
      <ol className="space-y-2">
        {QUESTIONS.map((x, i) => (
          <li key={x.q} className="rounded-2xl bg-canvas shadow-level-1">
            <button type="button" onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i} className="flex w-full items-start gap-3 px-4 py-3.5 text-left">
              <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-dark tabular text-[12px] font-bold text-on-primary">{i + 1}</span>
              <span className="min-w-0 flex-1 type-body-md font-semibold text-ink [word-break:keep-all]">
                {x.q}
                {x.hot && (
                  <span className="ml-1.5 inline-flex translate-y-[-1px] align-middle">
                    <Tag kind="talk" />
                  </span>
                )}
              </span>
              <ChevronDown className={cn("mt-1 h-4 w-4 shrink-0 text-ink-mute transition-transform", open === i && "rotate-180")} strokeWidth={2} />
            </button>
            {open === i && (
              <div className="space-y-2 px-4 pb-4 motion-safe:animate-[kk-fade-in_.3s_ease-out]">
                {x.hot && <p className="type-caption text-ink-mute [word-break:keep-all]">올해 5월 면접에서 여러 명이 받았다고 했고, 작년에 받았다는 사람도 있었어요.</p>}
                <p className="rounded-xl bg-canvas-soft px-3.5 py-2.5 type-body-md text-ink [word-break:keep-all]">
                  <span className="font-bold">사실 무엇을 보나 · </span>
                  {x.check}
                </p>
                <p className="rounded-xl bg-[#e3f5ea] px-3.5 py-2.5 type-body-md text-ink [word-break:keep-all]">
                  <span className="font-bold">재료 · </span>
                  {x.use}
                </p>
                <button type="button" onClick={() => go(x.to)} className="inline-flex items-center gap-1 type-caption font-semibold text-primary-text hover:underline">
                  {x.to + 1}장에서 재료 보기 <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.2} />
                </button>
              </div>
            )}
          </li>
        ))}
      </ol>
      <Fold title="예전 후기와 인턴 면접에서 나온 질문 (참고만)">
        <Line kind="rumor">2015년 하반기 신입 2차 면접 후기(잡코리아): “구조조정의 의미”, “산업은행과 다른 공기업의 차이”. 10년 전 자료예요.</Line>
        <Line kind="rumor">청년인턴 면접 후기(링커리어, 2023~2026): “정책금융이 중요한 이유와 민간 자본과의 차이”, “산은이 잘되는 기업에 몰아서 투자할지, 고르게 투자할지”. 신입 면접이 아니라 인턴 면접이에요.</Line>
        <Line kind="view">해가 바뀌어도 질문의 방향은 같아요. 산은이 왜, 어디에, 어떻게 끼어드는지를 묻고 있어요.</Line>
      </Fold>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 10. 준비                                                              */
/* ------------------------------------------------------------------ */

const PT_FRAME = [
  { step: "문제 정의", q: "무엇이, 왜 문제인가", ex: "중국발 공급 과잉으로 국내 석유화학 공장 가동률이 떨어지고, 지역 일자리까지 흔들린다." },
  { step: "시장 혼자 못 푸는 이유", q: "길다 · 위험하다 · 크다 · 파장이 넓다 중 무엇인가", ex: "설비를 줄이면 모두 이득인데, 먼저 줄이는 회사만 손해라 누구도 먼저 나서지 않는다." },
  { step: "대안 2~3개 비교", q: "각각 무엇을 얻고 잃나", ex: "① 시장에 맡기기 ② 정부 보조금 ③ 감축을 조건으로 한 금융지원." },
  { step: "선택과 위험", q: "무엇을 고르고, 무엇을 감수하나", ex: "③을 고른다. 위험은 지원 뒤에도 업황이 안 살아나는 것 — 조건 이행 점검으로 줄인다." },
  { step: "산은이 할 일", q: "대출 · 투자 · 주선 · 구조조정 중 어떤 도구로", ex: "채권단을 묶어 상환을 미뤄 주고, 감축을 확인하며 신규 자금을 나눠 넣는다(정거장 4)." },
];

const PT_TOPICS = [
  "석유화학 같은 주력산업 구조조정에서 정책금융의 역할",
  "해상풍력 등 비용이 큰 에너지 인프라에 돈을 대는 방법",
  "벤처 회수 시장(투자금을 돌려받는 길) 활성화 방안",
  "정책금융의 지방 공급을 늘리는 방안",
  "AI 전환이 은행 여신심사에 미치는 영향",
  "가계대출에서 기업금융으로의 전환은 가능한가",
];

const NUMBERS = [
  { front: "1954 · 100%", back: "1954년 설립, 정부 지분 100%" },
  { front: "384.6조", back: "총자산 384.6조원 (2025년 말 연결) · 은행만 보면 346.3조원" },
  { front: "63%", back: "빌려 온 돈 가운데 채권 비중 62.7%" },
  { front: "1.7 · 95.9 · 8,806", back: "2025년 순이익 약 1.7조원(은행 별도) · 자금 공급 95.9조원 · 배당 8,806억원" },
  { front: "45조", back: "자본금 한도 (2025년 8월 국회 통과, 30조 → 45조)" },
  { front: "59곳", back: "국내 영업점 (2026년 6월 말, 본점 영업부 포함) · 해외는 2025년 말 18개국 25곳" },
  { front: "250조", back: "5년 공급 계획 — 100 · 75 · 50 · 25" },
];

const KDB_WAY = [
  "고객의 니즈를 최우선으로 생각한다.",
  "열린 마음으로 변화를 수용하자.",
  "익숙함에서 벗어나 계산된 도전을 하자.",
  "소통하며 주도적으로 일하자.",
  "외부와 협력하여 더 나은 길을 찾는다.",
  "현장에서 답을 찾자.",
  "미래를 생각하고 행동하자.",
  "책임을 완수하여 사회적 신뢰를 얻는다.",
  "전문가로서 대안을 제시한다.",
  "디지털 마인드를 갖자.",
];

const TODO = ["부문 10개 중 하나를 골라, 그 부문의 2026년 뉴스 3개 찾기", "7장 논쟁 네 개를 각각 30초씩 소리 내어 말해 보기", "외울 숫자 7개 카드를 앞면만 보고 뒷면 맞히기"];

function Prepare() {
  const [step, setStep] = useState(0);
  const [flip, setFlip] = useState<number[]>([]);
  const [done, setDone] = useState<number[]>([]);
  const toggle = (arr: number[], i: number) => (arr.includes(i) ? arr.filter((x) => x !== i) : [...arr, i]);
  const f = PT_FRAME[step];
  return (
    <div className="space-y-5">
      <Line kind="view">PT 주제는 예측하기 어렵다는 게 후기의 공통된 말이에요. 그래서 주제를 외우기보다, 어떤 주제든 같은 틀로 풀고 마지막에 ‘산은이 할 일’을 붙이는 연습이 낫다고 봐요.</Line>
      <div className="rounded-3xl bg-canvas p-4 shadow-level-2 sm:p-5">
        <p className="flex items-center justify-between gap-2 type-heading-sm text-ink">
          PT 틀 다섯 칸
          <Tag kind="view" />
        </p>
        <p className="mt-1 type-caption text-ink-mute">예시 주제 · 석유화학 같은 주력산업 구조조정에서 정책금융의 역할</p>
        <div className="mt-3 grid grid-cols-5 gap-1">
          {PT_FRAME.map((x, i) => (
            <button
              key={x.step}
              type="button"
              onClick={() => setStep(i)}
              aria-pressed={step === i}
              className={cn("flex min-h-16 flex-col items-center justify-center rounded-xl px-1 py-2 text-center", anim, step === i ? "bg-brand-dark text-on-primary" : i < step ? "bg-ev-written-soft text-primary-text" : "bg-canvas-soft text-ink-secondary")}
            >
              <span className="tabular text-[12px] font-bold">{i + 1}</span>
              <span className="text-[11px] leading-tight font-semibold [word-break:keep-all]">{x.step}</span>
            </button>
          ))}
        </div>
        <div key={step} className="mt-3 space-y-2 motion-safe:animate-[kk-fade-in_.3s_ease-out]">
          <p className="type-body-md font-bold text-ink [word-break:keep-all]">
            {step + 1}. {f.step} — {f.q}
          </p>
          <p className="rounded-xl bg-canvas-soft px-3.5 py-2.5 type-body-md text-ink ko-justify">예: {f.ex}</p>
        </div>
      </div>
      <Card>
        <CardTitle kind="view">연습용 예상 주제 여섯 개</CardTitle>
        <p className="mt-1 type-caption text-ink-mute">2026년 뉴스로 만든 예상이에요. 실제 출제된 주제는 공개된 게 없어요.</p>
        <ul className="mt-3 space-y-1.5">
          {PT_TOPICS.map((t, i) => (
            <li key={t} className="flex gap-2 type-body-md text-ink [word-break:keep-all]">
              <span className="tabular font-bold text-primary-text">{i + 1}</span>
              {t}
            </li>
          ))}
        </ul>
        <p className="mt-3 rounded-xl bg-canvas-cream px-3.5 py-2.5 type-body-md text-ink ko-justify">꼬리질문 대비 네 가지 — 발표에 쓴 숫자의 출처, 대안을 고른 기준, 반대 입장, 그리고 “산은이 아니라 민간이 하면 안 되나요?”</p>
      </Card>

      <Card>
        <CardTitle kind="view">1분 자기소개 뼈대 — 자소서 요약은 금물</CardTitle>
        <ol className="mt-3 space-y-2">
          {["산은 장면 하나 — 이 회사의 어떤 일을 보고", "내 경험 하나 — 그 일과 닮은 경험", "하고 싶은 일 — 부문 이름이나 정거장 이름으로"].map((t, i) => (
            <li key={t} className="flex gap-3 type-body-md text-ink [word-break:keep-all]">
              <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-[12px] font-bold text-on-primary">{i + 1}</span>
              {t}
            </li>
          ))}
        </ol>
        <p className="mt-3 type-body-md text-ink-secondary ko-justify">피할 것 — 삼행시, ‘국가 경제 발전에 기여’ 같은 큰 말, 국민성장펀드 하나만 말하기.</p>
      </Card>
      <Fold title="산은이 스스로 정한 행동규범 ‘KDB Way’ 10개 — 경험을 고를 때 거울로">
        <ol className="space-y-1 type-body-md text-ink [word-break:keep-all]">
          {KDB_WAY.map((w, i) => (
            <li key={w} className="flex gap-2">
              <span className="tabular font-bold text-primary-text">{i + 1}</span>
              {w}
            </li>
          ))}
        </ol>
        <Line kind="official">산은 홈페이지 ‘KDB Way’에 적힌 그대로예요. 임직원이 공유해야 할 행동규범이라고 설명해요.</Line>
        <Line kind="view">자기소개 2번(내 경험)을 고를 때, 이 중 하나와 겹치는 경험을 고르면 산은의 말로 내 이야기를 할 수 있어요.</Line>
      </Fold>

      <div>
        <div className="flex items-center justify-between gap-2">
          <p className="type-heading-sm text-ink">외울 숫자 일곱 개</p>
          <TryHint>카드를 눌러 뒤집어요</TryHint>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {NUMBERS.map((n, i) => {
            const on = flip.includes(i);
            return (
              <button
                key={n.front}
                type="button"
                onClick={() => setFlip(toggle(flip, i))}
                aria-pressed={on}
                className={cn("flex min-h-24 items-center justify-center rounded-2xl px-3 py-3 text-center shadow-level-1", anim, on ? "bg-brand-dark text-on-primary" : "bg-canvas text-ink")}
              >
                <span className={cn("[word-break:keep-all]", on ? "type-caption font-semibold" : "type-heading-sm font-bold tabular")}>{on ? n.back : n.front}</span>
              </button>
            );
          })}
        </div>
      </div>

      <Card>
        <CardTitle>이 글을 읽고 할 일 세 가지</CardTitle>
        <ul className="mt-3 space-y-1.5">
          {TODO.map((t, i) => {
            const on = done.includes(i);
            return (
              <li key={t}>
                <button type="button" onClick={() => setDone(toggle(done, i))} aria-pressed={on} className="flex w-full items-start gap-2.5 rounded-xl px-2 py-2 text-left hover:bg-canvas-soft">
                  <span className={cn("mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2", on ? "border-primary bg-primary text-on-primary" : "border-hairline-input")}>{on && <Check className="h-3.5 w-3.5" strokeWidth={3} />}</span>
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
/* 11. 정리                                                              */
/* ------------------------------------------------------------------ */

function Wrap() {
  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-brand-dark px-5 py-5 text-on-primary">
        <p className="type-micro-cap text-on-primary/70">3줄 요약</p>
        <ol className="mt-3 space-y-2 type-body-md [word-break:keep-all]">
          <li>1. 산은 — 예금보다 채권으로 돈을 모아, 정책 목적으로 기업에 돈을 대고 흔들리는 기업을 다루는 정부 100% 은행.</li>
          <li>2. 부서 — 모으고(조달), 따지고(심사), 내보내고(기업금융·투자), 다루고(구조조정), 설계하는(전략·준법) 다섯 정거장.</li>
          <li>3. 면접 — 정답보다 구조. 올해 장면 하나를 부서 이름과 함께, 논쟁은 양쪽을 다.</li>
        </ol>
      </div>
      <Card>
        <CardTitle kind="official">10개 부문 한눈에</CardTitle>
        <p className="mt-1 type-caption text-ink-mute">2026년 11월 조직도 기준 · 올해 한 일은 언론 보도</p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[34rem] text-left type-caption">
            <thead>
              <tr className="border-b border-hairline text-ink-mute">
                <th className="py-2 pr-2 font-bold">정거장</th>
                <th className="py-2 pr-2 font-bold">부문</th>
                <th className="py-2 pr-2 font-bold">하는 일</th>
                <th className="py-2 font-bold">2026년 한 장면</th>
              </tr>
            </thead>
            <tbody>
              {DIVISIONS.map((d) => (
                <tr key={d.name} className="border-b border-hairline/60 align-top text-ink">
                  <td className="py-2 pr-2">
                    <StationTag k={d.station} />
                  </td>
                  <td className="py-2 pr-2 font-bold [word-break:keep-all]">{d.name}</td>
                  <td className="py-2 pr-2 [word-break:keep-all]">{d.does}</td>
                  <td className="py-2 [word-break:keep-all]">{d.year}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Card>
        <p className="type-heading-sm text-ink">다음 편 예고</p>
        <p className="mt-2 type-body-md text-ink-secondary ko-justify">“타기관 인턴을 했는데 왜 산은이냐”의 진짜 답은 기관 사이의 차이에 있어요. 다음 편에서는 산은·수은·기은을 같은 ‘돈의 여행’ 틀로 나란히 놓아 볼게요.</p>
      </Card>
      <div className="grid gap-2.5 sm:grid-cols-3">
        {[
          { href: "/magazine/6", label: "산은 필기 가이드 — 범위·시간·컷" },
          { href: "/magazine/7", label: "국민성장펀드 딥다이브 (3편)" },
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
        <p className="type-caption text-ink-mute [word-break:keep-all]">{SOURCES_NOTE}</p>
      </Fold>
      <p className="type-caption text-ink-mute [word-break:keep-all]">이 글은 2026년 11월 기준이에요. 조직도와 숫자는 바뀌어요. 하반기 1차 면접이 끝나면 후기를 더하고, 조직 개편·결산 발표가 나오면 고쳐 둘게요. 최종 수정 {UPDATED}.</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 확인한 값 — 숫자·출처 (2026-10-31 확인)                               */
/* ------------------------------------------------------------------ */

const UPDATED = "2026년 10월 31일";

const BIS = "2026년 6월 말 산은의 총자본비율은 14.52%로 국내은행 평균(15.77%)보다 낮아요. 다만 은행 가운데 가장 낮지는 않아요 (금융감독원).";

const BUSAN_LATEST = "10월 말 현재 산은 이전은 확정도, 무산도 아니에요. 법이 바뀌기 전에는 본점이 서울에 있어야 해요.";

const SOURCES: [string, string][] = [
  ["산업은행 · 조직도 (홈페이지)", "https://www.kdb.co.kr/BZCOWS00N00.act?wcmsPath=/hmp/ch/bi/bi/CHBIBI1600.html"],
  ["산업은행 · KDB Way (홈페이지)", "https://www.kdb.co.kr/BZCOWS00N00.act?wcmsPath=/hmp/ch/bi/bi/CHBIBI0601.html"],
  ["산업은행 · 2025년도 경영공시 · 2025 감사보고서 · 2026 상반기 공시", "https://www.kdb.co.kr/CHBIPA49N00.act"],
  ["KDB Annual Report 2025 (영문)", "https://vpr.hkma.gov.hk/statics/assets/doc/200110/ar_25/ar_25_eng.pdf"],
  ["산업은행 · 2027년 5급 신입행원(일반) 채용공고", "https://kdb.incruit.com/hire/viewhire.asp?projectid=126"],
  ["국가법령정보센터 · 한국산업은행법", "https://www.law.go.kr/법령/한국산업은행법"],
  ["알리오 · 한국산업은행 임직원 현황", "https://www.alio.go.kr"],
  ["금융위원회 · 면책심의위원회 국민성장펀드 면책 (2026.3.6)", "https://www.fsc.go.kr/no010101/86427"],
  ["금융위원회 · 신안우이 해상풍력 금융 개요", "https://www.fsc.go.kr/no010101/86672"],
  ["메트로신문 · 산업은행 250조로 미래산업 키운다 (2026.10.12)", "https://www.metroseoul.co.kr/article/20261012500258"],
  ["딜사이트 · 금융위원장 산은 이전 발언 (2026.10.22)", "https://dealsite.co.kr/articles/171184"],
  ["머니투데이 · 국토부 장관 2차 이전 11월 발표 (2026.10.23)", "https://www.mt.co.kr/estate/2026/10/23/2026102316323312714"],
  ["폴리뉴스 · 산은 노조 설문 (2026.9.30)", "https://www.polinews.co.kr/news/articleView.html?idxno=744437"],
  ["파이낸셜뉴스 · 여수 1호 사업재편 (2026.7.22)", "https://www.fnnews.com/news/202607221823228771"],
  ["폴리뉴스 · 석유화학 감축 249만t (2026.10.23)", "https://www.polinews.co.kr/news/articleView.html?idxno=746713"],
  ["이투데이 · 국민성장펀드 누적 39건 22.3조원 (2026.10.29)", "https://www.etoday.co.kr/news/view/2641966"],
  ["대한경제 · HMM·KAI 매각 제자리 (2026.10.27)", "https://www.dnews.co.kr/uhtml/view.jsp?idxno=202610261451415830175"],
  ["대한경제 · KDB생명 매각 협상 (2026.10.21)", "https://www.dnews.co.kr/uhtml/view.jsp?idxno=202610201415304890328"],
  ["마이데일리 · 창업 7년 이내 기업 공급 감소 (2026.10.2)", "https://www.mydaily.co.kr/page/view/2026100214490124051"],
  ["서울신문 · 중소기업 자금 수도권 53.1% (2026.10.9)", "https://www.seoul.co.kr/news/economy/finance/2026/10/09/20261009500026"],
  ["이투데이 · KDB 넥스트원 광주 개소 (2026.7.7)", "https://www.etoday.co.kr/news/view/2600973"],
  ["뉴스핌 · 산은 주총 2025 실적·배당 (2026.3.31)", "https://www.newspim.com/news/view/20260331000760"],
];

const SOURCES_NOTE =
  "이 밖에 금융감독원 은행 BIS비율 현황(2026년 6월 말), 재정경제부 정부 배당 보도자료(2026.5.28), DART HMM·KB국민은행 공시, 산은 사보 「KDB소식」(2024년 4월호), 한국경제·머니투데이·이투데이·헤럴드경제·노컷뉴스·더팩트·KNN·뉴스1·시사저널e·MTN 보도를 함께 확인했어요. 면접 후기는 2026년 5월 상반기 면접 준비생 단톡방에서 모았고, 닉네임과 날짜는 지웠어요.";

/* ------------------------------------------------------------------ */
/* 전체                                                                  */
/* ------------------------------------------------------------------ */

const CHAPTERS: GuideChapter[] = [
  {
    short: "은행 아닌 은행",
    title: "예금 안 받는 은행이 있다?",
    lead: "제목은 반만 맞아요. 산은도 예금을 받아요. 다만 돈의 대부분은 다른 데서 와요. 이 차이 하나가 이 글 전체의 열쇠예요.",
    kong: "산은을 이해하는 첫 단추는 ‘어디서 돈을 빌려 오나’예요!",
    bg: "bg-[#f3f6ff]",
    body: <NotABank />,
  },
  {
    short: "70년",
    title: "산은은 언제부터 이런 일을 했을까요?",
    lead: "무엇을 살리던 은행이었는지가 시대마다 달라요. 여덟 장면만 볼게요.",
    look: "book",
    bg: "bg-[#fffaf3]",
    body: <History />,
  },
  {
    short: "돈의 여행",
    title: "1조 원의 여행 — 산은 안에서 돈은 어디로 갈까요?",
    lead: "조직도 순서로 외우면 금방 잊어요. 1조 원이 들어와서 나가기까지 따라가면, 부서가 왜 그렇게 나뉘었는지 보여요.",
    kong: "정거장마다 ‘이게 없으면 무슨 일이 생기나’를 같이 보세요.",
    bg: "bg-[#eef7f8]",
    body: <Journey />,
  },
  {
    short: "신입의 자리",
    title: "신입은 어디서 무엇을 할까요?",
    lead: "공고와 공식 자료로 확인되는 것과, 단톡방에서 도는 말을 나눠서 적었어요.",
    bg: "bg-[#f2fbf5]",
    body: <Rookie />,
  },
  {
    short: "상사 셋",
    title: "산은의 상사는 누구일까요?",
    lead: "산은에는 상사가 셋이에요. 누가 무엇을 시키는지 알면, 국감 뉴스도 산은의 계획도 읽혀요.",
    bg: "bg-[#f6f4ff]",
    body: <Bosses />,
  },
  {
    short: "올해 10장면",
    title: "2026년, 산은은 무슨 일을 했을까요?",
    lead: "열 장면마다 어느 정거장·어느 부서의 일인지, 면접에서 어떻게 이어 쓰는지 붙였어요.",
    bg: "bg-[#fff6ec]",
    body: <TenScenes />,
  },
  {
    short: "논쟁 넷",
    title: "산은에 늘 따라붙는 논쟁 네 가지",
    lead: "결론은 내지 않아요. 한쪽, 다른 쪽, 산은의 입장을 나란히 놓았어요.",
    kong: "한쪽 말만 외우면 꼬리질문에서 무너져요.",
    look: "sweat",
    bg: "bg-[#f3f6ff]",
    body: <Debates />,
  },
  {
    short: "면접 하루",
    title: "1차 면접 하루는 어떻게 흘러갈까요?",
    lead: "공고에 적힌 사실을 먼저, 올해 5월 면접을 본 사람들의 후기를 그다음에 놓았어요.",
    bg: "bg-[#fffaf3]",
    body: <InterviewDay />,
  },
  {
    short: "질문 10",
    title: "면접관은 정말 무엇을 물을까요?",
    lead: "질문마다 ‘사실 무엇을 확인하는지’와 이 글 어디에 재료가 있는지 적었어요.",
    bg: "bg-[#f2fbf5]",
    body: <Questions />,
  },
  {
    short: "준비",
    title: "그래서 무엇을 준비하면 될까요?",
    lead: "PT 틀, 자기소개 뼈대, 외울 숫자, 그리고 오늘 할 일 세 가지.",
    look: "book",
    bg: "bg-[#f6f4ff]",
    body: <Prepare />,
  },
  {
    short: "정리",
    title: "바쁘면 이것만",
    lead: "산은 한 줄, 부서 한 줄, 면접 한 줄.",
    kong: "11월 면접장에서 만나요!",
    look: "suit",
    bg: "bg-[#eef7f8]",
    body: <Wrap />,
  },
];

export function KdbCompanyGuide({ title }: { title: string }) {
  return (
    <GuideShell
      chapters={CHAPTERS}
      eyebrow="금콩 논술·면접 딥다이브 2 · 산은"
      heading={title}
      sub="산은이 어디서 돈을 구해 어느 부서를 거쳐 어디로 보내는지, 1조 원을 따라가며 처음부터 풀었어요. 면접이 코앞이면 1·3·9·10장만 봐도 돼요."
      mascot={<KongMascot hold="news" glasses className="h-24 w-24 shrink-0 md:h-32 md:w-32" />}
      tabsLabel="산업은행 딥다이브 목차"
      cover={<Cover />}
      coverClass="from-[#dff2f3]"
    />
  );
}
