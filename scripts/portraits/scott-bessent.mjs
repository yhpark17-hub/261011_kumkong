// 스콧 베선트 미국 재무장관 초상 — 원본 사진(960×1344) 위에서 잰 좌표로 짠 벡터 일러스트
// 사용: node scripts/portraits/scott-bessent.mjs  (사진 겹침 확인은 scripts/portraits/photos/scott-bessent.jpg 가 있을 때)
// 그리는 순서: 정장·셔츠·넥타이 → 목 → 귀 → 얼굴(바탕 그라데이션 → 흐린 그늘 → 흐린 빛 → 홍조) → 머리(결) → 이목구비 → 안경 → 윤곽선
// 닮게 하는 포인트: 뒤로 넘겨 볼륨이 산 숱 많은 은회색 머리, 무테 사각 안경, 긴 얼굴과 단단한 턱, 다문 잔잔한 미소, 감청 핀스트라이프 정장 + 초록 물방울 넥타이
import { blurDefs, browHairs, build, ell, flow, glasses, rng, scallop, strand } from "./lib.mjs";

const ID = "sbt";
const INK = "#2b2018";
const R = rng(20250206);
const SH = "#c98a7c"; // 피부 그늘 (희고 붉은 기 도는 피부 — 갈색 X)
const SH2 = "#b06f64"; // 깊은 그늘
const HI = "#fff2e8"; // 피부 빛
const K = 1080 / 960; // 사진이 커서 선 굵기를 다른 초상과 맞추는 비율

const out = [];
const P = (s) => out.push(s);
const blur = (s, inner, op = 1) => `<g filter="url(#${ID}-b${s})"${op < 1 ? ` opacity="${op}"` : ""}>${inner}</g>`;
const clip = (name, inner) => `<g clip-path="url(#${ID}-c-${name})">${inner}</g>`;
const path = (d, fill, extra = "") => `<path d="${d}" fill="${fill}"${extra}/>`;
const line = (d, color, w, op = 1) =>
  `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"${op < 1 ? ` opacity="${op}"` : ""}/>`;

// ── 모양 (사진에서 잰 좌표)
const outerPts = [
  [244, 492], [226, 456, 0.05], [212, 400, 0.05], [208, 340, 0.05], [212, 284, 0.06], [228, 236, 0.08], [256, 192, 0.1], [288, 148, 0.12],
  [326, 98, 0.12], [378, 62, 0.12], [436, 46, 0.1], [496, 48, 0.06], [554, 57, 0.06], [610, 70, 0.08], [664, 104, 0.1], [706, 146, 0.1],
  [734, 200, 0.08], [754, 252, 0.06], [762, 306, 0.05], [767, 356, 0.05], [764, 416, 0.05], [754, 470, 0.05], [738, 486, 0.05],
];
const hairOuter = `M244 492${scallop(outerPts)}`;
// 머리선: 오른쪽 관자놀이 → 뒤로 넘긴 앞머리 아래 넓은 이마(살짝 물결) → 왼쪽 관자놀이
const hairline =
  "L716 470C712 440 708 400 704 375C700 340 695 320 690 306C686 282 681 264 677 251C668 232 660 222 649 214" +
  scallop([[649, 214], [596, 197], [540, 191], [482, 190], [424, 193], [366, 199], [318, 210]], 0.08) +
  "C306 222 300 232 298 240C297 270 296 300 296 330C296 360 295 390 294 416C292 432 288 442 284 450C280 464 276 476 272 488Z";
const hair = hairOuter + hairline;
// 긴 얼굴 (사진 밝기 경계로 잰 턱: 302,724 · 340,770 · 턱끝 480,824 · 620,776 · 686,722) — 위쪽은 머리 밑으로 넉넉히 넣어 틈이 안 생기게
const face =
  "M300 236C312 196 360 172 456 168C540 164 620 174 662 208C688 234 698 290 704 350C710 410 718 470 721 530C723 590 722 630 716 666C710 690 700 706 686 722C666 744 646 762 620 776C596 790 576 802 552 812C530 822 504 826 480 824C452 822 424 818 400 810C380 800 362 786 340 770C324 756 312 742 302 724C292 706 286 686 283 664C280 620 279 560 280 500C282 440 288 380 294 320C296 290 298 260 300 236Z";
