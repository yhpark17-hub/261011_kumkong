# 브리핑 썸네일 인물 초상 만들기

데일리 브리핑 썸네일의 `<kk-portrait who="…"/>` 인물은 **자유 이용 사진(퍼블릭 도메인·CC BY)** 을 밑그림 삼아 손으로 짠 벡터 일러스트예요.
사진 위에서 머리선·눈썹·눈동자·콧방울·입선·턱선 좌표를 재고, 그 자리에 깔끔한 면(피부·머리·정장 3단 명암)과 윤곽선을 그려요.
사진을 그대로 단순화하면 얼룩지고 흐릿해 보여서, 위치만 사진에서 가져오고 그림은 디자인팀 일러스트처럼 새로 그려요.

| 인물 | `who` | 그림 스크립트 | 참고 사진 | 라이선스 |
| --- | --- | --- | --- | --- |
| 신현송 한국은행 총재 | `shin-hyunsong` | `shin-hyunsong.mjs` | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Hyun_Song_Shin,_deputy_del_Banco_de_Pagos_Internacionales_-_D%C3%ADa_2_-_3era_reuni%C3%B3n_de_ministros_de_Finanzas_y_Presidentes_de_Bancos_Centrales_(cropped).jpg) (G20 Argentina) | CC BY 2.0 — 출처 표시 필요 |
| 케빈 워시 연준 의장 | `kevin-warsh` | `kevin-warsh.mjs` | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Official_portrait_of_Kevin_M._Warsh_(cropped)2.jpg) (미국 연준 이사회) | 퍼블릭 도메인 |

썸네일에 이 초상을 쓰면 **참고 사진 출처가 그림 아래 구석에 자동으로 붙어요** (`src/lib/server/portraits/*.ts` 의 `credit`).

## 고치기

```bash
node scripts/portraits/shin-hyunsong.mjs
```

스크립트가 `src/lib/server/portraits/<인물>.ts` 를 새로 쓰고, 확인용 그림을 `scripts/portraits/out/` 에 만들어요.

- `out/<인물>.png` — 480×560 상자 그대로 (2배 크기)
- `out/<인물>-over.png` — 사진 위에 그림을 반투명으로 겹친 것 (`photos/<인물>.jpg` 가 있을 때만). 머리선·눈·입이 사진과 어긋나지 않았는지 여기서 봐요.

## 새 인물 추가

1. **라이선스부터 확인** — Wikimedia Commons 등에서 퍼블릭 도메인이거나 CC BY(-SA) 인 정면 사진만. 언론사 사진·출처가 불분명한 사진은 쓰지 않아요.
2. 960px 판을 `scripts/portraits/photos/<인물>.jpg` 로 받아요 (사진 파일은 저장소에 올리지 않아요).
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
5. 실행해서 `out/` 의 두 그림을 보며 맞추고, `src/lib/server/thumb-portraits.ts` 의 `PHOTO` 에 등록해요.

## 닮게 만드는 포인트

좌표만 맞으면 '누군지 모를 아저씨'가 되기 쉬워요. 썸네일 크기(세로 200px 안팎)로 줄여 사진과 나란히 놓고, 그 사람을 알아보게 하는 특징 3~4개를 또렷하게 살려요.

- 신현송: 희끗희끗한 반백 머리(은발·푸른 기 X), 짙고 굵은 일자 눈썹, 가늘게 웃는 눈과 눈 밑 애교살, 넓은 콧방울, 다문 잔잔한 미소
- 케빈 워시: 이마를 가로지르는 일자 머리선과 희끗한 관자놀이, 짙고 긴 눈썹 아래 깊은 눈, 이가 드러나는 큰 웃음과 깊은 팔자 주름, V자로 좁아지는 턱, 큰 귀
- 턱선·얼굴 폭은 눈대중보다 사진 밝기 경계(턱 아래 그늘이 시작되는 곳)를 열마다 재는 게 정확해요
- 흰자가 넓고 눈동자가 다 보이는 눈, 같은 굵기의 검은 선, 너무 밝고 매끈한 피부는 '만화 캐릭터'처럼 보여요
