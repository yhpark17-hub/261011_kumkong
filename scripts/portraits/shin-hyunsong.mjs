// 신현송 한국은행 총재 초상 — 원본 사진(960×1200) 위에서 잰 좌표로 짠 벡터 일러스트
// 사용: node scripts/portraits/shin-hyunsong.mjs  (사진 겹침 확인은 scripts/portraits/photos/shin-hyunsong.jpg 가 있을 때)
import { build, scallop, strand } from "./lib.mjs";

const SK = { base: "#f4c9a5", mid: "#e8b08a", deep: "#d4956f", line: "#b4765a", hi: "#fbdcc2" };
const HR = { base: "#b9bec7", light: "#dde0e6", dark: "#8e949f", deep: "#717783", line: "#757b86" };
const INK = "#2b2018";

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

const out = [];
const P = (s) => out.push(s);

// ── 정장
P(`<path d="M-20 1200L-20 958C60 930 160 904 230 886C266 876 288 860 300 840L304 1200Z" fill="#2f3440" stroke="${INK}" stroke-width="8" stroke-linejoin="round"/>`);
P(`<path d="M644 832C662 858 700 874 744 886C830 908 910 936 980 970L980 1200L650 1200Z" fill="#2f3440" stroke="${INK}" stroke-width="8" stroke-linejoin="round"/>`);
P(`<path d="M-20 1010C60 984 140 962 206 948L190 1200L-20 1200Z" fill="#262a33" stroke="none"/>`);
P(`<path d="M300 856L240 1012L272 1042L236 1200M646 850L706 1012L674 1042L710 1200" fill="none" stroke="#1d2027" stroke-width="6" stroke-linejoin="round" stroke-linecap="round"/>`);
P(`<path d="M120 1200C130 1110 156 1036 196 990M840 1200C830 1110 806 1040 770 996" fill="none" stroke="#434958" stroke-width="6" stroke-linecap="round"/>`);
// ── 셔츠
P(`<path d="M298 836L300 1200L648 1200L644 830Z" fill="#f6f8fc" stroke="${INK}" stroke-width="7" stroke-linejoin="round"/>`);
P(`<path d="M330 1010L322 1200M612 1000L624 1200" fill="none" stroke="#dbe2ee" stroke-width="12" stroke-linecap="round"/>`);
// ── 목
P(`<path d="M324 720L320 830L497 982L622 820L620 720Z" fill="${SK.mid}" stroke="${INK}" stroke-width="7" stroke-linejoin="round"/>`);
P(`<path d="M320 834L497 982L622 824L621 880C584 930 540 960 497 972C450 956 380 900 320 862Z" fill="${SK.deep}" stroke="none"/>`);
// ── 넥타이
P(`<path d="M462 1054Q497 1062 532 1054L558 1200L436 1200Z" fill="#2e3a6a" stroke="${INK}" stroke-width="7" stroke-linejoin="round"/>`);
P(`<path d="M450 984Q497 974 544 984L532 1054Q497 1062 462 1054Z" fill="#26305a" stroke="${INK}" stroke-width="7" stroke-linejoin="round"/>`);
P(`<path d="M486 1072L470 1200M512 1070L520 1200" fill="none" stroke="#3c4a82" stroke-width="5" stroke-linecap="round"/>`);
P(`<path d="M470 996Q497 990 524 996" fill="none" stroke="#3c4a82" stroke-width="5" stroke-linecap="round"/>`);
// ── 깃
P(`<path d="M300 828L322 834L497 980L452 1020L424 1108Q360 1046 300 1004Z" fill="#ffffff" stroke="${INK}" stroke-width="7" stroke-linejoin="round"/>`);
P(`<path d="M644 822L620 828L497 980L544 1020L590 1094Q622 1046 646 1004Z" fill="#ffffff" stroke="${INK}" stroke-width="7" stroke-linejoin="round"/>`);
P(`<path d="M318 900L430 1010M624 896L560 990" fill="none" stroke="#dde3ee" stroke-width="8" stroke-linecap="round"/>`);
// ── 귀
P(`<path d="M252 500C232 486 204 486 190 506C176 530 182 580 196 618C208 650 228 670 252 678Z" fill="${SK.base}" stroke="${INK}" stroke-width="7" stroke-linejoin="round"/>`);
P(`<path d="M236 520C214 518 204 556 212 596C218 620 228 634 240 640C232 610 230 570 236 520Z" fill="${SK.deep}" stroke="none"/>`);
P(`<path d="M234 522C214 524 206 560 214 598M224 602C234 610 240 622 238 636" fill="none" stroke="${SK.line}" stroke-width="5" stroke-linecap="round"/>`);
P(`<path d="M690 498C706 508 710 544 706 584C704 606 700 622 692 632Z" fill="${SK.mid}" stroke="${INK}" stroke-width="7" stroke-linejoin="round"/>`);
// ── 얼굴
const face =
  "M254 400C248 460 246 530 247 590C248 630 248 660 252 684C262 726 278 764 302 796C326 826 370 848 432 858C460 862 494 864 516 862C556 858 598 838 624 808C646 780 660 732 670 690C682 646 692 608 696 566C700 516 698 456 692 400C680 330 640 282 560 270C500 262 420 262 360 272C300 286 262 330 254 400Z";
