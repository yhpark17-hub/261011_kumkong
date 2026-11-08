import "server-only";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { isArtPath, parseBadge, type StoryBadge } from "@/lib/news-meta";

type Raw = Record<string, unknown>;

/** 숫자 — 쉼표·소수점 포함 (예: 16만5000 의 16, 5000 / 11.71). 한 자리 수는 빼요 (3연임·2명 같은 말) */
const nums = (t: string) => t.match(/\d[\d,.]*\d/g) ?? [];
const visible = (t: string) => [...t.replace(/\*/g, "").replace(/\s+\/\s+/g, " ").replace(/\s+/g, " ").trim()].length;
const str = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "");

/**
 * 아침판 '그림 이야기'(story) 검사 — 자동 점검이 보낸 story 를 기사 번호(item: 0부터)로 받아,
 * 저장한 뒤 기사 id 로 바꿔 끼울 수 있게 만들어 줘요.
 * - 그림: 그림 그리기 API(/api/automation/art)가 돌려준 주소(또는 /magazine/brief/…)만
 * - 숫자: 썸네일 글(tag·hook)·다리 글·맺음 줄·지수 표시의 숫자는 오늘 기사 글(corpus)에 그대로 있어야 해요
 * - 로고: public/logos 에 있는 파일만
 */
export function checkStory(raw: unknown, articles: { cards: unknown[] }[], corpus: string): { errors: string[]; build: (ids: number[]) => Raw } {
  const errors: string[] = [];
  const o = (raw && typeof raw === "object" ? raw : {}) as Raw;
  const noFake = (where: string, text: string) => {
    const bad = nums(text).filter((n) => !corpus.includes(n));
    if (bad.length) errors.push(`${where}: 숫자 ${bad.join(", ")} 이(가) 오늘 기사 글에 없어요 (지어낸 숫자 방지)`);
  };

  if (!isArtPath(o.hero)) errors.push("story.hero: 썸네일 바탕 그림 주소가 필요해요 (api.mjs art 가 돌려준 url, layout thumb)");
  const tag = str(o.tag, 40);
  if (tag && visible(tag) > 16) errors.push(`story.tag: 주황 이름표는 16자 안이에요 (지금 ${visible(tag)}자)`);
  noFake("story.tag", tag);
  const hook = str(o.hook, 80);
  if (!hook) errors.push("story.hook: 썸네일 큰 글(두 줄, ' / '로 나눔)이 필요해요");
  else {
    if (visible(hook) > 26) errors.push(`story.hook: 썸네일 큰 글은 26자 안이에요 (지금 ${visible(hook)}자)`);
    if (hook.split(/\s+\/\s+/).length > 2) errors.push("story.hook: 두 줄까지예요 (' / ' 한 번)");
    noFake("story.hook", hook);
  }
  if (o.pointArt !== undefined && o.pointArt !== "" && !isArtPath(o.pointArt)) errors.push("story.pointArt: 그림 주소가 올바르지 않아요");

  const items = (Array.isArray(o.items) ? o.items : []) as Raw[];
  if (items.length !== articles.length) errors.push(`story.items: 기사마다 하나씩이에요 (기사 ${articles.length}건, 지금 ${items.length}개)`);
  const seen = new Set<number>();
  items.forEach((x, i) => {
    const at = `story.items[${i}]`;
    const n = Number(x?.item);
    if (!Number.isInteger(n) || n < 0 || n >= articles.length) errors.push(`${at}.item: 기사 번호(items 배열의 0부터 순서)가 필요해요`);
    else if (seen.has(n)) errors.push(`${at}.item: 기사 ${n} 이 두 번 나와요`);
    else seen.add(n);
    if (!isArtPath(x?.art)) errors.push(`${at}.art: 표지 그림 주소가 필요해요`);
    const cards = Array.isArray(x?.cards) ? x.cards : [];
    const deck = Number.isInteger(n) ? (articles[n]?.cards.length ?? 0) : 0;
    if (cards.length > deck) errors.push(`${at}.cards: 그 기사 카드(${deck}장)보다 그림이 많아요 — 카드 순서대로, 그림 없는 장은 ""`);
    cards.forEach((c, k) => {
      if (c !== "" && !isArtPath(c)) errors.push(`${at}.cards[${k}]: 그림 주소가 올바르지 않아요 (없으면 "")`);
    });
    const badgeLists: unknown[][] = [Array.isArray(x?.badges) ? x.badges : [], ...(Array.isArray(x?.cardBadges) ? x.cardBadges : []).map((l) => (Array.isArray(l) ? l : []))];
    badgeLists.flat().forEach((b) => {
      const p = parseBadge(b);
      if (!p) return errors.push(`${at}: 표시(badge) 모양이 올바르지 않아요 — flag(us·jp·cn·eu)·ticker·logo·logos·note`);
      const srcs = p.kind === "logo" ? [p.src] : p.kind === "logos" ? p.srcs : [];
      for (const src of srcs) if (!existsSync(join(process.cwd(), "public", src))) errors.push(`${at}: 로고 ${src} 가 없어요 (public/logos 목록에서)`);
      if (p.kind === "ticker") noFake(`${at} ticker`, p.value);
      if (p.kind === "note") noFake(`${at} note`, p.label);
    });
    const br = x?.bridge && typeof x.bridge === "object" ? (x.bridge as Raw) : null;
    if (br) {
      if (!str(br.label, 60) || !str(br.text, 400)) errors.push(`${at}.bridge: label('A → B')과 text(한두 문장)를 함께 써 주세요 (마지막 기사는 null)`);
      else if (str(br.label, 60).length > 40 || str(br.text, 400).length > 300) errors.push(`${at}.bridge: label 40자·text 300자 안`);
      noFake(`${at}.bridge`, `${str(br.label, 60)} ${str(br.text, 400)}`);
    }
  });
  const recap = (Array.isArray(o.recap) ? o.recap : []).map((r) => str(r, 120));
  recap.forEach((r, i) => {
    if (r.length > 80) errors.push(`story.recap[${i}]: 80자 안`);
    noFake(`story.recap[${i}]`, r);
  });

  const build = (ids: number[]): Raw => ({
    hero: o.hero,
    hook,
    tag,
    hookPos: "top",
    pointArt: isArtPath(o.pointArt) ? o.pointArt : "",
    recap,
    items: [...items]
      .sort((a, b) => Number(a.item) - Number(b.item))
      .map((x) => ({
        id: ids[Number(x.item)],
        art: x.art,
        cards: Array.isArray(x.cards) ? x.cards : [],
        bridge: x.bridge ?? null,
        badges: (Array.isArray(x.badges) ? x.badges : []).map(parseBadge).filter((b): b is StoryBadge => b !== null),
        cardBadges: Array.isArray(x.cardBadges) ? x.cardBadges : [],
      })),
  });
  return { errors, build };
}
