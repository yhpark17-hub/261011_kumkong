import Constants from 'expo-constants';
import { router } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { useBlocks } from '@/hooks/blocks';
import { useTheme } from '@/hooks/use-theme';

const LINKS = [
  { label: '커뮤니티 이용 규칙', path: '/board/policy' },
  { label: '개인정보처리방침', path: '/privacy' },
  { label: '금콩 소개', path: '/about' },
] as const;

export default function SettingsScreen() {
  const c = useTheme();
  const { blocked, clear } = useBlocks();

  const confirmClear = () =>
    Alert.alert('차단을 모두 풀까요?', '가렸던 글·댓글·후기·톡이 다시 보여요.', [
      { text: '취소', style: 'cancel' },
      { text: '모두 풀기', style: 'destructive', onPress: clear },
    ]);

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
          <ThemedText type="small">커뮤니티</ThemedText>
          <ThemedView type="canvasSoft" style={styles.card}>
            <View style={styles.row}>
              <ThemedText>차단한 사용자 {blocked.length}명</ThemedText>
              {blocked.length > 0 && (
                <Pressable onPress={confirmClear} hitSlop={8}>
                  <ThemedText type="label" themeColor="ruby">
                    모두 풀기
                  </ThemedText>
                </Pressable>
              )}
            </View>
          </ThemedView>
        </View>

        <View style={styles.group}>
          <ThemedText type="small">정보</ThemedText>
          <ThemedView type="canvasSoft" style={styles.card}>
            {LINKS.map((l, i) => (
              <Pressable
                key={l.path}
                onPress={() => router.push({ pathname: '/web', params: { path: l.path, title: l.label } })}
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
