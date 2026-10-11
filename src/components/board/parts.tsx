import Link from "next/link";
import { Fragment, type ReactNode } from "react";
import { BadgeCheck, ChevronLeft, ChevronRight, MessageSquare } from "lucide-react";
import { CATEGORY_LABEL, PAGE_SIZE, boardHref, formatPostTime, type BoardCategory, type PostSummary } from "@/lib/board-meta";
import { getCompany } from "@/lib/data";
import { cn } from "../ui";

/* ------------------------------------------------------------------ */
/* 작성자 표시 — 운영자는 배지, 익명은 닉네임(IP 앞자리)                     */
/* ------------------------------------------------------------------ */

export function AdminBadge({ className }: { className?: string }) {
  return (
    <span className={cn("tag bg-brand-dark text-on-primary", className)}>
      <BadgeCheck className="h-3 w-3" strokeWidth={2} />
      운영자
    </span>
  );
}

export function AuthorLabel({
  nickname,
  ipPrefix,
  isAdmin,
  className,
}: {
  nickname: string;
  ipPrefix: string;
  isAdmin: boolean;
  className?: string;
}) {
  if (isAdmin) {
    return (
      <span className={cn("inline-flex min-w-0 items-center gap-1.5", className)}>
        <span className="truncate !font-normal text-primary-text">{nickname}</span>
        <AdminBadge />
      </span>
    );
  }
  return (
    <span className={cn("inline-flex min-w-0 items-baseline gap-1", className)}>
      <span className="truncate text-ink">{nickname}</span>
      <span className="shrink-0 type-micro text-ink-mute">({ipPrefix})</span>
    </span>
  );
}

const CATEGORY_TONE: Record<BoardCategory, string> = {
  free: "bg-canvas-soft text-ink-secondary",
  question: "bg-ev-posting-soft text-ev-posting",
  info: "bg-ev-final-soft text-ev-final",
  review: "bg-ev-written-soft text-ev-written",
  notice: "bg-brand-dark text-on-primary",
};

export function CategoryTag({ category }: { category: BoardCategory }) {
  return <span className={cn("tag", CATEGORY_TONE[category])}>{CATEGORY_LABEL[category]}</span>;
}

/* ------------------------------------------------------------------ */
/* 글 목록 (디시 갤러리형 표 · 모바일은 2줄 리스트)                          */
/* ------------------------------------------------------------------ */

const COLS = "md:grid md:grid-cols-[52px_60px_104px_minmax(0,1fr)_136px_52px_44px_44px] md:items-center";

export function PostTable({
  notices,
  posts,
  todayKey,
  emptyText = "아직 글이 없어요. 첫 글을 남겨 보세요!",
  infeed,
}: {
  notices: PostSummary[];
  posts: PostSummary[];
  /** 오늘 날짜 키 (YYYY-MM-DD, KST) */
  todayKey: string;
  emptyText?: string;
  /** 목록 중간(10번째 뒤)에 끼울 광고 */
  infeed?: ReactNode;
}) {
  return (
    <div className="border-t-2 border-ink">
      <div className={cn("hidden border-b border-hairline py-2.5 text-center type-caption text-ink-mute", COLS)}>
        <span>번호</span>
        <span>말머리</span>
        <span>기관</span>
        <span>제목</span>
        <span>글쓴이</span>
        <span>작성일</span>
        <span>조회</span>
        <span>추천</span>
      </div>
      <ul>
        {notices.map((p) => (
          <PostRow key={`n${p.id}`} post={p} todayKey={todayKey} pinned />
        ))}
        {posts.map((p, i) => (
          <Fragment key={p.id}>
            <PostRow post={p} todayKey={todayKey} />
            {infeed && i === 9 && posts.length > 12 && <li className="border-b border-hairline py-3">{infeed}</li>}
          </Fragment>
        ))}
      </ul>
      {!notices.length && !posts.length && (
        <p className="border-b border-hairline py-16 text-center type-body-md text-ink-mute">{emptyText}</p>
      )}
    </div>
  );
}

