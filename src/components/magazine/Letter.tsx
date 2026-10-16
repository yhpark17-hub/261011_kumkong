import Link from "next/link";
import { ArrowDown, ArrowRight, BookA, ExternalLink, Lightbulb, MessageCircleQuestion, Sparkles } from "lucide-react";
import { formatDayHeading } from "@/lib/date";
import { LETTER_EDITOR, LETTER_TAGLINE, NEWS_SECTION_INFO, newsHref, volLabel, type BriefingIssue, type NewsItem } from "@/lib/news-meta";
import type { LetterContent } from "@/lib/server/briefing";
import { FeedbackButton } from "../feedback/Feedback";
import { cn } from "../ui";
import { Markdown } from "./Markdown";
import { KongMascot, MascotDivider } from "./KongMascot";
import { ShareButton } from "./interactive";
import { NEWS_ICON } from "./news-icons";

/** 콩이가 기사 사이에서 하는 말 */
const QUIPS = ["알고 있었콩?", "이것도 챙기콩!", "숨 한번 돌리콩", "거의 다 왔콩!", "끝까지 가 보콩"];

const anchor = (n: NewsItem) => `item-${n.id}`;

/** 읽는 데 걸리는 시간 (한국어 약 500자/분) */
export function letterMinutes(c: LetterContent): number {
  const chars = [...c.all, c.term, c.question]
    .filter((n): n is NewsItem => Boolean(n))
    .reduce((sum, n) => sum + n.summary.length + n.point.length + n.takeaway.length + n.body.length, 0);
  return Math.max(3, Math.round(chars / 500));
}

function SectionLabel({ n, className }: { n: NewsItem; className?: string }) {
  return <span className={cn("tag", NEWS_SECTION_INFO[n.section].tone, className)}>{NEWS_SECTION_INFO[n.section].label}</span>;
}

/** 사진이 없으면 카테고리 색으로 그린 표지 */
function Cover({ n }: { n: NewsItem }) {
  if (n.imageUrl) {
    return (
      <figure className="mt-5">
        {/* eslint-disable-next-line @next/next/no-img-element -- 운영자가 올린 사진 (Blob 주소) */}
        <img src={n.imageUrl} alt="" loading="lazy" decoding="async" className="aspect-[16/9] w-full rounded-xl bg-canvas-soft object-cover" />
        {n.imageCredit && <figcaption className="mt-1.5 text-right type-micro text-ink-mute">사진 · {n.imageCredit}</figcaption>}
      </figure>
    );
  }
  const Icon = NEWS_ICON[n.section];
  return (
    <div aria-hidden className="relative mt-5 aspect-[16/9] overflow-hidden rounded-xl bg-brand-dark sm:aspect-[16/7]">
      <span className={cn("absolute -top-20 -right-16 h-72 w-72 rounded-full opacity-60 blur-3xl", NEWS_SECTION_INFO[n.section].dot)} />
      <span className="absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-primary/40 blur-3xl" />
      <span className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.09)_1px,transparent_1px)] bg-[length:18px_18px]" />
      <Icon className="absolute top-1/2 right-8 h-36 w-36 -translate-y-1/2 text-on-primary/10" strokeWidth={1} />
      <span className="absolute inset-x-6 bottom-5 md:inset-x-8 md:bottom-7">
        <span className="type-micro-cap text-on-primary/70">{NEWS_SECTION_INFO[n.section].label} · 한 줄 요약</span>
        {n.takeaway && (
          <span className="mt-1.5 line-clamp-3 block max-w-xl type-heading-md text-on-primary [word-break:keep-all] md:type-heading-lg">{n.takeaway}</span>
        )}
      </span>
    </div>
  );
}