const jaw = "M283 640L283 664C286 686 292 706 302 724C312 742 324 756 340 770C362 786 380 800 400 810C424 818 452 822 480 824C504 826 530 822 552 812C576 802 596 790 620 776C646 762 666 744 686 722C700 706 710 690 716 666C719 650 721 640 721 630";
const neck = "M330 720L346 900L422 992L696 872C696 800 704 740 712 690Z";
const earL = "M288 474C272 460 246 458 236 476C228 500 234 556 244 596C252 630 266 656 288 666Z";
const earR = "M716 456C728 442 754 446 762 472C770 504 764 560 756 592C750 616 738 636 718 650Z";
const suitL = "M-60 1260L-60 992C40 978 150 950 240 916C286 898 318 884 334 870L224 1260Z";
const suitR = "M733 816C752 842 792 868 842 896C900 928 960 956 1040 988L1040 1260L556 1260Z";
const shirt = "M330 856L224 1260L556 1260L736 812Z";
const tieKnot = "M378 998Q436 984 494 1018L448 1104Q404 1110 364 1102Z";
const tieBlade = "M364 1102Q406 1112 448 1104L432 1260L306 1260Z";
const wingL = "M334 870L348 884L420 990L378 1004L322 1098L312 960L318 900Z";
const wingR = "M698 852L728 830L736 872L700 950L600 1148L494 1020L428 990Z";
// 눈: 위 눈꺼풀이 두툼하게 덮은 눈 (고개가 살짝 기울어 오른쪽 눈이 조금 높음)
const eyeL = "M336 467Q360 452 388 451Q414 452 433 462Q414 472 390 473Q360 473 336 467Z";
const eyeR = "M536 452Q556 438 582 436Q606 438 621 450Q604 457 582 458Q556 458 536 452Z";
// 눈썹: 숱이 적당한 회갈색, 낮고 거의 일자
const browL = "M442 418C422 410 398 407 374 409C350 411 328 419 310 429L302 440C324 432 350 427 374 426C398 425 420 427 442 431Z";
const browR = "M504 414C526 403 548 398 572 397C598 397 622 404 642 414L648 427C628 419 604 414 580 414C556 414 530 418 506 427Z";
// 무테 안경 렌즈
const lensL = "M298 450C340 444 400 441 445 444C447 470 445 492 439 506C429 524 400 528 370 528C340 528 318 524 306 510C298 494 296 470 298 450Z";
const lensR = "M502 440C548 434 600 430 647 430C651 456 649 482 643 500C635 514 610 517 584 517C556 517 532 513 520 504C508 488 502 464 502 440Z";

P(`<defs>${blurDefs(ID, [1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 14, 16, 18])}
<radialGradient id="${ID}-skin" gradientUnits="userSpaceOnUse" cx="560" cy="480" r="480"><stop offset="0" stop-color="#f8dcd0"/><stop offset=".55" stop-color="#efc0ad"/><stop offset="1" stop-color="#da9e8b"/></radialGradient>
<linearGradient id="${ID}-neck" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d8a393"/><stop offset="1" stop-color="#edc3b1"/></linearGradient>
<linearGradient id="${ID}-ear" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#e5ad9c"/><stop offset="1" stop-color="#f2c9b9"/></linearGradient>
<linearGradient id="${ID}-hair" gradientUnits="userSpaceOnUse" x1="0" y1="55" x2="0" y2="490"><stop offset="0" stop-color="#d6d6d3"/><stop offset=".45" stop-color="#a9a8a4"/><stop offset="1" stop-color="#7a7976"/></linearGradient>
<linearGradient id="${ID}-suit" gradientUnits="userSpaceOnUse" x1="0" y1="820" x2="0" y2="1260"><stop offset="0" stop-color="#26304a"/><stop offset="1" stop-color="#171d2e"/></linearGradient>
<linearGradient id="${ID}-tie" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3a6630"/><stop offset="1" stop-color="#1f3d1b"/></linearGradient>
<linearGradient id="${ID}-lipU" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c98478"/><stop offset="1" stop-color="#a9645a"/></linearGradient>
<linearGradient id="${ID}-lipL" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bf7a6e"/><stop offset=".5" stop-color="#dba092"/><stop offset="1" stop-color="#cf8f80"/></linearGradient>
<radialGradient id="${ID}-iris"><stop offset="0" stop-color="#3c4a48"/><stop offset=".45" stop-color="#6f8783"/><stop offset=".85" stop-color="#4d605d"/><stop offset="1" stop-color="#2a3332"/></radialGradient>
<linearGradient id="${ID}-brow" gradientUnits="userSpaceOnUse" x1="0" y1="396" x2="0" y2="442"><stop offset="0" stop-color="#8a7f77"/><stop offset="1" stop-color="#6a5e57"/></linearGradient>
<linearGradient id="${ID}-collar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#e8edf4"/></linearGradient>
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
</defs>`);

