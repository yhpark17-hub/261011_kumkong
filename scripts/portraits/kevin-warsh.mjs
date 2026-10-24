// 케빈 워시 연준 의장 초상 — 원본 사진(960×1244) 위에서 잰 좌표로 짠 벡터 일러스트
// 사용: node scripts/portraits/kevin-warsh.mjs  (사진 겹침 확인은 scripts/portraits/photos/kevin-warsh.jpg 가 있을 때)
// 그리는 순서: 정장·셔츠·넥타이 → 목 → 귀 → 얼굴(바탕 그라데이션 → 흐린 그늘 → 흐린 빛 → 홍조) → 머리(결) → 이목구비 → 윤곽선
// 닮게 하는 포인트: 이마를 가로지르는 일자 머리선 + 희끗한 관자놀이, 짙고 긴 눈썹 아래 깊은 눈, 이가 드러나는 큰 웃음과 깊은 팔자 주름, 갸름한 턱, 큰 귀
import { blurDefs, browHairs, build, ell, flow, rng, scallop, strand } from "./lib.mjs";

const ID = "wsh";
const INK = "#2b2018";
const R = rng(20261017);
const SH = "#b0704e"; // 피부 그늘
const SH2 = "#945538"; // 깊은 그늘
const HI = "#fff0de"; // 피부 빛

const out = [];
const P = (s) => out.push(s);
const blur = (s, inner, op = 1) => `<g filter="url(#${ID}-b${s})"${op < 1 ? ` opacity="${op}"` : ""}>${inner}</g>`;
const clip = (name, inner) => `<g clip-path="url(#${ID}-c-${name})">${inner}</g>`;
const path = (d, fill, extra = "") => `<path d="${d}" fill="${fill}"${extra}/>`;
const line = (d, color, w, op = 1) =>
  `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"${op < 1 ? ` opacity="${op}"` : ""}/>`;

// ── 모양 (사진에서 잰 좌표)
const outerPts = [
  [264, 400], [234, 388, 0.06], [227, 330, 0.08], [230, 262, 0.08], [244, 200, 0.1], [270, 140, 0.1], [306, 92, 0.1],
  [356, 54, 0.1], [420, 28, 0.08], [480, 22, 0.06], [534, 38, 0.1], [580, 66, 0.1], [628, 110, 0.1], [664, 166, 0.1],
  [688, 228, 0.1], [698, 290, 0.08], [696, 346, 0.08], [686, 388, 0.06],
];
const hairOuter = `M264 400${scallop(outerPts)}`;
// 이마 위 머리선: 오른쪽 관자놀이 → 이마를 거의 일자로 가로질러 → 왼쪽 관자놀이
const hairline =
  "C680 372 674 352 668 330C662 300 654 268 642 242C632 220 620 206 604 198" +
  "Q570 188 520 186Q470 184 420 186Q370 188 336 196Q316 202 304 210" +
  "C298 236 294 266 288 294C282 324 274 352 268 376Z";
const hair = hairOuter + hairline;
// 갸름하게 좁아지는 V자 아래턱 (사진 밝기 경계에서 잰 점: 290,592 · 344,641 · 426,684 · 턱끝 490,690 · 570,656 · 634,602)
const face =
  "M268 300C264 360 268 430 274 490C277 535 281 568 290 592C302 616 322 628 344 641C368 656 396 676 426 684C450 690 476 692 500 689C528 684 550 672 570 656C592 640 616 624 634 602C648 580 652 540 656 500C662 450 672 390 676 360C680 300 670 240 640 210C600 180 520 168 440 172C360 176 300 196 282 230C272 250 268 270 268 300Z";
