import Link from "next/link";
import { ArrowLeft, ChevronRight, PenLine } from "lucide-react";
import { formatShort } from "@/lib/date";
import { BRIEFING_ARCHIVE, EDITION_LABEL, letterHref, volLabel, type BriefingIssue, type NewsItem } from "@/lib/news-meta";
import type { LetterContent } from "@/lib/server/briefing";
import { AD_SLOTS } from "@/lib/site";
import { AdSlot } from "../ads/AdSlot";
import { cn } from "../ui";
import { IssueViewRecorder } from "./interactive";
import { Letter } from "./Letter";
import { PopularNews } from "./news";

/** 브리핑 한 호 + 옆 칸(지난 브리핑·많이 본 기사) */
export function LetterScreen({
  issue,
  content,
  admin,
  recent,
  popular,
  around,
  sibling,
}: {
  issue: BriefingIssue;
  content: LetterContent;
  admin: boolean;
  recent: BriefingIssue[];
  popular: NewsItem[];
  /** 발행 순서로 바로 앞뒤 호 — 브리핑 맨 아래 바로 가기 */
  around: { prev: BriefingIssue | null; next: BriefingIssue | null };
  /** 같은 날 다른 판 (아침판이면 금콩 스터디) */
  sibling: BriefingIssue | null;
}) {
  const nav = "inline-flex min-w-0 items-center gap-1.5 rounded-full border border-hairline px-3.5 py-2 type-caption text-ink-secondary hover:border-hairline-input";
  const isCurrent = (i: BriefingIssue) => i.date === issue.date && i.edition === issue.edition;
  return (
    <div className="mt-8">
      {issue.live && <IssueViewRecorder id={issue.id} />}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/magazine" className="link inline-flex items-center gap-1 type-caption">
          <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
          데일리 브리핑
        </Link>
        {sibling && (
          <Link href={letterHref(sibling.date, sibling.edition)} className={nav}>
            같은 날 {EDITION_LABEL[sibling.edition]} 보기
            <ChevronRight className="h-4 w-4" strokeWidth={2} />
          </Link>
        )}
      </div>

      {admin && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-canvas-cream px-4 py-3">
          <p className="type-caption text-ink-secondary">
            {issue.live ? "운영자 화면 — 발행된 브리핑이에요." : "미리보기 — 아직 초안이라 독자에게는 보이지 않아요. 초안 기사도 함께 보여요."}
          </p>
          <Link href={`/admin/news/issue/${issue.id}`} className="btn btn-sm btn-secondary">
            <PenLine className="h-3.5 w-3.5" strokeWidth={1.75} />
            브리핑 관리
          </Link>
        </div>
      )}

      <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0">
          <div className="mx-auto max-w-[760px]">
            <Letter issue={issue} content={content} around={around} />
          </div>
        </div>

        <aside className="space-y-4">
          <section aria-labelledby="briefings-title" className="rounded-xl border border-hairline p-5">
            <h2 id="briefings-title" className="type-heading-sm text-ink">
              지난 브리핑
            </h2>
            {recent.length === 0 ? (
              <p className="mt-2 type-caption text-ink-mute">브리핑이 쌓이면 여기에서 다시 볼 수 있어요.</p>
            ) : (
              <ul className="mt-2 divide-y divide-hairline">
                {recent.map((i) => (
                  <li key={i.id}>
                    <Link
                      href={letterHref(i.date, i.edition)}
                      aria-current={isCurrent(i) ? "page" : undefined}
                      className={cn("group block py-3", isCurrent(i) && "pointer-events-none")}
                    >
                      <span className={cn("tabular type-micro", isCurrent(i) ? "font-semibold text-primary-text" : "text-ink-mute")}>
                        {formatShort(i.date)} {EDITION_LABEL[i.edition]} · {volLabel(i.vol)}
                        {isCurrent(i) && " · 지금 보는 호"}
                      </span>
                      <span className="mt-0.5 line-clamp-2 type-body-md text-ink [word-break:keep-all] group-hover:underline">{i.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <Link href={BRIEFING_ARCHIVE} className="link mt-3 inline-block type-caption">
              지난 브리핑 전체 보기 →
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
