import Link from "next/link";
import { ArrowRight, ChevronRight, ExternalLink } from "lucide-react";
import { amountOf, isMoneyUnit, type NewsCard } from "@/lib/news-cards";
import { NEWS_SECTION_INFO, newsHref, type NewsItem, type NewsSection } from "@/lib/news-meta";
import { PIC_H, PIC_W, SECTION_THEME, coinStack, defaultPic, picPerson, picSvg } from "@/lib/server/card-pics";
import { cn } from "../ui";
import { CardDeck, type TimetableItem } from "./CardDeck";
import { SourceLink } from "./interactive";
import { NEWS_ICON } from "./news-icons";

/**
 * 카드뉴스 — 아침판 기사 한 건 = 표지 + 사이 장들 + '왜 중요할까'.
 * 카드마다 위쪽 절반은 그림(콩이·그림 부품·인물 초상) 또는 도표(동전 탑·전후 막대), 아래는 큰 글 한두 줄.
 */

type Theme = (typeof SECTION_THEME)[NewsSection];

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

/** 카드 장 수 — 표지 + 사이 장(카드, 없으면 요약 글) + '왜 중요할까' */
export const deckSize = (n: NewsItem) => 1 + (n.cards.length || summaryChunks(n.summary).length) + (n.point ? 1 : 0);

/** 시간표 한 칸 — 짧은 이름이 없으면 분야 이름 */
export const timetableItem = (n: NewsItem): TimetableItem => ({ id: n.id, label: n.short || NEWS_SECTION_INFO[n.section].label, section: n.section, headline: n.headline });

/* ------------------------------------------------------------------ */
/* 카드 뼈대                                                             */
/* ------------------------------------------------------------------ */

const SHELL = "flex flex-col overflow-clip rounded-[22px] bg-canvas shadow-[0_14px_30px_-18px_rgba(28,30,84,0.5)] ring-1 ring-black/5";
const HEAD = "text-[20px] leading-[1.32] font-bold tracking-[-0.02em] text-ink [word-break:keep-all]";
const BODY = "mt-2 text-[15px] leading-[1.65] text-ink-secondary [word-break:keep-all]";
const DOTS = "absolute inset-0 bg-[radial-gradient(rgba(28,30,84,0.07)_1.2px,transparent_1.2px)] bg-[length:16px_16px]";

/** 카드 그림 — 정해진 그림(콩이·부품 장면) 또는 'who:인물' 초상 */
function Pic({ name, theme, id, className }: { name: string; theme: Theme; id: string; className?: string }) {
  const person = picPerson(name);
  if (person)
    return (
      <span className={cn("block", className)}>
        {/* eslint-disable-next-line @next/next/no-img-element -- 등록 인물 초상 (SVG 그림) */}
        <img src={`/magazine/portrait/${person.who}`} alt="" loading="lazy" decoding="async" className="mx-auto h-full w-auto object-contain object-bottom" />
      </span>
    );
  return <svg viewBox={`0 0 ${PIC_W} ${PIC_H}`} aria-hidden className={cn("block", className)} dangerouslySetInnerHTML={{ __html: picSvg(name, theme.accent, id) }} />;
}

/** 인물 초상 원본 사진 출처 (자유 이용 사진을 바탕으로 그린 경우) */
function PicCredit({ name }: { name: string }) {
  const credit = picPerson(name)?.credit;
  return credit ? <span className="absolute right-2 bottom-1 z-10 rounded bg-white/75 px-1 text-[9px] text-ink-mute">{credit}</span> : null;
}

/** 카드 위쪽 그림 칸 — 분야 색 바탕 + 이름표 */
function Panel({ theme, kicker, tall = false, children }: { theme: Theme; kicker?: string; tall?: boolean; children: React.ReactNode }) {
  return (
    <div className={cn("relative shrink-0 overflow-clip", tall ? "aspect-[5/3.7]" : "aspect-[5/3]")} style={{ background: `linear-gradient(180deg, ${theme.panel} 0%, #ffffff 135%)` }}>
      <span aria-hidden className={DOTS} />
      {kicker && (
        <span className="absolute top-3 left-3 z-10 rounded-full bg-white/90 px-2.5 py-1 text-[12px] font-bold shadow-[0_1px_2px_rgba(0,0,0,0.08)]" style={{ color: theme.accent }}>
          {kicker}
        </span>
      )}
      {children}
    </div>
  );
}

