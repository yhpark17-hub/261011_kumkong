import Link from "next/link";
import { ArrowRight, CalendarCheck2, ChevronDown, ExternalLink, FileClock, Megaphone } from "lucide-react";
import { formatDayHeading, parseKey, weekdayLabel } from "@/lib/date";
import {
  DRILL_KINDS,
  EDITION_LABEL,
  NEWS_SECTION_INFO,
  NOON_ART,
  letterHref,
  letterShareHref,
  noonArt,
  noonArtSrc,
  volLabel,
  type BriefingIssue,
  type IssueStory,
  type NewsItem,
  type NoonArt,
} from "@/lib/news-meta";
import type { LetterContent } from "@/lib/server/briefing";
import { weekRadar, type RadarItem, type WeekRadar } from "@/lib/week-radar";
import { cn } from "../ui";
import { MastheadMini, jua } from "./BriefingBrand";
import { SourceLink } from "./interactive";
import { LunchDrill, type DrillView } from "./LunchDrill";
import { Markdown } from "./Markdown";
import { Art, Badge, C, Kicker } from "./StoryLetter";

/**
 * 점심 3문제 (2026-11-08~) — 아침엔 읽고, 점심엔 풀어요.
 * 머리 → 이번 주 금공 체크(사이트 채용 일정) → 금공 필기형 3문제(누르면 채점·해설·다른 독자 답) → 면접 1문 → (주말) 논술 한 편.
 * 문제는 호의 extras.drill, 짝꿍 표는 이 판 용어(news.section = term), 면접 질문은 news.section = question 이에요.
 */

const CARD = "overflow-clip rounded-[24px] bg-[#ffffff] shadow-[0_14px_30px_-20px_rgba(43,58,122,0.55)] ring-1 ring-[#2b3a7a]/[0.07]";

/** "11.9" / "11.9~12" / "11.28~12.2" */
function md(date: string, end?: string): string {
  const s = parseKey(date);
  if (!end || end === date) return `${s.m}.${s.d}`;
  const e = parseKey(end);
  return `${s.m}.${s.d}~${e.m === s.m ? e.d : `${e.m}.${e.d}`}`;
}

