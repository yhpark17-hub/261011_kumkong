// 케빈 워시 연준 의장 초상 — 원본 사진(960×1244) 위에서 잰 좌표로 짠 벡터 일러스트
// 사용: node scripts/portraits/kevin-warsh.mjs  (사진 겹침 확인은 scripts/portraits/photos/kevin-warsh.jpg 가 있을 때)
// 그리는 순서: 정장·셔츠·넥타이 → 목 → 귀 → 얼굴(바탕 그라데이션 → 흐린 그늘 → 흐린 빛 → 홍조) → 머리(결) → 이목구비 → 윤곽선
import { blurDefs, build, ell, flow, rng, scallop, strand } from "./lib.mjs";

const ID = "wsh";
const INK = "#2b2018";
const R = rng(20261017);
const SH = "#c07d5e"; // 피부 그늘
const SH2 = "#a5624a"; // 깊은 그늘
const HI = "#fff3e6"; // 피부 빛

const out = [];
const P = (s) => out.push(s);
const blur = (s, inner, op = 1) => `<g filter="url(#${ID}-b${s})"${op < 1 ? ` opacity="${op}"` : ""}>${inner}</g>`;
const clip = (name, inner) => `<g clip-path="url(#${ID}-c-${name})">${inner}</g>`;
const path = (d, fill, extra = "") => `<path d="${d}" fill="${fill}"${extra}/>`;
const line = (d, color, w, op = 1) =>
  `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"${op < 1 ? ` opacity="${op}"` : ""}/>`;
// 눈썹 결 — 눈썹 가운데 곡선(안쪽 끝 → 바깥 끝)을 따라 바깥쪽 위로 비스듬히 난 털
function browHairs([p0, c, p1], n, len, color) {
  let s = "";
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n, u = 1 - t;
    const x = u * u * p0[0] + 2 * u * t * c[0] + t * t * p1[0];
    const y = u * u * p0[1] + 2 * u * t * c[1] + t * t * p1[1];
    const dx = 2 * u * (c[0] - p0[0]) + 2 * t * (p1[0] - c[0]), dy = 2 * u * (c[1] - p0[1]) + 2 * t * (p1[1] - c[1]);
    const k = Math.hypot(dx, dy), ux = dx / k, uy = dy / k;
    const up = t < 0.75 ? -0.35 : 0.1; // 앞쪽 털은 위로, 꼬리 쪽은 결대로
    const ex = x + (ux + uy * up * Math.sign(ux)) * len, ey = y + (uy - Math.abs(ux) * up) * len;
    s += strand([x - ux * 4, y + 5], [x + ux * len * 0.4, y - 1], [ex, ey], 3.4, color, 0.85);
  }
  return s;
}

// ── 모양 (사진에서 잰 좌표)
const outerPts = [
  [264, 400], [234, 388, 0.06], [227, 330, 0.08], [230, 262, 0.08], [244, 200, 0.1], [270, 140, 0.1], [306, 92, 0.1],
  [356, 54, 0.1], [420, 28, 0.08], [480, 22, 0.06], [534, 38, 0.1], [580, 66, 0.1], [628, 110, 0.1], [664, 166, 0.1],
  [688, 228, 0.1], [698, 290, 0.08], [696, 346, 0.08], [686, 388, 0.06],
];
const hairOuter = `M264 400${scallop(outerPts)}`;
// 이마 위 머리선: 오른쪽 관자놀이 → 이마를 가로질러 → 왼쪽 관자놀이
const hairline =
  "C680 372 674 352 668 330C662 300 652 268 638 238C628 216 612 198 592 188" +
  "Q566 180 520 176Q470 172 420 176Q370 180 336 190Q316 196 302 204" +
  "C298 230 294 262 288 292C282 322 274 352 268 376Z";
const hair = hairOuter + hairline;
const face =
  "M268 300C264 360 268 430 274 490C280 550 288 600 304 636C320 668 346 692 378 702C410 710 470 712 516 706C556 698 590 682 612 656C634 630 646 590 654 540C662 480 670 420 676 360C680 300 670 240 640 210C600 180 520 168 440 172C360 176 300 196 282 230C272 250 268 270 268 300Z";
