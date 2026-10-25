"use client";

import Link from "next/link";
import { useActionState, useRef, useState } from "react";
import { ExternalLink, ImagePlus, Loader2, X } from "lucide-react";
import { saveNews, type NewsFormState } from "@/app/admin/news-actions";
import { CARD_LEN, PICS } from "@/lib/news-cards";
import { EDITION_SCHEDULE, KIND_LABELS, NEWS_ONLY_SECTIONS, NEWS_SECTION_INFO, newsHref, type NewsEdition, type NewsItem, type NewsTier } from "@/lib/news-meta";
import { uploadFile } from "@/lib/upload-client";
import { cn } from "../ui";

export interface NewsFormInitial {
  id: number | null;
  editionDate: string;
  edition: NewsEdition;
  section: NewsItem["section"];
  title: string;
  summary: string;
  point: string;
  body: string;
  sourceName: string;
  sourceUrl: string;
  tier: NewsTier;
  position: number;
  takeaway: string;
  /** 카드뉴스 사이 장 JSON (비우면 요약을 나눠 글 카드로) */
  cards: string;
  /** 시간표 짧은 이름 · 표지 그림 */
  short: string;
  pic: string;
  /** 각주 JSON [{ term, text }] */
  notes: string;
  imageUrl: string;
  imageCredit: string;
  headline: boolean;
  published: boolean;
}

/** 쓰는 요령 — 종류마다 */
const HINTS = {
  news: {
    title: "무슨 일인지 한눈에 보이게",
    summary: "누가·무엇을·왜·숫자. 원문에 있는 수치만 (2~4문장)",
    point: "금공 준비생에게 이 뉴스가 왜 중요한지 한두 문장",
    body: "",
  },
  term: {
    title: "예: 기준금리, 테이퍼링, 예대마진",
    summary: "처음 보는 사람도 알 수 있게 2~3문장으로 쉽게",
    point: "필기(경제·금융 상식)나 면접에서 어떻게 나오는지, 헷갈리는 비슷한 용어",
    body: "예시나 관련 개념을 더 적어도 돼요",
  },
  question: {
    title: "예: 금리 인하가 우리 기관 사업에 미칠 영향은?",
    summary: "어떤 뉴스·배경에서 이 질문이 나올 수 있는지 2~3문장",
    point: "답변할 때 꼭 챙길 점 한두 가지",
    body: "- 결론 한 줄\n- 근거 1\n- 근거 2 (지원 기관과 연결)",
  },
} as const;

