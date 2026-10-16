import Link from "next/link";
import { ArrowDown, ArrowRight, BookA, ExternalLink, Lightbulb, MessageCircleQuestion, Sparkles } from "lucide-react";
import { formatDayHeading } from "@/lib/date";
import {
  BRIEFING_TAGLINE,
  EDITION_LABEL,
  NEWS_SECTION_INFO,
  letterHref,
  newsHref,
  volLabel,
  type BriefingIssue,
  type NewsItem,
} from "@/lib/news-meta";
import type { LetterContent } from "@/lib/server/briefing";
import { FeedbackButton } from "../feedback/Feedback";
import { cn } from "../ui";
import { Masthead } from "./BriefingBrand";
import { BriefingQuiz } from "./BriefingQuiz";
import { Markdown } from "./Markdown";
import { KongMascot, MascotDivider } from "./KongMascot";
import { ShareButton, SourceLink } from "./interactive";
import { NEWS_ICON } from "./news-icons";

/** 콩이가 기사 사이에서 하는 말 */
const QUIPS = ["알고 있었콩?", "이것도 챙기콩!", "숨 한번 돌리콩", "거의 다 왔콩!", "끝까지 가 보콩"];

const anchor = (n: NewsItem) => `item-${n.id}`;
/** 긴 글은 양쪽 맞춤 */
const JUSTIFY = "ko-justify";

/** 문장마다 한 줄씩 (맺는 말) — 마침표·물음표·느낌표 뒤, 또는 '/' 로 나눔 */
function splitSentences(text: string): string[] {
  return text
    .split(/\s*\/\s*|(?<=[.!?])\s+/)
    .map((t) => t.trim())
    .filter(Boolean);
}

/** 읽는 데 걸리는 시간 (한국어 약 500자/분) */
export function letterMinutes(c: LetterContent): number {
  const chars = [...c.all, ...c.terms, ...c.questions].reduce((sum, n) => sum + n.summary.length + n.point.length + n.body.length, 0);
  return Math.max(3, Math.round(chars / 500));
}

function SectionLabel({ n, className }: { n: NewsItem; className?: string }) {
  return <span className={cn("tag", NEWS_SECTION_INFO[n.section].tone, className)}>{NEWS_SECTION_INFO[n.section].label}</span>;
}

/** 헤드라인 표지 — 사진이 없으면 카테고리 색 + 한 줄 요약 */
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
    <div aria-hidden className="relative mt-5 flex min-h-[160px] flex-col justify-end overflow-hidden rounded-xl bg-brand-dark px-5 pt-10 pb-5 sm:min-h-[220px] md:px-8 md:pb-7">
      <span className={cn("absolute -top-20 -right-16 h-72 w-72 rounded-full opacity-60 blur-3xl", NEWS_SECTION_INFO[n.section].dot)} />
      <span className="absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-primary/40 blur-3xl" />
      <span className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.09)_1px,transparent_1px)] bg-[length:18px_18px]" />
      <Icon className="absolute top-1/2 right-4 h-28 w-28 -translate-y-1/2 text-on-primary/10 sm:right-8 sm:h-36 sm:w-36" strokeWidth={1} />
      <span className="relative">
        <span className="type-micro-cap text-on-primary/70">{NEWS_SECTION_INFO[n.section].label} · 한 줄 요약</span>
        {n.takeaway && (
          <span className="mt-1.5 block max-w-xl type-body-lg font-semibold text-on-primary [word-break:keep-all] sm:type-heading-md md:type-heading-lg">{n.takeaway}</span>
        )}
      </span>
    </div>
  );
}

function Paragraphs({ text, className }: { text: string; className?: string }) {
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
    <div className={cn("mt-4 space-y-3", className)}>
      {blocks.map((p, i) => (
        <p key={i} className={cn("type-body-lg leading-[1.85] text-ink", JUSTIFY)}>
          {p}
        </p>
      ))}
    </div>
  );
}

function PointBox({ text, label = "왜 중요할까 · 필기·면접 포인트" }: { text: string; label?: string }) {
  if (!text) return null;
  return (
    <aside className="mt-5 rounded-xl border border-lemon/30 bg-canvas-cream/60 px-5 py-4">
      <p className="flex items-center gap-1.5 type-caption font-semibold text-lemon">
        <Lightbulb className="h-4 w-4" strokeWidth={2} />
        {label}
      </p>
      <p className={cn("mt-1.5 type-body-md leading-relaxed whitespace-pre-line text-ink", JUSTIFY)}>{text}</p>
    </aside>
  );
}

