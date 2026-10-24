// 신현송 한국은행 총재 초상 — 원본 사진(960×1200) 위에서 잰 좌표로 짠 벡터 일러스트
// 사용: node scripts/portraits/shin-hyunsong.mjs  (사진 겹침 확인은 scripts/portraits/photos/shin-hyunsong.jpg 가 있을 때)
// 그리는 순서: 정장·셔츠·넥타이 → 목 → 귀 → 얼굴(바탕 그라데이션 → 흐린 그늘 → 흐린 빛 → 홍조) → 머리(결) → 이목구비 → 윤곽선
import { blurDefs, build, ell, flow, rng, scallop, strand } from "./lib.mjs";

const ID = "shn";
const INK = "#2b2018";
const R = rng(20261024);
const SH = "#c27f5f"; // 피부 그늘
const SH2 = "#a9654b"; // 깊은 그늘
const HI = "#fff4e8"; // 피부 빛

const out = [];
const P = (s) => out.push(s);
const blur = (s, inner, op = 1) => `<g filter="url(#${ID}-b${s})"${op < 1 ? ` opacity="${op}"` : ""}>${inner}</g>`;
const clip = (name, inner) => `<g clip-path="url(#${ID}-c-${name})">${inner}</g>`;
const path = (d, fill, extra = "") => `<path d="${d}" fill="${fill}"${extra}/>`;
const line = (d, color, w, op = 1) =>
  `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"${op < 1 ? ` opacity="${op}"` : ""}/>`;

// ── 모양 (사진에서 잰 좌표)
const outerPts = [
  [190, 514], [170, 488, 0.1], [150, 448, 0.12], [144, 392, 0.1],
  [148, 334, 0.12], [166, 278, 0.12], [196, 228, 0.12], [240, 186, 0.12], [296, 152, 0.12],
  [362, 128, 0.1], [436, 114, 0.1], [512, 114, 0.1], [580, 126, 0.1], [636, 150, 0.12],
  [684, 190, 0.12], [718, 246, 0.12], [734, 308, 0.1], [739, 372, 0.1], [736, 432, 0.1], [726, 486, 0.1], [712, 522, 0.08],
];
const hairOuter = `M252 506Q248 516 238 524Q232 510 216 510Q206 520 190 514${scallop(outerPts, 0.14)}`;
// 이마 위 앞머리: 오른쪽 관자놀이 → 왼쪽으로 빗어 내린 뭉치 끝
const hairline =
  "C704 520 698 518 694 510C692 470 688 430 680 392C674 364 666 342 654 324" +
  "Q640 304 612 310Q606 298 598 290Q560 286 520 300Q516 288 508 280Q470 278 436 302Q430 290 424 282Q380 284 346 316Q342 304 336 296Q312 306 300 334Q296 326 294 318" +
  "C282 336 270 370 264 404C258 440 254 476 252 506Z";
const hair = hairOuter + hairline;
const face =
  "M254 400C248 460 246 530 247 590C248 630 248 660 252 684C262 726 278 764 302 796C326 826 370 848 432 858C460 862 494 864 516 862C556 858 598 838 624 808C646 780 660 732 670 690C682 646 692 608 696 566C700 516 698 456 692 400C680 330 640 282 560 270C500 262 420 262 360 272C300 286 262 330 254 400Z";
const jaw = "M252 684C262 726 278 764 302 796C326 826 370 848 432 858C460 862 494 864 516 862C556 858 598 838 624 808C646 780 660 732 670 690C682 646 692 608 696 566";
const neck = "M324 720L320 830L497 982L622 820L620 720Z";
const earL = "M252 500C232 486 204 486 190 506C176 530 182 580 196 618C208 650 228 670 252 678Z";
const earR = "M690 498C706 508 710 544 706 584C704 606 700 622 692 632Z";
const suitL = "M-20 1200L-20 958C60 930 160 904 230 886C266 876 288 860 300 840L304 1200Z";
const suitR = "M644 832C662 858 700 874 744 886C830 908 910 936 980 970L980 1200L650 1200Z";
const tieKnot = "M450 984Q497 974 544 984L532 1054Q497 1062 462 1054Z";
const tieBlade = "M462 1054Q497 1062 532 1054L558 1200L436 1200Z";
const eyeL = "M346 503Q372 488 400 489Q428 491 448 505Q422 511 400 512Q370 511 346 503Z";
const eyeR = "M535 503Q558 487 585 486Q612 488 635 497Q612 506 588 508Q560 508 535 503Z";

