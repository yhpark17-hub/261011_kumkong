// 이억원 금융위원장 초상 — 원본 사진(188×241 을 960×1231 로 키운 것) 위에서 잰 좌표로 짠 벡터 일러스트
// 사용: node scripts/portraits/lee-eogweon.mjs  (사진 겹침 확인은 scripts/portraits/photos/lee-eogweon.jpg 가 있을 때)
// 그리는 순서: 정장·셔츠·넥타이 → 목 → 귀 → 얼굴(바탕 그라데이션 → 흐린 그늘 → 흐린 빛 → 홍조) → 머리(결) → 이목구비 → 안경 → 윤곽선
// 닮게 하는 포인트: 왼쪽 가르마로 단정하게 넘긴 짙은 머리, 가는 금속테 안경, 갸름한 달걀형 얼굴, 잔잔하게 다문 미소, 남색 정장에 하늘색 넥타이
import { blurDefs, browHairs, build, ell, flow, glasses, rng, scallop, strand } from "./lib.mjs";

const ID = "lew";
const INK = "#2b2018";
const R = rng(20251015);
const SH = "#b87660"; // 피부 그늘
const SH2 = "#9a5a48"; // 깊은 그늘
const HI = "#fff2ea"; // 피부 빛

const out = [];
const P = (s) => out.push(s);
const blur = (s, inner, op = 1) => `<g filter="url(#${ID}-b${s})"${op < 1 ? ` opacity="${op}"` : ""}>${inner}</g>`;
const clip = (name, inner) => `<g clip-path="url(#${ID}-c-${name})">${inner}</g>`;
const path = (d, fill, extra = "") => `<path d="${d}" fill="${fill}"${extra}/>`;
const line = (d, color, w, op = 1) =>
  `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"${op < 1 ? ` opacity="${op}"` : ""}/>`;

// ── 모양 (사진에서 잰 좌표 — 사진이 작아 흐리므로 비율 위주)
const outerPts = [
  [236, 482], [212, 462, 0.06], [200, 420, 0.06], [194, 370, 0.06], [197, 326, 0.08], [212, 288, 0.08], [234, 250, 0.1], [262, 210, 0.1],
  [294, 176, 0.12], [332, 138, 0.14], [380, 112, 0.16], [432, 99, 0.14], [488, 102, 0.16], [542, 120, 0.16], [606, 160, 0.12], [646, 196, 0.1],
  [680, 236, 0.1], [706, 280, 0.08], [717, 328, 0.06], [718, 378, 0.06], [710, 422, 0.06], [694, 458, 0.06], [680, 476, 0.04],
];
const hairOuter = `M236 482${scallop(outerPts)}`;
// 머리선: 오른쪽 관자놀이 → 이마 위 (오른쪽으로 빗어 넘긴 앞머리 끝이 둥근 뭉치) → 왼쪽 관자놀이
const hairline =
  "C676 458 673 440 670 420C666 398 657 374 649 352C642 332 630 312 616 298" +
  scallop([[616, 298], [592, 281], [562, 268], [528, 260], [490, 254], [450, 251], [410, 253], [372, 258], [340, 266], [314, 278], [298, 292]], 0.12) +
  "C286 306 278 324 272 344C264 372 259 402 255 432C252 452 248 470 240 484Z";
const hair = hairOuter + hairline;
// 갸름한 달걀형 (사진 밝기 경계: 왼쪽 239,620 · 274,680 · 298,720 · 턱끝 462,765 · 오른쪽 657,700 · 674,640)
const face =
  "M252 330C248 400 242 480 240 560C240 592 243 610 248 626C258 654 270 680 286 702C303 728 325 750 354 760C392 770 430 768 462 766C502 764 540 758 572 748C600 736 625 720 642 702C656 686 664 664 670 638C677 604 682 560 685 512C690 450 688 390 680 330C668 250 596 206 468 204C344 204 266 246 256 300C254 310 253 320 252 330Z";
