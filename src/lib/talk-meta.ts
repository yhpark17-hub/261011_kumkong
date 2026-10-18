/** 시험별 실시간 응시자 톡 — 서버·화면 공통 */

export const TALK_LIMITS = { body: 300, minBody: 2, links: 1 } as const;
/** 화면에 한 번에 보여 주는 수 (오래된 건 '이전 이야기 더 보기') */
export const TALK_PAGE = 60;
/** 새 이야기를 가져오는 간격 (ms) — 나중에 실시간 채팅으로 바꿀 때 이 부분만 바꾸면 돼요 */
export const TALK_POLL_MS = 8000;
/** 시험 며칠 전부터 열지 (시험 전 '같이 준비해요' 수다) */
export const TALK_OPEN_BEFORE_DAYS = 3;

export interface TalkItem {
  id: number;
  /** 익명 이름 — 브라우저마다 같은 이름 (예: 노란콩 #27) */
  name: string;
  /** 이름 앞 점 색 */
  tone: string;
  body: string;
  createdAt: number;
  /** 내가 쓴 글 */
  mine: boolean;
  /** 이 시험에 후기를 남긴 사람 */
  reviewed: boolean;
  /** 운영자가 쓴 글 ('금콩 운영자' 표시) */
  admin: boolean;
  /** 가려진 글 — 방문자에게는 내용 없이 이유만 (admin: 운영자가 가림 · reports: 신고가 쌓여 가려짐) */
  hidden?: "admin" | "reports";
  /** 운영자에게만: 상태(0 보임 · 1 가림) · 신고 수 */
  status?: number;
  reports?: number;
}

export const TALK_HIDDEN_TEXT = { admin: "운영자에 의해 가려진 메시지입니다.", reports: "신고가 쌓여 가려진 메시지입니다." } as const;
/** 운영자 글 이름 */
export const TALK_ADMIN_NAME = "금콩 운영자";

const COLORS = [
  { word: "노란", tone: "#f2b100" },
  { word: "초록", tone: "#1bb36c" },
  { word: "보라", tone: "#533afd" },
  { word: "분홍", tone: "#e8335a" },
  { word: "하늘", tone: "#2f7fd6" },
  { word: "주황", tone: "#f27a2a" },
  { word: "민트", tone: "#14b8a6" },
  { word: "갈색", tone: "#9b6829" },
] as const;

/** 브라우저 토큰 → 익명 이름 (시험마다 달라서 다른 시험 톡과 이어 볼 수 없게) */
export function talkName(voter: string, examId: string): { name: string; tone: string } {
  let h = 2166136261;
  for (const ch of `${examId}:${voter}`) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
  const c = COLORS[h % COLORS.length];
  return { name: `${c.word}콩 #${String((h >>> 8) % 100).padStart(2, "0")}`, tone: c.tone };
}
