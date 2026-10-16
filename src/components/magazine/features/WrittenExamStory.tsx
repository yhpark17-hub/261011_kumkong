"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ArrowDown, ArrowRight, CalendarDays, ChevronDown, ClipboardList, MessagesSquare } from "lucide-react";
import { useTodayKey } from "@/lib/hooks";
import { cn } from "../../ui";
import { KongMascot } from "../KongMascot";

/* ------------------------------------------------------------------ */
/* 데이터 (서버에서 금콩 기관 정보로 계산해 넘겨 줌)                          */
/* ------------------------------------------------------------------ */

export interface StoryDay {
  date: string;
  items: { id: string; short: string; expected: boolean }[];
}

export interface WrittenExamStoryData {
  /** 금융공기업 수 */
  total: number;
  /** NCS 를 보는 곳 */
  ncs: number;
  /** 전공 시험이 있는 곳 (단일·통합) */
  major: number;
  /** 논술 시험이 따로 있는 곳 */
  essay: number;
  /** NCS 영역이 확인된 곳 */
  ncsKnown: number;
  /** 영역별 출제 기관 수 (NCS 10개 영역 순서) */
  areas: { label: string; count: number }[];
  majorTypes: { single: number; integrated: number; none: number; unknown: number };
  /** 금융공기업·금융유관 필기가 2곳 이상 겹치는 날 */
  days: StoryDay[];
}

/* ------------------------------------------------------------------ */
/* 장면 틀 — 그림은 화면에 붙어 있고 자막이 그 위로 지나가요                   */
/* ------------------------------------------------------------------ */

// 사이트 머리 높이 — 휴대폰 73px, 그 위 65px (스토리 맨 바깥에서 --hdr 로 정함)
const HEADER = "var(--hdr)";
const SCENE = "calc(100svh - var(--hdr))";

function useStep(count: number) {
  const [step, setStep] = useState(0);
  const refs = useRef<(HTMLDivElement | null)[]>([]);
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setStep(Number((e.target as HTMLElement).dataset.step));
      },
      { rootMargin: "-48% 0px -48% 0px" },
    );
    refs.current.slice(0, count).forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, [count]);
  return { step, refs };
}

function Chapter({
  no,
  title,
  bg,
  steps,
  visual,
}: {
  no: string;
  title: string;
  bg: string;
  steps: ReactNode[];
  visual: (step: number) => ReactNode;
}) {
  const { step, refs } = useStep(steps.length);
  return (
    <section className={cn("relative", bg)} aria-label={title}>
      <div className="sticky flex flex-col overflow-hidden" style={{ top: HEADER, height: SCENE }}>
        <div className="mx-auto w-full max-w-[1200px] px-5 pt-6 md:px-8 md:pt-10">
          <p className="type-micro-cap text-primary-text">{no}</p>
          <h2 className="mt-1 type-heading-lg font-semibold text-ink [word-break:keep-all] md:type-display-md">{title}</h2>
        </div>
        <div className="mx-auto flex w-full max-w-[1200px] flex-1 items-center justify-center px-5 pb-[36svh] lg:justify-start lg:pr-[46%] lg:pb-0 lg:pl-8">{visual(step)}</div>
      </div>
      <div className="relative z-10" style={{ marginTop: `calc(-1 * ${SCENE})` }}>
        {steps.map((s, i) => (
          <div
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            data-step={i}
            className="mx-auto flex max-w-[1200px] items-end justify-center px-4 pb-[6svh] lg:items-center lg:justify-end lg:px-8 lg:pb-0"
            style={{ minHeight: SCENE }}
          >
            <div
              className={cn(
                "w-full max-w-[460px] rounded-2xl border border-hairline bg-canvas/95 px-5 py-5 shadow-level-2 backdrop-blur-sm transition-opacity duration-500 lg:px-7 lg:py-7",
                step === i ? "opacity-100" : "opacity-60",
              )}
            >
              <div className="text-[17px] leading-[1.75] text-ink [word-break:keep-all] sm:text-[19px] lg:text-[20px] [&_strong]:font-semibold [&_strong]:text-primary-text">{s}</div>
            </div>
          </div>
        ))}
        {/* 마지막 자막을 읽는 동안 그림이 붙어 있도록 여유 */}
        <div aria-hidden style={{ height: `calc(${HEADER} + 18svh)` }} />
      </div>
    </section>
  );
}

