// 사이트 아이콘(src/app/icon.svg)의 콩이로 앱 아이콘·스플래시를 만든다.
// 실행: mobile 폴더에서 `node scripts/make-icons.mjs` (sharp는 사이트 node_modules 것을 씀)
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const here = dirname(fileURLToPath(import.meta.url));
const out = (name) => join(here, "..", "assets", "images", name);
const site = readFileSync(join(here, "..", "..", "src", "app", "icon.svg"), "utf8");

const NAVY = "#1c1e54";
const defs = site.match(/<defs>.*?<\/defs>/s)[0];
// 배경 사각형 뒤의 콩이 그림 전부
const bean = site.slice(site.indexOf("/>", site.indexOf("<rect")) + 2, site.lastIndexOf("</svg>"));
// 콩 몸통 윤곽만 (모노크롬 아이콘용)
const body = bean.match(/<path d="M20\.6[^"]*"/)[0];

// 콩 중심(약 16, 16.2)을 기준으로 크기를 바꿔 가운데 둔다
const place = (inner, scale) =>
  `<g transform="translate(16 16) scale(${scale}) translate(-16 -16.2)">${inner}</g>`;
const svg = (inner, bg) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">${defs}${
    bg ? `<rect width="32" height="32" fill="${bg}"/>` : ""
  }${inner}</svg>`;

const render = (src, size, file) =>
  sharp(Buffer.from(src), { density: (72 * size) / 32 })
    .resize(size, size)
    .png()
    .toFile(out(file));

await Promise.all([
  // iOS: 모서리는 시스템이 깎으므로 꽉 찬 사각형
  render(svg(place(bean, 1.15), NAVY), 1024, "icon.png"),
  // Android 적응형 아이콘: 가운데 66% 안전 영역에 들어가게 작게
  render(svg(place(bean, 0.9)), 1024, "android-icon-foreground.png"),
  render(svg("", NAVY), 1024, "android-icon-background.png"),
  render(svg(place(`${body} fill="#fff"/>`, 0.9)), 1024, "android-icon-monochrome.png"),
  render(svg(place(bean, 1.6)), 512, "splash-icon.png"),
  render(site, 64, "favicon.png"),
]);
console.log("아이콘을 만들었어요: assets/images/");
