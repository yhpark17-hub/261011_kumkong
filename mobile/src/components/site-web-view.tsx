import Constants from 'expo-constants';
import { router, useFocusEffect } from 'expo-router';
import { openBrowserAsync } from 'expo-web-browser';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, BackHandler, Linking, Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { WebView, type WebViewMessageEvent, type WebViewNavigation } from 'react-native-webview';
import type { ShouldStartLoadRequest } from 'react-native-webview/lib/WebViewTypes';

import { SITE_URL, siteUrl } from '@/constants/site';
import { blockedCss, useBlocks } from '@/hooks/blocks';
import { useTheme } from '@/hooks/use-theme';
import { NATIVE_PATH_SOURCES, nativeRoute } from '@/lib/site-links';

/** 사이트가 이걸 보고 머리·하단 탭·광고를 숨기고 '차단' 단추를 보여 줘요 (사이트 lib/app-view.ts) */
const USER_AGENT_SUFFIX = `KumkongApp/${Constants.expoConfig?.version ?? '1'}`;
const SITE_ORIGIN = new URL(SITE_URL).origin;

/** 차단 스타일을 넣거나 바꾸는 스크립트 */
const styleScript = (css: string) =>
  `(function(){var s=document.getElementById('kk-blocked');if(!s){s=document.createElement('style');s.id='kk-blocked';(document.head||document.documentElement).appendChild(s);}s.textContent=${JSON.stringify(css)};})();true;`;

/**
 * 페이지를 그리기 전에 넣는 스크립트
 * - 앱 화면 표시(data-app)와 차단 스타일
 * - 앱에 같은 화면이 있는 링크·바깥 링크를 누르면 앱에 알려 줌 (사이트의 화면 안 이동보다 먼저 가로챔)
 */
const beforeScript = (css: string) => `(function(){
document.documentElement.setAttribute('data-app','1');
var put=function(){${styleScript(css)}};put();document.addEventListener('DOMContentLoaded',put);
var NATIVE=${JSON.stringify(NATIVE_PATH_SOURCES)}.map(function(s){return new RegExp(s)});
document.addEventListener('click',function(e){
  var a=e.target&&e.target.closest?e.target.closest('a[href]'):null;if(!a||!window.ReactNativeWebView)return;
  var u;try{u=new URL(a.getAttribute('href'),location.href)}catch(x){return}
  var msg=null;
  if(u.protocol!=='http:'&&u.protocol!=='https:')msg={type:'external',url:u.href};
  else if(u.origin!==location.origin)msg={type:'external',url:u.href};
  else if(NATIVE.some(function(r){return r.test(u.pathname)}))msg={type:'open',path:u.pathname};
  if(!msg)return;
  e.preventDefault();e.stopPropagation();
  window.ReactNativeWebView.postMessage(JSON.stringify(msg));
},true);
})();true;`;

type Message = { type: 'block'; author: string } | { type: 'open'; path: string } | { type: 'external'; url: string };

function openExternal(url: string) {
  if (/^https?:/i.test(url)) openBrowserAsync(url);
  else Linking.openURL(url).catch(() => {});
}

/** 금콩 웹 화면 (콩밭·필기 후기·매거진 글·금콩 스터디 등 앱 화면이 아직 없는 곳) */
export function SiteWebView({ path, style }: { path: string; style?: StyleProp<ViewStyle> }) {
  const c = useTheme();
  // WebView<P = undefined>의 props가 'WebViewProps & undefined'(= never)가 되는 타입 버그 → P를 object로
  const ref = useRef<WebView<object>>(null);
  const { blocked, block } = useBlocks();
  const [canGoBack, setCanGoBack] = useState(false);
  const startUrl = siteUrl(path);
  // 처음 그릴 때의 차단 목록 — 이후 바뀌면 아래 effect가 바로 넣어요 (페이지를 다시 불러오지 않게)
  const [initialCss] = useState(() => blockedCss(blocked));

  useEffect(() => {
    ref.current?.injectJavaScript(styleScript(blockedCss(blocked)));
  }, [blocked]);

  // Android 뒤로 가기: 웹 화면 안에서 먼저 뒤로
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== 'android') return;
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        if (!canGoBack) return false;
        ref.current?.goBack();
        return true;
      });
      return () => sub.remove();
    }, [canGoBack]),
  );

  const onMessage = (e: WebViewMessageEvent) => {
    let m: Message;
    try {
      m = JSON.parse(e.nativeEvent.data);
    } catch {
      return;
    }
    if (m.type === 'block') block(m.author);
    else if (m.type === 'external') openExternal(m.url);
    else if (m.type === 'open') {
      const to = nativeRoute(m.path);
      if (to) router.push(to);
    }
  };

  // 화면 전체를 새로 불러오는 이동 (링크 가로채기를 빠져나간 경우) — 바깥 주소는 브라우저로
  const onShouldStart = (req: ShouldStartLoadRequest) => {
    if (req.url === startUrl || req.url.startsWith('about:') || req.url.startsWith('data:')) return true;
    let u: URL;
    try {
      u = new URL(req.url);
    } catch {
      return false;
    }
    if (u.protocol !== 'http:' && u.protocol !== 'https:') {
      openExternal(req.url);
      return false;
    }
    if (u.origin !== SITE_ORIGIN) {
      // 페이지 안에 끼워 넣은 것(동영상 등)은 그대로, 화면 이동만 브라우저로
      if (req.isTopFrame === false) return true;
      openExternal(req.url);
      return false;
    }
    return true;
  };

  return (
    <View style={[styles.fill, { backgroundColor: c.canvas }, style]}>
      <WebView<object>
        ref={ref}
        source={{ uri: startUrl }}
        applicationNameForUserAgent={USER_AGENT_SUFFIX}
        injectedJavaScriptBeforeContentLoaded={beforeScript(initialCss)}
        injectedJavaScriptBeforeContentLoadedForMainFrameOnly
        onMessage={onMessage}
        onShouldStartLoadWithRequest={onShouldStart}
        onNavigationStateChange={(s: WebViewNavigation) => setCanGoBack(s.canGoBack)}
        // 페이지를 다 불러올 때마다 최신 차단 목록으로 (목록을 늦게 읽어 온 경우 대비)
        onLoadEnd={() => ref.current?.injectJavaScript(styleScript(blockedCss(blocked)))}
        onContentProcessDidTerminate={() => ref.current?.reload()}
        onRenderProcessGone={() => ref.current?.reload()}
        sharedCookiesEnabled
        allowsBackForwardNavigationGestures
        pullToRefreshEnabled
        setSupportMultipleWindows={false}
        startInLoadingState
        renderLoading={() => (
          <View style={[StyleSheet.absoluteFill, styles.loading, { backgroundColor: c.canvas }]}>
            <ActivityIndicator color={c.primary} />
          </View>
        )}
        style={{ backgroundColor: c.canvas }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  loading: { alignItems: 'center', justifyContent: 'center' },
});
