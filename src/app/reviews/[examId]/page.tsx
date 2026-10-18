import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { ArrowLeft, CalendarClock, Lock, MessageSquareText } from "lucide-react";
import { AdSlot } from "@/components/ads/AdSlot";
import { ModerationBar } from "@/components/board/ModerationBar";
import { ReportButton } from "@/components/board/interactive";
import { AttendGate } from "@/components/reviews/AttendGate";
import { DbSection } from "@/components/db/DbSection";
import { ReviewForm } from "@/components/reviews/ReviewForm";
import { LockedResults, ReviewResults } from "@/components/reviews/Results";
import { Card, Chip, CompanyAvatar, Eyebrow, cn } from "@/components/ui";
import { formatPostDateTime } from "@/lib/board-meta";
import { ddayLabel, diffDays, formatLong, parseKey, todayKST, weekdayLabel } from "@/lib/date";
import { OVERALL_OPTIONS, resultsPublicFrom, type ExamInfo } from "@/lib/review-meta";
import { dbConfigured } from "@/lib/server/db";
import { examReviewCount, getExam, listExams, myReview, reviewComments, reviewStats } from "@/lib/server/reviews";
import { isAdmin, voterToken } from "@/lib/server/security";
import { AD_SLOTS, pageOpenGraph } from "@/lib/site";

/** "10월 13일(화)" */
function monthDay(key: string): string {
  const { m, d } = parseKey(key);
  return `${m}월 ${d}일(${weekdayLabel(key)})`;
}

export function generateStaticParams() {
  return listExams().map((e) => ({ examId: e.id }));
}

export async function generateMetadata({ params }: PageProps<"/reviews/[examId]">): Promise<Metadata> {
  const exam = getExam((await params).examId);
  if (!exam) return {};
  const title = `${exam.companyName} ${exam.label} 후기 · 체감 난이도`;
  const description = `${formatLong(exam.date)} ${exam.companyName} ${exam.label} 응시자들이 남긴 전체 난이도, 과목별 체감 난이도(${exam.subjects.join("·")}), 시간 여유, 한 줄 후기를 그래프로 확인하세요.`;
  // 후기가 아직 없는 페이지(시험 전 등)는 검색에서 빼 두고, 첫 후기가 들어오면 자동으로 다시 노출 (DB 오류 땐 그대로 노출)
  await connection();
  const reviews = dbConfigured() ? await examReviewCount(exam.id).catch(() => null) : null;
  return {
    title,
    description,
    alternates: { canonical: `/reviews/${exam.id}` },
    robots: reviews === 0 ? { index: false, follow: true } : undefined,
    openGraph: pageOpenGraph(`/reviews/${exam.id}`, { title, description }, { fileImage: true }),
  };
}

export default function ExamReviewPage({ params }: PageProps<"/reviews/[examId]">) {
  return (
    <div className="mx-auto max-w-[1200px] px-4 pt-4 pb-12 md:px-6 md:pt-12">
      <Link href="/reviews" className="link inline-flex items-center gap-1 type-caption">
        <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
        필기 후기 목록
      </Link>
      <Suspense fallback={<div className="mt-6 h-[480px] animate-pulse rounded-lg bg-canvas-soft" />}>
        {params.then(({ examId }) => (
          <ExamContent examId={examId} />
        ))}
      </Suspense>
    </div>
  );
}

