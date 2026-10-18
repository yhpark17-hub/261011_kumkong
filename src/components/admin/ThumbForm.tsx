"use client";

import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import { AlertTriangle, Check, ImageUp, Loader2, X } from "lucide-react";
import { saveIssueThumb, type ThumbFormState } from "@/app/admin/issue-actions";
import { formatShort } from "@/lib/date";
import { COSTUMES, THUMB_LIMITS, THUMB_MOODS, type CostumeKey, type CoverMode, type IssueEdition, type IssueThumb, type ThumbMood } from "@/lib/news-meta";
import { bubbleFit, captionFit, topicFit } from "@/lib/og-text";
import { uploadFile } from "@/lib/upload-client";
import { BriefingCover } from "../magazine/BriefingBrand";
import { cn } from "../ui";

export interface ThumbAuto {
  costume: CostumeKey;
  mood: ThumbMood;
  bubble: string;
  caption: string;
  topic: string;
}

const COVER_OPTIONS: { key: CoverMode; label: string; desc: string }[] = [
  { key: "default", label: "기본 표지", desc: "판 색 하늘 + 금콩 로고 (지금처럼)" },
  { key: "share", label: "공유 썸네일과 같은 그림", desc: "왼쪽 위 그림을 사이트 카드에도" },
  { key: "upload", label: "직접 올린 그림", desc: "16:9 그림을 올려 주세요" },
];

/** 공유 썸네일 칸 위 '넘침' 안내 — what 은 조사까지 (예: "말풍선이", "논술 주제가") */
function FitNote({ fit, what }: { fit: { size: number; lines: string[]; overflow: boolean }; what: string }) {
  return fit.overflow ? (
    <p className="mt-1 flex items-center gap-1 type-micro text-ev-doc">
      <AlertTriangle className="h-3.5 w-3.5" strokeWidth={2} />
      {what} 길어서 썸네일에서 끝이 잘려요(…). 뜻이 바뀌지 않게 줄여 주세요.
    </p>
  ) : (
    <p className="mt-1 type-micro text-ink-mute">
      썸네일에 {fit.lines.length}줄 · 글자 {fit.size}px로 들어가요.
    </p>
  );
}

/** 올리기 버튼 + 올린 그림 */
function UploadField({ label, url, onChange, hint }: { label: string; url: string; onChange: (url: string) => void; hint: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function upload(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      onChange((await uploadFile(file, "magazine")).url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "올리지 못했어요.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => input.current?.click()} disabled={busy} className="btn btn-sm btn-toggle">
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} /> : <ImageUp className="h-3.5 w-3.5" strokeWidth={1.75} />}
          {url ? `${label} 바꾸기` : `${label} 올리기`}
        </button>
        {url && (
          <button type="button" onClick={() => onChange("")} className="inline-flex items-center gap-0.5 type-caption text-ink-mute hover:text-ev-doc">
            <X className="h-3.5 w-3.5" strokeWidth={2} />
            지우기
          </button>
        )}
        <input ref={input} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => upload(e.target.files)} />
      </div>
      <p className="mt-1 type-micro text-ink-mute">{hint}</p>
      {error && <p className="mt-1 type-micro text-ev-doc">{error}</p>}
    </div>
  );
}

/**
 * 썸네일 편집 — 채팅방 공유 썸네일(og:image)과 시사 뉴스 화면의 표지를 미리 보며 고쳐요.
 * 고치는 대로 오른쪽 미리보기가 다시 그려지고, '썸네일 저장'을 눌러야 실제로 바뀌어요.
 */