const Caption = ({ children }: { children: React.ReactNode }) => <div className="flex flex-1 flex-col px-5 pt-4 pb-5">{children}</div>;

/* ------------------------------------------------------------------ */
/* 도표                                                                  */
/* ------------------------------------------------------------------ */

/** 동전 탑 상자 높이 (60×200, 동전 하나 r=24 → 두께 5.76) — 막대 위 숫자 자리를 잡으려고 탑 높이를 계산해요 */
const TOWER_H = 200;
const COIN_R = 24;

/** 세로 막대 비교 — 돈이면 동전 탑(금색 = 강조), 아니면 둥근 막대. 높이는 적힌 숫자에서 계산 (가장 큰 값 = 가득) */
function BarsChart({ c, theme }: { c: Extract<NewsCard, { type: "bars" }>; theme: Theme }) {
  const amounts = c.bars.map((b) => amountOf(b.value));
  const values = amounts.map((a) => a?.n ?? 0);
  const max = Math.max(...values, 0) || 1;
  const money = isMoneyUnit(amounts[0]?.unit ?? "");
  const anyHi = c.bars.some((b) => b.hi);
  // 막대가 많으면 숫자 글씨를 줄여 옆 막대 숫자와 겹치지 않게
  const valueSize = c.bars.length >= 4 ? "text-[11px]" : c.bars.length === 3 ? "text-[12px]" : "text-[14px]";
  return (
    <div className="absolute inset-x-3 top-11 bottom-2 flex items-stretch justify-around gap-1.5">
      {c.bars.map((b, i) => {
        const strong = anyHi ? b.hi : true;
        const ratio = values[i] / max;
        // 돈: 동전 수 = 비율 × 28 (적어도 1개) → 탑 꼭대기 높이(%) / 막대: 높이 %
        const coins = Math.max(1, Math.round(ratio * 28));
        const top = money ? ((coins * COIN_R * 0.24 + COIN_R * 0.68 + 2) / TOWER_H) * 100 : Math.max(4, ratio * 100);
        return (
          <div key={i} className="flex min-w-0 flex-1 flex-col items-center pt-5" title={`${b.label} ${b.value}`}>
            <div className="relative w-full flex-1">
              {money ? (
                <svg
                  viewBox={`0 0 60 ${TOWER_H}`}
                  preserveAspectRatio="xMidYMax meet"
                  aria-hidden
                  className="absolute inset-0 h-full w-full"
                  dangerouslySetInnerHTML={{ __html: coinStack(30, TOWER_H - COIN_R * 0.34 - 2, coins, COIN_R, strong) }}
                />
              ) : (
                <span className="absolute bottom-0 left-1/2 w-[58%] max-w-[46px] -translate-x-1/2 rounded-t-[10px]" style={{ height: `${top}%`, background: strong ? theme.accent : "#c3ccd9" }} />
              )}
              <span
                className={cn("absolute left-1/2 -translate-x-1/2 tabular leading-none font-bold whitespace-nowrap", valueSize)}
                style={{ bottom: `calc(${top}% + 6px)`, color: strong ? theme.deep : "#64748d" }}
              >
                {b.value}
              </span>
            </div>
            <span className={cn("mt-1.5 text-center text-[12px] leading-tight [word-break:keep-all]", strong ? "font-bold text-ink" : "text-ink-secondary")}>{b.label}</span>
          </div>
        );
      })}
    </div>
  );
}

