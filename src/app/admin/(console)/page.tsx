import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight } from "lucide-react";
import { DailyChart } from "@/components/admin/DailyChart";
import { AdminCard, AdminPageTitle, StatTile, StatusTag, changePct, formatDuration, nf } from "@/components/admin/parts";
import { AdminSkeleton } from "@/components/admin/Skeleton";
import { CategoryTag } from "@/components/board/parts";
import { DbSection } from "@/components/db/DbSection";
import { formatPostDateTime } from "@/lib/board-meta";
import { getCompany } from "@/lib/data";
import { FEEDBACK_KINDS } from "@/lib/feedback-meta";
import { OVERALL_OPTIONS } from "@/lib/review-meta";
import { adminPosts, adminReviews, dashboardCounts, requireAdmin } from "@/lib/server/admin";
import { activeNow, daily, lastDays, previousRange, summary } from "@/lib/server/analytics";
import { ISSUE_META, scheduleIssues, type IssueKey } from "@/lib/server/data-check";
import { listFeedback } from "@/lib/server/feedback";
import { getExam } from "@/lib/server/reviews";

export const metadata = { title: "대시보드" };

export default function AdminDashboardPage() {
  return (
    <DbSection noticeTitle="DB가 연결되지 않았어요 (DATABASE_URL 확인)">
      <Suspense fallback={<AdminSkeleton />}>
        <Dashboard />
      </Suspense>
    </DbSection>
  );
}