P(`<path d="${face}" fill="${SK.base}" stroke="none"/>`);
// 명암 (빛은 오른쪽 위에서)
P(`<path d="M254 400C248 470 246 560 248 640C252 700 272 752 304 792C334 826 384 850 446 860C404 836 370 800 346 756C322 712 306 664 298 616C290 580 282 556 282 530C282 490 286 440 296 400Z" fill="${SK.mid}" stroke="none"/>`);
P(`<path d="M262 380C290 330 350 304 450 300C550 298 620 310 664 352C676 372 684 396 688 420C664 380 620 350 560 338C480 326 380 330 330 344C298 354 276 368 262 400Z" fill="${SK.mid}" stroke="none"/>`);
P(`<path d="M338 500C348 474 378 462 404 462C430 462 450 474 458 498C440 482 422 476 402 476C378 476 356 484 338 500Z" fill="${SK.mid}" stroke="none"/>`);
P(`<path d="M526 498C538 472 564 460 590 460C616 460 638 472 646 494C630 480 612 474 590 474C566 474 546 482 526 498Z" fill="${SK.mid}" stroke="none"/>`);
P(`<path d="M480 466C470 520 458 570 440 612C456 610 470 600 478 590C480 550 484 510 490 470Z" fill="${SK.mid}" stroke="none"/>`);
P(`<path d="M296 596C320 640 362 672 408 690C364 690 324 670 300 640Z" fill="${SK.mid}" stroke="none"/>`);
P(`<path d="M672 636C656 690 628 730 592 752C618 718 638 680 648 640Z" fill="${SK.mid}" stroke="none"/>`);
P(`<path d="M450 660C470 672 540 672 566 660C556 690 540 702 505 704C470 702 456 690 450 660Z" fill="${SK.mid}" opacity=".7" stroke="none"/>`);
P(`<path d="M436 758C470 778 540 778 572 752C556 790 470 794 436 758Z" fill="${SK.mid}" stroke="none"/>`);
P(`<path d="M300 790C330 826 380 848 440 858C400 852 360 838 330 818Z" fill="${SK.deep}" stroke="none"/>`);
// 하이라이트
P(`<path d="M560 540C600 528 640 540 660 570C640 566 610 566 580 576C566 566 560 552 560 540Z" fill="${SK.hi}" stroke="none"/>`);
P(`<path d="M420 360C480 344 560 346 620 366C580 376 500 376 430 378Z" fill="${SK.hi}" opacity=".8" stroke="none"/>`);
P(`<path d="M470 800C490 792 530 792 548 800C536 814 486 814 470 800Z" fill="${SK.hi}" opacity=".8" stroke="none"/>`);
P(`<path d="M494 520C500 556 506 580 516 600C504 590 494 560 494 520Z" fill="${SK.hi}" stroke="none"/>`);
// 볼 홍조
P(`<ellipse cx="356" cy="610" rx="40" ry="20" fill="#ee9c84" opacity=".22" stroke="none"/>`);
P(`<ellipse cx="628" cy="606" rx="34" ry="18" fill="#ee9c84" opacity=".22" stroke="none"/>`);
// 얼굴 윤곽 (턱선 포함)
P(`<path d="M252 684C262 726 278 764 302 796C326 826 370 848 432 858C460 862 494 864 516 862C556 858 598 838 624 808C646 780 660 732 670 690C682 646 692 608 696 566" fill="none" stroke="${INK}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>`);

