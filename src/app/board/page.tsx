import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { BarChart3, PenLine, Search, ShieldCheck, X } from "lucide-react";
import { AdSlot } from "@/components/ads/AdSlot";
import { CompanyFilter } from "@/components/board/CompanyFilter";
import { Pagination, PostTable } from "@/components/board/parts";
import { AdminBar } from "@/components/board/AdminBar";
import { DbSection } from "@/components/db/DbSection";
import { Card, CompanyAvatar, Eyebrow, cn } from "@/components/ui";
import { BOARD_CATEGORIES, BOARD_NAME, BOARD_TAGLINE, boardHref, isBoardCategory } from "@/lib/board-meta";
import { companyOptions, getCompany } from "@/lib/data";
import { todayKST } from "@/lib/date";
import { companyPostCounts, listPosts } from "@/lib/server/board";
import { examsForCompany } from "@/lib/server/reviews";
import { AD_SLOTS } from "@/lib/site";

export const metadata: Metadata = {
  title: `${BOARD_NAME} — ${BOARD_TAGLINE}`,
  description:
    "로그인 없이 쓰는 금융공기업·공공기관 준비생 익명 게시판. 필기·면접 후기, 질문, 채용 정보를 자유롭게 나눠 보세요.",
  alternates: { canonical: "/board" },
};

type SP = Record<string, string | string[] | undefined>;

function one(v: string | string[] | undefined): string {
  return (Array.isArray(v) ? v[0] : v) ?? "";
}


export default function BoardPage({ searchParams }: PageProps<"/board">) {
  return (
    <div className="mx-auto max-w-[1200px] px-4 pt-8 pb-12 md:px-6 md:pt-12">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <Eyebrow>{BOARD_TAGLINE}</Eyebrow>
          <h1 className="mt-3 type-display-md text-ink md:type-display-lg">{BOARD_NAME}</h1>
          <p className="mt-3 max-w-2xl type-body-lg text-ink-secondary">
            로그인 없이 닉네임과 비밀번호만으로 글을 쓸 수 있어요. 필기·면접 후기, 질문, 정보를 편하게 나눠 주세요.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/board/policy" className="btn btn-toggle btn-sm">
            <ShieldCheck className="h-4 w-4" strokeWidth={1.75} />
            이용 수칙
          </Link>
          <Link href="/board/write" className="btn btn-primary btn-sm">
            <PenLine className="h-4 w-4" strokeWidth={1.75} />
            글쓰기
          </Link>
        </div>
      </header>

      <DbSection silent>
        <Suspense fallback={null}>
          <AdminBar className="mt-6" />
        </Suspense>
      </DbSection>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_304px]">
        <div className="min-w-0">
          <DbSection noticeTitle="콩밭(게시판)을 준비하고 있어요">
            <Suspense fallback={<ListSkeleton />}>{searchParams.then((sp) => <BoardList sp={sp} />)}</Suspense>
          </DbSection>
        </div>

        <aside className="space-y-4">
          <Card className="p-6">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-ev-written-soft text-ev-written">
              <BarChart3 className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <h2 className="mt-4 type-heading-sm text-ink">필기 끝났다면, 30초 후기</h2>
            <p className="mt-2 type-body-md text-ink-secondary">
              체감 난이도·어려웠던 과목을 터치 몇 번으로 남기고 다른 사람들의 결과를 바로 확인하세요.
            </p>
            <Link href="/reviews" className="btn btn-secondary btn-sm mt-4">
              필기 후기 보러 가기
            </Link>
          </Card>
          <AdSlot slot={AD_SLOTS.sidebar} variant="rectangle" />
          <Card className="p-6">
            <h2 className="type-heading-sm text-ink">콩밭 이용 수칙</h2>
            <ul className="mt-3 space-y-2 type-body-md text-ink-secondary">
              <li>· 시험 문제 원문·복원 문항 공유 금지</li>
              <li>· 특정인 비방·개인정보 노출 금지</li>
              <li>· 신고가 쌓이면 자동으로 임시 숨김돼요</li>
            </ul>
            <Link href="/board/policy" className="link mt-3 inline-block type-caption">
              운영정책 전체 보기
            </Link>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="flex gap-2">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="h-9 w-16 rounded-full bg-canvas-soft" />
        ))}
      </div>
      <div className="mt-4 space-y-2">
        {Array.from({ length: 10 }, (_, i) => (
          <div key={i} className="h-11 rounded-md bg-canvas-soft" />
        ))}
      </div>
    </div>
  );
}

