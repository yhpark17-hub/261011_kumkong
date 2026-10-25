import Link from "next/link";
import { ArrowDown, ArrowRight, BookA, ChartBarBig, ChevronRight, ExternalLink, Hash, Lightbulb, MessageCircle, Newspaper, Repeat, Workflow, type LucideIcon } from "lucide-react";
import { amountOf, type NewsCard } from "@/lib/news-cards";
import { NEWS_SECTION_INFO, newsHref, type NewsItem } from "@/lib/news-meta";
import { cn } from "../ui";
import { CardDeck, type TimetableItem } from "./CardDeck";
import { SourceLink } from "./interactive";
import { NEWS_ICON } from "./news-icons";

/** 카드뉴스 — 아침판 기사 한 건 = 표지 + 사이 장들(쉬운 설명·그림) + '왜 중요할까' */

const pad = (no: number) => String(no).padStart(2, "0");

/** 사이 장이 없는 예전 기사 — 요약을 한두 문장씩 나눠 글 카드로 (한 장 120자 안쪽) */
function summaryChunks(text: string): string[] {
  const sentences = text
    .split(/\n+/)
    .flatMap((b) => b.split(/(?<=[.!?]["'”’)]?)\s+/))
    .map((t) => t.trim())
    .filter(Boolean);
  const out: string[] = [];
  for (const s of sentences) {
    const last = out.length - 1;
    if (last >= 0 && out[last].length + s.length < 120) out[last] = `${out[last]} ${s}`;
    else out.push(s);
  }
  return out.slice(0, 4);
}

/** 카드 장 수 (시간표에 적는 수) — 표지 + 사이 장(카드, 없으면 요약 글) + '왜 중요할까' */
export const deckSize = (n: NewsItem) => 1 + (n.cards.length || summaryChunks(n.summary).length) + (n.point ? 1 : 0);

export const timetableItem = (n: NewsItem): TimetableItem => ({ id: n.id, section: n.section, title: n.title, headline: n.headline, slides: deckSize(n) });

/** 카드 맨 위 작은 이름표 — 이 장이 무엇을 보여 주는지 */
function Kicker({ icon: Icon, label, tone = "text-primary-text" }: { icon: LucideIcon; label: string; tone?: string }) {
  return (
    <p className={cn("flex items-center gap-1.5 type-caption font-semibold", tone)}>
      <Icon className="h-4 w-4" strokeWidth={2} />
      {label}
    </p>
  );
}

/** 밝은 카드 바탕 */
const LIGHT = "flex flex-col overflow-clip rounded-2xl bg-canvas p-5 shadow-[0_1px_0_0_var(--color-hairline)] ring-1 ring-hairline md:p-7";
const CARD_TITLE = "mt-3 type-heading-md text-ink [word-break:keep-all] md:type-heading-lg";
/** 카드 글은 짧아서 양쪽 맞춤 대신 낱말 단위로 줄을 바꿔요 (양쪽 맞춤은 낱말 사이가 크게 벌어져요) */
const CARD_TEXT = "type-body-lg leading-[1.75] text-ink [word-break:keep-all]";

function Cover({ n, total }: { n: NewsItem; total: number }) {
  const info = NEWS_SECTION_INFO[n.section];
  const Icon = NEWS_ICON[n.section];
  return (
    <div className="relative flex flex-col overflow-clip rounded-2xl bg-brand-dark p-5 text-on-primary md:p-7">
      {n.imageUrl ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element -- 운영자가 올린 사진 (Blob 주소) */}
          <img src={n.imageUrl} alt="" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" />
          <span aria-hidden className="absolute inset-0 bg-linear-to-t from-brand-dark via-brand-dark/80 to-brand-dark/30" />
        </>
      ) : (
        <>
          <span aria-hidden className={cn("absolute -top-20 -right-16 h-64 w-64 rounded-full opacity-60 blur-3xl", info.dot)} />
          <span aria-hidden className="absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-primary/40 blur-3xl" />
          <span aria-hidden className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.09)_1px,transparent_1px)] bg-[length:18px_18px]" />
          <Icon aria-hidden className="absolute top-5 right-5 h-20 w-20 text-on-primary/15 md:h-28 md:w-28" strokeWidth={1.25} />
        </>
      )}
      <p className="relative flex items-center gap-1.5 type-caption font-semibold text-on-primary/80">
        <Icon className="h-4 w-4" strokeWidth={2} />
        {info.label}
      </p>
      <h3 className="relative mt-auto pt-8 text-[23px] leading-[1.32] font-bold tracking-[-0.02em] [word-break:keep-all] md:text-[30px]">{n.title}</h3>
      {n.takeaway && <p className="relative mt-3 type-body-md leading-relaxed text-on-primary/85 [word-break:keep-all] md:type-body-lg">{n.takeaway}</p>}
      <p className="relative mt-5 flex items-center gap-1 type-caption font-semibold text-on-primary/70">
        카드 {total}장 · 옆으로 넘겨 보세요
        <ChevronRight className="h-4 w-4 motion-safe:animate-pulse" strokeWidth={2.2} />
      </p>
      {n.imageUrl && n.imageCredit && <span className="absolute top-2 right-3 type-micro text-on-primary/70">사진 · {n.imageCredit}</span>}
    </div>
  );
}

