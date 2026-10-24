// 사진 → 일러스트 초상 (부위별로 나눠 명암 3~4단계 + 이목구비 선 + 바깥 윤곽선)
// 사용: node scripts/portraits/toon.mjs scripts/portraits/<인물>.json  (사진은 scripts/portraits/photos/ — README 참고)
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
const cfg = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));

const inPoly = (px, py, poly) => {
  let ins = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) ins = !ins;
  }
  return ins;
};
function hsv(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  let h = 0;
  if (d) h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h = (h * 60 + 360) % 360;
  return [h, mx ? d / mx : 0, mx];
}
function boxBlur(src, W, H, r) {
  const tmp = new Float32Array(W * H), out = new Float32Array(W * H);
  for (let y = 0; y < H; y++) {
    let s = 0, n = 0;
    for (let x = -r; x < W + r; x++) {
      const xa = x + r, xr = x - r - 1;
      if (xa >= 0 && xa < W) { s += src[y * W + xa]; n++; }
      if (xr >= 0 && xr < W) { s -= src[y * W + xr]; n--; }
      if (x >= 0 && x < W) tmp[y * W + x] = s / n;
    }
  }
  for (let x = 0; x < W; x++) {
    let s = 0, n = 0;
    for (let y = -r; y < H + r; y++) {
      const ya = y + r, yr = y - r - 1;
      if (ya >= 0 && ya < H) { s += tmp[ya * W + x]; n++; }
      if (yr >= 0 && yr < H) { s -= tmp[yr * W + x]; n--; }
      if (y >= 0 && y < H) out[y * W + x] = s / n;
    }
  }
  return out;
}
/** 마스크 안에서만 흐리게 (경계 밖 색이 섞이지 않게) */
function maskedBlur(val, mask, W, H, r) {
  const a = new Float32Array(W * H), m = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) if (mask[i]) { a[i] = val[i]; m[i] = 1; }
  const A = boxBlur(a, W, H, r), M = boxBlur(m, W, H, r);
  const out = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) out[i] = M[i] > 0 ? A[i] / M[i] : 0;
  return out;
}
function majority(lbl, W, H, R, K, keepMask) {
  const out = lbl.slice();
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (keepMask && !keepMask[i]) continue;
      const cnt = new Int32Array(K + 1);
      for (let yy = Math.max(0, y - R); yy <= Math.min(H - 1, y + R); yy++)
        for (let xx = Math.max(0, x - R); xx <= Math.min(W - 1, x + R); xx++) cnt[lbl[yy * W + xx]]++;
      let b = lbl[i], bc = -1;
      for (let c = 0; c <= K; c++) if (cnt[c] > bc) { bc = cnt[c]; b = c; }
      out[i] = b;
    }
  return out;
}
function components(mask, W, H) {
  const comp = new Int32Array(W * H).fill(-1);
  const sizes = [];
  let n = 0;
  const st = [];
  for (let i = 0; i < W * H; i++) {
    if (!mask[i] || comp[i] >= 0) continue;
    let size = 0;
    st.push(i); comp[i] = n;
    while (st.length) {
      const j = st.pop(); size++;
      const x = j % W, y = (j / W) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const xx = x + dx, yy = y + dy;
        if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
        const k = yy * W + xx;
        if (mask[k] && comp[k] < 0) { comp[k] = n; st.push(k); }
      }
    }
    sizes.push(size); n++;
  }
  return { comp, sizes };
}

