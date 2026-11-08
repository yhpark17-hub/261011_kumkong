import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * 브리핑 그림 그리기 — 영상(industry-tube)·아침판 그림 이야기와 같은 그림체 (Gemini + 그림체 견본 style-ref.jpg).
 * 키는 Vercel 환경 변수 GEMINI_API_KEY 에서만 읽어요 (출력·저장하지 않음). 없으면 artConfigured() 가 false.
 */

const MODEL = "gemini-3.1-flash-image";

const PREFIX =
  "Soft pastel storybook illustration for a friendly finance news site, 16:9 widescreen. Bright, airy daylight. " +
  "Periwinkle blue (#a3baf6) and lavender-pink (#f0e0fa) pastel tones, soft lilac and cream surfaces, muted green plants, " +
  "and one warm orange accent (#f7a14a) on the single most important object. Flat-shaded simplified shapes with thin dark navy " +
  "outlines and a subtle colored-pencil grain. Cute chibi people with big round heads, small bodies, simple dot eyes, rosy cheeks, " +
  "friendly expressions. Cheerful, calm and curious mood. Never dark, never gloomy.";

/** 썸네일 바탕 — 왼쪽 절반은 글씨 자리 */
const LEFT_EMPTY =
  "COMPOSITION RULE: one single continuous scene, never split into panels, boxes or seams. The left half is open soft pastel sky " +
  "(or a plain soft wall) with a few fluffy clouds and only small distant shapes low near the bottom, calm and uncluttered, because big " +
  "title text goes there. Everything important sits in the right half, large and clearly readable even as a small picture: the main " +
  "characters are about two thirds of the frame height.";

const FULL = "The main subject is large and clearly readable even as a small picture: medium shot, it fills most of the frame.";

const REF_NOTE =
  "Match the colour palette, line work, chibi character design, colored-pencil texture, brightness and level of detail of the attached " +
  "reference image exactly. Only the subject matter changes: do not copy the reference's composition, harbour, ships, cranes, containers " +
  "or hard hats, and do not add the three workers from the reference. Draw only what this scene describes.";

const NO_TEXT =
  "No text, no letters, no numbers, no digits, no logos, no flags, no watermark, no signature. Screens, papers and signs show only simple " +
  "shapes, lines and arrows. Not photorealistic, no real people, no recognizable public figures.";

const ID_TEXT =
  "Draw clearly and correctly only the national flag(s) and the exact short English word(s) that this scene explicitly names, because they tell " +
  "readers what the news is about; do not add any flag or word the scene does not name. Apart from that: no other text, no other letters, no " +
  "numbers, no digits, no logos, no watermark, no signature. Screens, papers " +
  "and signs show only simple shapes, lines and arrows. Not photorealistic, no real people, no recognizable public figures.";

export const artConfigured = () => Boolean(process.env.GEMINI_API_KEY?.trim());

let ref: string | null = null;
async function styleRef() {
  ref ??= (await readFile(join(process.cwd(), "src", "lib", "server", "art", "style-ref.jpg"))).toString("base64");
  return ref;
}

/**
 * 장면 설명(영어 권장) → PNG. layout "thumb" = 왼쪽 절반 비운 썸네일 바탕, "full" = 꽉 찬 그림.
 * id = 장면에 적은 국기·짧은 영어 낱말(예: KOSPI)만 그려도 됨.
 */
export async function generateArt(scene: string, { layout = "thumb", id = false }: { layout?: "thumb" | "full"; id?: boolean } = {}): Promise<Buffer> {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) throw new Error("GEMINI_API_KEY 가 없어요");
  const text = [PREFIX, layout === "thumb" ? LEFT_EMPTY : FULL, REF_NOTE, scene, id ? ID_TEXT : NO_TEXT].join("\n\n");
  const body = JSON.stringify({
    contents: [{ parts: [{ text }, { inline_data: { mime_type: "image/jpeg", data: await styleRef() } }] }],
    generationConfig: { responseModalities: ["IMAGE"], imageConfig: { aspectRatio: "16:9" } },
  });
  let last = "";
  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
      method: "POST",
      headers: { "x-goog-api-key": key, "Content-Type": "application/json" },
      body,
      signal: AbortSignal.timeout(100_000),
    }).catch((e: unknown) => {
      last = e instanceof Error ? e.message : String(e);
      return null;
    });
    if (res?.ok) {
      const data = (await res.json()) as { candidates?: { content?: { parts?: { inlineData?: { data?: string }; inline_data?: { data?: string } }[] } }[] };
      for (const c of data.candidates ?? [])
        for (const part of c.content?.parts ?? []) {
          const d = part.inlineData?.data ?? part.inline_data?.data;
          if (d) return Buffer.from(d, "base64");
        }
      last = "그림이 오지 않았어요 (안전 필터·장면 설명을 확인해 주세요)";
    } else if (res) last = `Gemini ${res.status}`;
  }
  throw new Error(last || "그림 그리기 실패");
}