/** 브리핑 한 건(뉴스·용어·면접 질문) 쓰기·고치기 — 목록에는 제목·요약이, 상세에는 포인트·본문까지 보여요 */
export function NewsForm({ initial }: { initial: NewsFormInitial }) {
  const [state, action, pending] = useActionState<NewsFormState, FormData>(saveNews, { ok: false });
  const [summary, setSummary] = useState(initial.summary);
  const [published, setPublished] = useState(initial.published);
  const [section, setSection] = useState(initial.section);
  const kind = NEWS_SECTION_INFO[section].kind;
  const L = KIND_LABELS[kind];
  const hint = HINTS[kind];
  const [image, setImage] = useState(initial.imageUrl);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  async function upload(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError("");
    try {
      setImage((await uploadFile(file, "magazine")).url);
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "올리지 못했어요.");
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  return (
    <form action={action} className="space-y-5">
      {initial.id && <input type="hidden" name="id" value={initial.id} />}

      <div className="grid gap-3 sm:grid-cols-[170px_160px_minmax(0,1fr)]">
        <label className="block">
          <span className="mb-1 block type-caption text-ink-secondary">브리핑 날짜</span>
          <input type="date" name="editionDate" defaultValue={initial.editionDate} required className="input w-full" />
        </label>
        <label className="block">
          <span className="mb-1 block type-caption text-ink-secondary">판</span>
          <select name="edition" defaultValue={initial.edition} className="input w-full">
            {EDITION_SCHEDULE.map((e) => (
              <option key={e.key} value={e.key}>
                {e.label} ({e.time})
              </option>
            ))}
            <option value="">구분 없음</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block type-caption text-ink-secondary">카테고리</span>
          <select name="section" value={section} onChange={(e) => setSection(e.target.value as NewsItem["section"])} className="input w-full">
            <optgroup label="시사 뉴스">
              {NEWS_ONLY_SECTIONS.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label} — {s.desc}
                </option>
              ))}
            </optgroup>
            <optgroup label="공부">
              {(["term", "question"] as const).map((k) => (
                <option key={k} value={k}>
                  {NEWS_SECTION_INFO[k].label} — {NEWS_SECTION_INFO[k].desc}
                </option>
              ))}
            </optgroup>
          </select>
        </label>
      </div>

      {kind === "news" && (
        <div className="grid gap-3 rounded-lg border border-hairline px-4 py-3 sm:grid-cols-[auto_110px] sm:items-end">
          <input type="hidden" name="tier" value="key" />
          <label className="flex items-center gap-2 pb-2 type-body-md text-ink-secondary">
            <input type="checkbox" name="headline" defaultChecked={initial.headline} className="h-4 w-4 accent-[#533afd]" />
            이날 아침판의 헤드라인 (01 — 맨 위에 가장 크게)
          </label>
          <label className="block">
            <span className="mb-1 block type-caption text-ink-secondary">순서</span>
            <input type="number" name="position" min={0} max={99} defaultValue={initial.position} className="input w-full" />
          </label>
        </div>
      )}
      {kind !== "news" && <input type="hidden" name="position" value={initial.position} />}

      <label className="block">
        <span className="mb-1 block type-caption text-ink-secondary">{L.title}</span>
        <input name="title" defaultValue={initial.title} maxLength={140} required className="input w-full !text-[17px]" placeholder={hint.title} />
      </label>

      {kind === "news" && (
        <label className="block">
          <span className="mb-1 block type-caption text-ink-secondary">한 줄 요약 — 카드뉴스 표지와 한 줄 뉴스에 그대로 나가요 (무슨 일 + 그래서 뭐가 중요한지)</span>
          <input name="takeaway" defaultValue={initial.takeaway} maxLength={160} className="input w-full" placeholder="예: 가계대출 9개월 만에 2.2조 순감 — 신용대출 3조 감소가 주도" />
        </label>
      )}

      <label className="block">
        <span className="mb-1 flex justify-between gap-3 type-caption text-ink-secondary">
          <span>
            {L.summary} — {hint.summary}
          </span>
          <span className="tabular text-ink-mute">{summary.length}/1500</span>
        </span>
        <textarea name="summary" value={summary} onChange={(e) => setSummary(e.target.value)} rows={5} maxLength={1500} required className="input w-full resize-y leading-relaxed" />
      </label>

      <label className="block">
        <span className="mb-1 block type-caption text-ink-secondary">{L.point} (선택)</span>
        <textarea name="point" defaultValue={initial.point} rows={3} maxLength={600} className="input w-full resize-y leading-relaxed" placeholder={hint.point} />
      </label>

      <div className="grid gap-3 sm:grid-cols-[200px_minmax(0,1fr)]">
        <label className="block">
          <span className="mb-1 block type-caption text-ink-secondary">{kind === "news" ? "출처 이름" : "참고 출처 이름 (선택)"}</span>
          <input name="sourceName" defaultValue={initial.sourceName} maxLength={60} className="input w-full" placeholder={kind === "term" ? "예: 한국은행 경제용어사전" : "예: 금융위원회"} />
        </label>
        <label className="block">
          <span className="mb-1 block type-caption text-ink-secondary">{kind === "news" ? "원문 링크" : `${L.source} 링크 (선택)`}</span>
          <input name="sourceUrl" defaultValue={initial.sourceUrl} maxLength={500} inputMode="url" className="input w-full" placeholder="https://…" />
        </label>
      </div>

      {kind === "news" && (
        <div className="rounded-lg border border-hairline px-4 py-3">
          <p className="type-caption text-ink-secondary">표지 사진 (선택) — 카드뉴스 표지 바탕과 기사 카드에 쓰여요. 없으면 카테고리 색 표지가 나와요.</p>
          <p className="mt-1 type-micro text-ink-mute">
            언론사 기사 사진은 출처를 적어도 허락 없이 쓰면 저작권 침해예요. 직접 찍은 사진, 무료 이미지(Unsplash·Pexels·Pixabay), 공공누리 제1유형 사진(출처 표시)만 올려 주세요.
          </p>
          <input type="hidden" name="imageUrl" value={image} />
          <input ref={fileInput} type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden" onChange={(e) => upload(e.target.files)} />
          <div className="mt-3 flex flex-wrap items-start gap-3">
            {image ? (
              <div className="relative w-56 overflow-hidden rounded-lg border border-hairline">
                {/* eslint-disable-next-line @next/next/no-img-element -- 방금 올린 사진 미리 보기 */}
                <img src={image} alt="" className="aspect-[16/9] w-full object-cover" />
                <button type="button" onClick={() => setImage("")} className="btn btn-sm btn-toggle absolute top-1.5 right-1.5 bg-canvas" aria-label="사진 빼기">
                  <X className="h-3.5 w-3.5" strokeWidth={2} />
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => fileInput.current?.click()} disabled={uploading} className="btn btn-sm btn-toggle">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} /> : <ImagePlus className="h-4 w-4" strokeWidth={1.75} />}
                사진 올리기
              </button>
            )}
            <label className="block min-w-[200px] flex-1">
              <span className="mb-1 block type-micro text-ink-mute">사진 출처 (예: Unsplash · 홍길동, 금융위원회 공공누리 1유형)</span>
              <input name="imageCredit" defaultValue={initial.imageCredit} maxLength={80} className="input w-full" />
            </label>
          </div>
          {uploadError && <p className="mt-2 type-caption text-ev-doc">{uploadError}</p>}
        </div>
      )}

      {kind === "news" && (
        <div className="grid gap-3 sm:grid-cols-[200px_minmax(0,1fr)]">
          <label className="block">
            <span className="mb-1 block type-caption text-ink-secondary">시간표 한 줄 제목 ({CARD_LEN.short}자 안)</span>
            <input name="short" defaultValue={initial.short} maxLength={CARD_LEN.short} className="input w-full" placeholder="예: 가계대출 한 달 만에 다시 증가" />
          </label>
          <label className="block">
            <span className="mb-1 block type-caption text-ink-secondary">카드뉴스 표지 그림 — 비우면 제목·분야로 골라요</span>
            <input name="pic" defaultValue={initial.pic} list="news-pics" maxLength={60} className="input w-full" placeholder="예: kong-banker, house, who:lee-jaemyung, org:fss" />
            <datalist id="news-pics">
              {Object.entries(PICS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </datalist>
          </label>
        </div>
      )}

      {kind === "news" && (
        <details open={Boolean(initial.cards)} className="rounded-lg border border-hairline px-4 py-3">
          <summary className="cursor-pointer type-caption text-ink-secondary">카드뉴스 사이 장 (선택 · JSON) — 표지와 &lsquo;왜 중요할까&rsquo; 사이에 넘겨 보는 2~4장</summary>
          <p className="mt-2 type-micro leading-relaxed text-ink-mute">
            비우면 요약을 나눠 글 카드로 보여 줘요. 종류: text {"{title, text, pic}"} · stat {"{value, label, note, pic}"} · bars {"{title, bars: [{label, value, hi}], note}"} · change{" "}
            {"{title, rows: [{label, from, to}], note}"} · flow {"{title, steps: []}"} · term {"{term, text}"} · quote {"{who, name, text, note}"} · versus{" "}
            {"{title, left: {name, text}, right: {name, text}}"}. 숫자는 요약에 있는 그대로만 써 주세요 — 막대 길이·오름내림은 적힌 숫자로 계산해요.
          </p>
          <textarea
            name="cards"
            defaultValue={initial.cards}
            rows={10}
            maxLength={6000}
            placeholder={'[\n  { "type": "stat", "value": "2조6058억원", "label": "이달 늘어난 가계대출" }\n]'}
            className="input mt-3 w-full resize-y font-mono text-[13px] leading-relaxed"
          />
          <p className="mt-3 type-micro leading-relaxed text-ink-mute">
            각주 (선택 · JSON) — 생초보가 모를 말 풀이 {'[{ "term": "쇄신방안", "text": "잘못된 점을 고쳐 새롭게 바꾸려는 계획이에요." }]'}. 용어 사전에 있는 말(코픽스·은행채 등)은 저절로 붙어요.
          </p>
          <textarea name="notes" defaultValue={initial.notes} rows={4} maxLength={3000} className="input mt-1.5 w-full resize-y font-mono text-[13px] leading-relaxed" />
        </details>
      )}

      <details open={kind === "question" || Boolean(initial.body)} className="rounded-lg border border-hairline px-4 py-3">
        <summary className="cursor-pointer type-caption text-ink-secondary">
          {L.body} ({kind === "question" ? "권장" : "선택"} · 마크다운)
        </summary>
        <textarea
          name="body"
          defaultValue={initial.body}
          rows={8}
          maxLength={8000}
          placeholder={hint.body}
          className="input mt-3 w-full resize-y font-mono text-[14px] leading-relaxed"
        />
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
