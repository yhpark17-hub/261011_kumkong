import "server-only";
import { createHash } from "node:crypto";

/**
 * 글쓴이 열쇠 — 저장된 IP 해시를 한 번 더 해시한 12자. 앱의 '이 사용자 차단'이 같은 사람의 글·댓글·후기·톡을 함께 가려요.
 * 이것으로 IP는 알 수 없어요. 운영자 글이나 IP 해시가 없는 예전 글은 "" (차단 대상 아님).
 */
export function authorKey(ipHash: unknown, isAdmin = false): string {
  if (isAdmin || typeof ipHash !== "string" || !ipHash) return "";
  return createHash("sha256").update(`kk-author:${ipHash}`).digest("hex").slice(0, 12);
}
