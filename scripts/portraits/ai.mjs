// AI 일러스트 초상 — 운영자가 만든 인물 일러스트(ai/<인물>.webp, 흰 바탕·검은 윤곽선)에서 배경을 떼어 480×560 초상으로
// 사용: node scripts/portraits/ai.mjs [인물…]   (없으면 ai/ 의 전부)
// 결과: src/lib/server/portraits/<인물>.ts (JPEG 그림 + PNG 마스크를 품은 svg) · out/<인물>-ai.png (확인용)
// ai/<인물>.webp 가 있는 인물은 이 그림이 썸네일에 쓰여요 (벡터·사진 칠하기보다 우선)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../..");

/**
 * 인물마다: 이름(문서용)·내보낼 이름·그림 안 아이디·출처 표시
 * credit — 일러스트가 자유 이용 사진을 바탕으로 만든 것이면 그 사진 출처(라이선스가 요구), 바탕 사진을 모르면 빈 값
 */
export const AI = {
  "shin-hyunsong": { who: "신현송 한국은행 총재", exportName: "SHIN_HYUNSONG", id: "shn", credit: "인물 그림 원본 사진: G20 Argentina · CC BY 2.0 · 변형" },
  "kevin-warsh": { who: "케빈 워시 연준 의장", exportName: "KEVIN_WARSH", id: "wsh", credit: "" },
  "lee-jaemyung": { who: "이재명 대통령", exportName: "LEE_JAEMYUNG", id: "ljm", credit: "인물 그림 원본 사진: 대한민국 국회 · 공공누리 제1유형 · 변형" },
  "donald-trump": { who: "도널드 트럼프 미국 대통령", exportName: "DONALD_TRUMP", id: "dtr", credit: "" },
  "lee-hyoungil": { who: "이형일 부총리 겸 재정경제부 장관", exportName: "LEE_HYOUNGIL", id: "lhi", credit: "인물 그림 원본 사진: 대한민국 국회 · 공공누리 제1유형 · 변형" },
  "lee-eogweon": { who: "이억원 금융위원장", exportName: "LEE_EOGWEON", id: "lew", credit: "인물 그림 원본 사진: 대한민국 대통령실 · 공공누리 제1유형 · 변형" },
  "scott-bessent": { who: "스콧 베선트 미국 재무장관", exportName: "SCOTT_BESSENT", id: "sbt", credit: "인물 그림 원본 사진: 미국 재무부 · 퍼블릭 도메인" },
  "sanae-takaichi": { who: "다카이치 사나에", exportName: "SANAE_TAKAICHI", id: "stk", credit: "" },
};

const BW = 720, BH = 840; // 480×560 상자의 1.5배로 넣어요 (썸네일에서 크게 써도 또렷하게)
const FIT_W = 780; // 그림 폭을 상자보다 조금 넓게 — 양쪽 어깨 끝은 상자에서 잘려요

export const hasAI = (name) => fs.existsSync(path.join(HERE, "ai", `${name}.webp`));