// ── 정장 (감청 핀스트라이프, 노치 라펠)
P(path(suitL, `url(#${ID}-suit)`) + path(suitR, `url(#${ID}-suit)`));
let stripes = "";
for (let x = -60; x < 1060; x += 34) stripes += `M${x} 1260L${x + 40} 820`;
P(clip("suit",
  line(stripes, "#7f8db0", 1.6, 0.4) +
  blur(16, line("M318 892L190 1040M736 838L846 978", "#0c101a", 28), 0.5) +
  blur(18, ell(120, 990, 150, 30, "#4a5674", 1, -14) + ell(900, 960, 150, 30, "#4a5674", 1, 22), 0.55) +
  line("M318 892L190 1040L214 1060L150 1260M736 838L846 978L826 992L892 1150L876 1260", "#0e1320", 5 * K) +
  line("M312 906L196 1040M742 850L840 974", "#4b577a", 3, 0.7)));
P(line(suitL, INK, 6.5 * K) + line(suitR, INK, 6.5 * K));
// ── 셔츠
P(path(shirt, "#f7f9fc"));
P(clip("shirt", blur(10, line("M336 1010L300 1260M640 960L570 1200", "#c9d3e2", 18) + ell(470, 1000, 130, 40, "#c9d3e2", 0.7))));
P(line("M330 856L224 1260M556 1260L736 812", INK, 5 * K));
// ── 목 (턱 밑 그늘이 짙게)
P(path(neck, `url(#${ID}-neck)`));
P(clip("neck", blur(16, ell(500, 830, 230, 80, SH2, 0.95)) + blur(14, ell(520, 760, 200, 60, "#7e4232", 0.7)) + blur(10, ell(430, 960, 50, 26, SH, 0.5)) + blur(10, line("M330 760L346 890M704 720L694 860", SH2, 24), 0.6)));
P(line(neck, INK, 5 * K));
// ── 넥타이 (짙은 초록, 흰 물방울)
P(path(tieBlade, `url(#${ID}-tie)`) + path(tieKnot, `url(#${ID}-tie)`));
let dots = "";
for (let y = 990; y < 1260; y += 15) {
  const xl = y < 1102 ? 360 : 364 - ((y - 1102) / 158) * 58, xr = y < 1102 ? 498 : 448 - ((y - 1102) / 158) * 16;
  for (let x = 296 + ((y / 15) % 2) * 7.5; x < 500; x += 15) if (x > xl - 6 && x < xr + 6) dots += `<circle cx="${x}" cy="${y}" r="2.4" fill="#eef3e6" opacity=".85"/>`;
}
P(clip("tie", dots + blur(5, line("M420 1110L380 1260", "#5d8c4c", 10, 0.4)) + blur(4, line("M372 1100Q410 1112 450 1104", "#0e1e0c", 8, 0.5))));
P(blur(3, ell(440, 1010, 26, 8, "#6f9b5c", 0.45)));
P(line(tieBlade, INK, 5 * K) + line(tieKnot, INK, 5 * K));
// ── 셔츠 깃
P(path(wingL, `url(#${ID}-collar)`) + path(wingR, `url(#${ID}-collar)`));
P(blur(6, line("M330 920L380 1000M700 900L610 1060", "#cfd8e6", 10)));
P(line(wingL, INK, 5 * K) + line(wingR, INK, 5 * K));

