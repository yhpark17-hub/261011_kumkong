import Link from "next/link";
import { Suspense } from "react";
import { Eye, Heart, Newspaper, PenLine, Star } from "lucide-react";
import { quickArticleAction } from "@/app/admin/article-actions";
import { ConfirmForm } from "@/components/admin/ModerationForm";
import { AdminCard, AdminPageTitle, AdminPager, EmptyRow, RowButton, StatTile, listHref, nf } from "@/components/admin/parts";
import { AdminSkeleton } from "@/components/admin/Skeleton";
import { DbSection } from "@/components/db/DbSection";
import { ArticleBadgeTag, MagazineCategoryTag } from "@/components/magazine/parts";
import { cn } from "@/components/ui";
import { formatPostDateTime } from "@/lib/board-meta";
import { MAGAZINE_CATEGORIES, isMagazineCategory, type ArticleSummary } from "@/lib/magazine-meta";
import { requireAdmin } from "@/lib/server/admin";
import { adminListArticles, magazineAdminCounts, type AdminArticleFilter } from "@/lib/server/magazine";

export const metadata = { title: "매거진" };

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

const FILTERS: [AdminArticleFilter, string][] = [
  ["all", "전체"],
  ["draft", "임시저장"],
  ["auto", "자동 초안"],
  ["scheduled", "예약"],
  ["published", "공개 중"],
];

export default function AdminMagazinePage({ searchParams }: PageProps<"/admin/magazine">) {
  return (
    <DbSection noticeTitle="DB가 연결되지 않았어요 (DATABASE_URL 확인)">
      <Suspense fallback={<AdminSkeleton />}>{searchParams.then((sp) => <Magazine sp={sp} />)}</Suspense>
    </DbSection>
  );
}

async function Magazine({ sp }: { sp: SP }) {
  await requireAdmin();
  const filter = (FILTERS.find(([k]) => k === one(sp.filter))?.[0] ?? "all") as AdminArticleFilter;
  const c = one(sp.c);
  const category = isMagazineCategory(c) ? c : null;
  const q = one(sp.q).trim().slice(0, 40);
  const page = Math.max(1, Number.parseInt(one(sp.page), 10) || 1);
  const [{ items, total }, counts] = await Promise.all([adminListArticles({ filter, category, q, page }), magazineAdminCounts()]);
  const base = { filter, c: category, q };

  return (
    <>
      <AdminPageTitle
        title="금융 블로그"
        desc="블로그 글을 쓰고 발행해요. 예약 발행 글은 정한 시각에 자동으로 공개돼요. 시사 뉴스는 '데일리 브리핑' 메뉴에서 관리해요."
        aside={
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/news" className="btn btn-sm btn-secondary">
              <Newspaper className="h-4 w-4" strokeWidth={1.75} />
              데일리 브리핑 관리
            </Link>
            <Link href="/admin/magazine/new" className="btn btn-sm btn-primary">
              <PenLine className="h-4 w-4" strokeWidth={1.75} />새 글 쓰기
            </Link>
          </div>
        }
      />

      {one(sp.deleted) && <p className="rounded-md bg-canvas-soft px-4 py-3 type-caption text-ink-secondary">글을 삭제했어요.</p>}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="공개 중" value={nf.format(counts.published)} href={listHref("/admin/magazine", { filter: "published" })} />
        <StatTile label="예약" value={nf.format(counts.scheduled)} href={listHref("/admin/magazine", { filter: "scheduled" })} />
        <StatTile
          label="임시저장"
          value={nf.format(counts.draft)}
          sub={counts.auto ? `자동 초안 ${counts.auto}개 검토 대기` : undefined}
          tone={counts.auto ? "alert" : "default"}
          href={listHref("/admin/magazine", { filter: counts.auto ? "auto" : "draft" })}
        />
        <StatTile label="전체 글" value={nf.format(counts.published + counts.scheduled + counts.draft)} sub="공개·예약·임시저장" href="/admin/magazine" />
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="no-scrollbar fade-x -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0 md:fade-x-none">
          {FILTERS.map(([key, label]) => (
            <Link
              key={key}
              href={listHref("/admin/magazine", { ...base, filter: key === "all" ? null : key })}
              className={cn("btn btn-sm shrink-0", filter === key ? "btn-on-dark" : "btn-toggle")}
            >
              {label}
            </Link>
          ))}
        </div>
        <form action="/admin/magazine" className="flex gap-2">
          {filter !== "all" && <input type="hidden" name="filter" value={filter} />}
          <select name="c" defaultValue={category ?? ""} className="input" aria-label="카테고리">
            <option value="">모든 카테고리</option>
            {MAGAZINE_CATEGORIES.map((m) => (
              <option key={m.key} value={m.key}>
                {m.label}
              </option>
            ))}
          </select>
          <input name="q" defaultValue={q} placeholder="제목·본문 검색" className="input min-w-0 flex-1 md:w-52" aria-label="검색" />
          <button type="submit" className="btn btn-sm btn-toggle shrink-0">
            검색
          </button>
        </form>
      </div>

      <AdminCard>
        {items.length === 0 ? (
          <EmptyRow>
            {filter === "auto" ? "검토할 자동 초안이 없어요." : "조건에 맞는 글이 없어요."}{" "}
            <Link href="/admin/magazine/new" className="link">
              새 글 쓰기
            </Link>
          </EmptyRow>
        ) : (
          <ConfirmForm action={quickArticleAction}>
            <ul className="divide-y divide-hairline">
              {items.map((a) => (
                <ArticleAdminRow key={a.id} a={a} />
              ))}
            </ul>
          </ConfirmForm>
        )}
      </AdminCard>
      <AdminPager page={page} total={total} size={30} hrefFor={(p) => listHref("/admin/magazine", { ...base, page: p })} />
    </>
  );
}

