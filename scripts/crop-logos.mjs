/**
 * CI 페이지 이미지에서 심볼 부분만 잘라 아바타 로고로 저장 (수동 지정)
 *   node --use-system-ca scripts/crop-logos.mjs
 */
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const MANIFEST = join(ROOT, "src", "data", "logos.json");

/** id: { url, crop: { left, top, width, height }, also: [같은 심볼을 쓰는 기관] } */
const CROPS = {
  ksfc: {
    url: "https://www.ksfc.co.kr:4443/assets/ko/img/about/bg_symbolmark.gif",
    crop: { left: 0, top: 0, width: 266, height: 205 },
  },
  nacf: {
    url: "https://www.nonghyup.com/images/contents/img_010601_1.png",
    crop: { left: 360, top: 25, width: 160, height: 180 },
    also: ["nhlocal", "nhbank"],
  },
};

const manifest = JSON.parse(await readFile(MANIFEST, "utf8"));
for (const [id, { url, crop, also = [] }] of Object.entries(CROPS)) {
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) {
    console.log(`✗ ${id} ${res.status}`);
    continue;
  }
  const buf = Buffer.from(await res.arrayBuffer());
  const meta = await sharp(buf).metadata();
  const box = {
    left: crop.left,
    top: crop.top,
    width: Math.min(crop.width, (meta.width ?? 0) - crop.left),
    height: Math.min(crop.height, (meta.height ?? 0) - crop.top),
  };
  let png = await sharp(buf, { animated: false }).extract(box).png().toBuffer();
  try {
    png = await sharp(png).trim({ threshold: 12 }).png().toBuffer();
  } catch {}
  const out = await sharp(png)
    .resize(128, 128, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toBuffer();
  for (const target of [id, ...also]) {
    await writeFile(join(ROOT, "public", "logos", `${target}.png`), out);
    manifest[target] = `/logos/${target}.png`;
  }
  console.log(`✓ ${id} (${meta.width}x${meta.height} → crop ${box.width}x${box.height})${also.length ? ` +${also.join(",")}` : ""}`);
}
const sorted = Object.fromEntries(Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b)));
await writeFile(MANIFEST, `${JSON.stringify(sorted, null, 2)}\n`);
