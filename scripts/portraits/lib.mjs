// 인물 초상 그리기 도구 — 원본 사진 픽셀 좌표로 짠 벡터 일러스트를 480×560 상자에 담아
// src/lib/server/portraits/<인물>.ts 로 쓰고, 확인용 그림 out/<인물>.png 와 사진 겹침 out/<인물>-over.png 를 만들어요.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { PAINT } from "./paint.config.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../..");
const r1 = (n) => Math.round(n * 10) / 10;

/**
 * 끝이 뾰족한 선(머리결·속눈썹·입선) — 2차 곡선 p0→c→p1 을 따라 가운데가 두껍고(최대 w) 양끝이 가는 면
 * skew < 1 이면 굵은 곳이 p0 쪽, > 1 이면 p1 쪽으로 가요
 */
export function strand(p0, c, p1, w, fill, op = 1, skew = 1, N = 14) {
  const L = [], R = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N, u = 1 - t;
    const x = u * u * p0[0] + 2 * u * t * c[0] + t * t * p1[0];
    const y = u * u * p0[1] + 2 * u * t * c[1] + t * t * p1[1];
    const dx = 2 * u * (c[0] - p0[0]) + 2 * t * (p1[0] - c[0]);
    const dy = 2 * u * (c[1] - p0[1]) + 2 * t * (p1[1] - c[1]);
    const len = Math.hypot(dx, dy) || 1;
    const h = (w / 2) * Math.pow(Math.sin(Math.PI * Math.min(1, Math.pow(t, skew) * 1.08)), 0.7);
    L.push([x - (dy / len) * h, y + (dx / len) * h]);
    R.push([x + (dy / len) * h, y - (dx / len) * h]);
  }
  const pts = L.concat(R.reverse());
  return `<path d="M${pts.map((p) => `${r1(p[0])} ${r1(p[1])}`).join("L")}Z" fill="${fill}"${op < 1 ? ` opacity="${op}"` : ""} stroke="none"/>`;
}