function ArticleAdminRow({ a }: { a: ArticleSummary }) {
  const live = a.live;
  const scheduled = a.status === 1 && !live;
  return (
    <li className="flex flex-col gap-3 py-4 md:flex-row md:items-center">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <MagazineCategoryTag category={a.category} />
          <ArticleBadgeTag a={a} />
          {live && <span className="tag bg-ev-final-soft text-ev-final">공개</span>}
          {scheduled && <span className="tag bg-ev-written-soft text-primary-text">예약 {a.publishedAt ? formatPostDateTime(a.publishedAt) : ""}</span>}
          {a.status === 0 && <span className="tag bg-canvas-soft text-ink-secondary">임시저장</span>}
          {a.source === "auto" && <span className="tag bg-canvas-cream text-lemon">자동 초안</span>}
          {a.featured && (
            <span className="tag bg-canvas-cream text-lemon">
              <Star className="h-3 w-3" strokeWidth={2} />
              추천
            </span>
          )}
        </div>
        <Link href={`/admin/magazine/${a.id}`} className="mt-1.5 block truncate type-body-md font-semibold text-ink hover:underline">
          {a.title}
        </Link>
        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 type-micro text-ink-mute">
          <span className="inline-flex items-center gap-1 rounded-full bg-canvas-soft px-2 py-0.5 tabular type-caption font-semibold text-ink-secondary">
            <Eye className="h-3.5 w-3.5" strokeWidth={1.75} />
            조회 {nf.format(a.views)}
          </span>
          <span>{live && a.publishedAt ? `발행 ${formatPostDateTime(a.publishedAt)}` : `수정 ${formatPostDateTime(a.updatedAt)}`}</span>
          <span className="inline-flex items-center gap-1 tabular">
            <Heart className="h-3 w-3" strokeWidth={1.75} />
            {nf.format(a.likes)}
          </span>
          <span>{a.readMinutes}분 분량</span>
        </p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <Link href={`/admin/magazine/${a.id}`} className="rounded-full border border-hairline px-2.5 py-1 type-micro text-ink-secondary hover:border-hairline-input">
          편집
        </Link>
        <Link href={`/magazine/${a.id}`} target="_blank" className="rounded-full border border-hairline px-2.5 py-1 type-micro text-ink-secondary hover:border-hairline-input">
          {live ? "보기" : "미리보기"}
        </Link>
        {a.status === 0 && <RowButton value={`publish:${a.id}`} confirm="지금 바로 공개할까요?">바로 공개</RowButton>}
        {a.status === 1 && <RowButton value={`unpublish:${a.id}`} confirm="공개를 내리고 임시저장으로 돌릴까요?">내리기</RowButton>}
        {a.featured ? (
          <RowButton value={`unfeature:${a.id}`}>추천 해제</RowButton>
        ) : (
          <RowButton value={`feature:${a.id}`}>추천</RowButton>
        )}
      </div>
    </li>
  );
}
