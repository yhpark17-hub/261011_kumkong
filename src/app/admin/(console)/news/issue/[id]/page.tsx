import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft, ExternalLink, PenLine } from "lucide-react";
import { issueAction } from "@/app/admin/issue-actions";
import { IssueForm } from "@/components/admin/IssueForm";
import { ConfirmForm } from "@/components/admin/ModerationForm";
import { AdminCard, AdminPageTitle, EmptyRow } from "@/components/admin/parts";
import { AdminSkeleton } from "@/components/admin/Skeleton";
import { DbSection } from "@/components/db/DbSection";
import { NewsSectionTag } from "@/components/magazine/news";
import { formatDayHeading } from "@/lib/date";
import { letterHref, volLabel, type NewsItem } from "@/lib/news-meta";
import { requireAdmin } from "@/lib/server/admin";
import { arrangeLetter, getIssueById, issueItems } from "@/lib/server/briefing";

export const metadata = { title: "레터 편집" };

export default function EditIssuePage({ params }: PageProps<"/admin/news/issue/[id]">) {
  return (
    <DbSection noticeTitle="DB가 연결되지 않았어요 (DATABASE_URL 확인)">
      <Suspense fallback={<AdminSkeleton />}>{params.then(({ id }) => <EditIssue rawId={id} />)}</Suspense>
    </DbSection>
  );
}

async function EditIssue({ rawId }: { rawId: string }) {
  await requireAdmin();
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const issue = await getIssueById(id);
  if (!issue) notFound();
  const content = arrangeLetter(await issueItems(issue.date, { admin: true }));
  const groups: { label: string; desc: string; list: NewsItem[] }[] = [
    { label: "헤드라인", desc: "맨 위에 가장 크게", list: content.headline ? [content.headline] : [] },
    { label: "핵심 기사", desc: "'오늘 꼭 알아야 할 3가지'에 헤드라인과 함께 들어가요", list: content.key },
    { label: "한 줄 뉴스", desc: "제목과 한 줄 요약만", list: content.brief },
    { label: "오늘의 용어 · 면접 질문", desc: "레터 끝 공부 코너", list: [content.term, content.question].filter((n): n is NewsItem => Boolean(n)) },
  ];

  return (
    <>
      <Link href="/admin/news" className="link inline-flex items-center gap-1 type-caption">
        <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
        데일리 브리핑
      </Link>
      <AdminPageTitle
        title={`레터 편집 · ${volLabel(issue.vol)}`}
        desc={`${formatDayHeading(issue.date)} · ${issue.status === 1 ? "발행됨" : "발행 대기"}${issue.origin === "auto" ? " · 자동 점검이 만든 초안" : ""}`}
        aside={
          <div className="flex flex-wrap gap-2">
            <Link href={letterHref(issue.date)} target="_blank" className="btn btn-sm btn-toggle">
              <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.75} />
              미리보기
            </Link>
            <ConfirmForm action={issueAction}>
              {issue.status === 0 ? (
                <button
                  type="submit"
                  name="target"
                  value={`publish:${issue.id}`}
                  data-confirm="이 레터를 발행할까요? 그날 기사 초안도 모두 공개돼요."
                  className="btn btn-sm btn-primary"
                >
                  발행
                </button>
              ) : (
                <button type="submit" name="target" value={`unpublish:${issue.id}`} data-confirm="레터를 내릴까요? 그날 기사도 다시 초안이 돼요." className="btn btn-sm btn-toggle">
                  내리기
                </button>
              )}
            </ConfirmForm>
          </div>
        }
      />

      <AdminCard>
        <IssueForm key={issue.updatedAt} initial={{ id: issue.id, date: issue.date, title: issue.title, lede: issue.lede, closing: issue.closing }} />
      </AdminCard>

      <AdminCard>
        <h2 className="type-heading-sm text-ink">실린 기사 · {content.all.length + (content.term ? 1 : 0) + (content.question ? 1 : 0)}건</h2>
        <p className="mt-1 type-caption text-ink-mute">
          순서·비중(핵심/한 줄)·한 줄 요약은 기사마다 &lsquo;편집&rsquo;에서 바꿀 수 있어요. 빼고 싶은 기사는 발행 전에 지워 주세요.
        </p>
        {content.all.length === 0 && !content.term && !content.question ? (
          <div className="mt-3">
            <EmptyRow>이 날짜로 쓴 브리핑 기사가 없어요.</EmptyRow>
          </div>
        ) : (
          groups
            .filter((g) => g.list.length)
            .map((g) => (
              <div key={g.label} className="mt-5">
                <p className="type-caption font-semibold text-ink-secondary">
                  {g.label} <span className="font-normal text-ink-mute">· {g.desc}</span>
                </p>
                <ul className="mt-1 divide-y divide-hairline">
                  {g.list.map((n) => (
                    <li key={n.id} className="flex items-start gap-3 py-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <NewsSectionTag section={n.section} />
                          {n.status === 1 ? <span className="tag bg-ev-final-soft text-ev-final">공개</span> : <span className="tag bg-canvas-soft text-ink-secondary">초안</span>}
                          <span className="tabular type-micro text-ink-mute">순서 {n.position}</span>
                        </div>
                        <p className="mt-1 type-body-md font-semibold text-ink">{n.title}</p>
                        {n.takeaway ? (
                          <p className="mt-0.5 type-caption text-ink-secondary">한 줄 요약: {n.takeaway}</p>
                        ) : (
                          n.section !== "term" && n.section !== "question" && <p className="mt-0.5 type-caption text-ev-doc">한 줄 요약이 비었어요</p>
                        )}
                      </div>
                      <Link href={`/admin/news/${n.id}`} className="inline-flex shrink-0 items-center gap-1 rounded-full border border-hairline px-2.5 py-1 type-micro text-ink-secondary hover:border-hairline-input">
                        <PenLine className="h-3 w-3" strokeWidth={1.75} />
                        편집
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))
        )}
      </AdminCard>

      <ConfirmForm action={issueAction} className="flex justify-end">
        <button type="submit" name="target" value={`delete:${issue.id}`} data-confirm="레터를 지울까요? 그날 기사는 초안으로 남아요." className="btn btn-sm btn-toggle text-ev-doc">
          레터 지우기
        </button>
      </ConfirmForm>
    </>
  );
}
