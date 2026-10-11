/**
 * 기관 로고 수집 스크립트
 *
 *   node scripts/fetch-logos.mjs            # 로고가 없는 기관만
 *   node scripts/fetch-logos.mjs --force    # 전부 다시
 *   node scripts/fetch-logos.mjs --only lh,ex
 *
 * 각 기관 공식 홈페이지의 아이콘(apple-touch-icon, icon, favicon.ico)과
 * Google 파비콘 서비스를 후보로 받아 가장 큰 이미지를 고르고,
 * 128×128 PNG로 다시 인코딩해 public/logos/{id}.png 에 저장합니다.
 * (원본 파일은 저장하지 않으며 SVG는 보안상 사용하지 않습니다.)
 * 결과 매핑은 src/data/logos.json 에 기록합니다.
 */
import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const OUT_DIR = join(ROOT, "public", "logos");
const MANIFEST = join(ROOT, "src", "data", "logos.json");
const WIDE_DIR = join(OUT_DIR, "wide");
const WIDE_MANIFEST = join(ROOT, "src", "data", "logos-wide.json");
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";
const TIMEOUT_MS = 12_000;
const MAX_BYTES = 3 * 1024 * 1024;
const MIN_SIZE = 32;
const CONCURRENCY = 6;

const args = process.argv.slice(2);
const FORCE = args.includes("--force");
const onlyArg = args.find((a) => a.startsWith("--only"));
const ONLY = onlyArg ? new Set((onlyArg.split("=")[1] ?? args[args.indexOf(onlyArg) + 1] ?? "").split(",")) : null;

/* ---------------- 기관 목록 ---------------- */

async function loadCompanies() {
  const list = [];
  const ts = await readFile(join(ROOT, "src", "data", "companies.ts"), "utf8");
  for (const block of ts.split("company({").slice(1)) {
    const id = block.match(/\bid:\s*"([^"]+)"/)?.[1];
    const homepage = block.match(/\bhomepage:\s*"([^"]+)"/)?.[1];
    if (id && homepage) list.push({ id, homepage });
  }
  const genPath = join(ROOT, "src", "data", "generated", "companies.json");
  if (existsSync(genPath)) {
    for (const c of JSON.parse(await readFile(genPath, "utf8"))) {
      if (c.id && c.homepage && !list.some((x) => x.id === c.id)) list.push({ id: c.id, homepage: c.homepage });
    }
  }
  return list;
}

/* ---------------- 네트워크 ---------------- */

