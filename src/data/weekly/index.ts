import type { WeeklyEdition } from "@/lib/weekly";
import { WEEKLY_2026_11_2 } from "./2026-11-2";

/** 주간 정리 내용 파일 — 키는 글 본문 첫 줄 {{weekly:키}} 와 같아요 (새 주는 파일을 만들고 여기 한 줄) */
const WEEKLY: Record<string, WeeklyEdition> = {
  [WEEKLY_2026_11_2.key]: WEEKLY_2026_11_2,
};

export const getWeekly = (key: string | null | undefined): WeeklyEdition | null => (key ? (WEEKLY[key] ?? null) : null);
