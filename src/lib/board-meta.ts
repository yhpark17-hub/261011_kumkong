/** 콩밭(익명 게시판) 공통 정보 — 서버·클라이언트 모두에서 사용 */

export type BoardCategory = "free" | "question" | "info" | "review" | "notice";

export const BOARD_NAME = "콩밭";
export const BOARD_TAGLINE = "금공 준비생 익명 게시판";

export const BOARD_CATEGORIES: { key: BoardCategory; label: string; adminOnly?: boolean }[] = [
  { key: "free", label: "자유" },
  { key: "question", label: "질문" },
  { key: "info", label: "정보" },
  { key: "review", label: "후기" },
  { key: "notice", label: "공지", adminOnly: true },
];

export const CATEGORY_LABEL: Record<BoardCategory, string> = Object.fromEntries(
  BOARD_CATEGORIES.map((c) => [c.key, c.label]),
) as Record<BoardCategory, string>;

export function isBoardCategory(v: unknown): v is BoardCategory {
  return typeof v === "string" && v in CATEGORY_LABEL;
}

export const PAGE_SIZE = 20;

/** 게시판 목록 주소 (말머리·추천글·검색어·기관·페이지 조합) */
export function boardHref(p: {
  cat?: BoardCategory | null;
  best?: boolean;
  q?: string | null;
  company?: string | null;
  page?: number;
}): string {
  const u = new URLSearchParams();
  if (p.cat) u.set("cat", p.cat);
  if (p.best) u.set("best", "1");
  if (p.company) u.set("company", p.company);
  if (p.q) u.set("q", p.q);
  if (p.page && p.page > 1) u.set("page", String(p.page));
  const s = u.toString();
  return s ? `/board?${s}` : "/board";
}

export interface PostSummary {
  id: number;
  category: BoardCategory;
  companyId: string | null;
  title: string;
  nickname: string;
  ipPrefix: string;
  isAdmin: boolean;
  isNotice: boolean;
  views: number;
  likes: number;
  commentCount: number;
  status: number;
  createdAt: number;
}

export interface PostDetail extends PostSummary {
  body: string;
  reports: number;
}

export interface CommentItem {
  id: number;
  body: string;
  nickname: string;
  ipPrefix: string;
  isAdmin: boolean;
  status: number;
  createdAt: number;
}

/** 작성 시각 표시: 오늘(todayKey, YYYY-MM-DD)이면 HH:MM, 아니면 MM.DD (한국 시간) */
export function formatPostTime(ms: number, todayKey: string): string {
  // en-CA 는 YYYY-MM-DD 형식
  const key = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).format(ms);
  if (key === todayKey) {
    return new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", hour: "2-digit", minute: "2-digit", hour12: false }).format(ms);
  }
  const parts = new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", month: "2-digit", day: "2-digit" }).formatToParts(ms);
  const m = parts.find((p) => p.type === "month")?.value;
  const d = parts.find((p) => p.type === "day")?.value;
  return `${m}.${d}`;
}

export function formatPostDateTime(ms: number): string {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(ms);
}
