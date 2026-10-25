# 브리핑 썸네일 인물 초상 만들기

데일리 브리핑 썸네일의 `<kk-portrait who="…"/>` 인물은 **운영자가 만든 AI 일러스트**(`ai/<인물>.webp`, 흰 바탕·검은 윤곽선 상반신)를
`ai.mjs` 로 배경을 떼어 480×560 초상으로 만든 거예요. 손으로 짠 벡터나 사진을 칠한 그림보다 훨씬 그림 같고 자연스러워서 이걸 먼저 써요.

```bash
node scripts/portraits/ai.mjs              # ai/ 의 전부
node scripts/portraits/ai.mjs lee-jaemyung # 한 명
```

- 결과: `src/lib/server/portraits/<인물>.ts` (JPEG 그림 + PNG 마스크를 품은 svg, 한 명에 130KB 안팎) · 확인용 `out/<인물>-ai.png`
- 아래 흰 띠(둥근 받침)를 먼저 잘라 내고, 배경은 위·왼쪽·오른쪽 가장자리의 흰색을 따라 떼요(검은 윤곽선에서 멈춰요).
  흰 띠를 남긴 채 떼면 흰 셔츠까지 번져 지워져요 — 셔츠 자리가 배경으로 잡히면 경고가 나와요
- 출처 표시(`ai.mjs` 의 `AI` 목록 `credit`): 일러스트를 자유 이용 사진(CC BY·공공누리 제1유형 등)을 바탕으로 만들었으면 그 사진 출처를 꼭 적어요. 바탕 사진을 모르면 비워요
- 새 인물: 그림을 `ai/<인물>.webp` 로 넣고 `AI` 목록에 한 줄, `src/lib/server/thumb-portraits.ts` 의 `PHOTO` 에 등록, `scripts/automation/ROUTINE.md` 의 인물 목록에 추가

| 인물 | `who` | 출처 표시 |
| --- | --- | --- |
| 신현송 한국은행 총재 | `shin-hyunsong` | G20 Argentina 사진 바탕 — CC BY 2.0 |
| 케빈 워시 연준 의장 | `kevin-warsh` | 없음 |
| 이재명 대통령 | `lee-jaemyung` | 대한민국 국회 사진 바탕 — 공공누리 제1유형 |
| 도널드 트럼프 미국 대통령 | `donald-trump` | 없음 (`face="speak"` 이면 `donald-trump-speak.webp`) |
| 이형일 부총리 겸 재정경제부 장관 | `lee-hyoungil` | 대한민국 국회 사진 바탕 — 공공누리 제1유형 |
| 이억원 금융위원장 | `lee-eogweon` | 대한민국 대통령실 사진 바탕 — 공공누리 제1유형 |
| 스콧 베선트 미국 재무장관 | `scott-bessent` | 미국 재무부 사진 바탕 — 퍼블릭 도메인 |
| 다카이치 사나에 일본 총리 | `sanae-takaichi` | 없음 |
| 시진핑 중국 국가주석 | `xi-jinping` | 없음 |
| 앤디 버넘 영국 총리 | `andy-burnham` | 없음 |
| 에마뉘엘 마크롱 프랑스 대통령 | `emmanuel-macron` | 없음 |
| 프리드리히 메르츠 독일 총리 | `friedrich-merz` | 없음 |
| 이재용 삼성전자 회장 | `lee-jaeyong` | 없음 |
| 정의선 현대자동차그룹 회장 | `chung-euisun` | 없음 |
| 최태원 SK그룹 회장 | `chey-taewon` | 없음 |
| 젠슨 황 엔비디아 CEO | `jensen-huang` | 없음 |
| 일론 머스크 테슬라 CEO | `elon-musk` | 없음 |
| 샘 올트먼 오픈AI CEO | `sam-altman` | 없음 |
| 다리오 아모데이 앤트로픽 CEO | `dario-amodei` | 없음 |
| 마크 저커버그 메타 CEO | `mark-zuckerberg` | 없음 |
| 이찬진 금융감독원장 | `lee-chanjin` | 없음 — 손으로 그린 벡터 `lee-chanjin.mjs` (출처 모를 사진은 생김새 참고로만) |

