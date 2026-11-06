"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { ArrowDown, ArrowRight, BookOpen, ChevronDown, Quote } from "lucide-react";
import { cn } from "../../ui";
import { KongMascot } from "../KongMascot";
import { GuideShell, TryHint, anim, useGuideGo, type GuideChapter } from "./GuideShell";

/**
 * 수은 논술 종합 — 대미투자·방산금융·공급망기금·EDCF 네 주제를 시험 전에 한 번에
 * 설명 순서는 돈의 흐름 세 질문: 어디서 나와 → 어디로 가고 → 무엇을 믿고 가나.
 * 숫자·날짜·발언은 2026-11-06 기준으로 법령·정부 자료·의안정보·기사 원문을 열어 확인한 것만 써요.
 * 수은 입장(행장 공식 발언)과 해석(금콩 풀이)을 한 문장에 섞지 않아요. 전망은 달력 항목으로만 적어요.
 */

const KEXIM_WRITTEN_HREF = "/magazine/9";
const KEXIM_HREF = "/companies/kexim";

/* 장 번호 */
const CH = { frame: 0, us: 1, defense: 2, supply: 3, edcf: 4, essay: 5, nums: 6, interview: 7 } as const;

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

/** 작은 머리글 — 장 안의 순서 */
function Sub({ children }: { children: ReactNode }) {
  return <h3 className="pt-1 type-heading-md text-ink [word-break:keep-all]">{children}</h3>;
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
          className={cn("rounded-lg px-1 py-2 text-center type-caption font-semibold [word-break:keep-all] sm:type-body-md", anim, value === x.key ? "bg-canvas text-ink shadow-level-1" : "text-ink-secondary hover:text-ink")}
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
    h: 675,
    alt: "미국 텍사스주 오스틴의 가스발전소 굴뚝들",
    credit: "사진: Larry D. Moore / Wikimedia Commons, CC BY 4.0",
    href: "https://commons.wikimedia.org/wiki/File:Sand_Hill_Energy_Center_Power_Plant_Austin_Energy.jpg",
  },
  philly: {
    src: "/magazine/kexim/philly-yard.webp",
    h: 795,
    alt: "미국 필라델피아 조선소의 대형 크레인과 건조 중인 검은 선체",
    credit: "사진: R'lyeh Imaging / Wikimedia Commons, CC BY 2.0",
    href: "https://commons.wikimedia.org/wiki/File:Aker_Philadelphia_Shipyard.jpg",
  },
  k2: {
    src: "/magazine/kexim/k2-poland.webp",
    h: 675,
    alt: "폴란드 훈련장의 진흙 위를 달리는 K2 전차",
    credit: "사진: 미 육군 Staff Sgt. Matthew Foster / Wikimedia Commons, 퍼블릭 도메인 (일부 잘라냄)",
    href: "https://commons.wikimedia.org/wiki/File:K2_Tank_Joins_the_Fight_with_eFP_Battle_Group_Poland_-_1.jpg",
  },
  lithium: {
    src: "/magazine/kexim/atacama-lithium.webp",
    h: 675,
    alt: "위성에서 본 칠레 아타카마 소금사막과 파란 리튬 증발못",
    credit: "사진: NASA Earth Observatory / Wikimedia Commons, CC BY 2.0 (일부 잘라냄)",
    href: "https://commons.wikimedia.org/wiki/File:Salar_de_Atacama,_Chile_-_NASA_Earth_Observatory.jpg",
  },
  bridge: {
    src: "/magazine/kexim/cambodia-bridge.webp",
    h: 675,
    alt: "캄보디아의 강 위에 놓이고 있는 교량 공사 현장",
    credit: "사진: damien_farrell / Wikimedia Commons, CC BY 2.0",
    href: "https://commons.wikimedia.org/wiki/File:New_bridge_construction_on_brassac_river._Cambodia_P1030193.jpg",
  },
  assembly: {
    src: "/magazine/kdb/yeouido.webp",
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
      <img src={x.src} width={1200} height={x.h} alt={x.alt} loading="lazy" decoding="async" className="block h-auto w-full" />
      <figcaption className="px-4 py-2.5">
        <p className="type-body-md text-ink [word-break:keep-all]">{caption}</p>
        <a href={x.href} target="_blank" rel="noopener noreferrer" className="mt-0.5 block type-caption text-ink-mute hover:underline [word-break:keep-all]">
          {x.credit}
        </a>
      </figcaption>
    </figure>
  );
}

/** 돈의 흐름 그림 — 칸을 누르면 설명 */
type FlowNode = { q: string; name: string; sub: string; text: string; note?: string };

