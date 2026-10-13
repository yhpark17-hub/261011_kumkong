"use client";

import { useRef, useState } from "react";
import { FileText, ImagePlus, Loader2, X } from "lucide-react";
import { ACCEPT_ATTR, MAX_ATTACHMENTS, formatBytes, type Attachment } from "@/lib/attachments";
import { uploadFile } from "@/lib/upload-client";

/** 글쓰기 사진·파일 첨부 — 고르는 즉시 올리고, 폼에는 JSON 으로 함께 보냅니다 */
export function AttachmentPicker({
  initial = [],
  onBusyChange,
}: {
  initial?: Attachment[];
  /** 올리는 중에는 등록 버튼을 잠그도록 */
  onBusyChange?: (busy: boolean) => void;
}) {
  const [items, setItems] = useState<Attachment[]>(initial);
  const [uploading, setUploading] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function onPick(files: FileList | null) {
    if (!files?.length) return;
    setError(null);
    const room = MAX_ATTACHMENTS - items.length;
    const picked = [...files].slice(0, room);
    if (files.length > room) setError(`첨부는 ${MAX_ATTACHMENTS}개까지예요.`);
    setUploading((n) => n + picked.length);
    onBusyChange?.(true);
    for (const f of picked) {
      try {
        const a = await uploadFile(f, "board");
        setItems((prev) => [...prev, a]);
      } catch (e) {
        setError(e instanceof Error ? e.message : "올리지 못했어요.");
      } finally {
        setUploading((n) => n - 1);
      }
    }
    onBusyChange?.(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div>
      <input type="hidden" name="attachments" value={JSON.stringify(items)} />
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPT_ATTR}
        className="hidden"
        onChange={(e) => onPick(e.target.files)}
      />
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading > 0 || items.length >= MAX_ATTACHMENTS}
          className="btn btn-sm btn-toggle disabled:opacity-50"
        >
          <ImagePlus className="h-4 w-4" strokeWidth={1.75} />
          사진·파일 첨부
        </button>
        <span className="type-micro text-ink-mute">
          사진·PDF·한글·오피스 문서 · 파일당 4MB · 최대 {MAX_ATTACHMENTS}개 ({items.length}/{MAX_ATTACHMENTS})
        </span>
        {uploading > 0 && (
          <span className="inline-flex items-center gap-1 type-caption text-primary-text">
            <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />
            {uploading}개 올리는 중
          </span>
        )}
      </div>
      {error && <p className="mt-2 type-caption text-ev-doc">{error}</p>}

      {items.length > 0 && (
        <ul className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
          {items.map((a, i) => (
            <li key={a.url} className="relative">
              {a.kind === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element -- 사용자가 올린 이미지 미리보기
                <img src={a.url} alt={a.name} className="aspect-square w-full rounded-md border border-hairline object-cover" />
              ) : (
                <div className="flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-md border border-hairline bg-canvas-soft p-2 text-center">
                  <FileText className="h-5 w-5 text-ink-mute" strokeWidth={1.5} />
                  <span className="line-clamp-2 break-all type-micro text-ink-secondary">{a.name}</span>
                  <span className="type-micro text-ink-mute">{formatBytes(a.size)}</span>
                </div>
              )}
              <button
                type="button"
                onClick={() => setItems((prev) => prev.filter((_, j) => j !== i))}
                className="absolute top-1 right-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand-dark/80 text-on-primary"
                aria-label={`${a.name} 빼기`}
              >
                <X className="h-3.5 w-3.5" strokeWidth={2} />
              </button>
            </li>
          ))}
        </ul>
      )}
      {items.length > 0 && (
        <p className="mt-2 type-micro text-ink-mute">첨부한 사진·파일은 글과 함께 누구나 볼 수 있어요. 개인정보가 담기지 않았는지 확인해 주세요.</p>
      )}
    </div>
  );
}