P(`<defs>${blurDefs(ID, [1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 14, 16, 18])}
<radialGradient id="${ID}-skin" gradientUnits="userSpaceOnUse" cx="570" cy="500" r="460"><stop offset="0" stop-color="#fad9bc"/><stop offset=".55" stop-color="#f0bf99"/><stop offset="1" stop-color="#d99a75"/></radialGradient>
<linearGradient id="${ID}-neck" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d99a76"/><stop offset="1" stop-color="#ebb690"/></linearGradient>
<linearGradient id="${ID}-ear" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#e3a582"/><stop offset="1" stop-color="#f1c09c"/></linearGradient>
<linearGradient id="${ID}-hair" gradientUnits="userSpaceOnUse" x1="0" y1="110" x2="0" y2="520"><stop offset="0" stop-color="#e9ecf0"/><stop offset=".45" stop-color="#c3c8d0"/><stop offset="1" stop-color="#959ba6"/></linearGradient>
<linearGradient id="${ID}-suit" gradientUnits="userSpaceOnUse" x1="0" y1="830" x2="0" y2="1200"><stop offset="0" stop-color="#3b414f"/><stop offset="1" stop-color="#252932"/></linearGradient>
<linearGradient id="${ID}-tie" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3a4886"/><stop offset="1" stop-color="#1f2754"/></linearGradient>
<linearGradient id="${ID}-lipU" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c47b6a"/><stop offset="1" stop-color="#a65b4d"/></linearGradient>
<linearGradient id="${ID}-lipL" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b9695a"/><stop offset=".45" stop-color="#d4907d"/><stop offset="1" stop-color="#c98270"/></linearGradient>
<radialGradient id="${ID}-iris"><stop offset="0" stop-color="#7f5643"/><stop offset=".7" stop-color="#3d261b"/><stop offset="1" stop-color="#1b110c"/></radialGradient>
<linearGradient id="${ID}-collar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#e6ecf4"/></linearGradient>
<clipPath id="${ID}-c-face"><path d="${face}"/></clipPath>
<clipPath id="${ID}-c-hair"><path d="${hair}"/></clipPath>
<clipPath id="${ID}-c-neck"><path d="${neck}"/></clipPath>
<clipPath id="${ID}-c-earL"><path d="${earL}"/></clipPath>
<clipPath id="${ID}-c-suit"><path d="${suitL}"/><path d="${suitR}"/></clipPath>
<clipPath id="${ID}-c-shirt"><path d="M298 836L300 1200L648 1200L644 830Z"/></clipPath>
<clipPath id="${ID}-c-tie"><path d="${tieBlade}"/></clipPath>
<clipPath id="${ID}-c-el"><path d="${eyeL}"/></clipPath>
<clipPath id="${ID}-c-er"><path d="${eyeR}"/></clipPath>
</defs>`);

// ── 정장
P(path(suitL, `url(#${ID}-suit)`));
P(path(suitR, `url(#${ID}-suit)`));
P(clip("suit",
  blur(14, line("M300 856L240 1012L272 1042L236 1200M646 850L706 1012L674 1042L710 1200", "#16181e", 22), 0.55) +
  blur(18, ell(140, 940, 140, 34, "#56607a", 0.5, -12) + ell(830, 935, 140, 34, "#56607a", 0.5, 14)) +
  line("M296 870L246 1006M650 866L700 1006", "#59627a", 3, 0.8) +
  line("M300 856L240 1012L272 1042L236 1200M646 850L706 1012L674 1042L710 1200", "#1a1d24", 5) +
  line("M120 1200C130 1110 156 1036 196 990M840 1200C830 1110 806 1040 770 996", "#454c5c", 5, 0.8)));