async function make(name) {
  const meta = AI[name];
  if (!meta) throw new Error(`${name}: ai.mjs 의 AI 목록에 없어요`);
  const { data, info } = await sharp(path.join(HERE, "ai", `${name}.webp`)).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height, N = W * H;
  const L = new Float32Array(N), white = new Uint8Array(N);
  for (let i = 0; i < N; i++) {
    const r = data[i * 3], g = data[i * 3 + 1], b = data[i * 3 + 2];
    L[i] = 0.299 * r + 0.587 * g + 0.114 * b;
    white[i] = Math.min(r, g, b) > 226 && Math.max(r, g, b) - Math.min(r, g, b) < 22 ? 1 : 0;
  }
  // 배경: 위·왼쪽·오른쪽 가장자리에서 흰색을 따라 번져요 (검은 윤곽선에서 멈춰요).
  // 아래 가장자리는 흰 셔츠와 이어져 있을 수 있어 쓰지 않아요 — 아래 흰 띠는 잘라 내요
  const bg = new Uint8Array(N), stack = [];
  const push = (i) => { if (white[i] && !bg[i]) { bg[i] = 1; stack.push(i); } };
  for (let x = 0; x < W; x++) push(x);
  for (let y = 0; y < H; y++) { push(y * W); push(y * W + W - 1); }
  while (stack.length) {
    const i = stack.pop(), x = i % W, y = (i - x) / W;
    if (x > 0) push(i - 1);
    if (x < W - 1) push(i + 1);
    if (y > 0) push(i - W);
    if (y < H - 1) push(i + W);
  }
  // 아래 자르기: 양쪽 어깨 쪽 세로줄에서 정장(어두운 색)이 끝나는 높이 중 가장 높은 곳
  let cropH = H;
  for (const x of [...Array(Math.floor(W * 0.22)).keys(), ...Array.from({ length: Math.floor(W * 0.22) }, (_, k) => W - 1 - k)]) {
    let last = -1;
    for (let y = H - 1; y > H * 0.6; y--) if (L[y * W + x] < 140) { last = y; break; }
    if (last > 0) cropH = Math.min(cropH, last - 3);
  }
  // 알파: 배경 0, 배경과 맞닿은 밝은 가장자리 화소(윤곽선 바깥 번짐)는 밝을수록 투명하게
  const rgba = Buffer.alloc(W * cropH * 4);
  for (let y = 0; y < cropH; y++)
    for (let x = 0; x < W; x++) {
      const i = y * W + x, o = i * 4;
      let a = bg[i] ? 0 : 1;
      if (!bg[i]) {
        let nearBg = false;
        for (let dy = -2; dy <= 2 && !nearBg; dy++)
          for (let dx = -2; dx <= 2; dx++) {
            const X = x + dx, Y = y + dy;
            if (X >= 0 && Y >= 0 && X < W && Y < H && bg[Y * W + X]) { nearBg = true; break; }
          }
        if (nearBg) a = Math.min(1, Math.max(0, (245 - L[i]) / 150));
      }
      const edge = a < 1 && !bg[i];
      for (let c = 0; c < 3; c++) rgba[o + c] = bg[i] || edge ? 24 : data[i * 3 + c];
      rgba[o + 3] = Math.round(a * 255);
    }
  // 상자(1.5배)에 넣기: 폭 FIT_W, 가운데 맞춤, 아래에 붙여요
  const fh = Math.round((cropH * FIT_W) / W);
  const resized = await sharp(rgba, { raw: { width: W, height: cropH, channels: 4 } }).resize(FIT_W, fh, { kernel: "lanczos3" }).png().toBuffer();
  const vis = Math.min(fh, BH); // 상자보다 길면 위를 잘라요
  const scaled = await sharp(resized).extract({ left: Math.round((FIT_W - BW) / 2), top: fh - vis, width: BW, height: vis }).png().toBuffer();
  const canvas = await sharp({ create: { width: BW, height: BH, channels: 4, background: { r: 24, g: 24, b: 24, alpha: 0 } } })
    .composite([{ input: scaled, left: 0, top: BH - vis }])
    .raw()
    .toBuffer();
  const rgb = Buffer.alloc(BW * BH * 3), mask = Buffer.alloc(BW * BH);
  for (let i = 0; i < BW * BH; i++) {
    for (let c = 0; c < 3; c++) rgb[i * 3 + c] = canvas[i * 4 + 3] ? canvas[i * 4 + c] : 24;
    mask[i] = canvas[i * 4 + 3];
  }
  const jpg = await sharp(rgb, { raw: { width: BW, height: BH, channels: 3 } }).jpeg({ quality: 86, mozjpeg: true }).toBuffer();
  const png = await sharp(mask, { raw: { width: BW, height: BH, channels: 1 } }).png({ compressionLevel: 9 }).toBuffer();
  const id = meta.id;
  const svg =
    `<defs><mask id="${id}-m" maskUnits="userSpaceOnUse" x="0" y="0" width="480" height="560">` +
    `<image width="480" height="560" preserveAspectRatio="none" href="data:image/png;base64,${png.toString("base64")}"/></mask></defs>` +
    `<image width="480" height="560" preserveAspectRatio="none" mask="url(#${id}-m)" href="data:image/jpeg;base64,${jpg.toString("base64")}"/>`;
  const doc = [
    `${meta.who} — AI 일러스트 (480×560)`,
    `운영자가 만든 일러스트 scripts/portraits/ai/${name}.webp 에서 배경을 뗀 것 — 다시 만들려면 node scripts/portraits/ai.mjs ${name}`,
  ];
  const ts =
    `/**\n${doc.map((l) => ` * ${l}`).join("\n")}\n */\n` +
    `export const ${meta.exportName} = {\n  svg: ${JSON.stringify(svg)},\n  credit: ${JSON.stringify(meta.credit)},\n};\n`;
  fs.writeFileSync(path.join(ROOT, "src/lib/server/portraits", `${name}.ts`), ts);

  fs.mkdirSync(path.join(HERE, "out"), { recursive: true });
  const view = Buffer.alloc(BW * BH * 4);
  for (let i = 0; i < BW * BH; i++) {
    for (let c = 0; c < 3; c++) view[i * 4 + c] = rgb[i * 3 + c];
    view[i * 4 + 3] = mask[i];
  }
  const pic = await sharp(view, { raw: { width: BW, height: BH, channels: 4 } }).png().toBuffer();
  await sharp({ create: { width: BW, height: BH, channels: 4, background: "#cfe3f5" } }).composite([{ input: pic }]).png().toFile(path.join(HERE, "out", `${name}-ai.png`));
  console.log(`${name}: jpg ${jpg.length} + mask ${png.length} bytes (아래 ${H - cropH}px 잘라 냄) → src/lib/server/portraits/${name}.ts`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const names = process.argv.slice(2).length ? process.argv.slice(2) : fs.readdirSync(path.join(HERE, "ai")).filter((f) => f.endsWith(".webp")).map((f) => f.replace(/\.webp$/, ""));
  for (const n of names) await make(n);
}
