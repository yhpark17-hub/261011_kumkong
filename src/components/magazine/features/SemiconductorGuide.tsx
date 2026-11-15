"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowRight, BookOpen, Check, Play, X } from "lucide-react";
import { cn } from "../../ui";
import { GuideShell, anim, useGuideGo, type GuideChapter } from "./GuideShell";

/**
 * 산업 A-Z 2편 — 반도체. 같은 내용의 유튜브 영상(금콩 산업 A-Z)과 장 순서를 맞춰, 영상으로 보거나 글로 읽거나 고를 수 있어요.
 * 오프닝 → 구조(여섯 정거장) → 역사(40년 다섯 장면 · 사이클) → 현재(AI 호황 · 두 회사 · 세 도시) → 전망 → 정리.
 * 숫자는 2026-11-15 기준 반도체 A-Z 브리프(정부 발표·회사 발표·시장조사 회사·언론 보도)에 있는 것만, 문단 아래 '출처'로 붙여요.
 * 사실이 아닌 문장(업계 말·전망·금콩 풀이)만 따로 표시해요. 특정 회사나 주식을 권하지 않아요.
 */

/* 장 번호 */
const CH = { intro: 0, build: 1, history: 2, now: 3, outlook: 4, wrap: 5 } as const;

/* ------------------------------------------------------------------ */
/* 영상 — 유튜브 주소가 있으면 장마다 같은 장면으로 가는 링크가 생겨요            */
/* ------------------------------------------------------------------ */

/** 장 시작 시각(초) — 유튜브 설명란 챕터와 같은 값(영상 쪽 시각을 내림) */
const VIDEO_CHAPTERS = [0, 70, 438, 583, 835, 952] as const;
const VIDEO_LENGTH = "16:53";

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
  반도체: "전기를 켜고 끄는 아주 작은 스위치(트랜지스터) 수백억 개를 손톱만 한 조각 위에 모은 부품이에요. 계산도 하고 기억도 해요.",
  실리콘: "모래 속에 든 규소예요. 아주 깨끗하게 만들면 전기를 흘렸다 막았다 하기 좋아서 반도체의 재료가 돼요.",
  웨이퍼: "실리콘 기둥을 얇게 썬 둥근 원판이에요. 요즘은 지름 300mm, 피자 한 판만 해요. 이 위에 칩을 수백에서 수천 개씩 한꺼번에 만들어요.",
  팹: "반도체 공장이에요. 영어 fabrication(제조)에서 나온 말이에요.",
  팹리스: "공장(팹) 없이 칩 설계만 하는 회사예요. 엔비디아·퀄컴 같은 회사가 여기에 들어가요. 도시로 치면 건축설계사무소예요.",
  파운드리: "남이 설계한 칩을 대신 만들어 주는 회사예요. 대만 TSMC가 대표예요. 도시로 치면 설계도대로 짓는 건설회사예요.",
  나노: "10억 분의 1m예요. 머리카락 굵기가 약 10만 나노미터예요. 요즘 '2나노' '3나노'는 실제 선 굵기라기보다 기술 세대를 부르는 이름에 가까워요.",
  노광장비: "빛으로 회로 그림을 원판에 찍는 기계예요. 사진을 인화하는 것과 원리가 같아요.",
  EUV: "극자외선이에요. 아주 짧은 빛이라 아주 가는 선을 그릴 수 있어요. EUV 노광장비는 네덜란드 ASML 한 곳만 만들어요.",
  메모리: "데이터를 담아 두는 반도체예요. 도시로 치면 창고예요. 삼성전자와 SK하이닉스가 가장 잘 만드는 분야예요.",
  시스템반도체: "계산하고 지시하는 반도체예요. 컴퓨터의 CPU, AI의 GPU, 폰의 AP가 여기에 들어가요. 도시로 치면 공장이에요.",
  D램: "전원을 끄면 내용이 지워지는 메모리예요. 대신 아주 빨라서, 지금 쓰는 데이터를 잠깐 올려 두는 '빠른 창고'예요.",
  낸드: "전원을 꺼도 내용이 남는 메모리예요. 폰을 살 때 고르는 256GB·512GB가 낸드예요. 사진을 오래 넣어 두는 '보관 창고'예요.",
  HBM: "고대역폭 메모리예요. D램을 8장에서 16장까지 쌓고 세로 구멍(TSV)으로 엘리베이터처럼 이은 '고층 창고'예요. AI 칩(GPU) 바로 옆에 붙어 데이터를 빨리 날라 줘요.",
  GPU: "원래 게임 그래픽용 칩이에요. 계산 수만 개를 한꺼번에 해내는 재주가 있어서 AI를 학습시키고 돌리는 칩이 됐어요. 엔비디아가 거의 독점해요.",
  TSV: "실리콘 관통 전극이에요. 쌓은 D램 칩에 세로로 아주 작은 구멍을 뚫어 위아래를 전선으로 잇는 기술이에요.",
  데이터센터: "AI·검색·클라우드를 돌리는 컴퓨터(서버)를 수천~수만 대 모아 둔 커다란 건물이에요. 지금 메모리의 가장 큰 손님이에요.",
  고정거래가격: "메모리 회사가 큰 고객과 한 달·한 분기 단위로 미리 정하는 도매값이에요. 뉴스에서 'D램 가격'이라고 하면 보통 이 값이에요.",
  현물가격: "그날그날 시장에서 사고파는 소매값이에요. 거래 양은 적지만 고정거래가격보다 먼저 움직여서 방향을 미리 보여 줘요.",
  영업이익: "물건을 팔아 번 돈에서 원재료·월급·공장 비용 같은 본업 비용을 빼고 남은 돈이에요. '장사해서 남긴 돈'이에요.",
  영업이익률: "매출 100원 가운데 영업이익이 몇 원인지예요. 한국 제조업 평균은 2025년에 6.9원이었어요(한국은행 기업경영분석).",
  감가상각: "비싼 장비 값을 산 해에 한 번에 비용으로 치지 않고, 몇 년에 나눠 해마다 비용으로 잡는 거예요. 팔리든 안 팔리든 나가는 돈이라 이익이 크게 널뛰는 이유가 돼요.",
  사이클: "반도체 값과 이익이 몇 년 주기로 크게 올랐다가 크게 떨어지는 흐름이에요. 수요와 공급이 엇갈려서 생기는데, 공장을 늘려 생산이 늘어나기까지 2~3년이 걸리는 게 큰 이유예요.",
  치킨게임: "서로 값을 깎으며 누가 먼저 쓰러지나 버티는 싸움이에요. 2007~2012년 D램 시장이 대표 사례예요.",
  수율: "만든 칩 가운데 멀쩡하게 쓸 수 있는 칩의 비율이에요. 지은 건물 가운데 입주할 수 있는 집의 비율이라고 보면 돼요. 수율이 곧 돈이에요.",
  설비투자: "새 공장을 짓고 장비를 사는 데 쓰는 돈이에요. 뉴스에서는 CAPEX라고도 써요. 이 돈이 늘면 2~3년 뒤 물건이 늘어요.",
  장기계약: "1~2년 뒤에 만들 물량과 값을 미리 정해 두는 계약이에요. HBM은 손님마다 맞춤이라 시세 대신 이렇게 팔아요.",
  솔드아웃: "다 팔렸다는 뜻이에요. 'HBM 2027년 물량 솔드아웃'은 아직 만들지도 않은 내후년 물량까지 주문이 찼다는 말이에요.",
  포괄허가: "미국 장비를 중국 공장에 들일 때마다 따로 허락받지 않아도 되게 해 주던 허가(VEU)예요. 미국이 2025년 8월 취소를 발표했고, 12월 31일부터 효력이 생겼어요.",
  클러스터: "같은 산업의 공장·회사·연구소를 한곳에 모은 단지예요. 경기 용인에 삼성전자와 SK하이닉스의 반도체 클러스터가 지어지고 있어요.",
  점유율: "그 시장 전체 가운데 한 회사가 차지하는 비율이에요. 보통 매출 기준이라, 값이 오르면 판 양이 같아도 움직여요.",
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
        </button>
      ))}
    </div>
  );
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