P(line(suitL, INK, 6.5) + line(suitR, INK, 6.5));
// ── 셔츠
P(path("M298 836L300 1200L648 1200L644 830Z", "#f6f8fc"));
P(clip("shirt", blur(10, line("M330 1010L322 1200M612 1000L624 1200", "#c9d3e2", 18) + ell(470, 1030, 140, 40, "#c9d3e2", 0.7))));
P(line("M298 836L300 1200M648 1200L644 830", INK, 5));
// ── 목
P(path(neck, `url(#${ID}-neck)`));
P(clip("neck", blur(18, ell(470, 800, 190, 70, SH2, 0.85)) + blur(10, ell(470, 960, 60, 30, SH, 0.5))));
P(line(neck, INK, 5));
// ── 넥타이 (잔무늬)
P(path(tieBlade, `url(#${ID}-tie)`));
let dots = "";
for (let y = 1066; y < 1200; y += 16) for (let x = 440 + ((y / 16) % 2) * 8; x < 560; x += 16) dots += `<circle cx="${x}" cy="${y}" r="2.6" fill="#5566a6" opacity=".55"/>`;
P(clip("tie", dots + blur(5, line("M500 1066L516 1200", "#5c6cb0", 8, 0.45))));
P(path(tieKnot, `url(#${ID}-tie)`));
P(blur(3, ell(510, 1002, 18, 8, "#6a7ac0", 0.5)));
P(line(tieBlade, INK, 5) + line(tieKnot, INK, 5));
// ── 셔츠 깃
const wingL = "M300 828L322 834L497 980L452 1020L424 1108Q360 1046 300 1004Z";
const wingR = "M644 822L620 828L497 980L544 1020L590 1094Q622 1046 646 1004Z";
P(path(wingL, `url(#${ID}-collar)`) + path(wingR, `url(#${ID}-collar)`));
P(blur(6, line("M318 900L430 1010M624 896L560 990", "#cfd8e6", 10)));
P(line(wingL, INK, 5) + line(wingR, INK, 5));

// ── 귀
P(path(earL, `url(#${ID}-ear)`));
P(clip("earL",
  blur(5, path("M236 520C214 518 204 556 212 596C218 620 228 634 240 640C232 610 230 570 236 520Z", SH2, ` opacity=".85"`)) +
  blur(8, ell(208, 566, 18, 44, "#ea8a72", 0.3))));
P(strand([238, 514], [200, 540], [214, 604], 6, "#94553e", 0.95) + strand([222, 600], [244, 616], [238, 642], 5, "#94553e", 0.9));
P(line(earL, INK, 6));
P(path(earR, "#e4a984") + line(earR, INK, 6));

// ── 얼굴
P(path(face, `url(#${ID}-skin)`));
P(clip("face",
  // 그늘 (빛은 오른쪽 위에서)
  blur(14, path("M250 420C244 520 244 620 256 700C270 770 310 820 380 850L420 852C362 812 322 762 306 692C292 622 290 522 300 420Z", SH), 0.65) +
  blur(10, path("M262 360C290 316 340 296 430 292C520 290 610 296 660 330C676 350 684 380 688 410L672 404C652 364 612 340 540 334C460 330 360 334 310 350C290 360 274 376 266 396Z", SH2), 0.6) +
  blur(10, ell(398, 482, 72, 26, SH) + ell(586, 478, 68, 24, SH), 0.38) +
  blur(8, ell(458, 474, 16, 30, SH2) + ell(524, 472, 14, 28, SH2), 0.4) +
  blur(6, path("M468 470C462 520 452 570 440 612L458 618C468 572 476 522 482 470Z", SH2), 0.55) +
  blur(6, path("M532 520C540 560 556 590 566 612L556 616C546 592 534 560 528 520Z", SH), 0.3) +
  blur(6, ell(505, 668, 58, 11, SH2) + ell(440, 636, 14, 22, SH2) + ell(566, 632, 12, 20, SH2), 0.5) +
  blur(18, ell(330, 694, 44, 84, SH, 1, -15) + ell(662, 690, 26, 64, SH, 1, 15), 0.45) +
  blur(6, line("M444 664Q422 692 418 728M572 656Q596 682 604 716", SH2, 16), 0.45) +
  blur(8, line("M456 664Q440 690 436 720M562 656Q580 680 586 708", HI, 10), 0.3) +
  blur(7, ell(502, 762, 60, 12, SH2), 0.45) +
  blur(10, path("M300 790C340 838 420 860 500 862C580 860 620 836 646 796L650 840C610 880 560 890 500 890C420 890 340 870 300 830Z", SH2), 0.6) +
  blur(10, path("M702 560C692 650 672 740 638 792L624 786C652 742 670 652 678 560Z", SH), 0.35) +
  // 빛
  blur(14, ell(510, 372, 110, 30, HI), 0.35) +
  blur(5, line("M492 476Q498 540 508 596", HI, 12), 0.55) +
  blur(3, ell(524, 614, 16, 10, HI), 0.8) +
  blur(10, ell(612, 566, 52, 22, HI, 1, -10), 0.5) +
  blur(10, ell(368, 572, 40, 16, HI, 1, 10), 0.28) +
  blur(6, ell(505, 818, 36, 14, HI), 0.45) +
  blur(3, ell(502, 700, 30, 5, HI), 0.4) +
  blur(8, ell(392, 548, 46, 9, HI) + ell(586, 542, 44, 9, HI), 0.3) +
  // 홍조
  blur(16, ell(352, 620, 52, 26, "#ea8a72") + ell(628, 612, 44, 22, "#ea8a72"), 0.22) +
  blur(10, ell(505, 628, 38, 16, "#ea8a72"), 0.14)));

