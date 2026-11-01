import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';

/** 아직 연결 전인 구역 자리 — 단계별로 실제 화면이 들어오면 지운다 */
export function ComingSoon({ title, desc }: { title: string; desc: string }) {
  return (
    <View style={styles.wrap}>
      <ThemedText type="section">{title}</ThemedText>
      <ThemedView type="canvasSoft" style={styles.card}>
        <Image source={require('@/assets/images/splash-icon.png')} style={styles.kong} contentFit="contain" />
        <ThemedText type="small" style={styles.desc}>
          {desc}
        </ThemedText>
      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.three },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
    borderRadius: Radius.lg,
  },
  kong: { width: 40, height: 40 },
  desc: { flex: 1 },
});
