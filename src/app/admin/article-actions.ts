"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isOwnFileUrl } from "@/lib/attachments";
import {
  DEFAULT_AUTHOR,
  computeReadMinutes,
  isMagazineCategory,
  kstInputToMs,
  parseTags,
  isArticleBadge,
  parseArticleThumb,
  serializeArticleThumb,
} from "@/lib/magazine-meta";
import { db } from "@/lib/server/db";
import { isAdmin } from "@/lib/server/security";

export type ArticleFormState = { ok: boolean; error?: string; savedAt?: number; status?: number; publishedAt?: number | null };

const str = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();

function safeCover(url: string): string | null {
  if (!url) return null;
  if (isOwnFileUrl(url) || /^https:\/\/[^\s"'<>]+$/i.test(url)) return url.slice(0, 500);
  return null;
}

function revalidateMagazine(id?: number) {
  revalidatePath("/magazine");
  if (id) revalidatePath(`/magazine/${id}`);
  revalidatePath("/");
  revalidatePath("/admin/magazine");
}

/** 매거진 글 저장 (새 글이면 만든 뒤 편집 화면으로 이동) */
export async function saveArticle(_prev: ArticleFormState, fd: FormData): Promise<ArticleFormState> {
  if (!(await isAdmin())) return { ok: false, error: "운영자 로그인이 필요해요. 다시 로그인해 주세요." };

  const id = Number(fd.get("id")) || null;
  const category = str(fd, "category");
  const title = str(fd, "title");
  const summary = str(fd, "summary").replace(/\r\n?/g, "\n");
  const body = String(fd.get("body") ?? "").replace(/\r\n?/g, "\n").trimEnd();
  const coverRaw = str(fd, "coverUrl");
  const cover = safeCover(coverRaw);
  const tags = parseTags(str(fd, "tags")).join(",");
  const author = str(fd, "author").slice(0, 30) || DEFAULT_AUTHOR;
  const featured = fd.get("featured") === "on" ? 1 : 0;
  const badgeRaw = str(fd, "badge");
  const badge = isArticleBadge(badgeRaw) ? badgeRaw : "";
  const mode = str(fd, "mode"); // draft | now | schedule
  // 썸네일 설정 (비면 자동)
  const thumb = serializeArticleThumb(
    parseArticleThumb(
      JSON.stringify({
        scene: str(fd, "thumbScene"),
        company: str(fd, "thumbCompany"),
        kicker: str(fd, "thumbKicker"),
        headline: str(fd, "thumbHeadline"),
        sub: str(fd, "thumbSub"),
        layout: str(fd, "thumbLayout"),
        tone: str(fd, "thumbTone"),
      }),
    ),
  );

  if (!isMagazineCategory(category)) return { ok: false, error: "카테고리를 골라 주세요." };
  if (title.length < 2 || title.length > 120) return { ok: false, error: "제목은 2~120자로 적어 주세요." };
  if (summary.length > 600) return { ok: false, error: "요약은 600자 이내로 적어 주세요." };
  if (body.length < 1) return { ok: false, error: "본문이 비어 있어요." };
  if (body.length > 60000) return { ok: false, error: "본문은 6만 자 이내로 적어 주세요." };
  if (coverRaw && !cover) return { ok: false, error: "표지 이미지 주소가 올바르지 않아요 (https 주소만)." };

  const client = await db();
  const now = Date.now();
  const existing = id
    ? (await client.execute({ sql: "SELECT status, published_at FROM articles WHERE id = ?", args: [id] })).rows[0]
    : undefined;
  if (id && !existing) return { ok: false, error: "이미 지워진 글이에요." };

  let status = 0;
  let publishedAt: number | null = null;
  if (mode === "now") {
    status = 1;
    const prevAt = existing?.published_at == null ? null : Number(existing.published_at);
    // 이미 공개된 글을 고칠 때는 처음 발행 시각을 유지
    publishedAt = Number(existing?.status) === 1 && prevAt != null && prevAt <= now ? prevAt : now;
  } else if (mode === "schedule") {
    const at = kstInputToMs(str(fd, "publishAt"));
    if (at == null) return { ok: false, error: "예약 발행 시각을 정해 주세요." };
    status = 1;
    publishedAt = at;
  }

  const readMinutes = computeReadMinutes(body);
  if (id) {
    await client.execute({
      sql: `UPDATE articles SET category = ?, title = ?, summary = ?, cover_url = ?, thumb = ?, body = ?, tags = ?, author = ?,
              read_minutes = ?, featured = ?, badge = ?, status = ?, published_at = ?, updated_at = ? WHERE id = ?`,
      args: [category, title, summary, cover, thumb, body, tags, author, readMinutes, featured, badge, status, publishedAt, now, id],
    });
    revalidateMagazine(id);
    return { ok: true, savedAt: now, status, publishedAt };
  }

  const res = await client.execute({
    sql: `INSERT INTO articles (category, title, summary, cover_url, thumb, body, tags, author, read_minutes, featured, badge, status, source, published_at, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'admin', ?, ?, ?)`,
    args: [category, title, summary, cover, thumb, body, tags, author, readMinutes, featured, badge, status, publishedAt, now, now],
  });
  const newId = Number(res.lastInsertRowid);
  revalidateMagazine(newId);
  redirect(`/admin/magazine/${newId}?saved=1`);
}

/** 글 삭제 (되돌릴 수 없음) */
export async function deleteArticle(fd: FormData): Promise<void> {
  if (!(await isAdmin())) redirect("/admin/login");
  const id = Number(fd.get("id"));
  if (!Number.isInteger(id)) return;
  const client = await db();
  await client.batch(
    [
      { sql: "DELETE FROM article_likes WHERE article_id = ?", args: [id] },
      { sql: "DELETE FROM articles WHERE id = ?", args: [id] },
    ],
    "write",
  );
  revalidateMagazine(id);
  redirect("/admin/magazine?deleted=1");
}

/** 목록에서 바로: 발행 / 임시저장으로 / 추천 토글 */
export async function quickArticleAction(fd: FormData): Promise<void> {
  if (!(await isAdmin())) redirect("/admin/login");
  const [op, raw] = String(fd.get("target") ?? "").split(":");
  const id = Number(raw);
  if (!Number.isInteger(id)) return;
  const client = await db();
  const now = Date.now();
  if (op === "publish") {
    await client.execute({
      sql: "UPDATE articles SET status = 1, published_at = COALESCE(CASE WHEN published_at <= ? THEN published_at END, ?), updated_at = ? WHERE id = ?",
      args: [now, now, now, id],
    });
  } else if (op === "unpublish") {
    await client.execute({ sql: "UPDATE articles SET status = 0, published_at = NULL, updated_at = ? WHERE id = ?", args: [now, id] });
  } else if (op === "feature" || op === "unfeature") {
    await client.execute({ sql: "UPDATE articles SET featured = ? WHERE id = ?", args: [op === "feature" ? 1 : 0, id] });
  }
  revalidateMagazine(id);
}
