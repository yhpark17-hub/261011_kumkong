// 이재명 대통령 초상 — 원본 사진(960×1279) 위에서 잰 좌표로 짠 벡터 일러스트
// 사용: node scripts/portraits/lee-jaemyung.mjs  (사진 겹침 확인은 scripts/portraits/photos/lee-jaemyung.jpg 가 있을 때)
// 그리는 순서: 정장·셔츠·넥타이 → 목 → 귀 → 얼굴(바탕 그라데이션 → 흐린 그늘 → 흐린 빛 → 홍조) → 머리(결) → 이목구비 → 안경 → 윤곽선
// 닮게 하는 포인트: 가는 금속 동그란 안경, 오른쪽 가르마에서 왼쪽으로 크게 넘긴 짙은 회색 머리, 반달처럼 웃는 눈과 눈 밑 주름,
// 이가 살짝 보이는 웃음, 높은 광대와 갸름한 아래턱 (사진처럼 고개가 오른쪽 위로 살짝 기울어짐)
import { blurDefs, browHairs, build, ell, flow, glasses, rng, scallop, strand } from "./lib.mjs";

const ID = "ljm";
const INK = "#2b2018";
const R = rng(20260604);
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
// 회전한 타원 테두리 (안경알)
function ellD(cx, cy, rx, ry, rot) {
  const a = (rot * Math.PI) / 180, dx = Math.cos(a) * rx, dy = Math.sin(a) * rx;
  const r1 = (n) => Math.round(n * 10) / 10;
  return `M${r1(cx - dx)} ${r1(cy - dy)}A${rx} ${ry} ${rot} 1 0 ${r1(cx + dx)} ${r1(cy + dy)}A${rx} ${ry} ${rot} 1 0 ${r1(cx - dx)} ${r1(cy - dy)}Z`;
}

// 점들을 부드럽게 잇는 곡선 (Catmull-Rom → 3차 베지어), 첫 점에서 이어 그리는 "C…" 조각
function smooth(pts) {
  const r1 = (n) => Math.round(n * 10) / 10;
  let d = "";
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    d += `C${r1(p1[0] + (p2[0] - p0[0]) / 6)} ${r1(p1[1] + (p2[1] - p0[1]) / 6)} ${r1(p2[0] - (p3[0] - p1[0]) / 6)} ${r1(p2[1] - (p3[1] - p1[1]) / 6)} ${p2[0]} ${p2[1]}`;
  }
  return d;
}

// ── 모양 (사진에서 잰 좌표)
const outerPts = [
  [197, 547], [183, 519, 0.06], [171, 462, 0.08], [167, 392, 0.08], [173, 328, 0.1], [190, 270, 0.1], [220, 224, 0.1],
  [262, 186, 0.14], [312, 156, 0.16], [370, 134, 0.16], [432, 120, 0.16], [494, 114, 0.18], [552, 132, 0.18], [604, 172, 0.16],
  [644, 232, 0.14], [664, 300, 0.1], [668, 368, 0.08], [666, 432, 0.06], [656, 490, 0.06], [648, 505, 0.04],
];
const hairOuter = `M197 547${scallop(outerPts)}`;
// 머리선: 오른쪽 관자놀이 → 가르마(467,300) → 왼쪽으로 크게 넘겨 이마를 덮은 물결 → 왼쪽 관자놀이
// (사진에서 열마다 이마 피부가 시작되는 높이를 잰 점 — 가르마 460,285 가 가장 높고, 오른쪽 관자놀이는 가파르게 내려감)
const hlPts = [[634, 552], [620, 492], [604, 445], [588, 387], [572, 348], [556, 330], [540, 320], [524, 311], [508, 306], [492, 300], [476, 289], [460, 285],
  [444, 290], [428, 296], [412, 303], [396, 307], [380, 316], [364, 325], [348, 330], [332, 335], [316, 341], [300, 351], [284, 362], [268, 375], [252, 393], [236, 412], [231, 440], [232, 490], [240, 530]];