/** 늘 같은 결과를 내는 난수 (머리결 흩뿌리기용) */
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
// 2차 곡선의 [a, b] 구간 (끝점 둘 + 조절점)
function sub([p0, c, p1], a, b) {
  const at = (t) => [(1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * c[0] + t * t * p1[0], (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * c[1] + t * t * p1[1]];
  const k0 = (1 - a) * (1 - b), k1 = (1 - a) * b + a * (1 - b), k2 = a * b;
  return [at(a), [k0 * p0[0] + k1 * c[0] + k2 * p1[0], k0 * p0[1] + k1 * c[1] + k2 * p1[1]], at(b)];
}

/**
 * 머리결 다발 — 길잡이 곡선 두 개(g1, g2: [p0, c, p1]) 사이를 n 가닥으로 메워요
 * colors: [[색, 비율], …], w: [최소, 최대] 두께, jitter: 흔들림(px)
 */
export function flow(R, g1, g2, n, { colors, w = [2, 4], op = [0.6, 0.95], jitter = 6, trim = 0.22 }) {
  const total = colors.reduce((s, c) => s + c[1], 0);
  let s = "";
  for (let i = 0; i < n; i++) {
    const t = (i + R()) / n;
    const j = () => (R() - 0.5) * 2 * jitter;
    const g = [0, 1, 2].map((k) => {
      const p = lerp(g1[k], g2[k], t);
      return [p[0] + j(), p[1] + j()];
    });
    const a = R() * trim, b = 1 - R() * trim;
    const [q0, qc, q1] = sub(g, a, b);
    let pick = R() * total, col = colors[0][0];
    for (const [cc, wgt] of colors) if ((pick -= wgt) <= 0) { col = cc; break; }
    s += strand(q0, qc, q1, w[0] + R() * (w[1] - w[0]), col, r1(op[0] + R() * (op[1] - op[0])), 0.8 + R() * 0.6, 10);
  }
  return s;
}

/**
 * 눈썹 털 — 눈썹 가운데 곡선 [안쪽 끝, 조절점, 바깥 끝] 을 따라 n 가닥.
 * 안쪽 끝 털은 위로 서고, 바깥으로 갈수록 눈썹 결을 따라 눕고 짧아져요 (눈썹 모양 clipPath 안에 그리면 깔끔)
 */
export function browHairs(R, [p0, c, p1], n, { len = 22, w = 3.4, color = "#1a1413", op = 0.85, spread = 6 } = {}) {
  let s = "";
  for (let i = 0; i < n; i++) {
    const t = (i + R() * 0.8) / n, u = 1 - t;
    const x = u * u * p0[0] + 2 * u * t * c[0] + t * t * p1[0];
    const y = u * u * p0[1] + 2 * u * t * c[1] + t * t * p1[1];
    const tx = 2 * u * (c[0] - p0[0]) + 2 * t * (p1[0] - c[0]), ty = 2 * u * (c[1] - p0[1]) + 2 * t * (p1[1] - c[1]);
    const k = Math.hypot(tx, ty), ux = tx / k, uy = ty / k;
    const a = Math.min(1, 0.2 + t * 1.1); // 0 이면 위로, 1 이면 결 방향
    let dx = ux * a, dy = -1 * (1 - a) + uy * a;
    const m = Math.hypot(dx, dy); dx /= m; dy /= m;
    const L = len * (1 - 0.4 * t) * (0.85 + R() * 0.3);
    const off = (R() - 0.5) * spread;
    const bx = x - uy * off, by = y + Math.abs(ux) * off + 4;
    s += strand([bx, by], [bx + dx * L * 0.5 - (dy > -0.5 ? 0 : 2 * Math.sign(ux)), by + dy * L * 0.5 - 2], [bx + dx * L, by + dy * L], w * (1 - 0.35 * t), color, op);
  }
  return s;
}

/**
 * 안경 — 렌즈 테두리 두 개(path d) + 브리지 + 다리. 얼굴 위에 맨 나중에 얹어요
 * frame: 테 색, w: 테 굵기, rimless: 무테(렌즈 가장자리만 옅게), glare: 렌즈 위 빛 반사 [[p0, c, p1], …],
 * shadow: 테 그림자 (아래로 dy 만큼, 흐린 필터 아이디)
 */
export function glasses({ lenses, bridge = "", temples = [], frame = "#3a3330", w = 4, rimless = false, glare = [], shadow }) {
  const stroke = (d, c, sw, op = 1) =>
    `<path d="${d}" fill="none" stroke="${c}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"${op < 1 ? ` opacity="${op}"` : ""}/>`;
  let s = "";
  if (shadow) s += `<g filter="url(#${shadow.filter})" opacity="${shadow.op ?? 0.25}" transform="translate(0 ${shadow.dy ?? 8})">${lenses.map((d) => stroke(d, "#5a3426", w * 1.2)).join("")}</g>`;
  s += lenses.map((d) => `<path d="${d}" fill="#ffffff" opacity=".07"/>`).join("");
  s += glare.map(([a, c, b, gw = 7]) => strand(a, c, b, gw, "#ffffff", 0.35)).join("");
  if (rimless) {
    s += lenses.map((d) => stroke(d, "#d9dde3", w * 0.6, 0.55) + stroke(d, "#6f6a66", w * 0.25, 0.5)).join("");
    s += stroke(bridge, frame, w, 0.95) + temples.map((d) => stroke(d, frame, w * 0.9)).join("");
  } else {
    s += [...lenses, bridge, ...temples].filter(Boolean).map((d) => stroke(d, frame, w)).join("");
    s += lenses.map((d) => stroke(d, "#ffffff", w * 0.3, 0.35)).join("");
  }
  return s;
}

/**
 * 흐림 필터들 — 부드러운 명암(에어브러시)용. 쓸 때는 <g filter="url(#<id>-b<세기>)">
 * 필터 영역은 그린 모양 크기의 사방 100% — 넓게 잡으면 썸네일 만드는 시간이 크게 늘어요
 */
export function blurDefs(id, stds) {
  return stds.map((s) => `<filter id="${id}-b${s}" x="-1" y="-1" width="3" height="3"><feGaussianBlur stdDeviation="${s}"/></filter>`).join("");
}

/** 타원 (회전 rot°) */
export const ell = (cx, cy, rx, ry, fill, op = 1, rot = 0) =>
  `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}"${op < 1 ? ` opacity="${op}"` : ""}${rot ? ` transform="rotate(${rot} ${cx} ${cy})"` : ""}/>`;

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
  // 벡터 그림은 늘 vector/<인물>.svg 에 — 사진 칠 그림(paint.mjs)이 실루엣·빈 곳 채우기에 써요
  fs.mkdirSync(path.join(HERE, "vector"), { recursive: true });
  fs.writeFileSync(path.join(HERE, "vector", `${name}.svg`), svg);
  fs.writeFileSync(path.join(HERE, "vector", `${name}.json`), JSON.stringify({ exportName, doc, credit, id, crop }, null, 2) + "\n");
  // 썸네일 그림은 AI 일러스트(ai/) > 사진 칠하기(paint.config) > 이 벡터 순 — 앞의 것이 있으면 벡터는 덮어쓰지 않아요
  const aiArt = fs.existsSync(path.join(HERE, "ai", `${name}.webp`));
  if (aiArt || PAINT[name]) {
    console.log(`${name}: 벡터 → scripts/portraits/vector/${name}.svg (썸네일 그림은 ${aiArt ? "ai.mjs" : "paint.mjs"})`);
  } else {
    const ts =
      `/**\n${doc.map((l) => ` * ${l}`).join("\n")}\n */\n` +
      `export const ${exportName} = {\n  svg: ${JSON.stringify(svg)},\n  credit: ${JSON.stringify(credit)},\n};\n`;
    fs.writeFileSync(path.join(ROOT, "src/lib/server/portraits", `${name}.ts`), ts);
  }

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
  if (!aiArt && !PAINT[name]) console.log(`${name}: ${svg.length} bytes → src/lib/server/portraits/${name}.ts, scripts/portraits/out/${name}.png`);
}