// ── 귀
P(path(earL, `url(#${ID}-ear)`) + path(earR, `url(#${ID}-ear)`));
P(clip("earL",
  blur(5, path("M280 520C262 518 254 540 256 572C258 598 266 614 280 620C274 590 274 552 280 520Z", SH2), 0.8) +
  blur(8, ell(244, 540, 10, 40, "#e98a70"), 0.35) +
  blur(4, ell(272, 580, 9, 16, "#7a3e2c"), 0.4)));
P(strand([284, 474], [236, 474], [242, 560], 6 * K, "#965a43", 0.85) + strand([242, 560], [248, 620], [280, 656], 4 * K, "#965a43", 0.55) +
  strand([280, 496], [256, 512], [262, 560], 4, "#a8684e", 0.65));
P(clip("earR",
  blur(5, path("M722 500C740 498 748 520 746 552C744 576 736 592 724 598C730 570 730 530 722 500Z", SH2), 0.8) +
  blur(8, ell(756, 520, 9, 38, "#e98a70"), 0.35) +
  blur(4, ell(728, 562, 8, 15, "#7a3e2c"), 0.4)));
P(strand([718, 458], [762, 456], [760, 540], 6 * K, "#965a43", 0.85) + strand([760, 540], [756, 610], [722, 644], 4 * K, "#965a43", 0.55) +
  strand([724, 482], [748, 496], [742, 548], 4, "#a8684e", 0.65));
P(line(earL, INK, 6 * K) + line(earR, INK, 6 * K));

// ── 얼굴
P(path(face, `url(#${ID}-skin)`));
P(clip("face",
  // 그늘 (빛은 오른쪽 앞에서 — 왼쪽 볼과 관자놀이가 살짝 그늘, 광대 밑이 들어감)
  blur(14, path("M282 300C276 420 278 560 290 660C300 730 330 790 390 826L430 834C372 796 336 736 320 660C306 570 304 420 310 300Z", SH), 0.4) +
  blur(12, path("M718 360C720 460 722 560 712 640C702 700 680 750 640 790L620 784C660 740 680 690 690 630C700 560 700 460 700 360Z", SH), 0.28) +
  blur(16, ell(326, 630, 30, 74, SH2, 1, -10) + ell(680, 620, 26, 70, SH2, 1, 10), 0.3) +
  blur(10, path("M300 238C340 214 420 202 480 200C560 198 630 210 668 236C684 256 692 284 698 318L684 314C674 286 660 264 636 250C590 230 520 226 460 228C390 230 340 240 304 262Z", SH2), 0.55) +
  // 이마 주름 (옅게)
  blur(2, strand([380, 300], [480, 290], [590, 298], 4, SH2, 0.3) + strand([370, 336], [480, 326], [600, 334], 4, SH2, 0.28) + strand([390, 370], [480, 362], [580, 368], 3.5, SH2, 0.22)) +
  // 눈두덩·눈 밑 처진 볼살
  blur(10, ell(384, 452, 62, 24, SH2) + ell(580, 438, 58, 22, SH2), 0.6) +
  blur(6, ell(446, 456, 14, 22, "#8a4a38") + ell(518, 448, 13, 20, "#8a4a38"), 0.45) +
  blur(6, ell(388, 490, 44, 10, SH) + ell(582, 474, 40, 9, SH), 0.5) +
  blur(8, ell(388, 510, 40, 9, HI) + ell(584, 494, 36, 8, HI), 0.3) +
  // 콧대 옆 그늘·코밑
  blur(6, path("M456 470C456 510 452 540 446 566L460 570C466 540 470 510 470 470Z", SH2), 0.5) +
  blur(6, ell(480, 596, 50, 10, SH2) + ell(424, 572, 12, 18, SH2) + ell(538, 570, 12, 18, SH2), 0.5) +
  // 팔자 주름 + 그 바깥 볼(빛)
  blur(7, line("M418 590Q392 624 378 676M546 588Q586 620 610 668", SH2, 14), 0.26) +
  blur(12, ell(350, 590, 36, 24, HI, 1, -15) + ell(630, 578, 34, 22, HI, 1, 15), 0.3) +
  blur(7, ell(490, 728, 56, 11, SH2), 0.3) +
  blur(10, path("M296 700C330 760 410 800 480 806C560 804 640 770 690 700L700 780C640 840 560 850 480 850C400 850 330 830 290 770Z", SH2), 0.35) +
  // 빛
  blur(14, ell(500, 290, 120, 40, HI), 0.4) +
  blur(5, line("M484 476Q486 520 488 552", HI, 12), 0.6) +
  blur(3, ell(488, 556, 15, 11, HI), 0.8) +
  blur(8, ell(484, 790, 32, 12, HI), 0.35) +
  // 홍조
  blur(16, ell(360, 556, 46, 24, "#e5826a") + ell(616, 544, 40, 22, "#e5826a"), 0.16) +
  blur(10, ell(484, 560, 36, 16, "#e5826a"), 0.15) +
  // 수염 자국 (입 주위·턱이 살짝 회색빛)
  blur(14, ell(486, 640, 80, 22, "#8a8890") + ell(484, 770, 76, 36, "#8a8890"), 0.1)));

