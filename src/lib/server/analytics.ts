import "server-only";
import { addDays, todayKST } from "../date";
import { getCompany } from "../data";
import { db } from "./db";
import { getExam } from "./reviews";

/** 방문 통계 조회 (운영자 화면 전용). 날짜는 한국 시간 기준 'YYYY-MM-DD'. */

export interface Range {
  from: string;
  to: string;
  days: number;
}

/** 오늘을 끝으로 하는 n일 구간 (connection() 이후에 호출) */
export function lastDays(days: number): Range {
  const to = todayKST();
  return { from: addDays(to, -(days - 1)), to, days };
}

/** 바로 앞 같은 길이 구간 (증감 비교용) */
export function previousRange(r: Range): Range {
  return { from: addDays(r.from, -r.days), to: addDays(r.from, -1), days: r.days };
}

export interface Summary {
  views: number;
  visitors: number;
  sessions: number;
  /** 페이지 한 번 볼 때 평균 머문 시간 (ms, 측정된 열람만) */
  avgViewMs: number | null;
  /** 방문 한 번(세션)에 머문 시간 합의 평균 (ms) */
  avgSessionMs: number | null;
  devices: Record<"mobile" | "tablet" | "desktop", number>;
}

export async function summary(r: Range): Promise<Summary> {
  const client = await db();
  const [totals, devices] = await Promise.all([
    client.execute({
      sql: `SELECT COUNT(*) AS views, COUNT(DISTINCT visitor) AS visitors, COUNT(DISTINCT session) AS sessions,
                   AVG(CASE WHEN duration_ms > 0 THEN duration_ms END) AS avg_view,
                   SUM(duration_ms) AS total_ms
            FROM page_views WHERE day BETWEEN ? AND ?`,
      args: [r.from, r.to],
    }),
    client.execute({
      sql: "SELECT device, COUNT(DISTINCT visitor) AS n FROM page_views WHERE day BETWEEN ? AND ? GROUP BY device",
      args: [r.from, r.to],
    }),
  ]);
  const t = totals.rows[0];
  const sessions = Number(t?.sessions ?? 0);
  const deviceCounts = { mobile: 0, tablet: 0, desktop: 0 };
  for (const row of devices.rows) {
    const d = String(row.device) as keyof typeof deviceCounts;
    if (d in deviceCounts) deviceCounts[d] = Number(row.n);
  }
  return {
    views: Number(t?.views ?? 0),
    visitors: Number(t?.visitors ?? 0),
    sessions,
    avgViewMs: t?.avg_view == null ? null : Number(t.avg_view),
    avgSessionMs: sessions ? Number(t?.total_ms ?? 0) / sessions : null,
    devices: deviceCounts,
  };
}

export interface DayPoint {
  day: string;
  views: number;
  visitors: number;
  avgViewMs: number | null;
}

export async function daily(r: Range): Promise<DayPoint[]> {
  const client = await db();
  const res = await client.execute({
    sql: `SELECT day, COUNT(*) AS views, COUNT(DISTINCT visitor) AS visitors,
                 AVG(CASE WHEN duration_ms > 0 THEN duration_ms END) AS avg_view
          FROM page_views WHERE day BETWEEN ? AND ? GROUP BY day`,
    args: [r.from, r.to],
  });
  const byDay = new Map(res.rows.map((row) => [String(row.day), row]));
  const out: DayPoint[] = [];
  for (let i = 0; i < r.days; i++) {
    const day = addDays(r.from, i);
    const row = byDay.get(day);
    out.push({
      day,
      views: Number(row?.views ?? 0),
      visitors: Number(row?.visitors ?? 0),
      avgViewMs: row?.avg_view == null ? null : Number(row.avg_view),
    });
  }
  return out;
}

export interface PageRow {
  path: string;
  label: string;
  views: number;
  visitors: number;
  avgViewMs: number | null;
}

