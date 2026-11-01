import { Stack, useLocalSearchParams } from 'expo-router';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SiteWebView } from '@/components/site-web-view';
import { ThemedView } from '@/components/themed-view';

/** 금콩 웹 화면 한 장 — 매거진 글·금콩 스터디·정책 페이지 등 (path = 사이트 경로) */
export default function WebScreen() {
  const { path, title } = useLocalSearchParams<{ path?: string; title?: string }>();
  const insets = useSafeAreaInsets();
  // 사이트 안 경로만 (바깥 주소는 브라우저로 열어요)
  const safePath = path && path.startsWith('/') && !path.startsWith('//') ? path : '/';
  return (
    <ThemedView style={[styles.fill, { paddingBottom: insets.bottom }]}>
      <Stack.Screen options={{ title: title ?? '금콩' }} />
      <SiteWebView path={safePath} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({ fill: { flex: 1 } });
