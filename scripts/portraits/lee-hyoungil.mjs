// 이형일 부총리 겸 재정경제부 장관 초상 — 원본 사진(960×1236) 위에서 잰 좌표로 짠 벡터 일러스트
// 사용: node scripts/portraits/lee-hyoungil.mjs  (사진 겹침 확인은 scripts/portraits/photos/lee-hyoungil.jpg 가 있을 때)
// 그리는 순서: 정장·셔츠·넥타이 → 목 → 귀 → 얼굴(바탕 그라데이션 → 흐린 그늘 → 흐린 빛 → 홍조) → 머리(결) → 이목구비 → 안경 → 윤곽선
// 닮게 하는 포인트: 가는 은색 동그란 안경, 이마가 넓게 드러나는 짧은 검은 옆가르마 머리, 넓고 둥근 얼굴과 평평하고 넓은 턱, 윗니가 드러나는 환한 웃음과 눈가 주름
import { blurDefs, browHairs, build, ell, flow, glasses, rng, scallop, strand } from "./lib.mjs";

const ID = "lhi";
const INK = "#2b2018";
const R = rng(20261002);
const SH = "#bf7a58"; // 피부 그늘
const SH2 = "#a05e40"; // 깊은 그늘
const HI = "#fff1e2"; // 피부 빛

const out = [];
const P = (s) => out.push(s);
const blur = (s, inner, op = 1) => `<g filter="url(#${ID}-b${s})"${op < 1 ? ` opacity="${op}"` : ""}>${inner}</g>`;
const clip = (name, inner) => `<g clip-path="url(#${ID}-c-${name})">${inner}</g>`;
const path = (d, fill, extra = "") => `<path d="${d}" fill="${fill}"${extra}/>`;
const line = (d, color, w, op = 1) =>
  `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"${op < 1 ? ` opacity="${op}"` : ""}/>`;

// ── 모양 (사진에서 잰 좌표)
// 머리 바깥선: 왼쪽 옆머리 아래 → 정수리(오른쪽 위로 살짝 솟은 결) → 오른쪽 옆머리 아래
const outerPts = [
  [222, 440], [219, 400, 0.04], [219, 340, 0.05], [224, 282, 0.06], [240, 234, 0.08], [266, 196, 0.1], [312, 164, 0.12], [378, 134, 0.1],
  [448, 114, 0.08], [512, 104, 0.06], [566, 98, 0.08], [604, 92, 0.1], [642, 106, 0.12], [674, 136, 0.1], [708, 178, 0.1],
  [734, 222, 0.08], [750, 280, 0.06], [754, 340, 0.05], [752, 400, 0.04], [746, 432, 0.04],
];
const hairOuter = `M246 454L222 440${scallop(outerPts)}`;
// 숱 많은 머리의 경계: 오른쪽 옆머리 아래 → 깊이 들어간 오른쪽 관자놀이(M자) → 이마 위 → 왼쪽 관자놀이 → 왼쪽 옆머리 아래
// (사진을 밝게 해서 잰 짙은 머리 끝 — 그 아래 이마 쪽은 숱 적은 잔머리로 피부가 비쳐요)
const hairline =
  "L746 432L712 438C702 420 694 396 688 370C682 340 678 300 676 262C674 226 668 196 652 172C640 160 624 154 606 154" +
  "C588 156 574 162 556 166C530 170 504 171 478 171C448 171 418 170 392 172C368 175 344 180 320 188" +
  "C298 198 280 212 268 236C262 256 261 286 263 320C265 360 270 400 278 428C282 440 286 446 290 448L246 454Z";
// 짙은 머리 끝을 따라 (왼쪽 관자놀이 → 오른쪽) [x, y, 그 아래 피부가 온전히 드러나는 선까지의 깊이]
const EDGE = [[266, 244, 30], [276, 214, 30], [296, 198, 26], [320, 188, 24], [344, 181, 20], [370, 175, 18], [392, 172, 16], [420, 170, 14],
  [448, 171, 12], [478, 171, 12], [504, 171, 12], [530, 169, 14], [556, 166, 20], [580, 160, 28], [606, 154, 36], [630, 158, 40], [650, 170, 40], [664, 190, 36], [672, 215, 34]];
