import Link from "next/link";
import { FileText, PenLine, Swords, Users } from "lucide-react";
import { BLIND_META, MAJOR_META } from "@/lib/meta";
import { isAlioListed, latestStat, sameDayWritten } from "@/lib/data";
import { formatShort } from "@/lib/date";
import type { Company, Recruitment } from "@/lib/types";
import { Chip, cn } from "../ui";

import { formatRatio, nf } from "@/lib/format";

export { formatRatio };

/** 블라인드 / 필기 / 전공 / 경쟁률 요약 */
export function QuickFacts({ company, className }: { company: Company; className?: string }) {
  const stat = latestStat(company);
  const w = company.written;
  // 알리오는 공공기관만 공시 — 은행·공제회·한은·금감원 등은 공개 자료가 없는 경우가 대부분
  const aliOTarget = isAlioListed(company);
  const items = [
    {
      label: "블라인드",
      value: BLIND_META[company.blind].label,
      sub: BLIND_META[company.blind].desc,
      muted: company.blind === "unknown",
    },
    {
      label: "필기 유형",
      value: w.ncs.has === false ? "NCS 없음" : w.ncs.has ? (w.ncs.type ?? "NCS") : "확인 중",
      sub:
        w.ncs.has && (w.ncs.questions || w.ncs.minutes)
          ? [w.ncs.questions && `${w.ncs.questions}문항`, w.ncs.minutes && `${w.ncs.minutes}분`]
              .filter(Boolean)
              .join(" · ")
          : w.ncs.has === false
            ? (w.extra?.[0] ?? "전공·논술 중심")
            : "",
      muted: w.ncs.has == null,
    },
    {
      label: "전공 시험",
      value: MAJOR_META[w.major.type].label,
      sub: w.major.subjects ?? MAJOR_META[w.major.type].desc,
      muted: w.major.type === "unknown",
    },
    {
      label: stat ? `${stat.label ?? stat.year} 경쟁률` : "경쟁률",
      value:
        stat?.ratio != null
          ? formatRatio(stat.ratio)!
          : stat?.applicants
            ? `${nf.format(stat.applicants)}명 지원`
            : aliOTarget
              ? "공시 전"
              : "비공개",
      sub: stat
        ? [
            stat.applicants != null && `지원 ${nf.format(stat.applicants)}명`,
            stat.hires != null && `채용 ${nf.format(stat.hires)}명`,
            stat.source,
          ]
            .filter(Boolean)
            .join(" · ")
        : aliOTarget
          ? "알리오 공시 확인 필요"
          : "알리오 공시 대상이 아니라 공개 자료 없음",
      muted: !stat,
      numeric: true,
    },
  ];

  return (
    <dl className={cn("grid grid-cols-2 gap-3", className)}>
      {items.map((it) => (
        <div key={it.label} className="rounded-md border border-hairline bg-canvas-soft p-4">
          <dt className="type-caption text-ink-mute">{it.label}</dt>
          <dd
            className={cn(
              "mt-1 type-heading-sm",
              it.numeric && "tabular",
              it.muted ? "text-ink-mute" : "text-ink",
            )}
          >
            {it.value}
          </dd>
          {it.sub && <dd className="mt-1 line-clamp-2 type-micro text-ink-mute">{it.sub}</dd>}
        </div>
      ))}
    </dl>
  );
}

/** 카드 섹션 제목 — heading-md(20px/300) */
export function SectionTitle({
  icon: Icon,
  children,
  aside,
}: {
  icon?: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  children: React.ReactNode;
  aside?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h3 className="flex items-center gap-2 type-heading-md text-ink">
        {Icon && <Icon className="h-5 w-5 text-ink-mute" strokeWidth={1.5} />}
        {children}
      </h3>
      {aside}
    </div>
  );
}

const CONFIDENCE_LABEL = {
  high: { text: "공고문 원문 대조", tone: "bg-ev-final-soft text-ev-final" },
  medium: { text: "일부 2차 출처", tone: "bg-canvas-cream text-lemon" },
  low: { text: "2차 출처 위주", tone: "bg-ev-doc-soft text-ev-doc" },
} as const;

