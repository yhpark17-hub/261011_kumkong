import { useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, Switch, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Chip } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { ALERT_TYPES, useAlerts } from '@/hooks/alerts';
import { useFavorites } from '@/hooks/favorites';
import { useTheme } from '@/hooks/use-theme';

/** 설정 > 알림 — 켜기·끄기, 전날 9시·당일 8시, 일정 종류, 테스트 알림 */
export function AlertSettings() {
  const c = useTheme();
  const alerts = useAlerts();
  const { favorites } = useFavorites();
  const [busy, setBusy] = useState(false);
  const { prefs, permission } = alerts;
  const on = prefs.enabled && permission === 'granted';

  if (permission === 'unsupported') {
    return (
      <ThemedView type="canvasSoft" style={[styles.card, styles.pad]}>
        <ThemedText type="small">일정 알림은 휴대폰 앱에서 쓸 수 있어요.</ThemedText>
      </ThemedView>
    );
  }

  const toggle = async (next: boolean) => {
    if (!next) return alerts.disable();
    const p = await alerts.enable();
    if (p === 'denied') {
      Alert.alert('알림이 꺼져 있어요', '휴대폰 설정에서 금콩 알림을 허용해 주세요.', [
        { text: '닫기', style: 'cancel' },
        { text: '설정 열기', onPress: () => Linking.openSettings() },
      ]);
    }
  };

  const typeOn = (types: string[]) => types.every((t) => prefs.types.includes(t as never));
  const flipType = (types: (typeof ALERT_TYPES)[number]['types']) => {
    const next = typeOn(types) ? prefs.types.filter((t) => !types.includes(t)) : [...prefs.types, ...types];
    alerts.update({ types: next });
  };

  const test = async () => {
    setBusy(true);
    try {
      Alert.alert('테스트 알림', await alerts.sendTest());
    } catch (e) {
      Alert.alert('보내지 못했어요', e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ThemedView type="canvasSoft" style={styles.card}>
      <View style={styles.row}>
        <View style={styles.flex}>
          <ThemedText>관심 기관 일정 알림</ThemedText>
          <ThemedText type="caption">관심 기관 {favorites.size}곳 · 공고로 확인된 일정만</ThemedText>
        </View>
        <Switch value={on} onValueChange={toggle} trackColor={{ true: c.primary }} />
      </View>

      {on && (
        <>
          <Line />
          <View style={styles.row}>
            <ThemedText>전날 오전 9시</ThemedText>
            <Switch value={prefs.d1} onValueChange={(d1) => alerts.update({ d1 })} trackColor={{ true: c.primary }} />
          </View>
          <View style={styles.row}>
            <ThemedText>당일 오전 8시</ThemedText>
            <Switch value={prefs.d0} onValueChange={(d0) => alerts.update({ d0 })} trackColor={{ true: c.primary }} />
          </View>
          <Line />
          <View style={styles.types}>
            {ALERT_TYPES.map((t) => (
              <Chip key={t.label} label={t.label} active={typeOn(t.types)} onPress={() => flipType(t.types)} />
            ))}
          </View>
          <Pressable onPress={test} disabled={busy} style={styles.test} hitSlop={6}>
            <ThemedText type="label" themeColor="primaryText">
              {busy ? '보내는 중…' : '테스트 알림 보내기'}
            </ThemedText>
          </Pressable>
        </>
      )}
      {alerts.error && prefs.enabled ? (
        <ThemedText type="caption" themeColor="ruby" style={styles.error}>
          {alerts.error}
        </ThemedText>
      ) : null}
    </ThemedView>
  );
}

function Line() {
  const c = useTheme();
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: c.hairline }} />;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  card: { borderRadius: Radius.lg, paddingHorizontal: Spacing.four, paddingVertical: Spacing.one },
  pad: { paddingVertical: Spacing.four },
  row: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.three },
  types: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, paddingVertical: Spacing.three },
  test: { paddingVertical: Spacing.three },
  error: { paddingBottom: Spacing.three },
});
