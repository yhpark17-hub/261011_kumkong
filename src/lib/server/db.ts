import "server-only";
import { mkdirSync } from "node:fs";
import { createClient, type Client } from "@libsql/client";

/**
 * 게시판(콩밭)·필기 후기 DB
 * - 로컬: DATABASE_URL=file:data/kumkong.db (SQLite 파일)
 * - 배포: Turso(libSQL) 주소 + DATABASE_AUTH_TOKEN — 코드 변경 없이 같은 SQL 사용
 */

const SCHEMA = `
CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL,
  company_id TEXT,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  nickname TEXT NOT NULL,
  pw_hash TEXT,
  ip_hash TEXT NOT NULL,
  ip_prefix TEXT NOT NULL,
  is_admin INTEGER NOT NULL DEFAULT 0,
  is_notice INTEGER NOT NULL DEFAULT 0,
  views INTEGER NOT NULL DEFAULT 0,
  likes INTEGER NOT NULL DEFAULT 0,
  comment_count INTEGER NOT NULL DEFAULT 0,
  reports INTEGER NOT NULL DEFAULT 0,
  status INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_posts_list ON posts (status, is_notice, id DESC);
CREATE INDEX IF NOT EXISTS idx_posts_company ON posts (company_id, status, id DESC);

CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL,
  body TEXT NOT NULL,
  nickname TEXT NOT NULL,
  pw_hash TEXT,
  ip_hash TEXT NOT NULL,
  ip_prefix TEXT NOT NULL,
  is_admin INTEGER NOT NULL DEFAULT 0,
  reports INTEGER NOT NULL DEFAULT 0,
  status INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_comments_post ON comments (post_id, id);

CREATE TABLE IF NOT EXISTS post_likes (
  post_id INTEGER NOT NULL,
  voter TEXT NOT NULL,
  PRIMARY KEY (post_id, voter)
);

CREATE TABLE IF NOT EXISTS reports (
  target_type TEXT NOT NULL,
  target_id INTEGER NOT NULL,
  reporter TEXT NOT NULL,
  reason TEXT,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (target_type, target_id, reporter)
);

CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY,
  at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS exam_reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  exam_id TEXT NOT NULL,
  voter TEXT NOT NULL,
  ip_hash TEXT NOT NULL,
  track TEXT,
  overall INTEGER NOT NULL,
  time_pressure INTEGER NOT NULL,
  style TEXT,
  hardest TEXT,
  subjects TEXT NOT NULL DEFAULT '{}',
  unsolved TEXT NOT NULL DEFAULT '{}',
  totals TEXT NOT NULL DEFAULT '{}',
  one_liner TEXT,
  detail TEXT,
  reports INTEGER NOT NULL DEFAULT 0,
  status INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE (exam_id, voter)
);
CREATE INDEX IF NOT EXISTS idx_reviews_exam ON exam_reviews (exam_id, status);

-- 기관 정보 제보 · 공고 제보 · 사이트 의견 (운영자만 열람)
CREATE TABLE IF NOT EXISTS feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL,
  topic TEXT,
  company_id TEXT,
  company_name TEXT,
  page TEXT,
  body TEXT NOT NULL,
  source_url TEXT,
  contact TEXT,
  ip_hash TEXT NOT NULL,
  status INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  handled_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback (status, id DESC);
`;

/** 이미 만들어진 DB 에 나중에 추가한 열 (없으면 ALTER TABLE 로 붙입니다) */
const ADDED_COLUMNS: { table: string; column: string; ddl: string }[] = [
  // 섹션별 못 푼(찍은) 문항 수 구간, 응시자가 알려 준 총 문항 수 — 2026-10 추가
  { table: "exam_reviews", column: "unsolved", ddl: "ALTER TABLE exam_reviews ADD COLUMN unsolved TEXT NOT NULL DEFAULT '{}'" },
  { table: "exam_reviews", column: "totals", ddl: "ALTER TABLE exam_reviews ADD COLUMN totals TEXT NOT NULL DEFAULT '{}'" },
];

async function migrate(c: Client) {
  await c.executeMultiple(SCHEMA);
  for (const m of ADDED_COLUMNS) {
    const info = await c.execute(`PRAGMA table_info(${m.table})`);
    if (!info.rows.some((r) => r.name === m.column)) await c.execute(m.ddl);
  }
}

/** status: 0 = 공개, 1 = 숨김(신고 누적·운영자), 2 = 삭제 */
export const STATUS = { visible: 0, hidden: 1, deleted: 2 } as const;

let client: Client | null = null;
let ready: Promise<void> | null = null;

function databaseUrl() {
  const url = process.env.DATABASE_URL ?? "file:data/kumkong.db";
  if (url.startsWith("file:")) {
    const path = url.slice("file:".length);
    const dir = path.includes("/") ? path.slice(0, path.lastIndexOf("/")) : "";
    if (dir) mkdirSync(dir, { recursive: true });
  }
  return url;
}

export async function db(): Promise<Client> {
  if (!client) {
    client = createClient({ url: databaseUrl(), authToken: process.env.DATABASE_AUTH_TOKEN });
    ready = migrate(client);
  }
  await ready;
  return client;
}
