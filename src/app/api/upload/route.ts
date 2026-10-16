import { ALLOWED_TYPES, MAX_UPLOAD_BYTES, extOf, type Attachment } from "@/lib/attachments";
import { db, dbConfigured } from "@/lib/server/db";
import { isAdmin, isBanned, requester } from "@/lib/server/security";
import { saveFile, storageConfigured } from "@/lib/server/storage";

/**
 * 사진·파일 업로드 (콩밭 첨부 / 매거진 이미지)
 * - 확장자 + 파일 앞부분(매직 바이트)으로 실제 형식을 확인
 * - 익명 사용자는 10분에 20개, 하루 60MB 까지
 */

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8" } });

/** 실제 내용이 확장자와 맞는지 */
function matchesSignature(ext: string, b: Buffer): boolean {
  const starts = (...bytes: number[]) => bytes.every((v, i) => b[i] === v);
  switch (ext) {
    case "jpg":
    case "jpeg":
      return starts(0xff, 0xd8, 0xff);
    case "png":
      return starts(0x89, 0x50, 0x4e, 0x47);
    case "gif":
      return b.subarray(0, 4).toString("ascii") === "GIF8";
    case "webp":
      return b.subarray(0, 4).toString("ascii") === "RIFF" && b.subarray(8, 12).toString("ascii") === "WEBP";
    case "pdf":
      return b.subarray(0, 4).toString("ascii") === "%PDF";
    case "hwp":
    case "doc":
    case "xls":
    case "ppt":
      return starts(0xd0, 0xcf, 0x11, 0xe0); // OLE 문서
    case "hwpx":
    case "docx":
    case "xlsx":
    case "pptx":
    case "zip":
      return starts(0x50, 0x4b, 0x03, 0x04);
    case "txt":
      return !b.subarray(0, 4096).includes(0); // 바이너리 아님
    default:
      return false;
  }
}

export async function POST(req: Request) {
  if (!dbConfigured() || !storageConfigured()) return json({ error: "지금은 파일을 올릴 수 없어요." }, 503);

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  const purpose = form?.get("purpose") === "magazine" ? "magazine" : "board";
  if (!(file instanceof File)) return json({ error: "파일이 없어요." }, 400);

  const admin = await isAdmin();
  if (purpose === "magazine" && !admin) return json({ error: "운영자만 올릴 수 있어요." }, 403);

  const ext = extOf(file.name);
  const allowed = ALLOWED_TYPES[ext];
  if (!allowed) return json({ error: "이 형식은 올릴 수 없어요. (사진, PDF, 한글·오피스 문서, zip, txt)" }, 400);
  if (purpose === "magazine" && allowed.kind !== "image") return json({ error: "매거진에는 이미지만 올릴 수 있어요." }, 400);
  if (file.size > MAX_UPLOAD_BYTES) return json({ error: "파일 하나는 4MB까지 올릴 수 있어요." }, 400);

  const data = Buffer.from(await file.arrayBuffer());
  if (!matchesSignature(ext, data)) return json({ error: "파일 내용이 확장자와 맞지 않아요." }, 400);

  const who = await requester();
  const client = await db();
  if (!admin) {
    if (await isBanned(who.hash)) return json({ error: "업로드가 제한되었어요." }, 403);
    const now = Date.now();
    const usage = await client.execute({
      sql: `SELECT (SELECT COUNT(*) FROM uploads WHERE ip_hash = ? AND at > ?) AS recent,
                   (SELECT COALESCE(SUM(size), 0) FROM uploads WHERE ip_hash = ? AND at > ?) AS today`,
      args: [who.hash, now - 10 * 60 * 1000, who.hash, now - 24 * 60 * 60 * 1000],
    });
    if (Number(usage.rows[0]?.recent ?? 0) >= 20) return json({ error: "잠시 후 다시 올려 주세요. (10분에 20개까지)" }, 429);
    if (Number(usage.rows[0]?.today ?? 0) + data.length > 60 * 1024 * 1024) return json({ error: "오늘 올릴 수 있는 용량(60MB)을 넘었어요." }, 429);
  }

  try {
    const url = await saveFile(purpose, ext === "jpeg" ? "jpg" : ext, allowed.mime, data);
    await client.execute({
      sql: "INSERT INTO uploads (ip_hash, url, size, purpose, at) VALUES (?, ?, ?, ?, ?)",
      args: [who.hash, url, data.length, purpose, Date.now()],
    });
    const result: Attachment = {
      url,
      name: file.name.replace(/[\\/:*?"<>|]/g, "_").slice(0, 100),
      type: allowed.mime,
      size: data.length,
      kind: allowed.kind,
    };
    return json(result);
  } catch (err) {
    console.error("[upload]", err);
    // 운영자에게는 원인을 함께 보여 줘서 저장소 설정 문제를 바로 알 수 있게
    const detail = admin && err instanceof Error ? err.message.slice(0, 300) : undefined;
    return json({ error: "저장하지 못했어요. 잠시 뒤 다시 시도해 주세요.", ...(detail ? { detail } : {}) }, 500);
  }
}
