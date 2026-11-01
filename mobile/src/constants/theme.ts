/**
 * 금콩 디자인 토큰 — 사이트 src/app/globals.css 값을 그대로 옮김 (색을 바꾸면 양쪽 같이).
 * 글자 단계는 DESIGN-MOBILE.md 원칙: 제목 700, 본문 16px/400·줄간격 1.6, 보조 500·회색.
 */
import { Platform } from 'react-native';

export const Colors = {
  light: {
    primary: '#533afd',
    primaryDeep: '#4434d4',
    primaryPress: '#2e2b8c',
    primarySoft: '#665efd',
    primarySubdued: '#b9b9f9',
    primaryText: '#533afd',
    brandDark: '#1c1e54',
    ruby: '#ea2261',
    magenta: '#f96bee',
    lemon: '#9b6829',
    shadowBlue: '#003770',
    sherbet: '#ffa26b',

    canvas: '#ffffff',
    canvasSoft: '#f6f9fc',
    canvasCream: '#f5e9d4',
    hairline: '#e3e8ee',
    hairlineInput: '#a8c3de',

    ink: '#0d253d',
    inkSecondary: '#273951',
    inkMute: '#64748d',
    onPrimary: '#ffffff',

    tagSoftBg: '#b9b9f9',
    tagSoftText: '#4434d4',

    evPosting: '#64748d',
    evPostingSoft: '#eef2f7',
    evDoc: '#ea2261',
    evDocSoft: '#fde9ef',
    evWritten: '#533afd',
    evWrittenSoft: '#eeebff',
    evInterview1: '#a8209b',
    evInterview1Soft: '#fdeefc',
    evInterview2: '#9b6829',
    evInterview2Soft: '#f5e9d4',
    evFinal: '#003770',
    evFinalSoft: '#e6eef7',
  },
  dark: {
    primary: '#665efd',
    primaryDeep: '#533afd',
    primaryPress: '#4434d4',
    primarySoft: '#665efd',
    primarySubdued: '#b9b9f9',
    primaryText: '#b9b9f9',
    brandDark: '#2e2b8c',
    ruby: '#ff4d82',
    magenta: '#f96bee',
    lemon: '#d9a25c',
    shadowBlue: '#7fb2e5',
    sherbet: '#ffa26b',

    canvas: '#0b1d31',
    canvasSoft: '#0f2640',
    canvasCream: '#2b2417',
    hairline: '#1e3651',
    hairlineInput: '#3a5a7c',

    ink: '#f6f9fc',
    inkSecondary: '#c9d6e5',
    inkMute: '#8fa3bb',
    onPrimary: '#ffffff',

    tagSoftBg: '#2e2b8c',
    tagSoftText: '#b9b9f9',

    evPosting: '#8fa3bb',
    evPostingSoft: '#14304d',
    evDoc: '#ff4d82',
    evDocSoft: '#3a1426',
    evWritten: '#8f87ff',
    evWrittenSoft: '#221d5c',
    evInterview1: '#f58ff0',
    evInterview1Soft: '#3a1838',
    evInterview2: '#d9a25c',
    evInterview2Soft: '#2b2417',
    evFinal: '#7fb2e5',
    evFinalSoft: '#0f2a47',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;
export type Palette = { readonly [K in ThemeColor]: string };

/** 굵기마다 따로 등록한 Pretendard (fontWeight 대신 family로 굵기를 고름 — Android 구버전 대비) */
export const Fonts = {
  regular: 'Pretendard-Regular',
  medium: 'Pretendard-Medium',
  semibold: 'Pretendard-SemiBold',
  bold: 'Pretendard-Bold',
} as const;

export const FONT_FILES = {
  [Fonts.regular]: require('@/assets/fonts/Pretendard-Regular.otf'),
  [Fonts.medium]: require('@/assets/fonts/Pretendard-Medium.otf'),
  [Fonts.semibold]: require('@/assets/fonts/Pretendard-SemiBold.otf'),
  [Fonts.bold]: require('@/assets/fonts/Pretendard-Bold.otf'),
};

/** 화면 옆 여백 16px (DESIGN-MOBILE.md) */
export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 12,
  four: 16,
  five: 24,
  six: 32,
} as const;

export const Radius = { sm: 6, md: 8, lg: 12, xl: 16 } as const;

/** 탭 바 아래로 내용이 가려지지 않게 두는 여백 */
export const BottomTabInset = Platform.select({ ios: 50, android: 80, web: 60 }) ?? 0;
export const MaxContentWidth = 640;
