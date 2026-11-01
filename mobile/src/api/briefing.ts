/** 사이트 /api/app/v1/briefing·briefings 응답 모양 (사이트 src/lib/server/app-briefing.ts와 맞춤) */

/** 글 조각 — 글 그대로이거나 전문 용어 뒤에 붙는 (풀이) */
export type AppText = (string | { gloss: string })[];

export type AppPic = { url: string; aspect: number; credit?: string; person: boolean };

export type AppSlide =
  | {
      kind: 'cover';
      text: AppText;
      total: number;
      pic: AppPic | null;
      photo: { url: string; credit: string } | null;
      org: { name: string; logo?: string } | null;
    }
  | { kind: 'background' | 'text'; title: string; text: AppText; pic: AppPic; compact: boolean }
  | { kind: 'stat'; value: string; label: string; note: AppText; pic: AppPic; compact: boolean }
  | {
      kind: 'bars';
      title: string;
      note: AppText;
      money: boolean;
      bars: { label: string; value: string; strong: boolean; top: number; coins?: string }[];
    }
  | {
      kind: 'change';
      title: string;
      note: AppText;
      rows: { label: string; from: string; to: string; fromPct: number; toPct: number; dir: -1 | 0 | 1 }[];
    }
  | { kind: 'flow'; title: string; steps: string[] }
  | { kind: 'term'; term: string; text: AppText; pic: AppPic; compact: boolean }
  | { kind: 'quote'; text: string; name: string; note: AppText; pic: AppPic }
  | { kind: 'versus'; title: string; left: { name: string; text: AppText }; right: { name: string; text: AppText } }
  | { kind: 'summary'; first: boolean; text: AppText; pic: AppPic }
  | { kind: 'point'; text: AppText; pic: AppPic };

export type DeckTheme = { accent: string; panel: string; deep: string };

export type AppStory = {
  id: number;
  no: number;
  section: string;
  sectionLabel: string;
  theme: DeckTheme;
  headline: boolean;
  title: string;
  short: string;
  slides: AppSlide[];
  readMore: { url: string; label: string };
};

export type Edition = 'morning' | 'noon';

export type IssueInfo = {
  id: number;
  date: string;
  edition: Edition;
  vol: number;
  label: string;
  title: string;
  lede: string;
  minutes: number;
  publishedAt: number | null;
  /** 표지 그림 (null = 판 색 표지) */
  cover: string | null;
  webUrl: string;
  shareUrl: string;
};

export type NearIssue = { date: string; edition: Edition; label: string; title: string } | null;

export type BriefingResponse = { issue: IssueInfo; stories: AppStory[]; prev: NearIssue; next: NearIssue };

export type IssueListItem = IssueInfo & {
  count: number;
  top: { id: number; title: string; section: string; sectionLabel: string }[];
};

export type BriefingListResponse = { page: number; total: number; pageSize: number; items: IssueListItem[] };

export const briefingPath = (p: { date?: string; edition?: Edition } = {}) => {
  const sp = new URLSearchParams({ edition: p.edition ?? 'morning' });
  if (p.date) sp.set('date', p.date);
  return `/briefing?${sp}`;
};
