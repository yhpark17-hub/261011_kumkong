import "server-only";
import { mkdirSync } from "node:fs";
import type { Client } from "@libsql/client";

/**
 * 게시판(콩밭)·필기 후기 DB
 * - 로컬: DATABASE_URL=file:data/kumkong.db (SQLite 파일)
 * - 배포(Vercel 등): Turso(libSQL) 주소 + DATABASE_AUTH_TOKEN — 같은 SQL 사용.
 *   서버리스는 디스크가 읽기 전용이라 원격 DB 가 꼭 필요합니다.
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

const LOCAL_URL = "file:data/kumkong.db";

/** Vercel 같은 서버리스 환경은 디스크가 읽기 전용이라 로컬 SQLite 파일을 쓸 수 없습니다 */
function serverless(): boolean {
  return Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
}

function databaseUrl(): string {
  return process.env.DATABASE_URL?.trim() || LOCAL_URL;
}

/**
 * 게시판·후기 DB 를 쓸 수 있는지.
 * 서버리스 배포에서 DATABASE_URL(Turso 등 원격 DB)이 없으면 false — 화면은 '준비 중'으로 대신합니다.
 */
export function dbConfigured(): boolean {
  return !(serverless() && databaseUrl().startsWith("file:"));
}

export class DbUnavailableError extends Error {
  constructor() {
    super(
      "게시판·후기 DB가 설정되지 않았습니다. 배포 환경에 DATABASE_URL(Turso libsql:// 주소)과 DATABASE_AUTH_TOKEN 을 넣어 주세요.",
    );
    this.name = "DbUnavailableError";
  }
}

async function connect(): Promise<Client> {
  const url = databaseUrl();
  if (url.startsWith("file:")) {
    // 로컬 개발: SQLite 파일 (폴더가 없으면 만듦)
    const path = url.slice("file:".length);
    const dir = path.includes("/") ? path.slice(0, path.lastIndexOf("/")) : "";
    if (dir) mkdirSync(dir, { recursive: true });
    const { createClient } = await import("@libsql/client");
    return createClient({ url });
  }
  // 원격(Turso): 네이티브 모듈이 필요 없는 HTTP 클라이언트
  const { createClient } = await import("@libsql/client/web");
  return createClient({ url, authToken: process.env.DATABASE_AUTH_TOKEN });
}

let pending: Promise<Client> | null = null;

export async function db(): Promise<Client> {
  if (!dbConfigured()) throw new DbUnavailableError();
  pending ??= connect()
    .then(async (c) => {
      await migrate(c);
      return c;
    })
    .catch((err) => {
      // 연결·초기화에 실패하면 다음 요청에서 다시 시도
      pending = null;
      throw err;
    });
  return pending;
}