const jaw = "M247 614C247 618 247 622 248 626C258 654 270 680 286 702C303 728 325 750 354 760C392 770 430 768 462 766C502 764 540 758 572 748C600 736 625 720 642 702C656 686 664 664 670 638C675 620 679 606 682 592";
const neck = "M338 700L336 850L442 950L628 842L640 700Z";
const earL = "M254 472C238 460 214 460 204 478C194 498 193 538 201 566C209 590 223 606 246 612Z";
const earR = "M680 462C696 450 722 448 732 470C740 492 736 524 724 548C714 570 700 590 684 600Z";
const suitL = "M-40 1240L-40 1012C30 982 120 950 200 914C252 892 292 868 316 842L332 828L300 1240Z";
const suitR = "M646 790C668 786 696 790 724 800C760 816 800 842 856 880C900 904 940 922 1000 944L1000 1240L520 1240Z";
const lapelL = "M326 836L196 934L242 970L276 1240L304 1240Z";
const lapelR = "M650 794L802 986L766 1002L666 1240L524 1240Z";
const shirt = "M326 828L300 1240L526 1240L652 790Z";
const tieKnot = "M398 944Q446 934 496 944L478 1018Q446 1026 414 1018Z";
const tieBlade = "M414 1016Q446 1024 478 1016L496 1240L330 1240Z";
const wingL = "M332 812L352 828L438 946L400 958L356 1046Q326 1000 302 964L310 860Z";
const wingR = "M646 786L626 802L454 946L494 956L560 1048Q596 980 626 920L640 840Z";
// 눈: 잔잔하게 웃는 가는 눈 (사진이 조금 기울어 오른쪽 눈이 약간 높음)
const eyeL = "M314 482Q338 466 364 466Q392 467 408 478Q392 488 364 489Q336 489 314 482Z";
const eyeR = "M496 468Q514 454 540 454Q566 455 586 466Q566 475 540 476Q514 475 496 468Z";
// 눈썹: 바깥 1/3 이 살짝 올라간 보통 굵기
const browL = "M414 434C402 418 382 410 358 406C338 403 318 406 300 418L298 428C316 420 336 418 356 420C378 424 396 430 412 444Z";
const browR = "M494 432C508 414 532 401 560 397C588 394 616 398 640 410L646 420C622 410 596 408 568 410C542 414 518 424 498 442Z";
// 안경: 가는 금속테, 위가 곧고 아래가 둥근 큰 렌즈
const lensL = "M282 448C322 443 376 443 408 448C422 451 427 463 425 482C422 510 411 532 393 541C377 548 350 549 324 547C298 545 279 537 269 522C260 507 258 488 259 472C261 458 268 450 282 448Z";
const lensR = "M506 444C542 439 600 439 634 444C652 447 661 459 660 474C658 500 649 524 632 535C616 543 590 544 562 542C534 540 512 535 500 521C490 507 487 489 487 474C487 459 492 446 506 444Z";

