import Link from "next/link";
import { ArrowDown, ArrowRight, BookA, ChevronLeft, ChevronRight, ExternalLink, Hash, Info, Lightbulb, Mail, MessageCircleQuestion, PenLine, Soup, Sparkles, Sunrise } from "lucide-react";
import { formatDayHeading, formatShort } from "@/lib/date";
import {
  BRIEFING_ARCHIVE,
  BRIEFING_TAGLINE,
  EDITION_LABEL,
  NEWS_SECTION_INFO,
  briefingMinutes,
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
import { JOURNEY_DONE, JourneyDivider, journeyStage } from "./KongMascot";
import { ShareButton, SourceLink } from "./interactive";
import { NEWS_ICON } from "./news-icons";

const anchor = (n: NewsItem) => `item-${n.id}`;
/** 긴 글은 양쪽 맞춤 */
const JUSTIFY = "ko-justify";

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
  // 콩이의 취업 여정 쉼표 — 기사 사이 몇 곳(+퀴즈 앞)에 고르게, 원서 → … → 최종 면접 순으로
  const quiz = issue.quiz.length > 0;
  const k = Math.min(stories.length, quiz ? 4 : 5);
  const marks = Array.from({ length: k }, (_, j) => Math.floor((j * stories.length) / k));
  const slots = marks.length + (quiz ? 1 : 0);
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
          {marks.includes(i) ? <JourneyDivider stage={journeyStage(marks.indexOf(i), slots)} /> : <div className="h-6" />}
          <Box id={anchor(n)}>
            <StoryHead n={n} no={i + (headline ? 2 : 1)} />
            {n.imageUrl && <Cover n={n} />}
            <Paragraphs text={n.summary} />
            <PointBox text={n.point} />
            <ReadMore n={n} />
          </Box>
        </div>
      ))}

      {quiz && (
        <>
          <JourneyDivider stage={journeyStage(marks.length, slots)} />
          <BriefingQuiz quiz={issue.quiz} />
        </>
      )}
    </>
  );
}

/** 금콩 스터디 코너 머리 — ① 숫자로 보는 오늘 · 1분 */
function CornerHead({ no, icon: Icon, title, time, tone }: { no: number; icon: typeof Hash; title: string; time: string; tone: string }) {
  return (
    <p className={cn("flex items-center gap-2 type-caption font-semibold", tone)}>
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand-dark tabular text-[12px] text-on-primary">{no}</span>
      <Icon className="h-4 w-4" strokeWidth={2} />
      {title}
      <span className="ml-auto font-normal text-ink-mute">{time}</span>
    </p>
  );
}

