// 인물 초상 그리기 도구 — 원본 사진 픽셀 좌표로 짠 벡터 일러스트를 480×560 상자에 담아
// src/lib/server/portraits/<인물>.ts 로 쓰고, 확인용 그림 out/<인물>.png 와 사진 겹침 out/<인물>-over.png 를 만들어요.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../..");
const r1 = (n) => Math.round(n * 10) / 10;

/** 머리결 한 가닥 — 2차 곡선 p0→c→p1 을 따라 가운데가 두껍고(최대 w) 양끝이 뾰족한 면 */
export function strand(p0, c, p1, w, fill, op = 1) {
  const N = 14, L = [], R = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N, u = 1 - t;
    const x = u * u * p0[0] + 2 * u * t * c[0] + t * t * p1[0];
    const y = u * u * p0[1] + 2 * u * t * c[1] + t * t * p1[1];
    const dx = 2 * u * (c[0] - p0[0]) + 2 * t * (p1[0] - c[0]);
    const dy = 2 * u * (c[1] - p0[1]) + 2 * t * (p1[1] - c[1]);
    const len = Math.hypot(dx, dy) || 1;
    const h = (w / 2) * Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.15)), 0.8);
    L.push([x - (dy / len) * h, y + (dx / len) * h]);
    R.push([x + (dy / len) * h, y - (dx / len) * h]);
  }
  const pts = L.concat(R.reverse());
  return `<path d="M${pts.map((p) => `${r1(p[0])} ${r1(p[1])}`).join("L")}Z" fill="${fill}"${op < 1 ? ` opacity="${op}"` : ""} stroke="none"/>`;
}

/** 머리 바깥 윤곽 — 점 사이를 바깥쪽(시계 방향 기준 왼쪽)으로 살짝 부풀린 곡선. 점마다 [x, y, 부풀림 비율] */
export function scallop(pts, k = 0.1) {
  let d = "";
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
    const dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy) || 1, b = len * (pts[i][2] ?? k);
    d += `Q${r1((x0 + x1) / 2 + (dy / len) * b)} ${r1((y0 + y1) / 2 - (dx / len) * b)} ${x1} ${y1}`;
  }
  return d;
}

/**
 * 그림을 상자에 담아 모듈로 쓰기
 * crop: [x, y, w] — 원본 사진에서 상자로 옮길 칸 (가로 w 가 480 이 돼요, 세로는 6:7)
 * id: 그림 안 clipPath 이름 앞붙이 (인물마다 달라야 한 썸네일에 같이 써도 안 겹쳐요)
 */
export async function build({ name, exportName, doc, credit, id, crop, body }) {
  const s = 480 / crop[2];
  const svg = (
    `<defs><clipPath id="${id}-box"><rect width="480" height="560"/></clipPath></defs>` +
    `<g clip-path="url(#${id}-box)"><g transform="scale(${s}) translate(${-crop[0]} ${-crop[1]})">${body}</g></g>`
  ).replace(/\n\s*/g, "");
  const ts =
    `/**\n${doc.map((l) => ` * ${l}`).join("\n")}\n */\n` +
    `export const ${exportName} = {\n  svg: ${JSON.stringify(svg)},\n  credit: ${JSON.stringify(credit)},\n};\n`;
  fs.writeFileSync(path.join(ROOT, "src/lib/server/portraits", `${name}.ts`), ts);

  const out = path.join(HERE, "out");
  fs.mkdirSync(out, { recursive: true });
  const solo = `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="560" viewBox="0 0 480 560"><rect width="480" height="560" fill="#cfe3f5"/>${svg}</svg>`;
  await sharp(Buffer.from(solo)).resize(960).png().toFile(path.join(out, `${name}.png`));
  const photo = path.join(HERE, "photos", `${name}.jpg`);
  if (fs.existsSync(photo)) {
    const { width, height } = await sharp(photo).metadata();
    const over = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><g opacity=".5">${body}</g></svg>`;
    const merged = await sharp(photo).composite([{ input: Buffer.from(over) }]).png().toBuffer();
    await sharp(merged).resize(640).png().toFile(path.join(out, `${name}-over.png`));
  }
  console.log(`${name}: ${svg.length} bytes → src/lib/server/portraits/${name}.ts, scripts/portraits/out/${name}.png`);
}