// 숱 적은 앞머리 띠 (짙은 머리 끝 ~ 피부가 드러나는 선)
const thinZone =
  `M${EDGE.map(([x, y]) => `${x} ${y}`).join("L")}L668 292C660 262 648 236 632 214C618 200 600 192 576 188C548 183 512 180 478 180` +
  "C440 180 400 184 370 190C346 196 326 206 312 222C302 238 298 258 296 280C290 270 278 258 266 244Z";
const hair = hairOuter + hairline;
// 넓고 둥근 얼굴, 평평하고 넓은 턱 (사진 밝기 경계: 295,640 · 304,700 · 턱끝 500,770 · 664,709 · 689,640)
const jawD =
  "C292 640 298 680 304 706C312 728 326 748 350 760C376 770 410 770 440 770C480 772 520 773 560 770C594 768 618 758 634 746" +
  "C656 726 668 706 678 680C688 654 696 628 700 600";
const face = `M254 300C258 360 268 420 270 480C272 540 280 580 286 610${jawD}C706 540 708 460 702 400C704 330 706 270 694 222C676 160 630 128 560 124C500 120 420 124 360 140C292 158 254 222 254 300Z`;
const jaw = `M286 610${jawD}`;
const neck = "M330 690L328 790L544 932L652 800L650 690Z";
const earL = "M276 452C258 444 238 448 226 466C216 486 220 520 228 546C236 572 248 598 264 612C272 618 282 616 288 606Z";
const earR = "M700 444C716 434 742 436 752 458C760 480 756 520 748 550C740 580 726 602 706 610L698 600Z";
const suitL = "M-20 1140L-20 884C80 862 190 838 256 818C282 806 298 786 306 762L322 772L333 807L400 962L456 1107L470 1140Z";
const suitR = "M650 790C680 800 720 812 760 826C840 856 920 900 980 940L980 1140L700 1140L689 1018L667 829Z";
const lapelL = "M306 762L198 916L186 978L232 974L470 1140L456 1107L400 962L333 807L322 772Z";
const lapelR = "M650 790L782 930L800 966L764 968L700 1140L689 1018L667 829Z";
const shirt = "M322 772L333 807L400 962L456 1107L470 1140L700 1140L689 1018L667 829L650 790Z";
const tieKnot = "M480 950Q546 940 610 956L590 1062Q556 1070 522 1062Z";
const tieBlade = "M522 1062Q556 1070 590 1062L614 1140L512 1140Z";
const wingL = "M326 774L344 788L494 952L470 992L424 1012L336 832Z";
const wingR = "M652 786L640 800L604 952L614 992L656 1030L668 840Z";
// 눈: 웃어서 가늘게 휜 눈 (안경 너머)
const eyeL = "M350 437Q388 412 432 433Q392 436 350 437Z";
const eyeR = "M535 429Q574 407 620 432Q578 434 535 429Z";
// 눈썹: 옅고 부드럽게 둥근 눈썹
const browL = "M446 378C434 366 416 360 396 360C376 360 356 366 340 376L334 386C352 378 372 373 394 373C414 373 432 378 446 386Z";
const browR = "M522 380C534 368 554 360 574 360C596 360 616 366 632 376L640 386C622 379 602 373 580 373C560 373 540 378 522 388Z";
// 안경: 위가 살짝 평평한 동그란 금속테
const lensL = "M330 410C344 394 372 388 400 390C428 392 448 404 452 426C456 452 448 484 428 502C410 516 384 518 362 508C338 496 324 468 322 440C321 428 324 418 330 410Z";
const lensR = "M512 422C518 400 540 388 566 386C594 386 624 394 636 414C644 430 642 456 632 476C618 498 596 508 572 506C548 504 526 490 516 470C510 456 509 436 512 422Z";
// 입: 윗니가 드러나는 환한 웃음 (입꼬리 410,622 · 576,618)
const mouth = "M408 622Q440 604 490 606Q540 604 578 618Q560 642 500 646Q440 646 408 622Z";
const teeth = "M420 618Q456 610 490 609Q536 608 568 616Q548 636 500 640Q448 640 420 618Z";

