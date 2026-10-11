/** 제보·의견 보내기 공통 정보 — 서버·클라이언트 모두에서 사용 */

export type FeedbackKind = "correction" | "posting" | "site";

export const FEEDBACK_KINDS: Record<
  FeedbackKind,
  { label: string; eyebrow: string; title: string; desc: string; topics: string[]; placeholder: string; askSource: boolean }
> = {
  correction: {
    label: "기관 정보 제보",
    eyebrow: "정보 제보",
    title: "정보 제보",
    desc: "일정·필기·경쟁률·자소서 항목 등 다른 점을 알려 주시면 확인 후 고칠게요.",
    topics: ["채용 일정", "필기·전공", "경쟁률", "자소서 항목", "직렬·인원", "기타"],
    placeholder:
      "예) 2차 면접 일정이 11월 24일로 나와 있는데, 공고문에는 11월 25~26일이에요. 공고문 7페이지 '전형 일정'에 나와 있어요.",
    askSource: true,
  },
  posting: {
    label: "공고 제보",
    eyebrow: "공고 제보",
    title: "채용 공고 제보",
    desc: "새 공고, 일정 변경, 추가했으면 하는 기관을 알려 주세요.",
    topics: ["새 공고", "일정 변경", "기관 추가 요청", "기타"],
    placeholder: "예) 한국○○공사 2026 하반기 신입 공고가 10월 20일에 올라왔어요. 서류 마감 11월 3일 18시, 필기 11월 22일이에요.",
    askSource: true,
  },
  site: {
    label: "사이트 의견",
    eyebrow: "의견 보내기",
    title: "금콩에 의견 보내기",
    desc: "불편한 점, 있었으면 하는 기능, 고쳐야 할 부분 무엇이든 좋아요.",
    topics: ["오류·버그", "기능 제안", "디자인·사용성", "데이터 요청", "기타"],
    placeholder: "예) 달력에서 관심 기관만 모아 보는 기능이 있으면 좋겠어요. / 모바일에서 ○○ 버튼이 잘 안 눌려요.",
    askSource: false,
  },
};

export function isFeedbackKind(v: unknown): v is FeedbackKind {
  return typeof v === "string" && v in FEEDBACK_KINDS;
}

export const FEEDBACK_LIMITS = { body: 3000, minBody: 10, companyName: 40, source: 500, contact: 100 } as const;

export interface FeedbackItem {
  id: number;
  kind: FeedbackKind;
  topic: string | null;
  companyId: string | null;
  companyName: string | null;
  page: string | null;
  body: string;
  sourceUrl: string | null;
  contact: string | null;
  status: number;
  createdAt: number;
  handledAt: number | null;
}