// ── 머리 (숱 많은 은회색, 앞머리를 위로 세워 뒤로 넘김, 옆머리는 귀 뒤로)
const HL = "#f6f6f4", HM = "#b3b2ae", HD = "#5c5b58";
P(path(hair, `url(#${ID}-hair)`));
P(clip("hair",
  blur(12, path("M244 492L226 456Q212 400 208 340Q208 290 220 250Q252 300 270 360Q278 420 272 488Z", "#7a7976") +
    path("M738 486L754 470Q766 416 767 356Q766 300 748 250Q722 310 712 370Q714 430 716 470Z", "#7a7976"), 0.8) +
  // 앞머리 아래 그늘(이마 쪽 머리 밑면)과 정수리 빛
  blur(10, path("M300 236C340 200 420 186 500 184C580 184 640 198 672 232C640 214 580 206 500 206C420 206 350 214 300 256Z", "#6f6e6a"), 0.6) +
  blur(16, ell(470, 100, 170, 42, "#fafaf8", 0.9, -10) + ell(400, 120, 70, 50, "#ffffff", 0.6)) +
  // 결: 이마 위에서 위로 솟아 뒤(정수리 오른쪽)로 넘어감, 옆머리는 아래 뒤로
  flow(R, [[318, 212], [328, 110], [450, 62]], [[480, 196], [500, 100], [620, 74]], 40, { colors: [[HL, 3], [HM, 2], [HD, 3]], w: [3, 6.5], jitter: 6 }) +
  flow(R, [[480, 196], [500, 100], [620, 74]], [[660, 222], [692, 150], [752, 262]], 34, { colors: [[HL, 3], [HM, 2], [HD, 3]], w: [3, 6.5], jitter: 6 }) +
  flow(R, [[330, 112], [240, 176], [224, 430]], [[298, 214], [270, 300], [264, 486]], 22, { colors: [[HL, 1], [HM, 2], [HD, 3]], w: [3, 5.5], jitter: 5 }) +
  flow(R, [[664, 108], [742, 180], [758, 430]], [[680, 222], [714, 300], [722, 476]], 20, { colors: [[HL, 1], [HM, 2], [HD, 3]], w: [3, 5.5], jitter: 5 }) +
  flow(R, [[300, 216], [290, 120], [370, 66]], [[420, 200], [400, 90], [470, 50]], 22, { colors: [[HL, 4], [HM, 2], [HD, 2]], w: [3, 6], jitter: 5 }) +
  blur(3, strand([318, 200], [312, 110], [400, 62], 14, "#ffffff", 0.6) + strand([380, 196], [380, 104], [470, 56], 12, "#ffffff", 0.55) + strand([470, 190], [500, 110], [600, 82], 10, "#ffffff", 0.45)) +
  // 이마 위로 솟은 앞머리 물결: 머리선에서 위로 섰다가 뒤로 넘어가는 굵은 밝은 결 + 그 아래 그늘
  blur(4, strand([330, 214], [350, 160], [420, 120], 16, "#4e4d4a", 0.45) + strand([440, 200], [460, 150], [540, 120], 14, "#4e4d4a", 0.4) + strand([560, 204], [600, 160], [670, 160], 12, "#4e4d4a", 0.4)) +
  strand([340, 206], [352, 140], [440, 96], 9, HL, 0.85, 0.7) + strand([400, 200], [420, 130], [520, 92], 8, HL, 0.8, 0.7) +
  strand([470, 196], [500, 128], [600, 100], 8, HL, 0.8, 0.7) + strand([540, 198], [580, 140], [670, 132], 7, HL, 0.75, 0.7) +
  strand([610, 206], [660, 160], [720, 200], 6, HL, 0.7, 0.7) +
  // 뭉치 사이 골과 윤기
  blur(2, strand([360, 205], [380, 120], [480, 72], 9, "#5f5e5b", 0.5) + strand([470, 198], [500, 112], [600, 80], 9, "#5f5e5b", 0.45) + strand([590, 205], [640, 130], [710, 160], 8, "#5f5e5b", 0.45)) +
  blur(3, strand([400, 196], [420, 110], [530, 70], 12, "#ffffff", 0.55) + strand([530, 196], [560, 116], [660, 110], 10, "#ffffff", 0.45))));