const hairline = "C642 524 638 544 634 552" + smooth(hlPts) + "C226 536 210 542 197 547Z";
const hair = hairOuter + hairline;
const face =
  "M226 420C224 360 250 310 300 288C350 268 440 262 520 272C580 282 612 320 616 380C620 430 618 480 630 520C640 560 642 640 638 690" +
  "C634 730 622 770 602 798C584 822 560 842 530 852C504 860 474 862 446 860C416 858 392 852 374 842C352 830 336 812 324 794" +
  "C306 770 290 744 278 722C266 700 258 680 254 660C248 620 246 580 244 550C236 510 228 470 226 420Z";
const jaw =
  "M254 660C258 680 266 700 278 722C290 744 306 770 324 794C336 812 352 830 374 842C392 852 416 858 446 860C474 862 504 860 530 852" +
  "C560 842 584 822 602 798C622 770 634 730 638 690C640 670 641 650 640 630";
const neck = "M330 780L328 900L440 962L560 900L632 760Z";
const earL = "M252 556C240 546 214 542 204 552C196 562 202 596 208 622C214 650 224 676 236 692C242 698 250 698 256 690Z";
const earR = "M636 472C644 458 660 460 664 480C668 506 668 552 664 590C662 610 656 626 648 630C644 632 640 630 636 626Z";
const suitL = "M-130 1300L-130 1000C-60 990 40 962 120 940C180 924 250 872 300 832L326 812L332 1300Z";
const suitR = "M642 776C680 820 720 878 767 905C840 935 920 962 1000 984L1000 1300L500 1300L622 934Z";
const lapelL = "M326 812L300 832L196 934L234 958L184 1100L300 1300L332 1300Z";
const lapelR = "M642 776L770 905L736 930L784 1064L560 1300L500 1300L622 934Z";
const shirt = "M322 812L328 1300L500 1300L622 934L642 776Z";
const tieKnot = "M402 924Q452 912 504 924L480 1006Q448 1014 416 1006Z";
const tieBlade = "M416 1006Q448 1014 480 1006L508 1300L352 1300Z";
const wingL = "M330 812L352 820L408 926L386 1026L336 990Z";
const wingR = "M642 776L626 786L502 928L508 954L556 1016L624 934Z";
// 눈: 반달처럼 웃는 가는 눈 (고개가 기울어 오른쪽 눈이 더 높음)
const eyeL = "M304 548Q338 529 378 546Q342 555 304 548Z";
const eyeR = "M462 525Q494 503 536 514Q500 529 462 525Z";
// 눈썹: 옅은 회갈색, 끝이 가늘게
const browL = "M388 486C382 474 366 466 346 464C322 463 298 466 280 472C272 476 266 482 268 488C286 482 306 480 328 481C350 482 370 486 388 490Z";
const browR = "M436 456C444 442 460 434 480 430C502 427 524 428 540 433C548 436 554 442 554 448C538 442 516 440 496 441C474 442 456 449 438 460Z";
// 입: 아래로 기운 웃음 (입꼬리 367,733 · 523,712), 윗니가 보임
const mouth = "M362 734Q408 718 454 713Q494 708 530 708Q512 740 470 744Q418 750 362 734Z";
const teeth = "M384 729Q420 719 454 716Q490 712 516 712Q500 731 468 735Q420 741 384 729Z";
const lensL = ellD(331, 576, 62, 55, -7);
const lensR = ellD(510, 550, 64, 55, -7);

