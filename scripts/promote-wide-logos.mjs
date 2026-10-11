/**
 * 가로형 로고 중 비율이 정사각형에 가까운 것(가로/세로 ≤ 1.9)을 아바타로도 사용
 *   node scripts/promote-wide-logos.mjs
 */
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const MANIFEST = join(ROOT, "src", "data", "logos.json");
const WIDE_MANIFEST = join(ROOT, "src", "data", "logos-wide.json");
const MAX_ASPECT = 1.9;

const manifest = JSON.parse(await readFile(MANIFEST, "utf8"));
const wide = JSON.parse(await readFile(WIDE_MANIFEST, "utf8"));
const promoted = [];
for (const id of Object.keys(wide)) {
  if (manifest[id]) continue;
  const file = join(ROOT, "public", "logos", "wide", `${id}.png`);
  const meta = await sharp(file).metadata();
  const aspect = (meta.width ?? 1) / (meta.height ?? 1);
  if (aspect > MAX_ASPECT) continue;
  await sharp(file)
    .resize(128, 128, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toFile(join(ROOT, "public", "logos", `${id}.png`));
  manifest[id] = `/logos/${id}.png`;
  promoted.push(`${id}(${aspect.toFixed(2)})`);
}
const sorted = Object.fromEntries(Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b)));
await writeFile(MANIFEST, `${JSON.stringify(sorted, null, 2)}\n`);
console.log(`아바타로 추가: ${promoted.length ? promoted.join(", ") : "없음"}`);
