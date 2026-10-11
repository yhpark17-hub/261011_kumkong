/** 기관 분류 */
export type Category =
  | "finance" // 금융공기업 (금융위·기재부 산하 금융 공공기관)
  | "fininfra" // 금융유관기관 (금융결제원·금융보안원 등 준금융공기업)
  | "public" // 공공기관 (일반 공공기관 — 연금·보험·SOC·에너지 등)
  | "mutual" // 공제회·공제조합
  | "assoc" // 중앙회 (농협·수협·신협·새마을금고)
  | "bank" // 시중은행
  | "insurance" // 재보험·증권금융 등
  | "capital"; // 캐피탈

/** 전형 일정 유형 */
export type EventType =
  | "posting" // 공고·접수 시작
  | "doc" // 서류(자소서) 마감
  | "written" // 필기시험
  | "interview1" // 1차 면접
  | "interview2" // 2차(최종) 면접
  | "final"; // 최종 합격 발표

export type Blind = "full" | "partial" | "none" | "unknown";
export type MajorType = "none" | "integrated" | "single" | "unknown";

/**
 * confirmed: 올해 공고문/공식 안내로 확인된 일정
 * expected : 공고 전이라 전년도 패턴으로 추정한 일정 (화면에 '예상'으로 표시)
 */
export type DataStatus = "confirmed" | "expected";

export interface ScheduleEvent {
  type: EventType;
  /** YYYY-MM-DD (한국 시간 기준) */
  date: string;
  /** 기간 일정의 종료일 (예: 면접 3일간) */
  endDate?: string;
  /** "18:00" 같은 마감 시각 */
  time?: string;
  /** 같은 단계가 여러 회차로 나뉠 때 구분 라벨 (예: "1차 면접 ① 토론") */
  label?: string;
  note?: string;
}

export interface EssayQuestion {
  q: string;
  /** 글자 수 제한 (공백 포함 기준이 일반적) */
  limit?: number;
  /** 제한 단위가 바이트인 경우 */
  unit?: "byte";
}

export interface Recruitment {
  companyId: string;
  /** 예: "2026년 하반기 신입직원 공개채용" */
  title: string;
  /** 예: "2026 하반기" */
  period: string;
  status: DataStatus;
  headcount?: number;
  /** 모집 직렬/분야 */
  tracks: string[];
  events: ScheduleEvent[];
  essayQuestions: EssayQuestion[];
  /** 자소서 항목이 올해 것이 아니면 출처 시기를 표기 (예: "2025 하반기 기준") */
  essayRef?: string;
  postingUrl?: string;
  /** 일정을 대조한 1차 출처 (공고문 원문 등) */
  sourceUrl?: string;
  /** 출처 신뢰도 — high: 공고문 원문 확인, medium/low: 2차 출처 위주 */
  confidence?: "high" | "medium" | "low";
  /** 데이터 최종 확인일 YYYY-MM-DD */
  updatedAt: string;
  note?: string;
}

export interface WrittenExam {
  ncs: {
    has: boolean | null;
    /** PSAT형 / 모듈형 / 피듈형 / 자체 인적성 등 */
    type?: string;
    subjects: string[];
    questions?: number;
    minutes?: number;
  };
  major: {
    type: MajorType;
    /** 예: "경영·경제·법 중 택1 (서술형)" */
    subjects?: string;
    minutes?: number;
  };
  /** 논술, 시사상식, 디지털 리터러시 등 */
  extra?: string[];
  note?: string;
}

export interface CompetitionStat {
  year: number;
  /** 같은 해 여러 회차가 있을 때 표시용 (예: "2025 하반기") */
  label?: string;
  applicants?: number;
  hires?: number;
  ratio?: number;
  source: "ALIO" | "언론보도" | "기관발표";
}

export interface Company {
  id: string;
  name: string;
  /** 캘린더 칩에 들어갈 짧은 이름 (예: 신보) */
  shortName: string;
  /** 아바타에 넣을 2~3글자 (없으면 shortName 앞 3글자) */
  avatar?: string;
  /** 로고 이미지 경로 (public/logos, scripts/fetch-logos.mjs 로 생성) */
  logo?: string;
  /** 가로형 로고타입 (상세 페이지 상단용) */
  wideLogo?: string;
  category: Category;
  /** 본사 소재지 */
  hq?: string;
  description: string;
  blind: Blind;
  written: WrittenExam;
  stats: CompetitionStat[];
  homepage?: string;
  recruitUrl?: string;
  tags?: string[];
  /** 알리오 공시 대상 여부 (기본: 금융공기업·공공기관이면 true) */
  alioListed?: boolean;
}

/* ------------------------------------------------------------------ */
/* 클라이언트 번들용 경량 카탈로그                                        */
/* 달력·목록에는 자소서·필기 상세가 필요 없으므로 서버에서 요약해 넘깁니다.   */
/* ------------------------------------------------------------------ */

export interface CatalogCompany {
  id: string;
  name: string;
  shortName: string;
  avatar?: string;
  logo?: string;
  category: Category;
  hq?: string;
  blind: Blind;
  majorType: MajorType;
  /** "PSAT형" / "NCS 없음" / "확인 중" 등 표시용 */
  ncsLabel: string;
  /** 최근 확정 경쟁률 */
  ratio?: { value: number; label: string };
}

export interface CatalogRecruitment {
  companyId: string;
  title: string;
  status: DataStatus;
  events: ScheduleEvent[];
}

export interface Catalog {
  companies: CatalogCompany[];
  recruitments: CatalogRecruitment[];
}

/** 캘린더 렌더링용으로 평탄화한 이벤트 */
export interface CalendarEvent extends ScheduleEvent {
  id: string;
  company: CatalogCompany;
  recruitment: CatalogRecruitment;
}