/** 금콩 스터디 — 오늘 아침판 기사로 하는 점심 공부: 숫자 → 용어 → 논술 → 면접 → 퀴즈 (코너마다 1분, 모두 5분 안쪽) */
function NoonBody({ issue, content }: { issue: BriefingIssue; content: LetterContent }) {
  const { terms, questions } = content;
  const { numbers, essay } = issue.extras;
  const corners = [
    numbers.length > 0 && { id: "noon-numbers", title: "숫자로 보는 오늘", time: "1분" },
    terms.length > 0 && { id: "noon-terms", title: "오늘의 용어 + 헷갈리는 짝꿍", time: "1분" },
    essay && { id: "noon-essay", title: "논술 한 문단", time: "1분" },
    questions.length > 0 && { id: "noon-question", title: "오늘의 면접 질문", time: "1분" },
    issue.quiz.length > 0 && { id: "noon-quiz", title: "점심 퀴즈", time: "1분" },
  ].filter((c): c is { id: string; title: string; time: string } => Boolean(c));
  const no = (id: string) => corners.findIndex((c) => c.id === id) + 1;
  // 코너마다 앞에 콩이의 취업 여정 쉼표 (숫자 = 원서 … 퀴즈 = 최종 면접)
  const stage = (id: string) => journeyStage(no(id) - 1, corners.length);

  return (
    <>
      <Box>
        <h3 className="flex items-baseline gap-2 type-heading-sm text-ink">
          오늘의 스터디 코스 <span className="type-micro-cap text-ink-mute">Study course</span>
        </h3>
        <ol className="mt-3 space-y-2">
          {corners.map((c, i) => (
            <li key={c.id}>
              <a href={`#${c.id}`} className="group flex items-center gap-2 type-body-md">
                <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#d9f2e2] tabular text-[11px] font-bold text-[#2f7d4f]">{i + 1}</span>
                <span className="min-w-0 font-semibold text-ink group-hover:underline">{c.title}</span>
                <span className="ml-auto shrink-0 type-caption text-ink-mute">{c.time}</span>
              </a>
            </li>
          ))}
        </ol>
        <Link href={letterHref(issue.date, "morning")} className="link mt-4 inline-flex items-center gap-1 type-caption">
          오늘 아침판 기사 다시 보기
          <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
        </Link>
      </Box>

      {/* ① 숫자로 보는 오늘 */}
      {numbers.length > 0 && (
        <div id="noon-numbers" className="scroll-mt-24">
          <JourneyDivider stage={stage("noon-numbers")} />
          <Box>
            <CornerHead no={no("noon-numbers")} icon={Hash} title="숫자로 보는 오늘" time="1분" tone="text-primary-text" />
          <ul className={cn("mt-4 grid gap-3", numbers.length >= 3 ? "sm:grid-cols-3" : "sm:grid-cols-2")}>
            {numbers.map((n, i) => (
              <li key={i} className="rounded-xl bg-canvas-soft px-4 py-4">
                <span className="block tabular text-[28px] leading-tight font-bold text-brand-dark">{n.value}</span>
                <span className="mt-1 block type-body-md font-semibold text-ink [word-break:keep-all]">{n.label}</span>
                {n.note && <span className="mt-1 block type-caption leading-relaxed text-ink-secondary [word-break:keep-all]">{n.note}</span>}
              </li>
            ))}
          </ul>
          </Box>
        </div>
      )}

      {/* ② 오늘의 용어 + 헷갈리는 짝꿍 */}
      {terms.map((n, i) => (
        <div key={n.id} id={i === 0 ? "noon-terms" : undefined} className="scroll-mt-24">
          {i === 0 ? <JourneyDivider stage={stage("noon-terms")} /> : <div className="h-5" />}
          <Box id={anchor(n)} className="border-2 border-ev-posting/40">
            {i === 0 ? (
              <CornerHead no={no("noon-terms")} icon={BookA} title={`오늘의 용어${terms.length > 1 ? ` ${i + 1}` : ""}`} time="1분" tone="text-ev-posting" />
            ) : (
              <p className="flex items-center gap-1.5 type-caption font-semibold text-ev-posting">
                <BookA className="h-4 w-4" strokeWidth={2} />
                오늘의 용어 {i + 1}
              </p>
            )}
            <h3 className="mt-3 type-heading-lg text-ink">{n.title}</h3>
            <Paragraphs text={n.summary} />
            {n.body.trim() && (
              <div className="mt-4 rounded-xl bg-canvas-soft px-4 py-3">
                <p className="mb-1 type-caption font-semibold text-ink">헷갈리는 짝꿍</p>
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

      {/* ③ 논술 한 문단 */}
      {essay && (
        <>
          <JourneyDivider stage={stage("noon-essay")} />
          <Box id="noon-essay" className="border-2 border-primary/30">
            <CornerHead no={no("noon-essay")} icon={PenLine} title="논술 한 문단" time="1분" tone="text-primary-text" />
            <p className="mt-3 type-caption text-ink-mute">오늘 기사로 나올 법한 논술 주제예요. 개요를 보고 한 문단으로 직접 써 보세요.</p>
            <h3 className="mt-2 type-heading-md text-ink [word-break:keep-all] md:type-heading-lg">{essay.topic}</h3>
            <ol className="mt-4 space-y-3">
              {(
                [
                  ["서론", essay.intro],
                  ["본론", essay.body],
                  ["결론", essay.conclusion],
                ] as const
              )
                .filter(([, text]) => text)
                .map(([label, text]) => (
                  <li key={label} className="flex gap-3">
                    <span className="mt-0.5 inline-flex h-6 shrink-0 items-center rounded-full bg-ev-written-soft px-2.5 type-caption font-semibold text-primary-text">{label}</span>
                    <span className={cn("min-w-0 type-body-md leading-relaxed text-ink", JUSTIFY)}>{text}</span>
                  </li>
                ))}
            </ol>
            {essay.evidence.length > 0 && (
              <div className="mt-4 rounded-xl bg-canvas-soft px-4 py-3">
                <p className="type-caption font-semibold text-ink">쓸 만한 근거</p>
                <ul className="mt-1.5 space-y-1">
                  {essay.evidence.map((e, i) => (
                    <li key={i} className="flex gap-2 type-body-md text-ink-secondary">
                      <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      <span className="min-w-0 [word-break:keep-all]">{e}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Box>
        </>
      )}

      {/* ④ 오늘의 면접 질문 */}
      {questions.map((n, i) => (
        <div key={n.id} id={i === 0 ? "noon-question" : undefined} className="scroll-mt-24">
          {i === 0 ? <JourneyDivider stage={stage("noon-question")} /> : <div className="h-5" />}
          <Box id={anchor(n)} className="border-2 border-ev-interview2/40">
            {i === 0 ? (
              <CornerHead no={no("noon-question")} icon={MessageCircleQuestion} title={`오늘의 면접 질문${questions.length > 1 ? ` ${i + 1}` : ""}`} time="1분" tone="text-ev-interview2" />
            ) : (
              <p className="flex items-center gap-1.5 type-caption font-semibold text-ev-interview2">
                <MessageCircleQuestion className="h-4 w-4" strokeWidth={2} />
                오늘의 면접 질문 {i + 1}
              </p>
            )}
            <h3 className="mt-3 type-heading-md text-ink [word-break:keep-all] md:type-heading-lg">Q. {n.title}</h3>
            <p className={cn("mt-3 type-body-md leading-relaxed text-ink-secondary", JUSTIFY)}>{n.summary}</p>
            {n.body.trim() && (
              <div className="mt-4 rounded-xl bg-canvas-soft px-4 py-3">
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

      {/* ⑤ 점심 퀴즈 */}
      {issue.quiz.length > 0 && (
        <div id="noon-quiz" className="scroll-mt-24">
          <JourneyDivider stage={stage("noon-quiz")} />
          <BriefingQuiz quiz={issue.quiz} title="점심 퀴즈" subtitle={`오늘 공부한 용어·숫자, O/X로 확인해요. ${issue.quiz.length}문제`} />
        </div>
      )}
    </>
  );
}

/** 맺음의 앞뒤 호 카드 — 누르면 바로 그 브리핑으로 */
function NearIssue({ issue, dir }: { issue: BriefingIssue; dir: "prev" | "next" }) {
  const morning = issue.edition === "morning";
  const Icon = morning ? Sunrise : Soup;
  const Arrow = dir === "prev" ? ChevronLeft : ChevronRight;
  return (
    <Link
      href={letterHref(issue.date, issue.edition)}
      className={cn("group flex items-center gap-3 rounded-2xl bg-canvas px-4 py-3.5 transition-shadow hover:shadow-level-1", dir === "next" && "flex-row-reverse text-right")}
    >
      <Arrow className="h-5 w-5 shrink-0 text-ink-mute transition-colors group-hover:text-ink" strokeWidth={2} />
      <span className="min-w-0 flex-1">
        <span className={cn("flex items-center gap-1.5 type-caption text-ink-mute", dir === "next" && "justify-end")}>
          <span className={cn("inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-brand-dark", morning ? "bg-[#ffb36b]" : "bg-[#8fd6a8]")}>
            <Icon className="h-3 w-3" strokeWidth={2.2} />
          </span>
          {dir === "prev" ? "이전" : "다음"} 브리핑 · {formatShort(issue.date)} {EDITION_LABEL[issue.edition]}
        </span>
        <span className="mt-1 line-clamp-2 type-body-md font-semibold text-ink [word-break:keep-all] group-hover:underline">{issue.title}</span>
      </span>
    </Link>
  );
}

/** 데일리 브리핑 한 호 (아침판·금콩 스터디) */
export function Letter({
  issue,
  content,
  around = { prev: null, next: null },
}: {
  issue: BriefingIssue;
  content: LetterContent;
  /** 발행 순서로 바로 앞뒤 호 (판 상관없이) */
  around?: { prev: BriefingIssue | null; next: BriefingIssue | null };
}) {
  const minutes = briefingMinutes(issue, [...content.all, ...content.terms, ...content.questions]);
  const morning = issue.edition === "morning";

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
          {EDITION_LABEL[issue.edition]}
          {morning && ` · 기사 ${content.all.length}건`} · 약 {minutes}분
        </p>
      </header>

      <div className="space-y-5 px-3 pb-10 sm:space-y-6 sm:px-4 md:px-10">
        {issue.lede && (
          <section aria-label={morning ? "오늘의 흐름" : "오늘의 스터디"} className="rounded-2xl bg-canvas px-4 py-5 sm:px-5 md:px-7">
            <p className="flex items-center gap-1.5 type-caption font-semibold text-primary-text">
              <Sparkles className="h-4 w-4" strokeWidth={2} />
              {morning ? "오늘의 흐름" : "오늘의 스터디"}
            </p>
            <p className={cn("mt-2 type-body-lg leading-[1.85] whitespace-pre-line text-ink", JUSTIFY)}>{issue.lede}</p>
          </section>
        )}

        {morning ? <MorningBody issue={issue} content={content} /> : <NoonBody issue={issue} content={content} />}

        {/* 끝까지 읽으면 — 정장 입은 합격 콩이 */}
        <JourneyDivider stage={JOURNEY_DONE} />

        {/* 맺음 — ① 앞뒤 브리핑 바로 가기 ② 의견·공유와 원문 확인 안내 */}
        <footer className="space-y-4">
          <nav aria-label="이전·다음 브리핑" className="grid gap-3 sm:grid-cols-2">
            {around.prev ? <NearIssue issue={around.prev} dir="prev" /> : <span aria-hidden className="hidden sm:block" />}
            {around.next ? (
              <NearIssue issue={around.next} dir="next" />
            ) : (
              <Link href={BRIEFING_ARCHIVE} className="group flex flex-row-reverse items-center gap-3 rounded-2xl bg-canvas px-4 py-3.5 text-right transition-shadow hover:shadow-level-1">
                <Mail className="h-5 w-5 shrink-0 text-ink-mute transition-colors group-hover:text-ink" strokeWidth={1.75} />
                <span className="min-w-0 flex-1">
                  <span className="block type-caption text-ink-mute">날짜·카테고리로 찾아보기</span>
                  <span className="mt-1 block type-body-md font-semibold text-ink group-hover:underline">지난 브리핑 전체 보기</span>
                </span>
              </Link>
            )}
          </nav>

          <div className="rounded-2xl bg-canvas px-4 py-5 sm:px-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="type-heading-sm text-ink">오늘 브리핑은 어땠나요?</p>
                <p className="mt-0.5 type-caption text-ink-mute">좋았던 점, 아쉬운 점을 알려 주시면 다음 브리핑에 반영할게요.</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <FeedbackButton kind="site" className="btn btn-sm btn-primary">
                  의견 보내기
                </FeedbackButton>
                <ShareButton title={`금콩 브리핑 ${EDITION_LABEL[issue.edition]} ${formatDayHeading(issue.date)}`} path={letterHref(issue.date, issue.edition)} />
              </div>
            </div>
            <p className="mt-4 flex gap-2 border-t border-hairline pt-4 type-caption leading-relaxed text-ink-secondary [word-break:keep-all]">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-ink-mute" strokeWidth={2} />
              <span>
                브리핑은 기사 원문을 짧게 요약한 글이에요. 수치·날짜 같은 <strong className="font-semibold text-ink">정확한 정보는 꼭 &lsquo;자세히 보기&rsquo;로 원문 기사를 확인해 주세요.</strong>
              </span>
            </p>
          </div>

          <div className="text-right">
            <a href="#top" className="inline-flex items-center gap-1 type-caption text-ink-mute hover:underline">
              <ArrowDown className="h-3.5 w-3.5 rotate-180" strokeWidth={2} />맨 위로
            </a>
          </div>
        </footer>
      </div>
    </article>
  );
}
