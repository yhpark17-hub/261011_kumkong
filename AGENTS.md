<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# 금콩 작업 수칙

금콩은 금융공기업·공공기관·은행 채용 일정(서류 마감·필기·면접·발표)을 한 달력에 모은 사이트입니다. 매거진(데일리 브리핑 아침판·점심 3문제, 주간 정리, 금융 블로그), 필기 후기, 콩밭 게시판도 있습니다.
Next.js 16(App Router) + Tailwind v4 · DB는 Turso · `main` 에 푸시하면 Vercel 이 곧바로 배포합니다. `mobile/` 은 따로 도는 Expo 앱입니다(`mobile/AGENTS.md`).

클라우드 자동 루틴(점검·브리핑)은 `scripts/automation/ROUTINE.md` 를 따릅니다. 이 문서와 어긋나면 ROUTINE.md 가 우선입니다.

## 1. 사실 — 날짜·숫자를 지어내지 않습니다

- 모르는 값은 비워 둡니다(`null` → 화면에 "확인 중"). 지난 회차 정보는 '예상'·'지난해' 표시를 붙입니다.
- 일정은 공고문 원문·기관 공식 홈페이지·잡알리오·보도자료로 직접 확인한 것만 씁니다. 블로그·카페·커뮤니티는 단서일 뿐 근거가 아닙니다.
- "11월 초 예정"처럼 정확한 날이 없으면 `events` 가 아니라 `note` 에 문장으로 남깁니다.
- 자소설닷컴 같은 곳은 시간이 UTC 로 보일 때가 있습니다. 공식 공고의 한국 시간으로 다시 확인합니다.
- 운영자가 준 브리프·제보·요약도 틀릴 수 있습니다. 숫자는 늘 원문과 다시 맞춰 봅니다.
- 날짜·숫자가 많은 글(브리핑, 주간 정리, 블로그, 일정 데이터)은 올리기 전에 `fact-checker` 에이전트로 원문 대조를 받습니다(7번).

## 2. 공개 저장소 — 개인 정보·저작권

- 저장소와 사이트는 공개입니다. 운영자 개인 정보(이름·직장·신원)를 글·코드·주석·커밋 메시지에 쓰지 않습니다.
- `.env*` 파일(비밀값)은 읽지도, 스테이징하지도 않습니다(`.env.example` 만 예외). 커밋 전에 스테이징한 파일에 토큰이 없는지 봅니다.
- 기사 문장을 그대로 옮기지 않고 요약합니다. 인용은 꼭 필요할 때 한 문장만.
- 언론사 사진, 다른 매체의 캐릭터·로고는 쓰지 않습니다. 사진은 PD·CC0·CC BY·공공누리 제1유형만 쓰고 출처를 남기며, 내려받기 전에 운영자에게 묻습니다.

## 3. 글쓰기

- 정보 제공형으로 씁니다. 작성자 본인 경험이나 "저도…" 같은 1인칭 일화는 넣지 않습니다(브리프에 '작성자 경험' 칸이 있어도 건너뜁니다).
- 금융을 잘 모르는 사람이 처음부터 끝까지 따라올 수 있게, 이어지는 문장으로 씁니다. 메모 조각이나 "의원: 발언" 나열 대신 상황 → 돈의 흐름 → 의미 순서로 풀고, 전문 용어는 처음 나오는 자리에서 짧게 풀어 줍니다. 이 원칙이 브리프의 "짧은 문장" 지시보다 우선입니다.
- 브리핑·주간 정리는 '~해요' 말투로, 과장·추측 표현 없이 씁니다.
- 장문(요약·본문)은 양쪽 맞춤 `ko-justify` 유틸리티를 씁니다(그냥 `text-align: justify` 는 휴대폰에서 틈이 벌어집니다).

## 4. 화면 — '그림책 금콩' (2026-11-15 개편)

- 기준은 `src/app/globals.css` 의 토큰입니다: `bg-page`(종이색 바탕), `card`(흰 카드), 남색 `--primary`, 주황 `accent-*`, `btn` 알약 버튼, 큰 제목 `font-display`(Jua).
- 루트의 `DESIGN.md` 는 개편 전(10월) 문서라 지금 디자인과 다릅니다. 따르지 않습니다.
- 보라·분홍 그라데이션이나 예전 GradientMesh 를 다시 들이지 않습니다. 로고(`components/ui.tsx` 의 Logo + '금콩')는 그대로 둡니다.
- Tailwind 테마가 기본 색을 지워 두었으니 `text-white`/`bg-white` 대신 `text-on-primary`/`bg-canvas` 를 씁니다.
- 그린 썸네일이 들어가는 칸은 40:21 비율로 둡니다(16:9 로 하면 잘립니다).

## 5. 썸네일·그림

- 모든 글에 주제에 맞는 썸네일이 있어야 하고, 글마다 구성이 달라야 합니다(아이콘 자리표시 금지).
- 브리핑 그림은 매일 새로 그립니다. 미리 그려 둔 세트를 돌려쓰지 않습니다.
- 아침판 공유 썸네일은 헤드라인 뉴스를 비유 없이 그 장면 그대로 그립니다(그림만 보고 주제를 맞힐 수 있게).
- 그림 속 숫자·인용은 그 판 글에 글자 그대로 있어야 합니다. 실존 인물을 희화화하지 않습니다.

## 6. 작업 흐름 (대화형 작업)

- 고친 뒤 `npm run check`(타입 검사 + eslint)를 돌립니다. 화면이 바뀌면 미리보기(`.claude/launch.json` 의 `kumkong-dev`)로 직접 확인합니다.
- 로컬 DB(`.env.local`)는 오래된 사본입니다. 데이터에 기대는 화면은 운영 사이트(https://kumkong.vercel.app)에서 확인합니다.
- 검증이 끝난 작업은 묻지 않고 커밋(한국어 메시지)하고 `git push origin main` 합니다.
- `.claude/launch.json` 에 임시로 넣은 항목은 커밋 전에 되돌립니다.
- `mobile/scripts/sync-shared.mjs` 가 앱으로 복사하는 `src/lib` 파일을 고쳤으면 그 스크립트를 다시 돌립니다.

## 7. 하네스 — 자동 검사와 검증 에이전트

- **훅** (`.claude/settings.json` → `scripts/hooks/guard.mjs`): `git commit` 직전과 작업을 끝내려 할 때, 바뀐 코드 파일이 있으면 타입 검사와 eslint 를 돌리고 실패하면 막습니다. 막히면 오류를 고칩니다. `--no-verify` 같은 우회는 쓰지 않습니다. 손으로 돌리려면 `node scripts/hooks/guard.mjs`.
- **`fact-checker`** (`.claude/agents/`): 초안의 날짜·숫자·이름·인용을 원문 링크와 하나씩 대조합니다. 읽기·웹 검색만 하고 파일은 고치지 않습니다.
- **`quiz-solver`**: 정답을 모르는 채로 문제를 풀어, 정답이 하나뿐인지 확인합니다(점심 3문제).
- 검증 에이전트에게는 재료(초안 파일 경로, 원문 주소)만 넘기고 내 결론은 넘기지 않습니다. 쓴 쪽의 판단을 미리 들으면 검증이 그 판단을 따라갑니다.
