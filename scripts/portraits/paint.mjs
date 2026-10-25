// 사진을 칠한 인물 초상 — 자유 이용 사진을 매끈한 붓 칠·정리된 명암·잉크 선으로 바꿔 480×560 초상을 만들어요
// 사용: node scripts/portraits/paint.mjs [인물…]   (없으면 paint.config.mjs 의 전부)
// 먼저 node scripts/portraits/<인물>.mjs 로 벡터 그림(vector/<인물>.svg·json)을 만들어 두세요.
//   벡터 그림은 실루엣(사진 배경 떼기)과 사진 밖 빈 곳(어깨 아래 등) 채우기에 써요.
// 결과: src/lib/server/portraits/<인물>.ts (JPEG 그림 + PNG 마스크를 품은 svg) · out/<인물>-paint.png (확인용)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { PAINT } from "./paint.config.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../..");
const W = 720, H = 840; // 480×560 의 1.5배로 칠하고 그대로 넣어요 (썸네일에서 크게 써도 또렷하게)
const N = W * H;
const INK = [43, 30, 24];

const clamp = (v) => (v < 0 ? 0 : v > 255 ? 255 : v);
const sstep = (a, b, v) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const raw = (buf, ch = 3) => ({ raw: { width: W, height: H, channels: ch } });
/** 한 장(1채널·3채널)을 가우스 흐림 — sharp 가 1채널도 3채널로 돌려주는 걸 막아요 */
async function blur(buf, ch, sigma) {
  const out = await sharp(buf, raw(buf, ch)).blur(sigma).raw().toBuffer({ resolveWithObject: true });
  if (out.info.channels === ch) return out.data;
  return sharp(out.data, raw(out.data, out.info.channels)).extractChannel(0).raw().toBuffer();
}
/** 0~1 실수 배열 → 흐린 0~1 실수 배열 */
async function blurF(arr, sigma) {
  const b = Buffer.alloc(N);
  for (let i = 0; i < N; i++) b[i] = Math.round(clamp(arr[i] * 255));
  const o = await blur(b, 1, sigma);
  const f = new Float32Array(N);
  for (let i = 0; i < N; i++) f[i] = o[i] / 255;
  return f;
}

/** 원본 사진에서 crop 칸을 W×H 로 — 사진 밖은 avail=0 */
async function cropPhoto(file, [x, y, w]) {
  const h = (w * 560) / 480;
  const m = await sharp(file).metadata();
  const sx = W / w, sy = H / h;
  const left = Math.max(0, -x), top = Math.max(0, -y);
  const ex = { left: Math.max(0, x), top: Math.max(0, y) };
  ex.width = Math.min(Math.round(w - left), m.width - ex.left);
  ex.height = Math.min(Math.round(h - top), m.height - ex.top);
  const part = await sharp(file).extract(ex).resize(Math.round(ex.width * sx), Math.round(ex.height * sy)).removeAlpha().toBuffer();
  const pl = Math.round(left * sx), pt = Math.round(top * sy);
  const rgb = await sharp({ create: { width: W, height: H, channels: 3, background: "#808080" } }).composite([{ input: part, left: pl, top: pt }]).removeAlpha().raw().toBuffer();
  const pw = Math.round(ex.width * sx), ph = Math.round(ex.height * sy);
  const avail = new Float32Array(N);
  for (let yy = pt; yy < Math.min(H, pt + ph); yy++) for (let xx = pl; xx < Math.min(W, pl + pw); xx++) avail[yy * W + xx] = 1;
  return { rgb, avail };
}

/** 벡터 그림을 W×H 로 — 색과 알파 */
async function renderVector(svg) {
  const doc = `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="560" viewBox="0 0 480 560">${svg}</svg>`;
  const rgba = await sharp(Buffer.from(doc)).resize(W, H).ensureAlpha().raw().toBuffer();
  const rgb = Buffer.alloc(N * 3), alpha = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    for (let c = 0; c < 3; c++) rgb[i * 3 + c] = rgba[i * 4 + c];
    alpha[i] = rgba[i * 4 + 3] / 255;
  }
  return { rgb, alpha };
}

