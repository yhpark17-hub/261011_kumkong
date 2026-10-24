// 케빈 워시 연준 의장 초상 — 원본 사진(960×1244) 위에서 잰 좌표로 짠 벡터 일러스트
// 사용: node scripts/portraits/kevin-warsh.mjs  (사진 겹침 확인은 scripts/portraits/photos/kevin-warsh.jpg 가 있을 때)
import { build, scallop, strand } from "./lib.mjs";

const SK = { base: "#f1c4a2", mid: "#e2a984", deep: "#cc8f6c", line: "#ad7056", hi: "#fbdfc8" };
const HR = { base: "#34302e", mid: "#4b4542", light: "#6f6965", silver: "#9d968f", deep: "#1f1b1a" };
const INK = "#2b2018";
const SUIT = { base: "#454d60", dark: "#363d4e", light: "#525b70", line: "#2a303d" };

const out = [];
const P = (s) => out.push(s);

// ── 정장
P(`<path d="M-20 1260L-20 872C60 846 150 812 220 774C256 754 280 734 292 716L300 1260Z" fill="${SUIT.base}" stroke="${INK}" stroke-width="8" stroke-linejoin="round"/>`);
P(`<path d="M664 712C682 740 724 770 790 800C866 832 930 856 980 876L980 1260L606 1260Z" fill="${SUIT.base}" stroke="${INK}" stroke-width="8" stroke-linejoin="round"/>`);
// 깃(라펠)
P(`<path d="M292 724L104 944L146 958L70 1078L170 1260L300 1260Z" fill="${SUIT.light}" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>`);
P(`<path d="M664 718L846 930L806 946L892 1078L790 1260L606 1260Z" fill="${SUIT.light}" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>`);
P(`<path d="M-20 980C30 960 70 948 96 942L60 1078L130 1260L-20 1260Z" fill="${SUIT.dark}" stroke="none"/>`);
P(`<path d="M980 980C930 960 890 948 866 942L902 1078L840 1260L980 1260Z" fill="${SUIT.dark}" stroke="none"/>`);
P(`<path d="M736 1150L800 1196" fill="none" stroke="${SUIT.line}" stroke-width="6" stroke-linecap="round"/>`);
// ── 셔츠
P(`<path d="M294 738L300 1260L606 1260L664 736Z" fill="#f7f8fb" stroke="${INK}" stroke-width="7" stroke-linejoin="round"/>`);
P(`<path d="M318 1000L314 1260M620 1000L604 1200" fill="none" stroke="#dde3ee" stroke-width="12" stroke-linecap="round"/>`);
// ── 목
P(`<path d="M336 600L332 728L456 872L612 724L610 600Z" fill="${SK.mid}" stroke="${INK}" stroke-width="7" stroke-linejoin="round"/>`);
P(`<path d="M332 732L456 872L612 728L611 770C580 820 520 860 456 868C404 850 362 806 332 774Z" fill="${SK.deep}" stroke="none"/>`);
// ── 넥타이
P(`<path d="M422 1004L506 1004L536 1260L378 1260Z" fill="#22305a" stroke="${INK}" stroke-width="7" stroke-linejoin="round"/>`);
P(`<path d="M384 896Q458 884 532 896L506 1006Q464 1014 422 1006Z" fill="#1c2749" stroke="${INK}" stroke-width="7" stroke-linejoin="round"/>`);
P(`<path d="M452 1030L432 1260M482 1030L490 1260" fill="none" stroke="#33437a" stroke-width="5" stroke-linecap="round"/>`);
P(`<path d="M410 912Q458 902 504 912" fill="none" stroke="#33437a" stroke-width="5" stroke-linecap="round"/>`);
// ── 셔츠 깃
P(`<path d="M296 714L334 730L456 872L392 906L296 978Z" fill="#ffffff" stroke="${INK}" stroke-width="7" stroke-linejoin="round"/>`);
P(`<path d="M664 710L610 726L456 872L526 904L646 998Z" fill="#ffffff" stroke="${INK}" stroke-width="7" stroke-linejoin="round"/>`);
P(`<path d="M322 800L380 870M620 790L560 860" fill="none" stroke="#dde3ee" stroke-width="8" stroke-linecap="round"/>`);
// ── 귀
P(`<path d="M272 392C252 370 224 370 214 396C204 426 210 474 222 504C232 528 248 544 266 548Z" fill="${SK.base}" stroke="${INK}" stroke-width="7" stroke-linejoin="round"/>`);
P(`<path d="M254 404C236 400 228 430 232 466C236 492 244 508 256 516C250 486 248 440 254 404Z" fill="${SK.deep}" stroke="none"/>`);
P(`<path d="M252 404C232 410 226 444 232 480M240 492C250 500 256 512 254 524" fill="none" stroke="${SK.line}" stroke-width="5" stroke-linecap="round"/>`);
P(`<path d="M672 384C690 362 714 364 720 390C726 420 720 470 708 498C700 514 690 526 674 530Z" fill="${SK.base}" stroke="${INK}" stroke-width="7" stroke-linejoin="round"/>`);
P(`<path d="M690 396C706 396 710 430 704 466C700 488 694 500 686 506C690 476 692 430 690 396Z" fill="${SK.deep}" stroke="none"/>`);
P(`<path d="M692 398C708 406 710 440 704 474" fill="none" stroke="${SK.line}" stroke-width="5" stroke-linecap="round"/>`);
// ── 얼굴
const face =
  "M268 300C264 360 268 430 274 490C280 550 288 600 304 636C320 668 346 692 378 702C410 710 470 712 516 706C556 698 590 682 612 656C634 630 646 590 654 540C662 480 670 420 676 360C680 300 670 240 640 210C600 180 520 168 440 172C360 176 300 196 282 230C272 250 268 270 268 300Z";
