"use client";

import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import { AlertTriangle, Check, ImageUp, Loader2, X } from "lucide-react";
import { saveIssueThumb, type ThumbFormState } from "@/app/admin/issue-actions";
import { formatShort } from "@/lib/date";
import {
  COSTUMES,
  ISSUE_LAYOUTS,
  SCENES,
  THUMB_LIMITS,
  THUMB_MOODS,
  type CostumeKey,
  type CoverMode,
  type IssueEdition,
  type IssueLayout,
  type IssueThumb,
  type SceneKey,
  type ThumbMood,
} from "@/lib/news-meta";
import { captionFit, headlineFit, speechFit, topicFit } from "@/lib/og-text";
import { artOverflows, parseArt } from "@/lib/thumb-art";
import { uploadFile } from "@/lib/upload-client";
import { BriefingCover } from "../magazine/BriefingBrand";
import { cn } from "../ui";

export interface ThumbAuto {
  layout: IssueLayout;
  /** 자동 숫자 칩 (한 줄에 하나) */
  stats: string;
  scene: SceneKey;
  costume: CostumeKey;
  mood: ThumbMood;
  bubble: string;
  caption: string;
  topic: string;
}

const COVER_OPTIONS: { key: CoverMode; label: string; desc: string }[] = [
  { key: "default", label: "오늘 썸네일 (기본)", desc: "카톡 공유 그림과 같은 그림을 브리핑 목록·카드에도" },
  { key: "brand", label: "판 색 표지", desc: "판 색 하늘 + 금콩 로고 (예전 기본 표지)" },
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
  views,
  initial,
  auto,
}: {
  id: number;
  edition: IssueEdition;
  date: string;
  /** 사이트 표지 미리보기의 조회수 */
  views: number;
  initial: IssueThumb;
  auto: ThumbAuto;
}) {
  const [state, action, pending] = useActionState<ThumbFormState, FormData>(saveIssueThumb, { ok: false });
  const [scene, setScene] = useState<SceneKey | "">(initial.scene);
  const [costume, setCostume] = useState<CostumeKey | "">(initial.costume);
  const [kong, setKong] = useState<IssueThumb["kong"]>(initial.kong);
  const [mood, setMood] = useState<ThumbMood | "">(initial.mood);
  const [bubble, setBubble] = useState(initial.bubble);
  const [caption, setCaption] = useState(initial.caption);
  const [topic, setTopic] = useState(initial.topic);
  const [shareUrl, setShareUrl] = useState(initial.shareUrl);
  const [cover, setCover] = useState<CoverMode>(initial.cover);
  const [coverUrl, setCoverUrl] = useState(initial.coverUrl);
  const [checked, setChecked] = useState(initial.checked);
  const [layout, setLayout] = useState<IssueLayout | "">(initial.layout);
  const [stats, setStats] = useState(initial.stats);
  // 직접 그린 그림 (JSON) — 켜 두면 아래 틀 설정 대신 이 그림이 나가요
  const initialArt = initial.art ? JSON.stringify(initial.art, null, 1) : "";
  const [artText, setArtText] = useState(initialArt);
  const [artOn, setArtOn] = useState(Boolean(initial.art));
  const artParsed = artText.trim() ? parseArt(artText) : null;
  const artBroken = Boolean(artText.trim()) && !artParsed;
  const artLong = artParsed ? artOverflows(artParsed) : [];
  const morning = edition === "morning";

  // 미리보기 주소 — 글자를 칠 때마다가 아니라 잠깐 멈추면 다시 그려요
  const query = new URLSearchParams({ scene, costume, kong, mood, bubble, caption, topic, layout, stats }).toString();
  const [previewQuery, setPreviewQuery] = useState(query);
  useEffect(() => {
    const t = window.setTimeout(() => setPreviewQuery(query), 500);
    return () => window.clearTimeout(t);
  }, [query]);
  const drawn = `/admin/news/issue/${id}/thumb?${previewQuery}${artOn ? "" : "&art=off"}`;
  // 그림 JSON 을 고치는 중이면 주소에 담기엔 길어서 POST 로 그려 받아요
  const artEdited = artOn && artText !== initialArt && Boolean(artParsed);
  const [artBlob, setArtBlob] = useState("");
  useEffect(() => {
    if (!artEdited) return;
    const ctl = new AbortController();
    const t = window.setTimeout(async () => {
      const res = await fetch(drawn, { method: "POST", body: JSON.stringify({ art: JSON.parse(artText) }), signal: ctl.signal }).catch(() => null);
      if (!res?.ok) return;
      const url = URL.createObjectURL(await res.blob());
      setArtBlob((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
    }, 700);
    return () => {
      window.clearTimeout(t);
      ctl.abort();
    };
  }, [artEdited, artText, drawn]);
  const share = shareUrl || (artEdited && artBlob ? artBlob : drawn);
  const [loadedSrc, setLoadedSrc] = useState(share);
  const loading = loadedSrc !== share;

  const autoSceneLabel = SCENES.find((c) => c.key === auto.scene)?.label ?? "";
  const autoCostumeLabel = COSTUMES.find((c) => c.key === auto.costume)?.label ?? "";
  const speech = (scene || auto.scene) === "speech";
  const autoMoodLabel = THUMB_MOODS.find((m) => m.key === auto.mood)?.label ?? "";
  const bubbleNow = speech ? speechFit(bubble || auto.bubble) : headlineFit(bubble || auto.bubble);
  const captionNow = captionFit(caption || auto.caption);
  const topicNow = topicFit(topic || auto.topic);
  const changed =
    scene !== initial.scene ||
    kong !== initial.kong ||
    costume !== initial.costume ||
    mood !== initial.mood ||
    bubble !== initial.bubble ||
    caption !== initial.caption ||
    topic !== initial.topic ||
    shareUrl !== initial.shareUrl ||
    cover !== initial.cover ||
    coverUrl !== initial.coverUrl ||
    checked !== initial.checked ||
    layout !== initial.layout ||
    stats !== initial.stats ||
    artOn !== Boolean(initial.art) ||
    (artOn && artText !== initialArt);

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
      <input type="hidden" name="art" value={artOn ? artText : ""} />

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
            {cover === "brand" || (cover === "upload" && !coverUrl) ? (
              <BriefingCover edition={edition} date={formatShort(date)} note={`조회 ${views.toLocaleString()}`} noteIcon="eye" className="aspect-[16/9] w-full" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element -- 미리보기
              <img src={cover === "upload" ? coverUrl : share} alt="사이트 표지 미리보기" className="aspect-[16/9] w-full bg-canvas-soft object-cover" />
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
        <fieldset className="space-y-2 rounded-lg border border-hairline p-3">
          <legend className="px-1 type-caption font-semibold text-ink-secondary">직접 그린 그림 — 그날 뉴스에 맞춰 새로 짠 썸네일</legend>
          <label className="inline-flex items-center gap-2 type-caption text-ink">
            <input type="checkbox" checked={artOn} disabled={!artText.trim()} onChange={(e) => setArtOn(e.target.checked)} className="h-4 w-4 accent-[var(--primary)]" />
            {artText.trim() ? "직접 그린 그림 쓰기 (끄면 아래 틀로 그려요)" : "이 호는 직접 그린 그림이 없어요 — 아래 틀로 그려요"}
          </label>
          <details className="group">
            <summary className="cursor-pointer type-caption text-ink-mute hover:text-ink">그림 JSON 고치기 (svg · texts · brand)</summary>
            <textarea
              value={artText}
              onChange={(e) => setArtText(e.target.value)}
              rows={10}
              spellCheck={false}
              placeholder='{ "svg": "<rect …/><kk-person …/>", "texts": [{ "t": "큰 글 *강조*", "x": 60, "y": 120, "w": 600, "size": 80 }], "brand": { "pos": "tr", "theme": "dark" } }'
              className="input mt-2 w-full resize-y font-mono text-[12px] leading-snug"
            />
            <p className="mt-1 type-micro text-ink-mute">자동 점검이 호마다 새로 그려요. 글자 속 숫자·따옴표 말은 기사에 실린 그대로만. 부품 목록은 scripts/automation/ROUTINE.md 에 있어요.</p>
          </details>
          {artBroken && (
            <p className="flex items-center gap-1 type-micro text-ev-doc">
              <AlertTriangle className="h-3.5 w-3.5" strokeWidth={2} />
              JSON 을 읽을 수 없어요 — 형식을 확인해 주세요 (svg 가 꼭 있어야 해요).
            </p>
          )}
          {artLong.length > 0 && (
            <p className="flex items-center gap-1 type-micro text-ev-doc">
              <AlertTriangle className="h-3.5 w-3.5" strokeWidth={2} />
              칸보다 긴 글자: {artLong.join(" · ")}
            </p>
          )}
          {artOn && <p className="type-micro text-ink-mute">그린 그림을 쓰는 동안 아래 틀 설정(배치·그림·제목 상자·공책)은 쓰이지 않아요.</p>}
        </fieldset>

        {morning ? (
          <fieldset className={cn("space-y-3", artOn && "opacity-50")}>
            <legend className="type-caption font-semibold text-ink-secondary">뉴스 그림 — 날마다 배치·그림을 바꿔 매번 다른 썸네일로</legend>
            <label className="block">
              <span className="mb-1 block type-caption text-ink-secondary">배치</span>
              <select name="layout" value={layout} onChange={(e) => setLayout(e.target.value as IssueLayout | "")} className="input w-full">
                <option value="">자동 — {ISSUE_LAYOUTS.find((x) => x.key === auto.layout)?.label ?? auto.layout} (날짜에 따라 번갈아)</option>
                {ISSUE_LAYOUTS.map((x) => (
                  <option key={x.key} value={x.key}>
                    {x.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block type-caption text-ink-secondary">뉴스 그림</span>
              <select name="scene" value={scene} onChange={(e) => setScene(e.target.value as SceneKey | "")} className="input w-full">
                <option value="">자동 — {autoSceneLabel}</option>
                {SCENES.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block type-caption text-ink-secondary">콩이 변장 {speech ? "(인물 발언)" : "(콩이를 넣을 때)"}</span>
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
                <span>{speech ? "말풍선 — 인물 발언" : "제목 상자 큰 글"} (비우면 제목 앞부분)</span>
                <span className="tabular text-ink-mute">
                  {bubble.length}/{THUMB_LIMITS.bubble}
                </span>
              </span>
              <input name="bubble" value={bubble} onChange={(e) => setBubble(e.target.value)} maxLength={THUMB_LIMITS.bubble} placeholder={auto.bubble} className="input w-full" />
              <p className="mt-1 type-micro text-ink-mute">인물 발언을 따라 할 때는 기사에 실린 말을 그대로(따옴표째) 써 주세요. 지어낸 말은 넣지 않아요.</p>
              <FitNote fit={bubbleNow} what={speech ? "말풍선이" : "제목이"} />
            </label>
            {!speech && (
              <label className="block">
                <span className="mb-1 block type-caption text-ink-secondary">콩이 등장</span>
                <select name="kong" value={kong} onChange={(e) => setKong(e.target.value as IssueThumb["kong"])} className="input w-full">
                  <option value="auto">자동 — 분위기가 뚜렷한 날(오름·내림) 왼쪽에서 반응</option>
                  <option value="on">넣기 — 왼쪽에서 뉴스에 반응하는 콩이</option>
                  <option value="off">빼기 — 그림과 제목만</option>
                </select>
              </label>
            )}
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
            <label className="block">
              <span className="mb-1 block type-caption text-ink-secondary">숫자 칩 — 큰 글씨형·숫자판에 나와요 (한 줄에 하나, 최대 3줄 · 맨 앞 ▲ 오름 / ▼ 내림)</span>
              <textarea name="stats" value={stats} onChange={(e) => setStats(e.target.value)} rows={3} placeholder={auto.stats || "▼ 연 4% 미만 가계대출 비중 12.9%\n▲ 브렌트유 117달러"} className="input w-full resize-y" />
              <p className="mt-1 type-micro text-ink-mute">비우면 오늘 기사 제목에서 숫자가 있는 것을 골라요. 숫자는 기사에 실린 그대로만 써 주세요. 큰 글을 *별표*로 감싸면 그 말이 노랗게 크게 보여요.</p>
            </label>
          </fieldset>
        ) : (
          <fieldset className={cn("space-y-3", artOn && "opacity-50")}>
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