P(`<defs>${blurDefs(ID, [1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 14, 16, 18])}
<radialGradient id="${ID}-skin" gradientUnits="userSpaceOnUse" cx="486" cy="470" r="420"><stop offset="0" stop-color="#f7d1b2"/><stop offset=".55" stop-color="#ebb591"/><stop offset="1" stop-color="#cf926d"/></radialGradient>
<linearGradient id="${ID}-neck" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cc8c68"/><stop offset="1" stop-color="#e2a984"/></linearGradient>
<linearGradient id="${ID}-ear" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#e09a7c"/><stop offset="1" stop-color="#eebb98"/></linearGradient>
<linearGradient id="${ID}-hair" gradientUnits="userSpaceOnUse" x1="0" y1="80" x2="0" y2="450"><stop offset="0" stop-color="#47413d"/><stop offset=".5" stop-color="#2b2725"/><stop offset="1" stop-color="#211d1c"/></linearGradient>
<linearGradient id="${ID}-suit" gradientUnits="userSpaceOnUse" x1="0" y1="760" x2="0" y2="1140"><stop offset="0" stop-color="#2f3a56"/><stop offset="1" stop-color="#1f2740"/></linearGradient>
<linearGradient id="${ID}-lapel" gradientUnits="userSpaceOnUse" x1="0" y1="760" x2="0" y2="1140"><stop offset="0" stop-color="#36425f"/><stop offset="1" stop-color="#252e4a"/></linearGradient>
<linearGradient id="${ID}-tie" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#26304f"/><stop offset="1" stop-color="#141a30"/></linearGradient>
<linearGradient id="${ID}-lipU" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c77a6c"/><stop offset="1" stop-color="#a85a4e"/></linearGradient>
<linearGradient id="${ID}-lipL" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c26f62"/><stop offset=".5" stop-color="#da9585"/><stop offset="1" stop-color="#cd8676"/></linearGradient>
<linearGradient id="${ID}-teeth" gradientUnits="userSpaceOnUse" x1="420" y1="0" x2="568" y2="0"><stop offset="0" stop-color="#c4b9a6"/><stop offset=".22" stop-color="#f4efe2"/><stop offset=".75" stop-color="#f8f4ea"/><stop offset="1" stop-color="#c9bfad"/></linearGradient>
<radialGradient id="${ID}-iris"><stop offset="0" stop-color="#5a3a2a"/><stop offset=".6" stop-color="#2c1b12"/><stop offset="1" stop-color="#130b08"/></radialGradient>
<linearGradient id="${ID}-browL" gradientUnits="userSpaceOnUse" x1="450" y1="0" x2="332" y2="0"><stop offset="0" stop-color="#8a6a5e"/><stop offset=".3" stop-color="#4c3c36"/><stop offset="1" stop-color="#5a4740"/></linearGradient>
<linearGradient id="${ID}-browR" gradientUnits="userSpaceOnUse" x1="518" y1="0" x2="642" y2="0"><stop offset="0" stop-color="#8a6a5e"/><stop offset=".3" stop-color="#4c3c36"/><stop offset="1" stop-color="#5a4740"/></linearGradient>
<linearGradient id="${ID}-collar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#e6ecf4"/></linearGradient>
<clipPath id="${ID}-c-face"><path d="${face}"/></clipPath>
<clipPath id="${ID}-c-hair"><path d="${hair}"/></clipPath>
<clipPath id="${ID}-c-neck"><path d="${neck}"/></clipPath>
<clipPath id="${ID}-c-earL"><path d="${earL}"/></clipPath>
<clipPath id="${ID}-c-earR"><path d="${earR}"/></clipPath>
<clipPath id="${ID}-c-suit"><path d="${suitL}"/><path d="${suitR}"/></clipPath>
<clipPath id="${ID}-c-shirt"><path d="${shirt}"/></clipPath>
<clipPath id="${ID}-c-tie"><path d="${tieBlade}"/><path d="${tieKnot}"/></clipPath>
<clipPath id="${ID}-c-el"><path d="${eyeL}"/></clipPath>
<clipPath id="${ID}-c-er"><path d="${eyeR}"/></clipPath>
<clipPath id="${ID}-c-brow"><path d="${browL}"/><path d="${browR}"/></clipPath>
<clipPath id="${ID}-c-mouth"><path d="${mouth}"/></clipPath>
<clipPath id="${ID}-c-teeth"><path d="${teeth}"/></clipPath>
</defs>`);