/** 지울 곳(타원)을 둘레 색으로 메워요 — 바깥에서 안으로 번지게 여러 번 흐림 */
async function erase(rgb, ellipses) {
  if (!ellipses.length) return rgb;
  const hole = new Uint8Array(N);
  for (const [cx, cy, rx, ry] of ellipses)
    for (let yy = Math.max(0, Math.floor(cy - ry)); yy < Math.min(H, cy + ry + 1); yy++)
      for (let xx = Math.max(0, Math.floor(cx - rx)); xx < Math.min(W, cx + rx + 1); xx++)
        if (((xx - cx) / rx) ** 2 + ((yy - cy) / ry) ** 2 <= 1) hole[yy * W + xx] = 1;
  // 먼저 구멍 둘레 띠의 평균색으로 채우고, 그다음 여러 번 흐려 둘레 색이 자연스럽게 번지게
  const ring = new Uint8Array(N);
  for (const [cx, cy, rx, ry] of ellipses)
    for (let yy = Math.max(0, Math.floor(cy - ry * 1.4)); yy < Math.min(H, cy + ry * 1.4 + 1); yy++)
      for (let xx = Math.max(0, Math.floor(cx - rx * 1.4)); xx < Math.min(W, cx + rx * 1.4 + 1); xx++) {
        const d = ((xx - cx) / rx) ** 2 + ((yy - cy) / ry) ** 2;
        if (d > 1.1 && d <= 1.96) ring[yy * W + xx] = 1;
      }
  const avg = [0, 0, 0];
  let cnt = 0;
  for (let i = 0; i < N; i++) if (ring[i]) { for (let c = 0; c < 3; c++) avg[c] += rgb[i * 3 + c]; cnt++; }
  let cur = Buffer.from(rgb);
  if (cnt) for (let i = 0; i < N; i++) if (hole[i]) for (let c = 0; c < 3; c++) cur[i * 3 + c] = avg[c] / cnt;
  for (let k = 0; k < 30; k++) {
    const b = await blur(cur, 3, 4);
    for (let i = 0; i < N; i++) if (hole[i]) for (let c = 0; c < 3; c++) cur[i * 3 + c] = b[i * 3 + c];
  }
  return cur;
}

