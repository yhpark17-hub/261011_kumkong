/** 금콩 웹사이트 — 앱 API·웹뷰·공유 링크의 기준 주소 */
export const SITE_URL = (process.env.EXPO_PUBLIC_SITE_URL ?? 'https://kumkong.vercel.app').replace(/\/$/, '');

export const siteUrl = (path: string) => `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
