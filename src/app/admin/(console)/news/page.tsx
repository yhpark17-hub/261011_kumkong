import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { Eye, Mail, PenLine, Star } from "lucide-react";
import { issueAction, toggleAutoPublish } from "@/app/admin/issue-actions";
import { newsAction } from "@/app/admin/news-actions";
import { BulkForm, ConfirmForm, RowCheck } from "@/components/admin/ModerationForm";
import { AdminCard, AdminPageTitle, BulkButton, EmptyRow, RowButton, StatTile, listHref, nf } from "@/components/admin/parts";
import { AdminSkeleton } from "@/components/admin/Skeleton";
import { DbSection } from "@/components/db/DbSection";
import { NewsSectionTag, newsTitle } from "@/components/magazine/news";
import { cn } from "@/components/ui";
import { formatDayHeading, todayKST } from "@/lib/date";
import { EDITION_LABEL, NEWS_SECTIONS, isDateKey, isNewsSection, kindOf, letterHref, newsHref, shareImageUrl, volLabel, type NewsItem } from "@/lib/news-meta";
import { adminListIssues, autoPublishOn, type AdminIssueRow } from "@/lib/server/briefing";
import { requireAdmin } from "@/lib/server/admin";
import { adminListNews, newsAdminCounts, type AdminNewsFilter } from "@/lib/server/news";

export const metadata = { title: "데일리 브리핑" };

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

const FILTERS: [AdminNewsFilter, string][] = [
  ["draft", "검토 대기 초안"],
  ["published", "공개 중"],
  ["all", "전체"],
];

export default function AdminNewsPage({ searchParams }: PageProps<"/admin/news">) {
  return (
    <DbSection noticeTitle="DB가 연결되지 않았어요 (DATABASE_URL 확인)">
      <Suspense fallback={<AdminSkeleton />}>{searchParams.then((sp) => <NewsAdmin sp={sp} />)}</Suspense>
    </DbSection>
  );
}

