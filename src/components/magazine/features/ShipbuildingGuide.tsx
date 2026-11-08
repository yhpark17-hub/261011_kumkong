"use client";

import Link from "next/link";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowDown, ArrowRight, BookOpen, Check, ChevronDown, Play, X } from "lucide-react";
import { cn } from "../../ui";
import { GuideShell, anim, useGuideGo, type GuideChapter } from "./GuideShell";

/**
 * 산업 A-Z 1편 — 조선업. 같은 내용의 유튜브 영상(금콩 산업 A-Z)과 장 순서를 맞춰, 영상으로 보거나 글로 읽거나 고를 수 있어요.
 * 왜 지금 → 질문 1~4 → 수수께끼의 답 → 다섯 줄 정리. 그림은 영상에 쓴 장면 그림을 그대로 써요.
 * 숫자는 2026-11-07 기준 브리프 지식 패키지(클락슨리서치·정부 발표·언론 보도)에 있는 것만, 출처를 괄호로 붙여요.
 * 사실이 아닌 문장(업계 말·전망·금콩 풀이)만 따로 표시해요. 주식 얘기는 피크아웃 논쟁의 배경 한 줄뿐이에요.
 */

/* 장 번호 */
const CH = { intro: 0, why: 1, money: 2, cycle: 3, now: 4, answer: 5, wrap: 6 } as const;

/* ------------------------------------------------------------------ */
/* 영상 — 유튜브 주소가 있으면 장마다 같은 장면으로 가는 링크가 생겨요            */
/* ------------------------------------------------------------------ */

/** 영상의 장 시작 시각(초) — 유튜브 설명란 챕터와 같아요 */
// 유튜브 설명란 챕터와 같은 초 (영상 쪽 시각을 내림한 값)
const VIDEO_CHAPTERS = [0, 65, 138, 407, 536, 804, 843] as const;
const VIDEO_LENGTH = "15:32";

const VideoCtx = createContext<string | null>(null);

const mmss = (t: number) => `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
const watchUrl = (id: string, t = 0) => `https://www.youtube.com/watch?v=${id}${t > 0 ? `&t=${t}s` : ""}`;

/** 영상에서 이 부분 보기 (영상 주소가 없으면 안 보여요) */
function At({ t, label }: { t: number; label?: string }) {
  const id = useContext(VideoCtx);
  if (!id) return null;
  return (
    <a
      href={watchUrl(id, t)}
      target="_blank"
      rel="noopener noreferrer"
      className={cn("inline-flex shrink-0 items-center gap-1 rounded-full bg-[#ffe4e4] px-2.5 py-1 type-caption font-bold text-[#b3261e] hover:bg-[#ffd3d3]", anim)}
    >
      <Play className="h-3 w-3 fill-current" strokeWidth={0} />
      {label ?? "영상"} {mmss(t)}
    </a>
  );
}

/* ------------------------------------------------------------------ */
/* 말풀이 — 점선 밑줄 말을 누르면 아래에 뜻이 떠요                            */
/* ------------------------------------------------------------------ */