/** sRGB → Lab (색 거리용) */
function toLab(rgb) {
  const lab = new Float32Array(N * 3);
  const lin = (v) => ((v /= 255) <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  for (let i = 0; i < N; i++) {
    const r = lin(rgb[i * 3]), g = lin(rgb[i * 3 + 1]), b = lin(rgb[i * 3 + 2]);
    const X = f((0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.9505), Y = f(0.2126 * r + 0.7152 * g + 0.0722 * b), Z = f((0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.089);
    lab[i * 3] = 116 * Y - 16;
    lab[i * 3 + 1] = 500 * (X - Y);
    lab[i * 3 + 2] = 200 * (Y - Z);
  }
  return lab;
}

/** k-평균 (색 무리 k 개의 가운데) */
function kmeans(lab, idx, k) {
  const step = Math.max(1, Math.floor(idx.length / 20000));
  const pts = idx.filter((_, j) => j % step === 0);
  if (!pts.length) return [];
  const cs = [];
  for (let j = 0; j < k; j++) {
    const i = pts[Math.floor(((j + 0.5) / k) * pts.length)];
    cs.push([lab[i * 3], lab[i * 3 + 1], lab[i * 3 + 2]]);
  }
  for (let it = 0; it < 10; it++) {
    const acc = cs.map(() => [0, 0, 0, 0]);
    for (const i of pts) {
      let best = 0, bd = Infinity;
      cs.forEach((c, j) => {
        const d = (lab[i * 3] - c[0]) ** 2 + (lab[i * 3 + 1] - c[1]) ** 2 + (lab[i * 3 + 2] - c[2]) ** 2;
        if (d < bd) { bd = d; best = j; }
      });
      const a = acc[best];
      a[0] += lab[i * 3]; a[1] += lab[i * 3 + 1]; a[2] += lab[i * 3 + 2]; a[3]++;
    }
    acc.forEach((a, j) => { if (a[3]) cs[j] = [a[0] / a[3], a[1] / a[3], a[2] / a[3]]; });
  }
  return cs;
}

/** 실수 배열 가우스 흐림 (상자 흐림 세 번) — ch 채널 */
function gblur(arr, ch, sigma) {
  const r = Math.max(1, Math.round(Math.sqrt((12 * sigma * sigma) / 3 + 1) / 2 - 0.5));
  let a = Float32Array.from(arr), b = new Float32Array(arr.length);
  const pass = (src, dst, horiz) => {
    const len = horiz ? W : H, lines = horiz ? H : W;
    for (let l = 0; l < lines; l++)
      for (let c = 0; c < ch; c++) {
        const at = (k) => (horiz ? (l * W + k) * ch + c : (k * W + l) * ch + c);
        let acc = 0;
        for (let k = -r; k <= r; k++) acc += src[at(Math.min(len - 1, Math.max(0, k)))];
        for (let k = 0; k < len; k++) {
          dst[at(k)] = acc / (2 * r + 1);
          acc += src[at(Math.min(len - 1, k + r + 1))] - src[at(Math.max(0, k - r))];
        }
      }
  };
  for (let it = 0; it < 3; it++) {
    pass(a, b, true);
    pass(b, a, false);
  }
  return a;
}

/**
 * 배경 찾기: 실루엣은 벡터(사진에서 잰 매끈한 모양) 그대로 두고, 그 안쪽 가장자리 띠에서 사진 배경이 비치는 곳을 찾아요.
 * 그 근처의 확실한 사람 색(안쪽 깊은 곳)과 배경 색(바깥) 중 배경 쪽에 가까운 정도(0~1)와, 메울 색(근처 사람 색 평균)을 돌려줘요.
 * 두 색이 비슷하면(어두운 정장 vs 어두운 배경) 0. 사람 색 무리 하나와 아주 가까운 색(귀·턱 그늘의 피부 등)도 0
 */
async function backgroundness(rgb, a0, avail, band) {
  const ab = gblur(a0, 1, band);
  const fm = new Float32Array(N), bm = new Float32Array(N), fc = new Float32Array(N * 3), bc = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    fm[i] = avail[i] && ab[i] > 0.995 ? 1 : 0;
    bm[i] = avail[i] && ab[i] < 0.005 ? 1 : 0;
    for (let c = 0; c < 3; c++) {
      fc[i * 3 + c] = rgb[i * 3 + c] * fm[i];
      bc[i * 3 + c] = rgb[i * 3 + c] * bm[i];
    }
  }
  const sig = band * 1.4;
  const [FM, BM, FC, BC] = [gblur(fm, 1, sig), gblur(bm, 1, sig), gblur(fc, 3, sig), gblur(bc, 3, sig)];
  // 사람 색 무리 (안쪽 깊은 곳) — 이 무리 어느 것과도 먼 색(파란 배경 등)은 배경
  const lab = toLab(rgb), core = [];
  for (let i = 0; i < N; i++) if (fm[i]) core.push(i);
  const F = kmeans(lab, core, 10);
  // 가까운 안쪽 사람 색: 반지름 R 안의 안쪽 깊은 곳 화소(4칸 간격 표본) 중 가장 비슷한 색까지의 거리
  const R = 70, T = 16, TW = Math.ceil(W / T), TH = Math.ceil(H / T), tiles = Array.from({ length: TW * TH }, () => []);
  for (let yy = 0; yy < H; yy += 4) for (let xx = 0; xx < W; xx += 4) { const i = yy * W + xx; if (fm[i]) tiles[Math.floor(yy / T) * TW + Math.floor(xx / T)].push(i); }
  const nearCore = (i) => {
    const x = i % W, y = (i - x) / W, tr = Math.ceil(R / T);
    let bd = Infinity;
    for (let ty = Math.max(0, Math.floor(y / T) - tr); ty <= Math.min(TH - 1, Math.floor(y / T) + tr); ty++)
      for (let tx = Math.max(0, Math.floor(x / T) - tr); tx <= Math.min(TW - 1, Math.floor(x / T) + tr); tx++)
        for (const j of tiles[ty * TW + tx]) {
          const jx = j % W, jy = (j - jx) / W;
          if ((jx - x) ** 2 + (jy - y) ** 2 > R * R) continue;
          const d = (lab[i * 3] - lab[j * 3]) ** 2 + (lab[i * 3 + 1] - lab[j * 3 + 1]) ** 2 + (lab[i * 3 + 2] - lab[j * 3 + 2]) ** 2;
          if (d < bd) bd = d;
        }
    return Math.sqrt(bd);
  };
  const out = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    if (!avail[i] || a0[i] < 0.01 || ab[i] > 0.995) continue;
    let dF = Infinity;
    for (const c of F) dF = Math.min(dF, (lab[i * 3] - c[0]) ** 2 + (lab[i * 3 + 1] - c[1]) ** 2 + (lab[i * 3 + 2] - c[2]) ** 2);
    const far = sstep(24, 38, Math.sqrt(dF)), near = sstep(7, 15, nearCore(i));
    if (FM[i] < 1e-4 || BM[i] < 1e-4) { out[i] = far; continue; }
    let dot = 0, len = 0;
    for (let c = 0; c < 3; c++) {
      const f = FC[i * 3 + c] / FM[i], b = BC[i * 3 + c] / BM[i];
      dot += (rgb[i * 3 + c] - b) * (f - b);
      len += (f - b) ** 2;
    }
    const conf = sstep(18, 40, Math.sqrt(len));
    const am = sstep(0.35, 0.65, Math.min(1, Math.max(0, dot / Math.max(1, len))));
    out[i] = Math.max(far, (1 - am) * conf * near);
  }
  // 점처럼 튀는 곳은 지우고 메울 곳은 부드럽게
  const sm = gblur(out, 1, 2.5);
  for (let i = 0; i < N; i++) sm[i] = sstep(0.3, 0.6, sm[i]);
  // 메울 색: 근처 사람 색 평균 (좁게 잡아 머리 옆은 머리색, 뺨 옆은 피부색)
  const sig2 = band * 0.9, FM2 = gblur(fm, 1, sig2), FC2 = gblur(fc, 3, sig2), fill = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) for (let c = 0; c < 3; c++) fill[i * 3 + c] = FM2[i] > 1e-3 ? FC2[i * 3 + c] / FM2[i] : FM[i] > 1e-5 ? FC[i * 3 + c] / FM[i] : -1;
  return { bg: gblur(sm, 1, 2), fill };
}

