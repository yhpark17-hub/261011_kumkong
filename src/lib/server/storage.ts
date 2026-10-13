import "server-only";
import { randomBytes } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { join, normalize } from "node:path";
import { serverless } from "./db";

/**
 * 업로드 파일 저장소
 * - 배포(Vercel): Vercel Blob (BLOB_READ_WRITE_TOKEN 또는 BLOB_STORE_ID — Vercel 대시보드에서 Blob 저장소를 연결하면 자동 설정)
 * - 로컬 개발: data/uploads 폴더 → /api/files/… 로 제공
 */

const LOCAL_ROOT = join(process.cwd(), "data", "uploads");

function blobConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);
}

/** 지금 환경에서 업로드를 받을 수 있는지 */
export function storageConfigured(): boolean {
  return blobConfigured() || !serverless();
}

/** 저장 → 공개 주소. name 은 확장자를 정하는 데만 씁니다 (원래 파일명은 주소에 넣지 않음) */
export async function saveFile(folder: "board" | "magazine", ext: string, contentType: string, data: Buffer): Promise<string> {
  const day = new Date(Date.now() + 9 * 3600_000).toISOString().slice(0, 10).replace(/-/g, ""); // 한국 날짜
  const key = `${folder}/${day}/${randomBytes(12).toString("hex")}.${ext}`;
  if (blobConfigured()) {
    const { put } = await import("@vercel/blob");
    const res = await put(key, data, {
      access: "public",
      contentType,
      addRandomSuffix: false,
      cacheControlMaxAge: 60 * 60 * 24 * 365,
    });
    return res.url;
  }
  if (serverless()) throw new Error("파일 저장소가 설정되지 않았어요 (Vercel Blob 연결 필요)");
  const path = join(LOCAL_ROOT, key);
  await mkdir(join(path, ".."), { recursive: true });
  await writeFile(path, data);
  return `/api/files/${key}`;
}

/** 로컬 개발용 파일 읽기 (경로 탈출 방지) */
export async function readLocalFile(key: string): Promise<Buffer | null> {
  const path = normalize(join(LOCAL_ROOT, key));
  if (!path.startsWith(LOCAL_ROOT)) return null;
  try {
    return await readFile(path);
  } catch {
    return null;
  }
}

/** 지운 글의 첨부 정리 (실패해도 무시) */
export async function deleteFiles(urls: string[]): Promise<void> {
  const blobUrls = urls.filter((u) => u.startsWith("https://"));
  const local = urls.filter((u) => u.startsWith("/api/files/"));
  try {
    if (blobUrls.length && blobConfigured()) {
      const { del } = await import("@vercel/blob");
      await del(blobUrls);
    }
    for (const u of local) {
      const path = normalize(join(LOCAL_ROOT, u.slice("/api/files/".length)));
      if (path.startsWith(LOCAL_ROOT)) await unlink(path).catch(() => {});
    }
  } catch (err) {
    console.error("[storage] 삭제 실패", err);
  }
}
