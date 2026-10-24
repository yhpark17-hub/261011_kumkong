import "server-only";
import { KEVIN_WARSH } from "./portraits/kevin-warsh";
import { SHIN_HYUNSONG } from "./portraits/shin-hyunsong";

/**
 * 인물 초상 부품 — 브리핑 썸네일 '직접 그린 그림'의 <kk-portrait …/>.
 * 굵은 테두리 + 한 단계 그늘의 카툰 초상 (480×560 상자, 얼굴이 크게 보이는 상반신).
 *   - who: 자주 나오는 인물 — 자유 이용 사진(퍼블릭 도메인·CC BY)을 바탕으로 만든 일러스트라 한눈에 알아봐요.
 *     원본 사진의 출처 표시가 썸네일 구석에 자동으로 붙어요 (look="cartoon" 이면 손으로 그린 카툰판)
 *   - 그 밖의 인물은 hair·hc·skin·glasses·eyes·suit… 로 조합 (누군지는 이름표로 알려 줘요)
 *   - face: smile(다문 미소) · speak(말하는 중) · serious(진지) · grin(이가 보이는 미소)
 * 사진을 따라 그리지 않고, 실제 로고·문장은 넣지 않아요. 표정은 늘 정중하게.
 */

type A = Record<string, string>;
const O = "#2a2230";

interface Skin {
  base: string;
  shade: string;
  line: string;
  blush: string;
}
const SKINS: Record<string, Skin> = {
  light: { base: "#f6d3b5", shade: "#e7b693", line: "#cf9572", blush: "#f4a08a" },
  medium: { base: "#f3cba8", shade: "#e4af8a", line: "#c98d6b", blush: "#f4a08a" },
  tan: { base: "#efbe98", shade: "#dca27d", line: "#c4835f", blush: "#f2967f" },
  deep: { base: "#b07c58", shade: "#966443", line: "#7a4e33", blush: "#c4705c" },
};