const jaw = "M274 490C280 550 288 600 304 636C320 668 346 692 378 702C410 710 470 712 516 706C556 698 590 682 612 656C634 630 646 590 654 540C658 512 662 480 666 452";
const neck = "M336 600L332 728L456 872L612 724L610 600Z";
const earL = "M272 392C252 370 224 370 214 396C204 426 210 474 222 504C232 528 248 544 266 548Z";
const earR = "M672 384C690 362 714 364 720 390C726 420 720 470 708 498C700 514 690 526 674 530Z";
const suitL = "M-20 1260L-20 872C60 846 150 812 220 774C256 754 280 734 292 716L300 1260Z";
const suitR = "M664 712C682 740 724 770 790 800C866 832 930 856 980 876L980 1260L606 1260Z";
const lapelL = "M292 724L104 944L146 958L70 1078L170 1260L300 1260Z";
const lapelR = "M664 718L846 930L806 946L892 1078L790 1260L606 1260Z";
const shirt = "M294 738L300 1260L606 1260L664 736Z";
const tieKnot = "M384 896Q458 884 532 896L506 1006Q464 1014 422 1006Z";
const tieBlade = "M422 1004L506 1004L536 1260L378 1260Z";
const wingL = "M296 714L334 730L456 872L392 906L296 978Z";
const wingR = "M664 710L610 726L456 872L526 904L646 998Z";
const eyeL = "M326 358Q344 338 368 338Q394 340 408 354Q390 366 366 367Q342 366 326 358Z";
const eyeR = "M500 350Q516 331 542 330Q568 330 586 346Q568 358 544 359Q518 358 500 350Z";
const mouth = "M358 543Q400 534 460 535Q520 532 566 530Q544 568 466 571Q398 571 358 543Z";
const teeth = "M366 543Q410 535 462 535Q520 533 560 531Q540 561 466 565Q400 565 366 543Z";