function FlowMap({ title, nodes, start = 0, accent }: { title: string; nodes: FlowNode[]; start?: number; accent?: number }) {
  const [sel, setSel] = useState(start);
  const x = nodes[sel];
  return (
    <Card>
      <CardTitle kind="fact">{title}</CardTitle>
      <TryHint>칸을 눌러 보세요</TryHint>
      <ol className="mt-3">
        {nodes.map((n, i) => (
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
              className={cn("flex w-full items-center gap-3 rounded-xl border-2 px-3.5 py-2.5 text-left", anim, sel === i ? "border-brand-dark bg-brand-dark text-on-primary shadow-level-2" : i === accent ? "border-primary/50 bg-ev-written-soft text-ink" : "border-hairline bg-canvas text-ink hover:border-brand-dark/40")}
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
        {x.note && <p className="mt-1.5 type-caption text-ink-secondary ko-justify">{x.note}</p>}
      </div>
    </Card>
  );
}

/** 막대 — 값은 항상 글자로 함께 (막대는 0에서 시작) */
function Bars({ title, unit, rows, max, note }: { title: string; unit?: string; rows: { k: string; v: number; show?: string }[]; max: number; note?: string }) {
  return (
    <div className="rounded-xl bg-canvas-soft px-3.5 py-3">
      <p className="type-caption font-bold text-ink-secondary [word-break:keep-all]">
        {title}
        {unit && ` (${unit})`}
      </p>
      <div className="mt-2 space-y-1.5">
        {rows.map((x) => (
          <div key={x.k}>
            <div className="flex items-baseline justify-between gap-2 type-caption text-ink-secondary">
              <span className="[word-break:keep-all]">{x.k}</span>
              <span className="tabular font-semibold text-ink">{x.show ?? x.v}</span>
            </div>
            <div className="mt-0.5 h-2.5">
              <div className="h-full rounded-r bg-primary" style={{ width: `${(x.v / max) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
      {note && <p className="mt-2 type-caption text-ink-mute [word-break:keep-all]">{note}</p>}
    </div>
  );
}

/** 쟁점 칸 */
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

/** 수은이 말한 것 / 자리에서 보이는 것 */
function Stance({ said, seat, face }: { said: { who: string; where: string; text: string }[]; seat: string[]; face?: boolean }) {
  const [lens, setLens] = useState<"said" | "seat">("said");
  return (
    <div className="space-y-3">
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
        <div className="space-y-2 motion-safe:animate-[kk-fade-in_.3s_ease-out]">
          {said.map((s, i) => (
            <figure key={s.text} className="flex gap-3 rounded-2xl bg-canvas px-4 py-3.5 shadow-level-1">
              {/* eslint-disable-next-line @next/next/no-img-element -- 사용자 제공 일러스트 (public/magazine/kexim) */}
              {face && i === 0 && <img src="/magazine/kexim/ceo.webp" width={640} height={743} alt="황기연 수출입은행장 일러스트" loading="lazy" decoding="auto" className="h-24 w-auto shrink-0 self-end rounded-xl" />}
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <Quote className="h-4 w-4 shrink-0 text-primary" strokeWidth={2.4} />
                  <Tag kind="kexim" />
                </div>
                <blockquote className="mt-1.5 type-body-md font-semibold text-ink [word-break:keep-all]">{s.text}</blockquote>
                <figcaption className="mt-1.5 type-caption text-ink-mute [word-break:keep-all]">
                  {s.who} · {s.where}
                </figcaption>
              </div>
            </figure>
          ))}
        </div>
      ) : (
        <div className="space-y-2 motion-safe:animate-[kk-fade-in_.3s_ease-out]">
          <div className="flex items-start justify-between gap-2 rounded-xl bg-[#fff1e0] px-4 py-3">
            <p className="type-body-md font-semibold text-[#7a3a08] [word-break:keep-all]">수은이 한 말이 아니에요. 금콩이 수은 자리에서 읽은 풀이예요.</p>
            <Tag kind="view" />
          </div>
          {seat.map((t, i) => (
            <div key={t} className="flex gap-3 rounded-2xl bg-canvas px-4 py-3 shadow-level-1">
              <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#fff1e0] tabular type-caption font-bold text-[#9a4a0b]">{i + 1}</span>
              <p className="min-w-0 flex-1 type-body-md text-ink ko-justify">{t}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** 지켜볼 달력 */
function Watch({ items }: { items: { when: string; text: string }[] }) {
  return (
    <div className="rounded-2xl bg-canvas px-4 py-3.5 shadow-level-1">
      <div className="flex items-center justify-between gap-2">
        <p className="type-heading-sm text-ink">앞으로 볼 일정</p>
        <Tag kind="outlook" />
      </div>
      <ul className="mt-2.5 space-y-2">
        {items.map((x) => (
          <li key={x.text} className="flex gap-3">
            <span className="w-[68px] shrink-0 type-caption font-bold text-primary-text [word-break:keep-all]">{x.when}</span>
            <span className="min-w-0 flex-1 type-body-md text-ink-secondary [word-break:keep-all]">{x.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** 논술 예상 문제 + 네 줄 뼈대 */
function EssayBox({ qs, frame }: { qs: string[]; frame: string[] }) {
  return (
    <div className="rounded-2xl bg-brand-dark px-5 py-5 text-on-primary">
      <div className="flex items-start justify-between gap-2">
        <p className="type-heading-sm">논술이라면</p>
        <Tag kind="view" />
      </div>
      <ol className="mt-2.5 space-y-1.5 type-body-md [word-break:keep-all]">
        {qs.map((q, i) => (
          <li key={q}>
            {i + 1}. {q}
          </li>
        ))}
      </ol>
      <p className="mt-4 type-micro-cap text-on-primary/70">1번 뼈대, 네 줄</p>
      <ol className="mt-2 space-y-1.5">
        {frame.map((t, i) => (
          <li key={t} className="flex gap-2.5 type-body-md [word-break:keep-all]">
            <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-on-primary/15 tabular text-[11px] font-bold">{i + 1}</span>
            {t}
          </li>
        ))}
      </ol>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 표지                                                                 */
/* ------------------------------------------------------------------ */

const SEATS = [
  { to: CH.us, name: "대미투자", seat: "조연", text: "돈을 보내는 곳은 한미전략투자공사예요. 수은은 위탁 후보이자 조선 협의체 간사예요." },
  { to: CH.defense, name: "방산금융", seat: "빌려주는 쪽", text: "외국 정부에 직접 빌려줘요. 그래서 자기자본 40% 한도에 걸려요." },
  { to: CH.supply, name: "공급망기금", seat: "운용자", text: "법이 정한 기금 관리·운용 기관이에요. 회계는 은행과 따로예요." },
  { to: CH.edcf, name: "EDCF", seat: "위탁 집행", text: "기금 주인은 재정경제부 장관이에요. 수은은 심사·계약·집행·사후관리를 맡아요." },
];

function Hook() {
  const go = useGuideGo();
  const [sel, setSel] = useState<number | null>(null);
  return (
    <div className="space-y-4">
      <div className="rounded-3xl bg-canvas/90 p-4 shadow-level-1 backdrop-blur sm:p-5">
        <p className="type-caption font-semibold text-ink-mute">10월 20일, 수은 국정감사</p>
        <p className="mt-1.5 type-heading-sm text-ink [word-break:keep-all]">하루 만에 전략수출금융기금, 공급망기금, EDCF가 줄줄이 나왔어요. 한미전략투자공사도 같은 날 국감을 받았어요.</p>
        <p className="mt-2 type-body-md text-ink-secondary ko-justify">그래서 이 글은 네 주제를 골랐어요. 시험 전에 같은 틀로 한 번에 훑는 글이에요.</p>

        <p className="mt-4 type-body-md font-bold text-ink [word-break:keep-all]">네 곳에서 수은의 자리는 다 달라요. 눌러 보세요.</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {SEATS.map((x, i) => (
            <button key={x.name} type="button" onClick={() => setSel(i)} aria-pressed={sel === i} className={cn("rounded-xl border-2 px-2 py-2.5 text-center", anim, sel === i ? "border-brand-dark bg-brand-dark text-on-primary" : "border-hairline bg-canvas text-ink hover:border-brand-dark/40")}>
              <span className="block type-body-md font-bold">{x.name}</span>
              <span className={cn("block type-caption", sel === i ? "text-on-primary/75" : "text-ink-mute")}>{sel === i ? x.seat : "수은은?"}</span>
            </button>
          ))}
        </div>
        {sel !== null && (
          <div key={sel} className="mt-2.5 rounded-2xl bg-ev-written-soft px-4 py-3 motion-safe:animate-[kk-fade-in_.3s_ease-out]">
            <p className="type-body-md text-ink ko-justify">{SEATS[sel].text}</p>
            <button type="button" onClick={() => go(SEATS[sel].to, true)} className="mt-1.5 inline-flex items-center gap-1 type-caption font-bold text-primary-text">
              이 주제 바로 보기 <ArrowRight className="h-3 w-3" strokeWidth={2.4} />
            </button>
          </div>
        )}
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <button type="button" onClick={() => go(CH.frame, true)} className={cn("flex items-center justify-between gap-2 rounded-xl bg-brand-dark px-4 py-3 text-left type-body-md font-semibold text-on-primary", anim)}>
            처음부터 읽기
            <ArrowRight className="h-4 w-4 shrink-0" strokeWidth={2.2} />
          </button>
          <button type="button" onClick={() => go(CH.nums, true)} className={cn("flex items-center justify-between gap-2 rounded-xl border-2 border-brand-dark/20 bg-canvas px-4 py-3 text-left type-body-md font-semibold text-ink hover:border-brand-dark", anim)}>
            시간 없으면 숫자 한 장
            <ArrowRight className="h-4 w-4 shrink-0" strokeWidth={2.2} />
          </button>
        </div>
        <p className="mt-2.5 type-caption text-ink-mute [word-break:keep-all]">출제 예상이 아니에요. 올해 수은이 전면에 섰고 찬반이 있는 주제를 금콩이 고른 거예요.</p>
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
/* 0. 공통 틀                                                            */
/* ------------------------------------------------------------------ */

type Topic = "us" | "def" | "sup" | "edcf";

const GRID: Record<Topic, [string, string][]> = {
  us: [
    ["어디서", "외환보유액 운용수익, 위탁자산, 공사 채권"],
    ["어디로", "미국 측 투자 법인을 거쳐 텍사스 발전소 등"],
    ["무엇을 믿고", "상업적 합리성 (원리금을 회수할 수 있나)"],
    ["왜 민간은 못 하나", "크다 · 길다 · 상대가 미국 정부"],
  ],
  def: [
    ["어디서", "수은, 외국계·국내 은행, 무보의 보증·보험"],
    ["어디로", "폴란드 국책은행을 거쳐 현대로템 선수금"],
    ["무엇을 믿고", "상대국 정부 신용 + 보증·보험"],
    ["왜 민간은 못 하나", "크다 · 만기 17년 · 상대가 외국 정부"],
  ],
  sup: [
    ["어디서", "정부보증 기금채, 외화채, 수은 출연"],
    ["어디로", "선도사업자 등 기업, 일부는 펀드"],
    ["무엇을 믿고", "기업 재무 심사 (선도사업자 선정과는 별개)"],
    ["왜 민간은 못 하나", "이득은 산업 전체가 누려서 (외부효과)"],
  ],
  edcf: [
    ["어디서", "정부출연금, 공공자금관리기금 예수금, 운용수익"],
    ["어디로", "개도국 정부를 거쳐 입찰로 뽑은 시공사"],
    ["무엇을 믿고", "차주국 신용 + 개발효과 평가"],
    ["왜 민간은 못 하나", "상대가 개도국 정부 · 최장 40년 · 낮은 금리"],
  ],
};

function FrameChapter() {
  const [t, setT] = useState<Topic>("us");
  return (
    <div className="space-y-5">
      <P>주제는 달라도 질문은 같아요. 돈이 어디서 나와서, 어디로 가고, 무엇을 믿고 가나요? 이 셋만 쓰면 어떤 주제든 답안 앞부분이 나와요.</P>
      <Card>
        <CardTitle kind="fact">네 주제, 같은 틀로 보면</CardTitle>
        <div className="mt-3">
          <Tabs<Topic>
            label="주제 고르기"
            value={t}
            onChange={setT}
            items={[
              { key: "us", label: "대미투자" },
              { key: "def", label: "방산" },
              { key: "sup", label: "공급망" },
              { key: "edcf", label: "EDCF" },
            ]}
          />
        </div>
        <dl key={t} className="mt-3 space-y-2 motion-safe:animate-[kk-fade-in_.3s_ease-out]">
          {GRID[t].map(([k, v]) => (
            <div key={k} className="rounded-xl bg-canvas-soft px-3.5 py-2.5">
              <dt className="type-caption font-bold text-primary-text">{k}</dt>
              <dd className="mt-0.5 type-body-md text-ink [word-break:keep-all]">{v}</dd>
            </div>
          ))}
        </dl>
      </Card>
      <TermBox term="정책금융" def="크기·기간·위험 때문에 민간 금융이 혼자 대기 어려운 곳에 나라의 뜻을 담아 대는 돈이에요." pic="은행이 “20년은 너무 길다”고 할 때 나서는 돈." />
      <Photo k="assembly" caption="여의도와 국회의사당이에요. 네 주제 모두 10월 국감 질의가 몰렸어요. 그래서 쟁점은 의원 이름과 수은 답변을 함께 적었어요." />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 1. 대미투자                                                           */
/* ------------------------------------------------------------------ */

const US_FLOW: FlowNode[] = [
  { q: "어디서", name: "재원", sub: "운용수익 · 위탁자산 · 채권", text: "공사 출연금, 한국은행·외국환평형기금 위탁자산, 한미전략투자채권, 차입금 네 갈래예요. 첫 24억 달러는 한은과 외평기금의 외화자산에서 나왔어요.", note: "채권에 정부 보증을 붙이려면 국회 동의가 필요해요." },
  { q: "누가", name: "한미전략투자공사", sub: "기금을 만들고 굴려요", text: "2026년 6월 출범한 대미투자 전담 공기업이에요. 자본금 2조 원은 정부가 나눠 내요. 미국으로 돈을 보내는 곳이 여기예요.", note: "산업통상부 사업관리위원회가 검토하고 재정경제부 운영위원회가 최종 의결해요." },
  { q: "어디로", name: "I-SPV → P-SPV", sub: "미국 측 투자 법인 → 사업별 법인", text: "SPV는 사업을 위해 만든 서류상 회사예요. 24억 달러는 상위 법인(I-SPV)으로 먼저 갔어요.", note: "한 사업의 손실을 다른 사업 수익으로 메우는 ‘리스크 풀링’ 장치도 있어요." },
  { q: "어디로", name: "프로젝트 스타", sub: "텍사스 가스발전 (1호)", text: "총사업비 223억 달러, 약 6.4GW, 2029년 1단계 가동이 목표예요. 기금은 일부만 대고 나머지는 미국 사업자 출자와 프로젝트파이낸싱으로 채워요.", note: "정부는 20년간 430억~454억 달러 회수를 전망해요." },
];

function ShareSim() {
  const [earned, setEarned] = useState(120);
  const korea = Math.round((Math.min(earned, 200) * 0.5 + Math.max(0, earned - 200) * 0.1) * 10) / 10;
  const us = Math.round((earned - korea) * 10) / 10;
  return (
    <Card>
      <CardTitle kind="fact">수익은 어떻게 나누나</CardTitle>
      <p className="mt-2 type-body-md text-ink-secondary ko-justify">원리금 회수 전에는 5:5, 회수 뒤에는 미국 90 : 한국 10이에요. 원리금을 100으로 놓고 움직여 보세요.</p>
      <label className="mt-3 block">
        <span className="flex items-baseline justify-between type-caption font-semibold text-ink-secondary">
          사업이 번 돈 <span className="tabular type-heading-sm text-ink">{earned}</span>
        </span>
        <input type="range" min={0} max={400} step={10} value={earned} onChange={(e) => setEarned(Number(e.target.value))} className="mt-1 w-full accent-[#533afd]" aria-label="사업이 번 돈" />
      </label>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-ev-written-soft px-3 py-2">
          <p className="type-caption text-ink-secondary">한국 몫</p>
          <p className="tabular type-heading-md font-bold text-ink">{korea}</p>
        </div>
        <div className="rounded-xl bg-canvas-soft px-3 py-2">
          <p className="type-caption text-ink-secondary">미국 몫</p>
          <p className="tabular type-heading-md font-bold text-ink">{us}</p>
        </div>
      </div>
      <p className="mt-2 type-caption text-ink-mute [word-break:keep-all]">금액은 설명용 가상 숫자예요. 손실이 나면 공사 적립금으로 먼저 메우고, 모자라면 정부가 메워요.</p>
    </Card>
  );
}

function UsChapter() {
  return (
    <div className="space-y-5">
      <Line kind="fact">2025년 7월 30일 관세협상이 타결됐어요. 미국은 상호관세와 자동차 관세를 15%로 낮추고, 한국은 3,500억 달러를 투자해요. 원화로 약 465조 원(10월 보도 환산)이에요.</Line>
      <div className="flex h-11 gap-0.5 overflow-hidden rounded-xl" role="img" aria-label="전략투자 2,000억 달러, 조선협력 1,500억 달러">
        <div className="flex items-center justify-center bg-brand-dark type-caption font-bold text-on-primary" style={{ width: `${(2000 / 3500) * 100}%` }}>
          전략투자 2,000억
        </div>
        <div className="flex items-center justify-center bg-primary type-caption font-bold text-on-primary" style={{ width: `${(1500 / 3500) * 100}%` }}>
          조선협력 1,500억
        </div>
      </div>
      <FlowMap title="첫 24억 달러가 간 길 (10월 1일)" nodes={US_FLOW} start={1} accent={1} />
      <TermBox term="상업적 합리성" def="사업 기간 동안 한국에 돌아올 예상 수입이 투자 원금과 이자를 모두 충당하면 합격이에요." pic="이 돈을 넣어도 이자까지 받아낼 수 있나? 이자율은 미국 20년 국채 금리에 가산금리를 더해요." />
      <ShareSim />
      <Photo k="gas" caption="엔시날 발전소는 아직 없어요. 사진은 같은 텍사스주 오스틴의 가스발전소예요." />
      <Card>
        <CardTitle kind="fact">조선 1,500억은 구조가 달라요</CardTitle>
        <p className="mt-2 type-body-md text-ink ko-justify">민간투자·보증·선박금융으로 채우고, 수익은 전부 한국 기업 몫이에요. 전략투자의 5:5 배분을 쓰지 않아요.</p>
      </Card>

      <Sub>수은의 자리는 조연 셋</Sub>
      <div className="space-y-2.5">
        <Line kind="fact">위탁 후보: 시행령은 공사가 업무를 맡길 곳으로 수은·산은·무보·KIC·해진공·KIND를 적었어요. 공사 인력은 정원 50명 중 32명(10월)이에요.</Line>
        <Line kind="fact">채권 절차: 한미전략투자채권 발행은 수출입금융채권 절차를 준용해요. 수은이 돈을 마련하려고 찍는 그 채권이에요.</Line>
        <Line kind="fact">조선 간사: 6월 25일 여의도 수은에서 맺은 협약에서 “수출입은행이 간사를 맡아 대내외 소통과 사업 추진 현황 등을 관리”하기로 했어요.</Line>
      </div>
      <TermBox term="RG(선수금환급보증)" def="조선사가 배를 못 만들면 받은 선수금을 금융기관이 대신 돌려주겠다는 보증이에요." />
      <Photo k="philly" caption="2012년의 애커 필라델피아 조선소예요. 2024년 한화가 인수한 지금의 한화 필리조선소예요. 뱃머리 스마일은 합성이 아니에요." />

      <Sub>10월 국감 쟁점</Sub>
      <div className="space-y-2">
        <Fold title="① 공사가 감당하나" defaultOpen>
          <Side label="비판" kind="fact">
            <p>이종욱 의원(국민의힘): 리스크관리위 첫 회의가 송금 뒤에 열렸어요. “투자 사업 선정이 제일 큰 리스크 아니냐”.</p>
            <p>박수영 의원(국민의힘): “수출입은행이나 한국투자공사(KIC)에 맡기는 편이 나았을 것”.</p>
          </Side>
          <Side label="답변" kind="fact">
            <p>박종원 사장: 법률전문가를 계속 채용하고 대형 법률자문사도 고용할 예정이에요. 11월 2일 투자이사가 임명됐어요.</p>
          </Side>
          <Side label="금콩 풀이" kind="view">
            <p>수은 준비생의 논점은 그다음이에요. 공사 일이 수은으로 넘어올까요?</p>
          </Side>
        </Fold>
        <Fold title="② 돈이 되는 사업인가">
          <Side label="비판" kind="fact">
            <p>임이자 의원(국민의힘): 전력구매계약(PPA)과 수요처가 불확실한데 사업성을 어떻게 산정했나.</p>
          </Side>
          <Side label="답변" kind="fact">
            <p>이형일 부총리(10월 6일): “충족됐다고 본다”. PPA는 산업부가 2027년 체결을 추진해요.</p>
          </Side>
          <Side label="금콩 풀이" kind="view">
            <p>NPV(순현재가치)는 미래의 돈을 오늘 가치로 깎아 비교하는 계산이에요. 20년 합계 430억 달러를 오늘 돈과 바로 견주면 안 돼요.</p>
          </Side>
        </Fold>
        <Fold title="③ 환율을 밀어 올리나">
          <Side label="비판" kind="fact">
            <p>최지욱 한국투자증권 연구원: 연 200억 달러 추가를 단순 가정하면 균형환율 상승 압력은 20~25원이에요.</p>
          </Side>
          <Side label="답변" kind="fact">
            <p>구윤철 당시 부총리: “환전이 아니라 외화자산 운용수익 정도로 집행”. 신현송 총재(8월): “충분히 감당할 수 있는 수준”.</p>
          </Side>
          <Bars
            title="원/달러 월평균 환율"
            unit="원"
            max={1600}
            rows={[
              { k: "6월", v: 1528.0, show: "1,528.0" },
              { k: "8월", v: 1404.4, show: "1,404.4" },
              { k: "10월 (23일까지)", v: 1337.2, show: "1,337.2" },
            ]}
          />
          <Side label="금콩 풀이" kind="view">
            <p>환율은 올해 오히려 내려왔지만, 반도체 기업의 달러 매도도 함께 작용했어요. 이것만으로 부담이 없다고 볼 순 없어요. 연 200억 달러 한도와 나란히 쓰면 돼요.</p>
          </Side>
        </Fold>
        <Fold title="④ 수은 여신이 쏠리나">
          <Side label="비판" kind="fact">
            <p>안도걸 의원(민주당): 상위 5개사 여신이 자기자본의 87.5%예요. 국회예산정책처 자료로는 2024년 말 기준이에요.</p>
          </Side>
          <Bars
            title="수은 여신 상위 5개사"
            unit="조 원"
            max={8.8}
            rows={[
              { k: "한화오션", v: 8.8, show: "8.80" },
              { k: "삼성중공업", v: 4.057, show: "4.06" },
              { k: "HD현대중공업", v: 3.65, show: "3.65" },
              { k: "HD현대삼호", v: 2.207, show: "2.21" },
              { k: "한화에어로스페이스", v: 1.923, show: "1.92" },
            ]}
            note="합계 20조 6,370억 원, 전체 여신의 13.3%"
          />
          <Side label="답변" kind="kexim">
            <p>황기연 행장: “전체 여신에 대한 스트레스 테스트를 실시하고 있고 개별 기업에 대해서도 최선과 최악의 상황을 가정한 위험 평가를 하고 있다”.</p>
          </Side>
          <Side label="금콩 풀이" kind="view">
            <p>조선 4사에 한화에어로스페이스가 더해진 숫자예요. ‘조선 여신 87.5%’라고 쓰면 틀려요.</p>
          </Side>
        </Fold>
        <Fold title="⑤ 미국은 뭘 기대하나">
          <Side label="미국 쪽 말" kind="fact">
            <p>러트닉 상무장관(7월): “얼마나 많은 양해각서(MOU)를 체결했는지”가 아니라 “함께 생산해 낸 미국 내 선박 숫자”로 평가하겠다고 했어요.</p>
          </Side>
          <Side label="금콩 풀이" kind="view">
            <p>미국 법은 미군 함정의 해외 건조를 원칙적으로 막아요(번스-톨레프슨 규정). 그래서 현지 조선소와 정비(MRO)가 먼저 거론돼요.</p>
          </Side>
        </Fold>
      </div>

      <Stance
        face
        said={[
          { who: "황기연 행장(일러스트)", where: "6월 25일 협약식", text: "“수은은 우리나라 대표 선박금융기관으로서 그간 축적된 전문성과 노하우를 바탕으로 정부의 한미 조선협력투자 이행을 적극적으로 뒷받침할 것”" },
        ]}
        seat={["상위 5개사 여신이 이미 자기자본의 87.5%(2024년 말)예요. 조선협력의 보증·선박금융이 얹히면 집중이 커질 수 있어요.", "공사 인력이 모자라면 심사·집행 실무가 위탁기관으로 넘어올 수 있어요.", "미국 사업의 수익성이 수은 심사 기준에 못 미치면, 위탁받은 쪽은 어디까지 책임질까요?"]}
      />
      <Watch
        items={[
          { when: "올해 말까지", text: "미국이 요청하면 원전 8기 선납금 100억 달러 송금" },
          { when: "검토 중", text: "알래스카 LNG ‘프로젝트 노스’가 3호 사업이 되는지" },
          { when: "2027년", text: "공사 첫 달러채(최대 20억 달러 검토 보도), 텍사스 PPA 체결" },
          { when: "시기 미정", text: "미국 301조 조사 결과, 동맹국 함정 건조 법안" },
        ]}
      />
      <EssayBox qs={["대미투자 패키지의 구조와 정책금융기관의 역할", "해외투자의 ‘상업적 합리성’ 판단 기준", "대규모 해외투자가 환율에 미치는 영향과 정책 대응"]} frame={["정의: 전략투자 2,000억 + 조선협력 1,500억", "돈의 흐름: 기금 → 공사 → SPV → 사업", "수은: 위탁 후보 · 채권 절차 · 조선 협의체 간사", "리스크와 장치: 역량·환율·집중 vs 연 200억 달러 한도"]} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 2. 방산금융                                                           */
/* ------------------------------------------------------------------ */

const DEF_FLOW: FlowNode[] = [
  { q: "어디서", name: "빌려주는 쪽", sub: "수은 · 산탄데르 등", text: "수은의 13억 유로 방산 수출금융에는 하나은행 대출 3억 유로가 포함돼요. 빌려주는 쪽에는 산탄데르 두 곳도 있어요.", note: "수은 단독 부담액은 공개되지 않았어요. 13억 유로를 수은 몫으로만 쓰면 틀려요." },
  { q: "믿는 곳", name: "보증 · 보험", sub: "무보 + 수은", text: "무보와 수은의 보증·보험을 묶고, 그 보증서를 바탕으로 글로벌 은행에서 돈을 조달해요. 믿는 건 폴란드 정부 신용이에요." },
  { q: "어디로", name: "폴란드 BGK", sub: "폴란드 국책개발은행", text: "2025년 12월 말 금융계약을 맺었어요. 만기 17년, 원리금 분할상환으로 통상 10년보다 크게 늘렸어요.", note: "대출 총액은 공개되지 않았어요. 약 65억 달러는 K2 계약 가치로 보는 보도가 있어요." },
  { q: "어디로", name: "현대로템", sub: "K2 2차 선수금", text: "계약액 8조 9,814억 원의 약 30%인 21억 달러가 선수금으로 들어왔어요(1월 보도).", note: "NICE신용평가를 인용해 약 19억 달러로 적은 보도도 있어요." },
];

function DefenseChapter() {
  return (
    <div className="space-y-5">
      <P>무기는 사는 쪽이 정부이고 값이 조 단위예요. 그래서 파는 나라가 “돈은 우리가 빌려줄게”까지 제안해야 계약이 돼요. 자동차 할부 없이 차를 못 파는 것과 같아요.</P>
      <TermBox term="구매자금융" def="물건을 사는 외국 정부·기업에 돈을 빌려주는 수출금융이에요." />
      <Line kind="fact">문제는 한도예요. 은행법의 동일인 한도는 자기자본의 20%, 수은법은 40%예요. 자기자본 약 25조 원이면 한 사업에 최대 10조 원이고, 대출과 보증을 합쳐 따져요.</Line>
      <Line kind="fact">폴란드 사업은 전체 440억 달러 규모로 불려요. 1차 실행계약 약 17조 원에 수은이 약 6조 원을 빌려줬어요. 2024년 2월 남은 한도는 1조 3,600억 원이었다고 보도됐어요.</Line>
      <Photo k="k2" caption="폴란드군 K2 전차예요(2023년). 2차 계약 8조 9,814억 원의 돈을 누가 어떻게 대느냐가 이 장의 질문이에요." />
      <FlowMap title="K2 2차 계약의 돈" nodes={DEF_FLOW} />
      <Bars
        title="수은 2025년 여신 중 업종 비중"
        unit="%"
        max={19.3}
        rows={[
          { k: "선박", v: 19.3 },
          { k: "건설플랜트", v: 11.1 },
          { k: "자동차", v: 9.9 },
          { k: "전기전자", v: 9.9 },
          { k: "방산", v: 4.7 },
        ]}
        note="공청회 날 공개된 수은 자료 기준. 비중은 작아도 한 건이 커서 한도에 걸려요."
      />

      <Sub>막힌 한도를 푸는 세 가지</Sub>
      <div className="space-y-2.5">
        <Line kind="fact">자본금: 2024년 2월 29일 수은법을 고쳐 법정자본금 한도를 15조에서 25조 원으로 올렸어요. 다만 실제 정부 출자는 2조 4,000억 원에 그쳤어요(국회예산정책처).</Line>
        <Line kind="fact">민간 협조: K2 2차처럼 국내외 은행 대출을 함께 묶어요.</Line>
        <Line kind="fact">전략수출금융기금: 정부 구상은 승인 기준 약 4조 원(대출 2조 + 보증 2조)이에요. 2027 예산안은 총계 1조 3,903억 원이고, 그중 기금채가 1조 2,100억 원이에요.</Line>
      </div>
      <aside className="rounded-2xl bg-[#fff1e0] px-4 py-3.5">
        <p className="type-body-md font-bold text-[#7a3a08] [word-break:keep-all]">“기금이 출범했다”고 쓰면 틀려요.</p>
        <p className="mt-1 type-body-md text-[#7a3a08] ko-justify">법안 3건이 11월 4일 국회 경제재정소위에 상정됐고, 11월 6일 현재 의결 기록은 없어요. 재경부는 4월 소위에서 수은에 위탁하되 계정은 구분한다고 설명했어요.</p>
      </aside>

      <Sub>쟁점 셋</Sub>
      <div className="space-y-2">
        <Fold title="① 기여금, 누가 내나" defaultOpen>
          <Side label="찬성" kind="fact">
            <p>문진석 의원(민주당): “기여금이 붙는 계약들은 정부가 위험을 떠안지 않았으면 애초에 성사되지 않았을 계약들”.</p>
            <p>재경부: 계약에 연계된 건에만 물려 부담이 크지 않다는 입장이에요.</p>
          </Side>
          <Side label="반대" kind="fact">
            <p>안상남 한국방위산업진흥회 본부장: 5%를 의무화하면 비용이 겹쳐 중소·협력업체가 버티기 어렵다며 1%를 건의했어요.</p>
          </Side>
          <Side label="절충" kind="fact">
            <p>안도걸 의원(민주당): “수익이 실현된 이후 일부를 환원하는 성과 공유형으로 전환하는 방안을 검토할 필요”. 박수영 의원 안은 기여금 없이 기금을 짜요.</p>
            <p>숫자 정리: 법안 상한은 1%(수출산업협력 5%), 정부가 설명한 기본 요율은 0.5%예요.</p>
          </Side>
        </Fold>
        <Fold title="② 자본금이면 충분한가">
          <Side label="비판" kind="fact">
            <p>국회예산정책처: “단순 법정 자본금 상향에 그칠 게 아니라 실효성 있는 신용위험 관리방안을 마련해야 한다”.</p>
            <p>윤영석 의원(국민의힘): 통합 테스트만으론 부족하니 대규모 여신은 프로젝트별로 스트레스 테스트를 하라고 했어요.</p>
          </Side>
          <Side label="답변" kind="kexim">
            <p>황기연 행장: 전체 여신 스트레스 테스트와 개별 기업 평가를 하고, “필요한 경우 별도의 집중 한도를 설정하는 등 다층적으로 리스크를 관리하고 있다”.</p>
          </Side>
          <Side label="금콩 풀이" kind="view">
            <p>자본금 증액은 일회성이고 기금은 상시 장치예요. 다만 둘 다 한 업종 쏠림 자체를 줄여 주진 않아요.</p>
          </Side>
        </Fold>
        <Fold title="③ 기관끼리 겹치지 않나">
          <Side label="비판" kind="fact">
            <p>안도걸 의원: “기존 수은의 일반 금융지원이나 한국무역보험공사의 지원과 어떻게 차별화할 것인지 구체적인 규정이 필요하다”.</p>
            <p>박인용 변호사(율촌): 기여금의 이중부과 우려와 다른 법안과의 관계 정리를 요구했어요.</p>
          </Side>
          <Side label="답변" kind="kexim">
            <p>황기연 행장: OECD 국가위험등급과 상환 방식을 세분화해 차별화 방안을 검토하겠다고 했어요.</p>
          </Side>
        </Fold>
      </div>
      <Stance
        said={[
          { who: "황기연 행장", where: "10월 20일 국감", text: "“합리적인 방안이 결정되면 수은이 기금의 목적에 맞게 적극적으로 움직이겠다”" },
          { who: "황기연 행장", where: "10월 6일 방진회 협약", text: "“최근 방산 대기업의 수출 호황이 중소기업으로 이어지는 낙수효과를 극대화해 탄탄한 방산 생태계를 구축해야 한다”" },
          { who: "황기연 행장", where: "10월 20일 국감", text: "“현재 KAI 매각 계획이 없다”" },
        ]}
        seat={["기금이 생겨도 수은 한도가 저절로 넉넉해지진 않아요. 수은·무보·기금이 위험을 어떻게 나누느냐가 핵심이에요.", "‘기존 정책금융과 차별화’를 말한 건 중복 비판을 의식한 답으로 읽혀요.", "수은이 KAI 지분 26.41%를 가진 최대주주라는 점도 방산 질문에서 함께 나올 수 있어요."]}
      />
      <Watch
        items={[
          { when: "소위 처리", text: "기금법 3건의 의결 여부와 기여금 요율" },
          { when: "예산 심의", text: "2027 기금 예산안 1조 3,903억 원의 국회 처리" },
          { when: "협상 중", text: "폴란드 K2 3차 수출금융 협의 (10월 보도)" },
          { when: "참고", text: "캐나다 잠수함은 7월 독일 TKMS가 우선협상대상자, 한화오션은 예비 공급업체" },
        ]}
      />
      <EssayBox qs={["방산 수출에서 정책금융의 역할과 한계", "자본규제(동일인 한도·BIS)가 정책금융에 미치는 영향", "수출금융 이익 환류(기여금) 찬반"]} frame={["구매자금융 정의와 왜 필요한가", "40% 한도와 폴란드 사례", "대응 세 가지: 자본금 · 민간 협조 · 기금", "비용과 중복: 기여금, 수은·무보·기금 역할"]} />
      <p className="type-caption text-ink-mute [word-break:keep-all]">BIS 비율은 위험을 반영한 자산 대비 자기자본 비율이에요. 큰 대출이 늘면 이 비율이 내려가요.</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 3. 공급망기금                                                         */
/* ------------------------------------------------------------------ */

const SUP_FLOW: FlowNode[] = [
  { q: "어디서", name: "기금채 · 외화채 · 출연", sub: "정부보증 + 수은 출연", text: "정부 보증 기금채가 중심이에요. 보증 한도는 2025년과 2026년 모두 10조 원이에요. 4월엔 첫 외화채 5억 달러를 냈어요.", note: "2025년 12월 수은법 개정으로 수은도 출연할 수 있게 됐어요. 2027 예산안은 재경부가 수은에 2,000억 원을 출자해 기금에 출연하는 경로를 담았어요." },
  { q: "누가", name: "수출입은행", sub: "법정 관리·운용 기관", text: "기본법 제40조: “기금은 한국수출입은행이 관리ㆍ운용한다.” 회계는 다른 회계와 구분해요.", note: "감독은 재정경제부 장관이 해요." },
  { q: "어디로", name: "기업 · 펀드", sub: "선도사업자 216개 등", text: "대출·보증·출자로 지원해요. 정부가 지정한 선도사업자가 중심이고, 관계 부처나 심의회가 인정한 사업도 대상이에요.", note: "핵심광물·에너지 펀드는 기금이 1,000억 원을 넣어 2,500억 원을 만드는 구조예요(출자 비율 40%)." },
];

function SupplyChapter() {
  return (
    <div className="space-y-5">
      <P>2021년 요소수 대란을 떠올리면 돼요. 수입 품목 하나가 끊기자 도로가 멈출 뻔했어요. 2019년 일본 수출규제도 앞선 경험이었고요.</P>
      <Line kind="fact">그래서 「경제안보를 위한 공급망 안정화 지원 기본법」을 만들고, 2024년 9월 기금을 출범했어요. 수입선 다변화, 비축, 국내 생산, 해외 자원에 돈을 대요.</Line>
      <TermBox term="외부효과" def="한 기업이 돈을 들여 공급을 안정시키면 이득은 산업 전체가 누려요. 그래서 시장에만 맡기면 투자가 모자라요." pic="쌀을 쌓는 창고가 아니라, 쌀을 쌓는 기업에 돈을 빌려주는 창고." />
      <FlowMap title="공급망기금의 돈" nodes={SUP_FLOW} start={1} accent={1} />
      <Photo k="lithium" caption="위성에서 본 칠레 아타카마 소금사막이에요. 파란 사각형이 리튬 증발못이에요. 기금의 핵심광물 지원은 약 2조 5,500억 원이에요." />
      <Bars
        title="누적 승인 17조 3,569억 원 (2024년~2026년 9월)"
        unit="조 원"
        max={15.33}
        rows={[
          { k: "대기업 (75건)", v: 15.327, show: "15.33" },
          { k: "중견 (37건)", v: 1.371, show: "1.37" },
          { k: "기타·펀드 (6건)", v: 0.346, show: "0.35" },
          { k: "중소 (35건)", v: 0.314, show: "0.31" },
        ]}
        note="연도별 승인: 2024년 2.1조 → 2025년 7.1조 → 2026년 9월까지 8.1조"
      />
      <aside className="rounded-2xl bg-[#fff1e0] px-4 py-3.5">
        <p className="type-body-md font-bold text-[#7a3a08] [word-break:keep-all]">88%와 91%는 같은 통계예요.</p>
        <p className="mt-1 type-body-md text-[#7a3a08] ko-justify">누적이 88%, 올해 1~9월만 자르면 91%예요. 17.4조는 승인액이라 실제 집행액과 달라요.</p>
      </aside>

      <Sub>쟁점 넷</Sub>
      <div className="space-y-2">
        <Fold title="① 대기업 쏠림, 문제인가 구조인가" defaultOpen>
          <Side label="비판" kind="fact">
            <p>김태년 의원(민주당): 중소 선도사업자 95곳이 지원액의 3.1%만 받았고, 3곳 중 2곳은 못 받았다고 추정했어요.</p>
          </Side>
          <Side label="정부 반론" kind="fact">
            <p>재경부: 원유 같은 품목은 건당 금액이 커서 금액 비중이 높아요. 건수로는 대기업 51%, 중견 25%, 중소 24%예요.</p>
          </Side>
          <Side label="답변" kind="kexim">
            <p>황기연 행장: 중소기업은 건수에 비해 금액 비중이 작다며 “금융 상품 개발과 마케팅 등을 연구하겠다”.</p>
          </Side>
          <Side label="금콩 풀이" kind="view">
            <p>양쪽 숫자를 나란히 쓰세요. 중소·중견기업용 500억 원 특별한도의 소진율이 28.8%라는 점도 개선 근거가 돼요.</p>
          </Side>
        </Fold>
        <Fold title="② 돈을 쓴 만큼 의존도가 내려갔나">
          <Side label="비판" kind="fact">
            <p>정태호 의원(민주당): 특정국 의존도가 2024년 70.4%에서 올해 65.5%예요. 정부 목표는 2030년 50% 이하예요.</p>
          </Side>
          <Side label="금콩 풀이" kind="view">
            <p>얼마를 썼나보다 의존도가 얼마나 내려갔나가 성적표예요. 뉴스토마토는 산술적 감축 경로(62.6%)보다 높다고 적었어요.</p>
          </Side>
        </Fold>
        <Fold title="③ 다른 기금과 겹치지 않나">
          <Side label="비판" kind="fact">
            <p>안도걸 의원: 2027년 신설될 1조 4,000억 원 규모 기금(예산안 명칭 자원안보기금)과 겹쳐요. 정태호 의원: 첨단전략산업 지원도 산은 기금과 겹칠 수 있어요.</p>
          </Side>
          <Side label="답변" kind="kexim">
            <p>황기연 행장: “경제 안보 품목을 담당하는 공급망기금과 핵심 에너지를 담당하는 자원안보기금이 일부 중첩될 수 있다는 점에 공감한다”.</p>
          </Side>
        </Fold>
        <Fold title="④ 대출에 쏠린 건 아닌가">
          <Side label="비판" kind="fact">
            <p>김상훈 의원(국민의힘): 핵심광물 지원의 74%가 구매자금 대출이고, 지분투자 대출과 펀드 출자는 집행 실적이 없어요.</p>
            <p>안도걸 의원: 블라인드펀드(어디 투자할지 정하지 않고 모으는 펀드)는 전체 위험을 놓칠 수 있어요.</p>
          </Side>
          <Side label="답변" kind="kexim">
            <p>황기연 행장: “다층적인 리스크 관리를 통해 펀드에서 손실이 발생하지 않도록 철저히 관리·감독하겠다”.</p>
          </Side>
        </Fold>
      </div>
      <Stance
        said={[
          { who: "수은", where: "4월 외화채 발표", text: "“공급망 안보에 필요한 자금을 적재적소에 즉각 투입해”" },
          { who: "황기연 행장", where: "10월 20일 국감, 고려아연 질의", text: "“최근 그 부분에 대해 협의하고 있다”" },
        ]}
        seat={["기금은 경제안보 품목을 다루는 기업에 가는데, 큰돈이 드는 품목은 대기업이 많이 다뤄요. 쏠림은 기금 목적의 결과이기도 해요.", "수은이 출연까지 하게 되면 운용자에 돈을 대는 역할이 하나 더 붙어요."]}
      />
      <Watch
        items={[
          { when: "검토 중", text: "고려아연 미국 테네시 제련소 지원 여부 (10월 20일 기준 미결정)" },
          { when: "연말 계획", text: "미주개발은행(IDB)과 공급망 협력, 호주·캐나다 데스크 추진" },
          { when: "예산 심의", text: "자원안보기금 신설과 역할 분담" },
        ]}
      />
      <EssayBox qs={["공급망 리스크의 경제학적 성격과 정책금융 개입의 정당성", "정책기금의 대기업 쏠림, 문제인가 구조인가", "블라인드펀드 출자의 장단점"]} frame={["외부효과 → 시장의 과소투자", "기금: 정부보증 기금채, 선도사업자 지원", "한계: 쏠림 · 중복 · 대출 편중", "개선: 중소 트랙, 의존도를 성과 지표로"]} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 4. EDCF                                                              */
/* ------------------------------------------------------------------ */

const EDCF_FLOW: FlowNode[] = [
  { q: "어디서", name: "정부 돈", sub: "출연금 · 공자기금 예수금 · 운용수익", text: "대외경제협력기금법이 정한 재원이에요. 수은 자기 돈이 아니에요.", note: "2027 예산안의 EDCF는 1조 9,000억 원이에요(국회 심의 전 정부안)." },
  { q: "누가", name: "재정경제부 장관", sub: "지원 방침 결정", text: "법 제9조: “기금은 재정경제부장관이 운용·관리한다.” 중요 사업은 운용위원회 심의를 거쳐요.", note: "유상협력은 재정경제부 장관, 무상협력은 외교부 장관이 주관해요(국제개발협력기본법 제12조)." },
  { q: "실무", name: "수출입은행", sub: "심사 · 계약 · 집행 · 사후관리", text: "1987년부터 위탁받아 맡아요. 승인을 수은이 한다고 쓰면 틀려요.", note: "하반기 공고에 EDCF 직군이 경영 5명, 경제 5명 따로 있어요." },
  { q: "어디로", name: "개도국 정부", sub: "입찰로 시공사 선정", text: "개도국 정부가 차주예요. 믿는 건 차주국 신용과 사업의 개발효과 평가예요. 상환은 최장 40년, 금리는 0.01~2.5%(4월 보도)예요." },
];

function EdcfChapter() {
  return (
    <div className="space-y-5">
      <P>개도국에 도로·병원·발전소 지을 돈을 시장보다 훨씬 싸게 오래 빌려주는 게 유상원조예요. 갚는 조건이 있어야 상대국도 사업을 고르고, 증여로는 다 못 대는 큰 인프라도 할 수 있어요.</P>
      <TermBox term="양허성 차관" def="금리·상환기간·거치기간이 개도국의 시장 차입 조건보다 유리한, 갚아야 하는 지원이에요." pic="동네 후배에게 거의 무이자로 오래 빌려주는 돈." />
      <TermBox term="구속성 차관" def="공여국 기업 등으로 조달을 묶은 차관이에요. 재경부는 우리 기업만 참여 가능한 차관으로 설명해요." pic="빌려주되 우리 가게에서 사게 하는 것. 어디서 사든 되면 비구속." />
      <FlowMap title="EDCF의 돈" nodes={EDCF_FLOW} start={2} accent={2} />
      <Photo k="bridge" caption="캄보디아의 강 위에 놓이던 다리예요(2013년). EDCF 사업으로 확인된 사진은 아니에요. 유상원조가 대는 인프라의 규모를 떠올려 보세요." />
      <Card>
        <CardTitle kind="fact">EDCF, 숫자로 보면</CardTitle>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {[
            ["누적 승인 (2025년 말)", "60개국 545개 사업, 약 40조 6,029억 원"],
            ["2025년 집행", "37개국 156개 사업, 1.9조 원"],
            ["참여기업 해외계약 (2025년)", "3.6조 원"],
            ["2026~28 신규 승인 계획", "9조 원 (연평균 3조)"],
          ].map(([k, v]) => (
            <div key={k} className="rounded-xl bg-canvas-soft px-3 py-2.5">
              <p className="type-caption text-ink-secondary [word-break:keep-all]">{k}</p>
              <p className="mt-0.5 type-body-md font-bold text-ink [word-break:keep-all]">{v}</p>
            </div>
          ))}
        </div>
        <p className="mt-2.5 type-caption text-ink-mute [word-break:keep-all]">직전 계획(2025~27)의 승인 목표는 14.1조 원이었어요. 11월 4일에는 EDCF 첫 AI 사업인 탄자니아 1.7억 달러 계약을 맺었어요.</p>
      </Card>

      <Sub>쟁점 다섯</Sub>
      <div className="space-y-2">
        <Fold title="① 평가보고서가 부실하다" defaultOpen>
          <Side label="비판" kind="fact">
            <p>임이자 의원(국민의힘): 평가보고서 16건에 외부 용역비 12억 7,300만 원을 썼고, 7건을 한 기관이 맡았어요. 베트남 도로 사업은 유사 서술, 케냐·모잠비크·우간다는 확인이 어려운데도 만점이라고 지적했어요.</p>
          </Side>
          <Side label="답변" kind="kexim">
            <p>황기연 행장: “평가 품질이 낮거나 용역이 제대로 수행되지 않은 기관은 향후 입찰 참여를 제한하겠다”.</p>
          </Side>
          <Side label="금콩 풀이" kind="view">
            <p>개발효과를 믿고 빌려주는 돈이라 평가가 무너지면 근거가 무너져요.</p>
          </Side>
        </Fold>
        <Fold title="② 일괄하청, 제재 0건">
          <Side label="비판" kind="fact">
            <p>윤영석 의원(국민의힘): 국내사가 공사를 따서 현지 업체에 통째로 넘기는 일괄하청을 지적했어요. 최근 5년 제재는 0건이에요.</p>
          </Side>
          <Side label="답변" kind="kexim">
            <p>황기연 행장: 엄격히 금지돼 있고, 숨긴 사실이 확인되면 “사기나 범죄의 영역에 해당할 수 있다”.</p>
          </Side>
        </Fold>
        <Fold title="③ 중소기업이 밀려났다">
          <Side label="비판" kind="fact">
            <p>안도걸 의원(2025년 국감): 입찰 규모는 3,000억 원(2020년)에서 3.4조 원(2025년)으로 늘고, 중소 비중은 58%에서 2%로 줄었어요. 소액차관 기준을 700만에서 2,000만 달러로 올리자고 했어요.</p>
          </Side>
          <Side label="금콩 풀이" kind="view">
            <p>사업이 커지면 대형사 몫이 되는 구조예요. 소액차관 승인이 5년간 2건이었다는 점까지 쓰면 “왜 안 쓰였나”로 한 걸음 나가요.</p>
          </Side>
        </Fold>
        <Fold title="④ 승인에 비해 집행이 느리다">
          <Side label="비판" kind="fact">
            <p>임이자 의원: 2021~2026년 8월 승인 97건 17조 9,447억 원 중 해당 사업 집행은 약 3조 530억 원이에요.</p>
          </Side>
          <Side label="답변" kind="fact">
            <p>구윤철 당시 부총리(4월): 장기 지연 사업은 승인 취소 등 구조조정을 하겠다고 했어요.</p>
          </Side>
          <Side label="금콩 풀이" kind="view">
            <p>인프라는 원래 승인과 집행 사이 시차가 길어요. 이 점을 같이 써야 공정해요.</p>
          </Side>
        </Fold>
        <Fold title="⑤ 원조인가 국익인가">
          <Side label="국제 기준" kind="fact">
            <p>OECD 개발원조위원회는 비구속을 권고해요. 2024년 동료평가에 따르면 2021년 한국의 구속 비중은 34%, 평균은 19%예요.</p>
          </Side>
          <Side label="국내 요구" kind="fact">
            <p>재경부는 주요 공여국이 원조와 경제·안보 이익의 연계를 강화한다고 설명해요. 탄자니아 사업도 구속성 차관이에요.</p>
          </Side>
          <Side label="금콩 풀이" kind="view">
            <p>반론 숫자도 있어요. 2019~21년 한국 기업이 딴 원조 계약 금액의 87.3%는 다른 공여국 재원이었어요. 비구속으로 가도 경쟁할 수 있다는 근거예요.</p>
          </Side>
        </Fold>
      </div>
      <Stance
        said={[
          { who: "황기연 행장", where: "6월 10일 EDCF 혁신전략 보고회 (헤럴드경제)", text: "“투명성과 공정성을 EDCF의 새로운 기준으로 삼아, 국민이 믿고 맡길 수 있는 기금으로 거듭나겠다”" },
          { who: "황기연 행장", where: "같은 자리", text: "“대기업뿐 아니라 중소기업까지 함께 성장하는 개발협력으로 우리 경제의 외연을 넓혀 가겠다”" },
        ]}
        seat={["EDCF는 원조와 수출 지원이라는 두 목적을 함께 가진 돈이에요. 수은은 그 사이에 서 있어요.", "투명성 강조는 2025년 국감의 캄보디아 약정 논란에서 이어진 흐름이에요. 정책실명제·사업이력제는 2025년 12월 정부 방안에서 먼저 나왔어요."]}
      />
      <Watch
        items={[
          { when: "예산 심의", text: "2027 EDCF 예산안 1조 9,000억 원" },
          { when: "첫 공개", text: "심사보고서 게시판 첫 사업 공개 (11월 6일 기준 0건)" },
          { when: "미정", text: "소액차관 기준 조정, 평가 수행기관 제재 실행" },
        ]}
      />
      <EssayBox qs={["유상원조와 무상원조 비교, 각각의 장단점", "원조의 국익 연계(구속·비구속) 찬반", "원조 효과성을 높이는 제도 설계"]} frame={["양허성 정의: 금리 · 거치기간 · 상환기간", "대출이라 가능한 것: 큰 규모와 상환 규율", "증여가 나은 영역: 보건 · 교육", "한국은 둘 다, 수은은 유상을 위탁 집행"]} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 5. 답안 엮기                                                          */
/* ------------------------------------------------------------------ */

const CROSS = [
  { q: "수출입은행은 왜 필요한가", a: "크다·길다·상대가 정부. 네 주제 모두 셋 중 둘 이상에 해당해요." },
  { q: "수은과 산은·무보는 뭐가 다른가", a: "대미투자는 위탁·간사, 방산은 대출과 보험, 공급망은 기금 운용, EDCF는 유상과 무상으로 답해요." },
  { q: "정책금융의 대기업 쏠림", a: "상위 5개사 87.5%, 공급망 88%, EDCF 중소 입찰 2%. 구조적 이유와 개선책을 둘 다 써요." },
  { q: "수은 자본은 충분한가", a: "법정자본금 25조 원, 실제 출자 2.4조 원, 동일인 한도 40%, 기금 논의로 이어가요." },
  { q: "정책금융은 전략금융이 돼야 하나", a: "구윤철 당시 부총리(7월): “앞으로 정책금융은 새로운 시장과 산업을 선제적으로 설계하는 전략금융이 되어야 한다”. 네 주제를 사례로 찬반을 써요." },
];

const ESSAY_RULES = ["첫 문단은 정의와 숫자 하나로 시작해요.", "다음 문단에서 세 질문으로 구조를 그려요.", "수은의 자리를 정확히 적어요. 집행자인지 운용자인지요.", "쟁점은 비판과 답변을 같이 써요. 한쪽만 알면 반쪽이에요.", "“확대해야 한다”로 끝내지 말고 비용·중복·쏠림 중 하나를 붙여요."];

function CrossChapter() {
  return (
    <div className="space-y-5">
      <P>문제가 네 주제 밖에서 나와도 재료는 쓸 수 있어요. 다섯 질문으로 네 주제를 엮어 보세요.</P>
      <div className="space-y-2">
        {CROSS.map((x, i) => (
          <Fold key={x.q} title={x.q} defaultOpen={i === 0}>
            <div className="flex items-start gap-2">
              <span className="mt-[3px]">
                <Tag kind="view" />
              </span>
              <p className="min-w-0 flex-1 type-body-md text-ink ko-justify">{x.a}</p>
            </div>
          </Fold>
        ))}
      </div>
      <Card>
        <CardTitle kind="view">답안 쓰는 순서</CardTitle>
        <ol className="mt-3 space-y-2">
          {ESSAY_RULES.map((t, i) => (
            <li key={t} className="flex gap-2.5 type-body-md text-ink [word-break:keep-all]">
              <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-dark tabular text-[11px] font-bold text-on-primary">{i + 1}</span>
              {t}
            </li>
          ))}
        </ol>
      </Card>
      <P>
        수은 경영 2차의 시험 구조는 <Link href={KEXIM_WRITTEN_HREF} className="link">수은 필기 글</Link>에 정리했어요. 공고상 경영 2차 과목에 일반논술이 들어 있어요.
      </P>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 6. 숫자 한 장                                                         */
/* ------------------------------------------------------------------ */

const SHEET = [
  {
    t: "대미투자",
    rows: [
      ["3,500억 달러", "전략투자 2,000억 + 조선협력 1,500억"],
      ["200억 달러", "회계연도별 집행 한도"],
      ["24억 달러", "10월 1일 첫 송금, 사업비의 10% 남짓"],
      ["50명 중 32명", "공사 정원과 근무 인원 (10월)"],
    ],
  },
  {
    t: "방산금융",
    rows: [
      ["40%", "수은법 동일인 한도 (은행법 20%)"],
      ["25조 원", "법정자본금 한도 (2024년 상향)"],
      ["약 4조 원", "기금 승인 규모 (정부 구상)"],
      ["0.5%", "기여금 기본 요율 설명 (법안 상한 1%)"],
    ],
  },
  {
    t: "공급망기금",
    rows: [
      ["17.4조 원", "누적 승인 (2024년~2026년 9월)"],
      ["88%", "대기업 비중 (올해 1~9월은 91%)"],
      ["65.5%", "특정국 의존도, 2030년 목표 50% 이하"],
    ],
  },
  {
    t: "EDCF",
    rows: [
      ["1987년", "설치, 수은 위탁"],
      ["60개국 40.6조 원", "2025년 말 누적 승인"],
      ["연 3조 원", "2026~28 신규 승인 계획"],
    ],
  },
  {
    t: "공통",
    rows: [["87.5%", "상위 5개사 여신 ÷ 자기자본 (2024년 말)"]],
  },
];

const TRAPS = ["수은이 대미투자를 집행한다 → 집행은 공사예요.", "조선 여신이 87.5%다 → 조선 4사 + 한화에어로스페이스예요.", "전략수출금융기금이 출범했다 → 11월 6일 현재 소위 단계예요.", "13억 유로는 수은 몫이다 → 하나은행 3억 유로가 포함돼요.", "5년 100조와 150조는 같다 → 전략수주와 통상위기 대응으로 다른 프로그램이에요.", "황 행장의 ‘중소 10%’는 공급망기금 숫자다 → 기금의 중소 비중은 1.8%예요.", "EDCF를 수은이 승인한다 → 방침 결정은 재정경제부 장관이에요."];

function SheetChapter() {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        {SHEET.map((g) => (
          <div key={g.t} className="rounded-2xl bg-canvas px-4 py-3.5 shadow-level-1">
            <p className="type-heading-sm text-ink">{g.t}</p>
            <dl className="mt-2 space-y-1.5">
              {g.rows.map(([k, v]) => (
                <div key={k} className="flex items-baseline gap-3">
                  <dt className="w-[104px] shrink-0 type-body-md font-bold text-primary-text [word-break:keep-all]">{k}</dt>
                  <dd className="min-w-0 flex-1 type-body-md text-ink-secondary [word-break:keep-all]">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
      <Card>
        <CardTitle>이렇게 쓰면 틀려요</CardTitle>
        <ul className="mt-3 space-y-2">
          {TRAPS.map((t) => (
            <li key={t} className="flex gap-2 type-body-md text-ink [word-break:keep-all]">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              {t}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 7. 면접                                                               */
/* ------------------------------------------------------------------ */

const QNA = [
  { t: "대미투자", qs: ["대미투자에서 수은이 하는 일이 뭔가요?", "상위 5개사 여신이 자기자본의 87.5%인데 더 늘려도 되나요?", "미국 가스발전소가 실패하면 누가 책임지나요?"] },
  { t: "방산금융", qs: ["수은 자본금이 왜 방산 수출과 연결되나요?", "기여금에 찬성하나요?", "무보랑 뭐가 다른가요?"] },
  { t: "공급망기금", qs: ["대기업 쏠림이 문제인가요?", "수출은행이 왜 수입을 지원하나요?", "자원안보기금과 뭐가 다른가요?"] },
  { t: "EDCF", qs: ["KOICA와 뭐가 다른가요?", "원조인데 왜 우리 기업이 공사를 하나요?", "개도국이 못 갚으면 어떻게 되나요?"] },
];

function InterviewChapter() {
  return (
    <div className="space-y-5">
      <Card>
        <CardTitle kind="fact">2차 필기 뒤 관문 (하반기 공고)</CardTitle>
        <ol className="mt-3 space-y-1.5 type-body-md text-ink [word-break:keep-all]">
          <li>
            <b className="tabular">11월 28일</b> 영어활용능력평가(TOEIC S&W)
          </li>
          <li>
            <b>11월 말~12월 초(예정)</b> 1차 면접, NCS 기반 직무역량평가. 1.5배수, EDCF·지역전문가·보훈은 2배수
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
        <p className="mt-1.5 type-body-md text-on-primary/85 ko-justify">수은을 칭찬하지 말고 역할을 설명해요. 국감 비판을 말할 땐 수은 답변도 같이요.</p>
      </aside>
      <div className="space-y-2">
        {QNA.map((g) => (
          <Fold key={g.t} title={`${g.t} 예상 질문`}>
            <ul className="space-y-1.5">
              {g.qs.map((q) => (
                <li key={q} className="type-body-md text-ink [word-break:keep-all]">
                  · {q}
                </li>
              ))}
            </ul>
          </Fold>
        ))}
      </div>
      <Card>
        <CardTitle kind="view">PT 연습 주제</CardTitle>
        <ul className="mt-2.5 space-y-1.5 type-body-md text-ink [word-break:keep-all]">
          <li>· 한미 조선협력 1,500억 달러에서 수은의 금융지원 구조 설계</li>
          <li>· 초대형 방산·원전 수주를 위한 금융 패키지 설계</li>
          <li>· 중소기업 공급망 지원 확대 방안</li>
          <li>· EDCF 사업 투명성 제고 제도 설계</li>
        </ul>
      </Card>
      <Line kind="rumor">상반기 수은 면접에 인바스켓(서류를 주고 처리안을 쓰게 하는 과제)이 있었대요. PT 주제는 중소·중견기업 지원이었다는 후기도 있어요. 한두 명의 말이에요.</Line>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 8. 정리                                                               */
/* ------------------------------------------------------------------ */

const SUMMARY = [
  "네 주제 모두 돈이 어디서 나와, 어디로 가고, 무엇을 믿고 가나로 시작해요.",
  "수은의 자리는 다 달라요. 대미투자는 조연, 방산은 빌려주는 쪽, 공급망은 운용자, EDCF는 위탁 집행이에요.",
  "쟁점은 쏠림·한도·중복·평가예요. 비판과 수은 답변을 함께 쓰면 돼요.",
];

const SOURCES: [string, string][] = [
  ["금융위원회, 조선협력투자 업무협약 (2026/6/25)", "https://www.fsc.go.kr/no010101/87187"],
  ["산업통상부, 10월 수출입 동향 (11/1)", "https://www.motir.go.kr/kor/article/ATCL3f49a5a8c/172360/view"],
  ["EDCF 개요·기금 현황", "https://www.edcfkorea.go.kr/HPHFFE034M01"],
  ["수은 하반기 채용 공고 (ALIO)", "https://job.alio.go.kr/recruitview.do?idx=305702"],
  ["의안정보, 전략수출금융기금법안 (11/6 조회)", "https://likms.assembly.go.kr/bill/bi/billDetailPage.do?billId=PRC_P2Q6O0P1N2O3W1W0U0T2U4S3S7A2B2"],
  ["국회 경제재정소위 회의록 (4/29)", "https://record.assembly.go.kr/assembly/viewer/minutes/xml.do?id=56637&type=view"],
  ["OECD 한국 개발협력 동료평가 (2024)", "https://www.oecd.org/content/dam/oecd/en/publications/reports/2024/05/oecd-development-co-operation-peer-reviews-korea-2024_8adb0d3d/889c6564-en.pdf"],
  ["KB Think, 대미투자특별법 해설", "https://kbthink.com/investment/issues/us-investment-act.html"],
  ["KB Think, 첫 대미투자 사업 해설", "https://kbthink.com/investment/issues/korea-us-investment.html"],
  ["헤럴드경제, 시행령 위탁기관·채권 준용 (6/8)", "https://www.heraldk.com/article/2026060820300072759"],
  ["뉴시스, 한미 전략투자 MOU (2025/11/14)", "https://www.newsis.com/view/NISX20251114_0003403546"],
  ["데일리안, 대미투자 일지 (10/1)", "https://www.dailian.co.kr/news/view/1694105"],
  ["CEO스코어데일리, 이형일 부총리 답변 (10/6)", "https://m.ceoscoredaily.com/page/view/2026100615492559261"],
  ["파이낸셜뉴스, 프로젝트 스타 구조 (10/2)", "https://www.fnnews.com/news/202610020601211936"],
  ["파이낸셜뉴스(뉴스1), 환율 영향 (9/9)", "https://www.fnnews.com/news/202609090555269502"],
  ["MTN, 프로젝트 스타·원전 8기 (10/1)", "https://news.mtn.co.kr/news-detail/2026100104283999993"],
  ["아이뉴스24, 공사 국감 (10/20)", "https://inews24.com/view/2016899"],
  ["뉴데일리, 송금 논란 (10/20)", "https://www.newdaily.co.kr/site/data/html/2026/10/20/2026102000283.html"],
  ["주간한국, 수은 국감 (10/20)", "https://weekly.hankooki.com/news/articleView.html?idxno=7189826"],
  ["서울경제, 국회예산정책처 수은 여신 집중 (10/10)", "https://m.sedaily.com/article/20099936"],
  ["경북매일, 환율 월평균 (10/26)", "https://kbmaeil.com/article/20261026500025"],
  ["노컷뉴스, 러트닉 발언 (7/23)", "https://nocutnews.co.kr/news/6552681"],
  ["한국경제TV, 공사 투자이사 임명 (11/2)", "https://www.wowtv.co.kr/NewsCenter/News/Read?articleId=A202611020072"],
  ["파이낸셜뉴스, K2 2차 금융 (1/26)", "https://www.fnnews.com/news/202601260810579586"],
  ["뉴스토마토, 수은 한도와 방산 (1/12)", "https://www.newstomato.com/ReadNews.aspx?no=1287510"],
  ["이투데이, 수은법 개정과 폴란드 한도 (2024/2/29)", "https://www.etoday.co.kr/news/view/2335446"],
  ["아주경제, 기금법 공청회 (4/29)", "https://www.ajunews.com/view/20260429154622292"],
  ["한국경제, 기금 정부안 4조 (5/21)", "https://www.hankyung.com/article/2026052125811"],
  ["뉴스핌, 기금 2027 예산안 (9/4)", "https://www.newspim.com/news/view/20260904000668"],
  ["폴리뉴스, 문진석 자료 (10/5)", "https://www.polinews.co.kr/news/articleView.html?idxno=744894"],
  ["아주경제, 황기연 방진회 협약 (10/7)", "https://www.ajunews.com/view/20261007094157808"],
  ["한국금융신문, 공급망기금 국감 (10/21)", "https://www.fntimes.com/html/view.php?ud=2026102021002266871b5a221379_18"],
  ["뉴스토마토, 공급망기금 정리 (10/30)", "https://newstomato.com/ReadNews.aspx?no=1318613"],
  ["핀포인트뉴스, 공급망기금 연도별 비중 (10/14)", "https://www.pinpointnews.co.kr/news/articleView.html?idxno=495033"],
  ["재경부 보도참고 전재 (10/15)", "https://www.ksw-news.com/news/articleView.html?idxno=3047091"],
  ["아시아경제, 고려아연 질의 (10/20)", "https://view.asiae.co.kr/article/2026102018012388893"],
  ["글로벌이코노믹, 공급망 협력 답변 (10/20)", "https://www.g-enews.com/article/Finance/2026/10/202610201338497825bb91c46fcd_1"],
  ["헤럴드경제, 공급망기금 외화채 (4월)", "https://www.heraldk.com/article/2026040115321542558"],
  ["헤럴드경제, EDCF 혁신전략 (6/10)", "https://www.heraldk.com/article/2026061015574673686"],
  ["뉴스토마토, EDCF 평가 질의 (10/20)", "http://www.newstomato.com/ReadNews.aspx?no=1317374"],
  ["한국금융신문, EDCF 국감 (10/20)", "https://www.fntimes.com/html/view.php?ud=2026102022243754731b5a221379_18"],
  ["조세금융신문, EDCF 중소 입찰 (2025/10/27)", "https://tfmedia.co.kr/mobile/article.html?no=196976"],
  ["헤럴드경제, EDCF 중기계획 (4/12)", "https://www.heraldk.com/article/2026041216300047601"],
  ["SBS Biz, 제157차 운용위 (4/13)", "https://biz.sbs.co.kr/amp/article/20000303808"],
  ["뉴스핌, 탄자니아 차관 (11/5)", "https://www.newspim.com/news/view/20261105000141"],
  ["파이낸셜뉴스, 수은 창립 50주년 (7/1)", "https://www.fnnews.com/news/202607011358025699"],
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
        <p>이 글은 2026년 11월 6일 기준이에요. 확인한 사실과 금콩의 해석을 나눠 썼어요. 국감 발언은 언론 보도 기준이에요.</p>
        <p className="mt-1">썸네일 바탕 사진: 미 해군 / Wikimedia Commons, 퍼블릭 도메인</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 장 목록                                                               */
/* ------------------------------------------------------------------ */

const CHAPTERS: GuideChapter[] = [
  { short: "공통 틀", title: "네 주제를 한 틀로 보면?", kong: "질문이 셋뿐이래요. 전 시험장 가는 길도 세 번 물어봐요.", look: "book", bg: "bg-[#f4f2ff]", body: <FrameChapter /> },
  { short: "대미투자", title: "미국에 465조, 누가 어떻게 보내나?", kong: "관세 깎으려고 465조를 약속했대요. 제 통장 잔고는 4만 원대인데요.", look: "sweat", bg: "bg-[#eef6ff]", body: <UsChapter /> },
  { short: "방산", title: "은행 자본금이 왜 탱크 수출을 막나?", kong: "탱크 값도 모르는데 여신 한도부터 외우래요.", look: "suit", bg: "bg-[#fff8ec]", body: <DefenseChapter /> },
  { short: "공급망", title: "수출은행이 왜 수입을 지키나?", kong: "나라 공급망을 지킨대요. 전 제 냉장고 재고도 몰라요.", look: "pencil", bg: "bg-[#f2fbf5]", body: <SupplyChapter /> },
  { short: "EDCF", title: "개도국에 빌려주면 우리한테 뭐가 남나?", kong: "빌려주고 원조래요. 전 빌려주면 그냥 못 받던데요.", look: "sweat", bg: "bg-[#fff4f0]", body: <EdcfChapter /> },
  { short: "답안 엮기", title: "네 주제를 답안에 어떻게 엮나?", kong: "모범답안은 없어요. 있었으면 제가 먼저 베꼈어요.", look: "pencil", bg: "bg-[#f4f2ff]", body: <CrossChapter /> },
  { short: "숫자 한 장", title: "시험장 가기 전, 뭘 외우나?", kong: "캡처해 두세요. 전 캡처만 해 두고 안 봐요.", look: "book", bg: "bg-[#eef6ff]", body: <SheetChapter /> },
  { short: "면접까지", title: "붙고 나면 뭘 묻나?", kong: "30초 안에 말하래요. 전 자기소개만 40초예요.", look: "suit", bg: "bg-[#f2fbf5]", body: <InterviewChapter /> },
  { short: "정리", title: "세 줄로 끝내면?", kong: "여기까지 읽었으면 저보다 잘 아세요. 그건 별로 어렵지 않아요.", look: "suit", bg: "bg-[#f6f4ff]", body: <Wrap /> },
];

export function KeximEssayGuide({ title }: { title: string }) {
  return (
    <GuideShell
      chapters={CHAPTERS}
      eyebrow="금콩 인터랙티브 · 수은 논술 종합"
      heading={title}
      sub="대미투자, 방산금융, 공급망기금, EDCF를 같은 틀로 정리했어요. 시험 전에 한 번에 훑어 보세요."
      mascot={<KongMascot hold="book" glasses className="h-24 w-24 shrink-0 md:h-32 md:w-32" />}
      tabsLabel="수은 논술 종합 목차"
      cover={<Hook />}
      coverClass="from-[#e6ebff]"
    />
  );
}