const jaw = "M274 490C277 535 281 568 290 592C302 616 322 628 344 641C368 656 396 676 426 684C450 690 476 692 500 689C528 684 550 672 570 656C592 640 616 624 634 602C648 580 652 540 656 500C658 480 660 462 662 446";
const neck = "M334 600L330 728L456 872L626 724L622 600Z";
// 큰 귀 (사진: 왼쪽 x 207~273·y 388~548, 오른쪽 x 660~722·y 362~528)
const earL = "M270 396C258 380 236 376 222 386C206 398 204 428 210 458C214 484 222 506 234 524C244 540 256 548 270 546Z";
const earR = "M666 382C680 364 704 360 716 374C726 390 722 430 716 462C710 490 700 512 686 524C678 530 670 530 664 526Z";
const suitL = "M-20 1260L-20 872C60 846 150 812 220 774C256 754 280 734 292 716L300 1260Z";
const suitR = "M664 712C682 740 724 770 790 800C866 832 930 856 980 876L980 1260L606 1260Z";
const lapelL = "M292 724L104 944L146 958L70 1078L170 1260L300 1260Z";
const lapelR = "M664 718L846 930L806 946L892 1078L790 1260L606 1260Z";
const shirt = "M294 738L300 1260L606 1260L664 736Z";
const tieKnot = "M384 896Q458 884 532 896L506 1006Q464 1014 422 1006Z";
const tieBlade = "M422 1004L506 1004L536 1260L378 1260Z";
const wingL = "M296 714L334 730L456 872L392 906L296 978Z";
const wingR = "M664 710L610 726L456 872L526 904L646 998Z";
// 눈: 바깥 끝이 살짝 처진 아몬드형, 웃어서 아래 눈꺼풀이 올라옴
const eyeL = "M314 360Q336 336 366 336Q394 338 408 352Q392 363 364 365Q334 365 314 360Z";
const eyeR = "M504 350Q520 330 546 330Q576 332 596 356Q574 359 546 359Q520 357 504 350Z";
// 눈썹: 짙고 길며 바깥 1/3 에서 꺾여 내려옴
const browL = "M420 324C412 312 394 305 372 304C350 303 330 307 316 318C304 328 296 340 292 352L302 352C314 340 330 330 350 327C374 324 398 326 420 334Z";
const browR = "M480 334C476 324 482 312 494 304C510 294 532 290 554 292C576 294 594 306 602 320C608 330 610 342 608 348L598 340C590 328 578 320 562 317C538 313 510 320 482 334Z";
// 입: 위 앞니가 다 보이는 웃음 (입꼬리 353,537 · 567,528)
const mouth = "M354 538Q400 528 462 528Q522 526 566 528Q548 560 466 566Q396 566 354 538Z";
const teeth = "M372 538Q412 532 462 532Q520 530 552 530Q544 556 466 563Q404 564 372 538Z";

