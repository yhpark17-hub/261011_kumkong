"use client";

import Link from "next/link";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowDown, ArrowRight, BookOpen, ChevronDown, Quote, X } from "lucide-react";
import { cn } from "../../ui";
import { KongMascot } from "../KongMascot";
import { GuideShell, anim, useGuideGo, type GuideChapter } from "./GuideShell";

/**
 * 수은 논술 종합 — 대미투자·방산금융·공급망기금·EDCF 네 주제를 시험 전에 한 번에
 * 사전 지식이 없어도 이야기처럼 따라 읽도록: 무슨 일인가 → 돈의 길 → 수은의 자리 → 논쟁 → 답안.
 * 숫자·날짜·발언은 2026-11-06 기준으로 법령·정부 자료·의안정보·기사 원문을 열어 확인한 것만 써요.
 * 수은 입장(행장 공식 발언)과 해석(금콩 풀이)은 칸을 나눠요. 전망은 달력 항목으로만 적어요.
 */

const KEXIM_WRITTEN_HREF = "/magazine/9";
const KEXIM_HREF = "/companies/kexim";

/* 장 번호 */
const CH = { frame: 0, us: 1, defense: 2, supply: 3, edcf: 4, essay: 5, nums: 6, interview: 7 } as const;

/* ------------------------------------------------------------------ */
/* 말풀이 — 점선 밑줄 말을 누르면 아래에 뜻이 떠요                            */
/* ------------------------------------------------------------------ */

const GLOSS = {
  정책금융: "민간 은행이 크기·기간·위험 때문에 선뜻 나서기 어려운 곳에, 나라의 정책에 맞춰 대는 돈이에요.",
  국정감사: "국회가 해마다 정부와 공공기관이 일을 제대로 했는지 따져 묻는 자리예요.",
  상호관세: "미국이 상대 나라의 무역 조건을 문제 삼아 나라별로 매긴 관세예요.",
  외환보유액: "나라가 위기에 대비해 쌓아 둔 달러 같은 외화예요.",
  외국환평형기금: "환율이 크게 흔들릴 때 시장 안정을 위해 쓰는 정부 자금이에요.",
  채권: "돈을 빌리면서 써 주는 증서예요. 정해진 날에 원금과 이자를 갚아요.",
  국채: "나라가 돈을 빌리려고 찍는 채권이에요.",
  가산금리: "기준이 되는 금리에 위험을 따져 더 얹는 금리예요.",
  원리금: "빌린 원금과 그 이자를 합친 돈이에요.",
  SPV: "사업 하나를 맡으려고 만든 서류상 회사예요. 특수목적법인이라고도 해요.",
  프로젝트파이낸싱: "회사의 담보보다 그 사업이 앞으로 벌 돈을 믿고 빌려주는 대출이에요.",
  리스크풀링: "여러 사업을 하나로 묶어, 한 사업의 손실을 다른 사업의 수익으로 메우는 장치예요.",
  선박금융: "배를 짓거나 사는 데 필요한 돈을 빌려주는 금융이에요.",
  보증: "돈을 빌린 쪽이 못 갚으면 대신 갚겠다는 약속이에요.",
  RG: "선수금환급보증이에요. 조선사가 배를 못 만들면 미리 받은 돈을 금융기관이 대신 돌려주겠다는 약속이에요.",
  선수금: "물건을 넘기기 전에 미리 받는 돈이에요. 계약금과 비슷해요.",
  여신: "은행이 내준 대출과 보증을 합쳐 부르는 말이에요.",
  자기자본: "은행이 빌린 돈이 아닌 자기 돈이에요. 손실이 나도 버틸 수 있는 밑천이에요.",
  동일인한도: "은행이 한 곳에 몰아서 빌려주지 못하게 막는 상한이에요. 자기자본의 일정 비율로 정해요.",
  법정자본금: "법으로 정한 자본금의 상한이에요. 상한을 올려도 실제 출자가 들어와야 자본이 늘어요.",
  스트레스테스트: "경기 악화 같은 최악의 상황을 가정해 은행이 버틸 수 있는지 미리 따져 보는 점검이에요.",
  균형환율: "외환 수요와 공급이 맞을 때의 환율을 추정한 값이에요.",
  PPA: "전력구매계약이에요. 앞으로 오랫동안 전기를 사 주겠다고 미리 맺는 계약이에요.",
  NPV: "순현재가치예요. 미래에 받을 돈을 오늘 가치로 깎아서 투자금과 비교하는 계산이에요.",
  MRO: "함정이나 항공기의 정비·수리·점검을 묶어 부르는 말이에요.",
  구매자금융: "물건을 사는 외국 정부나 기업에 돈을 빌려주는 수출금융이에요.",
  수출보험: "수출 대금을 못 받을 위험을 대신 떠안아 주는 보험이에요. 한국무역보험공사(무보)가 맡아요.",
  국가위험: "상대 나라의 사정 때문에 돈을 못 돌려받을 위험이에요.",
  BIS비율: "위험을 반영한 자산 대비 자기자본 비율이에요. 큰 대출이 늘면 이 비율이 내려가요.",
  기금채: "기금이 돈을 마련하려고 찍는 채권이에요.",
  출연: "돌려받을 것을 기대하지 않고 기금 등에 돈을 넣는 거예요.",
  출자: "지분을 받는 대신 자본금으로 돈을 넣는 거예요.",
  기여금: "금융 지원을 받은 기업이 집행액의 일정 비율을 기금에 내는 돈이에요.",
  소위: "상임위원회 안의 소위원회예요. 법안을 먼저 자세히 살펴보는 곳이에요.",
  선도사업자: "경제안보품목을 다루는 기업 가운데 정부가 지정해 집중 지원하는 사업자예요.",
  승인: "이만큼 지원하기로 결정한 금액이에요. 실제 나간 돈은 집행액이라고 불러서 서로 달라요.",
  외부효과: "한 사람의 행동이 낸 이득이나 손해가 값을 치르지 않은 다른 사람에게 돌아가는 현상이에요.",
  핵심광물: "리튬처럼 첨단산업에 꼭 필요하고 공급이 불안한 광물이에요.",
  블라인드펀드: "어디에 투자할지 정하지 않고 먼저 돈부터 모으는 펀드예요.",
  양허성차관: "금리와 상환기간, 원금을 갚기 시작할 때까지의 기간이 시장 조건보다 유리한, 갚아야 하는 지원이에요.",
  구속성차관: "빌려준 돈으로 공여국 기업 등에서 사도록 묶은 차관이에요. 묶지 않으면 비구속이에요.",
  공공자금관리기금: "정부의 여러 기금 자금을 모아 필요한 곳에 빌려주는 기금이에요. 정부 안의 큰 주머니예요.",
  일괄하청: "공사를 따낸 뒤 현지 업체에 통째로 넘기는 거예요.",
  소액차관: "700만 달러 이하의 작은 사업에 무이자로 빌려주는 EDCF 제도예요. 중소기업 참여를 돕는 제도예요.",
} as const;

type GlossKey = keyof typeof GLOSS;

const GlossCtx = createContext<(k: GlossKey) => void>(() => {});

/** 뜻을 볼 수 있는 말 */
function W({ k, children }: { k: GlossKey; children?: ReactNode }) {
  const open = useContext(GlossCtx);
  return (
    <span
      role="button"
      tabIndex={0}
      onClick={() => open(k)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open(k);
        }
      }}
      className="cursor-help border-b border-dashed border-primary/70 hover:bg-ev-written-soft"
    >
      {children ?? k}
    </span>
  );
}

function GlossLayer({ children }: { children: ReactNode }) {
  const [k, setK] = useState<GlossKey | null>(null);
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!k) return;
    const close = (e: PointerEvent) => {
      if (!panel.current?.contains(e.target as Node)) setK(null);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setK(null);
    window.addEventListener("pointerdown", close);
    window.addEventListener("keydown", esc);
    return () => {
      window.removeEventListener("pointerdown", close);
      window.removeEventListener("keydown", esc);
    };
  }, [k]);
  return (
    <GlossCtx.Provider value={setK}>
      {children}
      {k && (
        <div ref={panel} role="dialog" aria-label={`${k} 뜻`} className="fixed inset-x-3 bottom-36 z-[75] mx-auto max-w-md rounded-2xl bg-brand-dark px-4 py-3.5 text-on-primary shadow-level-2 md:bottom-8 motion-safe:animate-[kk-fade-in_.2s_ease-out]">
          <div className="flex items-start justify-between gap-3">
            <p className="type-caption font-bold text-on-primary/75">이 말의 뜻</p>
            <button type="button" onClick={() => setK(null)} aria-label="닫기" className="-m-1 p-1 text-on-primary/80">
              <X className="h-4 w-4" strokeWidth={2.4} />
            </button>
          </div>
          <p className="mt-1 type-body-md [word-break:keep-all]">{GLOSS[k]}</p>
        </div>
      )}
    </GlossCtx.Provider>
  );
}

/* ------------------------------------------------------------------ */
/* 공통 조각                                                             */
/* ------------------------------------------------------------------ */

type Kind = "kexim" | "view" | "outlook" | "rumor";

const KIND: Record<Kind, { label: string; cls: string }> = {
  kexim: { label: "수은 입장", cls: "bg-[#e3ecff] text-[#1d4f9a]" },
  view: { label: "금콩 풀이", cls: "bg-[#ffe6cc] text-[#9a4a0b]" },
  outlook: { label: "전망", cls: "bg-[#e3f5ea] text-[#1d6e43]" },
  rumor: { label: "카더라", cls: "bg-canvas-soft text-ink-secondary" },
};

function Tag({ kind }: { kind: Kind }) {
  return <span className={cn("inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] leading-4 font-bold whitespace-nowrap", KIND[kind].cls)}>{KIND[kind].label}</span>;
}

/** 본문 문단 */
function P({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("type-body-lg leading-relaxed text-ink ko-justify", className)}>{children}</p>;
}

/** 장 안의 소제목 */
function Sub({ children }: { children: ReactNode }) {
  return <h3 className="pt-3 type-heading-md text-ink [word-break:keep-all]">{children}</h3>;
}

function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("rounded-2xl bg-canvas px-5 py-5 shadow-level-1", className)}>{children}</div>;
}

/** 금콩 풀이 칸 — 사실과 섞이지 않게 */
function Note({ children, title }: { children: ReactNode; title?: string }) {
  return (
    <aside className="rounded-2xl bg-[#fff4e8] px-4 py-3.5">
      <div className="flex items-center justify-between gap-2">
        <p className="type-body-md font-bold text-[#7a3a08] [word-break:keep-all]">{title ?? "이렇게 보면 돼요"}</p>
        <Tag kind="view" />
      </div>
      <div className="mt-1.5 space-y-1.5 type-body-md text-[#5f3006] ko-justify">{children}</div>
    </aside>
  );
}

/** 틀리기 쉬운 말 */
function Warn({ children }: { children: ReactNode }) {
  return (
    <aside className="rounded-2xl border-2 border-primary/30 bg-canvas px-4 py-3.5">
      <p className="type-caption font-bold text-primary-text">틀리기 쉬워요</p>
      <p className="mt-1 type-body-md text-ink ko-justify">{children}</p>
    </aside>
  );
}

/** 수은이 직접 한 말 */
function Say({ who, where, children, face }: { who: string; where: string; children: ReactNode; face?: boolean }) {
  return (
    <figure className="flex gap-3 rounded-2xl bg-canvas px-4 py-4 shadow-level-1">
      {/* eslint-disable-next-line @next/next/no-img-element -- 사용자 제공 일러스트 (public/magazine/kexim) */}
      {face && <img src="/magazine/kexim/ceo.webp" width={640} height={743} alt="황기연 수출입은행장 일러스트" loading="lazy" decoding="async" className="h-24 w-auto shrink-0 self-end rounded-xl" />}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <Quote className="h-4 w-4 shrink-0 text-primary" strokeWidth={2.4} />
          <Tag kind="kexim" />
        </div>
        <blockquote className="mt-1.5 type-body-md font-semibold text-ink [word-break:keep-all]">{children}</blockquote>
        <figcaption className="mt-1.5 type-caption text-ink-mute [word-break:keep-all]">
          {who} · {where}
        </figcaption>
      </div>
    </figure>
  );
}

/** 쟁점 하나 — 질문을 제목으로 */
function Issue({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl bg-canvas px-5 py-5 shadow-level-1">
      <h4 className="type-heading-sm text-ink [word-break:keep-all]">{title}</h4>
      <div className="mt-2.5 space-y-3 type-body-md leading-relaxed text-ink [&>p]:ko-justify">{children}</div>
    </section>
  );
}

