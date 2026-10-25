import Link from "next/link";
import { ArrowDown, ArrowRight, BookA, ChevronLeft, ChevronRight, ExternalLink, Hash, Info, Lightbulb, Mail, MessageCircleQuestion, PenLine, Soup, Sparkles, Sunrise } from "lucide-react";
import { formatDayHeading, formatShort } from "@/lib/date";
import {
  BRIEFING_ARCHIVE,
  EDITION_LABEL,
  briefingMinutes,
  letterHref,
  letterShareHref,
  volLabel,
  type BriefingIssue,
  type NewsItem,
} from "@/lib/news-meta";
import type { LetterContent } from "@/lib/server/briefing";
import { FeedbackButton } from "../feedback/Feedback";
import { cn } from "../ui";
import { MastheadMini } from "./BriefingBrand";
import { BriefingQuiz } from "./BriefingQuiz";
import { TimetableBar } from "./CardDeck";
import { Markdown } from "./Markdown";
import { ReadingProgress } from "./KongMascot";
import { IssueLikeButton, ShareButton, ShareUrlSync, SourceLink } from "./interactive";
import { NewsDeck, timetableItem } from "./NewsDeck";

const anchor = (n: NewsItem) => `item-${n.id}`;
/** 긴 글은 양쪽 맞춤 */
const JUSTIFY = "ko-justify";

/** 읽은 정도 계산용 글자 수 */
const textLength = (n: NewsItem) => n.title.length + n.summary.length + n.point.length + n.body.length;
const quizLength = (issue: BriefingIssue) => issue.quiz.reduce((s, q) => s + q.question.length + q.options.join("").length + q.explain.length, 0);

/**
 * 읽은 정도 쉼표 자리 — 모든 칸 위가 아니라 글이 길어지는 곳에만 (긴 호는 2곳, 보통 1곳, 짧으면 없음).
 * blocks: 차례대로 덩어리별 글자 수 / allowed: 쉼표를 넣어도 되는 덩어리 번호(그 덩어리 앞)
 * → 덩어리 번호 → 그 앞까지 읽은 정도(0~1)
 */
