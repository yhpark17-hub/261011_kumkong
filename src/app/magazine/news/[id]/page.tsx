import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { ChevronRight, ExternalLink, Lightbulb, PenLine } from "lucide-react";
import { AdSlot } from "@/components/ads/AdSlot";
import { cn } from "@/components/ui";
import { DbSection } from "@/components/db/DbSection";
import { Markdown } from "@/components/magazine/Markdown";
import { NewsViewRecorder, ShareButton } from "@/components/magazine/interactive";
import { NewsRow, NewsSectionTag, newsTitle } from "@/components/magazine/news";
import { formatDayHeading } from "@/lib/date";
import { MAGAZINE_NAME } from "@/lib/magazine-meta";
import { KIND_LABELS, NEWS_SECTION_INFO, briefingArchiveHref, briefingDateHref, formatNewsTime, letterHref, newsHref, volLabel } from "@/lib/news-meta";
import { getIssue } from "@/lib/server/briefing";
import { dbConfigured } from "@/lib/server/db";
import { getNews, newsByDate, sameSectionNews } from "@/lib/server/news";
import { isAdmin } from "@/lib/server/security";
import { AD_SLOTS, OG_IMAGE, SITE } from "@/lib/site";

/** 긴 요약은 두 문장씩 끊어서 읽기 쉽게 */
function toParagraphs(text: string): string[] {
  return text
    .split(/\n+/)
    .flatMap((block) => {
      // 문장 끝(. ! ?) 뒤에 공백이 올 때만 끊음 — 5.46% 같은 숫자는 그대로
      const sentences = block.split(/(?<=[.!?]["'”’)]?)\s+/);
      const out: string[] = [];
      for (let i = 0; i < sentences.length; i += 2) out.push(sentences.slice(i, i + 2).join(" ").trim());
      return out;
    })
    .filter(Boolean);
}

const FOOTNOTE = {
  news: "기사 원문을 확인해 요약했어요. 자세한 내용과 수치는 원문을 함께 봐 주세요.",
  term: "핵심만 쉽게 풀었어요. 시험 직전에는 교재나 한국은행 경제용어사전 같은 공식 자료로 한 번 더 확인해 주세요.",
  question: "답변 뼈대는 예시예요. 내 경험과 지원하는 기관에 맞게 바꿔서 써 주세요.",
} as const;

function PointBox({ label, text }: { label: string; text: string }) {
  return (
    <aside className="mt-8 rounded-xl border border-lemon/30 bg-canvas-cream px-5 py-4">
      <p className="flex items-center gap-1.5 type-caption font-semibold text-lemon">
        <Lightbulb className="h-4 w-4" strokeWidth={2} />
        {label}
      </p>
      <p className="mt-2 type-body-md leading-relaxed whitespace-pre-line text-ink">{text}</p>
    </aside>
  );
}

function parseId(raw: string): number | null {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export async function generateMetadata({ params }: PageProps<"/magazine/news/[id]">): Promise<Metadata> {
  const id = parseId((await params).id);
  await connection(); // 발행 시각 비교(Date.now) 전에 — 본문과 같이 요청 시점에 그려요
  const n = id && dbConfigured() ? await getNews(id).catch(() => null) : null;
  if (!n) return { title: "데일리 브리핑", robots: { index: false, follow: false } };
  const description = n.summary.replace(/\s+/g, " ").slice(0, 150);
  const label = NEWS_SECTION_INFO[n.section].kind === "news" ? "데일리 브리핑" : NEWS_SECTION_INFO[n.section].label;
  return {
    title: `${newsTitle(n)} - ${label}`,
    description,
    alternates: { canonical: newsHref(n.id) },
    openGraph: {
      title: newsTitle(n),
      description,
      type: "article",
      publishedTime: n.publishedAt ? new Date(n.publishedAt).toISOString() : undefined,
      section: NEWS_SECTION_INFO[n.section].label,
      images: [OG_IMAGE],
    },
  };
}

export default function NewsPage({ params }: PageProps<"/magazine/news/[id]">) {
  return (
    <div className="mx-auto max-w-[1200px] px-4 pt-6 pb-16 md:px-6 md:pt-10">
      <DbSection noticeTitle="데일리 브리핑을 준비하고 있어요">
        <Suspense fallback={<div className="mx-auto h-96 max-w-[720px] animate-pulse rounded-2xl bg-canvas-soft" />}>
          {params.then(({ id }) => (
            <NewsView rawId={id} />
          ))}
        </Suspense>
      </DbSection>
    </div>
  );
}

async function NewsView({ rawId }: { rawId: string }) {
  await connection();
  const id = parseId(rawId);
  if (!id) notFound();
  const admin = await isAdmin();
  const n = await getNews(id, { admin });
  if (!n) notFound();
  const [sameDay, sameSection, issue] = n.live
    ? await Promise.all([newsByDate(n.editionDate), sameSectionNews(n, 4), getIssue(n.editionDate)])
    : [[], [], await getIssue(n.editionDate, { admin })];
  const others = sameDay.filter((x) => x.id !== n.id).slice(0, 8);
  // 이 기사가 실린 레터 (없으면 그날 기사 모아보기)
  const dayHref = issue ? letterHref(n.editionDate) : briefingDateHref(n.editionDate);
  const dayLabel = issue ? `${volLabel(issue.vol)} · ${formatDayHeading(n.editionDate)} 레터` : `${formatDayHeading(n.editionDate)} 브리핑`;
  const info = NEWS_SECTION_INFO[n.section];
  const L = KIND_LABELS[info.kind];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": info.kind === "news" ? "NewsArticle" : "Article",
    headline: newsTitle(n),
    description: n.summary,
    datePublished: n.publishedAt ? new Date(n.publishedAt).toISOString() : undefined,
    dateModified: new Date(n.updatedAt).toISOString(),
    publisher: { "@type": "Organization", name: SITE.name, url: SITE.url },
    mainEntityOfPage: `${SITE.url}${newsHref(n.id)}`,
    articleSection: info.label,
  };

  return (
    <>
      {n.live && <NewsViewRecorder id={n.id} />}
      {n.live && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      )}
      {admin && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-canvas-cream px-4 py-3">
          <p className="type-caption text-ink-secondary">{n.live ? "운영자 화면 — 공개 중이에요." : "미리보기 — 아직 초안이라 다른 사람에게는 보이지 않아요."}</p>
          <Link href={`/admin/news/${n.id}`} className="btn btn-sm btn-secondary">
            <PenLine className="h-3.5 w-3.5" strokeWidth={1.75} />
            수정하기
          </Link>
        </div>
      )}

      <nav aria-label="위치" className="flex flex-wrap items-center gap-1 type-caption text-ink-mute">
        <span>{MAGAZINE_NAME}</span>
        <ChevronRight className="h-3.5 w-3.5" strokeWidth={1.75} />
        <Link href="/magazine" className="hover:text-ink hover:underline">
          데일리 브리핑
        </Link>
        <ChevronRight className="h-3.5 w-3.5" strokeWidth={1.75} />
        <Link href={briefingArchiveHref({ section: n.section })} className="hover:text-ink hover:underline">
          {info.label}
        </Link>
      </nav>

      <div className="mt-6 grid gap-12 lg:grid-cols-[minmax(0,1fr)_300px]">
        <article className="min-w-0 max-w-[720px]">
          <div className="flex flex-wrap items-center gap-2">
            <NewsSectionTag section={n.section} />
            <Link href={dayHref} className="type-caption text-ink-mute hover:underline">
              {dayLabel}
            </Link>
          </div>
          <h1 className={cn("mt-4 type-heading-lg [word-break:keep-all] md:type-display-md", info.kind === "term" ? "text-ev-posting" : "text-ink")}>{newsTitle(n)}</h1>
          <p className="mt-4 flex flex-wrap items-center gap-x-2 border-b border-hairline pb-5 type-caption text-ink-mute">
            {n.sourceName && <span>{info.kind === "news" ? "출처" : info.kind === "term" ? "참고" : "관련 뉴스"} {n.sourceName}</span>}
            {n.publishedAt && <span className="tabular">· {formatNewsTime(n.publishedAt)}</span>}
            {n.views > 0 && <span className="tabular">· 조회 {n.views.toLocaleString()}</span>}
          </p>

          {n.imageUrl && (
            <figure className="mt-8">
              {/* eslint-disable-next-line @next/next/no-img-element -- 운영자가 올린 사진 (Blob 주소) */}
              <img src={n.imageUrl} alt="" className="aspect-[16/9] w-full rounded-xl bg-canvas-soft object-cover" />
              {n.imageCredit && <figcaption className="mt-2 type-micro text-ink-mute">사진 · {n.imageCredit}</figcaption>}
            </figure>
          )}

          <div className="mt-8 space-y-5">
            {info.kind === "question" && <p className="type-caption font-semibold text-ink-mute">{L.summary}</p>}
            {toParagraphs(n.summary).map((p, i) => (
              <p key={i} className="type-body-lg leading-[1.85] text-ink">
                {p}
              </p>
            ))}
          </div>

          {/* 용어·질문은 포인트(출제 포인트·답변 팁)를 본문보다 먼저 */}
          {n.point && info.kind !== "news" && <PointBox label={L.point} text={n.point} />}

          {n.body.trim() && (
            <div className="mt-8">
              {info.kind !== "news" && <h2 className="mb-3 type-heading-md text-ink">{L.body}</h2>}
              <Markdown source={n.body} />
            </div>
          )}

          {n.point && info.kind === "news" && <PointBox label={L.point} text={n.point} />}

          <div className="mt-8 flex flex-wrap gap-2">
            {n.sourceUrl && (
              <a href={n.sourceUrl} target="_blank" rel="noopener noreferrer" className={cn("btn btn-sm", info.kind === "news" ? "btn-primary" : "btn-secondary")}>
                {L.source}
                {n.sourceName ? ` · ${n.sourceName}` : ""}
                <ExternalLink className="h-3.5 w-3.5" strokeWidth={2} />
              </a>
            )}
            <ShareButton title={n.title} path={newsHref(n.id)} />
          </div>
          <p className="mt-4 type-micro text-ink-mute">{FOOTNOTE[info.kind]}</p>

          <AdSlot slot={AD_SLOTS.inArticle} variant="inarticle" className="mt-10" />

          {sameSection.length > 0 && (
            <section className="mt-12">
              <h2 className="flex items-center gap-2 border-b-2 border-ink pb-3 type-heading-md text-ink">
                <span className={`h-2.5 w-2.5 rounded-full ${info.dot}`} aria-hidden />
                {info.kind === "news" ? `${info.label} 최근 뉴스` : `지난 ${info.label.replace("오늘의 ", "")}`}
              </h2>
              <div className="divide-y divide-hairline">
                {sameSection.map((x) => (
                  <NewsRow key={x.id} n={x} />
                ))}
              </div>
            </section>
          )}
        </article>

        {others.length > 0 && (
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-hairline p-5">
              <p className="type-heading-sm text-ink">{issue ? "이 레터의 다른 기사" : "같은 날 브리핑"}</p>
              <ul className="mt-2 divide-y divide-hairline">
                {others.map((x) => (
                  <li key={x.id}>
                    <Link href={newsHref(x.id)} className="group block py-3">
                      <NewsSectionTag section={x.section} />
                      <span className="mt-1 line-clamp-2 type-body-md text-ink [word-break:keep-all] group-hover:underline">{newsTitle(x)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              <Link href={dayHref} className="link mt-3 inline-block type-caption">
                {issue ? "레터 전체 읽기 →" : "이날 브리핑 전체 보기 →"}
              </Link>
            </div>
          </aside>
        )}
      </div>
    </>
  );
}