P(`<defs>${blurDefs(ID, [1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 14, 16, 18])}
<radialGradient id="${ID}-skin" gradientUnits="userSpaceOnUse" cx="420" cy="420" r="440"><stop offset="0" stop-color="#f3caa5"/><stop offset=".55" stop-color="#e2ab83"/><stop offset="1" stop-color="#c58a62"/></radialGradient>
<linearGradient id="${ID}-neck" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c3845f"/><stop offset="1" stop-color="#dca37c"/></linearGradient>
<linearGradient id="${ID}-ear" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#dea07a"/><stop offset="1" stop-color="#ecbb95"/></linearGradient>
<linearGradient id="${ID}-hair" gradientUnits="userSpaceOnUse" x1="0" y1="20" x2="0" y2="400"><stop offset="0" stop-color="#4a4441"/><stop offset=".5" stop-color="#34302e"/><stop offset="1" stop-color="#2a2624"/></linearGradient>
<linearGradient id="${ID}-suit" gradientUnits="userSpaceOnUse" x1="0" y1="710" x2="0" y2="1100"><stop offset="0" stop-color="#525b70"/><stop offset="1" stop-color="#383f50"/></linearGradient>
<linearGradient id="${ID}-lapel" gradientUnits="userSpaceOnUse" x1="0" y1="720" x2="0" y2="1100"><stop offset="0" stop-color="#5b647a"/><stop offset="1" stop-color="#434b5e"/></linearGradient>
<linearGradient id="${ID}-tie" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2f3e72"/><stop offset="1" stop-color="#18213f"/></linearGradient>
<linearGradient id="${ID}-lipU" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b8735f"/><stop offset="1" stop-color="#9a5545"/></linearGradient>
<linearGradient id="${ID}-lipL" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b56a5a"/><stop offset=".5" stop-color="#cc8b78"/><stop offset="1" stop-color="#c07d6a"/></linearGradient>
<linearGradient id="${ID}-teeth" gradientUnits="userSpaceOnUse" x1="372" y1="0" x2="552" y2="0"><stop offset="0" stop-color="#b9b0a5"/><stop offset=".2" stop-color="#f6f3ee"/><stop offset=".75" stop-color="#fbfaf7"/><stop offset="1" stop-color="#c2b9ae"/></linearGradient>
<radialGradient id="${ID}-iris"><stop offset="0" stop-color="#5e3d2a"/><stop offset=".6" stop-color="#2e1c13"/><stop offset="1" stop-color="#140c08"/></radialGradient>
<linearGradient id="${ID}-brow" gradientUnits="userSpaceOnUse" x1="0" y1="290" x2="0" y2="356"><stop offset="0" stop-color="#2a2321"/><stop offset="1" stop-color="#3b322f"/></linearGradient>
<linearGradient id="${ID}-collar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#e6ecf4"/></linearGradient>
<clipPath id="${ID}-c-face"><path d="${face}"/></clipPath>
<clipPath id="${ID}-c-hair"><path d="${hair}"/></clipPath>
<clipPath id="${ID}-c-neck"><path d="${neck}"/></clipPath>
<clipPath id="${ID}-c-earL"><path d="${earL}"/></clipPath>
<clipPath id="${ID}-c-earR"><path d="${earR}"/></clipPath>
<clipPath id="${ID}-c-suit"><path d="${suitL}"/><path d="${suitR}"/></clipPath>
<clipPath id="${ID}-c-shirt"><path d="${shirt}"/></clipPath>
<clipPath id="${ID}-c-el"><path d="${eyeL}"/></clipPath>
<clipPath id="${ID}-c-er"><path d="${eyeR}"/></clipPath>
<clipPath id="${ID}-c-brow"><path d="${browL}"/><path d="${browR}"/></clipPath>
<clipPath id="${ID}-c-mouth"><path d="${mouth}"/></clipPath>
<clipPath id="${ID}-c-teeth"><path d="${teeth}"/></clipPath>
</defs>`);

// ── 정장 (회청색, 노치 라펠)
P(path(suitL, `url(#${ID}-suit)`) + path(suitR, `url(#${ID}-suit)`));
P(clip("suit",
  path(lapelL, `url(#${ID}-lapel)`) + path(lapelR, `url(#${ID}-lapel)`) +
  blur(16, line("M292 724L104 944M664 718L846 930", "#262b37", 26), 0.45) +
  blur(14, line("M146 958L70 1078L170 1260M806 946L892 1078L790 1260", "#262b37", 22), 0.5) +
  blur(18, ell(130, 860, 140, 30, "#6a748c", 1, -18) + ell(830, 856, 140, 30, "#6a748c", 1, 18), 0.5) +
  line("M286 738L118 936M670 732L834 924", "#6d778f", 3, 0.8) +
  line(lapelL, "#2a303d", 5) + line(lapelR, "#2a303d", 5) +
  line("M736 1150L800 1196", "#2a303d", 6)));