const anim = "transition-all duration-700 ease-out motion-reduce:transition-none";

/** 큰 숫자 */
function Big({ n, unit = "곳" }: { n: number; unit?: string }) {
  return (
    <span className="tabular font-bold text-primary-text">
      {n}
      <span className="ml-0.5 text-[0.7em]">{unit}</span>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* 장면 그림                                                              */
/* ------------------------------------------------------------------ */

function ExamPaper({ step, data }: { step: number; data: WrittenExamStoryData }) {
  const blocks = [
    { label: "NCS 직업기초능력", sub: "의사소통·수리·문제해결 …", tone: "border-primary/30 bg-ev-written-soft", show: true },
    { label: "전공", sub: "경영·경제·법·IT 등", tone: "border-[#ffb36b] bg-[#fff1e0]", show: step >= 0 },
    { label: "논술", sub: `금융공기업 ${data.essay}곳은 따로 봐요`, tone: "border-dashed border-[#56c08a] bg-[#e3f6ea]", show: step >= 1 },
  ];
  return (
    <div className="relative w-full max-w-[360px]">
      <div className="rounded-2xl border border-hairline bg-canvas p-5 shadow-level-2">
        <div className="flex items-center justify-between">
          <span className="type-caption font-semibold text-ink-secondary">필기 시험지</span>
          <span className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <span key={i} className="h-1.5 w-6 rounded-full bg-canvas-soft" />
            ))}
          </span>
        </div>
        <div className="mt-4 space-y-3">
          {blocks.map((b, i) => (
            <div
              key={b.label}
              className={cn("rounded-xl border-2 px-4 py-3.5", b.tone, anim, b.show ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0")}
              style={{ transitionDelay: `${i * 120}ms` }}
            >
              <p className="type-heading-sm text-ink">{b.label}</p>
              <p className="mt-0.5 type-caption text-ink-secondary">{b.sub}</p>
            </div>
          ))}
        </div>
      </div>
      <KongMascot hold="pencil" glasses className="absolute -right-6 -bottom-8 h-20 w-20 md:-right-10 md:h-24 md:w-24" />
    </div>
  );
}

function NcsGrid({ step, data }: { step: number; data: WrittenExamStoryData }) {
  const max = Math.max(1, ...data.areas.map((a) => a.count));
  return (
    <div className="grid w-full max-w-[560px] grid-cols-2 gap-2 sm:grid-cols-5">
      {data.areas.map((a, i) => {
        const core = i < 3;
        const second = !core && a.count / max >= 0.3;
        const lit = (step >= 1 && core) || (step >= 2 && second);
        return (
          <div
            key={a.label}
            className={cn(
              "flex flex-col justify-between rounded-xl border px-3 py-2.5",
              anim,
              lit ? (core ? "scale-[1.03] border-primary bg-primary text-on-primary shadow-level-2" : "border-primary/40 bg-ev-written-soft text-ink") : "border-hairline bg-canvas text-ink-secondary",
              step >= 1 && !lit && "opacity-50",
            )}
          >
            <span className="type-caption font-semibold [word-break:keep-all]">{a.label}</span>
            <span className={cn("mt-1 tabular type-caption", lit ? (core ? "text-on-primary/80" : "text-primary-text") : "text-ink-mute", step === 0 && "invisible")}>{a.count}곳</span>
          </div>
        );
      })}
    </div>
  );
}

const SHEETS = [
  { key: "PSAT형", body: "psat" },
  { key: "모듈형", body: "module" },
  { key: "피듈형", body: "mixed" },
] as const;

function MiniSheet({ kind }: { kind: "psat" | "module" | "mixed" }) {
  const line = (w: string, k: number) => <span key={k} className="block h-1.5 rounded-full bg-ink/15" style={{ width: w }} />;
  const chart = (
    <span className="mt-2 flex h-10 items-end gap-1">
      {[60, 85, 40, 70].map((h, i) => (
        <span key={i} className="w-3 rounded-t-sm bg-primary/60" style={{ height: `${h}%` }} />
      ))}
    </span>
  );
  const options = (
    <span className="mt-2 block space-y-1.5">
      {[0, 1, 2, 3].map((i) => (
        <span key={i} className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full border border-ink/30" />
          {line(`${50 + ((i * 13) % 30)}%`, i)}
        </span>
      ))}
    </span>
  );
  return (
    <span className="block space-y-1.5">
      {kind === "psat" && (
        <>
          {["100%", "92%", "100%", "86%", "96%", "70%"].map(line)}
          {chart}
        </>
      )}
      {kind === "module" && (
        <>
          {["90%", "55%"].map(line)}
          {options}
        </>
      )}
      {kind === "mixed" && (
        <>
          {["100%", "88%", "60%"].map(line)}
          {chart}
          {options}
        </>
      )}
    </span>
  );
}

function TypeSheets({ step }: { step: number }) {
  return (
    <div className="flex w-full max-w-[520px] items-end justify-center gap-3 sm:gap-5">
      {SHEETS.map((s, i) => (
        <div key={s.key} className={cn("flex-1", anim, i === step ? "-translate-y-2 scale-105 opacity-100" : "scale-95 opacity-40")}>
          <div className={cn("aspect-[3/4] rounded-xl border bg-canvas p-3 shadow-level-1", i === step ? "border-primary ring-2 ring-primary/20" : "border-hairline")}>
            <MiniSheet kind={s.body} />
          </div>
          <p className={cn("mt-2 text-center type-body-md font-semibold", i === step ? "text-primary-text" : "text-ink-mute")}>{s.key}</p>
        </div>
      ))}
    </div>
  );
}

const MAJOR_PARTS = [
  { key: "single", label: "단일 전공", color: "#533afd" },
  { key: "integrated", label: "통합 전공", color: "#ff9a4d" },
  { key: "none", label: "전공 없음", color: "#56c08a" },
  { key: "unknown", label: "확인 중", color: "#c9cbd6" },
] as const;

function MajorDonut({ step, data }: { step: number; data: WrittenExamStoryData }) {
  const total = Math.max(1, data.total);
  const R = 70;
  const C = 2 * Math.PI * R;
  // 조각마다 시작 위치 (앞 조각 길이의 합)
  const lens = MAJOR_PARTS.map((p) => (data.majorTypes[p.key] / total) * C);
  const starts = lens.map((_, i) => lens.slice(0, i).reduce((a, b) => a + b, 0));
  const focus = step === 1 ? ["single"] : step === 2 ? ["integrated", "none"] : null;
  const focusCount = focus ? focus.reduce((s, k) => s + data.majorTypes[k as keyof typeof data.majorTypes], 0) : data.total;
  return (
    <div className="flex w-full max-w-[520px] flex-col items-center gap-5 sm:flex-row sm:gap-8">
      <div className="relative h-52 w-52 shrink-0 md:h-60 md:w-60">
        <svg viewBox="0 0 180 180" className="h-full w-full -rotate-90">
          <circle cx="90" cy="90" r={R} fill="none" stroke="var(--color-canvas-soft, #f4f4f6)" strokeWidth="26" />
          {MAJOR_PARTS.map((p, i) => {
            const len = lens[i];
            return (
              <circle
                key={p.key}
                cx="90"
                cy="90"
                r={R}
                fill="none"
                stroke={p.color}
                strokeWidth="26"
                strokeDasharray={`${len} ${C - len}`}
                strokeDashoffset={-starts[i]}
                className={cn(anim, focus && !focus.includes(p.key) && "opacity-20")}
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="type-display-md">
            <Big n={focusCount} />
          </span>
          <span className="type-caption text-ink-mute">{focus ? MAJOR_PARTS.filter((p) => focus.includes(p.key)).map((p) => p.label).join("·") : `금융공기업 ${data.total}곳`}</span>
        </div>
      </div>
      <ul className="grid grid-cols-2 gap-x-5 gap-y-2 sm:grid-cols-1">
        {MAJOR_PARTS.map((p) => (
          <li key={p.key} className={cn("flex items-center gap-2 type-body-md", anim, focus && !focus.includes(p.key) ? "opacity-35" : "opacity-100")}>
            <span className="h-3 w-3 rounded-sm" style={{ background: p.color }} />
            <span className="text-ink">{p.label}</span>
            <span className="tabular font-semibold text-ink">{data.majorTypes[p.key]}곳</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const WEEK = ["일", "월", "화", "수", "목", "금", "토"];

/** 보여 줄 날: 다가오는 날 중 가장 많이 겹치는 날 (없으면 가장 최근 지난 날) */
function useMatchDay(days: StoryDay[]) {
  const today = useTodayKey();
  return useMemo(() => {
    if (!days.length) return null;
    const upcoming = today ? days.filter((d) => d.date >= today) : days;
    const pool = upcoming.length ? upcoming : days;
    const best = [...pool].sort((a, b) => b.items.length - a.items.length || (a.date < b.date ? -1 : 1))[0];
    return { best, past: Boolean(today && !upcoming.length) };
  }, [days, today]);
}

function MatchCalendar({ step, data }: { step: number; data: WrittenExamStoryData }) {
  const pick = useMatchDay(data.days);
  if (!pick) return <p className="type-body-md text-ink-mute">필기 일정이 모이면 여기에 보여 드릴게요.</p>;
  const [y, m] = pick.best.date.split("-").map(Number);
  const first = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const counts = new Map(data.days.filter((d) => d.date.startsWith(`${y}-${String(m).padStart(2, "0")}`)).map((d) => [Number(d.date.slice(8)), d.items.length]));
  const bestDay = Number(pick.best.date.slice(8));
  return (
    <div className="w-full max-w-[400px]">
      <div className="rounded-2xl border border-hairline bg-canvas p-4 shadow-level-2">
        <p className="flex items-center gap-1.5 type-body-md font-semibold text-ink">
          <CalendarDays className="h-4 w-4 text-primary" strokeWidth={2} />
          {y}년 {m}월 필기
        </p>
        <div className="mt-3 grid grid-cols-7 gap-0.5 text-center sm:gap-1">
          {WEEK.map((w, i) => (
            <span key={w} className={cn("type-caption", i === 0 ? "text-ev-doc" : i === 6 ? "text-primary-text" : "text-ink-mute")}>
              {w}
            </span>
          ))}
          {Array.from({ length: first }, (_, i) => (
            <span key={`e${i}`} />
          ))}
          {Array.from({ length: last }, (_, i) => {
            const d = i + 1;
            const n = counts.get(d) ?? 0;
            const hot = step >= 1 && d === bestDay;
            return (
              <span
                key={d}
                className={cn(
                  "relative flex h-8 flex-col items-center justify-center rounded-lg tabular type-caption sm:aspect-square sm:h-auto",
                  anim,
                  hot ? "scale-110 bg-primary font-bold text-on-primary shadow-level-2" : n ? "bg-ev-written-soft font-semibold text-ink" : "text-ink-mute",
                )}
              >
                {d}
                {n > 0 && <span className={cn("text-[9px] leading-none", hot ? "text-on-primary/80" : "text-primary-text")}>{n}곳</span>}
              </span>
            );
          })}
        </div>
      </div>
      <div className={cn("mt-3 flex flex-wrap justify-center gap-1.5", anim, step >= 1 ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0")}>
        {pick.best.items.map((c) => (
          <Link
            key={c.id}
            href={`/companies/${c.id}`}
            className={cn("rounded-full border bg-canvas px-2.5 py-1 type-caption text-ink hover:border-brand-dark", c.expected ? "border-dashed border-hairline-input" : "border-hairline")}
          >
            {c.short}
            {c.expected && <span className="ml-0.5 text-ink-mute">예상</span>}
          </Link>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 전체                                                                  */
/* ------------------------------------------------------------------ */

const dayLabel = (d: string) => {
  const [y, m, dd] = d.split("-").map(Number);
  return `${m}월 ${dd}일(${WEEK[new Date(Date.UTC(y, m - 1, dd)).getUTCDay()]})`;
};

export function WrittenExamStory({ title, data }: { title: string; data: WrittenExamStoryData }) {
  const match = useMatchDay(data.days);
  const [c0, c1, c2] = data.areas;
  const sameCore = c0 && c1 && c2 && c0.count === c1.count && c1.count === c2.count;
  const topMajor = (["single", "integrated", "none"] as const).reduce((a, b) => (data.majorTypes[a] >= data.majorTypes[b] ? a : b));

  return (
    <div id="article-body" className="theme-light bg-canvas text-ink [--hdr:73px] md:[--hdr:65px]">
      {/* 표지 */}
      <section className="relative overflow-hidden bg-linear-to-b from-[#ece9ff] via-[#f6f4ff] to-canvas" style={{ minHeight: SCENE }}>
        <span aria-hidden className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-[#ffd9ae]/60 blur-3xl" />
        <span aria-hidden className="absolute bottom-10 -left-24 h-72 w-72 rounded-full bg-[#bfe9cf]/60 blur-3xl" />
        <div className="relative mx-auto flex max-w-[1200px] flex-col items-center px-5 pt-[10svh] text-center md:px-8 md:pt-[14svh]">
          <p className="type-micro-cap text-primary-text">금콩 인터랙티브 · 필기 입문</p>
          <h1 className="mt-4 type-display-md font-bold text-ink [word-break:keep-all] md:type-display-xl">
            금공 필기,
            <br />
            3분이면 감 잡아요
          </h1>
          <p className="mt-5 max-w-md type-body-lg text-ink-secondary [word-break:keep-all]">처음 준비하는 사람을 위해 금융공기업 필기를 그림 다섯 장으로 정리했어요.</p>
          <KongMascot hold="pencil" glasses className="mt-8 h-28 w-28 md:h-32 md:w-32" />
          <p className="mt-6 flex flex-wrap justify-center gap-2">
            {["필기 구성", "NCS", "문제 유형", "전공", "A매치"].map((t, i) => (
              <span key={t} className="rounded-full border border-hairline bg-canvas px-3 py-1 type-caption text-ink-secondary">
                {i + 1}. {t}
              </span>
            ))}
          </p>
          <p className="mt-10 inline-flex animate-bounce items-center gap-1 type-caption text-ink-mute motion-reduce:animate-none">
            아래로 내려 보세요 <ArrowDown className="h-3.5 w-3.5" strokeWidth={2} />
          </p>
        </div>
        <h2 className="sr-only">{title}</h2>
      </section>

      <Chapter
        no="01 · 필기 구성"
        title="필기는 크게 세 덩어리예요"
        bg="bg-[#fffaf3]"
        visual={(s) => <ExamPaper step={s} data={data} />}
        steps={[
          <>
            금공 필기는 <strong>NCS</strong>(직업기초능력)와 <strong>전공</strong>이 기본이에요. 금융공기업 {data.total}곳 중 NCS를 보는 곳 <Big n={data.ncs} />, 전공 시험이 있는 곳 <Big n={data.major} />이에요.
          </>,
          <>
            여기에 기관에 따라 <strong>논술</strong>이 붙어요. 금융공기업 <Big n={data.essay} />은 논술 시험을 따로 봐요.
          </>,
        ]}
      />

      <Chapter
        no="02 · NCS"
        title="NCS는 10개 중 몇 개만 골라 내요"
        bg="bg-[#f6f4ff]"
        visual={(s) => <NcsGrid step={s} data={data} />}
        steps={[
          <>
            NCS 직업기초능력은 <strong>10개 영역</strong>이에요. 기관마다 이 중 일부만 골라서 시험을 내요.
          </>,
          <>
            금융공기업은 <strong>의사소통·수리·문제해결</strong>이 기본이에요.{" "}
            {sameCore ? (
              <>
                영역이 확인된 {data.ncsKnown}곳 중 <Big n={c0.count} /> 모두 이 세 영역을 내요.
              </>
            ) : (
              <>영역이 확인된 {data.ncsKnown}곳 기준으로 가장 많이 나와요.</>
            )}
          </>,
          <>그다음으로 자원관리·조직이해를 더하는 곳이 많아요. 지원할 기관이 어떤 영역을 내는지부터 확인하세요.</>,
        ]}
      />

      <Chapter
        no="03 · 문제 유형"
        title="같은 NCS도 문제 모양이 달라요"
        bg="bg-[#f2fbf5]"
        visual={(s) => <TypeSheets step={s} />}
        steps={[
          <>
            <strong>PSAT형</strong> — 긴 지문과 표·그래프를 빠르게 읽는 문제예요. 금융공기업에서 자주 쓰이고, 시간 관리가 핵심이에요.
          </>,
          <>
            <strong>모듈형</strong> — NCS 이론·개념을 묻는 짧은 문제예요. 이론을 한 번 정리해 두면 빨리 풀 수 있어요.
          </>,
          <>
            <strong>피듈형</strong> — 둘을 섞은 형태예요. 비중이 기관마다 달라서, 지원할 곳의{" "}
            <Link href="/reviews" className="link">
              필기 후기
            </Link>
            로 확인하는 게 가장 빨라요.
          </>,
        ]}
      />

      <Chapter
        no="04 · 전공"
        title="전공 시험은 세 가지 경우예요"
        bg="bg-[#fff6ec]"
        visual={(s) => <MajorDonut step={s} data={data} />}
        steps={[
          <>
            전공 시험은 <strong>단일 전공</strong>·<strong>통합 전공</strong>·<strong>전공 없음</strong> 셋 중 하나예요. 금융공기업 {data.total}곳을 나눠 보면 이래요.
          </>,
          <>
            <strong>단일 전공</strong>은 경영·경제·법·IT 중 한 과목을 깊게 봐요. 금융공기업 <Big n={data.majorTypes.single} />
            {topMajor === "single" ? "으로 가장 많아요" : ""}. 서술형이 많아 답안 쓰는 연습이 필요해요.
          </>,
          <>
            <strong>통합 전공</strong>({data.majorTypes.integrated}곳)은 여러 과목을 얕고 넓게, <strong>전공 없음</strong>({data.majorTypes.none}곳)은 NCS 변별력이 커져요.
          </>,
        ]}
      />

      <Chapter
        no="05 · A매치"
        title="인기 기관은 같은 날 시험을 봐요"
        bg="bg-[#f6f4ff]"
        visual={(s) => <MatchCalendar step={s} data={data} />}
        steps={[
          <>
            주요 금융공기업이 <strong>같은 날 같은 시간</strong>에 필기를 치르는 걸 <strong>A매치</strong>라고 해요. 하루에 한 곳만 볼 수 있어요.
          </>,
          match ? (
            <>
              {match.past ? "지난 " : ""}
              {dayLabel(match.best.date)}에는 <Big n={match.best.items.length} />이 같은 날 필기를 {match.past ? "봤어요" : "봐요"}. 서류를 낼 때부터 어느 기관 필기를 볼지 정해 두세요.
            </>
          ) : (
            <>서류를 낼 때부터 어느 기관 필기를 볼지 정해 두세요.</>
          ),
        ]}
      />

      {/* 한 장 정리 */}
      <section className="bg-brand-dark text-on-primary">
        <div className="mx-auto max-w-[720px] px-5 py-16 md:px-8 md:py-24">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-[#fffaf0]">
              <KongMascot suit wave className="h-16 w-16" />
            </span>
            <div>
              <p className="type-micro-cap text-on-primary/70">한 장으로 정리</p>
              <h2 className="type-heading-lg [word-break:keep-all] md:type-display-md">이것만 기억하세요</h2>
            </div>
          </div>
          <ol className="mt-8 space-y-3">
            {[
              <>필기 = NCS + 전공, 기관에 따라 논술</>,
              <>NCS는 의사소통·수리·문제해결이 기본</>,
              <>문제 모양은 PSAT형·모듈형·피듈형 — 지원 기관 후기로 확인</>,
              <>인기 기관은 같은 날 시험(A매치) — 미리 골라 두기</>,
            ].map((t, i) => (
              <li key={i} className="flex gap-3 rounded-xl bg-on-primary/10 px-4 py-3.5 type-body-lg [word-break:keep-all]">
                <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-on-primary tabular type-caption font-bold text-brand-dark">{i + 1}</span>
                {t}
              </li>
            ))}
          </ol>
          <div className="mt-8 grid gap-2.5 sm:grid-cols-3">
            {[
              { href: "/companies", label: "기관별 필기 구성 보기", Icon: ClipboardList },
              { href: "/", label: "다가오는 필기 일정", Icon: CalendarDays },
              { href: "/reviews", label: "필기 후기·체감 난이도", Icon: MessagesSquare },
            ].map((c) => (
              <Link key={c.href} href={c.href} className="group flex items-center gap-2 rounded-xl bg-on-primary px-4 py-3.5 type-body-md font-semibold text-brand-dark">
                <c.Icon className="h-4 w-4 shrink-0 text-primary" strokeWidth={2} />
                <span className="min-w-0 flex-1 [word-break:keep-all]">{c.label}</span>
                <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
              </Link>
            ))}
          </div>
          <More />
          <p className="mt-8 type-caption text-on-primary/60 [word-break:keep-all]">
            숫자는 금콩 기관 정보에서 바로 가져와요(금융공기업 {data.total}곳 기준). 정확한 시험 구성·일정은 각 기관 채용 공고를 꼭 확인하세요.
          </p>
        </div>
      </section>
    </div>
  );
}

/** 더 알아 두면 좋은 것 — 접어 두기 */
function More() {
  const items = [
    {
      q: "블라인드 채용이 뭐예요?",
      a: "2017년부터 공공기관은 입사지원서에 출신지역·가족관계·학력·신체조건·사진처럼 직무와 무관한 정보를 요구하지 않아요. 공공기관이 아닌 공제회·중앙회·시중은행은 기관마다 기준이 달라 학력이나 자격을 적기도 해요.",
    },
    {
      q: "경쟁률은 어디서 봐요?",
      a: "공공기관 경영정보 공개시스템 알리오(ALIO)에서 기관을 검색하고 경영공시의 '신규채용 현황'을 보면 돼요. 다만 일반·고졸·경력 채용이 합쳐진 숫자인 경우가 많아, 대졸 신입 공채의 실제 경쟁률과는 차이가 있어요.",
    },
  ];
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="mt-8">
      <p className="type-caption font-semibold text-on-primary/70">더 알아 두면 좋은 것</p>
      <ul className="mt-2 divide-y divide-on-primary/15 rounded-xl border border-on-primary/15">
        {items.map((it, i) => (
          <li key={it.q}>
            <button type="button" onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i} className="flex w-full items-center gap-2 px-4 py-3 text-left type-body-md font-semibold">
              <span className="flex-1">{it.q}</span>
              <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform", open === i && "rotate-180")} strokeWidth={2} />
            </button>
            {open === i && <p className="px-4 pb-4 type-body-md leading-relaxed text-on-primary/80 [word-break:keep-all]">{it.a}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}