/** 막대 비교 — 길이는 적힌 숫자에서 계산 (가장 큰 값 = 꽉 찬 막대). 강조(hi)한 막대만 진한 색 */
function Bars({ c }: { c: Extract<NewsCard, { type: "bars" }> }) {
  const values = c.bars.map((b) => amountOf(b.value)?.n ?? 0);
  const max = Math.max(...values, 0);
  const anyHi = c.bars.some((b) => b.hi);
  return (
    <ul className="mt-5 space-y-3.5">
      {c.bars.map((b, i) => {
        const strong = anyHi ? b.hi : true;
        const pct = max > 0 ? Math.max(2, (values[i] / max) * 100) : 0;
        return (
          <li key={i}>
            <p className="flex items-baseline justify-between gap-3">
              <span className={cn("min-w-0 type-body-md [word-break:keep-all]", strong ? "font-semibold text-ink" : "text-ink-secondary")}>{b.label}</span>
              <span className={cn("shrink-0 tabular type-body-md", strong ? "font-bold text-ink" : "text-ink-secondary")}>{b.value}</span>
            </p>
            <span className="mt-1.5 block h-3 w-full" title={`${b.label} ${b.value}`}>
              <span className={cn("block h-full rounded-r-[4px]", strong ? "bg-primary" : "bg-ink-mute/35")} style={{ width: `${pct}%` }} />
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/** 전 → 후. 오름(▲ 빨강)·내림(▼ 파랑)은 숫자에서 계산 — 우리 시장 표기 */
function Change({ c }: { c: Extract<NewsCard, { type: "change" }> }) {
  return (
    <ul className="mt-5 space-y-2.5">
      {c.rows.map((r, i) => {
        const a = amountOf(r.from)?.n;
        const b = amountOf(r.to)?.n;
        const dir = a == null || b == null || a === b ? 0 : b > a ? 1 : -1;
        return (
          <li key={i} className="rounded-xl bg-canvas-soft px-4 py-3">
            <p className="flex items-center justify-between gap-2">
              <span className="min-w-0 type-caption text-ink-secondary [word-break:keep-all]">{r.label}</span>
              {dir !== 0 && <span className={cn("shrink-0 type-caption font-bold", dir > 0 ? "text-ruby" : "text-ev-final")}>{dir > 0 ? "▲ 오름" : "▼ 내림"}</span>}
            </p>
            <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 tabular">
              <span className="type-body-lg text-ink-mute">{r.from}</span>
              <ArrowRight aria-label="에서" className="h-4 w-4 text-ink-mute" strokeWidth={2.2} />
              <span className="text-[22px] leading-tight font-bold text-ink">{r.to}</span>
            </p>
          </li>
        );
      })}
    </ul>
  );
}

function Middle({ c }: { c: NewsCard }) {
  switch (c.type) {
    case "text":
      return (
        <div className={LIGHT}>
          <Kicker icon={MessageCircle} label="쉽게 말하면" />
          {c.title && <h4 className={CARD_TITLE}>{c.title}</h4>}
          <p className={cn("mt-3", CARD_TEXT)}>{c.text}</p>
        </div>
      );
    case "stat":
      return (
        <div className={LIGHT}>
          <Kicker icon={Hash} label="숫자로 보기" />
          <div className="my-auto py-4">
            <p className="tabular text-[clamp(32px,10vw,56px)] leading-[1.05] font-bold tracking-[-0.03em] text-brand-dark [overflow-wrap:anywhere]">{c.value}</p>
            <p className="mt-3 type-heading-sm text-ink [word-break:keep-all]">{c.label}</p>
            {c.note && <p className="mt-2 type-body-md leading-relaxed text-ink-secondary [word-break:keep-all]">{c.note}</p>}
          </div>
        </div>
      );
    case "bars":
      return (
        <div className={LIGHT}>
          <Kicker icon={ChartBarBig} label="비교해 보기" />
          {c.title && <h4 className={CARD_TITLE}>{c.title}</h4>}
          <Bars c={c} />
          {c.note && <p className="mt-auto pt-4 type-caption leading-relaxed text-ink-mute [word-break:keep-all]">{c.note}</p>}
        </div>
      );
    case "change":
      return (
        <div className={LIGHT}>
          <Kicker icon={Repeat} label="무엇이 바뀌었나" />
          {c.title && <h4 className={CARD_TITLE}>{c.title}</h4>}
          <Change c={c} />
          {c.note && <p className="mt-auto pt-4 type-caption leading-relaxed text-ink-mute [word-break:keep-all]">{c.note}</p>}
        </div>
      );
    case "flow":
      return (
        <div className={LIGHT}>
          <Kicker icon={Workflow} label="흐름으로 보기" />
          {c.title && <h4 className={CARD_TITLE}>{c.title}</h4>}
          <ol className="mt-4">
            {c.steps.map((s, i) => (
              <li key={i}>
                <p className="flex items-center gap-3 rounded-xl bg-canvas-soft px-3.5 py-2.5">
                  <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-dark tabular text-[12px] font-bold text-on-primary">{i + 1}</span>
                  <span className="min-w-0 type-body-md font-semibold text-ink [word-break:keep-all]">{s}</span>
                </p>
                {i < c.steps.length - 1 && <ArrowDown aria-hidden className="mx-auto my-0.5 h-4 w-4 text-ink-mute" strokeWidth={2.2} />}
              </li>
            ))}
          </ol>
        </div>
      );
    case "term":
      return (
        <div className={LIGHT}>
          <Kicker icon={BookA} label="용어 풀이" />
          <p className="mt-4 w-fit rounded-full bg-ev-written-soft px-4 py-1.5 type-heading-md text-primary-text [word-break:keep-all]">{c.term}</p>
          <p className={cn("mt-4", CARD_TEXT)}>{c.text}</p>
        </div>
      );
  }
}

/** 카드가 없는 예전 기사 — 요약 글을 나눠 담은 장 */
function SummarySlide({ text, first }: { text: string; first: boolean }) {
  return (
    <div className={LIGHT}>
      <Kicker icon={Newspaper} label={first ? "무슨 일이에요?" : "조금 더 자세히"} />
      <p className={cn("mt-4", CARD_TEXT)}>{text}</p>
    </div>
  );
}

function Point({ text }: { text: string }) {
  return (
    <div className="flex flex-col overflow-clip rounded-2xl bg-[#fff6e3] p-5 ring-1 ring-lemon/25 md:p-7">
      <Kicker icon={Lightbulb} label="왜 중요할까" tone="text-lemon" />
      <p className="mt-0.5 type-caption text-ink-mute">필기·면접 포인트</p>
      <p className={cn("mt-4", CARD_TEXT)}>{text}</p>
    </div>
  );
}

/** 자세히 보기 = 기사 원문 (원문이 없으면 금콩 기사 페이지) */
function ReadMore({ n }: { n: NewsItem }) {
  return n.sourceUrl ? (
    <SourceLink id={n.id} href={n.sourceUrl} className="btn btn-sm btn-secondary max-w-full">
      <span className="truncate">자세히 보기{n.sourceName ? ` · ${n.sourceName}` : ""}</span>
      <ExternalLink className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
    </SourceLink>
  ) : (
    <Link href={newsHref(n.id)} className="btn btn-sm btn-secondary">
      자세히 보기
      <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
    </Link>
  );
}

/** 기사 머리 — 번호(01·02 …)와 분야 */
function DeckHead({ n, no }: { n: NewsItem; no: number }) {
  const info = NEWS_SECTION_INFO[n.section];
  return (
    <span className="flex min-w-0 flex-wrap items-center gap-1.5">
      <span
        className={cn(
          "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full tabular text-[15px] font-semibold md:h-10 md:w-10 md:text-[16px]",
          n.headline ? "bg-brand-dark text-on-primary" : "border-2 border-brand-dark bg-canvas text-brand-dark",
        )}
      >
        {pad(no)}
      </span>
      {n.headline && <span className="tag bg-brand-dark text-on-primary">오늘의 헤드라인</span>}
      <span className={cn("tag", info.tone)}>{info.label}</span>
    </span>
  );
}

/** 기사 한 건 카드뉴스 */
export function NewsDeck({ n, no }: { n: NewsItem; no: number }) {
  const total = deckSize(n);
  return (
    <div id={`item-${n.id}`} className="scroll-mt-24">
      <CardDeck id={n.id} label={`${pad(no)} ${n.title}`} head={<DeckHead n={n} no={no} />} foot={<ReadMore n={n} />}>
        <Cover n={n} total={total} />
        {n.cards.length ? n.cards.map((c, i) => <Middle key={i} c={c} />) : summaryChunks(n.summary).map((t, i) => <SummarySlide key={i} text={t} first={i === 0} />)}
        {n.point && <Point text={n.point} />}
      </CardDeck>
    </div>
  );
}
