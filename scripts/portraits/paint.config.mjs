// 사진을 칠한 초상(paint.mjs) 목록 — 여기 있는 인물은 벡터 대신 '사진을 붓으로 칠한 그림'을 썸네일에 써요
// (ai/<인물>.webp AI 일러스트가 있으면 그게 우선 — 지금은 모두 AI 일러스트라 대비용)
// (자유 이용 사진이 있는 인물만. 출처를 모르는 사진은 칠하지 않고 벡터로만 그려요)
// erase: 지울 곳 [cx, cy, rx, ry] — 원본 사진 좌표. 국기·기관 배지·명찰 줄처럼 그림에 넣지 않는 것
export const PAINT = {
  "shin-hyunsong": { erase: [[628, 1060, 32, 150]] },
  "kevin-warsh": {},
  "lee-jaemyung": { erase: [[691, 1006, 46, 34]] },
  "donald-trump": { erase: [[671, 856, 22, 25]] },
  "lee-hyoungil": { erase: [[772, 1055, 30, 30]] },
  "lee-eogweon": { erase: [[712, 1068, 36, 36]] },
  "scott-bessent": {},
};
