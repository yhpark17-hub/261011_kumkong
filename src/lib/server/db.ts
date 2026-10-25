import "server-only";
import { mkdirSync } from "node:fs";
import type { Client } from "@libsql/client";
import { seedMagazine } from "./magazine-seed";

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
  attachments TEXT NOT NULL DEFAULT '[]',
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
-- 시험별 실시간 응시자 톡 (익명 · 브라우저 토큰으로 이름·내 글 표시)
CREATE TABLE IF NOT EXISTS exam_talk (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  exam_id TEXT NOT NULL,
  voter TEXT NOT NULL,
  body TEXT NOT NULL,
  ip_hash TEXT NOT NULL,
  reports INTEGER NOT NULL DEFAULT 0,
  status INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_exam_talk ON exam_talk (exam_id, id);

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

-- 방문 통계 (자체 수집) — IP 는 저장하지 않고, 브라우저별 무작위 ID 만 씁니다
CREATE TABLE IF NOT EXISTS page_views (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  view_id TEXT NOT NULL UNIQUE,
  at INTEGER NOT NULL,
  day TEXT NOT NULL,
  path TEXT NOT NULL,
  visitor TEXT NOT NULL,
  session TEXT NOT NULL,
  referrer TEXT,
  device TEXT NOT NULL,
  duration_ms INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_views_day ON page_views (day);
CREATE INDEX IF NOT EXISTS idx_views_at ON page_views (at);
CREATE INDEX IF NOT EXISTS idx_views_path ON page_views (path, day);

-- 업로드 기록 (도배 방지용 사용량 집계)
CREATE TABLE IF NOT EXISTS uploads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ip_hash TEXT NOT NULL,
  url TEXT NOT NULL,
  size INTEGER NOT NULL,
  purpose TEXT NOT NULL,
  at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_uploads_ip ON uploads (ip_hash, at);

-- 운영자가 차단한 작성자 (IP 해시 기준)
CREATE TABLE IF NOT EXISTS bans (
  ip_hash TEXT PRIMARY KEY,
  reason TEXT,
  sample TEXT,
  created_at INTEGER NOT NULL
);

-- 매거진 (운영진 글·데일리 브리핑·웹툰)
-- status: 0 = 임시저장, 1 = 발행 (published_at 이 미래면 예약 발행)
CREATE TABLE IF NOT EXISTS articles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  cover_url TEXT,
  body TEXT NOT NULL,
  tags TEXT NOT NULL DEFAULT '',
  author TEXT NOT NULL DEFAULT '금콩 에디터',
  read_minutes INTEGER NOT NULL DEFAULT 1,
  status INTEGER NOT NULL DEFAULT 0,
  featured INTEGER NOT NULL DEFAULT 0,
  source TEXT NOT NULL DEFAULT 'admin',
  published_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  views INTEGER NOT NULL DEFAULT 0,
  likes INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_articles_pub ON articles (status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_cat ON articles (category, status, published_at DESC);

CREATE TABLE IF NOT EXISTS article_likes (
  article_id INTEGER NOT NULL,
  voter TEXT NOT NULL,
  PRIMARY KEY (article_id, voter)
);

-- 데일리 브리핑 추천 (같은 사람은 호마다 한 번)
CREATE TABLE IF NOT EXISTS issue_likes (
  issue_id INTEGER NOT NULL,
  voter TEXT NOT NULL,
  PRIMARY KEY (issue_id, voter)
);

-- 자동 점검(클라우드 에이전트)이 올린 제안 — 운영자가 승인·거절해야 사이트에 반영
-- status: 0 = 검토 대기, 1 = 승인(반영 대기), 2 = 반영 완료, 3 = 거절, 4 = 반영 실패
CREATE TABLE IF NOT EXISTS proposals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  analysis TEXT NOT NULL,
  company_id TEXT,
  feedback_id INTEGER,
  options TEXT NOT NULL DEFAULT '[]',
  recommended TEXT,
  sources TEXT NOT NULL DEFAULT '[]',
  confidence TEXT,
  dedupe_key TEXT UNIQUE,
  run_id TEXT,
  status INTEGER NOT NULL DEFAULT 0,
  choice TEXT,
  admin_note TEXT,
  result TEXT,
  created_at INTEGER NOT NULL,
  decided_at INTEGER,
  applied_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_proposals_status ON proposals (status, id DESC);

-- 데일리 브리핑: 뉴스·오늘의 용어·면접 질문 한 건 = 한 줄 (분류·많이 본 기사·날짜별 모아 보기)
-- section: finance·economy·policy·global·public(뉴스) · term(용어) · question(면접 질문)
-- edition: morning(아침판) · noon(금콩 스터디) · '' / status: 0 = 초안, 1 = 공개
CREATE TABLE IF NOT EXISTS news (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  edition_date TEXT NOT NULL,
  edition TEXT NOT NULL DEFAULT '',
  section TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  point TEXT NOT NULL DEFAULT '',
  source_name TEXT NOT NULL DEFAULT '',
  source_url TEXT,
  image_url TEXT,
  image_credit TEXT NOT NULL DEFAULT '',
  tier TEXT NOT NULL DEFAULT 'key',
  position INTEGER NOT NULL DEFAULT 0,
  takeaway TEXT NOT NULL DEFAULT '',
  cards TEXT NOT NULL DEFAULT '[]',
  short TEXT NOT NULL DEFAULT '',
  pic TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '[]',
  headline INTEGER NOT NULL DEFAULT 0,
  status INTEGER NOT NULL DEFAULT 0,
  origin TEXT NOT NULL DEFAULT 'admin',
  published_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  views INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_news_date ON news (status, edition_date DESC, id);
CREATE INDEX IF NOT EXISTS idx_news_section ON news (section, status, published_at DESC);

-- 데일리 브리핑 (호): 날짜·판(morning 아침판 / noon 금콩 스터디)마다 한 호. 그날 그 판의 기사(news.edition_date·edition)를 한 편으로 묶음
-- 아침판 = 기사 카드뉴스 (예전 호는 퀴즈 quiz JSON 도), 금콩 스터디 = 용어·면접 질문 / vol 은 판별로 처음 발행할 때 정해짐 (초안은 0) / status: 0 = 초안, 1 = 발행
CREATE TABLE IF NOT EXISTS briefing_issues (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  issue_date TEXT NOT NULL,
  edition TEXT NOT NULL DEFAULT 'morning',
  vol INTEGER NOT NULL DEFAULT 0,
  title TEXT NOT NULL,
  lede TEXT NOT NULL DEFAULT '',
  closing TEXT NOT NULL DEFAULT '',
  quiz TEXT NOT NULL DEFAULT '[]',
  extras TEXT NOT NULL DEFAULT '{}',
  status INTEGER NOT NULL DEFAULT 0,
  origin TEXT NOT NULL DEFAULT 'admin',
  published_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  views INTEGER NOT NULL DEFAULT 0,
  UNIQUE (issue_date, edition)
);
CREATE INDEX IF NOT EXISTS idx_issues_date ON briefing_issues (status, issue_date DESC);

-- 작은 설정값 (시드 여부, 마지막 자동 점검 시각 등)
CREATE TABLE IF NOT EXISTS kv (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);
`;

/** 이미 만들어진 DB 에 나중에 추가한 열 (없으면 ALTER TABLE 로 붙입니다) */
const ADDED_COLUMNS: { table: string; column: string; ddl: string }[] = [
  // 섹션별 못 푼(찍은) 문항 수 구간, 응시자가 알려 준 총 문항 수 — 2026-10 추가
  { table: "exam_reviews", column: "unsolved", ddl: "ALTER TABLE exam_reviews ADD COLUMN unsolved TEXT NOT NULL DEFAULT '{}'" },
  { table: "exam_reviews", column: "totals", ddl: "ALTER TABLE exam_reviews ADD COLUMN totals TEXT NOT NULL DEFAULT '{}'" },
  // 콩밭 글 첨부(사진·파일) — 2026-10 추가
  { table: "posts", column: "attachments", ddl: "ALTER TABLE posts ADD COLUMN attachments TEXT NOT NULL DEFAULT '[]'" },
  // 브리핑 아침판·금콩 스터디 — 2026-10 추가
  { table: "news", column: "edition", ddl: "ALTER TABLE news ADD COLUMN edition TEXT NOT NULL DEFAULT ''" },
  // 브리핑 헤드라인 사진 (운영자가 올린 것만) — 2026-10 추가
  { table: "news", column: "image_url", ddl: "ALTER TABLE news ADD COLUMN image_url TEXT" },
  { table: "news", column: "image_credit", ddl: "ALTER TABLE news ADD COLUMN image_credit TEXT NOT NULL DEFAULT ''" },
  // 레터 안에서의 비중(key 핵심 / brief 한 줄)·순서·한 줄 요약 — 2026-10 추가
  { table: "news", column: "tier", ddl: "ALTER TABLE news ADD COLUMN tier TEXT NOT NULL DEFAULT 'key'" },
  { table: "news", column: "position", ddl: "ALTER TABLE news ADD COLUMN position INTEGER NOT NULL DEFAULT 0" },
  { table: "news", column: "takeaway", ddl: "ALTER TABLE news ADD COLUMN takeaway TEXT NOT NULL DEFAULT ''" },
  // 아침판 기사 카드뉴스 (표지·'왜 중요할까' 사이 장들, JSON) — 2026-10 추가
  { table: "news", column: "cards", ddl: "ALTER TABLE news ADD COLUMN cards TEXT NOT NULL DEFAULT '[]'" },
  // 아침판 시간표에 쓰는 짧은 이름 · 카드뉴스 표지 그림 — 2026-10 추가
  { table: "news", column: "short", ddl: "ALTER TABLE news ADD COLUMN short TEXT NOT NULL DEFAULT ''" },
  { table: "news", column: "pic", ddl: "ALTER TABLE news ADD COLUMN pic TEXT NOT NULL DEFAULT ''" },
  // 카드뉴스 각주 — 이 기사의 어려운 말 풀이 [{ term, text }] — 2026-10 추가
  { table: "news", column: "notes", ddl: "ALTER TABLE news ADD COLUMN notes TEXT NOT NULL DEFAULT '[]'" },
  // 금콩 스터디 코너(숫자로 보는 오늘·논술 한 문단) — 2026-10 추가
  { table: "briefing_issues", column: "extras", ddl: "ALTER TABLE briefing_issues ADD COLUMN extras TEXT NOT NULL DEFAULT '{}'" },
  // 블로그 글 강조 표시(인기·NEW·추천·필독) — 운영자가 고름, 2026-10 추가
  { table: "articles", column: "badge", ddl: "ALTER TABLE articles ADD COLUMN badge TEXT NOT NULL DEFAULT ''" },
  // 글 썸네일 설정 (그림·기관·제목 — 비면 자동) — 2026-10 추가
  { table: "articles", column: "thumb", ddl: "ALTER TABLE articles ADD COLUMN thumb TEXT NOT NULL DEFAULT ''" },
  // 실시간 톡을 기관별 방으로 (필기 후기·기관 정보 페이지가 같은 방) — 2026-10 추가
  { table: "exam_talk", column: "company_id", ddl: "ALTER TABLE exam_talk ADD COLUMN company_id TEXT NOT NULL DEFAULT ''" },
  // 데일리 브리핑 추천 수 — 2026-10 추가
  { table: "briefing_issues", column: "likes", ddl: "ALTER TABLE briefing_issues ADD COLUMN likes INTEGER NOT NULL DEFAULT 0" },
  // 실시간 톡 운영자 글 표시 — 2026-10 추가
  { table: "exam_talk", column: "is_admin", ddl: "ALTER TABLE exam_talk ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0" },
  // 의견 보내기 첨부(사진·파일) — 2026-10 추가
  { table: "feedback", column: "attachments", ddl: "ALTER TABLE feedback ADD COLUMN attachments TEXT NOT NULL DEFAULT '[]'" },
  // 브리핑 썸네일 설정(만화 변장·말풍선·논술 주제·올린 그림·사이트 표지) — 2026-10 추가
  { table: "briefing_issues", column: "thumb", ddl: "ALTER TABLE briefing_issues ADD COLUMN thumb TEXT NOT NULL DEFAULT '{}'" },
];

async function migrate(c: Client) {
  await c.executeMultiple(SCHEMA);
  for (const m of ADDED_COLUMNS) {
    const info = await c.execute(`PRAGMA table_info(${m.table})`);
    if (!info.rows.some((r) => r.name === m.column)) await c.execute(m.ddl);
  }
  await upgradeIssues(c);
  await talkRooms(c);
  await seedMagazine(c);
}

/** 실시간 톡 기관 방: 예전 글(시험 id = 기관id-YYYY-MM-DD)에 기관 id 채우기 + 방별 색인 */
async function talkRooms(c: Client) {
  await c.execute("UPDATE exam_talk SET company_id = substr(exam_id, 1, length(exam_id) - 11) WHERE company_id = '' AND exam_id GLOB '*-[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'");
  await c.execute("CREATE INDEX IF NOT EXISTS idx_exam_talk_room ON exam_talk (company_id, id)");
}

/**
 * 2026-10-16: 브리핑 호를 '하루 한 호' → '날짜·판마다 한 호'로 (UNIQUE 를 바꾸려면 표를 다시 만들어야 함).
 * 판(edition)·퀴즈(quiz) 칸이 없는 예전 표만 옮깁니다.
 */
async function upgradeIssues(c: Client) {
  const cols = (await c.execute("PRAGMA table_info(briefing_issues)")).rows.map((r) => String(r.name));
  if (cols.includes("edition")) return;
  try {
    await c.batch(
      [
        "DROP TABLE IF EXISTS briefing_issues_v2",
        `CREATE TABLE briefing_issues_v2 (
          id INTEGER PRIMARY KEY AUTOINCREMENT, issue_date TEXT NOT NULL, edition TEXT NOT NULL DEFAULT 'morning', vol INTEGER NOT NULL DEFAULT 0,
          title TEXT NOT NULL, lede TEXT NOT NULL DEFAULT '', closing TEXT NOT NULL DEFAULT '', quiz TEXT NOT NULL DEFAULT '[]', extras TEXT NOT NULL DEFAULT '{}',
          status INTEGER NOT NULL DEFAULT 0, origin TEXT NOT NULL DEFAULT 'admin', published_at INTEGER, created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL, views INTEGER NOT NULL DEFAULT 0, UNIQUE (issue_date, edition))`,
        `INSERT INTO briefing_issues_v2 (id, issue_date, edition, vol, title, lede, closing, status, origin, published_at, created_at, updated_at, views)
          SELECT id, issue_date, 'morning', vol, title, lede, closing, status, origin, published_at, created_at, updated_at, views FROM briefing_issues`,
        "DROP TABLE briefing_issues",
        "ALTER TABLE briefing_issues_v2 RENAME TO briefing_issues",
        "CREATE INDEX IF NOT EXISTS idx_issues_date ON briefing_issues (status, issue_date DESC)",
      ],
      "write",
    );
  } catch (e) {
    // 다른 서버가 동시에 옮겼으면 이미 끝난 것
    const again = (await c.execute("PRAGMA table_info(briefing_issues)")).rows.map((r) => String(r.name));
    if (!again.includes("edition")) throw e;
  }
}

/** status: 0 = 공개, 1 = 숨김(신고 누적·운영자), 2 = 삭제 */
export const STATUS = { visible: 0, hidden: 1, deleted: 2 } as const;

const LOCAL_URL = "file:data/kumkong.db";

/** Vercel 같은 서버리스 환경은 디스크가 읽기 전용이라 로컬 SQLite 파일을 쓸 수 없습니다 */
export function serverless(): boolean {
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
