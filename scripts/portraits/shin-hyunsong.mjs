// 신현송 한국은행 총재 초상 — 원본 사진(960×1200) 위에서 잰 좌표로 짠 벡터 일러스트
// 사용: node scripts/portraits/shin-hyunsong.mjs  (사진 겹침 확인은 scripts/portraits/photos/shin-hyunsong.jpg 가 있을 때)
// 그리는 순서: 정장·셔츠·넥타이 → 목 → 귀 → 얼굴(바탕 그라데이션 → 흐린 그늘 → 흐린 빛 → 홍조) → 머리(결) → 이목구비 → 윤곽선
import { blurDefs, browHairs, build, ell, flow, rng, scallop, strand } from "./lib.mjs";

const ID = "shn";
const INK = "#2b2018";
const R = rng(20261024);
const SH = "#b97452"; // 피부 그늘
const SH2 = "#9b5a40"; // 깊은 그늘
const HI = "#fff1e0"; // 피부 빛

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
  [362, 128, 0.1], [436, 116, 0.1], [512, 118, 0.1], [576, 136, 0.1], [628, 172, 0.12],
  [676, 212, 0.12], [710, 258, 0.1], [726, 312, 0.1], [734, 372, 0.1], [736, 432, 0.1], [726, 486, 0.1], [712, 522, 0.08],
];
const hairOuter = `M252 506Q248 516 238 524Q232 510 216 510Q206 520 190 514${scallop(outerPts, 0.14)}`;
// 이마 위 머리선: 오른쪽 관자놀이 → 넓은 이마 위로 둥글게 → 왼쪽 관자놀이 (앞머리 끝은 아래 '앞머리 가닥'으로 부드럽게)
const hairline =
  "C704 520 698 518 694 510C694 476 693 440 690 408C686 376 676 336 660 308" +
  scallop([[660, 308], [630, 284], [596, 270], [556, 264], [512, 262], [466, 263], [420, 266], [378, 273], [340, 285], [306, 300], [282, 320], [266, 346], [260, 374]], 0.16) +
  "C255 410 253 470 252 506Z";
const hair = hairOuter + hairline;
const face =
  "M254 400C248 460 246 530 247 590C248 630 248 660 252 684C262 726 278 764 302 796C326 826 370 848 432 858C460 862 494 864 516 862C556 858 598 838 624 808C646 780 660 732 670 690C682 646 692 608 696 566C700 516 698 456 692 400C684 320 650 256 560 244C500 238 420 238 360 246C296 258 260 320 254 400Z";
const jaw = "M252 684C262 726 278 764 302 796C326 826 370 848 432 858C460 862 494 864 516 862C556 858 598 838 624 808C646 780 660 732 670 690C682 646 692 608 696 566";
const neck = "M324 720L320 830L497 982L622 820L620 720Z";
const earL = "M252 500C232 486 204 486 190 506C176 530 182 580 196 618C208 650 228 670 252 678Z";
const earR = "M690 498C710 498 722 528 720 566C718 598 708 622 692 634Z";
const suitL = "M-20 1200L-20 958C60 930 160 904 230 886C266 876 288 860 300 840L304 1200Z";
const suitR = "M644 832C662 858 700 874 744 886C830 908 910 936 980 970L980 1200L650 1200Z";
const tieKnot = "M450 984Q497 974 544 984L532 1054Q497 1062 462 1054Z";
const tieBlade = "M462 1054Q497 1062 532 1054L558 1200L436 1200Z";
const browL = "M452 453C459 447 459 434 450 428C436 420 418 417 398 417C374 417 352 423 336 435L328 447C346 442 368 440 392 442C414 444 434 448 452 453Z";
const browR = "M530 453C523 447 523 433 532 427C548 419 572 413 598 413C620 413 640 420 652 432L660 450C642 441 620 436 598 436C576 436 554 442 530 453Z";
// 눈: 웃음기 있는 가는 눈 (위 눈꺼풀이 무겁게 덮고 아래는 거의 곧음)
const eyeL = "M348 504Q398 482 452 506Q402 512 348 504Z";
const eyeR = "M532 504Q584 478 640 496Q590 509 532 504Z";

