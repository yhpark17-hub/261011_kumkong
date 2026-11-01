import "server-only";
import { amountOf, isMoneyUnit, type NewsCard } from "../news-cards";
import { deckGlosser, deckSize, proseStrings, summaryChunks, type GlossPart, type Glosser } from "../news-gloss";
import {
  NEWS_SECTION_INFO,
  issueLabel,
  issueThumbUrl,
  letterHref,
  letterShareHref,
  newsHref,
  shareImageUrl,
  type BriefingIssue,
  type NewsItem,
} from "../news-meta";
import { absUrl, contentVersion } from "./app-api";
import { PIC_H, PIC_W, SECTION_THEME, coinStack, deckPics, findOrgs, picPerson, picSvg } from "./card-pics";
import { photoPortrait } from "./thumb-portraits";

/**
 * 앱 아침 브리핑 — 웹 카드뉴스(NewsDeck.tsx)와 같은 계산(그림 고르기·괄호 풀이·막대 높이)으로 장 목록을 만들어요.
 * 앱은 이 장 목록을 그리기만 해요. 그림은 /api/app/v1/pic 에서 PNG로 받아요.
 */

export type AppText = GlossPart[];

export interface AppPic {
  url: string;
  /** 가로 ÷ 세로 */
  aspect: number;
  /** 인물 초상 사진 출처 */
  credit?: string;
  person: boolean;
}

export type AppSlide =
  | { kind: "cover"; text: AppText; total: number; pic: AppPic | null; photo: { url: string; credit: string } | null; org: { name: string; logo?: string } | null }
  | { kind: "background" | "text"; title: string; text: AppText; pic: AppPic; compact: boolean }
  | { kind: "stat"; value: string; label: string; note: AppText; pic: AppPic; compact: boolean }
  | { kind: "bars"; title: string; note: AppText; money: boolean; bars: { label: string; value: string; strong: boolean; top: number; coins?: string }[] }
  | { kind: "change"; title: string; note: AppText; rows: { label: string; from: string; to: string; fromPct: number; toPct: number; dir: -1 | 0 | 1 }[] }
  | { kind: "flow"; title: string; steps: string[] }
  | { kind: "term"; term: string; text: AppText; pic: AppPic; compact: boolean }
  | { kind: "quote"; text: string; name: string; note: AppText; pic: AppPic }
  | { kind: "versus"; title: string; left: { name: string; text: AppText }; right: { name: string; text: AppText } }
  | { kind: "summary"; first: boolean; text: AppText; pic: AppPic }
  | { kind: "point"; text: AppText; pic: AppPic };

export interface AppStory {
  id: number;
  no: number;
  section: string;
  sectionLabel: string;
  theme: { accent: string; panel: string; deep: string };
  headline: boolean;
  title: string;
  /** 시간표 칸 이름 */
  short: string;
  slides: AppSlide[];
  readMore: { url: string; label: string };
}

/** 그림 이름 → 앱이 받을 PNG 주소 (그림이 바뀌면 v도 바뀌어 새로 받아요) */
function appPic(name: string, accent: string): AppPic {
  const person = picPerson(name);
  if (person) {
    const svg = photoPortrait(person.who)?.svg ?? "";
    return { url: absUrl(`/api/app/v1/pic/${encodeURIComponent(name)}?v=${contentVersion(svg)}`)!, aspect: 480 / 560, credit: person.credit, person: true };
  }
  const v = contentVersion(picSvg(name, accent, "p"));
  return {
    url: absUrl(`/api/app/v1/pic/${encodeURIComponent(name)}?accent=${encodeURIComponent(accent)}&v=${v}`)!,
    aspect: PIC_W / PIC_H,
    person: false,
  };
}

/** 글이 길면 그림 칸을 낮춰요 (웹과 같은 기준) */
const LONG = 90;

/** 동전 탑 상자 (웹 BarsChart와 같은 값) */
const TOWER_H = 200;
const COIN_R = 24;

function barsSlide(c: Extract<NewsCard, { type: "bars" }>, g: Glosser): AppSlide {
  const amounts = c.bars.map((b) => amountOf(b.value));
  const values = amounts.map((a) => a?.n ?? 0);
  const max = Math.max(...values, 0) || 1;
  const money = isMoneyUnit(amounts[0]?.unit ?? "");
  const anyHi = c.bars.some((b) => b.hi);
  return {
    kind: "bars",
    title: c.title,
    note: g.r(c.note),
    money,
    bars: c.bars.map((b, i) => {
      const strong = anyHi ? b.hi : true;
      const ratio = values[i] / max;
      const coins = Math.max(1, Math.round(ratio * 28));
      const top = money ? ((coins * COIN_R * 0.24 + COIN_R * 0.68 + 2) / TOWER_H) * 100 : Math.max(4, ratio * 100);
      return {
        label: b.label,
        value: b.value,
        strong,
        top,
        coins: money
          ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 ${TOWER_H}" preserveAspectRatio="xMidYMax meet">${coinStack(30, TOWER_H - COIN_R * 0.34 - 2, coins, COIN_R, strong)}</svg>`
          : undefined,
      };
    }),
  };
}