/* ---------- 벡터 경계 ---------- */
function traceLoops(mask, w, h) {
  const at = (x, y) => x >= 0 && y >= 0 && x < w && y < h && mask[y * w + x];
  const edges = new Map();
  const add = (x1, y1, x2, y2) => { const k = x1 + "," + y1; if (!edges.has(k)) edges.set(k, []); edges.get(k).push({ x: x2, y: y2, used: false, fx: x1, fy: y1 }); };
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (!at(x, y)) continue;
    if (!at(x, y - 1)) add(x, y, x + 1, y);
    if (!at(x + 1, y)) add(x + 1, y, x + 1, y + 1);
    if (!at(x, y + 1)) add(x + 1, y + 1, x, y + 1);
    if (!at(x - 1, y)) add(x, y + 1, x, y);
  }
  const loops = [];
  const turn = (dx, dy, c) => { const cr = dx * (c.y - c.fy) - dy * (c.x - c.fx); return cr > 0 ? 0 : cr === 0 ? 1 : 2; };
  for (const [, list] of edges) for (const e0 of list) {
    if (e0.used) continue;
    const loop = [[e0.fx, e0.fy]];
    let e = e0; e.used = true;
    for (let g = 0; g < 1e6; g++) {
      const cand = (edges.get(e.x + "," + e.y) || []).filter((c) => !c.used);
      if (!cand.length) break;
      const dx = e.x - e.fx, dy = e.y - e.fy;
      cand.sort((a, b) => turn(dx, dy, a) - turn(dx, dy, b));
      const nx = cand[0]; nx.used = true; loop.push([e.x, e.y]); e = nx;
      if (e.x === e0.fx && e.y === e0.fy) break;
    }
    if (loop.length > 3) loops.push(loop);
  }
  return loops;
}
function rdp(pts, eps) {
  if (pts.length < 3) return pts;
  const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1;
  const st = [[0, pts.length - 1]];
  while (st.length) {
    const [s, e] = st.pop(); let best = -1, bi = -1;
    const [x1, y1] = pts[s], [x2, y2] = pts[e], dx = x2 - x1, dy = y2 - y1, L = dx * dx + dy * dy;
    for (let i = s + 1; i < e; i++) {
      const [x, y] = pts[i]; let t = L ? ((x - x1) * dx + (y - y1) * dy) / L : 0; t = Math.max(0, Math.min(1, t));
      const ex = x1 + t * dx - x, ey = y1 + t * dy - y, dd = ex * ex + ey * ey;
      if (dd > best) { best = dd; bi = i; }
    }
    if (best > eps * eps) { keep[bi] = 1; st.push([s, bi], [bi, e]); }
  }
  return pts.filter((_, i) => keep[i]);
}
function simplifyClosed(loop, eps) {
  let far = 0, fd = -1;
  for (let i = 0; i < loop.length; i++) { const dx = loop[i][0] - loop[0][0], dy = loop[i][1] - loop[0][1]; if (dx * dx + dy * dy > fd) { fd = dx * dx + dy * dy; far = i; } }
  const a = rdp(loop.slice(0, far + 1), eps), b = rdp(loop.slice(far).concat([loop[0]]), eps);
  return a.slice(0, -1).concat(b.slice(0, -1));
}
let OUT_K = 1;
function smoothPath(p) {
  const n = p.length, P = (i) => p[(i + n) % n], f = (v) => Math.round((v / OUT_K) * 10) / 10;
  let d = `M${f(P(0)[0])} ${f(P(0)[1])}`;
  for (let i = 0; i < n; i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`;
  }
  return d + "Z";
}
const area = (l) => Math.abs(l.reduce((s, [x, y], i) => { const [x2, y2] = l[(i + 1) % l.length]; return s + x * y2 - x2 * y; }, 0)) / 2;
function maskPath(m, W, H, minArea, eps) {
  return traceLoops(m, W, H).filter((l) => area(l) >= minArea).map((l) => smoothPath(simplifyClosed(l, eps))).join("");
}

(async () => {
  const [cx, cy, cw, ch] = cfg.crop;
  const k = cfg.k2 || 1;
  OUT_K = k;
  const W = (cfg.outW || 480) * k, sc = W / cw, H = Math.round(ch * sc);
  const R = (v) => Math.max(1, Math.round(v * k)), A2 = (v) => v * k * k;
  // 위쪽 여백이 모자라면 사진 위를 바탕색으로 늘려요 (좌표는 늘린 만큼 내려가요)
  const pad = cfg.padTop || 0;
  const srcBuf = pad ? await sharp(cfg.input).extend({ top: pad, bottom: 0, left: 0, right: 0, background: cfg.padColor || "#808080" }).toBuffer() : cfg.input;
  const { data } = await sharp(srcBuf).extract({ left: cx, top: cy + pad, width: cw, height: ch }).median(cfg.median || 5).resize(W, H).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const P = (poly) => poly.map(([x, y]) => [(x - cx) * sc, (y - cy) * sc]);
  const mask = P(cfg.mask), body = cfg.bodyZone ? P(cfg.bodyZone) : null, tie = cfg.tie ? P(cfg.tie) : null, skinZone = cfg.skinZone ? P(cfg.skinZone) : null;
  const N = W * H;
  const L = new Float32Array(N), Hh = new Float32Array(N), S = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const r = data[i * 3], g = data[i * 3 + 1], b = data[i * 3 + 2];
    L[i] = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    const [h, s] = hsv(r, g, b); Hh[i] = h; S[i] = s;
  }
  // 부위: 0 바탕 1 피부 2 머리 3 셔츠 4 정장 5 넥타이
  const lbl = new Uint8Array(N);
  const inside = new Uint8Array(N);
  const sk = cfg.skin || { hMin: 0, hMax: 45, sMin: 0.16, vMin: 0.28 };
  const Z = cfg.zones ? { face: P(cfg.zones.face), shirt: P(cfg.zones.shirt), band: cfg.zones.band ? P(cfg.zones.band) : null, hairMaxY: (cfg.zones.hairMaxY - cy) * sc } : null;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x, px = x + 0.5, py = y + 0.5;
    if (!inPoly(px, py, mask)) continue;
    inside[i] = 1;
    if (Z) {
      // 손으로 지정한 부위 (얼굴·셔츠·넥타이), 나머지는 높이로 머리/정장
      lbl[i] = tie && inPoly(px, py, tie) ? 5 : inPoly(px, py, Z.face) ? 1 : inPoly(px, py, Z.shirt) ? 3 : py < Z.hairMaxY ? 2 : 4;
      // 머리선 띠: 색으로 머리/피부를 가려 자연스러운 앞머리 끝
      if (Z.band && inPoly(px, py, Z.band) && (lbl[i] === 1 || lbl[i] === 2))
        lbl[i] = cfg.zones.bandDark ? (L[i] < cfg.zones.bandDark ? 2 : 1) : S[i] < (cfg.zones.bandS || 0.24) || L[i] > (cfg.zones.bandL || 0.78) ? 2 : 1;
      continue;
    }
    const isSkin = (Hh[i] <= sk.hMax || Hh[i] >= 340) && Hh[i] >= sk.hMin && S[i] >= sk.sMin && L[i] >= sk.vMin && (!skinZone || inPoly(px, py, skinZone));
    if (tie && inPoly(px, py, tie)) lbl[i] = 5;
    else if (body && inPoly(px, py, body)) lbl[i] = isSkin ? 1 : L[i] > (cfg.shirtL || 0.55) && S[i] < 0.3 ? 3 : 4;
    else lbl[i] = isSkin ? 1 : 2;
  }
  let lab = majority(lbl, W, H, R(2), 5, inside);
  lab = majority(lab, W, H, R(2), 5, inside);
  // 얼굴 안의 '머리' 조각(눈·눈썹 등)은 이목구비로
  const hairMask = new Uint8Array(N);
  for (let i = 0; i < N; i++) hairMask[i] = lab[i] === 2 ? 1 : 0;
  const { comp, sizes } = components(hairMask, W, H);
  const keep = new Set(sizes.map((s, c) => [s, c]).sort((a, b) => b[0] - a[0]).slice(0, cfg.hairParts || 2).map(([, c]) => c));
  const feature = new Uint8Array(N);
  for (let i = 0; i < N; i++) if (lab[i] === 2 && !keep.has(comp[i])) { lab[i] = 1; feature[i] = 1; }
  // 이목구비 선: 얼굴(피부)에서 주변보다 어두운 곳
  const skinM = new Uint8Array(N);
  for (let i = 0; i < N; i++) skinM[i] = lab[i] === 1 ? 1 : 0;
  const Ls = maskedBlur(L, skinM, W, H, R(1));
  const Lm = maskedBlur(L, skinM, W, H, R(cfg.featR || 7));
  const fz = cfg.featureZone ? P(cfg.featureZone) : null;
  const soft = new Uint8Array(N);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x;
    if (!skinM[i] || (fz && !inPoly(x + 0.5, y + 0.5, fz))) continue;
    const dd = Lm[i] - Ls[i];
    if (dd > (cfg.featDelta || 0.09) * (cfg.inkMul || 1.6)) feature[i] = 1;
    else if (dd > (cfg.featDelta || 0.09)) soft[i] = 1;
  }
  // 이목구비 다듬기 (작은 점 지우기)
  let fl = majority(feature, W, H, R(1), 1, null);
  const fc = components(fl, W, H);
  for (let i = 0; i < N; i++) if (fl[i] && fc.sizes[fc.comp[i]] < A2(cfg.featMin || 10)) fl[i] = 0;

  // 부위별 명암 단계
  const layers = [];
  const regions = cfg.regions; // { "1": { tones: ["#base", "#shade", ...], q: [0.6, 0.3], blur: 3 }, ... }
  for (const key of ["4", "3", "5", "1", "2"]) {
    const reg = regions[key];
    if (!reg) continue;
    const m = new Uint8Array(N);
    for (let i = 0; i < N; i++) m[i] = lab[i] === Number(key) ? 1 : 0;
    // 1픽셀 넓혀 틈 메우기
    const g = m.slice();
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = y * W + x; if (m[i] || !inside[i]) continue; if ((x > 0 && m[i - 1]) || (x < W - 1 && m[i + 1]) || (y > 0 && m[i - W]) || (y < H - 1 && m[i + W])) g[i] = 1; }
    layers.push(`<path d="${maskPath(g, W, H, A2(20), (cfg.eps || 1.0) * k)}" fill="${reg.tones[0]}" fill-rule="evenodd"/>`);
    const Lb = maskedBlur(L, m, W, H, R(reg.blur || 3));
    const vals = [];
    for (let i = 0; i < N; i++) if (m[i]) vals.push(Lb[i]);
    vals.sort((a, b) => a - b);
    (reg.q || []).forEach((q, t) => {
      const th = vals[Math.floor(q * (vals.length - 1))];
      let s = new Uint8Array(N);
      for (let i = 0; i < N; i++) s[i] = m[i] && Lb[i] <= th ? 1 : 0;
      for (let pass = 0; pass < (cfg.tonePasses || 1); pass++) s = majority(s, W, H, R(2), 1, null);
      for (let i = 0; i < N; i++) if (!m[i]) s[i] = 0;
      const d = maskPath(s, W, H, A2(reg.minArea || 14), (cfg.eps || 1.0) * k);
      if (d) layers.push(`<path d="${d}" fill="${reg.tones[t + 1]}" fill-rule="evenodd"/>`);
    });
  }
  // 이·흰자 (지정한 곳에서 밝고 흰 부분)
  if (cfg.whiteZones) {
    // 각 칸: { poly, L, S } (L 보다 밝고 S 보다 덜 진한 곳)
    const zs = cfg.whiteZones.map((z) => ({ poly: P(z.poly), L: z.L ?? cfg.whiteL ?? 0.7, S: z.S ?? cfg.whiteS ?? 0.28 }));
    let wm = new Uint8Array(N);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (lab[i] !== 1) continue;
      const z = zs.find((zz) => inPoly(x + 0.5, y + 0.5, zz.poly));
      if (z && L[i] > z.L && S[i] < z.S) { wm[i] = 1; fl[i] = 0; }
    }
    wm = majority(wm, W, H, R(1), 1, null);
    const wp = maskPath(wm, W, H, A2(6), 0.8 * k);
    if (wp) layers.push(`<path d="${wp}" fill="${cfg.whiteFill || "#fbfbfd"}" fill-rule="evenodd"/>`);
  }
  // 약한 주름·그늘은 피부 그늘색으로
  let sl = majority(soft, W, H, R(1), 1, null);
  const sc2 = components(sl, W, H);
  for (let i = 0; i < N; i++) if (sl[i] && sc2.sizes[sc2.comp[i]] < A2((cfg.featMin || 10) * 2)) sl[i] = 0;
  const spath = maskPath(sl, W, H, A2((cfg.featMin || 10) * 2), 0.9 * k);
  if (spath && cfg.softInk) layers.push(`<path d="${spath}" fill="${cfg.softInk}" fill-rule="evenodd"/>`);
  const fpath = maskPath(fl, W, H, A2(cfg.featMin || 10), 0.8 * k);
  if (fpath) layers.push(`<path d="${fpath}" fill="${cfg.ink || "#3a2626"}" fill-rule="evenodd"/>`);
  const outline = maskPath(inside, W, H, A2(200), 1.4 * k);
  const out = layers.join("") + `<path d="${outline}" fill="none" stroke="${cfg.outline || "#2a2230"}" stroke-width="${cfg.outlineW || 5}" stroke-linejoin="round"/>`;
  fs.mkdirSync(path.dirname(cfg.outSvg), { recursive: true });
  fs.writeFileSync(cfg.outSvg, out);
  const OW = W / k, OH = H / k;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${OW}" height="${OH}" viewBox="0 0 ${OW} ${OH}"><rect width="${OW}" height="${OH}" fill="${cfg.bg || "#cfe3f5"}"/>${out}</svg>`;
  await sharp(Buffer.from(svg)).png().toFile(cfg.outPng);
  // 부위 확인용
  if (cfg.debugPng) {
    const cols = [[207, 227, 245], [243, 203, 168], [160, 165, 175], [240, 244, 250], [50, 54, 62], [30, 40, 80]];
    const buf = Buffer.alloc(N * 3);
    for (let i = 0; i < N; i++) { const c = fl[i] ? [200, 0, 60] : cols[lab[i]]; buf[i * 3] = c[0]; buf[i * 3 + 1] = c[1]; buf[i * 3 + 2] = c[2]; }
    await sharp(buf, { raw: { width: W, height: H, channels: 3 } }).png().toFile(cfg.debugPng);
  }
  console.log("bytes", out.length);
})();