/** 전 → 후 — 줄마다 두 막대(전 회색 · 후 분야색)와 오름(▲ 빨강)·내림(▼ 파랑). 높이는 그 줄의 큰 값 기준 */
function ChangeChart({ c, theme }: { c: Extract<NewsCard, { type: "change" }>; theme: Theme }) {
  // 줄이 하나면 막대를 넓고 글씨를 크게, 여럿이면 전·후 숫자가 겹치지 않게 작게
  const one = c.rows.length === 1;
  return (
    <div className="absolute inset-x-3 top-11 bottom-2 flex items-stretch justify-around gap-2">
      {c.rows.map((r, i) => {
        const a = amountOf(r.from)?.n ?? 0;
        const b = amountOf(r.to)?.n ?? 0;
        const max = Math.max(a, b) || 1;
        const dir = a === b ? 0 : b > a ? 1 : -1;
        const bar = (v: number, label: string, after: boolean) => {
          const h = Math.max(6, (v / max) * 100);
          return (
            <div className={cn("relative h-full", one ? "w-[30%] max-w-[72px]" : "w-[36%] max-w-[44px]")}>
              <span className="absolute inset-x-0 bottom-0 rounded-t-[9px]" style={{ height: `${h}%`, background: after ? theme.accent : "#c3ccd9" }} />
              <span
                className={cn(
                  "absolute left-1/2 -translate-x-1/2 tabular leading-none font-bold whitespace-nowrap",
                  one ? (after ? "text-[17px]" : "text-[14px]") : after ? "text-[12px]" : "text-[10.5px]",
                )}
                style={{ bottom: `calc(${h}% + 5px)`, color: after ? theme.deep : "#64748d" }}
              >
                {label}
              </span>
            </div>
          );
        };
        return (
          <div key={i} className="flex min-w-0 flex-1 flex-col items-center">
            {dir !== 0 && (
              <span className={cn("mb-1 rounded-full px-2 py-0.5 text-[11px] font-bold text-white", dir > 0 ? "bg-ruby" : "bg-[#2f6fd6]")}>{dir > 0 ? "▲ 오름" : "▼ 내림"}</span>
            )}
            <div className={cn("relative flex w-full flex-1 items-end justify-center pt-5", one ? "gap-[14%]" : "gap-[12%]")}>
              {bar(a, r.from, false)}
              {bar(b, r.to, true)}
            </div>
            <span className="mt-1.5 text-center text-[12px] leading-tight font-semibold text-ink [word-break:keep-all]">{r.label}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 카드                                                                  */
/* ------------------------------------------------------------------ */

function Cover({ n, total, theme }: { n: NewsItem; total: number; theme: Theme }) {
  const info = NEWS_SECTION_INFO[n.section];
  const Icon = NEWS_ICON[n.section];
  const pic = n.pic || defaultPic(n.section, n.title);
  return (
    <div className="flex flex-col overflow-clip rounded-[22px] text-on-primary shadow-[0_14px_30px_-18px_rgba(28,30,84,0.6)]" style={{ background: `linear-gradient(165deg, ${theme.deep} 0%, ${theme.accent} 140%)` }}>
      <div className="relative aspect-[5/3] shrink-0 overflow-clip">
        {n.imageUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element -- 운영자가 올린 사진 (Blob 주소) */}
            <img src={n.imageUrl} alt="" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" />
            {n.imageCredit && <span className="absolute right-2 bottom-1 z-10 rounded bg-black/40 px-1 text-[9px] text-white">사진 · {n.imageCredit}</span>}
          </>
        ) : (
          <>
            <span aria-hidden className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.1)_1.2px,transparent_1.2px)] bg-[length:16px_16px]" />
            <Pic name={pic} theme={theme} id={`p${n.id}c`} className="absolute inset-x-0 bottom-0 h-[94%] w-full" />
            <PicCredit name={pic} />
          </>
        )}
        <span className="absolute top-3 left-3 z-10 inline-flex items-center gap-1 rounded-full bg-black/25 px-2.5 py-1 text-[12px] font-bold backdrop-blur-sm">
          <Icon className="h-3.5 w-3.5" strokeWidth={2.2} />
          {info.label}
        </span>
      </div>
      <div className="flex flex-1 flex-col px-5 pt-3.5 pb-5">
        <h3 className="text-[21px] leading-[1.32] font-bold tracking-[-0.02em] [word-break:keep-all]">{n.title}</h3>
        {n.takeaway && <p className="mt-2 text-[14px] leading-relaxed text-on-primary/85 [word-break:keep-all]">{n.takeaway}</p>}
        <p className="mt-auto flex items-center gap-1 pt-3 text-[12px] font-semibold text-on-primary/75">
          카드 {total}장 · 옆으로 넘겨 보세요
          <ChevronRight className="h-4 w-4 motion-safe:animate-pulse" strokeWidth={2.4} />
        </p>
      </div>
    </div>
  );
}

function Middle({ c, n, theme, id }: { c: NewsCard; n: NewsItem; theme: Theme; id: string }) {
  const articlePic = n.pic || defaultPic(n.section, n.title);
  switch (c.type) {
    case "text":
      return (
        <div className={SHELL}>
          <Panel theme={theme} kicker="쉽게 말하면">
            <Pic name={c.pic || articlePic} theme={theme} id={id} className="absolute inset-x-0 bottom-0 h-[92%] w-full" />
            <PicCredit name={c.pic || articlePic} />
          </Panel>
          <Caption>
            {c.title && <h4 className={HEAD}>{c.title}</h4>}
            <p className={BODY}>{c.text}</p>
          </Caption>
        </div>
      );
    case "stat":
      return (
        <div className={SHELL}>
          <Panel theme={theme} kicker="숫자로 보기">
            <Pic name={c.pic || articlePic} theme={theme} id={id} className="absolute inset-x-0 bottom-0 h-[92%] w-full" />
            <PicCredit name={c.pic || articlePic} />
          </Panel>
          <Caption>
            <p className="tabular text-[clamp(30px,9.5vw,42px)] leading-[1.05] font-extrabold tracking-[-0.03em] [overflow-wrap:anywhere]" style={{ color: theme.accent }}>
              {c.value}
            </p>
            <p className="mt-2 text-[17px] leading-snug font-bold text-ink [word-break:keep-all]">{c.label}</p>
            {c.note && <p className="mt-1.5 text-[14px] leading-relaxed text-ink-secondary [word-break:keep-all]">{c.note}</p>}
          </Caption>
        </div>
      );
    case "bars":
      return (
        <div className={SHELL}>
          <Panel theme={theme} kicker="비교해 보기" tall>
            <BarsChart c={c} theme={theme} />
          </Panel>
          <Caption>
            {c.title && <h4 className={HEAD}>{c.title}</h4>}
            {c.note && <p className={BODY}>{c.note}</p>}
          </Caption>
        </div>
      );
    case "change":
      return (
        <div className={SHELL}>
          <Panel theme={theme} kicker="무엇이 바뀌었나" tall>
            <ChangeChart c={c} theme={theme} />
          </Panel>
          <Caption>
            {c.title && <h4 className={HEAD}>{c.title}</h4>}
            {c.note && <p className={BODY}>{c.note}</p>}
          </Caption>
        </div>
      );
    case "flow":
      return (
        <div className={SHELL} style={{ background: `linear-gradient(180deg, ${theme.panel} 0%, #ffffff 120%)` }}>
          <div className="px-5 pt-4">
            <span className="inline-block rounded-full bg-white/90 px-2.5 py-1 text-[12px] font-bold shadow-[0_1px_2px_rgba(0,0,0,0.08)]" style={{ color: theme.accent }}>
              흐름으로 보기
            </span>
            {c.title && <h4 className={cn(HEAD, "mt-2.5")}>{c.title}</h4>}
          </div>
          <ol className="relative flex flex-1 flex-col justify-center gap-2.5 px-5 pt-3 pb-5">
            <span aria-hidden className="absolute top-6 bottom-8 left-[33px] w-0.5 rounded-full" style={{ background: `${theme.accent}40` }} />
            {c.steps.map((s, i) => {
              const last = i === c.steps.length - 1;
              return (
                <li key={i} className="relative flex items-center gap-3">
                  <span className="z-10 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full tabular text-[13px] font-bold text-white ring-4 ring-white/70" style={{ background: last ? theme.deep : theme.accent }}>
                    {i + 1}
                  </span>
                  <span
                    className={cn("min-w-0 flex-1 rounded-xl px-3.5 py-2.5 text-[15px] leading-snug font-semibold [word-break:keep-all]", last ? "text-white" : "bg-white text-ink shadow-[0_1px_3px_rgba(28,30,84,0.1)]")}
                    style={last ? { background: theme.deep } : undefined}
                  >
                    {s}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      );
    case "term":
      return (
        <div className={SHELL}>
          <Panel theme={theme} kicker="용어 풀이">
            <Pic name={c.pic || "kong-study"} theme={theme} id={id} className="absolute inset-x-0 bottom-0 h-[92%] w-full" />
            <PicCredit name={c.pic} />
          </Panel>
          <Caption>
            <p className="w-fit rounded-xl px-3 py-1 text-[21px] leading-snug font-extrabold [word-break:keep-all]" style={{ background: theme.panel, color: theme.deep }}>
              {c.term}
            </p>
            <p className={cn(BODY, "mt-3")}>{c.text}</p>
          </Caption>
        </div>
      );
    case "quote": {
      const who = c.who ? `who:${c.who}` : "";
      const person = who && picPerson(who);
      return (
        <div className={SHELL}>
          <Panel theme={theme} kicker="한마디" tall>
            <span className="absolute right-0 bottom-0 h-[92%] w-[52%]">
              {person ? <Pic name={who} theme={theme} id={id} className="h-full" /> : <Pic name="podium" theme={theme} id={id} className="absolute bottom-0 h-full w-full" />}
            </span>
            {person && <PicCredit name={who} />}
            <span className="absolute top-12 left-3 z-10 max-w-[58%] rounded-2xl rounded-bl-sm bg-white px-3.5 py-3 text-[17px] leading-snug font-extrabold text-ink shadow-[0_6px_16px_-8px_rgba(28,30,84,0.45)] [word-break:keep-all]">
              &ldquo;{c.text}&rdquo;
            </span>
          </Panel>
          <Caption>
            <h4 className={HEAD}>{c.name}</h4>
            {c.note && <p className={BODY}>{c.note}</p>}
          </Caption>
        </div>
      );
    }
    case "versus":
      return (
        <div className={SHELL}>
          <div className="px-5 pt-4">
            <span className="inline-block rounded-full px-2.5 py-1 text-[12px] font-bold" style={{ background: theme.panel, color: theme.accent }}>
              둘을 비교
            </span>
            {c.title && <h4 className={cn(HEAD, "mt-2.5")}>{c.title}</h4>}
          </div>
          <div className="grid flex-1 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-stretch gap-1.5 px-4 pt-3 pb-4">
            {[c.left, null, c.right].map((side, i) =>
              side ? (
                <div key={i} className="flex flex-col rounded-2xl px-3 py-4" style={{ background: i === 0 ? "#eef2f7" : theme.panel }}>
                  <p className="text-[19px] leading-tight font-extrabold [word-break:keep-all]" style={{ color: i === 0 ? "#273951" : theme.deep }}>
                    {side.name}
                  </p>
                  <p className="mt-2.5 text-[14px] leading-relaxed text-ink-secondary [word-break:keep-all]">{side.text}</p>
                </div>
              ) : (
                <span key={i} className="inline-flex h-8 w-8 items-center justify-center self-center rounded-full bg-brand-dark text-[11px] font-extrabold text-white">
                  VS
                </span>
              ),
            )}
          </div>
        </div>
      );
  }
}

/** 카드가 없는 예전 기사 — 요약 글을 나눠 담은 장 (그림은 기사 그림) */
function SummarySlide({ n, text, first, theme, id }: { n: NewsItem; text: string; first: boolean; theme: Theme; id: string }) {
  const pic = n.pic || defaultPic(n.section, n.title);
  return (
    <div className={SHELL}>
      <Panel theme={theme} kicker={first ? "무슨 일이에요?" : "조금 더 자세히"}>
        <Pic name={pic} theme={theme} id={id} className="absolute inset-x-0 bottom-0 h-[92%] w-full" />
        <PicCredit name={pic} />
      </Panel>
      <Caption>
        <p className="text-[15px] leading-[1.7] text-ink [word-break:keep-all]">{text}</p>
      </Caption>
    </div>
  );
}

function Point({ text, theme, id }: { text: string; theme: Theme; id: string }) {
  return (
    <div className={SHELL}>
      <div className="relative aspect-[5/2.5] shrink-0 overflow-clip bg-linear-to-b from-[#ffe9bf] to-[#fff7e8]">
        <span aria-hidden className={DOTS} />
        <span className="absolute top-3 left-3 z-10 rounded-full bg-white/90 px-2.5 py-1 text-[12px] font-bold text-lemon shadow-[0_1px_2px_rgba(0,0,0,0.08)]">왜 중요할까</span>
        <Pic name="kong-note" theme={theme} id={id} className="absolute inset-x-0 bottom-0 h-[96%] w-full" />
      </div>
      <Caption>
        <p className="text-[13px] font-bold text-lemon">필기·면접 포인트</p>
        <p className="mt-1.5 text-[15px] leading-[1.7] text-ink [word-break:keep-all]">{text}</p>
      </Caption>
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
  const theme = SECTION_THEME[n.section];
  const id = (i: number) => `p${n.id}x${i}`;
  return (
    <div id={`item-${n.id}`} className="scroll-mt-32">
      <CardDeck id={n.id} label={`${pad(no)} ${n.title}`} head={<DeckHead n={n} no={no} />} foot={<ReadMore n={n} />}>
        <Cover n={n} total={total} theme={theme} />
        {n.cards.length
          ? n.cards.map((c, i) => <Middle key={i} c={c} n={n} theme={theme} id={id(i)} />)
          : summaryChunks(n.summary).map((t, i) => <SummarySlide key={i} n={n} text={t} first={i === 0} theme={theme} id={id(i)} />)}
        {n.point && <Point text={n.point} theme={theme} id={id(9)} />}
      </CardDeck>
    </div>
  );
}
