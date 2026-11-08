import Link from "next/link";
import { ArrowDown, ArrowRight, ChevronRight, ExternalLink } from "lucide-react";
import { formatDayHeading } from "@/lib/date";
import { amountOf, type NewsCard } from "@/lib/news-cards";
import { deckGlosser, deckSize, proseStrings, type Glosser } from "@/lib/news-gloss";
import { NEWS_SECTION_INFO, newsHref, volLabel, type BriefingIssue, type IssueStory, type NewsItem, type NewsSection, type StoryItem } from "@/lib/news-meta";
import type { LetterContent } from "@/lib/server/briefing";
import { cn } from "../ui";
import { MastheadMini, jua } from "./BriefingBrand";
import { CardDeck, Timetable } from "./CardDeck";
import { SourceLink } from "./interactive";
import { NewsDeck, timetableItem } from "./NewsDeck";

/**
 * 그림 이야기 아침판 (2026-11-08 시범) — 유튜브 영상과 같은 파스텔 그림체·주아체로 그린 브리핑.
 * 맨 위 큰 그림(영상 썸네일 같은 두 줄 글) → 위에 붙는 '오늘의 흐름' → 기사마다 그림 카드뉴스 → 기사 사이 다리 글 → '오늘 흐름, 한 번 더'.
 * 그림·다리 글은 호의 extras.story 에 (lib/news-meta.ts IssueStory), 카드 글은 기사(news) 그대로예요.
 */

/* 영상 그림체 색 (industry-tube style.yaml 과 같은 색) */
const C = {
  ink: "#27325f",
  navy: "#2b3a7a",
  sky: "#a3baf6",
  skyLight: "#c3ccfc",
  peri: "#7f96e8",
  lavender: "#d6cef7",
  blush: "#f0e0fa",
  paper: "#fffdf8",
  orange: "#f7a14a",
  yellow: "#ffd84d",
  body: "#4a5280",
  mute: "#7a86b8",
};

/** 분야 이름표 — 영상 색에 맞춘 옅은 바탕 + 진한 글씨 */
const SECTION_TONE: Record<NewsSection, { soft: string; ink: string }> = {
  global: { soft: "#fdebd6", ink: "#9a4d0d" },
  finance: { soft: "#e3e8fc", ink: "#3449a3" },
  policy: { soft: "#fbe3ea", ink: "#a33a55" },
  economy: { soft: "#e2f0df", ink: "#3f6b38" },
  public: { soft: "#f0e0fa", ink: "#6e3f92" },
  term: { soft: "#eef1fd", ink: "#2b3a7a" },
  question: { soft: "#eef1fd", ink: "#2b3a7a" },
};

/** 영상 썸네일 글씨 — 흰 글자 + 두꺼운 남색 테두리 + 아래로 비킨 그림자 (테두리는 글자 그림자 16방향으로 — 어느 브라우저에서나 같게) */
const OUTLINE = (() => {
  const r = 0.1;
  const ring = Array.from({ length: 16 }, (_, k) => {
    const a = (k * Math.PI) / 8;
    return `${(Math.cos(a) * r).toFixed(3)}em ${(Math.sin(a) * r).toFixed(3)}em 0 ${C.navy}`;
  });
  return [...ring, `0.1em 0.14em 0 rgba(39,50,95,0.42)`].join(",");
})();

/** '*말*' → 노란 강조 */
function Emph({ text, color }: { text: string; color: string }) {
  return (
    <>
      {text.split(/(\*[^*]+\*)/).map((p, i) =>
        p.startsWith("*") && p.endsWith("*") ? (
          <span key={i} style={{ color }}>
            {p.slice(1, -1)}
          </span>
        ) : (
          p
        ),
      )}
    </>
  );
}

const pad = (no: number) => String(no).padStart(2, "0");

/* ------------------------------------------------------------------ */
/* 머리 — 큰 그림 + 두 줄 글 + 제목 + 여는 글                              */
/* ------------------------------------------------------------------ */