/** 경로를 사람이 읽는 이름으로 (기관명·시험명·글 제목) */
async function labelPaths(paths: string[]): Promise<Map<string, string>> {
  const labels = new Map<string, string>();
  const STATIC: Record<string, string> = {
    "/": "채용 캘린더 (홈)",
    "/companies": "기관 정보·경쟁률",
    "/reviews": "필기 후기 목록",
    "/board": "콩밭 목록",
    "/board/write": "콩밭 글쓰기",
    "/board/policy": "콩밭 이용 수칙",
    "/magazine": "매거진 · 데일리 브리핑",
    "/magazine/blog": "매거진 · 금융 블로그",
    "/magazine/archive": "매거진 · 전체 브리핑",
    "/about": "서비스 소개",
    "/privacy": "개인정보처리방침",
  };
  const postIds: number[] = [];
  const articleIds: number[] = [];
  const newsIds: number[] = [];
  const letterDates: string[] = [];
  for (const p of paths) {
    if (STATIC[p]) labels.set(p, STATIC[p]);
    const company = p.match(/^\/companies\/([^/]+)$/);
    if (company) labels.set(p, getCompany(company[1])?.name ?? p);
    const exam = p.match(/^\/reviews\/([^/]+)$/);
    if (exam) {
      const e = getExam(exam[1]);
      labels.set(p, e ? `후기 · ${e.companyName} ${e.label}` : p);
    }
    const post = p.match(/^\/board\/(\d+)$/);
    if (post) postIds.push(Number(post[1]));
    const article = p.match(/^\/magazine\/(\d+)$/);
    if (article) articleIds.push(Number(article[1]));
    const news = p.match(/^\/magazine\/news\/(\d+)$/);
    if (news) newsIds.push(Number(news[1]));
    const letter = p.match(/^\/magazine\/letter\/(\d{4}-\d{2}-\d{2})\/(morning|noon)$/);
    if (letter) letterDates.push(letter[1]);
  }
  if (postIds.length) {
    const client = await db();
    const res = await client.execute({
      sql: `SELECT id, title FROM posts WHERE id IN (${postIds.map(() => "?").join(",")})`,
      args: postIds,
    });
    for (const row of res.rows) labels.set(`/board/${row.id}`, `콩밭 · ${row.title}`);
  }
  if (articleIds.length) {
    const client = await db();
    const res = await client.execute({
      sql: `SELECT id, title FROM articles WHERE id IN (${articleIds.map(() => "?").join(",")})`,
      args: articleIds,
    });
    for (const row of res.rows) labels.set(`/magazine/${row.id}`, `매거진 · ${row.title}`);
  }
  if (newsIds.length) {
    const client = await db();
    const res = await client.execute({
      sql: `SELECT id, title FROM news WHERE id IN (${newsIds.map(() => "?").join(",")})`,
      args: newsIds,
    });
    for (const row of res.rows) labels.set(`/magazine/news/${row.id}`, `브리핑 · ${row.title}`);
  }
  if (letterDates.length) {
    const client = await db();
    const res = await client.execute({
      sql: `SELECT issue_date, edition, vol, title FROM briefing_issues WHERE issue_date IN (${letterDates.map(() => "?").join(",")})`,
      args: letterDates,
    });
    for (const row of res.rows)
      labels.set(`/magazine/letter/${row.issue_date}/${row.edition}`, `브리핑 ${row.edition === "noon" ? "금콩 스터디" : "아침판"} Vol.${row.vol} · ${row.title}`);
  }
  for (const p of paths) if (!labels.has(p)) labels.set(p, p);
  return labels;
}

export async function topPages(r: Range, limit = 20): Promise<PageRow[]> {
  const client = await db();
  const res = await client.execute({
    sql: `SELECT path, COUNT(*) AS views, COUNT(DISTINCT visitor) AS visitors,
                 AVG(CASE WHEN duration_ms > 0 THEN duration_ms END) AS avg_view
          FROM page_views WHERE day BETWEEN ? AND ?
          GROUP BY path ORDER BY views DESC LIMIT ?`,
    args: [r.from, r.to, limit],
  });
  const labels = await labelPaths(res.rows.map((row) => String(row.path)));
  return res.rows.map((row) => ({
    path: String(row.path),
    label: labels.get(String(row.path)) ?? String(row.path),
    views: Number(row.views),
    visitors: Number(row.visitors),
    avgViewMs: row.avg_view == null ? null : Number(row.avg_view),
  }));
}

const SECTION_LABEL: Record<string, string> = {
  "/": "채용 캘린더",
  "/companies": "기관 정보",
  "/reviews": "필기 후기",
  "/board": "콩밭",
  "/magazine": "매거진",
  "/about": "소개·안내",
  "/privacy": "소개·안내",
};

/** 메뉴(첫 경로)별 조회수 */
export async function sections(r: Range): Promise<{ key: string; label: string; views: number; visitors: number }[]> {
  const client = await db();
  const res = await client.execute({
    sql: `SELECT CASE WHEN path = '/' THEN '/'
                      ELSE '/' || substr(path, 2, instr(substr(path, 2) || '/', '/') - 1) END AS section,
                 COUNT(*) AS views, COUNT(DISTINCT visitor) AS visitors
          FROM page_views WHERE day BETWEEN ? AND ? GROUP BY section ORDER BY views DESC`,
    args: [r.from, r.to],
  });
  const merged = new Map<string, { key: string; label: string; views: number; visitors: number }>();
  for (const row of res.rows) {
    const key = String(row.section);
    const label = SECTION_LABEL[key] ?? key;
    const prev = merged.get(label);
    if (prev) {
      prev.views += Number(row.views);
      prev.visitors += Number(row.visitors);
    } else merged.set(label, { key, label, views: Number(row.views), visitors: Number(row.visitors) });
  }
  return [...merged.values()].sort((a, b) => b.views - a.views);
}

/** 외부 유입 경로 (처음 들어온 페이지 기준) */
export async function referrers(r: Range, limit = 10): Promise<{ host: string; visitors: number }[]> {
  const client = await db();
  const res = await client.execute({
    sql: `SELECT referrer AS host, COUNT(DISTINCT visitor) AS visitors FROM page_views
          WHERE day BETWEEN ? AND ? AND referrer IS NOT NULL
          GROUP BY referrer ORDER BY visitors DESC LIMIT ?`,
    args: [r.from, r.to, limit],
  });
  return res.rows.map((row) => ({ host: String(row.host), visitors: Number(row.visitors) }));
}

/** 최근 5분 안에 페이지를 연 방문자 수 */
export async function activeNow(): Promise<number> {
  const client = await db();
  const res = await client.execute({
    sql: "SELECT COUNT(DISTINCT visitor) AS n FROM page_views WHERE at > ?",
    args: [Date.now() - 5 * 60 * 1000],
  });
  return Number(res.rows[0]?.n ?? 0);
}
