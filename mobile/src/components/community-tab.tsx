import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CommunityGate } from '@/components/community-gate';
import { SiteWebView } from '@/components/site-web-view';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset } from '@/constants/theme';

/** 콩밭·필기 후기 탭 — 이용 규칙 동의 후 사이트 화면 (앱 모드: 사이트 머리·탭 없이) */
export function CommunityTab({ path }: { path: string }) {
  const insets = useSafeAreaInsets();
  return (
    <CommunityGate>
      <ThemedView style={[styles.fill, { paddingTop: insets.top, paddingBottom: insets.bottom + BottomTabInset }]}>
        <SiteWebView path={path} />
      </ThemedView>
    </CommunityGate>
  );
}

const styles = StyleSheet.create({ fill: { flex: 1 } });
