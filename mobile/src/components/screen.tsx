import { type ReactNode } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  title: string;
  /** 제목 오른쪽 버튼 (설정 등) */
  right?: ReactNode;
  children?: ReactNode;
  /** 당겨서 새로고침 */
  refreshing?: boolean;
  onRefresh?: () => void;
};

/** 탭 화면 공통 틀: 큰 제목 + 16px 옆 여백 + 탭 바만큼 아래 여백 */
export function Screen({ title, right, children, refreshing = false, onRefresh }: Props) {
  const insets = useSafeAreaInsets();
  const c = useTheme();

  return (
    <ThemedView style={styles.fill}>
      <ScrollView
        refreshControl={
          onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.primary} /> : undefined
        }
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + Spacing.three, paddingBottom: insets.bottom + BottomTabInset + Spacing.five },
        ]}>
        <View style={styles.header}>
          <ThemedText type="title">{title}</ThemedText>
          {right}
        </View>
        {children}
      </ScrollView>
    </ThemedView>
  );
}

/** 불러오는 중·실패 안내 (저장해 둔 데이터도 없을 때) */
export function LoadState({ loading, error, onRetry }: { loading: boolean; error: string | null; onRetry: () => void }) {
  const c = useTheme();
  if (loading) {
    return (
      <ThemedText type="small" style={styles.state}>
        일정을 불러오는 중이에요…
      </ThemedText>
    );
  }
  return (
    <View style={styles.stateBox}>
      <ThemedText type="small" style={styles.state}>
        {error ?? '일정을 불러오지 못했어요.'}
      </ThemedText>
      <ThemedText type="label" style={{ color: c.primaryText }} onPress={onRetry} accessibilityRole="button">
        다시 시도
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.six,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  state: { textAlign: 'center', paddingVertical: Spacing.six },
  stateBox: { alignItems: 'center', gap: Spacing.two },
});