/** 양방향 필터: 가까우면서 색이 비슷한 이웃만 섞어 경계는 살리고 면은 매끈하게 */
function bilateral(src, rad, ss, sr) {
  const dst = Buffer.alloc(N * 3), taps = [];
  for (let dy = -rad; dy <= rad; dy++) for (let dx = -rad; dx <= rad; dx++) taps.push([dx, dy, Math.exp(-(dx * dx + dy * dy) / (2 * ss * ss))]);
  const lut = new Float64Array(3 * 256 * 256);
  for (let i = 0; i < lut.length; i++) lut[i] = Math.exp(-i / (2 * sr * sr));
  for (let yy = 0; yy < H; yy++)
    for (let xx = 0; xx < W; xx++) {
      const p = (yy * W + xx) * 3, r0 = src[p], g0 = src[p + 1], b0 = src[p + 2];
      let sw = 0, sR = 0, sG = 0, sB = 0;
      for (const [dx, dy, ws] of taps) {
        const X = xx + dx, Y = yy + dy;
        if (X < 0 || Y < 0 || X >= W || Y >= H) continue;
        const q = (Y * W + X) * 3, dr = src[q] - r0, dg = src[q + 1] - g0, db = src[q + 2] - b0;
        const wgt = ws * lut[dr * dr + dg * dg + db * db];
        sw += wgt;
        sR += wgt * src[q];
        sG += wgt * src[q + 1];
        sB += wgt * src[q + 2];
      }
      dst[p] = sR / sw;
      dst[p + 1] = sG / sw;
      dst[p + 2] = sB / sw;
    }
  return dst;
}