function ExamContent({ examId }: { examId: string }) {
  const exam = getExam(examId);
  if (!exam) notFound();
  const sameDay = listExams().filter((e) => e.date === exam.date && e.id !== exam.id && !e.expected);

  return (
    <>
      <header className="mt-3 flex flex-col gap-3 md:mt-6 md:flex-row md:items-center md:gap-5">
        <CompanyAvatar company={{ id: exam.companyId, shortName: exam.shortName, avatar: exam.avatar, logo: exam.logo }} size="lg" />
        <div className="min-w-0 flex-1">
          <Eyebrow className="max-md:hidden">필기 후기</Eyebrow>
          <h1 className="type-heading-lg text-ink md:mt-2 md:type-display-lg">
            <Link href={`/companies/${exam.companyId}`} className="hover:underline">
              {exam.companyName}
            </Link>{" "}
            <span className="text-ink-mute">{exam.label}</span>
          </h1>
          <p className="mt-3 flex flex-wrap items-center gap-2 type-body-md text-ink-secondary">
            <CalendarClock className="h-4 w-4 text-ink-mute" strokeWidth={1.75} />
            {formatLong(exam.date)}
            {exam.expected && <span className="tag bg-canvas-cream text-lemon">예상 일정</span>}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {exam.subjects.map((s) => (
              <Chip key={s}>{s}</Chip>
            ))}
          </div>
          {exam.note && <p className="mt-2 type-caption text-ink-mute">※ {exam.note}</p>}
        </div>
      </header>

      <div className="mt-6 md:mt-10">
        <DbSection noticeTitle="필기 후기 투표를 준비하고 있어요">
          <Suspense fallback={<div className="h-[480px] animate-pulse rounded-lg bg-canvas-soft" />}>
            <ExamLive exam={exam} />
          </Suspense>
        </DbSection>
      </div>

      {sameDay.length > 0 && (
        <section className="mt-10">
          <h2 className="type-heading-sm text-ink">같은 날 필기를 본 기관</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {sameDay.map((e) => (
              <li key={e.id}>
                <Link
                  href={`/reviews/${e.id}`}
                  className="inline-flex items-center gap-2 rounded-full border border-hairline py-1 pr-3 pl-1 type-caption text-ink-secondary hover:border-hairline-input"
                >
                  <CompanyAvatar company={{ id: e.companyId, shortName: e.shortName, avatar: e.avatar, logo: e.logo }} size="sm" />
                  {e.companyName}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

async function ExamLive({ exam }: { exam: ExamInfo }) {
  await connection();
  const today = todayKST();

  if (exam.date > today || exam.expected) {
    const d = diffDays(today, exam.date);
    return (
      <Card className="flex flex-col items-center p-10 text-center">
        {d >= 0 && <span className="tag bg-ev-written-soft type-caption !px-3 text-ev-written">{ddayLabel(d)}</span>}
        <p className="mt-4 type-heading-sm text-ink">시험이 끝나면 후기 투표가 열려요</p>
        <p className="mt-2 max-w-md type-body-md text-ink-mute">
          {formatLong(exam.date)} 시험이 끝난 뒤 이 페이지에서 체감 난이도와 과목별 후기를 남기고 결과를 볼 수 있어요.
        </p>
        <Link href={`/companies/${exam.companyId}`} className="btn btn-secondary btn-sm mt-6">
          {exam.companyName} 필기 정보 보기
        </Link>
      </Card>
    );
  }

  const [admin, voter] = await Promise.all([isAdmin(), voterToken(false)]);
  const [stats, comments, mine] = await Promise.all([
    reviewStats(exam),
    reviewComments(exam.id, admin),
    myReview(exam.id, voter),
  ]);

  // 응시자 우선 공개: 시험 후 3일간 상세 결과는 후기를 남긴 사람(과 운영자)에게만
  const publicFrom = resultsPublicFrom(exam.date);
  const inWindow = today < publicFrom;
  const unlocked = admin || Boolean(mine) || !inWindow;
  const publicFromLabel = monthDay(publicFrom);
  const visibleComments = comments.filter((c) => c.status === 0).length;

  return (
    <>
      {exam.date === today && (
        <p className="mb-6 flex flex-wrap items-center gap-2 rounded-xl border border-ruby/40 bg-ev-doc-soft px-4 py-3 type-body-md text-ink">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-ruby px-2.5 py-0.5 type-caption font-semibold text-on-primary">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-on-primary motion-reduce:animate-none" />
            LIVE
          </span>
          {stats.count > 0 ? (
            <span>
              오늘 치른 시험이에요. 지금까지 <span className="tabular font-semibold text-ruby">{stats.count}명</span>이 후기를 남겼어요.
            </span>
          ) : (
            <span>오늘 치른 시험이에요. 첫 후기를 남기면 결과를 가장 먼저 볼 수 있어요.</span>
          )}
        </p>
      )}
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_400px]">
        <section id="review-form" className="scroll-mt-24 lg:order-2" aria-label="후기 남기기">
          <Card className="p-6 lg:sticky lg:top-24">
            <h2 className="type-heading-md text-ink">{mine ? "내 후기" : "30초 후기 남기기"}</h2>
            {!mine && (
              <p className="mt-1 mb-5 type-caption text-ink-mute">
                필수 질문은 2개뿐이에요. {inWindow ? "남기면 상세 결과가 바로 열려요." : "남기면 결과에 바로 반영돼요."}
              </p>
            )}
            <div className={mine ? "mt-4" : undefined}>
              <AttendGate
                examId={exam.id}
                question={`${monthDay(exam.date)} ${exam.companyName} ${exam.label}`}
                hasVoted={Boolean(mine)}
                inWindow={inWindow}
                publicFromLabel={publicFromLabel}
                askPopup={diffDays(exam.date, today) <= 14}
              >
                <ReviewForm exam={exam} initial={mine} />
              </AttendGate>
            </div>
          </Card>
        </section>

        <div className="min-w-0 space-y-6 lg:order-1">
          <Card className="p-6 md:p-8">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
              <h2 className="type-heading-md text-ink">응시자 체감 결과</h2>
              {inWindow && <span className="tag bg-brand-dark text-on-primary">응시자 우선 공개 · {publicFromLabel}까지</span>}
            </div>
            {unlocked ? (
              <ReviewResults stats={stats} />
            ) : (
              <LockedResults count={stats.count} overallAvg={stats.overallAvg} publicFromLabel={publicFromLabel} />
            )}
          </Card>

          <AdSlot slot={AD_SLOTS.inArticle} variant="inarticle" />

          <Card className="p-6 md:p-8">
            <h2 className="flex items-center gap-2 type-heading-md text-ink">
              <MessageSquareText className="h-5 w-5 text-ink-mute" strokeWidth={1.75} />
              한 줄 후기 <span className="tabular text-primary-text">{visibleComments}</span>
            </h2>
            {!unlocked ? (
              <p className="mt-4 flex items-start gap-2 rounded-lg bg-canvas-soft p-4 type-body-md text-ink-secondary">
                <Lock className="mt-1 h-4 w-4 shrink-0 text-ink-mute" strokeWidth={2} />
                <span>
                  {visibleComments ? `한 줄 후기 ${visibleComments}개는` : "한 줄 후기는"}{" "}
                  <span className="text-ink">{publicFromLabel}</span>부터 공개돼요. 응시자는 후기를 남기면 바로 볼 수 있어요.
                </span>
              </p>
            ) : comments.length === 0 ? (
              <p className="mt-4 type-body-md text-ink-mute">아직 남겨진 한 줄 후기가 없어요.</p>
            ) : (
              <ul className="mt-4 border-t border-hairline">
                {comments.map((c) => (
                  <li key={c.id} className={cn("border-b border-hairline py-4", c.status !== 0 && "opacity-60")}>
                    <div className="flex flex-wrap items-center gap-2 type-caption">
                      <span className={cn("tag", c.overall >= 4 ? "bg-ev-doc-soft text-ev-doc" : c.overall <= 2 ? "bg-ev-final-soft text-ev-final" : "bg-canvas-soft text-ink-secondary")}>
                        {OVERALL_OPTIONS.find((o) => o.value === c.overall)?.label}
                      </span>
                      {c.track && <span className="text-ink-mute">{c.track}</span>}
                      <span className="tabular text-ink-mute">{formatPostDateTime(c.createdAt)}</span>
                      {c.status !== 0 && <span className="tag bg-ev-doc-soft text-ev-doc">숨김</span>}
                      <span className="ml-auto">
                        <ReportButton type="review" id={c.id} small />
                      </span>
                    </div>
                    {c.oneLiner && <p className="mt-2 type-body-md !font-normal text-ink">{c.oneLiner}</p>}
                    {c.detail && (
                      <p className="mt-1.5 type-body-md whitespace-pre-wrap text-ink-secondary [overflow-wrap:anywhere]">{c.detail}</p>
                    )}
                    {admin && <ModerationBar type="review" id={c.id} status={c.status} compact className="mt-2" />}
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-4 type-micro text-ink-mute">
              문제 원문·복원 문항은 신고 대상이에요.{" "}
              <Link href="/board/policy" className="link">
                이용 수칙
              </Link>
            </p>
          </Card>

          <Card className="flex flex-col items-start gap-3 p-6 md:flex-row md:items-center md:justify-between">
            <p className="type-body-md text-ink-secondary">더 길게 이야기하고 싶다면 콩밭에 후기 글을 남겨 보세요.</p>
            <Link href={`/board/write?company=${exam.companyId}`} className="btn btn-secondary btn-sm">
              콩밭에 후기 쓰기
            </Link>
          </Card>
        </div>
      </div>
    </>
  );
}
