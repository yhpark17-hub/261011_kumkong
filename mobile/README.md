# 금콩 앱 (iOS · Android)

금콩 웹사이트(`../`)의 Expo(React Native) 앱이에요. 데이터는 사이트의 앱용 API(`/api/app/v1/…`)에서 받아요.

- Expo SDK 58 · expo-router · TypeScript
- 화면: `src/app/` (탭 다섯 칸은 `src/app/(tabs)/`, 사이트 하단 탭과 같음)
- 색·글자: `src/constants/theme.ts` (사이트 `src/app/globals.css` 값을 옮김) · 글꼴 Pretendard(OFL, `assets/fonts`)
- 사이트 주소: `EXPO_PUBLIC_SITE_URL` (기본 `https://kumkong.vercel.app`)
- 데이터: 사이트 `/api/app/v1/catalog`(전체 일정)·`/companies/[id]`(기관 상세) → `src/api/` (마지막 응답은 기기에 저장해 먼저 보여 줌)
- 관심 기관: 기기에만 저장 (`kumkong:favorites`, 계정 없음)
- 아침 브리핑: 사이트 `/api/app/v1/briefing`이 카드 장 목록(그림 주소·괄호 풀이·막대 높이)까지 계산해 주고, 앱은 그리기만 (`src/components/briefing/`). 카드 그림은 `/api/app/v1/pic/[name]` PNG
- 한글 줄바꿈: iOS는 `lineBreakStrategyIOS="hangul-word"`, Android·웹은 `src/lib/keep-all.ts`
- 웹 화면(콩밭·필기 후기·매거진 글·금콩 스터디): `src/components/site-web-view.tsx`
  - user-agent 끝 `KumkongApp/버전` → 사이트가 머리·탭·푸터·광고를 숨김 (사이트 `src/lib/app-view.ts`, 웹에서 확인할 땐 `?kk_app=1`)
  - 앱에 같은 화면이 있는 링크(캘린더·기관·아침판)는 앱 화면으로, 바깥 링크는 인앱 브라우저로 (`src/lib/site-links.ts`)
  - 사이트의 '차단' → 글쓴이 열쇠(data-ak)를 이 기기에 저장(`src/hooks/blocks.tsx`)하고 가리는 CSS를 넣음. 설정에서 모두 풀기
- 콩밭·필기 후기는 처음 열 때 이용 규칙 동의 (`src/components/community-gate.tsx`)
- `src/shared/`: 사이트 `src/lib`의 순수 모듈 복사본 — 사이트에서 고친 뒤 `node scripts/sync-shared.mjs`

## 실행

```bash
npm install
npx expo start --web     # PC 브라우저로 미리 보기
npx expo start           # 개발 빌드가 깔린 휴대폰에서 보기
```

아이폰에서 보려면 개발 빌드가 필요해요 (SDK 58용 Expo Go가 아직 스토어에 없음): `npx eas-cli@latest build -p ios --profile development`.

## 검사

```bash
npx tsc --noEmit
npx expo lint
npx expo-doctor
```

## 아이콘

`node scripts/make-icons.mjs` — 사이트 `src/app/icon.svg`의 콩이로 앱 아이콘·스플래시를 다시 만들어요.