P(`<defs>${blurDefs(ID, [1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 14, 16, 18])}
<radialGradient id="${ID}-skin" gradientUnits="userSpaceOnUse" cx="520" cy="470" r="440"><stop offset="0" stop-color="#f7d3be"/><stop offset=".55" stop-color="#e9b39b"/><stop offset="1" stop-color="#cc8f75"/></radialGradient>
<linearGradient id="${ID}-neck" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c88570"/><stop offset="1" stop-color="#dea58e"/></linearGradient>
<linearGradient id="${ID}-ear" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#dca089"/><stop offset="1" stop-color="#edbba5"/></linearGradient>
<linearGradient id="${ID}-hair" gradientUnits="userSpaceOnUse" x1="0" y1="110" x2="0" y2="480"><stop offset="0" stop-color="#5c5452"/><stop offset=".5" stop-color="#433c3a"/><stop offset="1" stop-color="#2f2927"/></linearGradient>
<linearGradient id="${ID}-suit" gradientUnits="userSpaceOnUse" x1="0" y1="790" x2="0" y2="1240"><stop offset="0" stop-color="#2f3a58"/><stop offset="1" stop-color="#1f2740"/></linearGradient>
<linearGradient id="${ID}-lapel" gradientUnits="userSpaceOnUse" x1="0" y1="800" x2="0" y2="1240"><stop offset="0" stop-color="#36426a"/><stop offset="1" stop-color="#252e4b"/></linearGradient>
<linearGradient id="${ID}-tie" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#5f8cc4"/><stop offset=".45" stop-color="#8fb4e0"/><stop offset="1" stop-color="#5a85bd"/></linearGradient>
<linearGradient id="${ID}-lipU" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c47c6e"/><stop offset="1" stop-color="#a45d52"/></linearGradient>
<linearGradient id="${ID}-lipL" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b8695e"/><stop offset=".5" stop-color="#d4928a"/><stop offset="1" stop-color="#c7837a"/></linearGradient>
<radialGradient id="${ID}-iris"><stop offset="0" stop-color="#5a3a2a"/><stop offset=".65" stop-color="#2a1a12"/><stop offset="1" stop-color="#120b08"/></radialGradient>
<linearGradient id="${ID}-brow" gradientUnits="userSpaceOnUse" x1="0" y1="396" x2="0" y2="444"><stop offset="0" stop-color="#3a2f2c"/><stop offset="1" stop-color="#55463f"/></linearGradient>
<linearGradient id="${ID}-collar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#e6ecf4"/></linearGradient>
<clipPath id="${ID}-c-face"><path d="${face}"/></clipPath>
<clipPath id="${ID}-c-hair"><path d="${hair}"/></clipPath>
<clipPath id="${ID}-c-neck"><path d="${neck}"/></clipPath>
<clipPath id="${ID}-c-earL"><path d="${earL}"/></clipPath>
<clipPath id="${ID}-c-earR"><path d="${earR}"/></clipPath>
<clipPath id="${ID}-c-suit"><path d="${suitL}"/><path d="${suitR}"/></clipPath>
<clipPath id="${ID}-c-shirt"><path d="${shirt}"/></clipPath>
<clipPath id="${ID}-c-tie"><path d="${tieBlade}"/></clipPath>
<clipPath id="${ID}-c-el"><path d="${eyeL}"/></clipPath>
<clipPath id="${ID}-c-er"><path d="${eyeR}"/></clipPath>
<clipPath id="${ID}-c-brow"><path d="${browL}"/><path d="${browR}"/></clipPath>
</defs>`);

// ── 정장 (짙은 남색, 노치 라펠)
P(path(suitL, `url(#${ID}-suit)`) + path(suitR, `url(#${ID}-suit)`));
P(clip("suit",
  path(lapelL, `url(#${ID}-lapel)`) + path(lapelR, `url(#${ID}-lapel)`) +
  blur(16, line("M326 836L196 934M650 794L802 986", "#121726", 26), 0.5) +
  blur(14, line("M242 970L276 1240M766 1002L666 1240", "#121726", 22), 0.5) +
  blur(18, ell(110, 980, 130, 28, "#4f5c82", 1, -20) + ell(830, 900, 130, 28, "#4f5c82", 1, 22), 0.5) +
  line("M318 850L204 936M656 806L790 978", "#56638a", 3, 0.8) +
  line(lapelL, "#171d30", 5) + line(lapelR, "#171d30", 5)));
