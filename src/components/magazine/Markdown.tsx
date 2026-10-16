import Link from "next/link";
import { Fragment, type ReactNode } from "react";
import { CheckSquare, MousePointerClick, Square } from "lucide-react";
import { ARTICLE_WIDGETS, WIDGET_LINE, isArticleWidget } from "@/lib/article-widgets";
import { cn } from "../ui";

/**
 * 매거진 본문 렌더러 (서버·클라이언트 공용, HTML 을 그대로 넣지 않는 안전한 마크다운 일부)
 *
 * ## 소제목 / ### 작은 제목       → 목차에 들어감
 * **굵게**  ==형광펜==  `코드`  [링크](https://…)
 * - 목록 / 1. 번호 목록 / - [ ] 체크리스트
 * > 인용 / > [!팁] 제목  (팁·주의·요약·포인트·용어·메모)
 * ![설명](이미지 주소)            → 줄마다 이미지 (웹툰은 이어 붙여서)
 * | 표 | 머리 |  + |---|---|
 * ---                            → 구분선
 * 출처: [언론사](https://…)        → 작은 출처 줄
 * {{ncs-areas}}                   → 인터랙티브 블록 (src/lib/article-widgets.ts)
 */

export interface Heading {
  id: string;
  level: 2 | 3;
  text: string;
}

type Block =
  | { t: "h"; level: 2 | 3; text: string; id: string }
  | { t: "p"; lines: string[] }
  | { t: "source"; text: string }
  | { t: "ul"; items: { text: string; checked: boolean | null }[] }
  | { t: "ol"; items: string[] }
  | { t: "quote"; lines: string[] }
  | { t: "callout"; kind: string; title: string; lines: string[] }
  | { t: "images"; items: { alt: string; url: string }[] }
  | { t: "table"; head: string[]; rows: string[][] }
  | { t: "hr" }
  | { t: "widget"; name: string };

const RE = {
  heading: /^(#{1,3})\s+(.+)$/,
  hr: /^\s*(-{3,}|\*{3,}|_{3,})\s*$/,
  image: /^\s*!\[([^\]]*)\]\(\s*([^)\s]+)(?:\s+"[^"]*")?\s*\)\s*$/,
  ul: /^\s*[-*•]\s+(.*)$/,
  ol: /^\s*\d+[.)]\s+(.*)$/,
  check: /^\[( |x|X)\]\s*(.*)$/,
  tableSep: /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/,
  source: /^\s*(출처|자료|Source)\s*[:：]\s*/i,
  callout: /^\[!([^\]\s]+)\]\s*(.*)$/,
};

function isTableStart(lines: string[], i: number) {
  return lines[i].trim().startsWith("|") && i + 1 < lines.length && RE.tableSep.test(lines[i + 1]);
}

function startsBlock(lines: string[], i: number): boolean {
  const l = lines[i];
  return (
    RE.heading.test(l) ||
    RE.hr.test(l) ||
    RE.image.test(l) ||
    l.trimStart().startsWith(">") ||
    RE.ul.test(l) ||
    RE.ol.test(l) ||
    RE.source.test(l) ||
    WIDGET_LINE.test(l) ||
    isTableStart(lines, i)
  );
}

const splitRow = (l: string) =>
  l
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((c) => c.trim());

