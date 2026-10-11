import type { Blind, Category, EventType, MajorType } from "./types";

interface EventMeta {
  label: string;
  /** 캘린더 칩용 2글자 라벨 */
  short: string;
  /** 정렬 우선순위 (작을수록 위) */
  order: number;
  dot: string;
  text: string;
  soft: string;
  border: string;
}

/** Tailwind가 클래스를 인식할 수 있도록 전체 문자열로 적습니다. */
export const EVENT_META: Record<EventType, EventMeta> = {
  doc: {
    label: "서류 마감",
    short: "서류",
    order: 0,
    dot: "bg-ev-doc",
    text: "text-ev-doc",
    soft: "bg-ev-doc-soft",
    border: "border-ev-doc",
  },
  written: {
    label: "필기시험",
    short: "필기",
    order: 1,
    dot: "bg-ev-written",
    text: "text-ev-written",
    soft: "bg-ev-written-soft",
    border: "border-ev-written",
  },
  interview1: {
    label: "1차 면접",
    short: "1면",
    order: 2,
    dot: "bg-ev-interview1",
    text: "text-ev-interview1",
    soft: "bg-ev-interview1-soft",
    border: "border-ev-interview1",
  },
  interview2: {
    label: "2차 면접",
    short: "2면",
    order: 3,
    dot: "bg-ev-interview2",
    text: "text-ev-interview2",
    soft: "bg-ev-interview2-soft",
    border: "border-ev-interview2",
  },
  final: {
    label: "최종 발표",
    short: "발표",
    order: 4,
    dot: "bg-ev-final",
    text: "text-ev-final",
    soft: "bg-ev-final-soft",
    border: "border-ev-final",
  },
  posting: {
    label: "접수 시작",
    short: "접수",
    order: 5,
    dot: "bg-ev-posting",
    text: "text-ev-posting",
    soft: "bg-ev-posting-soft",
    border: "border-ev-posting",
  },
};

/** 전형 진행 순서 (타임라인용) */
export const EVENT_SEQUENCE: EventType[] = [
  "posting",
  "doc",
  "written",
  "interview1",
  "interview2",
  "final",
];

/** 필터 바에 노출하는 순서 */
export const EVENT_FILTER_ORDER: EventType[] = [
  "doc",
  "written",
  "interview1",
  "interview2",
  "final",
  "posting",
];

export const CATEGORY_META: Record<Category, { label: string; desc: string }> = {
  finance: { label: "금융공기업", desc: "금융위·기재부 산하 금융 공공기관" },
  fininfra: { label: "금융유관기관", desc: "금융결제원·금융보안원 등 준금융공기업" },
  public: { label: "일반 공공기관", desc: "연금·보험·SOC·에너지 등 일반 공공기관" },
  mutual: { label: "공제회·조합", desc: "공제회, 공제조합" },
  assoc: { label: "중앙회", desc: "농협·수협·신협·새마을금고" },
  bank: { label: "시중은행", desc: "시중은행 신입 공채" },
  insurance: { label: "보험·증권", desc: "재보험, 증권금융 등" },
  capital: { label: "캐피탈", desc: "정책금융 계열 캐피탈" },
};

export const CATEGORY_ORDER: Category[] = [
  "finance",
  "fininfra",
  "public",
  "mutual",
  "assoc",
  "insurance",
  "bank",
  "capital",
];

export const BLIND_META: Record<Blind, { label: string; desc: string; tone: string }> = {
  full: {
    label: "블라인드",
    desc: "학교·학점·사진 등 비공개 (공공기관 블라인드 채용)",
    tone: "text-ev-final bg-ev-final-soft",
  },
  partial: {
    label: "부분 블라인드",
    desc: "일부 항목(학교명 등)만 비공개",
    tone: "text-ev-interview2 bg-ev-interview2-soft",
  },
  none: {
    label: "비블라인드",
    desc: "학력·자격 등 기재",
    tone: "text-ink-secondary bg-canvas-soft",
  },
  unknown: { label: "확인 중", desc: "공고 확인 필요", tone: "text-ink-mute bg-canvas-soft" },
};

export const MAJOR_META: Record<MajorType, { label: string; desc: string }> = {
  none: { label: "전공 없음", desc: "NCS·인적성 등 직업기초능력만 평가" },
  integrated: { label: "통합 전공", desc: "경영·경제·법 등 여러 과목을 한 시험에서 출제" },
  single: { label: "단일 전공", desc: "직렬별로 전공 1과목을 선택해 응시" },
  unknown: { label: "확인 중", desc: "공고 확인 필요" },
};

/** 기관 아바타 배경색 (id 해시로 결정) — DESIGN.md 팔레트만 사용, 흰 글자 대비 확보 */
const AVATAR_TONES = [
  "bg-[#533afd]", // primary
  "bg-[#1c1e54]", // brand-dark-900
  "bg-[#003770]", // shadow-blue
  "bg-[#4434d4]", // primary-deep
  "bg-[#ea2261]", // ruby
  "bg-[#9b6829]", // lemon
  "bg-[#273951]", // ink-secondary
  "bg-[#2e2b8c]", // primary-press
  "bg-[#a8209b]", // magenta (진한 톤)
  "bg-[#665efd]", // primary-soft
];

export function avatarTone(id: string): string {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return AVATAR_TONES[h % AVATAR_TONES.length];
}