P(`<path d="${face}" fill="${SK.base}" stroke="none"/>`);
// 명암 (빛은 왼쪽 앞에서 — 오른쪽 볼이 살짝 그늘)
P(`<path d="M676 360C670 420 662 480 654 540C646 590 634 630 612 656C590 682 556 698 516 706C552 690 580 664 596 630C612 594 622 548 628 500C634 450 640 400 652 340Z" fill="${SK.mid}" stroke="none"/>`);
P(`<path d="M282 230C300 210 360 196 440 194C520 192 600 200 640 222C660 240 670 264 676 300C650 266 610 248 560 240C480 230 380 232 330 244C300 252 284 262 274 280Z" fill="${SK.mid}" stroke="none"/>`);
P(`<path d="M274 330C270 400 274 470 282 530C288 576 298 612 312 640C302 600 296 560 294 520C290 460 290 400 296 330Z" fill="${SK.mid}" opacity=".7" stroke="none"/>`);
// 눈두덩
P(`<path d="M318 352C330 326 356 314 382 316C404 318 420 330 426 350C410 338 394 332 372 332C350 334 332 342 318 352Z" fill="${SK.mid}" stroke="none"/>`);
P(`<path d="M490 344C502 320 528 308 554 310C576 312 592 326 598 344C582 332 566 326 546 326C524 328 506 334 490 344Z" fill="${SK.mid}" stroke="none"/>`);
// 콧등·코 아래
P(`<path d="M470 340C478 380 484 420 486 450C494 446 500 440 502 432C496 404 486 370 470 340Z" fill="${SK.mid}" stroke="none"/>`);
P(`<path d="M420 492C440 500 490 500 512 490C504 510 486 518 466 518C444 518 426 510 420 492Z" fill="${SK.mid}" opacity=".7" stroke="none"/>`);
// 웃을 때 올라간 볼
P(`<path d="M520 500C548 492 580 498 600 520C606 540 600 560 590 570C586 540 566 516 520 500Z" fill="${SK.mid}" stroke="none"/>`);
P(`<path d="M402 500C374 494 344 502 326 524C320 544 326 562 334 570C340 540 360 516 402 500Z" fill="${SK.mid}" opacity=".8" stroke="none"/>`);
// 아랫입술 아래·턱
P(`<path d="M404 596C440 612 500 612 530 594C520 620 490 630 466 630C440 630 414 620 404 596Z" fill="${SK.mid}" stroke="none"/>`);
P(`<path d="M304 636C320 668 346 692 378 702C410 710 470 712 516 706C470 700 420 696 380 684C350 672 326 656 304 636Z" fill="${SK.deep}" opacity=".6" stroke="none"/>`);
// 하이라이트
P(`<path d="M352 252C410 238 490 236 560 248C520 260 420 262 352 252Z" fill="${SK.hi}" stroke="none"/>`);
P(`<path d="M456 360C460 392 462 420 460 444C452 420 450 392 456 360Z" fill="${SK.hi}" stroke="none"/>`);
P(`<path d="M440 652C460 646 492 646 508 654C496 666 452 666 440 652Z" fill="${SK.hi}" opacity=".8" stroke="none"/>`);
// 볼 홍조
P(`<ellipse cx="346" cy="472" rx="36" ry="18" fill="#ec9580" opacity=".25" stroke="none"/>`);
P(`<ellipse cx="584" cy="468" rx="34" ry="18" fill="#ec9580" opacity=".25" stroke="none"/>`);
// 얼굴 윤곽
P(`<path d="M274 490C280 550 288 600 304 636C320 668 346 692 378 702C410 710 470 712 516 706C556 698 590 682 612 656C634 630 646 590 654 540C658 512 662 480 666 452" fill="none" stroke="${INK}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>`);

