"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowRight, BookOpen, Check, Play, X } from "lucide-react";
import { cn } from "../../ui";
import { GuideShell, anim, useGuideGo, type GuideChapter } from "./GuideShell";

/**
 * 산업 A-Z 2편 — 반도체. 같은 내용의 유튜브 영상(금콩 산업 A-Z)과 장 순서를 맞춰, 영상으로 보거나 글로 읽거나 고를 수 있어요.
 * 오프닝 → 구조(여섯 정거장) → 역사(40년 다섯 장면 · 사이클) → 현재(AI 호황 · 두 회사 · 세 도시) → 전망 → 정리.
 * 숫자는 2026-11-15 기준으로 원문과 대조한 것만 써요. 읽는 흐름을 끊지 않게 출처는 문단마다 붙이지 않고, 마지막 장 끝에 접어 둔 목록(REFS)으로 모아요.
 * 영상 나레이션을 그대로 옮기지 않고 글로 읽기 좋게 이어지는 문장으로 다시 썼어요.
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

/** 본문 문단 (큰 글씨) */
function P({ children }: { children: ReactNode }) {
  return <p className="type-body-lg leading-[1.85] text-ink-secondary ko-justify">{children}</p>;
}

/** 카드 안 문단 (보통 글씨) */
function T({ children }: { children: ReactNode }) {
  return <p className="type-body-md leading-[1.8] text-ink-secondary ko-justify">{children}</p>;
}

