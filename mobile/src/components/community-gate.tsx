import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { type ReactNode, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const KEY = 'kumkong:community-agreed';

const RULES = [
  '욕설·비하·차별, 음란하거나 불쾌한 글, 광고·도배는 올릴 수 없어요. 이런 글에는 무관용으로 대응해요.',
  '남의 개인정보나 시험 문제 원문을 올리면 안 돼요.',
  '불편한 글은 \'신고\'로 알려 주세요. 신고가 쌓이면 바로 가려지고, 운영자가 확인해 지우거나 글쓴이를 막아요.',
  '보기 싫은 사람은 \'차단\'으로 이 기기에서 그 사람의 글·댓글을 모두 가릴 수 있어요.',
];

/** 콩밭·필기 후기를 처음 열 때 한 번 — 커뮤니티 이용 규칙 동의 (Apple 심사 1.2) */
export function CommunityGate({ children }: { children: ReactNode }) {
  const [agreed, setAgreed] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((v) => setAgreed(v === '1'))
      .catch(() => setAgreed(false));
  }, []);

  if (agreed === null) return <ThemedView style={styles.fill} />;
  if (agreed) return children;
  return (
    <Rules
      onAgree={() => {
        setAgreed(true);
        AsyncStorage.setItem(KEY, '1').catch(() => {});
      }}
    />
  );
}

function Rules({ onAgree }: { onAgree: () => void }) {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <ThemedView style={styles.fill}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.six, paddingBottom: insets.bottom + 120 }]}>
        <Image source={require('@/assets/images/splash-icon.png')} style={styles.kong} contentFit="contain" />
        <ThemedText type="title">함께 쓰는 공간이에요</ThemedText>
        <ThemedText themeColor="inkSecondary">콩밭과 필기 후기는 금공 준비생이 함께 만드는 곳이에요. 들어가기 전에 이용 규칙을 확인해 주세요.</ThemedText>
        <View style={styles.rules}>
          {RULES.map((r, i) => (
            <View key={i} style={[styles.rule, { backgroundColor: c.canvasSoft }]}>
              <ThemedText type="label" themeColor="primaryText">
                {i + 1}
              </ThemedText>
              <ThemedText style={styles.flex}>{r}</ThemedText>
            </View>
          ))}
        </View>
        <ThemedText
          type="label"
          themeColor="primaryText"
          accessibilityRole="link"
          onPress={() => router.push({ pathname: '/web', params: { path: '/board/policy', title: '커뮤니티 이용 규칙' } })}>
          전체 운영 정책 보기 ›
        </ThemedText>
        <Pressable onPress={onAgree} style={[styles.button, { backgroundColor: c.primary }]} accessibilityRole="button">
          <ThemedText type="label" themeColor="onPrimary">
            규칙에 동의하고 시작하기
          </ThemedText>
        </Pressable>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  flex: { flex: 1 },
  content: { paddingHorizontal: Spacing.four, gap: Spacing.four },
  kong: { width: 72, height: 72 },
  rules: { gap: Spacing.two },
  rule: { flexDirection: 'row', gap: Spacing.three, borderRadius: Radius.lg, padding: Spacing.four },
  button: { height: 52, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center', marginTop: Spacing.two },
});