/** 일정 출처·검증 수준 표시 */
export function SourceNote({ recruitment }: { recruitment: Recruitment }) {
  const href = recruitment.sourceUrl ?? recruitment.postingUrl;
  if (!href && !recruitment.confidence) return null;
  const c = recruitment.confidence ? CONFIDENCE_LABEL[recruitment.confidence] : null;
  return (
    <p className="mt-4 flex flex-wrap items-center gap-2 type-caption text-ink-mute">
      {c && <span className={cn("tag", c.tone)}>{c.text}</span>}
      {href && (
        <a href={href} target="_blank" rel="noopener noreferrer" className="link">
          일정 출처 보기 ↗
        </a>
      )}
    </p>
  );
}

/** 같은 날 필기를 치르는 기관 안내 */
function SameDayWritten({ companyId }: { companyId: string }) {
  const same = sameDayWritten(companyId);
  if (!same) return null;
  return (
    <div className="rounded-md bg-ev-written-soft p-4">
      <p className="flex items-center gap-2 type-body-md !font-normal text-ev-written">
        <Swords className="h-4 w-4" strokeWidth={1.75} />
        {formatShort(same.date)} 같은 날 필기 — 응시 기관을 골라야 해요
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {same.companies.map((c) => (
          <Link
            key={c.id}
            href={`/companies/${c.id}`}
            className="rounded-full border border-hairline bg-canvas px-3 py-1 type-caption text-ink-secondary hover:text-ink"
          >
            {c.name}
          </Link>
        ))}
      </div>
    </div>
  );
}