P(line(hairOuter, INK, 6.5 * K) + line(`M738 486${hairline.replace(/Z$/, "")}L244 492`, "#6e6a65", 3));

// ── 눈썹 (회갈색, 낮고 거의 일자)
P(blur(3, path(browL, `url(#${ID}-brow)`) + path(browR, `url(#${ID}-brow)`), 0.75));
P(clip("brow", blur(1, path(browL, `url(#${ID}-brow)`) + path(browR, `url(#${ID}-brow)`)) +
  browHairs(R, [[440, 426], [372, 412], [304, 436]], 32, { len: 20, spread: 12, color: "#3e3430" }) +
  browHairs(R, [[506, 422], [574, 400], [644, 420]], 32, { len: 20, spread: 12, color: "#3e3430" }) +
  browHairs(R, [[430, 424], [372, 414], [314, 432]], 10, { len: 16, spread: 10, color: "#c9c4be", w: 2.6 }) +
  browHairs(R, [[516, 420], [574, 404], [634, 418]], 10, { len: 16, spread: 10, color: "#c9c4be", w: 2.6 })));

// ── 눈 (회청색 눈동자, 두툼한 위 눈꺼풀, 눈 밑 주름)
const eye = (shape, cl, ix, iy, lid, lower, crease, bag, feet) =>
  path(shape, "#ebe1da") +
  clip(cl,
    blur(3, ell(ix - 44, iy + 4, 16, 14, "#a07060") + ell(ix + 44, iy + 4, 16, 14, "#a07060"), 0.5) +
    `<circle cx="${ix}" cy="${iy}" r="13.5" fill="url(#${ID}-iris)"/><circle cx="${ix}" cy="${iy}" r="5.5" fill="#0d0b0a"/>` +
    blur(2, path(`M${ix - 70} ${iy - 24}H${ix + 70}V${iy - 5}Q${ix} ${iy - 13} ${ix - 70} ${iy - 5}Z`, "#5a3a30"), 0.6) +
    `<circle cx="${ix + 4}" cy="${iy - 4}" r="3" fill="#ffffff" opacity=".95"/>`) +
  strand(...lid, 8.5, "#2a1a14", 1, 0.8) +
  strand(...lower, 2.8, "#8a5644", 0.65) +
  strand(...crease, 4, "#9a5f4a", 0.6) +
  strand(...bag, 3.2, "#a5654e", 0.55) +
  feet.map(([a, c, b]) => strand(a, c, b, 2.4, "#a5654e", 0.4)).join("");