function PostRow({ post: p, todayKey, pinned = false }: { post: PostSummary; todayKey: string; pinned?: boolean }) {
  const href = `/board/${p.id}`;
  const time = formatPostTime(p.createdAt, todayKey);
  const company = p.companyId ? getCompany(p.companyId) : undefined;
  return (
    <li className={cn("border-b border-hairline", pinned && "bg-canvas-soft", !pinned && p.isAdmin && "bg-canvas-cream/50")}>
      {/* 데스크톱 */}
      <div className={cn("hidden min-h-11 py-2 text-center type-body-md", COLS)}>
        <span className="tabular type-caption text-ink-mute">
          {pinned ? <span className="tag bg-brand-dark text-on-primary">공지</span> : p.id}
        </span>
        <span>
          <CategoryTag category={p.category} />
        </span>
        <span className="flex min-w-0 justify-center px-1">
          {company ? (
            <Link
              href={boardHref({ company: company.id })}
              title={`${company.name} 글만 보기`}
              className="truncate type-caption text-ink-secondary hover:text-primary-text hover:underline"
            >
              {company.shortName}
            </Link>
          ) : (
            <span className="type-caption text-ink-mute-2">-</span>
          )}
        </span>
        <Link href={href} className="group flex min-w-0 items-center gap-1.5 px-2 text-left">
          <span className={cn("truncate group-hover:underline", pinned || p.isAdmin ? "!font-normal text-ink" : "text-ink")}>
            {p.title}
          </span>
          {p.commentCount > 0 && (
            <span className="shrink-0 tabular type-caption text-primary-text">[{p.commentCount}]</span>
          )}
        </Link>
        <span className="flex min-w-0 justify-center px-1 type-caption">
          <AuthorLabel nickname={p.nickname} ipPrefix={p.ipPrefix} isAdmin={p.isAdmin} />
        </span>
        <span className="tabular type-caption text-ink-mute">{time}</span>
        <span className="tabular type-caption text-ink-mute">{p.views}</span>
        <span className={cn("tabular type-caption", p.likes >= 5 ? "text-ruby" : "text-ink-mute")}>{p.likes}</span>
      </div>

      {/* 모바일 */}
      <Link href={href} className="block px-1 py-3 md:hidden">
        <span className="flex items-start gap-2">
          {pinned ? <span className="tag mt-0.5 bg-brand-dark text-on-primary">공지</span> : <CategoryTag category={p.category} />}
          <span className={cn("min-w-0 flex-1 type-body-md text-ink", (pinned || p.isAdmin) && "!font-normal")}>
            {p.title}
            {p.commentCount > 0 && (
              <span className="ml-1 inline-flex items-center gap-0.5 tabular type-caption text-primary-text">
                <MessageSquare className="h-3 w-3" strokeWidth={1.75} />
                {p.commentCount}
              </span>
            )}
          </span>
        </span>
        <span className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 type-micro text-ink-mute">
          {company && <span className="rounded-full bg-canvas-soft px-2 py-0.5 type-caption text-ink-secondary">{company.shortName}</span>}
          <AuthorLabel nickname={p.nickname} ipPrefix={p.ipPrefix} isAdmin={p.isAdmin} className="type-caption" />
          <span>{time}</span>
          <span>조회 {p.views}</span>
          <span className={p.likes >= 5 ? "text-ruby" : undefined}>추천 {p.likes}</span>
        </span>
      </Link>
    </li>
  );
}

/* ------------------------------------------------------------------ */
/* 페이지 번호                                                           */
/* ------------------------------------------------------------------ */

export function Pagination({
  total,
  page,
  hrefFor,
}: {
  total: number;
  page: number;
  hrefFor: (page: number) => string;
}) {
  const last = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (last <= 1) return null;
  const start = Math.floor((page - 1) / 10) * 10 + 1;
  const end = Math.min(last, start + 9);
  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);
  const item = "inline-flex h-9 min-w-9 items-center justify-center rounded-md px-2 tabular type-body-md";
  return (
    <nav className="flex flex-wrap items-center justify-center gap-1" aria-label="페이지">
      {start > 1 && (
        <Link href={hrefFor(start - 1)} className={cn(item, "text-ink-mute hover:bg-canvas-soft")} aria-label="이전 10페이지">
          <ChevronLeft className="h-4 w-4" strokeWidth={1.75} />
        </Link>
      )}
      {pages.map((n) => (
        <Link
          key={n}
          href={hrefFor(n)}
          aria-current={n === page ? "page" : undefined}
          className={cn(item, n === page ? "bg-brand-dark text-on-primary" : "text-ink-secondary hover:bg-canvas-soft")}
        >
          {n}
        </Link>
      ))}
      {end < last && (
        <Link href={hrefFor(end + 1)} className={cn(item, "text-ink-mute hover:bg-canvas-soft")} aria-label="다음 10페이지">
          <ChevronRight className="h-4 w-4" strokeWidth={1.75} />
        </Link>
      )}
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/* 본문 렌더링 — HTML 을 그대로 넣지 않고 React 요소로만 만듭니다            */
/* ------------------------------------------------------------------ */

const LINK_REL = "nofollow ugc noopener noreferrer";
const INLINE_RE = /(\*\*[^*\n]+\*\*|\[[^\]\n]+\]\(https?:\/\/[^\s)]+\)|https?:\/\/[^\s<>()]+)/g;