export function parseMarkdown(src: string): Block[] {
  const lines = src.replace(/\r\n?/g, "\n").split("\n");
  const blocks: Block[] = [];
  let headingNo = 0;
  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trimEnd();
    if (!line.trim()) {
      i++;
      continue;
    }
    let m: RegExpMatchArray | null;
    if ((m = line.match(WIDGET_LINE))) {
      blocks.push({ t: "widget", name: m[1] });
      i++;
    } else if ((m = line.match(RE.heading))) {
      const level = m[1].length === 3 ? 3 : 2;
      blocks.push({ t: "h", level, text: m[2].trim(), id: `s-${++headingNo}` });
      i++;
    } else if (RE.hr.test(line)) {
      blocks.push({ t: "hr" });
      i++;
    } else if (RE.image.test(line)) {
      const items: { alt: string; url: string }[] = [];
      while (i < lines.length && (m = lines[i].match(RE.image))) {
        items.push({ alt: m[1].trim(), url: m[2] });
        i++;
      }
      blocks.push({ t: "images", items });
    } else if (line.trimStart().startsWith(">")) {
      const inner: string[] = [];
      while (i < lines.length && lines[i].trimStart().startsWith(">")) {
        inner.push(lines[i].trimStart().replace(/^>\s?/, ""));
        i++;
      }
      const c = inner[0]?.match(RE.callout);
      if (c) blocks.push({ t: "callout", kind: c[1], title: c[2].trim(), lines: inner.slice(1) });
      else blocks.push({ t: "quote", lines: inner });
    } else if (isTableStart(lines, i)) {
      const head = splitRow(line);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        rows.push(splitRow(lines[i]));
        i++;
      }
      blocks.push({ t: "table", head, rows });
    } else if (RE.ul.test(line)) {
      const items: { text: string; checked: boolean | null }[] = [];
      while (i < lines.length && (m = lines[i].match(RE.ul))) {
        const ck = m[1].match(RE.check);
        items.push(ck ? { text: ck[2], checked: ck[1] !== " " } : { text: m[1], checked: null });
        i++;
      }
      blocks.push({ t: "ul", items });
    } else if (RE.ol.test(line)) {
      const items: string[] = [];
      while (i < lines.length && (m = lines[i].match(RE.ol))) {
        items.push(m[1]);
        i++;
      }
      blocks.push({ t: "ol", items });
    } else if (RE.source.test(line)) {
      blocks.push({ t: "source", text: line.replace(RE.source, "") });
      i++;
    } else {
      const para: string[] = [];
      while (i < lines.length && lines[i].trim() && (para.length === 0 || !startsBlock(lines, i))) {
        para.push(lines[i].trimEnd());
        i++;
      }
      blocks.push({ t: "p", lines: para });
    }
  }
  return blocks;
}

/** 목차 */
export function extractHeadings(src: string): Heading[] {
  return parseMarkdown(src)
    .filter((b): b is Extract<Block, { t: "h" }> => b.t === "h")
    .map((b) => ({ id: b.id, level: b.level, text: stripInline(b.text) }));
}

export function stripInline(s: string): string {
  return s
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/==([^=]+)==/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
}

/* ------------------------------------------------------------------ */
/* 인라인                                                                */
/* ------------------------------------------------------------------ */