P(eye(eyeL, "el", 386, 460, [[330, 469], [388, 442], [436, 463]], [[342, 468], [390, 480], [430, 464]], [[338, 452], [388, 432], [436, 448]], [[350, 492], [390, 506], [428, 494]],
  [[[328, 470], [318, 466], [308, 461]], [[328, 474], [318, 478], [310, 484]]]));
P(eye(eyeR, "er", 579, 446, [[532, 455], [582, 427], [627, 452]], [[542, 454], [582, 465], [616, 453]], [[536, 437], [582, 418], [628, 436]], [[548, 476], [584, 490], [618, 478]],
  [[[628, 452], [638, 448], [648, 443]], [[628, 456], [637, 461], [645, 467]]]));

// ── 코 (곧은 콧대, 둥근 코끝)
P(blur(5, ell(426, 576, 14, 16, SH2) + ell(536, 572, 13, 15, SH), 0.35));
P(blur(1, path("M430 586Q444 576 462 585Q448 594 430 586Z", "#5a2e24") + path("M498 582Q512 574 528 581Q514 590 498 582Z", "#5a2e24")));
P(strand([436, 548], [408, 574], [434, 596], 5.5 * K, "#985a44", 0.85) + strand([530, 546], [558, 570], [528, 592], 5.5 * K, "#985a44", 0.8));
P(strand([458, 597], [480, 604], [502, 595], 3, "#a8674f", 0.5));

// ── 입 (얇은 윗입술, 다문 잔잔한 미소)
P(path("M394 690Q430 676 470 676Q484 671 492 675Q506 671 524 675Q560 673 590 681Q560 687 524 687Q500 689 470 689Q430 691 394 690Z", `url(#${ID}-lipU)`));
P(path("M410 694Q450 718 492 718Q542 718 578 688Q542 702 492 702Q450 702 410 694Z", `url(#${ID}-lipL)`));
P(blur(3, ell(494, 708, 28, 5, "#ffffff"), 0.4));
P(blur(4, ell(392, 690, 10, 8, SH2) + ell(592, 680, 10, 8, SH2), 0.5));
P(strand([390, 692], [490, 692], [594, 680], 5.5, "#4e2a24", 1, 1, 20));
P(strand([592, 681], [599, 677], [603, 671], 3.2, "#4e2a24", 0.8) + strand([392, 692], [385, 689], [381, 684], 3.2, "#4e2a24", 0.8));
// 팔자 주름 (선)
P(strand([420, 596], [392, 628], [380, 676], 4 * K, "#b57565", 0.45) + strand([544, 592], [584, 622], [606, 666], 4 * K, "#b57565", 0.45));

// ── 얼굴 윤곽
P(line(jaw, INK, 6 * K));

// ── 무테 사각 안경 (렌즈 가장자리만 옅게, 은색 브리지·다리)
P(glasses({
  lenses: [lensL, lensR],
  bridge: "M445 447Q473 424 502 441",
  temples: ["M299 451L284 452", "M647 431L700 434L734 440"],
  frame: "#9ba0a8",
  w: 4.5,
  rimless: true,
  glare: [[[310, 476], [322, 462], [340, 454], 6], [[516, 462], [528, 450], [546, 443], 6]],
  shadow: { filter: `${ID}-b4`, dy: 9, op: 0.16 },
}));
P(`<circle cx="299" cy="451" r="4.5" fill="#9ba0a8"/><circle cx="647" cy="431" r="4.5" fill="#9ba0a8"/>`);

await build({
  name: "scott-bessent",
  exportName: "SCOTT_BESSENT",
  doc: [
    "스콧 베선트 미국 재무장관 — 손으로 짠 벡터 일러스트 (480×560)",
    "참고 사진: Wikimedia Commons 'Official portrait of Treasury Secretary Scott Bessent (cropped).jpg' — 미국 재무부, 퍼블릭 도메인",
    "사진 위에서 잰 머리선·이목구비·턱선 좌표로 그린 것 — 고치려면 scripts/portraits/scott-bessent.mjs 를 고쳐 다시 실행 (README 참고)",
  ],
  credit: "인물 그림 원본 사진: 미국 재무부 · 퍼블릭 도메인",
  id: ID,
  crop: [-48, -21, 1080],
  body: out.join("\n"),
});
