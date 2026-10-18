"use client";

import { useCallback, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { buildEvents } from "@/lib/catalog-client";
import { addDays, formatDayHeading, shiftMonth, ymOf, type YearMonth } from "@/lib/date";
import { useFavorites, useTodayKey } from "@/lib/hooks";
import { AD_SLOTS } from "@/lib/site";
import type { Catalog } from "@/lib/types";
import { AdSlot } from "../ads/AdSlot";
import { AgendaList, DayModal } from "./AgendaList";
import { EventRow } from "./EventRow";
import { DEFAULT_FILTERS, applyFilters, groupByDay, type Filters } from "./filters";
import { MonthGrid } from "./MonthGrid";
import { Sidebar } from "./Sidebar";
import { DayView } from "./DayView";
import { CalendarHeader, FilterBar, type View } from "./Toolbar";
import { UrgentStrip } from "./UrgentStrip";

/** 기관 상세(자소서·필기 등 전체 데이터)는 패널을 처음 열 때 불러옵니다. */
const CompanyDrawer = dynamic(() => import("../company/CompanyDrawer").then((m) => m.CompanyDrawer));

export function HomeDashboard({ catalog, afterStatus }: { catalog: Catalog; afterStatus?: React.ReactNode }) {
  const today = useTodayKey();
  const { favorites } = useFavorites();
  const allEvents = useMemo(() => buildEvents(catalog), [catalog]);

  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [view, setView] = useState<View>("month");
  const [ymOverride, setYmOverride] = useState<YearMonth | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [dayModal, setDayModal] = useState<string | null>(null);
  const [openCompany, setOpenCompany] = useState<string | null>(null);

  const ym = ymOverride ?? (today ? ymOf(today) : null);
  const activeDay = selectedDay ?? today;

  const filtered = useMemo(
    () => applyFilters(allEvents, filters, favorites),
    [allEvents, filters, favorites],
  );
  const byDay = useMemo(() => groupByDay(filtered), [filtered]);
  const upcomingCount = useMemo(
    () => (today ? filtered.filter((e) => (e.endDate ?? e.date) >= today).length : null),
    [filtered, today],
  );

  const closeDrawer = useCallback(() => setOpenCompany(null), []);
  const closeDayModal = useCallback(() => setDayModal(null), []);

  const shift = (delta: number) => {
    if (ym) setYmOverride(shiftMonth(ym, delta));
  };

  return (
    <>
      <UrgentStrip today={today} events={filtered} onOpen={setOpenCompany} />

      {/* 간격은 광고가 아닌 본문이 가집니다 — 광고가 없을 때도 붙지 않게 */}
      <AdSlot slot={AD_SLOTS.homeTop} variant="leaderboard" className="mt-8" />

      <div className="mt-8 grid gap-8 md:mt-10 lg:grid-cols-[minmax(0,1fr)_304px]">
        <section aria-label="채용 달력" className="min-w-0 space-y-4">
          <CalendarHeader
            ym={ym}
            view={view}
            onViewChange={setView}
            onShift={shift}
            onToday={() => {
              setYmOverride(null);
              setSelectedDay(null);
            }}
            listCount={upcomingCount}
            day={activeDay}
            onShiftDay={(d) => {
              if (!activeDay) return;
              const next = addDays(activeDay, d);
              setSelectedDay(next);
              setYmOverride(ymOf(next));
            }}
          />
          <FilterBar filters={filters} onChange={setFilters} favoriteCount={favorites.size} />

          {view === "month" ? (
            <>
              <MonthGrid
                ym={ym}
                today={today}
                byDay={byDay}
                selectedDay={activeDay}
                onSelectDay={setSelectedDay}
                onOpenDay={setDayModal}
                onOpenCompany={setOpenCompany}
              />

              {/* 모바일: 선택한 날짜의 일정 */}
              {activeDay && (
                <div className="card p-2 shadow-level-1 md:hidden">
                  <h3 className="px-3 pt-2 pb-1 type-heading-sm text-ink">{formatDayHeading(activeDay)}</h3>
                  {(byDay.get(activeDay) ?? []).length ? (
                    byDay.get(activeDay)!.map((ev) => (
                      <EventRow key={ev.id} ev={ev} onOpen={setOpenCompany} />
                    ))
                  ) : (
                    <p className="px-3 pt-1 pb-3 text-ink-mute">이 날은 일정이 없어요.</p>
                  )}
                </div>
              )}
            </>
          ) : view === "day" ? (
            activeDay && (
              <DayView
                day={activeDay}
                today={today}
                byDay={byDay}
                onSelect={(d) => {
                  setSelectedDay(d);
                  setYmOverride(ymOf(d));
                }}
                onOpenCompany={setOpenCompany}
              />
            )
          ) : (
            <AgendaList today={today} events={filtered} onOpen={setOpenCompany} />
          )}
        </section>

        <Sidebar catalog={catalog} today={today} afterStatus={afterStatus} />
      </div>

      {dayModal && (
        <DayModal
          day={dayModal}
          events={byDay.get(dayModal) ?? []}
          onClose={closeDayModal}
          onOpen={setOpenCompany}
        />
      )}
      {openCompany && <CompanyDrawer companyId={openCompany} onClose={closeDrawer} />}
    </>
  );
}