async function NewsAdmin({ sp }: { sp: SP }) {
  await requireAdmin();
  await connection();
  const filter = (FILTERS.find(([k]) => k === one(sp.filter))?.[0] ?? "draft") as AdminNewsFilter;
  const date = isDateKey(one(sp.date)) ? one(sp.date) : null;
  const q = one(sp.q).trim().slice(0, 40) || null;
  const section = isNewsSection(one(sp.c)) ? (one(sp.c) as NewsItem["section"]) : null;
  const today = todayKST();
  const [items, counts, issues, autoOn] = await Promise.all([adminListNews({ filter, date, q, section }), newsAdminCounts(today), adminListIssues(30), autoPublishOn()]);
  const draftIssues = issues.filter((r) => r.issue.status === 0).length;
  const groups = [...new Set(items.map((n) => n.editionDate))].map((d) => ({ date: d, list: items.filter((n) => n.editionDate === d) }));

  return (
    <>
      <AdminPageTitle
        title="데일리 브리핑"
        desc={
          autoOn
            ? "금콩 브리핑(아침 6시 — 그림 + 카드뉴스 기사)과 금콩 스터디(낮 12시 30분 — 숫자·용어·논술·면접·퀴즈)가 매일 한 호씩, 자동 점검이 만들면 바로 발행돼요."
            : "금콩 브리핑(아침판 — 그림 + 카드뉴스 기사)과 금콩 스터디(점심판 — 숫자·용어·논술·면접·퀴즈)가 매일 한 호씩 나가요. 자동 점검이 초안을 만들면 미리보기로 확인하고 '발행'을 누르세요."
        }
        aside={
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/news/issue/new" className="btn btn-sm btn-primary">
              <Mail className="h-4 w-4" strokeWidth={1.75} />
              브리핑 만들기
            </Link>
            <Link href="/admin/news/new" className="btn btn-sm btn-secondary">
              <PenLine className="h-4 w-4" strokeWidth={1.75} />
              기사 쓰기
            </Link>
          </div>
        }
      />

      <form action={toggleAutoPublish} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-hairline bg-canvas px-4 py-3">
        <input type="hidden" name="on" value={autoOn ? "0" : "1"} />
        <p className="flex items-center gap-2 type-body-md text-ink">
          <span className={cn("inline-flex h-2.5 w-2.5 rounded-full", autoOn ? "bg-ev-final" : "bg-ink-mute-2")} aria-hidden />
          <span className="font-semibold">자동 발행 {autoOn ? "켜짐" : "꺼짐"}</span>
          <span className="type-caption text-ink-mute">
            {autoOn ? "아침 6시 브리핑·낮 12시 30분 스터디가 확인 없이 바로 올라가요" : "자동 점검이 만든 브리핑은 초안으로 기다려요"}
          </span>
        </p>
        <button type="submit" className={cn("btn btn-sm", autoOn ? "btn-secondary" : "btn-primary")}>
          {autoOn ? "자동 발행 끄기" : "자동 발행 켜기"}
        </button>
      </form>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <StatTile label="발행 대기 브리핑" value={nf.format(draftIssues)} tone={draftIssues ? "alert" : "default"} href="#letters" />
        <StatTile label="검토 대기 기사" value={nf.format(counts.drafts)} tone={counts.drafts ? "alert" : "default"} href={listHref("/admin/news", { filter: "draft" })} />
        <StatTile label="오늘 공개 기사" value={nf.format(counts.todayPublished)} sub={formatDayHeading(today)} href={listHref("/admin/news", { filter: "published", date: today })} />
      </div>

      <AdminCard>
        <h2 id="letters" className="type-heading-sm text-ink">
          브리핑 (호)
        </h2>
        <p className="mt-1 type-caption text-ink-mute">발행하면 그 호에 실린 기사 초안도 함께 공개돼요. 빼고 싶은 기사는 아래 목록에서 먼저 지워 주세요.</p>
        {issues.length === 0 ? (
          <div className="mt-3">
            <EmptyRow>아직 브리핑이 없어요. 자동 점검이 아침 6시·낮 12시 30분에 초안을 만들어요.</EmptyRow>
          </div>
        ) : (
          <ul className="mt-3 divide-y divide-hairline">
            {issues.map((r) => (
              <IssueRow key={r.issue.id} r={r} />
            ))}
          </ul>
        )}
      </AdminCard>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="no-scrollbar fade-x -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0 md:fade-x-none">
          {FILTERS.map(([key, label]) => (
            <Link key={key} href={listHref("/admin/news", { filter: key, date, q, c: section })} className={cn("btn btn-sm shrink-0", filter === key ? "btn-on-dark" : "btn-toggle")}>
              {label}
            </Link>
          ))}
        </div>
        <form action="/admin/news" className="flex flex-wrap gap-2">
          <input type="hidden" name="filter" value={filter} />
          <select name="c" defaultValue={section ?? ""} className="input" aria-label="카테고리">
            <option value="">모든 카테고리</option>
            {NEWS_SECTIONS.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
          <input type="date" name="date" defaultValue={date ?? ""} className="input" aria-label="브리핑 날짜" />
          <input name="q" defaultValue={q ?? ""} placeholder="제목·요약 검색" className="input min-w-0 flex-1 md:w-44" aria-label="검색" />
          <button type="submit" className="btn btn-sm btn-toggle shrink-0">
            찾기
          </button>
        </form>
      </div>

      <AdminCard>
        {items.length === 0 ? (
          <EmptyRow>{filter === "draft" ? "검토할 초안이 없어요." : "조건에 맞는 항목이 없어요."}</EmptyRow>
        ) : (
          <BulkForm
            action={newsAction}
            toolbar={
              <>
                <BulkButton value="publish">선택 공개</BulkButton>
                <BulkButton value="unpublish">선택 내리기</BulkButton>
                <BulkButton value="delete" danger confirm="선택한 항목을 지울까요? 되돌릴 수 없어요.">
                  선택 삭제
                </BulkButton>
              </>
            }
          >
            {groups.map((g) => (
              <div key={g.date} className="mt-4">
                <p className="type-caption font-semibold text-ink-secondary">
                  {formatDayHeading(g.date)} <span className="font-normal text-ink-mute">· {g.list.length}건</span>
                </p>
                <ul className="mt-1 divide-y divide-hairline">
                  {g.list.map((n) => (
                    <Row key={n.id} n={n} />
                  ))}
                </ul>
              </div>
            ))}
          </BulkForm>
        )}
      </AdminCard>
    </>
  );
}

function Row({ n }: { n: NewsItem }) {
  return (
    <li className="flex gap-3 py-3">
      <RowCheck id={n.id} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <NewsSectionTag section={n.section} />
          <span className="tag bg-canvas-soft text-ink-secondary">{kindOf(n.section) === "news" ? (n.edition === "morning" ? "금콩 브리핑" : "판 없음 · 안 실림") : "금콩 스터디"}</span>
          {n.status === 1 ? <span className="tag bg-ev-final-soft text-ev-final">공개</span> : <span className="tag bg-canvas-soft text-ink-secondary">초안</span>}
          {n.origin === "auto" && <span className="tag bg-canvas-cream text-lemon">자동</span>}
          {n.headline && (
            <span className="tag bg-brand-dark text-on-primary">
              <Star className="h-3 w-3" strokeWidth={2} />
              헤드라인
            </span>
          )}
        </div>
        <Link href={`/admin/news/${n.id}`} className="mt-1 block type-body-md font-semibold text-ink hover:underline">
          {newsTitle(n)}
        </Link>
        <p className="mt-0.5 line-clamp-2 type-caption text-ink-secondary">{n.summary}</p>
        <p className="mt-1 flex flex-wrap items-center gap-x-3 type-micro text-ink-mute">
          {n.sourceName && <span>{n.sourceName}</span>}
          <span className="inline-flex items-center gap-1 tabular">
            <Eye className="h-3 w-3" strokeWidth={1.75} />
            {nf.format(n.views)}
          </span>
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1.5 sm:flex-row sm:items-start">
        <Link href={`/admin/news/${n.id}`} className="rounded-full border border-hairline px-2.5 py-1 type-micro text-ink-secondary hover:border-hairline-input">
          편집
        </Link>
        <Link href={newsHref(n.id)} target="_blank" className="rounded-full border border-hairline px-2.5 py-1 type-micro text-ink-secondary hover:border-hairline-input">
          보기
        </Link>
        {n.status === 0 ? <RowButton value={`publish:${n.id}`}>공개</RowButton> : <RowButton value={`unpublish:${n.id}`}>내리기</RowButton>}
        {!n.headline && kindOf(n.section) === "news" && <RowButton value={`headline:${n.id}`}>헤드라인</RowButton>}
      </div>
    </li>
  );
}

function IssueRow({ r }: { r: AdminIssueRow }) {
  const { issue } = r;
  // 카톡·SNS 공유 썸네일 — 운영자에게는 발행 전 초안도 그려 줘요 (고친 뒤 새로 그리게 수정 시각을 붙임)
  const og = shareImageUrl(issue);
  return (
    <li className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start">
      <a href={og} target="_blank" title="공유 썸네일 크게 보기" className="block w-full shrink-0 overflow-hidden rounded-lg border border-hairline sm:w-44">
        {/* eslint-disable-next-line @next/next/no-img-element -- 그때그때 그리는 공유 썸네일 */}
        <img src={og} alt={`${EDITION_LABEL[issue.edition]} 공유 썸네일 미리보기`} loading="lazy" className="aspect-[1200/630] w-full bg-canvas-soft object-cover" />
      </a>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          {issue.status === 1 ? <span className="tag bg-ev-final-soft text-ev-final">발행</span> : <span className="tag bg-ev-doc-soft text-ev-doc">발행 대기</span>}
          {issue.origin === "auto" && <span className="tag bg-canvas-cream text-lemon">자동</span>}
          {issue.thumb.checked ? (
            <span className="tag bg-ev-final-soft text-ev-final">썸네일 확인함</span>
          ) : (
            <Link href={`/admin/news/issue/${issue.id}#thumb`} className="tag bg-ev-doc-soft text-ev-doc hover:underline">
              썸네일 확인 전
            </Link>
          )}
          <span className="tabular type-caption text-ink-mute">
            {formatDayHeading(issue.date)} {EDITION_LABEL[issue.edition]} · {volLabel(issue.vol)} · {issue.edition === "morning" ? "기사" : "용어·질문"} {r.items}건{r.drafts ? ` (초안 ${r.drafts})` : ""}
          </span>
          {issue.status === 1 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-canvas-soft px-2 py-0.5 tabular type-caption font-semibold text-ink-secondary">
              <Eye className="h-3.5 w-3.5" strokeWidth={1.75} />
              조회 {nf.format(issue.views)}
            </span>
          )}
        </div>
        <Link href={`/admin/news/issue/${issue.id}`} className="mt-1 block type-body-md font-semibold text-ink hover:underline">
          {issue.title}
        </Link>
        {issue.lede && <p className="mt-0.5 line-clamp-2 type-caption text-ink-secondary">{issue.lede}</p>}
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-1.5">
        <Link href={letterHref(issue.date, issue.edition)} target="_blank" className="rounded-full border border-hairline px-2.5 py-1 type-micro text-ink-secondary hover:border-hairline-input">
          미리보기
        </Link>
        <Link href={`/admin/news/issue/${issue.id}`} className="rounded-full border border-hairline px-2.5 py-1 type-micro text-ink-secondary hover:border-hairline-input">
          편집
        </Link>
        <Link href={listHref("/admin/news", { filter: "all", date: issue.date })} className="rounded-full border border-hairline px-2.5 py-1 type-micro text-ink-secondary hover:border-hairline-input">
          기사 보기
        </Link>
        {issue.status === 0 ? (
          <ConfirmForm action={issueAction}>
            <button
              type="submit"
              name="target"
              value={`publish:${issue.id}`}
              data-confirm={`${formatDayHeading(issue.date)} ${EDITION_LABEL[issue.edition]} 호를 발행할까요? 실린 기사 초안도 모두 공개돼요.`}
              className="btn btn-sm btn-primary"
            >
              발행
            </button>
          </ConfirmForm>
        ) : (
          <ConfirmForm action={issueAction}>
            <button type="submit" name="target" value={`unpublish:${issue.id}`} data-confirm="브리핑을 내릴까요? 실린 기사도 다시 초안이 돼요." className="btn btn-sm btn-toggle">
              내리기
            </button>
          </ConfirmForm>
        )}
      </div>
    </li>
  );
}
