/** 업로드 파일 공통 규칙 — 서버·클라이언트 모두에서 사용 */

export interface Attachment {
  url: string;
  name: string;
  type: string;
  size: number;
  kind: "image" | "file";
}

export type UploadPurpose = "board" | "magazine";

/** Vercel 요청 본문 한도(4.5MB) 안에서 — 사진은 올리기 전에 브라우저에서 줄입니다 */
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
export const MAX_ATTACHMENTS = 10;
/** 의견 보내기에 함께 보낼 수 있는 수 */
export const MAX_FEEDBACK_ATTACHMENTS = 5;

/** 허용 확장자 → MIME. 실행 파일·웹 문서(svg/html/js 등)는 받지 않습니다 */
export const ALLOWED_TYPES: Record<string, { mime: string; kind: Attachment["kind"] }> = {
  jpg: { mime: "image/jpeg", kind: "image" },
  jpeg: { mime: "image/jpeg", kind: "image" },
  png: { mime: "image/png", kind: "image" },
  gif: { mime: "image/gif", kind: "image" },
  webp: { mime: "image/webp", kind: "image" },
  pdf: { mime: "application/pdf", kind: "file" },
  hwp: { mime: "application/x-hwp", kind: "file" },
  hwpx: { mime: "application/hwp+zip", kind: "file" },
  doc: { mime: "application/msword", kind: "file" },
  docx: { mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", kind: "file" },
  xls: { mime: "application/vnd.ms-excel", kind: "file" },
  xlsx: { mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", kind: "file" },
  ppt: { mime: "application/vnd.ms-powerpoint", kind: "file" },
  pptx: { mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation", kind: "file" },
  txt: { mime: "text/plain; charset=utf-8", kind: "file" },
  zip: { mime: "application/zip", kind: "file" },
};

export const ACCEPT_ATTR = Object.keys(ALLOWED_TYPES)
  .map((e) => `.${e}`)
  .join(",");

export function extOf(name: string): string {
  const m = name.toLowerCase().match(/\.([a-z0-9]{1,5})$/);
  return m ? m[1] : "";
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n}B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)}KB`;
  return `${(n / 1024 / 1024).toFixed(1)}MB`;
}

/** 우리 저장소에서 나온 주소인지 (외부 링크를 첨부로 끼워 넣지 못하게) */
export function isOwnFileUrl(url: string): boolean {
  return /^\/api\/files\/[a-z0-9/_-]+\.[a-z0-9]{1,5}$/i.test(url) || /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\//i.test(url);
}

/** JSON 문자열 → 검증된 첨부 목록 */
export function parseAttachments(raw: unknown): Attachment[] {
  let list: unknown;
  try {
    list = typeof raw === "string" ? JSON.parse(raw || "[]") : raw;
  } catch {
    return [];
  }
  if (!Array.isArray(list)) return [];
  const out: Attachment[] = [];
  for (const a of list) {
    if (!a || typeof a !== "object") continue;
    const { url, name, type, size, kind } = a as Record<string, unknown>;
    if (typeof url !== "string" || !isOwnFileUrl(url)) continue;
    if (kind !== "image" && kind !== "file") continue;
    out.push({
      url,
      name: typeof name === "string" ? name.slice(0, 100) : "첨부파일",
      type: typeof type === "string" ? type.slice(0, 100) : "application/octet-stream",
      size: typeof size === "number" && size >= 0 ? Math.round(size) : 0,
      kind,
    });
    if (out.length >= MAX_ATTACHMENTS) break;
  }
  return out;
}