P(line(suitL, INK, 6.5) + line(suitR, INK, 6.5));
// ── 셔츠
P(path(shirt, "#f6f8fc"));
P(clip("shirt", blur(10, line("M318 1000L314 1260M620 1000L604 1200", "#c9d3e2", 18) + ell(456, 930, 120, 40, "#c9d3e2", 0.7))));
P(line("M294 738L300 1260M606 1260L664 736", INK, 5));
// ── 목 (턱 밑 그늘이 짙게)
P(path(neck, `url(#${ID}-neck)`));
P(clip("neck", blur(16, ell(476, 672, 170, 60, SH2, 0.95)) + blur(10, ell(456, 850, 50, 26, SH, 0.5)) + blur(10, line("M340 640L344 760M614 640L610 760", SH2, 22), 0.55)));
P(line(neck, INK, 5));
// ── 넥타이 (짙은 남색 니트)
P(path(tieBlade, `url(#${ID}-tie)`) + blur(5, line("M470 1020L490 1260", "#4a5b9c", 10, 0.4)) + line(tieBlade, INK, 5));
P(path(tieKnot, `url(#${ID}-tie)`) + blur(3, ell(470, 912, 30, 9, "#5466a8", 0.5)) + line("M452 1012Q464 1030 470 1050", "#121935", 4, 0.8) + line(tieKnot, INK, 5));
// ── 셔츠 깃
P(path(wingL, `url(#${ID}-collar)`) + path(wingR, `url(#${ID}-collar)`));
P(blur(6, line("M322 800L380 870M620 790L560 860", "#cfd8e6", 10)));
P(line(wingL, INK, 5) + line(wingR, INK, 5));

// ── 귀 (바깥 테두리 → 안쪽 Y자 연골 → 귓구멍 쪽 오목한 그늘)
P(path(earL, `url(#${ID}-ear)`) + path(earR, `url(#${ID}-ear)`));
P(clip("earL",
  blur(5, path("M262 430C246 428 236 446 236 470C236 492 246 506 260 510C254 486 254 456 262 430Z", SH2), 0.8) +
  blur(8, ell(220, 440, 12, 40, "#e98a70"), 0.35) +
  blur(4, ell(254, 486, 10, 16, "#7a3e2c"), 0.45)));
P(strand([262, 394], [214, 396], [218, 470], 6, "#965a43", 0.9) + strand([218, 470], [222, 510], [252, 540], 4, "#965a43", 0.6) +
  strand([258, 418], [232, 432], [240, 470], 4, "#a8684e", 0.7) + strand([242, 470], [246, 494], [262, 504], 3.5, "#a8684e", 0.6));
P(clip("earR",
  blur(5, path("M672 420C688 418 698 436 698 460C698 482 688 496 676 500C682 476 682 446 672 420Z", SH2), 0.8) +
  blur(8, ell(712, 420, 10, 36, "#e98a70"), 0.35) +
  blur(4, ell(680, 474, 9, 15, "#7a3e2c"), 0.45)));
P(strand([670, 384], [716, 376], [712, 450], 6, "#965a43", 0.9) + strand([712, 450], [708, 494], [682, 520], 4, "#965a43", 0.6) +
  strand([676, 408], [700, 418], [694, 456], 4, "#a8684e", 0.7) + strand([692, 458], [690, 482], [674, 494], 3.5, "#a8684e", 0.6));
P(line(earL, INK, 6) + line(earR, INK, 6));