/** 칠하기: 매끈한 면 → 명암 단계 정리(부드러운 셀 셰이딩) → 잉크 선 → 색 보정 */
async function paint(src, o) {
  let img = src;
  for (let k = 0; k < o.passes; k++) img = bilateral(img, 5, 3, o.sr);
  const step = 255 / o.levels;
  for (let i = 0; i < N; i++) {
    const p = i * 3, L = 0.299 * img[p] + 0.587 * img[p + 1] + 0.114 * img[p + 2];
    const t = L / step, f = Math.floor(t), Lq = (f + sstep(0.3, 0.7, t - f)) * step;
    const k = L > 1 ? 1 - o.toon + o.toon * (Lq / L) : 1;
    for (let c = 0; c < 3; c++) img[p + c] = clamp(img[p + c] * k);
  }
  // XDoG 선 — 매끈하게 만든 그림에서 (피부 잔티 없이 이목구비·옷 윤곽만)
  const gray = await sharp(img, raw(img)).greyscale().extractChannel(0).raw().toBuffer();
  const [g1, g2] = await Promise.all([blur(gray, 1, 0.9), blur(gray, 1, o.lineSoft)]);
  const ink = Buffer.alloc(N);
  for (let i = 0; i < N; i++) {
    const d = g1[i] - 0.985 * g2[i];
    ink[i] = d < -2 ? clamp(((-2 - d) / 8) * 255) : 0;
  }
  const inkB = await blur(ink, 1, 0.7);
  const rgb = await sharp(img, raw(img)).modulate({ saturation: o.sat, brightness: o.bri }).raw().toBuffer();
  for (let i = 0; i < N; i++) {
    const a = sstep(0.18, 0.55, inkB[i] / 255) * o.ink;
    for (let c = 0; c < 3; c++) rgb[i * 3 + c] = rgb[i * 3 + c] * (1 - a) + INK[c] * a;
  }
  return rgb;
}

