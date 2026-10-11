"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Activity, ArrowRight, BarChart3, Star } from "lucide-react";
import { formatShort } from "@/lib/date";
import { formatRatio } from "@/lib/format";
import { EVENT_META } from "@/lib/meta";
import { nextEvent, recruitmentPhase } from "@/lib/schedule";
import { AD_SLOTS } from "@/lib/site";
import type { Catalog } from "@/lib/types";
import { AdSlot } from "../ads/AdSlot";
import { DDayBadge } from "../client-ui";
import { Card, CompanyAvatar, cn } from "../ui";

export function Sidebar({
  catalog,
  today,
  favorites,
  onOpen,
}: {
  catalog: Catalog;
  today: string | null;
  favorites: Set<string>;
  onOpen: (id: string) => void;
}) {
  return (
    <aside className="space-y-4" aria-label="보조 정보">
      <AdSlot slot={AD_SLOTS.sidebar} variant="rectangle" />
      <PhaseSummary catalog={catalog} today={today} />
      <FavoritesPanel catalog={catalog} today={today} favorites={favorites} onOpen={onOpen} />
      <TopCompetition catalog={catalog} />
      <div className="lg:sticky lg:top-24">
        <AdSlot slot={AD_SLOTS.sidebarSticky} variant="skyscraper" className="hidden lg:block" />
      </div>
    </aside>
  );
}

function PanelTitle({
  icon: Icon,
  children,
  aside,
  onDark = false,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  children: React.ReactNode;
  aside?: React.ReactNode;
  onDark?: boolean;
}) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className={cn("flex items-center gap-2 type-heading-sm", onDark ? "text-on-primary" : "text-ink")}>
        <Icon className={cn("h-4 w-4", onDark ? "text-primary-subdued" : "text-ink-mute")} strokeWidth={1.75} />
        {children}
      </h2>
      {aside}
    </div>
  );
}

/** card-pricing-featured 스타일 (deep navy) 요약 카드 */
function PhaseSummary({ catalog, today }: { catalog: Catalog; today: string | null }) {
  const counts = useMemo(() => {
    if (!today) return null;
    const c = { open: 0, soon: 0, progress: 0, done: 0 };
    for (const r of catalog.recruitments) c[recruitmentPhase(r, today).tone]++;
    return c;
  }, [catalog, today]);

  const items = [
    { key: "open", label: "서류 접수중" },
    { key: "soon", label: "접수 예정" },
    { key: "progress", label: "필기·면접 진행" },
    { key: "done", label: "전형 종료" },
  ] as const;

  return (
    <section className="card-featured p-6">
      <PanelTitle icon={Activity} onDark>
        지금 채용 현황
      </PanelTitle>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-4">
        {items.map((it) => (
          <div key={it.key}>
            <dt className="type-caption text-primary-subdued">{it.label}</dt>
            <dd className="tabular mt-1 type-display-md text-on-primary">
              {counts ? counts[it.key] : "–"}
              <span className="ml-1 type-caption text-primary-subdued">곳</span>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function FavoritesPanel({
  catalog,
  today,
  favorites,
  onOpen,
}: {
  catalog: Catalog;
  today: string | null;
  favorites: Set<string>;
  onOpen: (id: string) => void;
}) {
  const rows = useMemo(() => {
    if (!today) return [];
    const companyMap = new Map(catalog.companies.map((c) => [c.id, c]));
    return catalog.recruitments
      .filter((r) => favorites.has(r.companyId) && companyMap.has(r.companyId))
      .map((r) => ({ r, company: companyMap.get(r.companyId)!, next: nextEvent(r, today) }))
      .sort((a, b) => (a.next?.date ?? "9999").localeCompare(b.next?.date ?? "9999"));
  }, [catalog, today, favorites]);

  return (
    <Card className="p-6">
      <PanelTitle icon={Star}>관심기관</PanelTitle>
      {rows.length === 0 ? (
        <p className="card-cream p-4 type-caption text-ink-secondary">
          달력에서 기관을 열고 <Star className="inline h-3.5 w-3.5 -translate-y-px fill-lemon text-lemon" />를 누르면
          다음 일정을 여기에 모아 보여드려요.
        </p>
      ) : (
        <ul className="-mx-2">
          {rows.map(({ r, company, next }) => (
            <li key={r.companyId}>
              <button
                type="button"
                onClick={() => onOpen(company.id)}
                className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left hover:bg-canvas-soft"
              >
                <CompanyAvatar company={company} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate type-body-md text-ink">{company.name}</p>
                  <p className="truncate type-caption text-ink-mute">
                    {next ? (
                      <>
                        <span className={EVENT_META[next.type].text}>{next.label ?? EVENT_META[next.type].label}</span>{" "}
                        {formatShort(next.date)}
                      </>
                    ) : (
                      "전형 종료"
                    )}
                  </p>
                </div>
                {next && <DDayBadge date={next.date} endDate={next.endDate} size="sm" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function TopCompetition({ catalog }: { catalog: Catalog }) {
  const top = useMemo(
    () =>
      catalog.companies
        .filter((c) => c.ratio)
        .sort((a, b) => b.ratio!.value - a.ratio!.value)
        .slice(0, 5),
    [catalog],
  );
  if (!top.length) return null;
  return (
    <Card className="p-6">
      <PanelTitle
        icon={BarChart3}
        aside={
          <Link href="/companies" className="link inline-flex items-center gap-1 type-caption">
            전체 <ArrowRight className="h-3 w-3" strokeWidth={1.75} />
          </Link>
        }
      >
        경쟁률 TOP 5
      </PanelTitle>
      <ol className="-mx-2">
        {top.map((c, i) => (
          <li key={c.id}>
            <Link href={`/companies/${c.id}`} className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-canvas-soft">
              <span className={cn("tabular w-4 text-center type-caption", i < 3 ? "text-primary-text" : "text-ink-mute")}>
                {i + 1}
              </span>
              <span className="min-w-0 flex-1 truncate type-body-md text-ink">{c.name}</span>
              <span className="type-body-tabular text-ink">{formatRatio(c.ratio!.value)}</span>
              <span className="max-w-16 truncate type-micro text-ink-mute">{c.ratio!.label}</span>
            </Link>
          </li>
        ))}
      </ol>
    </Card>
  );
}
