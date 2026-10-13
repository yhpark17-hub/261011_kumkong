import Link from "next/link";
import { Suspense } from "react";
import { ExternalLink } from "lucide-react";
import { AdminCard, AdminPageTitle, EmptyRow } from "@/components/admin/parts";
import { AdminSkeleton } from "@/components/admin/Skeleton";
import { CompanyAvatar, cn } from "@/components/ui";
import { formatShort } from "@/lib/date";
import { CATEGORY_META } from "@/lib/meta";
import { requireAdmin } from "@/lib/server/admin";
import { ISSUE_META, scheduleIssues, type IssueKey } from "@/lib/server/data-check";

export const metadata = { title: "일정 데이터 점검" };

export default function DataCheckPage({ searchParams }: PageProps<"/admin/data">) {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      {searchParams.then((sp) => (
        <DataCheck issue={typeof sp.issue === "string" && sp.issue in ISSUE_META ? (sp.issue as IssueKey) : null} />
      ))}
    </Suspense>
  );
}

async function DataCheck({ issue }: { issue: IssueKey | null }) {
  await requireAdmin();
  const { rows, counts, today } = scheduleIssues();
  const shown = issue ? rows.filter((r) => r.issues.includes(issue)) : rows;
  const keys = Object.keys(ISSUE_META) as IssueKey[];

  return (
    <>
      <AdminPageTitle
        title="일정 데이터 점검"
        desc={`${today} 기준 · 일정에 빈 곳이 있는 기관이에요. 공식 공고를 확인한 뒤 scripts/apply-updates.mjs 로 반영하세요 (README 참고).`}
      />
      <div className="no-scrollbar fade-x -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0 md:fade-x-none">
        <Link href="/admin/data" className={cn("btn btn-sm shrink-0", !issue ? "btn-on-dark" : "btn-toggle")}>
          전체 <span className="tabular opacity-60">{rows.length}</span>
        </Link>
        {keys.map((k) => (
          <Link key={k} href={`/admin/data?issue=${k}`} className={cn("btn btn-sm shrink-0", issue === k ? "btn-on-dark" : "btn-toggle")}>
            {ISSUE_META[k].label} <span className="tabular opacity-60">{counts[k]}</span>
          </Link>
        ))}
      </div>
      {issue && <p className="type-caption text-ink-mute">{ISSUE_META[issue].desc}</p>}

      <AdminCard>
        {shown.length === 0 ? (
          <EmptyRow>해당하는 기관이 없어요.</EmptyRow>
        ) : (
          <ul className="divide-y divide-hairline">
            {shown.map(({ company, recruitment, issues, lastEvent }) => (
              <li key={company.id} className="flex items-start gap-3 py-3">
                <CompanyAvatar company={company} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2">
                    <Link href={`/companies/${company.id}`} className="type-body-md !font-normal text-ink hover:underline">
                      {company.name}
                    </Link>
                    <span className="type-micro text-ink-mute">{CATEGORY_META[company.category].label}</span>
                    {issues.map((i) => (
                      <span key={i} className={cn("tag", ISSUE_META[i].tone)}>
                        {ISSUE_META[i].label}
                      </span>
                    ))}
                  </p>
                  <p className="mt-1 truncate type-caption text-ink-secondary">{recruitment?.title ?? "채용 정보 없음"}</p>
                  <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 type-micro text-ink-mute">
                    {lastEvent && <span className="tabular">최근 일정 {formatShort(lastEvent)}</span>}
                    {recruitment?.updatedAt && <span className="tabular">최종 확인 {recruitment.updatedAt}</span>}
                    {recruitment?.confidence && <span>신뢰도 {recruitment.confidence}</span>}
                    {(recruitment?.sourceUrl ?? recruitment?.postingUrl ?? company.recruitUrl) && (
                      <a
                        href={recruitment?.sourceUrl ?? recruitment?.postingUrl ?? company.recruitUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="link inline-flex items-center gap-0.5"
                      >
                        출처·채용 페이지
                        <ExternalLink className="h-3 w-3" strokeWidth={1.75} />
                      </a>
                    )}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </AdminCard>
    </>
  );
}