/** 돈의 길 — 눌러야 보이는 내용 없이 전부 펼쳐요 */
function Path({ title, steps }: { title: string; steps: { name: string; text: ReactNode }[] }) {
  return (
    <Card>
      <p className="type-heading-sm text-ink [word-break:keep-all]">{title}</p>
      <ol className="mt-3.5">
        {steps.map((s, i) => (
          <li key={s.name} className="flex gap-3">
            <div className="flex w-8 shrink-0 flex-col items-center">
              <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-dark tabular type-caption font-bold text-on-primary">{i + 1}</span>
              {i < steps.length - 1 && (
                <span className="flex w-full flex-1 flex-col items-center py-1 text-primary" aria-hidden>
                  <span className="w-0.5 flex-1 bg-primary/25" />
                  <ArrowDown className="-mt-1 h-3.5 w-3.5" strokeWidth={2.6} />
                </span>
              )}
            </div>
            <div className={cn("min-w-0 flex-1 pt-1", i < steps.length - 1 && "pb-4")}>
              <p className="type-body-md font-bold text-ink [word-break:keep-all]">{s.name}</p>
              <p className="mt-1 type-body-md text-ink-secondary ko-justify">{s.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}

/** 막대 — 값은 항상 글자로 함께 (막대는 0에서 시작) */
function Bars({ title, unit, rows, max, note }: { title: string; unit?: string; rows: { k: string; v: number; show?: string }[]; max: number; note?: string }) {
  return (
    <div className="rounded-2xl bg-canvas px-4 py-3.5 shadow-level-1">
      <p className="type-body-md font-bold text-ink [word-break:keep-all]">
        {title}
        {unit && <span className="font-normal text-ink-mute"> ({unit})</span>}
      </p>
      <div className="mt-2.5 space-y-2">
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
      {note && <p className="mt-2.5 type-caption text-ink-mute [word-break:keep-all]">{note}</p>}
    </div>
  );
}

/* 사진 — 재사용이 허락된 사진만 (CC BY·퍼블릭 도메인), 사진마다 출처를 그대로 */
const PHOTOS = {
  gas: { src: "/magazine/kexim/texas-gas.webp", h: 675, alt: "미국 텍사스주 오스틴의 가스발전소 굴뚝들", credit: "사진: Larry D. Moore / Wikimedia Commons, CC BY 4.0", href: "https://commons.wikimedia.org/wiki/File:Sand_Hill_Energy_Center_Power_Plant_Austin_Energy.jpg" },
  philly: { src: "/magazine/kexim/philly-yard.webp", h: 795, alt: "미국 필라델피아 조선소의 대형 크레인과 건조 중인 검은 선체", credit: "사진: R'lyeh Imaging / Wikimedia Commons, CC BY 2.0", href: "https://commons.wikimedia.org/wiki/File:Aker_Philadelphia_Shipyard.jpg" },
  k2: { src: "/magazine/kexim/k2-poland.webp", h: 675, alt: "폴란드 훈련장의 진흙 위를 달리는 K2 전차", credit: "사진: 미 육군 Staff Sgt. Matthew Foster / Wikimedia Commons, 퍼블릭 도메인 (일부 잘라냄)", href: "https://commons.wikimedia.org/wiki/File:K2_Tank_Joins_the_Fight_with_eFP_Battle_Group_Poland_-_1.jpg" },
  lithium: { src: "/magazine/kexim/atacama-lithium.webp", h: 675, alt: "위성에서 본 칠레 아타카마 소금사막과 파란 리튬 증발못", credit: "사진: NASA Earth Observatory / Wikimedia Commons, CC BY 2.0 (일부 잘라냄)", href: "https://commons.wikimedia.org/wiki/File:Salar_de_Atacama,_Chile_-_NASA_Earth_Observatory.jpg" },
  bridge: { src: "/magazine/kexim/cambodia-bridge.webp", h: 675, alt: "캄보디아의 강 위에 놓이고 있는 교량 공사 현장", credit: "사진: damien_farrell / Wikimedia Commons, CC BY 2.0", href: "https://commons.wikimedia.org/wiki/File:New_bridge_construction_on_brassac_river._Cambodia_P1030193.jpg" },
  assembly: { src: "/magazine/kdb/yeouido.webp", h: 900, alt: "한강 건너에서 본 여의도 고층 빌딩과 국회의사당", credit: "사진: Kimhs5400 / Wikimedia Commons, CC BY 4.0", href: "https://commons.wikimedia.org/wiki/File:Yeouido2025.jpg" },
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

/** 앞으로 볼 일정 */
function Watch({ items }: { items: { when: string; text: string }[] }) {
  return (
    <div className="rounded-2xl bg-canvas px-5 py-4 shadow-level-1">
      <div className="flex items-center justify-between gap-2">
        <p className="type-heading-sm text-ink">앞으로 지켜볼 일정</p>
        <Tag kind="outlook" />
      </div>
      <ul className="mt-2.5 space-y-2.5">
        {items.map((x) => (
          <li key={x.text}>
            <p className="type-caption font-bold text-primary-text">{x.when}</p>
            <p className="mt-0.5 type-body-md text-ink-secondary [word-break:keep-all]">{x.text}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** 논술로 나온다면 */
function EssayBox({ qs, intro, frame }: { qs: string[]; intro: string; frame: { step: string; text: string }[] }) {
  return (
    <section className="rounded-2xl bg-ev-written-soft px-5 py-5">
      <div className="flex items-center justify-between gap-2">
        <h4 className="type-heading-sm text-ink">논술로 나온다면</h4>
        <Tag kind="view" />
      </div>
      <p className="mt-2 type-caption font-bold text-primary-text">이런 문제를 생각해 볼 수 있어요</p>
      <ul className="mt-1 space-y-1 type-body-md text-ink [word-break:keep-all]">
        {qs.map((q) => (
          <li key={q}>· {q}</li>
        ))}
      </ul>
      <p className="mt-3.5 type-caption font-bold text-primary-text">{intro}</p>
      <ol className="mt-1.5 space-y-2.5">
        {frame.map((f, i) => (
          <li key={f.step} className="flex gap-2.5">
            <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-dark tabular text-[11px] font-bold text-on-primary">{i + 1}</span>
            <p className="min-w-0 flex-1 type-body-md text-ink ko-justify">
              <b>{f.step}.</b> {f.text}
            </p>
          </li>
        ))}
      </ol>
      <p className="mt-3 type-caption text-ink-secondary [word-break:keep-all]">모범답안이 아니라 순서를 잡는 뼈대예요. 금콩이 만든 연습용이에요.</p>
    </section>
  );
}

/** 장 끝 한 줄 */
function Remember({ children }: { children: ReactNode }) {
  return (
    <aside className="rounded-2xl bg-brand-dark px-5 py-4 text-on-primary">
      <p className="type-micro-cap text-on-primary/70">이 장을 한 줄로</p>
      <p className="mt-1 type-heading-sm [word-break:keep-all]">{children}</p>
    </aside>
  );
}

function Fold({ title, children }: { title: ReactNode; children: ReactNode }) {
  const [open, setOpen] = useState(false);
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
/* 표지                                                                 */
/* ------------------------------------------------------------------ */

const SEATS = [
  { to: CH.us, name: "대미투자", seat: "옆에서 돕는 조연", text: "미국에 돈을 보내는 곳은 한미전략투자공사예요. 수은은 공사의 일을 맡아 줄 수 있는 후보이자, 조선 협력 모임의 총무예요." },
  { to: CH.defense, name: "방산금융", seat: "직접 빌려주는 은행", text: "폴란드 같은 외국 정부에 수은이 직접 돈을 빌려줘요. 그래서 한 곳에 빌려줄 수 있는 상한이 큰 문제가 돼요." },
  { to: CH.supply, name: "공급망기금", seat: "기금을 굴리는 운용자", text: "법이 기금 운용을 수은에 맡겼어요. 은행 장부와 따로 회계를 해요." },
  { to: CH.edcf, name: "EDCF", seat: "맡아서 집행하는 곳", text: "기금의 주인은 재정경제부 장관이에요. 수은은 심사와 계약, 집행, 사후관리 실무를 맡아요." },
];

function Hook() {
  const go = useGuideGo();
  const [sel, setSel] = useState<number | null>(null);
  return (
    <div className="space-y-4">
      <div className="rounded-3xl bg-canvas/90 p-4 shadow-level-1 backdrop-blur sm:p-5">
        <p className="type-body-lg leading-relaxed text-ink ko-justify">
          10월 20일 수은 <W k="국정감사" />에서는 하루 동안 방산 수출 기금, 공급망 기금, 개발도상국 원조 자금 이야기가 줄줄이 나왔어요. 미국에 투자금을 보내는 회사도 같은 날 국감을 받았고요. 수은을 준비한다면 이 네 주제는 알아 두면 좋아요.
        </p>
        <p className="mt-3 type-body-lg leading-relaxed text-ink ko-justify">재미있는 건 네 주제에서 수은이 맡은 역할이 모두 다르다는 거예요. 이것만 구분해도 답안이 달라져요.</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {SEATS.map((x, i) => (
            <button key={x.name} type="button" onClick={() => setSel(i)} aria-pressed={sel === i} className={cn("rounded-xl border-2 px-2 py-2.5 text-center", anim, sel === i ? "border-brand-dark bg-brand-dark text-on-primary" : "border-hairline bg-canvas text-ink hover:border-brand-dark/40")}>
              <span className="block type-body-md font-bold">{x.name}</span>
              <span className={cn("block type-caption [word-break:keep-all]", sel === i ? "text-on-primary/80" : "text-ink-mute")}>{sel === i ? x.seat : "수은의 역할은?"}</span>
            </button>
          ))}
        </div>
        {sel !== null && (
          <div key={sel} className="mt-2.5 rounded-2xl bg-ev-written-soft px-4 py-3 motion-safe:animate-[kk-fade-in_.3s_ease-out]">
            <p className="type-body-md text-ink ko-justify">{SEATS[sel].text}</p>
            <button type="button" onClick={() => go(SEATS[sel].to, true)} className="mt-1.5 inline-flex items-center gap-1 type-caption font-bold text-primary-text">
              이 주제 바로 읽기 <ArrowRight className="h-3 w-3" strokeWidth={2.4} />
            </button>
          </div>
        )}
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <button type="button" onClick={() => go(CH.frame, true)} className={cn("flex items-center justify-between gap-2 rounded-xl bg-brand-dark px-4 py-3 text-left type-body-md font-semibold text-on-primary", anim)}>
            처음부터 차근차근 읽기
            <ArrowRight className="h-4 w-4 shrink-0" strokeWidth={2.2} />
          </button>
          <button type="button" onClick={() => go(CH.nums, true)} className={cn("flex items-center justify-between gap-2 rounded-xl border-2 border-brand-dark/20 bg-canvas px-4 py-3 text-left type-body-md font-semibold text-ink hover:border-brand-dark", anim)}>
            시간 없으면 숫자 한 장
            <ArrowRight className="h-4 w-4 shrink-0" strokeWidth={2.2} />
          </button>
        </div>
      </div>
      <div className="rounded-2xl bg-canvas/70 px-4 py-3 type-caption text-ink-secondary">
        <p className="[word-break:keep-all]">
          <span className="border-b border-dashed border-primary/70">점선 밑줄</span>이 있는 말은 누르면 뜻이 나와요. 따로 표시 없는 문장은 공식 자료와 기사로 확인한 사실이에요. 2026년 11월 6일 기준이에요.
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <span>따로 표시하는 것:</span>
          {(Object.keys(KIND) as Kind[]).map((k) => (
            <Tag key={k} kind={k} />
          ))}
        </div>
        <p className="mt-1.5 [word-break:keep-all]">출제 예상이 아니에요. 올해 수은이 전면에 섰고 찬반이 있는 주제를 금콩이 고른 거예요.</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 0. 먼저                                                              */
/* ------------------------------------------------------------------ */

type Topic = "us" | "def" | "sup" | "edcf";

const GRID: Record<Topic, { title: string; rows: [string, string][] }> = {
  us: {
    title: "관세를 낮추는 대가로 미국에 약속한 투자금이에요.",
    rows: [
      ["돈이 어디서 나오나", "나라가 가진 달러 자산을 굴려 번 수익, 공사가 찍는 채권"],
      ["어디로 가나", "미국의 투자 법인을 거쳐 텍사스 발전소 같은 사업으로"],
      ["무엇을 믿고 가나", "사업이 벌 돈으로 원금과 이자를 회수할 수 있다는 계산"],
      ["수은의 역할", "옆에서 돕는 조연. 돈을 보내는 곳은 한미전략투자공사"],
    ],
  },
  def: {
    title: "외국 정부가 우리 무기를 살 때 빌려주는 돈이에요.",
    rows: [
      ["돈이 어디서 나오나", "수은과 국내외 은행"],
      ["어디로 가나", "폴란드 국책은행을 거쳐 현대로템의 선수금으로"],
      ["무엇을 믿고 가나", "폴란드 정부의 신용, 그리고 수은·무보의 보증과 보험"],
      ["수은의 역할", "직접 빌려주는 은행. 그래서 대출 상한에 부딪혀요"],
    ],
  },
  sup: {
    title: "요소수 대란 같은 일을 막으려고 기업에 대는 돈이에요.",
    rows: [
      ["돈이 어디서 나오나", "정부가 보증한 채권, 외화 채권, 수은이 넣는 돈"],
      ["어디로 가나", "경제안보 품목을 다루는 기업, 일부는 펀드"],
      ["무엇을 믿고 가나", "기업의 재무 상태 (지정과 대출 심사는 기준이 달라요)"],
      ["수은의 역할", "법이 정한 기금 운용자. 회계는 은행과 따로"],
    ],
  },
  edcf: {
    title: "개발도상국에 아주 싸게 오래 빌려주는 원조 자금이에요.",
    rows: [
      ["돈이 어디서 나오나", "정부 예산 등 나랏돈. 수은 돈이 아니에요"],
      ["어디로 가나", "개발도상국 정부를 거쳐 도로·병원 같은 사업으로"],
      ["무엇을 믿고 가나", "그 나라의 신용과 사업의 개발효과 평가"],
      ["수은의 역할", "심사·계약·집행·사후관리 실무. 결정은 재정경제부 장관"],
    ],
  },
};

function FrameChapter() {
  const [t, setT] = useState<Topic>("us");
  return (
    <div className="space-y-4">
      <P>한국수출입은행(수은)은 우리가 창구에서 통장을 만드는 은행이 아니에요. 수출하는 기업과 해외에 투자하는 기업을 돕고, 개발도상국 지원 자금도 맡는 나라의 은행이에요. 이런 곳을 정책금융기관이라고 불러요.</P>
      <P>왜 이런 은행이 따로 있을까요? 보통 은행 입장이 되어 보면 쉬워요. 은행에는 돈을 떼이지 않고 제때 돌려받는 게 가장 중요해요. 그런데 수조 원을 20년 동안 빌려줘야 한다면, 혹은 돈을 빌리는 상대가 외국 정부라면 어떨까요? 너무 크고, 너무 길고, 돌려받지 못할 위험도 커서 선뜻 나서기 어려워요.</P>
      <P>
        그래도 나라에 꼭 필요한 일이라면 누군가는 해야 해요. 그 자리에 들어가는 돈이 <W k="정책금융" />이에요. 이 글의 네 주제가 모두 그런 경우예요.
      </P>

      <Sub>네 주제를 보는 질문은 세 개면 돼요</Sub>
      <P>주제가 달라도 똑같이 물어보면 구조가 보여요. 돈이 어디서 나오나? 어디로 가나? 무엇을 믿고 가나? 마지막 질문은 “나중에 돌려받을 근거가 뭐냐”는 뜻이에요. 전세대출로 치면 은행 돈이 집주인에게 가고, 은행은 전세계약과 보증을 믿고 빌려주는 것과 같아요.</P>
      <Card>
        <p className="type-heading-sm text-ink">눌러서 네 주제를 비교해 보세요</p>
        <div role="tablist" aria-label="주제 고르기" className="mt-3 grid grid-cols-4 gap-1 rounded-xl bg-canvas-soft p-1">
          {(
            [
              ["us", "대미투자"],
              ["def", "방산"],
              ["sup", "공급망"],
              ["edcf", "EDCF"],
            ] as const
          ).map(([k, label]) => (
            <button key={k} type="button" role="tab" aria-selected={t === k} onClick={() => setT(k)} className={cn("rounded-lg px-1 py-2 text-center type-caption font-semibold [word-break:keep-all] sm:type-body-md", anim, t === k ? "bg-canvas text-ink shadow-level-1" : "text-ink-secondary hover:text-ink")}>
              {label}
            </button>
          ))}
        </div>
        <div key={t} className="mt-3 motion-safe:animate-[kk-fade-in_.3s_ease-out]">
          <p className="type-body-md font-bold text-ink [word-break:keep-all]">{GRID[t].title}</p>
          <dl className="mt-2.5 space-y-2">
            {GRID[t].rows.map(([k, v]) => (
              <div key={k} className="rounded-xl bg-canvas-soft px-3.5 py-2.5">
                <dt className="type-caption font-bold text-primary-text">{k}</dt>
                <dd className="mt-0.5 type-body-md text-ink [word-break:keep-all]">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Card>
      <Photo k="assembly" caption="여의도와 국회의사당이에요. 네 주제 모두 10월 국정감사에서 질문이 몰렸어요. 그래서 글에는 의원의 지적과 수은의 답변을 함께 적었어요." />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 1. 대미투자                                                           */
/* ------------------------------------------------------------------ */

function ShareSim() {
  const [earned, setEarned] = useState(120);
  const korea = Math.round((Math.min(earned, 200) * 0.5 + Math.max(0, earned - 200) * 0.1) * 10) / 10;
  const us = Math.round((earned - korea) * 10) / 10;
  const done = earned >= 200;
  return (
    <Card>
      <p className="type-heading-sm text-ink">직접 움직여 보세요: 수익은 어떻게 나뉠까?</p>
      <p className="mt-2 type-body-md text-ink-secondary ko-justify">한국이 돌려받아야 할 돈(원금+이자)을 100이라고 쳐요. 숫자는 설명을 위해 지어낸 것이고, 나누는 비율만 실제예요.</p>
      <label className="mt-3 block">
        <span className="flex items-baseline justify-between type-caption font-semibold text-ink-secondary">
          사업이 지금까지 번 돈 <span className="tabular type-heading-sm text-ink">{earned}</span>
        </span>
        <input type="range" min={0} max={400} step={10} value={earned} onChange={(e) => setEarned(Number(e.target.value))} className="mt-1 w-full accent-[#533afd]" aria-label="사업이 지금까지 번 돈" />
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
      <p className="mt-2.5 type-body-md font-semibold text-ink [word-break:keep-all]">{done ? "100을 다 돌려받았어요. 이제부터 번 돈은 미국 90%, 한국 10%로 나뉘어요." : `아직 다 못 돌려받아서 반반씩 나눠요. 앞으로 ${100 - korea}만큼 더 받아야 해요.`}</p>
    </Card>
  );
}

function UsChapter() {
  return (
    <div className="space-y-4">
      <P>
        시작은 관세예요. 2025년 7월 30일 한국과 미국은 관세 협상을 타결했어요. 미국은 <W k="상호관세" />를 25%에서 15%로 낮추고 자동차 관세도 15%로 맞춰 주기로 했고, 한국은 그 대가로 미국에 3,500억 달러를 투자하기로 했어요. 원화로 약 465조 원(10월 보도 환산)이에요.
      </P>
      <P>이 돈을 한 번에 보내는 건 아니에요. 성격이 다른 두 덩어리로 나뉘어요.</P>
      <div className="flex h-12 gap-0.5 overflow-hidden rounded-xl" role="img" aria-label="전략투자 2,000억 달러, 조선협력 1,500억 달러">
        <div className="flex items-center justify-center bg-brand-dark type-caption font-bold text-on-primary" style={{ width: `${(2000 / 3500) * 100}%` }}>
          전략투자 2,000억
        </div>
        <div className="flex items-center justify-center bg-primary type-caption font-bold text-on-primary" style={{ width: `${(1500 / 3500) * 100}%` }}>
          조선협력 1,500억
        </div>
      </div>
      <P>전략투자 2,000억 달러는 미국 대통령이 고른 발전소·원전 같은 사업에 실제로 돈을 넣는 부분이에요. 다만 한 해에 200억 달러까지만 보내요. 달러가 한꺼번에 빠져나가 환율이 흔들리는 걸 막으려고 한도를 둔 거예요.</P>
      <P>
        조선협력 1,500억 달러는 미국 조선업을 되살리는 데 쓰여요. 한국 조선사가 투자하고, 정책금융기관이 <W k="보증" />과 <W k="선박금융" />으로 받쳐 주는 구조예요. 그래서 여기서 번 수익은 전부 한국 기업 몫이에요. 이 협력에는 ‘미국 조선업을 다시 위대하게’라는 뜻의 마스가(MASGA)라는 이름이 붙었어요.
      </P>
      <P>이 큰일을 맡으려고 나라가 회사를 하나 새로 만들었어요. 2026년 6월 출범한 한미전략투자공사(공사)예요. 미국 사업에만 투자하는 전담 펀드 회사라고 생각하면 돼요. 자본금 2조 원은 정부가 나눠서 내고, 20년 동안만 운영해요.</P>

      <Sub>첫 24억 달러는 어떤 길로 갔을까?</Sub>
      <P>10월 1일 드디어 첫 돈이 나갔어요. 10월 6일 국감에서 임이자 의원이 “10월 1일 24억 달러가 송금됐느냐”고 물었고, 이형일 부총리가 “네”라고 답하면서 정부가 처음 공식 확인했어요. 그 돈이 간 길을 따라가 볼게요.</P>
      <Path
        title="돈의 길: 대미투자 1호 사업"
        steps={[
          {
            name: "돈이 나오는 곳: 나라의 달러 자산",
            text: (
              <>
                첫 송금은 한국은행과 <W k="외국환평형기금" />의 외화자산에서 나왔어요. 정부는 <W k="외환보유액" />을 굴려 번 수익을 먼저 쓰겠다고 해요. 모자라면 공사가 <W k="채권" />을 찍어 마련할 수 있는데, 정부가 보증을 서려면 국회 동의가 필요해요.
              </>
            ),
          },
          { name: "돈을 보내는 곳: 한미전략투자공사", text: "공사가 기금을 굴리며 돈을 보내요. 어떤 사업에 넣을지는 미국 대통령이 고르고, 우리 쪽은 산업통상부 위원회가 검토한 뒤 재정경제부 운영위원회가 최종 의결해요." },
          {
            name: "거쳐 가는 곳: 미국 측 투자 법인",
            text: (
              <>
                돈은 발전소로 바로 가지 않아요. 먼저 상위 법인인 I-SPV에 들어갔다가 사업별 법인인 P-SPV로 내려가요. <W k="SPV" />는 사업을 맡으려고 만든 서류상 회사예요. 여러 사업을 묶어 한 사업의 손실을 다른 사업 수익으로 메우는 <W k="리스크풀링">리스크 풀링</W> 장치도 있어요.
              </>
            ),
          },
          {
            name: "도착하는 곳: 텍사스 가스발전소",
            text: (
              <>
                1호 사업 ‘프로젝트 스타’예요. 텍사스 엔시날에 약 6.4GW 규모로 AI 데이터센터용 가스발전소를 지어요. 총사업비 223억 달러를 한국이 다 내는 건 아니고, 나머지는 미국 사업자 출자와 <W k="프로젝트파이낸싱" />으로 채워요. 2029년 1단계 가동이 목표예요.
              </>
            ),
          },
        ]}
      />
      <Photo k="gas" caption="엔시날 발전소는 아직 없어요. 사진은 같은 텍사스주 오스틴의 가스발전소예요. 대략 이런 시설을 떠올리면 돼요." />

      <Sub>이 돈은 무엇을 믿고 보낼까?</Sub>
      <P>
        이 돈은 그냥 주는 게 아니라 돌려받는 걸 전제로 한 투자예요. 그 기준을 ‘상업적 합리성’이라고 불러요. 말은 어렵지만 뜻은 단순해요. 사업이 이어지는 동안 한국에 돌아올 돈으로 넣은 돈과 이자를 다 갚을 수 있으면 합격이에요. 이자는 미국 20년 <W k="국채" /> 금리에 <W k="가산금리" />를 더해 계산해요.
      </P>
      <P>1호 사업의 경우 정부는 20년 동안 430억~454억 달러를 회수할 수 있다고 봐요. 기준을 못 넘는데도 안보나 공급망 때문에 꼭 해야 한다면 국회 상임위원회의 사전 동의를 받아야 해요.</P>
      <P>
        수익을 나누는 방식도 알아 두세요. 한국이 <W k="원리금" />을 다 돌려받을 때까지는 한국과 미국이 반반씩 나눠요. 다 돌려받은 뒤에는 미국이 90%, 한국이 10%를 가져가요. 손실이 나면 공사 적립금으로 먼저 메우고, 모자라면 정부가 메워요.
      </P>
      <ShareSim />

      <Sub>그럼 수은은 뭘 할까?</Sub>
      <P>여기서 가장 많이 틀려요. 돈을 보내는 곳은 수은이 아니라 공사예요. 수은은 주인공이 아니고, 옆에서 세 가지 역할을 해요.</P>
      <P>
        <b>일을 맡아 줄 수 있는 후보예요.</b> 공사는 사람이 적어요. 정원 50명 가운데 10월 국감 때 일하던 사람은 32명이었어요. 시행령은 공사가 일부 업무를 맡길 수 있는 기관으로 수은·산업은행·무역보험공사·한국투자공사·해양진흥공사·한국해외인프라도시개발지원공사 여섯 곳을 적어 뒀어요.
      </P>
      <P>
        <b>채권 절차의 본보기예요.</b> 공사가 찍을 채권은 수은이 돈을 마련할 때 찍는 수출입금융채권의 발행 절차를 그대로 따라요.
      </P>
      <P>
        <b>조선 협력 모임의 총무예요.</b> 6월 25일 여의도 수은에서 공사, 정책금융기관, 조선 3사가 협의체를 만들었어요. 간사를 맡은 수은이 “대내외 소통과 사업 추진 현황 등을 관리”해요. 수은이 조선사를 돕는 도구로는 선박금융과 <W k="RG" />가 있어요.
      </P>
      <Say face who="황기연 행장(일러스트)" where="6월 25일 협약식">
        “수은은 우리나라 대표 선박금융기관으로서 그간 축적된 전문성과 노하우를 바탕으로 정부의 한미 조선협력투자 이행을 적극적으로 뒷받침할 것”
      </Say>
      <Photo k="philly" caption="2012년의 애커 필라델피아 조선소예요. 2024년 한화가 인수한 지금의 한화 필리조선소예요. 뱃머리 스마일은 합성이 아니에요." />

      <Sub>국감에서는 뭐가 논쟁이었을까?</Sub>
      <Issue title="공사가 이 큰일을 감당할 수 있나?">
        <p>10월 20일 공사의 첫 국감에서 가장 많이 나온 걱정이에요. 사람이 정원보다 적은 데다, 투자를 책임질 전략투자본부장은 임명 두 달 만에 물러났어요. 이종욱 의원(국민의힘)은 위험을 점검하는 리스크관리위원회가 돈을 보낸 뒤에야 처음 열렸다고 따졌어요. “투자 사업 선정이 제일 큰 리스크 아니냐”는 거예요.</p>
        <p>박수영 의원(국민의힘)은 “수출입은행이나 한국투자공사(KIC)에 맡기는 편이 나았을 것”이라고까지 말했어요. 박종원 사장은 법률전문가를 계속 뽑고 대형 법률자문사도 쓰겠다고 답했어요. 11월 2일에는 투자이사가 새로 임명됐어요.</p>
        <Note>수은 준비생이라면 한 걸음 더 가 보세요. 공사 일손이 모자라면 그 일이 수은으로 넘어올까요? 아직 정해진 건 없지만 논술에서 짚을 만한 질문이에요.</Note>
      </Issue>
      <Issue title="정말 돈이 되는 사업인가?">
        <p>
          발전소가 돈을 벌려면 전기를 사 줄 곳이 있어야 해요. 그 약속이 <W k="PPA" />인데 아직 맺지 못했어요. 산업부는 2027년 체결을 추진해요. 임이자 의원(국민의힘)은 수요처가 불확실한데 사업성을 어떻게 계산했냐고 물었어요.
        </p>
        <p>이형일 부총리는 상업적 합리성이 “충족됐다고 본다”고 답했어요. 박종원 사장은 텍사스의 전력 가격과 수요를 가정하면 “합리적인 범위”라고 했고요.</p>
        <Note>
          20년 뒤의 1달러는 오늘의 1달러보다 가치가 작아요. 그래서 20년 합계 430억 달러를 지금 넣는 돈과 바로 비교하면 안 돼요. 이렇게 미래 돈을 오늘 가치로 깎아서 비교하는 계산이 <W k="NPV" />예요.
        </Note>
      </Issue>
      <Issue title="달러가 빠져나가면 환율이 오르지 않을까?">
        <p>
          달러가 해외로 나가면 시장에 달러가 귀해져 환율이 오를 수 있어요. 한국투자증권 최지욱 연구원은 매년 200억 달러가 더 나간다고 단순하게 가정하면 <W k="균형환율" />이 20~25원 오를 압력이 생긴다고 봤어요.
        </p>
        <p>정부의 답은 시장에서 달러를 사지 않겠다는 거예요. 구윤철 당시 부총리는 “환전이 아니라 외화자산 운용수익 정도로 집행”하겠다고 했어요. 신현송 한국은행 총재도 8월에 연 200억 달러는 “충분히 감당할 수 있는 수준”이라고 했어요.</p>
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
        <Note>실제로 환율은 6월 이후 내려왔어요. 다만 반도체 기업들이 번 달러를 원화로 바꾼 영향도 있어요. 그래서 ‘환율이 내렸으니 문제없다’고 쓰면 반쪽이에요. 후속 사업이 겹치는 내년 이후까지 같이 봐야 해요.</Note>
      </Issue>
      <Issue title="수은의 돈이 몇몇 회사에 몰려 있지 않나?">
        <p>
          안도걸 의원(민주당)이 수은에 던진 질문이에요. 수은 <W k="여신" /> 상위 5개 회사가 받은 돈은 20조 6,370억 원이에요. 수은의 <W k="자기자본" />과 견주면 87.5%나 되고, 전체 여신의 13.3%예요. 국회예산정책처 자료로 2024년 말 기준이에요. 그중 한 회사가 어려워지면 수은 전체가 크게 흔들릴 수 있다는 걱정이에요.
        </p>
        <Bars
          title="수은 여신 상위 5개사"
          unit="조 원, 2024년 말"
          max={8.8}
          rows={[
            { k: "한화오션", v: 8.8, show: "8.80" },
            { k: "삼성중공업", v: 4.057, show: "4.06" },
            { k: "HD현대중공업", v: 3.65, show: "3.65" },
            { k: "HD현대삼호", v: 2.207, show: "2.21" },
            { k: "한화에어로스페이스", v: 1.923, show: "1.92" },
          ]}
        />
        <Say who="황기연 행장" where="10월 20일 국감">
          “전체 여신에 대한 <W k="스트레스테스트">스트레스 테스트</W>를 실시하고 있고 개별 기업에 대해서도 최선과 최악의 상황을 가정한 위험 평가를 하고 있다”
        </Say>
        <Note>조선 4사에 방산 회사인 한화에어로스페이스가 더해진 숫자라 ‘조선 여신이 87.5%’라고 쓰면 틀려요. 여기에 조선협력의 보증과 선박금융까지 얹히면 쏠림이 더 커질 수 있어요. 수은이 이렇게 말한 건 아니고, 수은 자리에서 보이는 고민이에요.</Note>
      </Issue>
      <Issue title="미국은 무엇을 기대할까?">
        <p>7월 워싱턴에 한미 조선협력센터가 문을 열고 MOU 15건을 맺었는데, 러트닉 미국 상무장관의 말은 단호했어요. “얼마나 많은 양해각서(MOU)를 체결했는지”가 아니라 “함께 생산해 낸 미국 내 선박 숫자”로 평가하겠다는 거예요.</p>
        <p>
          6월에는 트럼프 대통령이 G7에서 군함 10척을 빠르게 건조할 수 있느냐고 물었다고 이재명 대통령이 공개했어요. 다만 미국 법(번스-톨레프슨 규정)은 미군 함정을 해외에서 짓는 걸 원칙적으로 막아요. 그래서 미국 현지 조선소와 함정 정비(<W k="MRO" />)가 먼저 거론돼요.
        </p>
      </Issue>
      <Watch
        items={[
          { when: "올해 말까지", text: "미국이 요청하면 원전 8기 건설을 위한 선납금 100억 달러를 국내법 절차를 거쳐 보내기로 했어요. 실제 요청이 오는지 봐요." },
          { when: "검토 중", text: "알래스카 LNG 사업(프로젝트 노스)이 3호 사업이 될지 봐요." },
          { when: "2027년", text: "공사의 첫 달러 채권(최대 20억 달러 검토 보도)과 텍사스 PPA 체결을 봐요." },
          { when: "시기 미정", text: "미국의 301조 조사 결과와, 동맹국의 함정 건조를 여는 미 의회 법안을 봐요." },
        ]}
      />
      <EssayBox
        qs={["대미투자 패키지의 구조와 정책금융기관의 역할", "해외투자의 ‘상업적 합리성’을 판단하는 기준", "대규모 해외투자가 환율에 미치는 영향과 정책 대응"]}
        intro="첫 번째 문제라면 이 순서로 써 보세요"
        frame={[
          { step: "무엇인지", text: "관세 협상의 대가로 약속한 3,500억 달러가 전략투자 2,000억과 조선협력 1,500억으로 나뉜다고 정의해요." },
          { step: "돈의 길", text: "기금과 공사, 미국 측 투자 법인을 거쳐 사업으로 가는 흐름을 그려요." },
          { step: "수은의 자리", text: "집행자가 아니라 위탁 후보, 채권 절차의 본보기, 조선 협의체 간사라고 정확히 적어요." },
          { step: "위험과 장치", text: "공사 역량, 환율, 여신 쏠림을 짚고, 연 200억 달러 한도 같은 안전장치와 그 한계를 함께 써요." },
        ]}
      />
      <Remember>돈은 공사가 보내고, 수은은 옆에서 돕는다. 그래도 조선협력의 부담은 수은으로 올 수 있다.</Remember>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 2. 방산금융                                                           */
/* ------------------------------------------------------------------ */

function DefenseChapter() {
  return (
    <div className="space-y-4">
      <P>폴란드는 한국에서 K2 전차를 사들이고 있어요. 값이 조 단위라 나라 예산으로 한 번에 내기가 어려워요. 그래서 무기를 파는 쪽이 “돈은 우리가 빌려줄 테니 오래 나눠 갚으세요”까지 같이 제안해야 계약이 성사돼요. 자동차를 할부 없이 팔기 어려운 것과 같아요.</P>
      <P>
        이렇게 사는 쪽에 돈을 빌려주는 걸 <W k="구매자금융" />이라고 해요. 수은과 무역보험공사(무보)가 2020년부터 2026년 7월까지 집행한 구매자금융은 59조 834억 원이에요. 경쟁국 독일은 정부가 직접 계약 주체로 나서며 큰 규모의 보증을 붙이기도 해요.
      </P>

      <Sub>왜 은행 자본금이 수출을 막을까?</Sub>
      <P>
        문제는 수은이 한 곳에 빌려줄 수 있는 돈에 천장이 있다는 거예요. 한 곳에 너무 많이 빌려줬다가 그곳이 못 갚으면 은행까지 위험해지니까요. 이 천장을 <W k="동일인한도">동일인 한도</W>라고 해요. 은행법은 자기자본의 20%까지, 수은법은 40%까지 허용하고, 대출과 보증을 합쳐서 따져요.
      </P>
      <P>쉽게 계산해 볼게요. 자기자본이 약 25조 원이면 한 사업에 빌려줄 수 있는 돈은 최대 10조 원이에요. 자본이 작으면 그만큼 큰 계약을 못 돕는 거예요. 은행 자본금과 탱크 수출이 연결되는 이유예요.</P>
      <P>폴란드에서 바로 이 천장에 닿았어요. 폴란드 사업은 전체 440억 달러 규모로 불리고, 2022년 1차 실행계약만 약 17조 원이었어요. 수은이 약 6조 원을 빌려주고 나자, 2024년 2월에는 더 빌려줄 여유가 1조 3,600억 원뿐이라는 보도가 나왔어요. 당시 한도는 자기자본 약 18.4조 원의 40%인 7조 3,600억 원이었어요.</P>
      <Photo k="k2" caption="폴란드군의 K2 전차예요(2023년). 2차 계약은 8조 9,814억 원이에요. 남은 한도와 견주면 수은 혼자 대기 어려운 크기예요." />

      <Sub>그래서 2차 계약은 돈을 어떻게 모았을까?</Sub>
      <P>한 곳이 다 대지 않고, 여러 곳이 나눠 맡았어요. 수은이 돈을 빌려주고, 무보는 못 받을 위험을 보험으로 받쳐 주는 식이에요.</P>
      <Path
        title="돈의 길: K2 2차 계약"
        steps={[
          { name: "돈을 빌려주는 곳: 수은과 은행들", text: "수은의 13억 유로 규모 방산 수출금융에는 하나은행 대출 3억 유로가 들어 있어요. 스페인계 산탄데르 은행 두 곳도 함께해요. 수은이 혼자 부담한 금액은 공개되지 않았어요." },
          {
            name: "위험을 받쳐 주는 곳: 무보와 수은",
            text: (
              <>
                무보와 수은의 보증과 <W k="수출보험">보험</W>을 묶었어요. 못 받으면 대신 물어 주겠다는 약속이 있으니 글로벌 은행도 돈을 낼 수 있어요.
              </>
            ),
          },
          {
            name: "돈을 빌리는 곳: 폴란드 국책은행 BGK",
            text: (
              <>
                2025년 말 금융계약을 맺었어요. 만기는 17년으로 통상 10년보다 크게 늘렸어요. 믿는 건 폴란드 정부의 신용이고, 그 나라 사정으로 못 받을 위험을 <W k="국가위험" />이라고 해요.
              </>
            ),
          },
          {
            name: "돈이 도착하는 곳: 현대로템",
            text: (
              <>
                계약액의 약 30%인 21억 달러가 <W k="선수금" />으로 들어왔다고 1월에 보도됐어요. 나머지는 전차를 넘기면서 받아요.
              </>
            ),
          },
        ]}
      />
      <Bars
        title="수은 2025년 여신 가운데 업종 비중"
        unit="%"
        max={19.3}
        rows={[
          { k: "선박", v: 19.3 },
          { k: "건설플랜트", v: 11.1 },
          { k: "자동차", v: 9.9 },
          { k: "전기전자", v: 9.9 },
          { k: "방산", v: 4.7 },
        ]}
        note="수은 자료 기준. 방산 비중은 작아요. 그런데도 한도가 문제인 건 한 건이 워낙 크기 때문이에요."
      />

      <Sub>이 천장을 어떻게 높일까?</Sub>
      <P>
        방법은 크게 세 가지예요. 먼저 밑천을 늘리는 거예요. 2024년 2월 29일 수은법을 고쳐 <W k="법정자본금" /> 상한을 15조 원에서 25조 원으로 올렸어요. 10년 만이었어요. 다만 상한을 올린 것이고, 실제 정부 출자는 2조 4,000억 원에 그쳤어요.
      </P>
      <P>다음은 K2 2차처럼 다른 은행과 함께 빌려주는 거예요. 수은의 부담을 나눌 수 있어요.</P>
      <P>
        마지막이 수은 장부 밖에 별도 주머니를 만드는 전략수출금융기금이에요. 정부 구상은 승인 기준 약 4조 원(대출 2조 + 보증 2조)이에요. 2027 예산안에는 기금 총계 1조 3,903억 원이 들어갔고, 그 대부분(1조 2,100억 원)이 <W k="기금채" />예요. 재정경제부는 운용을 수은에 맡기되 수은 계정과 구분하겠다고 설명했어요.
      </P>
      <Warn>
        “기금이 출범했다”고 쓰면 안 돼요. 법안 3건이 11월 4일 국회 <W k="소위" />에 올라갔을 뿐, 11월 6일 현재 의결 기록은 없어요.
      </Warn>

      <Sub>뭐가 논쟁일까?</Sub>
      <Issue title="혜택 본 기업이 돈을 내야 할까?">
        <p>
          기금 재원에는 금융 지원을 받은 수출 기업이 내는 <W k="기여금" />이 들어가요. 법안 상한은 집행액의 1%(수출산업협력은 5%)이고, 정부가 설명한 기본 요율은 0.5%예요. 이 돈을 두고 의견이 갈려 법안 처리가 늦어졌어요.
        </p>
        <p>찬성 쪽 문진석 의원(민주당)은 “기여금이 붙는 계약들은 정부가 위험을 떠안지 않았으면 애초에 성사되지 않았을 계약들”이라고 말해요. 나라가 위험을 떠안아 번 돈이니 일부를 돌려놓으라는 논리예요. 반대 쪽 한국방위산업진흥회 안상남 본부장은 5%를 의무화하면 비용이 겹쳐 중소·협력업체가 버티기 어렵다며 1%로 낮춰 달라고 했어요.</p>
        <p>안도걸 의원(민주당)은 절충안으로 “수익이 실현된 이후 일부를 환원하는 성과 공유형”을 냈어요. 박수영 의원 법안은 아예 기여금 없이 기금을 짜요.</p>
        <Note>찬성이나 반대 하나로 끝내지 말고 절충안까지 써 주세요. ‘언제, 누구에게, 얼마나’ 물릴지가 진짜 쟁점이에요.</Note>
      </Issue>
      <Issue title="자본금만 늘리면 해결될까?">
        <p>국회예산정책처는 “단순 법정 자본금 상향에 그칠 게 아니라 실효성 있는 신용위험 관리방안을 마련해야 한다”고 했어요. 윤영석 의원(국민의힘)은 전체 점검만으로는 부족하니 큰 대출은 사업별로 따로 스트레스 테스트를 하라고 요구했어요.</p>
        <Say who="황기연 행장" where="10월 20일 국감">
          “필요한 경우 별도의 집중 한도를 설정하는 등 다층적으로 리스크를 관리하고 있다”
        </Say>
        <Note>
          자본금을 늘리면 한도와 <W k="BIS비율">BIS 비율</W>에 여유가 생겨요. 하지만 한 업종에 쏠리는 문제까지 풀어 주진 않아요. 앞 장의 87.5%와 이어서 쓰면 좋아요.
        </Note>
      </Issue>
      <Issue title="기관끼리 겹치지 않을까?">
        <p>수은이 있고 무보가 있는데 기금까지 생기면 역할이 겹칠 수 있어요. 안도걸 의원은 “기존 수은의 일반 금융지원이나 한국무역보험공사의 지원과 어떻게 차별화할 것인지 구체적인 규정이 필요하다”고 했어요. 황기연 행장은 OECD 국가위험등급과 상환 방식을 세분화해 차별화 방안을 검토하겠다고 답했어요.</p>
      </Issue>
      <Say who="황기연 행장" where="10월 20일 국감">
        “합리적인 방안이 결정되면 수은이 기금의 목적에 맞게 적극적으로 움직이겠다”
      </Say>
      <P>수은은 방산 협력사도 챙기고 있어요. 8월에 대금결제 금융 1,200억 원을 지원했고, 10월 6일에는 한국방위산업진흥회와 협약을 맺었어요. 2월에는 방산·원전 같은 전략 수주에 5년간 100조 원을 지원하겠다고 밝혔어요. 수은은 한국항공우주산업(KAI) 지분 26.41%를 가진 최대주주이기도 해요. 황 행장은 국감에서 “현재 KAI 매각 계획이 없다”고 했어요.</P>
      <Note title="수은 자리에서 보면">
        <p>기금이 생겨도 수은이 할 일이 줄어드는 건 아니에요. 운용을 맡으면서 수은·무보·기금이 위험을 어떻게 나눌지가 핵심 과제가 돼요.</p>
      </Note>
      <Watch
        items={[
          { when: "국회 소위", text: "기금법 3건이 의결되는지, 기여금 요율이 얼마로 정해지는지 봐요." },
          { when: "예산 심의", text: "2027 기금 예산안 1조 3,903억 원이 그대로 통과되는지 봐요." },
          { when: "협의 중", text: "폴란드 K2 3차 계약의 수출금융 협의를 봐요. 캐나다 잠수함은 7월 독일 TKMS가 우선협상대상자가 돼서 한화오션은 예비 공급업체예요." },
        ]}
      />
      <EssayBox
        qs={["방산 수출에서 정책금융의 역할과 한계", "자본규제(동일인 한도·BIS 비율)가 정책금융에 미치는 영향", "수출금융 이익 환류(기여금) 찬반"]}
        intro="첫 번째 문제라면 이 순서로 써 보세요"
        frame={[
          { step: "왜 필요한가", text: "무기 수출은 사는 쪽이 정부이고 금액이 커서 구매자금융이 있어야 계약이 된다고 시작해요." },
          { step: "무엇이 막나", text: "수은법의 40% 한도와 폴란드 사례로 자본금이 곧 수출 여력이라는 걸 보여 줘요." },
          { step: "어떻게 푸나", text: "자본금 확충, 민간 은행과 함께 빌려주기, 기금 신설 세 가지를 비교해요." },
          { step: "대가는 무엇인가", text: "기여금 부담과 기관 중복, 한 업종 쏠림을 함께 적어요." },
        ]}
      />
      <Remember>한 건이 너무 커서 수은의 40% 천장에 닿았다. 자본금과 기금 논쟁은 여기서 시작된다.</Remember>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 3. 공급망기금                                                         */
/* ------------------------------------------------------------------ */

function SupplyChapter() {
  return (
    <div className="space-y-4">
      <P>2021년 요소수 대란을 떠올려 보세요. 경유 트럭에 넣는 요소수가 모자라 물류가 멈출 뻔했어요. 특정 나라에 기대던 품목 하나가 끊기자 벌어진 일이에요. 2019년 일본 수출규제 때도 비슷한 경험을 했고요.</P>
      <P>
        이런 일을 막으려면 수입처를 늘리고, 미리 쌓아 두고, 국내에서도 만들어야 해요. 문제는 평소엔 돈만 드는 보험 같다는 거예요. 게다가 한 회사가 돈을 들여 공급을 안정시켜도 이득은 산업 전체가 나눠 가져요. 이런 걸 <W k="외부효과" />라고 해요. 시장에 맡기면 다들 남이 먼저 하길 기다리니 나라가 돈을 대는 거예요.
      </P>
      <P>그래서 나온 법이 「경제안보를 위한 공급망 안정화 지원 기본법」이고, 2024년 9월 공급망안정화기금이 출범했어요. 법 제40조에 “기금은 한국수출입은행이 관리ㆍ운용한다.”고 적혀 있어요.</P>
      <Note title="수출은행이 왜 수입을 지킬까?">
        <p>수출하려면 원자재부터 들어와야 해요. 반도체 소재나 배터리 광물이 끊기면 수출도 멈춰요. 경제안보를 수출의 전제로 보면 이어져요.</p>
      </Note>

      <Sub>돈은 어떻게 돌까?</Sub>
      <Path
        title="돈의 길: 공급망안정화기금"
        steps={[
          {
            name: "돈을 마련해요",
            text: (
              <>
                중심은 정부가 보증한 <W k="기금채" />예요. 보증 한도는 2025년과 2026년 모두 10조 원이에요. 올해 4월에는 처음으로 외화 채권 5억 달러도 찍었어요. 2025년 12월 수은법이 바뀌어 수은도 돈을 <W k="출연" />할 수 있게 됐어요.
              </>
            ),
          },
          { name: "수은이 따로 굴려요", text: "수은이 관리하고 운용하되, 회계는 은행 장부와 구분해요. 감독은 재정경제부 장관이 해요." },
          {
            name: "기업과 펀드로 가요",
            text: (
              <>
                대출·보증·<W k="출자" />로 지원해요. 중심 대상은 정부가 지정한 <W k="선도사업자" /> 216곳이에요. <W k="핵심광물" />·에너지 펀드에는 기금이 1,000억 원을 넣어 2,500억 원을 모으는 구조도 있어요.
              </>
            ),
          },
        ]}
      />
      <Photo k="lithium" caption="위성에서 본 칠레 아타카마 소금사막이에요. 파란 사각형이 리튬을 얻는 증발못이에요. 기금의 핵심광물 지원은 약 2조 5,500억 원이에요." />

      <Sub>지금까지 성적표는 어떨까?</Sub>
      <P>
        <W k="승인" /> 금액은 빠르게 늘었어요. 2024년 2.1조 원, 2025년 7.1조 원, 올해는 9월까지 8.1조 원이에요. 누적 17조 3,569억 원인데, 어디로 갔는지 보면 논쟁의 이유가 보여요.
      </P>
      <Bars
        title="누적 승인액 (2024년~2026년 9월)"
        unit="조 원"
        max={15.33}
        rows={[
          { k: "대기업 (75건)", v: 15.327, show: "15.33" },
          { k: "중견기업 (37건)", v: 1.371, show: "1.37" },
          { k: "기타·펀드 (6건)", v: 0.346, show: "0.35" },
          { k: "중소기업 (35건)", v: 0.314, show: "0.31" },
        ]}
      />
      <Warn>기사에 88%와 91%가 함께 보여도 같은 통계예요. 대기업 비중이 누적으로는 88%, 올해 1~9월만 자르면 91%예요.</Warn>

      <Sub>뭐가 논쟁일까?</Sub>
      <Issue title="대기업 쏠림, 문제일까 구조일까?">
        <p>누적 승인의 88%가 대기업으로 갔고 중소기업은 1.8%예요. 김태년 의원(민주당)은 중소 선도사업자 95곳이 선도사업자 지원액의 3.1%만 받았고, 3곳 중 2곳은 아예 못 받았다고 추정했어요.</p>
        <p>재정경제부의 반론은 품목의 크기예요. 원유 같은 품목은 한 건에 드는 돈이 커서 금액으로는 대기업 비중이 높다는 거예요. 건수로 보면 대기업 51%, 중견 25%, 중소 24%예요. 황기연 행장은 중소기업 지원의 금액 비중이 작다는 걸 인정하며 “금융 상품 개발과 마케팅 등을 연구하겠다”고 답했어요.</p>
        <Note>둘 중 하나만 쓰면 반쪽이에요. 품목 때문에 생기는 구조도 있지만, 중소·중견기업용 500억 원 특별한도를 28.8%만 썼다는 건 개선할 여지가 있다는 뜻이에요.</Note>
      </Issue>
      <Issue title="돈을 쓴 만큼 의존도가 내려갔을까?">
        <p>이 기금의 진짜 목표는 특정 나라에 덜 기대는 거예요. 정태호 의원(민주당)에 따르면 특정국 의존도는 2024년 70.4%에서 올해 65.5%로 내려왔어요. 정부 목표는 2030년 50% 이하예요.</p>
        <Note>‘얼마를 썼나’보다 ‘의존도가 얼마나 내려갔나’가 성적표예요. 논술에서 성과 지표를 바꾸자고 제안할 때 쓰기 좋은 숫자예요.</Note>
      </Issue>
      <Issue title="다른 기금과 겹치지 않을까?">
        <p>정부는 2027년 1조 4,000억 원 규모의 자원안보기금을 새로 만들려고 해요. 안도걸 의원은 공급망기금과 겹친다고 지적했어요. 정태호 의원은 지원의 약 30%가 첨단전략산업으로 가서 산업은행 기금과도 겹칠 수 있다고 봤어요.</p>
        <Say who="황기연 행장" where="10월 20일 국감">
          “경제 안보 품목을 담당하는 공급망기금과 핵심 에너지를 담당하는 자원안보기금이 일부 중첩될 수 있다는 점에 공감한다”
        </Say>
      </Issue>
      <Issue title="대출에만 쏠린 건 아닐까?">
        <p>
          김상훈 의원(국민의힘)에 따르면 핵심광물 지원의 74%가 구매자금 대출이고, 지분 투자용 대출과 펀드 출자는 집행 실적이 없어요. 광물을 당장 사는 돈은 대도, 광산에 투자하는 돈은 아직 안 나갔다는 뜻이에요. 안도걸 의원은 펀드 쪽 위험도 물었어요. 수은이 넣는 펀드가 <W k="블라인드펀드" />라 전체 위험을 놓칠 수 있다는 거예요.
        </p>
        <Say who="황기연 행장" where="10월 20일 국감">
          “다층적인 리스크 관리를 통해 펀드에서 손실이 발생하지 않도록 철저히 관리·감독하겠다”
        </Say>
      </Issue>
      <Note title="수은 자리에서 보면">
        <p>기금은 경제안보 품목을 다루는 기업에 가는데, 큰돈이 드는 품목은 대기업이 많이 다뤄요. 쏠림은 기금 목적의 결과이기도 해요. 수은이 이렇게 말한 건 아니에요.</p>
        <p>수은이 직접 돈을 넣게 되면 운용자에 더해 자금을 대는 역할까지 맡게 돼요.</p>
      </Note>
      <Watch
        items={[
          { when: "검토 중", text: "고려아연의 미국 테네시 제련소(약 74억 달러)에 기금을 지원할지 봐요. 10월 20일 국감에서 황 행장은 “최근 그 부분에 대해 협의하고 있다”고 했어요." },
          { when: "연말 계획", text: "미주개발은행(IDB)과의 공급망 협력, 호주·캐나다 데스크 신설을 봐요." },
          { when: "예산 심의", text: "자원안보기금이 생기는지, 역할을 어떻게 나누는지 봐요." },
        ]}
      />
      <EssayBox
        qs={["공급망 리스크의 경제학적 성격과 정책금융 개입의 정당성", "정책기금의 대기업 쏠림, 문제인가 구조인가", "블라인드펀드 출자의 장단점"]}
        intro="첫 번째 문제라면 이 순서로 써 보세요"
        frame={[
          { step: "왜 시장이 못 하나", text: "공급 안정의 이득은 산업 전체가 누리는 외부효과라 민간 투자가 모자란다고 시작해요." },
          { step: "무엇을 했나", text: "정부 보증 채권으로 돈을 마련해 수은이 운용하고, 선도사업자를 지원하는 구조를 적어요." },
          { step: "한계는", text: "대기업 쏠림, 다른 기금과의 중복, 대출 편중을 숫자로 짚어요." },
          { step: "어떻게 고칠까", text: "중소기업 트랙과 특정국 의존도를 성과 지표로 삼는 방안을 제안해요." },
        ]}
      />
      <Remember>끊기면 공장이 서는 품목을 지키는 돈. 얼마 썼나보다 의존도가 내려갔나를 본다.</Remember>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 4. EDCF                                                              */
/* ------------------------------------------------------------------ */

function EdcfChapter() {
  return (
    <div className="space-y-4">
      <P>원조에는 두 가지가 있어요. 그냥 주는 무상원조와, 나중에 갚는 조건으로 빌려주는 유상원조예요. 유상원조는 재정경제부 장관이, 무상원조는 외교부 장관이 주관해요. 유상원조에 쓰는 돈이 대외경제협력기금, 줄여서 EDCF예요. 1987년에 만들어졌어요.</P>
      <Card>
        <p className="type-heading-sm text-ink">무상원조와 유상원조, 뭐가 다를까?</p>
        <div className="mt-3 overflow-hidden rounded-xl border border-hairline">
          <table className="w-full table-fixed border-collapse text-left">
            <thead className="bg-canvas-soft type-caption text-ink-secondary">
              <tr>
                <th className="w-[24%] px-2.5 py-2 font-semibold" />
                <th className="px-2.5 py-2 font-semibold">무상원조</th>
                <th className="px-2.5 py-2 font-semibold">유상원조 (EDCF)</th>
              </tr>
            </thead>
            <tbody className="type-caption text-ink [word-break:keep-all]">
              {[
                ["돈의 모양", "그냥 줘요", "싸게 오래 빌려줘요"],
                ["주관", "외교부 장관", "재정경제부 장관"],
                ["실무", "KOICA 등", "수출입은행"],
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

      <Sub>왜 그냥 주지 않고 빌려줄까?</Sub>
      <P>
        큰 다리나 발전소를 모두 그냥 지어 주기엔 돈이 모자라요. 또 갚아야 할 돈이면 상대 나라도 사업을 더 신중하게 고르게 돼요. 대신 조건은 시장보다 훨씬 좋아요. 금리는 0.01~2.5%(4월 보도 기준), 상환 기간은 최장 40년이에요. 이런 차관을 <W k="양허성차관">양허성 차관</W>이라고 해요. 법도 EDCF를 일반 조건으로 돈을 빌리기 어려운 경우로 한정해요.
      </P>
      <Note>
        <p>반대로 보건이나 교육처럼 돈을 벌어 갚기 어려운 분야는 그냥 주는 쪽이 더 맞아요. 그래서 한국은 둘 다 해요. 논술에서 비교할 때 이 구분이 핵심이에요.</p>
      </Note>

      <Sub>돈은 어떻게 흐를까?</Sub>
      <Path
        title="돈의 길: EDCF"
        steps={[
          {
            name: "나랏돈이 들어와요",
            text: (
              <>
                정부 출연금과 <W k="공공자금관리기금" /> 예수금, 운용 수익이 재원이에요. 수은 자기 돈이 아니에요. 2027 예산안의 EDCF는 1조 9,000억 원이에요.
              </>
            ),
          },
          { name: "재정경제부 장관이 방침을 정해요", text: "법 제9조에 “기금은 재정경제부장관이 운용·관리한다.”고 적혀 있어요. 큰 사업은 운용위원회 심의를 거쳐요." },
          { name: "수은이 실무를 맡아요", text: "사무를 위탁받아 사업을 심사하고, 상대 나라와 계약을 맺고, 돈을 내주고, 사후관리까지 해요. 그래서 수은에 EDCF 직군이 따로 있어요. 하반기 공고로 경영 5명, 경제 5명을 뽑아요." },
          {
            name: "개발도상국이 빌려 사업을 해요",
            text: "상대 나라 정부가 돈을 빌리고, 입찰로 시공사를 뽑아 사업을 진행해요. 믿는 건 그 나라의 신용과, 이 사업이 정말 도움이 되는지에 대한 평가예요.",
          },
        ]}
      />
      <Warn>“수은이 EDCF를 승인한다”고 쓰면 틀려요. 방침을 정하는 건 재정경제부 장관이고, 수은은 위탁받은 실무를 해요.</Warn>
      <Photo k="bridge" caption="캄보디아의 강 위에 놓이던 다리예요(2013년). EDCF 사업으로 확인된 사진은 아니지만, 유상원조가 대는 인프라가 대략 이런 규모예요." />

      <Sub>규모는 어느 정도일까?</Sub>
      <P>
        2025년 말까지 60개국 545개 사업에 약 40조 6,029억 원을 <W k="승인" />했어요. 2025년에 실제로 나간 돈은 37개국 156개 사업에 1.9조 원이고, 사업에 참여한 우리 기업이 따낸 해외 계약은 3.6조 원이에요.
      </P>
      <P>앞으로는 조금 줄여요. 2026~28년 신규 승인 계획은 9조 원(연평균 3조 원)으로, 직전 계획의 14.1조 원보다 작아요. 11월 4일에는 EDCF 첫 AI 사업인 탄자니아 1.7억 달러 계약을 맺었어요.</P>

      <Sub>뭐가 논쟁일까?</Sub>
      <Issue title="사업 평가를 제대로 했을까?">
        <p>임이자 의원(국민의힘)은 평가보고서 16건에 외부 용역비 12억 7,300만 원을 썼는데 7건을 한 기관이 맡았다고 지적했어요. 베트남 도로 사업 보고서에는 구간이 달라도 비슷한 문장이 반복됐대요. 케냐·모잠비크·우간다 사업은 기자재를 확인하기 어렵다면서도 만점을 줬다는 거예요.</p>
        <Say who="황기연 행장" where="10월 20일 국감">
          “평가 품질이 낮거나 용역이 제대로 수행되지 않은 기관은 향후 입찰 참여를 제한하겠다”
        </Say>
        <Note>EDCF는 개발효과를 믿고 빌려주는 돈이에요. 그래서 평가가 무너지면 빌려준 근거가 같이 무너져요. 이 쟁점이 무거운 이유예요.</Note>
      </Issue>
      <Issue title="공사를 통째로 넘기는 일이 있을까?">
        <p>
          윤영석 의원(국민의힘)은 국내 업체가 공사를 따서 현지 업체에 넘기는 <W k="일괄하청" />을 지적했어요. 금지돼 있는데도 최근 5년 제재가 0건이라는 거예요. 황기연 행장은 보고받은 일이 없다면서, 규정을 어기고 숨긴 사실이 확인되면 “사기나 범죄의 영역에 해당할 수 있다”고 답했어요.
        </p>
      </Issue>
      <Issue title="중소기업은 왜 밀려났을까?">
        <p>
          안도걸 의원(민주당)은 2025년 국감에서 입찰 규모가 3,000억 원(2020년)에서 3.4조 원(2025년)으로 커지는 동안 중소기업 비중이 58%에서 2%로 줄었다고 짚었어요. 그래서 <W k="소액차관" /> 기준을 700만 달러에서 2,000만 달러로 올리자고 제안했어요.
        </p>
        <Note>사업이 커지면 큰 회사 몫이 되기 쉬운 구조예요. 소액차관 승인이 5년간 2건뿐이었다는 점까지 쓰면, 기준뿐 아니라 왜 안 쓰였는지까지 짚을 수 있어요.</Note>
      </Issue>
      <Issue title="승인한 만큼 돈이 나가고 있을까?">
        <p>임이자 의원에 따르면 2021년부터 2026년 8월까지 승인한 사업은 97건 17조 9,447억 원인데, 이 사업들에서 실제로 나간 돈은 약 3조 530억 원이에요. 구윤철 당시 부총리는 4월에 오래 지연된 사업은 승인을 취소하는 등 정리하겠다고 했어요.</p>
        <Note>다리나 발전소는 승인 뒤 실제 돈이 나가기까지 원래 오래 걸려요. 숫자만 보고 ‘안 쓰고 있다’고 쓰기보다 이 시차를 함께 적어 주세요.</Note>
      </Issue>
      <Issue title="원조일까, 우리 기업 지원일까?">
        <p>
          EDCF에는 우리 기업이 공사를 맡는 조건을 붙이는 <W k="구속성차관">구속성 차관</W>이 있어요. 빌려주되 우리 가게에서 사게 하는 셈이에요. 국제사회는 이런 조건을 줄이라는 쪽이에요. OECD 개발원조위원회는 비구속을 권고하고, 2024년 동료평가에 따르면 2021년 한국의 구속 비중은 34%로 평균 19%보다 높아요.
        </p>
        <p>반면 재정경제부는 주요 공여국들이 원조와 경제·안보 이익을 더 연결하고 있다고 설명해요. 이번 탄자니아 사업도 구속성 차관이에요.</p>
        <Note>반론 숫자도 있어요. 2019~21년 한국 기업이 따낸 원조 계약 금액의 87.3%는 다른 나라가 낸 돈이었어요. 묶지 않아도 경쟁할 수 있다는 근거예요. 찬반을 한 문장씩 쓰고 이 숫자를 붙이면 좋아요.</Note>
      </Issue>
      <Say who="황기연 행장" where="6월 10일 EDCF 혁신전략 보고회 (헤럴드경제)">
        “투명성과 공정성을 EDCF의 새로운 기준으로 삼아, 국민이 믿고 맡길 수 있는 기금으로 거듭나겠다”
      </Say>
      <P>이 말이 나온 배경도 알아 두세요. 2025년 국감에서 캄보디아 약정 한도가 7억 달러에서 30억 달러로 늘어난 일이 논란이 됐고, 두 달 뒤 정부가 제도 개선안을 냈어요. 누가 결정했는지 이름을 남기는 정책실명제, 결정 과정을 기록하는 사업이력제, 내부신고제가 그때 나왔어요.</P>
      <Note title="수은 자리에서 보면">
        <p>EDCF는 원조와 수출 지원이라는 두 목적을 함께 가진 돈이에요. 국제사회는 원조답게 하라고 하고, 국내에서는 우리 기업에 뭐가 돌아오냐고 물어요. 수은은 그 사이에 서 있어요.</p>
      </Note>
      <Watch
        items={[
          { when: "예산 심의", text: "2027 EDCF 예산안 1조 9,000억 원의 처리를 봐요." },
          { when: "첫 공개", text: "심사보고서 게시판에 첫 사업이 올라오는지 봐요. 11월 6일 기준 0건이에요." },
          { when: "미정", text: "소액차관 기준을 바꾸는지, 부실 평가 기관을 실제로 제재하는지 봐요." },
        ]}
      />
      <EssayBox
        qs={["유상원조와 무상원조 비교, 각각의 장단점", "원조의 국익 연계(구속·비구속) 찬반", "원조 효과성을 높이는 제도 설계"]}
        intro="첫 번째 문제라면 이 순서로 써 보세요"
        frame={[
          { step: "무엇인지", text: "유상은 시장보다 유리한 금리와 기간으로 빌려주는 양허성 차관, 무상은 증여라고 정의해요." },
          { step: "유상의 장점", text: "갚는 돈이라 더 큰 규모를 지원할 수 있고, 상대국의 책임감도 생긴다고 써요." },
          { step: "무상이 나은 곳", text: "보건과 교육처럼 수익으로 갚기 어려운 분야를 들어요." },
          { step: "한국의 선택", text: "두 수단을 함께 쓰고, 수은은 유상을 위탁 집행한다고 맺어요. 평가와 투명성 과제도 붙여요." },
        ]}
      />
      <Remember>나랏돈을 수은이 맡아 싸게 오래 빌려준다. 믿는 건 개발효과라서 평가가 곧 신뢰다.</Remember>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 5. 답안 엮기                                                          */
/* ------------------------------------------------------------------ */

const CROSS = [
  { q: "수출입은행은 왜 필요할까?", a: "민간이 대기엔 너무 크고, 너무 길고, 상대가 외국 정부거나 위험이 큰 일을 맡기 때문이에요. 네 주제 모두 여기에 해당해요. K2 금융은 만기 17년, EDCF는 최장 40년이라는 숫자를 붙이면 구체적이에요." },
  { q: "수은은 산은·무보와 뭐가 다를까?", a: "주제별로 비교하면 쉬워요. 방산에서는 수은이 돈을 빌려주고 무보가 위험을 보험으로 받쳐요. 대미투자에서는 수은이 조선 협의체 간사를 맡고, EDCF에서는 유상원조 실무를 맡아요." },
  { q: "정책금융의 대기업 쏠림을 어떻게 볼까?", a: "수은 상위 5개사 여신이 자기자본의 87.5%, 공급망기금의 대기업 비중이 88%, EDCF 입찰의 중소 비중이 2%예요. 큰 사업은 큰 기업이 맡기 쉽다는 구조적 이유와 개선책을 함께 써요." },
  { q: "수은의 자본은 충분할까?", a: "법정자본금 상한은 25조 원으로 올랐지만 실제 출자는 2.4조 원이었어요. 40% 한도, 폴란드 사례, 기금 논의로 이어 가면 돼요." },
  { q: "정책금융은 전략금융이 돼야 할까?", a: "구윤철 당시 부총리는 7월에 “앞으로 정책금융은 새로운 시장과 산업을 선제적으로 설계하는 전략금융이 되어야 한다”고 했어요. 네 주제를 사례로 들되, 민간과 겹치거나 위험이 쏠릴 수 있다는 점도 같이 써요." },
];

const ESSAY_RULES = [
  { t: "정의와 숫자 하나로 시작해요.", d: "“대미투자는 3,500억 달러다”처럼 무엇인지부터 분명히 해요." },
  { t: "세 질문으로 구조를 그려요.", d: "돈이 어디서 나와 어디로 가고, 무엇을 믿고 가는지 적어요." },
  { t: "수은의 역할을 정확히 적어요.", d: "집행자인지 운용자인지 구분해요. 여기서 차이가 나요." },
  { t: "비판과 답변을 같이 써요.", d: "국감 비판만 쓰면 반쪽이에요. 수은과 정부의 답도 한 줄 붙여요." },
  { t: "“확대해야 한다”로 끝내지 않아요.", d: "비용, 중복, 쏠림 가운데 하나를 붙이고 조건까지 적어요." },
];

function CrossChapter() {
  return (
    <div className="space-y-4">
      <P>문제가 네 주제 밖에서 나와도 재료는 그대로 쓸 수 있어요. 수은 논술에서 나올 법한 큰 질문 다섯 개로 네 주제를 엮어 볼게요.</P>
      <div className="space-y-2.5">
        {CROSS.map((x) => (
          <section key={x.q} className="rounded-2xl bg-canvas px-5 py-4 shadow-level-1">
            <h4 className="type-heading-sm text-ink [word-break:keep-all]">{x.q}</h4>
            <p className="mt-1.5 type-body-md text-ink-secondary ko-justify">{x.a}</p>
          </section>
        ))}
      </div>
      <Sub>답안은 이 순서로 쓰면 돼요</Sub>
      <Card>
        <ol className="space-y-3">
          {ESSAY_RULES.map((x, i) => (
            <li key={x.t} className="flex gap-2.5">
              <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-dark tabular text-[11px] font-bold text-on-primary">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="type-body-md font-bold text-ink [word-break:keep-all]">{x.t}</p>
                <p className="mt-0.5 type-body-md text-ink-secondary [word-break:keep-all]">{x.d}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-3 type-caption text-ink-mute [word-break:keep-all]">
          금콩이 정리한 연습 순서예요. 수은 경영 2차의 시험 구조는 <Link href={KEXIM_WRITTEN_HREF} className="link">수은 필기 글</Link>에 있어요.
        </p>
      </Card>
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
      ["3,500억 달러", "전체 약속. 전략투자 2,000억 + 조선협력 1,500억"],
      ["200억 달러", "한 해에 보낼 수 있는 상한"],
      ["24억 달러", "10월 1일 첫 송금. 1호 사업비의 10% 남짓"],
      ["50명 중 32명", "공사 정원과 10월 근무 인원"],
    ],
  },
  {
    t: "방산금융",
    rows: [
      ["40%", "수은이 한 곳에 빌려줄 수 있는 상한 (자기자본 대비, 은행법은 20%)"],
      ["25조 원", "법정자본금 상한 (2024년에 15조에서 상향)"],
      ["약 4조 원", "전략수출금융기금의 승인 규모 (정부 구상)"],
      ["0.5%", "정부가 설명한 기여금 기본 요율 (법안 상한 1%)"],
    ],
  },
  {
    t: "공급망기금",
    rows: [
      ["17.4조 원", "2024년~2026년 9월 누적 승인액"],
      ["88%", "그중 대기업 비중 (올해 1~9월만 보면 91%)"],
      ["65.5%", "올해 특정국 의존도. 2030년 목표는 50% 이하"],
    ],
  },
  {
    t: "EDCF",
    rows: [
      ["1987년", "기금 설치. 수은이 위탁받아 실무"],
      ["60개국 40.6조 원", "2025년 말까지 누적 승인액"],
      ["연 3조 원", "2026~28년 신규 승인 계획"],
    ],
  },
  { t: "공통", rows: [["87.5%", "수은 여신 상위 5개사 ÷ 자기자본 (2024년 말)"]] },
];

const TRAPS = [
  "수은이 대미투자를 집행한다 → 돈을 보내는 곳은 한미전략투자공사예요.",
  "조선 여신이 87.5%다 → 조선 4사에 한화에어로스페이스를 더한 숫자예요.",
  "전략수출금융기금이 출범했다 → 11월 6일 현재 국회 소위 단계예요.",
  "13억 유로는 수은이 낸 돈이다 → 하나은행 3억 유로가 포함된 규모예요.",
  "5년 100조와 5년 150조는 같다 → 전략 수주용과 통상위기 대응용으로 달라요.",
  "황 행장의 ‘중소 10%’는 공급망기금 숫자다 → 기금의 중소 비중은 1.8%예요.",
  "수은이 EDCF를 승인한다 → 방침을 정하는 건 재정경제부 장관이에요.",
];

const GLOSS_LIST = (Object.keys(GLOSS) as GlossKey[]).map((k) => [k, GLOSS[k]] as const);

function SheetChapter() {
  return (
    <div className="space-y-4">
      <P>숫자는 기준 시점까지 같이 외워야 해요. 같은 숫자도 언제, 무엇을 기준으로 했는지에 따라 뜻이 달라져요.</P>
      <div className="space-y-2.5">
        {SHEET.map((g) => (
          <div key={g.t} className="rounded-2xl bg-canvas px-5 py-4 shadow-level-1">
            <p className="type-heading-sm text-ink">{g.t}</p>
            <dl className="mt-2.5 space-y-2.5">
              {g.rows.map(([k, v]) => (
                <div key={k}>
                  <dt className="type-body-md font-bold text-primary-text">{k}</dt>
                  <dd className="mt-0.5 type-body-md text-ink-secondary [word-break:keep-all]">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
      <Sub>이렇게 쓰면 틀려요</Sub>
      <Card>
        <ul className="space-y-2.5">
          {TRAPS.map((t) => (
            <li key={t} className="flex gap-2 type-body-md text-ink [word-break:keep-all]">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              {t}
            </li>
          ))}
        </ul>
      </Card>
      <Fold title="어려운 말 한 번에 보기">
        <dl className="space-y-2.5">
          {GLOSS_LIST.map(([k, v]) => (
            <div key={k}>
              <dt className="type-body-md font-bold text-ink">{k}</dt>
              <dd className="mt-0.5 type-body-md text-ink-secondary [word-break:keep-all]">{v}</dd>
            </div>
          ))}
        </dl>
      </Fold>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 7. 면접                                                               */
/* ------------------------------------------------------------------ */

const QNA: { t: string; to: number; qs: [string, string][] }[] = [
  {
    t: "대미투자",
    to: CH.us,
    qs: [
      ["대미투자에서 수은이 하는 일이 뭔가요?", "주인공이 아니라는 걸 먼저 말하고, 위탁 후보·채권 절차·조선 간사 순서로 답해요."],
      ["미국 발전소가 실패하면 누가 책임지나요?", "수익 배분과 손실 처리 순서(공사 적립금 다음 정부)로 답해요."],
    ],
  },
  {
    t: "방산금융",
    to: CH.defense,
    qs: [
      ["수은 자본금이 왜 방산 수출과 연결되나요?", "40% 한도를 25조 원에 곱해 보여 주고 폴란드 사례를 붙여요."],
      ["기여금에 찬성하나요?", "입장을 말하고, 반대 논리와 성과공유형 절충안까지 꺼내요."],
    ],
  },
  {
    t: "공급망기금",
    to: CH.supply,
    qs: [
      ["수출은행이 왜 수입을 지원하나요?", "원자재가 끊기면 수출도 멈춘다는 걸로 시작해요."],
      ["대기업 쏠림이 문제인가요?", "88%와 품목 크기, 건수 기준을 함께 말하고 개선책을 붙여요."],
    ],
  },
  {
    t: "EDCF",
    to: CH.edcf,
    qs: [
      ["KOICA와 뭐가 다른가요?", "빌려주는 돈과 주는 돈, 주관 부처의 차이로 답해요."],
      ["원조인데 왜 우리 기업이 공사를 하나요?", "구속성 차관의 논리와 국제사회의 비판을 같이 말해요."],
    ],
  },
];

function InterviewChapter() {
  return (
    <div className="space-y-4">
      <P>필기를 통과하면 공부한 내용이 면접에서 그대로 쓰여요. 남은 관문은 셋이에요.</P>
      <Card>
        <p className="type-heading-sm text-ink">2차 필기 뒤 일정 (하반기 공고)</p>
        <ol className="mt-3 space-y-2 type-body-md text-ink [word-break:keep-all]">
          <li>
            <b className="tabular">11월 28일</b> 영어활용능력평가(TOEIC S&W)
          </li>
          <li>
            <b>11월 말~12월 초(예정)</b> 1차 면접, NCS 기반 직무역량평가. 1.5배수를 부르고, EDCF·지역전문가·보훈은 2배수예요.
          </li>
          <li>
            <b>12월 중하순(예정)</b> 2차 면접, 조직가치적합도 평가
          </li>
        </ol>
      </Card>
      <Note title="30초 안에 답하는 순서">
        <p>결론을 먼저 말하고, 숫자 하나를 붙이고, 수은과 연결해요. 수은을 칭찬하기보다 역할을 설명하는 게 좋아요.</p>
      </Note>
      {QNA.map((g) => (
        <section key={g.t} className="rounded-2xl bg-canvas px-5 py-4 shadow-level-1">
          <div className="flex items-center justify-between gap-2">
            <h4 className="type-heading-sm text-ink">{g.t}</h4>
            <GoChip to={g.to}>다시 읽기</GoChip>
          </div>
          <dl className="mt-2.5 space-y-2.5">
            {g.qs.map(([q, a]) => (
              <div key={q}>
                <dt className="type-body-md font-bold text-ink [word-break:keep-all]">“{q}”</dt>
                <dd className="mt-0.5 type-body-md text-ink-secondary [word-break:keep-all]">{a}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
      <Card>
        <div className="flex items-center justify-between gap-2">
          <p className="type-heading-sm text-ink">PT 연습 주제</p>
          <Tag kind="view" />
        </div>
        <ul className="mt-2.5 space-y-1.5 type-body-md text-ink [word-break:keep-all]">
          <li>· 한미 조선협력 1,500억 달러에서 수은의 금융지원 구조 설계</li>
          <li>· 초대형 방산·원전 수주를 위한 금융 패키지 설계</li>
          <li>· 중소기업 공급망 지원 확대 방안</li>
          <li>· EDCF 사업 투명성을 높이는 제도 설계</li>
        </ul>
      </Card>
      <p className="flex items-start gap-2">
        <span className="mt-[3px]">
          <Tag kind="rumor" />
        </span>
        <span className="min-w-0 flex-1 type-body-md text-ink ko-justify">상반기 수은 면접에 인바스켓(서류 더미를 주고 처리안을 쓰게 하는 과제)이 있었대요. PT 주제가 중소·중견기업 지원이었다는 후기도 있어요. 한두 명의 말이에요.</span>
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 8. 정리                                                               */
/* ------------------------------------------------------------------ */

const SUMMARY = [
  "수은은 민간이 나서기 어려운 큰돈을 맡는 나라의 은행이에요. 네 주제 모두 돈이 어디서 나와, 어디로 가고, 무엇을 믿고 가는지로 시작해요.",
  "수은의 역할은 주제마다 달라요. 대미투자는 옆에서 돕는 조연, 방산은 직접 빌려주는 은행, 공급망은 기금 운용자, EDCF는 위탁 집행 기관이에요.",
  "논쟁은 쏠림, 한도, 중복, 평가로 모여요. 비판과 수은의 답변을 함께 쓰면 돼요.",
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
  ["파이낸셜뉴스, 환율과 반도체 달러 (9/7)", "https://www.fnnews.com/news/202609071013569565"],
  ["MTN, 프로젝트 스타·원전 8기 (10/1)", "https://news.mtn.co.kr/news-detail/2026100104283999993"],
  ["아이뉴스24, 공사 국감 (10/20)", "https://inews24.com/view/2016899"],
  ["뉴데일리, 송금 논란 (10/20)", "https://www.newdaily.co.kr/site/data/html/2026/10/20/2026102000283.html"],
  ["주간한국, 수은 국감 (10/20)", "https://weekly.hankooki.com/news/articleView.html?idxno=7189826"],
  ["서울경제, 국회예산정책처 수은 여신 집중 (10/10)", "https://m.sedaily.com/article/20099936"],
  ["경북매일, 환율 월평균 (10/26)", "https://kbmaeil.com/article/20261026500025"],
  ["노컷뉴스, 러트닉 발언 (7/23)", "https://nocutnews.co.kr/news/6552681"],
  ["디지털데일리, 군함 10척 (6/19)", "https://www.ddaily.co.kr/page/view/2026061918105439306"],
  ["한국경제TV, 공사 투자이사 임명 (11/2)", "https://www.wowtv.co.kr/NewsCenter/News/Read?articleId=A202611020072"],
  ["파이낸셜뉴스, K2 2차 금융 (1/26)", "https://www.fnnews.com/news/202601260810579586"],
  ["뉴스토마토, 수은 한도와 방산 (1/12)", "https://www.newstomato.com/ReadNews.aspx?no=1287510"],
  ["이투데이, 수은법 개정과 폴란드 한도 (2024/2/29)", "https://www.etoday.co.kr/news/view/2335446"],
  ["아주경제, 기금법 공청회 (4/29)", "https://www.ajunews.com/view/20260429154622292"],
  ["한국경제, 기금 정부안 4조 (5/21)", "https://www.hankyung.com/article/2026052125811"],
  ["뉴스핌, 기금 2027 예산안 (9/4)", "https://www.newspim.com/news/view/20260904000668"],
  ["폴리뉴스, 문진석 자료 (10/5)", "https://www.polinews.co.kr/news/articleView.html?idxno=744894"],
  ["파이낸셜뉴스, 방진회 협약 (10/7)", "https://www.fnnews.com/news/202610071829197771"],
  ["머니투데이, 전략수주 100조 (2/11)", "https://www.mt.co.kr/finance/2026/02/11/2026021110321555200"],
  ["한국금융신문, 공급망기금 국감 (10/21)", "https://www.fntimes.com/html/view.php?ud=2026102021002266871b5a221379_18"],
  ["뉴스토마토, 공급망기금 정리 (10/30)", "https://newstomato.com/ReadNews.aspx?no=1318613"],
  ["핀포인트뉴스, 공급망기금 연도별 비중 (10/14)", "https://www.pinpointnews.co.kr/news/articleView.html?idxno=495033"],
  ["재경부 보도참고 전재 (10/15)", "https://www.ksw-news.com/news/articleView.html?idxno=3047091"],
  ["아시아경제, 고려아연 질의 (10/20)", "https://view.asiae.co.kr/article/2026102018012388893"],
  ["글로벌이코노믹, 공급망 협력 답변 (10/20)", "https://www.g-enews.com/article/Finance/2026/10/202610201338497825bb91c46fcd_1"],
  ["헤럴드경제, 공급망기금 외화채 (4월)", "https://www.heraldk.com/article/2026040115321542558"],
  ["헤럴드경제, EDCF 혁신전략 (6/10)", "https://www.heraldk.com/article/2026061015574673686"],
  ["뉴스토마토, EDCF 평가 질의 (10/20)", "http://www.newstomato.com/ReadNews.aspx?no=1317374"],
  ["뉴스토마토, 캄보디아 약정 논란 (2025/10/27)", "https://www.newstomato.com/ReadNews.aspx?no=1279216"],
  ["뉴시스, EDCF 제도 개선 (2025/12/22)", "https://www.newsis.com/view/NISX20251222_0003450906"],
  ["조세금융신문, EDCF 중소 입찰 (2025/10/27)", "https://tfmedia.co.kr/mobile/article.html?no=196976"],
  ["헤럴드경제, EDCF 중기계획 (4/12)", "https://www.heraldk.com/article/2026041216300047601"],
  ["SBS Biz, 제157차 운용위 (4/13)", "https://biz.sbs.co.kr/amp/article/20000303808"],
  ["뉴스핌, 탄자니아 차관 (11/5)", "https://www.newspim.com/news/view/20261105000141"],
  ["파이낸셜뉴스, 수은 창립 50주년 (7/1)", "https://www.fnnews.com/news/202607011358025699"],
];

function Wrap() {
  return (
    <div className="space-y-4">
      <ol className="space-y-2.5">
        {SUMMARY.map((t, i) => (
          <li key={t} className="flex gap-3 rounded-2xl bg-canvas px-4 py-3.5 shadow-level-1">
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
      <div className="flex gap-2 border-t border-hairline pt-4 type-caption text-ink-mute">
        <BookOpen className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2} />
        <div className="[word-break:keep-all]">
          <p>이 글은 2026년 11월 6일 기준이에요. 확인한 사실과 금콩의 풀이를 나눠 썼어요. 국감 발언은 언론 보도 기준이에요.</p>
          <p className="mt-1">썸네일 바탕 사진: 미 해군 / Wikimedia Commons, 퍼블릭 도메인</p>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 장 목록                                                               */
/* ------------------------------------------------------------------ */

const CHAPTERS: GuideChapter[] = [
  { short: "먼저", title: "수은은 어떤 은행이고, 왜 이 네 주제일까?", kong: "저도 처음엔 수은이 수은 건전지인 줄 알았어요. 여기서부터 같이 가요.", look: "book", bg: "bg-[#f4f2ff]", body: <FrameChapter /> },
  { short: "대미투자", title: "미국에 465조, 누가 어떻게 보낼까?", kong: "관세 깎으려고 465조를 약속했대요. 제 통장 잔고는 4만 원대인데요.", look: "sweat", bg: "bg-[#eef6ff]", body: <UsChapter /> },
  { short: "방산금융", title: "은행 자본금이 왜 탱크 수출을 막을까?", kong: "탱크 값도 모르는데 은행 한도부터 알아야 한대요.", look: "suit", bg: "bg-[#fff8ec]", body: <DefenseChapter /> },
  { short: "공급망", title: "수출은행이 왜 수입을 지킬까?", kong: "나라 공급망을 지킨대요. 전 제 냉장고 재고도 몰라요.", look: "pencil", bg: "bg-[#f2fbf5]", body: <SupplyChapter /> },
  { short: "EDCF", title: "개도국에 빌려주면 우리한테 뭐가 남을까?", kong: "빌려주고 원조래요. 전 빌려주면 그냥 못 받던데요.", look: "sweat", bg: "bg-[#fff4f0]", body: <EdcfChapter /> },
  { short: "답안 엮기", title: "네 주제를 답안에 어떻게 엮을까?", kong: "모범답안은 없어요. 있었으면 제가 먼저 베꼈어요.", look: "pencil", bg: "bg-[#f4f2ff]", body: <CrossChapter /> },
  { short: "숫자 한 장", title: "시험장 가기 전, 뭘 외울까?", kong: "캡처해 두세요. 전 캡처만 해 두고 안 봐요.", look: "book", bg: "bg-[#eef6ff]", body: <SheetChapter /> },
  { short: "면접까지", title: "필기를 붙고 나면 뭘 물어볼까?", kong: "30초 안에 말하래요. 전 자기소개만 40초예요.", look: "suit", bg: "bg-[#f2fbf5]", body: <InterviewChapter /> },
  { short: "정리", title: "세 줄로 끝내면?", kong: "여기까지 읽었으면 저보다 잘 아세요. 그건 별로 어렵지 않아요.", look: "suit", bg: "bg-[#f6f4ff]", body: <Wrap /> },
];

export function KeximEssayGuide({ title }: { title: string }) {
  return (
    <GlossLayer>
      <GuideShell
        chapters={CHAPTERS}
        eyebrow="금콩 인터랙티브 · 수은 논술 종합"
        heading={title}
        sub="사전 지식이 없어도 따라올 수 있게, 네 주제를 이야기처럼 풀었어요. 어려운 말은 눌러 보세요."
        mascot={<KongMascot hold="book" glasses className="h-24 w-24 shrink-0 md:h-32 md:w-32" />}
        tabsLabel="수은 논술 종합 목차"
        cover={<Hook />}
        coverClass="from-[#e6ebff]"
      />
    </GlossLayer>
  );
}