// ── 얼굴
P(path(face, `url(#${ID}-skin)`));
P(clip("face",
  // 그늘 (빛은 왼쪽 앞에서 — 오른쪽 볼이 그늘, 광대 밑이 쏙 들어감)
  blur(14, path("M680 320C674 420 664 520 652 580C638 640 612 680 562 700L520 708C574 680 604 640 620 590C634 530 644 430 652 320Z", SH), 0.75) +
  blur(10, path("M270 330C266 420 272 520 284 590C292 620 300 640 310 650L322 640C306 600 296 540 292 470C288 420 288 370 292 330Z", SH), 0.6) +
  blur(16, ell(314, 560, 28, 66, SH2, 1, -12) + ell(624, 556, 26, 64, SH2, 1, 12), 0.65) +
  blur(10, path("M296 232C330 214 400 204 470 202C540 200 600 210 636 240C652 262 664 300 672 346L660 342C650 300 636 270 610 254C560 232 480 228 420 232C360 236 320 246 300 262Z", SH2), 0.55) +
  blur(10, ell(292, 300, 18, 50, SH) + ell(662, 300, 16, 50, SH), 0.45) +
  // 깊은 눈두덩: 눈썹과 눈 사이, 콧대 옆 안쪽 구석이 가장 어둡게
  blur(10, ell(364, 338, 64, 24, SH2) + ell(548, 332, 60, 22, SH2), 0.5) +
  blur(6, ell(420, 350, 14, 22, "#7e4430") + ell(492, 344, 13, 20, "#7e4430"), 0.55) +
  blur(5, line("M454 326L456 346", SH2, 6), 0.4) +
  blur(6, path("M472 350C482 400 494 440 506 466L494 470C484 440 474 400 462 352Z", SH2), 0.55) +
  blur(6, ell(462, 494, 50, 10, SH2) + ell(412, 472, 12, 18, SH2) + ell(512, 470, 12, 18, SH2), 0.55) +
  // 깊은 팔자 주름: 콧방울 옆에서 입꼬리 바깥으로 휘어 내려감 + 위쪽 볼이 불룩 (빛)
  blur(7, line("M404 482Q368 500 350 534Q342 556 350 572M520 478Q560 492 576 520Q586 544 578 562", SH2, 18), 0.55) +
  blur(12, ell(342, 474, 40, 24, HI, 1, -15) + ell(582, 468, 36, 22, HI, 1, 15), 0.3) +
  // 웃어서 올라간 눈 밑 볼살·주름
  blur(6, ell(362, 384, 40, 9, SH) + ell(548, 376, 38, 9, SH), 0.45) +
  blur(7, ell(466, 590, 54, 10, SH2), 0.5) +
  blur(10, path("M290 584C320 640 400 676 470 680C540 676 600 640 630 590L644 680C600 720 520 730 466 730C400 730 330 710 290 670Z", SH2), 0.55) +
  // 빛
  blur(14, ell(440, 254, 110, 26, HI), 0.4) +
  blur(5, line("M452 362Q454 410 458 450", HI, 11), 0.6) +
  blur(3, ell(456, 456, 15, 10, HI), 0.8) +
  blur(8, ell(466, 652, 30, 12, HI), 0.4) +
  // 홍조
  blur(16, ell(346, 486, 44, 22, "#e5826a") + ell(584, 480, 38, 20, "#e5826a"), 0.22) +
  blur(10, ell(460, 470, 32, 13, "#e5826a"), 0.12) +
  // 수염 자국 (턱·입 주위가 살짝 푸르스름)
  blur(14, ell(456, 516, 80, 16, "#7d7a86") + ell(466, 630, 62, 26, "#7d7a86"), 0.16)));

