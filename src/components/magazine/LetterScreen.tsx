import Link from "next/link";
import { ChevronLeft, ChevronRight, PenLine } from "lucide-react";
import { formatShort } from "@/lib/date";
import { BRIEFING_ARCHIVE, letterHref, volLabel, type BriefingIssue, type NewsItem, type NewsSection } from "@/lib/news-meta";
import type { LetterContent } from "@/lib/server/briefing";
import { AdSlot } from "../ads/AdSlot";
import { cn } from "../ui";
import { AD_SLOTS } from "@/lib/site";
import { IssueViewRecorder } from "./interactive";
import { Letter } from "./Letter";
import { NewsCategoryNav, PopularNews } from "./news";

/** 레터 한 호 + 옆 칸(지난 레터·많이 본 기사) — 브리핑 첫 화면과 호별 페이지가 함께 씀 */
export function LetterScreen({
  issue,
  content,
  admin,
  recent,
  popular,
  around,
  counts,
}: {
  issue: BriefingIssue;
  content: LetterContent;
  admin: boolean;
  recent: BriefingIssue[];
  popular: NewsItem[];
  around: { prev: BriefingIssue | null; next: BriefingIssue | null };
  counts: Map<NewsSection, number>;
}) {
  const nav = "inline-flex min-w-0 items-center gap-1.5 rounded-full border border-hairline px-3.5 py-2 type-caption text-ink-secondary hover:border-hairline-input";
  return (
    <div className="mt-8">
      {issue.live && <IssueViewRecorder id={issue.id} />}
      <NewsCategoryNav active={null} counts={counts} />

      {admin && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-canvas-cream px-4 py-3">
          <p className="type-caption text-ink-secondary">
            {issue.live ? "운영자 화면 — 발행된 레터예요." : "미리보기 — 아직 초안이라 독자에게는 보이지 않아요. 초안 기사도 함께 보여요."}
          </p>
          <Link href={`/admin/news/issue/${issue.id}`} className="btn btn-sm btn-secondary">
            <PenLine className="h-3.5 w-3.5" strokeWidth={1.75} />
            레터 관리
          </Link>
        </div>
      )}

      <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0">
          <div className="mx-auto max-w-[760px]">
            <Letter issue={issue} content={content} />
            {(around.prev || around.next) && (
              <nav aria-label="다른 호" className="mt-6 flex items-center justify-between gap-3">
                {around.prev ? (
                  <Link href={letterHref(around.prev.date)} className={nav}>
                    <ChevronLeft className="h-4 w-4 shrink-0" strokeWidth={2} />
                    <span className="truncate">
                      이전 호 · {volLabel(around.prev.vol)} {formatShort(around.prev.date)}
                    </span>
                  </Link>
                ) : (
                  <span />
                )}
                {around.next && (
                  <Link href={letterHref(around.next.date)} className={nav}>
                    <span className="truncate">
                      다음 호 · {volLabel(around.next.vol)} {formatShort(around.next.date)}
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0" strokeWidth={2} />
                  </Link>
                )}
              </nav>
            )}
          </div>
        </div>

        <aside className="space-y-4">
          <section aria-labelledby="letters-title" className="rounded-xl border border-hairline p-5">
            <h2 id="letters-title" className="type-heading-sm text-ink">
              지난 레터
            </h2>
            {recent.length === 0 ? (
              <p className="mt-2 type-caption text-ink-mute">레터가 쌓이면 여기에서 다시 볼 수 있어요.</p>
            ) : (
              <ul className="mt-2 divide-y divide-hairline">
                {recent.map((i) => (
                  <li key={i.id}>
                    <Link
                      href={letterHref(i.date)}
                      aria-current={i.date === issue.date ? "page" : undefined}
                      className={cn("group block py-3", i.date === issue.date && "pointer-events-none")}
                    >
                      <span className={cn("tabular type-micro", i.date === issue.date ? "font-semibold text-primary-text" : "text-ink-mute")}>
                        {volLabel(i.vol)} · {formatShort(i.date)}
                        {i.date === issue.date && " · 지금 보는 호"}
                      </span>
                      <span className="mt-0.5 line-clamp-2 block type-body-md text-ink [word-break:keep-all] group-hover:underline">{i.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <Link href={BRIEFING_ARCHIVE} className="link mt-3 inline-block type-caption">
              지난 레터 전체 보기 →
            </Link>
          </section>
          <PopularNews items={popular} />
          <div className="lg:sticky lg:top-24">
            <AdSlot slot={AD_SLOTS.sidebar} variant="rectangle" />
          </div>
        </aside>
      </div>
    </div>
  );
}

export type { LetterContent };