// ── 머리
P(path(hair, `url(#${ID}-hair)`));
P(clip("hair",
  blur(14, path("M252 506C226 510 204 510 190 500C160 476 146 430 145 372C144 318 158 268 188 226C214 262 240 316 256 360C258 420 254 470 252 506Z", "#6f7581") +
    path("M712 522C732 476 739 424 738 366C737 310 726 256 700 214C690 270 686 330 690 390C692 440 694 480 694 510Z", "#6f7581"), 0.7) +
  blur(10, path("M282 330C300 306 360 290 450 286C550 284 620 294 660 326C620 312 550 306 450 308C362 312 312 322 282 352Z", "#767c88"), 0.7) +
  blur(16, ell(470, 168, 190, 42, "#fafbfc", 0.9, -4)) +
  // 결: 정수리 오른쪽 위 → 앞머리 왼쪽 아래로 빗어 넘김, 옆머리는 아래로
  flow(R, [[620, 136], [460, 104], [252, 196]], [[664, 192], [520, 142], [296, 252]], 34, { colors: [["#f7f8fa", 3], ["#7d838e", 2]], w: [2.5, 5], jitter: 6 }) +
  flow(R, [[664, 192], [520, 142], [296, 252]], [[690, 248], [560, 206], [330, 302]], 34, { colors: [["#f3f4f7", 2], ["#727883", 3]], w: [2.5, 5], jitter: 6 }) +
  flow(R, [[690, 248], [560, 206], [330, 302]], [[706, 310], [600, 270], [420, 300]], 22, { colors: [["#e9ecf0", 1], ["#686e7a", 3]], w: [2.5, 4.5], jitter: 5 }) +
  flow(R, [[300, 172], [214, 232], [184, 440]], [[262, 250], [204, 324], [204, 486]], 18, { colors: [["#d7dbe1", 1], ["#5f6570", 3]], w: [2.5, 4.5], jitter: 5 }) +
  flow(R, [[662, 200], [734, 284], [724, 470]], [[680, 280], [710, 360], [704, 506]], 16, { colors: [["#dfe2e7", 1], ["#5f6570", 3]], w: [2.5, 4.5], jitter: 5 }) +
  // 뭉치 사이 골(어두운 결)과 윤기(밝은 띠)
  blur(2, strand([640, 170], [500, 128], [300, 214], 9, "#6c727d", 0.55) + strand([676, 228], [540, 180], [320, 278], 9, "#6c727d", 0.5) + strand([700, 290], [590, 244], [400, 294], 8, "#6c727d", 0.5)) +
  blur(3, strand([600, 150], [470, 118], [330, 170], 12, "#ffffff", 0.6) + strand([650, 214], [530, 172], [380, 226], 10, "#ffffff", 0.45)) +
  // 앞머리 뭉치 끝 그늘
  blur(3, line("M300 330Q330 306 356 300M346 314Q394 290 432 292M436 300Q478 282 520 292M520 298Q568 288 610 304", "#5d636e", 6), 0.6)));
P(line(hairOuter, INK, 6.5) + line(`M712 522${hairline.replace(/Z$/, "")}`, "#3b3532", 4.5));

// ── 눈썹 (바탕 + 결)
P(path("M338 441L352 428C366 420 382 416 400 416C420 416 438 418 452 424L453 438C440 434 420 434 400 435C380 436 364 440 352 445Z", "#4d4441"));
P(path("M531 424C548 418 572 414 598 414C616 414 630 420 640 428L646 440L638 444C626 436 610 432 594 431C574 431 552 434 532 438Z", "#4d4441"));
let brows = "";
for (let i = 0; i < 12; i++) {
  const x = 452 - i * 9.5, y = 433 - Math.sin((i / 11) * Math.PI) * 9 + (i > 8 ? (i - 8) * 2.5 : 0);
  brows += strand([x, y + 4], [x - 14, y - 2], [x - 30, y - 4 + (i > 8 ? 4 : 0)], 3.2, "#2a2220", 0.8);
  const xr = 533 + i * 9.5, yr = 432 - Math.sin((i / 11) * Math.PI) * 10 + (i > 8 ? (i - 8) * 2.5 : 0);
  brows += strand([xr, yr + 4], [xr + 14, yr - 2], [xr + 30, yr - 4 + (i > 8 ? 4 : 0)], 3.2, "#2a2220", 0.8);
}
P(brows);