export function StoryHeader({ issue, story, minutes, count }: { issue: BriefingIssue; story: IssueStory; minutes: number; count: number }) {
  const lines = story.hook.split(/\s*\/\s*/).filter(Boolean);
  return (
    <header className="relative px-3 pt-4 sm:px-4 md:px-7 md:pt-6">
      {/* 위쪽은 영상 하늘색이 종이색으로 번지게 */}
      <span aria-hidden className="absolute inset-x-0 top-0 h-[420px] bg-[linear-gradient(180deg,#dfe5fd_0%,#f3ecfb_55%,rgba(255,253,248,0)_100%)]" />
      <div className="relative flex items-center justify-between gap-3 px-1">
        <MastheadMini edition={issue.edition} />
        <p className="text-right tabular text-[12.5px] leading-snug" style={{ color: C.mute }}>
          <span className="block font-semibold whitespace-nowrap" style={{ color: C.ink }}>
            {formatDayHeading(issue.date)}
          </span>
          <span className="block whitespace-nowrap">
            {volLabel(issue.vol)} · 기사 {count}건 · 약 {minutes}분
          </span>
        </p>
      </div>

      <figure className="relative mt-4 overflow-clip rounded-[22px] shadow-[0_18px_36px_-24px_rgba(43,58,122,0.7)] ring-1 ring-[#2b3a7a]/10">
        {/* eslint-disable-next-line @next/next/no-img-element -- 그날 그린 그림 (public/magazine/brief) */}
        <img src={story.hero} alt="" fetchPriority="high" decoding="async" className="aspect-[16/9] w-full object-cover" />
        {lines.length > 0 && (
          <p
            aria-hidden
            className={cn(jua.className, "absolute bottom-[7%] left-[4.5%] text-[clamp(22px,6.6vw,42px)] leading-[1.22] tracking-[-0.01em] text-[#ffffff]")}
            style={{ textShadow: OUTLINE }}
          >
            {lines.map((l, i) => (
              <span key={i} className="block whitespace-nowrap">
                <Emph text={l} color={C.yellow} />
              </span>
            ))}
          </p>
        )}
      </figure>

      <h2 className={cn(jua.className, "relative mt-5 px-1 text-[24px] leading-[1.36] font-normal [word-break:keep-all] md:text-[31px]")} style={{ color: C.ink }}>
        {issue.title}
      </h2>
      {issue.lede && (
        <p className="relative mt-3 px-1 text-[15.5px] leading-[1.8] ko-justify md:text-[16.5px]" style={{ color: C.body }}>
          {issue.lede}
        </p>
      )}
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* 카드                                                                  */
/* ------------------------------------------------------------------ */

const SHELL = "flex flex-col overflow-clip rounded-[24px] bg-[#ffffff] shadow-[0_14px_30px_-20px_rgba(43,58,122,0.55)] ring-1 ring-[#2b3a7a]/[0.07]";
const TITLE = "text-[19px] leading-[1.38] font-bold tracking-[-0.02em] [word-break:keep-all]";
const BODY = "mt-2 text-[15px] leading-[1.68] [word-break:keep-all]";

/** 괄호 풀이 — 계산은 lib/news-gloss.ts, 여기서는 풀이 글씨만 작게 */
function glossed(g: Glosser, s: string): React.ReactNode {
  return g.r(s).map((p, i) =>
    typeof p === "string" ? (
      p
    ) : (
      <span key={i} className="text-[0.88em] font-medium opacity-75">
        ({p.gloss})
      </span>
    ),
  );
}

/** 카드 이름표 — 주아체 작은 띠 */
function Kicker({ children, tone = "orange" }: { children: React.ReactNode; tone?: "orange" | "sky" }) {
  return (
    <span
      className={cn(jua.className, "inline-flex w-fit items-center rounded-full px-2.5 py-[3px] text-[13px] leading-none")}
      style={tone === "orange" ? { background: "#fdebd6", color: "#9a4d0d" } : { background: "#e3e8fc", color: "#3449a3" }}
    >
      {children}
    </span>
  );
}

function Art({ src, className }: { src: string; className?: string }) {
  return (
    <div className={cn("relative shrink-0 overflow-clip bg-[#e7ebfd]", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element -- 그날 그린 그림 */}
      <img src={src} alt="" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" />
    </div>
  );
}

/** 표지 — 큰 그림 + 한 줄 요약 */
function Cover({ n, art, total, g }: { n: NewsItem; art: string; total: number; g: Glosser }) {
  const tone = SECTION_TONE[n.section];
  return (
    <div className={SHELL}>
      <div className="relative">
        {art ? <Art src={art} className="aspect-[5/3.3]" /> : <div className="aspect-[5/3.3] bg-[linear-gradient(180deg,#dfe5fd,#f3ecfb)]" />}
        <span className="absolute top-3 left-3 rounded-full px-2.5 py-1 text-[12px] font-bold shadow-[0_2px_6px_-2px_rgba(43,58,122,0.35)]" style={{ background: tone.soft, color: tone.ink }}>
          {NEWS_SECTION_INFO[n.section].label}
        </span>
      </div>
      <div className="flex flex-1 flex-col px-5 pt-4 pb-4">
        <Kicker>무슨 일이에요?</Kicker>
        <p className="mt-2 text-[18px] leading-[1.48] font-bold tracking-[-0.02em] [word-break:keep-all]" style={{ color: C.ink }}>
          {glossed(g, n.takeaway || n.title)}
        </p>
        <p className="mt-auto flex items-center gap-1 pt-3 text-[12.5px] font-semibold" style={{ color: C.mute }}>
          카드 {total}장 · 옆으로 넘겨 보세요
          <ChevronRight className="h-4 w-4 motion-safe:animate-pulse" strokeWidth={2.4} />
        </p>
      </div>
    </div>
  );
}

/** 그림이 있는 글 카드 (알고 가기·쉽게 말하면·용어·숫자) — 글이 길면 그림 칸을 낮춰요 */
function PicCard({ art, long, children }: { art: string; long: boolean; children: React.ReactNode }) {
  return (
    <div className={SHELL}>
      {art && <Art src={art} className={long ? "aspect-[5/2.5]" : "aspect-[5/3]"} />}
      <div className="flex flex-1 flex-col px-5 pt-4 pb-5">{children}</div>
    </div>
  );
}

/** 막대 위 숫자 — 주아체 */
const VALUE = cn(jua.className, "absolute left-1/2 -translate-x-1/2 tabular leading-none whitespace-nowrap");

/** 세로 막대 비교 — 높이는 적힌 숫자에서 계산 (가장 큰 값 = 가득), 강조 막대는 주황 */
function Bars({ c }: { c: Extract<NewsCard, { type: "bars" }> }) {
  const values = c.bars.map((b) => amountOf(b.value)?.n ?? 0);
  const max = Math.max(...values, 0) || 1;
  const anyHi = c.bars.some((b) => b.hi);
  const size = c.bars.length >= 4 ? "text-[13px]" : c.bars.length === 3 ? "text-[15px]" : "text-[18px]";
  return (
    <div className="absolute inset-x-4 top-5 bottom-3 flex items-stretch justify-around gap-2">
      {c.bars.map((b, i) => {
        const strong = anyHi ? b.hi : true;
        const h = Math.max(5, (values[i] / max) * 100);
        return (
          <div key={i} className="flex min-w-0 flex-1 flex-col items-center pt-6">
            <div className="relative w-full flex-1">
              <span className="absolute bottom-0 left-1/2 w-[56%] max-w-[54px] -translate-x-1/2 rounded-t-[12px]" style={{ height: `${h}%`, background: strong ? C.orange : "#b9c6f5" }} />
              <span className={cn(VALUE, size)} style={{ bottom: `calc(${h}% + 6px)`, color: strong ? C.ink : C.mute }}>
                {b.value}
              </span>
            </div>
            <span className={cn("mt-1.5 text-center text-[12.5px] leading-tight [word-break:keep-all]", strong ? "font-bold" : "font-medium")} style={{ color: strong ? C.ink : C.body }}>
              {b.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/** 전 → 후 — 줄마다 두 막대(전 하늘색 · 후 주황)와 오름·내림 띠 */
function Change({ c }: { c: Extract<NewsCard, { type: "change" }> }) {
  const one = c.rows.length === 1;
  return (
    <div className="absolute inset-x-4 top-4 bottom-3 flex items-stretch justify-around gap-3">
      {c.rows.map((r, i) => {
        const a = amountOf(r.from)?.n ?? 0;
        const b = amountOf(r.to)?.n ?? 0;
        const max = Math.max(a, b) || 1;
        const dir = a === b ? 0 : b > a ? 1 : -1;
        const bar = (v: number, label: string, after: boolean) => {
          const h = Math.max(6, (v / max) * 100);
          return (
            <div className={cn("relative h-full", one ? "w-[30%] max-w-[76px]" : "w-[38%] max-w-[48px]")}>
              <span className="absolute inset-x-0 bottom-0 rounded-t-[11px]" style={{ height: `${h}%`, background: after ? C.orange : "#b9c6f5" }} />
              <span
                className={cn(VALUE, one ? (after ? "text-[20px]" : "text-[15px]") : after ? "text-[13px]" : "text-[11.5px]")}
                style={{ bottom: `calc(${h}% + 5px)`, color: after ? C.ink : C.mute }}
              >
                {label}
              </span>
            </div>
          );
        };
        return (
          <div key={i} className="flex min-w-0 flex-1 flex-col items-center">
            {dir !== 0 && (
              <span
                className={cn(jua.className, "mb-1 rounded-full px-2.5 py-[3px] text-[12px] leading-none")}
                style={dir > 0 ? { background: "#fbe3ea", color: "#a33a55" } : { background: "#e3e8fc", color: "#3449a3" }}
              >
                {dir > 0 ? "▲ 올랐어요" : "▼ 내렸어요"}
              </span>
            )}
            <div className={cn("relative flex w-full flex-1 items-end justify-center pt-6", one ? "gap-[14%]" : "gap-[10%]")}>
              {bar(a, r.from, false)}
              {bar(b, r.to, true)}
            </div>
            <span className="mt-1.5 text-center text-[12.5px] leading-tight font-bold [word-break:keep-all]" style={{ color: C.ink }}>
              {r.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/** 도표 카드 — 위는 옅은 하늘 바탕의 도표, 아래는 제목·설명 */
function ChartCard({ kicker, title, note, g, children }: { kicker: string; title: string; note: string; g: Glosser; children: React.ReactNode }) {
  return (
    <div className={SHELL}>
      <div className="relative aspect-[5/3.7] shrink-0 overflow-clip bg-[linear-gradient(180deg,#e7ebfd_0%,#f6effc_100%)]">{children}</div>
      <div className="flex flex-1 flex-col px-5 pt-4 pb-5">
        <Kicker tone="sky">{kicker}</Kicker>
        {title && (
          <h4 className={cn(TITLE, "mt-2")} style={{ color: C.ink }}>
            {title}
          </h4>
        )}
        {note && (
          <p className={BODY} style={{ color: C.body }}>
            {glossed(g, note)}
          </p>
        )}
      </div>
    </div>
  );
}

function Middle({ c, art, g }: { c: NewsCard; art: string; g: Glosser }) {
  switch (c.type) {
    case "background":
    case "text":
      return (
        <PicCard art={art} long={c.text.length > 120}>
          <Kicker>{c.type === "background" ? "알고 가기" : "쉽게 말하면"}</Kicker>
          {c.title && (
            <h4 className={cn(TITLE, "mt-2")} style={{ color: C.ink }}>
              {c.title}
            </h4>
          )}
          <p className={BODY} style={{ color: C.body }}>
            {glossed(g, c.text)}
          </p>
        </PicCard>
      );
    case "term":
      return (
        <PicCard art={art} long={c.text.length > 120}>
          <Kicker>용어 풀이</Kicker>
          <p className="mt-2 text-[20px] leading-snug font-extrabold [word-break:keep-all]" style={{ color: C.navy }}>
            {c.term}
          </p>
          <p className={BODY} style={{ color: C.body }}>
            {glossed(g, c.text)}
          </p>
        </PicCard>
      );
    case "stat":
      return (
        <PicCard art={art} long={c.note.length > 80}>
          <Kicker>숫자로 보기</Kicker>
          <p className={cn(jua.className, "mt-2.5 w-fit tabular text-[clamp(34px,10vw,44px)] leading-[1.05] [overflow-wrap:anywhere]")} style={{ color: C.navy }}>
            <span className="bg-[linear-gradient(transparent_62%,#ffd84d_62%)] px-0.5">{c.value}</span>
          </p>
          <p className="mt-2 text-[16.5px] leading-snug font-bold [word-break:keep-all]" style={{ color: C.ink }}>
            {c.label}
          </p>
          {c.note && (
            <p className="mt-1.5 text-[14.5px] leading-relaxed [word-break:keep-all]" style={{ color: C.body }}>
              {glossed(g, c.note)}
            </p>
          )}
        </PicCard>
      );
    case "bars":
      return (
        <ChartCard kicker="비교해 보기" title={c.title} note={c.note} g={g}>
          <Bars c={c} />
        </ChartCard>
      );
    case "change":
      return (
        <ChartCard kicker="무엇이 바뀌었나" title={c.title} note={c.note} g={g}>
          <Change c={c} />
        </ChartCard>
      );
    case "flow": {
      // 단계가 모두 날짜로 시작하면 일정표 (마지막 장을 결론처럼 칠하지 않아요)
      const calendar = c.steps.every((st) => /^\d{1,2}일/.test(st));
      return (
        <div className={cn(SHELL, "bg-[linear-gradient(180deg,#eef1fd_0%,#fffdf8_100%)]")}>
          <div className="px-5 pt-5">
            <Kicker tone="sky">{calendar ? "이번 주 달력" : "흐름으로 보기"}</Kicker>
            {c.title && (
              <h4 className={cn(TITLE, "mt-2")} style={{ color: C.ink }}>
                {c.title}
              </h4>
            )}
          </div>
          <ol className="relative flex flex-1 flex-col justify-center gap-2.5 px-5 pt-3 pb-5">
            <span aria-hidden className="absolute top-8 bottom-10 left-[35px] w-0 border-l-2 border-dashed border-[#a3baf6]" />
            {c.steps.map((s, i) => {
              const last = !calendar && i === c.steps.length - 1;
              return (
                <li key={i} className="relative flex items-center gap-3">
                  <span
                    className={cn(jua.className, "z-10 inline-flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full text-[15px] leading-none ring-4 ring-[#fffdf8]")}
                    style={last ? { background: C.orange, color: C.ink } : { background: C.skyLight, color: C.navy }}
                  >
                    {i + 1}
                  </span>
                  <span
                    className="min-w-0 flex-1 rounded-2xl px-3.5 py-2.5 text-[14.5px] leading-snug font-semibold [word-break:keep-all]"
                    style={last ? { background: C.navy, color: "#ffffff" } : { background: "#ffffff", color: C.ink, boxShadow: "0 1px 3px rgba(43,58,122,0.12)" }}
                  >
                    {s}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      );
    }
    case "quote":
      return (
        <PicCard art={art} long={c.note.length > 80}>
          <Kicker>한마디</Kicker>
          <p className="mt-2 text-[18px] leading-snug font-extrabold [word-break:keep-all]" style={{ color: C.ink }}>
            &ldquo;{c.text}&rdquo;
          </p>
          <p className="mt-1.5 text-[14px] font-semibold" style={{ color: C.mute }}>
            {c.name}
          </p>
          {c.note && (
            <p className={BODY} style={{ color: C.body }}>
              {glossed(g, c.note)}
            </p>
          )}
        </PicCard>
      );
    case "versus":
      return (
        <div className={SHELL}>
          <div className="px-5 pt-5">
            <Kicker tone="sky">둘을 비교</Kicker>
            {c.title && (
              <h4 className={cn(TITLE, "mt-2")} style={{ color: C.ink }}>
                {c.title}
              </h4>
            )}
          </div>
          <div className="grid flex-1 grid-cols-2 gap-2 px-4 pt-3 pb-5">
            {[c.left, c.right].map((side, i) => (
              <div key={i} className="flex flex-col rounded-2xl px-3 py-4" style={{ background: i === 0 ? "#eef1fd" : "#fdebd6" }}>
                <p className={cn(jua.className, "text-[18px] leading-tight [word-break:keep-all]")} style={{ color: i === 0 ? C.navy : "#9a4d0d" }}>
                  {side.name}
                </p>
                <p className="mt-2 text-[14px] leading-relaxed [word-break:keep-all]" style={{ color: C.body }}>
                  {glossed(g, side.text)}
                </p>
              </div>
            ))}
          </div>
        </div>
      );
  }
}

/** 마지막 장 — 그래서, 왜 중요할까? (필기·면접 포인트) */
function Point({ text, art, g }: { text: string; art: string; g: Glosser }) {
  return (
    <div className={cn(SHELL, "bg-[linear-gradient(180deg,#ffffff_0%,#fff6e8_100%)]")}>
      {art && <Art src={art} className="aspect-[5/2.6]" />}
      <div className="flex flex-1 flex-col px-5 pt-4 pb-5">
        <Kicker>그래서, 왜 중요할까?</Kicker>
        <p className="mt-2 text-[13px] font-bold" style={{ color: "#9a4d0d" }}>
          필기·면접 포인트
        </p>
        <p className="mt-1 text-[15px] leading-[1.7] [word-break:keep-all]" style={{ color: C.ink }}>
          {glossed(g, text)}
        </p>
      </div>
    </div>
  );
}

/** 자세히 보기 = 기사 원문 */
function ReadMore({ n }: { n: NewsItem }) {
  const cls = "inline-flex max-w-full items-center gap-1.5 rounded-full bg-[#eef1fd] px-3.5 py-2 text-[13px] font-semibold text-[#2b3a7a] transition-colors hover:bg-[#e0e6fc]";
  return n.sourceUrl ? (
    <SourceLink id={n.id} href={n.sourceUrl} className={cls}>
      <span className="truncate">자세히 보기{n.sourceName ? ` · ${n.sourceName}` : ""}</span>
      <ExternalLink className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
    </SourceLink>
  ) : (
    <Link href={newsHref(n.id)} className={cls}>
      자세히 보기
      <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
    </Link>
  );
}

/** 기사 한 편 = 이야기 한 장(章) — 번호·분야·제목 + 그림 카드뉴스 */
function Chapter({ n, no, item, pointArt }: { n: NewsItem; no: number; item: StoryItem; pointArt: string }) {
  const tone = SECTION_TONE[n.section];
  const gloss = deckGlosser(n);
  const coverG = gloss([n.takeaway || n.title]);
  const middles = n.cards.map((c, i) => <Middle key={i} c={c} art={item.cards[i] ?? ""} g={gloss(proseStrings(c))} />);
  const pointG = n.point ? gloss([n.point]) : null;
  return (
    <section id={`item-${n.id}`} className="scroll-mt-36">
      <CardDeck
        id={n.id}
        look="story"
        label={`${pad(no)} ${n.title}`}
        head={
          <div className="px-1">
            <p className="flex flex-wrap items-center gap-2">
              <span className={cn(jua.className, "inline-flex h-8 min-w-8 items-center justify-center rounded-full px-2 text-[16px] leading-none")} style={{ background: C.navy, color: "#ffffff" }}>
                {pad(no)}
              </span>
              <span className="rounded-full px-2.5 py-1 text-[12px] font-bold" style={{ background: tone.soft, color: tone.ink }}>
                {NEWS_SECTION_INFO[n.section].label}
              </span>
              {n.headline && (
                <span className={cn(jua.className, "rounded-full px-2.5 py-1 text-[12.5px] leading-none")} style={{ background: C.yellow, color: C.ink }}>
                  오늘의 헤드라인
                </span>
              )}
            </p>
            <h3 className={cn(jua.className, "mt-2.5 text-[22px] leading-[1.4] font-normal [word-break:keep-all] md:text-[26px]")} style={{ color: C.ink }}>
              {n.title}
            </h3>
          </div>
        }
        foot={<ReadMore n={n} />}
      >
        <Cover n={n} art={item.art} total={deckSize(n)} g={coverG} />
        {middles}
        {n.point && pointG && <Point text={n.point} art={pointArt} g={pointG} />}
      </CardDeck>
    </section>
  );
}

/** 기사와 기사 사이 — 앞 이야기가 다음 이야기로 이어지는 한두 문장 */
function Bridge({ label, text }: { label: string; text: string }) {
  return (
    <div className="flex flex-col items-center px-3 text-center">
      <span aria-hidden className="h-7 w-0 border-l-2 border-dashed border-[#a3baf6]" />
      <p className={cn(jua.className, "mt-1.5 inline-flex items-center rounded-full px-4 py-2 text-[15px] leading-none")} style={{ background: C.navy, color: "#ffffff" }}>
        {label}
      </p>
      <p className="mt-3 max-w-[31em] text-[15px] leading-[1.78] [word-break:keep-all]" style={{ color: C.body }}>
        {text}
      </p>
      <span aria-hidden className="mt-3 h-6 w-0 border-l-2 border-dashed border-[#a3baf6]" />
      <ArrowDown aria-hidden className="-mt-1 h-4 w-4 text-[#a3baf6]" strokeWidth={2.6} />
    </div>
  );
}

/** 맺음 — 오늘 흐름, 한 번 더 (기사 그림 동그라미 + 한 줄씩, 누르면 그 기사로) */
function Recap({ items, lines, arts }: { items: NewsItem[]; lines: string[]; arts: Map<number, string> }) {
  if (!lines.length) return null;
  return (
    <section aria-labelledby="story-recap" className="rounded-[24px] bg-[linear-gradient(160deg,#e7ebfd_0%,#f6effc_100%)] px-4 py-6 sm:px-6">
      <h3 id="story-recap" className={cn(jua.className, "px-1 text-[22px] leading-tight font-normal")} style={{ color: C.ink }}>
        오늘 흐름, 한 번 더
      </h3>
      <ol className="relative mt-4 space-y-3">
        <span aria-hidden className="absolute top-6 bottom-6 left-[23px] w-0 border-l-2 border-dashed border-[#a3baf6]" />
        {items.slice(0, lines.length).map((n, i) => (
          <li key={n.id} className="relative">
            <a href={`#item-${n.id}`} className="group flex items-center gap-3">
              <span className="relative h-12 w-12 shrink-0">
                {arts.get(n.id) ? (
                  // eslint-disable-next-line @next/next/no-img-element -- 그날 그린 기사 그림
                  <img src={arts.get(n.id)} alt="" loading="lazy" className="h-12 w-12 rounded-full object-cover ring-[3px] ring-[#ffffff]" />
                ) : (
                  <span className="block h-12 w-12 rounded-full bg-[#ffffff]" />
                )}
                <span
                  className={cn(jua.className, "absolute -right-1 -bottom-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] leading-none ring-2 ring-[#ffffff]")}
                  style={{ background: C.orange, color: C.ink }}
                >
                  {i + 1}
                </span>
              </span>
              <span className="min-w-0 flex-1 rounded-2xl bg-[#ffffff] px-4 py-3 text-[14.5px] leading-snug font-semibold shadow-[0_1px_3px_rgba(43,58,122,0.1)] [word-break:keep-all] group-hover:underline" style={{ color: C.ink }}>
                {lines[i]}
              </span>
            </a>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** 몸통 — 오늘의 흐름(위에 붙는 칩) → 기사 장들(사이에 다리 글) → 오늘 흐름, 한 번 더 */
export function StoryBody({ content, story }: { content: LetterContent; story: IssueStory }) {
  const { all } = content;
  if (!all.length) return null;
  const byId = new Map(story.items.map((it) => [it.id, it]));
  const arts = new Map(story.items.filter((it) => it.art).map((it) => [it.id, it.art]));
  return (
    <div>
      <Timetable look="story" items={all.map((n) => ({ ...timetableItem(n), art: arts.get(n.id) }))} />
      {all.map((n, i) => {
        const item = byId.get(n.id);
        const bridge = i < all.length - 1 ? item?.bridge : null;
        return (
          <div key={n.id}>
            <div className="mt-8 md:mt-10">{item ? <Chapter n={n} no={i + 1} item={item} pointArt={story.pointArt} /> : <NewsDeck n={n} no={i + 1} />}</div>
            {bridge && (
              <div className="mt-8 md:mt-10">
                <Bridge label={bridge.label} text={bridge.text} />
              </div>
            )}
          </div>
        );
      })}
      <div className="mt-10 md:mt-12">
        <Recap items={all} lines={story.recap} arts={arts} />
      </div>
    </div>
  );
}