P(line(suitL, INK, 6.5) + line(suitR, INK, 6.5));
// ── 셔츠
P(path(shirt, "#f6f8fc"));
P(clip("shirt", blur(10, line("M318 1040L310 1240M560 1060L540 1240", "#c9d3e2", 18) + ell(470, 1000, 120, 40, "#c9d3e2", 0.7))));
P(line("M326 828L300 1240M526 1240L652 790", INK, 5));
// ── 목 (턱 밑 그늘이 짙게)
P(path(neck, `url(#${ID}-neck)`));
P(clip("neck", blur(16, ell(470, 756, 170, 52, SH2, 0.95)) + blur(10, ell(450, 920, 50, 26, SH, 0.5)) + blur(10, line("M344 740L346 860M626 740L622 860", SH2, 22), 0.5)));
P(line(neck, INK, 5));
// ── 넥타이 (하늘색, 가운데가 밝은 광택)
P(path(tieBlade, `url(#${ID}-tie)`));
P(clip("tie", blur(5, line("M448 1024L414 1240", "#b9d2ee", 12), 0.6) + line("M420 1060L478 1050M400 1130L486 1118M380 1200L492 1186", "#6f97cb", 3, 0.35)));
P(line(tieBlade, INK, 5));
P(path(tieKnot, `url(#${ID}-tie)`) + blur(3, ell(448, 966, 28, 9, "#c4daf2", 0.6)) + line("M434 1018Q442 1036 446 1054", "#3f6aa3", 4, 0.7) + line(tieKnot, INK, 5));
// ── 셔츠 깃
P(path(wingL, `url(#${ID}-collar)`) + path(wingR, `url(#${ID}-collar)`));
P(blur(6, line("M336 880L400 950M620 860L530 950", "#cfd8e6", 10)));
P(line(wingL, INK, 5) + line(wingR, INK, 5));

// ── 귀 (바깥 테두리 → 안쪽 Y자 연골 → 귓구멍 쪽 오목한 그늘)
P(path(earL, `url(#${ID}-ear)`) + path(earR, `url(#${ID}-ear)`));
P(clip("earL",
  blur(5, path("M246 498C230 496 220 516 222 540C224 562 234 576 246 580C240 556 240 524 246 498Z", SH2), 0.75) +
  blur(8, ell(210, 520, 10, 36, "#e98a70"), 0.3) +
  blur(4, ell(240, 552, 9, 14, "#7a3e2c"), 0.4)));
P(strand([248, 470], [204, 468], [206, 540], 5.5, "#965a43", 0.85) + strand([206, 540], [210, 580], [238, 604], 4, "#965a43", 0.55) +
  strand([244, 490], [222, 502], [228, 540], 3.6, "#a8684e", 0.65));
P(clip("earR",
  blur(5, path("M688 486C704 484 714 504 712 528C710 550 700 564 688 568C694 544 694 512 688 486Z", SH2), 0.75) +
  blur(8, ell(724, 500, 10, 34, "#e98a70"), 0.3) +
  blur(4, ell(694, 540, 9, 14, "#7a3e2c"), 0.4)));
P(strand([684, 462], [730, 454], [728, 524], 5.5, "#965a43", 0.85) + strand([728, 524], [722, 568], [690, 594], 4, "#965a43", 0.55) +
  strand([690, 482], [712, 492], [706, 530], 3.6, "#a8684e", 0.65));
P(line(earL, INK, 6) + line(earR, INK, 6));