// ── 머리
P(`<path d="${hairOuter}${hairline}" fill="${HR.base}" stroke="none"/>`);
// 옆머리 그늘·정수리 빛
P(`<path d="M252 506C226 510 204 510 190 500C160 476 146 430 145 372C144 318 158 268 188 226C214 262 240 316 256 360C258 420 254 470 252 506Z" fill="${HR.dark}" stroke="none"/>`);
P(`<path d="M712 522C732 476 739 424 738 366C737 310 726 256 700 214C690 270 686 330 690 390C692 440 694 480 694 510Z" fill="${HR.dark}" stroke="none"/>`);
P(`<path d="M206 206C262 154 360 122 470 120C570 120 650 148 694 206C640 178 560 162 470 164C370 168 290 186 206 236Z" fill="${HR.light}" stroke="none"/>`);
P(`<path d="M282 330C300 306 360 290 450 286C550 284 620 294 660 326C620 306 550 300 450 302C362 306 312 316 282 346Z" fill="${HR.dark}" opacity=".6" stroke="none"/>`);
// 머리결 (정수리 오른쪽 위 → 왼쪽 아래로 빗어 넘긴 결)
const strands = [
  // 어두운 결
  [[654, 196], [500, 150], [292, 262], 9, HR.line],
  [[694, 252], [560, 204], [380, 290], 8, HR.line],
  [[600, 150], [440, 126], [232, 214], 8, HR.line],
  [[706, 310], [650, 258], [530, 278], 7, HR.line],
  [[540, 218], [420, 214], [300, 300], 7, HR.line],
  [[302, 176], [200, 240], [178, 430], 8, HR.deep],
  [[262, 246], [206, 320], [206, 468], 7, HR.deep],
  [[690, 216], [736, 300], [722, 470], 8, HR.deep],
  [[664, 262], [704, 330], [704, 452], 7, HR.deep],
  [[470, 150], [360, 156], [256, 236], 6, HR.line],
  [[620, 240], [540, 236], [470, 282], 6, HR.line],
  [[560, 170], [470, 170], [380, 226], 6, HR.line],
  [[700, 280], [660, 240], [600, 250], 5, HR.line],
  [[420, 200], [340, 214], [270, 290], 6, HR.line],
  [[350, 258], [314, 276], [302, 318], 5, HR.line],
  [[232, 300], [198, 360], [192, 470], 6, HR.deep],
  [[716, 380], [726, 432], [716, 500], 6, HR.deep],
  [[600, 262], [540, 250], [480, 272], 6, "#cfd3da"],
  [[420, 252], [372, 262], [344, 290], 5, "#cfd3da"],
  [[702, 330], [716, 380], [716, 430], 5, "#c5cad2"],
  // 밝은 결
  [[574, 136], [440, 126], [300, 170], 10, "#f3f4f7"],
  [[630, 186], [500, 166], [360, 214], 8, "#f3f4f7"],
  [[492, 232], [410, 230], [336, 262], 7, "#eef0f3"],
  [[680, 232], [712, 282], [716, 360], 7, "#e9ecf0"],
  [[250, 220], [210, 270], [196, 340], 6, "#c3c8d0"],
];
P(`<defs><clipPath id="shn-hair"><path d="${hairOuter}${hairline}"/></clipPath></defs><g clip-path="url(#shn-hair)">`);
for (const s of strands) P(strand(s[0], s[1], s[2], s[3], s[4]));
P(`</g>`);
P(`<path d="${hairOuter}${hairline}" fill="none" stroke="${INK}" stroke-width="8" stroke-linejoin="round"/>`);

