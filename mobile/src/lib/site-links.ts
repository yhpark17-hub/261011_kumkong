import type { Href } from 'expo-router';

/**
 * 사이트 주소 중 앱에 같은 화면이 있는 곳 — 웹 화면 안에서 이 링크를 누르면 앱 화면으로 열어요.
 * (콩밭·필기 후기·매거진 글처럼 앱 화면이 없는 곳은 웹 화면 안에서 그대로)
 */
const ROUTES: { re: RegExp; to: (m: RegExpMatchArray) => Href }[] = [
  { re: /^\/$/, to: () => '/' },
  { re: /^\/calendar\/?$/, to: () => '/calendar' },
  { re: /^\/companies\/?$/, to: () => '/companies' },
  { re: /^\/companies\/([\w-]+)\/?$/, to: (m) => ({ pathname: '/company/[id]', params: { id: m[1] } }) },
  {
    re: /^\/magazine\/letter\/(\d{4}-\d{2}-\d{2})\/morning\/?$/,
    to: (m) => ({ pathname: '/briefing', params: { date: m[1], edition: 'morning' } }),
  },
  { re: /^\/magazine\/?$/, to: () => '/news' },
];

/** 웹 화면에 넣어 링크를 가로챌 때 쓰는 정규식 원문 */
export const NATIVE_PATH_SOURCES = ROUTES.map((r) => r.re.source);

export function nativeRoute(pathname: string): Href | null {
  for (const r of ROUTES) {
    const m = pathname.match(r.re);
    if (m) return r.to(m);
  }
  return null;
}
