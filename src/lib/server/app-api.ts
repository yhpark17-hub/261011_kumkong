import "server-only";
import { createHash } from "node:crypto";
import { SITE } from "../site";

/**
 * 금콩 앱(mobile/)용 API 공통 — /api/app/v1/* 에서 씁니다.
 * 앱은 계정이 없고 읽기 전용 공개 데이터만 받으므로 CORS를 열어 둡니다 (웹 미리보기용).
 */
export const APP_API_HEADERS = {
  "Access-Control-Allow-Origin": "*",
} as const;

/** 사이트 안 경로(/logos/x.png)를 앱이 바로 쓸 수 있는 절대 주소로 */
export function absUrl(path: string | undefined): string | undefined {
  if (!path) return undefined;
  return /^https?:\/\//.test(path) ? path : `${SITE.url}${path.startsWith("/") ? path : `/${path}`}`;
}

/** 응답 내용이 바뀌었는지 앱이 비교할 짧은 버전 값 */
export function contentVersion(data: unknown): string {
  return createHash("sha256").update(JSON.stringify(data)).digest("hex").slice(0, 12);
}

export function appJson(data: unknown, init?: { status?: number; headers?: Record<string, string> }): Response {
  return Response.json(data, { status: init?.status, headers: { ...APP_API_HEADERS, ...init?.headers } });
}