async function Dashboard() {
  await requireAdmin();
  const today = lastDays(1);
  const week = lastDays(7);
  const [counts, now, sToday, sYesterday, sWeek, sPrevWeek, days, feedback, posts, reviews] = await Promise.all([
    dashboardCounts(),
    activeNow(),
    summary(today),
    summary(previousRange(today)),
    summary(week),
    summary(previousRange(week)),
    daily(week),
    listFeedback(),
    adminPosts({ status: "all", page: 1 }),
    adminReviews({ status: "all", textOnly: true, page: 1 }),
  ]);
  const issues = scheduleIssues();
  const issueKeys = (Object.keys(ISSUE_META) as IssueKey[]).filter((k) => issues.counts[k] > 0);

  return (
    <>
      <AdminPageTitle title="대시보드" desc="오늘 사이트 상황과 처리할 일을 한눈에 봅니다." />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="지금 보고 있는 사람" value={nf.format(now)} sub="최근 5분" />
        <StatTile
          label="오늘 방문자"
          value={nf.format(sToday.visitors)}
          delta={changePct(sToday.visitors, sYesterday.visitors)}
          sub="어제 대비"
          href="/admin/analytics?range=1"
        />
        <StatTile label="오늘 조회수" value={nf.format(sToday.views)} delta={changePct(sToday.views, sYesterday.views)} sub="어제 대비" />
        <StatTile
          label="7일 방문자"
          value={nf.format(sWeek.visitors)}
          delta={changePct(sWeek.visitors, sPrevWeek.visitors)}
          sub={`평균 ${formatDuration(sWeek.avgViewMs)} 머묾`}
          href="/admin/analytics"
        />
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile
          label="새 제보·의견"
          value={nf.format(counts.openFeedback)}
          tone={counts.openFeedback ? "alert" : "default"}
          sub="처리 대기"
          href="/admin/feedback"
        />
        <StatTile
          label="신고 대기"
          value={nf.format(counts.reported)}
          tone={counts.reported ? "alert" : "default"}
          sub="글·댓글·후기"
          href="/admin/reports"
        />
        <StatTile label="24시간 새 글·댓글" value={`${nf.format(counts.posts24)} · ${nf.format(counts.comments24)}`} sub="콩밭" href="/admin/posts" />
        <StatTile label="24시간 새 필기 후기" value={nf.format(counts.reviews24)} sub={`누적 ${nf.format(counts.reviews)}건`} href="/admin/reviews" />
      </div>

      <AdminCard title="최근 7일 방문자" aside={<Link href="/admin/analytics" className="link type-caption">자세히 보기</Link>}>
        <DailyChart points={days} />
      </AdminCard>

      <div className="grid gap-6 xl:grid-cols-2">
        <AdminCard title="새 제보·의견" aside={<Link href="/admin/feedback" className="link type-caption">전체</Link>}>
          {feedback.open.length === 0 ? (
            <p className="type-body-md text-ink-mute">새로 들어온 제보가 없어요.</p>
          ) : (
            <ul className="divide-y divide-hairline">
              {feedback.open.slice(0, 4).map((f) => (
                <li key={f.id} className="py-3">
                  <p className="flex flex-wrap items-center gap-2 type-caption text-ink-mute">
                    <span className="tag bg-canvas-soft text-ink-secondary">{FEEDBACK_KINDS[f.kind].label}</span>
                    {f.companyId ? getCompany(f.companyId)?.name : f.companyName}
                    <span className="tabular">{formatPostDateTime(f.createdAt)}</span>
                  </p>
                  <p className="mt-1 line-clamp-2 type-body-md text-ink">{f.body}</p>
                </li>
              ))}
            </ul>
          )}
        </AdminCard>

        <AdminCard title="일정 데이터 점검" aside={<Link href="/admin/data" className="link type-caption">목록 보기</Link>}>
          {issueKeys.length === 0 ? (
            <p className="type-body-md text-ink-mute">눈에 띄는 빈 곳이 없어요.</p>
          ) : (
            <ul className="space-y-2">
              {issueKeys.map((k) => (
                <li key={k}>
                  <Link href={`/admin/data?issue=${k}`} className="flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-canvas-soft">
                    <span className={`tag ${ISSUE_META[k].tone}`}>{ISSUE_META[k].label}</span>
                    <span className="min-w-0 flex-1 truncate type-caption text-ink-mute">{ISSUE_META[k].desc}</span>
                    <span className="tabular type-body-md text-ink">{issues.counts[k]}곳</span>
                    <ArrowRight className="h-3.5 w-3.5 text-ink-mute" strokeWidth={1.75} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </AdminCard>

        <AdminCard title="최근 콩밭 글" aside={<Link href="/admin/posts" className="link type-caption">관리</Link>}>
          {posts.rows.length === 0 ? (
            <p className="type-body-md text-ink-mute">아직 글이 없어요.</p>
          ) : (
            <ul className="divide-y divide-hairline">
              {posts.rows.slice(0, 6).map((p) => (
                <li key={p.id} className="flex items-center gap-2 py-2.5">
                  <CategoryTag category={p.category} />
                  <Link href={`/board/${p.id}`} className="min-w-0 flex-1 truncate type-body-md text-ink hover:underline">
                    {p.title}
                  </Link>
                  {p.status !== 0 && <StatusTag status={p.status} />}
                  <span className="tabular type-micro text-ink-mute">{formatPostDateTime(p.createdAt).slice(5)}</span>
                </li>
              ))}
            </ul>
          )}
        </AdminCard>

        <AdminCard title="최근 한 줄 후기" aside={<Link href="/admin/reviews" className="link type-caption">관리</Link>}>
          {reviews.rows.length === 0 ? (
            <p className="type-body-md text-ink-mute">아직 글로 남긴 후기가 없어요.</p>
          ) : (
            <ul className="divide-y divide-hairline">
              {reviews.rows.slice(0, 6).map((r) => {
                const exam = getExam(r.examId);
                return (
                  <li key={r.id} className="py-2.5">
                    <p className="flex flex-wrap items-center gap-2 type-micro text-ink-mute">
                      <span>{exam ? `${exam.shortName} ${exam.label}` : r.examId}</span>
                      <span>· {OVERALL_OPTIONS.find((o) => o.value === r.overall)?.label}</span>
                      {r.status !== 0 && <StatusTag status={r.status} />}
                    </p>
                    <p className="mt-0.5 truncate type-body-md text-ink">{r.oneLiner ?? r.detail}</p>
                  </li>
                );
              })}
            </ul>
          )}
        </AdminCard>
      </div>

      {counts.hidden > 0 && (
        <p className="type-caption text-ink-mute">
          숨김 상태인 콘텐츠 {nf.format(counts.hidden)}건 · 차단한 작성자 {nf.format(counts.bans)}명
        </p>
      )}
    </>
  );
}