function inline(text: string, rich: boolean, key: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let i = 0;
  for (const m of text.matchAll(INLINE_RE)) {
    const token = m[0];
    const idx = m.index ?? 0;
    if (idx > last) out.push(text.slice(last, idx));
    const k = `${key}-${i++}`;
    if (token.startsWith("**")) {
      out.push(rich ? <strong key={k} className="!font-normal text-ink">{token.slice(2, -2)}</strong> : token);
    } else if (token.startsWith("[")) {
      const [, label, url] = token.match(/^\[([^\]]+)\]\((.+)\)$/) ?? [];
      out.push(
        rich && label && url ? (
          <a key={k} href={url} target="_blank" rel={LINK_REL} className="link">
            {label}
          </a>
        ) : (
          token
        ),
      );
    } else {
      out.push(
        <a key={k} href={token} target="_blank" rel={LINK_REL} className="link break-all">
          {token}
        </a>,
      );
    }
    last = idx + token.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

/** 익명 글: 줄바꿈·링크만. 운영자 글: 소제목·목록·인용·굵게·링크 지원 */
export function PostBody({ body, rich }: { body: string; rich: boolean }) {
  if (!rich) {
    return (
      <div className="type-body-lg whitespace-pre-wrap text-ink [overflow-wrap:anywhere]">{inline(body, false, "b")}</div>
    );
  }

  const blocks: ReactNode[] = [];
  const lines = body.replace(/\r\n/g, "\n").split("\n");
  let para: string[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  let quote: string[] = [];

  const flush = () => {
    const k = `blk${blocks.length}`;
    if (para.length) {
      blocks.push(
        <p key={k} className="type-body-lg text-ink">
          {para.flatMap((l, i) => (i ? [<br key={`${k}br${i}`} />, ...inline(l, true, `${k}-${i}`)] : inline(l, true, `${k}-${i}`)))}
        </p>,
      );
      para = [];
    } else if (list) {
      const Tag = list.ordered ? "ol" : "ul";
      blocks.push(
        <Tag key={k} className={cn("space-y-1.5 pl-6 type-body-lg text-ink", list.ordered ? "list-decimal" : "list-disc")}>
          {list.items.map((it, i) => (
            <li key={i}>{inline(it, true, `${k}-${i}`)}</li>
          ))}
        </Tag>,
      );
      list = null;
    } else if (quote.length) {
      blocks.push(
        <blockquote key={k} className="border-l-4 border-primary-soft bg-canvas-soft px-4 py-3 type-body-md text-ink-secondary">
          {quote.flatMap((l, i) => (i ? [<br key={`${k}br${i}`} />, ...inline(l, true, `${k}-${i}`)] : inline(l, true, `${k}-${i}`)))}
        </blockquote>,
      );
      quote = [];
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const ul = line.match(/^\s*[-*]\s+(.*)$/);
    const ol = line.match(/^\s*\d+[.)]\s+(.*)$/);
    if (!line.trim()) {
      flush();
    } else if (line.startsWith("### ")) {
      flush();
      blocks.push(
        <h3 key={`blk${blocks.length}`} className="pt-2 type-heading-md text-ink">
          {line.slice(4)}
        </h3>,
      );
    } else if (line.startsWith("## ")) {
      flush();
      blocks.push(
        <h2 key={`blk${blocks.length}`} className="pt-4 type-heading-lg text-ink">
          {line.slice(3)}
        </h2>,
      );
    } else if (line.startsWith(">")) {
      if (para.length || list) flush();
      quote.push(line.replace(/^>\s?/, ""));
    } else if (ul || ol) {
      const ordered = Boolean(ol && !ul);
      if (para.length || quote.length || (list && list.ordered !== ordered)) flush();
      list ??= { ordered, items: [] };
      list.items.push((ul ?? ol)![1]);
    } else {
      if (list || quote.length) flush();
      para.push(line);
    }
  }
  flush();
  return <div className="space-y-4 [overflow-wrap:anywhere]">{blocks}</div>;
}
