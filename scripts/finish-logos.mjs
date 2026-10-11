/**
 * 자동 수집으로 아바타를 못 만든 기관의 로고를 수동 지정으로 마무리
 *
 *   node scripts/finish-logos.mjs --src <원본 이미지 폴더>
 *
 * - from: "wide"  → 이미 받은 가로형 로고(public/logos/wide/{id}.png)에서 생성
 * - from: "file"  → --src 폴더의 원본 파일 (공식 도메인에서 내려받은 CI 이미지)
 * - crop          → 심볼 부분만 잘라낼 영역 (원본 픽셀 기준)
 * - clean         → CI 페이지의 회색 격자·흰 배경을 투명하게
 */
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const MANIFEST = join(ROOT, "src", "data", "logos.json");
const WIDE_MANIFEST = join(ROOT, "src", "data", "logos-wide.json");
const srcIdx = process.argv.indexOf("--src");
const SRC_DIR = srcIdx >= 0 ? process.argv[srcIdx + 1] : null;

const SPECS = {
  // 글자 자체가 심볼인 로고 — 가로형 전체 사용
  krx: { from: "wide" },
  knbank: { from: "wide" },
  imbank: { from: "wide" },
  haewoon: { from: "wide" },
  koreg: { from: "wide" },
  ex: { from: "wide" },
  lx: { from: "wide" },
  sema: { from: "wide", clean: true },
  icfc: { from: "wide", clean: true },
  koen: { from: "wide", clean: true },
  kwater: { from: "wide", clean: true },
  // 로고 안의 심볼만 잘라냄
  // 삼각 심볼 왼쪽 아래에 걸친 '회' 글자 영역은 지움
  kofia: {
    from: "wide",
    crop: { left: 272, top: 0, width: 84, height: 85 },
    erase: [{ left: 0, top: 57, width: 47, height: 28 }],
    clean: true,
  },
  kosmes: { from: "wide", crop: { left: 88, top: 0, width: 99, height: 99 } },
  geps: { from: "wide", crop: { left: 0, top: 0, width: 44, height: 46 } },
  // 공식 CI 원본 파일
  kftc: { from: "file", file: "kftc-raw.png" },
  wooricap: { from: "file", file: "wooricap-raw.png", crop: { left: 110, top: 1402, width: 528, height: 528 } },
  nfcf: { from: "file", file: "nfcf-raw.jpg", crop: { left: 30, top: 40, width: 205, height: 135 }, clean: true },
  kic: { from: "file", file: "kic-navy.png", crop: { left: 0, top: 0, width: 660, height: 280 }, wideFile: "kic-navy.png" },
};

/** 밝고 채도가 낮은 픽셀(흰 배경·회색 격자)을 투명하게 */
async function cleanBackground(png) {
  const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    if (min >= 200 && max - min <= 28) data[i + 3] = 0;
  }
  return sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer();
}

/** 지정한 사각 영역을 투명하게 (심볼 옆에 붙은 글자 제거용) */
async function eraseAreas(png, areas) {
  const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (const a of areas) {
    for (let y = a.top; y < Math.min(info.height, a.top + a.height); y++) {
      for (let x = a.left; x < Math.min(info.width, a.left + a.width); x++) {
        data[(y * info.width + x) * 4 + 3] = 0;
      }
    }
  }
  return sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer();
}

const manifest = JSON.parse(await readFile(MANIFEST, "utf8"));
const wideManifest = JSON.parse(await readFile(WIDE_MANIFEST, "utf8"));

for (const [id, spec] of Object.entries(SPECS)) {
  try {
    const input =
      spec.from === "wide"
        ? join(ROOT, "public", "logos", "wide", `${id}.png`)
        : SRC_DIR
          ? join(SRC_DIR, spec.file)
          : null;
    if (!input) {
      console.log(`- ${id}: --src 폴더 필요`);
      continue;
    }
    let png = await sharp(input, { animated: false }).png().toBuffer();
    if (spec.crop) png = await sharp(png).extract(spec.crop).png().toBuffer();
    if (spec.erase) png = await eraseAreas(png, spec.erase);
    if (spec.clean) png = await cleanBackground(png);
    try {
      png = await sharp(png).trim({ threshold: 10 }).png().toBuffer();
    } catch {}
    await sharp(png)
      .resize(128, 128, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png({ compressionLevel: 9 })
      .toFile(join(ROOT, "public", "logos", `${id}.png`));
    manifest[id] = `/logos/${id}.png`;

    if (spec.wideFile && SRC_DIR) {
      let wide = await sharp(join(SRC_DIR, spec.wideFile)).png().toBuffer();
      try {
        wide = await sharp(wide).trim({ threshold: 10 }).png().toBuffer();
      } catch {}
      await sharp(wide)
        .resize(480, 120, { fit: "inside", withoutEnlargement: true })
        .png({ compressionLevel: 9 })
        .toFile(join(ROOT, "public", "logos", "wide", `${id}.png`));
      wideManifest[id] = `/logos/wide/${id}.png`;
    }
    console.log(`✓ ${id}`);
  } catch (e) {
    console.log(`✗ ${id}: ${e.message}`);
  }
}

const sortObj = (o) => Object.fromEntries(Object.entries(o).sort(([a], [b]) => a.localeCompare(b)));
await writeFile(MANIFEST, `${JSON.stringify(sortObj(manifest), null, 2)}\n`);
await writeFile(WIDE_MANIFEST, `${JSON.stringify(sortObj(wideManifest), null, 2)}\n`);