export function LunchHeader({ issue, minutes, count }: { issue: BriefingIssue; minutes: number; count: number }) {
  return (
    <header className="relative px-3 pt-4 sm:px-4 md:px-7 md:pt-6">
      <span aria-hidden className="absolute inset-x-0 top-0 h-[150px] bg-[linear-gradient(180deg,#e4f4ea_0%,#eef1fd_55%,rgba(255,253,248,0)_100%)]" />
      <div className="relative flex items-center justify-between gap-3 px-1">
        <MastheadMini edition={issue.edition} />
        <p className="text-right tabular text-[12.5px] leading-snug" style={{ color: C.mute }}>
          <span className="block font-semibold whitespace-nowrap" style={{ color: C.ink }}>
            {formatDayHeading(issue.date)}
          </span>
          <span className="block whitespace-nowrap">
            {volLabel(issue.vol)} · {count}문제 · 약 {minutes}분
          </span>
        </p>
      </div>
      <h2 className="sr-only">{issue.title}</h2>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* 이번 주 금공 체크                                                      */
/* ------------------------------------------------------------------ */

function RadarChip({ it, mark }: { it: RadarItem; mark: string }) {
  return (
    <li>
      <Link
        href={`/companies/${it.companyId}`}
        className="flex items-center gap-2 rounded-xl bg-[#ffffff] py-1.5 pr-3 pl-1.5 ring-1 ring-[#2b3a7a]/10 transition-colors hover:ring-[#7f96e8]"
        style={{ color: C.ink }}
      >
        {it.logo ? (
          // eslint-disable-next-line @next/next/no-img-element -- 기관 로고 (public/logos)
          <img src={it.logo} alt="" className="h-6 w-6 shrink-0 rounded-md bg-[#ffffff] object-contain" loading="lazy" />
        ) : (
          <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#eef1fd] text-[10px] font-bold" style={{ color: C.navy }}>
            {(it.avatar ?? it.short).slice(0, 2)}
          </span>
        )}
        <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold">
          {it.short} <span className="font-normal" style={{ color: C.body }}>{it.stage}</span>
        </span>
        <span className="shrink-0 tabular text-[12.5px] font-bold" style={{ color: mark }}>
          {md(it.date, it.endDate)}
        </span>
      </Link>
    </li>
  );
}

const SHOW = 4;

function RadarGroup({ icon: Icon, label, items, empty, tone }: { icon: typeof Megaphone; label: string; items: RadarItem[]; empty: string; tone: { soft: string; ink: string } }) {
  return (
    <div className={cn("rounded-2xl px-3", items.length ? "py-3" : "py-2.5")} style={{ background: tone.soft }}>
      <p className="flex items-center gap-1.5 text-[13px] font-bold" style={{ color: tone.ink }}>
        <Icon className="h-4 w-4" strokeWidth={2.2} />
        {label}
        <span className="ml-auto tabular font-semibold">{items.length ? `${new Set(items.map((it) => it.companyId)).size}곳` : "없음"}</span>
      </p>
      {items.length === 0 ? (
        <p className="mt-1 text-[13px] leading-[1.5] [word-break:keep-all]" style={{ color: C.body }}>
          {empty}
        </p>
      ) : (
        <>
          <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
            {items.slice(0, SHOW).map((it, i) => (
              <RadarChip key={`${it.companyId}-${i}`} it={it} mark={tone.ink} />
            ))}
          </ul>
          {items.length > SHOW && (
            <details className="group mt-1.5">
              <summary className="flex cursor-pointer list-none items-center gap-1 px-1 py-1 text-[12.5px] font-semibold [&::-webkit-details-marker]:hidden" style={{ color: tone.ink }}>
                {items.length - SHOW}곳 더 보기
                <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" strokeWidth={2.4} />
              </summary>
              <ul className="mt-1 grid gap-1.5 sm:grid-cols-2">
                {items.slice(SHOW).map((it, i) => (
                  <RadarChip key={`${it.companyId}-more-${i}`} it={it} mark={tone.ink} />
                ))}
              </ul>
            </details>
          )}
        </>
      )}
    </div>
  );
}

export function WeekRadarCard({ radar }: { radar: WeekRadar }) {
  const range = `${md(radar.from)}(${weekdayLabel(radar.from)})~${md(radar.to)}(${weekdayLabel(radar.to)})`;
  return (
    <section aria-labelledby="radar-title" className={cn(CARD, "px-4 pt-4 pb-4 sm:px-5")}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h3 id="radar-title" className={cn(jua.className, "text-[21px] leading-none")} style={{ color: C.ink }}>
          이번 주 금공 체크
        </h3>
        <p className="tabular text-[12.5px] font-semibold" style={{ color: C.mute }}>
          {range}
        </p>
      </div>
      <div className="mt-3 space-y-2">
        <RadarGroup icon={FileClock} label="서류 마감" items={radar.deadlines} empty="이번 주엔 서류 마감이 없어요." tone={{ soft: "#fdeee6", ink: "#b2502a" }} />
        <RadarGroup icon={Megaphone} label="새 공고 (최근 7일)" items={radar.postings} empty="최근 7일 새 공고는 없어요. 뜨면 여기서 먼저 알려 드려요." tone={{ soft: "#e9f6ee", ink: "#2f7d4f" }} />
        <RadarGroup icon={CalendarCheck2} label="필기·면접·발표" items={radar.stages} empty="이번 주에 잡힌 필기·면접·발표 일정은 없어요." tone={{ soft: "#eef1fd", ink: "#3449a3" }} />
      </div>
      <p className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[12px] leading-[1.5]" style={{ color: C.mute }}>
        <span>공고문으로 확인한 일정만 모았어요. 금융공기업부터 보여 드려요.</span>
        <Link href="/calendar" className="inline-flex items-center gap-0.5 font-semibold" style={{ color: C.navy }}>
          캘린더에서 전체 보기
          <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.2} />
        </Link>
      </p>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 문제 위 그림·해설 아래 짝꿍                                             */
/* ------------------------------------------------------------------ */

/** 문제 위 그림 — 아침판 그림 이야기에 그 기사 그림이 있으면 그것, 없으면 같은 그림체의 점심 그림(fallback) */
function QuestionHead({ date, from, no, story, fallback }: { date: string; from: NewsItem | undefined; no: number; story: IssueStory | null; fallback: string }) {
  const item = from ? story?.items.find((x) => x.id === from.id) : undefined;
  const art = item?.art || fallback;
  const badges = item?.badges ?? [];
  return (
    <>
      {art && (
        <div className="relative">
          <Art src={art} className="aspect-[5/2.3]" />
          {badges.length > 0 && (
            <span className="absolute right-3 bottom-0 flex translate-y-1/2 gap-1.5">
              {badges.slice(0, 2).map((b, i) => (
                <Badge key={i} b={b} />
              ))}
            </span>
          )}
        </div>
      )}
      {from && (
        <Link
          href={letterHref(date, "morning", from.id)}
        className={cn("-mb-1 flex items-center gap-1.5 px-4 text-[12.5px] font-semibold hover:underline sm:px-6", art && badges.length ? "pt-5" : "pt-4")}
        style={{ color: C.mute }}
      >
        <span className="shrink-0 rounded-full bg-[#fdebd6] px-2 py-0.5 text-[11px] font-bold text-[#9a4d0d]">아침판 {no}</span>
        <span className="min-w-0 truncate">
          {NEWS_SECTION_INFO[from.section].label} · {from.short || from.title}
        </span>
        </Link>
      )}
    </>
  );
}

function PairNote({ term }: { term: NewsItem | undefined }) {
  if (!term) return null;
  return (
    <div className="mt-3 rounded-2xl bg-[#ffffff] px-3.5 py-3.5 ring-1 ring-[#2b3a7a]/[0.1] [&_td]:!px-2.5 [&_td]:!py-2 [&_td]:!text-[13.5px] [&_td]:[word-break:keep-all] [&_th]:!px-2.5 [&_th]:[word-break:keep-all]">
      <p className="text-[13px] font-bold" style={{ color: C.navy }}>
        개념 정리 · {term.title}
      </p>
      <p className="mt-1 text-[14px] leading-[1.7] [word-break:keep-all]" style={{ color: C.body }}>
        {term.summary}
      </p>
      {term.body.trim() && (
        <div className="mt-3">
          <p className="mb-1 text-[12.5px] font-bold" style={{ color: C.ink }}>
            헷갈리는 짝꿍
          </p>
          <Markdown source={term.body} />
        </div>
      )}
      {term.sourceUrl && (
        <SourceLink id={term.id} href={term.sourceUrl} className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold hover:underline">
          참고 자료{term.sourceName ? ` · ${term.sourceName}` : ""}
          <ExternalLink className="h-3 w-3" strokeWidth={2} />
        </SourceLink>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 면접 1문 · 주말 논술                                                    */
/* ------------------------------------------------------------------ */

function Interview({ n }: { n: NewsItem }) {
  return (
    <section id={`item-${n.id}`} aria-label="면접 1문" className={cn(CARD, "scroll-mt-24 px-4 pt-5 pb-5 sm:px-6")}>
      <div className="flex flex-wrap items-center gap-2">
        <Kicker>면접 1문</Kicker>
        <span className="text-[12.5px] font-semibold" style={{ color: C.mute }}>
          답을 보기 전에 30초 동안 소리 내어 답해 보세요
        </span>
      </div>
      <h3 className="mt-3 text-[18px] leading-[1.5] font-bold tracking-[-0.02em] [word-break:keep-all] md:text-[20px]" style={{ color: C.ink }}>
        Q. {n.title}
      </h3>
      <p className="mt-2 text-[14.5px] leading-[1.7] [word-break:keep-all]" style={{ color: C.body }}>
        {n.summary}
      </p>
      {n.body.trim() && (
        <details className="group mt-4 rounded-2xl bg-[#f6f7ff] ring-1 ring-[#2b3a7a]/[0.06]">
          <summary className="flex cursor-pointer list-none items-center gap-1 px-4 py-3 text-[14px] font-bold [&::-webkit-details-marker]:hidden" style={{ color: C.navy }}>
            30초 답변 뼈대 보기
            <ChevronDown className="ml-auto h-4 w-4 transition-transform group-open:rotate-180" strokeWidth={2.4} />
          </summary>
          <div className="px-4 pb-4">
            <Markdown source={n.body} />
            {n.point && (
              <p className="mt-3 rounded-xl bg-[#fff6e5] px-3 py-2.5 text-[13.5px] leading-[1.65] [word-break:keep-all]" style={{ color: C.body }}>
                <b className="font-bold" style={{ color: "#9a4d0d" }}>
                  답변 팁{" "}
                </b>
                {n.point}
              </p>
            )}
          </div>
        </details>
      )}
      {n.sourceUrl && (
        <SourceLink id={n.id} href={n.sourceUrl} className="mt-3 inline-flex items-center gap-1 text-[12px] font-semibold hover:underline">
          관련 기사{n.sourceName ? ` · ${n.sourceName}` : ""}
          <ExternalLink className="h-3 w-3" strokeWidth={2} />
        </SourceLink>
      )}
    </section>
  );
}

function WeekendEssay({ essay }: { essay: NonNullable<BriefingIssue["extras"]["essay"]> }) {
  return (
    <section aria-label="주말 논술" className={cn(CARD, "px-4 pt-5 pb-5 sm:px-6")}>
      <div className="flex flex-wrap items-center gap-2">
        <Kicker tone="sky">주말 논술</Kicker>
        <span className="text-[12.5px] font-semibold" style={{ color: C.mute }}>
          이번 주 뉴스로 한 편 — 개요를 보기 전에 먼저 써 보세요
        </span>
      </div>
      <h3 className="mt-3 text-[18px] leading-[1.5] font-bold tracking-[-0.02em] [word-break:keep-all]" style={{ color: C.ink }}>
        {essay.topic}
      </h3>
      <details className="group mt-4 rounded-2xl bg-[#f6f7ff] ring-1 ring-[#2b3a7a]/[0.06]">
        <summary className="flex cursor-pointer list-none items-center gap-1 px-4 py-3 text-[14px] font-bold [&::-webkit-details-marker]:hidden" style={{ color: C.navy }}>
          개요와 쓸 만한 근거 보기
          <ChevronDown className="ml-auto h-4 w-4 transition-transform group-open:rotate-180" strokeWidth={2.4} />
        </summary>
        <div className="space-y-3 px-4 pb-4">
          {(
            [
              ["서론", essay.intro],
              ["본론", essay.body],
              ["결론", essay.conclusion],
            ] as const
          )
            .filter(([, t]) => t)
            .map(([label, t]) => (
              <p key={label} className="flex gap-2.5 text-[14px] leading-[1.7] [word-break:keep-all]" style={{ color: C.body }}>
                <span className="mt-0.5 h-fit shrink-0 rounded-full bg-[#e3e8fc] px-2 py-0.5 text-[12px] font-bold" style={{ color: "#3449a3" }}>
                  {label}
                </span>
                <span className="min-w-0">{t}</span>
              </p>
            ))}
          {essay.evidence.length > 0 && (
            <ul className="space-y-1 rounded-xl bg-[#ffffff] px-3 py-2.5 ring-1 ring-[#2b3a7a]/[0.08]">
              {essay.evidence.map((e, i) => (
                <li key={i} className="flex gap-2 text-[13.5px] leading-[1.6] [word-break:keep-all]" style={{ color: C.body }}>
                  <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: C.orange }} />
                  {e}
                </li>
              ))}
            </ul>
          )}
        </div>
      </details>
    </section>
  );
}

/* ------------------------------------------------------------------ */

export function LunchBody({ issue, content, morning }: { issue: BriefingIssue; content: LetterContent; morning: { items: NewsItem[]; story: IssueStory | null } }) {
  const drill = issue.extras.drill;
  if (!drill) return null;
  const radar = weekRadar(issue.date);
  const order = morning.items.map((n) => n.id);
  // 점심 그림은 문제마다 다르게 — 겹치면 아직 안 쓴 그림으로
  const used = new Set<NoonArt>();
  const fallback = drill.questions.map((q) => {
    const want = noonArt(q);
    const key = used.has(want) ? (NOON_ART.find((k) => !used.has(k)) ?? want) : want;
    used.add(key);
    return noonArtSrc(key);
  });
  const views: DrillView[] = drill.questions.map((q, i) => {
    const from = morning.items.find((n) => n.id === q.from);
    const term = content.terms.find((t) => t.title === q.term);
    const k = DRILL_KINDS[q.kind];
    return {
      tag: `Q${i + 1} · ${k.label} · ${k.level}`,
      subject: q.subject,
      stem: q.stem,
      options: q.options,
      answer: q.answer,
      explain: q.explain,
      head: <QuestionHead date={issue.date} from={from} no={order.indexOf(q.from) + 1} story={morning.story} fallback={fallback[i]} />,
      extra: <PairNote term={term} />,
    };
  });
  const question = content.questions[0];
  return (
    <>
      <WeekRadarCard radar={radar} />

      <div className="relative">
        {/* 용어 바로 가기(#item-용어id)는 문제 묶음 머리로 — 용어 풀이는 문제 해설 아래에 있어요 */}
        {content.terms.map((t) => (
          <span key={t.id} id={`item-${t.id}`} aria-hidden className="absolute top-0 scroll-mt-24" />
        ))}
        <div className="mb-3 flex flex-wrap items-end justify-between gap-x-3 gap-y-1 px-1">
          <h3 className={cn(jua.className, "text-[24px] leading-none")} style={{ color: C.ink }}>
            오늘의 {drill.questions.length}문제
          </h3>
          <Link href={letterHref(issue.date, "morning")} className="inline-flex items-center gap-0.5 text-[12.5px] font-semibold hover:underline" style={{ color: C.mute }}>
            아침판 기사에서 나왔어요
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.2} />
          </Link>
        </div>
        <LunchDrill
          issueId={issue.id}
          date={issue.date}
          live={issue.live}
          questions={views}
          sharePath={letterShareHref(issue)}
          shareTitle={`${EDITION_LABEL.noon} ${formatDayHeading(issue.date)} — ${issue.title}`}
        />
      </div>

      {question && <Interview n={question} />}
      {issue.extras.essay && <WeekendEssay essay={issue.extras.essay} />}
    </>
  );
}
