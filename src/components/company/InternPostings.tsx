import { ExternalLink, GraduationCap } from "lucide-react";
import type { Recruitment } from "@/lib/types";
import { RecruitTimeline } from "./RecruitTimeline";
import { SectionTitle, SourceNote } from "./sections";

/**
 * 기관 페이지·기관 패널의 '체험형 인턴' 칸 — 신입 채용과 따로 (정규직 전환이 아닌 체험형만).
 * 공고가 없으면 아무것도 그리지 않아요.
 */
export function InternPostings({ items, compact = false }: { items: Recruitment[]; compact?: boolean }) {
  if (!items.length) return null;
  return (
    <div className="space-y-6">
      {items.map((r, i) => (
        <div key={`${r.title}-${i}`} className={i > 0 ? "border-t border-hairline pt-6" : undefined}>
          <SectionTitle
            icon={GraduationCap}
            aside={<span className="tag shrink-0 bg-ink text-on-primary">체험형 인턴</span>}
          >
            <span className={compact ? "type-heading-sm" : undefined}>{r.title}</span>
          </SectionTitle>
          {(r.headcount != null || r.tracks.length > 0 || r.workPeriod) && (
            <dl className="mb-4 grid gap-x-6 gap-y-1 type-caption text-ink-secondary sm:grid-cols-[auto_minmax(0,1fr)]">
              {r.headcount != null && (
                <>
                  <dt className="text-ink-mute">모집 인원</dt>
                  <dd className="tabular">{r.headcount.toLocaleString("ko-KR")}명</dd>
                </>
              )}
              {r.tracks.length > 0 && (
                <>
                  <dt className="text-ink-mute">분야</dt>
                  <dd className="[word-break:keep-all]">{r.tracks.join(" · ")}</dd>
                </>
              )}
              {r.workPeriod && (
                <>
                  <dt className="text-ink-mute">근무 기간</dt>
                  <dd className="[word-break:keep-all]">{r.workPeriod}</dd>
                </>
              )}
            </dl>
          )}
          <RecruitTimeline recruitment={r} />
          {r.note && <p className="mt-4 type-caption text-ink-mute [word-break:keep-all]">※ {r.note}</p>}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <SourceNote recruitment={r} />
            {r.postingUrl && (
              <a href={r.postingUrl} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-secondary mt-4">
                인턴 공고 보기
                <ExternalLink className="h-4 w-4" strokeWidth={1.75} />
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