function progressMarks(blocks: number[], allowed: number[]): Map<number, number> {
  const total = blocks.reduce((a, b) => a + b, 0);
  const marks = new Map<number, number>();
  if (!total) return marks;
  const count = total >= 2400 ? 2 : total >= 1000 ? 1 : 0;
  const before = (i: number) => blocks.slice(0, i).reduce((a, b) => a + b, 0) / total;
  for (let k = 1; k <= count; k++) {
    const target = k / (count + 1);
    const best = allowed
      .filter((i) => [...marks.keys()].every((m) => Math.abs(m - i) >= 2))
      .sort((a, b) => Math.abs(before(a) - target) - Math.abs(before(b) - target))[0];
    if (best !== undefined) marks.set(best, before(best));
  }
  return marks;
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

function Box({ children, className, id }: { children: React.ReactNode; className?: string; id?: string }) {
  return (
    <section id={id} className={cn("scroll-mt-24 rounded-2xl bg-canvas px-4 py-5 sm:px-5 sm:py-6 md:px-7", className)}>
      {children}
    </section>
  );
}

/**
 * 아침판 — 화면 위에 붙는 한 줄 시간표 + 기사마다 옆으로 넘겨 보는 그림 카드뉴스 (기사는 MAX_STORIES 건까지).
 * 읽은 정도는 시간표의 체크로 보여 줘요 (예전 호의 퀴즈는 싣지 않아요)
 */
function MorningBody({ content }: { content: LetterContent }) {
  const { all } = content;
  if (!all.length) return null;
  return (
    <div className="space-y-8 md:space-y-10">
      <TimetableBar items={all.map(timetableItem)} />
      {all.map((n, i) => (
        <NewsDeck key={n.id} n={n} no={i + 1} />
      ))}
    </div>
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
  // 읽은 정도 쉼표: 덩어리 = [여는 글·코스, 코너들…], 용어·논술·면접 코너 앞 중 글이 길어지는 곳에만
  const sum = (ns: NewsItem[]) => ns.reduce((s, n) => s + textLength(n), 0);
  const cornerLength: Record<string, number> = {
    "noon-numbers": numbers.reduce((s, n) => s + n.value.length + n.label.length + n.note.length, 0),
    "noon-terms": sum(terms),
    "noon-essay": essay ? essay.topic.length + essay.intro.length + essay.body.length + essay.conclusion.length + essay.evidence.join("").length : 0,
    "noon-question": sum(questions),
    "noon-quiz": quizLength(issue),
  };
  const marks = progressMarks(
    [issue.lede.length + 150, ...corners.map((c) => cornerLength[c.id])],
    ["noon-terms", "noon-essay", "noon-question"].map(no).filter((n) => n > 0),
  );
  const SAY: Record<string, string> = { "noon-terms": "이제 용어 정리하콩!", "noon-essay": "한 문단 써 보콩!", "noon-question": "면접 연습 가 보콩!" };
  const mark = (id: string) => (marks.has(no(id)) ? <ReadingProgress progress={marks.get(no(id))!} say={SAY[id]} /> : null);

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
          오늘 금콩 브리핑 기사 다시 보기
          <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
        </Link>
      </Box>

      {/* ① 숫자로 보는 오늘 */}
      {numbers.length > 0 && (
        <Box id="noon-numbers">
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
      )}

      {/* ② 오늘의 용어 + 헷갈리는 짝꿍 */}
      {terms.map((n, i) => (
        <div key={n.id} id={i === 0 ? "noon-terms" : undefined} className="scroll-mt-24">
          {i === 0 ? mark("noon-terms") : <div className="h-5" />}
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
          {mark("noon-essay")}
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
          {i === 0 ? mark("noon-question") : <div className="h-5" />}
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

/** 맺음의 '지난 브리핑 전체 보기' 카드 — 앞뒤 호가 없는 쪽에 */
function ArchiveCard({ side }: { side: "left" | "right" }) {
  return (
    <Link
      href={BRIEFING_ARCHIVE}
      className={cn("group flex items-center gap-3 rounded-2xl bg-canvas px-4 py-3.5 transition-shadow hover:shadow-level-1", side === "right" && "flex-row-reverse text-right")}
    >
      <Mail className="h-5 w-5 shrink-0 text-ink-mute transition-colors group-hover:text-ink" strokeWidth={1.75} />
      <span className="min-w-0 flex-1">
        <span className="block type-caption text-ink-mute">날짜·카테고리로 찾아보기</span>
        <span className="mt-1 block type-body-md font-semibold text-ink group-hover:underline">지난 브리핑 전체 보기</span>
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
    <article className="theme-light overflow-clip rounded-3xl bg-canvas-cream">
      {/* 주소창도 썸네일 버전이 붙은 공유 주소로 (복사해 카톡에 보내도 새 미리보기) */}
      {issue.live && <ShareUrlSync path={letterShareHref(issue)} />}
      {/* 머리 — 작은 로고 한 줄 + 날짜·호수 (아래 카드뉴스가 바로 보이게) */}
      <header className="flex items-center justify-between gap-3 px-4 pt-4 md:px-7 md:pt-6">
        <MastheadMini edition={issue.edition} />
        <p className="text-right tabular type-caption leading-snug">
          <span className="block font-semibold whitespace-nowrap text-ink">{formatDayHeading(issue.date)}</span>
          <span className="block whitespace-nowrap text-ink-mute">
            {volLabel(issue.vol)} · 약 {minutes}분
          </span>
        </p>
      </header>

      <div className="space-y-6 px-3 pt-4 pb-10 sm:px-4 md:space-y-8 md:px-7">
        <h2 className="px-1 type-heading-md text-ink [word-break:keep-all] md:type-display-md">{issue.title}</h2>

        {!morning && issue.lede && (
          <section aria-label="오늘의 스터디" className="rounded-2xl bg-canvas px-4 py-5 sm:px-5 md:px-7">
            <p className="flex items-center gap-1.5 type-caption font-semibold text-primary-text">
              <Sparkles className="h-4 w-4" strokeWidth={2} />
              오늘의 스터디
            </p>
            <p className={cn("mt-2 type-body-lg leading-[1.85] whitespace-pre-line text-ink", JUSTIFY)}>{issue.lede}</p>
          </section>
        )}

        {morning ? <MorningBody content={content} /> : <NoonBody issue={issue} content={content} />}

        {/* 끝까지 읽으면 — 바가 다 차고 정장 입은 합격 콩이 (금콩 스터디만 — 아침판은 시간표가 읽은 정도를 보여 줘요) */}
        {!morning && <ReadingProgress progress={1} say="오늘 스터디 끝까지 마쳤콩!" />}

        {/* 맺음 — ① 앞뒤 브리핑 바로 가기 ② 의견·공유와 원문 확인 안내 */}
        <footer className="space-y-4">
          {/* 앞뒤 호가 있으면 그 호로, 빈 쪽에는 '지난 브리핑 전체 보기' (한 번만) */}
          <nav aria-label="이전·다음 브리핑" className="grid gap-3 sm:grid-cols-2">
            {around.prev ? <NearIssue issue={around.prev} dir="prev" /> : <ArchiveCard side="left" />}
            {around.next ? <NearIssue issue={around.next} dir="next" /> : around.prev && <ArchiveCard side="right" />}
          </nav>

          <div className="rounded-2xl bg-canvas px-4 py-5 sm:px-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="type-heading-sm text-ink">오늘 브리핑은 어땠나요?</p>
                <p className="mt-0.5 type-caption text-ink-mute">좋았던 점, 아쉬운 점을 알려 주시면 다음 브리핑에 반영할게요.</p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <IssueLikeButton id={issue.id} initialLikes={issue.likes} disabled={!issue.live} />
                <FeedbackButton kind="site" className="btn btn-sm btn-primary">
                  의견 보내기
                </FeedbackButton>
                <ShareButton title={`${EDITION_LABEL[issue.edition]} ${formatDayHeading(issue.date)}`} path={letterShareHref(issue)} />
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