// ── 정장 (짙은 남색, 노치 라펠)
P(path(suitL, `url(#${ID}-suit)`) + path(suitR, `url(#${ID}-suit)`));
P(clip("suit",
  path(lapelL, `url(#${ID}-lapel)`) + path(lapelR, `url(#${ID}-lapel)`) +
  blur(16, line("M306 762L198 916M650 790L782 930", "#121726", 24), 0.5) +
  blur(14, line("M186 978L232 974L470 1140M800 966L764 968L700 1140", "#121726", 20), 0.5) +
  blur(18, ell(120, 880, 130, 28, "#56628a", 1, -14) + ell(850, 876, 130, 28, "#56628a", 1, 18), 0.45) +
  line("M300 776L204 914M656 802L774 932", "#4c5878", 3, 0.8) +
  line(lapelL, "#161b2c", 5) + line(lapelR, "#161b2c", 5)));
P(line(suitL, INK, 6.5) + line(suitR, INK, 6.5));
// ── 셔츠
P(path(shirt, "#f6f8fc"));
P(clip("shirt", blur(10, line("M352 840L440 1060M660 860L676 1100", "#c9d3e2", 18) + ell(540, 960, 110, 36, "#c9d3e2", 0.7))));
P(line("M322 772L333 807L400 962L456 1107L470 1140M700 1140L689 1018L667 829L650 790", INK, 5));
// ── 목 (턱 밑 그늘)
P(path(neck, `url(#${ID}-neck)`));
P(clip("neck", blur(16, ell(490, 764, 190, 52, SH2, 0.95)) + blur(10, ell(544, 900, 50, 24, SH, 0.45)) + blur(10, line("M338 760L344 820M642 760L640 820", SH2, 20), 0.5)));
P(line(neck, INK, 5));
// ── 넥타이 (짙은 남색에 흰 잔점)
P(path(tieBlade, `url(#${ID}-tie)`) + path(tieKnot, `url(#${ID}-tie)`));
let dots = "";
for (let y = 966; y < 1140; y += 28) for (let x = 470 + ((y / 28) % 2) * 14; x < 620; x += 28) dots += `<circle cx="${x}" cy="${y}" r="3" fill="#e9ecf4" opacity=".8"/><circle cx="${x + 14}" cy="${y + 14}" r="1.8" fill="#c8505a" opacity=".7"/>`;
P(clip("tie", dots + blur(3, ell(546, 962, 30, 9, "#4a5a90", 0.5)) + blur(5, line("M556 1072L566 1140", "#43507e", 10, 0.4))));
P(line("M540 1062Q550 1040 556 1064", "#0e1224", 4, 0.8) + line(tieBlade, INK, 5) + line(tieKnot, INK, 5));
// ── 셔츠 깃
P(path(wingL, `url(#${ID}-collar)`) + path(wingR, `url(#${ID}-collar)`));
P(blur(6, line("M350 830L440 940M640 830L620 930", "#cfd8e6", 10)));
P(line(wingL, INK, 5) + line(wingR, INK, 5));