P(`<defs>${blurDefs(ID, [1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 14, 16, 18])}
<radialGradient id="${ID}-skin" gradientUnits="userSpaceOnUse" cx="420" cy="420" r="440"><stop offset="0" stop-color="#f9d6b8"/><stop offset=".55" stop-color="#efbd98"/><stop offset="1" stop-color="#d69873"/></radialGradient>
<linearGradient id="${ID}-neck" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d49571"/><stop offset="1" stop-color="#e8b28c"/></linearGradient>
<linearGradient id="${ID}-ear" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#e9b18d"/><stop offset="1" stop-color="#f3c6a3"/></linearGradient>
<linearGradient id="${ID}-hair" gradientUnits="userSpaceOnUse" x1="0" y1="20" x2="0" y2="400"><stop offset="0" stop-color="#504a46"/><stop offset=".5" stop-color="#36312f"/><stop offset="1" stop-color="#262220"/></linearGradient>
<linearGradient id="${ID}-suit" gradientUnits="userSpaceOnUse" x1="0" y1="710" x2="0" y2="1100"><stop offset="0" stop-color="#525b70"/><stop offset="1" stop-color="#383f50"/></linearGradient>
<linearGradient id="${ID}-lapel" gradientUnits="userSpaceOnUse" x1="0" y1="720" x2="0" y2="1100"><stop offset="0" stop-color="#5b647a"/><stop offset="1" stop-color="#434b5e"/></linearGradient>
<linearGradient id="${ID}-tie" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2f3e72"/><stop offset="1" stop-color="#18213f"/></linearGradient>
<linearGradient id="${ID}-lipU" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c47b6b"/><stop offset="1" stop-color="#a65b4d"/></linearGradient>
<linearGradient id="${ID}-lipL" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b9695a"/><stop offset=".45" stop-color="#d4907d"/><stop offset="1" stop-color="#c98270"/></linearGradient>
<linearGradient id="${ID}-teeth" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#cfc8be"/><stop offset=".22" stop-color="#fbfaf7"/><stop offset=".78" stop-color="#fbfaf7"/><stop offset="1" stop-color="#cfc8be"/></linearGradient>
<radialGradient id="${ID}-iris"><stop offset="0" stop-color="#8a5f43"/><stop offset=".7" stop-color="#43281b"/><stop offset="1" stop-color="#1d120c"/></radialGradient>
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
// ── 목
P(path(neck, `url(#${ID}-neck)`));
P(clip("neck", blur(18, ell(470, 690, 190, 70, SH2, 0.85)) + blur(10, ell(456, 850, 50, 26, SH, 0.5))));
P(line(neck, INK, 5));
// ── 넥타이 (짙은 남색 니트)
P(path(tieBlade, `url(#${ID}-tie)`) + blur(5, line("M470 1020L490 1260", "#4a5b9c", 10, 0.4)) + line(tieBlade, INK, 5));
P(path(tieKnot, `url(#${ID}-tie)`) + blur(3, ell(470, 912, 30, 9, "#5466a8", 0.5)) + line("M452 1012Q464 1030 470 1050", "#121935", 4, 0.8) + line(tieKnot, INK, 5));
// ── 셔츠 깃
P(path(wingL, `url(#${ID}-collar)`) + path(wingR, `url(#${ID}-collar)`));
P(blur(6, line("M322 800L380 870M620 790L560 860", "#cfd8e6", 10)));
P(line(wingL, INK, 5) + line(wingR, INK, 5));

// ── 귀
P(path(earL, `url(#${ID}-ear)`) + path(earR, `url(#${ID}-ear)`));
P(clip("earL", blur(5, path("M254 404C236 400 228 430 232 466C236 492 244 508 256 516C250 486 248 440 254 404Z", SH2), 0.85) + blur(8, ell(226, 450, 16, 40, "#ea8a72"), 0.3)));
P(clip("earR", blur(5, path("M690 396C706 396 710 430 704 466C700 488 694 500 686 506C690 476 692 430 690 396Z", SH2), 0.85) + blur(8, ell(708, 440, 14, 36, "#ea8a72"), 0.3)));
P(strand([254, 400], [222, 420], [232, 486], 6, "#94553e", 0.95) + strand([240, 490], [256, 504], [254, 526], 5, "#94553e", 0.9));
P(strand([690, 396], [714, 420], [704, 480], 6, "#94553e", 0.95));
P(line(earL, INK, 6) + line(earR, INK, 6));

// ── 얼굴
P(path(face, `url(#${ID}-skin)`));
P(clip("face",
  // 그늘 (빛은 왼쪽 앞에서 — 오른쪽 볼이 살짝 그늘)
  blur(14, path("M680 320C674 420 664 520 652 580C638 640 612 680 562 700L520 708C574 680 604 640 620 590C634 530 644 430 652 320Z", SH), 0.6) +
  blur(10, path("M270 330C266 420 272 520 284 590C292 620 300 640 310 650L322 640C306 600 296 540 292 470C288 420 288 370 292 330Z", SH), 0.35) +
  blur(10, path("M296 224C330 202 400 192 470 190C540 188 600 198 636 230C652 252 664 292 672 342L660 338C650 292 636 260 610 242C560 220 480 216 420 220C360 224 320 234 300 252Z", SH2), 0.55) +
  blur(10, ell(292, 300, 18, 50, SH) + ell(662, 300, 16, 50, SH), 0.4) +
  blur(10, ell(366, 340, 62, 26, SH) + ell(544, 334, 58, 24, SH), 0.4) +
  blur(7, ell(424, 346, 14, 26, SH2) + ell(486, 340, 13, 24, SH2), 0.42) +
  blur(6, path("M472 350C482 400 494 440 506 466L494 470C484 440 474 400 462 352Z", SH2), 0.5) +
  blur(6, ell(462, 496, 52, 10, SH2) + ell(414, 474, 12, 18, SH2) + ell(512, 472, 12, 18, SH2), 0.5) +
  blur(6, line("M410 490Q380 510 364 540M516 488Q556 504 574 528", SH2, 16), 0.45) +
  blur(7, ell(466, 600, 56, 12, SH2), 0.45) +
  blur(10, path("M300 620C330 680 400 708 466 712C540 710 600 690 630 640L640 700C600 740 520 750 466 750C400 750 330 730 300 690Z", SH2), 0.55) +
  // 빛
  blur(14, ell(440, 250, 110, 26, HI), 0.35) +
  blur(5, line("M452 362Q454 410 458 450", HI, 11), 0.55) +
  blur(3, ell(458, 460, 14, 9, HI), 0.75) +
  blur(10, ell(350, 470, 40, 20, HI, 1, -8) + ell(575, 465, 36, 18, HI, 1, 8), 0.4) +
  blur(8, ell(466, 660, 40, 16, HI), 0.45) +
  blur(8, ell(366, 394, 40, 8, HI) + ell(540, 388, 38, 8, HI), 0.3) +
  // 홍조
  blur(16, ell(350, 482, 46, 24, "#ea8a72") + ell(584, 476, 40, 22, "#ea8a72"), 0.22) +
  blur(10, ell(462, 470, 34, 14, "#ea8a72"), 0.12)));

// ── 머리 (짧게 다듬어 왼쪽 가르마에서 오른쪽으로 넘긴 짙은 머리, 관자놀이 쪽 희끗)
P(path(hair, `url(#${ID}-hair)`));
P(clip("hair",
  blur(10, path("M264 400L234 388Q228 360 227 330Q226 296 230 262Q252 300 268 340Q270 370 264 400Z", "#77716d") +
    path("M686 388Q696 368 696 346Q700 318 698 290Q680 316 668 330Q676 360 686 388Z", "#77716d"), 0.8) +
  blur(12, ell(470, 74, 160, 30, "#8f8984", 0.6, -6)) +
  blur(8, line("M302 214Q420 176 600 190Q640 210 660 260", "#141110", 18), 0.6) +
  // 결: 왼쪽 가르마 → 정수리 넘어 오른쪽 아래로
  flow(R, [[330, 82], [450, 30], [604, 70]], [[296, 124], [450, 40], [660, 172]], 26, { colors: [["#8d8781", 2], ["#191615", 3]], w: [2.5, 5], jitter: 5 }) +
  flow(R, [[296, 124], [450, 40], [660, 172]], [[286, 170], [450, 96], [676, 250]], 30, { colors: [["#857f7a", 2], ["#171413", 3]], w: [2.5, 5], jitter: 5 }) +
  flow(R, [[286, 170], [450, 96], [676, 250]], [[300, 204], [470, 150], [664, 290]], 24, { colors: [["#7a746f", 1], ["#151211", 3]], w: [2.5, 4.5], jitter: 5 }) +
  flow(R, [[292, 120], [244, 190], [240, 330]], [[282, 212], [252, 272], [256, 384]], 14, { colors: [["#a39d97", 2], ["#1c1918", 2]], w: [2.5, 4], jitter: 4 }) +
  flow(R, [[600, 116], [672, 180], [692, 300]], [[640, 200], [688, 282], [690, 376]], 14, { colors: [["#a39d97", 2], ["#1c1918", 2]], w: [2.5, 4], jitter: 4 }) +
  // 윤기·골
  blur(3, strand([336, 96], [450, 46], [600, 78], 12, "#aaa49e", 0.55) + strand([322, 160], [460, 100], [640, 176], 10, "#aaa49e", 0.4)) +
  blur(2, strand([300, 140], [460, 80], [660, 196], 8, "#0f0d0c", 0.55))));
P(line(hairOuter, INK, 6.5) + line(`M686 388${hairline.replace(/Z$/, "")}L264 400`, "#1f1a18", 4.5));

// ── 눈썹 (짙고 굵게)
P(path("M298 334C312 312 338 298 366 296C390 296 410 302 422 312L420 328C404 320 384 316 364 318C342 320 320 328 304 340Z", "#3a302d"));
P(path("M480 316C494 302 516 292 544 290C566 290 586 298 600 316L594 326C578 314 560 308 542 310C522 312 500 320 482 330Z", "#3a302d"));
P(browHairs([[420, 322], [360, 290], [300, 338]], 14, 26, "#1b1412") + browHairs([[482, 324], [544, 284], [598, 322]], 14, 26, "#1b1412"));

// ── 눈 (웃어서 아래 눈꺼풀이 살짝 올라감)
const eye = (shape, cl, ix, iy, lid, lower, crease, fold) =>
  path(shape, "#f6efea") +
  clip(cl,
    `<circle cx="${ix}" cy="${iy}" r="15" fill="url(#${ID}-iris)"/><circle cx="${ix}" cy="${iy}" r="6.5" fill="#0f0a08"/>` +
    blur(2, path(`M${ix - 60} ${iy - 20}H${ix + 60}V${iy - 4}Q${ix} ${iy - 12} ${ix - 60} ${iy - 4}Z`, "#7c5246"), 0.5) +
    `<circle cx="${ix + 5}" cy="${iy - 5}" r="3.8" fill="#ffffff"/><circle cx="${ix - 5}" cy="${iy + 5}" r="1.8" fill="#ffffff" opacity=".7"/>`) +
  strand(...lid, 9, "#1d1310", 1, 0.75) +
  strand(...lower, 3, "#8d5a47", 0.75) +
  strand(...crease, 3.5, "#a46a52", 0.75) +
  strand(...fold, 3, "#bd7e60", 0.65);
P(eye(eyeL, "el", 364, 353, [[322, 360], [366, 316], [412, 355]], [[332, 362], [368, 380], [402, 360]], [[332, 338], [364, 312], [400, 330]], [[338, 384], [364, 398], [392, 386]]));
P(eye(eyeR, "er", 543, 345, [[590, 346], [543, 310], [496, 352]], [[506, 354], [544, 372], [580, 352]], [[512, 326], [544, 300], [578, 322]], [[512, 378], [540, 392], [568, 378]]));

// ── 코 (길고 곧은 콧대 — 선 대신 그늘 + 콧방울 주름)
P(blur(1, path("M422 480Q432 472 446 480Q434 487 422 480Z", "#5a362c") + path("M478 480Q490 472 502 479Q492 486 478 480Z", "#5a362c")));
P(strand([420, 450], [392, 474], [428, 490], 5, "#9a5d47", 0.9) + strand([506, 448], [534, 472], [498, 490], 5, "#9a5d47", 0.9));
P(strand([440, 490], [462, 500], [486, 489], 3, "#a8674f", 0.55));

// ── 입 (이가 드러나는 큰 웃음)
P(path(mouth, "#4a1f1c"));
P(path(teeth, `url(#${ID}-teeth)`));
P(clip("teeth", blur(2, path("M350 530Q460 524 570 520V542Q460 546 350 552Z", "#a8968b"), 0.45) + line("M404 539V552M430 537V555M456 536V556M482 535V556M508 534V553M532 533V549", "#e2dcd3", 2.2)));
P(path("M352 542Q392 520 440 524Q460 518 480 522Q530 516 570 528Q530 533 480 533Q460 531 440 535Q392 533 352 542Z", `url(#${ID}-lipU)`));
P(path("M372 560Q420 590 470 590Q530 588 560 542Q532 578 470 579Q410 579 372 560Z", `url(#${ID}-lipL)`));
P(blur(3, ell(466, 583, 26, 4, "#ffffff"), 0.45));
P(blur(4, ell(354, 542, 10, 9, SH2) + ell(570, 530, 10, 9, SH2), 0.5));
P(line("M352 542Q398 532 460 534Q520 530 570 528", "#4a2620", 3.5) + line("M360 545Q400 573 466 574Q536 571 566 531", "#4a2620", 3, 0.9));
P(strand([344, 533], [349, 544], [358, 550], 3.5, "#4a2620", 0.9) + strand([577, 519], [575, 530], [568, 536], 3.5, "#4a2620", 0.9));
// 팔자 주름
P(strand([410, 490], [380, 510], [362, 542], 4.5, "#a8664c", 0.85) + strand([516, 488], [556, 504], [576, 530], 4.5, "#a8664c", 0.85));

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
