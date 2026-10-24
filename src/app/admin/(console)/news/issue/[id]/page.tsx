import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft, ExternalLink, PenLine } from "lucide-react";
import { issueAction } from "@/app/admin/issue-actions";
import { IssueForm } from "@/components/admin/IssueForm";
import { ThumbForm } from "@/components/admin/ThumbForm";
import { ConfirmForm } from "@/components/admin/ModerationForm";
import { AdminCard, AdminPageTitle, EmptyRow } from "@/components/admin/parts";
import { AdminSkeleton } from "@/components/admin/Skeleton";
import { DbSection } from "@/components/db/DbSection";
import { NewsSectionTag } from "@/components/magazine/news";
import { formatDayHeading } from "@/lib/date";
import { EDITION_LABEL, EMPTY_THUMB, letterHref, letterShareHref, studyTopic, volLabel, type NewsItem } from "@/lib/news-meta";
import { SITE } from "@/lib/site";
import { requireAdmin } from "@/lib/server/admin";
import { arrangeLetter, getIssueById, issueItems } from "@/lib/server/briefing";
import { comicPlan, splitTitle } from "@/lib/server/briefing-og";

export const metadata = { title: "브리핑 편집" };

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
  const items = await issueItems(issue.date, issue.edition, { admin: true });
  const content = arrangeLetter(items);
  // 썸네일 칸을 비워 두면 무엇으로 그려지는지 (관리자 화면에 '자동 — …'로 보여 줌)
  const comicAuto = comicPlan(issue, EMPTY_THUMB, content.headline?.title ?? "", content.stories.map((n) => n.title)).auto;
  const thumbAuto = { ...comicAuto, topic: studyTopic(EMPTY_THUMB, issue.extras) || splitTitle(issue.title)[0] };
  const groups: { label: string; desc: string; list: NewsItem[] }[] =
    issue.edition === "morning"
      ? [
          { label: "헤드라인", desc: "01 — 맨 위에 가장 크게", list: content.headline ? [content.headline] : [] },
          { label: "기사", desc: "02부터 순서대로 · 앞의 둘은 '오늘 꼭 알아야 할 3가지'에", list: content.stories },
        ]
      : [
          { label: "오늘의 용어", desc: "", list: content.terms },
          { label: "오늘의 면접 질문", desc: "", list: content.questions },
        ];
  const total = groups.reduce((s, g) => s + g.list.length, 0);

  return (
    <>
      <Link href="/admin/news" className="link inline-flex items-center gap-1 type-caption">
        <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
        데일리 브리핑
      </Link>
      <AdminPageTitle
        title={`${EDITION_LABEL[issue.edition]} 편집 · ${volLabel(issue.vol)}`}
        desc={`${formatDayHeading(issue.date)} · ${issue.status === 1 ? "발행됨" : "발행 대기"}${issue.origin === "auto" ? " · 자동 점검이 만든 초안" : ""}`}
        aside={
          <div className="flex flex-wrap gap-2">
            <Link href={letterHref(issue.date, issue.edition)} target="_blank" className="btn btn-sm btn-toggle">
              <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.75} />
              미리보기
            </Link>
            <ConfirmForm action={issueAction}>
              {issue.status === 0 ? (
                <button
                  type="submit"
                  name="target"
                  value={`publish:${issue.id}`}
                  data-confirm="이 브리핑을 발행할까요? 실린 기사 초안도 모두 공개돼요."
                  className="btn btn-sm btn-primary"
                >
                  발행
                </button>
              ) : (
                <button type="submit" name="target" value={`unpublish:${issue.id}`} data-confirm="브리핑을 내릴까요? 실린 기사도 다시 초안이 돼요." className="btn btn-sm btn-toggle">
                  내리기
                </button>
              )}
            </ConfirmForm>
          </div>
        }
      />

      <AdminCard>
        <IssueForm
          key={issue.updatedAt}
          initial={{
            id: issue.id,
            date: issue.date,
            edition: issue.edition,
            title: issue.title,
            lede: issue.lede,
            closing: issue.closing,
            quiz: issue.quiz,
            extras: issue.extras,
          }}
        />
      </AdminCard>

      <AdminCard>
        <h2 id="thumb" className="scroll-mt-24 type-heading-sm text-ink">
          썸네일 · 채팅방 공유 그림과 사이트 표지
        </h2>
        <p className="mt-1 mb-5 type-caption text-ink-mute">
          {issue.edition === "morning"
            ? "금콩 브리핑은 콩이가 오늘 주제로 변장해 말풍선으로 한마디 하는 만화예요. 비워 두면 제목으로 자동으로 그려요."
            : "금콩 스터디는 공책 템플릿에 오늘의 논술 주제만 바뀌어요. 길면 칸에 맞게 글자 크기를 줄여요."}{" "}
          발행 전에 확인하고 &lsquo;썸네일 확인함&rsquo;을 눌러 두세요.
        </p>
        <ThumbForm id={issue.id} edition={issue.edition} date={issue.date} views={issue.views} initial={issue.thumb} auto={thumbAuto} />
        {/* 카톡은 한 번 읽은 주소의 미리보기를 한동안 그대로 써요 — 버전이 붙은 주소로 보내면 새 그림이 떠요 */}
        <div className="mt-5 space-y-1.5 rounded-lg bg-canvas-soft p-3 type-caption text-ink-secondary">
          <p>
            <span className="font-semibold text-ink">카톡 공유용 주소</span> — 썸네일을 저장할 때마다 끝의 번호가 바뀌어, 이 주소로 보내면 카톡도 새 썸네일을 가져가요.
            브리핑 화면의 주소창·공유 버튼도 이 주소를 써요.
          </p>
          <a href={letterShareHref(issue)} target="_blank" className="link block break-all tabular">
            {SITE.url}
            {letterShareHref(issue)}
          </a>
          <p className="text-ink-mute">
            예전에 이미 보낸 주소의 미리보기는 카카오가 한동안 기억해요. 바로 바꾸려면{" "}
            <a href="https://developers.kakao.com/tool/debugger/sharing" target="_blank" rel="noopener noreferrer" className="link">
              카카오 공유 디버거
            </a>
            에 그 주소를 넣고 &lsquo;캐시 초기화&rsquo;를 눌러 주세요 (카카오 계정 로그인 필요).
          </p>
        </div>
      </AdminCard>

      <AdminCard>
        <h2 className="type-heading-sm text-ink">실린 {issue.edition === "morning" ? "기사" : "용어·면접 질문"} · {total}건</h2>
        <p className="mt-1 type-caption text-ink-mute">
          순서·한 줄 요약은 기사마다 &lsquo;편집&rsquo;에서 바꿀 수 있어요. 빼고 싶은 기사는 발행 전에 지우거나 판을 바꿔 주세요.
        </p>
        {total === 0 ? (
          <div className="mt-3">
            <EmptyRow>이 날짜·판으로 쓴 기사가 없어요.</EmptyRow>
          </div>
        ) : (
          groups
            .filter((g) => g.list.length)
            .map((g) => (
              <div key={g.label} className="mt-5">
                <p className="type-caption font-semibold text-ink-secondary">
                  {g.label} {g.desc && <span className="font-normal text-ink-mute">· {g.desc}</span>}
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
                          issue.edition === "morning" && <p className="mt-0.5 type-caption text-ev-doc">한 줄 요약이 비었어요</p>
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
        <button type="submit" name="target" value={`delete:${issue.id}`} data-confirm="브리핑을 지울까요? 기사는 초안으로 남아요." className="btn btn-sm btn-toggle text-ev-doc">
          브리핑 지우기
        </button>
      </ConfirmForm>
    </>
  );
}