// ── 귀 (발그레한 큰 귀 — 바깥 테두리 → 안쪽 연골 → 오목한 그늘)
P(path(earL, `url(#${ID}-ear)`) + path(earR, `url(#${ID}-ear)`));
P(clip("earL",
  blur(5, path("M270 486C254 486 246 506 248 530C250 552 260 566 272 570C266 546 264 512 270 486Z", SH2), 0.75) +
  blur(8, ell(232, 500, 12, 40, "#ec8a74"), 0.4) +
  blur(4, ell(266, 540, 9, 16, "#8a4434"), 0.4)));
P(strand([274, 456], [226, 452], [228, 530], 6, "#a05a46", 0.9) + strand([228, 530], [234, 574], [266, 606], 4, "#a05a46", 0.6) +
  strand([270, 478], [246, 490], [252, 530], 4, "#b06c56", 0.7) + strand([254, 530], [258, 552], [274, 562], 3.5, "#b06c56", 0.6));
P(clip("earR",
  blur(5, path("M704 476C720 476 728 496 726 520C724 542 714 556 704 560C708 536 710 502 704 476Z", SH2), 0.75) +
  blur(8, ell(744, 490, 10, 38, "#ec8a74"), 0.4) +
  blur(4, ell(708, 530, 8, 15, "#8a4434"), 0.4)));
P(strand([700, 448], [750, 444], [748, 520], 6, "#a05a46", 0.9) + strand([748, 520], [742, 570], [710, 602], 4, "#a05a46", 0.6) +
  strand([704, 470], [728, 480], [722, 520], 4, "#b06c56", 0.7) + strand([720, 522], [716, 546], [702, 556], 3.5, "#b06c56", 0.6));
P(line(earL, INK, 6) + line(earR, INK, 6));

// ── 얼굴
P(path(face, `url(#${ID}-skin)`));
P(clip("face",
  // 그늘 (빛은 정면 — 얼굴 가장자리와 관자놀이가 살짝 어둡게)
  blur(14, path("M276 300C270 400 270 520 286 610C296 680 306 730 340 762L370 760C334 720 318 660 310 600C298 520 298 400 306 300Z", SH), 0.6) +
  blur(14, path("M690 320C700 420 702 520 690 600C682 660 668 720 630 752L600 756C640 716 660 660 668 600C678 520 680 420 666 320Z", SH), 0.6) +
  blur(8, path(thinZone, "#7d6560"), 0.5) +
  blur(5, line(`M${EDGE.map(([x, y]) => `${x} ${y + 4}`).join("L")}`, "#5e4a45", 12), 0.45) +
  blur(10, path("M296 212C330 190 400 180 480 180C560 180 620 186 648 214C664 236 674 268 680 304L668 300C658 270 644 248 620 236C570 214 500 210 430 214C370 218 330 228 306 246Z", SH2), 0.3) +
  blur(12, ell(300, 300, 18, 46, SH) + ell(664, 296, 16, 46, SH), 0.45) +
  // 눈두덩·콧대 옆
  blur(10, ell(390, 420, 58, 18, SH) + ell(576, 416, 56, 18, SH), 0.35) +
  blur(6, ell(450, 436, 12, 20, SH2) + ell(522, 432, 12, 20, SH2), 0.4) +
  blur(6, path("M468 440C466 476 462 504 456 526L446 524C452 500 456 474 458 440Z", SH2), 0.45) +
  blur(6, ell(488, 556, 46, 10, SH2) + ell(428, 530, 12, 18, SH2) + ell(550, 528, 12, 18, SH2), 0.5) +
  // 팔자 주름 + 불룩 올라간 볼 (빛)
  blur(7, line("M426 546Q398 572 394 610M550 544Q580 568 584 604", SH2, 16), 0.5) +
  blur(14, ell(352, 544, 46, 30, HI, 1, -10) + ell(624, 536, 44, 28, HI, 1, 10), 0.4) +
  // 웃어서 생긴 눈 밑 볼살
  blur(6, ell(392, 464, 38, 8, SH) + ell(580, 460, 36, 8, SH), 0.45) +
  blur(7, ell(494, 676, 50, 10, SH2), 0.45) +
  blur(10, path("M290 640C320 710 400 752 490 756C580 752 650 712 690 640L700 760C640 800 560 810 490 810C410 810 330 790 290 740Z", SH2), 0.45) +
  // 빛: 넓은 이마, 콧등, 코끝, 턱
  blur(16, ell(476, 262, 130, 40, HI), 0.5) +
  blur(5, line("M482 440Q484 476 486 506", HI, 11), 0.55) +
  blur(4, ell(486, 516, 20, 13, HI), 0.85) +
  blur(8, ell(494, 730, 40, 14, HI), 0.35) +
  // 홍조 (사진처럼 발그레)
  blur(16, ell(346, 548, 50, 28, "#e5826a") + ell(628, 540, 46, 26, "#e5826a"), 0.26) +
  blur(10, ell(488, 520, 34, 14, "#e5826a"), 0.12) +
  // 수염 자국 (코밑·턱)
  blur(14, ell(492, 584, 70, 14, "#857f8a") + ell(492, 712, 70, 30, "#857f8a"), 0.14)));

