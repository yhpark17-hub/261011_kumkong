import "server-only";
import { createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";
import { connection } from "next/server";
import { db } from "./db";

/* ------------------------------------------------------------------ */
/* IP — 원본은 저장하지 않고 해시와 앞 두 자리만 보관합니다.              */
/* ------------------------------------------------------------------ */

export async function clientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || h.get("x-real-ip") || "0.0.0.0";
}

export function ipHash(ip: string): string {
  const salt = process.env.IP_SALT ?? "kumkong-dev-salt";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32);
}

/** 디시처럼 IP 앞 두 자리만 표시 (예: 118.235) */
export function ipPrefix(ip: string): string {
  const v4 = ip.replace(/^::ffff:/, "");
  if (/^\d+\.\d+\.\d+\.\d+$/.test(v4)) return v4.split(".").slice(0, 2).join(".");
  if (ip === "::1") return "127.0";
  return ip.split(":").slice(0, 2).join(":") || "0.0";
}

export async function requester() {
  const ip = await clientIp();
  return { hash: ipHash(ip), prefix: ipPrefix(ip) };
}

/* ------------------------------------------------------------------ */
/* 글 비밀번호 (수정·삭제용)                                              */
/* ------------------------------------------------------------------ */

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 32).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string | null): boolean {
  if (!stored) return false;
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 32);
  const expected = Buffer.from(hash, "hex");
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

/* ------------------------------------------------------------------ */
/* 운영자 세션 — ADMIN_PASSWORD 로 로그인, ADMIN_SECRET 으로 서명한 쿠키   */
/* ------------------------------------------------------------------ */

const ADMIN_COOKIE = "kk_admin";
const ADMIN_TTL_MS = 1000 * 60 * 60 * 24 * 7;

function sign(value: string): string | null {
  const secret = process.env.ADMIN_SECRET;
  if (!secret || secret.length < 16) return null;
  return createHmac("sha256", secret).update(value).digest("hex");
}

export function adminEnabled(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD && process.env.ADMIN_SECRET);
}

export function checkAdminPassword(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  const a = createHash("sha256").update(input).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

export async function startAdminSession() {
  const exp = String(Date.now() + ADMIN_TTL_MS);
  const sig = sign(exp);
  if (!sig) throw new Error("ADMIN_SECRET 이 설정되지 않았습니다.");
  (await cookies()).set(ADMIN_COOKIE, `${exp}.${sig}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_TTL_MS / 1000,
  });
}

export async function endAdminSession() {
  (await cookies()).delete(ADMIN_COOKIE);
}

export async function isAdmin(): Promise<boolean> {
  const raw = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!raw) return false;
  const [exp, sig] = raw.split(".");
  const expected = exp ? sign(exp) : null;
  if (!expected || !sig || sig.length !== expected.length) return false;
  if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return false;
  await connection(); // 현재 시각 비교는 요청 시점에만
  return Number(exp) > Date.now();
}

/* ------------------------------------------------------------------ */
/* 필기 후기 투표자 식별 (브라우저별 무작위 토큰)                           */
/* ------------------------------------------------------------------ */

const VOTER_COOKIE = "kk_voter";

export async function voterToken(create: boolean): Promise<string | null> {
  const store = await cookies();
  const existing = store.get(VOTER_COOKIE)?.value;
  if (existing && /^[a-f0-9]{32}$/.test(existing)) return existing;
  if (!create) return null;
  const token = randomBytes(16).toString("hex");
  store.set(VOTER_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return token;
}

/* ------------------------------------------------------------------ */
/* 도배 방지 · 금칙어                                                     */
/* ------------------------------------------------------------------ */

/** 같은 IP 가 같은 행동을 cooldownSec 안에 반복하면 false */
export async function rateLimit(action: string, ipHashValue: string, cooldownSec: number): Promise<boolean> {
  const client = await db();
  const key = `${action}:${ipHashValue}`;
  const now = Date.now();
  const row = await client.execute({ sql: "SELECT at FROM rate_limits WHERE key = ?", args: [key] });
  const last = row.rows[0]?.at as number | undefined;
  if (last && now - last < cooldownSec * 1000) return false;
  await client.execute({
    sql: "INSERT INTO rate_limits (key, at) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET at = excluded.at",
    args: [key, now],
  });
  return true;
}

const BANNED = ["시발", "씨발", "ㅅㅂ", "병신", "ㅂㅅ", "좆", "개새끼", "느금", "니애미", "니미", "섹스", "토토", "카지노", "바카라"];
const RESERVED_NICK = /운영자|관리자|금콩|admin|운영진/i;

export function containsBanned(text: string): boolean {
  const compact = text.replace(/\s+/g, "");
  return BANNED.some((w) => compact.includes(w));
}

export function tooManyLinks(text: string): boolean {
  return (text.match(/https?:\/\//gi) ?? []).length > 2;
}

export function isReservedNickname(nickname: string): boolean {
  return RESERVED_NICK.test(nickname.replace(/\s+/g, ""));
}

export const LIMITS = {
  title: 80,
  body: 5000,
  /** 운영자 가이드 글은 길어질 수 있어 따로 둡니다 */
  adminBody: 20000,
  comment: 500,
  nickname: 12,
  oneLiner: 60,
  detail: 800,
} as const;

/** 신고가 이 수 이상이면 자동으로 숨김 (운영자 검토 대기) */
export const AUTO_HIDE_REPORTS = 5;