P(`<defs>${blurDefs(ID, [1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 14, 16, 18])}
<radialGradient id="${ID}-skin" gradientUnits="userSpaceOnUse" cx="570" cy="500" r="460"><stop offset="0" stop-color="#f8d4b2"/><stop offset=".55" stop-color="#e9b48c"/><stop offset="1" stop-color="#cf9168"/></radialGradient>
<linearGradient id="${ID}-neck" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cf8f68"/><stop offset="1" stop-color="#e4ab84"/></linearGradient>
<linearGradient id="${ID}-ear" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#d99a74"/><stop offset="1" stop-color="#ebb68f"/></linearGradient>
<linearGradient id="${ID}-hair" gradientUnits="userSpaceOnUse" x1="0" y1="110" x2="0" y2="520"><stop offset="0" stop-color="#d9d8d4"/><stop offset=".4" stop-color="#aeada8"/><stop offset="1" stop-color="#6d6c69"/></linearGradient>
<linearGradient id="${ID}-suit" gradientUnits="userSpaceOnUse" x1="0" y1="830" x2="0" y2="1200"><stop offset="0" stop-color="#3b414f"/><stop offset="1" stop-color="#252932"/></linearGradient>
<linearGradient id="${ID}-tie" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3a4886"/><stop offset="1" stop-color="#1f2754"/></linearGradient>
<linearGradient id="${ID}-lipU" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c47b6a"/><stop offset="1" stop-color="#a65b4d"/></linearGradient>
<linearGradient id="${ID}-lipL" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b9695a"/><stop offset=".45" stop-color="#d4907d"/><stop offset="1" stop-color="#c98270"/></linearGradient>
<radialGradient id="${ID}-iris"><stop offset="0" stop-color="#5a3a2a"/><stop offset=".65" stop-color="#2a1a12"/><stop offset="1" stop-color="#120b08"/></radialGradient>
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
<linearGradient id="${ID}-browL" gradientUnits="userSpaceOnUse" x1="460" y1="0" x2="326" y2="0"><stop offset="0" stop-color="#6e5a52"/><stop offset=".22" stop-color="#2f2725"/><stop offset="1" stop-color="#3b3230"/></linearGradient>
<linearGradient id="${ID}-browR" gradientUnits="userSpaceOnUse" x1="522" y1="0" x2="662" y2="0"><stop offset="0" stop-color="#6e5a52"/><stop offset=".22" stop-color="#2f2725"/><stop offset="1" stop-color="#3b3230"/></linearGradient>
<clipPath id="${ID}-c-brow"><path d="${browL}"/><path d="${browR}"/></clipPath>
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
P(path(earR, `url(#${ID}-ear)`) + strand([698, 512], [716, 546], [702, 606], 4.5, "#94553e", 0.8) + line(earR, INK, 5.5));

// ── 얼굴
P(path(face, `url(#${ID}-skin)`));
P(clip("face",
  // 그늘 (빛은 오른쪽 위에서)
  blur(14, path("M250 420C244 520 244 620 256 700C270 770 310 820 380 850L420 852C362 812 322 762 306 692C292 622 290 522 300 420Z", SH), 0.85) +
  blur(14, path("M692 400C696 470 696 540 690 600L670 590C676 530 678 470 674 400Z", SH), 0.5) +
  blur(10, path("M262 352C282 312 330 284 420 270C500 262 600 266 650 296C672 318 684 352 690 396L674 392C660 350 632 318 580 302C500 290 410 292 350 306C306 318 280 336 266 372Z", SH2), 0.55) +
  // 눈 밑 볼록한 애교살·눈가 그늘 (웃는 눈의 특징)
  blur(7, ell(400, 527, 44, 10, SH) + ell(588, 521, 42, 10, SH), 0.45) +
  blur(8, ell(400, 548, 40, 9, HI) + ell(590, 542, 38, 9, HI), 0.3) +
  blur(6, ell(342, 500, 10, 12, SH2) + ell(646, 494, 10, 12, SH2), 0.35) +
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
  blur(14, ell(510, 372, 110, 30, HI), 0.2) +
  blur(5, line("M492 476Q498 540 508 596", HI, 12), 0.55) +
  blur(4, ell(530, 606, 19, 13, HI), 0.85) +
  blur(10, ell(612, 566, 52, 22, HI, 1, -10), 0.5) +
  blur(10, ell(368, 572, 40, 16, HI, 1, 10), 0.28) +
  blur(8, ell(505, 816, 30, 10, HI), 0.22) +
  blur(3, ell(502, 700, 30, 5, HI), 0.4) +
  blur(8, ell(392, 548, 46, 9, HI) + ell(586, 542, 44, 9, HI), 0.3) +
  // 홍조
  blur(16, ell(352, 620, 52, 26, "#ea8a72") + ell(628, 612, 44, 22, "#ea8a72"), 0.22) +
  blur(10, ell(505, 628, 38, 16, "#ea8a72"), 0.14)));

// ── 머리
// 희끗희끗한 회색 (흰 결 + 짙은 결이 섞인 반백) — 은발 가발처럼 보이지 않게 밝기를 낮추고 푸른 기를 뺌
const HL = "#efeeea", HM = "#a3a29e", HD = "#575652";
P(path(hair, `url(#${ID}-hair)`));
P(clip("hair",
  blur(14, path("M252 506C226 510 204 510 190 500C160 476 146 430 145 372C144 318 158 268 188 226C214 262 240 316 256 360C258 420 254 470 252 506Z", "#5c5b57") +
    path("M712 522C732 476 739 424 738 366C737 310 726 256 700 214C690 270 686 330 690 390C692 440 694 480 694 510Z", "#4f4e4b"), 0.75) +
  blur(10, path("M272 332C296 294 356 272 450 266C550 262 632 276 666 314C622 290 550 282 450 286C362 290 312 306 276 352Z", "#5f5e5a"), 0.65) +
  blur(16, ell(470, 168, 190, 42, "#f4f3ef", 0.75, -4)) +
  // 결: 정수리 오른쪽 위 → 앞머리 왼쪽 아래로 빗어 넘김, 옆머리는 아래로
  flow(R, [[620, 136], [460, 104], [252, 196]], [[664, 192], [520, 142], [296, 252]], 40, { colors: [[HL, 3], [HM, 2], [HD, 2]], w: [2.5, 5], jitter: 6 }) +
  flow(R, [[664, 192], [520, 142], [296, 252]], [[690, 248], [560, 200], [300, 300]], 40, { colors: [[HL, 2], [HM, 2], [HD, 3]], w: [2.5, 5], jitter: 6 }) +
  flow(R, [[690, 248], [560, 200], [300, 300]], [[690, 320], [540, 236], [284, 330]], 30, { colors: [[HL, 1], [HM, 3], [HD, 3]], w: [2.5, 4.5], jitter: 5 }) +
  flow(R, [[300, 172], [214, 232], [184, 440]], [[262, 250], [204, 324], [204, 486]], 22, { colors: [[HL, 1], [HM, 2], [HD, 3]], w: [2.5, 4.5], jitter: 5 }) +
  flow(R, [[662, 200], [734, 284], [724, 470]], [[680, 280], [710, 360], [704, 506]], 20, { colors: [[HL, 1], [HM, 1], [HD, 4]], w: [2.5, 4.5], jitter: 5 }) +
  // 뭉치 사이 골(어두운 결)과 윤기(밝은 띠)
  blur(2, strand([640, 170], [500, 128], [300, 214], 9, "#4c4b47", 0.5) + strand([676, 228], [540, 180], [310, 268], 9, "#4c4b47", 0.5) + strand([690, 286], [560, 226], [330, 296], 8, "#4c4b47", 0.5)) +
  blur(3, strand([600, 150], [470, 118], [330, 170], 12, "#ffffff", 0.5) + strand([630, 200], [520, 160], [380, 210], 10, "#ffffff", 0.25))));
P(line(hairOuter, INK, 6.5) + line(`M712 522${hairline.replace(/Z$/, "")}`, "#4a4642", 3.5));
// ── 눈썹 (짙고 굵은 일자 눈썹 — 이 얼굴의 첫인상, 바탕 + 결)
P(blur(3, path(browL, `url(#${ID}-browL)`) + path(browR, `url(#${ID}-browR)`), 0.8));
P(clip("brow", blur(1, path(browL, `url(#${ID}-browL)`) + path(browR, `url(#${ID}-browR)`)) +
  browHairs(R, [[452, 444], [394, 424], [334, 442]], 34, { len: 24, spread: 14 }) +
  browHairs(R, [[530, 444], [592, 420], [656, 442]], 34, { len: 24, spread: 14 })));
// 눈가 잔주름 (웃는 눈)
P(strand([334, 507], [324, 505], [314, 501], 2.2, "#a3664d", 0.35) + strand([334, 511], [326, 515], [318, 520], 2.2, "#a3664d", 0.3) +
  strand([651, 498], [660, 495], [669, 491], 2.2, "#a3664d", 0.35) + strand([651, 502], [659, 506], [666, 511], 2.2, "#a3664d", 0.3));

// ── 눈
// 흰자는 살짝 어둡게, 눈동자는 크고 짙게 (가는 눈 틈으로 위아래가 가려짐) — 위 눈꺼풀 선은 바깥쪽이 굵음
const eye = (shape, cl, ix, iy, lid, lower, crease, bag) =>
  path(shape, "#e4d6cc") +
  clip(cl,
    blur(3, ell(ix - 48, iy + 3, 16, 12, "#9a6a58") + ell(ix + 50, iy + 1, 16, 12, "#9a6a58"), 0.55) +
    `<circle cx="${ix}" cy="${iy}" r="14" fill="url(#${ID}-iris)"/><circle cx="${ix}" cy="${iy}" r="6.5" fill="#0b0705"/>` +
    blur(2, path(`M${ix - 70} ${iy - 22}H${ix + 70}V${iy - 4}Q${ix} ${iy - 12} ${ix - 70} ${iy - 4}Z`, "#5e3a2e"), 0.6) +
    `<circle cx="${ix + 4}" cy="${iy - 3}" r="2.8" fill="#ffffff" opacity=".95"/>`) +
  strand(...lid, 8, "#1a110d", 1, 0.7) +
  strand(...lower, 2.5, "#8d5a47", 0.6) +
  strand(...crease, 2.5, "#9a5f48", 0.45) +
  strand(...bag, 3, "#a3664d", 0.55);
P(eye(eyeL, "el", 398, 499, [[340, 507], [398, 477], [456, 508]], [[354, 507], [402, 514], [448, 508]], [[356, 488], [400, 464], [444, 490]], [[362, 532], [400, 547], [440, 534]]));
P(eye(eyeR, "er", 584, 494, [[645, 498], [584, 470], [528, 506]], [[538, 506], [590, 512], [634, 500]], [[540, 486], [586, 460], [634, 482]], [[550, 527], [588, 541], [626, 526]]));

// ── 코 (선 대신 그늘 + 콧방울 주름)
// 콧방울이 넓고 코끝이 둥근 코
P(blur(5, ell(452, 632, 16, 22, SH2) + ell(566, 628, 14, 20, SH), 0.35));
P(blur(1, path("M456 648Q474 635 494 646Q478 658 456 648Z", "#4a2c24") + path("M524 645Q542 633 560 643Q544 655 524 645Z", "#4a2c24")));
P(strand([452, 598], [412, 634], [456, 660], 5.5, "#935741", 0.9) + strand([564, 596], [602, 628], [556, 656], 5.5, "#935741", 0.85));
P(strand([476, 656], [507, 667], [538, 655], 3, "#a8674f", 0.5));

// ── 입 (다문 미소, 오른쪽 입꼬리가 조금 더 올라감)
// 코밑·입가의 거뭇한 수염 자국
P(clip("face", blur(12, ell(505, 688, 74, 16, "#7d7a86"), 0.2)));
P(path("M412 719Q440 708 472 710Q496 705 506 710Q516 705 544 705Q572 702 597 704Q574 718 545 719Q505 723 470 722Q440 723 412 719Z", `url(#${ID}-lipU)`));
P(path("M430 723Q466 744 505 744Q546 742 576 714Q542 727 505 727Q466 728 430 723Z", `url(#${ID}-lipL)`));
P(blur(3, ell(504, 734, 26, 5, "#ffffff"), 0.4));
P(blur(4, ell(408, 718, 10, 8, SH2) + ell(602, 703, 10, 8, SH2), 0.5));
P(strand([406, 719], [500, 728], [600, 703], 5, "#4a2620", 1, 1, 20));
P(strand([598, 704], [605, 700], [609, 693], 3.2, "#4a2620", 0.85) + strand([409, 719], [402, 716], [398, 711], 3.2, "#4a2620", 0.85));
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