// ── 머리 (짧고 짙은 머리에 흰 가닥이 조금, 왼쪽 가르마에서 오른쪽으로 넘김)
const HD = "#141110", HM = "#423b38", HG = "#948d88";
P(path(hair, `url(#${ID}-hair)`));
P(clip("hair",
  blur(12, ell(500, 120, 150, 32, "#5a5450", 0.5, -6)) +
  // 옆머리·관자놀이는 희끗
  blur(10, path("M246 454L222 440Q216 380 222 300Q240 330 262 360Q278 420 290 448Z", "#7a736e") + path("M746 432Q756 380 748 300Q726 330 704 360Q700 400 712 438Z", "#7a736e"), 0.75) +
  // 머리 끝은 숱이 적어 살짝 비침
  blur(6, line("M266 250Q290 200 370 176Q480 166 600 156Q650 164 672 230", "#7c6a62", 12), 0.45) +
  blur(8, line("M282 236Q320 194 420 182Q500 176 590 168Q640 174 660 220", "#0d0b0a", 12), 0.4) +
  // 결: 가르마(왼쪽 앞) → 정수리 넘어 오른쪽으로
  flow(R, [[392, 134], [520, 100], [650, 114]], [[364, 180], [500, 166], [668, 178]], 44, { colors: [[HG, 2], [HM, 3], [HD, 3]], w: [2.5, 5], jitter: 5 }) +
  // 가르마 왼쪽은 아래로
  flow(R, [[384, 134], [282, 172], [226, 320]], [[346, 186], [290, 230], [268, 440]], 22, { colors: [[HG, 1], [HM, 2], [HD, 3]], w: [2.5, 4.5], jitter: 4 }) +
  flow(R, [[300, 166], [230, 240], [224, 440]], [[340, 160], [262, 220], [250, 446]], 14, { colors: [[HG, 2], [HM, 2], [HD, 2]], w: [2.5, 4], jitter: 4 }) +
  // 오른쪽 옆머리는 아래로
  flow(R, [[660, 128], [742, 220], [748, 424]], [[640, 190], [692, 280], [702, 432]], 22, { colors: [[HG, 2], [HM, 2], [HD, 3]], w: [2.5, 4.5], jitter: 4 }) +
  // 윤기·가르마 골
  blur(3, strand([410, 130], [520, 104], [630, 112], 12, "#7d7672", 0.45) + strand([420, 166], [540, 150], [660, 160], 8, "#6d6763", 0.3)) +
  blur(2, strand([388, 136], [372, 160], [356, 182], 7, "#0b0908", 0.6))));