function Paragraphs({ text }: { text: string }) {
  // 두 문장씩 끊어서 읽기 쉽게 (5.46% 같은 숫자는 그대로)
  const blocks = text
    .split(/\n+/)
    .flatMap((b) => {
      const s = b.split(/(?<=[.!?]["'”’)]?)\s+/);
      const out: string[] = [];
      for (let i = 0; i < s.length; i += 2) out.push(s.slice(i, i + 2).join(" ").trim());
      return out;
    })
    .filter(Boolean);
  return (
    <div className="mt-4 space-y-3">
      {blocks.map((p, i) => (
        <p key={i} className="type-body-lg leading-[1.85] text-ink">
          {p}
        </p>
      ))}
    </div>
  );
}

function StoryLinks({ n }: { n: NewsItem }) {
  return (
    <div className="mt-5 flex flex-wrap gap-2">
      <Link href={newsHref(n.id)} className="btn btn-sm btn-secondary">
        자세히 보기
        <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
      </Link>
      {n.sourceUrl && (
        <a href={n.sourceUrl} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-toggle">
          원문{n.sourceName ? ` · ${n.sourceName}` : ""}
          <ExternalLink className="h-3.5 w-3.5" strokeWidth={2} />
        </a>
      )}
    </div>
  );
}

function PointBox({ text, label = "왜 중요할까 · 필기·면접 포인트" }: { text: string; label?: string }) {
  if (!text) return null;
  return (
    <aside className="mt-5 rounded-xl border border-lemon/30 bg-canvas px-5 py-4">
      <p className="flex items-center gap-1.5 type-caption font-semibold text-lemon">
        <Lightbulb className="h-4 w-4" strokeWidth={2} />
        {label}
      </p>
      <p className="mt-1.5 type-body-md leading-relaxed whitespace-pre-line text-ink">{text}</p>
    </aside>
  );
}

/** 번호 붙은 기사 머리 (샘플의 01·02 처럼) */
function StoryHead({ n, no, headline = false }: { n: NewsItem; no: number; headline?: boolean }) {
  return (
    <div className="flex items-start gap-4">
      <span
        className={cn(
          "inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full tabular type-heading-md md:h-14 md:w-14 md:type-heading-lg",
          headline ? "bg-brand-dark text-on-primary" : "border-2 border-brand-dark bg-canvas text-brand-dark",
        )}
      >
        {String(no).padStart(2, "0")}
      </span>
      <div className="min-w-0 pt-0.5">
        <span className="flex flex-wrap items-center gap-1.5">
          {headline && <span className="tag bg-brand-dark text-on-primary">오늘의 헤드라인</span>}
          <SectionLabel n={n} />
        </span>
        <h3 className={cn("mt-2 text-ink [word-break:keep-all]", headline ? "type-heading-lg md:type-display-md" : "type-heading-md md:type-heading-lg")}>
          <Link href={newsHref(n.id)} className="hover:underline">
            {n.title}
          </Link>
        </h3>
      </div>
    </div>
  );
}

/** 데일리 브리핑 레터 한 호 */
export function Letter({ issue, content }: { issue: BriefingIssue; content: LetterContent }) {
  const { headline, key, brief, term, question, top } = content;
  const minutes = letterMinutes(content);
  // 번호: 헤드라인 01, 핵심 기사 02~ / 콩이 말풍선은 차례로 돌려 가며
  const keyNo = (i: number) => i + (headline ? 2 : 1);
  const quipAt = (i: number) => QUIPS[i % QUIPS.length];
  const briefQuip = key.length;

  return (
    <article className="overflow-hidden rounded-3xl bg-canvas-cream">
      {/* 머리 — 콩이와 레터 이름, 호수·날짜 */}
      <header className="relative px-6 pt-8 pb-7 text-center md:px-10 md:pt-10">
        <p className="type-caption text-lemon">{LETTER_TAGLINE}</p>
        <div className="mx-auto mt-4 inline-flex items-center gap-3 rounded-2xl border-2 border-brand-dark bg-canvas px-5 py-3 shadow-[4px_4px_0_0_var(--color-brand-dark)]">
          <KongMascot className="h-12 w-12" wave />
          <span className="text-left">
            <span className="block type-micro-cap text-primary-text">Daily Briefing</span>
            <span className="block type-heading-lg text-brand-dark">금콩 브리핑</span>
          </span>
        </div>
        <p className="mt-5 tabular type-body-md font-semibold text-ink">
          {volLabel(issue.vol)} · {formatDayHeading(issue.date)}
        </p>
        <p className="mt-1 type-caption text-ink-mute">아침판 · 기사 {content.all.length}건 · 약 {minutes}분</p>
        <h2 className="mx-auto mt-6 max-w-xl type-heading-lg text-ink [word-break:keep-all] md:type-display-md">{issue.title}</h2>
      </header>

      <div className="space-y-6 px-4 pb-10 md:px-10">
        {/* 여는 글 */}
        {issue.lede && (
          <section aria-label="여는 글" className="rounded-2xl bg-canvas px-5 py-5 md:px-7">
            <p className="flex items-center gap-1.5 type-caption font-semibold text-primary-text">
              <Sparkles className="h-4 w-4" strokeWidth={2} />
              오늘의 흐름
            </p>
            <p className="mt-2 type-body-lg leading-[1.85] whitespace-pre-line text-ink [word-break:keep-all]">{issue.lede}</p>
          </section>
        )}

        {/* 핵심 — 오늘 꼭 알아야 할 3가지 */}
        {top.length > 0 && (
          <section aria-labelledby="top-three" className="rounded-2xl bg-brand-dark px-5 py-6 text-on-primary md:px-7">
            <h3 id="top-three" className="type-heading-md">
              오늘 꼭 알아야 할 {top.length}가지
            </h3>
            <ol className="mt-4 space-y-3">
              {top.map((n, i) => (
                <li key={n.id}>
                  <a href={`#${anchor(n)}`} className="group flex gap-3 rounded-xl bg-on-primary/10 px-4 py-3 transition-colors hover:bg-on-primary/15">
                    <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-on-primary tabular type-caption font-bold text-brand-dark">
                      {i + 1}
                    </span>
                    <span className="min-w-0">
                      <span className="block type-body-md font-semibold [word-break:keep-all] group-hover:underline">{n.title}</span>
                      {n.takeaway && <span className="mt-0.5 block type-caption text-on-primary/80 [word-break:keep-all]">{n.takeaway}</span>}
                    </span>
                  </a>
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* 시간표 — 오늘 실린 것 전부 */}
        <section aria-labelledby="timetable" className="rounded-2xl bg-canvas px-5 py-5 md:px-7">
          <h3 id="timetable" className="flex items-baseline gap-2 type-heading-sm text-ink">
            오늘의 시간표 <span className="type-micro-cap text-ink-mute">Timetable</span>
          </h3>
          <ul className="mt-3 space-y-2">
            {content.all.map((n) => {
              const main = n.tier !== "brief" || n === headline;
              return (
                <li key={n.id}>
                  <a href={`#${anchor(n)}`} className="group flex items-baseline gap-2 type-body-md">
                    <span className="shrink-0 font-semibold text-primary-text">[{NEWS_SECTION_INFO[n.section].label}]</span>
                    <span className={cn("min-w-0 [word-break:keep-all] group-hover:underline", main ? "font-semibold text-ink" : "text-ink-secondary")}>{n.title}</span>
                  </a>
                </li>
              );
            })}
            {term && (
              <li>
                <a href="#today-term" className="group flex items-baseline gap-2 type-body-md">
                  <span className="shrink-0 font-semibold text-ev-posting">[오늘의 용어]</span>
                  <span className="text-ink group-hover:underline">{term.title}</span>
                </a>
              </li>
            )}
            {question && (
              <li>
                <a href="#today-question" className="group flex items-baseline gap-2 type-body-md">
                  <span className="shrink-0 font-semibold text-ev-interview2">[면접 질문]</span>
                  <span className="min-w-0 text-ink [word-break:keep-all] group-hover:underline">{question.title}</span>
                </a>
              </li>
            )}
          </ul>
        </section>

        {/* 헤드라인 — 가장 자세히 */}
        {headline && (
          <section id={anchor(headline)} className="scroll-mt-24 rounded-2xl bg-canvas px-5 py-6 md:px-7 md:py-8">
            <StoryHead n={headline} no={1} headline />
            <Cover n={headline} />
            <Paragraphs text={headline.summary} />
            <PointBox text={headline.point} />
            <StoryLinks n={headline} />
          </section>
        )}

        {/* 핵심 기사 */}
        {key.map((n, i) => (
          <div key={n.id}>
            <MascotDivider text={quipAt(i)} flip={i % 2 === 1} />
            <section id={anchor(n)} className="scroll-mt-24 rounded-2xl bg-canvas px-5 py-6 md:px-7">
              <StoryHead n={n} no={keyNo(i)} />
              {n.imageUrl && <Cover n={n} />}
              <Paragraphs text={n.summary} />
              <PointBox text={n.point} />
              <StoryLinks n={n} />
            </section>
          </div>
        ))}

        {/* 한 줄 뉴스 */}
        {brief.length > 0 && (
          <>
            <MascotDivider text={quipAt(briefQuip)} flip={briefQuip % 2 === 1} />
            <section aria-labelledby="briefs" className="rounded-2xl bg-canvas px-5 py-6 md:px-7">
              <h3 id="briefs" className="type-heading-md text-ink">
                한 줄로 보는 뉴스
              </h3>
              <p className="mt-1 type-caption text-ink-mute">시간이 없다면 이것만 훑어보세요.</p>
              <ul className="mt-4 divide-y divide-hairline">
                {brief.map((n) => (
                  <li key={n.id} id={anchor(n)} className="scroll-mt-24 py-3.5">
                    <span className="flex flex-wrap items-center gap-1.5">
                      <SectionLabel n={n} />
                      {n.sourceName && <span className="type-micro text-ink-mute">{n.sourceName}</span>}
                    </span>
                    <Link href={newsHref(n.id)} className="mt-1 block type-body-md font-semibold text-ink [word-break:keep-all] hover:underline">
                      {n.title}
                    </Link>
                    <p className="mt-0.5 type-caption leading-relaxed text-ink-secondary [word-break:keep-all]">{n.takeaway || n.summary.split(/(?<=[.!?])\s/)[0]}</p>
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}

        {/* 오늘의 용어 · 면접 질문 */}
        {(term || question) && <MascotDivider text="공부 시간이콩!" flip={(briefQuip + 1) % 2 === 1} />}
        {term && (
          <section id="today-term" aria-label="오늘의 용어" className="scroll-mt-24 rounded-2xl border-2 border-ev-posting/40 bg-canvas px-5 py-6 md:px-7">
            <p className="flex items-center gap-1.5 type-caption font-semibold text-ev-posting">
              <BookA className="h-4 w-4" strokeWidth={2} />
              오늘의 용어
            </p>
            <h3 className="mt-2 type-heading-lg text-ink">
              <Link href={newsHref(term.id)} className="hover:underline">
                {term.title}
              </Link>
            </h3>
            <Paragraphs text={term.summary} />
            <PointBox text={term.point} label="필기·면접에서는" />
          </section>
        )}
        {question && (
          <section id="today-question" aria-label="오늘의 면접 질문" className="scroll-mt-24 rounded-2xl border-2 border-ev-interview2/40 bg-canvas px-5 py-6 md:px-7">
            <p className="flex items-center gap-1.5 type-caption font-semibold text-ev-interview2">
              <MessageCircleQuestion className="h-4 w-4" strokeWidth={2} />
              오늘의 면접 질문
            </p>
            <h3 className="mt-2 type-heading-md text-ink [word-break:keep-all] md:type-heading-lg">
              <Link href={newsHref(question.id)} className="hover:underline">
                Q. {question.title}
              </Link>
            </h3>
            <p className="mt-3 type-body-md leading-relaxed text-ink-secondary">{question.summary}</p>
            {question.body.trim() && (
              <div className="mt-4 rounded-xl bg-canvas-soft px-4 py-3">
                <p className="mb-1 type-caption font-semibold text-ink">답변 뼈대</p>
                <Markdown source={question.body} />
              </div>
            )}
            <PointBox text={question.point} label="답변 팁" />
          </section>
        )}

        {/* 맺음 */}
        <footer className="pt-6 text-center">
          <KongMascot className="mx-auto h-14 w-14" wave />
          {issue.closing && <p className="mx-auto mt-3 max-w-md type-body-md text-ink [word-break:keep-all]">{issue.closing}</p>}
          <p className="mt-6 type-heading-sm text-ink">오늘 레터는 어땠나요?</p>
          <p className="mt-1 type-caption text-ink-mute">좋았던 점, 아쉬운 점을 알려 주시면 내일 레터에 반영할게요.</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <FeedbackButton kind="site" className="btn btn-sm btn-primary">
              의견 보내기
            </FeedbackButton>
            <ShareButton title={`${volLabel(issue.vol)} ${issue.title}`} path={`/magazine/letter/${issue.date}`} />
          </div>
          <p className="mt-8 type-micro text-ink-mute">
            edit. {LETTER_EDITOR} · 모든 기사는 원문을 확인해 요약했고, 자세한 수치는 원문을 함께 봐 주세요.
          </p>
          <a href="#top" className="mt-3 inline-flex items-center gap-1 type-micro text-ink-mute hover:underline">
            <ArrowDown className="h-3 w-3 rotate-180" strokeWidth={2} />맨 위로
          </a>
        </footer>
      </div>
    </article>
  );
}
