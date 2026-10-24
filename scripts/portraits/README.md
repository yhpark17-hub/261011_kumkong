# 브리핑 썸네일 인물 초상 만들기

데일리 브리핑 썸네일의 `<kk-portrait who="…"/>` 인물은 **자유 이용 사진(퍼블릭 도메인·CC BY)** 을 바탕으로 만든 벡터 일러스트예요.
사진에서 인물만 오려 부위(피부·머리·셔츠·정장·넥타이)별로 명암 3~4단계로 단순화하고, 이목구비 선과 바깥 윤곽선을 그려요.
그래서 손으로 그린 카툰보다 누군지 한눈에 알아봐요.

| 인물 | `who` | 원본 사진 | 라이선스 |
| --- | --- | --- | --- |
| 신현송 한국은행 총재 | `shin-hyunsong` | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Hyun_Song_Shin,_deputy_del_Banco_de_Pagos_Internacionales_-_D%C3%ADa_2_-_3era_reuni%C3%B3n_de_ministros_de_Finanzas_y_Presidentes_de_Bancos_Centrales_(cropped).jpg) (G20 Argentina) | CC BY 2.0 — 출처 표시 필요 |
| 케빈 워시 연준 의장 | `kevin-warsh` | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Official_portrait_of_Kevin_M._Warsh_(cropped)2.jpg) (미국 연준 이사회) | 퍼블릭 도메인 |

썸네일에 이 초상을 쓰면 **원본 사진 출처가 그림 아래 구석에 자동으로 붙어요** (`src/lib/server/portraits/*.ts` 의 `credit`).

## 새 인물 추가

1. **라이선스부터 확인** — Wikimedia Commons 등에서 퍼블릭 도메인이거나 CC BY(-SA) 인 정면 사진만. 언론사 사진·출처가 불분명한 사진은 쓰지 않아요.
2. 960px 판을 `scripts/portraits/photos/<인물>.jpg` 로 받아요 (사진 파일은 저장소에 올리지 않아요).
3. 설정 JSON 을 만들어요 (기존 두 파일을 복사해서). 좌표는 모두 **원본 사진 픽셀 기준**이에요.
   - `crop` — 480×560 비율(가로:세로 = 6:7)로 자를 칸, 머리 위 여백이 모자라면 `padTop`
   - `mask` — 인물 바깥선 (머리·어깨까지)
   - `zones.face` — 얼굴·귀·목 (위쪽은 **실제 머리선**을 따라 — 틀리면 머리가 모자처럼 보여요)
   - `zones.band` — 머리선 둘레 띠 (이 안은 색으로 머리/피부를 가려 앞머리 끝이 자연스러워요)
     흰머리면 `bandS`·`bandL`, 검은 머리면 `bandDark`
   - `zones.shirt`, `tie`, `zones.hairMaxY`(이 높이 아래 나머지는 정장)
   - `whiteZones` — 이·흰자 칸 (밝기 L·채도 S 기준)
   - `regions` — 부위별 색 단계 (`tones` 밝은 것부터, `q` 어두운 단계가 차지할 비율)
4. 실행하고 `out/<인물>.png` 를 눈으로 확인하며 조정해요.

   ```bash
   node scripts/portraits/toon.mjs scripts/portraits/<인물>.json
   ```

5. `out/<인물>.svgfrag` 내용을 `src/lib/server/portraits/<인물>.ts` 의 `svg` 에 넣고 `credit`(원본 사진 출처) 을 적은 뒤,
   `src/lib/server/thumb-portraits.ts` 의 `PHOTO` 에 등록해요.
