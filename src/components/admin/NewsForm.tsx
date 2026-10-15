"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { ExternalLink, Loader2 } from "lucide-react";
import { saveNews, type NewsFormState } from "@/app/admin/news-actions";
import { NEWS_SECTIONS, newsHref, type NewsItem } from "@/lib/news-meta";
import { cn } from "../ui";

export interface NewsFormInitial {
  id: number | null;
  editionDate: string;
  section: NewsItem["section"];
  title: string;
  summary: string;
  point: string;
  body: string;
  sourceName: string;
  sourceUrl: string;
  headline: boolean;
  published: boolean;
}

/** 뉴스 한 건 쓰기·고치기 — 목록에는 제목·요약·출처가, 상세에는 포인트·본문까지 보여요 */
export function NewsForm({ initial }: { initial: NewsFormInitial }) {
  const [state, action, pending] = useActionState<NewsFormState, FormData>(saveNews, { ok: false });
  const [summary, setSummary] = useState(initial.summary);
  const [published, setPublished] = useState(initial.published);

  return (
    <form action={action} className="space-y-5">
      {initial.id && <input type="hidden" name="id" value={initial.id} />}

      <div className="grid gap-3 sm:grid-cols-[180px_200px_minmax(0,1fr)]">
        <label className="block">
          <span className="mb-1 block type-caption text-ink-secondary">브리핑 날짜</span>
          <input type="date" name="editionDate" defaultValue={initial.editionDate} required className="input w-full" />
        </label>
        <label className="block">
          <span className="mb-1 block type-caption text-ink-secondary">분야</span>
          <select name="section" defaultValue={initial.section} className="input w-full">
            {NEWS_SECTIONS.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label} — {s.desc}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-end gap-2 pb-2 type-body-md text-ink-secondary">
          <input type="checkbox" name="headline" defaultChecked={initial.headline} className="h-4 w-4 accent-[#533afd]" />
          이날의 헤드라인 (맨 위에 크게)
        </label>
      </div>

      <label className="block">
        <span className="mb-1 block type-caption text-ink-secondary">제목</span>
        <input name="title" defaultValue={initial.title} maxLength={140} required className="input w-full !text-[17px]" placeholder="무슨 일인지 한눈에 보이게" />
      </label>

      <label className="block">
        <span className="mb-1 flex justify-between type-caption text-ink-secondary">
          <span>요약 — 목록에 2줄, 상세에 전체가 보여요 (2~4문장)</span>
          <span className="tabular text-ink-mute">{summary.length}/1500</span>
        </span>
        <textarea name="summary" value={summary} onChange={(e) => setSummary(e.target.value)} rows={5} maxLength={1500} required className="input w-full resize-y leading-relaxed" />
      </label>

      <label className="block">
        <span className="mb-1 block type-caption text-ink-secondary">왜 중요할까 · 필기·면접 포인트 (선택)</span>
        <textarea name="point" defaultValue={initial.point} rows={3} maxLength={600} className="input w-full resize-y leading-relaxed" placeholder="금공 준비생에게 이 뉴스가 왜 중요한지 한두 문장" />
      </label>

      <div className="grid gap-3 sm:grid-cols-[200px_minmax(0,1fr)]">
        <label className="block">
          <span className="mb-1 block type-caption text-ink-secondary">출처 이름</span>
          <input name="sourceName" defaultValue={initial.sourceName} maxLength={60} className="input w-full" placeholder="예: 금융위원회" />
        </label>
        <label className="block">
          <span className="mb-1 block type-caption text-ink-secondary">원문 링크</span>
          <input name="sourceUrl" defaultValue={initial.sourceUrl} maxLength={500} inputMode="url" className="input w-full" placeholder="https://…" />
        </label>
      </div>

      <details className="rounded-lg border border-hairline px-4 py-3">
        <summary className="cursor-pointer type-caption text-ink-secondary">더 자세한 본문 (선택 · 마크다운)</summary>
        <textarea name="body" defaultValue={initial.body} rows={8} maxLength={8000} className="input mt-3 w-full resize-y font-mono text-[14px] leading-relaxed" />
      </details>

      <fieldset className="flex flex-wrap gap-2">
        {(
          [
            [false, "초안", "나만 보기"],
            [true, "공개", "데일리 브리핑에 바로 노출"],
          ] as const
        ).map(([value, label, desc]) => (
          <label
            key={label}
            className={cn("flex min-w-[160px] flex-1 cursor-pointer flex-col rounded-md border px-3 py-2", published === value ? "border-primary bg-ev-written-soft" : "border-hairline")}
          >
            <span className="flex items-center gap-2 type-body-md text-ink">
              <input type="radio" name="status" value={value ? "1" : "0"} checked={published === value} onChange={() => setPublished(value)} className="accent-[#533afd]" />
              {label}
            </span>
            <span className="pl-5 type-micro text-ink-mute">{desc}</span>
          </label>
        ))}
      </fieldset>

      {state.error && <p className="rounded-md bg-ev-doc-soft p-3 type-caption text-ev-doc">{state.error}</p>}
      {state.ok && <p className="rounded-md bg-ev-final-soft p-3 type-caption text-ev-final">저장했어요.</p>}

      <div className="flex flex-wrap justify-end gap-2">
        {initial.id && (
          <Link href={newsHref(initial.id)} target="_blank" className="btn btn-sm btn-toggle">
            <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.75} />
            페이지로 보기
          </Link>
        )}
        <button type="submit" disabled={pending} className={cn("btn btn-sm btn-primary", pending && "opacity-60")}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />}
          {published ? "공개로 저장" : "초안 저장"}
        </button>
      </div>
    </form>
  );
}
