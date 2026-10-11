import { addDays } from "./date";
import { EVENT_META } from "./meta";
import type { Company, Recruitment } from "./types";

export type IcsCompany = Pick<Company, "id" | "name">;
export type IcsRecruitment = Pick<Recruitment, "title" | "status" | "events">;

function esc(text: string) {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

function compact(key: string) {
  return key.replaceAll("-", "");
}

/** 기관 채용 일정을 iCalendar(.ics) 문자열로 변환 — 종일 일정으로 내보냅니다. */
export function recruitmentToICS(company: IcsCompany, r: IcsRecruitment, siteUrl: string): string {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//kumkong//recruit calendar//KO",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${esc(`${company.name} 채용 일정`)}`,
  ];
  r.events.forEach((e, i) => {
    const label = e.label ?? EVENT_META[e.type].label;
    const summary = `[${label}] ${company.name}${e.time ? ` ${e.time}` : ""}${r.status === "expected" ? " (예상)" : ""}`;
    const desc = [r.title, e.note, `자세히 보기: ${siteUrl}/companies/${company.id}`].filter(Boolean).join("\n");
    lines.push(
      "BEGIN:VEVENT",
      `UID:${company.id}-${e.type}-${i}-${compact(e.date)}@kumkong`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${compact(e.date)}`,
      `DTEND;VALUE=DATE:${compact(addDays(e.endDate ?? e.date, 1))}`,
      `SUMMARY:${esc(summary)}`,
      `DESCRIPTION:${esc(desc)}`,
      "END:VEVENT",
    );
  });
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}