일러스트는 `ai/<who>.webp`. 표정 바꾼 판은 `ai/<who>-<face>.webp` 로 넣고 `ai.mjs` 의 `AI` 목록과 `thumb-portraits.ts` 의 `FACES` 에 등록해요.

## 대비용: 사진 칠하기·벡터

AI 일러스트가 없는 인물은 예전 방식으로 만들 수 있어요. 순서는 **AI 일러스트 > 사진 칠하기 > 벡터** — 앞의 것이 있으면 뒤의 스크립트는 썸네일 그림을 덮어쓰지 않아요.

- 사진 칠하기(`paint.mjs`, `paint.config.mjs`): 자유 이용 사진(`photos/<인물>.jpg`, 저장소에 없음)을 매끈한 붓 칠·명암·잉크 선으로 칠하고 벡터 실루엣으로 배경을 떼요
- 벡터(`<인물>.mjs`, `lib.mjs`): 사진에서 잰 좌표로 손으로 짠 그림. 사진 칠하기의 실루엣으로도 써요

참고 사진 (사진 칠하기·벡터용, Wikimedia Commons): [신현송](https://commons.wikimedia.org/wiki/File:Hyun_Song_Shin,_deputy_del_Banco_de_Pagos_Internacionales_-_D%C3%ADa_2_-_3era_reuni%C3%B3n_de_ministros_de_Finanzas_y_Presidentes_de_Bancos_Centrales_(cropped).jpg) ·
[워시](https://commons.wikimedia.org/wiki/File:Official_portrait_of_Kevin_M._Warsh_(cropped)2.jpg) · [이재명](https://commons.wikimedia.org/wiki/File:Lee_Jae-myung%27s_Portrait_(2024.2).jpg) ·
[트럼프](https://commons.wikimedia.org/wiki/File:Donald_Trump_official_portrait.jpg) · [이형일](https://commons.wikimedia.org/wiki/File:Lee_Hyoung-il%27s_portrait_(2026.10).jpg) ·
[이억원](https://commons.wikimedia.org/wiki/File:Lee_Eog-weon%27s_portrait_(2025.09).jpg) · [베선트](https://commons.wikimedia.org/wiki/File:Official_portrait_of_Treasury_Secretary_Scott_Bessent_(cropped).jpg)

### 고치기 (사진 칠하기·벡터)

사진(`photos/<인물>.jpg`, 표의 960px 판)은 저장소에 없으니 먼저 받아 두세요.

```bash
node scripts/portraits/shin-hyunsong.mjs
node scripts/portraits/paint.mjs shin-hyunsong
```

- `<인물>.mjs` — 벡터 그림을 `vector/<인물>.svg·json` 에 써요 (칠하지 않는 인물은 `src/lib/server/portraits/<인물>.ts` 까지)
- `paint.mjs` — 사진을 칠해 `src/lib/server/portraits/<인물>.ts` 를 써요 (JPEG 그림 + PNG 마스크를 품은 svg, 한 명에 100~150KB)
  - 칠하는 세기·지울 곳(국기·배지·명찰 줄)은 `paint.config.mjs` — 지울 곳은 원본 사진 좌표 `[cx, cy, rx, ry]`
- 확인용: `out/<인물>-paint.png`(칠한 그림), `out/<인물>.png`(벡터), `out/<인물>-over.png`(사진 위에 벡터를 겹친 것 — 실루엣이 맞는지)

### 새 인물 추가 (사진 칠하기·벡터)

1. **라이선스부터 확인** — Wikimedia Commons 등에서 퍼블릭 도메인·CC BY·공공누리 제1유형인 정면 사진만 밑그림으로 써요.
   언론사 사진·출처가 불분명한 사진은 밑그림으로 쓰지 않아요 (정부 누리집·정책브리핑 사진도 '변경 금지'인 경우가 많아요).
   그런 사진밖에 없으면 생김새 참고로만 보고 정면 구도로 새로 그리고, 출처 표시는 비워요 (`lee-chanjin.mjs`).
2. 960px 판을 `scripts/portraits/photos/<인물>.jpg` 로 받아요 (사진 파일은 저장소에 올리지 않아요).
   웃거나 편안한 표정의 정면 사진, 어깨까지 나온 사진이 좋아요 — 칠한 그림은 사진 표정이 그대로 나와요.
3. 사진에 좌표 격자를 얹어 확대해 보며 머리 바깥선·머리선·눈썹·눈(눈동자 중심)·코·입·턱선·귀·목·옷깃·넥타이 좌표를 재요.
   머리선은 특히 정확히 — 너무 높거나 낮으면 머리가 모자처럼 보여요.
4. 기존 스크립트를 복사해 좌표와 색을 바꿔요. 좌표는 모두 **원본 사진 픽셀 기준**이고,
   `build()` 의 `crop: [x, y, 폭]` 이 상자(480×560, 가로:세로 = 6:7)로 옮길 칸이에요. `id` 는 인물마다 다른 짧은 앞붙이.
   - 머리 바깥선·머리선은 `scallop()`(점 사이를 살짝 부풀린 뭉치 곡선 — 톱니 모양 앞머리는 어색해요), 머리결은 `flow()`(길잡이 곡선 두 개 사이를 가닥으로 메움)
   - 눈썹은 모양 clipPath 안에 바탕색 + `browHairs()`(안쪽 끝은 서고 바깥으로 갈수록 눕는 털)
   - 속눈썹·입선·주름처럼 굵기가 변하는 선은 `strand()`(가운데가 두껍고 끝이 뾰족한 면) — 검은 고정 굵기 선은 바깥 윤곽에만
   - 빛 방향을 하나 정해 얼굴 바탕은 그라데이션, 그늘·빛·홍조는 흐림 필터(`blurDefs()`)를 건 모양을 부위(clipPath) 안에 얹어요
   - 그라데이션·clipPath·필터 아이디가 서로 겹치면 엉뚱하게 그려져요 (clipPath 는 `<id>-c-…`)
   - 흐린 모양이 많을수록 썸네일 만드는 시간이 늘어요 — 인물 한 명에 0.5초 안쪽으로
   - 칠할 인물은 벡터를 실루엣만 정확히 그려도 돼요 (`donald-trump.mjs` — 머리·얼굴·귀·목·셔츠·넥타이·정장 면만)
5. `paint.config.mjs` 에 넣고 `paint.mjs` 로 칠해요. `out/` 그림을 보며 맞추고, `src/lib/server/thumb-portraits.ts` 의 `PHOTO` 에 등록해요.

### 닮게 만드는 포인트 (벡터)

좌표만 맞으면 '누군지 모를 아저씨'가 되기 쉬워요. 썸네일 크기(세로 200px 안팎)로 줄여 사진과 나란히 놓고, 그 사람을 알아보게 하는 특징 3~4개를 또렷하게 살려요.

- 신현송: 희끗희끗한 반백 머리(은발·푸른 기 X), 짙고 굵은 일자 눈썹, 가늘게 웃는 눈과 눈 밑 애교살, 넓은 콧방울, 다문 잔잔한 미소
- 케빈 워시: 이마를 가로지르는 일자 머리선과 희끗한 관자놀이, 짙고 긴 눈썹 아래 깊은 눈, 이가 드러나는 큰 웃음과 깊은 팔자 주름, V자로 좁아지는 턱, 큰 귀
- 턱선·얼굴 폭은 눈대중보다 사진 밝기 경계(턱 아래 그늘이 시작되는 곳)를 열마다 재는 게 정확해요
- 흰자가 넓고 눈동자가 다 보이는 눈, 같은 굵기의 검은 선, 너무 밝고 매끈한 피부는 '만화 캐릭터'처럼 보여요
