import "server-only";
import { RECRUITMENTS, getCompany } from "../data";
import { addDays } from "../date";
import { EVENT_META } from "../meta";
import { eventLabel } from "../schedule";
import type { EventType, ScheduleEvent } from "../types";
import { db } from "./db";

/**
 * 금콩 앱 일정 알림 — 관심 기관의 일정을 전날 오전 9시(d1)·당일 오전 8시(d0)에 보내요 (Vercel 크론, vercel.json).
 * 계정 없이 기기 푸시 토큰 + 관심 기관 목록만 받아요. 보내기는 Expo 푸시 서비스(iOS APNs·Android FCM을 대신 보내 줌).
 */

export type AlertKind = "d1" | "d0";
export const isAlertKind = (v: unknown): v is AlertKind => v === "d1" || v === "d0";

/** 알림을 보낼 수 있는 일정 (접수 시작은 '마감'이 아니라서 빼요) */
export const ALERT_TYPES: EventType[] = ["doc", "written", "interview1", "interview2", "final"];

export interface AlertPrefs {
  d1: boolean;
  d0: boolean;
  types: EventType[];
}
export const DEFAULT_PREFS: AlertPrefs = { d1: true, d0: true, types: ALERT_TYPES };

export function parsePrefs(raw: unknown): AlertPrefs {
  const o = (typeof raw === "string" ? safeJson(raw) : raw) as Partial<AlertPrefs> | null;
  if (!o || typeof o !== "object") return DEFAULT_PREFS;
  return {
    d1: o.d1 !== false,
    d0: o.d0 !== false,
    types: Array.isArray(o.types) ? ALERT_TYPES.filter((t) => o.types!.includes(t)) : ALERT_TYPES,
  };
}

function safeJson(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

export const isPushToken = (v: unknown): v is string => typeof v === "string" && /^Expo(nent)?PushToken\[[A-Za-z0-9_-]{8,200}\]$/.test(v);

/** 관심 기관 — 아는 기관만, 최대 300곳 */
export function cleanFavorites(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return [...new Set(raw.filter((x): x is string => typeof x === "string" && Boolean(getCompany(x))))].slice(0, 300);
}

export async function saveDevice(d: { token: string; platform: "ios" | "android"; favorites: string[]; prefs: AlertPrefs }) {
  const client = await db();
  const now = Date.now();
  await client.execute({
    sql: `INSERT INTO app_devices (token, platform, favorites, prefs, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)
          ON CONFLICT(token) DO UPDATE SET platform = excluded.platform, favorites = excluded.favorites, prefs = excluded.prefs, updated_at = excluded.updated_at`,
    args: [d.token, d.platform, JSON.stringify(d.favorites), JSON.stringify(d.prefs), now, now],
  });
}

export async function removeDevice(token: string) {
  const client = await db();
  await client.execute({ sql: "DELETE FROM app_devices WHERE token = ?", args: [token] });
  await client.execute({ sql: "DELETE FROM app_push_log WHERE token = ?", args: [token] });
}

export async function deviceExists(token: string): Promise<boolean> {
  const client = await db();
  const res = await client.execute({ sql: "SELECT 1 FROM app_devices WHERE token = ?", args: [token] });
  return res.rows.length > 0;
}

/* ------------------------------------------------------------------ */
/* 어떤 일정을 알리나                                                    */
/* ------------------------------------------------------------------ */

export interface DueEvent {
  /** 기관·일정·날짜로 만든 열쇠 (보낸 기록) */
  key: string;
  companyId: string;
  name: string;
  shortName: string;
  type: EventType;
  label: string;
  time?: string;
  recruitmentTitle: string;
}

/** 알림 기준일 — 서류 마감은 마감일(기간이면 끝날), 나머지는 시작일 */
const alertDate = (e: ScheduleEvent) => (e.type === "doc" ? (e.endDate ?? e.date) : e.date);

/**
 * 그날(target)이 기준일인 일정 — 공고로 확인된 일정만 (전년도 기준 '예상' 일정은 날짜가 틀릴 수 있어 알리지 않아요)
 */
export function dueEvents(target: string): DueEvent[] {
  const out: DueEvent[] = [];
  for (const r of RECRUITMENTS) {
    if (r.status !== "confirmed") continue;
    const c = getCompany(r.companyId);
    if (!c) continue;
    for (const e of r.events) {
      if (!ALERT_TYPES.includes(e.type) || alertDate(e) !== target) continue;
      out.push({
        key: `${target}:${r.companyId}:${e.type}:${e.label ?? ""}`,
        companyId: r.companyId,
        name: c.name,
        shortName: c.shortName,
        type: e.type,
        label: eventLabel(e),
        time: e.time,
        recruitmentTitle: r.title,
      });
    }
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* 알림 글                                                              */
/* ------------------------------------------------------------------ */

export interface PushMessage {
  to: string;
  title: string;
  body: string;
  data: { path: string };
  sound: "default";
  channelId: "alerts";
  priority: "high";
}

const WHEN: Record<AlertKind, string> = { d1: "내일", d0: "오늘" };
/** 서류 마감은 이름에 '마감'이 있으니 시각만 "17:00까지" */
const timeText = (e: DueEvent) => (e.time ? (e.type === "doc" ? `${e.time}까지` : e.time) : "");

export function composeMessage(token: string, kind: AlertKind, events: DueEvent[]): PushMessage {
  const base = { to: token, sound: "default" as const, channelId: "alerts" as const, priority: "high" as const };
  if (events.length === 1) {
    const [e] = events;
    return {
      ...base,
      title: `${WHEN[kind]} ${e.name} ${e.label}`,
      body: [timeText(e), e.recruitmentTitle].filter(Boolean).join(" · "),
      data: { path: `/company/${e.companyId}` },
    };
  }
  // 여러 건이면 한 번에 — 마감 먼저
  const sorted = [...events].sort((a, b) => EVENT_META[a.type].order - EVENT_META[b.type].order);
  const body = sorted.map((e) => [e.shortName, e.label, timeText(e)].filter(Boolean).join(" ")).join(" · ");
  return {
    ...base,
    title: `${WHEN[kind]} 관심 기관 일정 ${events.length}건`,
    body: body.length > 160 ? `${body.slice(0, 157)}…` : body,
    data: { path: "/calendar" },
  };
}

/* ------------------------------------------------------------------ */
/* 보내기                                                               */
/* ------------------------------------------------------------------ */

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

type Ticket = { status: "ok"; id: string } | { status: "error"; message: string; details?: { error?: string } };

/** Expo 푸시로 보내기 (한 번에 100건까지) — 받은 표(ticket)를 같은 순서로 돌려줘요 */
export async function pushToExpo(messages: PushMessage[]): Promise<Ticket[]> {
  const tickets: Ticket[] = [];
  for (let i = 0; i < messages.length; i += 100) {
    const chunk = messages.slice(i, i + 100);
    const res = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(process.env.EXPO_ACCESS_TOKEN ? { Authorization: `Bearer ${process.env.EXPO_ACCESS_TOKEN}` } : {}),
      },
      body: JSON.stringify(chunk),
    });
    const json = (await res.json().catch(() => null)) as { data?: Ticket[] } | null;
    const data = json?.data ?? [];
    for (let k = 0; k < chunk.length; k++) tickets.push(data[k] ?? { status: "error", message: `HTTP ${res.status}` });
  }
  return tickets;
}