function changeSlide(c: Extract<NewsCard, { type: "change" }>, g: Glosser): AppSlide {
  return {
    kind: "change",
    title: c.title,
    note: g.r(c.note),
    rows: c.rows.map((r) => {
      const a = amountOf(r.from)?.n ?? 0;
      const b = amountOf(r.to)?.n ?? 0;
      const max = Math.max(a, b) || 1;
      return {
        label: r.label,
        from: r.from,
        to: r.to,
        fromPct: Math.max(6, (a / max) * 100),
        toPct: Math.max(6, (b / max) * 100),
        dir: a === b ? 0 : b > a ? 1 : -1,
      };
    }),
  };
}

/** 사이 장 하나 — 괄호 풀이는 웹 Middle이 글을 그리는 차례대로 불러요 */
function middleSlide(c: NewsCard, g: Glosser, pic: string, accent: string): AppSlide {
  switch (c.type) {
    case "background":
    case "text":
      return { kind: c.type, title: c.title, text: g.r(c.text), pic: appPic(pic, accent), compact: c.text.length > LONG };
    case "stat":
      return { kind: "stat", value: c.value, label: c.label, note: g.r(c.note), pic: appPic(pic, accent), compact: c.note.length > LONG };
    case "bars":
      return barsSlide(c, g);
    case "change":
      return changeSlide(c, g);
    case "flow":
      return { kind: "flow", title: c.title, steps: c.steps };
    case "term":
      return { kind: "term", term: c.term, text: g.r(c.text), pic: appPic(pic, accent), compact: c.text.length > LONG };
    case "quote": {
      const who = c.who ? `who:${c.who}` : "";
      return { kind: "quote", text: c.text, name: c.name, note: g.r(c.note), pic: appPic(who && picPerson(who) ? who : "podium", accent) };
    }
    case "versus": {
      const left = { name: c.left.name, text: g.r(c.left.text) };
      return { kind: "versus", title: c.title, left, right: { name: c.right.name, text: g.r(c.right.text) } };
    }
  }
}

/** 기사 한 건 → 장 목록 (표지 → 사이 장 → '왜 중요할까', 웹 NewsDeck과 같은 차례) */
export function appStory(n: NewsItem, no: number): AppStory {
  const theme = SECTION_THEME[n.section];
  const gloss = deckGlosser(n);
  const pics = deckPics(n);
  const coverText = n.takeaway || n.title;
  const coverGloss = gloss([coverText]);
  const coverPerson = picPerson(pics.cover);
  const org = coverPerson ? findOrgs(n.title, 1)[0] : undefined;
  const slides: AppSlide[] = [
    {
      kind: "cover",
      text: coverGloss.r(coverText),
      total: deckSize(n),
      pic: n.imageUrl ? null : appPic(pics.cover, theme.accent),
      photo: n.imageUrl ? { url: absUrl(n.imageUrl)!, credit: n.imageCredit } : null,
      org: org ? { name: org.name, logo: absUrl(org.logo) } : null,
    },
  ];
  if (n.cards.length) {
    for (const c of n.cards) slides.push(middleSlide(c, gloss(proseStrings(c)), pics.card(c), theme.accent));
  } else {
    summaryChunks(n.summary).forEach((t, i) => {
      slides.push({ kind: "summary", first: i === 0, text: gloss([t]).r(t), pic: appPic(pics.summary(), theme.accent) });
    });
  }
  if (n.point) slides.push({ kind: "point", text: gloss([n.point]).r(n.point), pic: appPic("kong-note", theme.accent) });

  return {
    id: n.id,
    no,
    section: n.section,
    sectionLabel: NEWS_SECTION_INFO[n.section].label,
    theme,
    headline: n.headline,
    title: n.title,
    short: n.short || n.title,
    slides,
    readMore: n.sourceUrl
      ? { url: n.sourceUrl, label: `자세히 보기${n.sourceName ? ` · ${n.sourceName}` : ""}` }
      : { url: absUrl(newsHref(n.id))!, label: "자세히 보기" },
  };
}

/** 브리핑 표지 그림 — 웹 IssueCover와 같은 규칙 ('brand'면 그림 없이 판 색 표지) */
export function issueCoverUrl(issue: BriefingIssue): string | null {
  const t = issue.thumb;
  if (t.cover === "brand" || (t.cover === "upload" && !t.coverUrl)) return null;
  if (t.cover === "upload") return absUrl(t.coverUrl)!;
  if (t.shareUrl) return absUrl(shareImageUrl(issue))!;
  return absUrl(issueThumbUrl(issue))!;
}

/** 호 정보 (목록·화면 머리 공통) — minutes는 briefingMinutes 결과 */
export function appIssue(issue: BriefingIssue, minutes: number) {
  return {
    id: issue.id,
    date: issue.date,
    edition: issue.edition,
    vol: issue.vol,
    label: issueLabel(issue),
    title: issue.title,
    lede: issue.lede,
    minutes,
    publishedAt: issue.publishedAt,
    cover: issueCoverUrl(issue),
    webUrl: absUrl(letterHref(issue.date, issue.edition))!,
    shareUrl: absUrl(letterShareHref(issue))!,
  };
}