async function get(url) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: { "user-agent": UA, "accept-language": "ko-KR,ko;q=0.9" },
      redirect: "follow",
      signal: ctrl.signal,
    });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length === 0 || buf.length > MAX_BYTES) return null;
    return { buf, url: res.url };
  } catch (e) {
    // 중간 인증서가 빠진 국내 사이트: Windows 인증서 체계(Schannel)를 쓰는 curl 로 재시도
    const code = e?.cause?.code ?? "";
    if (process.platform === "win32" && /CERT|LEAF|ISSUER|SELF_SIGNED/.test(code)) return curlGet(url);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function curlGet(url) {
  return new Promise((resolve) => {
    execFile(
      "curl.exe",
      ["-sSL", "--max-time", "12", "--max-filesize", String(MAX_BYTES), "-A", UA, "-w", "\n%{url_effective}", url],
      { encoding: "buffer", maxBuffer: MAX_BYTES + 4096, windowsHide: true },
      (err, stdout) => {
        if (err || !stdout?.length) return resolve(null);
        const nl = stdout.lastIndexOf(0x0a);
        const effective = stdout.subarray(nl + 1).toString("utf8").trim() || url;
        const buf = stdout.subarray(0, nl);
        resolve(buf.length ? { buf, url: effective } : null);
      },
    );
  });
}

/** www.example.or.kr → m.example.or.kr (모바일 사이트에 앱 아이콘이 있는 경우가 많음) */
function mobileHome(homepage) {
  try {
    const u = new URL(homepage);
    const host = u.hostname.replace(/^www\./, "");
    return `${u.protocol}//m.${host}/`;
  } catch {
    return null;
  }
}

/** 웹앱 manifest·MS 타일 등 고해상도 아이콘 후보 */
async function extraCandidates(html, base) {
  const out = [];
  const tile = html.match(/<meta\b[^>]*name\s*=\s*["']msapplication-TileImage["'][^>]*>/i)?.[0];
  const tileUrl = tile?.match(/\bcontent\s*=\s*["']([^"']+)["']/i)?.[1];
  if (tileUrl && !/\.svg/i.test(tileUrl)) {
    try {
      out.push({ url: new URL(tileUrl, base).href, hint: 144 });
    } catch {}
  }
  const manifestTag = [...html.matchAll(/<link\b[^>]*>/gi)].map((m) => m[0]).find((t) => /rel\s*=\s*["']manifest["']/i.test(t));
  const manifestHref = manifestTag?.match(/\bhref\s*=\s*["']([^"']+)["']/i)?.[1];
  if (manifestHref) {
    try {
      const murl = new URL(manifestHref, base).href;
      const res = await get(murl);
      const json = res ? JSON.parse(res.buf.toString("utf8")) : null;
      for (const icon of json?.icons ?? []) {
        if (!icon?.src || /\.svg/i.test(icon.src)) continue;
        const size = parseInt(String(icon.sizes ?? "").split(/\s+/).pop() ?? "", 10);
        out.push({ url: new URL(icon.src, murl).href, hint: Number.isFinite(size) ? size : 192 });
      }
    } catch {}
  }
  return out;
}

function parseIconLinks(html, base) {
  const out = [];
  for (const m of html.matchAll(/<link\b[^>]*>/gi)) {
    const tag = m[0];
    const attr = (name) => tag.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']+)["']`, "i"))?.[1];
    const rel = (attr("rel") ?? "").toLowerCase();
    if (!rel.includes("icon") || rel.includes("mask-icon")) continue;
    const href = attr("href");
    if (!href || href.startsWith("data:")) continue;
    let url;
    try {
      url = new URL(href, base).href;
    } catch {
      continue;
    }
    if (/\.svg(\?|#|$)/i.test(url)) continue;
    const declared = parseInt(attr("sizes") ?? "", 10);
    out.push({ url, hint: Number.isFinite(declared) ? declared : rel.includes("apple-touch") ? 180 : 32 });
  }
  return out;
}

/* ---------------- 이미지 해석 ---------------- */

function sniff(buf) {
  if (buf.length < 12) return null;
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "png";
  if (buf[0] === 0xff && buf[1] === 0xd8) return "jpg";
  if (buf.toString("ascii", 0, 3) === "GIF") return "gif";
  if (buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") return "webp";
  if (buf.readUInt16LE(0) === 0 && buf.readUInt16LE(2) === 1) return "ico";
  return null;
}

/** ICO 안에서 가장 큰 이미지를 꺼내 sharp 입력으로 변환 (PNG 내장 또는 24/32bpp BMP) */
function decodeIco(buf) {
  const count = buf.readUInt16LE(4);
  let best = null;
  for (let i = 0; i < count; i++) {
    const o = 6 + i * 16;
    if (o + 16 > buf.length) break;
    const w = buf[o] || 256;
    const bpp = buf.readUInt16LE(o + 6);
    const size = buf.readUInt32LE(o + 8);
    const off = buf.readUInt32LE(o + 12);
    if (off + size > buf.length) continue;
    if (!best || w > best.w || (w === best.w && bpp > best.bpp)) best = { w, bpp, size, off };
  }
  if (!best) return null;
  const data = buf.subarray(best.off, best.off + best.size);
  if (sniff(data) === "png") return sharp(data);

  const headerSize = data.readUInt32LE(0);
  const w = data.readInt32LE(4);
  const h = Math.abs(data.readInt32LE(8)) / 2;
  const bpp = data.readUInt16LE(14);
  if (![1, 4, 8, 24, 32].includes(bpp) || w <= 0 || h <= 0 || w > 512) return null;
  // 1/4/8bpp 는 팔레트(BGRx) 사용
  const paletteCount = bpp <= 8 ? data.readUInt32LE(32) || 1 << bpp : 0;
  const paletteStart = headerSize;
  const pixStart = headerSize + paletteCount * 4;
  const rowSize = Math.floor((bpp * w + 31) / 32) * 4;
  const andRow = Math.floor((w + 31) / 32) * 4;
  const andStart = pixStart + rowSize * h;
  const px = Buffer.alloc(w * h * 4);
  let maxAlpha = 0;
  for (let y = 0; y < h; y++) {
    const src = pixStart + (h - 1 - y) * rowSize;
    for (let x = 0; x < w; x++) {
      const d = (y * w + x) * 4;
      if (bpp >= 24) {
        const s = src + (x * bpp) / 8;
        if (s + 3 > data.length) return null;
        px[d] = data[s + 2];
        px[d + 1] = data[s + 1];
        px[d + 2] = data[s];
        px[d + 3] = bpp === 32 ? data[s + 3] : 255;
      } else {
        const bit = x * bpp;
        const byte = data[src + (bit >> 3)];
        if (byte == null) return null;
        const idx = (byte >> (8 - bpp - (bit & 7))) & ((1 << bpp) - 1);
        const p = paletteStart + idx * 4;
        px[d] = data[p + 2];
        px[d + 1] = data[p + 1];
        px[d + 2] = data[p];
        px[d + 3] = 255;
      }
      maxAlpha = Math.max(maxAlpha, px[d + 3]);
    }
  }
  // 알파 채널이 없으면 AND 마스크로 투명도 적용
  if (bpp !== 32 || maxAlpha === 0) {
    for (let y = 0; y < h; y++) {
      const row = andStart + (h - 1 - y) * andRow;
      for (let x = 0; x < w; x++) {
        const byte = data[row + (x >> 3)];
        const transparent = byte != null && (byte >> (7 - (x & 7))) & 1;
        px[(y * w + x) * 4 + 3] = transparent ? 0 : 255;
      }
    }
  }
  return sharp(px, { raw: { width: w, height: h, channels: 4 } });
}

/** 홈페이지 헤더의 로고 <img> 후보 (src/class/id 에 logo 가 들어간 것, DOM 앞쪽 우선) */
function parseHeaderLogos(html, base) {
  const out = [];
  for (const m of html.matchAll(/<img\b[^>]*>/gi)) {
    const tag = m[0];
    const attr = (name) => tag.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']+)["']`, "i"))?.[1];
    const src = attr("src");
    if (!src || src.startsWith("data:") || /\.svg(\?|#|$)/i.test(src)) continue;
    const hay = `${src} ${attr("class") ?? ""} ${attr("id") ?? ""}`;
    if (!/logo/i.test(hay) || /footer|foot_|btm|bottom|family|sns|banner|partner|award|cert/i.test(hay)) continue;
    try {
      out.push(new URL(src, base).href);
    } catch {}
    if (out.length >= 3) break;
  }
  return out;
}

async function toImage(buf, minSize = MIN_SIZE) {
  const kind = sniff(buf);
  if (!kind) return null;
  const img = kind === "ico" ? decodeIco(buf) : sharp(buf, { animated: false });
  if (!img) return null;
  try {
    const rawPng = await img.png().toBuffer();
    // 거의 투명하거나 단색인 이미지는 제외
    const stats = await sharp(rawPng).stats();
    const alpha = stats.channels[3];
    if (alpha && alpha.mean < 8) return null;
    if (stats.channels.slice(0, 3).every((c) => c.stdev < 2)) return null;
    let png = rawPng;
    try {
      png = await sharp(rawPng).trim({ threshold: 10 }).png().toBuffer();
    } catch {
      /* trim 실패 시 원본 사용 */
    }
    const meta = await sharp(png).metadata();
    const rawMeta = await sharp(rawPng).metadata();
    const width = meta.width ?? 0;
    const height = meta.height ?? 0;
    const size = Math.min(width, height);
    if (size < minSize) return null;
    return {
      png,
      size,
      width,
      height,
      aspect: width / height,
      // 앱 아이콘처럼 원본이 정사각형인 경우를 위한 여백 유지본
      raw: { png: rawPng, size: Math.min(rawMeta.width ?? 0, rawMeta.height ?? 0), aspect: (rawMeta.width ?? 1) / (rawMeta.height ?? 1) },
    };
  } catch {
    return null;
  }
}

const isSquareish = (img) => img.aspect >= 0.66 && img.aspect <= 1.5;

/* ---------------- 기관별 처리 ---------------- */

/**
 * scripts/logo-sources.json — 기관 공식 CI 페이지 등에서 찾은 고해상도 로고
 * { "kdb": { "url": "https://...png", "kind": "symbol" | "wordmark" } } 또는 { "kdb": "https://..." }
 */
const OVERRIDES_PATH = join(ROOT, "scripts", "logo-sources.json");
const OVERRIDES = existsSync(OVERRIDES_PATH) ? JSON.parse(await readFile(OVERRIDES_PATH, "utf8")) : {};

async function fetchLogo({ id, homepage }) {
  const result = { id, ok: false, wide: false };
  const override = OVERRIDES[id];
  const overrideUrl = typeof override === "string" ? override : override?.url;

  let best = null;
  if (overrideUrl) {
    const res = await get(overrideUrl);
    let buf = res?.buf;
    // CI 페이지 이미지에 범례·버튼 등이 섞인 경우 심볼 영역만 잘라냄
    const crop = typeof override === "object" ? override.crop : null;
    if (buf && crop) {
      try {
        const meta = await sharp(buf, { animated: false }).metadata();
        const left = Math.max(0, Math.round(crop.left));
        const top = Math.max(0, Math.round(crop.top));
        const width = Math.min(Math.round(crop.width), (meta.width ?? 0) - left);
        const height = Math.min(Math.round(crop.height), (meta.height ?? 0) - top);
        if (width > 8 && height > 8) {
          buf = await sharp(buf, { animated: false }).extract({ left, top, width, height }).png().toBuffer();
        }
      } catch {
        /* 잘라내기 실패 시 원본 사용 */
      }
    }
    const img = buf ? await toImage(buf) : null;
    const kind = typeof override === "object" ? override.kind : null;
    if (img && isSquareish(img)) best = { ...img, source: overrideUrl };
    else if (img && kind !== "wordmark" && isSquareish(img.raw) && img.raw.size >= 64) {
      // 여백을 잘라내면 가로로 길어지는 정사각형 심볼·앱 아이콘은 원본 그대로 사용
      best = { png: img.raw.png, size: img.raw.size, source: overrideUrl };
    } else if (img && img.height >= 32) {
      // 가로형 로고타입: 상세 페이지 상단용으로 저장
      await mkdir(WIDE_DIR, { recursive: true });
      await sharp(img.png)
        .resize(480, 120, { fit: "inside", withoutEnlargement: true })
        .png({ compressionLevel: 9 })
        .toFile(join(WIDE_DIR, `${id}.png`));
      result.wide = true;
      result.wideSource = overrideUrl;
    }
  }

  if (!best || best.size < 128) {
    const candidates = [];
    const page = await get(homepage);
    const base = page?.url ?? homepage;
    const origin = new URL(base).origin;
    if (page) {
      const html = page.buf.toString("latin1");
      candidates.push(...parseIconLinks(html, base), ...(await extraCandidates(html, base)));
      // 헤더 로고(가로형)는 상세 페이지 상단용으로 저장
      if (!result.wide) {
        for (const url of parseHeaderLogos(html, base)) {
          const res = await get(url);
          const img = res ? await toImage(res.buf, 20) : null;
          if (!img) continue;
          if (isSquareish(img) && img.size >= 64) {
            candidates.push({ url, hint: img.size });
            break;
          }
          if (img.aspect > 1.5 && img.height >= 20) {
            await mkdir(WIDE_DIR, { recursive: true });
            await sharp(img.png)
              .resize(480, 120, { fit: "inside", withoutEnlargement: true })
              .png({ compressionLevel: 9 })
              .toFile(join(WIDE_DIR, `${id}.png`));
            result.wide = true;
            result.wideSource = url;
            break;
          }
        }
      }
    }
    const mobile = mobileHome(base);
    const mpage = mobile ? await get(mobile) : null;
    if (mpage) {
      const html = mpage.buf.toString("latin1");
      candidates.push(...parseIconLinks(html, mpage.url), ...(await extraCandidates(html, mpage.url)));
    }
    candidates.push({ url: `${origin}/apple-touch-icon-precomposed.png`, hint: 152 });
    candidates.push({ url: `${origin}/apple-touch-icon.png`, hint: 180 });
    candidates.push({ url: `${origin}/favicon.ico`, hint: 32 });
    candidates.push({
      url: `https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${encodeURIComponent(origin)}&size=128`,
      hint: 96,
    });

    const seen = new Set();
    const ordered = candidates.filter((c) => !seen.has(c.url) && seen.add(c.url)).sort((a, b) => b.hint - a.hint);
    for (const c of ordered.slice(0, 8)) {
      const res = await get(c.url);
      if (!res) continue;
      const img = await toImage(res.buf);
      if (img && isSquareish(img) && (!best || img.size > best.size)) best = { ...img, source: c.url };
      if (best && best.size >= 128) break;
    }
  }

  if (best) {
    await sharp(best.png)
      .resize(128, 128, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png({ compressionLevel: 9 })
      .toFile(join(OUT_DIR, `${id}.png`));
    Object.assign(result, { ok: true, size: best.size, source: best.source });
  }
  return result;
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const manifest = existsSync(MANIFEST) ? JSON.parse(await readFile(MANIFEST, "utf8")) : {};
  const wideManifest = existsSync(WIDE_MANIFEST) ? JSON.parse(await readFile(WIDE_MANIFEST, "utf8")) : {};
  const companies = (await loadCompanies()).filter((c) => {
    if (ONLY) return ONLY.has(c.id);
    return FORCE || !manifest[c.id] || (OVERRIDES[c.id] && !wideManifest[c.id] && !manifest[c.id]);
  });
  console.log(`대상 ${companies.length}곳`);

  const report = [];
  let cursor = 0;
  async function worker() {
    while (cursor < companies.length) {
      const c = companies[cursor++];
      const r = await fetchLogo(c);
      report.push(r);
      if (r.ok) manifest[c.id] = `/logos/${c.id}.png`;
      else if (FORCE) delete manifest[c.id];
      if (r.wide) wideManifest[c.id] = `/logos/wide/${c.id}.png`;
      console.log(
        `${r.ok ? `✓ ${c.id} (${r.size}px) ${r.source}` : `✗ ${c.id}`}${r.wide ? ` · 가로형 로고 ${r.wideSource}` : ""}`,
      );
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  const sortObj = (o) => Object.fromEntries(Object.entries(o).sort(([a], [b]) => a.localeCompare(b)));
  await writeFile(MANIFEST, `${JSON.stringify(sortObj(manifest), null, 2)}\n`);
  await writeFile(WIDE_MANIFEST, `${JSON.stringify(sortObj(wideManifest), null, 2)}\n`);
  const ok = report.filter((r) => r.ok).length;
  console.log(`완료: 아바타 ${ok}/${report.length}, 가로형 ${report.filter((r) => r.wide).length}`);
  const small = report.filter((r) => r.ok && r.size < 64).map((r) => `${r.id}(${r.size})`);
  if (small.length) console.log(`해상도 낮음(64px 미만): ${small.join(", ")}`);
  const missing = report.filter((r) => !r.ok).map((r) => r.id);
  if (missing.length) console.log(`아바타 없음: ${missing.join(",")}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