export interface AlertRun {
  kind: AlertKind;
  target: string;
  due: number;
  devices: number;
  sent: number;
  skipped: number;
  removed: number;
  errors: string[];
}

/**
 * 크론 한 번 — today(KST) 기준으로 kind(전날/당일) 일정을 관심 기관으로 고른 기기에 보내요.
 * 같은 기기·같은 일정은 기록(app_push_log)이 있으면 다시 안 보내요. dry = 보낼 것만 세고 보내지 않음.
 */
export async function runAlerts(kind: AlertKind, today: string, opts: { dry?: boolean } = {}): Promise<AlertRun> {
  const target = kind === "d1" ? addDays(today, 1) : today;
  const due = dueEvents(target);
  const run: AlertRun = { kind, target, due: due.length, devices: 0, sent: 0, skipped: 0, removed: 0, errors: [] };
  if (!due.length) return run;

  const client = await db();
  const rows = await client.execute("SELECT token, favorites, prefs FROM app_devices");
  const byCompany = new Map<string, DueEvent[]>();
  for (const e of due) byCompany.set(e.companyId, [...(byCompany.get(e.companyId) ?? []), e]);

  const plans: { token: string; events: DueEvent[] }[] = [];
  for (const r of rows.rows) {
    const prefs = parsePrefs(r.prefs);
    if (!prefs[kind]) continue;
    const favorites = cleanFavorites(safeJson(String(r.favorites)));
    const events = favorites.flatMap((id) => byCompany.get(id) ?? []).filter((e) => prefs.types.includes(e.type));
    if (events.length) plans.push({ token: String(r.token), events });
  }
  run.devices = plans.length;
  if (opts.dry) return run;

  // 이미 보낸 일정은 빼고, 보낼 것은 먼저 기록 (크론이 겹쳐 돌아도 한 번만)
  const messages: PushMessage[] = [];
  const now = Date.now();
  for (const p of plans) {
    const fresh: DueEvent[] = [];
    for (const e of p.events) {
      const ins = await client.execute({
        sql: "INSERT OR IGNORE INTO app_push_log (token, event_key, sent_at) VALUES (?, ?, ?)",
        args: [p.token, `${kind}:${e.key}`, now],
      });
      if (ins.rowsAffected > 0) fresh.push(e);
      else run.skipped++;
    }
    if (fresh.length) messages.push(composeMessage(p.token, kind, fresh));
  }

  const tickets = await pushToExpo(messages);
  for (const [i, t] of tickets.entries()) {
    if (t.status === "ok") run.sent++;
    else if (t.details?.error === "DeviceNotRegistered") {
      await removeDevice(messages[i].to);
      run.removed++;
    } else run.errors.push(t.message);
  }

  // 한 달 지난 기록은 정리
  await client.execute({ sql: "DELETE FROM app_push_log WHERE sent_at < ?", args: [now - 31 * 86_400_000] });
  return run;
}