P(`<defs>${blurDefs(ID, [1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 14, 16, 18])}
<radialGradient id="${ID}-skin" gradientUnits="userSpaceOnUse" cx="470" cy="500" r="430"><stop offset="0" stop-color="#f6d3b4"/><stop offset=".55" stop-color="#e6b28d"/><stop offset="1" stop-color="#cc9069"/></radialGradient>
<linearGradient id="${ID}-neck" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b98068"/><stop offset="1" stop-color="#d8a58a"/></linearGradient>
<linearGradient id="${ID}-ear" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#dc9d76"/><stop offset="1" stop-color="#eebb94"/></linearGradient>
<linearGradient id="${ID}-hair" gradientUnits="userSpaceOnUse" x1="0" y1="130" x2="0" y2="550"><stop offset="0" stop-color="#6e6964"/><stop offset=".45" stop-color="#504a46"/><stop offset="1" stop-color="#34302d"/></linearGradient>
<linearGradient id="${ID}-suit" gradientUnits="userSpaceOnUse" x1="0" y1="780" x2="0" y2="1300"><stop offset="0" stop-color="#45474e"/><stop offset="1" stop-color="#2c2e34"/></linearGradient>
<linearGradient id="${ID}-lapel" gradientUnits="userSpaceOnUse" x1="0" y1="800" x2="0" y2="1300"><stop offset="0" stop-color="#4c4f57"/><stop offset="1" stop-color="#33353b"/></linearGradient>
<linearGradient id="${ID}-tie" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7a7d86"/><stop offset="1" stop-color="#5a5d66"/></linearGradient>
<linearGradient id="${ID}-lipU" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b9715f"/><stop offset="1" stop-color="#9c5747"/></linearGradient>
<linearGradient id="${ID}-lipL" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b56c5c"/><stop offset=".5" stop-color="#cf8f7c"/><stop offset="1" stop-color="#c3806d"/></linearGradient>
<linearGradient id="${ID}-teeth" gradientUnits="userSpaceOnUse" x1="384" y1="0" x2="516" y2="0"><stop offset="0" stop-color="#a99f94"/><stop offset=".25" stop-color="#ebe5dc"/><stop offset=".75" stop-color="#efeae2"/><stop offset="1" stop-color="#ada398"/></linearGradient>
<radialGradient id="${ID}-iris"><stop offset="0" stop-color="#5a3a2a"/><stop offset=".65" stop-color="#2a1a12"/><stop offset="1" stop-color="#120b08"/></radialGradient>
<linearGradient id="${ID}-brow" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a6553"/><stop offset="1" stop-color="#a27b66"/></linearGradient>
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

// ── 정장 (짙은 회색, 잔잔한 체크)
let check = "";
for (let x = -120; x < 1000; x += 22) check += `M${x} 760V1300`;
for (let y = 770; y < 1300; y += 22) check += `M-130 ${y}H1000`;
P(path(suitL, `url(#${ID}-suit)`) + path(suitR, `url(#${ID}-suit)`));
P(clip("suit",
  path(lapelL, `url(#${ID}-lapel)`) + path(lapelR, `url(#${ID}-lapel)`) +
  line(check, "#62656e", 1.6, 0.22) +
  blur(16, line("M300 832L196 934M642 776L770 905", "#1e2025", 26), 0.45) +
  blur(14, line("M234 958L184 1100L300 1300M736 930L784 1064L560 1300", "#1e2025", 22), 0.5) +
  blur(18, ell(80, 990, 150, 30, "#6a6e78", 1, -14) + ell(880, 960, 150, 30, "#6a6e78", 1, 16), 0.45) +
  line(lapelL, "#202227", 5) + line(lapelR, "#202227", 5)));
P(line(suitL, INK, 6.5) + line(suitR, INK, 6.5));
// ── 셔츠
P(path(shirt, "#f6f8fc"));
P(clip("shirt", blur(10, line("M344 1040L340 1300M590 1000L540 1200", "#c9d3e2", 18) + ell(470, 960, 110, 36, "#c9d3e2", 0.7))));
P(line("M326 812L332 1300M500 1300L622 934L642 776", INK, 5));
// ── 목 (턱 밑 그늘이 짙게)
P(path(neck, `url(#${ID}-neck)`));
P(clip("neck", blur(16, ell(460, 868, 170, 50, "#8a5640", 0.8)) + blur(10, ell(450, 950, 50, 22, SH, 0.4))));
P(line(neck, INK, 5));
// ── 넥타이 (회색 바탕에 남색·흰 사선 줄무늬)
let stripes = "", thin = "";
for (let k = -4; k < 12; k++) {
  const y0 = 940 + k * 46;
  stripes += `M330 ${y0 + 90}L560 ${y0 - 90}`;
  thin += `M330 ${y0 + 104}L560 ${y0 - 76}`;
}
P(path(tieBlade, `url(#${ID}-tie)`) + path(tieKnot, `url(#${ID}-tie)`));
P(clip("tie", line(stripes, "#1d2552", 11) + line(thin, "#e9ecf2", 3, 0.85) + blur(5, line("M448 1020L460 1300", "#9a9da6", 12, 0.35)) + blur(4, line("M410 1004L486 1004", "#26282e", 8, 0.5))));
P(line(tieBlade, INK, 5) + line(tieKnot, INK, 5));
// ── 셔츠 깃
P(path(wingL, `url(#${ID}-collar)`) + path(wingR, `url(#${ID}-collar)`));
P(blur(6, line("M346 860L384 950M610 810L540 900", "#cfd8e6", 10)));
P(line(wingL, INK, 5) + line(wingR, INK, 5));

// ── 귀
P(path(earL, `url(#${ID}-ear)`) + path(earR, `url(#${ID}-ear)`));
P(clip("earL",
  blur(5, path("M246 590C232 590 224 610 226 636C228 656 236 668 246 672C242 648 240 614 246 590Z", SH2), 0.8) +
  blur(8, ell(210, 600, 10, 40, "#e98a70"), 0.35)));
P(strand([250, 556], [204, 548], [212, 620], 6, "#965a43", 0.9) + strand([212, 620], [220, 668], [246, 692], 4, "#965a43", 0.6) +
  strand([244, 574], [222, 590], [230, 630], 4, "#a8684e", 0.7));
P(clip("earR",
  blur(5, path("M640 500C652 500 658 520 658 548C658 572 652 586 644 590C646 564 646 526 640 500Z", SH2), 0.75) +
  blur(8, ell(660, 520, 8, 34, "#e98a70"), 0.35)));
P(strand([638, 474], [666, 466], [662, 540], 5.5, "#965a43", 0.9) + strand([662, 540], [660, 600], [644, 628], 4, "#965a43", 0.6));
P(line(earL, INK, 6) + line(earR, INK, 6));

// ── 얼굴
P(path(face, `url(#${ID}-skin)`));
P(clip("face",
  // 그늘 (빛은 오른쪽 앞에서 — 왼쪽 볼이 그늘)
  blur(16, path("M240 420C236 520 244 640 266 720C286 780 320 830 380 856L420 860C350 820 312 770 296 700C282 630 280 520 292 420Z", SH), 0.85) +
  blur(12, ell(262, 620, 22, 70, SH2), 0.45) +
  blur(12, path("M630 460C638 560 638 660 620 740C604 790 570 830 520 852L540 830C584 790 604 730 614 660C620 590 620 520 612 460Z", SH), 0.45) +
  // 머리 그늘 (이마 위)
  blur(10, path("M236 404C254 366 300 342 380 330C440 322 466 304 470 300C500 316 560 332 594 362C606 380 612 404 614 430L598 420C588 392 570 372 530 356C490 342 470 336 466 330C440 344 400 350 360 356C310 364 270 380 250 424Z", SH2), 0.3) +
  // 이마 주름 (옅게)
  strand([296, 418], [360, 402], [430, 406], 3.4, SH, 0.4) + strand([326, 442], [384, 428], [446, 432], 3.2, SH, 0.35) + strand([470, 404], [520, 398], [566, 404], 3, SH, 0.3) +
  // 눈두덩·눈 밑 볼록한 주름(웃는 눈)
  blur(8, ell(338, 538, 46, 14, SH) + ell(498, 512, 46, 14, SH), 0.35) +
  blur(7, ell(340, 566, 40, 9, SH) + ell(504, 538, 40, 9, SH), 0.5) +
  blur(8, ell(342, 588, 38, 9, HI) + ell(508, 562, 38, 9, HI), 0.35) +
  blur(6, ell(398, 548, 12, 22, SH2) + ell(448, 538, 12, 22, SH2), 0.3) +
  // 코: 왼쪽 옆 그늘, 코밑, 콧방울 둘레
  blur(6, path("M406 548C400 590 390 620 380 640L394 646C402 618 412 588 418 548Z", SH2), 0.5) +
  blur(6, ell(432, 668, 52, 10, SH2) + ell(378, 646, 12, 18, SH2) + ell(484, 640, 11, 16, SH), 0.5) +
  // 팔자 주름 (콧방울 옆 → 입꼬리 바깥) + 그 위 볼록한 광대 (빛)
  blur(7, line("M366 660Q344 700 358 742M498 650Q530 684 534 718", SH2, 18), 0.65) +
  blur(10, line("M352 668Q334 704 346 744M510 650Q544 682 548 716", SH, 22), 0.35) +
  blur(12, ell(318, 640, 40, 26, HI, 1, -20) + ell(546, 616, 40, 24, HI, 1, 15), 0.5) +
  blur(12, ell(306, 700, 30, 34, SH) + ell(578, 682, 28, 32, SH), 0.35) +
  blur(14, path("M262 690C280 740 306 784 340 816L360 806C330 770 306 730 290 690Z", SH2) + path("M636 650C630 720 612 770 580 812L562 800C590 760 608 716 616 650Z", SH2), 0.6) +
  // 입 아래·턱 밑
  blur(7, ell(452, 768, 50, 10, SH2), 0.45) +
  blur(10, path("M300 760C330 820 390 850 446 852C510 852 570 826 610 770L620 850C580 880 500 890 446 890C390 890 330 870 300 830Z", SH2), 0.55) +
  // 빛
  blur(14, ell(470, 380, 100, 30, HI), 0.3) +
  blur(5, line("M428 560Q430 590 434 616", HI, 11), 0.55) +
  blur(4, ell(446, 622, 18, 13, HI), 0.85) +
  blur(8, ell(452, 812, 30, 12, HI), 0.3) +
  // 홍조
  blur(16, ell(318, 664, 44, 22, "#ea8a72") + ell(560, 640, 40, 20, "#ea8a72"), 0.22) +
  blur(10, ell(436, 640, 34, 14, "#ea8a72"), 0.14) +
  // 수염 자국
  blur(12, ell(446, 692, 70, 14, "#7d7a86") + ell(452, 800, 56, 22, "#7d7a86"), 0.15)));

// ── 머리 (짙은 회색에 흰 가닥이 섞임 — 가르마에서 왼쪽으로 크게 넘긴 물결, 옆머리·구레나룻은 희끗)
const HD = "#252120", HM = "#625c57", HG = "#b8b2ac";
P(path(hair, `url(#${ID}-hair)`));
P(clip("hair",
  // 옆머리·관자놀이는 더 희끗하게, 물결 아래는 살짝 그늘
  blur(14, path("M197 547C180 520 170 470 168 400C168 340 180 290 204 250C222 300 232 360 234 420C232 470 236 510 240 530Z", "#8c8681") +
    path("M648 505C660 470 668 420 668 370C668 320 660 280 644 248C632 300 618 350 606 400C616 440 620 480 634 552Z", "#86807b"), 0.7) +
  blur(16, ell(440, 170, 130, 34, "#99938e", 0.45, -8)) +
  // 결: 가르마(460) 위로 솟았다가 왼쪽 아래로 크게 넘어가는 물결, 오른쪽은 짧게 오른쪽 아래로
  flow(R, [[556, 132], [330, 96], [190, 296]], [[540, 222], [320, 196], [204, 380]], 40, { colors: [[HG, 4], [HM, 3], [HD, 3]], w: [2.5, 5], jitter: 6 }) +
  flow(R, [[540, 222], [320, 196], [204, 380]], [[470, 290], [326, 292], [236, 420]], 36, { colors: [[HG, 3], [HM, 3], [HD, 3]], w: [2.5, 5], jitter: 6 }) +
  flow(R, [[560, 140], [636, 200], [662, 320]], [[480, 292], [574, 302], [622, 500]], 24, { colors: [[HG, 3], [HM, 3], [HD, 3]], w: [2.5, 4.5], jitter: 5 }) +
  flow(R, [[206, 260], [174, 380], [196, 540]], [[234, 340], [222, 440], [240, 530]], 18, { colors: [[HG, 5], [HM, 2], [HD, 2]], w: [2.5, 4], jitter: 4 }) +
  flow(R, [[650, 250], [668, 380], [648, 500]], [[612, 330], [614, 430], [630, 540]], 14, { colors: [[HG, 5], [HM, 2], [HD, 2]], w: [2.5, 4], jitter: 4 }) +
  // 뭉치 사이 골 (물결이 겹치는 곳) · 옅은 윤기 · 물결 아래 그늘
  blur(2, strand([548, 150], [400, 118], [262, 196], 8, "#2a2523", 0.45) + strand([536, 200], [370, 176], [220, 300], 8, "#2a2523", 0.4) + strand([590, 170], [640, 220], [656, 310], 6, "#2a2523", 0.35)) +
  blur(4, strand([520, 168], [340, 140], [230, 250], 16, "#d6d0ca", 0.25) + strand([500, 236], [340, 226], [226, 350], 12, "#d6d0ca", 0.2)) +
  blur(6, strand([456, 276], [320, 280], [236, 404], 16, "#2a2523", 0.3) + strand([480, 286], [574, 304], [612, 440], 12, "#2a2523", 0.25))));
P(line(hairOuter, INK, 6.5) + line(`M648 505${hairline.replace(/Z$/, "")}`, "#3a3532", 2.4, 0.75));
// 머리선 잔털: 결 방향(가르마 왼쪽은 왼쪽 아래, 오른쪽은 오른쪽 아래)으로 머리선을 살짝 넘는 짧은 가닥
let fringe = "";
for (let i = 0; i < hlPts.length - 1; i++) {
  for (let k = 0; k < 2; k++) {
    const t = (k + 0.3 + R() * 0.5) / 2;
    const x = hlPts[i][0] + (hlPts[i + 1][0] - hlPts[i][0]) * t, y = hlPts[i][1] + (hlPts[i + 1][1] - hlPts[i][1]) * t;
    if (y > 520) continue;
    const dir = x < 460 ? -1 : 1, len = 10 + R() * 9;
    fringe += strand([x - dir * 8, y - 12], [x, y - 2], [x + dir * len * 0.55, y + len * 0.5], 2.2 + R() * 1.4, R() < 0.5 ? HM : HG, 0.85, 0.5, 8);
  }
}
P(fringe);
// 구레나룻 (희끗)
P(blur(2, path("M228 528C236 530 246 534 252 540C254 566 254 592 250 612C244 606 238 590 234 570C230 556 228 542 228 528Z", "#5a5450") +
  path("M616 500C624 508 632 520 638 534C638 548 636 556 632 560C624 548 618 526 616 500Z", "#4e4945")) +
  strand([232, 534], [242, 570], [248, 606], 3, "#8a847f", 0.6) + strand([620, 506], [630, 530], [634, 554], 2.6, "#8a847f", 0.5));

// ── 눈썹 (옅은 회갈색)
P(blur(3, path(browL, `url(#${ID}-brow)`) + path(browR, `url(#${ID}-brow)`), 0.8));
P(clip("brow", blur(1, path(browL, `url(#${ID}-brow)`) + path(browR, `url(#${ID}-brow)`)) +
  browHairs(R, [[386, 482], [328, 466], [270, 482]], 26, { len: 20, spread: 12, color: "#5e4236", op: 0.7 }) +
  browHairs(R, [[440, 452], [496, 426], [552, 444]], 26, { len: 20, spread: 12, color: "#5e4236", op: 0.7 })));

// ── 눈 (반달 눈 — 흰자는 거의 안 보이고, 눈 밑 주름이 깊음)
const eye = (shape, cl, ix, iy, lid, lower, bag, feet) =>
  path(shape, "#d6c3b6") +
  clip(cl,
    blur(3, ell(ix - 32, iy + 2, 12, 10, "#9a6a58") + ell(ix + 32, iy, 12, 10, "#9a6a58"), 0.55) +
    `<circle cx="${ix}" cy="${iy}" r="13" fill="url(#${ID}-iris)"/><circle cx="${ix}" cy="${iy}" r="5.5" fill="#0b0705"/>` +
    blur(2, path(`M${ix - 60} ${iy - 20}H${ix + 60}V${iy - 4}Q${ix} ${iy - 10} ${ix - 60} ${iy - 4}Z`, "#5e3a2e"), 0.6) +
    `<circle cx="${ix + 3}" cy="${iy - 3}" r="2.4" fill="#ffffff" opacity=".9"/>`) +
  strand(...lid, 8.5, "#1a110d", 1, 0.7) +
  strand(...lower, 2.4, "#8d5a47", 0.6) +
  strand(...bag, 3.6, "#9a5f47", 0.65) +
  feet.map(([a, c, b]) => strand(a, c, b, 2.2, "#94593f", 0.4)).join("");
P(eye(eyeL, "el", 341, 545, [[298, 550], [338, 524], [382, 546]], [[310, 550], [342, 556], [374, 548]], [[310, 566], [342, 580], [374, 570]],
  [[[298, 550], [288, 548], [279, 543]], [[299, 554], [290, 558], [283, 564]]]));
P(eye(eyeR, "er", 497, 518, [[540, 513], [494, 498], [458, 527]], [[468, 526], [500, 530], [532, 517]], [[472, 544], [506, 554], [540, 541]],
  [[[540, 513], [550, 509], [559, 503]], [[540, 517], [549, 521], [556, 527]]]));

// ── 코 (둥글고 넓은 코끝 — 선 대신 그늘 + 콧방울 주름)
P(blur(1, path("M388 651Q402 641 416 650Q402 657 388 651Z", "#4a2c24") + path("M454 647Q468 637 482 645Q468 654 454 647Z", "#4a2c24")));
P(strand([386, 610], [358, 640], [392, 660], 5.5, "#935741", 0.9) + strand([476, 604], [504, 628], [480, 656], 5.5, "#935741", 0.85));
P(strand([408, 660], [430, 668], [454, 656], 3, "#a8674f", 0.5));

// ── 입 (윗니가 살짝 보이는 웃음, 왼쪽으로 기움)
P(path(mouth, "#3e1a17"));
P(path(teeth, `url(#${ID}-teeth)`));
P(clip("teeth",
  blur(2, path("M370 712Q450 704 530 700V722Q450 726 370 736Z", "#9c8a7e"), 0.5) +
  line("M406 724V741M430 721V742M454 718V740M478 716V738M500 714V734", "#d6cdc2", 1.8)));
P(clip("mouth", blur(4, ell(368, 732, 14, 10, "#1c0b09") + ell(524, 711, 12, 9, "#1c0b09"), 0.8)));
P(path("M356 735Q378 717 406 710Q430 704 450 705Q460 701 472 703Q500 702 532 708Q502 711 474 713Q460 712 450 715Q424 717 400 723Q378 729 356 735Z", `url(#${ID}-lipU)`));
P(path("M378 740Q420 770 450 768Q494 764 526 712Q504 740 466 744Q420 750 378 740Z", `url(#${ID}-lipL)`));
P(blur(3, ell(452, 757, 22, 4, "#ffffff"), 0.4));
P(blur(4, ell(360, 734, 9, 8, SH2) + ell(532, 708, 9, 8, SH2), 0.55));
P(strand([350, 723], [354, 734], [364, 740], 3.2, "#4a2620", 0.85) + strand([538, 695], [537, 706], [529, 713], 3.2, "#4a2620", 0.85));
// 팔자 주름 (선)
P(strand([366, 656], [342, 694], [356, 736], 5, "#9a5a42", 0.85) + strand([496, 648], [528, 682], [534, 712], 5, "#9a5a42", 0.85));

// ── 안경 (가는 금속 동그란 테)
P(glasses({
  lenses: [lensL, lensR],
  bridge: "M392 552Q418 532 447 548",
  temples: ["M270 566L248 560L236 552", "M572 520L590 508L598 500L614 476L638 468"],
  frame: "#2c2826",
  w: 5,
  glare: [[[352, 530], [376, 534], [388, 552], 7], [[530, 504], [556, 510], [568, 528], 7]],
  shadow: { filter: `${ID}-b4`, dy: 10, op: 0.18 },
}));

// ── 얼굴 윤곽
P(line(jaw, INK, 6));

await build({
  name: "lee-jaemyung",
  exportName: "LEE_JAEMYUNG",
  doc: [
    "이재명 대통령 — 손으로 짠 벡터 일러스트 (480×560)",
    "참고 사진: Wikimedia Commons 'Lee Jae-myung's Portrait (2024.2).jpg' — 대한민국 국회, 공공누리 제1유형 (https://www.kogl.or.kr/info/licenseType1.do)",
    "사진 위에서 잰 머리선·이목구비·턱선 좌표로 그린 것 — 고치려면 scripts/portraits/lee-jaemyung.mjs 를 고쳐 다시 실행 (README 참고)",
  ],
  credit: "인물 그림 원본 사진: 대한민국 국회 · 공공누리 제1유형 · 변형",
  id: ID,
  crop: [-93, 53, 1040],
  body: out.join("\n"),
});
