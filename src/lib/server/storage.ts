import "server-only";
import { randomBytes } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { join, normalize } from "node:path";
import { serverless } from "./db";

/**
 * 업로드 파일 저장소
 * - 배포(Vercel): Vercel Blob (BLOB_READ_WRITE_TOKEN 또는 BLOB_STORE_ID — Vercel 대시보드에서 Blob 저장소를 연결하면 자동 설정)
 *   · 공개(public) 저장소면 Blob 주소를 그대로 쓰고,
 *   · 비공개(private) 저장소면 /api/files/… 로 우리 서버가 대신 읽어 보여 줍니다 (저장소 설정에 맞춰 자동으로)
 * - 로컬 개발: data/uploads 폴더 → /api/files/… 로 제공
 */

const LOCAL_ROOT = join(process.cwd(), "data", "uploads");

type BlobAccess = "public" | "private";

function blobConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);
}

/** 저장소 공개 여부 — BLOB_ACCESS 로 정할 수 있고, 없으면 처음 올릴 때 저장소 응답을 보고 맞춤 */
let blobAccess: BlobAccess | null = process.env.BLOB_ACCESS === "public" || process.env.BLOB_ACCESS === "private" ? process.env.BLOB_ACCESS : null;

/** '비공개 저장소에 공개로 올릴 수 없어요' 같은 접근 방식 불일치 오류인지 → 맞는 방식 */
function accessFromError(err: unknown): BlobAccess | null {
  const msg = err instanceof Error ? err.message : "";
  if (/private store/i.test(msg)) return "private";
  if (/public store/i.test(msg)) return "public";
  return null;
}

/** 지금 환경에서 업로드를 받을 수 있는지 */
export function storageConfigured(): boolean {
  return blobConfigured() || !serverless();
}

/** 우리 서버가 대신 보여 주는 파일 주소 형식 */
export const FILE_KEY = /^(board|magazine)\/\d{8}\/[a-f0-9]{24}\.[a-z0-9]{1,5}$/;

/** 저장 → 공개 주소. name 은 확장자를 정하는 데만 씁니다 (원래 파일명은 주소에 넣지 않음) */
export async function saveFile(folder: "board" | "magazine", ext: string, contentType: string, data: Buffer): Promise<string> {
  const day = new Date(Date.now() + 9 * 3600_000).toISOString().slice(0, 10).replace(/-/g, ""); // 한국 날짜
  const key = `${folder}/${day}/${randomBytes(12).toString("hex")}.${ext}`;
  if (blobConfigured()) {
    const { put } = await import("@vercel/blob");
    const upload = (access: BlobAccess) =>
      put(key, data, { access, contentType, addRandomSuffix: false, cacheControlMaxAge: 60 * 60 * 24 * 365 });
    let access: BlobAccess = blobAccess ?? "private";
    let res;
    try {
      res = await upload(access);
    } catch (err) {
      const right = accessFromError(err);
      if (!right || right === access) throw err;
      access = right;
      res = await upload(access);
    }
    blobAccess = access;
    return access === "public" ? res.url : `/api/files/${key}`;
  }
  if (serverless()) throw new Error("파일 저장소가 설정되지 않았어요 (Vercel Blob 연결 필요)");
  const path = join(LOCAL_ROOT, key);
  await mkdir(join(path, ".."), { recursive: true });
  await writeFile(path, data);
  return `/api/files/${key}`;
}

/** /api/files/… 로 보여 줄 파일 읽기 — 배포는 비공개 Blob 에서, 로컬은 data/uploads 에서 (경로 탈출 방지) */
export async function readStoredFile(key: string): Promise<ReadableStream<Uint8Array> | Uint8Array<ArrayBuffer> | null> {
  if (!FILE_KEY.test(key)) return null;
  if (blobConfigured()) {
    const { get } = await import("@vercel/blob");
    try {
      const res = await get(key, { access: "private" });
      return res?.statusCode === 200 ? res.stream : null;
    } catch (err) {
      console.error("[storage] 읽기 실패", key, err instanceof Error ? err.message : err);
      return null;
    }
  }
  const path = normalize(join(LOCAL_ROOT, key));
  if (!path.startsWith(LOCAL_ROOT)) return null;
  try {
    return new Uint8Array(await readFile(path));
  } catch {
    return null;
  }
}

/** 지운 글의 첨부 정리 (실패해도 무시) */
export async function deleteFiles(urls: string[]): Promise<void> {
  const blobUrls = urls.filter((u) => u.startsWith("https://"));
  const ours = urls.filter((u) => u.startsWith("/api/files/")).map((u) => u.slice("/api/files/".length));
  try {
    if (blobConfigured()) {
      // 공개 저장소는 Blob 주소, 비공개 저장소는 경로(key)로 지움
      const targets = [...blobUrls, ...ours.filter((k) => FILE_KEY.test(k))];
      if (targets.length) {
        const { del } = await import("@vercel/blob");
        await del(targets);
      }
      return;
    }
    for (const k of ours) {
      const path = normalize(join(LOCAL_ROOT, k));
      if (path.startsWith(LOCAL_ROOT)) await unlink(path).catch(() => {});
    }
  } catch (err) {
    console.error("[storage] 삭제 실패", err);
  }
}