// ── 머리 (짧게 다듬은 짙은 머리에 흰 가닥이 고루 섞임, 관자놀이·옆머리는 더 희끗)
const HD = "#191615", HM = "#5a5450", HG = "#9e9893";
P(path(hair, `url(#${ID}-hair)`));
P(clip("hair",
  blur(10, path("M264 400L234 388Q228 360 227 330Q226 296 230 262Q252 300 268 340Q270 370 264 400Z", "#8a847f") +
    path("M686 388Q696 368 696 346Q700 318 698 290Q680 316 668 330Q676 360 686 388Z", "#8a847f"), 0.85) +
  blur(12, ell(470, 74, 160, 30, "#8f8984", 0.55, -6)) +
  blur(8, line("M304 222Q420 190 600 200Q640 218 660 268", "#141110", 18), 0.55) +
  // 결: 왼쪽 가르마 → 정수리 넘어 오른쪽 아래로
  flow(R, [[330, 82], [450, 30], [604, 70]], [[296, 124], [450, 40], [660, 172]], 30, { colors: [[HG, 2], [HM, 2], [HD, 3]], w: [2.5, 5], jitter: 5 }) +
  flow(R, [[296, 124], [450, 40], [660, 172]], [[286, 170], [450, 100], [676, 250]], 34, { colors: [[HG, 2], [HM, 2], [HD, 3]], w: [2.5, 5], jitter: 5 }) +
  flow(R, [[286, 170], [450, 100], [676, 250]], [[300, 214], [470, 160], [664, 300]], 30, { colors: [[HG, 1], [HM, 2], [HD, 3]], w: [2.5, 4.5], jitter: 5 }) +
  flow(R, [[292, 120], [244, 190], [240, 330]], [[282, 212], [252, 272], [256, 384]], 18, { colors: [[HG, 3], [HM, 2], [HD, 2]], w: [2.5, 4], jitter: 4 }) +
  flow(R, [[600, 116], [672, 180], [692, 300]], [[640, 200], [688, 282], [690, 376]], 18, { colors: [[HG, 3], [HM, 2], [HD, 2]], w: [2.5, 4], jitter: 4 }) +
  // 윤기·골
  blur(3, strand([336, 96], [450, 46], [600, 78], 12, "#aaa49e", 0.45) + strand([322, 160], [460, 100], [640, 176], 10, "#aaa49e", 0.35)) +
  blur(2, strand([300, 140], [460, 80], [660, 196], 8, "#0f0d0c", 0.5))));
P(line(hairOuter, INK, 6.5) + line(`M686 388${hairline.replace(/Z$/, "")}L264 400`, "#1f1a18", 3.5));
// ── 눈썹 (짙고 길게 — 바탕 + 털 결)
P(blur(3, path(browL, `url(#${ID}-brow)`) + path(browR, `url(#${ID}-brow)`), 0.8));
P(clip("brow", blur(1, path(browL, `url(#${ID}-brow)`) + path(browR, `url(#${ID}-brow)`)) +
  browHairs(R, [[418, 330], [352, 306], [296, 350]], 36, { len: 24, spread: 14, color: "#141010" }) +
  browHairs(R, [[482, 330], [548, 296], [606, 344]], 36, { len: 24, spread: 14, color: "#141010" })));

// ── 눈 (짙은 갈색 큰 눈동자, 위 눈꺼풀 주름이 또렷, 웃어서 생긴 눈가 주름)
const eye = (shape, cl, ix, iy, lid, lower, crease, bag, feet) =>
  path(shape, "#e8dcd2") +
  clip(cl,
    blur(3, ell(ix - 46, iy + 4, 16, 14, "#9a6a58") + ell(ix + 46, iy + 4, 16, 14, "#9a6a58"), 0.5) +
    `<circle cx="${ix}" cy="${iy}" r="16.5" fill="url(#${ID}-iris)"/><circle cx="${ix}" cy="${iy}" r="7" fill="#0b0705"/>` +
    blur(2, path(`M${ix - 70} ${iy - 26}H${ix + 70}V${iy - 6}Q${ix} ${iy - 15} ${ix - 70} ${iy - 6}Z`, "#4e2e22"), 0.6) +
    `<circle cx="${ix + 5}" cy="${iy - 5}" r="3.4" fill="#ffffff" opacity=".95"/>`) +
  strand(...lid, 8.5, "#1a110d", 1, 0.8) +
  strand(...lower, 2.8, "#7d4c3a", 0.7) +
  strand(...crease, 3.6, "#7a4532", 0.7) +
  strand(...bag, 3, "#9a5f47", 0.55) +
  feet.map(([a, c, b]) => strand(a, c, b, 2.2, "#94593f", 0.38)).join("");
P(eye(eyeL, "el", 364, 352, [[306, 364], [360, 322], [412, 353]], [[318, 361], [362, 372], [404, 355]], [[316, 344], [360, 314], [404, 334]], [[328, 384], [362, 396], [396, 384]],
  [[[304, 366], [294, 362], [284, 356]], [[304, 370], [294, 374], [286, 380]]]));