// ── 얼굴
P(path(face, `url(#${ID}-skin)`));
P(clip("face",
  // 그늘 (빛은 오른쪽 앞에서 — 왼쪽 볼이 살짝 그늘)
  blur(14, path("M246 340C240 440 238 540 246 620C256 680 290 730 350 760L392 766C334 730 300 680 288 620C276 540 276 440 284 340Z", SH), 0.4) +
  blur(12, path("M688 360C690 450 688 540 676 610C664 670 630 716 580 744L560 748C610 712 640 668 652 610C664 540 668 450 664 360Z", SH), 0.25) +
  blur(16, ell(304, 640, 24, 56, SH, 1, -10) + ell(634, 630, 22, 52, SH, 1, 10), 0.2) +
  // 앞머리 밑 그늘
  blur(10, path("M262 340C280 300 330 270 420 258C500 250 590 262 630 300C652 322 664 352 672 390L658 386C648 352 630 324 596 308C530 286 450 284 380 292C330 300 290 318 270 360Z", SH2), 0.55) +
  // 눈두덩·콧대 옆
  blur(10, ell(362, 462, 58, 18, SH) + ell(540, 450, 54, 17, SH), 0.4) +
  blur(6, ell(424, 470, 12, 20, SH2) + ell(490, 462, 12, 20, SH2), 0.45) +
  blur(6, path("M440 480C436 520 430 552 420 576L434 582C442 556 448 522 452 480Z", SH2), 0.45) +
  blur(6, ell(460, 602, 46, 9, SH2) + ell(408, 584, 11, 16, SH2) + ell(514, 580, 11, 16, SH2), 0.5) +
  // 눈 밑 살짝 볼록 (웃는 눈)
  blur(6, ell(362, 506, 38, 8, SH) + ell(542, 494, 36, 8, SH), 0.38) +
  // 팔자 주름은 옅게, 입 밑·턱 그늘
  blur(7, line("M404 600Q376 626 372 664M518 596Q548 618 556 654", SH, 14), 0.2) +
  blur(7, ell(462, 712, 46, 9, SH2), 0.45) +
  blur(10, path("M262 668C300 732 380 756 462 758C540 756 612 732 652 676L664 760C610 800 540 806 462 806C380 806 300 790 262 750Z", SH), 0.4) +
  // 빛
  blur(14, ell(470, 300, 110, 24, HI), 0.35) +
  blur(5, line("M462 480Q464 520 468 556", HI, 11), 0.55) +
  blur(3, ell(468, 566, 15, 10, HI), 0.8) +
  blur(10, ell(588, 560, 40, 20, HI, 1, 10), 0.4) +
  blur(10, ell(338, 566, 34, 16, HI, 1, -10), 0.2) +
  blur(8, ell(468, 736, 28, 10, HI), 0.35) +
  // 홍조
  blur(16, ell(330, 590, 44, 22, "#e5826a") + ell(596, 580, 40, 20, "#e5826a"), 0.2) +
  blur(10, ell(462, 580, 30, 13, "#e5826a"), 0.12) +
  // 수염 자국 (옅게)
  blur(14, ell(462, 632, 70, 14, "#7d7a86") + ell(462, 730, 56, 22, "#7d7a86"), 0.12)));

