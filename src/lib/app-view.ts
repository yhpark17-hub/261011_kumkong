/**
 * 금콩 앱(mobile/) 웹뷰 안에서 열린 화면 — 앱이 user-agent 끝에 'KumkongApp/버전'을 붙여요.
 * 그때만 <html data-app="1"> 이 붙고, 사이트 머리·하단 탭·푸터·광고를 숨겨요 (앱이 따로 그림). 브라우저로 보면 그대로예요.
 * 확인용으로 주소에 ?kk_app=1 을 붙여도 그 탭에서는 앱 화면처럼 보여요.
 */
export const APP_MODE_SCRIPT = `(function(){var d=document.documentElement,ua=/KumkongApp\\//.test(navigator.userAgent);try{var s=sessionStorage;if(ua||/[?&]kk_app=1(&|$)/.test(location.search))s.setItem("kk:app","1");if(s.getItem("kk:app"))d.setAttribute("data-app","1")}catch(e){if(ua)d.setAttribute("data-app","1")}})();`;

export function isAppView(): boolean {
  return typeof document !== "undefined" && document.documentElement.dataset.app === "1";
}

/** 앱 웹뷰가 받는 메시지 (react-native-webview) */
declare global {
  interface Window {
    ReactNativeWebView?: { postMessage: (message: string) => void };
  }
}

export type AppMessage = { type: "block"; author: string };

export function postToApp(msg: AppMessage): boolean {
  if (typeof window === "undefined" || !window.ReactNativeWebView) return false;
  window.ReactNativeWebView.postMessage(JSON.stringify(msg));
  return true;
}