/** 그래서 — 숫자 다음에 붙는 ‘무슨 뜻이냐’ 한 줄 */
function So({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl bg-ev-written-soft px-3.5 py-2.5">
      <p className="flex gap-2 type-body-md leading-relaxed text-ink [word-break:keep-all]">
        <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-primary" strokeWidth={2.6} />
        <span>
          <b className="text-primary-text">그래서 · </b>
          {children}
        </span>
      </p>
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
function Pic({ src, alt }: { src: string; alt: string }) {
  return (
    <figure className="overflow-hidden rounded-2xl bg-canvas shadow-level-1">
      {/* eslint-disable-next-line @next/next/no-img-element -- 영상에 쓴 장면 그림 (public/magazine/semi) */}
      <img src={`/magazine/semi/${src}.webp`} width={1200} height={675} alt={alt} loading="lazy" decoding="async" className="block h-auto w-full" />
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
  { title: "오프닝 · 폰 값이 오른 이유", hint: "메모리 칩 값 17배, 수출의 절반" },
  { title: "구조 · 모래에서 칩까지", hint: "여섯 단계마다 누가 돈을 받을까" },
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
          <p className="type-body-md text-ink-secondary ko-justify">같은 이야기를 영상과 글로 준비했어요. 편한 쪽으로 골라 보세요.</p>
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
              <span className="block type-caption text-on-primary/80">약 20분 · 영상에 다 못 담은 숫자까지</span>
            </span>
            <ArrowRight className="h-4 w-4 shrink-0" strokeWidth={2.2} />
          </button>
          <p className="type-caption text-ink-mute [word-break:keep-all]">영상과 글은 같은 순서로 이어져요. 글을 읽다가 소제목 옆 ▶ 버튼을 누르면 영상의 같은 장면으로 가요.</p>
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
          <span className="border-b border-dashed border-primary/70">점선 밑줄</span>이 있는 말은 누르면 뜻이 나와요. 숫자는 정부·회사 발표, 시장조사 회사 집계, 언론 보도로 확인했고, 확인한 자료는 마지막 장 끝에 모아 뒀어요. 사실이 아닌 문장은 아래 셋으로 따로 표시했어요. 2026년 11월 15일 기준이에요.
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
      <P>
        올해 10월, 갤럭시 S26(256GB)의 국내 가격이 <B>125만 4,000원에서 140만 3,600원</B>으로 올랐어요. 출시된 지 7개월 만에 14만 9,600원, 약 15만 원이 오른 거예요. 새로 나온 아이폰 프로도 이전 모델보다 <B>20만 원</B> 비싸게 나왔어요. 보통 폰은 나온 지 시간이 지날수록 값이 내려가는데, 이번에는 거꾸로였어요.
      </P>
      <P>
        가장 큰 이유로 꼽히는 건 폰 안에 들어가는 <W k="메모리" /> 칩이에요. 대표적인 D램 칩 하나의 도매값은 2025년 4월 <B>약 2,400원</B>이었는데, 1년 반 뒤인 올해 10월에는 <B>약 3만 9,000원</B>이 됐어요. 값이 <M>17배</M> 오른 거예요. 생수 한 병 값이 치킨 한 마리 값이 된 것과 비슷해요.
      </P>
      <P>
        이렇게 비싸진 칩을 파는 나라가 바로 한국이에요. 한국은 10월 한 달 동안 반도체를 <B>564억 달러</B>어치 수출했는데, 그달 전체 수출의 <B>49%</B>로 거의 절반이에요. 반도체 한 달 수출액이 지난해 1년 동안의 선박 수출액(약 320억 달러)보다 <B>1.8배</B> 많아요.
      </P>
      <So>폰 값을 끌어올린 메모리 칩이 한국 수출에는 가장 큰 효자가 된 셈이에요. 그 칩을 만드는 곳이 뉴스에 매일 나오는 두 회사예요.</So>

      <div className="rounded-2xl bg-brand-dark px-5 py-5 text-on-primary">
        <p className="type-micro-cap text-on-primary/70">오늘의 질문</p>
        <p className="mt-1.5 type-heading-sm leading-snug [word-break:keep-all]">삼성전자와 SK하이닉스는 정확히 무엇을 팔기에 이렇게 많이 벌고, 내 폰 값까지 올렸을까요?</p>
      </div>
      <P>
        삼성전자, SK하이닉스, 팹, GPU, HBM은 뉴스에서 자주 보는 말이지만, 이 회사들이 정확히 무엇을 만들어 이렇게 큰돈을 버는지 설명하기는 쉽지 않아요. 이 글은 네 단계로 답을 찾아가요. 먼저 칩이 만들어지는 <B>구조</B>를 보고, 한국이 메모리 1등이 된 <B>역사</B>를 거쳐, AI가 불러온 <B>현재</B>의 호황과 앞으로의 <B>전망</B>까지 이어서 살펴봐요. 마지막 장에서 처음 질문에 답해요.
      </P>
      <ol className="space-y-2">
        {[
          { to: CH.build, q: "구조 — 모래가 어떻게 칩이 될까" },
          { to: CH.history, q: "역사 — 한국은 어떻게 메모리 1등이 됐을까" },
          { to: CH.now, q: "현재 — AI는 왜 메모리를 이렇게 많이 쓸까" },
          { to: CH.outlook, q: "전망 — 이번 호황은 다를까, 거품일까" },
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
/* 1. 구조 — 모래에서 칩까지, 여섯 단계                                     */
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
        <T>
          먼저 모래에서 뽑아낸 <W k="실리콘" />을 아주 높은 온도로 녹인 뒤, 불순물이 거의 없는 커다란 기둥으로 굳혀요. 순도는 <B>99.9999999%</B>로, 알갱이 10억 개 가운데 티끌이 하나 섞일까 말까 한 수준이에요. 이 기둥을 얇게 썰면 지름 <B>300mm</B>의 둥근 원판, 곧 <W k="웨이퍼" />가 나와요. 웨이퍼 한 장 위에서 칩이 수백에서 수천 개씩 한꺼번에 만들어져요.
        </T>
        <T>
          아무것도 그리지 않은 웨이퍼는 한 장에 <B>100달러 안팎</B>(약 15만 원)이에요. 이 시장은 일본의 <B>신에츠와 섬코</B> 등이 절반 넘게 차지하고 있고, 한국의 <B>SK실트론</B>은 3위권 회사로 평가돼요. 순위는 집계에 따라 조금씩 달라요.
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
        <T>
          2025년에 반도체를 세계에서 가장 많이 판 회사는 미국 <B>엔비디아</B>(1,257억 달러)이고, 삼성전자와 SK하이닉스가 2·3위로 그 뒤를 이었어요. 그런데 1위인 엔비디아에는 반도체 공장(<W k="팹" />)이 <B>하나도 없어요</B>. 칩을 설계만 하고, 실제 생산은 다른 회사에 맡기기 때문이에요.
        </T>
        <T>
          이렇게 설계만 하는 회사를 <W k="팹리스" />라고 하고, 남의 설계도대로 칩을 대신 만들어 주는 회사를 <W k="파운드리" />라고 해요. 도시에 빗대면 팹리스는 건축설계사무소, 파운드리는 설계도대로 건물을 짓는 건설회사예요. 파운드리 시장은 대만 <B>TSMC</B>가 70%대를 차지하고, 삼성전자는 6~7% 수준이에요. 한국 팹리스 회사들은 세계 설계 시장에서 <B>1% 안팎</B>에 머물러 있어요.
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
    korea: "한국 공장 장비 가운데 국산은 약 20%",
    body: (
      <>
        <T>
          설계도를 웨이퍼에 옮기는 과정은 필름 사진을 인화하는 것과 비슷해요. 빛으로 회로 그림을 찍고, 필요 없는 부분을 깎아 내고, 그 위에 새 층을 쌓는 일을 수십에서 수백 번 되풀이해요. 그래서 웨이퍼 한 장이 공장에 들어가 칩이 되어 나오기까지 <B>3~4개월</B>이 걸려요.
        </T>
        <T>
          회로 선은 <W k="나노" />미터 단위로 그려요. 머리카락 굵기가 약 10만 나노미터인데, 최신 칩은 ‘2나노’로 불려요. 이름대로라면 머리카락의 5만 분의 1이지만, 요즘의 ‘2나노’는 실제 선 굵기보다는 기술 세대를 가리키는 이름에 가까워요.
        </T>
        <T>
          이렇게 가는 선을 새기는 기계가 <W k="노광장비" />이고, 그 가운데 가장 앞선 것이 아주 짧은 빛을 쓰는 <W k="EUV" /> 장비예요. EUV 장비는 세계에서 네덜란드 <B>ASML</B> 한 곳만 만들 수 있고, 2025년에 <B>48대</B>를 출하했어요. 최신 장비(High-NA)는 2024년 보도 기준으로 한 대 3억 8,000만 달러, 약 <B>5,400억 원</B>이에요. 조선업 편에서 본 LNG선 한 척(약 3,500억 원)보다 비싼 기계예요.
        </T>
        <T>
          장비가 이만큼 비싸다 보니 회로를 새긴 웨이퍼 값도 크게 뛰어요. 2025년 초 외신 추정에 따르면, TSMC에 최신 공정 작업을 맡길 때 웨이퍼 한 장 값은 최대 <B>3만 달러</B>(약 4,300만 원)예요. 15만 원짜리 원판이 큰 차 한 대 값이 되는 셈이에요.
        </T>
        <T>
          한국은 메모리에서는 세계 1등이지만, 이 단계에 쓰는 장비는 대부분 외국산이에요. 한국 반도체 공장에 들어가는 장비 가운데 국산은 <B>약 20%</B>에 그쳐요.
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
          반도체는 크게 두 종류로 나뉘어요. 계산하고 명령을 내리는 <W k="시스템반도체" />와 데이터를 저장하는 <W k="메모리" />예요. 시스템반도체를 도시의 공장이라고 하면, 메모리는 물건을 보관하는 창고예요.
        </T>
        <T>
          메모리는 다시 전원을 끄면 내용이 사라지는 <W k="D램" />과 전원을 꺼도 남는 <W k="낸드" />로 나뉘어요. D램은 지금 쓰는 데이터를 잠깐 올려 두는 빠른 창고이고, 폰을 살 때 고르는 256GB 같은 저장 용량은 낸드예요.
        </T>
        <T>
          한국은 이 창고를 가장 잘 짓는 나라예요. 올해 3분기 세계 D램 시장에서 <B>삼성전자가 38%, SK하이닉스가 29%</B>를 차지해, 두 회사를 합치면 <M>세계 D램의 67%</M>가 한국산이에요. 미국 마이크론(21%)과 중국 CXMT(9%)가 그 뒤를 잇고 있어요.
        </T>
        <T>
          D램은 어느 회사 제품이든 규격이 거의 같아서 원유처럼 시세가 있어요. 뉴스에서 말하는 ‘D램 가격’은 보통 메모리 회사가 큰 고객과 미리 정한 도매값인 <W k="고정거래가격" />이에요. 메모리는 그동안 반도체 시장 전체의 <B>20~30%</B> 정도였는데, 올해는 사상 처음으로 <B>절반(50~55%)</B>을 넘을 것이라는 전망이 나왔어요.
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
          요즘 가장 귀한 메모리는 D램을 위로 쌓아 올린 <W k="HBM" />이에요. HBM은 AI 계산을 맡는 칩인 <W k="GPU" />와 짝을 이뤄요. GPU는 원래 게임 그래픽용으로 만들어졌지만, 수많은 계산을 동시에 처리하는 능력 덕분에 AI의 핵심 칩이 됐어요.
        </T>
        <T>
          GPU를 AI 공장이라고 하면, 이 공장은 재료인 데이터가 빨리 들어와야 제대로 돌아가요. 그래서 공장 바로 옆에 붙인 고층 창고가 HBM이에요. D램을 <B>8장에서 16장</B>까지 쌓고, 세로로 작은 구멍(<W k="TSV" />)을 뚫어 엘리베이터처럼 위아래를 이어요.
        </T>
        <T>
          업계 추정으로 2025년 말 HBM3E 8단 하나의 값은 약 <B>300달러</B>(약 43만 원)였고, 12단은 300~500달러 선이었어요. 엔비디아 GPU 한 개 옆에는 HBM이 <B>8개</B> 붙으니, 8단 값으로만 계산해도 칩 하나에 메모리가 <B>340만 원어치</B>쯤 들어가요.
        </T>
        <T>
          올해 2분기 HBM 시장은 <B>SK하이닉스 50%, 삼성전자 33%</B>, 마이크론 18%로, 한국 두 회사가 83%를 차지해요. D램을 쌓아 붙이는 장비(TC본더)도 한국 한미반도체가 세계의 71.2%를 공급해요. 다만 GPU와 HBM을 한 판 위에 붙이는 마지막 포장(CoWoS)은 TSMC가 맡고 있어요.
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
        <T>
          이렇게 만든 메모리의 가장 큰 손님은 AI를 돌리는 컴퓨터를 모아 둔 <W k="데이터센터" />예요. 시장조사 회사 카운터포인트는 올해 생산되는 D램의 <B>57%</B>가 데이터센터로 갈 것으로 봐요.
        </T>
        <T>
          미국 은행 웰스파고의 추산으로는 엔비디아의 차세대 AI 서버 랙 한 대(베라 루빈 NVL72, GPU 72개)의 부품값이 약 <B>834만 달러(약 118억 원)</B>인데, 이 가운데 메모리(HBM과 LPDDR)가 <B>257만 달러(약 36억 원)</B>로 3분의 1 가까이 돼요.
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
          {s.name}
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
      <Sub t={70}>모래에서 칩까지</Sub>
      <Pic src="sand-gold" alt="모래 더미와 금괴 사이에서 반짝이는 반도체 칩" />
      <P>
        반도체의 재료는 모래예요. 모래에 많이 들어 있는 규소, 곧 <W k="실리콘" />이 원료가 돼요. <W k="반도체" />는 쉽게 말해 전기를 켜고 끄는 아주 작은 스위치예요. 손톱만 한 칩 하나에 이런 스위치가 수백억 개 들어 있어요.
      </P>
      <P>
        이 글에서는 반도체 만들기를 <B>도시 짓기</B>에 빗대 볼게요. 둥근 실리콘 원판은 도시를 지을 땅이고, 완성된 칩 하나는 도시의 한 블록이에요. 땅을 고르고(원판), 도시 계획을 세우고(설계), 건물을 올리고(회로 새기기), 창고를 짓고(메모리), 창고를 높이 쌓아(HBM), 손님에게 넘기기(데이터센터)까지 모두 <M>여섯 단계</M>를 거쳐요. 단계마다 어떤 일이 일어나는지, 돈은 누가 받는지, 한국은 어디쯤 있는지를 함께 정리했어요.
      </P>
      <Jumps items={STATIONS.map((s) => ({ id: s.id, label: `${s.n}. ${s.name}` }))} />

      {STATIONS.map((s) => (
        <StationCard key={s.id} s={s} />
      ))}

      <News headline="TSMC, 엔비디아 차세대 칩 생산">설계사무소(엔비디아)의 도면대로 건설회사(TSMC)가 칩을 짓는다는 뜻이에요. 한국 두 회사는 그 칩 옆에 붙는 HBM을 팔면서 이 이야기에 들어와요.</News>
      <Remember>모래로 원판을, 빛으로 회로를. 크게 보면 설계는 미국, 건설은 대만, 창고는 한국. 지금 가장 귀한 건 HBM.</Remember>
      <P>다음 장에서는 한국이 어떻게 이 창고 짓기의 1등이 됐는지 살펴봐요.</P>
      <NextUp to={CH.history}>역사 · 한국 메모리 40년</NextUp>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 2. 역사 — 다섯 장면, 그리고 천국과 지옥                                  */
/* ------------------------------------------------------------------ */

const SCENES: { year: string; title: string; body: ReactNode }[] = [
  {
    year: "1983",
    title: "도쿄 선언",
    body: (
      <>
        삼성의 반도체 사업은 1974년 파산 직전의 한국반도체를 인수하며 시작됐어요. 미국·일본보다 <B>27년 늦은 출발</B>이었어요. 이후 1983년 2월 8일 도쿄에서 이병철 회장이 메모리 반도체에 본격적으로 뛰어들기로 결심했는데, 이를 <B>도쿄 선언</B>이라고 불러요. 같은 해 12월 삼성은 64K D램을 <B>세계 세 번째</B>로 개발했어요.
      </>
    ),
  },
  {
    year: "1992",
    title: "일본을 앞지르다",
    body: (
      <>
        삼성은 64M D램을 <B>세계 최초</B>로 개발하며 일본을 앞질렀고, 1994년 256M, 1996년 1Gb 제품도 잇달아 내놓았어요. 한국 메모리 1등 시대가 이때 시작됐어요.
      </>
    ),
  },
  {
    year: "2007~2012",
    title: "죽어야 끝나는 게임",
    body: (
      <>
        D램 회사들이 서로 값을 깎으며 누가 먼저 버티지 못하는지 겨루는 <W k="치킨게임" />이 벌어졌어요. 이 기간 D램 값은 <B>6.8달러에서 0.5달러</B>까지 떨어졌고, 독일 키몽다(2009년)와 일본 엘피다(2012년)가 파산 신청을 했어요. 1995년 20곳쯤이던 D램 회사는 결국 삼성·하이닉스·마이크론 <B>세 곳</B>만 남았어요. 이 무렵인 2011년, SK텔레콤이 약 3조 4,000억 원에 하이닉스 인수 계약을 맺었어요.
      </>
    ),
  },
  {
    year: "2018 · 2023",
    title: "천국과 지옥",
    body: (
      <>
        2018년 두 회사의 반도체 영업이익은 합쳐서 약 <B>65조 원</B>이었어요. 그런데 2023년에는 합쳐서 <B>22조 원이 넘는 적자</B>를 냈어요. 반전은 그해 끝자락에 시작됐어요. SK하이닉스가 HBM 판매에 힘입어 4분기에 흑자로 돌아선 거예요.
      </>
    ),
  },
  {
    year: "2025~2026",
    title: "1등이 2등이 되고, 다시",
    body: (
      <>
        2025년에는 SK하이닉스 한 곳의 영업이익(약 <B>47조 원</B>)이 폰과 가전까지 다 합친 삼성전자 전체(약 44조 원)보다 많았어요. 올해는 반도체 부문끼리 견주면 삼성이 1분기부터 앞섰고, 3분기에는 삼성 반도체 부문이 약 <B>106조 원</B>, SK하이닉스가 약 <B>83조 원</B>을 벌었어요. 다만 HBM 점유율과 100원당 남긴 돈은 아직 SK하이닉스가 앞서요.
      </>
    ),
  },
];

function HistoryChapter() {
  return (
    <div className="space-y-5">
      <Gist
        items={[
          <>
            한국 메모리는 <B>1983년</B> 도쿄 선언으로 본격 시작해 <B>1992년</B> 일본을 앞질렀어요.
          </>,
          <>
            반도체는 수요와 공급이 엇갈리며 천국과 지옥을 오가요. 생산을 늘리는 데 <B>2~3년</B>이 걸리기 때문이에요. 이 흐름을 <B>사이클</B>이라고 해요.
          </>,
          <>
            두 회사 이익은 2023년 <B>적자</B>에서 올해 1~3분기 <B>약 431조 원</B>으로 크게 널뛰었어요.
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
          </li>
        ))}
      </ol>
      <Note kind="industry" title="‘무모하다’는 말">
        <p>1983년 출발 당시 무모하다는 말이 많았다는 이야기가 지금까지 전해져요. 정확한 기록이라기보다 업계에서 전해지는 일화예요.</p>
      </Note>
      <Note title="망해야 끝나던 게임">
        <p>지난 40년 동안 메모리 시장은 누군가 무너져야 살아남은 회사가 돈을 버는 구조였어요. 그런데 지금은 세 회사 모두 큰 이익을 내고 있어요. 그 차이를 만든 게 무엇인지는 ‘현재’ 장에서 이어서 볼게요.</p>
      </Note>

      <Sub t={507}>반도체가 천국과 지옥을 오가는 이유</Sub>
      <Pic src="rollercoaster" alt="공장을 실은 롤러코스터가 맑은 하늘로 솟았다가 먹구름 아래로 곤두박질치는 그림" />
      <P>
        반도체가 잘 팔리면 회사들은 앞다퉈 공장을 늘려요. 그런데 공장을 지어 생산이 늘어나기까지는 <B>2~3년</B>이 걸려요. 그사이 수요가 식으면 새 공장에서 나온 물량이 재고로 쌓이고, 값이 떨어지면 회사들은 생산을 줄여요. 그러다 다시 물건이 모자라면 값이 올라요. 수요와 공급이 이렇게 엇갈리며 오르내리는 흐름을 반도체 <W k="사이클" />이라고 해요.
      </P>
      <So>분양이 잘된다고 다들 아파트를 짓기 시작했다가, 3년 뒤 입주 물량이 한꺼번에 쏟아지는 것과 비슷해요.</So>
      <P>
        이익이 오르내리는 폭이 유난히 큰 것도 반도체의 특징이에요. 공장 장비 값은 제품이 팔리든 안 팔리든 해마다 비용(<W k="감가상각" />)으로 나가요. 그래서 칩 값이 오르면 늘어난 매출이 대부분 이익으로 남고, 칩 값이 떨어지면 곧바로 적자가 나요. 월세는 그대로인데 손님 수만 크게 오르내리는 식당과 비슷해요.
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
        note="2026년은 1~3분기 영업이익을 더한 값이에요(삼성 반도체 부문 53.7+89.2+106.5조 원, SK하이닉스 37.6+60.5+83.3조 원). 2020년은 같은 자료에 숫자가 없어 뺐어요."
      />
      <So>2018년 호황 때 두 회사가 1년 동안 번 돈이 65조 원이었는데, 올해는 9개월 만에 그 <B>6배가 넘는</B> 돈을 벌었어요.</So>
      <News headline="반도체, 1년 만에 적자에서 사상 최대 이익">장비 비용은 그대로인데 값이 오르면 이익이 몇 배로 커지는 구조라서, 반도체는 이런 반전이 유난히 커요. 거꾸로 값이 떨어질 때도 이익이 그만큼 빠르게 줄어요.</News>
      <Remember>생산이 늘기까지 2~3년, 장비 값은 고정. 그래서 반도체 이익은 천국과 지옥을 오가요.</Remember>
      <P>누군가 무너져야 끝나던 게임에서 지금은 모두가 돈을 벌고 있어요. 그 돈이 어디서 오는지 다음 장에서 볼게요.</P>
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
            이번 호황은 많이 팔아서가 아니라 <B>값이 올라서</B> 생겼어요. D램 매출은 369% 늘었지만 판매량은 4% 늘었어요.
          </>,
          <>
            HBM을 먼저 만드느라 <B>일반 D램이 모자란 것</B>이 폰 값까지 끌어올렸어요.
          </>,
          <>
            <B>워싱턴·베이징·용인</B>, 세 도시가 한국 반도체의 앞날을 흔들어요.
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
        AI가 메모리를 먹어 치워요
      </Sub>
      <Pic src="hungry-ai" alt="데이터센터 안에서 입을 크게 벌린 커다란 서버 괴물에게 컨베이어 벨트로 칩이 끝없이 들어가는 그림" />
      <P>
        이번 호황의 돈은 AI에서 나와요. 웰스파고 추산으로 엔비디아의 차세대 AI 서버 랙 한 대는 부품값만 약 <B>118억 원</B>인데, 그 가운데 약 31%인 <B>36억 원</B>이 메모리예요. AI 서버가 늘어날수록 메모리 수요도 함께 커지는 구조예요.
      </P>
      <P>
        특히 HBM은 고객마다 맞춤으로 만들기 때문에 시세가 아니라 1년 이상 앞서 맺는 <W k="장기계약" />으로 팔려요. 삼성전자는 2027년 HBM 물량이 이미 다 팔렸다(<W k="솔드아웃" />)고 밝혔고, SK하이닉스는 14개 고객과 장기계약을 맺어 HBM을 포함한 2027~2028년 생산능력의 <B>절반 이상</B>을 이미 팔았다고 했어요. <M>공장을 다 짓기도 전에 분양이 끝난 셈</M>이에요.
      </P>

      <Sub>그렇다면 폰 값은 왜 올랐을까</Sub>
      <P>메모리 회사들이 앞선 생산 라인을 서버용 제품에 먼저 배정하면서, 폰과 PC에 들어가는 일반 D램을 만들 자리가 그만큼 줄었어요.</P>
      <Note kind="industry" title="고층 창고 하나에 일반 창고 세 채 땅">
        <p>업계에서는 같은 용량을 만들 때 HBM이 일반 D램보다 웨이퍼를 3배 넘게 쓴다고 봐요. 고층 창고 하나를 짓느라 일반 창고 세 채를 지을 땅을 쓰는 셈이에요. 이렇게 일반 D램이 모자라진 것을 업계는 D램 값이 급등한 큰 이유로 꼽아요.</p>
      </Note>
      <P>
        그래서 이번 호황은 많이 팔아서 생긴 게 아니라 값이 올라서 생겼어요. 올해 3분기 세계 D램 매출은 1년 전보다 <B>369%</B> 늘었지만, 판매량은 <B>4%</B> 늘어나는 데 그쳤어요. 값이 오르자 이익도 크게 불어났어요.
      </P>
      <div className="grid gap-2.5 sm:grid-cols-3">
        <Stat label="SK하이닉스 3분기" value="80원" sub="100원 팔아 남긴 돈 (영업이익률 80%)" />
        <Stat label="삼성전자 반도체 부문 3분기" value="72원" sub="100원 팔아 남긴 돈 (72.4%)" />
        <Stat label="한국 제조업 평균 (2025년)" value="6.9원" sub="100원 팔아 남긴 돈 (삼성·SK 포함)" />
      </div>

      <Sub t={672} id="now-two">
        삼성과 SK하이닉스, 1등이 2등이 되고 다시
      </Sub>
      <Pic src="brothers" alt="언덕 위에 나란히 선 두 반도체 공장, 각 공장 옆에 층수가 다른 창고 아파트가 서 있는 그림" />
      <P>
        30년 넘게 메모리 1등을 지켜 온 삼성이지만, HBM에서는 2등이에요. 2025년 2분기 HBM 시장은 SK하이닉스가 <B>64%</B>, 삼성전자가 <B>15%</B>를 차지했어요. SK하이닉스가 HBM을 먼저 키운 결과예요.
      </P>
      <P>
        올해는 격차가 좁혀졌어요. 엔비디아의 차세대 GPU에 6세대 HBM(HBM4)이 들어가면서 판이 다시 짜였기 때문이에요. 삼성은 2월에 HBM4를 세계 최초로 양산해 출하했다고 밝혔고, 올해 2분기 점유율은 <B>SK하이닉스 50%, 삼성전자 33%</B>가 됐어요.
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
      />
      <P>
        이익을 보면 두 회사는 또 다른 모습이에요. 올해 3분기 반도체 영업이익은 삼성이 약 <B>106조 원</B>, SK하이닉스가 약 <B>83조 원</B>으로 규모는 삼성이 커요. 하지만 매출 100원당 남긴 이익은 삼성 72원, SK하이닉스 80원으로 SK하이닉스가 높아요.
      </P>
      <So>두 회사 뉴스는 <B>이익의 크기</B>와 <B>100원당 남긴 돈</B>을 같이 봐야 해요. ‘삼성이 다시 앞섰다’는 덩치 이야기이고, HBM 1위와 이익률 1위는 아직 SK하이닉스예요.</So>
      <P>
        앞으로의 과제도 달라요. 삼성은 TSMC와 겨루는 파운드리에서 멀쩡한 칩이 나오는 비율인 <W k="수율" />을 끌어올리는 것이 과제로 꼽혀요. SK하이닉스는 늘어난 주문만큼 공장을 늘려야 해요. 청주 새 공장(M15X)은 올해부터 가동을 시작했고, 용인 첫 공장은 2027년 완공이 목표예요.
      </P>

      <Sub t={759} id="now-city">
        세 도시 — 워싱턴, 베이징, 용인
      </Sub>
      <P>두 회사의 앞날은 회사 바깥의 세 도시에도 달려 있어요. 미국 워싱턴, 중국 베이징, 그리고 경기 용인이에요.</P>
      <div className="space-y-3">
        <div className="rounded-2xl bg-canvas px-4 py-4 shadow-level-1">
          <p className="type-body-md font-extrabold text-ink">워싱턴 — 관세와 중국 공장</p>
          <div className="mt-2 space-y-2.5">
            <T>
              미국은 올해 1월 14일, 미국 기술 공급망에 기여하지 않는 일부 첨단 반도체에 <B>25% 관세</B>를 매기겠다고 발표했어요. 한국 제품에 곧바로 적용되는지는 발표에 나오지 않았어요.
            </T>
            <T>
              더 큰 걱정은 두 회사의 <B>중국 공장</B>이에요. 미국은 이 공장들이 미국 장비를 들여올 때 매번 허가받지 않아도 되게 해 주던 <W k="포괄허가" />를 2025년 8월 취소한다고 발표했고, 12월 31일부터 효력이 생겼어요. 이제 해마다 허가를 받아야 하고, 공장을 늘릴 수도 없어요.
            </T>
          </div>
          <div className="mt-3">
            <Note kind="industry" title="관세로 때리기 어려운 품목">
              <p>박재근 한양대 교수는 한국 메모리가 미국 AI에 꼭 필요해서 관세를 매기기 어려운 품목이라고 봐요.</p>
            </Note>
          </div>
        </div>
        <div className="rounded-2xl bg-canvas px-4 py-4 shadow-level-1">
          <p className="type-body-md font-extrabold text-ink">베이징 — 중국의 추격</p>
          <div className="mt-2 space-y-2.5">
            <T>
              중국 D램 회사 <B>CXMT</B>의 점유율은 2023년 1%도 안 됐지만, 올해는 <B>10% 안팎</B>까지 올라왔어요. 한국반도체산업협회는 한국과 중국의 기술 격차를 <B>D램 2년, HBM 약 3년</B>으로 봐요. 중국은 만들기 쉬운 일반 D램부터 따라오고 있어요.
            </T>
          </div>
        </div>
        <div className="rounded-2xl bg-canvas px-4 py-4 shadow-level-1">
          <p className="type-body-md font-extrabold text-ink">용인 — 땅은 정했지만 전기와 물은 아직</p>
          <div className="mt-2 space-y-2.5">
            <Pic src="yongin" alt="언덕 위 반도체 공장 공사 현장으로 오던 송전탑이 중간에서 끊기고, 주민들이 걱정스럽게 보는 그림" />
            <T>
              두 회사가 용인에 짓는 반도체 <W k="클러스터" />에는 <B>10GW 이상</B>, 원전 <B>10기</B>가 넘는 분량의 전기가 필요해요. 하지만 전기를 끌어올 송전탑은 주민 반대에 부딪혔고, 공장에 쓸 물도 넉넉하지 않아요. 땅은 정했지만 전기와 물을 어떻게 끌어올지는 아직 숙제로 남아 있어요.
            </T>
          </div>
        </div>
      </div>
      <News headline="용인 반도체 클러스터 송전선 경로 확정">공장 착공보다 이런 소식이 더 중요할 수 있어요. 전기와 물이 들어와야 공장이 실제로 돌아가기 때문이에요.</News>
      <Remember>값이 올라 생긴 호황, HBM이 가져간 생산 라인, 그리고 워싱턴·베이징·용인이라는 숙제.</Remember>
      <P>AI 수요는 크고, 공장은 모자라고, 나라 사이의 다툼도 이어지고 있어요. 다음 장에서는 이 호황이 언제까지 이어질지를 두고 엇갈리는 시선을 살펴봐요.</P>
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
            전망은 자주, 크게 바뀌어요. 두 회사의 올해 이익 전망은 1년 남짓 사이에 <B>7배 넘게</B> 바뀌었어요.
          </>,
          <>‘이번엔 다르다’는 쪽과 ‘거품’이라는 쪽의 시선이 엇갈려요.</>,
          <>
            누가 맞을지보다 <B>값이 오르는 속도</B>와 <B>공장이 늘어나는 속도</B>를 같이 보면 흐름이 읽혀요.
          </>,
        ]}
      />
      <Sub t={835}>호황일까, 거품일까</Sub>
      <Pic src="balloon" alt="작은 반도체 공장 마을 위에 떠 있는 커다란 주황 풍선을, 한 사람은 망원경으로 기대하며 보고 다른 사람은 바늘을 들고 걱정스럽게 보는 그림" />
      <P>
        전망을 볼 때 먼저 알아 둘 점이 있어요. 전망은 생각보다 자주, 크게 바뀌어요. 2025년 7월 증권사들은 두 회사의 올해 영업이익을 <B>81조 원</B>으로 예상했는데, 올해 2월에는 339조 원, 9~10월에는 <B>638조 원</B>으로 높여 잡았어요. 1년 남짓 사이에 예상치가 7배 넘게 바뀐 거예요.
      </P>
      <div className="grid gap-3 md:grid-cols-2">
        <Note kind="outlook" title="‘이번엔 다르다’는 쪽">
          <p>올해 7월, 당시 엔비디아를 이끌던 젠슨 황은 10년 안에 칩 산업이 5~10배 커질 거라고 내다봤어요. SK하이닉스도 2030년까지 메모리 수요가 공급보다 많을 것으로 봐요.</p>
        </Note>
        <Note kind="outlook" title="‘거품’이라는 쪽">
          <p>투자자 마이클 버리는 2년 안에 생산이 수요를 따라잡으면 메모리에 다시 하락 사이클이 올 거라고 내다봤어요. S&amp;P 글로벌 집계를 인용한 보도에 따르면, 미국 빅테크 다섯 곳(아마존·구글·마이크로소프트·메타·오라클)이 번 돈에서 투자를 빼고 남는 돈(잉여현금흐름)은 올해 0에 가까워지고 내년에는 마이너스 1,250억 달러가 될 전망이에요. 이 지출을 언제까지 버틸 수 있느냐가 거품론의 핵심 질문이에요.</p>
        </Note>
      </div>

      <Sub>공장을 짓는 돈도 크게 늘고 있어요</Sub>
      <P>
        삼성전자는 올해 <W k="설비투자" />(시설투자)에 <B>84.4조 원</B>을 쓰기로 했고, 그 가운데 76.8조 원이 반도체 부문 몫이에요. SK하이닉스는 앞으로 5년 동안 생산능력을 <B>두 배</B>로 늘릴 계획이에요. 앞 장에서 본 것처럼 공장이 실제로 물건을 쏟아내기까지는 2~3년이 걸리니, 지금의 투자는 몇 년 뒤 공급 증가로 돌아와요.
      </P>
      <Note kind="outlook" title="공급 과잉은 언제쯤?">
        <p>권석준 성균관대 교수는 AI 수요가 둔화되면 지금의 공격적인 증설이 2028년께 공급 과잉으로 이어질 수 있다고 경고했어요.</p>
      </Note>

      <Sub>값은 아직 오르지만, 오르는 속도는 줄었어요</Sub>
      <P>
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
        note="막대는 범위의 가운데 값이에요. 10월에는 4분기 전체 D램 값이 약 20% 오를 거라는 트렌드포스 전망도 나왔어요."
      />
      <So>여전히 오르지만, 1분기 같은 급등에 비하면 <B>오르는 속도</B>는 크게 줄었어요. ‘상승폭 둔화’는 값이 내린다는 뜻이 아니에요.</So>
      <Note title="뉴스 볼 때 같이 볼 숫자 두 개">
        <p>
          누가 맞을지 맞히기보다 <b>값이 오르는 속도</b>와 <b>공장이 늘어나는 속도</b>를 함께 보면 흐름이 읽혀요. 덜 오르는 것과 떨어지는 것은 다른 이야기지만, 공장은 계속 늘어나는데 값이 덜 오른다면 앞에서 본 사이클을 떠올려 볼 때예요.
        </p>
        <p>주식을 사고팔 신호가 아니라 업계의 흐름을 읽는 방법이에요.</p>
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
  { k: "D램 가격", v: "올랐는지보다 오르는 속도를 봐요." },
  { k: "‘이익 사상 최대’", v: "많이 팔았다기보다 값이 올랐다는 뜻일 수 있어요." },
  { k: "HBM 공급·장기계약", v: "당장이 아니라 1~2년 뒤 매출을 미리 예약한 물량이에요." },
  { k: "설비투자 확대", v: "2~3년 뒤 물건이 늘어난다는 예고예요." },
  { k: "중국의 추격", v: "만들기 쉬운 일반 D램부터 따라오고 있어요." },
];

/** 숫자를 확인한 자료 — 읽는 흐름을 끊지 않게 마지막에 접어 둬요 */
const REFS: { k: string; v: string }[] = [
  { k: "가격·소비자", v: "SBS Biz(2026.10.02·10.30), 한국경제(2026.03.02), 트렌드포스(2026.03.31·06.01·09.30·10.20)" },
  { k: "수출", v: "산업통상부(2026.11.01), 머니투데이·뉴시스(2026.01.01)" },
  { k: "공정과 장비", v: "AIChE(2026.05.14), UBS(2026.09.22), 헤럴드경제(2026.05.27), 전자신문(2023.02.24), Tom's Hardware(2024·2026.01.29), 뉴시스(2025.01.03), 쿠키뉴스(2025.12.06), 아시아경제(2025.12·2026.02.11)" },
  { k: "기업과 점유율", v: "가트너(2026.01.12), 트렌드포스(2026.09.09), 카운터포인트(SBS Biz 2026.06.29·09.03·11.05), 뉴시스(2025.12.13), MTN(2026.09.14), 디지털데일리(2025.12.03), 웰스파고(머니투데이 2026.08.16), 머니투데이(2026.02.23)" },
  { k: "역사와 실적", v: "삼성반도체 뉴스룸, MTN(2023.02.08), SK하이닉스 뉴스룸(2017.09.05·2024.01.25·2026년 실적), 머니투데이(2011.11.14·2012.02.28), 경향신문(2026.05.08), 헤럴드경제(2026.01.28), 삼성전자 뉴스룸(2026.10.29), 한국은행 기업경영분석(뉴시스 2026.06.10)" },
  { k: "HBM과 호황", v: "비즈워치(2026.10.29), SK증권(뉴데일리 2026.05.31), 뉴시스(2026.02.12), 한국경제(2026.03.24), 디지털데일리(2026.06.10)" },
  { k: "세 도시", v: "뉴시스(2026.01.15·02.23), 디지털데일리(2025.08.29), 경향신문(2025.12.30), 비즈워치(2026.09.18), 주간경향(2026.01.12), 경기연구원" },
  { k: "전망", v: "세계일보(2026.09.30), Fortune(2026.07.25), 마이클 버리 글(2026.09.22), 머니투데이(2026.08.04), 뉴시스(2026.07.20)" },
];

function WrapChapter() {
  return (
    <div className="space-y-5">
      <Sub t={952}>처음 질문의 답</Sub>
      <div className="rounded-2xl bg-brand-dark px-5 py-5 text-on-primary">
        <p className="type-micro-cap text-on-primary/70">삼성전자와 SK하이닉스는 정확히 무엇을 팔까?</p>
        <p className="mt-1.5 type-heading-sm leading-snug [word-break:keep-all]">데이터를 담는 창고, 메모리예요.</p>
        <p className="mt-2 type-body-md leading-relaxed text-on-primary/90 [word-break:keep-all]">
          지금은 AI 공장(GPU) 옆에 붙는 고층 창고 HBM을 짓느라 일반 창고를 지을 자리가 모자란 것이 값이 뛴 큰 이유예요. 그 값이 내 폰 값과 한국의 수출로 이어졌어요.
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
      <News headline="D램 고정거래가 27.5달러, 역대 최고">두 회사의 다음 분기 이익은 더 늘고, 다음 폰은 더 비싸질 수 있다는 뜻이에요. 그런데 직전보다 몇 % 올랐는지, 그 오름폭이 줄고 있는지가 더 중요한 숫자예요.</News>
      <VideoLink />
      <p className="type-caption text-ink-mute [word-break:keep-all]">
        특정 회사나 주식을 사고팔라고 권하는 글이 아니에요. 두 회사 숫자는 비교하려고 나란히 놓았을 뿐이고, 전망은 각 기관과 발언자의 의견이에요. 숫자는 2026년 11월 15일 기준이에요.
      </p>
      <details className="group rounded-2xl border border-hairline bg-canvas px-4 py-3">
        <summary className="cursor-pointer list-none type-caption font-bold text-ink-secondary [&::-webkit-details-marker]:hidden">
          이 글의 숫자를 확인한 자료 <span className="font-medium text-ink-mute group-open:hidden">· 눌러서 펼치기</span>
        </summary>
        <ul className="mt-2.5 space-y-1.5 type-caption text-ink-mute [word-break:keep-all]">
          {REFS.map((r) => (
            <li key={r.k}>
              <b className="text-ink-secondary">{r.k}</b> · {r.v}
            </li>
          ))}
          <li>원화 환산은 2026년 3분기 평균 환율 1,430원 기준이에요.</li>
        </ul>
      </details>
      <p className="type-caption text-ink-mute [word-break:keep-all]">산업 A-Z 지난 편은 조선업이었어요. 다음 편에서는 뉴스 속 또 다른 산업을 처음부터 풀어 볼게요.</p>
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
  { short: "오프닝", title: "폰 값이 오른 이유", lead: "메모리 칩 값이 1년 반 만에 17배가 됐고, 그 칩을 파는 나라가 한국이에요.", bg: "bg-[#f3f6ff]", body: <IntroChapter /> },
  { short: "구조 · 여섯 단계", title: "구조 — 모래에서 칩까지", lead: "땅 고르기부터 손님에게 넘기기까지, 단계마다 누가 돈을 받는지 봐요.", kong: "크게 보면 설계는 미국, 건설은 대만, 창고는 한국!", bg: "bg-[#eef5ff]", body: <BuildChapter /> },
  { short: "역사 · 40년", title: "역사 — 한국 메모리 40년", lead: "다섯 장면으로 보는 1등의 길, 그리고 천국과 지옥을 오가는 이유.", bg: "bg-[#fffaf3]", body: <HistoryChapter /> },
  { short: "현재 · AI 호황", title: "현재 — AI가 부른 호황", lead: "HBM, 삼성과 SK하이닉스, 그리고 워싱턴·베이징·용인.", look: "book", bg: "bg-[#f6f4ff]", body: <NowChapter /> },
  { short: "전망 · 이번엔?", title: "전망 — 이번엔 다를까", lead: "호황이라는 쪽과 거품이라는 쪽, 숫자 두 개로 읽어 봐요.", bg: "bg-[#f2fbf5]", body: <OutlookChapter /> },
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