/** 이걸 알면 뉴스가 이렇게 읽혀요 (헤드라인은 이해를 돕는 예시) */
function News({ headline, children }: { headline: string; children: ReactNode }) {
  return (
    <aside className="rounded-2xl border-2 border-brand-dark/15 bg-canvas px-4 py-3.5">
      <p className="flex items-center gap-1.5 type-caption font-bold text-primary-text">
        <BookOpen className="h-3.5 w-3.5" strokeWidth={2.2} />
        이제 이 뉴스가 이렇게 읽혀요
        <span className="font-medium text-ink-mute">· 예시 제목</span>
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
      {/* eslint-disable-next-line @next/next/no-img-element -- 영상에 쓴 장면 그림 (public/magazine/semi) */}
      <img src={`/magazine/semi/${src}.webp`} width={1200} height={675} alt={alt} loading="lazy" decoding="async" className="block h-auto w-full" />
      {caption && <figcaption className="px-4 py-2.5 type-caption text-ink-secondary [word-break:keep-all]">{caption}</figcaption>}
    </figure>
  );
}

/** 막대 — 값은 항상 글자로 함께 (막대는 0에서 시작, 마이너스는 루비로 왼쪽에 짧게) */
function Bars({ title, rows, max, note }: { title: string; rows: { k: string; v: number; show: string; hi?: boolean }[]; max: number; note?: ReactNode }) {
  return (
    <div className="rounded-2xl bg-canvas px-4 py-3.5 shadow-level-1">
      <p className="type-body-md font-bold text-ink [word-break:keep-all]">{title}</p>
      <div className="mt-2.5 space-y-2">
        {rows.map((x) => (
          <div key={x.k}>
            <div className="flex items-baseline justify-between gap-2 type-caption text-ink-secondary">
              <span className="[word-break:keep-all]">{x.k}</span>
              <span className={cn("tabular font-semibold", x.v < 0 ? "text-ruby" : "text-ink")}>{x.show}</span>
            </div>
            <div className="mt-0.5 h-2.5">
              {x.v < 0 ? (
                <div className="h-full rounded-r bg-ruby/70" style={{ width: `${Math.max(1.5, (-x.v / max) * 100)}%` }} />
              ) : (
                <div className={cn("h-full rounded-r", x.hi ? "bg-primary" : "bg-primary/35")} style={{ width: `${Math.max(1.5, (x.v / max) * 100)}%` }} />
              )}
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

/** 숫자 칸 (2~3개 나란히) */
function Stat({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) {
  return (
    <div className="rounded-2xl bg-canvas px-4 py-3.5 shadow-level-1">
      <p className="type-caption font-semibold text-ink-mute [word-break:keep-all]">{label}</p>
      <p className="mt-1 tabular text-[24px] leading-tight font-extrabold tracking-[-0.02em] text-ink">{value}</p>
      {sub && <p className="mt-0.5 type-caption text-ink-secondary [word-break:keep-all]">{sub}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 표지 — 영상으로 볼까, 글로 읽을까                                       */
/* ------------------------------------------------------------------ */

const OUTLINE = [
  { title: "오프닝 · 폰 값이 오른 이유", hint: "메모리 칩 하나가 17배, 수출의 절반" },
  { title: "구조 · 모래에서 칩까지", hint: "여섯 정거장마다 누가 돈을 받을까" },
  { title: "역사 · 한국 메모리 40년", hint: "다섯 장면, 그리고 천국과 지옥" },
  { title: "현재 · AI가 부른 호황", hint: "HBM, 삼성과 SK하이닉스, 세 도시" },
  { title: "전망 · 이번엔 다를까", hint: "호황이라는 쪽, 거품이라는 쪽" },
  { title: "정리 · 반도체 뉴스 읽는 법", hint: "처음 질문의 답과 다섯 줄" },
];

function Cover() {
  const id = useContext(VideoCtx);
  const go = useGuideGo();
  const thumb = (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element -- 영상 썸네일 (public/magazine/semi) */}
      <img src="/magazine/semi/video-thumb.webp" width={1280} height={720} alt="영상 썸네일 — 삼성전자, 하이닉스 정확히 뭘 팔까?" className="block h-auto w-full" />
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
          <p className="type-caption text-ink-mute [word-break:keep-all]">영상과 글은 같은 순서로 흘러가요. 글을 읽다가 소제목 옆 ▶ 버튼을 누르면 영상의 같은 장면으로 가요.</p>
        </div>
      </div>

      <div className="rounded-3xl bg-canvas/90 p-4 shadow-level-1 backdrop-blur sm:p-5">
        <p className="type-heading-sm text-ink">목차 — 네 갈래로 따라가면 반도체가 보여요</p>
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
          <span className="border-b border-dashed border-primary/70">점선 밑줄</span>이 있는 말은 누르면 뜻이 나와요. 문단 아래 ‘출처’는 숫자를 확인한 곳이에요. 따로 표시 없는 문장은 정부·회사 발표, 시장조사 회사 집계, 언론 보도로 확인한 사실이고, 아래 셋만 따로 표시했어요. 2026년 11월 15일 기준이에요.
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {(Object.keys(KIND) as Kind[]).map((k) => (
            <Tag key={k} kind={k} />
          ))}
        </div>
        <p className="mt-1.5 [word-break:keep-all]">
          원화는 2026년 3분기 평균 환율 1,430원으로 바꾼 대략값이에요. 특정 회사나 주식을 사고팔라고 권하는 글이 아니에요. 그림은 영상에 쓴 장면 그림이에요(AI 도구로 그렸어요).
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 0. 오프닝 — 폰 값이 오른 이유                                          */
/* ------------------------------------------------------------------ */

function IntroChapter() {
  const go = useGuideGo();
  return (
    <div className="space-y-5">
      <Pic src="phone-store" alt="휴대폰 매장에서 직원이 가격표를 새로 바꿔 붙이고, 손님들이 놀라서 보는 모습" />
      <P src="SBS Biz 2026.10.02">
        올해 10월, 휴대폰 매장의 가격표가 바뀌었어요. 나온 지 7개월이나 된 폰 값이 거꾸로 올랐거든요. 갤럭시 S26(256GB)은 <B>125만 4,000원에서 140만 3,600원</B>이 됐어요. 14만 9,600원, 약 15만 원이 오른 거예요. 새 아이폰 프로도 지난 모델보다 <B>20만 원</B> 비싸졌어요.
      </P>
      <P src="한국경제 2026.03.02, SBS Biz 2026.10.30 (대표 D램 DDR4 8Gb 고정거래가격 1.65달러 → 27.5달러)">
        가장 큰 이유로 꼽히는 건 <W k="메모리" />, 데이터를 담아 두는 칩이에요. 대표 메모리 칩 하나의 도매값이 2025년 4월 <B>약 2,400원</B>에서 올해 10월 <B>약 3만 9,000원</B>이 됐어요. 1년 반 만에 <M>17배</M>예요. 생수 한 병 값이 1년 반 만에 치킨 한 마리 값이 된 셈이에요.
      </P>
      <P src="산업통상부 2026.11.01, 머니투데이·뉴시스 2026.01.01 (2025년 선박 수출 약 320억 달러)">
        그런데 이 비싸진 칩을 파는 나라가 바로 한국이에요. 같은 10월에 한국은 반도체를 <B>564억 달러</B>어치 팔았어요. 외국에 판 물건의 <B>49%</B>, 거의 절반이 반도체였어요. 조선업 편에서 본 작년 한 해 선박 수출(약 320억 달러)보다 반도체 <B>한 달</B> 수출이 <B>1.8배</B> 많아요.
      </P>
      <So>폰 값, 한국 수출, 그리고 뉴스마다 나오는 두 회사가 모두 같은 칩 이야기로 이어져 있어요.</So>

      <div className="rounded-2xl bg-brand-dark px-5 py-5 text-on-primary">
        <p className="type-micro-cap text-on-primary/70">오늘의 질문</p>
        <p className="mt-1.5 type-heading-sm leading-snug [word-break:keep-all]">삼성전자와 SK하이닉스는 정확히 뭘 팔길래, 이렇게 벌고 내 폰 값까지 올렸을까요?</p>
      </div>
      <P>
        삼성전자, SK하이닉스, 팹, GPU, HBM. 뉴스에서 한 번쯤 들어 본 말이지만, 이 회사들이 정확히 뭘 만들어서 버는지는 설명하기 어려워요. 네 갈래로 차례로 따라가 볼게요. 칩이 만들어지는 <B>구조</B>, 한국이 메모리 1등이 된 <B>역사</B>, AI가 불붙인 <B>현재</B>, 그리고 이 호황의 <B>전망</B>이에요. 마지막 장에서 처음 질문의 답을 맞춰 봐요.
      </P>
      <ol className="space-y-2">
        {[
          { to: CH.build, q: "구조 — 모래 한 줌이 어떻게 칩이 될까?" },
          { to: CH.history, q: "역사 — 한국은 어떻게 메모리 1등이 됐을까?" },
          { to: CH.now, q: "현재 — AI는 왜 메모리를 먹어 치울까?" },
          { to: CH.outlook, q: "전망 — 이번 호황은 다를까, 거품일까?" },
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
/* 1. 구조 — 모래에서 칩까지, 여섯 정거장                                   */
/* ------------------------------------------------------------------ */

interface Station {
  n: number;
  id: string;
  name: string;
  city: string;
  pic?: string;
  alt?: string;
  t: number;
  /** 돈은 누가 받을까 */
  who: ReactNode;
  /** 한국은 어디쯤 */
  korea: ReactNode;
  body: ReactNode;
}

const STATIONS: Station[] = [
  {
    n: 1,
    id: "st-wafer",
    name: "원판 만들기",
    city: "땅 고르기",
    pic: "wafer",
    alt: "먼지 없는 방에서 흰 작업복을 입은 작업자가 거울처럼 반짝이는 둥근 원판을 들어 올리는 모습",
    t: 129,
    who: "일본 신에츠·섬코 등이 세계 절반 넘게",
    korea: "SK실트론 (3위권으로 평가)",
    body: (
      <>
        <T src="AIChE 2026.05.14">
          모래에서 뽑은 <W k="실리콘" />을 아주 높은 온도로 녹여 거의 완벽하게 깨끗한 기둥으로 굳혀요. 순도가 <B>99.9999999%</B>, 알갱이 10억 개 가운데 티끌이 하나 섞일까 말까 한 수준이에요.
        </T>
        <T>
          이 기둥을 얇게 썰면 지름 <B>300mm</B> 원판, <W k="웨이퍼" />가 나와요. 이 땅 한 장 위에 칩을 수백에서 수천 개씩 한꺼번에 지어요.
        </T>
        <T src="UBS 2026.09.22">
          아무것도 그리지 않은 원판 한 장은 <B>100달러 안팎</B>, 약 15만 원이에요. 피자 한 판만 한 크기예요.
        </T>
        <T src="헤럴드경제 2026.05.27">
          원판은 일본 <B>신에츠와 섬코</B> 등이 세계 절반 넘게 만들어요. 한국 <B>SK실트론</B>은 3위권 회사로 평가돼요. 집계에 따라 순위는 달라요.
        </T>
      </>
    ),
  },
  {
    n: 2,
    id: "st-design",
    name: "회로 설계",
    city: "건축설계사무소",
    pic: "design-office",
    alt: "왼쪽엔 말뚝만 박힌 빈 땅, 오른쪽엔 설계도를 그리는 설계사무소",
    t: 165,
    who: "엔비디아 같은 설계 회사(팹리스)",
    korea: "한국 팹리스는 세계 설계 시장의 1% 안팎",
    body: (
      <>
        <T src="가트너 2026.01.12">
          이상한 사실이 하나 있어요. 2025년 반도체를 세계에서 가장 많이 판 회사는 미국 <B>엔비디아</B>(1,257억 달러)인데, 이 회사엔 반도체 공장이 <B>하나도 없어요</B>. 2위가 삼성전자, 3위가 SK하이닉스예요.
        </T>
        <T>
          반도체 공장을 <W k="팹" />이라고 해요. 엔비디아처럼 팹 없이 설계만 하는 회사를 <W k="팹리스" />라고 불러요. 도시로 치면 <B>건축설계사무소</B>예요. 그 설계도대로 칩을 대신 지어 주는 회사는 <W k="파운드리" />, 도시로 치면 <B>건설회사</B>예요. 대만 TSMC가 대표예요.
        </T>
        <T src="트렌드포스 2026.09.09, 카운터포인트 (집계마다 조금씩 달라요), 뉴시스 2025.12.13">
          칩을 대신 지어 주는 파운드리 시장은 TSMC가 <B>70%대</B>를 쥐고 있어요. 삼성전자는 <B>6~7%</B>예요. 설계만 하는 한국 팹리스 회사들은 세계 설계 시장의 <B>1% 안팎</B>이에요.
        </T>
      </>
    ),
  },
  {
    n: 3,
    id: "st-litho",
    name: "회로 새기기",
    city: "설계도대로 건물 올리기",
    pic: "euv",
    alt: "어두운 기계 안에서 보랏빛 빛줄기가 둥근 원판 위로 내리꽂히며 회로가 새겨지는 모습",
    t: 225,
    who: "장비 회사 — 네덜란드 ASML(EUV는 이 한 곳뿐)",
    korea: "한국 공장 장비 가운데 한국산은 약 20%",
    body: (
      <>
        <T src="AIChE 2026.05.14">
          원리는 필름 사진 인화와 같아요. 빛으로 회로 그림을 원판에 찍고, 깎고, 그 위에 쌓기를 수십에서 수백 번 되풀이해요. 그래서 원판 한 장이 공장에서만 <B>3~4개월</B>을 머물러요.
        </T>
        <T src="전자신문 2023.02.24">
          회로는 <W k="나노" /> 단위로 그려요. 머리카락 굵기가 약 10만 나노미터인데, 최신 칩은 ‘2나노’라고 불러요. 이름대로라면 머리카락의 5만 분의 1이에요. 다만 요즘 ‘2나노’는 실제 굵기라기보다 기술 세대를 부르는 이름에 가까워요.
        </T>
        <T src="Tom's Hardware 2026.01.29 (48대)·2024 (최신 High-NA 장비 값)">
          이렇게 가는 선을 빛으로 새기는 기계가 <W k="노광장비" />예요. 가장 앞선 건 아주 짧은 빛을 쓰는 <W k="EUV" /> 장비인데, 세계에서 네덜란드 <B>ASML 한 곳</B>만 만들어요. 2025년에 내보낸 게 <B>48대</B>예요. 최신 장비(High-NA)는 2024년 보도로 한 대 3억 8,000만 달러, 약 <B>5,400억 원</B>이에요. 조선업 편에서 본 LNG선 한 척(약 3,500억 원)보다 비싼 기계예요.
        </T>
        <T src="뉴시스 2025.01.03">
          그래서 원판 한 장 값이 뛰어요. 15만 원짜리 원판에 최신 회로를 그려 달라고 TSMC에 맡기면, 2025년 초 외신 추정으로는 한 장에 최대 <B>3만 달러</B>, 약 4,300만 원이에요. 큰 차 한 대 값이에요.
        </T>
        <T src="쿠키뉴스 2025.12.06">
          그런데 한국 반도체 공장에 들어가는 장비 가운데 한국산은 <B>약 20%</B>예요. 나머지 80%는 외국 회사 장비예요. 메모리는 세계 1등인데, 이 기계들 없이는 칩 하나 못 만드는 구조예요.
        </T>
      </>
    ),
  },
  {
    n: 4,
    id: "st-memory",
    name: "메모리 만들기",
    city: "창고 짓기",
    pic: "warehouse",
    alt: "끝이 안 보이는 높은 선반에 상자가 가득한 거대한 창고와 작은 지게차",
    t: 298,
    who: "메모리 회사 — 삼성전자·SK하이닉스·마이크론",
    korea: "세계 D램의 67%가 한국 두 회사",
    body: (
      <>
        <T>
          반도체는 크게 두 가지예요. 계산하고 지시하는 <W k="시스템반도체" />, 그리고 데이터를 담아 두는 <W k="메모리" />예요. 시스템반도체가 도시의 <B>공장</B>이라면 메모리는 <B>창고</B>예요.
        </T>
        <T>
          메모리도 두 종류예요. 전원을 끄면 지워지는 <W k="D램" />은 지금 쓸 짐을 잠깐 두는 빠른 창고, 꺼도 남는 <W k="낸드" />는 사진을 오래 넣어 두는 보관 창고예요. 폰을 살 때 고르는 256GB가 바로 낸드예요.
        </T>
        <T src="카운터포인트 (SBS Biz 2026.11.05)">
          한국이 이 창고를 얼마나 잘 짓냐면, 올해 3분기 세계 D램 시장에서 <B>삼성전자 38%, SK하이닉스 29%</B>예요. 둘을 합치면 <M>67%, 세계 창고 셋 중 둘이 한국산</M>이에요. 미국 마이크론(21%)과 중국 CXMT(9%)가 뒤를 쫓아요.
        </T>
        <T src="머니투데이 2026.02.23">
          D램은 원유처럼 <B>시세</B>가 있어요. 어느 회사 것이나 규격이 거의 같아서, 누가 만들었는지보다 지금 얼마에 거래되는지가 중요해요. 뉴스의 ‘D램 가격’은 보통 큰 고객과 미리 정한 도매값, <W k="고정거래가격" />이에요.
        </T>
        <T src="MTN 2026.09.14">
          원래 이 창고 시장은 반도체 전체의 <B>20~30%</B>였어요. 공장(시스템반도체) 쪽이 훨씬 컸어요. 그런데 올해는 메모리가 전체의 <B>50~55%</B>로 <B>사상 처음 절반</B>을 넘을 거라는 전망이 나왔어요.
        </T>
      </>
    ),
  },
  {
    n: 5,
    id: "st-hbm",
    name: "메모리 쌓기",
    city: "창고를 아파트처럼 쌓기",
    pic: "hbm-tower",
    alt: "낮은 창고 옆에 엘리베이터가 가운데로 지나는 12층짜리 창고 아파트가 서 있고, 그 옆에 큰 공장이 있는 모습",
    t: 363,
    who: "HBM 회사, 쌓는 장비 회사, TSMC(GPU와 한 판에 붙이기)",
    korea: "HBM은 SK하이닉스 50%·삼성 33% (2분기)",
    body: (
      <>
        <T>
          요즘 가장 귀한 창고는 위로 쌓은 창고, <W k="HBM" />이에요. HBM을 알려면 짝꿍인 <W k="GPU" />부터 봐야 해요. 원래 게임 그래픽용 칩인데, 계산 수만 개를 한꺼번에 해내는 재주 덕에 AI의 칩이 됐어요.
        </T>
        <T src="디지털데일리 2025.12.03">
          GPU는 도시로 치면 <B>AI 공장</B>이에요. 이 공장은 재료가 빨리 들어와야 잘 돌아가요. 그래서 바로 옆에 <B>고층 창고</B>를 붙였어요. D램을 <B>8장에서 16장</B>까지 쌓고 세로로 구멍(<W k="TSV" />)을 뚫어 엘리베이터처럼 이은 게 HBM이에요.
        </T>
        <T src="아시아경제 2025.12 (업계 추정)">
          업계 추정으로 2025년 말 HBM3E <B>8단</B> 하나는 약 <B>300달러</B>(약 43만 원), 12단은 300~500달러 선이었어요. 엔비디아 GPU 한 개 옆엔 HBM이 <B>8개</B> 붙어요. 8단 값으로만 계산해도 칩 하나에 메모리가 <B>340만 원어치</B>쯤 붙는 셈이에요.
        </T>
        <T src="카운터포인트 2026.09.03, 아시아경제 2026.02.11">
          올해 2분기 HBM 시장은 <B>SK하이닉스 50%, 삼성전자 33%, 마이크론 18%</B>예요. 한국 두 회사가 83%예요. D램을 쌓아 붙이는 장비(TC본더)도 한국 한미반도체가 세계의 71.2%를 차지해요. 다만 GPU와 HBM을 한 판에 붙이는 마지막 포장(CoWoS)은 TSMC가 해요.
        </T>
      </>
    ),
  },
  {
    n: 6,
    id: "st-dc",
    name: "데이터센터로 보내기",
    city: "공업도시의 큰 손님",
    t: 411,
    who: "최종 손님 — 미국 빅테크(마이크로소프트·구글·아마존·메타 등)",
    korea: "한국은 ‘창고’를 팔아요",
    body: (
      <>
        <T src="카운터포인트 (SBS Biz 2026.06.29)">
          마지막 정거장은 <W k="데이터센터" />예요. AI를 돌리는 컴퓨터를 잔뜩 모아 둔 곳이에요. 시장조사 회사 카운터포인트는 올해 만드는 D램의 <B>57%</B>가 이곳으로 간다고 봐요.
        </T>
        <T src="웰스파고 (머니투데이 2026.08.16)">
          엔비디아의 차세대 AI 서버 랙 한 대(베라 루빈 NVL72, GPU 72개)는 부품값만 약 <B>834만 달러(약 118억 원)</B>예요. 그 가운데 메모리(HBM과 LPDDR)가 <B>257만 달러, 약 36억 원</B>으로 3분의 1 가까이 돼요. 미국 은행 웰스파고의 추산이에요.
        </T>
      </>
    ),
  },
];

function StationCard({ s }: { s: Station }) {
  return (
    <section id={s.id} className="scroll-mt-36 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 border-t border-hairline pt-6">
        <h3 className="flex items-center gap-2.5 type-heading-md text-ink [word-break:keep-all]">
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary tabular text-[15px] font-extrabold text-on-primary">{s.n}</span>
          정거장 {s.n}. {s.name}
        </h3>
        <At t={s.t} />
      </div>
      {s.pic && <Pic src={s.pic} alt={s.alt ?? ""} />}
      <div className="grid gap-2 sm:grid-cols-3">
        <p className="rounded-xl bg-canvas px-3.5 py-2.5 type-caption text-ink-secondary shadow-level-1 [word-break:keep-all]">
          <b className="block text-ink-mute">도시로 치면</b>
          <span className="font-semibold text-ink">{s.city}</span>
        </p>
        <p className="rounded-xl bg-canvas px-3.5 py-2.5 type-caption text-ink-secondary shadow-level-1 [word-break:keep-all]">
          <b className="block text-ink-mute">돈은 누가 받을까</b>
          <span className="font-semibold text-ink">{s.who}</span>
        </p>
        <p className="rounded-xl bg-ev-written-soft px-3.5 py-2.5 type-caption text-ink-secondary [word-break:keep-all]">
          <b className="block text-primary-text">한국은</b>
          <span className="font-semibold text-ink">{s.korea}</span>
        </p>
      </div>
      <div className="space-y-3">{s.body}</div>
    </section>
  );
}

function BuildChapter() {
  return (
    <div className="space-y-5">
      <Gist
        items={[
          <>
            반도체는 <B>모래(실리콘)</B>로 만든 원판 위에 빛으로 회로를 새겨 만들어요.
          </>,
          <>
            대표 선수로 보면 <B>설계는 미국(엔비디아), 건설은 대만(TSMC), 창고(메모리)는 한국</B>이에요.
          </>,
          <>
            지금 가장 귀한 건 쌓아 올린 창고 <B>HBM</B>, 가장 큰 손님은 <B>데이터센터</B>예요.
          </>,
        ]}
      />
      <Sub t={70}>모래 한 줌이 어떻게 칩이 될까요?</Sub>
      <Pic src="sand-gold" alt="모래 더미와 금괴 사이에서 반짝이는 반도체 칩" />
      <P>
        반도체의 시작은 놀랍게도 <B>모래</B>예요. 모래 속에 든 규소, <W k="실리콘" />이 재료예요. <W k="반도체" />는 쉽게 말해 <B>전기 스위치</B>예요. 전기를 켜고 끄는 아주 작은 스위치 수백억 개를 손톱만 한 조각 위에 모아 둔 거예요.
      </P>
      <P>
        이 글에서는 반도체를 <B>도시 짓기</B>로 볼게요. 둥근 실리콘 원판은 도시를 지을 <B>땅</B>, 칩 하나는 완성된 <B>도시 한 블록</B>이에요. 땅을 고르고, 도시 계획을 세우고, 건물을 올리고, 창고를 짓고, 손님에게 넘기기까지 <M>여섯 정거장</M>을 거쳐요. 정거장마다 무슨 일이 일어나는지, 돈은 누가 받는지, 한국은 어디쯤 있는지를 같이 볼게요.
      </P>
      <Jumps items={STATIONS.map((s) => ({ id: s.id, label: `${s.n}. ${s.name}` }))} />

      {STATIONS.map((s) => (
        <StationCard key={s.id} s={s} />
      ))}

      <News headline="TSMC, 엔비디아 차세대 칩 생산">설계사무소(엔비디아)의 도면대로 건설회사(TSMC)가 짓는다는 뜻이에요. 메모리를 파는 한국 두 회사는 그 칩 옆에 붙는 HBM으로 이 이야기에 들어와요.</News>
      <Remember>모래로 원판을, 빛으로 회로를. 크게 보면 설계는 미국, 건설은 대만, 창고는 한국. 지금 가장 귀한 건 HBM.</Remember>
      <P>그럼 한국은 어떻게 이 창고 짓기 1등이 됐을까요?</P>
      <NextUp to={CH.history}>역사 · 한국 메모리 40년</NextUp>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 2. 역사 — 다섯 장면, 그리고 천국과 지옥                                  */
/* ------------------------------------------------------------------ */

const SCENES: { year: string; title: string; body: ReactNode; src: string }[] = [
  {
    year: "1983",
    title: "도쿄에서의 결심",
    body: (
      <>
        삼성의 반도체 사업은 1974년 파산 직전의 한국반도체를 사들이며 시작됐어요. 미국·일본보다 <B>27년 늦은 출발</B>이었어요. 그리고 1983년 2월 8일 도쿄에서 이병철 회장이 메모리 반도체에 본격적으로 뛰어들기로 결심해요. 이른바 <B>도쿄 선언</B>이에요. 그해 12월, 64K D램을 <B>세계 세 번째</B>로 만들어 내요.
      </>
    ),
    src: "삼성반도체 뉴스룸, MTN 2023.02.08",
  },
  {
    year: "1992",
    title: "일본을 넘어서다",
    body: (
      <>
        64M D램을 <B>세계 최초</B>로 개발하며 일본을 넘어섰어요. 1994년 256M, 1996년 1Gb 제품도 이어서 내놓았어요. 메모리 1등의 시작이에요.
      </>
    ),
    src: "삼성반도체 뉴스룸",
  },
  {
    year: "2007~2012",
    title: "죽어야 끝나는 게임",
    body: (
      <>
        서로 값을 깎으며 누가 먼저 쓰러지나 버틴 <W k="치킨게임" />이에요. D램 값이 <B>6.8달러에서 0.5달러</B>까지 떨어졌어요. 1995년 20곳쯤이던 D램 회사는 <B>세 곳</B>만 남았어요. 독일 키몽다가 2009년, 일본 엘피다가 2012년 파산 신청을 했어요. 2011년에는 SK텔레콤이 약 <B>3조 4,000억 원</B>에 하이닉스 인수 계약을 맺었어요.
      </>
    ),
    src: "SK하이닉스 뉴스룸 2017.09.05, 머니투데이 2012.02.28·2011.11.14",
  },
  {
    year: "2018 · 2023",
    title: "천국과 지옥",
    body: (
      <>
        2018년 두 회사의 반도체 영업이익을 합치면 약 <B>65조 원</B>이었어요. 그런데 2023년엔 합쳐서 <B>22조 원 넘는 적자</B>로 떨어졌어요. 그해 끝자락, SK하이닉스가 HBM 덕에 4분기 흑자로 돌아서며 반전이 시작돼요.
      </>
    ),
    src: "경향신문 2026.05.08, SK하이닉스 뉴스룸 2024.01.25",
  },
  {
    year: "2025~2026",
    title: "1등이 2등이 되고, 다시",
    body: (
      <>
        2025년엔 SK하이닉스 한 곳의 영업이익(약 <B>47조 원</B>)이 폰과 가전까지 다 합친 삼성전자 전체(약 44조 원)보다 많았어요. 올해는 반도체 부문끼리 견주면 삼성이 1분기부터 앞섰고, 3분기엔 삼성 반도체 부문이 약 <B>106조 원</B>, SK하이닉스가 약 <B>83조 원</B>이에요. 다만 HBM 점유율과 100원당 남긴 돈은 아직 SK하이닉스가 앞서요.
      </>
    ),
    src: "헤럴드경제 2026.01.28, 삼성전자 뉴스룸 2026.10.29, SK하이닉스 뉴스룸 2026 1분기·3분기 실적",
  },
];

function HistoryChapter() {
  return (
    <div className="space-y-5">
      <Gist
        items={[
          <>
            한국 메모리는 <B>1983년</B> 도쿄 선언으로 본격 시작해 <B>1992년</B> 일본을 넘었어요.
          </>,
          <>
            반도체는 수요와 공급이 엇갈리며 천국과 지옥을 오가요. 생산을 늘리는 데 <B>2~3년</B>이 걸리거든요. 이걸 <B>사이클</B>이라고 해요.
          </>,
          <>
            2023년 <B>적자</B>에서 올해 1~3분기 <B>431조 원</B>으로, 이익이 크게 널뛰어요.
          </>,
        ]}
      />
      <Sub t={438}>한국 메모리 40년, 다섯 장면</Sub>
      <Pic src="tokyo1983" alt="1980년대 호텔 방, 책상 위에 놓인 오래된 전화기와 종이, 창밖의 밤 풍경" />
      <ol className="space-y-3">
        {SCENES.map((s, i) => (
          <li key={s.year} className="rounded-2xl bg-canvas px-4 py-4 shadow-level-1">
            <p className="flex items-center gap-2">
              <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-brand-dark px-1.5 tabular text-[12px] font-extrabold text-on-primary">{i + 1}</span>
              <span className="tabular type-caption font-extrabold text-primary-text">{s.year}</span>
              <span className="type-body-md font-bold text-ink [word-break:keep-all]">{s.title}</span>
            </p>
            <p className="mt-2 type-body-md leading-[1.8] text-ink-secondary ko-justify">{s.body}</p>
            <Src>{s.src}</Src>
          </li>
        ))}
      </ol>
      <Note kind="industry" title="‘무모하다’는 말">
        <p>1983년 출발 당시 무모하다는 말이 많았다는 이야기가 지금까지 전해져요. 정확한 기록이라기보다 업계에서 전해지는 일화예요.</p>
      </Note>
      <Note title="망해야 끝나던 게임">
        <p>지난 40년의 메모리 시장은 누군가 망해야 살아남은 회사가 돈을 버는 게임이었어요. 그런데 지금은 아무도 망하지 않고 셋 다 크게 벌고 있어요. 이 차이가 어디서 왔는지는 다음 장에서 볼게요.</p>
      </Note>

      <Sub t={507}>왜 천국과 지옥을 오갈까요?</Sub>
      <Pic src="rollercoaster" alt="공장을 실은 롤러코스터가 맑은 하늘로 솟았다가 먹구름 아래로 곤두박질치는 그림" />
      <P src="경향신문 2026.05.08">
        잘 팔리면 다들 공장을 더 지어요. 그런데 공장을 지어 생산이 늘어나기까지 <B>2~3년</B>이 걸려요. 다 지을 즈음엔 수요가 식고 재고가 쌓여요. 값이 떨어지면 생산을 줄이고, 그러다 다시 모자라요. 이렇게 오르내리는 흐름을 반도체 <W k="사이클" />이라고 해요.
      </P>
      <So>아파트로 치면, 분양이 잘된다고 다들 짓기 시작했다가 3년 뒤 입주 물량이 한꺼번에 쏟아지는 셈이에요.</So>
      <P>
        게다가 반도체는 이익이 널뛰어요. 비싼 장비 값은 팔리든 안 팔리든 해마다 비용(<W k="감가상각" />)으로 나가거든요. 월세는 그대로인데 손님만 늘었다 줄었다 하는 식당과 같아요. 그래서 칩 값이 오르면 이익이 폭발하고, 칩 값이 떨어지면 바로 적자예요.
      </P>
      <Bars
        title="삼성전자 반도체 부문 + SK하이닉스 영업이익 합계"
        max={431}
        rows={[
          { k: "2018년", v: 65, show: "약 65조 원" },
          { k: "2019년", v: 16.7, show: "16.7조 원" },
          { k: "2021년", v: 42, show: "42조 원" },
          { k: "2022년", v: 31.5, show: "31.5조 원" },
          { k: "2023년", v: -22.6, show: "-22.6조 원 (적자)" },
          { k: "2026년 1~3분기", v: 431, show: "약 431조 원", hi: true },
        ]}
        note="출처 · 경향신문 2026.05.08 (2018~2023년), 삼성전자 뉴스룸 2026.10.29·SK하이닉스 뉴스룸 2026.10.28 (2026년은 분기 영업이익을 더한 계산값: 삼성 반도체 53.7+89.2+106.5조, SK하이닉스 37.6+60.5+83.3조). 2020년은 같은 자료에 없어 뺐어요."
      />
      <So>2018년 호황 때 두 회사가 한 해 번 돈이 65조 원이었는데, 올해는 9개월 만에 그 <B>6배가 넘어요</B>.</So>
      <News headline="반도체, 1년 만에 적자에서 사상 최대 이익">장비 비용이 그대로인 상태에서 값이 오르면 이익이 몇 배로 커지는 구조라서, 반도체는 이런 반전이 유난히 커요. 거꾸로 값이 떨어질 때도 그만큼 빠르게 줄어요.</News>
      <Remember>생산이 늘기까지 2~3년, 장비 값은 고정. 그래서 반도체 이익은 천국과 지옥을 오가요.</Remember>
      <P>망해야 끝나던 게임에서 지금은 다 같이 벌어요. 이 돈은 어디서 올까요?</P>
      <NextUp to={CH.now}>현재 · AI가 부른 호황</NextUp>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 3. 현재 — AI 호황, 두 회사, 세 도시                                     */
/* ------------------------------------------------------------------ */

function NowChapter() {
  return (
    <div className="space-y-5">
      <Gist
        items={[
          <>
            이번 호황은 많이 팔아서가 아니라 <B>값이 올라서</B> 생겼어요. D램 매출 +369%, 판 양은 +4%예요.
          </>,
          <>
            HBM을 먼저 만드느라 <B>일반 D램이 모자란 것</B>이 폰 값까지 올렸어요.
          </>,
          <>
            <B>워싱턴·베이징·용인</B>, 세 도시가 한국 반도체를 흔들어요.
          </>,
        ]}
      />
      <Jumps
        items={[
          { id: "now-ai", label: "AI가 부른 호황" },
          { id: "now-two", label: "삼성과 SK하이닉스" },
          { id: "now-city", label: "세 도시" },
        ]}
      />

      <Sub t={583} id="now-ai">
        AI가 배가 고파요
      </Sub>
      <Pic src="hungry-ai" alt="데이터센터 안에서 입을 크게 벌린 커다란 서버 괴물에게 컨베이어 벨트로 칩이 끝없이 들어가는 그림" />
      <P src="웰스파고 (머니투데이 2026.08.16)">
        엔비디아의 차세대 AI 서버 랙 한 대(GPU 72개)는 부품값만 약 <B>118억 원</B>이에요. 그 가운데 메모리가 <B>36억 원</B>, 약 31%예요.
      </P>
      <P src="트렌드포스 (SBS Biz 2026.06.02), 비즈워치 2026.10.29, SK하이닉스 뉴스룸 2026.10.28">
        HBM은 손님마다 맞춤으로 만들어서 시세 대신 <W k="장기계약" />으로 팔아요. 삼성전자는 2027년 물량이 다 팔렸다, ‘<W k="솔드아웃" />’이라고 했어요. SK하이닉스는 14개 고객과 장기계약을 맺어 HBM을 포함한 2027~2028년 생산능력의 <B>절반 이상</B>을 이미 팔았다고 밝혔어요. <M>다 짓기도 전에 분양이 끝난 셈</M>이에요.
      </P>

      <Sub>그럼 내 폰 값은 왜 올랐을까요?</Sub>
      <P src="트렌드포스 2026.09.30">
        메모리 회사들이 앞선 생산 라인을 서버용 제품에 <B>먼저</B> 배정했어요. 그만큼 폰·PC에 들어가는 일반 D램을 만들 자리가 줄었어요.
      </P>
      <Note kind="industry" title="고층 창고 하나에 일반 창고 세 채 땅">
        <p>업계에서는 같은 용량을 만들 때 HBM이 일반 D램보다 원판을 3배 넘게 쓴다고 봐요. 고층 창고 하나 짓느라 일반 창고 세 채 지을 땅을 쓰는 셈이에요. HBM 먼저 만드느라 일반 D램이 모자라진 것을, 업계는 D램 값 급등의 큰 이유로 꼽아요.</p>
        <p className="type-caption opacity-75">출처 · SK증권 (뉴데일리 2026.05.31)</p>
      </Note>
      <P src="카운터포인트 2026.11.05">
        그래서 이번 호황은 많이 팔아서 생긴 게 아니에요. 올해 3분기 세계 D램 매출은 1년 전보다 <B>369%</B> 늘었는데, 판 양은 <B>4%</B>만 늘었어요. <M>값이 오른 거예요</M>.
      </P>
      <div className="grid gap-2.5 sm:grid-cols-3">
        <Stat label="SK하이닉스 3분기" value="80원" sub="100원 팔아 남긴 돈 (영업이익률 80%)" />
        <Stat label="삼성전자 반도체 부문 3분기" value="72원" sub="100원 팔아 남긴 돈 (72.4%)" />
        <Stat label="한국 제조업 평균 (2025년)" value="6.9원" sub="100원 팔아 남긴 돈 (삼성·SK 포함)" />
      </div>
      <Src>SK하이닉스 뉴스룸 2026.10.28, 삼성전자 뉴스룸 2026.10.29, 한국은행 기업경영분석 (뉴시스 2026.06.10)</Src>

      <Sub t={672} id="now-two">
        삼성과 SK하이닉스, 1등이 2등이 되고 다시
      </Sub>
      <Pic src="brothers" alt="언덕 위에 나란히 선 두 반도체 공장, 각 공장 옆에 층수가 다른 창고 아파트가 서 있는 그림" />
      <P src="카운터포인트 2026.09.03">
        그런데 이 HBM에선 30년 넘게 메모리 1등인 삼성이 2등이에요. 1년 전인 2025년 2분기 HBM 시장은 SK하이닉스가 <B>64%</B>, 삼성전자가 <B>15%</B>였어요. SK하이닉스가 이 고층 창고를 먼저 지었기 때문이에요.
      </P>
      <P src="뉴시스 2026.02.12, 카운터포인트 2026.09.03">
        올해는 그 차이가 좁혀졌어요. 엔비디아 차세대 GPU에 6세대 HBM(HBM4)이 들어가면서예요. 삼성은 2월에 HBM4를 세계 최초로 대량으로 만들어 내보냈다고 밝혔고, 2분기 점유율은 <B>SK하이닉스 50%, 삼성전자 33%</B>예요.
      </P>
      <Bars
        title="HBM 점유율 — 1년 사이"
        max={64}
        rows={[
          { k: "SK하이닉스 · 2025년 2분기", v: 64, show: "64%", hi: true },
          { k: "SK하이닉스 · 2026년 2분기", v: 50, show: "50%", hi: true },
          { k: "삼성전자 · 2025년 2분기", v: 15, show: "15%" },
          { k: "삼성전자 · 2026년 2분기", v: 33, show: "33%" },
        ]}
        note="출처 · 카운터포인트 2026.09.03"
      />
      <P src="삼성전자 뉴스룸 2026.10.29, SK하이닉스 뉴스룸 2026.10.28">
        3분기 반도체 영업이익은 삼성이 약 <B>106조 원</B>, SK하이닉스가 약 <B>83조 원</B>이에요. 이익의 크기는 삼성이 커요. 그런데 100원 팔아 남긴 돈은 삼성 72원, SK하이닉스 80원이에요.
      </P>
      <So>두 회사 뉴스는 <B>이익의 크기</B>와 <B>100원당 남긴 돈</B>을 같이 봐야 해요. ‘삼성이 다시 앞섰다’는 덩치 이야기이고, HBM 1위와 이익률 1위는 아직 SK하이닉스예요.</So>
      <P src="한국경제 2026.03.24, 디지털데일리 2026.06.10">
        앞으로의 과제도 달라요. 삼성은 TSMC와 겨루는 파운드리에서 멀쩡한 칩이 나오는 비율, <W k="수율" />을 끌어올리는 게 과제로 꼽혀요. SK하이닉스는 늘어난 주문만큼 공장을 늘리는 게 과제예요. 청주 새 공장(M15X)은 올해부터 돌기 시작했고, 용인 첫 공장은 2027년 완공이 목표예요.
      </P>

      <Sub t={759} id="now-city">
        세 도시 — 워싱턴, 베이징, 용인
      </Sub>
      <P>이 싸움엔 두 회사만 있는 게 아니에요. 지금 한국 반도체를 흔드는 세 도시가 있어요.</P>
      <div className="space-y-3">
        <div className="rounded-2xl bg-canvas px-4 py-4 shadow-level-1">
          <p className="type-body-md font-extrabold text-ink">워싱턴 — 관세와 중국 공장</p>
          <div className="mt-2 space-y-2.5">
            <T src="뉴시스 2026.01.15">
              미국은 올해 1월 14일, 미국 기술 공급망에 기여하지 않는 일부 첨단 반도체에 <B>25% 관세</B>를 매긴다고 발표했어요. 한국 제품에 바로 매겨지는지는 발표 기사에 나오지 않아요.
            </T>
            <T src="디지털데일리 2025.08.29, 경향신문 2025.12.30">
              더 큰 걱정은 <B>중국 공장</B>이에요. 삼성과 SK하이닉스는 중국에도 공장이 있는데, 미국이 여기에 장비를 들일 때 따로 묻지 않아도 되던 <W k="포괄허가" />를 2025년 8월 취소한다고 발표했고, 12월 31일부터 효력이 생겼어요. 이제 해마다 허가를 받아야 하고, 공장을 늘릴 수도 없어요.
            </T>
          </div>
          <div className="mt-3">
            <Note kind="industry" title="관세로 때리기 어려운 품목">
              <p>박재근 한양대 교수는 한국 메모리가 미국 AI에 꼭 필요해서 관세를 매기기 어려운 품목이라고 봐요.</p>
              <p className="type-caption opacity-75">출처 · 뉴시스 2026.02.23</p>
            </Note>
          </div>
        </div>
        <div className="rounded-2xl bg-canvas px-4 py-4 shadow-level-1">
          <p className="type-body-md font-extrabold text-ink">베이징 — 중국의 추격</p>
          <div className="mt-2 space-y-2.5">
            <T src="카운터포인트">
              중국 D램 회사 <B>CXMT</B>의 점유율은 2023년 1%도 안 됐는데, 올해는 <B>10% 안팎</B>이에요.
            </T>
            <T src="반도체산업협회 (비즈워치 2026.09.18)">
              한국반도체산업협회는 한국과 중국의 기술 격차를 <B>D램 2년, HBM 약 3년</B>으로 봐요. 중국은 만들기 쉬운 일반 D램부터 따라오고 있어요.
            </T>
          </div>
        </div>
        <div className="rounded-2xl bg-canvas px-4 py-4 shadow-level-1">
          <p className="type-body-md font-extrabold text-ink">용인 — 땅은 정했는데 전기와 물은 아직</p>
          <div className="mt-2 space-y-2.5">
            <Pic src="yongin" alt="언덕 위 반도체 공장 공사 현장으로 오던 송전탑이 중간에서 끊기고, 주민들이 걱정스럽게 보는 그림" />
            <T src="주간경향 2026.01.12">
              용인에 두 회사가 짓는 거대한 반도체 <W k="클러스터" />는 필요한 전기가 <B>10GW 이상</B>, 원전 <B>10기</B>가 넘는 분량이에요.
            </T>
            <T src="주간경향 2026.01.12, 경기연구원">
              그런데 전기를 끌어올 송전탑은 주민 반대에 부딪혔고, 공장에 쓸 물도 넉넉하지 않아요. 땅은 정했는데 전기와 물을 어떻게 끌어올지는 아직 숙제예요.
            </T>
          </div>
        </div>
      </div>
      <News headline="용인 반도체 클러스터 송전선 경로 확정">공장 착공보다 이런 소식이 더 중요할 수 있어요. 전기와 물이 들어와야 공장이 실제로 돌아가거든요.</News>
      <Remember>값이 올라 생긴 호황, HBM이 가져간 땅, 그리고 워싱턴·베이징·용인이라는 숙제.</Remember>
      <P>AI는 배고프고, 공장은 모자라고, 나라들은 다퉈요. 그럼 이 호황은 언제까지 갈까요?</P>
      <NextUp to={CH.outlook}>전망 · 이번엔 다를까</NextUp>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 4. 전망 — 이번엔 다를까                                                 */
/* ------------------------------------------------------------------ */

function OutlookChapter() {
  return (
    <div className="space-y-5">
      <Gist
        items={[
          <>
            전망은 잘 바뀌어요. 두 회사 올해 이익 전망이 1년 남짓 새 <B>7배 넘게</B> 바뀌었어요.
          </>,
          <>
            ‘이번엔 다르다’는 쪽과 ‘거품’이라는 쪽이 갈려요.
          </>,
          <>
            누가 맞을지보다 <B>값이 오르는 속도</B>와 <B>공장이 늘어나는 속도</B>를 같이 보면 돼요.
          </>,
        ]}
      />
      <Sub t={835}>호황일까, 거품일까</Sub>
      <Pic src="balloon" alt="작은 반도체 공장 마을 위에 떠 있는 커다란 주황 풍선을, 한 사람은 망원경으로 기대하며 보고 다른 사람은 바늘을 들고 걱정스럽게 보는 그림" />
      <P src="세계일보 2026.09.30">
        먼저 알아 둘 게 있어요. 전망은 잘 바뀌어요. 2025년 7월 증권사들은 두 회사의 올해 영업이익을 <B>81조 원</B>으로 봤는데, 올해 2월엔 339조 원, 9~10월엔 <B>638조 원</B>이 됐어요. 1년 남짓 사이에 7배 넘게 바뀌었어요.
      </P>
      <div className="grid gap-3 md:grid-cols-2">
        <Note kind="outlook" title="‘이번엔 다르다’는 쪽">
          <p>올해 7월, 당시 엔비디아를 이끌던 젠슨 황은 10년 안에 칩 산업이 5~10배 커질 거라고 했어요. SK하이닉스도 2030년까지 메모리 수요가 공급보다 많을 거라고 봐요.</p>
          <p className="type-caption opacity-75">출처 · Fortune 2026.07.25, SK하이닉스</p>
        </Note>
        <Note kind="outlook" title="‘거품’이라는 쪽">
          <p>투자자 마이클 버리는 2년 안에 생산이 수요를 따라잡으면 메모리에 다시 내리막(하락 사이클)이 올 거라고 내다봤어요. 또 S&amp;P 글로벌 집계를 인용한 보도에 따르면, 미국 빅테크 다섯 곳(아마존·구글·마이크로소프트·메타·오라클)이 번 돈에서 투자를 빼고 남는 돈(잉여현금흐름)이 올해 0에 가까워지고, 내년엔 마이너스 1,250억 달러가 될 거래요. 이 지출을 언제까지 버틸 수 있느냐가 거품론의 질문이에요.</p>
          <p className="type-caption opacity-75">출처 · 마이클 버리 글 2026.09.22 (나스닥닷컴 보도), 머니투데이 2026.08.04 (워싱턴포스트·S&amp;P 글로벌)</p>
        </Note>
      </div>

      <Sub>공장을 짓는 돈도 크게 늘어요</Sub>
      <P src="삼성전자 뉴스룸 2026.10.29, 뉴시스 2026.07.20">
        삼성전자는 올해 <W k="설비투자" />(시설투자)를 <B>84.4조 원</B>, 그 가운데 반도체 부문에 76.8조 원을 쓰기로 했어요. SK하이닉스는 앞으로 5년 동안 생산능력을 <B>두 배</B>로 늘린다는 계획이에요. 앞에서 본 <B>2~3년의 시차</B>를 떠올려 보세요. 지금 짓는 공장이 물건을 쏟아내는 때는 몇 년 뒤에 와요.
      </P>
      <Note kind="outlook" title="위험 구간은 언제쯤?">
        <p>권석준 성균관대 교수는 AI 수요가 둔화되면 공격적인 증설이 2028년께 공급 과잉으로 이어질 수 있다고 경고했어요.</p>
        <p className="type-caption opacity-75">출처 · 뉴시스 2026.07.20</p>
      </Note>

      <Sub>값은 아직 오르지만, 오르는 속도는 줄고 있어요</Sub>
      <P src="트렌드포스 2026.06.01 (1분기 실적)·2026.03.31 (2분기 전망)·2026.09.30 (3분기 추정·4분기 전망)">
        시장조사 회사 트렌드포스 집계로, 일반 D램 <W k="고정거래가격" />은 올해 1분기에 직전 분기보다 <B>93~98%</B> 올랐어요. 그 뒤로 트렌드포스가 내놓은 오름폭 전망·추정치는 2분기 58~63%, 3분기 13~18%, 4분기 10~15%예요.
      </P>
      <Bars
        title="일반 D램 고정거래가격 — 직전 분기보다 얼마나 오르나 (2026년, 트렌드포스)"
        max={98}
        rows={[
          { k: "1분기 (실적)", v: 95.5, show: "+93~98%", hi: true },
          { k: "2분기 (3월 전망)", v: 60.5, show: "+58~63%" },
          { k: "3분기 (9월 추정)", v: 15.5, show: "+13~18%" },
          { k: "4분기 (9월 전망)", v: 12.5, show: "+10~15%" },
        ]}
        note="출처 · 트렌드포스 2026.06.01·03.31·09.30. 막대는 범위의 가운데 값이에요. 10월에는 4분기 전체 D램 값이 약 20% 오를 거라는 트렌드포스 전망도 나왔어요(2026.10.20)."
      />
      <So>여전히 오르지만, 1분기 같은 급등에 비하면 <B>오르는 속도</B>는 크게 줄었어요. ‘상승폭 둔화’는 값이 내린다는 뜻이 아니에요.</So>
      <Note title="뉴스 볼 때 같이 볼 숫자 두 개">
        <p>
          누가 맞을지 맞히기보다, <b>값이 오르는 속도</b>와 <b>공장이 늘어나는 속도</b>를 같이 보면 흐름이 읽혀요. 덜 오르는 것과 떨어지는 건 다른 이야기지만, 공장은 계속 느는데 값이 덜 오른다면 앞 장에서 본 사이클을 떠올려 볼 때예요.
        </p>
        <p>주식을 사고팔 신호가 아니라 업계 흐름을 읽는 방법이에요.</p>
      </Note>
      <Remember>전망은 잘 바뀌니, 값이 오르는 속도와 공장이 늘어나는 속도를 같이 봐요.</Remember>
      <NextUp to={CH.wrap}>정리 · 처음 질문의 답</NextUp>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 5. 정리 — 처음 질문의 답, 뉴스 읽는 법 다섯 줄                           */
/* ------------------------------------------------------------------ */

const FIVE = [
  { k: "D램 가격", v: "오르냐보다 오르는 속도를 봐요." },
  { k: "‘이익 사상 최대’", v: "많이 팔았다기보다 값이 올랐다는 뜻일 수 있어요." },
  { k: "HBM 공급·장기계약", v: "당장이 아니라 1~2년 뒤 매출을 미리 예약한 물량이에요." },
  { k: "설비투자 확대", v: "2~3년 뒤 물건이 늘어난다는 예고예요." },
  { k: "중국의 추격", v: "만들기 쉬운 일반 D램부터 따라오고 있어요." },
];

function WrapChapter() {
  return (
    <div className="space-y-5">
      <Sub t={952}>처음 질문의 답</Sub>
      <div className="rounded-2xl bg-brand-dark px-5 py-5 text-on-primary">
        <p className="type-micro-cap text-on-primary/70">삼성전자와 SK하이닉스는 정확히 뭘 팔까?</p>
        <p className="mt-1.5 type-heading-sm leading-snug [word-break:keep-all]">데이터를 담는 창고, 메모리예요.</p>
        <p className="mt-2 type-body-md leading-relaxed text-on-primary/90 [word-break:keep-all]">
          지금은 AI 공장(GPU) 옆 고층 창고 HBM을 짓느라 일반 창고를 지을 땅이 모자란 게 값이 뛴 큰 이유예요. 그게 내 폰 값과 한국의 수출로 이어졌어요.
        </p>
      </div>

      <Sub t={968}>반도체 뉴스 읽는 법, 다섯 줄</Sub>
      <ol className="space-y-2">
        {FIVE.map((x, i) => (
          <li key={x.k} className="flex gap-3 rounded-2xl bg-canvas px-4 py-3.5 shadow-level-1">
            <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary tabular type-caption font-extrabold text-on-primary">{i + 1}</span>
            <p className="type-body-md text-ink-secondary [word-break:keep-all]">
              <b className="text-ink">{x.k}</b> — {x.v}
            </p>
          </li>
        ))}
      </ol>
      <News headline="D램 고정거래가 27.5달러, 역대 최고">두 회사의 다음 분기 이익은 더 늘고, 다음 폰은 더 비싸질 수 있다는 뜻이에요. 그런데 직전 달보다 몇 % 올랐는지, 그 오름폭이 줄고 있는지가 더 중요한 숫자예요.</News>
      <VideoLink />
      <p className="type-caption text-ink-mute [word-break:keep-all]">
        특정 회사나 주식을 사고팔라고 권하는 글이 아니에요. 두 회사 숫자는 비교하려고 나란히 놓았을 뿐이고, 전망은 각 기관과 발언자의 의견이에요. 숫자는 2026년 11월 15일 기준이에요.
      </p>
      <p className="type-caption text-ink-mute [word-break:keep-all]">산업 A-Z 지난 편은 조선업이었어요. 다음 편에선 뉴스 속 또 어떤 산업을 처음부터 풀어 볼까요?</p>
    </div>
  );
}

function VideoLink() {
  const id = useContext(VideoCtx);
  if (!id) return null;
  return (
    <a href={watchUrl(id)} target="_blank" rel="noopener noreferrer" className={cn("flex items-center gap-3 rounded-2xl bg-[#ff0033] px-4 py-3.5 text-on-primary shadow-level-1 hover:brightness-105", anim)}>
      <Play className="h-6 w-6 shrink-0 fill-current" strokeWidth={0} />
      <span className="min-w-0 flex-1">
        <span className="block type-body-md font-bold">영상으로 한 번 더 보기</span>
        <span className="block type-caption text-on-primary/85">{VIDEO_LENGTH} · 금콩 산업 A to Z · 유튜브</span>
      </span>
      <ArrowRight className="h-4 w-4 shrink-0" strokeWidth={2.2} />
    </a>
  );
}

/* ------------------------------------------------------------------ */
/* 조립                                                                  */
/* ------------------------------------------------------------------ */

const CHAPTERS: GuideChapter[] = [
  { short: "오프닝", title: "폰 값이 오른 이유", lead: "메모리 칩 하나가 1년 반 만에 17배. 그 칩을 파는 게 한국이에요.", bg: "bg-[#f3f6ff]", body: <IntroChapter /> },
  { short: "구조 · 여섯 정거장", title: "구조 — 모래에서 칩까지", lead: "땅 고르기부터 손님에게 넘기기까지. 정거장마다 누가 돈을 받는지 볼게요.", kong: "크게 보면 설계는 미국, 건설은 대만, 창고는 한국!", bg: "bg-[#eef5ff]", body: <BuildChapter /> },
  { short: "역사 · 40년", title: "역사 — 한국 메모리 40년", lead: "다섯 장면으로 보는 1등의 길, 그리고 천국과 지옥을 오가는 이유.", bg: "bg-[#fffaf3]", body: <HistoryChapter /> },
  { short: "현재 · AI 호황", title: "현재 — AI가 부른 호황", lead: "HBM, 삼성과 SK하이닉스, 그리고 워싱턴·베이징·용인.", look: "book", bg: "bg-[#f6f4ff]", body: <NowChapter /> },
  { short: "전망 · 이번엔?", title: "전망 — 이번엔 다를까", lead: "호황이라는 쪽과 거품이라는 쪽. 숫자 두 개로 읽어 봐요.", bg: "bg-[#f2fbf5]", body: <OutlookChapter /> },
  { short: "정리", title: "정리 — 반도체 뉴스 읽는 법", lead: "처음 질문의 답과, 내일부터 뉴스 읽는 다섯 줄.", kong: "다음 산업 편에서 또 만나요!", look: "suit", bg: "bg-[#fff6ec]", body: <WrapChapter /> },
];

export function SemiconductorGuide({ title, video }: { title: string; video: string | null }) {
  return (
    <VideoCtx.Provider value={video}>
      <GlossLayer>
        <GuideShell
          chapters={CHAPTERS}
          eyebrow="금콩 산업 A-Z · 2편 반도체"
          heading={title}
          sub="반도체를 하나도 몰라도 괜찮아요. 영상으로 봐도, 글로 읽어도 같은 이야기예요."
          mascot={null}
          tabsLabel="반도체 A to Z 목차"
          cover={<Cover />}
          coverClass="from-[#e4e6ff]"
        />
      </GlossLayer>
    </VideoCtx.Provider>
  );
}