async function BoardList({ sp }: { sp: SP }) {
  await connection();
  const catRaw = one(sp.cat);
  const cat = isBoardCategory(catRaw) ? catRaw : null;
  const best = one(sp.best) === "1";
  const q = one(sp.q).trim().slice(0, 40) || null;
  const company = getCompany(one(sp.company)) ?? null;
  const companyId = company?.id ?? null;
  const page = Math.min(1000, Math.max(1, Number.parseInt(one(sp.page), 10) || 1));

  const [{ notices, posts, total }, postCounts] = await Promise.all([
    listPosts({ category: cat, page, q, bestOnly: best, companyId }),
    companyPostCounts(),
  ]);
  const todayKey = todayKST();
  const filterOptions = companyOptions().map((o) => ({ ...o, count: postCounts[o.id] ?? 0 }));
  const companyExams = company ? examsForCompany(company.id).filter((e) => !e.expected && e.date <= todayKey) : [];

  const tabs: { label: string; href: string; active: boolean }[] = [
    { label: "전체", href: boardHref({ q, company: companyId }), active: !cat && !best },
    { label: "추천글", href: boardHref({ best: true, q, company: companyId }), active: best && !cat },
    ...BOARD_CATEGORIES.map((c) => ({
      label: c.label,
      href: boardHref({ cat: c.key, q, company: companyId }),
      active: cat === c.key && !best,
    })),
  ];

  return (
    <>
      <nav className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0" aria-label="말머리">
        {tabs.map((t) => (
          <Link
            key={t.label}
            href={t.href}
            aria-current={t.active ? "page" : undefined}
            className={cn("btn btn-sm shrink-0", t.active ? "btn-on-dark" : "btn-toggle")}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <CompanyFilter options={filterOptions} selectedId={companyId} base={{ cat, best, q }} />
        {company && (
          <Link href={boardHref({ cat, best, q })} className="link inline-flex items-center gap-0.5 type-caption">
            <X className="h-3.5 w-3.5" strokeWidth={1.75} />
            기관 선택 해제
          </Link>
        )}
      </div>

      {company && (
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg bg-canvas-soft px-4 py-3">
          <CompanyAvatar company={company} size="sm" />
          <p className="min-w-0 flex-1 type-body-md text-ink-secondary">
            <span className="text-ink">{company.name}</span> 관련 글{" "}
            <span className="tabular text-ink">{postCounts[company.id] ?? 0}</span>개
          </p>
          <span className="flex flex-wrap gap-3 type-caption">
            <Link href={`/companies/${company.id}`} className="link">
              기관 정보·경쟁률
            </Link>
            {companyExams[0] && (
              <Link href={`/reviews/${companyExams[0].id}`} className="link">
                필기 후기
              </Link>
            )}
          </span>
        </div>
      )}

      {q && (
        <p className="mt-4 type-body-md text-ink-secondary">
          &lsquo;<span className="text-ink">{q}</span>&rsquo; 검색 결과 <span className="tabular">{total}</span>건 ·{" "}
          <Link href={boardHref({ cat, best, company: companyId })} className="link">
            검색 지우기
          </Link>
        </p>
      )}

      <div className="mt-4">
        <PostTable
          notices={notices}
          posts={posts}
          todayKey={todayKey}
          emptyText={
            q
              ? "검색 결과가 없어요."
              : company
                ? `아직 ${company.name} 관련 글이 없어요. 첫 글을 남겨 보세요!`
                : best
                  ? "추천 5개 이상 받은 글이 아직 없어요."
                  : undefined
          }
          infeed={<AdSlot slot={AD_SLOTS.inFeed} variant="infeed" />}
        />
      </div>

      <div className="mt-6 flex flex-col-reverse items-stretch gap-4 md:flex-row md:items-center md:justify-between">
        <form action="/board" className="flex gap-2">
          {cat && <input type="hidden" name="cat" value={cat} />}
          {best && <input type="hidden" name="best" value="1" />}
          {companyId && <input type="hidden" name="company" value={companyId} />}
          <input
            name="q"
            defaultValue={q ?? ""}
            maxLength={40}
            placeholder={company ? `${company.shortName} 글에서 검색` : "제목·내용 검색"}
            className="input min-w-0 flex-1 md:w-56"
            aria-label="게시판 검색"
          />
          <button type="submit" className="btn btn-toggle btn-icon !h-10 !w-10" aria-label="검색">
            <Search className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </form>
        <Link
          href={companyId ? `/board/write?company=${companyId}` : "/board/write"}
          className="btn btn-primary btn-sm self-end md:self-auto"
        >
          <PenLine className="h-4 w-4" strokeWidth={1.75} />
          글쓰기
        </Link>
      </div>

      <div className="mt-6">
        <Pagination total={total} page={page} hrefFor={(n) => boardHref({ cat, best, q, company: companyId, page: n })} />
      </div>
    </>
  );
}