const GLOSS = {
  선주: "배 주인이에요. 배를 주문하고 돈을 내는 쪽이에요. 해운사일 수도 있고, 배만 사서 빌려주는 회사일 수도 있어요.",
  해운사: "배로 물건을 실어 나르고 운임을 받는 회사예요. 택배 회사의 바다 버전이에요.",
  조선소: "배를 만드는 공장이에요. 그 회사는 조선사라고 불러요. HD현대중공업·삼성중공업·한화오션을 ‘조선 3사’라고 해요.",
  수주: "일감을 따냈다는 뜻이에요. ‘3조 원 수주’는 3조 원어치 배를 만들어 달라는 계약을 따냈다는 말이고, 돈은 아직 다 안 들어왔어요.",
  발주: "선주 쪽에서 보면 주문을 냈다는 뜻이에요. 수주와 같은 사건을 반대편에서 부르는 말이에요.",
  RG: "선수금환급보증이에요. 조선사가 배를 못 만들면 선주가 미리 낸 돈을 은행이 대신 돌려주겠다는 보증서예요. 이게 없으면 선주는 계약금을 안 내요.",
  선급: "배가 안전하게 만들어졌는지 검사하고 도장을 찍어 주는 민간 검사 기관이에요. 이 도장이 없으면 보험도 못 들고 항구에도 못 들어가요.",
  후판: "배를 만드는 두꺼운 철판이에요(두께 6mm 이상). 배 원가에서 가장 큰 재료비예요.",
  스틸커팅: "후판을 처음 자르는 날이에요. 이날을 공식 착공으로 쳐요.",
  블록: "배를 한 번에 만들지 않고 레고처럼 덩어리로 나눠 만든 뒤 합쳐요. 그 덩어리 하나가 블록이에요.",
  사내협력사: "조선소 안에서 일하지만 소속은 다른 하청 회사예요.",
  도크: "배를 조립하는 커다란 수조예요. 다 만들면 물을 채워 배를 띄워요. 조선소에서 가장 비싼 설비라 ‘도크가 비어 있다’는 말은 일감이 없다는 뜻이에요.",
  기공: "첫 블록을 도크에 내려놓는 날이에요.",
  진수: "다 조립한 배를 처음 물에 띄우는 거예요. 아직 완성은 아니에요.",
  의장: "배 껍데기가 된 뒤 엔진·배관·전선·객실 같은 속을 채우는 작업이에요. 집으로 치면 인테리어와 설비 공사예요.",
  시운전: "바다에 나가 실제로 달려 보는 시험이에요. 통과해야 배를 넘길 수 있어요.",
  인도: "선주에게 배를 넘기고 마지막 돈을 받는 날이에요.",
  선수금: "배값을 배를 넘기기 전에 나눠서 미리 받는 돈이에요. 계약금과 중도금을 합쳐 부르는 말이에요.",
  헤비테일: "배값의 대부분(예: 60%)을 마지막 인도 때 몰아 받는 방식이에요. 꼬리가 무겁다는 뜻이에요. 그만큼 조선사가 자기 돈으로 먼저 만들어야 해요.",
  진행률매출: "배가 30% 만들어졌으면 배값의 30%를 그해 매출로 잡는 회계 방식이에요. 그래서 올해 매출은 2~3년 전에 계약한 배값으로 정해져요.",
  환헤지: "배값은 달러로 받고 월급은 원화로 주니, 환율이 움직여도 손해를 덜 보게 미리 환율을 고정해 두는 거예요.",
  선박금융: "선주가 배값을 대출로 마련하는 거예요. 배 자체를 담보로 잡아요. 외국 선주가 한국 배를 사게 수출입은행·무역보험공사가 대출과 보증으로 도와요.",
  용선: "배를 빌려 쓰는 거예요. 배 세계의 전세·월세예요.",
  선복량: "배들이 한 번에 실을 수 있는 짐의 양을 모두 합친 거예요.",
  운임: "배로 짐을 날라 주고 받는 돈이에요.",
  밸류체인: "원재료부터 완성품이 팔리기까지 거치는 단계와 거기에 붙은 회사들 전체예요.",
  CGT: "표준화물선 환산톤수예요. 배의 크기에 ‘만들기 어려운 정도’를 곱해 바꾼 단위예요. 같은 크기라도 LNG선이 벌크선보다 크게 나와요. ‘수주량 몇 CGT’는 난이도까지 넣은 일감의 총량으로 읽으면 돼요.",
  수주잔량: "계약은 했지만 아직 안 만든 배의 총량이에요. 밀린 일감이에요. ‘3년 치’는 지금 속도로 3년 동안 만들 일이 쌓여 있다는 뜻이에요.",
  신조선가지수: "새 배 값을 지수로 만든 거예요(클락슨리서치, 1988년=100). 배 값의 ‘아파트 실거래가 지수’예요. 오르면 같은 배를 더 비싸게 판다는 뜻이에요.",
  점유율: "그해 세계에서 주문된 배 가운데 한 나라가 따낸 비율이에요. 보통 CGT로 세요. 척수 기준과 금액 기준이 달라서 뉴스마다 숫자가 달라요.",
  영업이익률: "매출 100원을 팔아 본업에서 남기는 돈이에요. 조선은 호황에도 10% 안팎이면 잘한 편이에요.",
  LNG선: "영하 163도로 얼린 천연가스를 실어 나르는 배예요. 배 중에서 가장 비싸고 만들기 어려워요. 한국의 주종목이에요.",
  VLCC: "초대형 원유운반선이에요. 원유를 200만 배럴 안팎 한 번에 실어요.",
  컨테이너선: "컨테이너를 실어 나르는 배예요. 우리가 사는 물건 대부분이 이 배로 와요.",
  벌크선: "석탄·철광석·곡물을 포장 없이 쌓아 나르는 배예요. 만들기 쉬워 중국이 거의 다 만들어요.",
  이중연료선: "기름과 LNG(또는 메탄올·암모니아)를 둘 다 넣을 수 있는 배예요. 환경 규제 때문에 주문이 늘어요.",
  해양플랜트: "바다에서 석유·가스를 뽑는 거대한 구조물이에요. 2010년대 한국 조선사들이 여기서 큰 손실을 봤어요.",
  MASGA: "Make American Shipbuilding Great Again. 미국 조선업을 다시 키우겠다는 구호이자, 한국이 미국에 제안한 조선 협력 패키지 이름이에요.",
  MRO: "유지·보수·정비예요. 새 배를 만드는 게 아니라 있는 배(특히 군함)를 고쳐 주는 일이에요.",
  존스법: "미국 항구 사이를 다니는 배는 미국에서 만들고 미국인이 가져야 한다는 1920년 법이에요. 한국 조선사가 미국 배를 한국에서 만들지 못하는 이유예요.",
  IMO: "국제해사기구예요. 배의 환경·안전 규칙을 정하는 유엔 기구예요. 여기서 규제가 나오면 전 세계 선주가 배를 바꿔야 해서 조선사 일감이 생겨요.",
  수주절벽: "주문이 갑자기 끊기는 거예요. 2016년이 대표 사례예요.",
  슈퍼사이클: "주문이 여러 해 이어서 밀려들고 배 값까지 오르는 대호황 구간이에요. 2021년 이후를 이렇게 불러요.",
  피크아웃: "정점을 찍고 내려온다는 뜻이에요. ‘조선 피크아웃 논쟁’은 호황이 끝물인지 아닌지를 두고 의견이 갈리는 거예요.",
  기저효과: "비교하는 기준 시점의 숫자가 유난히 크거나 작아서, 지금 숫자가 실제보다 크게 오르거나 내린 것처럼 보이는 현상이에요.",
  차관: "나라나 기업이 외국에서 빌려 오는 돈이에요.",
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
      className="cursor-help border-b border-dashed border-primary/70 font-semibold text-ink hover:bg-ev-written-soft"
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
            <p className="type-caption font-bold text-on-primary/75">{k} · 이 말의 뜻</p>
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

type Kind = "view" | "industry" | "outlook";

const KIND: Record<Kind, { label: string; cls: string }> = {
  view: { label: "금콩 풀이", cls: "bg-[#ffe6cc] text-[#9a4a0b]" },
  industry: { label: "업계 말", cls: "bg-[#e3ecff] text-[#1d4f9a]" },
  outlook: { label: "전망", cls: "bg-[#e3f5ea] text-[#1d6e43]" },
};

function Tag({ kind }: { kind: Kind }) {
  return <span className={cn("inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] leading-4 font-bold whitespace-nowrap", KIND[kind].cls)}>{KIND[kind].label}</span>;
}

/** 굵게 — 숫자와 핵심 말 */
function B({ children }: { children: ReactNode }) {
  return <strong className="font-bold text-ink">{children}</strong>;
}

/** 형광펜 — 한 대목에 한 번, 꼭 기억할 문장 */
function M({ children }: { children: ReactNode }) {
  return <mark className="rounded-[2px] bg-[linear-gradient(transparent_58%,#ffe58a_58%)] font-bold text-ink [box-decoration-break:clone]">{children}</mark>;
}

/** 출처 줄 — 문장 사이에 끼우지 않고 문단 아래에 작게 */
function Src({ children }: { children: ReactNode }) {
  return <p className="mt-1.5 type-caption text-ink-mute [word-break:keep-all]">출처 · {children}</p>;
}

/** 본문 문단 (큰 글씨) */
function P({ children, src, className }: { children: ReactNode; src?: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <p className="type-body-lg leading-[1.85] text-ink-secondary ko-justify">{children}</p>
      {src && <Src>{src}</Src>}
    </div>
  );
}

/** 카드 안 문단 (보통 글씨) */
function T({ children, src }: { children: ReactNode; src?: ReactNode }) {
  return (
    <div>
      <p className="type-body-md leading-[1.8] text-ink-secondary ko-justify">{children}</p>
      {src && <Src>{src}</Src>}
    </div>
  );
}

/** 그래서 — 숫자 다음에 붙는 ‘무슨 뜻이냐’ 한 줄 */
function So({ children, src }: { children: ReactNode; src?: ReactNode }) {
  return (
    <div className="rounded-xl bg-ev-written-soft px-3.5 py-2.5">
      <p className="flex gap-2 type-body-md leading-relaxed text-ink [word-break:keep-all]">
        <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-primary" strokeWidth={2.6} />
        <span>
          <b className="text-primary-text">그래서 · </b>
          {children}
        </span>
      </p>
      {src && <Src>{src}</Src>}
    </div>
  );
}

/** 장 첫머리 — 이 장의 요점 */
function Gist({ items }: { items: ReactNode[] }) {
  return (
    <aside className="rounded-2xl border border-brand-dark/10 bg-canvas px-4 py-3.5 shadow-level-1">
      <p className="type-micro-cap text-primary-text">이 장의 요점</p>
      <ul className="mt-2 space-y-1.5">
        {items.map((x, i) => (
          <li key={i} className="flex gap-2 type-body-md text-ink [word-break:keep-all]">
            <Check className="mt-1 h-4 w-4 shrink-0 text-primary" strokeWidth={2.6} />
            <span>{x}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}

/** 장 안의 소제목 — 영상 같은 장면 링크와 함께 */
function Sub({ children, t, id }: { children: ReactNode; t?: number; id?: string }) {
  return (
    <div id={id} className="flex scroll-mt-36 flex-wrap items-center justify-between gap-x-3 gap-y-1.5 border-t border-hairline pt-6">
      <h3 className="type-heading-md text-ink [word-break:keep-all]">{children}</h3>
      {t != null && <At t={t} />}
    </div>
  );
}

/** 장 안에서 소제목으로 바로 가기 */
function Jumps({ items }: { items: { id: string; label: string }[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((x) => (
        <button
          key={x.id}
          type="button"
          onClick={() => document.getElementById(x.id)?.scrollIntoView({ behavior: "smooth", block: "start" })}
          className={cn("inline-flex items-center gap-1 rounded-full bg-canvas px-3 py-1.5 type-caption font-semibold text-ink shadow-level-1 hover:bg-ev-written-soft", anim)}
        >
          {x.label}
          <ArrowDown className="h-3 w-3" strokeWidth={2.4} />
        </button>
      ))}
    </div>
  );
}

function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("rounded-2xl bg-canvas px-5 py-5 shadow-level-1", className)}>{children}</div>;
}

/** 사실과 섞이지 않게 — 금콩 풀이·업계 말·전망 칸 */
function Note({ children, title, kind = "view" }: { children: ReactNode; title?: string; kind?: Kind }) {
  const tone = kind === "view" ? "bg-[#fff4e8] text-[#5f3006]" : kind === "industry" ? "bg-[#eef3ff] text-[#173f7a]" : "bg-[#eaf7ef] text-[#174f31]";
  return (
    <aside className={cn("rounded-2xl px-4 py-3.5", tone)}>
      <div className="flex items-center justify-between gap-2">
        <p className="type-body-md font-bold [word-break:keep-all]">{title ?? "쉽게 말하면"}</p>
        <Tag kind={kind} />
      </div>
      <div className="mt-1.5 space-y-1.5 type-body-md leading-relaxed ko-justify">{children}</div>
    </aside>
  );
}

/** 이걸 알면 뉴스가 이렇게 읽혀요 */
function News({ headline, children }: { headline: string; children: ReactNode }) {
  return (
    <aside className="rounded-2xl border-2 border-brand-dark/15 bg-canvas px-4 py-3.5">
      <p className="flex items-center gap-1.5 type-caption font-bold text-primary-text">
        <BookOpen className="h-3.5 w-3.5" strokeWidth={2.2} />
        이제 이 뉴스가 이렇게 읽혀요
      </p>
      <p className="mt-1.5 type-body-md font-bold text-ink [word-break:keep-all]">“{headline}”</p>
      <p className="mt-1 type-body-md leading-relaxed text-ink-secondary ko-justify">{children}</p>
    </aside>
  );
}

/** 영상에 나온 그림 */
function Pic({ src, alt, caption }: { src: string; alt: string; caption?: ReactNode }) {
  return (
    <figure className="overflow-hidden rounded-2xl bg-canvas shadow-level-1">
      {/* eslint-disable-next-line @next/next/no-img-element -- 영상에 쓴 장면 그림 (public/magazine/ship) */}
      <img src={`/magazine/ship/${src}.webp`} width={1200} height={675} alt={alt} loading="lazy" decoding="async" className="block h-auto w-full" />
      {caption && <figcaption className="px-4 py-2.5 type-caption text-ink-secondary [word-break:keep-all]">{caption}</figcaption>}
    </figure>
  );
}

/** 막대 — 값은 항상 글자로 함께 (막대는 0에서 시작) */
function Bars({ title, rows, max, note }: { title: string; rows: { k: string; v: number; show: string; hi?: boolean }[]; max: number; note?: ReactNode }) {
  return (
    <div className="rounded-2xl bg-canvas px-4 py-3.5 shadow-level-1">
      <p className="type-body-md font-bold text-ink [word-break:keep-all]">{title}</p>
      <div className="mt-2.5 space-y-2">
        {rows.map((x) => (
          <div key={x.k}>
            <div className="flex items-baseline justify-between gap-2 type-caption text-ink-secondary">
              <span className="[word-break:keep-all]">{x.k}</span>
              <span className="tabular font-semibold text-ink">{x.show}</span>
            </div>
            <div className="mt-0.5 h-2.5">
              <div className={cn("h-full rounded-r", x.hi ? "bg-primary" : "bg-primary/35")} style={{ width: `${Math.max(1.5, (x.v / max) * 100)}%` }} />
            </div>
          </div>
        ))}
      </div>
      {note && <p className="mt-2.5 type-caption text-ink-mute [word-break:keep-all]">{note}</p>}
    </div>
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

/** 다음 장으로 */
function NextUp({ to, children }: { to: number; children: ReactNode }) {
  const go = useGuideGo();
  return (
    <button type="button" onClick={() => go(to, true)} className={cn("flex w-full items-center justify-between gap-3 rounded-2xl bg-brand-dark px-4 py-3.5 text-left text-on-primary shadow-level-1", anim)}>
      <span>
        <span className="block type-caption text-on-primary/70">다음 장</span>
        <span className="block type-body-md font-bold [word-break:keep-all]">{children}</span>
      </span>
      <ArrowRight className="h-5 w-5 shrink-0" strokeWidth={2.2} />
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* 표지 — 영상으로 볼까, 글로 읽을까                                       */
/* ------------------------------------------------------------------ */

const OUTLINE = [
  { title: "왜 지금 조선업 얘기를 할까", hint: "미국의 부탁, 그리고 이상한 숫자 하나" },
  { title: "질문 1. 조선업은 왜 중요할까", hint: "배 한 척 값, 수출, 그리고 거제" },
  { title: "질문 2. 배 한 척, 돈은 어떻게 돌까", hint: "일곱 정거장과 마지막 날의 60%" },
  { title: "질문 3. 왜 천국과 지옥을 오갈까", hint: "모래사장에서 슈퍼사이클까지" },
  { title: "질문 4. 지금 무슨 일이 벌어지고 있을까", hint: "중국·미국·환경 규제·사람·피크아웃" },
  { title: "수수께끼의 답", hint: "진짜 뉴스로 연습해 보기" },
  { title: "다섯 줄 정리", hint: "오늘부터 조선 뉴스 읽는 법" },
];

function Cover() {
  const id = useContext(VideoCtx);
  const go = useGuideGo();
  const thumb = (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element -- 영상 썸네일 (public/magazine/ship) */}
      <img src="/magazine/ship/video-thumb.webp" width={1280} height={720} alt="영상 썸네일 — 미국이 왜 한국에 부탁할까" className="block h-auto w-full" />
      <span aria-hidden className="absolute inset-0 bg-linear-to-t from-[#0b1030]/45 via-transparent to-transparent" />
      <span className="absolute bottom-3 left-3 rounded-md bg-[#0b1030]/80 px-2 py-0.5 tabular type-caption font-bold text-on-primary">{VIDEO_LENGTH}</span>
    </>
  );
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-[1.35fr_1fr]">
        {id ? (
          <a href={watchUrl(id)} target="_blank" rel="noopener noreferrer" aria-label="유튜브에서 영상 보기 (새 창)" className="group relative block overflow-hidden rounded-3xl shadow-level-2">
            {thumb}
            <span className={cn("absolute right-3 bottom-3 inline-flex h-12 w-[4.5rem] items-center justify-center rounded-2xl bg-[#ff0033] text-on-primary shadow-level-2 group-hover:scale-105 md:right-4 md:bottom-4 md:h-16 md:w-24", anim)}>
              <Play className="ml-1 h-6 w-6 fill-current md:h-8 md:w-8" strokeWidth={0} />
            </span>
          </a>
        ) : (
          <div className="relative overflow-hidden rounded-3xl shadow-level-2">
            {thumb}
            <span className="absolute inset-x-0 bottom-0 flex justify-center pb-3">
              <span className="rounded-full bg-canvas/95 px-3.5 py-1.5 type-caption font-bold text-ink shadow-level-1">영상은 곧 공개돼요 · 아래에서 글로 먼저 읽어요</span>
            </span>
          </div>
        )}
        <div className="flex flex-col gap-2.5">
          <p className="type-body-md text-ink-secondary ko-justify">같은 이야기를 두 가지로 준비했어요. 편한 쪽으로 고르세요.</p>
          {id ? (
            <a href={watchUrl(id)} target="_blank" rel="noopener noreferrer" className={cn("flex items-center gap-3 rounded-2xl bg-[#ff0033] px-4 py-3.5 text-on-primary shadow-level-1 hover:brightness-105", anim)}>
              <Play className="h-6 w-6 shrink-0 fill-current" strokeWidth={0} />
              <span className="min-w-0 flex-1">
                <span className="block type-body-md font-bold">영상으로 보기</span>
                <span className="block type-caption text-on-primary/85">{VIDEO_LENGTH} · 그림과 나레이션으로 · 유튜브</span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0" strokeWidth={2.2} />
            </a>
          ) : (
            <div className="flex items-center gap-3 rounded-2xl bg-canvas-soft px-4 py-3.5 text-ink-mute">
              <Play className="h-6 w-6 shrink-0" strokeWidth={2} />
              <span className="min-w-0 flex-1">
                <span className="block type-body-md font-bold">영상으로 보기</span>
                <span className="block type-caption">곧 유튜브에 올라와요</span>
              </span>
            </div>
          )}
          <button type="button" onClick={() => go(CH.intro, true)} className={cn("flex items-center gap-3 rounded-2xl bg-brand-dark px-4 py-3.5 text-left text-on-primary shadow-level-1", anim)}>
            <BookOpen className="h-6 w-6 shrink-0" strokeWidth={2} />
            <span className="min-w-0 flex-1">
              <span className="block type-body-md font-bold">글로 읽기</span>
              <span className="block type-caption text-on-primary/80">약 20분 · 숫자와 출처까지 천천히</span>
            </span>
            <ArrowRight className="h-4 w-4 shrink-0" strokeWidth={2.2} />
          </button>
          <p className="type-caption text-ink-mute [word-break:keep-all]">영상과 글은 같은 순서로 흘러가요. 글을 읽다가 장마다 붙은 ▶ 버튼을 누르면 영상의 같은 장면으로 가요.</p>
        </div>
      </div>

      <div className="rounded-3xl bg-canvas/90 p-4 shadow-level-1 backdrop-blur sm:p-5">
        <p className="type-heading-sm text-ink">목차 — 질문 네 개면 조선업이 보여요</p>
        <ol className="mt-3 divide-y divide-hairline">
          {OUTLINE.map((x, i) => (
            <li key={x.title} className="flex items-center gap-3 py-2.5">
              <button type="button" onClick={() => go(i, true)} className="group flex min-w-0 flex-1 items-center gap-3 text-left">
                <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-canvas-soft tabular type-caption font-bold text-ink group-hover:bg-ev-written-soft">{i + 1}</span>
                <span className="min-w-0">
                  <span className="block type-body-md font-semibold text-ink [word-break:keep-all] group-hover:text-primary-text">{x.title}</span>
                  <span className="block type-caption text-ink-mute [word-break:keep-all]">{x.hint}</span>
                </span>
              </button>
              <At t={VIDEO_CHAPTERS[i]} label="" />
            </li>
          ))}
        </ol>
      </div>

      <div className="rounded-2xl bg-canvas/70 px-4 py-3 type-caption text-ink-secondary">
        <p className="[word-break:keep-all]">
          <span className="border-b border-dashed border-primary/70">점선 밑줄</span>이 있는 말은 누르면 뜻이 나와요. 숫자 뒤 괄호는 출처예요. 따로 표시 없는 문장은 통계·공시·정부 발표·보도로 확인한 사실이고, 아래 셋만 따로 표시했어요. 2026년 11월 7일 기준이에요.
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {(Object.keys(KIND) as Kind[]).map((k) => (
            <Tag key={k} kind={k} />
          ))}
        </div>
        <p className="mt-1.5 [word-break:keep-all]">특정 회사나 주식을 권하는 글이 아니에요. 그림은 영상에 쓴 장면 그림이에요(AI 도구로 그렸어요).</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 0. 왜 지금                                                            */
/* ------------------------------------------------------------------ */

function IntroChapter() {
  const go = useGuideGo();
  return (
    <div className="space-y-5">
      <Pic src="hook" alt="도크 안에 선 거대한 LNG선과 그 앞에서 올려다보는 작업자들" />
      <P>
        지금 미국이 한국에 부탁하고 있는 게 있어요. <M>“우리 배 좀 만들어 달라”</M>는 거예요.
      </P>
      <P src="미 회계감사원(2024), 데일리안 2026.10.01">
        세계 최대 경제 대국이 왜 배를 부탁할까요? 미국은 조선업이 쪼그라들어 이제 <B>배를 거의 만들지 못하는 나라</B>가 됐어요. 미국의 조선소와 수리 업체 <B>105곳 중 90곳</B>이 일할 사람을 구하지 못하고 있고, 그 탓에 해군 함정을 제때 고치는 일조차 어려워졌어요.
      </P>
      <P src="뉴시스 2025.11.14, 머니투데이·뉴시스 2026.01.01">
        그래서 한미 관세 협상에서 한국이 약속한 대미 투자 <B>3,500억 달러</B> 가운데 <B>1,500억 달러</B>가 조선 협력 몫으로 잡혔어요. 작년 한 해 한국이 배를 팔아 번 돈(약 320억 달러)의 <B>네 배가 넘는</B> 규모예요. 이 돈을 어디에 얼마씩 쓸지는 아직 공개되지 않았어요.
      </P>

      <Sub>그런데 숫자 하나가 이상해요</Sub>
      <Pic src="paradox" alt="수많은 작은 배를 받는 쪽과 커다란 LNG선 몇 척을 받는 쪽을 비교하는 그림" />
      <P src="클락슨리서치 집계, 아주경제 2026.11.04">
        올해 1~10월 세계에서 주문된 배 가운데 <B>77%를 중국</B>이 가져갔어요. 한국은 <B>15%</B>에 그쳤어요. 숫자만 보면 한국 조선업이 크게 밀리는 것처럼 보여요.
      </P>
      <P src="서울신문 2026.11.02 (3사 = HD한국조선해양·삼성중공업·한화오션)">
        그런데 조선 3사의 성적은 정반대예요. 3분기 영업이익을 합치면 <B>2조 2,713억 원</B>으로 1년 전보다 <B>43.6% 늘었고</B>, 만들어야 할 배도 <B>3년 치 넘게</B> 밀려 있어요.
      </P>
      <div className="rounded-2xl bg-brand-dark px-5 py-5 text-on-primary">
        <p className="type-micro-cap text-on-primary/70">오늘의 수수께끼</p>
        <p className="mt-1.5 type-heading-sm leading-snug [word-break:keep-all]">주문은 중국보다 훨씬 적게 받는데, 한국 조선사는 왜 돈을 더 벌고 일감은 넘칠까요?</p>
      </div>
      <P>이 수수께끼는 조선업이 어떻게 돌아가는지 알면 풀려요. 아래 네 가지 질문을 차례로 따라가 보세요. 마지막 장에서 답을 맞춰 볼게요.</P>
      <ol className="space-y-2">
        {[
          { to: CH.why, q: "조선업은 왜 중요할까?" },
          { to: CH.money, q: "배 한 척, 돈은 어떻게 돌까?" },
          { to: CH.cycle, q: "왜 천국과 지옥을 오갈까?" },
          { to: CH.now, q: "지금 무슨 일이 벌어지고 있을까?" },
        ].map((x, i) => (
          <li key={x.q}>
            <button type="button" onClick={() => go(x.to, true)} className={cn("flex w-full items-center gap-3 rounded-2xl bg-canvas px-4 py-3 text-left shadow-level-1 hover:bg-ev-written-soft", anim)}>
              <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-dark tabular type-caption font-bold text-on-primary">{i + 1}</span>
              <span className="min-w-0 flex-1 type-body-md font-semibold text-ink [word-break:keep-all]">{x.q}</span>
              <ArrowRight className="h-4 w-4 shrink-0 text-ink-mute" strokeWidth={2.2} />
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 1. 왜 중요할까                                                        */
/* ------------------------------------------------------------------ */

function WhyChapter() {
  return (
    <div className="space-y-5">
      <Gist
        items={[
          <>
            LNG선 한 척은 <B>약 3,500억 원</B>이에요.
          </>,
          <>
            배는 한국 수출의 <B>약 4.5%</B>예요. 1등 품목은 아니에요.
          </>,
          <>
            진짜 무게는 <B>일자리와 지역</B>에 있어요.
          </>,
        ]}
      />
      <Sub t={70}>배 한 척은 얼마일까요?</Sub>
      <Pic src="lng" alt="둥근 주황색 탱크를 얹고 바다를 가르는 LNG운반선" />
      <P>
        가장 비싼 배는 <W k="LNG선" />이에요. 영하 163도로 얼린 천연가스를 실어 나르는 배예요. 가스가 새거나 녹지 않도록 배 전체를 거대한 보온병처럼 만들어야 해서, 배 가운데 가장 만들기 어려워요.
      </P>
      <P src="클락슨리서치 2026년 10월 집계, 아주경제 2026.11.04">
        LNG선 한 척 값은 <B>2억 4,500만 달러</B>예요. 환율 1,400원대로 바꾸면 <M>약 3,500억 원</M>이에요.
      </P>
      <So>원유를 200만 배럴씩 싣는 초대형 원유운반선(VLCC) 두 척 값이 LNG선 한 척에 들어가요.</So>
      <Bars
        title="새 배 한 척 값 (2026년 10월, 클락슨리서치)"
        max={245}
        rows={[
          { k: "LNG운반선 (17만 4,000㎥)", v: 245, show: "2억 4,500만 달러 · 약 3,500억 원", hi: true },
          { k: "초대형 컨테이너선 (컨테이너 2만 4,000개)", v: 240, show: "2억 4,000만 달러 · 약 3,400억 원" },
          { k: "VLCC 초대형 원유운반선", v: 131.5, show: "1억 3,150만 달러 · 약 1,900억 원" },
        ]}
        note="원화는 환율 1,400원대로 바꾼 대략값이에요. 컨테이너 2만 4,000개를 싣는 배를 ‘2만 4,000TEU급’이라고 불러요."
      />

      <Sub t={86}>배는 한국 수출에서 얼마나 될까요?</Sub>
      <Pic src="export" alt="수출 컨테이너와 크레인이 늘어선 항구에서 배를 바라보는 사람들" />
      <P src="머니투데이·뉴시스 2026.01.01">
        한국은 작년에 배를 팔아 <B>약 320억 달러</B>를 벌었어요. 1년 전보다 24.9% 늘었고, <B>2018년 이후 가장 많은</B> 금액이에요.
      </P>
      <P>
        한국 전체 수출(7,097억 달러)에서 배가 차지하는 비중은 <B>약 4.5%</B>예요. 수출로 번 1,000원 가운데 45원이 배에서 나온 셈이에요. 반도체(1,734억 달러)의 5분의 1, 자동차(720억 달러)의 절반 안팎이라 수출 1등 산업은 아니에요.
      </P>
      <So>그런데도 조선 뉴스가 이렇게 자주 나오는 건, 수출액보다 더 큰 무게가 따로 있기 때문이에요. 바로 아래에서 볼게요.</So>
      <Note title="선박 수출은 달마다 널뛰어요">
        <p>
          배 수출은 배를 넘겨준 달에 한꺼번에 잡혀요. 그래서 9월에는 <b>37억 6,000만 달러로 29.9% 늘었다가</b>, 10월에는 <b>26억 4,000만 달러로 43.6% 줄었어요</b>.
        </p>
        <p>
          10월 감소는 1년 전 10월에 <W k="해양플랜트" /> 한 건(24억 7,000만 달러)이 한꺼번에 잡혔던 <W k="기저효과" />예요. 한 달 숫자만 보고 ‘조선이 꺾였다’고 읽으면 안 돼요.
        </p>
        <p className="type-caption opacity-75">출처 · 산업통상부 수출입 동향 2026.10.01·11.02</p>
      </Note>

      <Sub t={101}>진짜 무게는 사람과 지역에 있어요</Sub>
      <Pic src="geoje" alt="조선소 옆 상가 거리에서 일을 마친 작업자들이 오가는 모습" />
      <P src="OECD 보고서, 빅데이터뉴스 2026.11.06">
        조선소는 사람이 아주 많이 필요한 공장이에요. 조선업 종사자는 <B>2014년 약 20만 3,000명</B>에서 <B>2024년 약 12만 6,000명</B>으로, 10년 사이 <B>44%</B> 줄었어요.
      </P>
      <P src="프레시안 2026.03.04">
        조선소가 모여 있는 거제를 보면 더 분명해요. 거제의 조선 종사자는 2015년 8만 1,035명에서 2024년 5만 2,009명이 됐어요. <B>셋 중 한 명 넘게</B> 떠난 거예요.
      </P>
      <P src="한국경제 2026.02.19">
        사람이 빠지자 거리도 비었어요. 거제의 상가 공실률은 <B>35.5%</B>로, 전국 평균(10.4%)의 세 배가 넘어요. <M>세 집 건너 한 집이 비어 있는 셈</M>이에요.
      </P>
      <Pic src="vacancy" alt="셔터가 내려진 빈 상가들" />
      <News headline="○○조선 대형 수주에 거제 ‘들썩’">배 한 척은 수천억 원이고, 그 일감에 도시 하나의 식당과 원룸, 학원이 함께 움직여요. 지역 뉴스가 수주 소식에 크게 반응하는 이유예요.</News>
      <Remember>배 한 척은 수천억 원, 수출의 약 4.5%, 그리고 도시 하나의 일자리.</Remember>
      <P>그럼 이렇게 비싼 배는 어떻게 만들어지고, 그 돈은 언제 누구에게 들어갈까요?</P>
      <NextUp to={CH.money}>질문 2. 배 한 척, 돈은 어떻게 돌까</NextUp>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 2. 배 한 척의 여행 — 일곱 정거장                                        */
/* ------------------------------------------------------------------ */

interface Station {
  n: number;
  name: string;
  what: string;
  pic: string;
  alt: string;
  t: number;
  money: string;
  pay: number;
  body: ReactNode;
}

const STATIONS: Station[] = [
  {
    n: 1,
    name: "수주",
    what: "일감을 따내요",
    pic: "order",
    alt: "선장과 조선소 직원이 계약서 앞에서 악수하는 모습",
    t: 151,
    money: "계약금 약 10%",
    pay: 10,
    body: (
      <>
        <T>
          배 주인인 <W k="선주" />가 “이런 배를 몇 척 만들어 주세요” 하고 주문하면, 조선소는 견적을 내고 선주의 신용을 따져 본 뒤 계약해요. 협상에만 몇 달이 걸려요.
        </T>
        <T>
          같은 계약을 선주 쪽에서는 <W k="발주" />, 조선소 쪽에서는 <W k="수주" />라고 불러요. 그래서 ‘3조 원 수주’는 3조 원어치 배를 만들기로 계약했다는 뜻이지, <B>3조 원이 들어왔다는 뜻이 아니에요</B>.
        </T>
        <T src="머니투데이 2026.04.23">
          계약하면 배값의 <B>약 10%</B>를 계약금으로 받아요. 단, 선주는 은행이 써 주는 보증서인 <W k="RG">RG(선수금환급보증)</W>가 있어야 이 돈을 내요. 조선소가 배를 못 만들면 미리 낸 돈을 은행이 대신 돌려준다는 약속이에요. 수출입은행·산업은행·무역보험공사와 시중은행이 RG를 내줘요.
        </T>
      </>
    ),
  },
  {
    n: 2,
    name: "설계",
    what: "도면을 그려요",
    pic: "design",
    alt: "커다란 배 도면 위에서 승인 도장을 찍는 작업자",
    t: 206,
    money: "없음",
    pay: 0,
    body: (
      <>
        <T>
          계약이 끝나면 도면을 그려요. 배의 큰 틀을 정하는 기본 설계부터, 어느 블록을 어떤 순서로 만들지 정하는 생산 설계까지 이어져요. 도면은 민간 검사 기관인 <W k="선급" />의 승인을 받아야 해요. 선급 도장이 없는 배는 보험에 들 수도, 항구에 들어갈 수도 없어요.
        </T>
        <T src="MTN 2025.07.30">
          수주에서 실제 착공까지는 보통 <B>1~2년</B>이 걸려요. 이 기간에는 들어오는 돈도, 장부에 잡히는 매출도 거의 없어요. <M>계약서에는 몇조 원이 적혀 있는데 통장은 조용한 시기</M>예요.
        </T>
      </>
    ),
  },
  {
    n: 3,
    name: "철판",
    what: "후판을 잘라요",
    pic: "steel",
    alt: "두꺼운 철판을 기계로 잘라 내는 공장 안",
    t: 223,
    money: "약 10%",
    pay: 10,
    body: (
      <>
        <T>
          배는 두께 6mm가 넘는 두꺼운 철판, <W k="후판" />으로 만들어요. 포스코·현대제철·동국제강 같은 철강사가 공급해요. 이 후판을 처음 자르는 <W k="스틸커팅" />이 공식 착공이고, 이때 배값의 <B>약 10%</B>를 또 받아요.
        </T>
        <T src="삼일PwC 조선업 가이드북 2026.06, 뉴데일리 2026.04.08">
          후판은 배 원가에서 가장 큰 재료비예요. 선체를 짓는 원가의 <B>약 20%, 많게는 30%</B>를 차지해요.
        </T>
        <So src="뉴데일리 2026.04.08">
          후판값이 톤당 5만 원만 올라도 원가율이 0.3~0.5%포인트 올라요. 1,000원어치를 팔 때 남는 돈이 <b>3~5원 줄어드는</b> 셈이라, 조선사와 철강사의 후판값 협상이 늘 뉴스가 돼요.
        </So>
      </>
    ),
  },
  {
    n: 4,
    name: "블록",
    what: "덩어리로 나눠 만들어요",
    pic: "block",
    alt: "레고처럼 쌓인 주황색 배 조각들을 크레인이 들어 올리는 모습",
    t: 248,
    money: "없음",
    pay: 0,
    body: (
      <>
        <T>
          배는 한 번에 만들지 않아요. 레고처럼 <W k="블록" />이라는 덩어리로 나눠 만든 뒤 합쳐요. 철판 조각을 용접해 작은 블록을 만들고, 그걸 다시 붙여 점점 큰 블록으로 키워요.
        </T>
        <T src="헤럴드경제 2026.01.10">
          이 일은 주로 <W k="사내협력사" />가 맡아요. 조선소 안에서 일하지만 소속은 다른 하청 회사예요. 조선업의 하청 비율은 <B>63.9%</B>로, 전체 산업 평균(17.7%)의 세 배가 넘어요.
        </T>
        <So>조선소에서 일하는 열 명 중 여섯 명 이상이 다른 회사 소속이라는 뜻이에요. 질문 4에서 볼 ‘사람’ 문제와 노사 갈등도 여기서 이어져요.</So>
      </>
    ),
  },
  {
    n: 5,
    name: "도크",
    what: "블록을 쌓아 띄워요",
    pic: "dock",
    alt: "물이 찬 도크에 떠오른 배와 손을 흔드는 작업자들",
    t: 268,
    money: "기공·진수 때 각 약 10%",
    pay: 20,
    body: (
      <>
        <T src="LNG선 도크 공정 기간: 서울대 공개강의">
          <W k="도크" />는 배를 조립하는 거대한 수조예요. 첫 블록을 도크 바닥에 내려놓는 날이 <W k="기공" />, 블록을 다 쌓고 물을 채워 배를 처음 띄우는 날이 <W k="진수" />예요. 기공과 진수 때 배값의 <B>약 10%씩</B> 받아요. LNG선은 도크 안에서만 4~5개월이 걸려요.
        </T>
        <So>도크는 조선소에서 가장 비싼 설비예요. 그래서 ‘도크가 비었다’는 말은 일감이 없다는 뜻이고, 도크를 얼마나 빨리 돌리느냐가 조선소의 실력이에요.</So>
      </>
    ),
  },
  {
    n: 6,
    name: "의장·시운전",
    what: "속을 채우고 달려 봐요",
    pic: "outfit",
    alt: "배를 잘라 본 그림 — 엔진실과 객실을 채우는 작업자들",
    t: 285,
    money: "없음",
    pay: 0,
    body: (
      <>
        <T>
          물에 뜬 배를 부두에 묶어 두고 엔진·배관·전선·객실을 채우는 작업이 <W k="의장" />이에요. 집으로 치면 인테리어와 설비 공사예요. LNG선은 이 과정에 7~8개월이 걸리고, 끝나면 바다에 나가 실제로 달려 보는 <W k="시운전" />을 해요.
        </T>
        <T src="헤럴드경제 2025.05.28 등, 뉴스1 2025.08.22">
          여기에 의외의 사실이 하나 있어요. LNG선의 핵심인 가스 탱크(화물창) 기술은 <B>프랑스 회사 GTT</B>가 사실상 독점하고 있어요. 그래서 LNG선 한 척을 지을 때마다 배값의 약 5%, <B>170억~200억 원</B>을 로열티로 내요. 국산 화물창 기술(KC-1)은 결함 문제로 자리를 잡지 못했어요.
        </T>
        <So>세계 1등이지만 핵심 기술은 아직 빌려 쓰는 셈이에요.</So>
      </>
    ),
  },
  {
    n: 7,
    name: "인도",
    what: "배를 넘기고 남은 돈을 받아요",
    pic: "delivery",
    alt: "깃발을 바꿔 다는 인도식에서 축하하는 사람들",
    t: 308,
    money: "나머지 60~70% 한 번에",
    pay: 60,
    body: (
      <>
        <T>
          선급 검사를 통과하면 조선소 깃발을 내리고 선사 깃발을 올려요. 배의 주인이 바뀌는 이 순간이 <W k="인도" />예요. 그리고 이날 <M>배값의 나머지 60~70%를 한 번에</M> 받아요.
        </T>
        <T src="뉴시스 2026.06.22">
          계약부터 인도까지는 보통 2~3년이 걸려요. 요즘은 도크가 꽉 차서 <B>3~4년</B>까지 늘었어요.
        </T>
      </>
    ),
  },
];

/** 일곱 정거장 한눈에 — 정거장마다 들어오는 돈 */
function StationStrip() {
  return (
    <Card className="px-4 py-4">
      <p className="type-body-md font-bold text-ink">한눈에 보기 — 정거장마다 들어오는 돈</p>
      <ol className="mt-3 grid grid-cols-7 gap-1">
        {STATIONS.map((s) => (
          <li key={s.name} className="flex flex-col items-center gap-1 text-center">
            <span className={cn("inline-flex h-7 w-7 items-center justify-center rounded-full tabular text-[12px] font-bold", s.pay ? "bg-brand-dark text-on-primary" : "bg-canvas-soft text-ink-mute")}>{s.n}</span>
            <span className="text-[11px] leading-tight font-semibold text-ink [word-break:keep-all]">{s.name.replace("·시운전", "")}</span>
            <span className={cn("tabular text-[11px] font-bold", s.pay >= 60 ? "text-[#c2402b]" : s.pay ? "text-primary-text" : "text-ink-mute")}>{s.pay ? `${s.pay}%` : "—"}</span>
          </li>
        ))}
      </ol>
      <p className="mt-2.5 type-caption text-ink-mute [word-break:keep-all]">한화오션 계약 사례(10-10-10-10-60) 기준이에요. 계약마다 달라서 보통 인도 전 30~40%, 인도 날 60~70%예요.</p>
    </Card>
  );
}

/** 돈이 들어오는 순서 — 받은 돈(계단)과 들어간 돈(비스듬한 선)의 차이를 조선사가 메워요 (개념도) */
function PayChart() {
  // 0~100 (시간), 받은 돈 누적 %
  const steps = [
    { x: 0, label: "계약", v: 10 },
    { x: 34, label: "스틸커팅", v: 20 },
    { x: 52, label: "기공", v: 30 },
    { x: 70, label: "진수", v: 40 },
    { x: 100, label: "인도", v: 100 },
  ];
  const W0 = 40;
  const W1 = 330;
  const H0 = 20;
  const H1 = 170;
  const X = (x: number) => W0 + (x / 100) * (W1 - W0);
  const Y = (v: number) => H1 - (v / 100) * (H1 - H0);
  let path = `M${X(0)} ${Y(0)}`;
  steps.forEach((s, i) => {
    path += ` L${X(s.x)} ${Y(i === 0 ? 0 : steps[i - 1].v)} L${X(s.x)} ${Y(s.v)}`;
  });
  const cost = `M${X(0)} ${Y(0)} L${X(100)} ${Y(100)}`;
  return (
    <Card>
      <div className="flex items-start justify-between gap-2">
        <p className="type-heading-sm text-ink [word-break:keep-all]">돈은 이렇게 들어와요</p>
        <Tag kind="view" />
      </div>
      <p className="mt-1 type-caption text-ink-mute [word-break:keep-all]">한화오션 계약 사례의 ‘10-10-10-10-60’을 그린 개념도예요 (딜사이트 2025.01.02). 실제 비율은 계약마다 달라서 보통 인도 전 30~40%, 인도 날 60~70%예요 (딜사이트 2026.01.14).</p>
      <svg viewBox="0 0 360 200" className="mt-3 h-auto w-full" role="img" aria-label="받은 돈은 계약·스틸커팅·기공·진수 때 10%씩 계단처럼 오르다 인도 날 60%가 한 번에 들어와요. 들어간 돈은 처음부터 고르게 늘어서, 그 사이를 조선사가 자기 돈과 빚으로 메워요.">
        <polygon
          points={[
            [10, 10],
            [100, 100],
            [100, 40],
            [70, 40],
            [70, 30],
            [52, 30],
            [52, 20],
            [34, 20],
            [34, 10],
          ]
            .map(([x, v]) => `${X(x)},${Y(v)}`)
            .join(" ")}
          fill="#ff9d86"
          opacity=".28"
        />
        <line x1={W0} y1={H1} x2={W1} y2={H1} stroke="#c9cbe0" strokeWidth="1.5" />
        <path d={cost} stroke="#e5533c" strokeWidth="2.5" strokeDasharray="6 5" fill="none" />
        <path d={path} stroke="#533afd" strokeWidth="3.5" fill="none" strokeLinejoin="round" />
        {steps.map((s) => (
          <g key={s.label}>
            <circle cx={X(s.x)} cy={Y(s.v)} r="4.5" fill="#533afd" />
            <text x={X(s.x)} y={H1 + 16} textAnchor="middle" fontSize="11" fill="#5b6080">
              {s.label}
            </text>
          </g>
        ))}
        <text x={X(100) - 4} y={Y(100) - 8} textAnchor="end" fontSize="12" fontWeight="700" fill="#533afd">
          마지막 날 +60%
        </text>
        <text x={X(58)} y={Y(66) - 6} textAnchor="middle" fontSize="11" fill="#c2402b">
          들어간 돈
        </text>
        <text x={W0 - 6} y={Y(100) + 4} textAnchor="end" fontSize="10" fill="#8a8fb5">
          100%
        </text>
        <text x={W0 - 6} y={Y(0) + 4} textAnchor="end" fontSize="10" fill="#8a8fb5">
          0
        </text>
      </svg>
      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 type-caption text-ink-secondary">
        <span className="flex items-center gap-1.5">
          <span className="h-1 w-5 rounded bg-primary" />
          받은 돈
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-5 border-t-2 border-dashed border-[#e5533c]" />
          들어간 돈 (공정만큼 고르게 늘어난다고 단순화)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-[#ff9d86]/40" />
          조선사가 먼저 메우는 돈
        </span>
      </div>
    </Card>
  );
}


function MoneyChapter() {
  return (
    <div className="space-y-5">
      <Gist
        items={[
          <>
            배 한 척은 <B>일곱 정거장</B>을 거쳐 2~3년 만에 태어나요.
          </>,
          <>
            돈은 나눠서 들어오고, <B>60~70%는 배를 넘기는 마지막 날</B> 들어와요.
          </>,
          <>
            그래서 <B>올해 이익은 2~3년 전 계약</B>이 만들어요.
          </>,
        ]}
      />
      <P>배 한 척이 태어나는 과정을 따라가 볼게요. 정거장마다 무슨 일이 일어나는지, 그리고 그때 조선소에 돈이 얼마나 들어오는지 함께 보면 조선업이 한눈에 들어와요.</P>
      <StationStrip />
      <ol className="space-y-4">
        {STATIONS.map((s, i) => (
          <li key={s.name} className="overflow-hidden rounded-3xl bg-canvas shadow-level-1">
            {/* eslint-disable-next-line @next/next/no-img-element -- 영상에 쓴 장면 그림 */}
            <img src={`/magazine/ship/${s.pic}.webp`} width={1200} height={675} alt={s.alt} loading="lazy" decoding="async" className="block h-auto w-full" />
            <div className="px-4 pt-4 pb-5 sm:px-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand-dark tabular type-body-md font-bold text-on-primary">{s.n}</span>
                <p className="type-heading-sm text-ink">
                  {s.name} <span className="font-normal text-ink-secondary">— {s.what}</span>
                </p>
                <span className="ml-auto">
                  <At t={s.t} />
                </span>
              </div>
              <p className={cn("mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 type-caption font-bold", s.pay ? "bg-[#fff4d6] text-[#7a4a00]" : "bg-canvas-soft text-ink-mute")}>
                <span aria-hidden>₩</span> 이때 들어오는 돈 · {s.money}
              </p>
              <div className="mt-3 space-y-3">{s.body}</div>
              {s.n === 1 && (
                <div className="mt-3 space-y-3">
                  <Note>
                    <p>전세 계약과 같아요. 집주인이 보증보험을 들어야 세입자가 안심하고 보증금을 내잖아요. 선주에게는 RG가 그 보증보험이에요.</p>
                  </Note>
                  <Pic src="kship" alt="창밖으로 날아가는 계약서를 붙잡으려는 작업자" />
                  <T src="딜사이트 2026.05.18">
                    RG가 얼마나 중요한지 보여 주는 사례가 있어요. 2022년 케이조선은 컨테이너선 8척을 따내고도 RG를 받지 못해 <B>계약이 무산됐어요</B>.
                  </T>
                  <So>RG가 없으면 수주도 없어요. ‘RG 발급 지원’ 뉴스가 자주 나오는 이유예요.</So>
                </div>
              )}
            </div>
            {i < STATIONS.length - 1 && (
              <div aria-hidden className="flex justify-center pb-2 text-primary">
                <ArrowDown className="h-5 w-5" strokeWidth={2.4} />
              </div>
            )}
          </li>
        ))}
      </ol>

      <Sub t={314}>마지막 날 60%, 이게 핵심이에요</Sub>
      <P src="딜사이트 2026.01.14">
        일곱 정거장을 정리하면, 배를 넘기기 전에 나눠 받는 돈(<W k="선수금" />)은 <B>30~40%</B>뿐이에요. 나머지 <M>60~70%는 배를 넘기는 날</M> 들어와요. 꼬리가 무겁다는 뜻에서 이런 방식을 <W k="헤비테일" />이라고 불러요.
      </P>
      <PayChart />
      <P>
        결국 조선소는 2~3년 동안 <B>자기 돈이나 빚으로 배를 먼저 짓는</B> 셈이에요. 계약금을 받으려면 RG가, 마지막 날까지 버티려면 대출이 필요해요. 조선업이 은행 없이 굴러가지 않는 이유예요.
      </P>
      <Note kind="industry" title="호황에는 앞쪽 비율이 올라가요">
        <p>업계에서는 배를 사려는 선주가 줄을 서는 호황기에는 계약 때 미리 받는 비율이 올라간다고 말해요.</p>
      </Note>

      <Sub t={331}>그래서 “사상 최대 이익”은 2~3년 전 성적표예요</Sub>
      <Pic src="record" alt="‘사상 최대’ 기사가 실린 신문을 읽는 작업자" />
      <P src="MTN 2025.07.30">
        조선사는 배를 넘긴 날이 아니라 <B>만든 만큼 매년 나눠서</B> 매출을 잡아요. 이걸 <W k="진행률매출">진행률 매출</W>이라고 해요. 예를 들어 2,000억 원짜리 배를 2년에 걸쳐 짓는데 첫해에 절반을 만들었다면, 그해 매출은 1,000억 원이에요.
      </P>
      <P src="헤럴드경제 2025.07.26">
        그래서 올해 실적에는 <B>2023~2024년에 비싸게 받은 계약</B>이 찍혀 있어요. 값이 쌀 때인 2021년에 받은 배들은 2025년 4분기에 대부분 다 만들어졌고요.
      </P>
      <News headline="조선사 영업이익 사상 최대">올해 장사를 특별히 잘했다는 뜻이 아니라, 2~3년 전에 비싼 계약을 잘 따냈다는 뜻이에요. 그래서 실적 뉴스와 수주 뉴스는 따로 읽어야 해요.</News>

      <Sub>달러로 받고 원화로 줘요</Sub>
      <Pic src="fx" alt="환율 계산기를 두드리는 작업자" />
      <P>
        배값은 <B>달러</B>로 받는데, 월급과 철판값은 <B>원화</B>로 나가요. 그래서 환율이 오르면(원화 약세) 같은 배를 팔아도 원화 매출이 커지고, 환율이 내리면 줄어요.
      </P>
      <P src="MTN 2026.06.20">
        2026년 6월 삼성중공업의 LNG선은 달러 값이 2억 6,000만 달러에서 2억 5,200만 달러로 내렸어요. 그런데도 환율 덕분에 원화로는 <B>9.9% 더 비쌌어요</B>.
      </P>
      <P src="비즈니스워치 2026.10.29, 딜사이트 2026.10.30">
        반대로 3분기에는 평균 환율이 약 1,418원으로 2분기(1,502원)보다 내려가면서, HD현대중공업이 환율 때문에만 <B>약 450억 원</B>을 덜 벌었어요.
      </P>
      <So src="딜사이트 2026.01.14">
        그래서 조선사들은 미리 환율을 고정해 두는 <W k="환헤지" />를 해요. 다만 비율은 회사마다 크게 달라요. 2025년 3분기 누적으로 HD한국조선해양은 약 50%, 삼성중공업은 100%, 한화오션은 0%였어요.
      </So>

      <Sub t={356}>이 비싼 배는 누가 살까요?</Sub>
      <Pic src="greece" alt="하얀 집이 늘어선 그리스 항구에 정박한 배들" />
      <P src="헤럴드경제 2026.06.01, 아주경제 2021.12.17">
        가장 큰손은 <B>그리스 선주</B>들이에요. 배 5,543척, 세계 <W k="선복량" />의 <B>21%</B>를 갖고 있어요. 2021년 한국 조선소에 쌓인 주문(661억 달러)의 약 20%도 그리스 선주가 낸 것이었어요.
      </P>
      <P src="뉴스토마토 2026.04.01">
        선주는 배값을 대부분 대출로 마련해요. 배 자체를 담보로 잡는 이 대출을 <W k="선박금융" />이라고 해요. 외국 선주가 한국 배를 사도록 수출입은행이 대출과 보증을 대 주는데, 2025년에만 <B>12조 원</B>이었어요. 현대차가 외국 손님에게 차를 팔 때 현대캐피탈이 할부를 붙여 주는 것과 같은 구조예요.
      </P>
      <Pic src="charter" alt="자동차운반선의 경사로로 차들이 줄지어 들어가는 모습" />
      <P src="중앙일보 2026.05.06">
        배 주인과 실제로 배를 모는 회사가 다를 때도 많아요. 배를 빌려 쓰는 걸 <W k="용선" />이라고 하는데, 배 세계의 전세·월세예요. 세계 최대 자동차운반선 ‘글로비스 리더’호는 주인이 HMM이지만, 현대글로비스가 오래 빌려 운항해요. 배를 지은 곳은 중국 조선소예요.
      </P>

      <Sub t={377}>배 한 척에 붙는 회사들</Sub>
      <Card>
        <ul className="space-y-2.5 type-body-md text-ink [word-break:keep-all]">
          {[
            ["철판", "포스코·현대제철·동국제강 같은 철강사"],
            ["엔진", "HD현대·한화엔진 같은 엔진 회사"],
            ["가스 탱크 기술", "프랑스 GTT (척당 로열티 170억~200억 원)"],
            ["장비·부품", "보냉재 같은 기자재 회사들 (국내 약 320곳)"],
            ["검사", "한국선급(KR)·노르웨이 DNV·미국 ABS 같은 선급"],
            ["돈", "RG와 선박금융을 내주는 수출입은행·무역보험공사·산업은행·시중은행"],
            ["사람", "조선소 직원, 사내협력사, 그리고 외국인 노동자"],
          ].map(([k, v]) => (
            <li key={k} className="grid grid-cols-[6.5rem_1fr] gap-2">
              <span className="font-bold text-primary-text">{k}</span>
              <span className="text-ink-secondary">{v}</span>
            </li>
          ))}
        </ul>
      </Card>
      <P>
        배 한 척이 뜨면 철강사부터 은행, 거제의 식당까지 함께 움직여요. 이 여행 전체를 업계에서는 <W k="밸류체인" />이라고 불러요.
      </P>
      <Remember>조선업은 돈을 마지막에 받는 장사예요. 오늘의 이익은 2~3년 전 계약이 만들어요.</Remember>
      <P>주문과 돈 사이에 이렇게 시차가 있다 보니 독특한 일이 생겨요. 10년마다 천국과 지옥을 오가는 거예요.</P>
      <NextUp to={CH.cycle}>질문 3. 왜 천국과 지옥을 오갈까</NextUp>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 3. 천국과 지옥                                                        */
/* ------------------------------------------------------------------ */

const LOOP = [
  { t: "운임이 오른다", d: "배로 짐을 나르는 값이 뛰면 선주들이 돈을 벌어요." },
  { t: "한꺼번에 주문한다", d: "선주들이 너도나도 새 배를 주문해요. 조선소는 호황이에요." },
  { t: "2~3년 뒤 배가 쏟아진다", d: "주문한 배들이 한꺼번에 바다로 나와요. 배가 남아돌아요." },
  { t: "운임이 떨어지고 주문이 끊긴다", d: "남는 배 때문에 운임이 내려가고, 조선소에는 일감 절벽이 와요." },
];

const ERAS: { when: string; title: string; pic: string; alt: string; t?: number; text: ReactNode; src: string }[] = [
  {
    when: "1971~1972",
    title: "모래사장에서 배부터 팔다",
    pic: "beach",
    alt: "바닷가 모래사장에서 도면을 펼쳐 놓고 이야기하는 두 사람",
    t: 429,
    text: (
      <>
        울산의 모래사장에서 시작했어요. 일화로 전해지는 이야기로는, 정주영 회장이 영국에서 500원 지폐 속 거북선을 보여 주며 <B>4,300만 달러</B> 차관을 요청했다고 해요. 그리고 그리스 선주에게 26만 톤 유조선 두 척을 먼저 판 뒤, <B>1972년 3월 23일</B> 울산조선소를 짓기 시작했어요. <M>공장도 없이 배부터 판</M> 셈이에요.
      </>
    ),
    src: "아주경제 2020.06.15",
  },
  {
    when: "1983~2000년대",
    title: "세계 1등",
    pic: "top",
    alt: "조선소 앞에서 환호하는 작업자들",
    t: 452,
    text: (
      <>
        <B>1983년</B> 현대중공업이 일본 미쓰비시를 제치고 세계 1위에 올랐어요. 2000년대 내내 한국은 1등을 다퉜고, 2008년 9월에는 새 배 값 지수가 <B>191.6</B>까지 올라 지금도 역대 최고 기록으로 남아 있어요.
      </>
    ),
    src: "아주경제 2020.06.15, 파이낸스스코프 2024.08.27",
  },
  {
    when: "2012~2016",
    title: "중국 추월과 수주절벽",
    pic: "cliff",
    alt: "비 내리는 텅 빈 도크 앞에 우산을 쓰고 선 작업자",
    t: 463,
    text: (
      <>
        2012년부터 1등은 중국으로 넘어갔어요. 2016년에는 주문이 뚝 끊기는 <W k="수주절벽" />이 왔어요. 그해 세계 발주는 약 1,100만 CGT로, 1996년 집계를 시작한 이래 <B>가장 적었어요</B>. 조선업 종사자는 2014년 20만 명에서 2022년 9만 명으로 <B>절반 넘게</B> 줄었어요. 거제의 식당들이 문을 닫던 시기예요.
      </>
    ),
    src: "뉴데일리 2019.01.04, 비즈니스워치 2017.02.17, 헬로티 2022.10.23",
  },
  {
    when: "2018~2021",
    title: "회복과 슈퍼사이클",
    pic: "super",
    alt: "다시 바빠진 조선소에서 블록을 옮기는 크레인",
    t: 480,
    text: (
      <>
        2018~2020년 한국은 3년 연속 1위를 되찾았어요. 2021년에는 한국 수주가 약 1,740만 CGT로 1년 전보다 <B>112%</B> 뛰었어요. 이때부터를 <W k="슈퍼사이클" />이라고 불러요. 다만 점유율 1위는 2021년에 다시 중국이 가져갔어요.
      </>
    ),
    src: "디지털타임스 2022.01.02, 산업부(아시아경제 2022.01.08)",
  },
  {
    when: "2022~2025",
    title: "판이 다시 짜이다",
    pic: "big3",
    alt: "서로 다른 색 크레인 세 대가 선 조선소들",
    text: (
      <>
        2022년 1월 유럽연합이 LNG선 독점을 우려해 현대중공업과 대우조선해양의 합병을 막았어요. 2023년 5월에는 한화가 대우조선해양을 인수해 <B>한화오션</B>이 됐고, 2025년 12월에는 HD현대중공업이 HD현대미포를 합쳤어요. 그리고 2025년 선박 수출은 2018년 이후 최대를 기록했어요.
      </>
    ),
    src: "세계일보 2022.01.13, 뉴데일리 2023.05.25, 비즈니스워치 2026.10.28",
  },
];

function CycleChapter() {
  return (
    <div className="space-y-5">
      <Gist
        items={[
          <>
            배는 20~30년을 써서, 주문이 <B>한꺼번에 몰렸다가 한꺼번에 끊겨요</B>.
          </>,
          <>한국 조선 50년은 이 파도의 역사예요.</>,
          <>
            지금은 코로나·환경 규제·전쟁이 겹친 <B>호황 5년 차</B>예요.
          </>,
        ]}
      />
      <P src="EY한영 2026.08, 삼일PwC 2026.06">
        배는 한 번 사면 <B>20~30년</B>을 써요. 그래서 새 배 주문은 매년 고르게 나오지 않고, 한꺼번에 몰렸다가 한꺼번에 끊겨요. 조선업이 <M>10년 안팎을 주기로 호황과 불황을 되풀이</M>하는 이유예요.
      </P>
      <Card>
        <p className="type-heading-sm text-ink">호황과 불황은 이렇게 돌아요</p>
        <ol className="mt-3 grid gap-2 sm:grid-cols-2">
          {LOOP.map((x, i) => (
            <li key={x.t} className="rounded-xl bg-canvas-soft px-3.5 py-3">
              <p className="flex items-center gap-2 type-body-md font-bold text-ink [word-break:keep-all]">
                <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-dark tabular text-[12px] text-on-primary">{i + 1}</span>
                {x.t}
              </p>
              <p className="mt-1 type-caption text-ink-secondary [word-break:keep-all]">{x.d}</p>
            </li>
          ))}
        </ol>
        <p className="mt-2.5 type-caption text-ink-mute [word-break:keep-all]">4번 다음은 다시 1번이에요. 출처 · 한국해양수산개발원(KMI) 2024.10.30</p>
      </Card>
      <Note kind="industry" title="왜 이렇게 극단적일까">
        <p>업계에서는 배를 만들 수 있는 양이 도크 수로 정해져 있어서라고 설명해요. 도크를 하루아침에 늘릴 수 없으니, 주문이 늘거나 줄면 그 충격이 배 값에 그대로 실린다는 거예요.</p>
        <p className="type-caption opacity-75">엄경아 신영증권 연구원, 헤럴드경제 2025.10.06</p>
      </Note>

      <Sub t={429}>한국 조선 50년, 다섯 장면</Sub>
      <P>한국 조선업의 50년이 딱 이 파도 위에 있었어요.</P>
      <ol className="space-y-4">
        {ERAS.map((e) => (
          <li key={e.when} className="overflow-hidden rounded-3xl bg-canvas shadow-level-1">
            {/* eslint-disable-next-line @next/next/no-img-element -- 영상에 쓴 장면 그림 */}
            <img src={`/magazine/ship/${e.pic}.webp`} width={1200} height={675} alt={e.alt} loading="lazy" decoding="async" className="block h-auto w-full" />
            <div className="px-4 pt-4 pb-5 sm:px-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-ev-written-soft px-2.5 py-0.5 tabular type-caption font-bold text-primary-text">{e.when}</span>
                <p className="type-heading-sm text-ink [word-break:keep-all]">{e.title}</p>
                {e.t != null && (
                  <span className="ml-auto">
                    <At t={e.t} />
                  </span>
                )}
              </div>
              <div className="mt-2.5">
                <T src={e.src}>{e.text}</T>
              </div>
            </div>
          </li>
        ))}
      </ol>
      <p className="px-1 type-caption text-ink-mute [word-break:keep-all]">거북선이 세계 최초의 철갑선이라는 이야기는 사료 근거가 약하다는 지적이 있어서(주간경향 2026.08.14), 첫 장면은 ‘일화로 전해지는 이야기’로만 적었어요.</p>

      <Sub t={488}>이번 호황에는 이유가 세 개 겹쳤어요</Sub>
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { pic: "covid", alt: "컨테이너가 높이 쌓인 항구", title: "① 코로나", text: <>운임이 치솟으면서 컨테이너선 월평균 발주가 코로나 전 10만 TEU에서 2021년 3월 113만 TEU로 <B>열 배 넘게</B> 늘었어요.</>, src: "KMI 2024.10.30" },
          { pic: "green", alt: "바다에 줄지어 선 낡은 배들", title: "② 환경 규제", text: <>탄소를 덜 내는 배로 바꿔야 해요. LNG선 880척 가운데 약 25%, <B>네 척 중 한 척</B>이 해체를 기다리고 있어요.</>, src: "한국경제 2025.07.22" },
          { pic: "war", alt: "해 질 녘 바다 위 유조선과 높이 뜬 가격표", title: "③ 중동 전쟁", text: <>VLCC 하루 운임이 6만 8,146달러(2025년 10월)에서 42만 3,736달러(2026년 3월)로 뛰었어요. 5년 된 중고 배가 <B>새 배보다 비싸졌어요</B>.</>, src: "한국경제 2026.03.16" },
        ].map((x) => (
          <div key={x.title} className="overflow-hidden rounded-2xl bg-canvas shadow-level-1">
            {/* eslint-disable-next-line @next/next/no-img-element -- 영상에 쓴 장면 그림 */}
            <img src={`/magazine/ship/${x.pic}.webp`} width={1200} height={675} alt={x.alt} loading="lazy" decoding="async" className="block h-auto w-full" />
            <div className="px-3.5 pt-3 pb-3.5">
              <p className="type-body-md font-bold text-ink">{x.title}</p>
              <p className="mt-1 type-caption leading-relaxed text-ink-secondary ko-justify">{x.text}</p>
              <p className="mt-1 type-caption text-ink-mute">출처 · {x.src}</p>
            </div>
          </div>
        ))}
      </div>
      <P src="아주경제 2026.11.04, 데일리안 2026.01.13">
        그 결과 올해 1~10월 세계 발주는 1년 전보다 <B>61% 늘었어요</B>. 그런데 1월에 수출입은행 해외경제연구소가 내놓은 전망은 <B>‘14.6% 감소’</B>였어요.
      </P>
      <So>전문가의 전망도 이만큼 빗나갈 수 있어요. 이걸 기억해 두면, 질문 4에서 볼 ‘호황이 언제 끝날까’ 논쟁도 한결 차분하게 읽혀요.</So>
      <Remember>주문이 몰리면 몇 년 뒤 배가 넘치고, 그래서 천국과 지옥이 번갈아 와요. 지금은 천국 쪽 5년 차예요.</Remember>
      <P>그래서 다들 묻죠. 이 호황, 언제 끝날까요?</P>
      <NextUp to={CH.now}>질문 4. 지금 무슨 일이 벌어지고 있을까</NextUp>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 4. 지금                                                               */
/* ------------------------------------------------------------------ */

function ShareView() {
  const [by, setBy] = useState<"cgt" | "ships">("cgt");
  return (
    <Card>
      <div className="flex items-start justify-between gap-2">
        <p className="type-heading-sm text-ink [word-break:keep-all]">2026년 1~10월, 누가 얼마나 받았나</p>
      </div>
      <div role="tablist" aria-label="세는 기준" className="mt-3 grid grid-cols-2 gap-1 rounded-xl bg-canvas-soft p-1">
        {(
          [
            ["cgt", "일감 크기(CGT)로"],
            ["ships", "배 숫자(척)로"],
          ] as const
        ).map(([k, label]) => (
          <button key={k} type="button" role="tab" aria-selected={by === k} onClick={() => setBy(k)} className={cn("rounded-lg px-2 py-2 type-body-md font-semibold", anim, by === k ? "bg-canvas text-ink shadow-level-1" : "text-ink-secondary")}>
            {label}
          </button>
        ))}
      </div>
      <div key={by} className="mt-3 motion-safe:animate-[kk-fade-in_.3s_ease-out]">
        {by === "cgt" ? (
          <Bars
            title="세계 7,969만 CGT 가운데"
            max={6103}
            rows={[
              { k: "중국", v: 6103, show: "6,103만 CGT · 77%" },
              { k: "한국", v: 1191, show: "1,191만 CGT · 15%", hi: true },
            ]}
            note="클락슨리서치, 아주경제·디지털데일리 2026.11.04"
          />
        ) : (
          <Bars
            title="세계 2,859척 가운데"
            max={2238}
            rows={[
              { k: "중국", v: 2238, show: "2,238척" },
              { k: "한국", v: 296, show: "296척 · 약 10%", hi: true },
            ]}
            note="같은 집계를 배 숫자로 센 거예요. 한국은 척수로는 10% 안팎인데 CGT로는 15%예요. 한 척 한 척이 크고 어려운 배라는 뜻이에요."
          />
        )}
      </div>
    </Card>
  );
}


const US_STEPS: { name: string; pic: string; alt: string; text: ReactNode; src: string }[] = [
  {
    name: "1단계 · 고쳐 주기 (MRO)",
    pic: "masga",
    alt: "부두에 선 군함을 정비하는 작업자들",
    text: (
      <>
        있는 군함을 고쳐 주는 일이에요. 미 해군 화물보급함 <B>14척 가운데 최소 6척</B>의 정비를 한국 조선사가 따냈어요. 다만 업계에서는 ‘연 170억 달러 시장’이라는 숫자가 부풀려졌다는 평가도 나와요.
      </>
    ),
    src: "데일리안 2026.10.30, MTN 2026.10.14",
  },
  {
    name: "2단계 · 미국 조선소 사기",
    pic: "philly",
    alt: "새 크레인을 세우는 미국의 조선소와 여러 나라 작업자들",
    text: (
      <>
        한화는 2024년 12월 미국 필라델피아의 필리조선소를 <B>약 1억 달러</B>에 샀고, 2025년 8월 <B>50억 달러(약 7조 원)</B> 추가 투자를 발표했어요. 1년에 한두 척 만들던 곳을 <B>20척</B>까지 늘리겠다는 목표예요. 10월 말에는 한화디펜스USA가 미 해군 중형상륙함 1척(옵션 3척 추가)을 짓는 약 2억 6,900만 달러 계약을 따냈어요. 해군의 선박 건조를 관리하는 업체와 맺은 계약으로, 필리조선소를 산 뒤 처음 짓게 된 미 해군 함정이에요.
      </>
    ),
    src: "헤럴드경제 2026.05.14, 서울신문 2026.10.23, 뉴스토마토 2026.11.01",
  },
  {
    name: "3단계 · 새로 짓기",
    pic: "jones",
    alt: "법전을 든 작업자와 손바닥을 내밀어 막는 배",
    text: (
      <>
        HD현대는 10월 22일 미국 건설사 키윗과 합작해 <B>‘HD키윗조선’</B>을 만들고, 멕시코만과 이어지는 부지에 새 조선소를 짓겠다고 했어요. <B>2027년 착공, 2029년 가동, 고용 3,000명</B>이 목표예요. 최종 부지와 투자액은 아직 발표되지 않았어요.
      </>
    ),
    src: "서울신문 2026.10.23",
  },
];

const US_DATES = [
  { when: "2026.03.12", what: "대미투자특별법 통과. 한미전략투자공사를 세우고 1,500억 달러를 조선에 집중 (뉴스토마토 2026.03.12)" },
  { when: "2026.07", what: "미 국방부·해군이 한국 조선사에 첫 정보 요청. 7월 23일 워싱턴에 한미조선협력센터 문을 엶 (뉴스토마토 2026.07.08, 머니투데이 2026.07.26)" },
  { when: "2026.08.13", what: "트럼프 각서 — 미국에 조선소를 짓거나 과반을 인수한 외국 조선사는 본국에서 함정을 최대 2척 지을 수 있게 함 (머니투데이 2026.08.14)" },
  { when: "2026.10.22", what: "HD현대·키윗 ‘HD키윗조선’ 합작 발표 (서울신문 2026.10.23)" },
  { when: "2026.10 말", what: "한화디펜스USA, 미 해군 중형상륙함 건조 계약 (뉴스토마토 2026.11.01)" },
];

function NowChapter() {
  return (
    <div className="space-y-5">
      <Gist
        items={[
          <>
            중국과 한국은 <B>잘하는 배가 달라요</B>. 점유율 숫자만 보면 오해해요.
          </>,
          <>
            미국과의 협력은 고치고 → 사고 → 짓는 순서이고, <B>돈은 2028년 이후</B>에 보여요.
          </>,
          <>
            <B>12월 4일 IMO 표결</B>과 인력난이 다음 변수예요.
          </>,
        ]}
      />
      <P>지금 조선업에서 벌어지는 일은 크게 다섯 가지예요. 궁금한 것부터 눌러서 바로 가도 돼요.</P>
      <Jumps
        items={[
          { id: "ship-china", label: "① 중국" },
          { id: "ship-us", label: "② 미국" },
          { id: "ship-green", label: "③ 환경 규제" },
          { id: "ship-people", label: "④ 사람" },
          { id: "ship-peak", label: "⑤ 호황은 언제까지" },
        ]}
      />

      <Sub t={546} id="ship-china">
        ① 중국 — 77% 대 15%, 그대로 읽으면 안 돼요
      </Sub>
      <Pic src="china" alt="끝없이 늘어선 배들이 건조 중인 대형 조선소" />
      <P src="SBS Biz 2026.09.04">
        8월 한 달은 세계 주문의 <B>85%</B>를 중국이, <B>7%</B>를 한국이 가져갔어요. 숫자만 보면 무섭지만, 이 숫자는 <W k="CGT" />라는 단위로 센 거예요.
      </P>
      <P>CGT는 배의 크기에 ‘만들기 어려운 정도’를 곱한 단위예요. 같은 크기라도 손이 많이 가는 LNG선은 크게, 석탄을 나르는 단순한 벌크선은 작게 계산돼요. 그런데 배 숫자로 세면 또 달라져요.</P>
      <ShareView />
      <P src="아주경제 2026.11.04">
        한 척씩 비교하면 차이가 더 분명해요. 10월에 한국이 받은 배는 한 척에 <B>약 4만 9,000CGT</B>, 중국은 <B>약 2만 7,000CGT</B>였어요.
      </P>
      <So>
        <b>한국 배 한 척이 중국 배 1.8척어치 일감</b>이에요. 한국은 적게 받되 크고 비싼 배를 받고 있다는 뜻이에요.
      </So>
      <Pic src="korea" alt="한국 조선소에서 건조 중인 커다란 LNG선들" />
      <P src="헤럴드경제 2026.03.06">
        두 나라는 잘하는 배도 달라요. <W k="벌크선" />·<W k="컨테이너선" />·자동차운반선은 중국이 장악했고, 초대형 원유운반선(VLCC)도 올해 3월까지 <B>47척 중 44척</B>이 중국 몫이었어요.
      </P>
      <P src="더팩트 2026.06.17, 이코노미스트 2026.09.14">
        한국은 비싸고 어려운 배에 집중해요. 올해 1~5월 초대형 LPG선 46척 중 <B>37척(80%)</B>을 한국 3사가 받았고, 2021~2025년에 인도된 LNG선의 <B>84%(248척)</B>가 한국 배였어요.
      </P>
      <P src="데일리안 2026.10.12, 사이프러스쇼핑뉴스 2026.10.30">
        다만 겹치는 영역이 생기고 있어요. 올해 9월 18일까지 발주된 LNG선 66척 가운데 <B>26척은 중국</B>이 가져갔어요. 중국 장난조선은 LNG선을 시장 기준가보다 약 8% 싼 2억 2,500만 달러에 수주했다는 보도도 있어요.
      </P>
      <News headline="한국 조선 점유율 급락">한국이 망했다는 뜻이 아니라, 중국이 싼 배를 아주 많이 받았다는 뜻일 때가 많아요. 척당 CGT와 배 종류를 같이 보면 돼요.</News>

      <Sub t={608} id="ship-us">
        ② 미국 — 마스가, 그리고 세 단계
      </Sub>
      <P src="Holland & Knight 2026.10.26 (미 연방관보 10.26 게재)">
        미국은 조선업이 쪼그라든 사이 중국 견제에 나섰어요. 중국 배가 미국 항구에 들어올 때마다 수수료를 물리기로 했다가, 미중 합의로 시행을 계속 미루고 있어요. 10월 말에는 <B>2027년 1월 9일까지</B> 다시 미루는 안을 냈고, 그 뒤는 아직 정해지지 않았어요.
      </P>
      <P src="뉴시스 2025.11.14">
        중국을 견제하면서도 배는 필요하니, 미국이 손을 내민 곳이 한국이에요. 여기서 나온 이름이 <W k="MASGA">마스가(MASGA)</W>예요. ‘미국 조선업을 다시 위대하게’라는 구호이자, 한국이 제안한 조선 협력 패키지 이름이에요. 2025년 11월 한미 공동 팩트시트에는 정비(MRO), 인력 양성, 조선소 현대화, 그리고 한국에서 미국 배를 지을 가능성까지 담겼어요.
      </P>
      <P>
        그런데 왜 한국에서 배를 지어 보내지 않을까요? <W k="존스법" /> 때문이에요. 미국 항구 사이를 오가는 배는 미국에서 만들어야 한다는 1920년 법이에요. 그래서 한국 조선사들은 <M>미국 땅 안에서 세 단계로</M> 들어가고 있어요.
      </P>
      <ol className="space-y-4">
        {US_STEPS.map((x) => (
          <li key={x.name} className="overflow-hidden rounded-3xl bg-canvas shadow-level-1">
            {/* eslint-disable-next-line @next/next/no-img-element -- 영상에 쓴 장면 그림 */}
            <img src={`/magazine/ship/${x.pic}.webp`} width={1200} height={675} alt={x.alt} loading="lazy" decoding="async" className="block h-auto w-full" />
            <div className="px-4 pt-4 pb-5 sm:px-5">
              <p className="type-heading-sm text-ink [word-break:keep-all]">{x.name}</p>
              <div className="mt-2">
                <T src={x.src}>{x.text}</T>
              </div>
            </div>
          </li>
        ))}
      </ol>
      <Fold title="한미 조선 협력, 올해 날짜로 보기">
        <ol className="space-y-2">
          {US_DATES.map((d) => (
            <li key={d.when} className="grid grid-cols-[5.5rem_1fr] gap-2 type-body-md [word-break:keep-all]">
              <span className="tabular font-bold text-primary-text">{d.when}</span>
              <span className="text-ink-secondary">{d.what}</span>
            </li>
          ))}
        </ol>
      </Fold>
      <P src="데일리안 2026.10.01, 더구루 2026.05.13, 문근식 한양대(이코노미스트 2026.10.03)">
        다만 마냥 장밋빛은 아니에요. 미국에서 숙련공을 키우는 데 <B>3~5년</B>이 걸리고, 해외에서 배를 짓는 걸 막는 미국 법들도 그대로예요. 필리조선소의 컨테이너선 3척 인도는 2027~2028년으로 밀렸고, 바깥 민간 일감은 아직 없어요. 대형사만 미국으로 나가고 국내 협력사가 빠지면 효과가 제한된다는 지적도 있어요.
      </P>
      <Note kind="outlook" title="돈은 언제 보일까">
        <p>메리츠증권 배기연 연구원은 1월에 미국발 해군 매출이 2028년부터 잡히기 시작한다고 봤어요.</p>
        <p className="type-caption opacity-75">데일리안 2026.01.13</p>
      </Note>
      <News headline="한미 조선 협력 본격화">당장 배를 많이 팔았다는 뜻이 아니라, 미국 땅에서 고치고, 사고, 짓는 일을 시작한다는 뜻이에요. 돈은 2028년 이후에 보이기 시작해요.</News>

      <Sub t={696} id="ship-green">
        ③ 환경 규제 — 12월 4일을 기억하세요
      </Sub>
      <Pic src="imo" alt="깨끗한 연료를 쓰는 새 배를 바라보는 작업자" />
      <P src="클락슨리서치, 뉴스토마토 2026.11.03">
        국제해사기구 <W k="IMO" />가 배 연료의 탄소를 규제하면, 전 세계 선주는 낡은 배를 <W k="이중연료선" /> 같은 새 배로 바꿔야 해요. 기름과 LNG를 둘 다 넣을 수 있는 배예요. 이미 세계에서 주문이 밀려 있는 배의 <B>47%</B>가 이런 대체연료 선박이에요.
      </P>
      <P src="ShipUniverse 2026.09.07, gCaptain 2026.11.05">
        핵심은 IMO의 ‘넷제로 프레임워크’예요. 5,000톤이 넘는 배에 탄소 부담금을 매기는 규칙인데, 2025년 10월 미국의 반대로 채택 표결이 1년 미뤄졌고 2026년 4월 회의에서도 표결이 없었어요. 11월 30일~12월 3일 회의에 이어 <M>12월 4일 임시총회(아직 잠정 일정)</M>에서 표결이 가능해요. 채택되면 빠르면 2028년 3월에 효력이 생겨요.
      </P>
      <Note kind="industry">
        <p>업계에서는 규제가 확정돼야 본격적인 교체 주문이 나온다고 말해요. 그래서 12월 4일 표결 결과가 조선소의 몇 년 치 일감을 좌우할 수 있어요.</p>
        <p className="type-caption opacity-75">이은창 산업연구원, 데일리안 2026.01.13</p>
      </Note>

      <Sub t={722} id="ship-people">
        ④ 사람 — 돈은 들어오는데 사람은 안 돌아와요
      </Sub>
      <Pic src="people" alt="여러 나라 출신 작업자들이 함께 밥을 먹는 조선소 식당" />
      <P src="헤럴드경제 2026.03.19, 빅데이터뉴스 2026.11.06, 중앙일보 2026.07.16">
        불황 때 조선소를 떠난 숙련공들은 호황이 와도 잘 돌아오지 않았어요. 그 자리를 외국인 노동자가 채워서, 지금은 <B>생산직 다섯 명 중 한 명 안팎</B>이 외국인이에요(업계 협회 집계 22.7%, OECD 보고서 약 15%). 외국인 노동자의 53.8%는 한 달에 250만 원을 못 벌어요.
      </P>
      <P src="CEO스코어데일리 2026.11.02">
        회사가 돈을 벌기 시작하자 노사 협상도 길어졌어요. HD현대중공업은 상견례부터 147일 만인 10월 27일에 타결했고, 한화오션은 10월 29일 투표에서 <B>29표 차이</B>로 겨우 가결됐어요. 삼성중공업은 파업 없이 9월 23일에 타결했어요. 집이 돈을 벌기 시작하자 “그럼 내 몫은?” 하는 이야기가 시작된 셈이에요.
      </P>
      <P src="뉴스토마토 2026.06.18">
        제도도 바뀌었어요. 2026년 3월 시행된 이른바 노란봉투법은 직접 고용하지 않았어도 실질적으로 지배하면 사용자로 봐요. 하청이 63%인 조선업이 가장 크게 영향을 받는 업종으로 꼽혀요.
      </P>
      <News headline="조선 호황 속 거제 상가 공실률 35%">둘 다 사실이에요. 돈은 회사로 들어오는데, 떠난 사람이 돌아오지 않아서 도시는 아직 비어 있어요.</News>

      <Sub t={743} id="ship-peak">
        ⑤ 이 호황, 언제까지 갈까요?
      </Sub>
      <Pic src="peak" alt="언덕 꼭대기에서 망원경으로 바다를 내다보는 작업자" />
      <P src="아주경제 2026.11.04, 머니투데이 2024.08.01">
        정점을 찍고 내려온다는 뜻의 <W k="피크아웃" /> 논쟁이 있어요. 새 배 값을 지수로 만든 <W k="신조선가지수" />는 10월 말 <B>187.2</B>로, 역대 최고였던 2008년의 191.6에 거의 닿았어요. 업계에서는 손익분기를 130 안팎으로 봐요.
      </P>
      <P src="서울신문 2026.11.02, 딜사이트 2026.10.30·2026.09.18">
        그런데 어긋나는 신호도 있어요. LNG선 값은 1년 전 2억 4,800만 달러에서 2억 4,500만 달러로 조금 내렸어요. 3분기 3사 이익도 늘긴 했지만, 환율 하락과 임금 협상 비용 때문에 증권사 예상치에는 못 미쳤어요. 주가는 이 논쟁을 먼저 반영해서, 3사 시가총액이 5월 말 146조 원에서 9월 중순 89조 원으로 줄었어요.
      </P>
      <div className="grid gap-3 md:grid-cols-2">
        <Note kind="outlook" title="꺾인다는 쪽">
          <p>키움증권은 2029년 이후 상선 쪽 성장이 둔해질 것으로 봤어요. 중국의 설비 증설로 LNG선 값이 내려갈 수 있다는 분석도 있어요.</p>
          <p className="type-caption opacity-75">딜사이트 2026.10.30, 배기연 메리츠증권(파이낸셜뉴스 2026.11.01)</p>
        </Note>
        <Note kind="outlook" title="더 간다는 쪽">
          <p>유진투자증권은 북미 LNG 프로젝트로 2027년 LNG선 발주가 회복된다고 봤어요. 신영증권 엄경아 연구원은 선주들의 배 교체가 아직 10%도 끝나지 않았다고 봤어요.</p>
          <p className="type-caption opacity-75">헤럴드경제 2025.10.06</p>
        </Note>
      </div>
      <P>누가 맞을지는 몰라요. 질문 3에서 본 것처럼 연초 전망이 “14.6% 감소”였는데 실제로는 61% 늘었으니까요. 다만 확실한 게 하나 있어요.</P>
      <Pic src="backlog" alt="조선소 문 앞에 길게 줄을 선 사람들" />
      <P src="뉴스토마토 2026.08.17, 뉴시스 2026.08.01">
        밀린 일감, <W k="수주잔량" />이에요. 2026년 6월 말 HD한국조선해양의 수주잔량은 761억 달러로 <B>약 3년 6개월 치</B>, 삼성중공업(355억 달러)과 한화오션(338억 달러)은 <B>3년 안팎</B> 치예요. 2028년까지 배를 넘길 자리는 이미 찼고, 지금은 2029~2030년 자리를 골라 받는 중이에요.
      </P>
      <News headline="조선 3사, 3년 치 일감 확보">내일 주문이 끊겨도 3년은 공장이 돈다는 안심이에요. 동시에 지금 주문하는 선주는 2029년에나 배를 받는다는 대기 줄이에요.</News>
      <Remember>중국과는 잘하는 배가 다르고, 미국에서 오는 돈은 2028년 이후, 12월 4일 규제 표결이 남았고, 사람은 여전히 모자라요.</Remember>
      <NextUp to={CH.answer}>수수께끼의 답 — 진짜 뉴스로 연습해 보기</NextUp>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 5. 수수께끼의 답                                                      */
/* ------------------------------------------------------------------ */

const DRILLS = [
  {
    head: "한국 조선 10월 수주 93만 CGT, 점유율 22%로 2위",
    wrong: "중국에 밀려 2위밖에 못 했다",
    right: "올해 중국이 압도적이지만, 10월엔 한국 몫이 5개월 만에 20%대로 올라왔다는 뜻이에요. 19척으로 93만 CGT니까 비싼 배를 골라 받았다는 말이기도 하고요.",
  },
  {
    head: "○○조선, 3조 원 규모 LNG선 수주",
    wrong: "회사에 3조 원이 들어왔다",
    right: "3조 원어치 배를 만들어 달라는 계약을 땄다는 뜻이에요. 지금 들어오는 건 계약금 정도이고, 60~70%는 2~3년 뒤 배를 넘기는 날 들어와요.",
  },
  {
    head: "조선 3사 영업이익 사상 최대",
    wrong: "올해 장사를 최고로 잘했다",
    right: "2~3년 전에 비싸게 따낸 계약이 올해 매출로 찍히고 있다는 뜻이에요. 올해 수주가 좋았는지는 따로 봐야 해요.",
  },
  {
    head: "10월 선박 수출 43.6% 급감",
    wrong: "조선업이 꺾이기 시작했다",
    right: "배 수출은 배를 넘긴 달에 한꺼번에 잡혀요. 1년 전 10월에 해양플랜트 한 건이 크게 잡혔던 기저효과예요.",
  },
];

function Drill({ d }: { d: (typeof DRILLS)[number] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl bg-canvas px-4 py-4 shadow-level-1">
      <p className="type-caption font-bold text-ink-mute">이런 기사가 떴어요</p>
      <p className="mt-1 type-heading-sm text-ink [word-break:keep-all]">“{d.head}”</p>
      {open ? (
        <div className="mt-2.5 space-y-2 motion-safe:animate-[kk-fade-in_.3s_ease-out]">
          <p className="type-body-md text-ink-mute line-through [word-break:keep-all]">{d.wrong}</p>
          <p className="rounded-xl bg-ev-written-soft px-3.5 py-2.5 type-body-md text-ink ko-justify">{d.right}</p>
        </div>
      ) : (
        <button type="button" onClick={() => setOpen(true)} className={cn("mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-brand-dark px-3.5 py-1.5 type-caption font-bold text-on-primary", anim)}>
          어떻게 읽을까? 눌러 보기
          <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.4} />
        </button>
      )}
    </div>
  );
}

function AnswerChapter() {
  return (
    <div className="space-y-4">
      <Pic src="practice" alt="태블릿으로 뉴스를 읽으며 바다를 바라보는 작업자" />
      <P>네 질문을 지나왔으니 이제 실전이에요. 실제로 나올 법한 헤드라인 네 개를 골랐어요. 먼저 머릿속으로 읽어 보고, 버튼을 눌러 비교해 보세요.</P>
      <div className="grid gap-3 md:grid-cols-2">
        {DRILLS.map((d) => (
          <Drill key={d.head} d={d} />
        ))}
      </div>
      <Sub t={823}>그래서 처음 수수께끼의 답은?</Sub>
      <Card className="space-y-3">
        <div>
          <p className="type-body-md font-bold text-ink [word-break:keep-all]">중국이 77%를 가져가는데, 한국 조선사의 이익은 왜 늘까요?</p>
          <p className="mt-1 type-body-md leading-relaxed text-ink-secondary ko-justify">
            한국은 <B>비싼 배를 골라 받고</B> 있고, 지금의 이익은 <B>2~3년 전에 비싸게 따낸 계약</B>에서 나오기 때문이에요. 배 숫자로 세면 한국은 10% 안팎이지만, 한 척 한 척이 중국 배 1.8척어치 일감이에요.
          </p>
        </div>
        <div className="border-t border-hairline pt-3">
          <p className="type-body-md font-bold text-ink [word-break:keep-all]">미국은 왜 한국을 찾을까요?</p>
          <p className="mt-1 type-body-md leading-relaxed text-ink-secondary ko-justify">
            미국 조선소에는 <B>사람이 없고 군함도 제때 못 고치는데</B>, 한국에는 그 일을 맡길 조선소와 기술이 있으니까요. 다만 존스법 때문에 한국에서 지어 보내는 게 아니라, <B>미국 땅에서 고치고 사고 짓는</B> 길로 들어가요.
          </p>
        </div>
      </Card>
      <NextUp to={CH.wrap}>다섯 줄 정리로 마무리</NextUp>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 6. 다섯 줄 정리                                                       */
/* ------------------------------------------------------------------ */

const FIVE = [
  { t: "수주는 계약일 뿐이에요.", d: "‘몇조 원 수주’ 뉴스가 떠도 돈이 들어온 게 아니에요. 배값의 60~70%는 배를 넘기는 마지막 날 들어와요." },
  { t: "사상 최대 이익은 2~3년 전 계약 값이에요.", d: "올해 실적은 몇 년 전 얼마에 계약했는지가 정해요. 실적 뉴스와 수주 뉴스는 따로 읽어요." },
  { t: "점유율은 척당 크기와 배 종류를 같이 봐요.", d: "77% 대 15%만 보면 밀리는 것 같지만, 한국 배 한 척은 중국 배 1.8척어치이고 잘하는 배도 달라요." },
  { t: "3년 치 일감은 안심이자 대기 줄이에요.", d: "내일 주문이 끊겨도 3년은 공장이 돌지만, 지금 주문하는 선주는 2029년에나 배를 받아요." },
  { t: "미국 협력의 돈은 2028년 이후예요.", d: "지금 뉴스는 고치고, 사고, 짓는 단계라서 매출로 잡히려면 시간이 더 걸려요." },
];

const SOURCES = [
  "클락슨리서치 월간 집계 — 아주경제·디지털데일리 2026.11.04, 아시아경제 2026.01.07, SBS Biz 2026.09.04",
  "삼일PwC 조선업 가이드북 2026.06, EY한영 2026.08, 해양수산개발원(KMI) 2024.10.30",
  "산업통상부 수출입 동향 2026.10.01·11.02, 머니투데이·뉴시스 2026.01.01",
  "뉴시스 2025.11.14 (한미 공동 팩트시트), 뉴스토마토 2026.03.12·2026.11.01, 서울신문 2026.10.23·11.02",
  "Holland & Knight 2026.10.26 (미 USTR 중국 선박 수수료), ShipUniverse 2026.09.07 (IMO)",
  "딜사이트 2025.01.02·2026.01.14·2026.05.18·2026.09.18·2026.10.30, MTN 2025.07.30·2026.06.20·2026.10.14",
  "헤럴드경제 2025.05.28·2025.07.26·2025.10.06·2026.01.10·2026.03.06·2026.05.14·2026.06.01",
  "데일리안 2026.01.13·2026.10.01·2026.10.12·2026.10.30, 이코노미스트 2026.09.14·2026.10.03",
  "한국경제 2025.07.22·2026.02.19·2026.03.16, 프레시안 2026.03.04, 빅데이터뉴스 2026.11.06 (OECD 보고서)",
  "중앙일보 2026.05.06·2026.07.16, CEO스코어데일리 2026.11.02, 뉴스토마토 2026.04.01·2026.06.18·2026.08.17·2026.11.03",
  "아주경제 2020.06.15·2021.12.17, 파이낸스스코프 2024.08.27, 비즈니스워치 2017.02.17·2026.10.29·2026.10.28, 뉴데일리 2019.01.04·2023.05.25·2026.04.08",
  "디지털타임스 2022.01.02, 아시아경제 2022.01.08, 세계일보 2022.01.13, 헬로티 2022.10.23, 더팩트 2026.06.17, 더구루 2026.05.13, 사이프러스쇼핑뉴스 2026.10.30",
];

function WrapChapter() {
  return (
    <div className="space-y-4">
      <ol className="space-y-2.5">
        {FIVE.map((x, i) => (
          <li key={x.t} className="flex gap-3 rounded-2xl bg-canvas px-4 py-3.5 shadow-level-1">
            <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-dark tabular type-body-md font-bold text-on-primary">{i + 1}</span>
            <div className="min-w-0 flex-1">
              <p className="type-body-md font-bold text-ink [word-break:keep-all]">{x.t}</p>
              <p className="mt-0.5 type-body-md text-ink-secondary ko-justify">{x.d}</p>
            </div>
          </li>
        ))}
      </ol>
      <Pic src="cheat" alt="창가 책상 위의 메모지 한 장과 조선소 풍경" />
      <Remember>조선업은 돈을 마지막에 받는 장사예요. 은행도, 환율도, 호황과 불황도 전부 여기서 이어져요.</Remember>
      <Card>
        <p className="type-micro-cap text-primary-text">산업 A-Z · 다음 편</p>
        <p className="mt-1 type-heading-sm text-ink [word-break:keep-all]">반도체 — 모래가 칩이 되기까지</p>
        <p className="mt-1.5 type-body-md text-ink-secondary ko-justify">발밑의 모래가 어떻게 AI를 돌리는 칩이 될까요? 요즘 뉴스마다 나오는 HBM은 대체 뭘까요? 같은 방식으로 영상과 글을 함께 준비할게요.</p>
      </Card>
      <div className="grid gap-2.5 sm:grid-cols-2">
        <Link href="/magazine/blog" className="group flex items-center gap-2 rounded-xl bg-brand-dark px-4 py-3.5 type-body-md font-semibold text-on-primary">
          <span className="min-w-0 flex-1">금콩 블로그 다른 글 보기</span>
          <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
        </Link>
        <VideoLink />
      </div>
      <Fold title="출처 (주요 자료)">
        <ul className="space-y-1.5">
          {SOURCES.map((s) => (
            <li key={s} className="type-caption text-ink-secondary [word-break:keep-all]">
              · {s}
            </li>
          ))}
        </ul>
        <p className="type-caption text-ink-mute [word-break:keep-all]">같은 지표가 출처마다 다를 때는 범위로 적었어요(예: 후판 원가 비중 약 20~30%, 외국인 비중 15~23%). 원화는 환율 1,400원대로 바꾼 대략값이에요.</p>
      </Fold>
      <p className="type-caption text-ink-mute [word-break:keep-all]">이 글은 2026년 11월 7일 기준이에요. 12월 4일 IMO 표결 결과, 미국의 중국 선박 수수료 유예, 매달 초 나오는 클락슨리서치 수주 집계가 나오면 고쳐 둘게요.</p>
    </div>
  );
}

function VideoLink() {
  const id = useContext(VideoCtx);
  if (!id) {
    return <span className="flex items-center gap-2 rounded-xl bg-canvas-soft px-4 py-3.5 type-body-md font-semibold text-ink-mute">영상은 곧 유튜브에 올라와요</span>;
  }
  return (
    <a href={watchUrl(id)} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-2 rounded-xl bg-[#ff0033] px-4 py-3.5 type-body-md font-semibold text-on-primary">
      <Play className="h-4 w-4 shrink-0 fill-current" strokeWidth={0} />
      <span className="min-w-0 flex-1">영상으로 다시 보기 ({VIDEO_LENGTH})</span>
      <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
    </a>
  );
}

/* ------------------------------------------------------------------ */
/* 전체                                                                  */
/* ------------------------------------------------------------------ */

const CHAPTERS: GuideChapter[] = [
  { short: "왜 지금", title: "왜 지금 조선업 얘기를 할까요?", lead: "미국의 부탁, 그리고 이상한 숫자 하나에서 시작해요.", bg: "bg-[#f3f6ff]", body: <IntroChapter /> },
  { short: "질문 1 · 왜 중요할까", title: "질문 1. 조선업은 왜 중요할까요?", lead: "배 한 척 값, 수출 속 비중, 그리고 조선소가 있는 도시를 볼게요.", bg: "bg-[#fffaf3]", body: <WhyChapter /> },
  { short: "질문 2 · 배 한 척의 돈", title: "질문 2. 배 한 척, 돈은 어떻게 돌까요?", lead: "수주부터 인도까지 일곱 정거장. 돈이 언제 들어오는지가 이 산업의 전부예요.", kong: "마지막 날 60%만 기억해도 반은 이해한 거예요!", bg: "bg-[#eef5ff]", body: <MoneyChapter /> },
  { short: "질문 3 · 천국과 지옥", title: "질문 3. 왜 천국과 지옥을 오갈까요?", lead: "배는 20~30년을 써요. 그래서 주문이 한꺼번에 몰렸다가 한꺼번에 끊겨요.", bg: "bg-[#f6f4ff]", body: <CycleChapter /> },
  { short: "질문 4 · 지금 이슈", title: "질문 4. 지금 무슨 일이 벌어지고 있을까요?", lead: "중국, 미국, 환경 규제, 사람, 그리고 피크아웃 논쟁까지.", look: "book", bg: "bg-[#f2fbf5]", body: <NowChapter /> },
  { short: "수수께끼의 답", title: "수수께끼의 답", lead: "진짜 헤드라인으로 연습해 보고, 처음 질문에 답해요.", bg: "bg-[#fff6ec]", body: <AnswerChapter /> },
  { short: "다섯 줄 정리", title: "다섯 줄 정리", lead: "오늘부터 조선 뉴스를 읽는 법.", kong: "다음 편 반도체에서 또 만나요!", look: "suit", bg: "bg-[#f3f6ff]", body: <WrapChapter /> },
];

export function ShipbuildingGuide({ title, video }: { title: string; video: string | null }) {
  return (
    <VideoCtx.Provider value={video}>
      <GlossLayer>
        <GuideShell
          chapters={CHAPTERS}
          eyebrow="금콩 산업 A-Z · 1편 조선업"
          heading={title}
          sub="조선업을 하나도 몰라도 괜찮아요. 영상으로 봐도, 글로 읽어도 같은 이야기예요."
          mascot={null}
          tabsLabel="조선업 A to Z 목차"
          cover={<Cover />}
          coverClass="from-[#e4e6ff]"
        />
      </GlossLayer>
    </VideoCtx.Provider>
  );
}