// ── 머리 (왼쪽 가르마에서 오른쪽으로 단정하게 넘긴 짙은 머리, 정수리 쪽에 윤기)
const HD = "#262020", HM = "#57504d", HL = "#9a908c";
P(path(hair, `url(#${ID}-hair)`));
P(clip("hair",
  blur(12, ell(470, 150, 150, 30, "#7a706c", 0.6, 6)) +
  blur(8, line("M300 292Q420 248 600 274Q644 300 664 360", "#0f0b0b", 18), 0.55) +
  // 결: 가르마(왼쪽 위) → 정수리 넘어 오른쪽 관자놀이로
  flow(R, [[338, 150], [480, 96], [646, 186]], [[322, 196], [480, 140], [684, 252]], 30, { colors: [[HL, 3], [HM, 3], [HD, 2]], w: [2.5, 5], jitter: 4 }) +
  flow(R, [[322, 196], [480, 140], [684, 252]], [[310, 246], [470, 196], [700, 330]], 32, { colors: [[HL, 1], [HM, 3], [HD, 3]], w: [2.5, 5], jitter: 4 }) +
  flow(R, [[310, 246], [470, 196], [700, 330]], [[300, 296], [480, 240], [676, 430]], 30, { colors: [[HL, 1], [HM, 3], [HD, 3]], w: [2.5, 4.5], jitter: 4 }) +
  // 가르마 왼쪽: 옆머리는 귀 쪽으로 빗어 내림
  flow(R, [[336, 146], [240, 220], [208, 440]], [[312, 262], [262, 330], [246, 476]], 20, { colors: [[HL, 1], [HM, 2], [HD, 3]], w: [2.5, 4.5], jitter: 4 }) +
  // 오른쪽 옆머리
  flow(R, [[640, 186], [714, 270], [706, 450]], [[640, 300], [676, 360], [680, 470]], 16, { colors: [[HL, 1], [HM, 2], [HD, 3]], w: [2.5, 4], jitter: 4 }) +
  // 윤기·골
  blur(3, strand([360, 156], [480, 116], [620, 168], 12, "#7c6f6c", 0.5) + strand([350, 214], [480, 168], [650, 238], 10, "#7c6f6c", 0.35)) +
  blur(2, strand([330, 186], [480, 136], [670, 222], 8, "#0c0909", 0.5) + strand([320, 240], [480, 190], [690, 300], 7, "#0c0909", 0.4)) +
  // 물결: 정수리에서 오른쪽으로 넘어가며 살짝 들뜬 뭉치 (윤기 띠 + 그 아래 골)
  blur(2, strand([360, 132], [420, 100], [470, 128], 10, "#aaa09a", 0.6) + strand([470, 128], [530, 104], [600, 150], 10, "#aaa09a", 0.55) +
    strand([352, 196], [420, 160], [480, 186], 9, "#a0958f", 0.45) + strand([480, 186], [560, 160], [650, 222], 9, "#a0958f", 0.4)) +
  blur(2, strand([364, 150], [424, 120], [474, 146], 6, "#1a1515", 0.45) + strand([474, 146], [536, 124], [604, 170], 6, "#1a1515", 0.4) +
    strand([356, 214], [424, 180], [484, 204], 6, "#1a1515", 0.35) + strand([484, 204], [566, 180], [654, 242], 6, "#1a1515", 0.3)) +
  // 가르마: 살짝 밝은 두피 선
  blur(1, line("M318 268Q326 210 344 146", "#8c7a72", 3), 0.55)));
P(line(hairOuter, INK, 6.5) + line(`M680 476${hairline.replace(/Z$/, "")}`, "#1f1a18", 3.5));

// ── 눈썹 (바탕 + 털 결)
P(blur(3, path(browL, `url(#${ID}-brow)`) + path(browR, `url(#${ID}-brow)`), 0.6));
P(clip("brow", blur(1, path(browL, `url(#${ID}-brow)`) + path(browR, `url(#${ID}-brow)`)) +
  browHairs(R, [[410, 434], [356, 410], [300, 422]], 24, { len: 18, spread: 12, color: "#241b19", op: 0.75 }) +
  browHairs(R, [[498, 434], [566, 400], [642, 414]], 24, { len: 18, spread: 12, color: "#241b19", op: 0.75 })));

// ── 눈 (짙은 눈동자, 위 눈꺼풀 선이 또렷)
const eye = (shape, cl, ix, iy, lid, lower, crease, bag) =>
  path(shape, "#e8dcd2") +
  clip(cl,
    blur(3, ell(ix - 44, iy + 4, 15, 12, "#9a6a58") + ell(ix + 44, iy + 4, 15, 12, "#9a6a58"), 0.5) +
    `<circle cx="${ix}" cy="${iy}" r="14" fill="url(#${ID}-iris)"/><circle cx="${ix}" cy="${iy}" r="6.5" fill="#0b0705"/>` +
    blur(2, path(`M${ix - 70} ${iy - 24}H${ix + 70}V${iy - 5}Q${ix} ${iy - 13} ${ix - 70} ${iy - 5}Z`, "#5e3a2e"), 0.6) +
    `<circle cx="${ix + 4}" cy="${iy - 4}" r="3" fill="#ffffff" opacity=".95"/>`) +
  strand(...lid, 7.5, "#1a110d", 1, 0.75) +
  strand(...lower, 2.5, "#8d5a47", 0.6) +
  strand(...crease, 2.8, "#9a5f48", 0.5) +
  strand(...bag, 2.6, "#a3664d", 0.45);