export function ThumbForm({
  id,
  edition,
  date,
  minutes,
  initial,
  auto,
}: {
  id: number;
  edition: IssueEdition;
  date: string;
  minutes: number;
  initial: IssueThumb;
  auto: ThumbAuto;
}) {
  const [state, action, pending] = useActionState<ThumbFormState, FormData>(saveIssueThumb, { ok: false });
  const [costume, setCostume] = useState<CostumeKey | "">(initial.costume);
  const [mood, setMood] = useState<ThumbMood | "">(initial.mood);
  const [bubble, setBubble] = useState(initial.bubble);
  const [caption, setCaption] = useState(initial.caption);
  const [topic, setTopic] = useState(initial.topic);
  const [shareUrl, setShareUrl] = useState(initial.shareUrl);
  const [cover, setCover] = useState<CoverMode>(initial.cover);
  const [coverUrl, setCoverUrl] = useState(initial.coverUrl);
  const [checked, setChecked] = useState(initial.checked);
  const morning = edition === "morning";

  // 미리보기 주소 — 글자를 칠 때마다가 아니라 잠깐 멈추면 다시 그려요
  const query = new URLSearchParams({ costume, mood, bubble, caption, topic }).toString();
  const [previewQuery, setPreviewQuery] = useState(query);
  useEffect(() => {
    const t = window.setTimeout(() => setPreviewQuery(query), 500);
    return () => window.clearTimeout(t);
  }, [query]);
  const drawn = `/admin/news/issue/${id}/thumb?${previewQuery}`;
  const share = shareUrl || drawn;
  const [loadedSrc, setLoadedSrc] = useState(share);
  const loading = loadedSrc !== share;

  const autoCostumeLabel = COSTUMES.find((c) => c.key === auto.costume)?.label ?? "";
  const autoMoodLabel = THUMB_MOODS.find((m) => m.key === auto.mood)?.label ?? "";
  const bubbleNow = bubbleFit(bubble || auto.bubble);
  const captionNow = captionFit(caption || auto.caption);
  const topicNow = topicFit(topic || auto.topic);
  const changed =
    costume !== initial.costume ||
    mood !== initial.mood ||
    bubble !== initial.bubble ||
    caption !== initial.caption ||
    topic !== initial.topic ||
    shareUrl !== initial.shareUrl ||
    cover !== initial.cover ||
    coverUrl !== initial.coverUrl ||
    checked !== initial.checked;

  return (
    <form
      // action 대신 직접 보내요 — React 가 저장 뒤 폼을 처음 값으로 되돌리면 라디오·체크 표시가 화면 상태와 어긋나서
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(() => action(fd));
      }}
      className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]"
    >
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="shareUrl" value={shareUrl} />
      <input type="hidden" name="coverUrl" value={coverUrl} />

      {/* ---------- 미리보기 ---------- */}
      <div className="space-y-5 lg:order-2">
        <div>
          <p className="mb-1.5 flex items-center justify-between type-caption font-semibold text-ink-secondary">
            채팅방 공유 썸네일
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-ink-mute" strokeWidth={2} />}
          </p>
          <a href={share} target="_blank" className="block overflow-hidden rounded-lg border border-hairline">
            {/* eslint-disable-next-line @next/next/no-img-element -- 그때그때 그리는 미리보기 */}
            <img src={share} alt="공유 썸네일 미리보기" onLoad={() => setLoadedSrc(share)} onError={() => setLoadedSrc(share)} className="aspect-[1200/630] w-full bg-canvas-soft object-cover" />
          </a>
          <p className="mt-1 type-micro text-ink-mute">카톡은 같은 주소의 그림을 한동안 기억해요. 저장하면 주소가 바뀌어 새로 공유할 때부터 새 그림이 떠요.</p>
        </div>
        <div>
          <p className="mb-1.5 type-caption font-semibold text-ink-secondary">시사 뉴스 화면 표지 (첫 화면·목록 카드)</p>
          <div className="overflow-hidden rounded-lg border border-hairline">
            {cover === "default" || (cover === "upload" && !coverUrl) ? (
              <BriefingCover edition={edition} date={formatShort(date)} note={`약 ${minutes}분`} className="aspect-[16/9] w-full" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element -- 미리보기
              <img src={cover === "share" ? share : coverUrl} alt="사이트 표지 미리보기" className="aspect-[16/9] w-full bg-canvas-soft object-cover" />
            )}
          </div>
        </div>
      </div>

      {/* ---------- 고치는 칸 ---------- */}
      <div className="space-y-5 lg:order-1">
        {shareUrl && (
          <p className="rounded-lg bg-canvas-cream p-3 type-caption text-ink-secondary">
            직접 올린 그림을 공유 썸네일로 쓰고 있어요. 아래 설정은 올린 그림을 지웠을 때 그리는 그림에 쓰여요.
          </p>
        )}
        {morning ? (
          <fieldset className="space-y-3">
            <legend className="type-caption font-semibold text-ink-secondary">시사 만화 — 콩이가 오늘 주제로 변장하고 한마디</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block type-caption text-ink-secondary">변장</span>
                <select name="costume" value={costume} onChange={(e) => setCostume(e.target.value as CostumeKey | "")} className="input w-full">
                  <option value="">자동 — {autoCostumeLabel}</option>
                  {COSTUMES.map((c) => (
                    <option key={c.key} value={c.key}>
                      {c.label} · {c.hint}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block type-caption text-ink-secondary">표정</span>
                <select name="mood" value={mood} onChange={(e) => setMood(e.target.value as ThumbMood | "")} className="input w-full">
                  {THUMB_MOODS.map((m) => (
                    <option key={m.key} value={m.key}>
                      {m.key ? m.label : `자동 — ${autoMoodLabel}`}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="block">
              <span className="mb-1 flex justify-between gap-3 type-caption text-ink-secondary">
                <span>말풍선 — 비우면 제목 앞부분</span>
                <span className="tabular text-ink-mute">
                  {bubble.length}/{THUMB_LIMITS.bubble}
                </span>
              </span>
              <input name="bubble" value={bubble} onChange={(e) => setBubble(e.target.value)} maxLength={THUMB_LIMITS.bubble} placeholder={auto.bubble} className="input w-full" />
              <p className="mt-1 type-micro text-ink-mute">인물 발언을 따라 할 때는 기사에 실린 말을 그대로(따옴표째) 써 주세요. 지어낸 말은 넣지 않아요.</p>
              <FitNote fit={bubbleNow} what="말풍선이" />
            </label>
            <label className="block">
              <span className="mb-1 flex justify-between gap-3 type-caption text-ink-secondary">
                <span>아래 띠 — 무슨 일인지 사실 한 줄 (비우면 제목 뒷부분)</span>
                <span className="tabular text-ink-mute">
                  {caption.length}/{THUMB_LIMITS.caption}
                </span>
              </span>
              <input name="caption" value={caption} onChange={(e) => setCaption(e.target.value)} maxLength={THUMB_LIMITS.caption} placeholder={auto.caption || "예: 트럼프, 중국산 수입품 관세 인상 예고"} className="input w-full" />
              {(caption || auto.caption) && <FitNote fit={captionNow} what="아래 띠가" />}
            </label>
          </fieldset>
        ) : (
          <fieldset className="space-y-3">
            <legend className="type-caption font-semibold text-ink-secondary">공책 템플릿 — 오늘의 논술 주제</legend>
            <label className="block">
              <span className="mb-1 flex justify-between gap-3 type-caption text-ink-secondary">
                <span>썸네일에 넣을 논술 주제 — 비우면 &lsquo;논술 한 문단&rsquo; 주제</span>
                <span className="tabular text-ink-mute">
                  {topic.length}/{THUMB_LIMITS.topic}
                </span>
              </span>
              <textarea name="topic" value={topic} onChange={(e) => setTopic(e.target.value)} rows={3} maxLength={THUMB_LIMITS.topic} placeholder={auto.topic} className="input w-full resize-y" />
              <p className="mt-1 type-micro text-ink-mute">주제가 둘인 날은 더 중요한 하나만 적어 주세요. 줄일 때는 핵심 낱말을 빼지 말고 꾸밈말부터 덜어 내요.</p>
              <FitNote fit={topicNow} what="논술 주제가" />
            </label>
          </fieldset>
        )}

        <div className="space-y-1.5">
          <p className="type-caption font-semibold text-ink-secondary">공유 썸네일 직접 올리기 (선택)</p>
          <UploadField label="그림" url={shareUrl} onChange={setShareUrl} hint="1200×630 그림 권장. 올리면 위 설정 대신 이 그림이 공유돼요." />
        </div>

        <fieldset className="space-y-2">
          <legend className="type-caption font-semibold text-ink-secondary">시사 뉴스 화면 표지</legend>
          <div className="grid gap-2 sm:grid-cols-3">
            {COVER_OPTIONS.map((o) => (
              <label
                key={o.key}
                className={cn(
                  "flex cursor-pointer flex-col gap-0.5 rounded-lg border px-3 py-2.5",
                  cover === o.key ? "border-primary bg-ev-written-soft" : "border-hairline hover:border-hairline-input",
                )}
              >
                <span className="flex items-center gap-1.5 type-caption font-semibold text-ink">
                  <input type="radio" name="cover" value={o.key} checked={cover === o.key} onChange={() => setCover(o.key)} className="accent-[var(--primary)]" />
                  {o.label}
                </span>
                <span className="type-micro text-ink-mute">{o.desc}</span>
              </label>
            ))}
          </div>
          {cover === "upload" && <UploadField label="표지 그림" url={coverUrl} onChange={setCoverUrl} hint="16:9 그림 권장 (가운데를 기준으로 잘려요)." />}
        </fieldset>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-hairline pt-4">
          <label className="inline-flex items-center gap-2 type-caption text-ink">
            <input type="checkbox" name="checked" checked={checked} onChange={(e) => setChecked(e.target.checked)} className="h-4 w-4 accent-[var(--primary)]" />
            썸네일 확인함 (목록에 표시돼요)
          </label>
          <div className="flex items-center gap-3">
            {state.error && <span className="type-caption text-ev-doc">{state.error}</span>}
            {state.ok && !changed && (
              <span className="inline-flex items-center gap-1 type-caption text-ev-final">
                <Check className="h-3.5 w-3.5" strokeWidth={2} />
                저장했어요
              </span>
            )}
            <button type="submit" disabled={pending} className={cn("btn btn-sm btn-primary", pending && "opacity-60")}>
              {pending && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />}
              썸네일 저장
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
