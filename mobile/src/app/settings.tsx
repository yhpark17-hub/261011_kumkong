import Constants from 'expo-constants';
import { openBrowserAsync } from 'expo-web-browser';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { siteUrl } from '@/constants/site';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const LINKS = [
  { label: '커뮤니티 이용 규칙', path: '/board/policy' },
  { label: '개인정보처리방침', path: '/privacy' },
  { label: '금콩 소개', path: '/about' },
] as const;

export default function SettingsScreen() {
  const c = useTheme();

  return (
    <ThemedView style={styles.fill}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.group}>
          <ThemedText type="small">알림</ThemedText>
          <ThemedView type="canvasSoft" style={[styles.card, styles.notice]}>
            <ThemedText type="small">관심 기관 일정 알림은 준비 중이에요.</ThemedText>
          </ThemedView>
        </View>

        <View style={styles.group}>
          <ThemedText type="small">정보</ThemedText>
          <ThemedView type="canvasSoft" style={styles.card}>
            {LINKS.map((l, i) => (
              <Pressable
                key={l.path}
                onPress={() => openBrowserAsync(siteUrl(l.path))}
                style={[styles.row, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.hairline }]}>
                <ThemedText>{l.label}</ThemedText>
                <ThemedText type="small">›</ThemedText>
              </Pressable>
            ))}
          </ThemedView>
        </View>

        <ThemedText type="caption" style={styles.version}>
          금콩 앱 {Constants.expoConfig?.version}
        </ThemedText>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { padding: Spacing.four, gap: Spacing.five },
  group: { gap: Spacing.two },
  card: { borderRadius: Radius.lg, paddingHorizontal: Spacing.four, paddingVertical: Spacing.one },
  notice: { paddingVertical: Spacing.four },
  row: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  version: { textAlign: 'center' },
});