P(line(hairOuter, INK, 6.5));
// 숱 적은 앞머리: 짙은 머리 끝에서 이마 쪽으로 흘러내린 가는 잔머리 (딱딱한 머리선 대신)
const at = (t) => {
  const k = Math.min(EDGE.length - 2, Math.floor(t * (EDGE.length - 1))), f = t * (EDGE.length - 1) - k;
  return [0, 1, 2].map((i) => EDGE[k][i] + (EDGE[k + 1][i] - EDGE[k][i]) * f);
};
let wisps = "";
for (let i = 0; i < 40; i++) {
  const t = Math.min(0.999, (i + R() * 1.6) / 40), [x, y, depth] = at(t);
  const lean = (t - 0.45) * 30 + (R() - 0.5) * 16, len = depth * (0.4 + R() * 0.8), bend = (R() - 0.5) * 10;
  const c = R() < 0.25 ? HD : R() < 0.55 ? HM : HG;
  wisps += strand([x - lean * 0.2, y - 8], [x + lean * 0.4 + bend, y + len * 0.45], [x + lean, y + len], 1.6 + R() * 1.2, c, 0.35 + R() * 0.35, 0.4);
}
P(wisps);
// 정수리 오른쪽에 살짝 솟은 결
P(strand([566, 104], [590, 84], [618, 86], 7, "#1f1b19", 1, 0.5) + strand([584, 102], [608, 82], [636, 94], 5, "#2a2523", 1, 0.5) + strand([600, 104], [626, 90], [646, 104], 4, "#3a3431", 0.9, 0.5));

// ── 눈썹 (옅고 부드러운 둥근 눈썹)
P(blur(3, path(browL, `url(#${ID}-browL)`) + path(browR, `url(#${ID}-browR)`), 0.75));
P(clip("brow", blur(1, path(browL, `url(#${ID}-browL)`) + path(browR, `url(#${ID}-browR)`), 0.9) +
  browHairs(R, [[444, 380], [392, 362], [336, 382]], 30, { len: 18, spread: 10, color: "#2e2420", op: 0.7 }) +
  browHairs(R, [[524, 382], [578, 362], [638, 382]], 30, { len: 18, spread: 10, color: "#2e2420", op: 0.7 })));

// ── 눈 (웃어서 가늘게 휜 눈, 짙은 눈동자, 눈가 주름)
const eye = (shape, cl, ix, iy, lid, lower, crease, bag, feet) =>
  path(shape, "#d9c6b9") +
  clip(cl,
    blur(3, ell(ix - 40, iy + 4, 14, 12, "#a06e5c") + ell(ix + 40, iy + 4, 14, 12, "#a06e5c"), 0.5) +
    `<circle cx="${ix}" cy="${iy}" r="13" fill="url(#${ID}-iris)"/><circle cx="${ix}" cy="${iy}" r="6" fill="#0b0705"/>` +
    blur(2, path(`M${ix - 60} ${iy - 22}H${ix + 60}V${iy - 4}Q${ix} ${iy - 12} ${ix - 60} ${iy - 4}Z`, "#5a3528"), 0.6) +
    `<circle cx="${ix + 4}" cy="${iy - 4}" r="2.8" fill="#ffffff" opacity=".95"/>`) +
  strand(...lid, 9.5, "#1a110d", 1, 0.75) +
  strand(...lower, 2.6, "#86503e", 0.65) +
  strand(...crease, 3, "#9a5c46", 0.55) +
  strand(...bag, 3, "#a5634c", 0.55) +
  feet.map(([a, c, b]) => strand(a, c, b, 2.2, "#9c5c45", 0.45)).join("");
P(eye(eyeL, "el", 397, 428, [[344, 440], [388, 408], [436, 435]], [[356, 437], [392, 439], [428, 434]], [[356, 418], [390, 397], [428, 416]], [[360, 451], [392, 461], [426, 451]],
  [[[342, 440], [330, 438], [318, 432]], [[342, 446], [332, 452], [322, 460]], [[344, 451], [338, 460], [334, 470]]]));
P(eye(eyeR, "er", 572, 424, [[626, 435], [574, 403], [531, 431]], [[540, 429], [578, 434], [614, 432]], [[540, 412], [574, 393], [612, 414]], [[546, 447], [578, 457], [612, 445]],
  [[[628, 433], [640, 430], [652, 424]], [[628, 439], [638, 445], [648, 452]], [[626, 446], [632, 456], [636, 466]]]));