function SubBlock({ title, aside, children }: { title: string; aside?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-hairline p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="type-body-md !font-normal text-ink">{title}</span>
        {aside}
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

/** 필기 구성 상세 */
export function ExamDetail({ company }: { company: Company }) {
  const w = company.written;
  const ncsMeta = [w.ncs.questions && `${w.ncs.questions}문항`, w.ncs.minutes && `${w.ncs.minutes}분`]
    .filter(Boolean)
    .join(" · ");
  return (
    <div className="space-y-3">
      <SameDayWritten companyId={company.id} />

      <SubBlock
        title="직업기초능력 (NCS·인적성)"
        aside={
          <>
            {w.ncs.has && w.ncs.type && <span className="tag tag-soft">{w.ncs.type}</span>}
            {ncsMeta && <span className="tabular type-caption text-ink-mute">{ncsMeta}</span>}
          </>
        }
      >
        {w.ncs.has === false ? (
          <p className="text-ink-secondary">NCS 직업기초능력 시험 없음</p>
        ) : w.ncs.subjects.length ? (
          <div className="flex flex-wrap gap-2">
            {w.ncs.subjects.map((s) => (
              <Chip key={s}>{s}</Chip>
            ))}
          </div>
        ) : (
          <p className="text-ink-mute">출제 영역 확인 중</p>
        )}
      </SubBlock>

      <SubBlock
        title="전공"
        aside={
          <>
            <span
              className={cn(
                "tag",
                w.major.type === "none"
                  ? "bg-ev-final-soft text-ev-final"
                  : w.major.type === "unknown"
                    ? "bg-canvas-soft text-ink-mute"
                    : "bg-ev-interview1-soft text-ev-interview1",
              )}
            >
              {MAJOR_META[w.major.type].label}
            </span>
            {w.major.minutes && <span className="tabular type-caption text-ink-mute">{w.major.minutes}분</span>}
          </>
        }
      >
        <p className="text-ink-secondary">{w.major.subjects ?? MAJOR_META[w.major.type].desc}</p>
      </SubBlock>

      {w.extra && w.extra.length > 0 && (
        <SubBlock title="기타 과목·전형">
          <div className="flex flex-wrap gap-2">
            {w.extra.map((s) => (
              <Chip key={s}>{s}</Chip>
            ))}
          </div>
        </SubBlock>
      )}
      {w.note && <p className="type-caption text-ink-mute">※ {w.note}</p>}
    </div>
  );
}

export function TracksDetail({ recruitment }: { recruitment: Recruitment }) {
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {recruitment.tracks.length ? (
          recruitment.tracks.map((t) => <Chip key={t}>{t}</Chip>)
        ) : (
          <span className="text-ink-mute">공고 확인 중</span>
        )}
      </div>
      {recruitment.headcount != null && (
        <p className="mt-4 flex items-center gap-2 text-ink-secondary">
          <Users className="h-4 w-4 text-ink-mute" strokeWidth={1.75} />
          채용 인원 <span className="tabular type-heading-sm text-ink">{nf.format(recruitment.headcount)}명</span>
        </p>
      )}
    </div>
  );
}

export function EssayList({ recruitment }: { recruitment: Recruitment }) {
  const qs = recruitment.essayQuestions;
  if (!qs.length) {
    return (
      <p className="card-cream p-4 text-ink-secondary">
        {recruitment.essayRef ?? "자소서 항목은 공개되는 대로 업데이트됩니다."}
      </p>
    );
  }
  return (
    <div>
      {recruitment.essayRef && (
        <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-canvas-cream px-3 py-1 type-caption text-lemon">
          <FileText className="h-3.5 w-3.5" strokeWidth={1.75} />
          {recruitment.essayRef}
        </p>
      )}
      <ol className="space-y-2">
        {qs.map((q, i) => (
          <li key={i} className="flex gap-3 rounded-md border border-hairline p-4">
            <span className="tabular flex h-6 w-6 shrink-0 items-center justify-center rounded-full tag-soft type-caption">
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="type-body-md text-ink">{q.q}</p>
              {q.limit && (
                <p className="mt-2 flex items-center gap-1 type-caption text-ink-mute">
                  <PenLine className="h-3 w-3" strokeWidth={1.75} />
                  {nf.format(q.limit)}
                  {q.unit === "byte" ? " byte" : "자"} 이내
                </p>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** 경쟁률 표 — 숫자 셀은 모두 body-tabular(tnum) */
export function StatsTable({ company }: { company: Company }) {
  // 최신 회차가 위로 (같은 해면 데이터 파일 뒤쪽이 최신)
  const rows = company.stats
    .map((s, i) => ({ s, i }))
    .sort((a, b) => b.s.year - a.s.year || b.i - a.i)
    .map((x) => x.s);
  if (!rows.length) {
    return (
      <p className="rounded-md bg-canvas-soft p-4 text-ink-mute">
        {isAlioListed(company)
          ? "알리오 신규채용 공시를 확인 중입니다."
          : "알리오 공시 대상 기관이 아니어서 공개된 경쟁률 자료가 없습니다."}
      </p>
    );
  }
  const maxRatio = Math.max(...rows.map((r) => r.ratio ?? 0), 1);
  return (
    <div className="overflow-hidden rounded-xs border border-hairline">
      <table className="w-full">
        <thead className="bg-canvas-soft type-caption text-ink-mute">
          <tr>
            <th className="px-3 py-2 text-left font-normal">연도</th>
            <th className="px-3 py-2 text-right font-normal">지원자</th>
            <th className="px-3 py-2 text-right font-normal">채용</th>
            <th className="w-[40%] px-3 py-2 text-left font-normal">경쟁률</th>
          </tr>
        </thead>
        <tbody className="type-body-tabular text-ink">
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-hairline">
              <td className="px-3 py-3">
                {r.label ?? r.year}
                <span className="ml-2 type-micro text-ink-mute">{r.source}</span>
              </td>
              <td className="px-3 py-3 text-right">{r.applicants != null ? `${nf.format(r.applicants)}명` : "-"}</td>
              <td className="px-3 py-3 text-right">{r.hires != null ? `${nf.format(r.hires)}명` : "-"}</td>
              <td className="px-3 py-3">
                {r.ratio != null ? (
                  <div className="flex items-center gap-2">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-canvas-soft">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${Math.max(6, (r.ratio / maxRatio) * 100)}%` }}
                      />
                    </div>
                    <span className="w-16 text-right">{formatRatio(r.ratio)}</span>
                  </div>
                ) : (
                  <span className="text-ink-mute">-</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