// ── 이목구비 (사진에서 잰 위치 — 눈썹 338~646·416~445, 눈동자 (397,500)·(578,497), 콧방울 y 612~654, 입선 y 698~720)
P(`<g stroke="${INK}" stroke-linejoin="round" stroke-linecap="round">
<path d="M338 441L352 428C366 420 382 416 400 416C420 416 438 418 452 424L453 438C440 434 420 434 400 435C380 436 364 440 352 445Z" fill="#3a3433" stroke-width="2.5"/>
<path d="M531 424C548 418 572 414 598 414C616 414 630 420 640 428L646 440L638 444C626 436 610 432 594 431C574 431 552 434 532 438Z" fill="#3a3433" stroke-width="2.5"/>
<path d="M360 432Q400 424 440 428M552 426Q590 420 626 430" fill="none" stroke="#5f5859" stroke-width="2.5" opacity=".8"/>
<defs><clipPath id="shn-el"><path d="M346 503Q372 488 400 489Q428 491 448 505Q422 511 400 512Q370 511 346 503Z"/></clipPath><clipPath id="shn-er"><path d="M535 503Q558 487 585 486Q612 488 635 497Q612 506 588 508Q560 508 535 503Z"/></clipPath></defs>
<path d="M346 503Q372 488 400 489Q428 491 448 505Q422 511 400 512Q370 511 346 503Z" fill="#fbf8f6" stroke="none"/>
<g clip-path="url(#shn-el)"><circle cx="397" cy="500" r="12" fill="#3e2b24" stroke="none"/><circle cx="397" cy="500" r="5.5" fill="#1e1412" stroke="none"/><circle cx="402" cy="496" r="3.2" fill="#ffffff" stroke="none"/><path d="M346 490Q400 480 450 492V500Q400 492 346 500Z" fill="#000" opacity=".12" stroke="none"/></g>
<path d="M342 504Q372 485 400 486Q430 488 452 506" fill="none" stroke-width="7"/>
<path d="M352 507Q376 514 400 514Q424 512 444 508" fill="none" stroke="#a2705e" stroke-width="3"/>
<path d="M535 503Q558 487 585 486Q612 488 635 497Q612 506 588 508Q560 508 535 503Z" fill="#fbf8f6" stroke="none"/>
<g clip-path="url(#shn-er)"><circle cx="578" cy="497" r="12" fill="#3e2b24" stroke="none"/><circle cx="578" cy="497" r="5.5" fill="#1e1412" stroke="none"/><circle cx="583" cy="493" r="3.2" fill="#ffffff" stroke="none"/><path d="M535 488Q585 476 638 488V496Q585 488 535 498Z" fill="#000" opacity=".12" stroke="none"/></g>
<path d="M531 504Q558 484 585 483Q614 485 639 497" fill="none" stroke-width="7"/>
<path d="M540 506Q562 511 588 511Q612 508 630 501" fill="none" stroke="#a2705e" stroke-width="3"/>
<path d="M356 526Q382 536 414 532M546 522Q576 530 608 524" fill="none" stroke="#c98b6b" stroke-width="3.5"/>
<path d="M440 616Q424 640 442 654Q462 662 480 652Q505 666 530 652Q552 662 566 648Q580 628 564 612" fill="none" stroke="#7d4a3a" stroke-width="4.5"/>
<path d="M462 646Q476 638 492 646Q478 653 462 646Z" fill="#5b3a32" stroke="none"/>
<path d="M528 646Q540 638 552 645Q542 651 528 646Z" fill="#5b3a32" stroke="none"/>
<ellipse cx="526" cy="612" rx="13" ry="8" fill="#ffffff" opacity=".6" stroke="none"/>
<path d="M440 664Q420 692 416 726M574 656Q598 682 604 716" fill="none" stroke="#b4765a" stroke-width="4"/>
<path d="M413 717Q440 707 470 710Q496 706 505 711Q514 706 542 706Q570 702 590 700Q574 716 545 717Q505 722 470 720Q440 722 413 717Z" fill="#c27a69" stroke="none"/>
<path d="M432 722Q468 744 505 744Q544 742 568 716Q540 728 505 728Q468 728 432 722Z" fill="#dc9583" stroke="none"/>
<path d="M470 732Q500 738 530 732" fill="none" stroke="#f0b8a8" stroke-width="4" opacity=".8"/>
<path d="M410 717Q450 723 505 720Q552 716 594 699" fill="none" stroke="#3a2420" stroke-width="5"/>
<path d="M594 699L601 692M410 717L403 713" fill="none" stroke="#3a2420" stroke-width="4"/>
</g>`);

await build({
  name: "shin-hyunsong",
  exportName: "SHIN_HYUNSONG",
  doc: [
    "신현송 한국은행 총재 — 손으로 짠 벡터 일러스트 (480×560)",
    "참고 사진: Wikimedia Commons 'Hyun Song Shin, deputy del Banco de Pagos Internacionales … (cropped).jpg' — G20 Argentina, CC BY 2.0 (https://creativecommons.org/licenses/by/2.0/)",
    "사진 위에서 잰 머리선·이목구비·턱선 좌표로 그린 것 — 고치려면 scripts/portraits/shin-hyunsong.mjs 를 고쳐 다시 실행 (README 참고)",
  ],
  credit: "인물 그림 원본 사진: G20 Argentina · CC BY 2.0 · 변형",
  id: "shn",
  crop: [0, 60, 960],
  body: out.join("\n"),
});