/** 자세히 보기 = 기사 원문 (원문이 없으면 금콩 기사 페이지) */
function ReadMore({ n }: { n: NewsItem }) {
  const label = (
    <>
      자세히 보기{n.sourceName ? ` · ${n.sourceName}` : ""}
      <ExternalLink className="h-3.5 w-3.5" strokeWidth={2} />
    </>
  );
  return (
    <div className="mt-5">
      {n.sourceUrl ? (
        <SourceLink id={n.id} href={n.sourceUrl} className="btn btn-sm btn-secondary">
          {label}
        </SourceLink>
      ) : (
        <Link href={newsHref(n.id)} className="btn btn-sm btn-secondary">
          자세히 보기
          <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
        </Link>
      )}
    </div>
  );
}

/** 번호 붙은 기사 머리 (01·02 …) — 휴대폰은 번호·태그 한 줄 + 제목 아래, 넓은 화면은 번호 왼쪽 */
function StoryHead({ n, no, headline = false }: { n: NewsItem; no: number; headline?: boolean }) {
  const tags = (
    <>
      {headline && <span className="tag bg-brand-dark text-on-primary">오늘의 헤드라인</span>}
      <SectionLabel n={n} />
    </>
  );
  return (
    <div className="md:flex md:items-start md:gap-4">
      <div className="flex items-center gap-2 md:block">
        <span
          className={cn(
            "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full tabular text-[15px] font-semibold md:h-14 md:w-14 md:type-heading-lg",
            headline ? "bg-brand-dark text-on-primary" : "border-2 border-brand-dark bg-canvas text-brand-dark",
          )}
        >
          {String(no).padStart(2, "0")}
        </span>
        <span className="flex flex-wrap items-center gap-1.5 md:hidden">{tags}</span>
      </div>
      <div className="min-w-0 md:pt-0.5">
        <span className="hidden flex-wrap items-center gap-1.5 md:flex">{tags}</span>
        <h3
          className={cn(
            "mt-3 text-ink [word-break:keep-all] md:mt-2",
            headline ? "type-heading-md sm:type-heading-lg md:type-display-md" : "type-heading-sm sm:type-heading-md md:type-heading-lg",
          )}
        >
          {n.title}
        </h3>
      </div>
    </div>
  );
}

function Box({ children, className, id }: { children: React.ReactNode; className?: string; id?: string }) {
  return (
    <section id={id} className={cn("scroll-mt-24 rounded-2xl bg-canvas px-4 py-5 sm:px-5 sm:py-6 md:px-7", className)}>
      {children}
    </section>
  );
}