const isHex = (v: string | undefined): v is string => Boolean(v && /^#[0-9a-f]{6}$/i.test(v));
function mix(hex: string, to: string, t: number): string {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [a, b] = [p(hex), p(to)];
  return `#${a.map((v, i) => Math.round(v + (b[i] - v) * t).toString(16).padStart(2, "0")).join("")}`;
}
const darker = (h: string, t = 0.3) => mix(h, "#000000", t);
const lighter = (h: string, t = 0.3) => mix(h, "#ffffff", t);

/* ------------------------------------------------------------------ */
/* 몸 (정장·셔츠·넥타이·목) — 모든 초상이 같이 써요                           */
/* ------------------------------------------------------------------ */

function body(skin: Skin, suit: string, shirt: string, tie: string): string {
  const lapel = darker(suit, 0.18);
  return (
    `<path d="M-10 560C-6 524 22 500 82 486C132 474 168 466 188 454L240 520L292 454C312 466 348 474 398 486C458 500 486 524 490 560Z" fill="${suit}" stroke-width="5"/>` +
    `<path d="M188 454L240 522L292 454Z" fill="${shirt}" stroke-width="4"/>` +
    `<path d="M200 414L200 474Q240 494 280 474L280 414Z" fill="${skin.base}" stroke-width="5"/>` +
    `<path d="M201 424Q240 460 279 424L279 416L201 416Z" fill="${skin.shade}" stroke="none"/>` +
    `<path d="M194 450L240 500L218 520L180 466Z" fill="${lighter(shirt, 0.4)}" stroke-width="4"/>` +
    `<path d="M286 450L240 500L262 520L300 466Z" fill="${lighter(shirt, 0.4)}" stroke-width="4"/>` +
    (tie === "none"
      ? ""
      : `<path d="M227 496L253 496L249 518L231 518Z" fill="${darker(tie, 0.12)}" stroke-width="4"/><path d="M231 518L249 518L256 570L224 570Z" fill="${tie}" stroke-width="4"/>`) +
    `<path d="M188 454L240 522L162 502L174 484L152 476L178 464Z" fill="${lapel}" stroke-width="4"/>` +
    `<path d="M292 454L240 522L318 502L306 484L328 476L302 464Z" fill="${lapel}" stroke-width="4"/>`
  );
}

const ears = (skin: Skin, dy: number) =>
  `<g transform="translate(0 ${dy})">` +
  `<path d="M124 262C98 244 78 272 86 304C92 330 114 342 130 330" fill="${skin.base}" stroke-width="5"/>` +
  `<path d="M116 276C104 282 104 304 118 314" fill="none" stroke="${skin.line}" stroke-width="3.5"/>` +
  `<path d="M356 262C382 244 402 272 394 304C388 330 366 342 350 330" fill="${skin.base}" stroke-width="5"/>` +
  `<path d="M364 276C376 282 376 304 362 314" fill="none" stroke="${skin.line}" stroke-width="3.5"/>` +
  `</g>`;

/* ------------------------------------------------------------------ */
/* 기본 얼굴 (광대 넓고 갸름한 달걀형) — 신현송 초상과 조합형 인물이 같이 써요     */
/* ------------------------------------------------------------------ */

function oval(skin: Skin): string {
  return (
    `<path d="M120 240C114 286 124 338 150 384C172 422 206 444 240 444C274 444 308 422 330 384C356 338 366 286 360 240C354 182 310 152 240 152C170 152 126 182 120 240Z" fill="${skin.base}" stroke-width="5.5"/>` +
    `<path d="M354 256C358 302 350 346 330 382C312 414 288 434 262 442C294 414 314 380 326 340C334 312 344 284 354 256Z" fill="${skin.shade}" stroke="none"/>` +
    `<path d="M184 418C202 434 220 442 240 442C222 444 202 438 190 428Z" fill="${skin.shade}" stroke="none"/>` +
    `<path d="M146 312C156 334 170 348 190 356C176 346 164 334 156 316Z" fill="${mix(skin.base, skin.shade, 0.6)}" stroke="none"/>` +
    `<path d="M334 312C324 334 310 348 290 356C304 346 316 334 324 316Z" fill="${skin.shade}" stroke="none"/>` +
    `<ellipse cx="176" cy="326" rx="19" ry="9" fill="${skin.blush}" opacity=".24" stroke="none"/>` +
    `<ellipse cx="304" cy="326" rx="19" ry="9" fill="${skin.blush}" opacity=".24" stroke="none"/>`
  );
}

/** 이마 위 머리 그늘 (앞머리가 있는 머리) */
const fringeShade = (skin: Skin) =>
  `<path d="M128 256C140 228 160 210 188 202C218 196 256 198 294 206C324 214 346 230 358 250C342 238 320 230 298 226C262 220 222 218 190 222C166 228 146 240 128 256Z" fill="${skin.shade}" stroke="none"/>`;

const nose = (skin: Skin) =>
  `<path d="M246 290C248 312 252 330 258 342" fill="none" stroke="${skin.line}" stroke-width="3.2"/>` +
  `<path d="M218 342C210 350 214 360 226 360C232 365 248 365 254 360C266 360 270 350 262 342" fill="none" stroke-width="4"/>` +
  `<path d="M227 358C231 353 236 353 239 357M241 357C244 353 249 353 253 358" fill="none" stroke-width="2.8"/>` +
  `<path d="M234 346C238 343 244 343 248 346" fill="none" stroke="${lighter(skin.base, 0.5)}" stroke-width="3"/>` +
  `<path d="M210 366C205 372 204 380 207 388M270 366C275 372 276 380 273 388" fill="none" stroke="${mix(skin.shade, skin.line, 0.4)}" stroke-width="2.6"/>`;

const brows = (c: string) =>
  `<path d="M162 254C176 242 202 236 224 240C224 247 206 246 190 250C178 253 168 258 162 254Z" fill="${c}" stroke-width="2"/>` +
  `<path d="M318 254C304 242 278 236 256 240C256 247 274 246 290 250C302 253 312 258 318 254Z" fill="${c}" stroke-width="2"/>`;

/** 눈 — narrow: 가는 외꺼풀 / almond: 쌍꺼풀 있는 아몬드형 */
function eyes(skin: Skin, kind: "narrow" | "almond", iris: string): string {
  if (kind === "almond")
    return (
      `<path d="M158 272C170 258 198 256 214 270M322 272C310 258 282 256 266 270" fill="none" stroke="${skin.line}" stroke-width="2.6"/>` +
      `<path d="M160 282C170 269 196 267 210 280C198 288 174 290 160 282Z" fill="#ffffff" stroke-width="4"/><ellipse cx="186" cy="279" rx="9" ry="7.5" fill="#3a2a22" stroke="none"/><circle cx="189" cy="276" r="2.4" fill="#ffffff" stroke="none"/>` +
      `<path d="M320 282C310 269 284 267 270 280C282 288 306 290 320 282Z" fill="#ffffff" stroke-width="4"/><ellipse cx="294" cy="279" rx="9" ry="7.5" fill="#3a2a22" stroke="none"/><circle cx="297" cy="276" r="2.4" fill="#ffffff" stroke="none"/>` +
      `<path d="M166 294C178 299 194 299 206 292M314 294C302 299 286 299 274 292" fill="none" stroke="${skin.line}" stroke-width="2.6"/>`
    );
  return (
    `<path d="M162 286C174 272 200 270 216 280C202 288 178 290 162 286Z" fill="#ffffff" stroke-width="4"/><ellipse cx="190" cy="281" rx="8.5" ry="6" fill="${iris}" stroke="none"/><circle cx="193" cy="279" r="2" fill="#ffffff" stroke="none"/>` +
    `<path d="M318 286C306 272 280 270 264 280C278 288 302 290 318 286Z" fill="#ffffff" stroke-width="4"/><ellipse cx="290" cy="281" rx="8.5" ry="6" fill="${iris}" stroke="none"/><circle cx="293" cy="279" r="2" fill="#ffffff" stroke="none"/>` +
    `<path d="M174 298C186 302 200 301 210 296M306 298C294 302 280 301 270 296" fill="none" stroke="${mix(skin.shade, skin.line, 0.3)}" stroke-width="2.4"/>`
  );
}

/** 입 (기본 얼굴, y≈386) */
function mouth(face: string, skin: Skin): string {
  switch (face) {
    case "speak":
      return (
        // 차분하게 말하는 입 — 작게 벌리고 윗니만 살짝
        `<path d="M216 384C228 390 252 390 264 384C261 396 252 402 240 402C228 402 219 396 216 384Z" fill="#6d2b2c" stroke-width="4"/>` +
        `<path d="M219 386C230 390 250 390 261 386C258 391 250 393 240 393C230 393 222 391 219 386Z" fill="#ffffff" stroke="none"/>` +
        `<path d="M228 410C234 412 246 412 252 410" fill="none" stroke="${skin.line}" stroke-width="3"/>`
      );
    case "serious":
      return `<path d="M212 390C228 393 252 393 268 390" fill="none" stroke-width="4.2"/><path d="M226 402C234 405 246 405 254 402" fill="none" stroke="${skin.line}" stroke-width="3"/>`;
    case "grin":
      return (
        `<path d="M190 382C210 393 270 393 290 382C284 402 264 414 240 414C216 414 196 402 190 382Z" fill="#6d2b2c" stroke-width="4.2"/>` +
        `<path d="M195 385C214 395 266 395 285 385C281 396 270 401 240 401C210 401 199 396 195 385Z" fill="#ffffff" stroke="none"/>` +
        `<path d="M222 393V401M240 394V402M258 393V401" fill="none" stroke="#dcdcdc" stroke-width="2"/>`
      );
    default:
      return (
        `<path d="M208 386C224 397 256 397 272 386C262 400 252 404 240 404C228 404 218 400 208 386Z" fill="#d98a78" stroke="none"/>` +
        `<path d="M206 385C222 396 258 396 274 385" fill="none" stroke-width="4.2"/><path d="M206 385L202 381M274 385L278 381" fill="none" stroke-width="3"/>`
      );
  }
}

/* ------------------------------------------------------------------ */
/* 머리 모양 (기본 얼굴에 맞춘 것)                                         */
/* ------------------------------------------------------------------ */

/** 숱 많은 머리를 옆 가르마에서 오른쪽으로 넘겨 이마를 가로지르는 앞머리 (신현송형) */
function hairSweep(id: string, hc: string): string {
  const top = lighter(hc, 0.45);
  const line = darker(hc, 0.32);
  const shade = darker(hc, 0.18);
  return (
    `<defs><linearGradient id="${id}h" x1="0" y1="0" x2="0.3" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${hc}"/></linearGradient></defs>` +
    `<path d="M122 288C106 268 98 240 100 210C96 174 106 136 132 108C150 88 172 74 198 64C222 54 248 50 274 54C306 58 336 74 358 100C378 124 390 154 390 188C392 218 384 246 370 270C366 278 362 284 356 290C352 268 346 252 336 238C324 224 308 212 292 206Q298 218 292 230Q282 214 268 206C254 200 240 198 226 198Q232 210 224 224Q218 208 204 204C190 204 176 208 164 214Q168 224 160 236Q156 224 148 224C140 234 132 246 128 258C126 272 124 280 122 288Z" fill="url(#${id}h)" stroke-width="5.5"/>` +
    `<path d="M150 226C176 206 214 196 252 198C292 202 330 220 352 256C334 236 306 224 276 220C238 214 198 216 160 234Z" fill="${shade}" opacity=".55" stroke="none"/>` +
    `<path d="M372 196C378 230 372 258 358 282C356 264 352 250 344 240C358 228 366 214 372 196Z" fill="${shade}" opacity=".6" stroke="none"/>` +
    `<path d="M104 214C104 240 112 262 124 280C122 262 124 248 130 236C118 228 110 222 104 214Z" fill="${shade}" opacity=".6" stroke="none"/>` +
    `<path d="M206 76C252 70 300 88 330 114M198 106C240 104 286 122 314 148" fill="none" stroke="${lighter(hc, 0.75)}" stroke-width="7" opacity=".75"/>` +
    `<path d="M196 66C246 58 306 76 344 112M188 94C240 88 300 108 338 148M182 124C232 122 292 144 326 188M178 158C222 160 270 180 296 216M176 192C204 194 222 204 230 214" fill="none" stroke="${line}" stroke-width="2.8"/>` +
    `<path d="M182 70C160 86 142 110 132 140M168 88C146 110 132 142 126 178M150 114C132 142 124 178 124 216" fill="none" stroke="${line}" stroke-width="2.8"/>` +
    `<path d="M186 64C176 90 170 120 168 152" fill="none" stroke="${lighter(hc, 0.85)}" stroke-width="3"/>`
  );
}

/** 단정한 옆 가르마, 이마가 드러나는 짧은 머리 (워시형) — dy 만큼 아래로 */
function hairParted(id: string, hc: string, dy: number, temples = ""): string {
  return (
    `<g transform="translate(0 ${dy})">` +
    `<defs><linearGradient id="${id}p" x1="0" y1="0" x2="0.4" y2="1"><stop offset="0" stop-color="${lighter(hc, 0.14)}"/><stop offset="1" stop-color="${darker(hc, 0.2)}"/></linearGradient></defs>` +
    `<path d="M126 226C116 200 112 164 120 132C130 96 160 68 204 56C244 46 290 50 322 68C352 86 370 116 372 152C374 182 368 206 358 226C354 208 350 194 344 182C332 164 314 152 292 146C268 140 244 138 222 140C210 136 198 128 190 118C180 130 168 144 156 160C144 176 136 192 132 206C130 214 128 220 126 226Z" fill="url(#${id}p)" stroke-width="5.5"/>` +
    `<path d="M196 120C214 128 240 132 268 134C300 138 330 152 350 176C330 150 302 136 270 130C244 126 218 124 196 120Z" fill="${darker(hc, 0.35)}" stroke="none"/>` +
    `<path d="M188 70C232 56 290 62 332 92M184 96C230 84 290 92 344 128M192 118C236 112 292 120 346 156" fill="none" stroke="${lighter(hc, 0.28)}" stroke-width="3"/>` +
    `<path d="M200 64C236 56 280 62 312 80" fill="none" stroke="${lighter(hc, 0.42)}" stroke-width="5" opacity=".7"/>` +
    `<path d="M184 64C176 84 182 104 190 118" fill="none" stroke="${lighter(hc, 0.35)}" stroke-width="3"/>` +
    `<path d="M176 68C156 88 142 112 134 140M160 92C142 116 132 144 130 176" fill="none" stroke="${lighter(hc, 0.2)}" stroke-width="3"/>` +
    (temples ? `<path d="M128 196C128 208 128 218 126 226M356 198C358 208 358 218 358 226" fill="none" stroke="${temples}" stroke-width="3.2"/>` : "") +
    `</g>`
  );
}

/** 짧게 깎은 머리 */
function hairShort(hc: string): string {
  return (
    `<path d="M120 250C110 214 114 172 136 140C160 104 200 86 240 86C282 86 320 104 344 140C366 172 370 214 360 250C354 230 346 212 334 200C316 184 282 176 240 176C198 176 164 184 146 200C134 212 126 230 120 250Z" fill="${hc}" stroke-width="5.5"/>` +
    `<path d="M160 120C196 100 284 100 320 120M150 150C196 132 284 132 330 150" fill="none" stroke="${lighter(hc, 0.3)}" stroke-width="3"/>`
  );
}

/** 대머리 (옆머리만) */
function hairBald(hc: string, skin: Skin): string {
  return (
    `<path d="M122 286C110 262 108 236 116 214C122 230 130 242 140 250C134 262 128 274 122 286Z" fill="${hc}" stroke-width="4"/>` +
    `<path d="M358 286C370 262 372 236 364 214C358 230 350 242 340 250C346 262 352 274 358 286Z" fill="${hc}" stroke-width="4"/>` +
    `<ellipse cx="206" cy="182" rx="30" ry="12" fill="${lighter(skin.base, 0.6)}" opacity=".8" stroke="none" transform="rotate(-14 206 182)"/>`
  );
}

/** 단발 (뒷머리 + 앞머리) — back 은 얼굴 뒤에, front 는 얼굴 위에 */
function hairBob(id: string, hc: string, long: boolean): { back: string; front: string } {
  const end = long ? 520 : 400;
  return {
    back: `<path d="M100 220C92 140 150 78 240 78C330 78 388 140 380 220L390 ${end}Q340 ${end + 18} 330 ${end - 10}L340 300H140L150 ${end - 10}Q140 ${end + 18} 90 ${end}Z" fill="${darker(hc, 0.1)}" stroke-width="5.5"/>`,
    front:
      `<defs><linearGradient id="${id}b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${lighter(hc, 0.2)}"/><stop offset="1" stop-color="${hc}"/></linearGradient></defs>` +
      `<path d="M118 268C104 200 136 120 210 102C276 88 346 116 362 196C366 216 364 240 360 262C350 238 336 222 318 210C300 200 280 192 262 176C244 196 210 214 176 224C156 232 136 248 118 268Z" fill="url(#${id}b)" stroke-width="5.5"/>` +
      `<path d="M262 178C282 150 318 138 346 156M200 120C236 108 290 112 330 138" fill="none" stroke="${lighter(hc, 0.3)}" stroke-width="3"/>`,
  };
}

/** 안경 (기본 얼굴 눈 높이 y≈281) */
function glasses(kind: string, c: string): string {
  if (kind === "round")
    return `<circle cx="190" cy="282" r="30" fill="#ffffff" fill-opacity=".14" stroke="${c}" stroke-width="5"/><circle cx="290" cy="282" r="30" fill="#ffffff" fill-opacity=".14" stroke="${c}" stroke-width="5"/><path d="M220 280Q240 270 260 280M160 276L124 268M320 276L356 268" fill="none" stroke="${c}" stroke-width="5"/>`;
  if (kind === "rect" || kind === "rim")
    return (
      `<rect x="150" y="260" width="80" height="46" rx="12" fill="#ffffff" fill-opacity=".14" stroke="${c}" stroke-width="${kind === "rim" ? 3 : 5}"/><rect x="250" y="260" width="80" height="46" rx="12" fill="#ffffff" fill-opacity=".14" stroke="${c}" stroke-width="${kind === "rim" ? 3 : 5}"/>` +
      (kind === "rim" ? `<path d="M152 264Q190 254 228 264M252 264Q290 254 328 264" fill="none" stroke="${c}" stroke-width="8"/>` : "") +
      `<path d="M230 276Q240 270 250 276M150 272L124 266M330 272L356 266" fill="none" stroke="${c}" stroke-width="5"/>`
    );
  return "";
}

/* ------------------------------------------------------------------ */
/* 자주 나오는 인물 — 공개 사진의 생김새를 보고 따로 그린 것                   */
/* ------------------------------------------------------------------ */

/** 신현송 한국은행 총재 — 숱 많은 은회색 머리를 옆 가르마로 넘긴 앞머리, 가는 눈매, 넓은 광대, 다문 미소, 짙은 회색 정장 */
function shinHyunsong(id: string, face: string): string {
  const skin = SKINS.medium;
  return (
    body(skin, "#33373f", "#e3ecf7", "#26335f") +
    ears(skin, 0) +
    oval(skin) +
    fringeShade(skin) +
    hairSweep(id, "#a4a9b1") +
    brows("#3c383d") +
    eyes(skin, "narrow", O) +
    nose(skin) +
    mouth(face || "smile", skin)
  );
}

/** 케빈 워시 연준 의장 — 짙은 갈색 머리 옆 가르마, 길쭉한 얼굴과 긴 코, 짙은 눈썹, 이가 보이는 환한 미소와 깊은 웃음 주름, 슬레이트 회색 정장 */
function kevinWarsh(id: string, face: string): string {
  const skin = SKINS.tan;
  const f = face || "grin";
  const mouthW: Record<string, string> = {
    grin:
      `<path d="M186 336C208 346 272 346 294 336C288 354 266 364 240 364C214 364 192 354 186 336Z" fill="#6d2b2c" stroke-width="4.2"/>` +
      `<path d="M191 339C212 348 268 348 289 339C285 349 273 353 240 353C207 353 195 349 191 339Z" fill="#ffffff" stroke="none"/>` +
      `<path d="M222 346V353M240 347V354M258 346V353" fill="none" stroke="#dcdcdc" stroke-width="2"/><path d="M214 374C228 380 252 380 266 374" fill="none" stroke="${skin.line}" stroke-width="3"/>`,
    smile: `<path d="M192 340C212 352 268 352 288 340" fill="none" stroke-width="4.2"/><path d="M192 340L188 335M288 340L292 335" fill="none" stroke-width="3"/><path d="M218 360C230 364 250 364 262 360" fill="none" stroke="${skin.line}" stroke-width="3"/>`,
    speak:
      `<path d="M198 336C214 344 266 344 282 336C278 356 262 368 240 368C218 368 202 356 198 336Z" fill="#6d2b2c" stroke-width="4.2"/>` +
      `<path d="M203 339C218 346 262 346 277 339C273 347 262 350 240 350C218 350 207 347 203 339Z" fill="#ffffff" stroke="none"/>`,
    serious: `<path d="M202 346C220 350 260 350 278 346" fill="none" stroke-width="4.2"/><path d="M220 360C230 363 250 363 260 360" fill="none" stroke="${skin.line}" stroke-width="3"/>`,
  };
  return (
    body(skin, "#5a6170", "#f7f8fb", "#23336a") +
    `<g transform="translate(0 -22)">${ears(skin, 0)}</g>` +
    `<path d="M128 200C120 240 120 290 134 336C146 380 170 420 204 440C220 450 260 450 276 440C310 420 334 380 346 336C360 290 362 240 354 200C344 150 300 122 240 122C180 122 136 150 128 200Z" fill="${skin.base}" stroke-width="5.5"/>` +
    `<path d="M350 214C356 262 352 306 340 344C326 388 302 420 272 440C300 410 318 372 328 330C336 296 342 256 350 214Z" fill="${skin.shade}" stroke="none"/>` +
    `<ellipse cx="178" cy="292" rx="24" ry="14" fill="${skin.blush}" opacity=".28" stroke="none"/><ellipse cx="302" cy="292" rx="24" ry="14" fill="${skin.blush}" opacity=".28" stroke="none"/>` +
    `<path d="M132 176C152 156 186 146 222 144C262 144 304 150 346 180C344 164 338 152 330 144C314 134 288 130 258 130C220 130 180 140 150 156C142 162 136 168 132 176Z" fill="${skin.shade}" stroke="none"/>` +
    hairParted(id, "#3b302b", 0, "#857b76") +
    `<path d="M146 208C160 194 188 190 214 196C214 205 190 203 172 207C160 210 152 214 146 208Z" fill="#2f2723" stroke-width="2"/>` +
    `<path d="M334 208C320 194 292 190 266 196C266 205 290 203 308 207C320 210 328 214 334 208Z" fill="#2f2723" stroke-width="2"/>` +
    `<g transform="translate(0 -52)">${eyes(skin, "almond", O)}</g>` +
    `<path d="M156 228L146 223M156 236L146 238M324 228L334 223M324 236L334 238" fill="none" stroke="${skin.line}" stroke-width="2.6"/>` +
    `<path d="M230 232C228 258 226 278 222 294" fill="none" stroke="${skin.line}" stroke-width="3.2"/>` +
    `<path d="M212 296C204 305 208 317 220 317C226 323 254 323 260 317C272 317 276 305 268 296" fill="none" stroke-width="4"/>` +
    `<path d="M222 315C226 310 232 310 235 314M245 314C248 310 254 310 258 315" fill="none" stroke-width="2.8"/>` +
    `<path d="M240 284C244 290 246 298 244 304" fill="none" stroke="${lighter(skin.base, 0.5)}" stroke-width="4"/>` +
    (f === "grin" || f === "smile" ? `<path d="M206 306C190 320 182 338 186 358M274 306C290 320 298 338 294 358" fill="none" stroke="${skin.line}" stroke-width="3.6"/>` : "") +
    (mouthW[f] ?? mouthW.grin)
  );
}

const PRESETS: Record<string, (id: string, face: string) => string> = {
  "shin-hyunsong": shinHyunsong,
  "kevin-warsh": kevinWarsh,
};
export const PORTRAIT_PRESETS = Object.keys(PRESETS);

/* ------------------------------------------------------------------ */

/** 조합형 인물 — 기본 얼굴 + 머리·눈·안경·옷 */
function custom(a: A, id: string): string {
  const skin = SKINS[a.skin ?? ""] ?? SKINS.medium;
  const hc = isHex(a.hc) ? a.hc : "#2b2522";
  const hair = a.hair ?? "parted";
  const suit = isHex(a.suit) ? a.suit : "#2f3542";
  const shirt = isHex(a.shirt) ? a.shirt : "#f4f7fb";
  const tie = a.tie === "none" ? "none" : isHex(a.tie) ? a.tie : "#8e2a35";
  const face = a.face ?? "smile";
  const bob = hair === "bob" || hair === "long" ? hairBob(id, hc, hair === "long") : null;
  const hairSvg =
    hair === "sweep"
      ? fringeShade(skin) + hairSweep(id, hc)
      : hair === "short"
        ? hairShort(hc)
        : hair === "bald"
          ? hairBald(isHex(a.hc) ? a.hc : "#8f8a86", skin)
          : bob
            ? bob.front
            : `<path d="M132 206C152 186 186 176 222 174C262 174 304 180 346 210C344 194 338 182 330 174C314 164 288 160 258 160C220 160 180 170 150 186C142 192 136 198 132 206Z" fill="${skin.shade}" stroke="none"/>` +
              hairParted(id, hc, 30, a.temples === "gray" ? "#9a948f" : "");
  const brow = isHex(a.brow) ? a.brow : hair === "bald" ? "#6b6460" : darker(hc, 0.05);
  return (
    (bob ? bob.back : "") +
    body(skin, suit, shirt, tie) +
    ears(skin, 0) +
    oval(skin) +
    hairSvg +
    brows(brow) +
    eyes(skin, a.eyes === "almond" ? "almond" : "narrow", O) +
    nose(skin) +
    mouth(face, skin) +
    glasses(a.glasses ?? "none", isHex(a.gc) ? a.gc : O)
  );
}

/** 자유 이용 사진을 밑그림 삼아 손으로 짠 일러스트 (scripts/portraits — 참고 사진 출처 표시) */
const PHOTO: Record<string, { svg: string; credit: string }> = {
  "shin-hyunsong": SHIN_HYUNSONG,
  "kevin-warsh": KEVIN_WARSH,
};
const usesPhoto = (a: A) => Boolean(a.who && PHOTO[a.who] && a.look !== "cartoon");

/** 이 초상이 쓰면 썸네일에 붙일 원본 사진 출처 (없으면 null) */
export function portraitCredit(a: A): string | null {
  return usesPhoto(a) ? PHOTO[a.who].credit : null;
}

/** <kk-portrait …/> 안쪽 그림 (480×560 상자, 테두리 색·두께 공통) */
export function portraitSvg(a: A, id: string): string {
  if (usesPhoto(a)) return PHOTO[a.who].svg;
  const preset = a.who ? PRESETS[a.who] : undefined;
  const inner = preset ? preset(id, a.face ?? "") : custom(a, id);
  return `<g stroke="${O}" stroke-linejoin="round" stroke-linecap="round">${inner}</g>`;
}