// ── 코 (넓은 콧방울, 둥근 코끝 — 선 대신 그늘 + 콧방울 주름)
P(blur(5, ell(428, 532, 14, 18, SH2) + ell(548, 530, 13, 17, SH2), 0.35));
P(blur(1, path("M440 548Q454 537 471 547Q454 557 440 548Z", "#4a2a20") + path("M505 546Q522 535 539 545Q524 555 505 546Z", "#4a2a20")));
P(strand([442, 500], [410, 532], [446, 554], 5.5, "#955646", 0.9) + strand([534, 498], [568, 528], [532, 552], 5.5, "#955646", 0.85));
P(strand([468, 556], [488, 562], [508, 553], 3, "#a5634c", 0.5));

// ── 입 (윗니가 드러나는 환한 웃음, 도톰한 아랫입술)
P(path(mouth, "#3e1a17"));
P(path(teeth, `url(#${ID}-teeth)`));
P(clip("teeth",
  blur(2, path("M404 604Q490 598 584 606V620Q490 614 404 626Z", "#a08e80"), 0.5) +
  line("M442 614V634M458 612V637M474 611V639M501 610V640M524 610V638M541 611V634M556 613V629", "#d8cfbf", 1.8) +
  blur(2, ell(494, 640, 66, 4, "#c4b8a6"), 0.6)));
P(clip("mouth", blur(4, ell(412, 622, 16, 12, "#1c0b09") + ell(574, 618, 14, 11, "#1c0b09"), 0.8)));
P(path("M404 622Q424 604 446 600Q470 596 489 601Q506 595 530 596Q558 598 582 618Q556 610 530 609Q508 606 490 610Q470 607 448 610Q426 612 404 622Z", `url(#${ID}-lipU)`));
P(path("M418 632Q452 664 500 665Q550 663 574 624Q550 648 500 650Q448 650 418 632Z", `url(#${ID}-lipL)`));
P(blur(3, ell(498, 656, 26, 4, "#ffffff"), 0.4));
P(blur(4, ell(406, 622, 9, 9, SH2) + ell(580, 618, 9, 9, SH2), 0.55));
P(strand([396, 612], [401, 624], [410, 630], 3.2, "#4a2620", 0.8) + strand([590, 606], [586, 620], [576, 626], 3.2, "#4a2620", 0.8));
// 팔자 주름 (선)
P(strand([426, 548], [398, 574], [394, 612], 4.5, "#a05c46", 0.75) + strand([550, 546], [580, 570], [584, 606], 4.5, "#a05c46", 0.75));

// ── 안경 (가는 은색 동그란 금속테)
P(glasses({
  lenses: [lensL, lensR],
  bridge: "M451 424Q481 412 512 421",
  temples: ["M323 434L268 436", "M640 424L702 430"],
  frame: "#6e6a68",
  w: 4.6,
  glare: [[[338, 474], [346, 440], [370, 410], 8], [[524, 470], [532, 440], [552, 408], 8]],
  shadow: { filter: `${ID}-b4`, dy: 9, op: 0.22 },
}));
P(line("M449 442Q446 452 442 459M515 440Q515 452 518 458", "#6e6a68", 3));

// ── 얼굴 윤곽
P(line(jaw, INK, 6));

await build({
  name: "lee-hyoungil",
  exportName: "LEE_HYOUNGIL",
  doc: [
    "이형일 부총리 겸 재정경제부 장관 — 손으로 짠 벡터 일러스트 (480×560)",
    "참고 사진: Wikimedia Commons 'Lee Hyoung-il's portrait (2026.10).jpg' — 대한민국 국회, 공공누리 제1유형 (https://www.kogl.or.kr/info/licenseType1.do)",
    "사진 위에서 잰 머리선·이목구비·턱선 좌표로 그린 것 — 고치려면 scripts/portraits/lee-hyoungil.mjs 를 고쳐 다시 실행 (README 참고)",
  ],
  credit: "인물 그림 원본 사진: 대한민국 국회 · 공공누리 제1유형 · 변형",
  id: ID,
  crop: [0, 8, 960],
  body: out.join("\n"),
});
