import { type StyleProp, type ViewStyle, View, StyleSheet } from 'react-native';

import { siteUrl } from '@/constants/site';

/**
 * 웹 미리보기용 — react-native-webview는 웹에서 안 돌아서 iframe으로 띄워요.
 * user-agent를 못 바꾸니 사이트의 확인용 표시(?kk_app=1)로 앱 화면처럼 보여요. 링크 가로채기·차단은 휴대폰에서만.
 */
export function SiteWebView({ path, style }: { path: string; style?: StyleProp<ViewStyle> }) {
  const url = siteUrl(path);
  const src = `${url}${url.includes('?') ? '&' : '?'}kk_app=1`;
  return (
    <View style={[styles.fill, style]}>
      <iframe src={src} title="금콩" style={{ border: 0, width: '100%', height: '100%' }} />
    </View>
  );
}

const styles = StyleSheet.create({ fill: { flex: 1 } });