P(eye(eyeR, "er", 544, 346, [[500, 352], [548, 314], [604, 360]], [[508, 351], [548, 362], [592, 357]], [[506, 330], [548, 306], [596, 334]], [[516, 376], [550, 390], [584, 378]],
  [[[606, 360], [616, 356], [626, 350]], [[606, 365], [615, 370], [623, 377]]]));

// ── 코 (길고 곧은 콧대, 둥글고 넓은 코끝 — 선 대신 그늘 + 콧방울 주름)
P(blur(5, ell(408, 466, 14, 18, SH2) + ell(514, 462, 13, 17, SH), 0.35));
P(blur(1, path("M410 478Q424 468 442 477Q428 486 410 478Z", "#4a2a20") + path("M480 474Q494 465 508 472Q496 482 480 474Z", "#4a2a20")));
P(strand([414, 444], [384, 470], [420, 488], 5.5, "#8f5440", 0.9) + strand([508, 442], [538, 466], [500, 486], 5.5, "#8f5440", 0.85));
P(strand([436, 488], [460, 498], [484, 486], 3, "#9e5f48", 0.5));

// ── 입 (위 앞니가 드러나는 큰 웃음 — 얇은 윗입술, 입꼬리가 올라감)
P(path(mouth, "#3e1a17"));
P(path(teeth, `url(#${ID}-teeth)`));
P(clip("teeth",
  blur(2, path("M360 528Q460 522 566 520V538Q460 542 360 548Z", "#9c8a7e"), 0.55) +
  line("M417 534V556M437 533V559M463 532V560M490 531V558M510 531V554M530 530V549M397 536V551", "#d6cdc2", 1.8) +
  blur(2, ell(462, 560, 70, 4, "#c9bfb3"), 0.6)));
P(clip("mouth", blur(4, ell(362, 542, 16, 14, "#1c0b09") + ell(558, 534, 14, 12, "#1c0b09"), 0.8)));
P(path("M350 538Q390 522 436 522Q452 518 464 523Q478 518 496 521Q536 520 570 526Q534 530 496 530Q478 528 464 531Q450 528 436 531Q394 532 350 538Z", `url(#${ID}-lipU)`));
P(path("M370 554Q418 582 468 582Q524 580 558 542Q530 564 468 565Q410 566 370 554Z", `url(#${ID}-lipL)`));
P(blur(3, ell(466, 575, 24, 4, "#ffffff"), 0.4));
P(blur(4, ell(352, 538, 9, 9, SH2) + ell(568, 528, 9, 9, SH2), 0.55));
P(strand([342, 528], [347, 540], [356, 546], 3.4, "#4a2620", 0.85) + strand([578, 516], [576, 528], [568, 534], 3.4, "#4a2620", 0.85));
// 팔자 주름 (선)
P(strand([408, 480], [370, 498], [350, 534], 5, "#9a5a42", 0.8) + strand([516, 476], [560, 490], [578, 522], 5, "#9a5a42", 0.8));

// ── 얼굴 윤곽
P(line(jaw, INK, 6));

await build({
  name: "kevin-warsh",
  exportName: "KEVIN_WARSH",
  doc: [
    "케빈 워시 연준 의장 — 손으로 짠 벡터 일러스트 (480×560)",
    "참고 사진: Wikimedia Commons 'Official portrait of Kevin M. Warsh (cropped)2.jpg' — 미국 연방준비제도 이사회, 퍼블릭 도메인",
    "사진 위에서 잰 머리선·이목구비·턱선 좌표로 그린 것 — 고치려면 scripts/portraits/kevin-warsh.mjs 를 고쳐 다시 실행 (README 참고)",
  ],
  credit: "인물 그림 원본 사진: 미국 연준 이사회 · 퍼블릭 도메인",
  id: ID,
  crop: [0, -60, 960],
  body: out.join("\n"),
});