// ── 머리 (짧게 다듬어 왼쪽 가르마에서 오른쪽으로 넘긴 짙은 머리, 관자놀이 쪽 희끗)
const outerPts = [
  [264, 400], [234, 388, 0.06], [227, 330, 0.08], [230, 262, 0.08], [244, 200, 0.1], [270, 140, 0.1], [306, 92, 0.1],
  [356, 54, 0.1], [420, 28, 0.08], [480, 22, 0.06], [534, 38, 0.1], [580, 66, 0.1], [628, 110, 0.1], [664, 166, 0.1],
  [688, 228, 0.1], [698, 290, 0.08], [696, 346, 0.08], [686, 388, 0.06],
];
const hairPath =
  `M264 400${scallop(outerPts)}` +
  "C680 372 674 352 668 330C662 300 652 268 638 238C628 216 612 198 592 188" +
  "Q566 180 520 176Q470 172 420 176Q370 180 336 190Q316 196 302 204" +
  "C298 230 294 262 288 292C282 322 274 352 268 376Z";
P(`<path d="${hairPath}" fill="${HR.base}" stroke="none"/>`);
P(`<path d="M264 400L234 388Q228 360 227 330Q226 296 230 262Q252 300 268 340Q270 370 264 400Z" fill="${HR.light}" stroke="none"/>`);
P(`<path d="M686 388Q696 368 696 346Q700 318 698 290Q680 316 668 330Q676 360 686 388Z" fill="${HR.light}" stroke="none"/>`);
const strands = [
  // 정수리 왼쪽 가르마에서 오른쪽 아래로
  [[296, 124], [450, 40], [660, 172], 9, HR.deep],
  [[286, 170], [450, 96], [676, 250], 9, HR.deep],
  [[300, 196], [470, 140], [650, 230], 8, HR.deep],
  [[340, 84], [470, 40], [600, 74], 7, HR.light],
  [[320, 140], [450, 80], [620, 130], 6, HR.silver, 0.85],
  [[330, 176], [480, 120], [640, 190], 5, HR.light],
  [[400, 160], [520, 130], [660, 210], 5, HR.silver, 0.7],
  [[560, 60], [640, 110], [690, 220], 6, HR.light],
  [[600, 120], [670, 180], [690, 300], 6, HR.deep],
  // 가르마 아래 왼쪽 옆머리
  [[290, 120], [244, 190], [240, 330], 7, HR.deep],
  [[280, 210], [252, 270], [254, 370], 6, HR.silver, 0.8],
  [[662, 260], [688, 320], [688, 376], 6, HR.silver, 0.8],
  [[306, 100], [270, 150], [258, 230], 5, HR.light],
];
P(`<defs><clipPath id="wsh-hair"><path d="${hairPath}"/></clipPath></defs><g clip-path="url(#wsh-hair)">`);
P(`<path d="M300 110C360 56 440 30 500 28C560 34 610 64 640 100C580 76 520 64 460 66C400 70 346 90 300 128Z" fill="${HR.mid}" stroke="none"/>`);
for (const s of strands) P(strand(s[0], s[1], s[2], s[3], s[4], s[5] ?? 1));
P(`</g>`);
P(`<path d="${hairPath}" fill="none" stroke="${INK}" stroke-width="8" stroke-linejoin="round"/>`);

