import type { CalendarEvent, Category, EventType, MajorType } from "@/lib/types";

export interface Filters {
  /** 비어 있으면 전체 */
  categories: Category[];
  types: EventType[];
  favoritesOnly: boolean;
  query: string;
  major: MajorType | "all";
  blindOnly: boolean;
}

export const ALL_TYPES: EventType[] = ["doc", "written", "interview1", "interview2", "final", "posting"];

export const DEFAULT_FILTERS: Filters = {
  categories: [],
  types: ALL_TYPES,
  favoritesOnly: false,
  query: "",
  major: "all",
  blindOnly: false,
};

export function isDefaultFilters(f: Filters): boolean {
  return (
    f.categories.length === 0 &&
    f.types.length === ALL_TYPES.length &&
    !f.favoritesOnly &&
    f.query.trim() === "" &&
    f.major === "all" &&
    !f.blindOnly
  );
}

function normalize(s: string) {
  return s.replace(/\s+/g, "").toLowerCase();
}

export function applyFilters(
  events: CalendarEvent[],
  f: Filters,
  favorites: Set<string>,
): CalendarEvent[] {
  const q = normalize(f.query);
  return events.filter((ev) => {
    const c = ev.company;
    if (!f.types.includes(ev.type)) return false;
    if (f.categories.length && !f.categories.includes(c.category)) return false;
    if (f.favoritesOnly && !favorites.has(c.id)) return false;
    if (f.major !== "all" && c.majorType !== f.major) return false;
    if (f.blindOnly && c.blind !== "full") return false;
    if (q) {
      const hay = normalize(`${c.name}${c.shortName}`);
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export function groupByDay(events: CalendarEvent[]): Map<string, CalendarEvent[]> {
  const map = new Map<string, CalendarEvent[]>();
  for (const ev of events) {
    const list = map.get(ev.date);
    if (list) list.push(ev);
    else map.set(ev.date, [ev]);
  }
  return map;
}
