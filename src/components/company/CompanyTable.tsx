"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowDownWideNarrow, ChevronRight, Search } from "lucide-react";
import { formatShort } from "@/lib/date";
import { formatRatio } from "@/lib/format";
import { useFavorites, useTodayKey } from "@/lib/hooks";
import { CATEGORY_META, EVENT_META, MAJOR_META } from "@/lib/meta";
import { PHASE_TONE_CLASS, nextEvent, recruitmentPhase } from "@/lib/schedule";
import type { Catalog, Category } from "@/lib/types";
import { CategoryChips, FilterChip } from "../CategoryChips";
import { DDayBadge, FavoriteButton } from "../client-ui";
import { BlindBadge, CompanyAvatar, cn } from "../ui";

type Sort = "upcoming" | "ratio" | "name";

const SORTS: { key: Sort; label: string }[] = [
  { key: "upcoming", label: "일정 임박순" },
  { key: "ratio", label: "경쟁률 높은순" },
  { key: "name", label: "가나다순" },
];

export function CompanyTable({ catalog }: { catalog: Catalog }) {
  const today = useTodayKey();
  const { favorites } = useFavorites();
  const [category, setCategory] = useState<Category | "all" | "fav">("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("upcoming");

  const categoryCounts = useMemo(() => {
    const out: Partial<Record<Category, number>> = {};
    for (const c of catalog.companies) out[c.category] = (out[c.category] ?? 0) + 1;
    return out;
  }, [catalog]);

  const recruitmentMap = useMemo(
    () => new Map(catalog.recruitments.map((r) => [r.companyId, r])),
    [catalog],
  );

  const rows = useMemo(() => {
    const q = query.replace(/\s+/g, "").toLowerCase();
    const list = catalog.companies
      .filter((c) => {
        if (category === "fav" && !favorites.has(c.id)) return false;
        if (category !== "all" && category !== "fav" && c.category !== category) return false;
        if (q && !`${c.name}${c.shortName}`.replace(/\s+/g, "").toLowerCase().includes(q)) return false;
        return true;
      })
      .map((c) => {
        const r = recruitmentMap.get(c.id);
        return {
          c,
          r,
          stat: c.ratio ? { ratio: c.ratio.value, label: c.ratio.label } : undefined,
          next: r && today ? nextEvent(r, today) : undefined,
          phase: today ? recruitmentPhase(r ?? { events: [] }, today) : null,
        };
      });

    return list.sort((a, b) => {
      if (sort === "ratio") return (b.stat?.ratio ?? -1) - (a.stat?.ratio ?? -1);
      if (sort === "name") return a.c.name.localeCompare(b.c.name, "ko");
      return (a.next?.date ?? "9999").localeCompare(b.next?.date ?? "9999");
    });
  }, [catalog, recruitmentMap, category, query, sort, today, favorites]);

  return (
    <div>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <CategoryChips
          value={category}
          onChange={setCategory}
          counts={categoryCounts}
          total={catalog.companies.length}
          trailing={
            <FilterChip active={category === "fav"} onClick={() => setCategory("fav")}>
              ★ 관심기관 <span className="tabular opacity-60">{favorites.size}</span>
            </FilterChip>
          }
        />
        <div className="flex shrink-0 gap-2">
          <label className="relative flex-1 md:w-56 md:flex-none">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-ink-mute"
              strokeWidth={1.75}
            />
            <span className="sr-only">기관명 검색</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="기관명 검색"
              className="input w-full !pl-9"
            />
          </label>
          <label className="relative">
            <span className="sr-only">정렬</span>
            <ArrowDownWideNarrow
              className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-ink-mute"
              strokeWidth={1.75}
            />
            <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="input appearance-none !pl-9">
              {SORTS.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {/* 데스크톱 표 — 대시보드 목업 카드 */}
      <div className="card mt-6 hidden overflow-hidden shadow-level-2 lg:block">
        <table className="w-full">
          <thead className="bg-canvas-soft type-caption text-ink-mute">
            <tr>
              <th className="px-4 py-3 text-left font-normal">기관</th>
              <th className="px-3 py-3 text-left font-normal">진행 상태</th>
              <th className="px-3 py-3 text-left font-normal">다음 일정</th>
              <th className="px-3 py-3 text-left font-normal">블라인드</th>
              <th className="px-3 py-3 text-left font-normal">필기</th>
              <th className="px-3 py-3 text-left font-normal">전공</th>
              <th className="px-3 py-3 text-right font-normal">최근 경쟁률</th>
              <th className="w-12" />
            </tr>
          </thead>
          <tbody>
            {rows.map(({ c, r, stat, next, phase }) => (
              <tr key={c.id} className="group border-t border-hairline hover:bg-canvas-soft">
                <td className="px-4 py-3">
                  <Link href={`/companies/${c.id}`} className="flex items-center gap-3">
                    <CompanyAvatar company={c} size="sm" />
                    <span>
                      <span className="block type-body-md text-ink group-hover:text-primary-text">{c.name}</span>
                      <span className="block type-caption text-ink-mute">
                        {CATEGORY_META[c.category].label}
                        {c.hq && ` · ${c.hq}`}
                      </span>
                    </span>
                  </Link>
                </td>
                <td className="px-3 py-3">
                  {phase ? (
                    <span className={cn("tag", PHASE_TONE_CLASS[phase.tone])}>{phase.label}</span>
                  ) : (
                    <span className="inline-block h-5 w-16 rounded-full bg-canvas-soft" />
                  )}
                  {r?.status === "expected" && r.events.length > 0 && (
                    <span className="ml-1 type-micro text-ink-mute">예상</span>
                  )}
                </td>
                <td className="px-3 py-3">
                  {next ? (
                    <span className="flex items-center gap-2">
                      <span className="type-body-tabular whitespace-nowrap text-ink">
                        <span className={EVENT_META[next.type].text}>{EVENT_META[next.type].short}</span>{" "}
                        {formatShort(next.date)}
                      </span>
                      <DDayBadge date={next.date} endDate={next.endDate} size="sm" />
                    </span>
                  ) : (
                    <span className="text-ink-mute">{today ? "-" : ""}</span>
                  )}
                </td>
                <td className="px-3 py-3">
                  <BlindBadge blind={c.blind} />
                </td>
                <td className="px-3 py-3 type-caption text-ink-secondary">{c.ncsLabel}</td>
                <td className="px-3 py-3 type-caption whitespace-nowrap text-ink-secondary">
                  {MAJOR_META[c.majorType].label}
                </td>
                <td className="px-3 py-3 text-right type-body-tabular text-ink">
                  {stat?.ratio != null ? (
                    <>
                      {formatRatio(stat.ratio)}
                      <span className="ml-1 type-micro text-ink-mute">{stat.label}</span>
                    </>
                  ) : (
                    <span className="text-ink-mute">-</span>
                  )}
                </td>
                <td className="pr-3">
                  <FavoriteButton companyId={c.id} companyName={c.name} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && <Empty />}
      </div>

      {/* 모바일·태블릿 카드 */}
      <ul className="mt-6 space-y-2 lg:hidden">
        {rows.map(({ c, stat, next, phase }) => (
          <li key={c.id} className="card shadow-level-1">
            <Link href={`/companies/${c.id}`} className="flex items-center gap-3 p-4">
              <CompanyAvatar company={c} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate type-body-lg text-ink">{c.name}</p>
                  {phase && <span className={cn("tag shrink-0", PHASE_TONE_CLASS[phase.tone])}>{phase.label}</span>}
                </div>
                <p className="mt-1 truncate type-caption text-ink-mute">
                  {c.ncsLabel} · {MAJOR_META[c.majorType].label}
                  {stat?.ratio != null && ` · ${formatRatio(stat.ratio)}`}
                </p>
                {next && (
                  <p className="mt-1 type-caption text-ink-secondary">
                    <span className={EVENT_META[next.type].text}>{EVENT_META[next.type].label}</span>{" "}
                    {formatShort(next.date)}
                  </p>
                )}
              </div>
              {next ? (
                <DDayBadge date={next.date} endDate={next.endDate} size="sm" />
              ) : (
                <ChevronRight className="h-4 w-4 text-ink-mute" strokeWidth={1.75} />
              )}
            </Link>
          </li>
        ))}
        {!rows.length && <Empty />}
      </ul>
    </div>
  );
}

function Empty() {
  return <p className="px-4 py-12 text-center text-ink-mute">조건에 맞는 기관이 없어요.</p>;
}