/** 아침판 — 기사 브리핑 + 퀴즈 */
function MorningBody({ issue, content }: { issue: BriefingIssue; content: LetterContent }) {
  const { headline, stories, top } = content;
  return (
    <>
      {top.length > 0 && (
        <section aria-labelledby="top-three" className="rounded-2xl bg-brand-dark px-4 py-5 text-on-primary sm:px-5 sm:py-6 md:px-7">
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

      {content.all.length > 0 && (
        <Box>
          <h3 className="flex items-baseline gap-2 type-heading-sm text-ink">
            오늘의 시간표 <span className="type-micro-cap text-ink-mute">Timetable</span>
          </h3>
          <ol className="mt-3 space-y-2">
            {content.all.map((n, i) => (
              <li key={n.id}>
                <a href={`#${anchor(n)}`} className="group flex items-baseline gap-2 type-body-md">
                  <span className="w-6 shrink-0 tabular text-ink-mute">{String(i + 1).padStart(2, "0")}</span>
                  <span className="shrink-0 font-semibold text-primary-text">[{NEWS_SECTION_INFO[n.section].label}]</span>
                  <span className={cn("min-w-0 [word-break:keep-all] group-hover:underline", i < 3 ? "font-semibold text-ink" : "text-ink-secondary")}>{n.title}</span>
                </a>
              </li>
            ))}
          </ol>
        </Box>
      )}

      {headline && (
        <Box id={anchor(headline)} className="md:py-8">
          <StoryHead n={headline} no={1} headline />
          <Cover n={headline} />
          <Paragraphs text={headline.summary} />
          <PointBox text={headline.point} />
          <ReadMore n={headline} />
        </Box>
      )}

      {stories.map((n, i) => (
        <div key={n.id}>
          {/* 두 기사마다 콩이가 한마디 */}
          {i % 2 === 0 ? <MascotDivider text={QUIPS[(i / 2) % QUIPS.length]} flip={(i / 2) % 2 === 1} /> : <div className="h-6" />}
          <Box id={anchor(n)}>
            <StoryHead n={n} no={i + (headline ? 2 : 1)} />
            {n.imageUrl && <Cover n={n} />}
            <Paragraphs text={n.summary} />
            <PointBox text={n.point} />
            <ReadMore n={n} />
          </Box>
        </div>
      ))}

      {issue.quiz.length > 0 && (
        <>
          <MascotDivider text="퀴즈 풀어 보콩!" flip={Math.ceil(stories.length / 2) % 2 === 1} />
          <BriefingQuiz quiz={issue.quiz} />
        </>
      )}
    </>
  );
}

/** 점심판 — 오늘의 용어 · 면접 질문 */
function NoonBody({ issue, content }: { issue: BriefingIssue; content: LetterContent }) {
  const { terms, questions } = content;
  return (
    <>
      <Box>
        <h3 className="type-heading-sm text-ink">오늘 점심에 공부할 것</h3>
        <ol className="mt-3 space-y-2">
          {terms.map((n) => (
            <li key={n.id}>
              <a href={`#${anchor(n)}`} className="group flex items-baseline gap-2 type-body-md">
                <span className="shrink-0 font-semibold text-ev-posting">[용어]</span>
                <span className="font-semibold text-ink group-hover:underline">{n.title}</span>
              </a>
            </li>
          ))}
          {questions.map((n) => (
            <li key={n.id}>
              <a href={`#${anchor(n)}`} className="group flex items-baseline gap-2 type-body-md">
                <span className="shrink-0 font-semibold text-ev-interview2">[면접]</span>
                <span className="min-w-0 text-ink [word-break:keep-all] group-hover:underline">{n.title}</span>
              </a>
            </li>
          ))}
        </ol>
        <Link href={letterHref(issue.date, "morning")} className="link mt-4 inline-flex items-center gap-1 type-caption">
          오늘 아침판 기사 다시 보기
          <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
        </Link>
      </Box>

      {terms.map((n, i) => (
        <div key={n.id}>
          {i === 0 ? <MascotDivider text="용어부터 정리하콩!" /> : <div className="h-6" />}
          <Box id={anchor(n)} className="border-2 border-ev-posting/40">
            <p className="flex items-center gap-1.5 type-caption font-semibold text-ev-posting">
              <BookA className="h-4 w-4" strokeWidth={2} />
              오늘의 용어 {terms.length > 1 ? i + 1 : ""}
            </p>
            <h3 className="mt-2 type-heading-lg text-ink">{n.title}</h3>
            <Paragraphs text={n.summary} />
            {n.body.trim() && (
              <div className={cn("mt-4", JUSTIFY)}>
                <Markdown source={n.body} />
              </div>
            )}
            <PointBox text={n.point} label="필기·면접에서는" />
            {n.sourceUrl && (
              <SourceLink id={n.id} href={n.sourceUrl} className="link mt-4 inline-flex items-center gap-1 type-caption">
                참고 자료{n.sourceName ? ` · ${n.sourceName}` : ""}
                <ExternalLink className="h-3 w-3" strokeWidth={2} />
              </SourceLink>
            )}
          </Box>
        </div>
      ))}

      {questions.map((n, i) => (
        <div key={n.id}>
          {i === 0 ? <MascotDivider text="면접 연습 가 보콩!" flip /> : <div className="h-6" />}
          <Box id={anchor(n)} className="border-2 border-ev-interview2/40">
            <p className="flex items-center gap-1.5 type-caption font-semibold text-ev-interview2">
              <MessageCircleQuestion className="h-4 w-4" strokeWidth={2} />
              오늘의 면접 질문 {questions.length > 1 ? i + 1 : ""}
            </p>
            <h3 className="mt-2 type-heading-md text-ink [word-break:keep-all] md:type-heading-lg">Q. {n.title}</h3>
            <p className={cn("mt-3 type-body-md leading-relaxed text-ink-secondary", JUSTIFY)}>{n.summary}</p>
            {n.body.trim() && (
              <div className={cn("mt-4 rounded-xl bg-canvas-soft px-4 py-3", JUSTIFY)}>
                <p className="mb-1 type-caption font-semibold text-ink">답변 뼈대</p>
                <Markdown source={n.body} />
              </div>
            )}
            <PointBox text={n.point} label="답변 팁" />
            {n.sourceUrl && (
              <SourceLink id={n.id} href={n.sourceUrl} className="link mt-4 inline-flex items-center gap-1 type-caption">
                관련 기사{n.sourceName ? ` · ${n.sourceName}` : ""}
                <ExternalLink className="h-3 w-3" strokeWidth={2} />
              </SourceLink>
            )}
          </Box>
        </div>
      ))}
    </>
  );
}

/** 데일리 브리핑 한 호 (아침판·점심판) */
export function Letter({ issue, content }: { issue: BriefingIssue; content: LetterContent }) {
  const minutes = letterMinutes(content);
  const morning = issue.edition === "morning";
  const count = morning ? `기사 ${content.all.length}건` : `용어 ${content.terms.length}개 · 면접 질문 ${content.questions.length}개`;

  return (
    <article className="theme-light overflow-hidden rounded-3xl bg-canvas-cream">
      {/* 머리 — 로고·호수·날짜 */}
      <header className="relative px-6 pt-8 pb-8 text-center md:px-10 md:pt-10">
        <p className="type-caption font-semibold text-lemon">{BRIEFING_TAGLINE[issue.edition]}</p>
        <Masthead edition={issue.edition} className="mx-auto mt-6" />
        <p className="mt-9 tabular type-body-md font-semibold text-ink">
          {volLabel(issue.vol)} · {formatDayHeading(issue.date)}
        </p>
        <p className="mt-1 type-caption text-ink-mute">
          {EDITION_LABEL[issue.edition]} · {count} · 약 {minutes}분
        </p>
      </header>

      <div className="space-y-5 px-3 pb-10 sm:space-y-6 sm:px-4 md:px-10">
        {issue.lede && (
          <section aria-label="오늘의 흐름" className="rounded-2xl bg-canvas px-4 py-5 sm:px-5 md:px-7">
            <p className="flex items-center gap-1.5 type-caption font-semibold text-primary-text">
              <Sparkles className="h-4 w-4" strokeWidth={2} />
              {morning ? "오늘의 흐름" : "점심 공부 안내"}
            </p>
            <p className={cn("mt-2 type-body-lg leading-[1.85] whitespace-pre-line text-ink", JUSTIFY)}>{issue.lede}</p>
          </section>
        )}

        {morning ? <MorningBody issue={issue} content={content} /> : <NoonBody issue={issue} content={content} />}

        {/* 맺음 */}
        <footer className="pt-6 text-center">
          <KongMascot className="mx-auto h-14 w-14" wave />
          {issue.closing && (
            <p className="mx-auto mt-3 max-w-md type-body-md text-ink [word-break:keep-all]">
              {splitSentences(issue.closing).map((line, i) => (
                <span key={i} className="block">
                  {line}
                </span>
              ))}
            </p>
          )}
          {morning && (
            <Link href={letterHref(issue.date, "noon")} className="link mt-4 inline-flex items-center gap-1 type-caption">
              점심판에서는 오늘 기사로 용어·면접 공부를 해요
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
            </Link>
          )}
          <p className="mt-6 type-heading-sm text-ink">오늘 브리핑은 어땠나요?</p>
          <p className="mt-1 type-caption text-ink-mute">좋았던 점, 아쉬운 점을 알려 주시면 다음 브리핑에 반영할게요.</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <FeedbackButton kind="site" className="btn btn-sm btn-primary">
              의견 보내기
            </FeedbackButton>
            <ShareButton title={`금콩 브리핑 ${EDITION_LABEL[issue.edition]} ${formatDayHeading(issue.date)}`} path={letterHref(issue.date, issue.edition)} />
          </div>
          <p className="mx-auto mt-8 max-w-md rounded-xl bg-canvas px-4 py-3 type-caption text-ink-secondary [word-break:keep-all]">
            브리핑은 기사 원문을 짧게 요약한 글이에요. 수치·날짜 같은 <strong className="font-semibold text-ink">정확한 정보는 꼭 &lsquo;자세히 보기&rsquo;로 원문 기사를 확인해 주세요.</strong>
          </p>
          <a href="#top" className="mt-3 inline-flex items-center gap-1 type-micro text-ink-mute hover:underline">
            <ArrowDown className="h-3 w-3 rotate-180" strokeWidth={2} />맨 위로
          </a>
        </footer>
      </div>
    </article>
  );
}
