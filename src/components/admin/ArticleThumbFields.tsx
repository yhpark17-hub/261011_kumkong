"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { ARTICLE_SCENES, ARTICLE_THUMB_LIMITS, summaryLines, type ArticleSceneKey } from "@/lib/magazine-meta";
import { captionFit, headlineFit } from "@/lib/og-text";

/** 자동이면 무엇인지 (저장된 글 기준으로 서버가 계산) */
export interface ThumbAutoInfo {
  scene: ArticleSceneKey;
  company: string;
  companyName: string;
  kicker: string;
}

export interface ThumbValues {
  thumbScene: ArticleSceneKey | "";
  thumbCompany: string;
  thumbKicker: string;
  thumbHeadline: string;
  thumbSub: string;
}

const sceneLabel = (k: ArticleSceneKey) => ARTICLE_SCENES.find((s) => s.key === k)?.label ?? k;

function FitNote({ fit, what }: { fit: { size: number; lines: string[]; overflow: boolean }; what: string }) {
  return fit.overflow ? (
    <p className="mt-1 flex items-center gap-1 type-micro text-ev-doc">
      <AlertTriangle className="h-3.5 w-3.5" strokeWidth={2} />
      {what} 길어서 썸네일에서 끝이 잘려요(…). 줄여 주세요.
    </p>
  ) : (
    <p className="mt-1 type-micro text-ink-mute">
      썸네일에 {fit.lines.length}줄 · 글자 {fit.size}px로 들어가요.
    </p>
  );
}

/**
 * 글 썸네일 칸 — 표지를 올리지 않으면 목록 카드·카톡 공유에 이 그림이 쓰여요.
 * 비워 두면 자동 (기관이 나온 글은 그 기관 본사 건물 + 로고, 아니면 카테고리 그림 / 제목은 글 제목).
 */
export function ArticleThumbFields({
  id,
  v,
  onChange,
  auto,
  companies,
  hasCover,
  draft,
}: {
  id: number | null;
  v: ThumbValues;
  onChange: <K extends keyof ThumbValues>(k: K, value: ThumbValues[K]) => void;
  auto: ThumbAutoInfo | null;
  companies: { id: string; name: string }[];
  hasCover: boolean;
  /** 편집 중인 글 값 — 미리보기·자동 제목에 */
  draft: { title: string; summary: string; tags: string; category: string };
}) {
  const i = draft.title.indexOf(" — ");
  const autoHeadline = (i < 0 ? draft.title : draft.title.slice(0, i)).trim();
  const autoSub = (i < 0 ? "" : draft.title.slice(i + 3).trim()) || summaryLines(draft.summary)[0] || "";

  // 미리보기 — 글자를 칠 때마다가 아니라 잠깐 멈추면 다시 그려요
  const query = new URLSearchParams({
    preview: "1",
    scene: v.thumbScene,
    company: v.thumbCompany,
    kicker: v.thumbKicker,
    headline: v.thumbHeadline,
    sub: v.thumbSub,
    title: draft.title,
    summary: draft.summary,
    tags: draft.tags,
    category: draft.category,
  }).toString();
  const [q, setQ] = useState(query);
  useEffect(() => {
    const t = window.setTimeout(() => setQ(query), 600);
    return () => window.clearTimeout(t);
  }, [query]);
  const src = id ? `/magazine/${id}/thumb?${q}` : null;
  const [loadedSrc, setLoadedSrc] = useState(src);

  const head = headlineFit(v.thumbHeadline || autoHeadline);
  const sub = captionFit(v.thumbSub || autoSub);

  return (
    <div className="rounded-lg border border-hairline p-4">
      <p className="type-caption font-semibold text-ink">썸네일</p>
      <p className="mt-0.5 type-micro text-ink-mute [word-break:keep-all]">
        {hasCover
          ? "표지를 올려서 목록·공유에는 올린 표지가 쓰여요. 표지를 빼면 이 썸네일이 쓰여요."
          : "목록 카드와 카톡·SNS 공유 미리보기에 쓰여요. 비워 두면 자동으로 채워요."}
      </p>

      <div className="mt-3">
        {src ? (
          <a href={src} target="_blank" className="relative block overflow-hidden rounded-lg border border-hairline">
            {/* eslint-disable-next-line @next/next/no-img-element -- 그때그때 그리는 미리보기 */}
            <img src={src} alt="썸네일 미리보기" onLoad={() => setLoadedSrc(src)} onError={() => setLoadedSrc(src)} className="aspect-[1200/630] w-full bg-canvas-soft object-cover" />
            {loadedSrc !== src && (
              <span className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-full bg-canvas/90 px-2 py-1 type-micro text-ink-secondary">
                <Loader2 className="h-3 w-3 animate-spin" strokeWidth={2} />
                그리는 중
              </span>
            )}
          </a>
        ) : (
          <p className="rounded-lg bg-canvas-soft px-3 py-6 text-center type-caption text-ink-mute">처음 저장하면 썸네일 미리보기가 보여요.</p>
        )}
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block type-caption text-ink-secondary">그림</span>
          <select name="thumbScene" value={v.thumbScene} onChange={(e) => onChange("thumbScene", e.target.value as ThumbValues["thumbScene"])} className="input w-full">
            <option value="">자동{auto ? ` (${sceneLabel(auto.scene)})` : ""}</option>
            {ARTICLE_SCENES.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block type-caption text-ink-secondary">간판 기관 (건물 그림일 때)</span>
          <select name="thumbCompany" value={v.thumbCompany} onChange={(e) => onChange("thumbCompany", e.target.value)} className="input w-full">
            <option value="">자동{auto?.companyName ? ` (${auto.companyName})` : " (태그·제목에 나온 기관)"}</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1 flex justify-between type-caption text-ink-secondary">
            이름표 옆 말 <span className="tabular text-ink-mute">{v.thumbKicker.length}/{ARTICLE_THUMB_LIMITS.kicker}</span>
          </span>
          <input name="thumbKicker" value={v.thumbKicker} onChange={(e) => onChange("thumbKicker", e.target.value)} maxLength={ARTICLE_THUMB_LIMITS.kicker} className="input w-full" placeholder={auto?.kicker ? `자동: ${auto.kicker}` : "예: 산은 경영 필기"} />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1 flex justify-between type-caption text-ink-secondary">
            큰 제목 <span className="tabular text-ink-mute">{v.thumbHeadline.length}/{ARTICLE_THUMB_LIMITS.headline}</span>
          </span>
          <input name="thumbHeadline" value={v.thumbHeadline} onChange={(e) => onChange("thumbHeadline", e.target.value)} maxLength={ARTICLE_THUMB_LIMITS.headline} className="input w-full" placeholder={`자동: ${autoHeadline || "글 제목"}`} />
          <FitNote fit={head} what="제목이" />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1 flex justify-between type-caption text-ink-secondary">
            제목 아래 한 줄 <span className="tabular text-ink-mute">{v.thumbSub.length}/{ARTICLE_THUMB_LIMITS.sub}</span>
          </span>
          <input name="thumbSub" value={v.thumbSub} onChange={(e) => onChange("thumbSub", e.target.value)} maxLength={ARTICLE_THUMB_LIMITS.sub} className="input w-full" placeholder={autoSub ? `자동: ${autoSub}` : "비우면 없음"} />
          {(v.thumbSub || autoSub) && <FitNote fit={sub} what="아래 한 줄이" />}
        </label>
      </div>
    </div>
  );
}
