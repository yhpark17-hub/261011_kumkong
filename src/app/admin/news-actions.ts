"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isOwnFileUrl } from "@/lib/attachments";
import { isDateKey, isEdition, isNewsSection, isNewsTier, kindOf } from "@/lib/news-meta";
import { db } from "@/lib/server/db";
import { isAdmin } from "@/lib/server/security";

export type NewsFormState = { ok: boolean; error?: string; savedAt?: number };

const str = (fd: FormData, key: string, max: number) => String(fd.get(key) ?? "").replace(/\r\n?/g, "\n").trim().slice(0, max);

function revalidateNews(id?: number) {
  revalidatePath("/magazine");
  revalidatePath("/magazine/archive");
  revalidatePath("/magazine/letter/[date]", "page");
  if (id) revalidatePath(`/magazine/news/${id}`);
  revalidatePath("/");
  revalidatePath("/admin/news");
}

/** 뉴스 한 건 저장 (새로 쓰면 목록으로 이동) */
export async function saveNews(_prev: NewsFormState, fd: FormData): Promise<NewsFormState> {
  if (!(await isAdmin())) return { ok: false, error: "운영자 로그인이 필요해요." };
  const id = Number(fd.get("id")) || null;
  const editionDate = str(fd, "editionDate", 10);
  const section = str(fd, "section", 20);
  const edition = str(fd, "edition", 10);
  const title = str(fd, "title", 140);
  const summary = str(fd, "summary", 1500);
  const point = str(fd, "point", 600);
  const body = str(fd, "body", 8000);
  const sourceName = str(fd, "sourceName", 60);
  const sourceUrlRaw = str(fd, "sourceUrl", 500);
  const imageRaw = str(fd, "imageUrl", 500);
  const imageCredit = str(fd, "imageCredit", 80);
  const tierRaw = str(fd, "tier", 10);
  const tier = isNewsTier(tierRaw) ? tierRaw : "key";
  const position = Math.max(0, Math.min(99, Math.round(Number(fd.get("position")) || 0)));
  const takeaway = str(fd, "takeaway", 160);
  const headlineAsked = fd.get("headline") === "on";
  const publish = fd.get("status") === "1";

  if (!isDateKey(editionDate)) return { ok: false, error: "브리핑 날짜를 골라 주세요." };
  if (!isNewsSection(section)) return { ok: false, error: "카테고리를 골라 주세요." };
  if (!isEdition(edition)) return { ok: false, error: "아침판·점심판을 골라 주세요." };
  const kind = kindOf(section);
  // 헤드라인은 뉴스만
  const headline = headlineAsked && kind === "news" ? 1 : 0;
  if (title.length < (kind === "term" ? 2 : 4)) return { ok: false, error: kind === "term" ? "용어를 적어 주세요." : kind === "question" ? "질문을 적어 주세요." : "제목을 적어 주세요." };
  if (summary.length < 20) return { ok: false, error: kind === "term" ? "뜻 풀이를 20자 이상 적어 주세요." : "요약을 20자 이상 적어 주세요." };
  const sourceUrl = sourceUrlRaw ? (/^https?:\/\//i.test(sourceUrlRaw) ? sourceUrlRaw : `https://${sourceUrlRaw}`) : null;
  // 사진은 여기서 올린 파일만 (다른 사이트 사진 주소를 붙여 쓰지 못하게 — 저작권)
  if (imageRaw && !isOwnFileUrl(imageRaw)) return { ok: false, error: "사진은 이 화면에서 직접 올린 파일만 쓸 수 있어요." };
  const imageUrl = imageRaw || null;
  if (sourceUrl && !/^https?:\/\/[^\s/]+\.\S+$/i.test(sourceUrl)) return { ok: false, error: "출처 링크를 확인해 주세요." };

  const client = await db();
  const now = Date.now();
  // 헤드라인은 날짜마다 하나만
  if (headline) await client.execute({ sql: "UPDATE news SET headline = 0 WHERE edition_date = ? AND id != ?", args: [editionDate, id ?? 0] });

  if (id) {
    const prev = (await client.execute({ sql: "SELECT status, published_at FROM news WHERE id = ?", args: [id] })).rows[0];
    if (!prev) return { ok: false, error: "이미 지워진 뉴스예요." };
    const publishedAt = publish ? (Number(prev.status) === 1 && prev.published_at != null ? Number(prev.published_at) : now) : null;
    await client.execute({
      sql: `UPDATE news SET edition_date = ?, edition = ?, section = ?, title = ?, summary = ?, point = ?, body = ?, source_name = ?, source_url = ?,
              image_url = ?, image_credit = ?, tier = ?, position = ?, takeaway = ?, headline = ?, status = ?, published_at = ?, updated_at = ? WHERE id = ?`,
      args: [editionDate, edition, section, title, summary, point, body, sourceName, sourceUrl, imageUrl, imageCredit, tier, position, takeaway, headline, publish ? 1 : 0, publishedAt, now, id],
    });
    revalidateNews(id);
    return { ok: true, savedAt: now };
  }

  await client.execute({
    sql: `INSERT INTO news (edition_date, edition, section, title, summary, point, body, source_name, source_url, image_url, image_credit, tier, position, takeaway, headline, status, origin, published_at, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'admin', ?, ?, ?)`,
    args: [editionDate, edition, section, title, summary, point, body, sourceName, sourceUrl, imageUrl, imageCredit, tier, position, takeaway, headline, publish ? 1 : 0, publish ? now : null, now, now],
  });
  revalidateNews();
  redirect(`/admin/news?date=${editionDate}`);
}

/**
 * 목록에서 조치: target="publish:3" 같은 한 건, 또는 bulk="publish" + ids 여러 건
 * op: publish · unpublish · headline · delete
 */
export async function newsAction(fd: FormData): Promise<void> {
  if (!(await isAdmin())) redirect("/admin/login");
  const target = String(fd.get("target") ?? "");
  const bulk = String(fd.get("bulk") ?? "");
  const [op, ids] = target
    ? [target.split(":")[0], [Number(target.split(":")[1])]]
    : [bulk, fd.getAll("ids").map(Number)];
  const list = ids.filter((n) => Number.isInteger(n) && n > 0).slice(0, 200);
  if (!list.length) return;
  const client = await db();
  const now = Date.now();
  const inList = `(${list.map(() => "?").join(",")})`;
  if (op === "publish") {
    await client.execute({ sql: `UPDATE news SET status = 1, published_at = COALESCE(published_at, ?), updated_at = ? WHERE id IN ${inList}`, args: [now, now, ...list] });
  } else if (op === "unpublish") {
    await client.execute({ sql: `UPDATE news SET status = 0, published_at = NULL, updated_at = ? WHERE id IN ${inList}`, args: [now, ...list] });
  } else if (op === "delete") {
    await client.execute({ sql: `DELETE FROM news WHERE id IN ${inList}`, args: list });
  } else if (op === "headline") {
    const row = (await client.execute({ sql: "SELECT edition_date, section FROM news WHERE id = ?", args: [list[0]] })).rows[0];
    // 헤드라인은 뉴스만 (용어·면접 질문 제외)
    if (row && isNewsSection(row.section) && kindOf(row.section) === "news") {
      await client.batch(
        [
          { sql: "UPDATE news SET headline = 0 WHERE edition_date = ?", args: [String(row.edition_date)] },
          { sql: "UPDATE news SET headline = 1 WHERE id = ?", args: [list[0]] },
        ],
        "write",
      );
    }
  }
  revalidateNews();
}
