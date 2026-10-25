// 도널드 트럼프 미국 대통령 초상 — 2017년 백악관 공식 초상(960×1216) 위에서 잰 실루엣
// 사용: node scripts/portraits/donald-trump.mjs → node scripts/portraits/paint.mjs donald-trump
// 썸네일 그림은 paint.mjs 가 사진을 칠해서 만들어요. 여기 벡터는 실루엣(배경 떼기)과, 사진 배경이 비치는 가장자리를 메울 바탕색이에요.
import { build, scallop } from "./lib.mjs";

const ID = "dtr";
const INK = "#2b2018";
const path = (d, fill) => `<path d="${d}" fill="${fill}"/>`;

// ── 모양 (사진에서 잰 좌표)
const hair =
  "M258 420" +
  scallop([[258, 420], [247, 380], [240, 330], [245, 280], [262, 235], [290, 200], [330, 172], [380, 155], [440, 147], [500, 148], [560, 160], [612, 184], [650, 218], [672, 258], [674, 286], [664, 304], [662, 340], [660, 390], [656, 420]], 0.12) +
  "C636 380 606 346 560 340C500 334 400 334 340 344C300 354 280 384 258 420Z";
const face =
  "M290 420C284 470 288 540 300 580C312 616 334 650 380 700C404 724 440 738 470 740C500 740 536 724 570 690C600 656 622 616 635 560C644 520 648 470 648 420C646 330 600 270 470 262C340 262 292 330 290 420Z";
const earL = "M292 420C270 412 252 420 246 450C242 482 250 516 264 536C274 548 288 548 296 542Z";
const earR = "M645 420C664 410 676 424 676 456C676 488 664 516 652 534C644 542 636 544 632 540Z";
const neck = "M330 630L336 770L470 800L580 780L584 650Z";
const shirt = "M296 606L332 790L452 1060L560 1060L592 800L588 652Z";
const tie = "M402 770Q446 760 490 770L474 842L506 1060L380 1060L420 842Z";
const suitL = "M-10 745L80 730L170 700L250 650L292 602L300 620L334 800L452 1060L-10 1060Z";
const suitR = "M586 656L650 705L760 740L860 775L970 810L970 1060L506 1060L592 800Z";

const body = [
  path(suitL, "#1d2433") + path(suitR, "#1d2433"),
  path(shirt, "#eef0f4"),
  path(tie, "#3a5aa8"),
  path(neck, "#d9967a"),
  path(earL, "#e2a083") + path(earR, "#e2a083"),
  path(face, "#e9a98a"),
  path(hair, "#e6d1a0"),
].join("\n");

await build({
  name: "donald-trump",
  exportName: "DONALD_TRUMP",
  doc: [
    "도널드 트럼프 미국 대통령 — 사진을 칠한 일러스트 (480×560)",
    "참고 사진: Wikimedia Commons 'Donald Trump official portrait.jpg' — 미국 백악관(Shealah Craighead, 2017), 퍼블릭 도메인",
    "실루엣은 scripts/portraits/donald-trump.mjs, 칠하기는 scripts/portraits/paint.mjs (README 참고)",
  ],
  credit: "인물 그림 원본 사진: 미국 백악관 · 퍼블릭 도메인",
  id: ID,
  crop: [45, 97, 820],
  body: body + `<path d="${hair}" fill="none" stroke="${INK}" stroke-width="0"/>`,
});
