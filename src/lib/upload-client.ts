import { ALLOWED_TYPES, MAX_UPLOAD_BYTES, extOf, type Attachment, type UploadPurpose } from "./attachments";

/** 브라우저에서 사진을 줄여서(긴 변 1920px) 올립니다. GIF 는 움직임을 지키려고 그대로. */
async function shrinkImage(file: File): Promise<File> {
  const ext = extOf(file.name);
  if (!["jpg", "jpeg", "png", "webp"].includes(ext) || typeof createImageBitmap === "undefined") return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 1920 / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size < 1.5 * 1024 * 1024) return file;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.[a-z0-9]+$/i, ".jpg"), { type: "image/jpeg" });
  } catch {
    return file;
  }
}

/** 파일 하나 업로드 → 첨부 정보. 실패하면 사용자에게 보여 줄 문장으로 Error 를 던집니다. */
export async function uploadFile(original: File, purpose: UploadPurpose): Promise<Attachment> {
  if (!ALLOWED_TYPES[extOf(original.name)]) throw new Error(`${original.name}: 올릴 수 없는 형식이에요.`);
  const file = await shrinkImage(original);
  if (file.size > MAX_UPLOAD_BYTES) throw new Error(`${original.name}: 4MB가 넘어요.`);
  const form = new FormData();
  form.append("file", file);
  form.append("purpose", purpose);
  const res = await fetch("/api/upload", { method: "POST", body: form });
  const body = (await res.json().catch(() => ({}))) as Partial<Attachment> & { error?: string; detail?: string };
  if (!res.ok || !body.url) throw new Error(`${original.name}: ${body.error ?? "올리지 못했어요."}${body.detail ? ` (원인: ${body.detail})` : ""}`);
  return body as Attachment;
}