P(eye(eyeL, "el", 364, 477, [[308, 486], [362, 456], [412, 479]], [[320, 484], [364, 496], [404, 480]], [[320, 466], [364, 444], [404, 460]], [[330, 506], [364, 516], [398, 506]]));
P(eye(eyeR, "er", 540, 464, [[492, 470], [542, 444], [592, 467]], [[502, 470], [542, 482], [580, 468]], [[504, 452], [542, 432], [582, 448]], [[512, 492], [544, 503], [576, 492]]));

// ── 코 (곧은 콧대, 둥근 코끝 — 선 대신 그늘 + 콧방울 주름)
P(blur(5, ell(404, 576, 14, 18, SH2) + ell(516, 572, 13, 17, SH), 0.3));
P(blur(1, path("M412 594Q426 583 444 591Q428 600 412 594Z", "#4a2a24") + path("M478 590Q494 581 510 588Q496 598 478 590Z", "#4a2a24")));
P(strand([414, 548], [386, 580], [418, 600], 5, "#935741", 0.85) + strand([508, 544], [536, 576], [504, 596], 5, "#935741", 0.8));
P(strand([440, 602], [461, 609], [482, 600], 3, "#a8674f", 0.5));

// ── 입 (잔잔하게 다문 미소 — 얇은 윗입술)
P(path("M372 671Q404 656 438 656Q451 651 462 656Q474 650 488 653Q524 651 554 662Q522 667 490 668Q462 671 436 670Q404 671 372 671Z", `url(#${ID}-lipU)`));
P(path("M392 675Q428 699 466 699Q512 697 542 669Q508 679 466 680Q424 681 392 675Z", `url(#${ID}-lipL)`));
P(blur(3, ell(466, 690, 24, 4.5, "#ffffff"), 0.4));
P(blur(4, ell(372, 671, 9, 8, SH2) + ell(554, 662, 9, 8, SH2), 0.45));
P(strand([370, 672], [462, 678], [556, 662], 5, "#4a2620", 1, 1, 20));
P(strand([554, 663], [561, 659], [565, 652], 3, "#4a2620", 0.8) + strand([372, 672], [365, 670], [361, 664], 3, "#4a2620", 0.8));

// ── 안경 (가는 금속테 — 렌즈 아래 볼에 테 그림자)
P(glasses({
  lenses: [lensL, lensR],
  bridge: "M423 464Q454 448 489 458",
  temples: ["M261 468L238 472", "M658 460L684 464"],
  frame: "#7a6c64",
  w: 2.8,
  glare: [[[290, 466], [330, 460], [380, 462], 6], [[516, 460], [560, 454], [612, 456], 6]],
  shadow: { filter: `${ID}-b4`, dy: 10, op: 0.22 },
}));

// 위 테는 조금 더 짙게 (금속테의 윗부분)
P(line("M282 448C322 443 376 443 408 448M506 444C542 439 600 439 634 444", "#5a4d46", 3.2));

// ── 얼굴 윤곽
P(line(jaw, INK, 6));

await build({
  name: "lee-eogweon",
  exportName: "LEE_EOGWEON",
  doc: [
    "이억원 금융위원장 — 손으로 짠 벡터 일러스트 (480×560)",
    "참고 사진: Wikimedia Commons 'Lee Eog-weon's portrait (2025.09).jpg' — 대한민국 대통령실, 공공누리 제1유형 (https://www.kogl.or.kr/info/licenseType1.do)",
    "참고 사진이 188×241 로 작아 비율 위주로 맞춰 그린 것 — 고치려면 scripts/portraits/lee-eogweon.mjs 를 고쳐 다시 실행 (README 참고)",
  ],
  credit: "인물 그림 원본 사진: 대한민국 대통령실 · 공공누리 제1유형 · 변형",
  id: ID,
  crop: [-25, 42, 960],
  body: out.join("\n"),
});
