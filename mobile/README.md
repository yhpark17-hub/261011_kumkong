# 금콩 앱 (iOS · Android)

금콩 웹사이트(`../`)의 Expo(React Native) 앱이에요. 데이터는 사이트의 앱용 API(`/api/app/v1/…`)에서 받아요.

- Expo SDK 58 · expo-router · TypeScript
- 화면: `src/app/` (탭 다섯 칸은 `src/app/(tabs)/`, 사이트 하단 탭과 같음)
- 색·글자: `src/constants/theme.ts` (사이트 `src/app/globals.css` 값을 옮김) · 글꼴 Pretendard(OFL, `assets/fonts`)
- 사이트 주소: `EXPO_PUBLIC_SITE_URL` (기본 `https://kumkong.vercel.app`)

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