// ── 눈
const eye = (shape, cl, ix, iy, lid, lower, crease, fold) =>
  path(shape, "#f6efea") +
  clip(cl,
    `<circle cx="${ix}" cy="${iy}" r="12.5" fill="url(#${ID}-iris)"/><circle cx="${ix}" cy="${iy}" r="5.5" fill="#0f0a08"/>` +
    blur(2, path(`M${ix - 60} ${iy - 16}H${ix + 60}V${iy - 2}Q${ix} ${iy - 10} ${ix - 60} ${iy - 2}Z`, "#7c5246"), 0.5) +
    `<circle cx="${ix + 4.5}" cy="${iy - 4}" r="3.3" fill="#ffffff"/><circle cx="${ix - 4}" cy="${iy + 4}" r="1.5" fill="#ffffff" opacity=".7"/>`) +
  strand(...lid, 9, "#1d1310", 1, 0.75) +
  strand(...lower, 3, "#8d5a47", 0.75) +
  strand(...crease, 3.5, "#a46a52", 0.75) +
  strand(...fold, 3, "#bd7e60", 0.65);
P(eye(eyeL, "el", 397, 500, [[342, 504], [397, 468], [453, 507]], [[352, 507], [400, 521], [446, 507]], [[352, 486], [398, 462], [446, 490]], [[356, 528], [384, 540], [414, 533]]));
P(eye(eyeR, "er", 578, 497, [[640, 497], [585, 465], [530, 505]], [[540, 506], [586, 518], [631, 500]], [[538, 484], [586, 458], [636, 482]], [[546, 523], [576, 535], [608, 525]]));

// ── 코 (선 대신 그늘 + 콧방울 주름)
P(blur(1, path("M462 646Q476 638 492 646Q478 654 462 646Z", "#5a362c") + path("M528 646Q540 638 552 645Q542 652 528 646Z", "#5a362c")));
P(strand([448, 610], [418, 640], [458, 657], 5, "#9a5d47", 0.9) + strand([558, 608], [588, 634], [550, 655], 5, "#9a5d47", 0.9));
P(strand([470, 655], [505, 668], [540, 653], 3, "#a8674f", 0.55));

// ── 입 (다문 미소, 오른쪽 입꼬리가 조금 더 올라감)
P(path("M413 717Q440 707 470 710Q496 706 505 711Q514 706 542 706Q570 702 590 700Q574 716 545 717Q505 722 470 720Q440 722 413 717Z", `url(#${ID}-lipU)`));
P(path("M432 722Q468 746 505 746Q544 744 568 716Q540 728 505 728Q468 728 432 722Z", `url(#${ID}-lipL)`));
P(blur(3, ell(500, 734, 24, 5, "#ffffff"), 0.45));
P(blur(4, ell(406, 714, 10, 8, SH2) + ell(600, 695, 10, 8, SH2), 0.45));
P(strand([404, 716], [500, 733], [598, 697], 6.5, "#4a2620", 1, 1, 20));
P(strand([596, 699], [603, 693], [607, 686], 3.5, "#4a2620", 0.9) + strand([408, 716], [401, 713], [397, 708], 3.5, "#4a2620", 0.9));
// 팔자 주름
P(strand([444, 662], [421, 692], [417, 730], 4.5, "#a8664c", 0.85) + strand([572, 654], [598, 682], [604, 718], 4.5, "#a8664c", 0.85));

// ── 얼굴 윤곽
P(line(jaw, INK, 6));

await build({
  name: "shin-hyunsong",
  exportName: "SHIN_HYUNSONG",
  doc: [
    "신현송 한국은행 총재 — 손으로 짠 벡터 일러스트 (480×560)",
    "참고 사진: Wikimedia Commons 'Hyun Song Shin, deputy del Banco de Pagos Internacionales … (cropped).jpg' — G20 Argentina, CC BY 2.0 (https://creativecommons.org/licenses/by/2.0/)",
    "사진 위에서 잰 머리선·이목구비·턱선 좌표로 그린 것 — 고치려면 scripts/portraits/shin-hyunsong.mjs 를 고쳐 다시 실행 (README 참고)",
  ],
  credit: "인물 그림 원본 사진: G20 Argentina · CC BY 2.0 · 변형",
  id: ID,
  crop: [0, 60, 960],
  body: out.join("\n"),
});