// ── 이목구비
P(`<g stroke="${INK}" stroke-linejoin="round" stroke-linecap="round">
<path d="M298 334C312 312 338 298 366 296C390 296 410 302 422 312L420 328C404 320 384 316 364 318C342 320 320 328 304 340Z" fill="#2c2421" stroke-width="2.5"/>
<path d="M480 316C494 302 516 292 544 290C566 290 586 298 600 316L594 326C578 314 560 308 542 310C522 312 500 320 482 330Z" fill="#2c2421" stroke-width="2.5"/>
<path d="M318 324Q360 306 410 312M496 310Q540 296 588 310" fill="none" stroke="#4a403c" stroke-width="2.5" opacity=".8"/>
<defs><clipPath id="wsh-el"><path d="M326 358Q344 338 368 338Q394 340 408 354Q390 366 366 367Q342 366 326 358Z"/></clipPath><clipPath id="wsh-er"><path d="M500 350Q516 331 542 330Q568 330 586 346Q568 358 544 359Q518 358 500 350Z"/></clipPath></defs>
<path d="M326 358Q344 338 368 338Q394 340 408 354Q390 366 366 367Q342 366 326 358Z" fill="#fbf8f6" stroke="none"/>
<g clip-path="url(#wsh-el)"><circle cx="364" cy="353" r="15" fill="#5a3826" stroke="none"/><circle cx="364" cy="353" r="7" fill="#1e1412" stroke="none"/><circle cx="370" cy="347" r="4" fill="#ffffff" stroke="none"/><path d="M326 340Q368 330 410 344V352Q368 340 326 354Z" fill="#000" opacity=".12" stroke="none"/></g>
<path d="M322 360Q342 334 368 334Q396 336 412 354" fill="none" stroke-width="7"/>
<path d="M332 362Q350 371 368 371Q390 369 402 360" fill="none" stroke="#a2705e" stroke-width="3.5"/>
<path d="M334 336Q362 318 398 330" fill="none" stroke="${SK.line}" stroke-width="3"/>
<path d="M338 384Q362 394 392 386" fill="none" stroke="${SK.line}" stroke-width="3"/>
<path d="M500 350Q516 331 542 330Q568 330 586 346Q568 358 544 359Q518 358 500 350Z" fill="#fbf8f6" stroke="none"/>
<g clip-path="url(#wsh-er)"><circle cx="543" cy="345" r="15" fill="#5a3826" stroke="none"/><circle cx="543" cy="345" r="7" fill="#1e1412" stroke="none"/><circle cx="549" cy="339" r="4" fill="#ffffff" stroke="none"/><path d="M500 332Q544 322 588 336V344Q544 332 500 346Z" fill="#000" opacity=".12" stroke="none"/></g>
<path d="M496 352Q514 327 542 326Q572 326 590 346" fill="none" stroke-width="7"/>
<path d="M506 354Q524 363 544 363Q566 361 580 352" fill="none" stroke="#a2705e" stroke-width="3.5"/>
<path d="M512 326Q544 310 578 322" fill="none" stroke="${SK.line}" stroke-width="3"/>
<path d="M512 378Q540 388 568 378" fill="none" stroke="${SK.line}" stroke-width="3"/>
<path d="M414 448Q398 470 414 484Q430 492 444 484Q460 496 478 484Q494 492 508 482Q524 466 510 446" fill="none" stroke="#7d4a3a" stroke-width="4.5"/>
<path d="M422 480Q432 472 446 480Q434 486 422 480Z" fill="#5b3a32" stroke="none"/>
<path d="M478 480Q490 472 502 479Q492 485 478 480Z" fill="#5b3a32" stroke="none"/>
<ellipse cx="462" cy="458" rx="12" ry="8" fill="#ffffff" opacity=".55" stroke="none"/>
<path d="M410 490Q380 510 364 538M516 488Q556 504 574 526" fill="none" stroke="${SK.line}" stroke-width="4"/>
<path d="M358 543Q400 534 460 535Q520 532 566 530Q544 568 466 571Q398 571 358 543Z" fill="#5e2a26" stroke="none"/>
<path d="M366 543Q410 535 462 535Q520 533 560 531Q540 561 466 565Q400 565 366 543Z" fill="#fbfbf8" stroke="none"/>
<path d="M404 539V552M430 537V555M456 536V556M482 535V556M508 534V553M532 533V549" fill="none" stroke="#e0dbd2" stroke-width="2.5"/>
<path d="M352 542Q392 520 440 524Q460 518 480 522Q530 516 570 528Q530 533 480 533Q460 531 440 535Q392 533 352 542Z" fill="#c97a6c" stroke="none"/>
<path d="M372 560Q420 590 470 590Q530 588 560 542Q532 578 470 579Q410 579 372 560Z" fill="#d38b7c" stroke="none"/>
<path d="M352 542Q398 532 460 534Q520 530 570 528" fill="none" stroke="#3a2420" stroke-width="4.5"/>
<path d="M360 545Q400 573 466 574Q536 571 566 531" fill="none" stroke="#3a2420" stroke-width="4"/>
<path d="M346 534Q350 544 358 549M576 520Q574 530 568 535" fill="none" stroke="#3a2420" stroke-width="4"/>
</g>`);

await build({
  name: "kevin-warsh",
  exportName: "KEVIN_WARSH",
  doc: [
    "케빈 워시 연준 의장 — 손으로 짠 벡터 일러스트 (480×560)",
    "참고 사진: Wikimedia Commons 'Official portrait of Kevin M. Warsh (cropped)2.jpg' — 미국 연방준비제도 이사회, 퍼블릭 도메인",
    "사진 위에서 잰 머리선·이목구비·턱선 좌표로 그린 것 — 고치려면 scripts/portraits/kevin-warsh.mjs 를 고쳐 다시 실행 (README 참고)",
  ],
  credit: "인물 그림 원본 사진: 미국 연준 이사회 · 퍼블릭 도메인",
  id: "wsh",
  crop: [0, -60, 960],
  body: out.join("\n"),
});