function safeHref(url: string): string | null {
  if (/^https?:\/\//i.test(url) || /^mailto:/i.test(url)) return url;
  if (/^\/(?!\/)/.test(url) || url.startsWith("#")) return url;
  return null;
}

export function safeImageSrc(url: string): string | null {
  if (/^https:\/\//i.test(url)) return url;
  if (/^\/(?!\/)[\w\-./%]+$/.test(url)) return url;
  return null;
}

const INLINE = /\*\*(.+?)\*\*|==(.+?)==|`([^`]+)`|\[([^\]]+)\]\(([^)\s]+)\)/g;

function inline(text: string, key: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let n = 0;
  for (const m of text.matchAll(INLINE)) {
    const at = m.index ?? 0;
    if (at > last) out.push(text.slice(last, at));
    const k = `${key}-${n++}`;
    if (m[1] != null) {
      out.push(
        <strong key={k} className="font-semibold text-ink">
          {inline(m[1], k)}
        </strong>,
      );
    } else if (m[2] != null) {
      out.push(
        <mark key={k} className="rounded-xs bg-[#fff1a8] px-0.5 text-ink">
          {inline(m[2], k)}
        </mark>,
      );
    } else if (m[3] != null) {
      out.push(
        <code key={k} className="rounded-xs bg-canvas-soft px-1 py-0.5 font-mono text-[0.9em] text-ink">
          {m[3]}
        </code>,
      );
    } else {
      const href = safeHref(m[5]);
      if (!href) out.push(m[4]);
      else if (href.startsWith("/") || href.startsWith("#"))
        out.push(
          <Link key={k} href={href} className="link underline decoration-primary-soft underline-offset-4">
            {m[4]}
          </Link>,
        );
      else
        out.push(
          <a key={k} href={href} target="_blank" rel="noopener noreferrer" className="link underline decoration-primary-soft underline-offset-4">
            {m[4]}
          </a>,
        );
    }
    last = at + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

function lines(ls: string[], key: string): ReactNode[] {
  return ls.flatMap((l, i) => (i ? [<br key={`${key}br${i}`} />, ...inline(l, `${key}-${i}`)] : inline(l, `${key}-${i}`)));
}

/* ------------------------------------------------------------------ */
/* 블록                                                                  */
/* ------------------------------------------------------------------ */

const CALLOUTS: Record<string, { box: string; label: string }> = {
  팁: { box: "border-ev-final/30 bg-ev-final-soft", label: "text-ev-final" },
  주의: { box: "border-ev-doc/30 bg-ev-doc-soft", label: "text-ev-doc" },
  요약: { box: "border-primary/20 bg-ev-written-soft", label: "text-primary-text" },
  포인트: { box: "border-ev-interview1/25 bg-ev-interview1-soft", label: "text-ev-interview1" },
  용어: { box: "border-lemon/30 bg-canvas-cream", label: "text-lemon" },
  메모: { box: "border-hairline bg-canvas-soft", label: "text-ink-secondary" },
};

export type MarkdownVariant = "article" | "briefing" | "webtoon";

/** 인터랙티브 블록 자리 — 발행 화면은 실제 블록, 편집기 미리보기는 자리 표시 */
type Widgets = Partial<Record<string, ReactNode>>;

function renderBlock(b: Block, k: string, variant: MarkdownVariant, widgets?: Widgets): ReactNode {
  switch (b.t) {
    case "widget": {
      if (widgets) return widgets[b.name] ? <Fragment key={k}>{widgets[b.name]}</Fragment> : null;
      const info = isArticleWidget(b.name) ? ARTICLE_WIDGETS[b.name] : null;
      return (
        <div key={k} className="mt-8 flex items-center gap-3 rounded-2xl border-2 border-dashed border-primary/30 bg-ev-written-soft/40 px-4 py-4 first:mt-0">
          <MousePointerClick className="h-5 w-5 shrink-0 text-primary-text" strokeWidth={1.75} />
          <span className="min-w-0">
            <span className="block type-body-md font-semibold text-ink">{info ? info.label : `알 수 없는 블록 {{${b.name}}}`}</span>
            <span className="block type-caption text-ink-mute">{info ? `인터랙티브 블록 · ${info.hint} — 발행 화면에서 움직여요` : "이름을 확인해 주세요"}</span>
          </span>
        </div>
      );
    }
    case "h":
      return b.level === 2 ? (
        <h2
          key={k}
          id={b.id}
          className={cn(
            "mt-14 scroll-mt-28 type-heading-lg text-ink first:mt-0",
            variant === "briefing" && "flex items-center gap-3 border-b border-hairline pb-3",
          )}
        >
          {variant === "briefing" && <span aria-hidden className="h-5 w-1.5 shrink-0 rounded-full bg-primary" />}
          <span>{inline(b.text, k)}</span>
        </h2>
      ) : (
        <h3 key={k} id={b.id} className="mt-9 scroll-mt-28 type-heading-md text-ink first:mt-0">
          {inline(b.text, k)}
        </h3>
      );
    case "p":
      return (
        <p
          key={k}
          className={cn(
            "mt-5 type-body-lg leading-[1.85] text-ink ko-justify first:mt-0",
            variant === "webtoon" && "mx-auto max-w-[560px] text-center text-ink-secondary",
          )}
        >
          {lines(b.lines, k)}
        </p>
      );
    case "source":
      return (
        <p key={k} className="mt-3 type-caption text-ink-mute">
          <span className="mr-1.5 rounded-xs bg-canvas-soft px-1.5 py-0.5 text-ink-secondary">출처</span>
          {inline(b.text, k)}
        </p>
      );
    case "ul":
      return b.items.some((it) => it.checked !== null) ? (
        <ul key={k} className="mt-5 space-y-2 first:mt-0">
          {b.items.map((it, i) => (
            <li key={i} className="flex items-start gap-2.5 type-body-lg leading-[1.7] text-ink ko-justify">
              {it.checked ? (
                <CheckSquare className="mt-1 h-5 w-5 shrink-0 text-primary" strokeWidth={1.75} />
              ) : (
                <Square className="mt-1 h-5 w-5 shrink-0 text-ink-mute-2" strokeWidth={1.75} />
              )}
              <span className={cn(it.checked && "text-ink-mute line-through")}>{inline(it.text, `${k}-${i}`)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <ul key={k} className="mt-5 list-disc space-y-2 pl-6 type-body-lg leading-[1.75] text-ink marker:text-ink-mute-2 first:mt-0">
          {b.items.map((it, i) => (
            <li key={i}>{inline(it.text, `${k}-${i}`)}</li>
          ))}
        </ul>
      );
    case "ol":
      return (
        <ol key={k} className="mt-5 list-decimal space-y-2 pl-6 type-body-lg leading-[1.75] text-ink marker:text-primary-text first:mt-0">
          {b.items.map((it, i) => (
            <li key={i}>{inline(it, `${k}-${i}`)}</li>
          ))}
        </ol>
      );
    case "quote":
      return (
        <blockquote key={k} className="mt-6 border-l-[3px] border-primary py-1 pl-5 type-body-lg leading-[1.8] text-ink-secondary first:mt-0">
          {lines(b.lines, k)}
        </blockquote>
      );
    case "callout": {
      const style = CALLOUTS[b.kind] ?? CALLOUTS["메모"];
      const inner = parseMarkdown(b.lines.join("\n"));
      return (
        <aside key={k} className={cn("mt-6 rounded-lg border px-5 py-4 first:mt-0", style.box)}>
          <p className={cn("type-caption font-semibold", style.label)}>{inline(b.title || b.kind, k)}</p>
          {inner.length > 0 && (
            <div className="mt-2 [&_li]:!type-body-md [&_p]:!type-body-md [&>*]:!mt-2 [&>*:first-child]:!mt-0">
              {inner.map((ib, i) => renderBlock(ib, `${k}-${i}`, "article"))}
            </div>
          )}
        </aside>
      );
    }
    case "images": {
      const imgs = b.items.map((im) => ({ ...im, src: safeImageSrc(im.url) })).filter((im) => im.src);
      if (variant === "webtoon") {
        return (
          <div key={k} className="mx-auto mt-6 max-w-[720px] first:mt-0">
            {imgs.map((im, i) => (
              // eslint-disable-next-line @next/next/no-img-element -- 웹툰 컷은 원본 비율 그대로 이어 붙임
              <img key={i} src={im.src!} alt={im.alt || `컷 ${i + 1}`} loading="lazy" decoding="async" className="block w-full" />
            ))}
          </div>
        );
      }
      return (
        <div key={k} className={cn("mt-8 first:mt-0", imgs.length > 1 && "grid gap-3 sm:grid-cols-2")}>
          {imgs.map((im, i) => (
            <figure key={i}>
              {/* eslint-disable-next-line @next/next/no-img-element -- 운영자가 올린 본문 이미지 (크기 미정) */}
              <img
                src={im.src!}
                alt={im.alt}
                loading="lazy"
                decoding="async"
                className="mx-auto w-full rounded-lg border border-hairline bg-canvas-soft"
              />
              {im.alt && <figcaption className="mt-2 text-center type-caption text-ink-mute">{im.alt}</figcaption>}
            </figure>
          ))}
        </div>
      );
    }
    case "table":
      return (
        <div key={k} className="mt-6 overflow-x-auto rounded-lg border border-hairline first:mt-0">
          {/* 열이 3개 이하면 휴대폰 폭에 맞춰 줄바꿈, 더 많으면 가로로 넘겨 보기 */}
          <table className={cn("w-full border-collapse", b.head.length > 3 && "min-w-[520px]")}>
            <thead className="bg-canvas-soft">
              <tr>
                {b.head.map((h, i) => (
                  <th key={i} className="px-3 py-2.5 text-left type-caption font-semibold text-ink-secondary md:px-4">
                    {inline(h, `${k}-h${i}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {b.rows.map((r, ri) => (
                <tr key={ri} className="border-t border-hairline align-top">
                  {b.head.map((_, ci) => (
                    <td key={ci} className={cn("px-3 py-3 type-body-md text-ink md:px-4", ci === 0 && "font-semibold", ci === 0 && b.head.length > 3 && "whitespace-nowrap")}>
                      {inline(r[ci] ?? "", `${k}-${ri}-${ci}`)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "hr":
      return (
        <div key={k} aria-hidden className="my-12 flex justify-center gap-2 text-ink-mute-2">
          <span>·</span>
          <span>·</span>
          <span>·</span>
        </div>
      );
  }
}

export function Markdown({
  source,
  variant = "article",
  widgets,
  className,
}: {
  source: string;
  variant?: MarkdownVariant;
  /** {{블록}} 자리에 넣을 실제 블록 (없으면 편집기용 자리 표시) */
  widgets?: Widgets;
  className?: string;
}) {
  const blocks = parseMarkdown(source);
  return (
    <div className={cn("[overflow-wrap:anywhere]", className)}>
      {blocks.map((b, i) => (
        <Fragment key={i}>{renderBlock(b, `b${i}`, variant, widgets)}</Fragment>
      ))}
    </div>
  );
}