async function make(name) {
  const cfg = { passes: 5, sr: 16, levels: 8, toon: 0.15, ink: 0.6, sat: 1.15, bri: 1.04, outline: 0.9, lineSoft: 2.0, band: 18, erase: [], ...PAINT[name], ...JSON.parse(process.env.PAINT_OPTS || "{}") };
  const meta = JSON.parse(fs.readFileSync(path.join(HERE, "vector", `${name}.json`), "utf8"));
  const svg = fs.readFileSync(path.join(HERE, "vector", `${name}.svg`), "utf8");
  const [x0, y0, w0] = meta.crop;
  const sx = W / w0;
  const photo = await cropPhoto(path.join(HERE, "photos", `${name}.jpg`), meta.crop);
  const vec = await renderVector(svg);

  // 사진 밖(어깨 아래 등)은 벡터 그림으로 — 경계는 부드럽게 섞어요
  const availB = await blurF(photo.avail, 6);
  let base = Buffer.alloc(N * 3);
  for (let i = 0; i < N; i++) {
    const a = photo.avail[i] ? availB[i] : 0;
    for (let c = 0; c < 3; c++) base[i * 3 + c] = photo.rgb[i * 3 + c] * a + vec.rgb[i * 3 + c] * (1 - a);
  }
  base = await erase(base, cfg.erase.map(([cx, cy, rx, ry]) => [(cx - x0) * sx, (cy - y0) * sx, rx * sx, ry * sx]));
  const { bg, fill } = await backgroundness(base, vec.alpha, photo.avail, cfg.band);
  if (process.env.PAINT_DEBUG) {
    const d = Buffer.alloc(N);
    for (let i = 0; i < N; i++) d[i] = clamp(bg[i] * 255);
    await sharp(d, raw(d, 1)).png().toFile(path.join(HERE, "out", `${name}-bg.png`));
  }
  // 배경이 비친 곳은 근처 사람 색(사진 색) 70% + 벡터 그림 색 30% 로 메워요 (색이 튀지 않으면서 결은 남게)
  for (let i = 0; i < N; i++)
    for (let c = 0; c < 3; c++) {
      const f = fill[i * 3 + c] < 0 ? vec.rgb[i * 3 + c] : fill[i * 3 + c] * 0.7 + vec.rgb[i * 3 + c] * 0.3;
      base[i * 3 + c] = base[i * 3 + c] * (1 - bg[i]) + f * bg[i];
    }
  // 실루엣: 벡터 모양을 1~2px 안으로 줄이고, 가장 바깥 띠(약 10px)에서 배경이 비치는 곳은 아예 잘라내요 (머리·귀 둘레 테두리 빛 없애기)
  const a5 = gblur(vec.alpha, 1, 5), a2 = gblur(vec.alpha, 1, 2);
  const alpha = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const edge = 1 - sstep(0.8, 0.97, a5[i]);
    alpha[i] = sstep(0.55, 0.75, a2[i]) * (1 - sstep(0.15, 0.5, bg[i]) * edge);
  }
  const alphaS = gblur(alpha, 1, 1.2);
  for (let i = 0; i < N; i++) alpha[i] = sstep(0.4, 0.6, alphaS[i]);
  const rgb = await paint(base, cfg);

  // 가장자리 윤곽선 + JPEG 가장자리 번짐을 막으려 바깥은 안쪽 색으로 채움
  const ab = await blurF(alpha, 1.6);
  const pre = Buffer.alloc(N * 3), am = Buffer.alloc(N);
  for (let i = 0; i < N; i++) {
    am[i] = alpha[i] * 255;
    for (let c = 0; c < 3; c++) pre[i * 3 + c] = rgb[i * 3 + c] * alpha[i];
  }
  const [preB, amB] = await Promise.all([blur(pre, 3, 8), blur(am, 1, 8)]);
  const mask = Buffer.alloc(N);
  for (let i = 0; i < N; i++) {
    const line = sstep(0.2, 0.5, ab[i]) * (1 - sstep(0.65, 0.9, ab[i])) * cfg.outline;
    const a = Math.max(alpha[i], line);
    for (let c = 0; c < 3; c++) {
      const fill = alpha[i] > 0.5 ? rgb[i * 3 + c] : amB[i] > 2 ? (preB[i * 3 + c] * 255) / amB[i] : rgb[i * 3 + c];
      rgb[i * 3 + c] = clamp(fill * (1 - line) + INK[c] * line);
    }
    mask[i] = Math.round(a * 255);
  }
  const jpg = await sharp(rgb, raw(rgb)).jpeg({ quality: 84, mozjpeg: true }).toBuffer();
  const png = await sharp(mask, raw(mask, 1)).png({ compressionLevel: 9, palette: false }).toBuffer();
  const id = meta.id;
  const out =
    `<defs><mask id="${id}-m" maskUnits="userSpaceOnUse" x="0" y="0" width="480" height="560">` +
    `<image width="480" height="560" preserveAspectRatio="none" href="data:image/png;base64,${png.toString("base64")}"/></mask></defs>` +
    `<image width="480" height="560" preserveAspectRatio="none" mask="url(#${id}-m)" href="data:image/jpeg;base64,${jpg.toString("base64")}"/>`;
  const doc = [...meta.doc.map((l) => l.replace("손으로 짠 벡터 일러스트", "사진을 칠한 일러스트")), "그리는 법: scripts/portraits/paint.mjs (벡터 그림 실루엣 + 사진을 매끈한 붓 칠·셀 명암·잉크 선으로)"];
  const ts =
    `/**\n${doc.map((l) => ` * ${l}`).join("\n")}\n */\n` +
    `export const ${meta.exportName} = {\n  svg: ${JSON.stringify(out)},\n  credit: ${JSON.stringify(meta.credit)},\n};\n`;
  fs.writeFileSync(path.join(ROOT, "src/lib/server/portraits", `${name}.ts`), ts);

  // 확인용: 연한 하늘색 바탕에 얹은 그림
  const rgba = Buffer.alloc(N * 4);
  for (let i = 0; i < N; i++) {
    for (let c = 0; c < 3; c++) rgba[i * 4 + c] = rgb[i * 3 + c];
    rgba[i * 4 + 3] = mask[i];
  }
  const pic = await sharp(rgba, raw(rgba, 4)).png().toBuffer();
  fs.mkdirSync(path.join(HERE, "out"), { recursive: true });
  await sharp({ create: { width: W, height: H, channels: 4, background: "#cfe3f5" } }).composite([{ input: pic }]).png().toFile(path.join(HERE, "out", `${name}-paint${process.env.PAINT_TAG || ""}.png`));
  console.log(`${name}: jpg ${jpg.length} + mask ${png.length} bytes → src/lib/server/portraits/${name}.ts, scripts/portraits/out/${name}-paint.png`);
}

const names = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(PAINT);
for (const n of names) {
  if (!PAINT[n]) {
    console.log(`${n}: paint.config.mjs 에 없어요 (벡터 그림만 써요)`);
    continue;
  }
  await make(n);
}
